/* =========================================================
   storage.js
   Everything related to Local Storage persistence:
   reading/writing transactions, backup & restore, and the
   "offline mode" flag used when Google Sheets sync is off
   or unreachable.
   ========================================================= */

const Storage = {
  /** Read all transactions from Local Storage. */
  getAll() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.transactions);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Storage.getAll failed, resetting corrupted data.", e);
      return [];
    }
  },

  /** Overwrite the full transactions list. */
  saveAll(transactions) {
    localStorage.setItem(
      CONFIG.STORAGE_KEYS.transactions,
      JSON.stringify(transactions)
    );
  },

  /** Add a single transaction and persist. */
  add(transaction) {
    const all = this.getAll();
    all.unshift(transaction);
    this.saveAll(all);
    return all;
  },

  /** Update a transaction by id and persist. */
  update(id, updates) {
    const all = this.getAll();
    const index = all.findIndex((t) => t.id === id);
    if (index === -1) return all;
    all[index] = { ...all[index], ...updates };
    this.saveAll(all);
    return all;
  },

  /** Remove a transaction by id and persist. */
  remove(id) {
    const all = this.getAll().filter((t) => t.id !== id);
    this.saveAll(all);
    return all;
  },

  /** Export current transactions as a downloadable JSON backup. */
  backup() {
    const data = JSON.stringify(this.getAll(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smart-finance-backup-${Utils.todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  /** Restore transactions from a parsed JSON array (overwrites current data). */
  restore(transactionsArray) {
    if (!Array.isArray(transactionsArray)) {
      throw new Error("Backup file does not contain a valid transaction list.");
    }
    this.saveAll(transactionsArray);
    return transactionsArray;
  },

  /** Record the timestamp of the last successful sync with Google Sheets. */
  setLastSync(timestamp) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.lastSync, timestamp);
  },

  getLastSync() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.lastSync);
  },
};
