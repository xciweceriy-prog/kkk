/**
 * Code.gs
 * Google Apps Script Web App acting as a simple REST-ish backend
 * backed by a Google Sheet. Deploy as a Web App (see README.md)
 * and paste the resulting URL into config.js as GOOGLE_SCRIPT_URL.
 *
 * Sheet columns (row 1 header): id | title | amount | type | category | date | notes | createdAt
 */

const SHEET_NAME = "Transactions";

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["id", "title", "amount", "type", "category", "date", "notes", "createdAt"]);
  }
  return sheet;
}

function sheetToTransactions_() {
  const sheet = getSheet_();
  const rows = sheet.getDataRange().getValues();
  const [header, ...data] = rows;
  return data
    .filter((row) => row[0]) // skip blank rows
    .map((row) => {
      const obj = {};
      header.forEach((key, i) => (obj[key] = row[i]));
      return obj;
    });
}

function findRowIndexById_(sheet, id) {
  const ids = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 0), 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) return i + 2; // account for header row + 1-index
  }
  return -1;
}

/** Handle GET requests, e.g. ?action=read */
function doGet(e) {
  const action = (e.parameter.action || "read").toLowerCase();

  if (action === "read") {
    return jsonResponse_(sheetToTransactions_());
  }

  return jsonResponse_({ error: "Unknown GET action" }, 400);
}

/** Handle POST requests: create / update / delete / sync */
function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse_({ error: "Invalid JSON body" }, 400);
  }

  const action = (body.action || "").toLowerCase();
  const payload = body.payload || {};
  const sheet = getSheet_();

  switch (action) {
    case "create":
      sheet.appendRow([
        payload.id,
        payload.title,
        payload.amount,
        payload.type,
        payload.category,
        payload.date,
        payload.notes || "",
        payload.createdAt || new Date().toISOString(),
      ]);
      return jsonResponse_({ ok: true });

    case "update": {
      const rowIndex = findRowIndexById_(sheet, payload.id);
      if (rowIndex === -1) return jsonResponse_({ error: "Transaction not found" }, 404);
      sheet
        .getRange(rowIndex, 1, 1, 7)
        .setValues([[
          payload.id,
          payload.title,
          payload.amount,
          payload.type,
          payload.category,
          payload.date,
          payload.notes || "",
        ]]);
      return jsonResponse_({ ok: true });
    }

    case "delete": {
      const rowIndex = findRowIndexById_(sheet, payload.id);
      if (rowIndex === -1) return jsonResponse_({ error: "Transaction not found" }, 404);
      sheet.deleteRow(rowIndex);
      return jsonResponse_({ ok: true });
    }

    case "sync": {
      // Simple full overwrite sync: replace sheet contents with the
      // transactions array sent from the client.
      const transactions = payload.transactions || [];
      sheet.clearContents();
      sheet.appendRow(["id", "title", "amount", "type", "category", "date", "notes", "createdAt"]);
      transactions.forEach((t) => {
        sheet.appendRow([t.id, t.title, t.amount, t.type, t.category, t.date, t.notes || "", t.createdAt || ""]);
      });
      return jsonResponse_({ ok: true, count: transactions.length });
    }

    default:
      return jsonResponse_({ error: "Unknown POST action" }, 400);
  }
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
