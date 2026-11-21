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
  createExpense,
  editExpense,
  removeExpense,
  fetchExpense,
  fetchExpenses
} from "./modules/expense-manager.js";

import { renderTransactions } from "./pages/transactions.js";

import { formatCurrency } from "./utils/currency.js";

import { renderDashboardPage, initDashboardCharts } from "./pages/dashboard.js";
import { renderSettingsPage, initSettingsPage } from "./pages/settings.js";

const pages = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Here's an overview of your expenses."
  },
  transactions: {
    title: "Transactions",
    subtitle: "Manage all your expense records."
  },
  analytics: {
    title: "Analytics",
    subtitle: "Understand your spending patterns."
  },
  backup: {
  title: "Backup & Restore",
  subtitle: "Export, import, and protect your expense data."
},
  categories: {
    title: "Categories",
    subtitle: "Organize your spending categories."
  },
  budgets: {
    title: "Budgets",
    subtitle: "Manage your monthly spending limits."
  },
  settings: {
    title: "Settings",
    subtitle: "Customize your expense tracker."
  }
};

let activePage = "dashboard";
let selectedAnalyticsMonth = getCurrentMonth();
let modalOpen = false;
let modalExpense = null;
let modalMode = "quick";

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
  return renderDashboardPage(analytics, expenses);
}

async function renderPageContent() {
  if (activePage === "dashboard") {
    return renderDashboard();
  }

  if (activePage === "transactions") {
    return await renderTransactions();
  }

  if (activePage === "analytics") {
    const expenses = await fetchExpenses();

    const analytics = calculateAnalytics(
      expenses,
      selectedAnalyticsMonth
    );

    return renderAnalyticsPage(analytics);
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
  const analytics = calculateAnalytics(expenses, getCurrentMonth());

  const el = (id) => document.querySelector(id);

  if (el("#overall-spending")) el("#overall-spending").textContent = formatCurrency(analytics.overallSpending);
  if (el("#monthly-spending")) el("#monthly-spending").textContent = formatCurrency(analytics.monthlySpending);
  if (el("#today-spending")) el("#today-spending").textContent = formatCurrency(analytics.todaySpending);
  if (el("#daily-average")) el("#daily-average").textContent = formatCurrency(analytics.calendarDailyAverage);
  if (el("#active-day-avg")) el("#active-day-avg").textContent = formatCurrency(analytics.activeDayAverage);
  if (el("#transaction-count")) el("#transaction-count").textContent = analytics.allTimeTransactionCount;

  initDashboardCharts(analytics);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
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

          <button class="primary-button"
            data-add-expense="quick">
            + Add Expense
          </button>
        </header>

        <div id="page-content">
          ${content}
        </div>

      </main>

      ${renderMobileNav(activePage)}

    </div>

    ${modalOpen ? renderExpenseModal(modalExpense, modalMode) : ""}
  `;

  initNavbar();
  initNavigation();
  if (activePage === "backup") {
  initBackupPage(showToast);
}
  if (activePage === "settings") {
    initSettingsPage({ showToast, renderApp });
  }
  if (modalOpen) {
    initExpenseModal({
      onSave: handleExpenseSave,
      onClose: closeExpenseModal
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
