/* =========================================================
   api.js
   Optional sync layer that talks to a Google Apps Script Web
   App (see google-apps-script/Code.gs) which in turn reads and
   writes a Google Sheet acting as the database.

   If CONFIG.SYNC_ENABLED is false or CONFIG.GOOGLE_SCRIPT_URL is
   empty, every method here resolves to a harmless no-op so the
   app keeps working purely from Local Storage (offline mode).
   ========================================================= */

const Api = {
  isConfigured() {
    return Boolean(CONFIG.SYNC_ENABLED && CONFIG.GOOGLE_SCRIPT_URL);
  },

  async _request(action, payload = {}) {
    if (!this.isConfigured()) {
      return { ok: false, offline: true };
    }
    try {
      const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, payload }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return { ok: true, data };
    } catch (err) {
      console.warn("Api request failed, falling back to offline mode:", err);
      return { ok: false, offline: true, error: err.message };
    }
  },

  /** Fetch all transactions stored in the linked Google Sheet. */
  async readTransactions() {
    if (!this.isConfigured()) return { ok: false, offline: true };
    try {
      const url = `${CONFIG.GOOGLE_SCRIPT_URL}?action=read`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return { ok: true, data };
    } catch (err) {
      console.warn("Api.readTransactions failed:", err);
      return { ok: false, offline: true, error: err.message };
    }
  },

  createTransaction(transaction) {
    return this._request("create", transaction);
  },

  updateTransaction(transaction) {
    return this._request("update", transaction);
  },

  deleteTransaction(id) {
    return this._request("delete", { id });
  },

  /**
   * Push every local transaction up to the sheet (simple "last write
   * wins" sync used for the optional Auto Sync feature).
   */
  async syncAll(transactions) {
    return this._request("sync", { transactions });
  },
};
