
import { formatCurrency } from "../utils/currency.js";
import { formatDate } from "../utils/date-utils.js";
import {
  fetchAllCashTransactions,
  getCashSummary
} from "../modules/cash-manager.js";

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
 * Renders the Cash Money Page
 */
export async function renderCashPage() {
  const summary = await getCashSummary();
  const allItems = await fetchAllCashTransactions();

  const totalIn = summary.totalCashIn;
  const totalOut = summary.totalCashOut;
  const remaining = summary.remainingCash;
  const isNegative = remaining < 0;

  return `
    <div class="cash-page">

      <!-- Header & Top Actions -->
      <header class="cash-control-bar">
        <div>
          <h2>Cash In Hand Tracker</h2>
          <p>Track cash wallet balance: total cash in hand, expenses spent in cash, and remaining cash.</p>
        </div>

        <div class="cash-header-actions">
          <button class="primary-button cash-in-btn" id="open-add-cash-in-btn">
            + Add Cash / In-Hand
          </button>
          <button class="primary-button cash-out-btn" id="open-add-cash-out-btn">
            - Spend Cash (Expense)
          </button>
        </div>
      </header>

      <!-- 3 Key Metric Cards -->
      <section class="cash-overview-grid">
        <article class="stat-card cash-metric-card">
          <div class="stat-top">
            <span class="stat-label">Total Cash In-Hand / Added</span>
            <div class="stat-icon cash-in-icon">💵</div>
          </div>
          <div class="stat-value amount-safe" id="cash-stat-total-in">
            ${formatCurrency(totalIn)}
          </div>
          <p class="stat-description">Initial cash + ATM withdrawals</p>
        </article>

        <article class="stat-card cash-metric-card">
          <div class="stat-top">
            <span class="stat-label">Total Cash Spent</span>
            <div class="stat-icon cash-out-icon">💸</div>
          </div>
          <div class="stat-value amount-danger" id="cash-stat-total-out">
            ${formatCurrency(totalOut)}
          </div>
          <p class="stat-description">Offline & cash payments made</p>
        </article>

        <article class="stat-card cash-metric-card ${isNegative ? 'card-danger-highlight' : 'card-safe-highlight'}">
          <div class="stat-top">
            <span class="stat-label">Remaining Cash Balance</span>
            <div class="stat-icon ${isNegative ? 'danger-icon' : 'safe-icon'}">
              ${isNegative ? "⚠️" : "👛"}
            </div>
          </div>
          <div class="stat-value ${isNegative ? 'amount-danger' : 'amount-safe'}" id="cash-stat-remaining">
            ${isNegative ? `- ${formatCurrency(Math.abs(remaining))}` : formatCurrency(remaining)}
          </div>
          <p class="stat-description ${isNegative ? 'text-danger' : ''}">
            ${isNegative
              ? `Deficit by ${formatCurrency(Math.abs(remaining))} (more cash spent than added)`
              : `Current physical cash in your pocket`
            }
          </p>
        </article>
      </section>

      <!-- Quick Action Helper Bar -->
      <section class="cash-quick-bar">
        <div class="cash-quick-left">
          <span style="font-size: 20px;">💡</span>
          <div>
            <strong>Keeping Online & Cash Separate</strong>
            <p>Your Online account/UPI budget remains untouched. All cash transactions stay right here in Cash Money.</p>
          </div>
        </div>
        <div class="cash-quick-buttons">
          <button class="small-action" id="bar-add-cash-in">+ Add Cash</button>
          <button class="small-action delete-action" id="bar-add-cash-out">- Spend Cash</button>
        </div>
      </section>

      <!-- All Cash History Table -->
      <section class="dashboard-section" style="margin-top: 24px;">
        <div class="section-heading">
          <div>
            <h2>Cash Ledger & Transaction History</h2>
            <p>All cash expenses and in-hand additions with reason and remaining calculations</p>
          </div>
        </div>

        <div class="budget-table-card">
          ${allItems.length === 0 ? `
            <div class="cash-empty-state">
              <div class="empty-icon">👛</div>
              <h3>No cash records yet</h3>
              <p>Add the initial cash you have in hand or record your first cash expense.</p>
              <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:14px;">
                <button class="primary-button cash-in-btn" id="empty-add-cash-in">+ Add Initial Cash (e.g. ₹1000)</button>
                <button class="primary-button cash-out-btn" id="empty-add-cash-out">- Record Cash Expense (e.g. ₹100)</button>
              </div>
            </div>
          ` : `
            <div class="table-responsive">
              <table class="budget-history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Reason / Where Spent</th>
                    <th>Amount</th>
                    <th style="text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${allItems.map(item => {
                    const isCashIn = item.type === "cash-in";
                    return `
                      <tr>
                        <td>${formatDate(item.date)}</td>
                        <td>
                          <span class="cash-type-badge ${isCashIn ? 'badge-cash-in' : 'badge-cash-out'}">
                            ${isCashIn ? "💵 Cash Added" : "💸 Cash Spent"}
                          </span>
                        </td>
                        <td><strong>${escapeHTML(item.reason)}</strong></td>
                        <td>
                          <strong class="${isCashIn ? 'amount-safe' : 'amount-danger'}">
                            ${isCashIn ? "+" : "-"}${formatCurrency(item.amount)}
                          </strong>
                        </td>
                        <td style="text-align: right;">
                          <button class="small-action" data-edit-cash-id="${item.id}"
                                  data-type="${item.type}" data-amount="${item.amount}"
                                  data-reason="${escapeHTML(item.reason)}" data-date="${item.date}">
                            Edit
                          </button>
                          <button class="small-action delete-action" data-delete-cash-id="${item.id}">
                            Delete
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join("")}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </section>

    </div>
  `;
}

/**
 * Initializes Cash Page event listeners
 */
export function initCashPage({ onOpenCashModal, onDeleteCash, showToast }) {
  document.querySelector("#open-add-cash-in-btn")?.addEventListener("click", () => {
    onOpenCashModal(null, "cash-in");
  });

  document.querySelector("#open-add-cash-out-btn")?.addEventListener("click", () => {
    onOpenCashModal(null, "cash-out");
  });

  document.querySelector("#bar-add-cash-in")?.addEventListener("click", () => {
    onOpenCashModal(null, "cash-in");
  });

  document.querySelector("#bar-add-cash-out")?.addEventListener("click", () => {
    onOpenCashModal(null, "cash-out");
  });

  document.querySelector("#empty-add-cash-in")?.addEventListener("click", () => {
    onOpenCashModal(null, "cash-in");
  });

  document.querySelector("#empty-add-cash-out")?.addEventListener("click", () => {
    onOpenCashModal(null, "cash-out");
  });

  // Action buttons on each row
  document.querySelectorAll("[data-edit-cash-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.editCashId;
      const type = btn.dataset.type;
      const amount = btn.dataset.amount;
      const reason = btn.dataset.reason;
      const date = btn.dataset.date;
      onOpenCashModal({ id, type, amount, reason, date }, type);
    });
  });

  document.querySelectorAll("[data-delete-cash-id]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.deleteCashId;
      if (window.confirm("Are you sure you want to delete this cash entry?")) {
        await onDeleteCash(id);
      }
    });
  });
}
