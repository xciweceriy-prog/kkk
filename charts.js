/* =========================================================
   charts.js
   Owns the two Chart.js instances on the dashboard:
     - Income vs Expense doughnut chart
     - Monthly spending bar chart
   ========================================================= */

const Charts = {
  pieChart: null,
  barChart: null,

  _palette() {
    const isLight = document.body.classList.contains("light");
    return {
      grid: isLight ? "rgba(15, 23, 42, 0.08)" : "rgba(226, 232, 240, 0.08)",
      text: isLight ? "#475569" : "#94a3b8",
      income: "#22c97a",
      expense: "#fb5c6a",
      balance: "#5b8def",
    };
  },

  initPieChart(income, expense) {
    const ctx = document.getElementById("pieChart");
    if (!ctx) return;
    const c = this._palette();

    if (this.pieChart) {
      this.pieChart.data.datasets[0].data = [income, expense];
      this.pieChart.update();
      return;
    }

    this.pieChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Income", "Expense"],
        datasets: [
          {
            data: [income, expense],
            backgroundColor: [c.income, c.expense],
            borderWidth: 0,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        cutout: "68%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: c.text, font: { family: "Poppins", size: 12 }, padding: 16 },
          },
        },
        animation: { animateScale: true, duration: 700 },
      },
    });
  },

  initBarChart(monthLabels, monthIncome, monthExpense) {
    const ctx = document.getElementById("barChart");
    if (!ctx) return;
    const c = this._palette();

    if (this.barChart) {
      this.barChart.data.labels = monthLabels;
      this.barChart.data.datasets[0].data = monthIncome;
      this.barChart.data.datasets[1].data = monthExpense;
      this.barChart.update();
      return;
    }

    this.barChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: monthLabels,
        datasets: [
          {
            label: "Income",
            data: monthIncome,
            backgroundColor: c.income,
            borderRadius: 6,
            maxBarThickness: 18,
          },
          {
            label: "Expense",
            data: monthExpense,
            backgroundColor: c.expense,
            borderRadius: 6,
            maxBarThickness: 18,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: c.text, font: { family: "Poppins", size: 12 }, padding: 16 },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: c.text, font: { family: "Poppins" } } },
          y: {
            grid: { color: c.grid },
            ticks: { color: c.text, font: { family: "Poppins" }, callback: (v) => Utils.formatCurrency(v) },
          },
        },
        animation: { duration: 700, easing: "easeOutQuart" },
      },
    });
  },

  /** Re-theme existing charts after a dark/light toggle without rebuilding them. */
  refreshTheme() {
    const c = this._palette();
    if (this.pieChart) {
      this.pieChart.data.datasets[0].backgroundColor = [c.income, c.expense];
      this.pieChart.options.plugins.legend.labels.color = c.text;
      this.pieChart.update();
    }
    if (this.barChart) {
      this.barChart.data.datasets[0].backgroundColor = c.income;
      this.barChart.data.datasets[1].backgroundColor = c.expense;
      this.barChart.options.plugins.legend.labels.color = c.text;
      this.barChart.options.scales.x.ticks.color = c.text;
      this.barChart.options.scales.y.ticks.color = c.text;
      this.barChart.options.scales.y.grid.color = c.grid;
      this.barChart.update();
    }
  },
};
