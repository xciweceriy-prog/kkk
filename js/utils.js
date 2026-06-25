/* =========================================================
   utils.js
   Small, pure helper functions used across the app.
   ========================================================= */

const Utils = {
  /** Format a number as currency using the configured locale/symbol. */
  formatCurrency(amount) {
    const value = Number(amount) || 0;
    try {
      return new Intl.NumberFormat(CONFIG.CURRENCY.locale, {
        style: "currency",
        currency: CONFIG.CURRENCY.code,
        minimumFractionDigits: 2,
      }).format(value);
    } catch (e) {
      // Fallback if locale/currency code is unsupported
      return `${CONFIG.CURRENCY.symbol}${value.toFixed(2)}`;
    }
  },

  /** Format an ISO date string as "Jan 5, 2026" */
  formatDate(isoDate) {
    if (!isoDate) return "";
    const d = new Date(isoDate + "T00:00:00");
    if (isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  },

  /** Returns "YYYY-MM" for a given ISO date string. */
  monthKey(isoDate) {
    return (isoDate || "").slice(0, 7);
  },

  /** Human readable month label, e.g. "January 2026" from "2026-01" */
  monthLabel(monthKey) {
    const [y, m] = monthKey.split("-").map(Number);
    if (!y || !m) return monthKey;
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  },

  /** Generate a reasonably unique id without external libraries. */
  generateId() {
    return `txn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  },

  /** Today's date in YYYY-MM-DD, suitable for <input type="date">. */
  todayISO() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  },

  /**
   * Validate a transaction payload.
   * Returns { valid: boolean, errors: { field: message } }
   */
  validateTransaction(data) {
    const errors = {};

    if (!data.title || !data.title.trim()) {
      errors.title = "Please enter a title for this transaction.";
    }

    const amount = parseFloat(data.amount);
    if (data.amount === "" || data.amount === null || data.amount === undefined) {
      errors.amount = "Please enter an amount.";
    } else if (isNaN(amount)) {
      errors.amount = "Amount must be a valid number.";
    } else if (amount <= 0) {
      errors.amount = "Amount must be greater than zero.";
    }

    if (!data.type || !["Income", "Expense"].includes(data.type)) {
      errors.type = "Please choose Income or Expense.";
    }

    if (!data.category || !data.category.trim()) {
      errors.category = "Please choose a category.";
    }

    if (!data.date) {
      errors.date = "Please choose a date.";
    }

    return { valid: Object.keys(errors).length === 0, errors };
  },

  /** Debounce helper, used for the search input. */
  debounce(fn, delay = 250) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  /** Escape text before inserting into innerHTML to avoid markup injection. */
  escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  },
};
