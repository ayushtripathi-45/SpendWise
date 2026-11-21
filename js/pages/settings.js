
import { formatCurrency } from "../utils/currency.js";
import { applyTheme } from "../theme.js";
import { fetchExpenses } from "../modules/expense-manager.js";
import { exportJSON, exportCSV, importBackupFile } from "../modules/backup.js";
import { clearExpenses } from "../database/db.js";

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function getPreference(key, fallback) {
  return localStorage.getItem(key) || fallback;
}

export function renderSettingsPage() {
  const currentTheme = getPreference("expense-tracker-theme", "light");
  const defaultLocation = getPreference("expense-pref-location", "tuck-shop");
  const defaultCategory = getPreference("expense-pref-category", "food");
  const dateFormat = getPreference("expense-pref-dateformat", "DD/MM/YYYY");

  return `
    <div class="settings-page">

      <section class="settings-section">
        <h2>Appearance</h2>
        <p class="settings-desc">Choose how ExpenseFlow looks.</p>

        <div class="choice-grid">
          <label class="choice-option">
            <input type="radio" name="settings-theme" value="light"
              ${currentTheme === "light" ? "checked" : ""}>
            <span>☀ Light</span>
          </label>
          <label class="choice-option">
            <input type="radio" name="settings-theme" value="dark"
              ${currentTheme === "dark" ? "checked" : ""}>
            <span>🌙 Dark</span>
          </label>
        </div>
      </section>

      <section class="settings-section">
        <h2>Expense Preferences</h2>
        <p class="settings-desc">Set defaults for Quick Add. You can still override them while adding an expense.</p>

        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Default Location</strong>
            <span>Pre-selected location when adding expenses</span>
          </div>
        </div>
        <div class="choice-grid" style="margin-bottom: 18px;">
          <label class="choice-option">
            <input type="radio" name="settings-location" value="tuck-shop"
              ${defaultLocation === "tuck-shop" ? "checked" : ""}>
            <span>Tuck Shop</span>
          </label>
          <label class="choice-option">
            <input type="radio" name="settings-location" value="outside-college"
              ${defaultLocation === "outside-college" ? "checked" : ""}>
            <span>Outside College</span>
          </label>
        </div>

        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Default Category</strong>
            <span>Pre-selected category when adding expenses</span>
          </div>
        </div>
        <div class="choice-grid category-grid">
          ${[
            ["food", "Food"],
            ["study", "Study"],
            ["travel", "Travel"],
            ["other", "Other"]
          ].map(([value, label]) => `
            <label class="choice-option">
              <input type="radio" name="settings-category" value="${value}"
                ${defaultCategory === value ? "checked" : ""}>
              <span>${label}</span>
            </label>
          `).join("")}
        </div>
      </section>

      <section class="settings-section">
        <h2>Regional Preferences</h2>
        <p class="settings-desc">Currency and date display settings.</p>

        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Currency</strong>
            <span>Display currency for all amounts</span>
          </div>
          <div class="settings-row-value">INR (₹)</div>
        </div>

        <div class="settings-row" style="border-bottom: none; padding-bottom: 10px;">
          <div class="settings-row-label">
            <strong>Date Format</strong>
            <span>How dates are displayed across the app</span>
          </div>
        </div>
        <div class="choice-grid">
          <label class="choice-option">
            <input type="radio" name="settings-dateformat" value="DD/MM/YYYY"
              ${dateFormat === "DD/MM/YYYY" ? "checked" : ""}>
            <span>DD/MM/YYYY</span>
          </label>
          <label class="choice-option">
            <input type="radio" name="settings-dateformat" value="YYYY-MM-DD"
              ${dateFormat === "YYYY-MM-DD" ? "checked" : ""}>
            <span>YYYY-MM-DD</span>
          </label>
        </div>
      </section>

      <section class="settings-section">
        <h2>Data & Storage</h2>
        <p class="settings-desc">View your data summary and manage backups.</p>

        <div class="settings-stats">
          <div class="settings-stat">
            <span>Total Expenses</span>
            <strong id="settings-total-expenses">—</strong>
          </div>
          <div class="settings-stat">
            <span>Total Spent</span>
            <strong id="settings-total-amount">—</strong>
          </div>
          <div class="settings-stat">
            <span>Storage</span>
            <strong id="settings-storage-status">—</strong>
          </div>
        </div>

        <div class="settings-actions-grid">
          <button type="button" id="settings-export-json">Export JSON</button>
          <button type="button" id="settings-export-csv">Export CSV</button>
          <button type="button" id="settings-import-json">Import JSON</button>
          <button type="button" id="settings-import-csv">Import CSV</button>
        </div>

        <input type="file" id="settings-file-json" accept=".json,application/json" hidden>
        <input type="file" id="settings-file-csv" accept=".csv,text/csv" hidden>
      </section>

      <section class="settings-section danger-zone">
        <h2>Danger Zone</h2>
        <p class="settings-desc">Irreversible actions. Proceed with caution.</p>

        <button type="button" class="danger-btn" id="settings-clear-all">
          Clear All Expenses
        </button>
        <p class="settings-desc" style="margin-top: 12px; margin-bottom: 0;">
          This will permanently delete all your expense records. This action cannot be undone.
        </p>
      </section>

      <section class="settings-section">
        <h2>Application</h2>
        <div class="settings-app-info">
          <div class="app-info-row">
            <span>Application</span>
            <span>ExpenseFlow</span>
          </div>
          <div class="app-info-row">
            <span>Version</span>
            <span>1.0.0</span>
          </div>
          <div class="app-info-row">
            <span>Storage</span>
            <span>IndexedDB</span>
          </div>
          <div class="app-info-row">
            <span>Status</span>
            <span class="status-active">Active</span>
          </div>
        </div>
      </section>

    </div>
  `;
}

export function initSettingsPage(deps) {
  const { showToast, renderApp } = deps;

  // Theme
  document.querySelectorAll('[name="settings-theme"]').forEach(radio => {
    radio.addEventListener("change", () => {
      applyTheme(radio.value);
      renderApp();
    });
  });

  // Default location
  document.querySelectorAll('[name="settings-location"]').forEach(radio => {
    radio.addEventListener("change", () => {
      localStorage.setItem("expense-pref-location", radio.value);
      showToast("Default location updated.");
    });
  });

  // Default category
  document.querySelectorAll('[name="settings-category"]').forEach(radio => {
    radio.addEventListener("change", () => {
      localStorage.setItem("expense-pref-category", radio.value);
      showToast("Default category updated.");
    });
  });

  // Date format
  document.querySelectorAll('[name="settings-dateformat"]').forEach(radio => {
    radio.addEventListener("change", () => {
      localStorage.setItem("expense-pref-dateformat", radio.value);
      showToast("Date format updated.");
    });
  });

  // Data stats
  (async () => {
    try {
      const expenses = await fetchExpenses();
      const total = expenses.reduce((sum, e) => sum + e.amount, 0);

      const countEl = document.querySelector("#settings-total-expenses");
      const amountEl = document.querySelector("#settings-total-amount");
      const storageEl = document.querySelector("#settings-storage-status");

      if (countEl) countEl.textContent = expenses.length;
      if (amountEl) amountEl.textContent = formatCurrency(total);
      if (storageEl) storageEl.textContent = window.indexedDB ? "Available" : "Unavailable";
    } catch {
      // Silently fail — stats remain as "—"
    }
  })();

  // Export JSON
  document.querySelector("#settings-export-json")?.addEventListener("click", async () => {
    try {
      const count = await exportJSON();
      showToast(`JSON backup exported (${count} expenses).`);
    } catch (error) {
      showToast(error.message || "Could not export JSON backup.");
    }
  });

  // Export CSV
  document.querySelector("#settings-export-csv")?.addEventListener("click", async () => {
    try {
      const count = await exportCSV();
      showToast(`CSV exported (${count} expenses).`);
    } catch (error) {
      showToast(error.message || "Could not export CSV.");
    }
  });

  // Import JSON
  const jsonFileInput = document.querySelector("#settings-file-json");
  document.querySelector("#settings-import-json")?.addEventListener("click", () => {
    jsonFileInput?.click();
  });
  jsonFileInput?.addEventListener("change", async () => {
    const file = jsonFileInput.files?.[0];
    if (!file) return;
    try {
      const result = await importBackupFile(file, "merge");
      showToast(`Import complete: ${result.added} added, ${result.skipped} skipped.`);
      jsonFileInput.value = "";
      await renderApp();
    } catch (error) {
      showToast(error.message || "Import failed.");
      jsonFileInput.value = "";
    }
  });

  // Import CSV
  const csvFileInput = document.querySelector("#settings-file-csv");
  document.querySelector("#settings-import-csv")?.addEventListener("click", () => {
    csvFileInput?.click();
  });
  csvFileInput?.addEventListener("change", async () => {
    const file = csvFileInput.files?.[0];
    if (!file) return;
    try {
      const result = await importBackupFile(file, "merge");
      showToast(`Import complete: ${result.added} added, ${result.skipped} skipped.`);
      csvFileInput.value = "";
      await renderApp();
    } catch (error) {
      showToast(error.message || "Import failed.");
      csvFileInput.value = "";
    }
  });

  // Clear all expenses
  document.querySelector("#settings-clear-all")?.addEventListener("click", async () => {
    const first = window.confirm(
      "Are you sure you want to clear all expenses? This cannot be undone."
    );
    if (!first) return;

    const second = window.confirm(
      "Final confirmation: ALL expense records will be permanently deleted. Continue?"
    );
    if (!second) return;

    try {
      await clearExpenses();
      showToast("All expenses cleared successfully.");
      await renderApp();
    } catch (error) {
      showToast(error.message || "Could not clear expenses.");
    }
  });
}
