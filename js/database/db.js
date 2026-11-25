
import { openDB } from "idb";

const DB_NAME = "expense-tracker-db";
const DB_VERSION = 4;

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

        if (!db.objectStoreNames.contains("incoming_money")) {
          const incomingStore = db.createObjectStore("incoming_money", {
            keyPath: "id"
          });
          incomingStore.createIndex("date", "date");
          incomingStore.createIndex("createdAt", "createdAt");
        }

        // Cash flow entries: either cash-in (deposit/wallet top-up) or cash-out (expense)
        if (!db.objectStoreNames.contains("cash_transactions")) {
          const cashStore = db.createObjectStore("cash_transactions", {
            keyPath: "id"
          });
          cashStore.createIndex("date", "date");
          cashStore.createIndex("type", "type");
          cashStore.createIndex("createdAt", "createdAt");
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

/* ================= Incoming Money Database Operations ================= */

export async function getAllIncomingMoney() {
  const db = await getDB();
  return db.getAll("incoming_money");
}

export async function getIncomingMoneyItem(id) {
  const db = await getDB();
  return db.get("incoming_money", id);
}

export async function addIncomingMoney(item) {
  const db = await getDB();
  return db.add("incoming_money", item);
}

export async function updateIncomingMoney(item) {
  const db = await getDB();
  return db.put("incoming_money", item);
}

export async function deleteIncomingMoney(id) {
  const db = await getDB();
  return db.delete("incoming_money", id);
}

export async function clearIncomingMoney() {
  const db = await getDB();
  return db.clear("incoming_money");
}

/* ================= Cash Transactions Operations ================= */

export async function getAllCashTransactions() {
  const db = await getDB();
  return db.getAll("cash_transactions");
}

export async function getCashTransaction(id) {
  const db = await getDB();
  return db.get("cash_transactions", id);
}

export async function addCashTransaction(item) {
  const db = await getDB();
  return db.add("cash_transactions", item);
}

export async function updateCashTransaction(item) {
  const db = await getDB();
  return db.put("cash_transactions", item);
}

export async function deleteCashTransaction(id) {
  const db = await getDB();
  return db.delete("cash_transactions", id);
}

export async function clearCashTransactions() {
  const db = await getDB();
  return db.clear("cash_transactions");
}
