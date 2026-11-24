
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
 * Renders the Incoming Money Modal for recording money received/returned.
 */
export function renderIncomingMoneyModal(item = null, defaultDate = "") {
  const isEditing = Boolean(item);
  const amount = item?.amount ?? "";
  const fromPerson = item?.fromPerson ?? "";
  const reason = item?.reason ?? "";
  const date = item?.date || defaultDate || getLocalDateString();

  return `
    <div class="modal-overlay" id="incoming-money-modal">
      <section class="expense-modal" role="dialog" aria-modal="true" aria-labelledby="incoming-modal-title">
        <header class="modal-header">
          <div>
            <h2 id="incoming-modal-title">
              ${isEditing ? "Edit Incoming Money" : "Add Incoming Money"}
            </h2>
            <p>Money received, returned loans, or allowances automatically add to your remaining budget.</p>
          </div>
          <button type="button" class="modal-close" data-close-incoming-modal aria-label="Close">×</button>
        </header>

        <form id="incoming-money-form" novalidate>
          <input type="hidden" name="id" value="${escapeHTML(item?.id || "")}">

          <div class="amount-field">
            <label for="incoming-amount">Incoming Amount (₹)</label>
            <div class="amount-input">
              <span style="color: #10B981;">+₹</span>
              <input
                id="incoming-amount"
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
            <label for="incoming-from">From Person / Source</label>
            <input
              class="form-input"
              id="incoming-from"
              name="fromPerson"
              type="text"
              maxlength="100"
              placeholder="e.g. Rahul, Priya, Mom, Roommate"
              value="${escapeHTML(fromPerson)}"
              required
            />
          </div>

          <div class="form-field">
            <label for="incoming-reason">Reason / Note</label>
            <input
              class="form-input"
              id="incoming-reason"
              name="reason"
              type="text"
              maxlength="200"
              placeholder="e.g. Returned yesterday's canteen bill, Split auto fare"
              value="${escapeHTML(reason)}"
              required
            />
          </div>

          <div class="form-field">
            <label for="incoming-date">Received Date</label>
            <input
              class="form-input"
              id="incoming-date"
              name="date"
              type="date"
              value="${escapeHTML(date)}"
              required
            />
          </div>

          <p class="form-error" id="incoming-error" role="alert"></p>

          <button class="save-expense-button" type="submit" id="save-incoming-btn">
            ${isEditing ? "Update Incoming Money" : "+ Add to Remaining Budget"}
          </button>
        </form>
      </section>
    </div>
  `;
}

export function initIncomingMoneyModal({ onSave, onClose }) {
  const modal = document.querySelector("#incoming-money-modal");
  const form = document.querySelector("#incoming-money-form");
  const amountInput = document.querySelector("#incoming-amount");
  const errorElement = document.querySelector("#incoming-error");

  if (!modal || !form) return;

  const close = () => onClose?.();

  modal.querySelector("[data-close-incoming-modal]")?.addEventListener("click", close);

  modal.addEventListener("click", event => {
    if (event.target === modal) close();
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    errorElement.textContent = "";

    const formData = new FormData(form);
    const id = formData.get("id");
    const data = {
      amount: formData.get("amount"),
      fromPerson: formData.get("fromPerson"),
      reason: formData.get("reason"),
      date: formData.get("date")
    };

    const saveButton = form.querySelector("#save-incoming-btn");

    try {
      saveButton.disabled = true;
      saveButton.textContent = "Saving...";
      await onSave(id, data);
    } catch (error) {
      errorElement.textContent = error.message || "Unable to save incoming money.";
      saveButton.disabled = false;
      saveButton.textContent = "Try Again";
    }
  });

  amountInput?.focus();
}
