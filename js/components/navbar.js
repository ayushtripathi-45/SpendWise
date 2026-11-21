
import { toggleTheme, getTheme } from "../theme.js";

function themeIcon(theme) {
  if (theme === "dark") {
    return `
      <svg viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round">
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2"
      stroke-linecap="round">
      <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>
    </svg>
  `;
}

export function renderNavbar() {
  return `
    <header class="top-navbar">
      <div class="navbar-left">
        <span class="navbar-date" id="current-date"></span>
      </div>

      <div class="navbar-actions">
        <button
          class="icon-button"
          id="theme-toggle"
          type="button"
          aria-label="Toggle color theme"
          title="Toggle theme"
        >
          ${themeIcon(getTheme())}
        </button>

        <div class="profile-avatar" title="Personal account">
          A
        </div>
      </div>
    </header>
  `;
}

export function initNavbar() {
  const themeButton = document.querySelector("#theme-toggle");

  themeButton?.addEventListener("click", () => {
    const nextTheme = toggleTheme();

    themeButton.innerHTML = themeIcon(nextTheme);
    themeButton.setAttribute(
      "aria-label",
      `Switch to ${nextTheme === "dark" ? "light" : "dark"} theme`
    );
  });

  const dateElement = document.querySelector("#current-date");

  if (dateElement) {
    dateElement.textContent = new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date());
  }
}
