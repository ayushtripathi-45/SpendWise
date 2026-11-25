
import {
  renderBackupPage,
  initBackupPage
} from "./pages/backup.js";
import {
  calculateAnalytics,
  getCurrentMonth
} from "./modules/analytics.js";

import { renderAnalyticsPage } from "./pages/analytics.js";

import { renderAllCharts } from "./components/charts.js";
import {
  renderSidebar,
  renderMobileNav
} from "./components/sidebar.js";

import {
  renderNavbar,
  initNavbar
} from "./components/navbar.js";

import {
  renderExpenseModal,
  initExpenseModal
} from "./components/expense-modal.js";

import {
  renderBudgetModal,
  initBudgetModal
} from "./components/budget-modal.js";

import {
  renderIncomingMoneyModal,
  initIncomingMoneyModal
} from "./components/incoming-modal.js";

import {
  renderCashModal,
  initCashModal
} from "./components/cash-modal.js";

import {
  createExpense,
  editExpense,
  removeExpense,
  fetchExpense,
  fetchExpenses
} from "./modules/expense-manager.js";

import {
  saveBudget,
  deleteBudget,
  fetchBudget,
  getMonthlyBudgetStatus
} from "./modules/budget-manager.js";

import {
  createIncomingMoney,
  editIncomingMoney,
  removeIncomingMoney,
  fetchMonthlyIncomingMoney
} from "./modules/incoming-money.js";

import {
  createCashTransaction,
  editCashTransaction,
  removeCashTransaction,
  getCashSummary,
  fetchAllCashTransactions
} from "./modules/cash-manager.js";

import { renderBudgetsPage, initBudgetsPage } from "./pages/budgets.js";
import { renderCashPage, initCashPage } from "./pages/cash.js";
import { renderTransactions } from "./pages/transactions.js";

import { formatCurrency } from "./utils/currency.js";

import { renderDashboardPage, initDashboardCharts } from "./pages/dashboard.js";
import { renderSettingsPage, initSettingsPage } from "./pages/settings.js";

const pages = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Overview of your online expenses, budgets, and cash in hand."
  },
  transactions: {
    title: "Transactions",
    subtitle: "Manage all your online expense records."
  },
  cash: {
    title: "Cash Money",
    subtitle: "Manage your physical in-hand cash, cash expenses, and remaining balance."
  },
  analytics: {
    title: "Analytics",
    subtitle: "Understand your spending patterns."
  },
  budgets: {
    title: "Budgets",
    subtitle: "Manage monthly limits, incoming returned money, and live balance."
  },
  backup: {
    title: "Backup & Restore",
    subtitle: "Export, import, and protect your expense data."
  },
  categories: {
    title: "Categories",
    subtitle: "Organize your spending categories."
  },
  settings: {
    title: "Settings",
    subtitle: "Customize your expense tracker."
  }
};

let activePage = "dashboard";
let selectedAnalyticsMonth = getCurrentMonth();
let selectedBudgetMonth = getCurrentMonth();

let modalOpen = false;
let modalExpense = null;
let modalMode = "quick";

let budgetModalOpen = false;
let budgetModalData = null;
let budgetModalSelectedMonth = getCurrentMonth();

let incomingModalOpen = false;
let incomingModalData = null;
let incomingModalDefaultDate = "";

let cashModalOpen = false;
let cashModalData = null;
let cashModalDefaultType = "cash-out";

function showToast(message) {
  let toast = document.querySelector(".app-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.className = "app-toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("visible");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("visible");
  }, 2500);
}

async function renderDashboard() {
  const expenses = await fetchExpenses();
  const analytics = calculateAnalytics(expenses, getCurrentMonth());
  const budgetStatus = await getMonthlyBudgetStatus(expenses, getCurrentMonth());
  const cashSummary = await getCashSummary();
  return renderDashboardPage(analytics, expenses, budgetStatus, cashSummary);
}

async function renderPageContent() {
  if (activePage === "dashboard") {
    return renderDashboard();
  }

  if (activePage === "transactions") {
    return await renderTransactions();
  }

  if (activePage === "cash") {
    return await renderCashPage();
  }

  if (activePage === "analytics") {
    const expenses = await fetchExpenses();
    const analytics = calculateAnalytics(
      expenses,
      selectedAnalyticsMonth
    );
    return renderAnalyticsPage(analytics);
  }

  if (activePage === "budgets") {
    const expenses = await fetchExpenses();
    return await renderBudgetsPage(expenses, selectedBudgetMonth);
  }

  if (activePage === "backup") {
    return renderBackupPage();
  }

  if (activePage === "settings") {
    return renderSettingsPage();
  }

  return `
    <section class="dashboard-section">
      <div class="dashboard-placeholder">
        ${pages[activePage].title} will be implemented in a later phase.
      </div>
    </section>
  `;
}

async function updateDashboard() {
  const expenses = await fetchExpenses();
  const currentMonth = getCurrentMonth();
  const analytics = calculateAnalytics(expenses, currentMonth);
  const budgetStatus = await getMonthlyBudgetStatus(expenses, currentMonth);
  const cashSummary = await getCashSummary();

  const el = (id) => document.querySelector(id);

  if (el("#overall-spending")) el("#overall-spending").textContent = formatCurrency(analytics.overallSpending);
  if (el("#monthly-spending")) el("#monthly-spending").textContent = formatCurrency(analytics.monthlySpending);
  if (el("#today-spending")) el("#today-spending").textContent = formatCurrency(analytics.todaySpending);
  if (el("#daily-average")) el("#daily-average").textContent = formatCurrency(analytics.calendarDailyAverage);
  if (el("#active-day-avg")) el("#active-day-avg").textContent = formatCurrency(analytics.activeDayAverage);
  if (el("#transaction-count")) el("#transaction-count").textContent = analytics.allTimeTransactionCount;

  if (el("#dash-stat-budget")) {
    el("#dash-stat-budget").textContent = budgetStatus.hasBudget ? formatCurrency(budgetStatus.budget) : "Not Set";
  }

  if (el("#dash-stat-incoming")) {
    el("#dash-stat-incoming").textContent = `+${formatCurrency(budgetStatus.incomingTotal || 0)}`;
  }

  if (el("#dash-stat-remaining")) {
    const remEl = el("#dash-stat-remaining");
    const descEl = el("#dash-stat-remaining-desc");
    if (budgetStatus.remaining === null) {
      remEl.textContent = "—";
      remEl.className = "stat-value";
      if (descEl) descEl.textContent = "Set a budget or add incoming to track balance";
    } else if (budgetStatus.isOverBudget) {
      remEl.textContent = `- ${formatCurrency(Math.abs(budgetStatus.remaining))}`;
      remEl.className = "stat-value amount-danger";
      if (descEl) {
        descEl.textContent = `Over limit by ${formatCurrency(Math.abs(budgetStatus.remaining))}`;
        descEl.className = "stat-description text-danger";
      }
    } else {
      remEl.textContent = formatCurrency(budgetStatus.remaining);
      remEl.className = "stat-value amount-safe";
      if (descEl) {
        descEl.textContent = `${formatCurrency(budgetStatus.remaining)} safe to spend`;
        descEl.className = "stat-description";
      }
    }
  }

  if (el("#dash-stat-cash-remaining")) {
    const rem = cashSummary.remainingCash;
    el("#dash-stat-cash-remaining").textContent = rem < 0 ? `- ${formatCurrency(Math.abs(rem))}` : formatCurrency(rem);
    el("#dash-stat-cash-remaining").className = rem < 0 ? "stat-value amount-danger" : "stat-value amount-safe";
  }

  initDashboardCharts(analytics);
}

function openExpenseModal(mode = "quick", expense = null) {
  modalOpen = true;
  modalMode = mode;
  modalExpense = expense;
  renderApp();
}

function closeExpenseModal() {
  modalOpen = false;
  modalExpense = null;
  renderApp();
}

function openBudgetModal(month = getCurrentMonth(), budgetData = null) {
  budgetModalOpen = true;
  budgetModalSelectedMonth = month;
  budgetModalData = budgetData;
  renderApp();
}

function closeBudgetModal() {
  budgetModalOpen = false;
  budgetModalData = null;
  renderApp();
}

function openIncomingModal(defaultDate = "", incomingData = null) {
  incomingModalOpen = true;
  incomingModalDefaultDate = defaultDate;
  incomingModalData = incomingData;
  renderApp();
}

function closeIncomingModal() {
  incomingModalOpen = false;
  incomingModalData = null;
  renderApp();
}

function openCashModal(cashData = null, defaultType = "cash-out") {
  cashModalOpen = true;
  cashModalData = cashData;
  cashModalDefaultType = defaultType;
  renderApp();
}

function closeCashModal() {
  cashModalOpen = false;
  cashModalData = null;
  renderApp();
}

async function handleExpenseSave(id, data) {
  if (id) {
    await editExpense(id, data);
    showToast("Expense updated successfully");
  } else {
    await createExpense(data);
    showToast("Expense saved successfully");
  }

  modalOpen = false;
  modalExpense = null;
  await renderApp();
}

async function handleBudgetSave({ month, amount, notes }) {
  await saveBudget(month, amount, notes);
  showToast(`Budget for ${month} saved successfully.`);
  budgetModalOpen = false;
  budgetModalData = null;
  await renderApp();
}

async function handleIncomingSave(id, data) {
  if (id) {
    await editIncomingMoney(id, data);
    showToast("Incoming money record updated.");
  } else {
    await createIncomingMoney(data);
    showToast(`₹${data.amount} received from ${data.fromPerson} added to remaining budget!`);
  }

  incomingModalOpen = false;
  incomingModalData = null;
  await renderApp();
}

async function handleCashSave(id, data) {
  if (id) {
    await editCashTransaction(id, data);
    showToast("Cash transaction updated.");
  } else {
    await createCashTransaction(data);
    if (data.type === "cash-in") {
      showToast(`₹${data.amount} cash added to in-hand wallet.`);
    } else {
      showToast(`₹${data.amount} cash expense recorded.`);
    }
  }

  cashModalOpen = false;
  cashModalData = null;
  await renderApp();
}

function initNavigation() {
  document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      const page = button.dataset.page;
      if (pages[page]) {
        activePage = page;
        renderApp();
      }
    });
  });

  document.querySelectorAll("[data-add-expense]").forEach(button => {
    button.addEventListener("click", () => {
      openExpenseModal(button.dataset.addExpense);
    });
  });

  document.querySelectorAll('[data-action="set-budget"]').forEach(button => {
    button.addEventListener("click", async () => {
      const currentMonth = getCurrentMonth();
      const existing = await fetchBudget(currentMonth);
      openBudgetModal(currentMonth, existing);
    });
  });

  document.querySelectorAll('[data-action="add-incoming"]').forEach(button => {
    button.addEventListener("click", () => {
      openIncomingModal();
    });
  });

  document.querySelectorAll('[data-action="add-cash"]').forEach(button => {
    button.addEventListener("click", () => {
      openCashModal(null, "cash-in");
    });
  });

  document.querySelectorAll('[data-action="add-cash-in"]').forEach(button => {
    button.addEventListener("click", () => {
      openCashModal(null, "cash-in");
    });
  });

  document.querySelectorAll('[data-action="add-cash-out"]').forEach(button => {
    button.addEventListener("click", () => {
      openCashModal(null, "cash-out");
    });
  });

  document.querySelectorAll("[data-edit-expense]").forEach(button => {
    button.addEventListener("click", async () => {
      const expense = await fetchExpense(button.dataset.editExpense);
      if (expense) {
        openExpenseModal("detailed", expense);
      }
    });
  });

  document.querySelectorAll("[data-delete-expense]").forEach(button => {
    button.addEventListener("click", async () => {
      const confirmed = window.confirm(
        "Are you sure you want to delete this expense?"
      );
      if (!confirmed) return;

      try {
        await removeExpense(button.dataset.deleteExpense);
        showToast("Expense deleted successfully");
        await renderApp();
      } catch (error) {
        showToast(error.message || "Unable to delete expense");
      }
    });
  });
}

async function initAnalyticsPage() {
  const expenses = await fetchExpenses();
  const analytics = calculateAnalytics(
    expenses,
    selectedAnalyticsMonth
  );

  renderAllCharts(analytics);

  const monthInput = document.querySelector("#analytics-month");
  monthInput?.addEventListener("change", async event => {
    const value = event.target.value;
    if (!/^\d{4}-\d{2}$/.test(value)) return;
    selectedAnalyticsMonth = value;
    await renderApp();
  });
}

async function renderApp() {
  const page = pages[activePage];
  const content = await renderPageContent();

  document.querySelector("#app").innerHTML = `
    <div class="app-layout">

      ${renderSidebar(activePage)}

      <main class="main-content">

        ${renderNavbar()}

        <header class="page-header">
          <div>
            <h1>${page.title}</h1>
            <p>${page.subtitle}</p>
          </div>

          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="small-action" data-action="add-cash-out" style="font-weight: 700; padding: 10px 14px; color: #EF4444; border-color: rgba(239, 68, 68, 0.4);">
              💸 Spend Cash
            </button>
            <button class="small-action" data-action="add-cash-in" style="font-weight: 700; padding: 10px 14px; color: #10B981; border-color: rgba(16, 185, 129, 0.4);">
              💵 Add Cash
            </button>
            <button class="primary-button" data-add-expense="quick">
              + Online Expense
            </button>
          </div>
        </header>

        <div id="page-content">
          ${content}
        </div>

      </main>

      ${renderMobileNav(activePage)}

    </div>

    ${modalOpen ? renderExpenseModal(modalExpense, modalMode) : ""}
    ${budgetModalOpen ? renderBudgetModal(budgetModalData, budgetModalSelectedMonth) : ""}
    ${incomingModalOpen ? renderIncomingMoneyModal(incomingModalData, incomingModalDefaultDate) : ""}
    ${cashModalOpen ? renderCashModal(cashModalData, cashModalDefaultType) : ""}
  `;

  initNavbar();
  initNavigation();

  if (activePage === "backup") {
    initBackupPage(showToast);
  }

  if (activePage === "settings") {
    initSettingsPage({ showToast, renderApp });
  }

  if (activePage === "budgets") {
    initBudgetsPage({
      onMonthChange: async (newMonth) => {
        selectedBudgetMonth = newMonth;
        await renderApp();
      },
      onOpenBudgetModal: async (month, data = null) => {
        const budgetData = data || await fetchBudget(month);
        openBudgetModal(month, budgetData);
      },
      onDeleteBudget: async (month) => {
        await deleteBudget(month);
        showToast(`Budget for ${month} removed.`);
        await renderApp();
      },
      onOpenIncomingModal: (defaultDate, data = null) => {
        openIncomingModal(defaultDate, data);
      },
      onDeleteIncoming: async (id) => {
        await removeIncomingMoney(id);
        showToast("Incoming money record deleted.");
        await renderApp();
      },
      showToast
    });
  }

  if (activePage === "cash") {
    initCashPage({
      onOpenCashModal: (data = null, type = "cash-out") => {
        openCashModal(data, type);
      },
      onDeleteCash: async (id) => {
        await removeCashTransaction(id);
        showToast("Cash transaction deleted.");
        await renderApp();
      },
      showToast
    });
  }

  if (modalOpen) {
    initExpenseModal({
      onSave: handleExpenseSave,
      onClose: closeExpenseModal
    });
  }

  if (budgetModalOpen) {
    initBudgetModal({
      onSave: handleBudgetSave,
      onClose: closeBudgetModal
    });
  }

  if (incomingModalOpen) {
    initIncomingMoneyModal({
      onSave: handleIncomingSave,
      onClose: closeIncomingModal
    });
  }

  if (cashModalOpen) {
    initCashModal({
      onSave: handleCashSave,
      onClose: closeCashModal
    });
  }

  if (activePage === "dashboard") {
    await updateDashboard();
  }

  if (activePage === "analytics") {
    await initAnalyticsPage();
  }
}

export async function initApp() {
  await renderApp();
  console.log("Expense Tracker initialized.");
}
