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
const RbChev = () => /* @__PURE__ */ React.createElement("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.6", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "6 9 12 15 18 9" }));
const RbFunnel = () => /* @__PURE__ */ React.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polygon", { points: "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" }));
const RbDown = () => /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" }), /* @__PURE__ */ React.createElement("polyline", { points: "7 10 12 15 17 10" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "15", x2: "12", y2: "3" }));
const useOutsideClose = (ref, onClose) => {
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
};
const DateRangePill = ({ value, from, to, onChange, allowAll = true, label = "Date Range" }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClose(ref, () => setOpen(false));
  const presets = allowAll ? DATE_PRESETS : DATE_PRESETS.filter((p) => p !== "All Time");
  const pick = (p) => {
    setOpen(false);
    if (p === "Custom") {
      const t = resolveRange("This Year");
      onChange({ preset: "Custom", from: from || t.from, to: to || t.to });
    } else onChange(resolveRange(p));
  };
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { ref, style: { position: "relative" } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "rb-pill", onClick: () => setOpen((o) => !o) }, /* @__PURE__ */ React.createElement("span", { className: "rb-k" }, label, " :"), /* @__PURE__ */ React.createElement("b", null, value), /* @__PURE__ */ React.createElement(RbChev, null)), open && /* @__PURE__ */ React.createElement("div", { className: "rb-menu" }, presets.map((p) => /* @__PURE__ */ React.createElement("div", { key: p, className: "rb-item" + (p === value ? " sel" : ""), onClick: () => pick(p) }, p)))), value === "Custom" && /* @__PURE__ */ React.createElement("div", { className: "rb-custom" }, /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: from || "", onChange: (e) => onChange({ preset: "Custom", from: e.target.value, to: to || "" }), style: { width: 150 } }), /* @__PURE__ */ React.createElement("span", null, "to"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: to || "", onChange: (e) => onChange({ preset: "Custom", from: from || "", to: e.target.value }), style: { width: 150 } })));
};
const ExportMenu = ({ onExport, label = "Export", disabled = false }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClose(ref, () => setOpen(false));
  const go = (f) => {
    setOpen(false);
    onExport(f);
  };
  return /* @__PURE__ */ React.createElement("div", { ref, style: { position: "relative", display: "inline-block" } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "rb-pill", disabled, onClick: () => setOpen((o) => !o), style: { fontWeight: 600 } }, /* @__PURE__ */ React.createElement(RbDown, null), " ", label, " ", /* @__PURE__ */ React.createElement(RbChev, null)), open && /* @__PURE__ */ React.createElement("div", { className: "rb-menu right", style: { minWidth: 190 } }, /* @__PURE__ */ React.createElement("div", { className: "rb-item", onClick: () => go("pdf") }, /* @__PURE__ */ React.createElement(Ic, { n: "pdf", s: 15 }), " PDF ", /* @__PURE__ */ React.createElement("small", null, ".pdf")), /* @__PURE__ */ React.createElement("div", { className: "rb-item", onClick: () => go("xlsx") }, /* @__PURE__ */ React.createElement(Ic, { n: "xlsx", s: 15 }), " Excel ", /* @__PURE__ */ React.createElement("small", null, ".xlsx")), /* @__PURE__ */ React.createElement("div", { className: "rb-item", onClick: () => go("csv") }, /* @__PURE__ */ React.createElement(Ic, { n: "file", s: 15 }), " CSV ", /* @__PURE__ */ React.createElement("small", null, ".csv"))));
};
const useReportRange = (initial = "All Time") => {
  const init = resolveRange(initial);
  const [draft, setDraft] = useState(init);
  const [applied, setApplied] = useState(init);
  const dirty = draft.from !== applied.from || draft.to !== applied.to || draft.preset !== applied.preset;
  return {
    draft,
    applied,
    dirty,
    setDraft,
    fetchData: () => setApplied(draft),
    reset: () => {
      setDraft(init);
      setApplied(init);
    }
  };
};
const ReportToolbar = ({ section, title, range, onExport, count = 0, canExport = true, children }) => {
  const { draft, applied, dirty, setDraft, fetchData, reset } = range;
  const [more, setMore] = useState(false);
  const [fm, setFm] = useState(false);
  const fref = useRef(null);
  useOutsideClose(fref, () => setFm(false));
  const doFetch = () => {
    if (draft.preset === "Custom" && draft.from && draft.to && draft.from > draft.to) {
      toast.error('"From" date cannot be after "To" date');
      return;
    }
    fetchData();
  };
  const doExport = (f) => {
    if (!count) {
      toast.error("No records in the selected date range to export");
      return;
    }
    onExport(f, applied);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "rb-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "rb-head" }, /* @__PURE__ */ React.createElement("div", null, section && /* @__PURE__ */ React.createElement("div", { className: "rb-crumb" }, section), /* @__PURE__ */ React.createElement("div", { className: "rb-title" }, /* @__PURE__ */ React.createElement("span", null, title), /* @__PURE__ */ React.createElement("span", { className: "rb-dot" }), /* @__PURE__ */ React.createElement("span", { className: "rb-period" }, rangeLabel(applied)), /* @__PURE__ */ React.createElement("span", { className: "rb-count" }, count, " record", count === 1 ? "" : "s"))), /* @__PURE__ */ React.createElement("div", { className: "rb-actions" }, canExport && /* @__PURE__ */ React.createElement(ExportMenu, { onExport: doExport }))), /* @__PURE__ */ React.createElement("div", { className: "rb-filters" }, /* @__PURE__ */ React.createElement("span", { className: "rb-flabel" }, /* @__PURE__ */ React.createElement(RbFunnel, null), " Filters :"), /* @__PURE__ */ React.createElement(DateRangePill, { value: draft.preset, from: draft.from, to: draft.to, onChange: setDraft }), children && /* @__PURE__ */ React.createElement("button", { type: "button", className: "rb-pill", onClick: () => setMore((m) => !m) }, /* @__PURE__ */ React.createElement("b", { style: { color: "var(--primary2)" } }, "\uFF0B"), " More Filters"), /* @__PURE__ */ React.createElement("div", { ref: fref, className: "rb-fetch" + (dirty ? " dirty" : ""), style: { position: "relative" } }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: doFetch, title: "Apply the selected date range" }, "Fetch Data"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "caret", onClick: () => setFm((o) => !o) }, /* @__PURE__ */ React.createElement(RbChev, null)), fm && /* @__PURE__ */ React.createElement("div", { className: "rb-menu", style: { minWidth: 190 } }, /* @__PURE__ */ React.createElement("div", { className: "rb-item", onClick: () => {
    setFm(false);
    doFetch();
  } }, "Fetch Data"), /* @__PURE__ */ React.createElement("div", { className: "rb-item", onClick: () => {
    setFm(false);
    reset();
  } }, "Reset to All Dates"))), dirty && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--gold)", fontWeight: 600 } }, "Range changed \u2014 click Fetch Data to apply")), children && more && /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" } }, children));
};
const ExportBar = ({ onExport, from, to, onFromChange, onToChange, showDateFilter = false, label = "Export" }) => {
  const [preset, setPreset] = useState("Custom");
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" } }, showDateFilter && /* @__PURE__ */ React.createElement(
    DateRangePill,
    {
      value: preset,
      from,
      to,
      allowAll: false,
      onChange: (o) => {
        setPreset(o.preset);
        onFromChange(o.from);
        onToChange(o.to);
      }
    }
  ), /* @__PURE__ */ React.createElement(ExportMenu, { label, onExport }));
};
const computeLedgerData = (account, fromDate, toDate, allLines, withChildren = false) => {
  const source = allLines || getAllLedgerLines();
  const keys = withChildren ? [account, ...descendantKeys(account)] : [account];
  const all = source.filter((l) => keys.includes(l.account)).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const before = all.filter((l) => (l.date || "") < fromDate);
  const inRange = all.filter((l) => (l.date || "") >= fromDate && (l.date || "") <= toDate);
  const acc = coaByKey(account);
  const natural = acc.type === "asset" || acc.type === "expense" ? 1 : -1;
  let bal = before.reduce((s, l) => s + natural * (l.debit - l.credit), 0);
  const opening = bal;
  const rows = inRange.map((l) => {
    bal += natural * (l.debit - l.credit);
    return { ...l, running: bal };
  });
  return { opening, rows, closing: bal };
};
const useLedgerData = (account, fromDate, toDate, withChildren = false) => useMemo(() => computeLedgerData(account, fromDate, toDate, null, withChildren), [account, fromDate, toDate, withChildren]);
const LEDGER_COLS = ["Date", "Chart of Accounts", "Voucher No.", "Txn Ref No.", "Type", "Invoice / Bill No.", "Category", "Narration", "Debit", "Credit", "Balance"];
const LedgerHeadRow = () => /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Date"), /* @__PURE__ */ React.createElement("th", null, "Chart of Accounts"), /* @__PURE__ */ React.createElement("th", null, "Voucher No."), /* @__PURE__ */ React.createElement("th", null, "Txn Ref No."), /* @__PURE__ */ React.createElement("th", null, "Type"), /* @__PURE__ */ React.createElement("th", null, "Invoice / Bill No."), /* @__PURE__ */ React.createElement("th", null, "Category"), /* @__PURE__ */ React.createElement("th", null, "Narration"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Debit"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Credit"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Balance"));
const LedgerBodyRow = ({ r }) => /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", null, fmtDate(r.date)), /* @__PURE__ */ React.createElement("td", null, coaByKey(r.account).name), /* @__PURE__ */ React.createElement("td", { style: { fontFamily: "monospace", fontSize: 11.5, color: "var(--text3)" } }, r.voucherNo || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { fontFamily: "monospace", fontSize: 11.5, color: "var(--text3)" } }, r.txnRefNo || "\u2014"), /* @__PURE__ */ React.createElement("td", null, r.docType || "Journal"), /* @__PURE__ */ React.createElement("td", { style: { fontFamily: "monospace", fontSize: 11.5 } }, r.docNo || "\u2014"), /* @__PURE__ */ React.createElement("td", null, r.category || "\u2014"), /* @__PURE__ */ React.createElement("td", null, r.narration), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, r.debit ? fmtN(r.debit) : ""), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, r.credit ? fmtN(r.credit) : ""), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", fontWeight: 600 } }, fmtN(r.running)));
const ledgerExportRow = (r) => [fmtDate(r.date), coaByKey(r.account).name, r.voucherNo || "", r.txnRefNo || "", r.docType || "Journal", r.docNo || "", r.category || "", r.narration, r.debit ? fmtN(r.debit) : "", r.credit ? fmtN(r.credit) : "", fmtN(r.running)];
const LedgerTable = ({ account, fromDate, toDate, withChildren = false }) => {
  const { opening, rows, closing } = useLedgerData(account, fromDate, toDate, withChildren);
  const accName = coaByKey(account).name;
  const doExport = (fmt2) => {
    const headers = LEDGER_COLS;
    const body = [["", accName, "", "", "", "", "", "Opening Balance", "", "", fmtN(opening)], ...rows.map(ledgerExportRow)];
    exportTableAs(fmt2, `Ledger_${accName.replace(/\s+/g, "_")}_${fromDate}_to_${toDate}`, `${accName} \u2014 Ledger (${fmtDate(fromDate)} to ${fmtDate(toDate)})`, headers, body);
  };
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-end", flexWrap: "wrap", gap: 20, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "g3", style: { flex: 1, minWidth: 280 } }, /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16 } }, fmt(opening)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Opening Balance")), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16 } }, rows.length), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Postings in Range")), /* @__PURE__ */ React.createElement("div", { className: "stat-card", style: { borderLeft: "3px solid var(--primary)" } }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16 } }, fmt(closing)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Closing Balance")))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement(ExportBar, { onExport: doExport, label: "Export Ledger" })), /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement(LedgerHeadRow, null)), /* @__PURE__ */ React.createElement("tbody", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("td", { colSpan: 8, style: { fontStyle: "italic" } }, "Opening Balance"), /* @__PURE__ */ React.createElement("td", null), /* @__PURE__ */ React.createElement("td", null), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", fontWeight: 700 } }, fmt(opening))), rows.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 11, style: { color: "var(--text3)", textAlign: "center" } }, "No postings in this range")) : rows.map((r, i) => /* @__PURE__ */ React.createElement(LedgerBodyRow, { key: i, r }))))));
};
const Breadcrumb = ({ items }) => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 14, fontSize: 12.5 } }, items.map((it, i) => /* @__PURE__ */ React.createElement(React.Fragment, { key: i }, i > 0 && /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text3)" } }, "\u203A"), it.onClick ? /* @__PURE__ */ React.createElement("span", { onClick: it.onClick, style: { color: "var(--primary2)", cursor: "pointer", fontWeight: i === items.length - 1 ? 700 : 500 } }, it.label) : /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700 } }, it.label))));
const SearchSelect = ({ value, onChange, options = [], placeholder = "Select\u2026", style, disabled = false, onCreate, emptyText = "No matches", minPopWidth = 280, clearable = false }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null), popRef = useRef(null), listRef = useRef(null), inpRef = useRef(null);
  const sel = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const toks = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!toks.length) return options;
    return options.filter((o) => {
      const hay = `${o.label} ${o.sub || ""} ${o.keywords || ""} ${o.group || ""}`.toLowerCase();
      return toks.every((t) => hay.includes(t));
    });
  }, [q, options]);
  const canCreate = !!onCreate && q.trim().length > 0 && !options.some((o) => String(o.label).toLowerCase() === q.trim().toLowerCase());
  const total = filtered.length + (canCreate ? 1 : 0);
  const firstEnabled = (list) => {
    const i = list.findIndex((o) => !o.disabled);
    return i < 0 ? 0 : i;
  };
  const place = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const below = window.innerHeight - r.bottom, above = r.top;
    const up = below < 260 && above > below;
    const width = Math.max(r.width, minPopWidth);
    setPos({
      left: Math.max(8, Math.min(r.left, window.innerWidth - width - 8)),
      width,
      top: up ? void 0 : r.bottom + 4,
      bottom: up ? window.innerHeight - r.top + 4 : void 0,
      maxH: Math.max(170, Math.min(360, (up ? above : below) - 16))
    });
  };
  const openPop = (initial = "") => {
    if (disabled) return;
    place();
    setQ(initial);
    setOpen(true);
  };
  useEffect(() => {
    setHi(firstEnabled(filtered));
  }, [q, open]);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      var _a, _b;
      if (((_a = btnRef.current) == null ? void 0 : _a.contains(e.target)) || ((_b = popRef.current) == null ? void 0 : _b.contains(e.target))) return;
      setOpen(false);
    };
    const onWin = (e) => {
      if (e && e.target && popRef.current && popRef.current.contains(e.target)) return;
      place();
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    const tm = setTimeout(() => inpRef.current && inpRef.current.focus(), 0);
    return () => {
      clearTimeout(tm);
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
  }, [open]);
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector('[data-i="' + hi + '"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  }, [hi, open]);
  const pick = (o) => {
    if (!o || o.disabled) return;
    onChange(o.value);
    setOpen(false);
  };
  const doCreate = () => {
    const t = q.trim();
    setOpen(false);
    if (t && onCreate) onCreate(t);
  };
  const move = (dir) => {
    if (!total) return;
    let i = hi;
    for (let n = 0; n < total; n++) {
      i = (i + dir + total) % total;
      if (i >= filtered.length || !filtered[i].disabled) break;
    }
    setHi(i);
  };
  const onInpKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (hi < filtered.length) pick(filtered[hi]);
      else if (canCreate) doCreate();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      btnRef.current && btnRef.current.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };
  const onBtnKey = (e) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      openPop();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      openPop(e.key);
    }
  };
  let lastGroup = null;
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "div",
    {
      ref: btnRef,
      tabIndex: disabled ? -1 : 0,
      className: "field-input ss-btn",
      style: { ...style || {}, opacity: disabled ? 0.6 : 1 },
      onClick: () => open ? setOpen(false) : openPop(),
      onKeyDown: onBtnKey
    },
    /* @__PURE__ */ React.createElement("span", { className: "ss-val" + (sel ? "" : " ss-ph") }, sel ? sel.label : value ? String(value) : placeholder),
    clearable && sel && value !== "" && !disabled && /* @__PURE__ */ React.createElement("span", { title: "Clear", style: { color: "var(--text3)", padding: "0 2px" }, onClick: (e) => {
      e.stopPropagation();
      onChange("");
    } }, "\xD7"),
    /* @__PURE__ */ React.createElement("svg", { width: "11", height: "11", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.6", strokeLinecap: "round", strokeLinejoin: "round", style: { flexShrink: 0, opacity: 0.6 } }, /* @__PURE__ */ React.createElement("polyline", { points: "6 9 12 15 18 9" }))
  ), open && pos && ReactDOM.createPortal(
    /* @__PURE__ */ React.createElement("div", { ref: popRef, className: "ss-pop", style: { left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxH } }, /* @__PURE__ */ React.createElement("div", { className: "ss-search" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        ref: inpRef,
        className: "field-input",
        style: { padding: "7px 10px", fontSize: 12.5 },
        value: q,
        onChange: (e) => setQ(e.target.value),
        onKeyDown: onInpKey,
        placeholder: onCreate ? "Type to search, or type a new name to add\u2026" : "Type to search\u2026"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "ss-list", ref: listRef }, filtered.length === 0 && !canCreate && /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 12px", fontSize: 12, color: "var(--text3)" } }, emptyText), filtered.map((o, i) => {
      const hdr = o.group && o.group !== lastGroup ? /* @__PURE__ */ React.createElement("div", { key: "g" + i, className: "ss-grp" }, o.group) : null;
      lastGroup = o.group || lastGroup;
      return /* @__PURE__ */ React.createElement(React.Fragment, { key: String(o.value) + "_" + i }, hdr, /* @__PURE__ */ React.createElement(
        "div",
        {
          "data-i": i,
          className: "ss-opt" + (i === hi ? " hi" : "") + (o.value === value ? " sel" : "") + (o.disabled ? " dis" : ""),
          style: { paddingLeft: 12 + (o.indent || 0) * 16 },
          onMouseEnter: () => !o.disabled && setHi(i),
          onClick: () => pick(o)
        },
        /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "ss-lbl" }, o.indent > 0 ? "\u2514 " : "", o.label), o.sub && /* @__PURE__ */ React.createElement("div", { className: "ss-sub" }, o.sub)),
        o.badge && /* @__PURE__ */ React.createElement("span", { className: "ss-badge" }, o.badge)
      ));
    }), canCreate && /* @__PURE__ */ React.createElement("div", { "data-i": filtered.length, className: "ss-opt ss-create" + (hi === filtered.length ? " hi" : ""), onMouseEnter: () => setHi(filtered.length), onClick: doCreate }, "+ Create \u201C", q.trim(), "\u201D"))),
    document.body
  ));
};
const simpleOptions = (list) => list.map((x) => typeof x === "object" ? x : { value: x, label: String(x) });
const ACCOUNT_TYPE_GROUPS = [["asset", "Assets"], ["liability", "Liabilities"], ["equity", "Equity"], ["income", "Income"], ["expense", "Expenses"]];
const accountTree = (all = getAllAccounts()) => {
  const keys = new Set(all.map((a) => a.key));
  const byParent = {};
  all.forEach((a) => {
    const p = a.parent && keys.has(a.parent) && a.parent !== a.key ? a.parent : "";
    (byParent[p] = byParent[p] || []).push(a);
  });
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const walk = (p, depth) => (byParent[p] || []).forEach((a) => {
    if (seen.has(a.key)) return;
    seen.add(a.key);
    out.push({ acc: a, depth });
    walk(a.key, depth + 1);
  });
  walk("", 0);
  return out;
};
const descendantKeys = (key, all = getAllAccounts()) => {
  const out = [];
  const st = [key];
  while (st.length) {
    const k = st.pop();
    all.forEach((c) => {
      if (c.parent === k && !out.includes(c.key)) {
        out.push(c.key);
        st.push(c.key);
      }
    });
  }
  return out;
};
const ledgerPathName = (key) => {
  const all = getAllAccounts();
  const a = all.find((x) => x.key === key);
  if (!a) return key;
  const p = a.parent ? all.find((x) => x.key === a.parent) : null;
  return p ? `${p.name} \u203A ${a.name}` : a.name;
};
const buildAccountOptions = (types, { forParent = false, excludeKeys = [], onlyPostableBanks = false } = {}) => {
  const all = getAllAccounts();
  const tree = accountTree(all);
  const order = types && types.length ? types : ACCOUNT_TYPE_GROUPS.map((g) => g[0]);
  const out = [];
  order.forEach((t) => {
    const label = (ACCOUNT_TYPE_GROUPS.find((g) => g[0] === t) || [t, t])[1];
    tree.filter((n) => n.acc.type === t && !excludeKeys.includes(n.acc.key) && !(forParent && (n.acc.computed || n.acc.derived))).forEach(({ acc, depth }) => {
      const parent = acc.parent ? all.find((x) => x.key === acc.parent) : null;
      out.push({
        value: acc.key,
        label: acc.name,
        group: label,
        indent: depth,
        disabled: !forParent && !!acc.groupOnly,
        sub: acc.groupOnly && !forParent ? "Parent \u2014 choose a specific bank / cash ledger below" : parent ? `Sub-ledger of ${parent.name}` : acc.scheduleGroup,
        badge: acc.derived ? "bank a/c" : acc.custom ? "custom" : "",
        keywords: `${acc.scheduleGroup || ""} ${parent ? parent.name : ""} ${label}`
      });
    });
  });
  return out;
};
