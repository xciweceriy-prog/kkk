/* =========================================================
   script.js
   Application entry point. Wires together storage, api,
   charts and ui modules, and owns the in-memory state for
   the current search/filter view.
   ========================================================= */

const App = {
  state: {
    transactions: [],
    search: "",
    filterType: "All",
    pendingDeleteId: null,
  },

  init() {
    UI.init();
    this.loadTransactions();
    this.applySavedTheme();
    this.bindEvents();
    this.render();

    if (Api.isConfigured()) {
      this.syncFromCloud();
    }
  },

  /* ---------- Data loading ---------- */

  loadTransactions() {
    this.state.transactions = Storage.getAll();
  },

  async syncFromCloud() {
    const result = await Api.readTransactions();
    if (result.ok && Array.isArray(result.data)) {
      this.state.transactions = result.data;
      Storage.saveAll(result.data);
      Storage.setLastSync(new Date().toISOString());
      this.render();
      UI.showToast("Synced with Google Sheets", "success");
    }
  },

  /* ---------- Derived data / calculations ---------- */

  getFilteredTransactions() {
    const { search, filterType } = this.state;
    return this.state.transactions.filter((t) => {
      const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === "All" || t.type === filterType;
      return matchesSearch && matchesType;
    });
  },

  computeSummary() {
    const all = this.state.transactions;
    const income = all.filter((t) => t.type === "Income");
    const expense = all.filter((t) => t.type === "Expense");

    const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = expense.reduce((sum, t) => sum + Number(t.amount), 0);

    const categoryTotals = {};
    expense.forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
    });
    let topCategory = null;
    Object.entries(categoryTotals).forEach(([name, amount]) => {
      if (!topCategory || amount > topCategory.amount) topCategory = { name, amount };
    });

    return {
      balance: totalIncome - totalExpense,
      totalIncome,
      totalExpense,
      incomeCount: income.length,
      expenseCount: expense.length,
      topCategory,
    };
  },

  computeMonthlyBreakdown() {
    const map = {}; // monthKey -> { income, expense }
    this.state.transactions.forEach((t) => {
      const key = Utils.monthKey(t.date);
      if (!map[key]) map[key] = { income: 0, expense: 0 };
      map[key][t.type === "Income" ? "income" : "expense"] += Number(t.amount);
    });

    const sortedKeys = Object.keys(map).sort().slice(-6); // last 6 months with data
    return {
      labels: sortedKeys.map((k) => Utils.monthLabel(k)),
      income: sortedKeys.map((k) => map[k].income),
      expense: sortedKeys.map((k) => map[k].expense),
    };
  },

  /* ---------- Render ---------- */

  render() {
    const summary = this.computeSummary();
    UI.renderSummary(summary);
    UI.renderTable(this.getFilteredTransactions());

    Charts.initPieChart(summary.totalIncome, summary.totalExpense);
    const monthly = this.computeMonthlyBreakdown();
    Charts.initBarChart(monthly.labels, monthly.income, monthly.expense);
  },

  /* ---------- Theme ---------- */

  applySavedTheme() {
    const saved = localStorage.getItem(CONFIG.THEME.storageKey) || CONFIG.THEME.default;
    UI.applyTheme(saved);
  },

  toggleTheme() {
    const current = document.body.classList.contains("dark") ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    UI.applyTheme(next);
    localStorage.setItem(CONFIG.THEME.storageKey, next);
    Charts.refreshTheme();
  },

  /* ---------- CRUD ---------- */

  handleFormSubmit(e) {
    e.preventDefault();
    const data = UI.getFormData();
    const { valid, errors } = Utils.validateTransaction(data);

    if (!valid) {
      UI.showFormErrors(errors);
      return;
    }

    const payload = {
      title: data.title,
      amount: Math.abs(parseFloat(data.amount)),
      type: data.type,
      category: data.category,
      date: data.date,
      notes: data.notes,
    };

    if (data.id) {
      this.state.transactions = Storage.update(data.id, payload);
      Api.updateTransaction({ id: data.id, ...payload });
      UI.showToast("Transaction updated", "success");
    } else {
      const transaction = { id: Utils.generateId(), ...payload, createdAt: new Date().toISOString() };
      this.state.transactions = Storage.add(transaction);
      Api.createTransaction(transaction);
      UI.showToast("Transaction added", "success");
    }

    UI.closeTxnModal();
    this.render();
  },

  requestDelete(id) {
    this.state.pendingDeleteId = id;
    UI.openConfirmModal();
  },

  confirmDelete() {
    const id = this.state.pendingDeleteId;
    if (!id) return;
    this.state.transactions = Storage.remove(id);
    Api.deleteTransaction(id);
    UI.closeConfirmModal();
    UI.showToast("Transaction deleted", "success");
    this.state.pendingDeleteId = null;
    this.render();
  },

  /* ---------- CSV export ---------- */

  exportCsv() {
    const rows = this.getFilteredTransactions();
    if (rows.length === 0) {
      UI.showToast("No transactions to export", "error");
      return;
    }

    const header = ["Title", "Type", "Category", "Amount", "Date", "Notes"];
    const csvLines = [header.join(",")];

    rows.forEach((t) => {
      const line = [
        `"${(t.title || "").replace(/"/g, '""')}"`,
        t.type,
        t.category,
        t.amount,
        t.date,
        `"${(t.notes || "").replace(/"/g, '""')}"`,
      ].join(",");
      csvLines.push(line);
    });

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${Utils.todayISO()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    UI.showToast("CSV exported", "success");
  },

  /* ---------- Events ---------- */

  bindEvents() {
    const { els } = UI;

    // Theme toggle
    els.themeToggle.addEventListener("click", () => this.toggleTheme());

    // Mobile sidebar
    els.mobileToggle.addEventListener("click", () => UI.toggleSidebar(true));
    els.sidebarOverlay.addEventListener("click", () => UI.toggleSidebar(false));
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"));
        e.currentTarget.classList.add("active");
        const target = document.getElementById(e.currentTarget.dataset.target);
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
        UI.toggleSidebar(false);
      });
    });

    // Add / edit modal
    els.openAddModal.addEventListener("click", () => UI.openTxnModal());
    els.closeModalBtn.addEventListener("click", () => UI.closeTxnModal());
    els.cancelModalBtn.addEventListener("click", () => UI.closeTxnModal());
    els.txnModalOverlay.addEventListener("click", (e) => {
      if (e.target === els.txnModalOverlay) UI.closeTxnModal();
    });

    els.txnType.addEventListener("change", (e) => UI.populateCategoryOptions(e.target.value));
    els.txnForm.addEventListener("submit", (e) => this.handleFormSubmit(e));

    // Table row actions (delegated)
    els.tableBody.addEventListener("click", (e) => {
      const editBtn = e.target.closest(".edit-btn");
      const deleteBtn = e.target.closest(".delete-btn");
      if (editBtn) {
        const txn = this.state.transactions.find((t) => t.id === editBtn.dataset.id);
        if (txn) UI.openTxnModal(txn);
      }
      if (deleteBtn) {
        this.requestDelete(deleteBtn.dataset.id);
      }
    });

    // Confirm delete modal
    els.confirmDeleteBtn.addEventListener("click", () => this.confirmDelete());
    els.cancelDeleteBtn.addEventListener("click", () => UI.closeConfirmModal());
    els.confirmModalOverlay.addEventListener("click", (e) => {
      if (e.target === els.confirmModalOverlay) UI.closeConfirmModal();
    });

    // Search & filter
    els.searchInput.addEventListener(
      "input",
      Utils.debounce((e) => {
        this.state.search = e.target.value;
        UI.renderTable(this.getFilteredTransactions());
      }, 200)
    );

    els.filterType.addEventListener("change", (e) => {
      this.state.filterType = e.target.value;
      UI.renderTable(this.getFilteredTransactions());
    });

    // Export
    els.exportCsvBtn.addEventListener("click", () => this.exportCsv());

    // Escape key closes any open modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        UI.closeTxnModal();
        UI.closeConfirmModal();
      }
    });
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());
