
import Chart from "chart.js/auto";
import { formatCurrency } from "../utils/currency.js";

const chartInstances = {};

const COLORS = {
  emerald: "#10B981",
  emeraldLight: "#A7F3D0",
  blue: "#3B82F6",
  amber: "#F59E0B",
  purple: "#8B5CF6",
  slate: "#64748B",
  red: "#EF4444"
};

const CATEGORY_LABELS = {
  food: "Food",
  study: "Study",
  travel: "Travel",
  other: "Other"
};

const LOCATION_LABELS = {
  "tuck-shop": "Tuck Shop",
  "outside-college": "Outside College"
};

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

function createChart(id, config) {
  const canvas = document.getElementById(id);

  if (!canvas) return;

  destroyChart(id);

  chartInstances[id] = new Chart(canvas, {
    responsive: true,
    maintainAspectRatio: false,
    ...config
  });
}

const currencyAxis = {
  ticks: {
    callback(value) {
      return `₹${Number(value).toLocaleString("en-IN")}`;
    }
  },
  grid: {
    color: "rgba(148, 163, 184, 0.12)"
  }
};

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        usePointStyle: true,
        boxWidth: 8,
        padding: 18,
        font: {
          family: "Inter",
          size: 11
        }
      }
    }
  }
};

export function renderLocationCategoryChart(analytics) {
  createChart("location-category-chart", {
    type: "bar",
    data: {
      labels: ["Food", "Study", "Travel", "Other"],
      datasets: analytics.locationCategoryBreakdown.map((item, index) => ({
        label: LOCATION_LABELS[item.location],
        data: ["food", "study", "travel", "other"].map(
          category => item[category]
        ),
        backgroundColor: index === 0 ? COLORS.emerald : COLORS.blue,
        borderRadius: 5,
        maxBarThickness: 35
      }))
    },
    options: {
      ...commonOptions,
      scales: {
        x: {
          grid: { display: false }
        },
        y: currencyAxis
      }
    }
  });
}

export function renderDailyTrendChart(analytics) {
  const labels = analytics.dailyBreakdown.map(item => item.day);

  const spending = analytics.dailyBreakdown.map(item => item.amount);

  const average = labels.map(() => analytics.calendarDailyAverage);

  createChart("daily-trend-chart", {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Daily Spending",
          data: spending,
          borderColor: COLORS.emerald,
          backgroundColor: "rgba(16, 185, 129, 0.12)",
          fill: true,
          tension: 0.35,
          pointRadius: 2,
          pointHoverRadius: 5
        },
        {
          label: "Calendar Daily Average",
          data: average,
          borderColor: COLORS.red,
          borderDash: [6, 5],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          tension: 0
        }
      ]
    },
    options: {
      ...commonOptions,
      interaction: {
        intersect: false,
        mode: "index"
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Day of month"
          },
          grid: { display: false }
        },
        y: {
          ...currencyAxis,
          beginAtZero: true
        }
      }
    }
  });
}

export function renderHistogramChart(analytics) {
  createChart("expense-histogram-chart", {
    type: "bar",
    data: {
      labels: analytics.histogram.map(item => item.label),
      datasets: [{
        label: "Transactions",
        data: analytics.histogram.map(item => item.count),
        backgroundColor: COLORS.purple,
        borderRadius: 3,
        categoryPercentage: 1,
        barPercentage: 1
      }]
    },
    options: {
      ...commonOptions,
      scales: {
        x: {
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          },
          grid: {
            color: "rgba(148, 163, 184, 0.12)"
          }
        }
      }
    }
  });
}

export function renderCategoryChart(analytics) {
  createChart("category-share-chart", {
    type: "doughnut",
    data: {
      labels: analytics.categoryBreakdown.map(
        item => CATEGORY_LABELS[item.category]
      ),
      datasets: [{
        data: analytics.categoryBreakdown.map(item => item.amount),
        backgroundColor: [
          COLORS.emerald,
          COLORS.blue,
          COLORS.amber,
          COLORS.purple
        ],
        borderWidth: 0,
        hoverOffset: 5
      }]
    },
    options: {
      ...commonOptions,
      cutout: "68%",
      plugins: {
        ...commonOptions.plugins,
        tooltip: {
          callbacks: {
            label(context) {
              const total = analytics.monthlySpending;
              const value = Number(context.raw || 0);
              const percentage = total > 0
                ? ((value / total) * 100).toFixed(1)
                : "0.0";

              return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

export function renderAllCharts(analytics) {
  renderLocationCategoryChart(analytics);
  renderDailyTrendChart(analytics);
  renderHistogramChart(analytics);
  renderCategoryChart(analytics);
}

export function destroyAllCharts() {
  Object.keys(chartInstances).forEach(destroyChart);
}
