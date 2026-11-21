
import {
  fetchExpenses
} from "./expense-manager.js";

import {
  mergeExpenses,
  replaceAllExpenses
} from "../database/db.js";

const CATEGORIES = ["food", "study", "travel", "other"];
const LOCATIONS = ["tuck-shop", "outside-college"];

const BACKUP_VERSION = 1;

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function escapeCSV(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function toCSV(expenses) {
  const headers = [
    "id",
    "amount",
    "location",
    "category",
    "note",
    "date",
    "createdAt",
    "updatedAt"
  ];

  const rows = expenses.map(expense =>
    headers.map(header => escapeCSV(expense[header])).join(",")
  );

  return [
    headers.join(","),
    ...rows
  ].join("\r\n");
}

function parseCSV(text) {
  const input = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const next = input[i + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        value += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") i++;

      row.push(value);
      if (row.some(cell => cell.trim() !== "")) {
        rows.push(row);
      }

      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (insideQuotes) {
    throw new Error("CSV contains an unfinished quoted field.");
  }

  if (value.length || row.length) {
    row.push(value);
    rows.push(row);
  }

  if (rows.length < 2) {
    throw new Error("The CSV file has no expense records.");
  }

  const headers = rows[0].map(header =>
    header.trim().toLowerCase()
  );

  const requiredHeaders = [
    "id",
    "amount",
    "location",
    "category",
    "date"
  ];

  for (const header of requiredHeaders) {
    if (!headers.includes(header)) {
      throw new Error(`CSV is missing the "${header}" column.`);
    }
  }

  return rows.slice(1).map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error(`Invalid CSV row at line ${index + 2}.`);
    }

    return Object.fromEntries(
      headers.map((header, columnIndex) => [
        header,
        values[columnIndex]
      ])
    );
  });
}
function isValidDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);

  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

function validateAndNormalize(records) {
  if (!Array.isArray(records)) {
    throw new Error("The backup does not contain a valid expenses list.");
  }

  if (records.length === 0) {
    throw new Error("No expenses were found in this file.");
  }

  const seenIds = new Set();

  return records.map((record, index) => {
    const row = index + 1;
    const amount = Number(record.amount);

    if (!record.id || typeof record.id !== "string") {
      throw new Error(`Record ${row}: missing or invalid ID.`);
    }

    if (seenIds.has(record.id)) {
      throw new Error(`Record ${row}: duplicate ID in imported file.`);
    }

    seenIds.add(record.id);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(`Record ${row}: amount must be greater than zero.`);
    }

    if (!LOCATIONS.includes(record.location)) {
      throw new Error(`Record ${row}: invalid location.`);
    }

    if (!CATEGORIES.includes(record.category)) {
      throw new Error(`Record ${row}: invalid category.`);
    }

    if (!isValidDate(String(record.date))) {
      throw new Error(`Record ${row}: invalid date.`);
    }

    return {
      id: record.id,
      amount,
      location: record.location,
      category: record.category,
      note: String(record.note ?? ""),
      date: String(record.date),
      createdAt: record.createdAt || new Date().toISOString(),
      ...(record.updatedAt
        ? { updatedAt: record.updatedAt }
        : {})
    };
  });
}

export async function exportJSON() {
  const expenses = await fetchExpenses();

  const backup = {
    app: "College Expense Tracker",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    totalExpenses: expenses.length,
    expenses
  };

  downloadFile(
    JSON.stringify(backup, null, 2),
    `expense-backup-${getTimestamp()}.json`,
    "application/json;charset=utf-8"
  );

  return expenses.length;
}

export async function exportCSV() {
  const expenses = await fetchExpenses();
  const csv = "\uFEFF" + toCSV(expenses);

  downloadFile(
    csv,
    `expense-export-${getTimestamp()}.csv`,
    "text/csv;charset=utf-8"
  );

  return expenses.length;
}

export async function importBackupFile(file, mode = "merge") {
  if (!file) {
    throw new Error("Please select a backup file.");
  }

  const text = await file.text();
  const extension = file.name.split(".").pop().toLowerCase();

  let records;

  if (extension === "json") {
    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("The selected JSON file is not valid JSON.");
    }

    records = Array.isArray(parsed) ? parsed : parsed.expenses;
  } else if (extension === "csv") {
    records = parseCSV(text);
  } else {
    throw new Error("Choose a JSON or CSV file.");
  }

  const validRecords = validateAndNormalize(records);

  if (mode === "replace") {
    return replaceAllExpenses(validRecords);
  }

  return mergeExpenses(validRecords);
}
