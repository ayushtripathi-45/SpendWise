
const CATEGORIES = ["food", "study", "travel", "other"];

const LOCATIONS = ["tuck-shop", "outside-college"];

const HISTOGRAM_BINS = [
  { label: "₹0–50", min: 0, max: 50 },
  { label: "₹51–100", min: 50, max: 100 },
  { label: "₹101–250", min: 100, max: 250 },
  { label: "₹251–500", min: 250, max: 500 },
  { label: "₹500+", min: 500, max: Infinity }
];

function getMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function getExpensesForMonth(expenses, monthKey) {
  return expenses.filter(expense => expense.date.startsWith(monthKey));
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getLocationKey(location) {
  return LOCATIONS.includes(location) ? location : null;
}

function getCategoryKey(category) {
  return CATEGORIES.includes(category) ? category : null;
}

function sumAmounts(expenses) {
  return expenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0
  );
}

export function calculateAnalytics(
  expenses,
  selectedMonth = getMonthKey(),
  now = new Date()
) {
  const [year, month] = selectedMonth.split("-").map(Number);
  const monthIndex = month - 1;

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error("Invalid month. Expected YYYY-MM.");
  }

  const monthExpenses = getExpensesForMonth(expenses, selectedMonth);

  const overallSpending = sumAmounts(expenses);
  const monthlySpending = sumAmounts(monthExpenses);

  const todayKey = getDateKey(now);

  const todaySpending = sumAmounts(
    expenses.filter(expense => expense.date === todayKey)
  );

  const daysInMonth = getDaysInMonth(year, monthIndex);

  const currentMonthKey = getMonthKey(now);

  let elapsedDays = 0;

  if (selectedMonth < currentMonthKey) {
    elapsedDays = daysInMonth;
  } else if (selectedMonth === currentMonthKey) {
    elapsedDays = now.getDate();
  }

  const calendarDailyAverage =
    elapsedDays > 0 ? monthlySpending / elapsedDays : 0;

  const activeDays = new Set(
    monthExpenses.map(expense => expense.date)
  ).size;

  const activeDayAverage =
    activeDays > 0 ? monthlySpending / activeDays : 0;

  const averagePerTransaction =
    monthExpenses.length > 0
      ? monthlySpending / monthExpenses.length
      : 0;

  // Daily spending for every calendar day in the selected month.
  const dailyTotals = new Map();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${selectedMonth}-${String(day).padStart(2, "0")}`;
    dailyTotals.set(date, 0);
  }

  monthExpenses.forEach(expense => {
    if (dailyTotals.has(expense.date)) {
      dailyTotals.set(
        expense.date,
        dailyTotals.get(expense.date) + Number(expense.amount || 0)
      );
    }
  });

  const dailyBreakdown = Array.from(dailyTotals, ([date, amount]) => ({
    date,
    day: Number(date.slice(-2)),
    amount
  }));

  // Location and category comparison.
  const locationCategoryBreakdown = LOCATIONS.map(location => {
    const values = {};

    CATEGORIES.forEach(category => {
      values[category] = sumAmounts(
        monthExpenses.filter(
          expense =>
            getLocationKey(expense.location) === location &&
            getCategoryKey(expense.category) === category
        )
      );
    });

    return {
      location,
      ...values
    };
  });

  // Category totals.
  const categoryBreakdown = CATEGORIES.map(category => ({
    category,
    amount: sumAmounts(
      monthExpenses.filter(
        expense => getCategoryKey(expense.category) === category
      )
    )
  }));

  // Transaction size histogram.
  const histogram = HISTOGRAM_BINS.map(bin => {
    const count = monthExpenses.filter(expense => {
      const amount = Number(expense.amount);

      if (!Number.isFinite(amount) || amount < 0) {
        return false;
      }

      if (bin.max === Infinity) {
        return amount > 500;
      }

      return bin.min === 0
  ? amount >= 0 && amount <= bin.max
  : amount > bin.min && amount <= bin.max;
    }).length;

    return {
      label: bin.label,
      count
    };
  });

  return {
    selectedMonth,
    overallSpending,
    monthlySpending,
    todaySpending,
    transactionCount: monthExpenses.length,
    allTimeTransactionCount: expenses.length,
    daysInMonth,
    elapsedDays,
    activeDays,
    calendarDailyAverage,
    activeDayAverage,
    averagePerTransaction,
    dailyBreakdown,
    locationCategoryBreakdown,
    categoryBreakdown,
    histogram
  };
}

export function getCurrentMonth() {
  return getMonthKey();
}

export function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric"
  });
}
