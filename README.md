# Smart Finance Tracker

A premium, fully responsive personal finance dashboard built with plain HTML, CSS, and JavaScript — with an optional Google Sheets backend via Google Apps Script.

![Tech](https://img.shields.io/badge/HTML-CSS-JS-blueviolet)

---

## ✨ Features

- Add, edit, and delete Income / Expense transactions
- Real-time **Current Balance**, **Total Income**, **Total Expense** cards
- **Top expense category** stat card
- Income vs Expense doughnut chart + monthly bar chart (Chart.js)
- Search transactions by title, filter by Income/Expense
- Export visible transactions to **CSV**
- Confirmation dialog before deleting
- Dark / Light mode toggle (saved in Local Storage)
- Local Storage persistence — works fully offline
- Optional **Google Sheets sync** through a Google Apps Script Web App
- Toast notifications, modal forms, friendly validation messages
- Glassmorphism cards, gradient background, Poppins + Space Mono typography
- Fully responsive (desktop, tablet, mobile) with a collapsible sidebar

---

## 📁 Folder structure

```
Smart-Finance-Tracker/
│
├── index.html              Markup for the whole app
├── style.css                All styling (design tokens, layout, components)
├── config.js                App settings: currency, theme, Sheets URL, categories
├── utils.js                 Currency/date formatting, validation, helpers
├── storage.js                Local Storage CRUD, backup/restore
├── api.js                    Optional Google Sheets sync (fetch wrapper)
├── charts.js                 Chart.js setup for the pie + bar charts
├── ui.js                     DOM rendering: cards, table, modals, toasts
├── script.js                 App entry point — wires everything together
│
├── assets/
│   ├── logo.png              (optional) your own logo
│   ├── favicon.ico           (optional) browser tab icon
│   └── icons/                 (optional) extra icon assets
│
├── google-apps-script/
│   └── Code.gs                Apps Script backend (doGet/doPost + Sheet CRUD)
│
└── README.md
```

### How the files connect

`index.html` loads the scripts in dependency order:

```
config.js → utils.js → storage.js → api.js → charts.js → ui.js → script.js
```

- **config.js** has no dependencies — pure settings.
- **utils.js** depends only on `config.js` (currency/locale settings).
- **storage.js** depends on `config.js` (storage keys) and `utils.js` (id/date helpers).
- **api.js** depends on `config.js` (the Apps Script URL + sync flag).
- **charts.js** depends on `utils.js` (currency formatting) and Chart.js (CDN).
- **ui.js** depends on `config.js`, `utils.js` and the DOM in `index.html`.
- **script.js** (the `App` object) orchestrates all of the above and binds every event listener.

---

## 🚀 Running locally

No build step is required — it's plain static HTML/CSS/JS.

1. Download or clone the `Smart-Finance-Tracker` folder.
2. Open `index.html` directly in a browser, **or** serve it locally for the best experience (some browsers restrict certain features over `file://`):

   ```bash
   # Python 3
   cd Smart-Finance-Tracker
   python -m http.server 8080
   # then visit http://localhost:8080
   ```

   ```bash
   # Node (if you have npx)
   npx serve Smart-Finance-Tracker
   ```
3. Start adding transactions — everything is saved to your browser's Local Storage automatically.

That's it. The app is 100% functional offline with no backend required.

---

## ☁️ Optional: Google Sheets setup (live sync)

If you'd like every transaction to also be saved in a Google Sheet (e.g. to view/edit from Sheets, or as a simple multi-device backend), follow these steps. **This is entirely optional** — skip it and the app just runs on Local Storage.

### 1. Create the Sheet

1. Create a new Google Sheet (any name).
2. Open **Extensions → Apps Script**.
3. Delete the default `Code.gs` content and paste in the contents of `google-apps-script/Code.gs` from this project.
4. Save the project (e.g. name it "Smart Finance Tracker API").

### 2. Deploy as a Web App

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone (or "Anyone with Google account" if you want it private-ish)
4. Click **Deploy**, and authorize the requested permissions.
5. Copy the generated **Web App URL**.

### 3. Connect the front end

1. Open `config.js`.
2. Paste the URL into `GOOGLE_SCRIPT_URL`.
3. Set `SYNC_ENABLED: true`.
4. Reload `index.html`. The app will now create/update/delete rows in your Sheet alongside Local Storage, and will pull the Sheet's data on load.

> The Sheet will automatically get a `Transactions` tab with columns: `id, title, amount, type, category, date, notes, createdAt`.

### 4. Redeploying after changes

If you edit `Code.gs` later, use **Deploy → Manage deployments → Edit (pencil icon) → New version** to push the changes live — the Web App URL stays the same.

---

## 🧭 Using the app

- **Add a transaction** — click "Add transaction", fill in Title, Amount, Type, Category, Date, and an optional note.
- **Edit** — click the pencil icon on any row.
- **Delete** — click the trash icon; you'll be asked to confirm first.
- **Search** — type in the search box to filter by title in real time.
- **Filter** — use the type dropdown to show only Income or only Expense.
- **Export CSV** — exports exactly what's currently visible (respects search/filter).
- **Dark/Light mode** — toggle from the sidebar; your choice is remembered.

---

## 🛠️ Technology used

| Layer | Tech |
|---|---|
| Structure | HTML5 |
| Styling | CSS3 (custom properties, Flexbox, Grid, glassmorphism) |
| Behavior | Vanilla JavaScript (ES6+) |
| Charts | [Chart.js](https://www.chartjs.org/) |
| Icons | [Font Awesome 6](https://fontawesome.com/) |
| Fonts | Google Fonts — Poppins, Space Mono |
| Optional backend | Google Apps Script + Google Sheets |

---

## 📝 Notes

- All data lives in your browser's Local Storage by default — clearing browser data will clear transactions (use the JSON backup helper in `storage.js` if you'd like a manual export/import flow).
- This project is intentionally dependency-free aside from CDN-hosted Chart.js/Font Awesome, so it's easy to read, extend, and use as a portfolio piece.
