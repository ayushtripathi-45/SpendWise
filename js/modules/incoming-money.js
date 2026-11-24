
import {
  getAllIncomingMoney,
  addIncomingMoney,
  updateIncomingMoney,
  deleteIncomingMoney
} from "../database/db.js";
import { getCurrentMonth } from "./analytics.js";
import { getLocalDateString } from "../utils/date-utils.js";

/**
 * Validates incoming money entry.
 */
export function validateIncomingMoney(data) {
  const amount = Number(data.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter a valid incoming amount greater than 0.");
  }

  if (amount > 100000000) {
    throw new Error("Amount is too large.");
  }

  const fromPerson = String(data.fromPerson || "").trim();
  if (!fromPerson) {
    throw new Error("Please specify who sent or returned the money (From Person).");
  }

  const reason = String(data.reason || "").trim();
  if (!reason) {
    throw new Error("Please specify a reason or note (e.g. Return of lunch loan, Freelance, Gift).");
  }

  const date = String(data.date || getLocalDateString());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Select a valid date (YYYY-MM-DD).");
  }

  return {
    amount: Math.round(amount * 100) / 100,
    fromPerson: fromPerson.slice(0, 100),
    reason: reason.slice(0, 200),
    date
  };
}

/**
 * Creates new incoming money record.
 */
export async function createIncomingMoney(data) {
  const validated = validateIncomingMoney(data);
  const now = new Date().toISOString();

  const record = {
    id: crypto.randomUUID(),
    ...validated,
    createdAt: now,
    updatedAt: now
  };

  await addIncomingMoney(record);
  return record;
}

/**
 * Edits existing incoming money record.
 */
export async function editIncomingMoney(id, data) {
  const validated = validateIncomingMoney(data);
  const now = new Date().toISOString();

  const record = {
    id,
    ...validated,
    updatedAt: now
  };

  await updateIncomingMoney(record);
  return record;
}

/**
 * Removes an incoming money record.
 */
export async function removeIncomingMoney(id) {
  await deleteIncomingMoney(id);
}

/**
 * Fetches all incoming money entries sorted latest date/createdAt first.
 */
export async function fetchAllIncomingMoney() {
  const items = await getAllIncomingMoney();
  return (items || []).sort((a, b) => {
    const dComp = (b.date || "").localeCompare(a.date || "");
    if (dComp !== 0) return dComp;
    return (b.createdAt || "").localeCompare(a.createdAt || "");
  });
}

/**
 * Fetches incoming money for a given month (YYYY-MM).
 */
export async function fetchMonthlyIncomingMoney(month = getCurrentMonth()) {
  const all = await fetchAllIncomingMoney();
  return all.filter(item => item.date && item.date.startsWith(month));
}

/**
 * Calculates total incoming money for a given month.
 */
export async function getMonthlyIncomingTotal(month = getCurrentMonth()) {
  const items = await fetchMonthlyIncomingMoney(month);
  return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
}
