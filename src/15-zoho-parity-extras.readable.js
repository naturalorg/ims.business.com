const _lastPage = { books: "dashboard", payroll: "pr_dashboard" };
const TopAppSwitch = ({ page, go }) => {
  const mode = String(page).startsWith("pr_") ? "payroll" : "books";
  _lastPage[mode] = page;
  const B = ({ id, label, ic }) => /* @__PURE__ */ React.createElement("div", { className: "tb2-app" + (mode === id ? " on" : ""), onClick: () => {
    if (mode !== id) go(_lastPage[id]);
  } }, /* @__PURE__ */ React.createElement(Ic, { n: ic, s: 13 }), /* @__PURE__ */ React.createElement("span", null, label));
  return /* @__PURE__ */ React.createElement("div", { className: "tb2-apps" }, /* @__PURE__ */ React.createElement(B, { id: "books", label: "Books", ic: "chart" }), /* @__PURE__ */ React.createElement(B, { id: "payroll", label: "Payroll", ic: "users" }));
};
const SidebarNav = ({ user, page, modal, canSee: canSee2, go, setModal, invView, setInvView, agingView, setAgingView, overdueCount, invCount, poCount, onNav }) => {
  const NavItem = ({ icon, label, badge, badgeCls, onClick, active, extraCls }) => /* @__PURE__ */ React.createElement("div", { className: `nav-item${active ? " active" : ""}${extraCls ? " " + extraCls : ""}`, onClick: () => {
    onClick();
    if (onNav) onNav();
  } }, /* @__PURE__ */ React.createElement("span", { className: "nav-icon" }, icon), /* @__PURE__ */ React.createElement("span", { className: "nav-label" }, label), badge && /* @__PURE__ */ React.createElement("span", { className: `nav-badge${badgeCls ? " " + badgeCls : ""}` }, badge));
  const N = ({ ic, label, pg, s, badge, badgeCls }) => /* @__PURE__ */ React.createElement(NavItem, { icon: /* @__PURE__ */ React.createElement(Ic, { n: ic, s: s || 14 }), label, onClick: () => go(pg), active: page === pg && !modal, badge, badgeCls });
  const isPr = String(page).startsWith("pr_");
  const acct = canSee2(user.role, "reports");
  if (isPr) return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "sidebar-section-label" }, "Payroll"), N({ ic: "chart", label: "Dashboard", pg: "pr_dashboard", s: 17 }), N({ ic: "users", label: "Employees", pg: "pr_employees", s: 17 }), N({ ic: "dollar", label: "Pay Runs", pg: "pr_payruns", s: 17 }), N({ ic: "history", label: "Loans", pg: "pr_loans", s: 17 }), N({ ic: "file", label: "Form 16", pg: "pr_form16", s: 17 }), /* @__PURE__ */ React.createElement("div", { className: "nav-sep" }), N({ ic: "receipt", label: "Payslips", pg: "pr_docs", s: 17 }), N({ ic: "list", label: "Reports", pg: "pr_reports", s: 17 }), N({ ic: "settings", label: "Settings", pg: "pr_settings", s: 17 }), /* @__PURE__ */ React.createElement("div", { className: "nav-sep" }), /* @__PURE__ */ React.createElement("div", { style: { margin: "6px 12px", padding: "10px 12px", borderRadius: 10, background: "rgba(139,92,246,.12)", fontSize: 11, lineHeight: 1.5, color: "var(--text2)" } }, "Payroll posts a journal to your books when you approve a pay run \u2014 Books \u25B8 Accountant \u25B8 General Ledger."));
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "sidebar-section-label" }, "Main"), /* @__PURE__ */ React.createElement(NavItem, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "chart", s: 17 }), label: "Home", onClick: () => go("dashboard"), active: page === "dashboard", badge: overdueCount > 0 ? overdueCount : null, badgeCls: "red" }), (canSee2(user.role, "inventory") || canSee2(user.role, "company")) && /* @__PURE__ */ React.createElement(NavGroup, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "tag", s: 17 }), label: "Items", page, childKeys: ["hsn"] }, canSee2(user.role, "inventory") && /* @__PURE__ */ React.createElement(NavItem, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "tag", s: 14 }), label: "Product Master", onClick: () => setModal("products"), active: modal === "products" }), canSee2(user.role, "company") && N({ ic: "tag", label: "HSN / SAC", pg: "hsn" })), canSee2(user.role, "inventory") && /* @__PURE__ */ React.createElement(NavGroup, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "package", s: 17 }), label: "Inventory", page, childKeys: ["inventory"] }, [["package", "Stock Summary", "summary"], ["clock", "Inventory Ageing", "ageing"], ["chart", "Product-wise Movement", "product"], ["cart", "Bill-wise (Purchases)", "purchdoc"], ["receipt", "Invoice-wise (Sales)", "salesdoc"], ["file", "All Documents In / Out", "alldoc"], ["dollar", "Valuation & Slow Moving", "valuation"], ["list", "Full Stock Ledger", "log"]].map(([ic, l, v]) => /* @__PURE__ */ React.createElement(NavItem, { key: v, icon: /* @__PURE__ */ React.createElement(Ic, { n: ic, s: 14 }), label: l, onClick: () => {
    go("inventory");
    setInvView(v);
  }, active: page === "inventory" && invView === v }))), /* @__PURE__ */ React.createElement(NavGroup, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "cart", s: 17 }), label: "Sales", page, childKeys: ["salesorders", "ewaybill", "customers", "quotations", "invoice", "history", "recurring", "dc", "payrecv", "reminders", "salesview"] }, canSee2(user.role, "customers") && N({ ic: "users", label: "Customers", pg: "customers" }), canSee2(user.role, "quotations") && N({ ic: "file", label: "Quotes", pg: "quotations" }), canSee2(user.role, "quotations") && N({ ic: "file", label: "Sales Orders", pg: "salesorders" }), N({ ic: "plus", label: "New Invoice", pg: "invoice" }), /* @__PURE__ */ React.createElement(NavItem, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "history", s: 14 }), label: "Invoices", onClick: () => go("history"), active: page === "history" && !modal, badge: invCount > 0 ? invCount : null }), canSee2(user.role, "recurring") && N({ ic: "refresh", label: "Recurring Invoices", pg: "recurring" }), canSee2(user.role, "dc") && N({ ic: "package", label: "Delivery Challans", pg: "dc" }), acct && N({ ic: "dollar", label: "Payments Received", pg: "payrecv" }), acct && N({ ic: "package", label: "e-Way Bills", pg: "ewaybill" }), canSee2(user.role, "reminders") && N({ ic: "alert", label: "Payment Reminders", pg: "reminders" }), canSee2(user.role, "salesview") && N({ ic: "chart", label: "Sales Summary", pg: "salesview" })), (acct || canSee2(user.role, "expenses") || canSee2(user.role, "pohistory")) && /* @__PURE__ */ React.createElement(NavGroup, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "receipt", s: 17 }), label: "Purchases", page, childKeys: ["vendors", "expenses", "pohistory", "paymade", "recbills", "vendorcredits"] }, acct && N({ ic: "users", label: "Vendors", pg: "vendors" }), canSee2(user.role, "expenses") && N({ ic: "receipt", label: "Bills & Expenses", pg: "expenses" }), canSee2(user.role, "pohistory") && /* @__PURE__ */ React.createElement(NavItem, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "cart", s: 14 }), label: "Purchase Orders", onClick: () => go("pohistory"), active: page === "pohistory" && !modal, badge: poCount > 0 ? poCount : null, badgeCls: "gold" }), acct && N({ ic: "dollar", label: "Payments Made", pg: "paymade" }), acct && N({ ic: "receipt", label: "Recurring Bills", pg: "recbills" }), acct && N({ ic: "file", label: "Vendor Credits", pg: "vendorcredits" })), canSee2(user.role, "bankrecon") && /* @__PURE__ */ React.createElement(NavGroup, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "bank", s: 17 }), label: "Banking", page, childKeys: ["bankoverview", "bankrecon"] }, acct && N({ ic: "chart", label: "Overview", pg: "bankoverview" }), N({ ic: "bank", label: "Reconciliation & Transactions", pg: "bankrecon" })), acct && /* @__PURE__ */ React.createElement(NavGroup, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "shield", s: 17 }), label: "Filing & Compliance", page, childKeys: ["gstfiling"] }, N({ ic: "file", label: "GST Filing", pg: "gstfiling" })), acct && /* @__PURE__ */ React.createElement(NavGroup, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "users", s: 17 }), label: "Accountant", page, childKeys: ["journal", "coa", "recjournal", "fixedassets", "advances", "fxpage", "budget", "ledger", "trialbalance", "txnlock"] }, N({ ic: "file", label: "Manual Journals", pg: "journal" }), N({ ic: "history", label: "Recurring Journals", pg: "recjournal" }), N({ ic: "list", label: "Chart of Accounts", pg: "coa" }), N({ ic: "dollar", label: "Fixed Assets", pg: "fixedassets" }), N({ ic: "file", label: "Advance Application", pg: "advances" }), N({ ic: "dollar", label: "Multi-Currency (FX)", pg: "fxpage" }), N({ ic: "list", label: "Budgets", pg: "budget" }), N({ ic: "history", label: "General Ledger", pg: "ledger" }), N({ ic: "dollar", label: "Trial Balance", pg: "trialbalance" }), N({ ic: "shield", label: "Transaction Locking", pg: "txnlock" })), acct && /* @__PURE__ */ React.createElement(NavGroup, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "chart", s: 17 }), label: "Reports", page, childKeys: ["overview", "morereports", "reportscenter", "reports", "cashflow", "statements"] }, N({ ic: "chart", label: "Business Overview", pg: "overview" }), N({ ic: "list", label: "Reports Centre", pg: "reportscenter" }), N({ ic: "list", label: "More Reports", pg: "morereports" }), N({ ic: "chart", label: "Financial Statements", pg: "reports" }), N({ ic: "chart", label: "Cash Flow & Ratios", pg: "cashflow" }), N({ ic: "file", label: "Statement of Accounts", pg: "statements" })), acct && /* @__PURE__ */ React.createElement(NavGroup, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "clock", s: 17 }), label: "Time Tracking", page, childKeys: ["timetrack"] }, N({ ic: "clock", label: "Projects & Timesheet", pg: "timetrack" })), canSee2(user.role, "aging") && /* @__PURE__ */ React.createElement(NavGroup, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "clock", s: 17 }), label: "Ageing & Outstanding", page, childKeys: ["aging"] }, [["chart", "Summary", "summary"], ["users", "Trade Receivables", "ar"], ["receipt", "Receivables \u2014 Bill-wise", "arbill"], ["cart", "Trade Payables", "ap"], ["file", "Payables \u2014 Bill-wise", "apbill"]].map(([ic, l, v]) => /* @__PURE__ */ React.createElement(NavItem, { key: v, icon: /* @__PURE__ */ React.createElement(Ic, { n: ic, s: 14 }), label: l, onClick: () => {
    go("aging");
    setAgingView(v);
  }, active: page === "aging" && agingView === v }))), (canSee2(user.role, "company") || canSee2(user.role, "terms")) && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "nav-sep" }), /* @__PURE__ */ React.createElement(NavGroup, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "settings", s: 17 }), label: "Settings", page, childKeys: ["company", "terms"] }, canSee2(user.role, "company") && N({ ic: "building", label: "Company", pg: "company" }), canSee2(user.role, "terms") && N({ ic: "file", label: "Terms & Conditions", pg: "terms" }))));
};
const NavGroup = ({ icon, label, page, childKeys, children }) => {
  const anyActive = childKeys.some((k) => k === page);
  const [open, setOpen] = useState(anyActive);
  useEffect(() => {
    if (anyActive) setOpen(true);
  }, [anyActive]);
  return /* @__PURE__ */ React.createElement("div", { className: "nav-group" }, /* @__PURE__ */ React.createElement("div", { className: `nav-item nav-group-toggle${anyActive ? " active" : ""}`, onClick: () => setOpen((o) => !o) }, /* @__PURE__ */ React.createElement("span", { className: "nav-icon" }, icon), /* @__PURE__ */ React.createElement("span", { className: "nav-label" }, label), /* @__PURE__ */ React.createElement("span", { className: "nav-chevron", style: { marginLeft: "auto", transform: open ? "rotate(90deg)" : "rotate(0deg)" } }, /* @__PURE__ */ React.createElement(Ic, { n: "chevron", s: 12 }))), open && /* @__PURE__ */ React.createElement("div", { className: "nav-subitems" }, children));
};
const XK = { SORDER: "ip_sorders", VCREDIT: "ip_vcredits", RECBILL: "ip_recbills", PROJ: "ip_projects", TIME: "ip_timelog", LOCK: "ip_txnlock" };
const EXTRA_ACCOUNTING_PAGES = ["vendorcredits", "bankoverview", "txnlock", "morereports", "overview", "ewaybill", "timetrack", "recbills"];
const getTxnLock = () => {
  const d = S.get(XK.LOCK, null) || {};
  return { all: d.all || "", reason: d.reason || "", mods: { sales: "", expenses: "", accountant: "", ...d.mods || {} } };
};
const isLockedDate = (dateStr, type) => {
  if (!dateStr) return false;
  const l = getTxnLock();
  const d = String(dateStr).slice(0, 10);
  return !!l.all && d <= l.all || !!l.mods[type] && d <= l.mods[type];
};
const _dl = (name, text, mime) => {
  const b = new Blob([text], { type: mime || "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(b);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
};
const _Inp = ({ label, children, w }) => /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 0, minWidth: w || 0 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, label), children);
const _Range = ({ from, to, setFrom, setTo }) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(_Inp, { label: "From" }, /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: from, onChange: (e) => setFrom(e.target.value) })), /* @__PURE__ */ React.createElement(_Inp, { label: "To" }, /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: to, onChange: (e) => setTo(e.target.value) })));
const _validInv = (i) => i.status !== "Draft" && i.status !== "Cancelled";
const _sgn = (i) => i.docType === "CREDIT NOTE" ? -1 : 1;
const _bar = (pct, color) => /* @__PURE__ */ React.createElement("div", { style: { height: 8, borderRadius: 4, background: "var(--border)", overflow: "hidden", minWidth: 80 } }, /* @__PURE__ */ React.createElement("div", { style: { width: Math.max(0, Math.min(100, pct)) + "%", height: "100%", background: color || "var(--primary)" } }));
const BankingOverviewPage = ({ go }) => {
  const tb = getTrialBalance(today());
  const bal = (k) => (tb.find((r) => r.account === k) || { balance: 0 }).balance;
  const txns = S.get(SK.BANK, []) || [];
  const accts = getBankAccounts().map((a) => {
    const mine = txns.filter((t) => (t.acctId || "PRIMARY") === a.id);
    const un = mine.filter((t) => !t.matched);
    return { ...a, book: bal(bankLedgerKey(a.id)), unCount: un.length, unIn: un.filter((t) => t.type === "credit").reduce((s, t) => s + (parseFloat(t.amount) || 0), 0), unOut: un.filter((t) => t.type !== "credit").reduce((s, t) => s + (parseFloat(t.amount) || 0), 0), total: mine.length };
  });
  const cash = bal("CASH_IN_HAND");
  const bankTot = accts.reduce((s, a) => s + a.book, 0);
  const unTotal = accts.reduce((s, a) => s + a.unCount, 0);
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(PrHead, { title: "Banking overview", sub: "All bank accounts and cash at a glance" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => go("bankrecon") }, "Open Bank Reconciliation")), /* @__PURE__ */ React.createElement(KpiStrip, { items: [{ label: "Cash in hand", value: fmt(cash) }, { label: "Bank balance (books)", value: fmt(bankTot), color: "var(--primary2)" }, { label: "Uncategorised transactions", value: String(unTotal), color: unTotal ? "var(--red)" : "var(--green)" }] }), unTotal > 0 && /* @__PURE__ */ React.createElement(InfoNote, { tone: "warn" }, unTotal, " bank line", unTotal === 1 ? "" : "s", " are not matched to an invoice, bill or ledger yet. ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--primary2)", cursor: "pointer", fontWeight: 700 }, onClick: () => go("bankrecon") }, "Categorise now \u203A")), /* @__PURE__ */ React.createElement(Wrap, { min: 760 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Account"), /* @__PURE__ */ React.createElement("th", { style: th }, "Bank / A/c no."), /* @__PURE__ */ React.createElement("th", { style: thR }, "Uncategorised"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Unmatched in"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Unmatched out"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Balance in books")), /* @__PURE__ */ React.createElement("tbody", null, accts.map((a) => /* @__PURE__ */ React.createElement("tr", { key: a.id, style: { borderBottom: "1px solid var(--border)", cursor: "pointer" }, onClick: () => go("bankrecon") }, /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 700, color: "var(--primary2)" } }, a.name), /* @__PURE__ */ React.createElement("td", { style: td }, [a.bankName, a.accountNo && "xxxx" + String(a.accountNo).slice(-4)].filter(Boolean).join(" \xB7 ") || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: a.unCount ? "var(--red)" : "var(--text3)", fontWeight: 700 } }, a.unCount || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(a.unIn)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(a.unOut)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700 } }, fmt(a.book)))))));
};
const VendorCreditsPage = ({ currentUser }) => {
  const [list, setList] = useState(() => S.get(XK.VCREDIT, []) || []);
  const [f, setF] = useState(null);
  const vendors = getVendorList().map((v) => v.name);
  const expAccts = getAllAccounts().filter((a) => a.type === "expense" || a.key === "INVENTORY");
  const blank = () => ({ id: Date.now().toString(), date: today(), vendor: "", billNo: "", account: "COGS", amount: "", gstRate: "18", reason: "" });
  const save = () => {
    const amt = parseFloat(f.amount) || 0;
    if (!f.vendor.trim() || amt <= 0) {
      toast.error("Vendor and amount are required");
      return;
    }
    if (isLockedDate(f.date, "accountant")) {
      toast.error("This date is locked (Transaction Locking)");
      return;
    }
    const gst = r2(amt * (parseFloat(f.gstRate) || 0) / 100);
    const total = r2(amt + gst);
    const { no, commit } = nextDocNo("VC");
    const lines = [{ account: "TRADE_PAYABLE", debit: total, credit: 0 }, { account: f.account, debit: 0, credit: amt }];
    if (gst > 0) lines.push({ account: "INPUT_GST", debit: 0, credit: gst });
    const jv = saveManualJournalEntry({ date: f.date, narration: `Vendor credit ${no} \u2014 ${f.vendor}${f.billNo ? " (bill " + f.billNo + ")" : ""}`, referenceNo: no, lines });
    if (!jv) return;
    commit();
    const rec = { ...f, no, amount: amt, gst, total, jvId: jv.id };
    const u = [...list, rec];
    setList(u);
    S.set(XK.VCREDIT, u);
    logAudit("VENDOR_CREDIT_CREATED", `${no} \u2014 ${f.vendor} \u2014 ${fmt(total)}`, currentUser);
    toast.success("Vendor credit " + no + " posted");
    setF(null);
  };
  const del = (c) => {
    if (!window.confirm("Delete " + c.no + "? Its journal entry is removed too.")) return;
    if (isLockedDate(c.date, "accountant")) {
      toast.error("This date is locked");
      return;
    }
    try {
      deleteManualJournalEntry(c.jvId);
    } catch (e) {
    }
    const u = list.filter((x) => x.id !== c.id);
    setList(u);
    S.set(XK.VCREDIT, u);
    logAudit("VENDOR_CREDIT_DELETED", c.no, currentUser);
  };
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(PrHead, { title: "Vendor credits", sub: "Debit notes you receive from suppliers (returns, discounts) \u2014 reduces what you owe" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => setF(blank()) }, "+ New vendor credit")), /* @__PURE__ */ React.createElement(KpiStrip, { items: [{ label: "Vendor credits", value: String(list.length) }, { label: "Total credit value", value: fmt(list.reduce((s, c) => s + c.total, 0)), color: "var(--green)" }] }), f && /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 14, marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" } }, /* @__PURE__ */ React.createElement(_Inp, { label: "Date" }, /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: f.date, onChange: (e) => setF({ ...f, date: e.target.value }) })), /* @__PURE__ */ React.createElement(_Inp, { label: "Vendor", w: 220 }, /* @__PURE__ */ React.createElement("input", { className: "field-input", list: "vc-vendors", value: f.vendor, onChange: (e) => setF({ ...f, vendor: e.target.value }) }), /* @__PURE__ */ React.createElement("datalist", { id: "vc-vendors" }, vendors.map((v) => /* @__PURE__ */ React.createElement("option", { key: v, value: v })))), /* @__PURE__ */ React.createElement(_Inp, { label: "Against bill no." }, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: f.billNo, onChange: (e) => setF({ ...f, billNo: e.target.value }) })), /* @__PURE__ */ React.createElement(_Inp, { label: "Credit to account", w: 230 }, /* @__PURE__ */ React.createElement("select", { className: "field-input", value: f.account, onChange: (e) => setF({ ...f, account: e.target.value }) }, expAccts.map((a) => /* @__PURE__ */ React.createElement("option", { key: a.key, value: a.key }, a.name)))), /* @__PURE__ */ React.createElement(_Inp, { label: "Amount (before GST)" }, /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: f.amount, onChange: (e) => setF({ ...f, amount: e.target.value }) })), /* @__PURE__ */ React.createElement(_Inp, { label: "GST %" }, /* @__PURE__ */ React.createElement("select", { className: "field-input", value: f.gstRate, onChange: (e) => setF({ ...f, gstRate: e.target.value }) }, TAX_RATES.map((r) => /* @__PURE__ */ React.createElement("option", { key: r }, r)))), /* @__PURE__ */ React.createElement(_Inp, { label: "Reason", w: 220 }, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: f.reason, onChange: (e) => setF({ ...f, reason: e.target.value }) })), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: save }, "Save & post"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: () => setF(null) }, "Cancel"))), list.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "No vendor credits yet." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 760 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Date"), /* @__PURE__ */ React.createElement("th", { style: th }, "Credit #"), /* @__PURE__ */ React.createElement("th", { style: th }, "Vendor"), /* @__PURE__ */ React.createElement("th", { style: th }, "Bill #"), /* @__PURE__ */ React.createElement("th", { style: th }, "Reason"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Amount"), /* @__PURE__ */ React.createElement("th", { style: thR }, "GST"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Total"), /* @__PURE__ */ React.createElement("th", { style: th })), /* @__PURE__ */ React.createElement("tbody", null, [...list].reverse().map((c) => /* @__PURE__ */ React.createElement("tr", { key: c.id, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, fmtDate(c.date)), /* @__PURE__ */ React.createElement("td", { style: { ...td, color: "var(--primary2)", fontWeight: 600 } }, c.no), /* @__PURE__ */ React.createElement("td", { style: td }, c.vendor), /* @__PURE__ */ React.createElement("td", { style: td }, c.billNo || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: td }, c.reason || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(c.amount)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(c.gst)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700 } }, fmt(c.total)), /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => del(c) }, "Delete")))))));
};
const _addMonths = (iso, n) => {
  const d = /* @__PURE__ */ new Date(iso + "T00:00:00");
  const day = d.getDate();
  d.setMonth(d.getMonth() + n);
  if (d.getDate() !== day) d.setDate(0);
  return _iso(d);
};
const _freqMonths = { monthly: 1, quarterly: 3, halfyearly: 6, yearly: 12 };
const runRecurringBills = (user) => {
  const tpls = S.get(XK.RECBILL, []) || [];
  if (!tpls.length) return 0;
  let made = 0;
  const bills = [...S.get(SK.EXP, []) || []];
  const upd = tpls.map((t) => {
    if (!t.active) return t;
    let next = t.next;
    let guard = 0;
    while (next && next <= today() && (!t.end || next <= t.end) && guard++ < 24) {
      if (isLockedDate(next, "expenses")) {
        next = _addMonths(next, _freqMonths[t.freq] || 1);
        continue;
      }
      const e = calcPurchase({
        ...blankExp(user),
        id: Date.now().toString() + Math.random().toString(36).slice(2, 5),
        date: next,
        billDate: next,
        vendor: t.vendor,
        vendorGSTIN: t.gstin || "",
        billNo: `${t.billPrefix || "REC"}-${next.slice(0, 7)}`,
        category: t.category || "",
        expenseAccountKey: t.account || "",
        gstType: t.gstType || "INTRA",
        creditDays: parseInt(t.creditDays) || 0,
        notes: "Auto-created from recurring bill",
        items: [{ ...blankPItem(), desc: t.desc || t.category || "Recurring charge", qty: 1, rate: t.amount, taxRate: t.gstRate, toStock: false }]
      });
      bills.push(e);
      made++;
      next = _addMonths(next, _freqMonths[t.freq] || 1);
    }
    return { ...t, next };
  });
  if (made) {
    S.set(SK.EXP, bills);
    S.set(XK.RECBILL, upd);
  }
  return made;
};
const RecurringBillsPage = ({ currentUser }) => {
  const [list, setList] = useState(() => S.get(XK.RECBILL, []) || []);
  const [f, setF] = useState(null);
  const blank = () => ({ id: Date.now().toString(), vendor: "", gstin: "", category: "", desc: "", account: "", amount: "", gstRate: "18", gstType: "INTRA", creditDays: "0", freq: "monthly", next: today(), end: "", active: true, billPrefix: "REC" });
  const persist = (u) => {
    setList(u);
    S.set(XK.RECBILL, u);
  };
  const save = () => {
    if (!f.vendor.trim() || !(parseFloat(f.amount) > 0)) {
      toast.error("Vendor and amount are required");
      return;
    }
    const acct = f.account || guessExpenseAccount(f.category);
    const rec = { ...f, account: acct };
    persist(list.some((x) => x.id === f.id) ? list.map((x) => x.id === f.id ? rec : x) : [...list, rec]);
    setF(null);
    toast.success("Recurring bill saved");
  };
  const runNow = () => {
    const n = runRecurringBills(currentUser);
    setList(S.get(XK.RECBILL, []) || []);
    n ? toast.success(n + " bill" + (n === 1 ? "" : "s") + " created") : toast.info("Nothing is due");
  };
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(PrHead, { title: "Recurring bills", sub: "Rent, subscriptions and other fixed charges. A normal purchase bill is created automatically on each due date." }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: runNow }, "Create due bills now"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => setF(blank()) }, "+ New recurring bill")), f && /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 14, marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" } }, /* @__PURE__ */ React.createElement(_Inp, { label: "Vendor", w: 200 }, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: f.vendor, onChange: (e) => setF({ ...f, vendor: e.target.value }) })), /* @__PURE__ */ React.createElement(_Inp, { label: "Vendor GSTIN" }, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: f.gstin, onChange: (e) => setF({ ...f, gstin: e.target.value.toUpperCase() }) })), /* @__PURE__ */ React.createElement(_Inp, { label: "Category (e.g. Rent)" }, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: f.category, onChange: (e) => setF({ ...f, category: e.target.value }) })), /* @__PURE__ */ React.createElement(_Inp, { label: "Description", w: 200 }, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: f.desc, onChange: (e) => setF({ ...f, desc: e.target.value }) })), /* @__PURE__ */ React.createElement(_Inp, { label: "Amount (before GST)" }, /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: f.amount, onChange: (e) => setF({ ...f, amount: e.target.value }) })), /* @__PURE__ */ React.createElement(_Inp, { label: "GST %" }, /* @__PURE__ */ React.createElement("select", { className: "field-input", value: f.gstRate, onChange: (e) => setF({ ...f, gstRate: e.target.value }) }, TAX_RATES.map((r) => /* @__PURE__ */ React.createElement("option", { key: r }, r)))), /* @__PURE__ */ React.createElement(_Inp, { label: "Supply" }, /* @__PURE__ */ React.createElement("select", { className: "field-input", value: f.gstType, onChange: (e) => setF({ ...f, gstType: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "INTRA" }, "Same state"), /* @__PURE__ */ React.createElement("option", { value: "INTER" }, "Other state"))), /* @__PURE__ */ React.createElement(_Inp, { label: "Repeat" }, /* @__PURE__ */ React.createElement("select", { className: "field-input", value: f.freq, onChange: (e) => setF({ ...f, freq: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "monthly" }, "Monthly"), /* @__PURE__ */ React.createElement("option", { value: "quarterly" }, "Quarterly"), /* @__PURE__ */ React.createElement("option", { value: "halfyearly" }, "Half-yearly"), /* @__PURE__ */ React.createElement("option", { value: "yearly" }, "Yearly"))), /* @__PURE__ */ React.createElement(_Inp, { label: "Next bill date" }, /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: f.next, onChange: (e) => setF({ ...f, next: e.target.value }) })), /* @__PURE__ */ React.createElement(_Inp, { label: "Ends on (optional)" }, /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: f.end, onChange: (e) => setF({ ...f, end: e.target.value }) })), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: save }, "Save"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: () => setF(null) }, "Cancel"))), list.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "No recurring bills yet." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 760 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Vendor"), /* @__PURE__ */ React.createElement("th", { style: th }, "Category"), /* @__PURE__ */ React.createElement("th", { style: th }, "Repeats"), /* @__PURE__ */ React.createElement("th", { style: th }, "Next bill"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Amount"), /* @__PURE__ */ React.createElement("th", { style: th }, "Status"), /* @__PURE__ */ React.createElement("th", { style: th })), /* @__PURE__ */ React.createElement("tbody", null, list.map((t) => /* @__PURE__ */ React.createElement("tr", { key: t.id, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 600 } }, t.vendor), /* @__PURE__ */ React.createElement("td", { style: td }, t.category || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: td }, t.freq), /* @__PURE__ */ React.createElement("td", { style: td }, fmtDate(t.next)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(parseFloat(t.amount) || 0), " + ", t.gstRate, "%"), /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement("span", { style: { color: t.active ? "var(--green)" : "var(--text3)", fontWeight: 700 } }, t.active ? "Active" : "Paused")), /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => persist(list.map((x) => x.id === t.id ? { ...x, active: !x.active } : x)) }, t.active ? "Pause" : "Resume"), " ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => setF(t) }, "Edit"), " ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => {
    if (window.confirm("Delete this recurring bill? Bills already created stay.")) persist(list.filter((x) => x.id !== t.id));
  } }, "Delete")))))));
};
const TransactionLockPage = ({ currentUser }) => {
  const canEdit = (currentUser == null ? void 0 : currentUser.role) === "admin" || (currentUser == null ? void 0 : currentUser.role) === "superadmin";
  const [l, setL] = useState(() => getTxnLock());
  const [msg, setMsg] = useState("");
  const save = (next) => {
    if (!canEdit) {
      toast.error("Only an admin can change locks");
      return;
    }
    S.set(XK.LOCK, next);
    setL(next);
    logAudit("TXN_LOCK_CHANGED", `All: ${next.all || "none"} \xB7 Sales: ${next.mods.sales || "-"} \xB7 Purchases: ${next.mods.expenses || "-"} \xB7 Journals: ${next.mods.accountant || "-"}`, currentUser);
    toast.success("Lock settings saved");
  };
  const mods = [["sales", "Sales (invoices, credit notes)"], ["expenses", "Purchases (bills, expenses)"], ["accountant", "Accountant (manual journals)"]];
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(PrHead, { title: "Transaction locking", sub: "Stops anyone from adding, editing or deleting transactions dated on or before the lock date" }), !canEdit && /* @__PURE__ */ React.createElement(InfoNote, { tone: "warn" }, "Only admins can change locks. You can see the current settings."), /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 16, marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, marginBottom: 8 } }, l.all ? /* @__PURE__ */ React.createElement(React.Fragment, null, "\u{1F512} All transactions on or before ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--red)" } }, fmtDate(l.all)), " are locked") : "\u{1F513} No global lock"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" } }, /* @__PURE__ */ React.createElement(_Inp, { label: "Lock all transactions up to" }, /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", disabled: !canEdit, value: l.all, onChange: (e) => setL({ ...l, all: e.target.value }) })), /* @__PURE__ */ React.createElement(_Inp, { label: "Reason", w: 320 }, /* @__PURE__ */ React.createElement("input", { className: "field-input", disabled: !canEdit, placeholder: "e.g. Financials finalised for FY 2025-26", value: l.reason, onChange: (e) => setL({ ...l, reason: e.target.value }) })), canEdit && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => save(l) }, "Save lock"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: () => save({ ...l, all: "", reason: "" }) }, "Unlock all")))), /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, marginBottom: 8 } }, "Lock individual modules"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 10 } }, mods.map(([k, n]) => /* @__PURE__ */ React.createElement("div", { key: k, style: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 260 } }, n), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", style: { width: 170 }, disabled: !canEdit, value: l.mods[k], onChange: (e) => setL({ ...l, mods: { ...l.mods, [k]: e.target.value } }) }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11.5, color: "var(--text3)" } }, l.mods[k] ? "locked up to " + fmtDate(l.mods[k]) : "not locked")))), canEdit && /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", style: { marginTop: 12 }, onClick: () => save(l) }, "Save module locks")), /* @__PURE__ */ React.createElement(InfoNote, null, "The existing month-wise Freeze in Admin Panel keeps working; a transaction is blocked if either the freeze or a lock covers its date. Super Admins can still override a month freeze, but not a date lock \u2014 unlock it here first."));
};
const groupSum = (rows) => {
  const m = {};
  rows.forEach((r) => {
    const g = r.scheduleGroup || r.name;
    m[g] = (m[g] || 0) + r.amount;
  });
  return Object.entries(m).map(([k, v]) => ({ label: k, amount: r2(v) })).sort((a, b) => b.amount - a.amount);
};
const MoreReportsPage = ({ go }) => {
  const [tab, setTab] = useState("hpl");
  const [from, setFrom] = useState(fyStartOf(getFY()));
  const [to, setTo] = useState(today());
  const pl = useMemo(() => getPLAccrual(from, to), [from, to, tab]);
  const invs = useMemo(() => (S.get(SK.INV, []) || []).filter((i) => _validInv(i) && (i.date || "") >= from && (i.date || "") <= to), [from, to, tab]);
  const bills = useMemo(() => (S.get(SK.EXP, []) || []).filter((e) => (e.billDate || e.date || "") >= from && (e.billDate || e.date || "") <= to), [from, to, tab]);
  const Two = ({ lt, l, rt, r, lTot, rTot }) => {
    const n = Math.max(l.length, r.length);
    return /* @__PURE__ */ React.createElement(Wrap, { min: 720 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, lt), /* @__PURE__ */ React.createElement("th", { style: thR }, "Amount"), /* @__PURE__ */ React.createElement("th", { style: th }, rt), /* @__PURE__ */ React.createElement("th", { style: thR }, "Amount")), /* @__PURE__ */ React.createElement("tbody", null, Array.from({ length: n }).map((_, i) => {
      var _a, _b;
      return /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, ((_a = l[i]) == null ? void 0 : _a.label) || ""), /* @__PURE__ */ React.createElement("td", { style: tdR }, l[i] ? fmt(l[i].amount) : ""), /* @__PURE__ */ React.createElement("td", { style: { ...td, borderLeft: "1px solid var(--border)" } }, ((_b = r[i]) == null ? void 0 : _b.label) || ""), /* @__PURE__ */ React.createElement("td", { style: tdR }, r[i] ? fmt(r[i].amount) : ""));
    }), /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)", fontWeight: 800 } }, /* @__PURE__ */ React.createElement("td", { style: td }, "Total"), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(lTot)), /* @__PURE__ */ React.createElement("td", { style: { ...td, borderLeft: "1px solid var(--border)" } }, "Total"), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(rTot)))));
  };
  let body = null, exp = null;
  if (tab === "hpl") {
    const exps = groupSum(pl.rows.filter((r) => r.type === "expense")), incs = groupSum(pl.rows.filter((r) => r.type === "income"));
    const loss = pl.net < 0;
    const L = [...exps, ...!loss ? [{ label: "Net profit", amount: pl.net }] : []], R = [...incs, ...loss ? [{ label: "Net loss", amount: -pl.net }] : []];
    const tot = Math.max(pl.income, pl.expense);
    body = /* @__PURE__ */ React.createElement(Two, { lt: "Expenses", l: L, rt: "Income", r: R, lTot: tot, rTot: tot });
    exp = [["Particulars", "Amount"], ...L.map((x) => [x.label, fmtN(x.amount)]), ...R.map((x) => ["Income: " + x.label, fmtN(x.amount)])];
  }
  if (tab === "hbs") {
    const b = getBalanceSheet(to);
    const L = [...groupSum(b.equity.map((x) => ({ ...x, name: x.name }))), ...groupSum(b.liabilities)], R = groupSum(b.assets);
    body = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Two, { lt: "Liabilities & equity", l: L, rt: "Assets", r: R, lTot: r2(b.totalEquity + b.totalLiab), rTot: b.totalAssets }), !b.tallies && /* @__PURE__ */ React.createElement(InfoNote, { tone: "warn" }, "Balance sheet does not tally \u2014 check unposted or one-sided entries."));
    exp = [["Particulars", "Amount"], ...L.map((x) => ["L&E: " + x.label, fmtN(x.amount)]), ...R.map((x) => ["Asset: " + x.label, fmtN(x.amount)])];
  }
  if (tab === "eq") {
    const o = getBalanceSheet(addDaysISO(from, -1)), c = getBalanceSheet(to);
    const other = r2(c.totalEquity - o.totalEquity - pl.net);
    const rows = [["Opening equity", o.totalEquity], ["Add: profit / (loss) for the period", pl.net], ["Capital introduced / (withdrawn) & other movements", other], ["Closing equity", c.totalEquity]];
    body = /* @__PURE__ */ React.createElement(Wrap, { min: 520 }, /* @__PURE__ */ React.createElement("tbody", null, rows.map((r, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: "1px solid var(--border)", background: i === 0 || i === 3 ? "var(--card2)" : "", fontWeight: i === 0 || i === 3 ? 800 : 400 } }, /* @__PURE__ */ React.createElement("td", { style: td }, r[0]), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(r[1]))))));
    exp = rows.map((r) => [r[0], fmtN(r[1])]);
  }
  if (tab === "scust") {
    const m = {};
    invs.forEach((i) => {
      var _a;
      const n = ((_a = i.billTo) == null ? void 0 : _a.name) || "Unknown";
      const x = m[n] = m[n] || { n, c: 0, t: 0, g: 0, tot: 0, p: 0 };
      const s = _sgn(i);
      x.c++;
      x.t += s * invTaxable(i);
      x.g += s * Math.abs(invGstAmt(i));
      x.tot += s * Math.abs(getGrand(i));
      x.p += i.docType === "CREDIT NOTE" ? 0 : invPaid(i);
    });
    const rows = Object.values(m).sort((a, b) => b.tot - a.tot);
    const T = rows.reduce((s, x) => s + x.tot, 0);
    body = /* @__PURE__ */ React.createElement(Wrap, { min: 760 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Customer"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Invoices"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Taxable"), /* @__PURE__ */ React.createElement("th", { style: thR }, "GST"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Total sales"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Received"), /* @__PURE__ */ React.createElement("th", { style: th }, "Share")), /* @__PURE__ */ React.createElement("tbody", null, rows.map((x) => /* @__PURE__ */ React.createElement("tr", { key: x.n, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, x.n), /* @__PURE__ */ React.createElement("td", { style: tdR }, x.c), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(x.t)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(x.g)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700 } }, fmt(x.tot)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(x.p)), /* @__PURE__ */ React.createElement("td", { style: td }, _bar(T ? x.tot / T * 100 : 0)))), /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)", fontWeight: 800 } }, /* @__PURE__ */ React.createElement("td", { style: td }, "Total"), /* @__PURE__ */ React.createElement("td", { style: tdR }, rows.reduce((s, x) => s + x.c, 0)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(rows.reduce((s, x) => s + x.t, 0))), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(rows.reduce((s, x) => s + x.g, 0))), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(T)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(rows.reduce((s, x) => s + x.p, 0))), /* @__PURE__ */ React.createElement("td", null))));
    exp = [["Customer", "Invoices", "Taxable", "GST", "Total", "Received"], ...rows.map((x) => [x.n, x.c, fmtN(x.t), fmtN(x.g), fmtN(x.tot), fmtN(x.p)])];
  }
  if (tab === "sitem") {
    const m = {};
    invs.filter((i) => i.docType !== "CREDIT NOTE").forEach((i) => (i.items || []).forEach((it) => {
      const n = (it.desc || "").trim() || "(no description)";
      const q = parseFloat(it.qty) || 0, tx = parseFloat(it.taxable) || (parseFloat(it.rate) || 0) * q;
      const x = m[n] = m[n] || { n, q: 0, t: 0, c: 0 };
      x.q += q;
      x.t += tx;
      x.c++;
    }));
    const rows = Object.values(m).sort((a, b) => b.t - a.t);
    const T = rows.reduce((s, x) => s + x.t, 0);
    body = /* @__PURE__ */ React.createElement(Wrap, { min: 620 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Item"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Qty sold"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Lines"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Sales (taxable)"), /* @__PURE__ */ React.createElement("th", { style: th }, "Share")), /* @__PURE__ */ React.createElement("tbody", null, rows.map((x) => /* @__PURE__ */ React.createElement("tr", { key: x.n, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, x.n), /* @__PURE__ */ React.createElement("td", { style: tdR }, x.q), /* @__PURE__ */ React.createElement("td", { style: tdR }, x.c), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700 } }, fmt(x.t)), /* @__PURE__ */ React.createElement("td", { style: td }, _bar(T ? x.t / T * 100 : 0, "var(--green)"))))));
    exp = [["Item", "Qty", "Lines", "Sales (taxable)"], ...rows.map((x) => [x.n, x.q, x.c, fmtN(x.t)])];
  }
  if (tab === "pvend") {
    const m = {};
    bills.forEach((e) => {
      const n = (e.vendor || "Unknown").trim();
      const x = m[n] = m[n] || { n, c: 0, t: 0, g: 0, tot: 0, d: 0 };
      x.c++;
      x.t += parseFloat(e.taxable) || 0;
      x.g += parseFloat(e.gstAmt) || 0;
      x.tot += expTotal(e);
      x.d += expDue(e);
    });
    const rows = Object.values(m).sort((a, b) => b.tot - a.tot);
    const T = rows.reduce((s, x) => s + x.tot, 0);
    body = /* @__PURE__ */ React.createElement(Wrap, { min: 720 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Vendor"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Bills"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Taxable"), /* @__PURE__ */ React.createElement("th", { style: thR }, "GST (ITC)"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Total"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Outstanding"), /* @__PURE__ */ React.createElement("th", { style: th }, "Share")), /* @__PURE__ */ React.createElement("tbody", null, rows.map((x) => /* @__PURE__ */ React.createElement("tr", { key: x.n, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, x.n), /* @__PURE__ */ React.createElement("td", { style: tdR }, x.c), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(x.t)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(x.g)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700 } }, fmt(x.tot)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(x.d)), /* @__PURE__ */ React.createElement("td", { style: td }, _bar(T ? x.tot / T * 100 : 0, "var(--red)"))))));
    exp = [["Vendor", "Bills", "Taxable", "GST", "Total", "Outstanding"], ...rows.map((x) => [x.n, x.c, fmtN(x.t), fmtN(x.g), fmtN(x.tot), fmtN(x.d)])];
  }
  if (tab === "topexp") {
    const rows = pl.rows.filter((r) => r.type === "expense").sort((a, b) => b.amount - a.amount);
    const T = rows.reduce((s, x) => s + x.amount, 0);
    body = /* @__PURE__ */ React.createElement(Wrap, { min: 560 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Expense account"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Amount"), /* @__PURE__ */ React.createElement("th", { style: thR }, "%"), /* @__PURE__ */ React.createElement("th", { style: th })), /* @__PURE__ */ React.createElement("tbody", null, rows.map((x) => /* @__PURE__ */ React.createElement("tr", { key: x.account, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, x.name), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700 } }, fmt(x.amount)), /* @__PURE__ */ React.createElement("td", { style: tdR }, T ? (x.amount / T * 100).toFixed(1) : 0, "%"), /* @__PURE__ */ React.createElement("td", { style: td }, _bar(T ? x.amount / T * 100 : 0, "var(--gold)"))))));
    exp = [["Account", "Amount"], ...rows.map((x) => [x.name, fmtN(x.amount)])];
  }
  if (tab === "forecast") {
    const fc = buildCashForecast(13);
    body = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(KpiStrip, { items: [{ label: "Cash & bank today", value: fmt(fc.start), color: "var(--primary2)" }, { label: "Expected in (13 wks)", value: fmt(fc.rows.reduce((s, r) => s + r.inflow, 0)), color: "var(--green)" }, { label: "Expected out (13 wks)", value: fmt(fc.rows.reduce((s, r) => s + r.outflow, 0)), color: "var(--red)" }, { label: "Lowest projected balance", value: fmt(Math.min(...fc.rows.map((r) => r.close))), color: "var(--gold)" }] }), /* @__PURE__ */ React.createElement(Wrap, { min: 640 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Week"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Receivables due"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Payables due"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Net"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Projected balance")), /* @__PURE__ */ React.createElement("tbody", null, fc.rows.map((r, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, r.label), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--green)" } }, fmt(r.inflow)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--red)" } }, fmt(r.outflow)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(r.inflow - r.outflow)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700, color: r.close < 0 ? "var(--red)" : "var(--text)" } }, fmt(r.close)))))), /* @__PURE__ */ React.createElement(InfoNote, null, "Projection from today's cash & bank balance, plus open customer invoices and unpaid vendor bills on their due dates (overdue items land in week 1). Payroll, tax payments and recurring entries are not included."));
    exp = [["Week", "In", "Out", "Balance"], ...fc.rows.map((r) => [r.label, fmtN(r.inflow), fmtN(r.outflow), fmtN(r.close)])];
  }
  const TABS = [["hpl", "Horizontal P&L"], ["hbs", "Horizontal Balance Sheet"], ["eq", "Movement of Equity"], ["scust", "Sales by Customer"], ["sitem", "Sales by Item"], ["pvend", "Purchases by Vendor"], ["topexp", "Expenses by Account"], ["forecast", "Cash Flow Forecast"]];
  const title = TABS.find((t) => t[0] === tab)[1];
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(PrHead, { title: "More reports", sub: `${fmtDate(from)} to ${fmtDate(to)}` }, exp && /* @__PURE__ */ React.createElement(ExportMenu, { onExport: (f) => exportTableAs(f, title.replace(/\W+/g, "_"), title + ` (${fmtDate(from)} to ${fmtDate(to)})`, exp[0], exp.slice(1)) })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 12 } }, tab !== "forecast" && /* @__PURE__ */ React.createElement(_Range, { from, to, setFrom, setTo })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 } }, TABS.map(([k, l]) => /* @__PURE__ */ React.createElement("button", { key: k, className: "btn btn-sm " + (tab === k ? "btn-primary" : "btn-outline"), onClick: () => setTab(k) }, l))), body);
};
const buildCashForecast = (weeks) => {
  const tb = getTrialBalance(today());
  const cash = tb.filter((r) => isCashAcct(coaByKey(r.account))).reduce((s, r) => s + r.balance, 0);
  const ar = getOpenItems("credit"), ap = getOpenItems("debit");
  const t0 = today();
  const rows = [];
  let bal = cash;
  for (let w = 0; w < weeks; w++) {
    const a = addDaysISO(t0, w * 7), b = addDaysISO(t0, w * 7 + 6);
    const inW = (o) => {
      const d = o.due || o.date || t0;
      return w === 0 ? d <= b : d >= a && d <= b;
    };
    const inflow = r2(ar.filter(inW).reduce((s, o) => s + o.out, 0)), outflow = r2(ap.filter(inW).reduce((s, o) => s + o.out, 0));
    bal = r2(bal + inflow - outflow);
    rows.push({ label: `${fmtDate(a)} \u2013 ${fmtDate(b)}${w === 0 ? " (incl. overdue)" : ""}`, inflow, outflow, close: bal });
  }
  return { start: r2(cash), rows };
};
