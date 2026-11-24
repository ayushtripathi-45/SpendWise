
import { formatCurrency } from "../utils/currency.js";
import { formatDate } from "../utils/date-utils.js";
import { formatMonthLabel } from "../modules/analytics.js";
import {
  getMonthlyBudgetStatus,
  getAllMonthsBudgetOverview,
  saveBudget,
  deleteBudget
} from "../modules/budget-manager.js";

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

/**
 * Renders the full Budgets Page with Incoming Money management
 */
export async function renderBudgetsPage(expenses, selectedMonth) {
  const currentStatus = await getMonthlyBudgetStatus(expenses, selectedMonth);
  const allMonths = await getAllMonthsBudgetOverview(expenses);

  const budgetVal = currentStatus.budget;
  const spentVal = currentStatus.spent;
  const incomingTotal = currentStatus.incomingTotal || 0;
  const incomingItems = currentStatus.incomingItems || [];
  const remainingVal = currentStatus.remaining;
  const isOver = currentStatus.isOverBudget;
  const pct = currentStatus.percentage;

  // Percentage bar color
  let progressClass = "progress-normal";
  if (isOver) {
    progressClass = "progress-danger";
  } else if (pct >= 80) {
    progressClass = "progress-warning";
  }

  return `
    <div class="budgets-page">

      <!-- Month Selector & Actions Header -->
      <header class="budget-control-bar">
        <div>
          <h2>${formatMonthLabel(selectedMonth)}</h2>
          <p>Monitor incoming, allocated, and remaining monthly funds</p>
        </div>

        <div class="budget-header-actions">
          <input
            type="month"
            id="budget-month-select"
            class="form-input budget-month-input"
            value="${selectedMonth}"
            aria-label="Select budget month"
          />
          <button class="primary-button incoming-header-btn" id="open-add-incoming-btn">
            + Incoming Money
          </button>
          <button class="primary-button" id="open-set-budget-btn">
            ${currentStatus.hasBudget ? "✎ Update Budget" : "+ Set Month Budget"}
          </button>
        </div>
      </header>

      <!-- Active Month 4 Overview Cards (Allocated, Spent, Incoming, Remaining) -->
      <section class="budget-overview-grid budget-overview-grid-4">
        <article class="budget-metric-card stat-card">
          <div class="stat-top">
            <span class="stat-label">Allocated Budget</span>
            <div class="stat-icon budget-icon">🎯</div>
          </div>
          <div class="stat-value" id="current-month-budget">
            ${currentStatus.hasBudget ? formatCurrency(budgetVal) : "Not Set"}
          </div>
          <p class="stat-description">
            ${currentStatus.hasBudget ? `Target limit for ${formatMonthLabel(selectedMonth)}` : "No limit set for this month"}
          </p>
        </article>

        <article class="budget-metric-card stat-card">
          <div class="stat-top">
            <span class="stat-label">Total Spent</span>
            <div class="stat-icon">💸</div>
          </div>
          <div class="stat-value" id="current-month-spent">
            ${formatCurrency(spentVal)}
          </div>
          <p class="stat-description">
            Actual expenses recorded this month
          </p>
        </article>

        <article class="budget-metric-card stat-card card-incoming-highlight">
          <div class="stat-top">
            <span class="stat-label">Incoming Money</span>
            <div class="stat-icon incoming-icon">💰</div>
          </div>
          <div class="stat-value amount-safe" id="current-month-incoming">
            +${formatCurrency(incomingTotal)}
          </div>
          <p class="stat-description">
            ${incomingItems.length > 0 ? `${incomingItems.length} transactions returned/added` : "No incoming recorded this month"}
          </p>
        </article>

        <article class="budget-metric-card stat-card ${isOver ? 'card-danger-highlight' : 'card-safe-highlight'}">
          <div class="stat-top">
            <span class="stat-label">Remaining Balance</span>
            <div class="stat-icon ${isOver ? 'danger-icon' : 'safe-icon'}">
              ${isOver ? "⚠️" : "🛡️"}
            </div>
          </div>
          <div class="stat-value ${isOver ? 'amount-danger' : 'amount-safe'}" id="current-month-remaining">
            ${remainingVal !== null
              ? (isOver ? `- ${formatCurrency(Math.abs(remainingVal))}` : formatCurrency(remainingVal))
              : "—"
            }
          </div>
          <p class="stat-description ${isOver ? 'text-danger' : ''}">
            ${remainingVal === null
              ? "Set a budget to calculate remaining balance"
              : isOver
                ? `Exceeded budget by ${formatCurrency(Math.abs(remainingVal))}!`
                : `${formatCurrency(remainingVal)} left safe to spend`
            }
          </p>
        </article>
      </section>

      <!-- Budget Progress & Status Card -->
      ${currentStatus.hasBudget || incomingTotal > 0 ? `
        <section class="budget-progress-section settings-section">
          <div class="budget-progress-header">
            <div>
              <h3>Budget Utilization & Remaining Breakdown</h3>
              <p class="settings-desc" style="margin-bottom: 0;">
                ${pct}% spent (${formatCurrency(spentVal)} of ${formatCurrency(currentStatus.hasBudget ? (budgetVal + incomingTotal) : incomingTotal)})
                ${incomingTotal > 0 ? ` · <span class="amount-safe">+${formatCurrency(incomingTotal)} incoming added</span>` : ""}
                ${currentStatus.notes ? ` · <em>Note: ${escapeHTML(currentStatus.notes)}</em>` : ""}
              </p>
            </div>
            <div>
              ${currentStatus.hasBudget ? `
                <button class="small-action delete-action" id="delete-current-budget-btn" data-month="${selectedMonth}">
                  Remove Budget
                </button>
              ` : ''}
            </div>
          </div>

          <div class="budget-progress-bar-container">
            <div class="budget-progress-bar ${progressClass}" style="width: ${Math.min(pct, 100)}%;"></div>
          </div>

          <div class="budget-progress-stats">
            <span>Spent: <strong>${formatCurrency(spentVal)}</strong></span>
            <span>Incoming: <strong class="amount-safe">+${formatCurrency(incomingTotal)}</strong></span>
            <span>
              ${isOver ? "Deficit" : "Remaining"}: 
              <strong class="${isOver ? 'amount-danger' : 'amount-safe'}">
                ${remainingVal !== null ? (isOver ? `- ${formatCurrency(Math.abs(remainingVal))}` : formatCurrency(remainingVal)) : "—"}
              </strong>
            </span>
          </div>
        </section>
      ` : `
        <section class="budget-empty-card">
          <div class="empty-icon">🎯</div>
          <h3>No budget set for ${formatMonthLabel(selectedMonth)}</h3>
          <p>Planning your monthly budget helps you control unnecessary spending and save money.</p>
          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <button class="primary-button incoming-header-btn" id="empty-state-add-incoming-btn">
              + Add Incoming Money
            </button>
            <button class="primary-button" id="empty-state-set-budget-btn">
              + Set Budget for ${formatMonthLabel(selectedMonth)}
            </button>
          </div>
        </section>
      `}

      <!-- Incoming Money Management Section for Current Month -->
      <section class="dashboard-section">
        <div class="section-heading">
          <div>
            <h2>Incoming Money Stream (${formatMonthLabel(selectedMonth)})</h2>
            <p>Money returned from friends or extra cash automatically added back into remaining budget</p>
          </div>
          <button class="primary-button incoming-header-btn" id="incoming-section-add-btn">
            + Add Incoming Money
          </button>
        </div>

        <div class="budget-table-card">
          ${incomingItems.length === 0 ? `
            <div style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13px;">
              No incoming money entries recorded for ${formatMonthLabel(selectedMonth)} yet.
              <br><br>
              <button class="small-action" id="inline-add-incoming-btn" style="color: #10B981; font-weight: 700;">
                + Record Incoming Money Now
              </button>
            </div>
          ` : `
            <div class="table-responsive">
              <table class="budget-history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>From (Person)</th>
                    <th>Reason / Note</th>
                    <th>Amount</th>
                    <th style="text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${incomingItems.map(item => `
                    <tr>
                      <td>${formatDate(item.date)}</td>
                      <td><strong>${escapeHTML(item.fromPerson)}</strong></td>
                      <td>${escapeHTML(item.reason)}</td>
                      <td>
                        <strong class="amount-safe">+${formatCurrency(item.amount)}</strong>
                      </td>
                      <td style="text-align: right;">
                        <button class="small-action" data-edit-incoming-id="${item.id}"
                                data-amount="${item.amount}" data-from="${escapeHTML(item.fromPerson)}"
                                data-reason="${escapeHTML(item.reason)}" data-date="${item.date}">
                          Edit
                        </button>
                        <button class="small-action delete-action" data-delete-incoming-id="${item.id}">
                          Delete
                        </button>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </section>

      <!-- Historical / Each Month's Budget Breakdown Table -->
      <section class="dashboard-section" style="margin-top: 32px;">
        <div class="section-heading">
          <div>
            <h2>Monthly Budget History & Visibility</h2>
            <p>Review budget targets, total expenses, incoming money, and live remaining balance across each month</p>
          </div>
        </div>

        <div class="budget-table-card">
          <div class="table-responsive">
            <table class="budget-history-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Budget Target</th>
                  <th>Total Spent</th>
                  <th>Incoming Money</th>
                  <th>Remaining Balance</th>
                  <th>Utilization</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${allMonths.map(item => {
                  const itemIsOver = item.isOverBudget;
                  const itemPct = item.percentage;
                  return `
                    <tr class="${item.month === selectedMonth ? 'active-row' : ''}">
                      <td>
                        <strong>${formatMonthLabel(item.month)}</strong>
                        ${item.month === selectedMonth ? '<span class="current-badge">Selected</span>' : ''}
                      </td>
                      <td>
                        ${item.hasBudget ? formatCurrency(item.budget) : '<span class="text-muted">Not Set</span>'}
                      </td>
                      <td>
                        <strong>${formatCurrency(item.spent)}</strong>
                        <small style="display:block; color:var(--text-secondary); font-size:10px;">${item.expenseCount} txn</small>
                      </td>
                      <td>
                        ${item.incomingTotal > 0 ? `
                          <strong class="amount-safe">+${formatCurrency(item.incomingTotal)}</strong>
                          <small style="display:block; color:var(--text-secondary); font-size:10px;">${item.incomingCount} returned</small>
                        ` : '<span class="text-muted">—</span>'}
                      </td>
                      <td>
                        ${item.remaining !== null ? `
                          <strong class="${itemIsOver ? 'amount-danger' : 'amount-safe'}">
                            ${itemIsOver ? `- ${formatCurrency(Math.abs(item.remaining))}` : formatCurrency(item.remaining)}
                          </strong>
                        ` : '<span class="text-muted">—</span>'}
                      </td>
                      <td>
                        ${item.hasBudget || item.incomingTotal > 0 ? `
                          <div class="table-progress-wrap">
                            <div class="mini-progress-bar">
                              <div class="mini-progress-fill ${itemIsOver ? 'progress-danger' : (itemPct >= 80 ? 'progress-warning' : 'progress-normal')}" 
                                   style="width: ${Math.min(itemPct, 100)}%;"></div>
                            </div>
                            <span class="${itemIsOver ? 'amount-danger' : ''}">${itemPct}%</span>
                          </div>
                        ` : '<span class="text-muted">—</span>'}
                      </td>
                      <td style="text-align: right;">
                        <button class="small-action" data-edit-budget-month="${item.month}" data-budget-amount="${item.budget}" data-budget-notes="${escapeHTML(item.notes)}">
                          ${item.hasBudget ? "Edit" : "Set"}
                        </button>
                        ${item.hasBudget ? `
                          <button class="small-action delete-action" data-remove-budget-month="${item.month}">
                            Delete
                          </button>
                        ` : ''}
                      </td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  `;
}

/**
 * Initializes Budgets Page Event Listeners
 */
export function initBudgetsPage({
  onMonthChange,
  onOpenBudgetModal,
  onDeleteBudget,
  onOpenIncomingModal,
  onDeleteIncoming,
  showToast
}) {
  // Month selector dropdown/picker
  const monthInput = document.querySelector("#budget-month-select");
  monthInput?.addEventListener("change", event => {
    const val = event.target.value;
    if (/^\d{4}-\d{2}$/.test(val)) {
      onMonthChange(val);
    }
  });

  // Top Set Budget button
  document.querySelector("#open-set-budget-btn")?.addEventListener("click", () => {
    onOpenBudgetModal(monthInput?.value);
  });

  // Empty state button
  document.querySelector("#empty-state-set-budget-btn")?.addEventListener("click", () => {
    onOpenBudgetModal(monthInput?.value);
  });

  // Top Add Incoming Money button
  document.querySelector("#open-add-incoming-btn")?.addEventListener("click", () => {
    onOpenIncomingModal(monthInput?.value ? `${monthInput.value}-01` : "");
  });

  document.querySelector("#incoming-section-add-btn")?.addEventListener("click", () => {
    onOpenIncomingModal(monthInput?.value ? `${monthInput.value}-01` : "");
  });

  document.querySelector("#empty-state-add-incoming-btn")?.addEventListener("click", () => {
    onOpenIncomingModal(monthInput?.value ? `${monthInput.value}-01` : "");
  });

  document.querySelector("#inline-add-incoming-btn")?.addEventListener("click", () => {
    onOpenIncomingModal(monthInput?.value ? `${monthInput.value}-01` : "");
  });

  // Delete current month budget
  document.querySelector("#delete-current-budget-btn")?.addEventListener("click", async event => {
    const month = event.currentTarget.dataset.month;
    if (window.confirm(`Are you sure you want to remove the budget for ${formatMonthLabel(month)}?`)) {
      await onDeleteBudget(month);
    }
  });

  // Table action buttons for Budget
  document.querySelectorAll("[data-edit-budget-month]").forEach(btn => {
    btn.addEventListener("click", () => {
      const month = btn.dataset.editBudgetMonth;
      const amount = Number(btn.dataset.budgetAmount || 0);
      const notes = btn.dataset.budgetNotes || "";
      onOpenBudgetModal(month, amount > 0 ? { month, amount, notes } : null);
    });
  });

  document.querySelectorAll("[data-remove-budget-month]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const month = btn.dataset.removeBudgetMonth;
      if (window.confirm(`Remove budget limit for ${formatMonthLabel(month)}?`)) {
        await onDeleteBudget(month);
      }
    });
  });

  // Table action buttons for Incoming Money
  document.querySelectorAll("[data-edit-incoming-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.editIncomingId;
      const amount = btn.dataset.amount;
      const fromPerson = btn.dataset.from;
      const reason = btn.dataset.reason;
      const date = btn.dataset.date;
      onOpenIncomingModal(date, { id, amount, fromPerson, reason, date });
    });
  });

  document.querySelectorAll("[data-delete-incoming-id]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.deleteIncomingId;
      if (window.confirm("Are you sure you want to delete this incoming money entry?")) {
        await onDeleteIncoming(id);
      }
    });
  });
}
