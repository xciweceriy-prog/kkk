/* =========================================================
   config.js
   Central place for app-wide settings.
   Edit the values below to point at your own Google Apps
   Script Web App and to tweak currency / theme defaults.
   ========================================================= */

const CONFIG = {
  // Paste the deployed Google Apps Script Web App URL here
  // (see google-apps-script/Code.gs + README.md for setup steps).
  // Leave empty to run in pure offline / Local Storage mode.
  GOOGLE_SCRIPT_URL: "",

  // Set to true once GOOGLE_SCRIPT_URL is filled in and you want
  // the app to sync with Google Sheets. False = Local Storage only.
  SYNC_ENABLED: false,

  APP_NAME: "Smart Finance Tracker",

  CURRENCY: {
    code: "USD",
    symbol: "$",
    locale: "en-US",
  },

  THEME: {
    default: "dark", // "dark" | "light"
    storageKey: "sft_theme",
  },

  STORAGE_KEYS: {
    transactions: "sft_transactions",
    lastSync: "sft_last_sync",
  },

  CATEGORIES: {
    Income: ["Salary", "Bonus", "Freelance", "Investment", "Other"],
    Expense: [
      "Food",
      "Transport",
      "Shopping",
      "Entertainment",
      "Education",
      "Bills",
      "Other",
    ],
  },
};

// Freeze so the rest of the app can't accidentally mutate settings.
Object.freeze(CONFIG.CURRENCY);
Object.freeze(CONFIG.THEME);
Object.freeze(CONFIG.STORAGE_KEYS);
Object.freeze(CONFIG.CATEGORIES);
Object.freeze(CONFIG);
