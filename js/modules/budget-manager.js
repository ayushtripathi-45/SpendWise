
import {
  getBudget,
  getAllBudgets,
  setBudget,
  removeBudget
} from "../database/db.js";
import { getCurrentMonth } from "./analytics.js";
import {
  fetchMonthlyIncomingMoney,
  fetchAllIncomingMoney
} from "./incoming-money.js";

/**
 * Validates budget inputs.
 * @param {number|string} amount
 * @param {string} month YYYY-MM
 */
export function validateBudget(amount, month) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Enter a valid budget amount greater than 0.");
  }

  if (numericAmount > 100000000) {
    throw new Error("Budget amount is too high.");
  }

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    throw new Error("Invalid budget month. Expected YYYY-MM.");
  }

  return {
    amount: Math.round(numericAmount * 100) / 100,
    month
  };
}

/**
 * Save or update monthly budget.
 * @param {string} month YYYY-MM
 * @param {number|string} amount
 * @param {string} [notes] optional description
 */
export async function saveBudget(month, amount, notes = "") {
  const validated = validateBudget(amount, month);
  const existing = await getBudget(month);
  const now = new Date().toISOString();

  const record = {
    month: validated.month,
    amount: validated.amount,
    notes: String(notes || "").trim().slice(0, 200),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };

  await setBudget(record);
  return record;
}

/**
 * Delete a budget for a given month.
 * @param {string} month YYYY-MM
 */
export async function deleteBudget(month) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    throw new Error("Invalid month format.");
  }
  await removeBudget(month);
}

/**
 * Fetch budget for a specific month.
 * @param {string} month YYYY-MM
 */
export async function fetchBudget(month = getCurrentMonth()) {
  return (await getBudget(month)) || null;
}

/**
 * Fetch all stored budgets sorted newest month first.
 */
export async function fetchAllBudgets() {
  const budgets = await getAllBudgets();
  return budgets.sort((a, b) => b.month.localeCompare(a.month));
}

/**
 * Calculate budget status for a given month considering expenses and incoming money.
 * If user set budget = 5000, spent = 2000, incoming = 500
 * Remaining = 5000 - 2000 + 500 = 3500!
 * @param {Array} expenses
 * @param {string} month YYYY-MM
 */
export async function getMonthlyBudgetStatus(expenses, month = getCurrentMonth()) {
  const budget = await fetchBudget(month);
  const monthExpenses = (expenses || []).filter(e => e.date && e.date.startsWith(month));
  const spent = monthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const incomingItems = await fetchMonthlyIncomingMoney(month);
  const incomingTotal = incomingItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const budgetAmount = budget ? Number(budget.amount || 0) : 0;
  // If budget is set, Remaining = Budget - Spent + Incoming
  // If budget not set, Remaining = null (or Incoming - Spent)
  const remaining = budget ? (budgetAmount - spent + incomingTotal) : (incomingTotal > 0 ? (incomingTotal - spent) : null);
  const isOverBudget = remaining !== null && remaining < 0;

  // Percentage spent of (budget + incoming) or budget
  const effectiveBudget = budgetAmount > 0 ? (budgetAmount + incomingTotal) : incomingTotal;
  const percentage = effectiveBudget > 0 ? Math.min(Math.round((spent / effectiveBudget) * 100), 999) : 0;

  return {
    month,
    hasBudget: Boolean(budget),
    budget: budgetAmount,
    spent,
    incomingTotal,
    incomingItems,
    remaining,
    isOverBudget,
    percentage,
    notes: budget?.notes || "",
    updatedAt: budget?.updatedAt || null
  };
}

/**
 * Calculate budget overview for all recorded months (from budgets, expenses, and incoming money).
 * @param {Array} expenses
 */
export async function getAllMonthsBudgetOverview(expenses) {
  const budgets = await fetchAllBudgets();
  const allIncoming = await fetchAllIncomingMoney();
  const budgetMap = new Map(budgets.map(b => [b.month, b]));

  // Find all distinct months from expenses + budgets + incoming
  const monthsSet = new Set(budgets.map(b => b.month));
  (expenses || []).forEach(e => {
    if (e.date && e.date.length >= 7) {
      monthsSet.add(e.date.slice(0, 7));
    }
  });
  allIncoming.forEach(item => {
    if (item.date && item.date.length >= 7) {
      monthsSet.add(item.date.slice(0, 7));
    }
  });

  // Always include current month
  monthsSet.add(getCurrentMonth());

  const sortedMonths = Array.from(monthsSet).sort((a, b) => b.localeCompare(a));

  return sortedMonths.map(month => {
    const budgetRecord = budgetMap.get(month);
    const monthExpenses = (expenses || []).filter(e => e.date && e.date.startsWith(month));
    const spent = monthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const monthIncoming = allIncoming.filter(item => item.date && item.date.startsWith(month));
    const incomingTotal = monthIncoming.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const budgetAmount = budgetRecord ? Number(budgetRecord.amount || 0) : 0;
    const remaining = budgetRecord
      ? (budgetAmount - spent + incomingTotal)
      : (incomingTotal > 0 ? (incomingTotal - spent) : null);

    const effectiveBudget = budgetAmount > 0 ? (budgetAmount + incomingTotal) : incomingTotal;
    const percentage = effectiveBudget > 0 ? Math.round((spent / effectiveBudget) * 100) : 0;

    return {
      month,
      hasBudget: Boolean(budgetRecord),
      budget: budgetAmount,
      spent,
      incomingTotal,
      incomingCount: monthIncoming.length,
      remaining,
      isOverBudget: remaining !== null && remaining < 0,
      percentage,
      notes: budgetRecord?.notes || "",
      expenseCount: monthExpenses.length
    };
  });
}
