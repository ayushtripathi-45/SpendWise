
const THEME_KEY = "expense-tracker-theme";

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}

export function toggleTheme() {
  const current = getTheme();
  const next = current === "light" ? "dark" : "light";

  applyTheme(next);
  return next;
}
