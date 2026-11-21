
import { fetchExpenses } from "../modules/expense-manager.js";
import { formatCurrency } from "../utils/currency.js";
import { formatDate } from "../utils/date-utils.js";

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

const labels = {
  "tuck-shop": "Tuck Shop",
  "outside-college": "Outside College",
  food: "Food",
  study: "Study",
  travel: "Travel",
  other: "Other"
};

export async function renderTransactions() {
  const expenses = await fetchExpenses();

  if (!expenses.length) {
    return `
      <div class="empty-state">
        <div class="empty-icon">₹</div>
        <h3>No expenses yet</h3>
        <p>Your recorded expenses will appear here.</p>
        <button class="primary-button" data-add-expense="quick">
          Add Your First Expense
        </button>
      </div>
    `;
  }

  const total = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  return `
    <div class="transaction-summary">
      <div>
        <span>Total recorded transactions</span>
        <strong>${expenses.length}</strong>
      </div>

      <div>
        <span>Total recorded spending</span>
        <strong>${formatCurrency(total)}</strong>
      </div>
    </div>

    <div class="transaction-list">
      ${expenses.map(expense => `
        <article class="transaction-item">

          <div class="transaction-icon">
            ${labels[expense.category] === "Food" ? "🍽" :
              labels[expense.category] === "Study" ? "📚" :
              labels[expense.category] === "Travel" ? "🚕" : "₹"}
          </div>

          <div class="transaction-info">
            <strong>${escapeHTML(expense.note || labels[expense.category])}</strong>
            <span>
              ${labels[expense.location]} ·
              ${labels[expense.category]}
            </span>
            <small>${formatDate(expense.date)}</small>
          </div>

          <div class="transaction-actions">
            <strong class="transaction-amount">
              ${formatCurrency(expense.amount)}
            </strong>

            <div>
              <button class="small-action"
                data-edit-expense="${escapeHTML(expense.id)}"
                aria-label="Edit expense">Edit</button>

              <button class="small-action delete-action"
                data-delete-expense="${escapeHTML(expense.id)}"
                aria-label="Delete expense">Delete</button>
            </div>
          </div>

        </article>
      `).join("")}
    </div>
  `;
}
