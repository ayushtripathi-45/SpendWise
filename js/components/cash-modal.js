
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

/**
 * Modal for Adding / Editing Cash Transactions
 * defaultType: 'cash-out' (cash expense) or 'cash-in' (add cash/ATM)
 */
export function renderCashModal(item = null, defaultType = "cash-out") {
  const isEditing = Boolean(item);
  const type = item?.type || defaultType;
  const amount = item?.amount ?? "";
  const reason = item?.reason ?? "";
  const date = item?.date || getLocalDateString();

  return `
    <div class="modal-overlay" id="cash-modal">
      <section class="expense-modal" role="dialog" aria-modal="true" aria-labelledby="cash-modal-title">
        <header class="modal-header">
          <div>
            <h2 id="cash-modal-title">
              ${isEditing ? "Edit Cash Entry" : (type === "cash-in" ? "Add Cash / Wallet Top-Up" : "Record Cash Expense")}
            </h2>
            <p>${type === "cash-in" ? "Add cash you have in hand or withdrew from ATM." : "Track where your cash was spent to maintain remaining cash balance."}</p>
          </div>
          <button type="button" class="modal-close" data-close-cash-modal aria-label="Close">×</button>
        </header>

        <form id="cash-form" novalidate>
          <input type="hidden" name="id" value="${escapeHTML(item?.id || "")}">

          <!-- Transaction Type Toggle -->
          <div class="form-field">
            <label>Transaction Type</label>
            <div class="choice-grid">
              <label class="choice-option">
                <input type="radio" name="type" value="cash-out" ${type === "cash-out" ? "checked" : ""}>
                <span>💸 Cash Spent (Expense)</span>
              </label>
              <label class="choice-option">
                <input type="radio" name="type" value="cash-in" ${type === "cash-in" ? "checked" : ""}>
                <span>💵 Add Cash (In-Hand/ATM)</span>
              </label>
            </div>
          </div>

          <div class="amount-field">
            <label for="cash-amount" id="cash-amount-label">
              ${type === "cash-in" ? "Cash Amount Added (₹)" : "Cash Amount Spent (₹)"}
            </label>
            <div class="amount-input">
              <span id="cash-amount-prefix" style="color: ${type === "cash-in" ? "#10B981" : "#EF4444"};">
                ${type === "cash-in" ? "+₹" : "-₹"}
              </span>
              <input
                id="cash-amount"
                name="amount"
                type="number"
                inputmode="decimal"
                min="0.01"
                max="10000000"
                step="0.01"
                placeholder="0.00"
                value="${amount}"
                required
                autofocus
              />
            </div>
          </div>

          <div class="form-field">
            <label for="cash-reason" id="cash-reason-label">
              ${type === "cash-in" ? "Source / Note" : "Spent Where / Reason"}
            </label>
            <input
              class="form-input"
              id="cash-reason"
              name="reason"
              type="text"
              maxlength="200"
              placeholder="${type === "cash-in" ? "e.g. ATM withdrawal, Pocket money, In hand starting cash" : "e.g. Chai tapri, Auto rickshaw, Xerox printouts"}"
              value="${escapeHTML(reason)}"
              required
            />
          </div>

          <div class="form-field">
            <label for="cash-date">Date</label>
            <input
              class="form-input"
              id="cash-date"
              name="date"
              type="date"
              value="${escapeHTML(date)}"
              required
            />
          </div>

          <p class="form-error" id="cash-error" role="alert"></p>

          <button class="save-expense-button" type="submit" id="save-cash-btn">
            ${isEditing ? "Update Cash Record" : (type === "cash-in" ? "+ Add to Cash Balance" : "- Deduct from Cash Balance")}
          </button>
        </form>
      </section>
    </div>
  `;
}

export function initCashModal({ onSave, onClose }) {
  const modal = document.querySelector("#cash-modal");
  const form = document.querySelector("#cash-form");
  const amountInput = document.querySelector("#cash-amount");
  const amountLabel = document.querySelector("#cash-amount-label");
  const amountPrefix = document.querySelector("#cash-amount-prefix");
  const reasonLabel = document.querySelector("#cash-reason-label");
  const reasonInput = document.querySelector("#cash-reason");
  const saveBtn = document.querySelector("#save-cash-btn");
  const errorElement = document.querySelector("#cash-error");

  if (!modal || !form) return;

  const close = () => onClose?.();

  modal.querySelector("[data-close-cash-modal]")?.addEventListener("click", close);

  modal.addEventListener("click", event => {
    if (event.target === modal) close();
  });

  // Toggle dynamic text when radio type changes
  form.querySelectorAll('input[name="type"]').forEach(radio => {
    radio.addEventListener("change", () => {
      const isCashIn = radio.value === "cash-in";
      amountLabel.textContent = isCashIn ? "Cash Amount Added (₹)" : "Cash Amount Spent (₹)";
      amountPrefix.textContent = isCashIn ? "+₹" : "-₹";
      amountPrefix.style.color = isCashIn ? "#10B981" : "#EF4444";
      reasonLabel.textContent = isCashIn ? "Source / Note" : "Spent Where / Reason";
      reasonInput.placeholder = isCashIn
        ? "e.g. ATM withdrawal, Pocket money, In hand starting cash"
        : "e.g. Chai tapri, Auto rickshaw, Xerox printouts";
      saveBtn.textContent = isCashIn ? "+ Add to Cash Balance" : "- Deduct from Cash Balance";
    });
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    errorElement.textContent = "";

    const formData = new FormData(form);
    const id = formData.get("id");
    const data = {
      type: formData.get("type"),
      amount: formData.get("amount"),
      reason: formData.get("reason"),
      date: formData.get("date")
    };

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";
      await onSave(id, data);
    } catch (error) {
      errorElement.textContent = error.message || "Unable to save cash transaction.";
      saveBtn.disabled = false;
      saveBtn.textContent = "Try Again";
    }
  });

  amountInput?.focus();
}
