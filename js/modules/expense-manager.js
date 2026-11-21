
import {
  getAllExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getExpense
} from "../database/db.js";

const LOCATIONS = ["tuck-shop", "outside-college"];

const CATEGORIES = ["food", "study", "travel", "other"];

function validateExpense(data) {
  const amount = Number(data.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter a valid expense amount.");
  }

  if (amount > 10000000) {
    throw new Error("Expense amount is too large.");
  }

  if (!LOCATIONS.includes(data.location)) {
    throw new Error("Select a valid location.");
  }

  if (!CATEGORIES.includes(data.category)) {
    throw new Error("Select a valid category.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    throw new Error("Select a valid date.");
  }

  
  const [year, month, day] = data.date.split("-").map(Number);
  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    throw new Error("Select a valid calendar date.");
  }


  return {
    amount: Math.round(amount * 100) / 100,
    location: data.location,
    category: data.category,
    note: String(data.note || "").trim().slice(0, 200),
    date: data.date
  };
}

export async function createExpense(data) {
  const validated = validateExpense(data);
  const now = new Date().toISOString();

  const expense = {
    id: crypto.randomUUID(),
    ...validated,
    createdAt: now,
    updatedAt: now
  };

  await addExpense(expense);

  return expense;
}

export async function editExpense(id, data) {
  const existing = await getExpense(id);

  if (!existing) {
    throw new Error("Expense not found.");
  }

  const validated = validateExpense(data);

  const updated = {
    ...existing,
    ...validated,
    updatedAt: new Date().toISOString()
  };

  await updateExpense(updated);

  return updated;
}

export async function removeExpense(id) {
  const existing = await getExpense(id);

  if (!existing) {
    throw new Error("Expense not found.");
  }

  await deleteExpense(id);
}

export async function fetchExpenses() {
  const expenses = await getAllExpenses();

  return expenses.sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);

    if (dateCompare !== 0) return dateCompare;

    return b.createdAt.localeCompare(a.createdAt);
  });
}

export async function fetchExpense(id) {
  return getExpense(id);
}
