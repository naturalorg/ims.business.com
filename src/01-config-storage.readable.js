const { useState, useEffect, useRef, useCallback, useMemo } = React;
const SK = { CO: "ip_co", HSN: "ip_hsn", INV: "ip_inv", TERMS: "ip_terms", PO_TERMS: "ip_po_terms", CTR: "ip_ctr", USERS: "ip_users", THEME: "ip_theme", CUST: "ip_customers", FOLDER: "ip_folder", AUDIT: "ip_audit", EXP: "ip_expenses", PO: "ip_po", PRODUCTS: "ip_products", WA: "ip_wa", FREEZE: "ip_freeze", SERIES: "ip_series", STOCK: "ip_stock", BANK: "ip_bank", QSALE: "ip_quicksales", BANK_OB: "ip_bank_ob", BANK_ACCTS: "ip_bank_accounts", QUOTE: "ip_quotations", DC: "ip_delivery_challans", RECUR: "ip_recurring", JOURNAL: "ip_journal", ACCMAP: "ip_acc_map", POLICIES: "ip_policies", COA_CUSTOM: "ip_coa_custom", REFSEQ: "ip_ref_seq", TXNREFSEQ: "ip_txn_ref_seq", SHOW_TERMS: "ip_show_terms", BANK_RULES: "ip_bank_rules", FA: "ip_fixed_assets", RJV: "ip_recurring_jv", ADV_APPS: "ip_adv_apps", BUDGET: "ip_budget", FXR: "ip_fx_rates", PR_EMP: "ip_pr_employees", PR_RUNS: "ip_pr_runs", PR_LOANS: "ip_pr_loans", PR_SET: "ip_pr_settings" };
const AUDIT_ACTION_META = {
  INVOICE_CREATED: { module: "Invoices", action: "Created", color: "#166534" },
  INVOICE_EDITED: { module: "Invoices", action: "Edited", color: "#1D4ED8" },
  INVOICE_DELETED: { module: "Invoices", action: "Deleted", color: "#DC2626" },
  INVOICE_MARKED_PAID: { module: "Invoices", action: "Marked Paid", color: "#B45309" },
  EXPENSE_ADDED: { module: "Expenses/Purchases", action: "Added", color: "#065F46" },
  EXPENSE_EDITED: { module: "Expenses/Purchases", action: "Edited", color: "#0369A1" },
  EXPENSE_DELETED: { module: "Expenses/Purchases", action: "Deleted", color: "#DC2626" },
  EXPENSE_MARKED_PAID: { module: "Expenses/Purchases", action: "Marked Paid", color: "#B45309" },
  PO_CREATED: { module: "Purchase Orders", action: "Created", color: "#166534" },
  PO_EDITED: { module: "Purchase Orders", action: "Edited", color: "#1D4ED8" },
  PO_DELETED: { module: "Purchase Orders", action: "Deleted", color: "#DC2626" },
  QUOTATION_CREATED: { module: "Quotations", action: "Created", color: "#166534" },
  QUOTATION_EDITED: { module: "Quotations", action: "Edited", color: "#1D4ED8" },
  QUOTATION_DELETED: { module: "Quotations", action: "Deleted", color: "#DC2626" },
  QUOTATION_CONVERTED: { module: "Quotations", action: "Converted to Invoice", color: "#0E7490" },
  DC_CREATED: { module: "Delivery Challans", action: "Created", color: "#166534" },
  DC_EDITED: { module: "Delivery Challans", action: "Edited", color: "#1D4ED8" },
  DC_DELETED: { module: "Delivery Challans", action: "Deleted", color: "#DC2626" },
  RECURRING_TEMPLATE_CREATED: { module: "Recurring Invoices", action: "Created", color: "#166534" },
  RECURRING_TEMPLATE_EDITED: { module: "Recurring Invoices", action: "Edited", color: "#1D4ED8" },
  RECURRING_TEMPLATE_DELETED: { module: "Recurring Invoices", action: "Deleted", color: "#DC2626" },
  RECURRING_INVOICE_GENERATED: { module: "Recurring Invoices", action: "Auto-Generated", color: "#0E7490" },
  QUICK_SALE_CREATED: { module: "Quick Sales", action: "Created", color: "#166534" },
  PAYMENT_REMINDER_SENT: { module: "Payment Reminders", action: "Sent", color: "#0E7490" },
  CUSTOMER_ADDED: { module: "Customers", action: "Added", color: "#166534" },
  CUSTOMER_EDITED: { module: "Customers", action: "Edited", color: "#1D4ED8" },
  CUSTOMER_DELETED: { module: "Customers", action: "Deleted", color: "#DC2626" },
  PRODUCT_ADDED: { module: "Products", action: "Added", color: "#166534" },
  PRODUCT_EDITED: { module: "Products", action: "Edited", color: "#1D4ED8" },
  PRODUCT_DELETED: { module: "Products", action: "Deleted", color: "#DC2626" },
  HSN_ADDED: { module: "HSN/SAC Codes", action: "Added", color: "#166534" },
  HSN_EDITED: { module: "HSN/SAC Codes", action: "Edited", color: "#1D4ED8" },
  HSN_DELETED: { module: "HSN/SAC Codes", action: "Deleted", color: "#DC2626" },
  BANK_ACCOUNT_ADDED: { module: "Bank Accounts", action: "Added", color: "#166534" },
  BANK_ACCOUNT_DELETED: { module: "Bank Accounts", action: "Deleted", color: "#DC2626" },
  LEDGER_CREATED: { module: "Chart of Accounts", action: "Ledger Created", color: "#166534" },
  LEDGER_DELETED: { module: "Chart of Accounts", action: "Ledger Deleted", color: "#DC2626" },
  EXPENSE_ACCOUNT_MAPPING_UPDATED: { module: "Chart of Accounts", action: "Mapping Updated", color: "#1D4ED8" },
  JOURNAL_VOUCHER_ADDED: { module: "Journal Vouchers", action: "Added", color: "#166534" },
  JOURNAL_VOUCHER_DELETED: { module: "Journal Vouchers", action: "Deleted", color: "#DC2626" },
  ACCOUNTING_POLICIES_UPDATED: { module: "Accounting Policies", action: "Updated", color: "#1D4ED8" },
  COMPANY_SETTINGS_UPDATED: { module: "Company Settings", action: "Updated", color: "#1D4ED8" },
  TERMS_UPDATED: { module: "Terms & Conditions", action: "Updated", color: "#1D4ED8" },
  NUMBERING_SERIES_UPDATED: { module: "Numbering Series", action: "Updated", color: "#1D4ED8" },
  NUMBERING_SERIES_RESET: { module: "Numbering Series", action: "Reset", color: "#B45309" },
  BACKUP_EXPORTED: { module: "Backup", action: "Exported", color: "#0E7490" },
  DATA_RESTORED: { module: "Backup", action: "Restored", color: "#B45309" },
  PERIOD_FROZEN: { module: "Period Lock", action: "Frozen", color: "#1E40AF" },
  PERIOD_UNFROZEN: { module: "Period Lock", action: "Unfrozen", color: "#065F46" },
  USER_CREATED: { module: "Users", action: "Created", color: "#6D28D9" },
  USER_EDITED: { module: "Users", action: "Edited", color: "#0369A1" },
  USER_DELETED: { module: "Users", action: "Deleted", color: "#DC2626" },
  USER_TOGGLED: { module: "Users", action: "Status Changed", color: "#B45309" },
  USER_LOGIN: { module: "Users", action: "Login", color: "#0E7490" },
  USER_LOGOUT: { module: "Users", action: "Logout", color: "#6B7280" }
};
const getAuditMeta = (action) => AUDIT_ACTION_META[action] || { module: (action || "").split("_")[0], action: (action || "").replace(/^[A-Z]+_/, "").replace(/_/g, " "), color: "var(--text3)" };
const ROLE_PAGES = {
  sales: ["dashboard", "invoice", "history", "customers", "salesview", "quotations", "dc", "recurring", "reminders"],
  accountant: ["dashboard", "invoice", "history", "pohistory", "expenses", "customers", "inventory", "aging", "bankrecon", "terms", "salesview", "reports", "coa", "journal", "ledger", "trialbalance", "quotations", "dc", "recurring", "reminders"]
};
const canSee = (role, key) => !ROLE_PAGES[role] || ROLE_PAGES[role].includes(key);
const UNITS = ["Nos", "Pcs", "Kg", "Gm", "Ltr", "Ml", "Mtr", "Cm", "Sqft", "Box", "Set", "Pair", "Roll", "Pack", "Bag", "Bottle", "Can", "Sheet", "Hour", "Month"];
const TAX_RATES = ["0", "0.1", "0.25", "1", "1.5", "3", "5", "6", "7.5", "9", "12", "14", "18", "28"];
const DEFAULT_TERMS = `1. Payment is due within 30 days from the date of invoice.
2. Goods once sold will not be taken back or exchanged.
3. Interest @ 18% per annum will be charged on overdue payments.
4. Subject to local jurisdiction. All disputes shall be settled amicably.
5. E. & O.E. (Errors and Omissions Excepted).
6. This is a computer-generated invoice and does not require a physical signature.`;
const DEFAULT_PO_TERMS = `1. Prices quoted are firm and not subject to any escalation.
2. Delivery must be made strictly as per the schedule mentioned in this PO.
3. Each delivery must be accompanied by a delivery challan and tax invoice.
4. Goods not conforming to specifications will be rejected and returned at supplier's cost.
5. Payment will be made within 30 days of receipt of goods and correct invoice.
6. This PO is subject to local jurisdiction only.`;
const STATE_CODES = { "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur", "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal", "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat", "27": "Maharashtra", "29": "Karnataka", "30": "Goa", "32": "Kerala", "33": "Tamil Nadu", "36": "Telangana", "37": "Andhra Pradesh" };
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB6a4B5lOoJaQc4fqcH2cv027KZ3jTC3e4",
  authDomain: "invoice-pro-5edc4.firebaseapp.com",
  databaseURL: "https://invoice-pro-5edc4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "invoice-pro-5edc4",
  storageBucket: "invoice-pro-5edc4.firebasestorage.app",
  messagingSenderId: "265453721196",
  appId: "1:265453721196:web:fa63e685abcf61ce3eea49"
};
const SUPER_ADMINS = ["adithya@business.com", "invoice@business.com"];
const isSuperAdmin = (email = "") => SUPER_ADMINS.includes(email.toLowerCase());
const REQUIRE_2FA = false;
const LEGACY_MIGRATION = true;
let _fb = null;
const getFB = () => {
  if (!_fb) {
    const L = window.FBLib;
    const app = L.initializeApp(FIREBASE_CONFIG);
    _fb = { L, app, auth: L.getAuth(app), db: L.getDatabase(app) };
  }
  return _fb;
};
const getDb = () => {
  const { L, db } = getFB();
  return { ref: (p) => ({ once: () => L.get(L.ref(db, p)), set: (v) => L.set(L.ref(db, p), v) }) };
};
const fbWaitUser = () => new Promise((res) => {
  const { L, auth } = getFB();
  const un = L.onAuthStateChanged(auth, (u) => {
    un();
    res(u);
  });
});
const adminCreateAuthUser = async (email) => {
  const { L, auth } = getFB();
  let sec;
  try {
    sec = L.getApp("sec");
  } catch (e) {
    sec = L.initializeApp(FIREBASE_CONFIG, "sec");
  }
  const a = L.getAuth(sec);
  const tmp = Array.from(crypto.getRandomValues(new Uint8Array(18))).map((x) => x.toString(36)).join("") + "Aa1!";
  try {
    await L.createUserWithEmailAndPassword(a, email, tmp);
    await L.signOut(a);
  } catch (e) {
    if (e.code !== "auth/email-already-in-use") throw e;
  }
  await L.sendPasswordResetEmail(auth, email);
};
const _cache = {};
let _ver = 0;
let _cloudReady = false;
const loadCache = async (attempt = 1) => {
  try {
    const result = await Promise.race([
      getDb().ref("invoicepro").once("value"),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Firebase timeout after 15s")), 15e3))
    ]);
    const data = result.val();
    if (data) Object.entries(data).forEach(([k, v]) => {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const keys = Object.keys(v);
        const allNumeric = keys.length > 0 && keys.every((k2) => /^\d+$/.test(k2));
        _cache[k] = allNumeric ? Object.values(v) : v;
        _ver++;
      } else {
        _cache[k] = v;
        _ver++;
      }
    });
    _cloudReady = true;
    console.log("\u2705 Firebase loaded", Object.keys(_cache).length, "keys");
    return true;
  } catch (e) {
    if (attempt < 2) {
      console.warn(`\u26A0\uFE0F Firebase load attempt ${attempt} failed (${e.message}), retrying\u2026`);
      await new Promise((r) => setTimeout(r, 1500));
      return loadCache(attempt + 1);
    }
    console.warn("\u26A0\uFE0F Firebase load failed after retry \u2014 showing a READ-ONLY local copy, writes are blocked:", e.message);
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      try {
        _cache[k] = JSON.parse(localStorage.getItem(k));
        _ver++;
      } catch (e2) {
      }
    }
    _cloudReady = false;
    return false;
  }
};
const S = {
  get: (k, d = null) => {
    const v = _cache[k];
    return v !== void 0 ? v : d;
  },
  set: (k, v) => {
    if (!_cloudReady) {
      console.warn(`\u26D4 Write to "${k}" blocked \u2014 not connected to the cloud yet.`);
      toast.error("Not connected to the cloud \u2014 this change was NOT saved. Please check your connection and retry.");
      return false;
    }
    _cache[k] = v;
    _ver++;
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {
    }
    getDb().ref("invoicepro/" + k).set(v).catch((e) => console.warn("Firebase write failed:", e.message));
    return true;
  }
};
const nextVoucherNo = () => {
  const n = (parseInt(S.get(SK.REFSEQ, 0), 10) || 0) + 1;
  S.set(SK.REFSEQ, n);
  return String(n).padStart(10, "0");
};
const ensureVoucherNumbers = () => {
  let touched = false;
  const invs = S.get(SK.INV, []);
  const invsFixed = invs.map((i) => i.voucherNo ? i : (touched = true, { ...i, voucherNo: nextVoucherNo() }));
  if (touched) S.set(SK.INV, invsFixed);
  touched = false;
  const exps = S.get(SK.EXP, []);
  const expsFixed = exps.map((e) => e.voucherNo ? e : (touched = true, { ...e, voucherNo: nextVoucherNo() }));
  if (touched) S.set(SK.EXP, expsFixed);
  touched = false;
  const jvs = S.get(SK.JOURNAL, []);
  const jvsFixed = jvs.map((j) => j.voucherNo ? j : (touched = true, { ...j, voucherNo: nextVoucherNo() }));
  if (touched) S.set(SK.JOURNAL, jvsFixed);
  touched = false;
  const qss = S.get(SK.QSALE, []);
  const qssFixed = qss.map((q) => q.voucherNo ? q : (touched = true, { ...q, voucherNo: nextVoucherNo() }));
  if (touched) S.set(SK.QSALE, qssFixed);
};
const fyCode = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : /* @__PURE__ */ new Date();
  if (isNaN(d.getTime())) return fyCode(today());
  const y = d.getFullYear(), m = d.getMonth() + 1;
  const startYear = m >= 4 ? y : y - 1;
  return String(startYear).slice(-2) + String(startYear + 1).slice(-2);
};
const nextTxnRefNo = (dateStr) => {
  const fy = fyCode(dateStr);
  const seqs = S.get(SK.TXNREFSEQ, {});
  const n = (parseInt(seqs[fy], 10) || 0) + 1;
  S.set(SK.TXNREFSEQ, { ...seqs, [fy]: n });
  return fy + String(n).padStart(6, "0");
};
const ensureTxnRefNumbers = () => {
  let touched = false;
  const invs = S.get(SK.INV, []);
  const invsFixed = invs.map((i) => i.txnRefNo ? i : (touched = true, { ...i, txnRefNo: nextTxnRefNo(i.date) }));
  if (touched) S.set(SK.INV, invsFixed);
  touched = false;
  const exps = S.get(SK.EXP, []);
  const expsFixed = exps.map((e) => e.txnRefNo ? e : (touched = true, { ...e, txnRefNo: nextTxnRefNo(e.billDate || e.date) }));
  if (touched) S.set(SK.EXP, expsFixed);
  touched = false;
  const jvs = S.get(SK.JOURNAL, []);
  const jvsFixed = jvs.map((j) => j.txnRefNo ? j : (touched = true, { ...j, txnRefNo: nextTxnRefNo(j.date) }));
  if (touched) S.set(SK.JOURNAL, jvsFixed);
  touched = false;
  const qss = S.get(SK.QSALE, []);
  const qssFixed = qss.map((q) => q.txnRefNo ? q : (touched = true, { ...q, txnRefNo: nextTxnRefNo(q.date) }));
  if (touched) S.set(SK.QSALE, qssFixed);
};
