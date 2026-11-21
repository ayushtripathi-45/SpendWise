
import {
  exportJSON,
  exportCSV,
  importBackupFile
} from "../modules/backup.js";



export function renderBackupPage() {
  return `
    <section class="backup-page">

      <div class="backup-grid">
        <article class="backup-card">
          <div class="backup-icon">JSON</div>
          <h2>Full JSON Backup</h2>
          <p>
            Save all expense records in a restorable backup file.
            This is the recommended format for restoring your data.
          </p>
          <button class="primary-button" id="export-json">
            Export JSON Backup
          </button>
        </article>

        <article class="backup-card">
          <div class="backup-icon">CSV</div>
          <h2>Spreadsheet Export</h2>
          <p>
            Export your expenses as a CSV file that can be opened
            in Excel, Google Sheets, or other spreadsheet apps.
          </p>
          <button class="secondary-button" id="export-csv">
  Export CSV
</button>
        </article>

        <article class="backup-card backup-card-wide">
          <div class="backup-icon">↥</div>
          <h2>Restore or Import Data</h2>
          <p>
            Select a previous JSON backup or a CSV export.
            You can merge records or replace your current expense data.
          </p>

          <label class="file-picker" for="backup-file">
            <span>Choose JSON or CSV file</span>
            <input
              id="backup-file"
              type="file"
              accept=".json,.csv,application/json,text/csv"
            />
          </label>

          <p class="selected-file" id="selected-file">
            No file selected
          </p>

          <div class="import-actions">
            <button class="primary-button" id="import-merge" disabled>
              Merge with Existing Data
            </button>
            <button class="danger-button" id="import-replace" disabled>
              Replace All Data
            </button>
          </div>

          <p class="backup-warning">
            Replace All Data permanently removes your current expenses
            before restoring the selected file. Export a backup first.
          </p>
        </article>
      </div>
    </section>
  `;
}

export function initBackupPage(showToast) {
  const jsonButton = document.querySelector("#export-json");
  const csvButton = document.querySelector("#export-csv");
  const fileInput = document.querySelector("#backup-file");
  const selectedFile = document.querySelector("#selected-file");
  const mergeButton = document.querySelector("#import-merge");
  const replaceButton = document.querySelector("#import-replace");

  let selectedFileObject = null;

  jsonButton?.addEventListener("click", async () => {
    try {
      const count = await exportJSON();
      showToast(`JSON backup exported (${count} expenses).`);
    } catch (error) {
      showToast(error.message || "Could not export JSON backup.");
    }
  });

  csvButton?.addEventListener("click", async () => {
    try {
      const count = await exportCSV();
      showToast(`CSV exported (${count} expenses).`);
    } catch (error) {
      showToast(error.message || "Could not export CSV.");
    }
  });

  fileInput?.addEventListener("change", () => {
    selectedFileObject = fileInput.files?.[0] || null;

    selectedFile.textContent = selectedFileObject
      ? `${selectedFileObject.name} (${(
          selectedFileObject.size / 1024
        ).toFixed(1)} KB)`
      : "No file selected";

    mergeButton.disabled = !selectedFileObject;
    replaceButton.disabled = !selectedFileObject;
  });

  async function runImport(mode) {
    if (!selectedFileObject) {
      showToast("Choose a backup file first.");
      return;
    }

    const isReplace = mode === "replace";

    const message = isReplace
      ? "This will permanently delete all current expenses and replace them with the imported records. Continue?"
      : "Import these records and merge them with your current expenses? Existing IDs will be skipped.";

    if (!window.confirm(message)) return;

    if (isReplace) {
      const secondConfirmation = window.confirm(
        "Final confirmation: all current expense records will be erased. Continue?"
      );

      if (!secondConfirmation) return;
    }

    mergeButton.disabled = true;
    replaceButton.disabled = true;

    try {
      const result = await importBackupFile(
        selectedFileObject,
        mode
      );

      showToast(
        `Import complete: ${result.added} added, ${result.skipped} skipped.`
      );

      fileInput.value = "";
      selectedFileObject = null;
      selectedFile.textContent = "No file selected";
    } catch (error) {
      showToast(error.message || "Import failed.");
    } finally {
      mergeButton.disabled = !selectedFileObject;
      replaceButton.disabled = !selectedFileObject;
    }
  }

  mergeButton?.addEventListener("click", () => runImport("merge"));
  replaceButton?.addEventListener("click", () => runImport("replace"));
}
