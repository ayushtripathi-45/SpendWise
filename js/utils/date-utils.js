
export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatDate(date) {
  const [year, month, day] = date.split("-").map(Number);
  const format = localStorage.getItem("expense-pref-dateformat") || "DD/MM/YYYY";

  if (format === "YYYY-MM-DD") {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const d = String(day).padStart(2, "0");
  const m = String(month).padStart(2, "0");
  return `${d}/${m}/${year}`;
}
