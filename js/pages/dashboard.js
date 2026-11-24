
import Chart from "chart.js/auto";
import { formatCurrency } from "../utils/currency.js";
import { formatDate } from "../utils/date-utils.js";
import { formatMonthLabel } from "../modules/analytics.js";

const COLORS = {
  emerald: "#10B981",
  blue: "#3B82F6",
  amber: "#F59E0B",
  purple: "#8B5CF6",
  red: "#EF4444"
};

const CATEGORY_LABELS = {
  food: "Food",
  study: "Study",
  travel: "Travel",
  other: "Other"
};

const CATEGORY_ICONS = {
  food: "🍽",
  study: "📚",
  travel: "🚕",
  other: "₹"
};

const LOCATION_LABELS = {
  "tuck-shop": "Tuck Shop",
  "outside-college": "Outside College"
};

const dashCharts = {};

function destroyDashChart(id) {
  if (dashCharts[id]) {
    dashCharts[id].destroy();
    delete dashCharts[id];
  }
}

function createDashChart(id, config) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  destroyDashChart(id);
  dashCharts[id] = new Chart(canvas, {
    responsive: true,
    maintainAspectRatio: false,
    ...config
  });
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

const currencyAxis = {
  ticks: {
    callback(value) {
      return `₹${Number(value).toLocaleString("en-IN")}`;
    }
  },
  grid: {
    color: "rgba(148, 163, 184, 0.12)"
  }
};

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        usePointStyle: true,
        boxWidth: 8,
        padding: 18,
        font: {
          family: "Inter",
          size: 11
        }
      }
    }
  }
};

export function renderDashboardPage(analytics, expenses, budgetStatus = null) {
  const recent = expenses.slice(0, 5);

  const highestDay = analytics.dailyBreakdown.reduce(
    (max, item) => item.amount > max.amount ? item : max,
    { day: 0, amount: 0 }
  );

  const hasBudget = Boolean(budgetStatus && budgetStatus.hasBudget);
  const budgetAmount = budgetStatus?.budget || 0;
  const remainingAmount = budgetStatus?.remaining;
  const isOverBudget = Boolean(budgetStatus?.isOverBudget);
  const budgetPct = budgetStatus?.percentage || 0;
  const incomingTotal = budgetStatus?.incomingTotal || 0;
  const incomingItems = budgetStatus?.incomingItems || [];

  return `
    <!-- Top Summary Cards Grid (including Monthly Budget & Remaining Budget with incoming money) -->
    <section class="dashboard-grid dashboard-grid-6">
      <article class="stat-card">
        <div class="stat-top">
          <span class="stat-label">Monthly Budget</span>
          <div class="stat-icon budget-icon">🎯</div>
        </div>
        <div class="stat-value" id="dash-stat-budget">
          ${hasBudget ? formatCurrency(budgetAmount) : "Not Set"}
        </div>
        <p class="stat-description">
          ${hasBudget ? `Target for ${formatMonthLabel(analytics.selectedMonth)}` : '<a href="#" data-action="set-budget" style="color:var(--primary); font-weight:600;">+ Set Budget</a>'}
        </p>
      </article>

      <article class="stat-card ${isOverBudget ? 'card-danger-highlight' : (remainingAmount !== null ? 'card-safe-highlight' : '')}">
        <div class="stat-top">
          <span class="stat-label">Remaining Budget</span>
          <div class="stat-icon ${isOverBudget ? 'danger-icon' : 'safe-icon'}">
            ${isOverBudget ? "⚠️" : "🛡️"}
          </div>
        </div>
        <div class="stat-value ${isOverBudget ? 'amount-danger' : 'amount-safe'}" id="dash-stat-remaining">
          ${remainingAmount !== null
            ? (isOverBudget ? `- ${formatCurrency(Math.abs(remainingAmount))}` : formatCurrency(remainingAmount))
            : "—"
          }
        </div>
        <p class="stat-description ${isOverBudget ? 'text-danger' : ''}" id="dash-stat-remaining-desc">
          ${remainingAmount === null
            ? "Set a budget or add incoming to track balance"
            : isOverBudget
              ? `Over limit by ${formatCurrency(Math.abs(remainingAmount))}`
              : `${formatCurrency(remainingAmount)} safe to spend`
          }
        </p>
      </article>

      <article class="stat-card">
        <div class="stat-top">
          <span class="stat-label">Incoming Money</span>
          <div class="stat-icon incoming-icon">💰</div>
        </div>
        <div class="stat-value amount-safe" id="dash-stat-incoming">
          +${formatCurrency(incomingTotal)}
        </div>
        <p class="stat-description">
          ${incomingItems.length > 0 ? `${incomingItems.length} received (added to balance)` : '<a href="#" data-action="add-incoming" style="color:var(--primary); font-weight:600;">+ Add Incoming</a>'}
        </p>
      </article>

      <article class="stat-card">
        <div class="stat-top">
          <span class="stat-label">Monthly Spending</span>
          <div class="stat-icon">◷</div>
        </div>
        <div class="stat-value" id="monthly-spending">${formatCurrency(analytics.monthlySpending)}</div>
        <p class="stat-description">Current month</p>
      </article>

      <article class="stat-card">
        <div class="stat-top">
          <span class="stat-label">Today's Spending</span>
          <div class="stat-icon">☀</div>
        </div>
        <div class="stat-value" id="today-spending">${formatCurrency(analytics.todaySpending)}</div>
        <p class="stat-description">Expenses logged today</p>
      </article>

      <article class="stat-card">
        <div class="stat-top">
          <span class="stat-label">Overall Spending</span>
          <div class="stat-icon">₹</div>
        </div>
        <div class="stat-value" id="overall-spending">${formatCurrency(analytics.overallSpending)}</div>
        <p class="stat-description">All-time expenses</p>
      </article>

      <article class="stat-card">
        <div class="stat-top">
          <span class="stat-label">Daily Average</span>
          <div class="stat-icon">↗</div>
        </div>
        <div class="stat-value" id="daily-average">${formatCurrency(analytics.calendarDailyAverage)}</div>
        <p class="stat-description">Calendar day average</p>
      </article>

      <article class="stat-card">
        <div class="stat-top">
          <span class="stat-label">Transactions</span>
          <div class="stat-icon">≡</div>
        </div>
        <div class="stat-value" id="transaction-count">${analytics.allTimeTransactionCount}</div>
        <p class="stat-description">All recorded transactions</p>
      </article>
    </section>

    <!-- Monthly Budget Tracker Banner Widget on Dashboard -->
    <section class="dashboard-budget-widget">
      <div class="dash-budget-top">
        <div class="dash-budget-title">
          <span style="font-size: 20px;">🎯</span>
          <div>
            <h3>Monthly Budget & Incoming Tracker (${formatMonthLabel(analytics.selectedMonth)})</h3>
            <span style="font-size: 11px; color: var(--text-secondary);">
              ${hasBudget ? `${budgetPct}% used` : "No spending limit configured"}
              ${incomingTotal > 0 ? ` · +${formatCurrency(incomingTotal)} incoming returned` : ""}
            </span>
          </div>
        </div>

        <div class="dash-budget-actions">
          <button class="small-action incoming-action-btn" data-action="add-incoming">
            + Incoming Money
          </button>
          <button class="small-action" data-action="set-budget">
            ${hasBudget ? "Update Budget" : "+ Add Budget"}
          </button>
          <button class="small-action" data-page="budgets">
            View Budget Page
          </button>
        </div>
      </div>

      ${hasBudget || incomingTotal > 0 ? `
        <div class="budget-progress-bar-container" style="margin-top: 6px;">
          <div class="budget-progress-bar ${isOverBudget ? 'progress-danger' : (budgetPct >= 80 ? 'progress-warning' : 'progress-normal')}"
               style="width: ${Math.min(budgetPct, 100)}%;"></div>
        </div>

        <div class="dash-budget-numbers">
          <div class="dash-budget-item">
            <span>Allocated Monthly Budget</span>
            <strong>${hasBudget ? formatCurrency(budgetAmount) : "Not Set"}</strong>
          </div>
          <div class="dash-budget-item">
            <span>Spent So Far</span>
            <strong>${formatCurrency(analytics.monthlySpending)}</strong>
          </div>
          <div class="dash-budget-item">
            <span>Incoming Money (Received)</span>
            <strong class="amount-safe">+${formatCurrency(incomingTotal)}</strong>
          </div>
          <div class="dash-budget-item">
            <span>${isOverBudget ? "Over Budget Deficit" : "Remaining to Spend"}</span>
            <strong class="${isOverBudget ? 'amount-danger' : 'amount-safe'}">
              ${remainingAmount !== null ? (isOverBudget ? `- ${formatCurrency(Math.abs(remainingAmount))}` : formatCurrency(remainingAmount)) : "—"}
            </strong>
          </div>
        </div>
      ` : `
        <div style="font-size: 12px; color: var(--text-secondary); padding: 8px 0; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
          <span>💡 Set a budget or add incoming returned money to monitor your live remaining funds.</span>
          <div style="display:flex; gap:8px;">
            <button class="small-action" data-action="add-incoming" style="font-weight: 700; color: #10B981;">
              + Add Incoming
            </button>
            <button class="small-action" data-action="set-budget" style="font-weight: 700; color: var(--primary);">
              + Set Budget
            </button>
          </div>
        </div>
      `}
    </section>

    <!-- Recent Incoming Money Stream Widget (if any incoming recorded this month) -->
    ${incomingItems.length > 0 ? `
      <section class="dashboard-section" style="margin-top: 20px;">
        <div class="section-heading">
          <div>
            <h2>Incoming Money (${formatMonthLabel(analytics.selectedMonth)})</h2>
            <p>Money returned from friends or extra allowance automatically credited to remaining budget</p>
          </div>
          <button class="small-action" data-action="add-incoming">
            + Add Incoming
          </button>
        </div>

        <div class="incoming-list">
          ${incomingItems.slice(0, 4).map(item => `
            <div class="incoming-item">
              <div class="incoming-icon-box">💰</div>
              <div class="incoming-info">
                <strong>${escapeHTML(item.fromPerson)}</strong>
                <span>${escapeHTML(item.reason)}</span>
                <small>${formatDate(item.date)}</small>
              </div>
              <strong class="incoming-amount amount-safe">
                +${formatCurrency(item.amount)}
              </strong>
            </div>
          `).join("")}
        </div>
      </section>
    ` : ''}

    <section class="dashboard-section">
      <div class="section-heading">
        <div>
          <h2>Spending Overview</h2>
          <p>Your monthly expense activity</p>
        </div>
      </div>

      <div class="analytics-chart-grid">
        <article class="analytics-chart-card chart-wide">
          <div class="analytics-chart-heading">
            <div>
              <h3>Daily Spending Trend</h3>
              <p>Daily expenses for the current month</p>
            </div>
          </div>
          <div class="chart-container">
            <canvas id="dash-daily-trend-chart"></canvas>
          </div>
        </article>

        <article class="analytics-chart-card chart-wide">
          <div class="analytics-chart-heading">
            <div>
              <h3>Tuck Shop vs Outside College</h3>
              <p>Spending comparison by location and category</p>
            </div>
          </div>
          <div class="chart-container">
            <canvas id="dash-location-chart"></canvas>
          </div>
        </article>

        <article class="analytics-chart-card">
          <div class="analytics-chart-heading">
            <div>
              <h3>Category Breakdown</h3>
              <p>Where your money goes</p>
            </div>
          </div>
          <div class="chart-container">
            <canvas id="dash-category-chart"></canvas>
          </div>
        </article>

        <article class="analytics-chart-card">
          <div class="analytics-chart-heading">
            <div>
              <h3>Monthly Summary</h3>
              <p>Key stats for this month</p>
            </div>
          </div>
          <div class="monthly-summary">
            <div class="monthly-summary-item">
              <span>Monthly Total</span>
              <strong>${formatCurrency(analytics.monthlySpending)}</strong>
            </div>
            <div class="monthly-summary-item">
              <span>Transactions</span>
              <strong>${analytics.transactionCount}</strong>
            </div>
            <div class="monthly-summary-item">
              <span>Highest Day</span>
              <strong>${highestDay.amount > 0 ? `Day ${highestDay.day} — ${formatCurrency(highestDay.amount)}` : "—"}</strong>
            </div>
            <div class="monthly-summary-item">
              <span>Active Days</span>
              <strong>${analytics.activeDays} / ${analytics.daysInMonth}</strong>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="dashboard-section">
      <div class="section-heading">
        <div>
          <h2>Recent Transactions</h2>
          <p>Your latest expense records</p>
        </div>
        <button class="small-action" data-page="transactions">
          View All
        </button>
      </div>

      <div id="recent-transactions">
        ${!recent.length ? `
          <div class="dashboard-placeholder">
            No expenses recorded yet. Start by adding your first expense.
          </div>
        ` : `
          <div class="transaction-list">
            ${recent.map(expense => `
              <div class="transaction-item">
                <div class="transaction-icon">
                  ${CATEGORY_ICONS[expense.category] || "₹"}
                </div>
                <div class="transaction-info">
                  <strong>${escapeHTML(expense.note || CATEGORY_LABELS[expense.category] || expense.category)}</strong>
                  <span>${LOCATION_LABELS[expense.location] || escapeHTML(expense.location)} · ${CATEGORY_LABELS[expense.category] || escapeHTML(expense.category)}</span>
                  <small>${formatDate(expense.date)}</small>
                </div>
                <strong class="transaction-amount">
                  ${formatCurrency(expense.amount)}
                </strong>
              </div>
            `).join("")}
          </div>
        `}
      </div>
    </section>

    <section class="dashboard-section">
      <div class="section-heading">
        <div>
          <h2>Quick Actions</h2>
          <p>Shortcuts to common tasks</p>
        </div>
      </div>

      <div class="quick-actions-grid">
        <button class="quick-action-btn" data-add-expense="quick">
          <span class="action-icon">+</span>
          <span>Add Expense</span>
        </button>
        <button class="quick-action-btn" data-action="add-incoming">
          <span class="action-icon">💰</span>
          <span>Add Incoming</span>
        </button>
        <button class="quick-action-btn" data-action="set-budget">
          <span class="action-icon">🎯</span>
          <span>Set Budget</span>
        </button>
        <button class="quick-action-btn" data-page="budgets">
          <span class="action-icon">👛</span>
          <span>Budgets</span>
        </button>
        <button class="quick-action-btn" data-page="analytics">
          <span class="action-icon">📊</span>
          <span>Analytics</span>
        </button>
        <button class="quick-action-btn" data-page="transactions">
          <span class="action-icon">📋</span>
          <span>Transactions</span>
        </button>
      </div>
    </section>
  `;
}

export function initDashboardCharts(analytics) {
  const labels = analytics.dailyBreakdown.map(item => item.day);
  const spending = analytics.dailyBreakdown.map(item => item.amount);
  const average = labels.map(() => analytics.calendarDailyAverage);

  createDashChart("dash-daily-trend-chart", {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Daily Spending",
          data: spending,
          borderColor: COLORS.emerald,
          backgroundColor: "rgba(16, 185, 129, 0.12)",
          fill: true,
          tension: 0.35,
          pointRadius: 2,
          pointHoverRadius: 5
        },
        {
          label: "Daily Average",
          data: average,
          borderColor: COLORS.red,
          borderDash: [6, 5],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          tension: 0
        }
      ]
    },
    options: {
      ...commonOptions,
      interaction: { intersect: false, mode: "index" },
      scales: {
        x: {
          title: { display: true, text: "Day of month" },
          grid: { display: false }
        },
        y: { ...currencyAxis, beginAtZero: true }
      }
    }
  });

  createDashChart("dash-location-chart", {
    type: "bar",
    data: {
      labels: ["Food", "Study", "Travel", "Other"],
      datasets: analytics.locationCategoryBreakdown.map((item, index) => ({
        label: LOCATION_LABELS[item.location],
        data: ["food", "study", "travel", "other"].map(
          category => item[category]
        ),
        backgroundColor: index === 0 ? COLORS.emerald : COLORS.blue,
        borderRadius: 5,
        maxBarThickness: 35
      }))
    },
    options: {
      ...commonOptions,
      scales: {
        x: { grid: { display: false } },
        y: currencyAxis
      }
    }
  });

  createDashChart("dash-category-chart", {
    type: "doughnut",
    data: {
      labels: analytics.categoryBreakdown.map(
        item => CATEGORY_LABELS[item.category]
      ),
      datasets: [{
        data: analytics.categoryBreakdown.map(item => item.amount),
        backgroundColor: [
          COLORS.emerald,
          COLORS.blue,
          COLORS.amber,
          COLORS.purple
        ],
        borderWidth: 0,
        hoverOffset: 5
      }]
    },
    options: {
      ...commonOptions,
      cutout: "68%",
      plugins: {
        ...commonOptions.plugins,
        tooltip: {
          callbacks: {
            label(context) {
              const total = analytics.monthlySpending;
              const value = Number(context.raw || 0);
              const percentage = total > 0
                ? ((value / total) * 100).toFixed(1)
                : "0.0";
              return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}
