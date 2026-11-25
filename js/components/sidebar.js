
const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { id: "transactions", label: "Transactions", icon: "receipt" },
  { id: "cash", label: "Cash Money", icon: "banknote" },
  { id: "budgets", label: "Budgets", icon: "wallet" },
  { id: "analytics", label: "Analytics", icon: "chart-no-axes-combined" },
  { id: "categories", label: "Categories", icon: "tags" },
  { id: "settings", label: "Settings", icon: "settings" },
  { id: "backup", label: "Backup", icon: "database" }
];

function icon(name) {
  const icons = {
    "layout-dashboard": '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/>',
    receipt: '<path d="M4 2h16v20l-4-2-4 2-4-2-4 2z"/><path d="M8 8h8M8 12h8M8 16h4"/>',
    banknote: '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
    "chart-no-axes-combined": '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-6 6"/><path d="M17 9h2v2"/>',
    tags: '<path d="M20 13 13 20a2 2 0 0 1-3 0l-7-7V3h10l7 7a2 2 0 0 1 0 3Z"/><circle cx="7.5" cy="7.5" r=".5"/>',
    wallet: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M16 15h2"/><path d="M7 5V3h12v2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.7-1.4-2.4 1.4-1.1a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.7 1.4 2.4-1.4 1.1a8 8 0 0 1 0 2Z"/>'
  };

  return `<svg viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.8"
    stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true">${icons[name] || ""}</svg>`;
}

function navLink(item, activePage) {
  const active = item.id === activePage;

  return `
    <button
      class="nav-item ${active ? "active" : ""}"
      data-page="${item.id}"
      ${active ? 'aria-current="page"' : ""}
      type="button"
    >
      ${icon(item.icon)}
      <span>${item.label}</span>
    </button>
  `;
}

export function renderSidebar(activePage = "dashboard") {
  return `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-icon">₹</div>
        <div class="brand-text">
          <strong>ExpenseFlow</strong>
          <span>PERSONAL FINANCE</span>
        </div>
      </div>

      <div class="sidebar-label">MENU</div>

      <nav class="sidebar-nav" aria-label="Main navigation">
        ${navigationItems.map(item => navLink(item, activePage)).join("")}
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-footer-icon">₹</div>
        <div>
          <strong>Personal Tracker</strong>
          <span>Local & private</span>
        </div>
      </div>
    </aside>
  `;
}

export function renderMobileNav(activePage = "dashboard") {
  const mobileItems = [
    navigationItems[0], // Dashboard
    navigationItems[1], // Transactions
    navigationItems[2], // Cash Money
    navigationItems[3], // Budgets
    navigationItems[4]  // Analytics
  ];

  return `
    <nav class="mobile-nav" aria-label="Mobile navigation" style="grid-template-columns: repeat(5, 1fr);">
      ${mobileItems.map(item => navLink(item, activePage)).join("")}
    </nav>
  `;
}
