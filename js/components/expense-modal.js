
import { getLocalDateString } from "../utils/date-utils.js";

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

export function renderExpenseModal(expense = null, mode = "quick") {
  const editing = Boolean(expense);
  const defaultLocation = localStorage.getItem("expense-pref-location") || "tuck-shop";
  const defaultCategory = localStorage.getItem("expense-pref-category") || "food";

  return `
    <div class="modal-overlay" id="expense-modal">
      <section class="expense-modal" role="dialog"
        aria-modal="true" aria-labelledby="expense-modal-title">

        <header class="modal-header">
          <div>
            <h2 id="expense-modal-title">
              ${editing ? "Edit Expense" : "Add Expense"}
            </h2>
            <p>Record where your money goes.</p>
          </div>

          <button type="button" class="modal-close"
            data-close-modal aria-label="Close">×</button>
        </header>

        <div class="entry-tabs">
          <button type="button"
            class="entry-tab ${mode === "quick" ? "active" : ""}"
            data-entry-mode="quick">Quick Add</button>

          <button type="button"
            class="entry-tab ${mode === "detailed" ? "active" : ""}"
            data-entry-mode="detailed">Detailed Add</button>
        </div>

        <form id="expense-form" novalidate>
          <input type="hidden" name="id"
            value="${escapeHTML(expense?.id || "")}">

          <div class="amount-field">
            <label for="expense-amount">Amount</label>
            <div class="amount-input">
              <span>₹</span>
              <input
                id="expense-amount"
                name="amount"
                type="number"
                inputmode="decimal"
                min="0.01"
                max="10000000"
                step="0.01"
                placeholder="0.00"
                value="${expense?.amount ?? ""}"
                required
                autofocus
              >
            </div>
          </div>

          <div class="form-field">
            <label>Location</label>
            <div class="choice-grid">
              <label class="choice-option">
                <input type="radio" name="location"
                  value="tuck-shop"
                  ${!editing
                    ? (defaultLocation === "tuck-shop" ? "checked" : "")
                    : (expense.location === "tuck-shop" ? "checked" : "")}>
                <span>Tuck Shop</span>
              </label>

              <label class="choice-option">
                <input type="radio" name="location"
                  value="outside-college"
                  ${!editing
                    ? (defaultLocation === "outside-college" ? "checked" : "")
                    : (expense.location === "outside-college" ? "checked" : "")}>
                <span>Outside College</span>
              </label>
            </div>
          </div>

          <div class="form-field">
            <label>Category</label>
            <div class="choice-grid category-grid">
              ${[
                ["food", "Food"],
                ["study", "Study"],
                ["travel", "Travel"],
                ["other", "Other"]
              ].map(([value, label]) => `
                <label class="choice-option">
                  <input type="radio" name="category"
                    value="${value}"
                    ${!editing
                      ? (defaultCategory === value ? "checked" : "")
                      : (expense.category === value ? "checked" : "")}>
                  <span>${label}</span>
                </label>
              `).join("")}
            </div>
          </div>

          <div class="detailed-fields"
            ${mode === "detailed" || editing ? "" : "hidden"}>

            <div class="form-field">
              <label for="expense-date">Expense Date</label>
              <input class="form-input"
                id="expense-date"
                name="date"
                type="date"
                value="${escapeHTML(expense?.date || getLocalDateString())}"
                required>
            </div>

            <div class="form-field">
              <label for="expense-note">Note (optional)</label>
              <textarea class="form-input"
                id="expense-note"
                name="note"
                maxlength="200"
                rows="3"
                placeholder="e.g. Chai + samosa, xerox, auto">${escapeHTML(expense?.note || "")}</textarea>
            </div>
          </div>

          <p class="form-error" id="expense-error" role="alert"></p>

          <button class="save-expense-button" type="submit">
            ${editing ? "Update Expense" : "Save Expense"}
          </button>
        </form>
      </section>
    </div>
  `;
}

export function initExpenseModal({ onSave, onClose }) {
  const modal = document.querySelector("#expense-modal");
  const form = document.querySelector("#expense-form");
  const amountInput = document.querySelector("#expense-amount");
  const dateInput = document.querySelector("#expense-date");
  const detailedFields = document.querySelector(".detailed-fields");
  const errorElement = document.querySelector("#expense-error");

  if (!modal || !form) return;

  document.querySelectorAll("[data-entry-mode]").forEach(button => {
    button.addEventListener("click", () => {
      const mode = button.dataset.entryMode;

      document.querySelectorAll("[data-entry-mode]").forEach(tab => {
        tab.classList.toggle("active", tab === button);
      });

      detailedFields.hidden = mode !== "detailed";

      if (mode === "detailed" && !dateInput.value) {
        dateInput.value = getLocalDateString();
      }
    });
  });

  const close = () => onClose?.();

  modal.querySelector("[data-close-modal]").addEventListener("click", close);

  modal.addEventListener("click", event => {
    if (event.target === modal) close();
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    errorElement.textContent = "";

    const formData = new FormData(form);
    const isDetailed = !detailedFields.hidden;

    const data = {
      amount: formData.get("amount"),
      location: formData.get("location"),
      category: formData.get("category"),
      date: isDetailed
        ? formData.get("date")
        : getLocalDateString(),
      note: isDetailed ? formData.get("note") : ""
    };

    const saveButton = form.querySelector(".save-expense-button");

    try {
      saveButton.disabled = true;
      saveButton.textContent = "Saving...";

      await onSave(formData.get("id"), data);
    } catch (error) {
      errorElement.textContent = error.message || "Unable to save expense.";
      saveButton.disabled = false;
      saveButton.textContent = "Try Again";
    }
  });

  amountInput?.focus();
}
