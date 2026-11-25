
import {
  getAllCashTransactions,
  addCashTransaction,
  updateCashTransaction,
  deleteCashTransaction
} from "../database/db.js";
import { getLocalDateString } from "../utils/date-utils.js";

/**
 * Validates cash flow item.
 * type: 'cash-in' (initial cash, ATM withdrawal, pocket money) or 'cash-out' (cash expense)
 */
export function validateCashTransaction(data) {
  const amount = Number(data.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter a valid amount greater than 0.");
  }

  if (amount > 10000000) {
    throw new Error("Amount is too large.");
  }

  const type = data.type === "cash-in" ? "cash-in" : "cash-out";
  const reason = String(data.reason || "").trim();

  if (!reason) {
    throw new Error(
      type === "cash-out"
        ? "Please enter where or why the cash was spent."
        : "Please enter the source of cash (e.g., ATM, Pocket Money, Salary)."
    );
  }

  const date = String(data.date || getLocalDateString());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Select a valid calendar date (YYYY-MM-DD).");
  }

  return {
    type,
    amount: Math.round(amount * 100) / 100,
    reason: reason.slice(0, 200),
    date
  };
}

/**
 * Adds a new cash record.
 */
export async function createCashTransaction(data) {
  const validated = validateCashTransaction(data);
  const now = new Date().toISOString();

  const record = {
    id: crypto.randomUUID(),
    ...validated,
    createdAt: now,
    updatedAt: now
  };

  await addCashTransaction(record);
  return record;
}

/**
 * Updates an existing cash record.
 */
export async function editCashTransaction(id, data) {
  const validated = validateCashTransaction(data);
  const now = new Date().toISOString();

  const record = {
    id,
    ...validated,
    updatedAt: now
  };

  await updateCashTransaction(record);
  return record;
}

/**
 * Removes a cash transaction.
 */
export async function removeCashTransaction(id) {
  await deleteCashTransaction(id);
}

/**
 * Fetches all cash transactions sorted newest first.
 */
export async function fetchAllCashTransactions() {
  const items = await getAllCashTransactions();
  return (items || []).sort((a, b) => {
    const dComp = (b.date || "").localeCompare(a.date || "");
    if (dComp !== 0) return dComp;
    return (b.createdAt || "").localeCompare(a.createdAt || "");
  });
}

/**
 * Calculates cash summary:
 * - totalCashIn: Total cash added/withdrawn
 * - totalCashOut: Total cash spent
 * - remainingCash: Total Cash In - Total Cash Out
 */
export async function getCashSummary() {
  const items = await fetchAllCashTransactions();
  let totalCashIn = 0;
  let totalCashOut = 0;

  for (const item of items) {
    const amt = Number(item.amount || 0);
    if (item.type === "cash-in") {
      totalCashIn += amt;
    } else {
      totalCashOut += amt;
    }
  }

  const remainingCash = totalCashIn - totalCashOut;

  return {
    totalCashIn,
    totalCashOut,
    remainingCash,
    transactionsCount: items.length,
    recentTransactions: items.slice(0, 10)
  };
}
