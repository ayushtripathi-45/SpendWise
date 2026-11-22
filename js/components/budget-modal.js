
import { formatCurrency } from "../utils/currency.js";
import { formatMonthLabel } from "../modules/analytics.js";

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
 * Renders the Budget modal for setting/updating a budget.
 */
export function renderBudgetModal(budgetData = null, selectedMonth = "") {
  const month = budgetData?.month || selectedMonth || new Date().toISOString().slice(0, 7);
  const amount = budgetData?.amount ?? "";
  const notes = budgetData?.notes ?? "";
  const isEditing = Boolean(budgetData && budgetData.amount > 0);

  return `
    <div class="modal-overlay" id="budget-modal">
      <section class="expense-modal" role="dialog" aria-modal="true" aria-labelledby="budget-modal-title">
        <header class="modal-header">
          <div>
            <h2 id="budget-modal-title">${isEditing ? "Update Budget" : "Set Monthly Budget"}</h2>
            <p>Define spending limits to track remaining funds.</p>
          </div>
          <button type="button" class="modal-close" data-close-budget-modal aria-label="Close">×</button>
        </header>

        <form id="budget-form" novalidate>
          <div class="form-field">
            <label for="budget-month">Budget Month</label>
            <input
              class="form-input"
              id="budget-month"
              name="month"
              type="month"
              value="${escapeHTML(month)}"
              required
            />
          </div>

          <div class="amount-field">
            <label for="budget-amount">Budget Amount (₹)</label>
            <div class="amount-input">
              <span>₹</span>
              <input
                id="budget-amount"
                name="amount"
                type="number"
                inputmode="decimal"
                min="1"
                max="100000000"
                step="1"
                placeholder="e.g. 5000"
                value="${amount}"
                required
                autofocus
              />
            </div>
          </div>

          <div class="form-field">
            <label for="budget-notes">Notes / Purpose (Optional)</label>
            <input
              class="form-input"
              id="budget-notes"
              name="notes"
              type="text"
              maxlength="200"
              placeholder="e.g. Hostel & food allowance, semester books"
              value="${escapeHTML(notes)}"
            />
          </div>

          <p class="form-error" id="budget-error" role="alert"></p>

          <div style="display: flex; gap: 10px; margin-top: 10px;">
            <button class="save-expense-button" type="submit" id="save-budget-btn">
              ${isEditing ? "Update Budget" : "Save Budget"}
            </button>
          </div>
        </form>
      </section>
    </div>
  `;
}

export function initBudgetModal({ onSave, onClose }) {
  const modal = document.querySelector("#budget-modal");
  const form = document.querySelector("#budget-form");
  const amountInput = document.querySelector("#budget-amount");
  const errorElement = document.querySelector("#budget-error");

  if (!modal || !form) return;

  const close = () => onClose?.();

  modal.querySelector("[data-close-budget-modal]")?.addEventListener("click", close);

  modal.addEventListener("click", event => {
    if (event.target === modal) close();
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    errorElement.textContent = "";

    const formData = new FormData(form);
    const month = formData.get("month");
    const amount = formData.get("amount");
    const notes = formData.get("notes");

    const saveButton = form.querySelector("#save-budget-btn");

    try {
      saveButton.disabled = true;
      saveButton.textContent = "Saving...";
      await onSave({ month, amount, notes });
    } catch (error) {
      errorElement.textContent = error.message || "Unable to save budget.";
      saveButton.disabled = false;
      saveButton.textContent = "Try Again";
    }
  });

  amountInput?.focus();
}
