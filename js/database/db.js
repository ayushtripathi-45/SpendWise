
import { openDB } from "idb";

const DB_NAME = "expense-tracker-db";
const DB_VERSION = 2;

let dbPromise;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains("expenses")) {
          const store = db.createObjectStore("expenses", {
            keyPath: "id"
          });

          store.createIndex("date", "date");
          store.createIndex("location", "location");
          store.createIndex("category", "category");
          store.createIndex("createdAt", "createdAt");
        }

        if (!db.objectStoreNames.contains("budgets")) {
          const budgetStore = db.createObjectStore("budgets", {
            keyPath: "month"
          });
          budgetStore.createIndex("updatedAt", "updatedAt");
        }
      }
    });
  }

  return dbPromise;
}

export async function getAllExpenses() {
  const db = await getDB();
  return db.getAll("expenses");
}

export async function getExpense(id) {
  const db = await getDB();
  return db.get("expenses", id);
}

export async function addExpense(expense) {
  const db = await getDB();
  return db.add("expenses", expense);
}

export async function updateExpense(expense) {
  const db = await getDB();
  return db.put("expenses", expense);
}

export async function deleteExpense(id) {
  const db = await getDB();
  return db.delete("expenses", id);
}

export async function clearExpenses() {
  const db = await getDB();
  return db.clear("expenses");
}

export async function mergeExpenses(records) {
  const db = await getDB();
  const tx = db.transaction("expenses", "readwrite");
  const store = tx.objectStore("expenses");

  let added = 0;
  let skipped = 0;

  for (const record of records) {
    const existing = await store.get(record.id);

    if (existing) {
      skipped++;
      continue;
    }

    await store.add(record);
    added++;
  }

  await tx.done;

  return { added, skipped };
}

export async function replaceAllExpenses(records) {
  const db = await getDB();
  const tx = db.transaction("expenses", "readwrite");
  const store = tx.objectStore("expenses");

  await store.clear();

  for (const record of records) {
    await store.put(record);
  }

  await tx.done;

  return { added: records.length, skipped: 0 };
}

/* ================= Budget Database Operations ================= */

export async function getBudget(month) {
  const db = await getDB();
  return db.get("budgets", month);
}

export async function getAllBudgets() {
  const db = await getDB();
  return db.getAll("budgets");
}

export async function setBudget(budgetRecord) {
  const db = await getDB();
  return db.put("budgets", budgetRecord);
}

export async function removeBudget(month) {
  const db = await getDB();
  return db.delete("budgets", month);
}

export async function clearBudgets() {
  const db = await getDB();
  return db.clear("budgets");
}
