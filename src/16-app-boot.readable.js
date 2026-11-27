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
const BusinessOverviewPage = ({ go }) => {
  const [fy, setFy] = useState(getFY());
  const [basis, setBasis] = useState("accrual");
  const months = useMemo(() => FY_MONTHS.map((m, i) => {
    const y = i < 9 ? fy : fy + 1;
    const mm = (i + 3) % 12 + 1;
    const from = `${y}-${String(mm).padStart(2, "0")}-01`;
    const to = monthEndISO(y, mm);
    const p = (basis === "cash" ? getPLCash : getPLAccrual)(from, to);
    return { m, inc: p.income, exp: p.expense };
  }), [fy, basis]);
  const year = useMemo(() => (basis === "cash" ? getPLCash : getPLAccrual)(fyStartOf(fy), fyEndOf(fy)), [fy, basis]);
  const top = useMemo(() => groupSum(year.rows.filter((r) => r.type === "expense")).slice(0, 6), [year]);
  const topT = top.reduce((s, x) => s + x.amount, 0);
  const pulse = computePulse();
  const max = Math.max(1, ...months.map((x) => Math.max(x.inc, x.exp)));
  const W = 640, H = 200, pad = 28, bw = (W - pad * 2) / 12;
  const colors = ["#4F6FE8", "#17A673", "#E69A12", "#F1495C", "#8B5CF6", "#0E7490"];
  let acc = 0;
  const arcs = top.map((t, i) => {
    const f = topT ? t.amount / topT : 0;
    const a0 = acc * 2 * Math.PI;
    acc += f;
    const a1 = acc * 2 * Math.PI;
    const R = 70, r = 44;
    const P = (a, rad) => [100 + rad * Math.sin(a), 100 - rad * Math.cos(a)];
    const [x0, y0] = P(a0, R), [x1, y1] = P(a1 - 1e-4, R), [x2, y2] = P(a1 - 1e-4, r), [x3, y3] = P(a0, r);
    const big = a1 - a0 > Math.PI ? 1 : 0;
    return /* @__PURE__ */ React.createElement("path", { key: i, d: `M${x0},${y0} A${R},${R} 0 ${big} 1 ${x1},${y1} L${x2},${y2} A${r},${r} 0 ${big} 0 ${x3},${y3}Z`, fill: colors[i % 6] });
  });
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(PrHead, { title: "Business overview", sub: "Income, expenses and where the money goes" }, /* @__PURE__ */ React.createElement(FyPicker, { value: fy, onChange: setFy }), /* @__PURE__ */ React.createElement("select", { className: "field-input", style: { width: 120 }, value: basis, onChange: (e) => setBasis(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "accrual" }, "Accrual"), /* @__PURE__ */ React.createElement("option", { value: "cash" }, "Cash"))), /* @__PURE__ */ React.createElement(KpiStrip, { items: [{ label: "Total income", value: fmt(year.income), color: "var(--green)" }, { label: "Total expenses", value: fmt(year.expense), color: "var(--red)" }, { label: "Net profit", value: fmt(year.net), color: year.net >= 0 ? "var(--green)" : "var(--red)" }, { label: "Receivables", value: fmt(pulse.recv), color: "var(--primary2)" }, { label: "Payables", value: fmt(pulse.pay), color: "var(--gold)" }] }), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, marginBottom: 6 } }, "Income and expense ", /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 500, color: "var(--text3)", fontSize: 12 } }, "\xB7 FY ", fy, "-", String(fy + 1).slice(2))), /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${W} ${H + 24}`, style: { width: "100%" } }, months.map((x, i) => {
    const hi = x.inc / max * H, he = x.exp / max * H;
    return /* @__PURE__ */ React.createElement("g", { key: i }, /* @__PURE__ */ React.createElement("rect", { x: pad + i * bw + 3, y: H - hi, width: bw / 2 - 4, height: hi, fill: "#17A673", rx: "2" }, /* @__PURE__ */ React.createElement("title", null, `${x.m}: income ${fmt(x.inc)}`)), /* @__PURE__ */ React.createElement("rect", { x: pad + i * bw + bw / 2, y: H - he, width: bw / 2 - 4, height: he, fill: "#F1495C", rx: "2" }, /* @__PURE__ */ React.createElement("title", null, `${x.m}: expense ${fmt(x.exp)}`)), /* @__PURE__ */ React.createElement("text", { x: pad + i * bw + bw / 2, y: H + 14, fontSize: "10", textAnchor: "middle", fill: "var(--text3)" }, x.m));
  }), /* @__PURE__ */ React.createElement("line", { x1: pad, x2: W - pad, y1: H, y2: H, stroke: "var(--border2)" })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#17A673" } }, "\u25A0"), " Income \xA0 ", /* @__PURE__ */ React.createElement("span", { style: { color: "#F1495C" } }, "\u25A0"), " Expenses")), /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, marginBottom: 6 } }, "Top expenses"), top.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { color: "var(--text3)", padding: 20 } }, "No expenses in this year.") : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 200 200", style: { width: 170 } }, arcs, /* @__PURE__ */ React.createElement("text", { x: "100", y: "104", textAnchor: "middle", fontSize: "11", fill: "var(--text2)" }, fmtShort(topT))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 160 } }, top.map((t, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", gap: 8, fontSize: 12, marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { color: colors[i % 6] } }, "\u25A0"), /* @__PURE__ */ React.createElement("span", { style: { flex: 1 } }, t.label), /* @__PURE__ */ React.createElement("b", null, fmtShort(t.amount)))))))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => go("morereports") }, "More reports \u203A"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => go("cashflow") }, "Cash flow & ratios \u203A")));
};
const EwayBillPage = ({ currentUser }) => {
  const co = S.get(SK.CO, {}) || {};
  const [from, setFrom] = useState(addDaysISO(today(), -30));
  const [to, setTo] = useState(today());
  const [sel, setSel] = useState({});
  const [t, setT] = useState({ transporterId: "", transporterName: "", transMode: "1", distance: "0", vehicleNo: "", vehicleType: "R" });
  const invs = (S.get(SK.INV, []) || []).filter((i) => i.docType === "TAX INVOICE" && _validInv(i) && (i.date || "") >= from && (i.date || "") <= to);
  const dmy = (d) => d ? d.slice(8, 10) + "/" + d.slice(5, 7) + "/" + d.slice(0, 4) : "";
  const num = (n) => +(+n || 0).toFixed(2);
  const build = () => {
    const chosen = invs.filter((i) => sel[i.invNo]);
    if (!chosen.length) {
      toast.error("Select at least one invoice");
      return null;
    }
    const bad = chosen.filter((i) => {
      var _a, _b;
      return !(((_a = i.billTo) == null ? void 0 : _a.pin) || ((_b = i.billTo) == null ? void 0 : _b.pincode));
    });
    if (bad.length) {
      toast.error("Customer PIN missing on: " + bad.map((i) => i.invNo).join(", "));
      return null;
    }
    const fromSC = parseInt(stateCode(co.gstin)) || 0;
    const list = chosen.map((i) => {
      var _a, _b, _c, _d, _e, _f, _g;
      const inter = i.gstType === "INTER";
      const items = (i.items || []).map((it) => {
        const q = parseFloat(it.qty) || 0, tx = parseFloat(it.taxable) || q * (parseFloat(it.rate) || 0), rt = parseFloat(it.taxRate) || 0;
        return { productName: it.desc, productDesc: it.desc, hsnCode: parseInt(String(it.hsnCode || "").replace(/\D/g, "")) || 0, quantity: q, qtyUnit: String(it.unit || "NOS").toUpperCase().slice(0, 3), taxableAmount: num(tx), sgstRate: inter ? 0 : rt / 2, cgstRate: inter ? 0 : rt / 2, igstRate: inter ? rt : 0, cessRate: 0 };
      });
      const gst = Math.abs(invGstAmt(i));
      const toSC = parseInt(stateCode((_a = i.billTo) == null ? void 0 : _a.gstin)) || fromSC;
      return {
        userGstin: co.gstin,
        supplyType: "O",
        subSupplyType: 1,
        subSupplyDesc: "",
        docType: "INV",
        docNo: i.invNo,
        docDate: dmy(i.date),
        transType: 1,
        fromGstin: co.gstin,
        fromTrdName: co.name,
        fromAddr1: co.address || "",
        fromAddr2: "",
        fromPlace: co.city || "",
        fromPincode: parseInt(co.pin || co.pincode) || 0,
        actFromStateCode: fromSC,
        fromStateCode: fromSC,
        toGstin: ((_b = i.billTo) == null ? void 0 : _b.gstin) || "URP",
        toTrdName: (_c = i.billTo) == null ? void 0 : _c.name,
        toAddr1: ((_d = i.billTo) == null ? void 0 : _d.address) || "",
        toAddr2: "",
        toPlace: ((_e = i.billTo) == null ? void 0 : _e.city) || "",
        toPincode: parseInt(((_f = i.billTo) == null ? void 0 : _f.pin) || ((_g = i.billTo) == null ? void 0 : _g.pincode)) || 0,
        actToStateCode: toSC,
        toStateCode: toSC,
        totalValue: num(Math.abs(getGrand(i)) - gst),
        cgstValue: inter ? 0 : num(gst / 2),
        sgstValue: inter ? 0 : num(gst / 2),
        igstValue: inter ? num(gst) : 0,
        cessValue: 0,
        totInvValue: num(Math.abs(getGrand(i))),
        transporterId: t.transporterId,
        transporterName: t.transporterName,
        transDocNo: "",
        transMode: t.transMode,
        transDistance: String(t.distance || "0"),
        transDocDate: "",
        vehicleNo: t.vehicleNo.replace(/\s+/g, "").toUpperCase(),
        vehicleType: t.vehicleType,
        itemList: items
      };
    });
    return { version: "1.0.0621", billLists: list };
  };
  const go = () => {
    if (!validateGSTIN(co.gstin)) {
      toast.error("Add a valid company GSTIN in Company Settings first");
      return;
    }
    const j = build();
    if (!j) return;
    _dl("eway_bills_" + today() + ".json", JSON.stringify(j, null, 1));
    logAudit("EWAY_JSON_EXPORT", j.billLists.length + " invoice(s)", currentUser);
    toast.success("JSON downloaded \u2014 upload it on the e-Way Bill portal (Bulk Generation)");
  };
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(PrHead, { title: "e-Way bills", sub: "Pick invoices, add transport details and download the JSON for the e-Way Bill portal's bulk-generation tool" }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 12 } }, /* @__PURE__ */ React.createElement(_Range, { from, to, setFrom, setTo }), /* @__PURE__ */ React.createElement(_Inp, { label: "Transporter ID" }, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: t.transporterId, onChange: (e) => setT({ ...t, transporterId: e.target.value }) })), /* @__PURE__ */ React.createElement(_Inp, { label: "Transporter name" }, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: t.transporterName, onChange: (e) => setT({ ...t, transporterName: e.target.value }) })), /* @__PURE__ */ React.createElement(_Inp, { label: "Mode" }, /* @__PURE__ */ React.createElement("select", { className: "field-input", value: t.transMode, onChange: (e) => setT({ ...t, transMode: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "1" }, "Road"), /* @__PURE__ */ React.createElement("option", { value: "2" }, "Rail"), /* @__PURE__ */ React.createElement("option", { value: "3" }, "Air"), /* @__PURE__ */ React.createElement("option", { value: "4" }, "Ship"))), /* @__PURE__ */ React.createElement(_Inp, { label: "Distance (km)" }, /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { width: 100 }, value: t.distance, onChange: (e) => setT({ ...t, distance: e.target.value }) })), /* @__PURE__ */ React.createElement(_Inp, { label: "Vehicle no." }, /* @__PURE__ */ React.createElement("input", { className: "field-input", style: { width: 130 }, value: t.vehicleNo, onChange: (e) => setT({ ...t, vehicleNo: e.target.value }) })), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: go }, "Download JSON")), invs.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "No tax invoices in this range." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 640 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", onChange: (e) => {
    const s = {};
    if (e.target.checked) invs.forEach((i) => {
      s[i.invNo] = true;
    });
    setSel(s);
  } })), /* @__PURE__ */ React.createElement("th", { style: th }, "Date"), /* @__PURE__ */ React.createElement("th", { style: th }, "Invoice #"), /* @__PURE__ */ React.createElement("th", { style: th }, "Customer"), /* @__PURE__ */ React.createElement("th", { style: th }, "PIN"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Invoice value")), /* @__PURE__ */ React.createElement("tbody", null, invs.map((i) => {
    var _a, _b, _c, _d, _e;
    return /* @__PURE__ */ React.createElement("tr", { key: i.invNo, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: !!sel[i.invNo], onChange: (e) => setSel({ ...sel, [i.invNo]: e.target.checked }) })), /* @__PURE__ */ React.createElement("td", { style: td }, fmtDate(i.date)), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 600 } }, i.invNo), /* @__PURE__ */ React.createElement("td", { style: td }, (_a = i.billTo) == null ? void 0 : _a.name), /* @__PURE__ */ React.createElement("td", { style: { ...td, color: ((_b = i.billTo) == null ? void 0 : _b.pin) || ((_c = i.billTo) == null ? void 0 : _c.pincode) ? "" : "var(--red)" } }, ((_d = i.billTo) == null ? void 0 : _d.pin) || ((_e = i.billTo) == null ? void 0 : _e.pincode) || "missing"), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(Math.abs(getGrand(i)))));
  }))), /* @__PURE__ */ React.createElement(InfoNote, null, "Generates the standard bulk-upload JSON (supply type Outward, document type Invoice). Always check the file once in the portal's \u201CBulk Generation\u201D validator before relying on it \u2014 this tool does not call the government API."));
};
const TimeTrackingPage = ({ currentUser }) => {
  const [projs, setProjs] = useState(() => S.get(XK.PROJ, []) || []);
  const [log, setLog] = useState(() => S.get(XK.TIME, []) || []);
  const [tab, setTab] = useState("log");
  const [p, setP] = useState({ name: "", customer: "", rate: "" });
  const [e, setE] = useState({ date: today(), projectId: "", hours: "", notes: "", billable: true });
  const saveP = (u) => {
    setProjs(u);
    S.set(XK.PROJ, u);
  };
  const saveL = (u) => {
    setLog(u);
    S.set(XK.TIME, u);
  };
  const addProject = () => {
    if (!p.name.trim() || !p.customer.trim()) {
      toast.error("Project name and customer are required");
      return;
    }
    saveP([...projs, { id: Date.now().toString(), ...p, rate: parseFloat(p.rate) || 0 }]);
    setP({ name: "", customer: "", rate: "" });
  };
  const addEntry = () => {
    const h = parseFloat(e.hours) || 0;
    if (!e.projectId || h <= 0) {
      toast.error("Choose a project and enter hours");
      return;
    }
    saveL([...log, { id: Date.now().toString(), ...e, hours: h, billed: false }]);
    setE({ ...e, hours: "", notes: "" });
  };
  const nameOf = (id) => {
    var _a;
    return ((_a = projs.find((x) => x.id === id)) == null ? void 0 : _a.name) || "\u2014";
  };
  const bill = (pr) => {
    const rows = log.filter((x) => x.projectId === pr.id && x.billable && !x.billed);
    if (!rows.length) {
      toast.info("No unbilled billable hours");
      return;
    }
    const hrs = rows.reduce((s, x) => s + x.hours, 0);
    if (!window.confirm(`Create an invoice for ${hrs} h \xD7 ${fmt(pr.rate)} = ${fmt(hrs * pr.rate)} for ${pr.customer}?`)) return;
    const inv = convertItemsToInvoice({ ...blankSimpleCustomer(), name: pr.customer }, [{ desc: `${pr.name} \u2014 ${hrs} hours (${rows[0].date} to ${rows[rows.length - 1].date})`, qty: hrs, rate: pr.rate }], "Created from Time Tracking", currentUser);
    if (!inv) {
      toast.error("Could not create invoice");
      return;
    }
    saveL(log.map((x) => rows.includes(x) ? { ...x, billed: true, invNo: inv.invNo } : x));
    toast.success("Invoice " + inv.invNo + " created");
  };
  const unb = projs.map((x) => ({ ...x, h: log.filter((l) => l.projectId === x.id && l.billable && !l.billed).reduce((s, l) => s + l.hours, 0) }));
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(PrHead, { title: "Time tracking", sub: "Log hours against projects and bill them to the customer" }), /* @__PURE__ */ React.createElement(KpiStrip, { items: [{ label: "Projects", value: String(projs.length) }, { label: "Hours logged", value: String(log.reduce((s, l) => s + l.hours, 0)) }, { label: "Unbilled value", value: fmt(unb.reduce((s, x) => s + x.h * x.rate, 0)), color: "var(--gold)" }] }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 12 } }, [["log", "Timesheet"], ["proj", "Projects"]].map(([k, l]) => /* @__PURE__ */ React.createElement("button", { key: k, className: "btn btn-sm " + (tab === k ? "btn-primary" : "btn-outline"), onClick: () => setTab(k) }, l))), tab === "proj" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 14, marginBottom: 14, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" } }, /* @__PURE__ */ React.createElement(_Inp, { label: "Project name", w: 200 }, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: p.name, onChange: (x) => setP({ ...p, name: x.target.value }) })), /* @__PURE__ */ React.createElement(_Inp, { label: "Customer", w: 220 }, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: p.customer, onChange: (x) => setP({ ...p, customer: x.target.value }) })), /* @__PURE__ */ React.createElement(_Inp, { label: "Rate per hour (\u20B9)" }, /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: p.rate, onChange: (x) => setP({ ...p, rate: x.target.value }) })), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: addProject }, "Add project")), projs.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "No projects yet." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 620 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Project"), /* @__PURE__ */ React.createElement("th", { style: th }, "Customer"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Rate/h"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Unbilled hours"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Unbilled value"), /* @__PURE__ */ React.createElement("th", { style: th })), /* @__PURE__ */ React.createElement("tbody", null, unb.map((x) => /* @__PURE__ */ React.createElement("tr", { key: x.id, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 600 } }, x.name), /* @__PURE__ */ React.createElement("td", { style: td }, x.customer), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(x.rate)), /* @__PURE__ */ React.createElement("td", { style: tdR }, x.h), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(x.h * x.rate)), /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-primary", disabled: !x.h, onClick: () => bill(x) }, "Create invoice"))))))), tab === "log" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 14, marginBottom: 14, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" } }, /* @__PURE__ */ React.createElement(_Inp, { label: "Date" }, /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: e.date, onChange: (x) => setE({ ...e, date: x.target.value }) })), /* @__PURE__ */ React.createElement(_Inp, { label: "Project", w: 200 }, /* @__PURE__ */ React.createElement("select", { className: "field-input", value: e.projectId, onChange: (x) => setE({ ...e, projectId: x.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "\u2014 choose \u2014"), projs.map((x) => /* @__PURE__ */ React.createElement("option", { key: x.id, value: x.id }, x.name)))), /* @__PURE__ */ React.createElement(_Inp, { label: "Hours" }, /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { width: 90 }, value: e.hours, onChange: (x) => setE({ ...e, hours: x.target.value }) })), /* @__PURE__ */ React.createElement(_Inp, { label: "Notes", w: 240 }, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: e.notes, onChange: (x) => setE({ ...e, notes: x.target.value }) })), /* @__PURE__ */ React.createElement("label", { style: { fontSize: 12, display: "flex", gap: 6, alignItems: "center" } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: e.billable, onChange: (x) => setE({ ...e, billable: x.target.checked }) }), "Billable"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: addEntry }, "Log time")), log.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "No time logged yet." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 620 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Date"), /* @__PURE__ */ React.createElement("th", { style: th }, "Project"), /* @__PURE__ */ React.createElement("th", { style: th }, "Notes"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Hours"), /* @__PURE__ */ React.createElement("th", { style: th }, "Status"), /* @__PURE__ */ React.createElement("th", { style: th })), /* @__PURE__ */ React.createElement("tbody", null, [...log].reverse().map((l) => /* @__PURE__ */ React.createElement("tr", { key: l.id, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, fmtDate(l.date)), /* @__PURE__ */ React.createElement("td", { style: td }, nameOf(l.projectId)), /* @__PURE__ */ React.createElement("td", { style: td }, l.notes), /* @__PURE__ */ React.createElement("td", { style: tdR }, l.hours), /* @__PURE__ */ React.createElement("td", { style: td }, l.billed ? /* @__PURE__ */ React.createElement("span", { style: { color: "var(--green)" } }, "Billed ", l.invNo) : l.billable ? "Unbilled" : "Non-billable"), /* @__PURE__ */ React.createElement("td", { style: td }, !l.billed && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => saveL(log.filter((x) => x.id !== l.id)) }, "Delete"))))))));
};
const CUST_BLANK = { name: "", contact: "", gstin: "", pan: "", phone: "", email: "", address: "", city: "", state: "", pin: "", terms: "", creditLimit: "", openingBal: "", notes: "" };
const CustTextField = ({ label, value, onChange, ph, type, span }) => /* @__PURE__ */ React.createElement("div", { className: "field", style: { flex: span || "1 1 220px", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, label), /* @__PURE__ */ React.createElement("input", { className: "field-input", type: type || "text", value: value || "", placeholder: ph || "", onChange: (e) => onChange(e.target.value) }));
const CustEditModal = ({ init, onSave, onClose }) => {
  const [f, setF] = useState({ ...CUST_BLANK, ...init });
  const u = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  return /* @__PURE__ */ React.createElement("div", { className: "overlay", onClick: (e) => e.target === e.currentTarget && onClose() }, /* @__PURE__ */ React.createElement("div", { className: "modal", style: { maxWidth: 760, width: "100%" } }, /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("span", { className: "modal-title" }, init && init.name ? "Edit customer" : "New customer"), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Ic, { n: "x" }))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(CustTextField, { label: "Customer name *", value: f.name, onChange: u("name"), span: "2 1 300px" }), /* @__PURE__ */ React.createElement(CustTextField, { label: "Contact person", value: f.contact, onChange: u("contact") }), /* @__PURE__ */ React.createElement(CustTextField, { label: "GSTIN", value: f.gstin, onChange: (v) => u("gstin")(v.toUpperCase()) }), /* @__PURE__ */ React.createElement(CustTextField, { label: "PAN", value: f.pan, onChange: (v) => u("pan")(v.toUpperCase()) }), /* @__PURE__ */ React.createElement(CustTextField, { label: "Phone", value: f.phone, onChange: u("phone") }), /* @__PURE__ */ React.createElement(CustTextField, { label: "Email", value: f.email, onChange: u("email") }), /* @__PURE__ */ React.createElement(CustTextField, { label: "Address", value: f.address, onChange: u("address"), span: "1 1 100%" }), /* @__PURE__ */ React.createElement(CustTextField, { label: "City", value: f.city, onChange: u("city") }), /* @__PURE__ */ React.createElement(CustTextField, { label: "State", value: f.state, onChange: u("state") }), /* @__PURE__ */ React.createElement(CustTextField, { label: "PIN", value: f.pin, onChange: u("pin") }), /* @__PURE__ */ React.createElement(CustTextField, { label: "Payment terms (days)", value: f.terms, onChange: u("terms"), type: "number" }), /* @__PURE__ */ React.createElement(CustTextField, { label: "Credit limit (\u20B9)", value: f.creditLimit, onChange: u("creditLimit"), type: "number" }), /* @__PURE__ */ React.createElement(CustTextField, { label: "Opening balance (\u20B9)", value: f.openingBal, onChange: u("openingBal"), type: "number" }), /* @__PURE__ */ React.createElement(CustTextField, { label: "Notes", value: f.notes, onChange: u("notes"), span: "1 1 100%" })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: onClose }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => {
    if (!f.name.trim()) {
      toast.error("Customer name required");
      return;
    }
    onSave(f);
  } }, "Save customer")))));
};
const CustomersPage = ({ user, go, onOpenInvoice, onNewTxn }) => {
  const [tick, setTick] = useState(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState("");
  const [tab, setTab] = useState("overview");
  const [edit, setEdit] = useState(null);
  const [filt, setFilt] = useState("all");
  const [from, setFrom] = useState(fyStartOf(getFY()));
  const [to, setTo] = useState(today());
  const [cm, setCm] = useState("");
  const [menu, setMenu] = useState("");
  const master = S.get(SK.CUST, []) || [];
  const invs = S.get(SK.INV, []) || [];
  const rows = useMemo(() => {
    const names = [...new Set([...master.map((c) => c.name), ...invs.map((i) => i.billTo && i.billTo.name)].filter(Boolean))].sort((a, b) => a.localeCompare(b));
    return names.map((n) => {
      const c = master.find((x) => x.name === n) || { name: n };
      let bal = 0;
      try {
        bal = buildStatement("customer", n, "1900-01-01", today()).closing;
      } catch (e) {
      }
      return { ...c, name: n, bal: r2(bal) };
    });
  }, [tick, invs.length, master.length]);
  const list = rows.filter((c) => (!q || (c.name + " " + (c.gstin || "") + " " + (c.city || "") + " " + (c.phone || "")).toLowerCase().includes(q.toLowerCase())) && (filt === "all" || (filt === "due" ? c.bal > 0.01 : c.bal <= 0.01)));
  const cur = rows.find((c) => c.name === sel);
  const mine = cur ? invs.filter((i) => String(i.billTo && i.billTo.name || "").trim().toLowerCase() === cur.name.trim().toLowerCase()) : [];
  const cKey = "ip_cust_comments";
  const allCm = S.get(cKey, {}) || {};
  const comments = cur ? allCm[cur.name] || [] : [];
  const saveCust = (f) => {
    const all = [...master];
    const i = all.findIndex((c) => c.name === (edit && edit.name));
    if (i >= 0) all[i] = { ...all[i], ...f };
    else {
      if (all.find((c) => c.name.toLowerCase() === f.name.toLowerCase())) {
        toast.error("Customer already exists");
        return;
      }
      all.push({ ...f, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
    }
    S.set(SK.CUST, all);
    logAudit(i >= 0 ? "CUSTOMER_EDITED" : "CUSTOMER_ADDED", f.name, user);
    setEdit(null);
    setSel(f.name);
    setTick((t) => t + 1);
    toast.success("Customer saved");
  };
  const addComment = () => {
    if (!cm.trim()) return;
    const n = { ...allCm, [cur.name]: [{ t: cm.trim(), by: user && user.email || "", at: (/* @__PURE__ */ new Date()).toISOString() }, ...comments] };
    S.set(cKey, n);
    setCm("");
    setTick((t) => t + 1);
  };
  const newTxn = (kind) => {
    setMenu("");
    onNewTxn && onNewTxn(kind, { name: cur.name, address: cur.address || "", city: cur.city || "", state: cur.state || "", pin: cur.pin || "", gstin: cur.gstin || "", phone: cur.phone || "", email: cur.email || "" });
  };
  const st = cur && (tab === "statement" || tab === "overview") ? buildStatement("customer", cur.name, tab === "statement" ? from : "1900-01-01", tab === "statement" ? to : today()) : null;
  const totalDue = rows.reduce((s, c) => s + (c.bal > 0 ? c.bal : 0), 0);
  const exportList = (fm) => exportTableAs(fm, "Customers", "Customers", ["Customer", "Contact person", "GSTIN", "PAN", "Phone", "Email", "Address", "City", "State", "PIN", "Payment terms", "Credit limit", "Opening balance", "Receivable", "Notes"], list.map((c) => [c.name, c.contact || "", c.gstin || "", c.pan || "", c.phone || "", c.email || "", c.address || "", c.city || "", c.state || "", c.pin || "", c.terms || "", c.creditLimit || "", c.openingBal || "", fmtN(c.bal), c.notes || ""]));
  const exportTxn = (fm) => exportTableAs(fm, "Transactions_" + cur.name.replace(/\W+/g, "_"), "Transactions \u2014 " + cur.name, ["Date", "Type", "Number", "Status", "Due date", "PO no.", "Taxable", "GST", "Total", "Paid", "Balance"], mine.map((i) => {
    const g = Math.abs(getGrand(i));
    const p = invPaid(i);
    return [fmtDate(i.date), i.docType, i.invNo, i.status, i.dueDate ? fmtDate(i.dueDate) : "", i.poNo || "", fmtN(g - Math.abs(invGstAmt(i))), fmtN(Math.abs(invGstAmt(i))), fmtN(g), fmtN(p), fmtN(g - p)];
  }));
  const exportStmt = (fm) => exportTableAs(fm, "Statement_" + cur.name.replace(/\W+/g, "_"), "Statement of Accounts \u2014 " + cur.name, ["Date", "Transaction", "Reference", "Debit", "Credit", "Balance"], [["", "Opening balance", "", "", "", fmtN(st.opening)], ...st.rows.map((r) => [fmtDate(r.date), r.type, r.ref, fmtN(r.dr), fmtN(r.cr), fmtN(r.bal)])]);
  const reminders = cur ? (S.get(SK.AUDIT, []) || []).filter((l) => /REMINDER/.test(JSON.stringify(l)) && mine.some((i) => JSON.stringify(l).includes(i.invNo))) : [];
  const TABS = [["overview", "Overview"], ["comments", "Comments"], ["txns", "Transactions"], ["mails", "Mails"], ["statement", "Statement"]];
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", height: "calc(100vh - 64px)", minHeight: 420, gap: 0, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 310, flex: "0 0 310px", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", minHeight: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 12px 8px", display: "flex", gap: 6, alignItems: "center" } }, /* @__PURE__ */ React.createElement("select", { className: "field-input", style: { flex: 1, height: 34 }, value: filt, onChange: (e) => setFilt(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "all" }, "All customers"), /* @__PURE__ */ React.createElement("option", { value: "due" }, "With balance due"), /* @__PURE__ */ React.createElement("option", { value: "clear" }, "Settled")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary btn-sm", onClick: () => setEdit({}) }, "+ New")), /* @__PURE__ */ React.createElement("div", { style: { padding: "0 12px 8px" } }, /* @__PURE__ */ React.createElement("input", { className: "field-input", placeholder: "Search name, GSTIN, city\u2026", value: q, onChange: (e) => setQ(e.target.value) })), /* @__PURE__ */ React.createElement("div", { style: { padding: "0 14px 6px", fontSize: 11, color: "var(--text3)" } }, list.length, " customers \xB7 receivable ", fmt(totalDue)), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, overflowY: "auto", minHeight: 0 } }, list.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { padding: 24, color: "var(--text3)", textAlign: "center" } }, "No customers found."), list.map((c) => /* @__PURE__ */ React.createElement("div", { key: c.name, onClick: () => {
    setSel(c.name);
    setTab("overview");
  }, style: { padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", background: c.name === sel ? "var(--primary-bg)" : "transparent", borderLeft: c.name === sel ? "3px solid var(--primary)" : "3px solid transparent" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, c.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: c.bal > 0.01 ? "var(--red)" : "var(--text3)" } }, c.bal > 0.01 ? "Due " : "Balance ", fmt(c.bal))))), /* @__PURE__ */ React.createElement("div", { style: { padding: 8, borderTop: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement(ExportMenu, { onExport: exportList, label: "Export all customers" }))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0, overflowY: "auto", padding: "14px 20px" } }, !cur ? /* @__PURE__ */ React.createElement(Empty, { text: "Select a customer on the left to open the customer card." }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, fontWeight: 800, flex: 1, minWidth: 180 } }, cur.name), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: () => setEdit(master.find((c) => c.name === cur.name) || { name: cur.name }) }, "Edit"), /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => setMenu(menu === "t" ? "" : "t") }, "New Transaction \u25BE"), menu === "t" && /* @__PURE__ */ React.createElement("div", { className: "card", style: { position: "absolute", right: 0, top: "105%", zIndex: 30, minWidth: 190, padding: 4 } }, [["invoice", "Invoice"], ["quote", "Quotation"], ["salesorder", "Sales Order"], ["dc", "Delivery Challan"], ["creditnote", "Credit Note"], ["payment", "Payment Received"]].map(([k, l]) => /* @__PURE__ */ React.createElement("div", { key: k, onClick: () => newTxn(k), style: { padding: "8px 12px", cursor: "pointer", fontSize: 13 } }, l)))), /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: () => setMenu(menu === "m" ? "" : "m") }, "More \u25BE"), menu === "m" && /* @__PURE__ */ React.createElement("div", { className: "card", style: { position: "absolute", right: 0, top: "105%", zIndex: 30, minWidth: 190, padding: 4 } }, [["Send payment reminder", () => {
    try {
      sessionStorage.setItem("ab_rem", cur.name);
    } catch (e) {
    }
    go("reminders");
  }], ["Open in Statements", () => {
    try {
      sessionStorage.setItem("ab_stmt", JSON.stringify({ type: "customer", party: cur.name }));
    } catch (e) {
    }
    go("statements");
  }], ["Delete customer", () => {
    if (!window.confirm("Delete " + cur.name + " from the customer master? Invoices are kept.")) return;
    S.set(SK.CUST, master.filter((c) => c.name !== cur.name));
    setSel("");
    setTick((t) => t + 1);
  }]].map(([l, fn]) => /* @__PURE__ */ React.createElement("div", { key: l, onClick: () => {
    setMenu("");
    fn();
  }, style: { padding: "8px 12px", cursor: "pointer", fontSize: 13 } }, l))))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, borderBottom: "1px solid var(--border)", marginBottom: 14, flexWrap: "wrap" } }, TABS.map(([k, l]) => /* @__PURE__ */ React.createElement("div", { key: k, onClick: () => setTab(k), style: { padding: "8px 14px", cursor: "pointer", fontWeight: tab === k ? 800 : 500, borderBottom: tab === k ? "3px solid var(--primary)" : "3px solid transparent", color: tab === k ? "var(--primary2)" : "var(--text2)" } }, l))), tab === "overview" && /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 16, lineHeight: 1.8, fontSize: 13 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, marginBottom: 6 } }, "Contact & billing"), [["Contact", cur.contact], ["Phone", cur.phone], ["Email", cur.email], ["GSTIN", cur.gstin], ["PAN", cur.pan], ["Address", [cur.address, cur.city, cur.state, cur.pin].filter(Boolean).join(", ")], ["Payment terms", cur.terms ? cur.terms + " days" : ""], ["Credit limit", cur.creditLimit ? fmt(cur.creditLimit) : ""], ["Notes", cur.notes]].map(([l, v]) => /* @__PURE__ */ React.createElement("div", { key: l }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text3)", display: "inline-block", width: 110 } }, l), v || "\u2014"))), /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 16, fontSize: 13 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, marginBottom: 6 } }, "Receivables"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", null, "Outstanding receivables"), /* @__PURE__ */ React.createElement("b", { style: { color: cur.bal > 0.01 ? "var(--red)" : "var(--green)" } }, fmt(cur.bal))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", null, "Total invoiced"), /* @__PURE__ */ React.createElement("b", null, fmt(st ? st.debits : 0))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", null, "Total received"), /* @__PURE__ */ React.createElement("b", null, fmt(st ? st.credits : 0))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", null, "Documents"), /* @__PURE__ */ React.createElement("b", null, mine.length)), cur.creditLimit && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", null, "Credit limit used"), /* @__PURE__ */ React.createElement("b", { style: { color: cur.bal > parseFloat(cur.creditLimit) ? "var(--red)" : "inherit" } }, Math.round(cur.bal / parseFloat(cur.creditLimit) * 100), "%")))), tab === "comments" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 12 } }, /* @__PURE__ */ React.createElement("input", { className: "field-input", style: { flex: 1 }, placeholder: "Add a comment\u2026", value: cm, onChange: (e) => setCm(e.target.value), onKeyDown: (e) => e.key === "Enter" && addComment() }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: addComment }, "Add")), comments.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "No comments yet." }) : comments.map((c, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "card", style: { padding: "10px 14px", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", null, c.t), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", marginTop: 3 } }, c.by, " \xB7 ", new Date(c.at).toLocaleString("en-IN"))))), tab === "txns" && /* @__PURE__ */ React.createElement(React.Fragment, null, mine.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", marginBottom: 8 } }, /* @__PURE__ */ React.createElement(ExportMenu, { onExport: exportTxn })), mine.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "No transactions for this customer." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 760 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Date"), /* @__PURE__ */ React.createElement("th", { style: th }, "Type"), /* @__PURE__ */ React.createElement("th", { style: th }, "Number"), /* @__PURE__ */ React.createElement("th", { style: th }, "Status"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Amount"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Balance"), /* @__PURE__ */ React.createElement("th", { style: th })), /* @__PURE__ */ React.createElement("tbody", null, [...mine].sort((a, b) => String(b.date).localeCompare(String(a.date))).map((i) => /* @__PURE__ */ React.createElement("tr", { key: i.invNo, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, fmtDate(i.date)), /* @__PURE__ */ React.createElement("td", { style: td }, i.docType), /* @__PURE__ */ React.createElement("td", { style: td }, i.invNo), /* @__PURE__ */ React.createElement("td", { style: td }, i.status), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(Math.abs(getGrand(i)))), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(Math.abs(getGrand(i)) - invPaid(i))), /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: () => onOpenInvoice && onOpenInvoice(i) }, "Open"))))))), tab === "mails" && (reminders.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "No reminders or mails logged for this customer yet." }) : reminders.map((l, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "card", style: { padding: "10px 14px", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", null, l.detail || l.details || l.msg || JSON.stringify(l)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)" } }, l.ts ? new Date(l.ts).toLocaleString("en-IN") : "")))), tab === "statement" && st && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "From"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: from, onChange: (e) => setFrom(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "To"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: to, onChange: (e) => setTo(e.target.value) })), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), /* @__PURE__ */ React.createElement(ExportMenu, { onExport: exportStmt }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => {
    try {
      sessionStorage.setItem("ab_stmt", JSON.stringify({ type: "customer", party: cur.name }));
    } catch (e) {
    }
    go("statements");
  } }, "Print / PDF")), /* @__PURE__ */ React.createElement(KpiStrip, { items: [{ label: "Opening balance", value: fmt(st.opening) }, { label: "Invoiced", value: fmt(st.debits) }, { label: "Received", value: fmt(st.credits), color: "var(--green)" }, { label: "Balance due", value: fmt(st.closing) }] }), /* @__PURE__ */ React.createElement(Wrap, { min: 680 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Date"), /* @__PURE__ */ React.createElement("th", { style: th }, "Transaction"), /* @__PURE__ */ React.createElement("th", { style: th }, "Details"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Amount"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Payments"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Balance")), /* @__PURE__ */ React.createElement("tbody", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, fmtDate(from)), /* @__PURE__ */ React.createElement("td", { style: td, colSpan: 4 }, /* @__PURE__ */ React.createElement("i", null, "*** Opening balance ***")), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(st.opening))), st.rows.map((r, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, fmtDate(r.date)), /* @__PURE__ */ React.createElement("td", { style: td }, r.type), /* @__PURE__ */ React.createElement("td", { style: td }, r.ref), /* @__PURE__ */ React.createElement("td", { style: tdR }, r.dr ? fmt(r.dr) : ""), /* @__PURE__ */ React.createElement("td", { style: tdR }, r.cr ? fmt(r.cr) : ""), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(r.bal))))))))), edit && /* @__PURE__ */ React.createElement(CustEditModal, { init: edit, onSave: saveCust, onClose: () => setEdit(null) }));
};
const InvoiceViewCard = ({ inv, user, onBack, onEdit }) => {
  const co = S.get(SK.CO, {}) || {};
  const items = (inv.items || []).filter((r) => r.desc);
  const isNG = inv.docType === "NON GST INVOICE";
  const isCN = inv.docType === "CREDIT NOTE";
  const grand = Math.abs(getGrand(inv));
  const paid = invPaid(inv);
  const bal = Math.max(0, grand - paid);
  const frozen = isSalesFrozen(inv) && !isSuperAdmin(user && user.email);
  const stc = { Paid: "var(--green)", Sent: "var(--primary2)", Draft: "var(--text3)", Cancelled: "var(--red)" }[inv.status] || "var(--gold)";
  const od = inv.status !== "Paid" && inv.status !== "Draft" && inv.dueDate && inv.dueDate < today();
  const edit = () => {
    if (frozen) {
      toast.error((inv.date || "").slice(0, 7) + " is frozen \u2014 ask the Super Admin to unfreeze before editing.");
      return;
    }
    onEdit(inv);
  };
  const dup = () => {
    if (!window.confirm("Create a duplicate of " + inv.invNo + "?\nIt opens as an unsaved draft with a new number.")) return;
    onEdit({ ...inv, invNo: genInvNo(inv.docType), date: today(), dueDate: "", status: "Draft", sentToCustomer: false, paidDate: "", payments: [], time: nowTime(), _isDuplicate: true });
    toast.success("Duplicate opened \u2014 review and Save to create it");
  };
  const bt = inv.billTo || {};
  const Row = ({ l, v }) => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, padding: "5px 0", fontSize: 13 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text3)" } }, l), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, textAlign: "right" } }, v || "\u2014"));
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(PrHead, { title: `${inv.docType === "TAX INVOICE" ? "Invoice" : inv.docType} ${inv.invNo}`, sub: `${bt.name || ""} \xB7 ${fmtDate(inv.date)}` }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: onBack }, "\u2190 Back to invoices"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-primary", onClick: () => makePDF(inv, co, S.get(SK.TERMS, DEFAULT_TERMS)) }, "Download PDF"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: dup }, "Duplicate"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: edit, title: frozen ? "This month is frozen" : "Edit this invoice" }, "Edit", frozen ? " \u{1F512}" : "")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16, alignItems: "start" }, className: "invcard-grid" }, /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 0, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 200 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", letterSpacing: 1, fontWeight: 700 } }, "BILL TO"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 16 } }, bt.name || "\u2014"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: "var(--text2)" } }, [bt.address, bt.city, bt.state, bt.pin].filter(Boolean).join(", ")), bt.gstin && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontFamily: "monospace", color: "var(--gold)" } }, "GSTIN ", bt.gstin)), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right" } }, /* @__PURE__ */ React.createElement("span", { style: { padding: "4px 12px", borderRadius: 20, fontWeight: 800, fontSize: 12, color: stc, border: "1px solid " + stc } }, od ? "Overdue" : inv.status), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 26, fontWeight: 800, marginTop: 6, color: isCN ? "var(--red)" : "var(--text)" } }, isCN ? "\u2212" : "", fmt(grand)))), /* @__PURE__ */ React.createElement("div", { style: { overflow: "auto" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", minWidth: 640 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)" } }, ["#", "Item / description", "HSN", "Qty", "Rate", "Taxable", "GST", "Amount"].map((h, i) => /* @__PURE__ */ React.createElement("th", { key: h, style: { ...i > 2 ? thR : th, padding: "9px 12px" } }, h)))), /* @__PURE__ */ React.createElement("tbody", null, items.map((r, i) => {
    const q = parseFloat(r.qty) || 0, rt = parseFloat(r.rate) || 0;
    return /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, i + 1), /* @__PURE__ */ React.createElement("td", { style: td }, r.desc), /* @__PURE__ */ React.createElement("td", { style: td }, isNG ? "" : r.hsnCode), /* @__PURE__ */ React.createElement("td", { style: tdR }, q, " ", r.unit || ""), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(rt)), /* @__PURE__ */ React.createElement("td", { style: tdR }, isNG ? fmtN(q * rt) : fmtN(r.taxable)), /* @__PURE__ */ React.createElement("td", { style: tdR }, isNG ? "\u2014" : fmtN(r.gstAmt) + " (" + (r.taxRate || 0) + "%)"), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700 } }, fmtN(isNG ? q * rt : r.total)));
  })))), /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 20px", marginLeft: "auto", maxWidth: 340 } }, !isNG && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Row, { l: "Sub total", v: fmt(inv.subtotal) }), Object.entries(inv.taxBreakdown || {}).map(([k, v]) => /* @__PURE__ */ React.createElement(Row, { key: k, l: `GST @ ${k}%`, v: fmt(v) })), !!inv.roundOff && /* @__PURE__ */ React.createElement(Row, { l: "Round off", v: fmtN(inv.roundOff) })), /* @__PURE__ */ React.createElement("div", { style: { borderTop: "2px solid var(--border2)", marginTop: 6 } }, /* @__PURE__ */ React.createElement(Row, { l: "Total", v: /* @__PURE__ */ React.createElement("b", { style: { fontSize: 15 } }, fmt(grand)) }))), inv.notes && /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 20px 16px", fontSize: 12.5, color: "var(--text2)" } }, /* @__PURE__ */ React.createElement("b", null, "Notes: "), inv.notes)), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, marginBottom: 6 } }, "Payment"), /* @__PURE__ */ React.createElement(Row, { l: "Invoiced", v: fmt(grand) }), /* @__PURE__ */ React.createElement(Row, { l: "Received", v: fmt(paid) }), /* @__PURE__ */ React.createElement(Row, { l: "Balance due", v: /* @__PURE__ */ React.createElement("b", { style: { color: bal > 0.01 ? "var(--red)" : "var(--green)" } }, fmt(bal)) }), inv.paidDate && /* @__PURE__ */ React.createElement(Row, { l: "Paid on", v: fmtDate(inv.paidDate) }), /* @__PURE__ */ React.createElement("div", { style: { height: 8, borderRadius: 6, background: "var(--card2)", overflow: "hidden", marginTop: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { width: Math.min(100, grand ? paid / grand * 100 : 0) + "%", height: "100%", background: "var(--green)" } }))), /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, marginBottom: 6 } }, "Details"), /* @__PURE__ */ React.createElement(Row, { l: "Type", v: inv.docType }), /* @__PURE__ */ React.createElement(Row, { l: "Invoice date", v: fmtDate(inv.date) }), /* @__PURE__ */ React.createElement(Row, { l: "Due date", v: inv.dueDate ? fmtDate(inv.dueDate) : "" }), /* @__PURE__ */ React.createElement(Row, { l: "PO / ref", v: inv.poNo }), /* @__PURE__ */ React.createElement(Row, { l: "Supply type", v: isNG ? "Non-GST" : inv.gstType === "INTER" ? "Inter-state (IGST)" : "Intra-state (CGST+SGST)" }), inv.origInvNo && /* @__PURE__ */ React.createElement(Row, { l: "Against invoice", v: inv.origInvNo }), /* @__PURE__ */ React.createElement(Row, { l: "Created by", v: inv.createdBy }), /* @__PURE__ */ React.createElement(Row, { l: "Time", v: inv.time })), frozen && /* @__PURE__ */ React.createElement(InfoNote, null, "This month is frozen. The invoice can be viewed and downloaded but not edited."))), /* @__PURE__ */ React.createElement("style", null, `@media(max-width:980px){.invcard-grid{grid-template-columns:1fr!important}}`));
};
const SalesOrdersPage = ({ inline = true, onClose, currentUser }) => {
  const [list, setList] = useState(() => S.get(XK.SORDER, []));
  const blank = () => ({ id: Date.now().toString(), soNo: "", date: today(), validTill: addDaysStr(today(), 15), customer: blankSimpleCustomer(), items: [blankSimpleItem()], notes: "", status: "Draft", convertedInvNo: "" });
  const [form, setForm] = useState(null);
  const persist = (u) => {
    setList(u);
    S.set(XK.SORDER, u);
  };
  const total = (f) => (f.items || []).reduce((s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0), 0);
  const save = () => {
    var _a;
    if (!form.customer.name) {
      toast.error("Customer name required");
      return;
    }
    let f = form;
    const wasExisting = list.some((q) => q.id === f.id);
    if (!f.soNo) {
      const { no, commit } = nextDocNo("SO");
      f = { ...f, soNo: no };
      commit();
    }
    persist(wasExisting ? list.map((q) => q.id === f.id ? f : q) : [...list, f]);
    logAudit(wasExisting ? "SORDER_EDITED" : "SORDER_CREATED", `${f.soNo} \u2014 ${((_a = f.customer) == null ? void 0 : _a.name) || ""} \u2014 ${fmt(total(f))}`, currentUser);
    setForm(null);
    toast.success("Sales order saved");
  };
  const del = (id) => {
    var _a;
    if (!window.confirm("Delete this sales order?")) return;
    const q = list.find((x) => x.id === id);
    persist(list.filter((q2) => q2.id !== id));
    logAudit("SORDER_DELETED", `${(q == null ? void 0 : q.soNo) || ""} \u2014 ${((_a = q == null ? void 0 : q.customer) == null ? void 0 : _a.name) || ""}`, currentUser);
  };
  const setStatus = (id, status) => {
    persist(list.map((q) => q.id === id ? { ...q, status } : q));
  };
  const convert = (q) => {
    if (!window.confirm(`Convert ${q.soNo} into a real invoice for ${fmt(total(q))}?`)) return;
    const inv = convertItemsToInvoice(q.customer, q.items, `Converted from Sales Order ${q.soNo}`, currentUser);
    if (!inv) {
      toast.error("Add at least one item first");
      return;
    }
    persist(list.map((x) => x.id === q.id ? { ...x, status: "Converted", convertedInvNo: inv.invNo } : x));
    logAudit("SORDER_CONVERTED", `${q.soNo} \u2192 invoice ${inv.invNo}`, currentUser);
    toast.success(`Converted to invoice ${inv.invNo}`);
  };
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay" }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal" }, !inline && /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("span", { className: "modal-title" }, /* @__PURE__ */ React.createElement(Ic, { n: "file", s: 18 }), " Sales Orders"), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Ic, { n: "x" }))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, !form ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", style: { marginBottom: 14 }, onClick: () => setForm(blank()) }, /* @__PURE__ */ React.createElement(Ic, { n: "plus", s: 13 }), " New Sales Order"), /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "No."), /* @__PURE__ */ React.createElement("th", null, "Date"), /* @__PURE__ */ React.createElement("th", null, "Customer"), /* @__PURE__ */ React.createElement("th", null, "Expected Shipment"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Amount"), /* @__PURE__ */ React.createElement("th", null, "Status"), /* @__PURE__ */ React.createElement("th", { style: { width: 220 } }, "Actions"))), /* @__PURE__ */ React.createElement("tbody", null, list.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 7, style: { textAlign: "center", padding: 24, color: "var(--text3)" } }, "No sales orders yet.")) : [...list].sort((a, b) => (b.date || "").localeCompare(a.date || "")).map((q) => {
    var _a;
    return /* @__PURE__ */ React.createElement("tr", { key: q.id }, /* @__PURE__ */ React.createElement("td", { style: { fontWeight: 600 } }, q.soNo), /* @__PURE__ */ React.createElement("td", null, fmtDate(q.date)), /* @__PURE__ */ React.createElement("td", null, (_a = q.customer) == null ? void 0 : _a.name), /* @__PURE__ */ React.createElement("td", null, fmtDate(q.validTill)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", fontWeight: 600 } }, fmt(total(q))), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: `badge ${q.status === "Accepted" || q.status === "Converted" ? "badge-green" : q.status === "Rejected" ? "badge-red" : "badge-gold"}` }, q.status)), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => setForm(q) }, "Edit"), q.status !== "Converted" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: () => convert(q) }, "Convert"), q.status === "Draft" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => setStatus(q.id, "Sent") }, "Mark Sent"), q.status === "Sent" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => setStatus(q.id, "Accepted") }, "Accepted"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => setStatus(q.id, "Rejected") }, "Rejected")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger btn-icon", onClick: () => del(q.id) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 11 })))));
  }))))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", style: { marginBottom: 14 }, onClick: () => setForm(null) }, "\u2190 Back to list"), /* @__PURE__ */ React.createElement("div", { className: "g4", style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Date"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: form.date, onChange: (e) => setForm((p) => ({ ...p, date: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Expected Shipment"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: form.validTill, onChange: (e) => setForm((p) => ({ ...p, validTill: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Customer Name"), /* @__PURE__ */ React.createElement(SimpleCustomerPicker, { customer: form.customer, onChange: (c) => setForm((p) => ({ ...p, customer: c })) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Phone"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.customer.phone, onChange: (e) => setForm((p) => ({ ...p, customer: { ...p.customer, phone: e.target.value } })) }))), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, marginBottom: 8 } }, "Items"), form.items.map((it, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", gap: 8, marginBottom: 6 } }, /* @__PURE__ */ React.createElement("input", { className: "field-input", style: { flex: 3 }, placeholder: "Description", value: it.desc, onChange: (e) => setForm((p) => ({ ...p, items: p.items.map((x, j) => j === i ? { ...x, desc: e.target.value } : x) })) }), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { flex: 1 }, placeholder: "Qty", value: it.qty, onChange: (e) => setForm((p) => ({ ...p, items: p.items.map((x, j) => j === i ? { ...x, qty: e.target.value } : x) })) }), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { flex: 1 }, placeholder: "Rate", value: it.rate, onChange: (e) => setForm((p) => ({ ...p, items: p.items.map((x, j) => j === i ? { ...x, rate: e.target.value } : x) })) }), /* @__PURE__ */ React.createElement("div", { style: { width: 100, alignSelf: "center", textAlign: "right", fontWeight: 600 } }, fmt((parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger btn-icon", onClick: () => setForm((p) => ({ ...p, items: p.items.filter((_, j) => j !== i) })) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 11 })))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: () => setForm((p) => ({ ...p, items: [...p.items, blankSimpleItem()] })) }, /* @__PURE__ */ React.createElement(Ic, { n: "plus", s: 11 }), " Add Item"), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", fontWeight: 700, fontSize: 15, margin: "12px 0" } }, "Total: ", fmt(total(form))), /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Notes"), /* @__PURE__ */ React.createElement("textarea", { className: "field-input", value: form.notes, onChange: (e) => setForm((p) => ({ ...p, notes: e.target.value })) })), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: save }, "Save Sales Order")))));
};
const App = () => {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [modal, setModal] = useState(null);
  const [page, setPage] = useState("invoice");
  const [invView, setInvView] = useState("summary");
  const [agingView, setAgingView] = useState("ar");
  const [loadedInv, setLoadedInv] = useState(null);
  const [loadedPO, setLoadedPO] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [poKey, setPoKey] = useState(0);
  const [appReady, setAppReady] = useState(false);
  const [loadMsg, setLoadMsg] = useState("Connecting to cloud...");
  const [cloudError, setCloudError] = useState(false);
  const [cacheVersion, setCacheVersion] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobSidebarOpen, setMobSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const bootLoad = async () => {
    setLoadMsg("Loading your data from cloud...");
    await window.FBReady;
    const { L: _L, auth: _auth } = getFB();
    const fu = await fbWaitUser();
    if (!fu || REQUIRE_2FA && _L.multiFactor(fu).enrolledFactors.length === 0) {
      setAppReady(true);
      return;
    }
    const ok = await loadCache();
    if (ok) {
      try {
        migrateInventory();
      } catch (err) {
        console.warn("Inventory migration skipped:", err.message);
      }
      try {
        ensureDefaultExpenseHeads();
      } catch (err) {
        console.warn("Expense head seeding skipped:", err.message);
      }
      try {
        ensureVoucherNumbers();
      } catch (err) {
        console.warn("Voucher number backfill skipped:", err.message);
      }
      try {
        ensureTxnRefNumbers();
      } catch (err) {
        console.warn("Transaction reference number backfill skipped:", err.message);
      }
      try {
        const n = runRecurringJournals({ email: fu.email });
        if (n) setTimeout(() => toast.info(n + " recurring journal voucher" + (n === 1 ? "" : "s") + " posted automatically"), 1500);
      } catch (err) {
        console.warn("Recurring journals skipped:", err.message);
      }
      try {
        const nb = runRecurringBills({ email: fu.email });
        if (nb) setTimeout(() => toast.info(nb + " recurring bill" + (nb === 1 ? "" : "s") + " created automatically"), 2200);
      } catch (err) {
        console.warn("Recurring bills skipped:", err.message);
      }
      setLoadMsg("Almost ready...");
      seedUsers();
      const _p = (S.get(SK.USERS, []) || []).find((u) => u.email && u.email.toLowerCase() === (fu.email || "").toLowerCase());
      if (!_p) {
        toast.error("No access profile for this account. Contact admin.");
        await _L.signOut(_auth);
      } else if (!_p.active) {
        toast.error("Account is deactivated. Contact admin.");
        await _L.signOut(_auth);
      } else {
        logAudit("USER_LOGIN", "Login from browser", _p);
        setUser(_p);
      }
      const savedTheme = S.get(SK.THEME, "dark");
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
      setCloudError(false);
      setCacheVersion((v) => v + 1);
    } else {
      setCloudError(true);
    }
    setAppReady(true);
  };
  useEffect(() => {
    bootLoad();
  }, []);
  useEffect(() => {
    if (!cloudError) return;
    const t = setInterval(() => {
      bootLoad();
    }, 12e3);
    return () => clearInterval(t);
  }, [cloudError]);
  useEffect(() => {
    if (appReady) {
      document.documentElement.setAttribute("data-theme", theme);
      S.set(SK.THEME, theme);
    }
  }, [theme]);
  const navGuard = useRef(false);
  useEffect(() => {
    history.replaceState({ page, modal: null }, "");
    const onPop = (e) => {
      navGuard.current = true;
      const st = e.state || { page: "invoice", modal: null };
      setModal(st.modal || null);
      setPage(st.page || "invoice");
      setMobSidebarOpen(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    if (!appReady || !user) return;
    if (navGuard.current) {
      navGuard.current = false;
      return;
    }
    history.pushState({ page, modal }, "");
  }, [page, modal, appReady, user]);
  const login = (u) => {
    setUser(u);
    toast.success(`Welcome, ${u.name}!`);
    setTimeout(() => checkOverdue(), 1e3);
  };
  const [menuOpen, setMenuOpen] = useState(false);
  const OVERLAY_ONLY = ["po"];
  const openModal = (m) => {
    if (OVERLAY_ONLY.includes(m)) {
      setModal(m);
    } else {
      setPage(m);
      setModal(null);
    }
    setMenuOpen(false);
  };
  const logout = () => {
    logAudit("USER_LOGOUT", "Logged out", user);
    try {
      getFB().L.signOut(getFB().auth);
    } catch (e) {
    }
    setUser(null);
    toast.info("Logged out");
  };
  const loadInv = (inv) => {
    setLoadedInv(inv);
    setFormKey((k) => k + 1);
    setPage("invoice");
    setSearchQuery("");
  };
  const [viewInv, setViewInv] = useState(null);
  const viewInvoice = (inv) => {
    setViewInv(inv);
    setPage("invview");
    setSearchQuery("");
  };
  const loadPO = (po) => {
    setLoadedPO(po);
    setPoKey((k) => k + 1);
    setModal("po");
  };
  const newPOModal = () => {
    setLoadedPO(null);
    setPoKey((k) => k + 1);
    setModal("po");
  };
  if (!appReady) return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#080B0F", gap: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, marginBottom: 4 } }, /* @__PURE__ */ React.createElement(LogoIcon, { size: 52 }), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "Sora,sans-serif", fontSize: 30, fontWeight: 800, letterSpacing: -0.5, background: "linear-gradient(135deg,#4F6FE8,#F1495C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" } }, "Arctic Books")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#8B949E", letterSpacing: 1 } }, loadMsg), /* @__PURE__ */ React.createElement("div", { style: { width: 48, height: 48, border: "4px solid #21262D", borderTop: "4px solid #4F6FE8", borderRadius: "50%", animation: "spin 1s linear infinite" } }), /* @__PURE__ */ React.createElement("style", null, `@keyframes spin{to{transform:rotate(360deg)}}`), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#484F58", marginTop: 8 } }, "Powered by Firebase Cloud "));
  const CloudErrorBanner = () => !cloudError ? null : /* @__PURE__ */ React.createElement("div", { style: { background: "#DC2626", color: "#fff", padding: "8px 16px", fontSize: 12.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap", position: "sticky", top: 0, zIndex: 9999 } }, /* @__PURE__ */ React.createElement("span", null, "\u26A0 Not connected to the cloud database right now \u2014 you're viewing a local cached copy. ", /* @__PURE__ */ React.createElement("b", null, "Nothing will be saved"), " until this reconnects, so please don't make changes yet."), /* @__PURE__ */ React.createElement("button", { onClick: bootLoad, style: { background: "#fff", color: "#DC2626", border: "none", borderRadius: 6, padding: "3px 10px", fontWeight: 700, cursor: "pointer", fontSize: 12 } }, "Retry Now"));
  if (!user) return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(CloudErrorBanner, null), /* @__PURE__ */ React.createElement(Login, { onAuthed: bootLoad }), /* @__PURE__ */ React.createElement(Toast, null));
  const invCount = S.get(SK.INV, []).length;
  const overdueCount = S.get(SK.INV, []).filter((i) => i.status === "Overdue").length;
  const isAdmin = user.role === "admin" || user.role === "superadmin";
  const _pageKey = String(page).startsWith("pr_") || ["cashflow", "budget", "fixedassets", "recjournal", "advances", "fxpage", "coa", "journal", "ledger", "trialbalance", "payrecv", "paymade", "vendors", "statements", "gstfiling", "reportscenter"].includes(page) || EXTRA_ACCOUNTING_PAGES.includes(page) ? "reports" : page === "salesorders" ? "quotations" : page === "invview" ? "history" : page === "hsn" ? "company" : page === "products" ? "inventory" : page;
  const pageOk = page === "admin" ? isAdmin : canSee(user.role, _pageKey);
  const pg = pageOk ? page : "dashboard";
  const NavItem = ({ icon, label, badge, badgeCls, onClick, active, extraCls }) => /* @__PURE__ */ React.createElement("div", { className: `nav-item${active ? " active" : ""}${extraCls ? " " + extraCls : ""}`, onClick: () => {
    onClick();
    setMobSidebarOpen(false);
    setSearchQuery("");
  } }, /* @__PURE__ */ React.createElement("span", { className: "nav-icon" }, icon), /* @__PURE__ */ React.createElement("span", { className: "nav-label" }, label), badge && /* @__PURE__ */ React.createElement("span", { className: `nav-badge${badgeCls ? " " + badgeCls : ""}` }, badge));
  const poCount = S.get(SK.PO, []).length;
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(CloudErrorBanner, null), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", minHeight: "100vh" } }, /* @__PURE__ */ React.createElement(Toast, null), mobSidebarOpen && /* @__PURE__ */ React.createElement("div", { className: "sidebar-overlay", onClick: () => setMobSidebarOpen(false) }), /* @__PURE__ */ React.createElement("nav", { className: `sidebar${sidebarCollapsed ? " collapsed" : ""}${mobSidebarOpen ? " mob-open" : ""}` }, /* @__PURE__ */ React.createElement("div", { className: "sidebar-logo", onClick: () => setSidebarCollapsed((c) => !c) }, /* @__PURE__ */ React.createElement(LogoIcon, { size: 30 }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "sidebar-brand", style: { background: "linear-gradient(135deg,#4F6FE8,#F1495C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" } }, "Arctic Books"), /* @__PURE__ */ React.createElement("div", { className: "sidebar-sub" }, "Complete Accounting Software"))), /* @__PURE__ */ React.createElement("div", { className: "sidebar-nav" }, /* @__PURE__ */ React.createElement(
    SidebarNav,
    {
      user,
      page,
      modal,
      canSee,
      go: (p) => {
        setPage(p);
        setModal(null);
        setMobSidebarOpen(false);
      },
      setModal,
      invView,
      setInvView,
      agingView,
      setAgingView,
      overdueCount,
      invCount,
      poCount,
      onNav: () => {
        setMobSidebarOpen(false);
        setSearchQuery("");
      }
    }
  ), isAdmin && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "nav-sep" }), /* @__PURE__ */ React.createElement("div", { className: "sidebar-section-label" }, "Administration"), /* @__PURE__ */ React.createElement(
    NavItem,
    {
      icon: /* @__PURE__ */ React.createElement(Ic, { n: "shield", s: 17 }),
      label: isSuperAdmin(user.email) ? "Super Admin" : "Admin Panel",
      extraCls: "nav-item-admin",
      onClick: () => {
        setPage("admin");
        setModal(null);
        setMobSidebarOpen(false);
      },
      active: page === "admin"
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "sidebar-bottom" }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "8px 6px",
    borderRadius: 10,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    marginBottom: 8,
    overflow: "hidden"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: "var(--accent-grad)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 13,
    color: "white",
    flexShrink: 0
  } }, user.name[0]), /* @__PURE__ */ React.createElement("div", { className: "nav-label", style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 12, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, user.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, user.role))), /* @__PURE__ */ React.createElement("div", { className: "nav-item", onClick: logout, style: { color: "rgba(255,100,100,0.8)" } }, /* @__PURE__ */ React.createElement("span", { className: "nav-icon" }, /* @__PURE__ */ React.createElement(Ic, { n: "logout", s: 16 })), /* @__PURE__ */ React.createElement("span", { className: "nav-label" }, "Logout")))), /* @__PURE__ */ React.createElement("div", { className: `main-wrapper${sidebarCollapsed ? " sidebar-collapsed" : ""}` }, /* @__PURE__ */ React.createElement("div", { className: "topbar" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setMobSidebarOpen((o) => !o),
      className: "mob-hamburger",
      style: {
        background: "var(--card2)",
        border: "1px solid var(--border)",
        borderRadius: 9,
        width: 38,
        height: 38,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4.5,
        cursor: "pointer",
        flexShrink: 0,
        display: "none",
        marginLeft: 14
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { width: 16, height: 2, borderRadius: 2, background: "var(--text2)" } }),
    /* @__PURE__ */ React.createElement("div", { style: { width: 16, height: 2, borderRadius: 2, background: "var(--text2)" } }),
    /* @__PURE__ */ React.createElement("div", { style: { width: 11, height: 2, borderRadius: 2, background: "var(--text2)" } })
  ), /* @__PURE__ */ React.createElement(TopAppSwitch, { page, go: (p) => {
    setModal(null);
    setSearchQuery("");
    setPage(p);
  } }), /* @__PURE__ */ React.createElement("div", { className: "tb2-company", title: S.get(SK.CO, {}).name || "Arctic Books" }, /* @__PURE__ */ React.createElement(LogoIcon, { size: 30 }), /* @__PURE__ */ React.createElement("div", { className: "tb2-company-info" }, /* @__PURE__ */ React.createElement("div", { className: "tb2-company-name" }, S.get(SK.CO, {}).name || "Arctic Books"), /* @__PURE__ */ React.createElement("div", { className: "tb2-company-gstin" }, S.get(SK.CO, {}).gstin ? `GSTIN ${S.get(SK.CO, {}).gstin}` : "Complete Accounting Software"))), /* @__PURE__ */ React.createElement("div", { className: "tb2-page" }, /* @__PURE__ */ React.createElement("div", { className: "tb2-crumb" }, /* @__PURE__ */ React.createElement("span", null, PAGE_SECTIONS[page] || "Arctic Books"), /* @__PURE__ */ React.createElement(Ic, { n: "chevron", s: 10 }), /* @__PURE__ */ React.createElement("span", { className: "tb2-crumb-now" }, PAGE_TITLES[page] || "Arctic Books")), /* @__PURE__ */ React.createElement("div", { className: "tb2-title" }, PAGE_TITLES[page] || "Arctic Books")), /* @__PURE__ */ React.createElement("div", { className: "tb2-center" }, /* @__PURE__ */ React.createElement(TopSearch, { page, value: searchQuery, onChange: setSearchQuery, onGoSearch: () => {
    setModal(null);
    setPage("history");
  } })), /* @__PURE__ */ React.createElement("div", { className: "tb2-right" }, /* @__PURE__ */ React.createElement(
    TopQuickCreate,
    {
      user,
      canSee,
      go: (p) => {
        setModal(null);
        setSearchQuery("");
        setPage(p);
      },
      newInvoice: () => {
        setLoadedInv(null);
        setFormKey((k) => k + 1);
        setModal(null);
        setPage("invoice");
      }
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "tb2-chip tb2-hide-md", title: "Current financial year" }, /* @__PURE__ */ React.createElement(Ic, { n: "calendar", s: 12 }), "FY ", getFY(), "-", String(getFY() + 1).slice(2)), /* @__PURE__ */ React.createElement(TopInsights, { page, role: user.role, go: (p) => {
    setModal(null);
    setSearchQuery("");
    setPage(p);
  } }), /* @__PURE__ */ React.createElement("div", { className: "tb2-divider" }), /* @__PURE__ */ React.createElement(TopUserMenu, { user, theme, setTheme, logout, goCompany: () => {
    setModal(null);
    setPage("company");
  } }))), /* @__PURE__ */ React.createElement(
    TopPalette,
    {
      user,
      canSee,
      go: (p) => {
        setModal(null);
        setSearchQuery("");
        setPage(p);
      },
      newInvoice: () => {
        setLoadedInv(null);
        setFormKey((k) => k + 1);
        setModal(null);
        setPage("invoice");
      },
      openInvoice: (inv) => {
        setModal(null);
        loadInv(inv);
      },
      searchFor: (p, q) => {
        setModal(null);
        setPage(p);
        setSearchQuery(q);
      }
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "app-body page-enter", key: page }, pg === "invoice" && /* @__PURE__ */ React.createElement(InvoiceForm, { key: formKey, currentUser: user, initial: loadedInv, onSave: () => {
  } }), pg === "invview" && viewInv && /* @__PURE__ */ React.createElement(InvoiceViewCard, { inv: (S.get(SK.INV, []) || []).find((i) => i.invNo === viewInv.invNo) || viewInv, user, onBack: () => setPage("history"), onEdit: loadInv, onOpen: viewInvoice }), pg === "history" && /* @__PURE__ */ React.createElement(HistoryModal, { onClose: () => setPage("invoice"), onLoad: loadInv, onView: viewInvoice, currentUser: user, inline: true, searchQuery }), pg === "pohistory" && /* @__PURE__ */ React.createElement(POHistoryModal, { onClose: () => setPage("invoice"), onLoad: (po) => {
    setLoadedPO(po);
    setPoKey((k) => k + 1);
    setModal("po");
  }, currentUser: user, onNewPO: () => {
    setLoadedPO(null);
    setPoKey((k) => k + 1);
    setModal("po");
  }, inline: true, searchQuery }), pg === "expenses" && /* @__PURE__ */ React.createElement(PurchaseModal, { onClose: () => setPage("invoice"), currentUser: user, inline: true, searchQuery }), pg === "customers" && /* @__PURE__ */ React.createElement(CustomersPage, { user, go: setPage, onOpenInvoice: viewInvoice, onNewTxn: (k, bt) => {
    if (k === "quote") {
      setPage("quotations");
      return;
    }
    if (k === "salesorder") {
      setPage("salesorders");
      return;
    }
    if (k === "dc") {
      setPage("dc");
      return;
    }
    if (k === "payment") {
      setPage("payrecv");
      return;
    }
    loadInv({ ...newInvoice(user, k === "creditnote" ? "CREDIT NOTE" : "TAX INVOICE"), billTo: { ...newInvoice(user).billTo, ...bt } });
  } }), pg === "dashboard" && /* @__PURE__ */ React.createElement(Dashboard, { onClose: () => setPage("invoice"), onLoad: viewInvoice, inline: true }), pg === "company" && /* @__PURE__ */ React.createElement(CompanyModal, { onClose: () => setPage("invoice"), currentUser: user, inline: true }), pg === "products" && /* @__PURE__ */ React.createElement(ProductMasterModal, { onClose: () => setPage("invoice"), inline: true, currentUser: user }), pg === "hsn" && /* @__PURE__ */ React.createElement(HSNModal, { onClose: () => setPage("invoice"), inline: true, searchQuery, currentUser: user }), pg === "terms" && canSee(user.role, "terms") && /* @__PURE__ */ React.createElement(TermsModal, { onClose: () => setPage("invoice"), inline: true, currentUser: user }), pg === "inventory" && canSee(user.role, "inventory") && /* @__PURE__ */ React.createElement(InventoryPage, { currentUser: user, initialTab: invView }), pg === "aging" && canSee(user.role, "aging") && /* @__PURE__ */ React.createElement(AgingReportPage, { initialTab: agingView }), pg === "bankrecon" && canSee(user.role, "bankrecon") && /* @__PURE__ */ React.createElement(BankReconPage, { currentUser: user }), pg === "salesview" && canSee(user.role, "salesview") && /* @__PURE__ */ React.createElement(SalesPage, { currentUser: user }), pg === "reports" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(ReportsPage, { currentUser: user }), pg === "coa" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(ChartOfAccountsPage, { isAdmin, currentUser: user }), pg === "journal" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(JournalVouchersPage, { currentUser: user }), pg === "ledger" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(GeneralLedgerPage, null), pg === "trialbalance" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(TrialBalancePage, null), pg === "cashflow" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(CashFlowRatiosPage, { currentUser: user }), pg === "pr_dashboard" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(PayrollDashboard, { go: (p) => {
    setModal(null);
    setSearchQuery("");
    setPage(p);
  } }), pg === "pr_employees" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(PayrollEmployees, { currentUser: user }), pg === "pr_payruns" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(PayrollRuns, { currentUser: user }), pg === "pr_loans" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(PayrollLoans, { currentUser: user }), pg === "pr_form16" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(PayrollForm16, { currentUser: user }), pg === "pr_docs" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(PayrollDocs, { currentUser: user }), pg === "pr_reports" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(PayrollReports, { currentUser: user }), pg === "pr_settings" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(PayrollSettings, { currentUser: user }), pg === "payrecv" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(PaymentsRegisterPage, { kind: "recv" }), pg === "paymade" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(PaymentsRegisterPage, { kind: "made" }), pg === "vendors" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(VendorsPage, { go: (p) => {
    setModal(null);
    setSearchQuery("");
    setPage(p);
  } }), pg === "statements" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(StatementsPage, { currentUser: user }), pg === "gstfiling" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(GstFilingPage, { go: (p) => {
    setModal(null);
    setSearchQuery("");
    setPage(p);
  } }), pg === "reportscenter" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(ReportsCenterPage, { go: (p) => {
    setModal(null);
    setSearchQuery("");
    setPage(p);
  } }), pg === "salesorders" && canSee(user.role, "quotations") && /* @__PURE__ */ React.createElement(SalesOrdersPage, { currentUser: user }), pg === "vendorcredits" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(VendorCreditsPage, { currentUser: user }), pg === "recbills" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(RecurringBillsPage, { currentUser: user }), pg === "bankoverview" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(BankingOverviewPage, { go: (p) => {
    setModal(null);
    setSearchQuery("");
    setPage(p);
  } }), pg === "txnlock" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(TransactionLockPage, { currentUser: user }), pg === "morereports" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(MoreReportsPage, { go: (p) => {
    setModal(null);
    setSearchQuery("");
    setPage(p);
  } }), pg === "overview" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(BusinessOverviewPage, { go: (p) => {
    setModal(null);
    setSearchQuery("");
    setPage(p);
  } }), pg === "ewaybill" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(EwayBillPage, { currentUser: user }), pg === "timetrack" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(TimeTrackingPage, { currentUser: user }), pg === "budget" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(BudgetPage, { currentUser: user }), pg === "fixedassets" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(FixedAssetsPage, { currentUser: user }), pg === "recjournal" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(RecurringJournalsPage, { currentUser: user }), pg === "advances" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(AdvanceApplicationPage, { currentUser: user }), pg === "fxpage" && canSee(user.role, "reports") && /* @__PURE__ */ React.createElement(FxPage, { currentUser: user }), pg === "quotations" && canSee(user.role, "quotations") && /* @__PURE__ */ React.createElement(QuotationsPage, { currentUser: user }), pg === "dc" && canSee(user.role, "dc") && /* @__PURE__ */ React.createElement(DeliveryChallanPage, { currentUser: user }), pg === "recurring" && canSee(user.role, "recurring") && /* @__PURE__ */ React.createElement(RecurringInvoicesPage, { currentUser: user }), pg === "reminders" && canSee(user.role, "reminders") && /* @__PURE__ */ React.createElement(RemindersPage, { currentUser: user }), pg === "admin" && isAdmin && /* @__PURE__ */ React.createElement(AdminPanel, { currentUser: user, onClose: () => setPage("invoice"), inline: true }))), modal === "po" && /* @__PURE__ */ React.createElement("div", { className: "overlay", onClick: (e) => e.target === e.currentTarget && setModal(null) }, /* @__PURE__ */ React.createElement("div", { className: "modal", style: { maxWidth: "min(1100px, 95vw)", width: "100%" } }, /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("span", { className: "modal-title" }, /* @__PURE__ */ React.createElement(Ic, { n: "cart", s: 20 }), " New Purchase Order"), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: () => setModal(null) }, /* @__PURE__ */ React.createElement(Ic, { n: "x" }))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement(POForm, { key: poKey, currentUser: user, initial: loadedPO, onSave: () => {
    setModal(null);
    setLoadedPO(null);
  } })))), modal === "products" && /* @__PURE__ */ React.createElement(ProductMasterModal, { onClose: () => {
    setModal(null);
    setFormKey((k) => k + 1);
  }, currentUser: user })));
};
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(App, null));
