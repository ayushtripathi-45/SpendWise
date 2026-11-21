
import { formatCurrency } from "../utils/currency.js";
import { formatMonthLabel } from "../modules/analytics.js";

export function renderAnalyticsPage(analytics) {
  const selectedMonth = analytics.selectedMonth;

  const cards = [
    {
      label: "Monthly Spending",
      value: formatCurrency(analytics.monthlySpending),
      description: `${analytics.transactionCount} transactions`
    },
    {
      label: "Today's Spending",
      value: formatCurrency(analytics.todaySpending),
      description: "All expenses logged today"
    },
    {
      label: "Calendar Daily Average",
      value: formatCurrency(analytics.calendarDailyAverage),
      description: `${analytics.elapsedDays} elapsed days`
    },
    {
      label: "Active-Day Average",
      value: formatCurrency(analytics.activeDayAverage),
      description: `${analytics.activeDays} days with expenses`
    },
    {
      label: "Average per Transaction",
      value: formatCurrency(analytics.averagePerTransaction),
      description: "Monthly total ÷ transactions"
    },
    {
      label: "Overall Spending",
      value: formatCurrency(analytics.overallSpending),
      description: "All-time spending"
    }
  ];

  return `
    <section class="analytics-page">

      <div class="analytics-month-control">
        <div>
          <h2>${formatMonthLabel(selectedMonth)}</h2>
          <p>Spending analysis for the selected month</p>
        </div>

        <input
          type="month"
          id="analytics-month"
          class="form-input analytics-month-input"
          value="${selectedMonth}"
          aria-label="Select analytics month"
        />
      </div>

      <section class="analytics-metrics">
        ${cards.map(card => `
          <article class="analytics-metric-card">
            <span>${card.label}</span>
            <strong>${card.value}</strong>
            <small>${card.description}</small>
          </article>
        `).join("")}
      </section>

      <section class="analytics-chart-grid">

        <article class="analytics-chart-card chart-wide">
          <div class="analytics-chart-heading">
            <div>
              <h3>Location vs Category</h3>
              <p>Compare where and why you spend</p>
            </div>
          </div>
          <div class="chart-container">
            <canvas id="location-category-chart"></canvas>
          </div>
        </article>

        <article class="analytics-chart-card chart-wide">
          <div class="analytics-chart-heading">
            <div>
              <h3>Daily Spending Trend</h3>
              <p>Daily expenses compared with calendar average</p>
            </div>
          </div>
          <div class="chart-container">
            <canvas id="daily-trend-chart"></canvas>
          </div>
        </article>

        <article class="analytics-chart-card">
          <div class="analytics-chart-heading">
            <div>
              <h3>Expense Size</h3>
              <p>Number of transactions by amount</p>
            </div>
          </div>
          <div class="chart-container">
            <canvas id="expense-histogram-chart"></canvas>
          </div>
        </article>

        <article class="analytics-chart-card">
          <div class="analytics-chart-heading">
            <div>
              <h3>Category Share</h3>
              <p>Percentage of monthly spending</p>
            </div>
          </div>
          <div class="chart-container">
            <canvas id="category-share-chart"></canvas>
          </div>
        </article>

      </section>

      <section class="analytics-note">
        <h3>Understanding your averages</h3>
        <p>
          <strong>Calendar Daily Average:</strong>
          Monthly spending divided by elapsed calendar days.
        </p>
        <p>
          <strong>Active-Day Average:</strong>
          Monthly spending divided by the number of days on which you
          recorded at least one expense.
        </p>
        <p>
          <strong>Average per Transaction:</strong>
          Monthly spending divided by the number of transactions.
        </p>
      </section>

    </section>
  `;
}
