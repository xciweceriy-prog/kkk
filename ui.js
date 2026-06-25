/* =========================================================
   ui.js
   All DOM rendering and presentation logic lives here.
   script.js calls into these functions; this file never
   reads/writes Local Storage directly (that's storage.js).
   ========================================================= */

const UI = {
  els: {},

  cacheEls() {
    this.els = {
      body: document.body,
      themeToggle: document.getElementById("themeToggle"),
      todayLabel: document.getElementById("todayLabel"),

      balanceValue: document.getElementById("balanceValue"),
      incomeValue: document.getElementById("incomeValue"),
      expenseValue: document.getElementById("expenseValue"),
      incomeCount: document.getElementById("incomeCount"),
      expenseCount: document.getElementById("expenseCount"),
      topCategoryValue: document.getElementById("topCategoryValue"),
      topCategoryAmount: document.getElementById("topCategoryAmount"),

      tableBody: document.getElementById("txnTableBody"),
      tableWrap: document.querySelector(".table-wrap"),
      emptyState: document.getElementById("emptyState"),

      searchInput: document.getElementById("searchInput"),
      filterType: document.getElementById("filterType"),
      exportCsvBtn: document.getElementById("exportCsvBtn"),

      openAddModal: document.getElementById("openAddModal"),
      txnModalOverlay: document.getElementById("txnModalOverlay"),
      modalTitle: document.getElementById("modalTitle"),
      closeModalBtn: document.getElementById("closeModalBtn"),
      cancelModalBtn: document.getElementById("cancelModalBtn"),
      txnForm: document.getElementById("txnForm"),
      txnId: document.getElementById("txnId"),
      txnTitle: document.getElementById("txnTitle"),
      txnAmount: document.getElementById("txnAmount"),
      txnType: document.getElementById("txnType"),
      txnCategory: document.getElementById("txnCategory"),
      txnDate: document.getElementById("txnDate"),
      txnNotes: document.getElementById("txnNotes"),

      confirmModalOverlay: document.getElementById("confirmModalOverlay"),
      confirmDeleteBtn: document.getElementById("confirmDeleteBtn"),
      cancelDeleteBtn: document.getElementById("cancelDeleteBtn"),

      toastContainer: document.getElementById("toastContainer"),

      mobileToggle: document.getElementById("mobileToggle"),
      sidebar: document.getElementById("sidebar"),
      sidebarOverlay: document.getElementById("sidebarOverlay"),
    };
  },

  init() {
    this.cacheEls();
    this.els.todayLabel.textContent = `Today is ${Utils.formatDate(Utils.todayISO())}`;
    this.populateCategoryOptions("Income");
  },

  /* ---------- Theme ---------- */

  applyTheme(theme) {
    this.els.body.classList.remove("dark", "light");
    this.els.body.classList.add(theme);
    const icon = this.els.themeToggle.querySelector("i");
    const label = this.els.themeToggle.querySelector("span");
    if (theme === "dark") {
      icon.className = "fa-solid fa-moon";
      label.textContent = "Dark mode";
    } else {
      icon.className = "fa-solid fa-sun";
      label.textContent = "Light mode";
    }
  },

  /* ---------- Sidebar (mobile) ---------- */

  toggleSidebar(open) {
    this.els.sidebar.classList.toggle("open", open);
    this.els.sidebarOverlay.classList.toggle("open", open);
  },

  /* ---------- Category dropdown ---------- */

  populateCategoryOptions(type) {
    const list = CONFIG.CATEGORIES[type] || [];
    this.els.txnCategory.innerHTML = list
      .map((cat) => `<option value="${cat}">${cat}</option>`)
      .join("");
  },

  /* ---------- Dashboard summary cards ---------- */

  renderSummary({ balance, totalIncome, totalExpense, incomeCount, expenseCount, topCategory }) {
    this.els.balanceValue.textContent = Utils.formatCurrency(balance);
    this.els.incomeValue.textContent = Utils.formatCurrency(totalIncome);
    this.els.expenseValue.textContent = Utils.formatCurrency(totalExpense);
    this.els.incomeCount.textContent = `${incomeCount} transaction${incomeCount === 1 ? "" : "s"}`;
    this.els.expenseCount.textContent = `${expenseCount} transaction${expenseCount === 1 ? "" : "s"}`;

    if (topCategory) {
      this.els.topCategoryValue.textContent = topCategory.name;
      this.els.topCategoryAmount.textContent = `${Utils.formatCurrency(topCategory.amount)} spent`;
    } else {
      this.els.topCategoryValue.textContent = "—";
      this.els.topCategoryAmount.textContent = "No expenses yet";
    }
  },

  /* ---------- Transaction table ---------- */

  renderTable(transactions) {
    const rows = transactions
      .map((t) => {
        const isIncome = t.type === "Income";
        return `
        <tr data-id="${t.id}">
          <td class="txn-title">${Utils.escapeHtml(t.title)}</td>
          <td><span class="pill ${isIncome ? "pill-income" : "pill-expense"}">${t.category}</span></td>
          <td>${Utils.formatDate(t.date)}</td>
          <td><span class="txn-notes" title="${Utils.escapeHtml(t.notes || "")}">${Utils.escapeHtml(t.notes || "—")}</span></td>
          <td class="align-right amount-cell ${isIncome ? "amount-income" : "amount-expense"}">
            ${isIncome ? "+" : "−"} ${Utils.formatCurrency(t.amount)}
          </td>
          <td class="align-center">
            <div class="row-actions">
              <button class="icon-btn edit-btn" data-id="${t.id}" aria-label="Edit"><i class="fa-solid fa-pen"></i></button>
              <button class="icon-btn delete-btn" data-id="${t.id}" aria-label="Delete"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>`;
      })
      .join("");

    this.els.tableBody.innerHTML = rows;

    const hasResults = transactions.length > 0;
    this.els.tableWrap.classList.toggle("has-results", hasResults);
    this.els.emptyState.classList.toggle("visible", !hasResults);
  },

  /* ---------- Transaction modal (add/edit) ---------- */

  openTxnModal(transaction = null) {
    this.clearFormErrors();
    if (transaction) {
      this.els.modalTitle.textContent = "Edit transaction";
      this.els.txnId.value = transaction.id;
      this.els.txnTitle.value = transaction.title;
      this.els.txnAmount.value = transaction.amount;
      this.els.txnType.value = transaction.type;
      this.populateCategoryOptions(transaction.type);
      this.els.txnCategory.value = transaction.category;
      this.els.txnDate.value = transaction.date;
      this.els.txnNotes.value = transaction.notes || "";
    } else {
      this.els.modalTitle.textContent = "Add transaction";
      this.els.txnForm.reset();
      this.els.txnId.value = "";
      this.els.txnType.value = "Income";
      this.populateCategoryOptions("Income");
      this.els.txnDate.value = Utils.todayISO();
    }
    this.els.txnModalOverlay.classList.add("open");
    this.els.txnTitle.focus();
  },

  closeTxnModal() {
    this.els.txnModalOverlay.classList.remove("open");
  },

  getFormData() {
    return {
      id: this.els.txnId.value || null,
      title: this.els.txnTitle.value.trim(),
      amount: this.els.txnAmount.value,
      type: this.els.txnType.value,
      category: this.els.txnCategory.value,
      date: this.els.txnDate.value,
      notes: this.els.txnNotes.value.trim(),
    };
  },

  showFormErrors(errors) {
    this.clearFormErrors();
    Object.entries(errors).forEach(([field, message]) => {
      const errEl = document.getElementById(`err-${field}`);
      const inputEl = document.getElementById(`txn${field.charAt(0).toUpperCase()}${field.slice(1)}`);
      if (errEl) errEl.textContent = message;
      if (inputEl) inputEl.closest(".form-field")?.classList.add("has-error");
    });
  },

  clearFormErrors() {
    document.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
    document.querySelectorAll(".form-field.has-error").forEach((el) => el.classList.remove("has-error"));
  },

  /* ---------- Confirm delete modal ---------- */

  openConfirmModal() {
    this.els.confirmModalOverlay.classList.add("open");
  },

  closeConfirmModal() {
    this.els.confirmModalOverlay.classList.remove("open");
  },

  /* ---------- Toasts ---------- */

  showToast(message, type = "info") {
    const icons = { success: "fa-circle-check", error: "fa-circle-exclamation", info: "fa-circle-info" };
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${Utils.escapeHtml(message)}</span>`;
    this.els.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.25s ease";
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  },
};
