const getBankBalanceAsOf = (asOf) => {
  const accounts = S.get(SK.BANK_ACCTS, []);
  const allTxns = S.get(SK.BANK, []);
  return accounts.reduce((sum, acc) => {
    const bal = allTxns.filter((t) => (t.acctId || "PRIMARY") === acc.id && (!asOf || (t.date || "") <= asOf)).reduce((b, t) => b + (t.type === "credit" ? 1 : -1) * (parseFloat(t.amount) || 0), parseFloat(acc.openingBalance) || 0);
    return sum + bal;
  }, 0);
};
const getStockValueNow = () => {
  const map = buildFifoLayers();
  let total = 0;
  Object.values(map).forEach(({ layers }) => layers.forEach((l) => total += l.qty * l.rate));
  return total;
};
const COA = [
  { key: "FIXED_ASSETS", name: "Fixed Assets (Tangible)", type: "asset", group: "Non-Current Assets", scheduleGroup: "Fixed Assets (Tangible)" },
  { key: "ACC_DEPRECIATION", name: "Accumulated Depreciation", type: "asset", group: "Non-Current Assets", scheduleGroup: "Accumulated Depreciation" },
  { key: "INVESTMENTS", name: "Non-Current Investments", type: "asset", group: "Non-Current Assets", scheduleGroup: "Non-Current Investments" },
  { key: "INVENTORY", name: "Inventories", type: "asset", group: "Current Assets", scheduleGroup: "Inventories" },
  { key: "TRADE_RECEIVABLE", name: "Trade Receivables", type: "asset", group: "Current Assets", scheduleGroup: "Trade Receivables" },
  { key: "BANK", name: "Cash and Cash Equivalents", type: "asset", group: "Current Assets", scheduleGroup: "Cash and Cash Equivalents", groupOnly: true },
  { key: "CASH_IN_HAND", name: "Cash in Hand", type: "asset", group: "Current Assets", scheduleGroup: "Cash and Cash Equivalents", parent: "BANK" },
  { key: "INPUT_GST", name: "Balances with Govt. Authorities (Input GST)", type: "asset", group: "Current Assets", scheduleGroup: "Balances with Govt. Authorities" },
  { key: "ADVANCES", name: "Short-term Loans & Advances", type: "asset", group: "Current Assets", scheduleGroup: "Short-term Loans & Advances" },
  { key: "PREPAID_EXP", name: "Prepaid Expenses", type: "asset", group: "Current Assets", scheduleGroup: "Prepaid Expenses" },
  { key: "TDS_RECEIVABLE", name: "TDS Receivable (deducted by customers)", type: "asset", group: "Current Assets", scheduleGroup: "Balances with Govt. Authorities" },
  { key: "SUSPENSE_OUT", name: "Unidentified Bank Payments (Suspense)", type: "asset", group: "Current Assets", scheduleGroup: "Other Current Assets" },
  { key: "CAPITAL", name: "Owner's Capital / Share Capital", type: "equity", group: "Equity", scheduleGroup: "Equity" },
  { key: "RETAINED_EARNINGS", name: "Reserves & Surplus (Retained Earnings)", type: "equity", group: "Equity", scheduleGroup: "Equity", computed: true },
  { key: "LT_BORROWING", name: "Long-term Borrowings", type: "liability", group: "Non-Current Liabilities", scheduleGroup: "Long-term Borrowings" },
  { key: "LT_PROVISION", name: "Long-term Provisions", type: "liability", group: "Non-Current Liabilities", scheduleGroup: "Long-term Provisions" },
  { key: "ST_BORROWING", name: "Short-term Borrowings", type: "liability", group: "Current Liabilities", scheduleGroup: "Short-term Borrowings" },
  { key: "TRADE_PAYABLE", name: "Trade Payables", type: "liability", group: "Current Liabilities", scheduleGroup: "Trade Payables" },
  { key: "OUTPUT_GST", name: "Balances with Govt. Authorities (Output GST)", type: "liability", group: "Current Liabilities", scheduleGroup: "Balances with Govt. Authorities" },
  { key: "TDS_PAYABLE", name: "TDS Payable (Duties & Taxes)", type: "liability", group: "Current Liabilities", scheduleGroup: "Duties and Taxes" },
  { key: "ST_PROVISION", name: "Short-term Provisions", type: "liability", group: "Current Liabilities", scheduleGroup: "Short-term Provisions" },
  { key: "SUSPENSE_IN", name: "Unidentified Bank Receipts (Suspense)", type: "liability", group: "Current Liabilities", scheduleGroup: "Other Current Liabilities" },
  { key: "CUSTOMER_ADVANCE", name: "Advances from Customers", type: "liability", group: "Current Liabilities", scheduleGroup: "Other Current Liabilities" },
  { key: "OTHER_CURRENT_LIAB", name: "Other Current Liabilities", type: "liability", group: "Current Liabilities", scheduleGroup: "Other Current Liabilities" },
  { key: "SALES", name: "Revenue from Operations (Sales)", type: "income", group: "Income", scheduleGroup: "Revenue from Operations" },
  { key: "OTHER_INCOME", name: "Other Income", type: "income", group: "Income", scheduleGroup: "Other Income" },
  { key: "FX_GAIN", name: "Foreign Exchange Gain", type: "income", group: "Income", scheduleGroup: "Other Income" },
  { key: "GAIN_ON_ASSET_SALE", name: "Profit on Sale of Fixed Assets", type: "income", group: "Income", scheduleGroup: "Other Income" },
  { key: "COGS", name: "Cost of Materials Consumed", type: "expense", group: "Expenses", scheduleGroup: "Cost of Materials Consumed" },
  { key: "EMPLOYEE_EXP", name: "Employee Benefit Expense", type: "expense", group: "Expenses", scheduleGroup: "Employee Benefit Expense" },
  { key: "FINANCE_COST", name: "Finance Costs", type: "expense", group: "Expenses", scheduleGroup: "Finance Costs" },
  { key: "DEPRECIATION", name: "Depreciation and Amortisation Expense", type: "expense", group: "Expenses", scheduleGroup: "Depreciation and Amortisation Expense" },
  { key: "RENT_EXP", name: "Rent Expense", type: "expense", group: "Expenses", scheduleGroup: "Rent Expense" },
  { key: "OTHER_EXP", name: "Other Expenses", type: "expense", group: "Expenses", scheduleGroup: "Other Expenses" },
  { key: "FX_LOSS", name: "Foreign Exchange Loss", type: "expense", group: "Expenses", scheduleGroup: "Other Expenses" },
  { key: "LOSS_ON_ASSET_SALE", name: "Loss on Sale of Fixed Assets", type: "expense", group: "Expenses", scheduleGroup: "Other Expenses" },
  { key: "SALARY_PAYABLE", name: "Salary Payable", type: "liability", group: "Current Liabilities", scheduleGroup: "Other Current Liabilities" },
  { key: "PF_PAYABLE", name: "Provident Fund Payable", type: "liability", group: "Current Liabilities", scheduleGroup: "Other Current Liabilities" },
  { key: "ESI_PAYABLE", name: "ESI Payable", type: "liability", group: "Current Liabilities", scheduleGroup: "Other Current Liabilities" },
  { key: "PT_PAYABLE", name: "Professional Tax Payable", type: "liability", group: "Current Liabilities", scheduleGroup: "Other Current Liabilities" },
  { key: "TDS_SALARY_PAYABLE", name: "TDS Payable on Salary", type: "liability", group: "Current Liabilities", scheduleGroup: "Other Current Liabilities" },
  { key: "EMPLOYER_CONTRIB", name: "Employer Contribution to PF & ESI", type: "expense", group: "Expenses", scheduleGroup: "Employee Benefit Expense" },
  { key: "EMP_LOAN", name: "Loans & Advances to Employees", type: "asset", group: "Current Assets", scheduleGroup: "Short-term Loans & Advances" }
];
const SCHEDULE_CAPTIONS = {
  asset: ["Fixed Assets (Tangible)", "Non-Current Investments", "Inventories", "Trade Receivables", "Cash and Cash Equivalents", "Balances with Govt. Authorities", "Short-term Loans & Advances", "Prepaid Expenses", "Other Current Assets"],
  liability: ["Long-term Borrowings", "Long-term Provisions", "Short-term Borrowings", "Trade Payables", "Balances with Govt. Authorities", "Short-term Provisions", "Other Current Liabilities"],
  equity: ["Equity"],
  income: ["Revenue from Operations", "Other Income"],
  expense: ["Cost of Materials Consumed", "Employee Benefit Expense", "Finance Costs", "Depreciation and Amortisation Expense", "Rent Expense", "Other Expenses"]
};
const GROUP_OPTIONS = {
  asset: ["Non-Current Assets", "Current Assets"],
  liability: ["Non-Current Liabilities", "Current Liabilities"],
  equity: ["Equity"],
  income: ["Income"],
  expense: ["Expenses"]
};
const bankLedgerKey = (id) => "BANK_" + String(id || "PRIMARY");
const getBankAccounts = () => {
  const a = S.get(SK.BANK_ACCTS, []);
  if (a && a.length) return a;
  return [{ id: "PRIMARY", name: "Primary Account", bankName: "", accountNo: "", openingBalance: parseFloat(S.get(SK.BANK_OB, 0)) || 0 }];
};
const bankLedgerName = (a) => `Bank \u2014 ${a.name}${a.bankName ? " (" + a.bankName + ")" : ""}${a.accountNo ? " \u2022\u2022" + String(a.accountNo).slice(-4) : ""}`;
const getBankLedgers = () => getBankAccounts().map((a) => ({ key: bankLedgerKey(a.id), name: bankLedgerName(a), type: "asset", group: "Current Assets", scheduleGroup: "Cash and Cash Equivalents", parent: "BANK", derived: true, bankAcctId: a.id }));
const getCustomAccounts = () => S.get(SK.COA_CUSTOM, []);
const getAllAccounts = () => [...COA, ...getBankLedgers(), ...getCustomAccounts()];
const coaByKey = (key) => getAllAccounts().find((a) => a.key === key) || { key, name: key, type: "asset", group: "Other", scheduleGroup: "Other" };
const getPaymentLedgers = () => getAllAccounts().filter((a) => a.parent === "BANK");
const DEFAULT_CAPTION = { asset: "Other Current Assets", liability: "Other Current Liabilities", equity: "Equity", income: "Other Income", expense: "Other Expenses" };
const createLedgerAccount = ({ name, type, group, scheduleGroup, parent }) => {
  const all = getAllAccounts();
  const par = parent ? all.find((a) => a.key === parent) : null;
  const t = par ? par.type : type || "expense";
  const g = par ? par.group : group || GROUP_OPTIONS[t][0];
  const sg = par ? par.scheduleGroup : scheduleGroup || DEFAULT_CAPTION[t] || name.trim();
  const slug = (name || "").toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 24) || "ACC";
  const key = "CUST_" + slug + "_" + Date.now().toString(36).slice(-4);
  const rec = { key, name: name.trim(), type: t, group: g, scheduleGroup: sg, custom: true, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
  if (par) rec.parent = par.key;
  S.set(SK.COA_CUSTOM, [...getCustomAccounts(), rec]);
  return key;
};
const updateLedgerAccount = (key, patch) => {
  S.set(SK.COA_CUSTOM, getCustomAccounts().map((a) => a.key === key ? { ...a, ...patch } : a));
};
const deleteLedgerAccount = (key) => {
  if (getAllAccounts().some((a) => a.parent === key)) return { ok: false, reason: "This ledger has sub-ledgers under it \u2014 move or delete them first." };
  const inUse = getAllLedgerLines().some((l) => l.account === key);
  if (inUse) return { ok: false, reason: "This ledger already has transactions posted to it \u2014 it can't be deleted." };
  const usedByBill = S.get(SK.EXP, []).some((e) => e.expenseAccountKey === key);
  if (usedByBill) return { ok: false, reason: "Purchase bills still point to this expense head \u2014 it can't be deleted." };
  const usedByRule = (S.get(SK.BANK_RULES, []) || []).some((r) => r.ledgerKey === key);
  if (usedByRule) return { ok: false, reason: "A bank auto-categorisation rule posts to this ledger \u2014 remove the rule first." };
  S.set(SK.COA_CUSTOM, getCustomAccounts().filter((a) => a.key !== key));
  return { ok: true };
};
const DEFAULT_POLICIES = `1. Basis of preparation: These financial statements are prepared on an accrual basis of accounting, under the historical cost convention.
2. Revenue recognition: Revenue from sale of goods/services is recognised at the point of raising the invoice, net of GST and returns (Credit Notes).
3. Inventory: Valued at cost, determined on a First-In-First-Out (FIFO) basis, or net realisable value, whichever is lower.
4. Fixed assets & depreciation: Fixed assets are stated at cost less accumulated depreciation. Depreciation is provided as per the applicable rates/useful life on a systematic basis.
5. GST: Input GST and Output GST are accounted for separately and shown under Current Assets / Current Liabilities respectively, pending set-off/refund.
6. Trade Receivables/Payables: Recognised at invoice value and reviewed periodically for recoverability/ageing.`;
const getPolicies = () => S.get(SK.POLICIES, DEFAULT_POLICIES);
const guessExpenseAccount = (category) => {
  const c = (category || "").toLowerCase();
  const map = S.get(SK.ACCMAP, {});
  if (map[c]) return map[c];
  if (/rent/.test(c)) return "RENT_EXP";
  if (/salary|wage|payroll|staff|employee/.test(c)) return "EMPLOYEE_EXP";
  if (/interest|bank charge|loan|finance/.test(c)) return "FINANCE_COST";
  if (/depreciation/.test(c)) return "DEPRECIATION";
  return "OTHER_EXP";
};
const setExpenseAccountMap = (category, accKey) => {
  const map = { ...S.get(SK.ACCMAP, {}) };
  map[(category || "").toLowerCase().trim()] = accKey;
  S.set(SK.ACCMAP, map);
};
const invTaxable = (inv) => (inv.items || []).reduce((s, r) => s + (parseFloat(r.taxable) || 0), 0);
const invGstAmt = (inv) => (inv.items || []).reduce((s, r) => s + (parseFloat(r.gstAmt) || 0), 0);
const getStockValueAsOf = (asOf) => {
  const log = stockLog().filter((l) => (l.date || "") <= asOf);
  const { layers } = computeFIFO(log);
  let total = 0;
  Object.values(layers).forEach((arr) => arr.forEach((l) => total += (l.qty || 0) * (l.rate || 0)));
  return total;
};
const OPENING_DATE = "1900-01-01";
const GL_DOC_TYPE_LABEL = { INV: "Invoice", QSALE: "Invoice", EXP: "Bill", STOCKOB: "Journal", BANKOB: "Journal", COGS: "Journal", JV: "Journal", BANKTXN: "Receipt", EXPPAY: "Payment" };
const buildAutoJournal = () => {
  const entries = [];
  const add = (date, narration, srcType, srcId, lines, voucherNo, meta = {}) => {
    const d = +lines.reduce((s, l) => s + (l.debit || 0), 0).toFixed(2);
    const c = +lines.reduce((s, l) => s + (l.credit || 0), 0).toFixed(2);
    if (Math.abs(d - c) <= 0.02) entries.push({
      date: date || today(),
      narration,
      srcType,
      srcId,
      voucherNo: voucherNo || "",
      txnRefNo: meta.txnRefNo || "",
      docNo: meta.docNo || "",
      category: meta.category || "",
      docType: meta.docType || GL_DOC_TYPE_LABEL[srcType] || "Journal",
      lines
    });
  };
  const invByNo = {};
  S.get(SK.INV, []).forEach((i) => {
    invByNo[i.invNo] = i;
  });
  const expById = {};
  S.get(SK.EXP, []).forEach((e) => {
    expById[e.id] = e;
  });
  const qsById = {};
  S.get(SK.QSALE, []).forEach((q) => {
    qsById[q.id] = q;
  });
  S.get(SK.INV, []).forEach((inv) => {
    var _a;
    if (!["TAX INVOICE", "NON GST INVOICE", "DEBIT NOTE", "CREDIT NOTE"].includes(inv.docType)) return;
    if (inv.status === "Draft" || inv.status === "Cancelled") return;
    const rev = inv.docType === "CREDIT NOTE" ? -1 : 1;
    const grand = Math.abs(getGrand(inv)) * rev, gst = Math.abs(invGstAmt(inv)) * rev, taxable = +(grand - gst).toFixed(2);
    const lines = [];
    lines.push(grand >= 0 ? { account: "TRADE_RECEIVABLE", debit: grand, credit: 0 } : { account: "TRADE_RECEIVABLE", debit: 0, credit: -grand });
    lines.push(taxable >= 0 ? { account: "SALES", debit: 0, credit: taxable } : { account: "SALES", debit: -taxable, credit: 0 });
    if (Math.abs(gst) > 4e-3) lines.push(gst >= 0 ? { account: "OUTPUT_GST", debit: 0, credit: gst } : { account: "OUTPUT_GST", debit: -gst, credit: 0 });
    add(
      inv.date,
      `${inv.docType} ${inv.invNo}${((_a = inv.billTo) == null ? void 0 : _a.name) ? " \u2014 " + inv.billTo.name : ""}`,
      "INV",
      inv.invNo,
      lines,
      inv.voucherNo,
      { txnRefNo: inv.txnRefNo, docNo: inv.invNo, category: inv.docType, docType: inv.docType === "CREDIT NOTE" || inv.docType === "DEBIT NOTE" ? "Journal" : "Invoice" }
    );
  });
  S.get(SK.QSALE, []).forEach((qs) => {
    const amt = parseFloat(qs.amount) || 0;
    if (!amt) return;
    add(qs.date, `Quick Sale ${qs.id}${qs.customer ? " \u2014 " + qs.customer : ""}`, "QSALE", qs.id, [
      { account: "TRADE_RECEIVABLE", debit: amt, credit: 0 },
      { account: "SALES", debit: 0, credit: amt }
    ], qs.voucherNo, { txnRefNo: qs.txnRefNo, docNo: qs.id, category: "Quick Sale" });
  });
  const productsForStockCheck = S.get(SK.PRODUCTS, []);
  const isStockLine = (it) => {
    if (it.toStock === false) return false;
    const name = it.product || it.desc;
    const prod = productsForStockCheck.find((p) => (p.name || "").toLowerCase() === String(name || "").toLowerCase());
    return !!(prod && prod.trackStock);
  };
  S.get(SK.EXP, []).forEach((exp) => {
    const items = expItems(exp);
    if (!items.length) return;
    const when = exp.billDate || exp.date;
    const stockTaxable = items.filter(isStockLine).reduce((s, it) => s + (parseFloat(it.taxable) || 0), 0);
    const expTaxable = items.filter((it) => !isStockLine(it)).reduce((s, it) => s + (parseFloat(it.taxable) || 0), 0);
    const gst = items.reduce((s, it) => s + (parseFloat(it.gstAmt) || 0), 0);
    const total = parseFloat(exp.total) || +(stockTaxable + expTaxable + gst).toFixed(2);
    const tds = parseFloat(exp.tdsAmount) || 0;
    const payable = +(total - tds).toFixed(2);
    const lines = [];
    if (stockTaxable > 4e-3) lines.push({ account: "INVENTORY", debit: +stockTaxable.toFixed(2), credit: 0 });
    if (expTaxable > 4e-3) lines.push({ account: exp.expenseAccountKey || guessExpenseAccount(exp.category), debit: +expTaxable.toFixed(2), credit: 0 });
    if (gst > 4e-3) lines.push({ account: "INPUT_GST", debit: +gst.toFixed(2), credit: 0 });
    if (tds > 4e-3) lines.push({ account: "TDS_PAYABLE", debit: 0, credit: +tds.toFixed(2) });
    lines.push({ account: "TRADE_PAYABLE", debit: 0, credit: +payable.toFixed(2) });
    add(
      when,
      `Purchase ${exp.billNo || exp.id}${exp.vendor ? " \u2014 " + exp.vendor : ""}`,
      "EXP",
      exp.id,
      lines,
      exp.voucherNo,
      { txnRefNo: exp.txnRefNo, docNo: exp.billNo || exp.id, category: exp.category || "" }
    );
  });
  productsForStockCheck.filter((p) => p.trackStock && (parseFloat(p.openingStock) || 0) > 0).forEach((p) => {
    const val = (parseFloat(p.openingStock) || 0) * (parseFloat(p.openingRate || p.rate) || 0);
    if (val > 4e-3) add(OPENING_DATE, `Opening stock \u2014 ${p.name}`, "STOCKOB", p.name, [
      { account: "INVENTORY", debit: +val.toFixed(2), credit: 0 },
      { account: "CAPITAL", debit: 0, credit: +val.toFixed(2) }
    ], "OPEN-" + p.name.replace(/\s+/g, "").slice(0, 8).toUpperCase(), { docNo: p.name, category: "Opening Stock" });
  });
  getBankAccounts().forEach((acc) => {
    const ob = parseFloat(acc.openingBalance) || 0;
    if (Math.abs(ob) <= 4e-3) return;
    const obVoucher = "OPEN-" + String(acc.id).replace(/\s+/g, "").slice(0, 8).toUpperCase();
    if (ob >= 0) add(OPENING_DATE, `Opening balance \u2014 ${acc.name}`, "BANKOB", acc.id, [{ account: bankLedgerKey(acc.id), debit: ob, credit: 0 }, { account: "CAPITAL", debit: 0, credit: ob }], obVoucher, { docNo: acc.name, category: "Opening Balance" });
    else add(OPENING_DATE, `Opening balance \u2014 ${acc.name}`, "BANKOB", acc.id, [{ account: "CAPITAL", debit: -ob, credit: 0 }, { account: bankLedgerKey(acc.id), debit: 0, credit: -ob }], obVoucher, { docNo: acc.name, category: "Opening Balance" });
  });
  const bankTxnsAll = S.get(SK.BANK, []);
  const txnById = {};
  bankTxnsAll.forEach((t) => {
    txnById[t.id] = t;
  });
  const bankAcctName = (id) => {
    const a = getBankAccounts().find((x) => x.id === id);
    return a ? a.name : id;
  };
  bankTxnsAll.forEach((t) => {
    var _a, _b, _c, _d, _e, _f;
    const amt = parseFloat(t.amount) || 0;
    if (!amt) return;
    const acctId = t.acctId || "PRIMARY";
    const bk = bankLedgerKey(acctId);
    const isCredit = t.type === "credit";
    const allocs = Array.isArray(t.allocs) ? t.allocs.filter((a) => (parseFloat(a.amt) || 0) > 4e-3) : [];
    const docKind = allocs.length ? allocs[0].kind : t.matchedType;
    const docRef = allocs.length ? allocs[0].ref : t.matchedRef;
    let settleVoucher = "", settleTxnRef = "";
    if (docKind === "invoice" || docKind === "creditnote") {
      settleVoucher = ((_a = invByNo[docRef]) == null ? void 0 : _a.voucherNo) || "";
      settleTxnRef = ((_b = invByNo[docRef]) == null ? void 0 : _b.txnRefNo) || "";
    } else if (docKind === "quicksale") {
      settleVoucher = ((_c = qsById[docRef]) == null ? void 0 : _c.voucherNo) || "";
      settleTxnRef = ((_d = qsById[docRef]) == null ? void 0 : _d.txnRefNo) || "";
    } else if (docKind === "expense") {
      settleVoucher = ((_e = expById[docRef]) == null ? void 0 : _e.voucherNo) || "";
      settleTxnRef = ((_f = expById[docRef]) == null ? void 0 : _f.txnRefNo) || "";
    }
    if (t.matchedType === "transfer") {
      const partner = txnById[t.matchedRef];
      if (partner && (partner.acctId || "PRIMARY") !== acctId) {
        if (!isCredit) {
          add(t.date, `Transfer to ${bankAcctName(partner.acctId || "PRIMARY")} \u2014 ${t.desc || "Inter-bank transfer"}`, "BANKTXN", t.id, [
            { account: bankLedgerKey(partner.acctId || "PRIMARY"), debit: amt, credit: 0 },
            { account: bk, debit: 0, credit: amt }
          ], "", { docNo: "", category: "Inter-bank Transfer", docType: "Transfer" });
        }
        return;
      }
    }
    const partyKey = docKind === "creditnote" ? "TRADE_RECEIVABLE" : docKind === "suprefund" ? t.refundLedger || "TRADE_PAYABLE" : isCredit ? "TRADE_RECEIVABLE" : "TRADE_PAYABLE";
    const lines = [isCredit ? { account: bk, debit: amt, credit: 0 } : { account: bk, debit: 0, credit: amt }];
    let category = isCredit ? "Unmatched Receipt" : "Unmatched Payment";
    if (t.matchedType === "ledger" && t.ledgerKey) {
      lines.push(isCredit ? { account: t.ledgerKey, debit: 0, credit: amt } : { account: t.ledgerKey, debit: amt, credit: 0 });
      category = "Posted to " + coaByKey(t.ledgerKey).name;
    } else if (allocs.length) {
      const A = +allocs.reduce((s, a) => s + (parseFloat(a.amt) || 0), 0).toFixed(2);
      lines.push(isCredit ? { account: partyKey, debit: 0, credit: A } : { account: partyKey, debit: A, credit: 0 });
      const d = +(amt - A).toFixed(2);
      if (Math.abs(d) > 4e-3) {
        const rk0 = t.restKey || (docKind === "creditnote" ? d > 0 ? "OTHER_EXP" : "OTHER_INCOME" : docKind === "suprefund" ? d > 0 ? "OTHER_INCOME" : "OTHER_EXP" : isCredit ? d > 0 ? "CUSTOMER_ADVANCE" : "TDS_RECEIVABLE" : d > 0 ? "ADVANCES" : "OTHER_INCOME");
        const creditSide = isCredit ? d > 0 : d < 0;
        const rk = rk0 === "FX" ? creditSide ? "FX_GAIN" : "FX_LOSS" : rk0;
        lines.push(creditSide ? { account: rk, debit: 0, credit: Math.abs(d) } : { account: rk, debit: Math.abs(d), credit: 0 });
      }
      category = docKind === "expense" ? "Bill Payment" : docKind === "creditnote" ? "Customer Refund" : docKind === "suprefund" ? "Supplier Refund" : "Invoice Receipt";
    } else if (docKind === "invoice" || docKind === "quicksale" || docKind === "expense") {
      lines.push(isCredit ? { account: partyKey, debit: 0, credit: amt } : { account: partyKey, debit: amt, credit: 0 });
      category = docKind === "invoice" ? "Invoice Receipt" : docKind === "quicksale" ? "Quick Sale Receipt" : "Bill Payment";
    } else {
      const sus = isCredit ? "SUSPENSE_IN" : "SUSPENSE_OUT";
      lines.push(isCredit ? { account: sus, debit: 0, credit: amt } : { account: sus, debit: amt, credit: 0 });
    }
    add(
      t.date,
      `${isCredit ? "Receipt" : "Payment"} \u2014 ${t.desc || (isCredit ? "Bank credit" : "Bank debit")}${t.matchedRef ? " (" + t.matchedRef + ")" : ""}`,
      "BANKTXN",
      t.id,
      lines,
      settleVoucher,
      { txnRefNo: settleTxnRef, docNo: allocs.length ? allocs.map((a) => a.ref).join(", ") : t.matchedRef || "", category, docType: isCredit ? "Receipt" : "Payment" }
    );
  });
  const bankSettledExp = {};
  bankTxnsAll.forEach((t) => {
    if (t.type !== "debit") return;
    if (Array.isArray(t.allocs) && t.allocs.length) {
      t.allocs.forEach((a) => {
        if (a.kind === "expense") bankSettledExp[a.ref] = (bankSettledExp[a.ref] || 0) + (parseFloat(a.amt) || 0);
      });
    } else if (t.matched && t.matchedType === "expense") bankSettledExp[t.matchedRef] = Infinity;
  });
  S.get(SK.EXP, []).forEach((exp) => {
    if (!exp.paidFromKey) return;
    const paid = expPaid(exp);
    if (paid <= 4e-3) return;
    const direct = +(paid - Math.min(paid, bankSettledExp[exp.id] || 0)).toFixed(2);
    if (direct <= 4e-3) return;
    add(exp.paidDate || exp.billDate || exp.date, `Payment \u2014 ${exp.vendor || "Vendor"} (${exp.billNo || exp.id})`, "EXPPAY", exp.id, [
      { account: "TRADE_PAYABLE", debit: direct, credit: 0 },
      { account: exp.paidFromKey, debit: 0, credit: direct }
    ], exp.voucherNo, { txnRefNo: exp.txnRefNo, docNo: exp.billNo || exp.id, category: "Bill Payment (direct)", docType: "Payment" });
  });
  const { cogsByLine, rows } = computeFIFO();
  rows.filter((r) => r.qty < 0 && r.refType === "INVOICE" && (cogsByLine[r.id] || 0) > 4e-3).forEach((r) => {
    var _a, _b;
    add(r.date, `COGS \u2014 ${r.product} (${r.ref})`, "COGS", r.id, [
      { account: "COGS", debit: +cogsByLine[r.id].toFixed(2), credit: 0 },
      { account: "INVENTORY", debit: 0, credit: +cogsByLine[r.id].toFixed(2) }
    ], ((_a = invByNo[r.ref]) == null ? void 0 : _a.voucherNo) || "", { txnRefNo: ((_b = invByNo[r.ref]) == null ? void 0 : _b.txnRefNo) || "", docNo: r.ref, category: "Cost of Goods Sold" });
  });
  buildFixedAssetEntries(add);
  buildAdvanceEntries(add);
  buildPayrollEntries(add);
  return entries;
};
const getManualJournal = () => S.get(SK.JOURNAL, []);
const saveManualJournalEntry = (entry) => {
  if (isLockedDate(entry.date, "accountant")) {
    toast.error("Transactions up to " + fmtDate(getTxnLock().mods.accountant > getTxnLock().all ? getTxnLock().mods.accountant : getTxnLock().all) + " are locked (Transaction Locking).");
    return null;
  }
  const list = getManualJournal();
  const rec = { ...entry, id: entry.id || "JV-" + Date.now().toString(36), voucherNo: entry.voucherNo || nextVoucherNo(), txnRefNo: entry.txnRefNo || nextTxnRefNo(entry.date) };
  const updated = entry.id ? list.map((e) => e.id === entry.id ? rec : e) : [...list, rec];
  S.set(SK.JOURNAL, updated);
  return rec;
};
const deleteManualJournalEntry = (id) => S.set(SK.JOURNAL, getManualJournal().filter((e) => e.id !== id));
let _gllKey = null, _gllVal = null;
const getAllLedgerLines = () => {
  const _k = _ver + "|" + today();
  if (_gllKey === _k && _gllVal) return _gllVal.slice();
  const out = [];
  [...buildAutoJournal(), ...getManualJournal()].forEach((entry) => {
    const rm = entry.reportingMethod || "both";
    const meta = {
      txnRefNo: entry.txnRefNo || "",
      docNo: entry.docNo != null ? entry.docNo : entry.referenceNo || "",
      category: entry.category || "",
      docType: entry.docType || "Journal"
    };
    (entry.lines || []).forEach((l) => out.push({ date: entry.date, account: l.account, debit: +(l.debit || 0), credit: +(l.credit || 0), narration: entry.narration, srcType: entry.srcType || "JV", srcId: entry.srcId || entry.id, voucherNo: entry.voucherNo || "", reportingMethod: rm, ...meta }));
    if (entry.reverseDate) {
      (entry.lines || []).forEach((l) => out.push({ date: entry.reverseDate, account: l.account, debit: +(l.credit || 0), credit: +(l.debit || 0), narration: (entry.narration || "") + " (Reversal)", srcType: entry.srcType || "JV", srcId: (entry.srcId || entry.id) + "-REV", voucherNo: entry.voucherNo || "", reportingMethod: rm, ...meta }));
    }
  });
  _gllKey = _k;
  _gllVal = out;
  return out.slice();
};
const getTrialBalance = (asOf) => {
  const lines = getAllLedgerLines().filter((l) => (l.date || "") <= asOf);
  const byAcc = {};
  lines.forEach((l) => {
    if (!byAcc[l.account]) byAcc[l.account] = { account: l.account, debit: 0, credit: 0 };
    byAcc[l.account].debit += l.debit;
    byAcc[l.account].credit += l.credit;
  });
  return Object.values(byAcc).map((r) => ({ ...r, debit: +r.debit.toFixed(2), credit: +r.credit.toFixed(2), balance: +(r.debit - r.credit).toFixed(2) })).filter((r) => Math.abs(r.debit) > 4e-3 || Math.abs(r.credit) > 4e-3);
};
const getPLAccrual = (from, to) => {
  const lines = getAllLedgerLines().filter((l) => (l.date || "") >= from && (l.date || "") <= to && l.reportingMethod !== "cash");
  const byAcc = {};
  lines.forEach((l) => {
    const acc = coaByKey(l.account);
    if (acc.type !== "income" && acc.type !== "expense") return;
    if (!byAcc[l.account]) byAcc[l.account] = { account: l.account, name: acc.name, scheduleGroup: acc.scheduleGroup, amount: 0 };
    byAcc[l.account].amount += acc.type === "income" ? l.credit - l.debit : l.debit - l.credit;
  });
  const rows = Object.values(byAcc).map((r) => ({ ...r, type: coaByKey(r.account).type })).filter((r) => Math.abs(r.amount) > 4e-3);
  const income = rows.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
  const expense = rows.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  return { rows, income: +income.toFixed(2), expense: +expense.toFixed(2), net: +(income - expense).toFixed(2) };
};
const getPLCash = (from, to) => {
  const txns = S.get(SK.BANK, []).filter((t) => (t.date || "") >= from && (t.date || "") <= to && t.matchedType !== "transfer");
  const received = txns.filter((t) => t.type === "credit").reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
  const paid = txns.filter((t) => t.type === "debit").reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
  let manualIn = 0, manualOut = 0;
  getManualJournal().filter((e) => (e.date || "") >= from && (e.date || "") <= to && (e.reportingMethod || "both") !== "accrual").forEach((e) => (e.lines || []).forEach((l) => {
    if (l.account === "BANK" || coaByKey(l.account).parent === "BANK") {
      manualIn += l.debit || 0;
      manualOut += l.credit || 0;
    }
  }));
  const income = +(received + manualIn).toFixed(2), expense = +(paid + manualOut).toFixed(2);
  return { income, expense, net: +(income - expense).toFixed(2) };
};
const getBalanceSheet = (asOf) => {
  const tb = getTrialBalance(asOf);
  const val = (key) => {
    const r = tb.find((x) => x.account === key);
    return r ? r.balance : 0;
  };
  const assets = [], liabilities = [], equity = [];
  getAllAccounts().forEach((a) => {
    if (a.key === "RETAINED_EARNINGS") return;
    const bal = val(a.key);
    if (Math.abs(bal) < 4e-3) return;
    if (a.type === "asset") assets.push({ key: a.key, name: a.name, group: a.group, scheduleGroup: a.scheduleGroup, amount: +bal.toFixed(2) });
    else if (a.type === "liability") liabilities.push({ key: a.key, name: a.name, group: a.group, scheduleGroup: a.scheduleGroup, amount: +(-bal).toFixed(2) });
    else if (a.type === "equity") equity.push({ key: a.key, name: a.name, group: a.group, scheduleGroup: a.scheduleGroup, amount: +(-bal).toFixed(2) });
  });
  let netProfit = 0;
  tb.forEach((r) => {
    const a = coaByKey(r.account);
    if (a.type === "income") netProfit += -r.balance;
    else if (a.type === "expense") netProfit -= r.balance;
  });
  equity.push({ key: "RETAINED_EARNINGS", name: "Reserves & Surplus (Retained Earnings)", group: "Equity", scheduleGroup: "Equity", amount: +netProfit.toFixed(2) });
  const totalAssets = +assets.reduce((s, a) => s + a.amount, 0).toFixed(2);
  const totalLiab = +liabilities.reduce((s, a) => s + a.amount, 0).toFixed(2);
  const totalEquity = +equity.reduce((s, a) => s + a.amount, 0).toFixed(2);
  return { assets, liabilities, equity, totalAssets, totalLiab, totalEquity, tallies: Math.abs(totalAssets - (totalLiab + totalEquity)) < 0.5 };
};
const groupByCaption = (rows, order = []) => {
  const byCap = {};
  rows.forEach((r) => {
    const cap = r.scheduleGroup || r.name;
    if (!byCap[cap]) byCap[cap] = { caption: cap, amount: 0, accounts: [] };
    byCap[cap].amount += r.amount;
    byCap[cap].accounts.push(r);
  });
  const all = Object.values(byCap);
  const known = order.filter((o) => all.some((x) => x.caption === o)).map((o) => all.find((x) => x.caption === o));
  const rest = all.filter((x) => !order.includes(x.caption)).sort((a, b) => a.caption.localeCompare(b.caption));
  return [...known, ...rest];
};
const EXP_CAPTION_ORDER = ["Cost of Materials Consumed", "Employee Benefit Expense", "Finance Costs", "Depreciation and Amortisation Expense", "Rent Expense", "Other Expenses"];
const INC_CAPTION_ORDER = ["Revenue from Operations", "Other Income"];
const mergeCaptionAmounts = (curList = [], prevList = []) => {
  const names = [];
  curList.forEach((c) => {
    if (!names.includes(c.caption)) names.push(c.caption);
  });
  prevList.forEach((c) => {
    if (!names.includes(c.caption)) names.push(c.caption);
  });
  return names.map((name) => {
    var _a;
    const cur = curList.find((c) => c.caption === name);
    const prev = prevList.find((c) => c.caption === name);
    return { caption: name, amount: (cur == null ? void 0 : cur.amount) || 0, prevAmount: (prev == null ? void 0 : prev.amount) || 0, accounts: ((_a = cur || prev) == null ? void 0 : _a.accounts) || [] };
  });
};
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3e3);
};
const exportTableAs = (format, filename, title, headers, rows) => {
  proExport(format, { title, sheets: [{ name: "Report", aoa: [headers, ...rows], h0: true }] }, filename);
};
