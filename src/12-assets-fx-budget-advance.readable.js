const BS_ASSET_GROUPS = ["Non-Current Assets", "Current Assets"];
const BS_LIAB_GROUPS = ["Non-Current Liabilities", "Current Liabilities"];
const ReportsPage = ({ inline = true, onClose, currentUser }) => {
  var _a;
  const [tab, setTab] = useState("pl");
  const [format, setFormat] = useState("schedule3");
  const [basis, setBasis] = useState("accrual");
  const [selFY, setSelFY] = useState(getFY());
  const fyStart = fyStartOf(selFY);
  const [fromDate, setFromDate] = useState(fyStart);
  const [toDate, setToDate] = useState(today());
  const [asOf, setAsOf] = useState(today());
  const pickFY = (y) => {
    y = parseInt(y);
    setSelFY(y);
    const end = fyEndOf(y), t = today();
    const e = end < t ? end : t;
    setFromDate(fyStartOf(y));
    setToDate(e);
    setAsOf(e);
  };
  const fySel = /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Financial Year"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: selFY, onChange: (ev) => pickFY(ev.target.value) }, [0, 1, 2, 3, 4, 5].map((k) => getFY() - k).map((y) => /* @__PURE__ */ React.createElement("option", { key: y, value: y }, fyLabelOf(y), " (1 Apr ", y, " - 31 Mar ", y + 1, ")"))));
  const co = S.get(SK.CO, {});
  const [drill, setDrill] = useState(null);
  const effBasis = format === "schedule3" ? "accrual" : basis;
  const pl = useMemo(() => effBasis === "cash" ? getPLCash(fromDate, toDate) : getPLAccrual(fromDate, toDate), [fromDate, toDate, effBasis]);
  const bs = useMemo(() => getBalanceSheet(asOf), [asOf]);
  const tb = useMemo(() => getTrialBalance(asOf), [asOf]);
  const tbDebit = tb.filter((r) => r.balance >= 0).reduce((s, r) => s + r.balance, 0);
  const tbCredit = tb.filter((r) => r.balance < 0).reduce((s, r) => s - r.balance, 0);
  const allAccOrder = getAllAccounts();
  const prevFrom = shiftYear(fromDate, -1), prevTo = shiftYear(toDate, -1);
  const prevAsOf = prevFYEnd(asOf);
  const plPrev = useMemo(() => effBasis === "cash" ? getPLCash(prevFrom, prevTo) : getPLAccrual(prevFrom, prevTo), [prevFrom, prevTo, effBasis]);
  const bsPrev = useMemo(() => getBalanceSheet(prevAsOf), [prevAsOf]);
  const tbPrev = useMemo(() => getTrialBalance(prevAsOf), [prevAsOf]);
  const tbDebitPrev = tbPrev.filter((r) => r.balance >= 0).reduce((s, r) => s + r.balance, 0);
  const tbCreditPrev = tbPrev.filter((r) => r.balance < 0).reduce((s, r) => s - r.balance, 0);
  const tbUnionAccounts = useMemo(() => {
    const keys = [];
    tb.forEach((r) => {
      if (!keys.includes(r.account)) keys.push(r.account);
    });
    tbPrev.forEach((r) => {
      if (!keys.includes(r.account)) keys.push(r.account);
    });
    return keys.sort((a, b) => allAccOrder.findIndex((x) => x.key === a) - allAccOrder.findIndex((x) => x.key === b));
  }, [tb, tbPrev]);
  const tbBalOf = (list, key) => {
    var _a2;
    return ((_a2 = list.find((x) => x.account === key)) == null ? void 0 : _a2.balance) || 0;
  };
  const bsPrevAll = [...bsPrev.assets, ...bsPrev.liabilities, ...bsPrev.equity];
  const prevAmtByKey = (key) => {
    var _a2;
    return ((_a2 = bsPrevAll.find((a) => a.key === key)) == null ? void 0 : _a2.amount) || 0;
  };
  const expByKey = (key) => {
    var _a2;
    return ((_a2 = (pl.rows || []).find((r) => r.account === key)) == null ? void 0 : _a2.amount) || 0;
  };
  const otherIncome = (pl.rows || []).filter((r) => r.type === "income" && r.account !== "SALES").reduce((s, r) => s + r.amount, 0);
  const salesRevenue = expByKey("SALES");
  const otherIncomePrev = (plPrev.rows || []).filter((r) => r.type === "income" && r.account !== "SALES").reduce((s, r) => s + r.amount, 0);
  const salesRevenuePrev = ((_a = (plPrev.rows || []).find((r) => r.account === "SALES")) == null ? void 0 : _a.amount) || 0;
  const expenseCaptions = useMemo(() => groupByCaption((pl.rows || []).filter((r) => r.type === "expense"), EXP_CAPTION_ORDER_LOCAL), [pl]);
  const incomeCaptions = useMemo(() => groupByCaption((pl.rows || []).filter((r) => r.type === "income"), ["Revenue from Operations", "Other Income"]), [pl]);
  const expenseCaptionsPrev = useMemo(() => groupByCaption((plPrev.rows || []).filter((r) => r.type === "expense"), EXP_CAPTION_ORDER_LOCAL), [plPrev]);
  const incomeCaptionsPrev = useMemo(() => groupByCaption((plPrev.rows || []).filter((r) => r.type === "income"), ["Revenue from Operations", "Other Income"]), [plPrev]);
  const expenseCaptionsCmp = useMemo(() => mergeCaptionAmounts(expenseCaptions, expenseCaptionsPrev), [expenseCaptions, expenseCaptionsPrev]);
  const incomeCaptionsCmp = useMemo(() => mergeCaptionAmounts(incomeCaptions, incomeCaptionsPrev), [incomeCaptions, incomeCaptionsPrev]);
  const plNormalIncomeCmp = useMemo(() => {
    const cur = (pl.rows || []).filter((r) => r.type === "income" && r.account !== "SALES"), prev = (plPrev.rows || []).filter((r) => r.type === "income" && r.account !== "SALES");
    const accs = [.../* @__PURE__ */ new Set([...cur.map((r) => r.account), ...prev.map((r) => r.account)])];
    return accs.map((acc) => {
      var _a2, _b, _c, _d;
      return { account: acc, name: ((_a2 = cur.find((r) => r.account === acc)) == null ? void 0 : _a2.name) || ((_b = prev.find((r) => r.account === acc)) == null ? void 0 : _b.name), amount: ((_c = cur.find((r) => r.account === acc)) == null ? void 0 : _c.amount) || 0, prevAmount: ((_d = prev.find((r) => r.account === acc)) == null ? void 0 : _d.amount) || 0 };
    });
  }, [pl, plPrev]);
  const plNormalExpenseCmp = useMemo(() => {
    const cur = (pl.rows || []).filter((r) => r.type === "expense"), prev = (plPrev.rows || []).filter((r) => r.type === "expense");
    const accs = [.../* @__PURE__ */ new Set([...cur.map((r) => r.account), ...prev.map((r) => r.account)])];
    return accs.map((acc) => {
      var _a2, _b, _c, _d;
      return { account: acc, name: ((_a2 = cur.find((r) => r.account === acc)) == null ? void 0 : _a2.name) || ((_b = prev.find((r) => r.account === acc)) == null ? void 0 : _b.name), amount: ((_c = cur.find((r) => r.account === acc)) == null ? void 0 : _c.amount) || 0, prevAmount: ((_d = prev.find((r) => r.account === acc)) == null ? void 0 : _d.amount) || 0 };
    }).sort((a, b) => b.amount - a.amount);
  }, [pl, plPrev]);
  const closeDrill = () => setDrill(null);
  const openCaptionDrill = (side, caption, accounts) => setDrill({ kind: "caption", side, caption, accounts });
  const openLedgerDrill = (account) => setDrill({ kind: "ledger", account });
  const doExportPL = (f) => {
    const headers = ["Head", `Current (${fmtDate(fromDate)} to ${fmtDate(toDate)})`, `Previous Year (${fmtDate(prevFrom)} to ${fmtDate(prevTo)})`];
    const rows = [];
    if (effBasis === "cash") {
      rows.push(["Total Receipts", fmtN(pl.income), fmtN(plPrev.income)], ["Total Payments", fmtN(pl.expense), fmtN(plPrev.expense)], ["Net Cash Surplus/(Deficit)", fmtN(pl.net), fmtN(plPrev.net)]);
    } else if (format === "schedule3") {
      rows.push(
        ["I. Revenue from Operations", fmtN(salesRevenue), fmtN(salesRevenuePrev)],
        ["II. Other Income", fmtN(otherIncome), fmtN(otherIncomePrev)],
        ["III. Total Income", fmtN(pl.income), fmtN(plPrev.income)],
        ["IV. Expenses", "", ""],
        ...expenseCaptionsCmp.map((c) => ["   " + c.caption, fmtN(c.amount), fmtN(c.prevAmount)]),
        ["Total Expenses", fmtN(pl.expense), fmtN(plPrev.expense)],
        ["V. Profit Before Tax", fmtN(pl.net), fmtN(plPrev.net)],
        ["VI. Profit for the Period", fmtN(pl.net), fmtN(plPrev.net)]
      );
    } else {
      rows.push(["Sales", fmtN(salesRevenue), fmtN(salesRevenuePrev)]);
      if (otherIncome > 5e-3 || otherIncomePrev > 5e-3) rows.push(["Other Income", fmtN(otherIncome), fmtN(otherIncomePrev)]);
      const expNames = [.../* @__PURE__ */ new Set([...(pl.rows || []).filter((r) => r.type === "expense").map((r) => r.name), ...(plPrev.rows || []).filter((r) => r.type === "expense").map((r) => r.name)])];
      expNames.forEach((name) => {
        var _a2, _b;
        return rows.push([name, fmtN(((_a2 = (pl.rows || []).find((r) => r.name === name)) == null ? void 0 : _a2.amount) || 0), fmtN(((_b = (plPrev.rows || []).find((r) => r.name === name)) == null ? void 0 : _b.amount) || 0)]);
      });
      rows.push(["Net Profit/(Loss)", fmtN(pl.net), fmtN(plPrev.net)]);
    }
    exportTableAs(f, `PL_${fromDate}_to_${toDate}`, `Statement of Profit & Loss (${effBasis === "cash" ? "Cash" : format === "schedule3" ? "Companies Act" : "Normal"} format) \u2014 for the period ${fmtDateLong(fromDate)} to ${fmtDateLong(toDate)}${co.name ? " \u2014 " + co.name : ""}`, headers, rows);
  };
  const doExportBS = (f) => {
    const headers = ["Head", `As at ${fmtDate(asOf)}`, `As at ${fmtDate(prevAsOf)} (Previous Year)`];
    const rows = [
      ["EQUITY AND LIABILITIES", "", ""],
      ...bs.equity.map((e) => ["  " + e.name, fmtN(e.amount), fmtN(prevAmtByKey(e.key))]),
      ...bs.liabilities.map((l) => ["  " + l.name, fmtN(l.amount), fmtN(prevAmtByKey(l.key))]),
      ["TOTAL", fmtN(bs.totalLiab + bs.totalEquity), fmtN(bsPrev.totalLiab + bsPrev.totalEquity)],
      ["ASSETS", "", ""],
      ...bs.assets.map((a) => ["  " + a.name, fmtN(a.amount), fmtN(prevAmtByKey(a.key))]),
      ["TOTAL", fmtN(bs.totalAssets), fmtN(bsPrev.totalAssets)]
    ];
    exportTableAs(f, `BalanceSheet_${asOf}`, `Balance Sheet as at ${fmtDateLong(asOf)} (${format === "schedule3" ? "Companies Act" : "Normal"} format)${co.name ? " \u2014 " + co.name : ""}`, headers, rows);
  };
  const doExportTB = (f) => {
    const headers = ["Account", `Debit (as at ${fmtDate(asOf)})`, `Credit (as at ${fmtDate(asOf)})`, `Debit (as at ${fmtDate(prevAsOf)})`, `Credit (as at ${fmtDate(prevAsOf)})`];
    const rows = tbUnionAccounts.map((key) => {
      const bal = tbBalOf(tb, key), balP = tbBalOf(tbPrev, key);
      return [coaByKey(key).name, bal >= 0 ? fmtN(bal) : "", bal < 0 ? fmtN(-bal) : "", balP >= 0 ? fmtN(balP) : "", balP < 0 ? fmtN(-balP) : ""];
    });
    rows.push(["Total", fmtN(tbDebit), fmtN(tbCredit), fmtN(tbDebitPrev), fmtN(tbCreditPrev)]);
    exportTableAs(f, `TrialBalance_${asOf}`, `Trial Balance as at ${fmtDateLong(asOf)}${co.name ? " \u2014 " + co.name : ""}`, headers, rows);
  };
  const clickable = { cursor: "pointer", color: "var(--primary2)", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: "3px" };
  if ((drill == null ? void 0 : drill.kind) === "ledger") {
    return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay" }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal" }, /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement(Breadcrumb, { items: [
      { label: "Financial Statements", onClick: closeDrill },
      { label: coaByKey(drill.account).name }
    ] }), /* @__PURE__ */ React.createElement(LedgerTable, { account: drill.account, fromDate: tab === "pl" ? fromDate : OPENING_DATE, toDate: tab === "pl" ? toDate : asOf }))));
  }
  if ((drill == null ? void 0 : drill.kind) === "caption") {
    const dExport = (f) => {
      const headers = ["Ledger", "Amount"];
      const rows = drill.accounts.map((a) => [a.name || coaByKey(a.key || a.account).name, fmtN(a.amount)]);
      exportTableAs(f, `${drill.caption.replace(/\s+/g, "_")}`, `${drill.caption} \u2014 constituent ledgers`, headers, rows);
    };
    return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay" }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal" }, /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement(Breadcrumb, { items: [{ label: "Financial Statements", onClick: closeDrill }, { label: drill.caption }] }), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement(ExportBar, { onExport: dExport, label: "Export" })), /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Ledger Account"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Amount"))), /* @__PURE__ */ React.createElement("tbody", null, drill.accounts.map((a, i) => /* @__PURE__ */ React.createElement("tr", { key: i }, /* @__PURE__ */ React.createElement("td", { style: clickable, onClick: () => openLedgerDrill(a.key || a.account) }, a.name || coaByKey(a.key || a.account).name), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, fmt(a.amount)))), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 700, borderTop: "2px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", null, "Total"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, fmt(drill.accounts.reduce((s, a) => s + a.amount, 0))))))))));
  }
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay" }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal" }, !inline && /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("span", { className: "modal-title" }, /* @__PURE__ */ React.createElement(Ic, { n: "chart", s: 18 }), " Financial Statements"), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Ic, { n: "x" }))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { className: "alert", style: { background: "rgba(79,111,232,0.06)", border: "1px solid rgba(79,111,232,0.2)", marginBottom: 16, borderRadius: 10, fontSize: 12 } }, "Generated from a full double-entry ledger (see Chart of Accounts, Journal Vouchers, General Ledger & Trial Balance) \u2014 posted automatically from your Sales, Purchases and Bank Reconciliation. Click any caption or ledger below to drill into its transactions. Not a substitute for statements reviewed and signed off by your CA."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, [["pl", "Profit & Loss"], ["bs", "Balance Sheet"], ["tb", "Trial Balance"]].map(([k, l]) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: k,
      onClick: () => setTab(k),
      style: {
        padding: "6px 14px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: tab === k ? 700 : 500,
        cursor: "pointer",
        border: `2px solid ${tab === k ? "var(--primary)" : "var(--border2)"}`,
        background: tab === k ? "var(--primary-bg)" : "transparent",
        color: tab === k ? "var(--primary2)" : "var(--text2)"
      }
    },
    l
  ))), (tab === "pl" || tab === "bs") && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, [["schedule3", "Companies Act Format"], ["normal", "Normal Format"]].map(([k, l]) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: k,
      onClick: () => setFormat(k),
      style: {
        padding: "6px 14px",
        borderRadius: 8,
        fontSize: 11.5,
        fontWeight: format === k ? 700 : 500,
        cursor: "pointer",
        border: `2px solid ${format === k ? "var(--green)" : "var(--border2)"}`,
        background: format === k ? "rgba(46,160,67,0.12)" : "transparent",
        color: format === k ? "var(--green)" : "var(--text2)"
      }
    },
    l
  ))), tab === "pl" && format === "normal" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, [["accrual", "Accrual Basis"], ["cash", "Cash Basis"]].map(([k, l]) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: k,
      onClick: () => setBasis(k),
      style: {
        padding: "6px 14px",
        borderRadius: 8,
        fontSize: 11.5,
        fontWeight: basis === k ? 700 : 500,
        cursor: "pointer",
        border: `2px solid ${basis === k ? "var(--gold)" : "var(--border2)"}`,
        background: basis === k ? "rgba(241,73,92,0.12)" : "transparent",
        color: basis === k ? "var(--gold)" : "var(--text2)"
      }
    },
    l
  )))), tab === "pl" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 16, alignItems: "flex-end" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" } }, fySel, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "From"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: fromDate, onChange: (e) => setFromDate(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "To"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: toDate, onChange: (e) => setToDate(e.target.value) }))), /* @__PURE__ */ React.createElement(ExportBar, { onExport: doExportPL, label: "Export P&L" })), /* @__PURE__ */ React.createElement("div", { className: "g3", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16, color: "var(--green)" } }, fmt(pl.income)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Total Income (", effBasis === "cash" ? "Cash" : "Accrual", ")")), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16, color: "var(--red)" } }, fmt(pl.expense)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Total Expenses")), /* @__PURE__ */ React.createElement("div", { className: "stat-card", style: { borderLeft: `3px solid ${pl.net >= 0 ? "var(--green)" : "var(--red)"}` } }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16, color: pl.net >= 0 ? "var(--green)" : "var(--red)" } }, fmt(pl.net)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, effBasis === "cash" ? "Net Cash Surplus" : "Profit for the Period"))), effBasis === "cash" ? /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { colSpan: 3 }, "Receipts & Payments Statement \u2014 for the period ", fmtDateLong(fromDate), " to ", fmtDateLong(toDate), co.name ? " \u2014 " + co.name : "")), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Head"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Current (", fmtDate(fromDate), "\u2013", fmtDate(toDate), ")"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right", color: "var(--text3)" } }, "Previous Year (", fmtDate(prevFrom), "\u2013", fmtDate(prevTo), ")"))), /* @__PURE__ */ React.createElement("tbody", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", null, "Total Receipts (Bank credits in period)"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", fontWeight: 600 } }, fmt(pl.income)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(plPrev.income))), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", null, "Total Payments (Bank debits in period)"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, fmt(pl.expense)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(plPrev.expense))), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 700, borderTop: "2px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", null, "Net Cash Surplus / (Deficit)"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: pl.net >= 0 ? "var(--green)" : "var(--red)" } }, fmt(pl.net)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(plPrev.net))))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--text3)", marginTop: 8 } }, "Receipts & Payments basis \u2014 counts only actual money that moved through the Bank in this period, ignoring unpaid invoices/bills. Companies Act statements must use the Accrual basis. (No ledger drill-down here \u2014 the underlying view is Bank Reconciliation.) The Previous Year column covers the corresponding period one year earlier (", fmtDate(prevFrom), " to ", fmtDate(prevTo), ").")) : format === "schedule3" ? /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { colSpan: 3 }, "Statement of Profit & Loss \u2014 for the period ended ", fmtDateLong(toDate), co.name ? " \u2014 " + co.name : "")), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Particulars"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Current Year (", fmtDate(fromDate), " to ", fmtDate(toDate), ")"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right", color: "var(--text3)" } }, "Previous Year (", fmtDate(prevFrom), " to ", fmtDate(prevTo), ")"))), /* @__PURE__ */ React.createElement("tbody", null, incomeCaptionsCmp.filter((c) => c.caption === "Revenue from Operations").map((c) => /* @__PURE__ */ React.createElement("tr", { key: c.caption }, /* @__PURE__ */ React.createElement("td", null, "I. ", c.caption), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", ...clickable }, onClick: () => openCaptionDrill("income", c.caption, c.accounts) }, fmt(c.amount)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(c.prevAmount)))), incomeCaptionsCmp.filter((c) => c.caption === "Other Income").map((c) => /* @__PURE__ */ React.createElement("tr", { key: c.caption }, /* @__PURE__ */ React.createElement("td", null, "II. ", c.caption), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", ...clickable }, onClick: () => openCaptionDrill("income", c.caption, c.accounts) }, fmt(c.amount)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(c.prevAmount)))), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 700 } }, /* @__PURE__ */ React.createElement("td", null, "III. Total Income (I + II)"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, fmt(pl.income)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(plPrev.income))), /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("td", { colSpan: 3, style: { fontWeight: 700 } }, "IV. Expenses")), expenseCaptionsCmp.map((c) => /* @__PURE__ */ React.createElement("tr", { key: c.caption }, /* @__PURE__ */ React.createElement("td", { style: { paddingLeft: 20, ...clickable }, onClick: () => openCaptionDrill("expense", c.caption, c.accounts) }, c.caption), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", ...clickable }, onClick: () => openCaptionDrill("expense", c.caption, c.accounts) }, fmt(c.amount)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(c.prevAmount)))), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 700, borderTop: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", null, "Total Expenses"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, fmt(pl.expense)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(plPrev.expense))), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 700, borderTop: "2px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", null, "V. Profit Before Tax (III \u2212 IV)"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: pl.net >= 0 ? "var(--green)" : "var(--red)" } }, fmt(pl.net)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(plPrev.net))), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { paddingLeft: 20, color: "var(--text3)" } }, "Tax Expense (to be computed by your CA)"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, "\u2014")), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 700, borderTop: "2px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", null, "VI. Profit for the Period"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: pl.net >= 0 ? "var(--green)" : "var(--red)" } }, fmt(pl.net)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(plPrev.net))))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--text3)", marginTop: 10, whiteSpace: "pre-line" } }, /* @__PURE__ */ React.createElement("b", null, "Notes \u2014 Significant Accounting Policies:"), "\n", getPolicies())) : /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { colSpan: 3 }, "Profit & Loss Statement \u2014 for the period ", fmtDateLong(fromDate), " to ", fmtDateLong(toDate), co.name ? " \u2014 " + co.name : "")), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Head"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Current (", fmtDate(fromDate), "\u2013", fmtDate(toDate), ")"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right", color: "var(--text3)" } }, "Previous Year (", fmtDate(prevFrom), "\u2013", fmtDate(prevTo), ")"))), /* @__PURE__ */ React.createElement("tbody", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("td", { colSpan: 3, style: { fontWeight: 700 } }, "Income")), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: clickable, onClick: () => openLedgerDrill("SALES") }, "Sales"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", fontWeight: 600, ...clickable }, onClick: () => openLedgerDrill("SALES") }, fmt(salesRevenue)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(salesRevenuePrev))), plNormalIncomeCmp.map((r) => /* @__PURE__ */ React.createElement("tr", { key: r.account }, /* @__PURE__ */ React.createElement("td", { style: clickable, onClick: () => openLedgerDrill(r.account) }, r.name), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", ...clickable }, onClick: () => openLedgerDrill(r.account) }, fmt(r.amount)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(r.prevAmount)))), /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("td", { colSpan: 3, style: { fontWeight: 700 } }, "Expenses")), plNormalExpenseCmp.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 3, style: { color: "var(--text3)", textAlign: "center" } }, "No expenses in either period")) : plNormalExpenseCmp.map((r) => /* @__PURE__ */ React.createElement("tr", { key: r.account }, /* @__PURE__ */ React.createElement("td", { style: clickable, onClick: () => openLedgerDrill(r.account) }, r.name), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", ...clickable }, onClick: () => openLedgerDrill(r.account) }, fmt(r.amount)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(r.prevAmount)))), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 700, borderTop: "2px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", null, "Net Profit / (Loss)"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: pl.net >= 0 ? "var(--green)" : "var(--red)" } }, fmt(pl.net)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(plPrev.net))))))), tab === "bs" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 16, alignItems: "flex-end" } }, fySel, /* @__PURE__ */ React.createElement("div", { className: "field", style: { maxWidth: 220 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "As of"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: asOf, onChange: (e) => setAsOf(e.target.value) })), /* @__PURE__ */ React.createElement(ExportBar, { onExport: doExportBS, label: "Export Balance Sheet" })), format === "schedule3" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "dt-wrap", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { colSpan: 3 }, "Balance Sheet as at ", fmtDateLong(asOf), " \u2014 ", co.name || "Company")), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Particulars"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "As at ", fmtDate(asOf)), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right", color: "var(--text3)" } }, "As at ", fmtDate(prevAsOf), " (Previous Year)"))), /* @__PURE__ */ React.createElement("tbody", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("td", { colSpan: 3, style: { fontWeight: 700 } }, "I. EQUITY AND LIABILITIES")), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 600 } }, /* @__PURE__ */ React.createElement("td", null, "1. Shareholders' Funds"), /* @__PURE__ */ React.createElement("td", null), /* @__PURE__ */ React.createElement("td", null)), mergeCaptionAmounts(groupByCaption(bs.equity, ["Equity"]), groupByCaption(bsPrev.equity, ["Equity"])).map((c) => /* @__PURE__ */ React.createElement("tr", { key: c.caption }, /* @__PURE__ */ React.createElement("td", { style: { paddingLeft: 20, ...clickable }, onClick: () => openCaptionDrill("equity", c.caption, c.accounts) }, c.caption), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", ...clickable }, onClick: () => openCaptionDrill("equity", c.caption, c.accounts) }, fmt(c.amount)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(c.prevAmount)))), BS_LIAB_GROUPS.map((g) => {
    const rows = bs.liabilities.filter((l) => l.group === g), prevRows = bsPrev.liabilities.filter((l) => l.group === g);
    if (!rows.length && !prevRows.length) return null;
    return /* @__PURE__ */ React.createElement(React.Fragment, { key: g }, /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 600 } }, /* @__PURE__ */ React.createElement("td", null, g === "Non-Current Liabilities" ? "2. Non-Current Liabilities" : "3. Current Liabilities"), /* @__PURE__ */ React.createElement("td", null), /* @__PURE__ */ React.createElement("td", null)), mergeCaptionAmounts(groupByCaption(rows), groupByCaption(prevRows)).map((c) => /* @__PURE__ */ React.createElement("tr", { key: c.caption }, /* @__PURE__ */ React.createElement("td", { style: { paddingLeft: 20, ...clickable }, onClick: () => openCaptionDrill("liability", c.caption, c.accounts) }, c.caption), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", ...clickable }, onClick: () => openCaptionDrill("liability", c.caption, c.accounts) }, fmt(c.amount)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(c.prevAmount)))));
  }), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 700, borderTop: "2px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", null, "TOTAL"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, fmt(bs.totalLiab + bs.totalEquity)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(bsPrev.totalLiab + bsPrev.totalEquity)))))), /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { colSpan: 3 }, "II. ASSETS")), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Particulars"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "As at ", fmtDate(asOf)), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right", color: "var(--text3)" } }, "As at ", fmtDate(prevAsOf), " (Previous Year)"))), /* @__PURE__ */ React.createElement("tbody", null, BS_ASSET_GROUPS.map((g) => {
    const rows = bs.assets.filter((a) => a.group === g), prevRows = bsPrev.assets.filter((a) => a.group === g);
    if (!rows.length && !prevRows.length) return null;
    return /* @__PURE__ */ React.createElement(React.Fragment, { key: g }, /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 600 } }, /* @__PURE__ */ React.createElement("td", null, g === "Non-Current Assets" ? "1. Non-Current Assets" : "2. Current Assets"), /* @__PURE__ */ React.createElement("td", null), /* @__PURE__ */ React.createElement("td", null)), mergeCaptionAmounts(groupByCaption(rows), groupByCaption(prevRows)).map((c) => /* @__PURE__ */ React.createElement("tr", { key: c.caption }, /* @__PURE__ */ React.createElement("td", { style: { paddingLeft: 20, ...clickable }, onClick: () => openCaptionDrill("asset", c.caption, c.accounts) }, c.caption), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", ...clickable }, onClick: () => openCaptionDrill("asset", c.caption, c.accounts) }, fmt(c.amount)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(c.prevAmount)))));
  }), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 700, borderTop: "2px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", null, "TOTAL"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, fmt(bs.totalAssets)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(bsPrev.totalAssets)))))), !bs.tallies && /* @__PURE__ */ React.createElement("div", { className: "alert", style: { marginTop: 12, color: "var(--red)" } }, "Balance Sheet does not tie out exactly \u2014 check the Trial Balance / recent Journal Vouchers."), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--text3)", marginTop: 10, whiteSpace: "pre-line" } }, /* @__PURE__ */ React.createElement("b", null, "Notes \u2014 Significant Accounting Policies:"), "\n", getPolicies())) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, marginBottom: 10 } }, "Balance Sheet as at ", fmtDateLong(asOf), co.name ? " \u2014 " + co.name : "", " ", /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 400, color: "var(--text3)", fontSize: 11.5 } }, "(Normal format, comparing against ", fmtDate(prevAsOf), ")")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Assets"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "As at ", fmtDate(asOf)), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right", color: "var(--text3)" } }, "As at ", fmtDate(prevAsOf)))), /* @__PURE__ */ React.createElement("tbody", null, bs.assets.map((a) => /* @__PURE__ */ React.createElement("tr", { key: a.key }, /* @__PURE__ */ React.createElement("td", { style: clickable, onClick: () => openLedgerDrill(a.key) }, a.name), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", ...clickable }, onClick: () => openLedgerDrill(a.key) }, fmt(a.amount)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(prevAmtByKey(a.key))))), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 700, borderTop: "2px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", null, "Total Assets"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, fmt(bs.totalAssets)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(bsPrev.totalAssets)))))), /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Liabilities & Equity"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "As at ", fmtDate(asOf)), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right", color: "var(--text3)" } }, "As at ", fmtDate(prevAsOf)))), /* @__PURE__ */ React.createElement("tbody", null, [...bs.liabilities, ...bs.equity].map((a) => /* @__PURE__ */ React.createElement("tr", { key: a.key }, /* @__PURE__ */ React.createElement("td", { style: clickable, onClick: () => openLedgerDrill(a.key) }, a.name), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", ...clickable }, onClick: () => openLedgerDrill(a.key) }, fmt(a.amount)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(prevAmtByKey(a.key))))), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 700, borderTop: "2px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", null, "Total Liabilities & Equity"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, fmt(bs.totalLiab + bs.totalEquity)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(bsPrev.totalLiab + bsPrev.totalEquity))))))))), tab === "tb" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 16, alignItems: "flex-end" } }, fySel, /* @__PURE__ */ React.createElement("div", { className: "field", style: { maxWidth: 220 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "As of"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: asOf, onChange: (e) => setAsOf(e.target.value) })), /* @__PURE__ */ React.createElement(ExportBar, { onExport: doExportTB, label: "Export Trial Balance" })), /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { colSpan: 5 }, "Trial Balance as at ", fmtDateLong(asOf), co.name ? " \u2014 " + co.name : "")), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { rowSpan: 2, style: { verticalAlign: "bottom" } }, "Account"), /* @__PURE__ */ React.createElement("th", { colSpan: 2, style: { textAlign: "center" } }, "As at ", fmtDate(asOf)), /* @__PURE__ */ React.createElement("th", { colSpan: 2, style: { textAlign: "center", color: "var(--text3)" } }, "As at ", fmtDate(prevAsOf), " (Previous Year)")), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Debit"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Credit"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right", color: "var(--text3)" } }, "Debit"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right", color: "var(--text3)" } }, "Credit"))), /* @__PURE__ */ React.createElement("tbody", null, tbUnionAccounts.map((key) => {
    const bal = tbBalOf(tb, key), balP = tbBalOf(tbPrev, key);
    return /* @__PURE__ */ React.createElement("tr", { key }, /* @__PURE__ */ React.createElement("td", { style: clickable, onClick: () => openLedgerDrill(key) }, coaByKey(key).name), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, bal >= 0 ? fmtN(bal) : ""), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, bal < 0 ? fmtN(-bal) : ""), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, balP >= 0 ? fmtN(balP) : ""), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, balP < 0 ? fmtN(-balP) : ""));
  }), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 700, borderTop: "2px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", null, "Total"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, fmtN(tbDebit)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, fmtN(tbCredit)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmtN(tbDebitPrev)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmtN(tbCreditPrev))))))))));
};
const advanceDate = (dateStr, freq) => {
  const d = _pd(dateStr || today());
  if (freq === "Weekly") d.setDate(d.getDate() + 7);
  else if (freq === "Quarterly") d.setMonth(d.getMonth() + 3);
  else if (freq === "Yearly") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return _iso(d);
};
const nextDocNo = (label) => {
  const key = SK.CTR + "_" + label + "_" + getFY();
  const c = S.get(key, 1);
  return { no: `${label}/${getFYShort()}/${String(c).padStart(3, "0")}`, commit: () => S.set(key, c + 1) };
};
const blankSimpleItem = () => ({ desc: "", qty: 1, rate: "", unit: "Nos" });
const blankSimpleCustomer = () => ({ name: "", address: "", phone: "", email: "", gstin: "", city: "", state: "", pin: "" });
const SimpleCustomerPicker = ({ customer, onChange }) => {
  const [q, setQ] = useState((customer == null ? void 0 : customer.name) || "");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef();
  useEffect(() => {
    setQ((customer == null ? void 0 : customer.name) || "");
  }, [customer == null ? void 0 : customer.name]);
  useEffect(() => {
    const h = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const customers = S.get(SK.CUST, []);
  const matched = q.length > 1 ? customers.filter((c) => {
    var _a, _b;
    return ((_a = c.name) == null ? void 0 : _a.toLowerCase().includes(q.toLowerCase())) || ((_b = c.gstin) == null ? void 0 : _b.toLowerCase().includes(q.toLowerCase()));
  }).slice(0, 6) : [];
  const pick = (c) => {
    onChange({ name: c.name || "", address: c.address || "", phone: c.phone || "", email: c.email || "", gstin: c.gstin || "", city: c.city || "", state: c.state || "", pin: c.pin || "" });
    setQ(c.name || "");
    setOpen(false);
  };
  return /* @__PURE__ */ React.createElement("div", { ref: wrapRef, style: { position: "relative" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "field-input",
      value: q,
      onChange: (e) => {
        setQ(e.target.value);
        onChange({ ...customer, name: e.target.value });
        setOpen(true);
      },
      onFocus: () => setOpen(true),
      placeholder: "Type to search saved customers..."
    }
  ), open && matched.length > 0 && /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    background: "var(--card)",
    border: "1.5px solid var(--border2)",
    borderRadius: 10,
    boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
    zIndex: 1e3,
    maxHeight: 220,
    overflowY: "auto"
  } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "5px 12px", fontSize: 10, color: "var(--text3)", borderBottom: "1px solid var(--border)", fontWeight: 700, background: "var(--card2)", borderRadius: "10px 10px 0 0" } }, /* @__PURE__ */ React.createElement(Ic, { n: "users", s: 14 }), " ", matched.length, " customer", matched.length !== 1 ? "s" : "", " found"), matched.map((c, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "hsn-opt", onMouseDown: (e) => {
    e.preventDefault();
    pick(c);
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, color: "var(--text)" } }, c.name), c.gstin && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontFamily: "monospace", color: "var(--gold)" } }, c.gstin)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)" } }, [c.city, c.state].filter(Boolean).join(", "))))));
};
const convertItemsToInvoice = (customer, items, notes, user) => {
  const mapped = items.filter((it) => it.desc).map((it) => {
    const qty = parseFloat(it.qty) || 0, rate = parseFloat(it.rate) || 0;
    return { desc: it.desc, qty, rate, total: +(qty * rate).toFixed(2) };
  });
  if (mapped.length === 0) return null;
  const subtotal = +mapped.reduce((s, it) => s + it.total, 0).toFixed(2);
  const invNo = peekInvNo("NON GST INVOICE");
  commitInvNo("NON GST INVOICE");
  const inv = {
    ...newInvoice(user, "NON GST INVOICE"),
    invNo,
    billTo: { ...blankSimpleCustomer(), ...customer },
    items: mapped,
    subtotal,
    grand: subtotal,
    notes: notes || "",
    status: "Sent"
  };
  S.set(SK.INV, [...S.get(SK.INV, []), inv]);
  return inv;
};
const QuotationsPage = ({ inline = true, onClose, currentUser }) => {
  const [list, setList] = useState(() => S.get(SK.QUOTE, []));
  const blank = () => ({ id: Date.now().toString(), quoteNo: "", date: today(), validTill: addDaysStr(today(), 15), customer: blankSimpleCustomer(), items: [blankSimpleItem()], notes: "", status: "Draft", convertedInvNo: "" });
  const [form, setForm] = useState(null);
  const persist = (u) => {
    setList(u);
    S.set(SK.QUOTE, u);
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
    if (!f.quoteNo) {
      const { no, commit } = nextDocNo("QUO");
      f = { ...f, quoteNo: no };
      commit();
    }
    persist(wasExisting ? list.map((q) => q.id === f.id ? f : q) : [...list, f]);
    logAudit(wasExisting ? "QUOTATION_EDITED" : "QUOTATION_CREATED", `${f.quoteNo} \u2014 ${((_a = f.customer) == null ? void 0 : _a.name) || ""} \u2014 ${fmt(total(f))}`, currentUser);
    setForm(null);
    toast.success("Quotation saved");
  };
  const del = (id) => {
    var _a;
    if (!window.confirm("Delete this quotation?")) return;
    const q = list.find((x) => x.id === id);
    persist(list.filter((q2) => q2.id !== id));
    logAudit("QUOTATION_DELETED", `${(q == null ? void 0 : q.quoteNo) || ""} \u2014 ${((_a = q == null ? void 0 : q.customer) == null ? void 0 : _a.name) || ""}`, currentUser);
  };
  const setStatus = (id, status) => {
    persist(list.map((q) => q.id === id ? { ...q, status } : q));
  };
  const convert = (q) => {
    if (!window.confirm(`Convert ${q.quoteNo} into a real invoice for ${fmt(total(q))}?`)) return;
    const inv = convertItemsToInvoice(q.customer, q.items, `Converted from Quotation ${q.quoteNo}`, currentUser);
    if (!inv) {
      toast.error("Add at least one item first");
      return;
    }
    persist(list.map((x) => x.id === q.id ? { ...x, status: "Converted", convertedInvNo: inv.invNo } : x));
    logAudit("QUOTATION_CONVERTED", `${q.quoteNo} \u2192 invoice ${inv.invNo}`, currentUser);
    toast.success(`Converted to invoice ${inv.invNo}`);
  };
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay" }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal" }, !inline && /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("span", { className: "modal-title" }, /* @__PURE__ */ React.createElement(Ic, { n: "file", s: 18 }), " Quotations / Estimates"), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Ic, { n: "x" }))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, !form ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", style: { marginBottom: 14 }, onClick: () => setForm(blank()) }, /* @__PURE__ */ React.createElement(Ic, { n: "plus", s: 13 }), " New Quotation"), /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "No."), /* @__PURE__ */ React.createElement("th", null, "Date"), /* @__PURE__ */ React.createElement("th", null, "Customer"), /* @__PURE__ */ React.createElement("th", null, "Valid Till"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Amount"), /* @__PURE__ */ React.createElement("th", null, "Status"), /* @__PURE__ */ React.createElement("th", { style: { width: 220 } }, "Actions"))), /* @__PURE__ */ React.createElement("tbody", null, list.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 7, style: { textAlign: "center", padding: 24, color: "var(--text3)" } }, "No quotations yet.")) : [...list].sort((a, b) => (b.date || "").localeCompare(a.date || "")).map((q) => {
    var _a;
    return /* @__PURE__ */ React.createElement("tr", { key: q.id }, /* @__PURE__ */ React.createElement("td", { style: { fontWeight: 600 } }, q.quoteNo), /* @__PURE__ */ React.createElement("td", null, fmtDate(q.date)), /* @__PURE__ */ React.createElement("td", null, (_a = q.customer) == null ? void 0 : _a.name), /* @__PURE__ */ React.createElement("td", null, fmtDate(q.validTill)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", fontWeight: 600 } }, fmt(total(q))), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: `badge ${q.status === "Accepted" || q.status === "Converted" ? "badge-green" : q.status === "Rejected" ? "badge-red" : "badge-gold"}` }, q.status)), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => setForm(q) }, "Edit"), q.status !== "Converted" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: () => convert(q) }, "Convert"), q.status === "Draft" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => setStatus(q.id, "Sent") }, "Mark Sent"), q.status === "Sent" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => setStatus(q.id, "Accepted") }, "Accepted"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => setStatus(q.id, "Rejected") }, "Rejected")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger btn-icon", onClick: () => del(q.id) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 11 })))));
  }))))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", style: { marginBottom: 14 }, onClick: () => setForm(null) }, "\u2190 Back to list"), /* @__PURE__ */ React.createElement("div", { className: "g4", style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Date"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: form.date, onChange: (e) => setForm((p) => ({ ...p, date: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Valid Till"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: form.validTill, onChange: (e) => setForm((p) => ({ ...p, validTill: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Customer Name"), /* @__PURE__ */ React.createElement(SimpleCustomerPicker, { customer: form.customer, onChange: (c) => setForm((p) => ({ ...p, customer: c })) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Phone"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.customer.phone, onChange: (e) => setForm((p) => ({ ...p, customer: { ...p.customer, phone: e.target.value } })) }))), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, marginBottom: 8 } }, "Items"), form.items.map((it, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", gap: 8, marginBottom: 6 } }, /* @__PURE__ */ React.createElement("input", { className: "field-input", style: { flex: 3 }, placeholder: "Description", value: it.desc, onChange: (e) => setForm((p) => ({ ...p, items: p.items.map((x, j) => j === i ? { ...x, desc: e.target.value } : x) })) }), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { flex: 1 }, placeholder: "Qty", value: it.qty, onChange: (e) => setForm((p) => ({ ...p, items: p.items.map((x, j) => j === i ? { ...x, qty: e.target.value } : x) })) }), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { flex: 1 }, placeholder: "Rate", value: it.rate, onChange: (e) => setForm((p) => ({ ...p, items: p.items.map((x, j) => j === i ? { ...x, rate: e.target.value } : x) })) }), /* @__PURE__ */ React.createElement("div", { style: { width: 100, alignSelf: "center", textAlign: "right", fontWeight: 600 } }, fmt((parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger btn-icon", onClick: () => setForm((p) => ({ ...p, items: p.items.filter((_, j) => j !== i) })) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 11 })))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: () => setForm((p) => ({ ...p, items: [...p.items, blankSimpleItem()] })) }, /* @__PURE__ */ React.createElement(Ic, { n: "plus", s: 11 }), " Add Item"), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", fontWeight: 700, fontSize: 15, margin: "12px 0" } }, "Total: ", fmt(total(form))), /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Notes"), /* @__PURE__ */ React.createElement("textarea", { className: "field-input", value: form.notes, onChange: (e) => setForm((p) => ({ ...p, notes: e.target.value })) })), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: save }, "Save Quotation")))));
};
const DeliveryChallanPage = ({ inline = true, onClose, currentUser }) => {
  const [list, setList] = useState(() => S.get(SK.DC, []));
  const blank = () => ({ id: Date.now().toString(), dcNo: "", date: today(), customer: blankSimpleCustomer(), items: [blankSimpleItem()], purpose: "Job Work", vehicleNo: "", transporter: "", notes: "", status: "Dispatched" });
  const [form, setForm] = useState(null);
  const persist = (u) => {
    setList(u);
    S.set(SK.DC, u);
  };
  const save = () => {
    var _a;
    if (!form.customer.name) {
      toast.error("Customer name required");
      return;
    }
    let f = form;
    const wasExisting = list.some((d) => d.id === f.id);
    if (!f.dcNo) {
      const { no, commit } = nextDocNo("DC");
      f = { ...f, dcNo: no };
      commit();
    }
    persist(wasExisting ? list.map((d) => d.id === f.id ? f : d) : [...list, f]);
    logAudit(wasExisting ? "DC_EDITED" : "DC_CREATED", `${f.dcNo} \u2014 ${((_a = f.customer) == null ? void 0 : _a.name) || ""}`, currentUser);
    setForm(null);
    toast.success("Delivery Challan saved");
  };
  const del = (id) => {
    var _a;
    if (!window.confirm("Delete this delivery challan?")) return;
    const d = list.find((x) => x.id === id);
    persist(list.filter((d2) => d2.id !== id));
    logAudit("DC_DELETED", `${(d == null ? void 0 : d.dcNo) || ""} \u2014 ${((_a = d == null ? void 0 : d.customer) == null ? void 0 : _a.name) || ""}`, currentUser);
  };
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay" }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal" }, !inline && /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("span", { className: "modal-title" }, /* @__PURE__ */ React.createElement(Ic, { n: "package", s: 18 }), " Delivery Challans"), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Ic, { n: "x" }))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, !form ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", style: { marginBottom: 14 }, onClick: () => setForm(blank()) }, /* @__PURE__ */ React.createElement(Ic, { n: "plus", s: 13 }), " New Delivery Challan"), /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "No."), /* @__PURE__ */ React.createElement("th", null, "Date"), /* @__PURE__ */ React.createElement("th", null, "Customer"), /* @__PURE__ */ React.createElement("th", null, "Purpose"), /* @__PURE__ */ React.createElement("th", null, "# Items"), /* @__PURE__ */ React.createElement("th", null, "Status"), /* @__PURE__ */ React.createElement("th", { style: { width: 140 } }, "Actions"))), /* @__PURE__ */ React.createElement("tbody", null, list.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 7, style: { textAlign: "center", padding: 24, color: "var(--text3)" } }, "No delivery challans yet.")) : [...list].sort((a, b) => (b.date || "").localeCompare(a.date || "")).map((d) => {
    var _a;
    return /* @__PURE__ */ React.createElement("tr", { key: d.id }, /* @__PURE__ */ React.createElement("td", { style: { fontWeight: 600 } }, d.dcNo), /* @__PURE__ */ React.createElement("td", null, fmtDate(d.date)), /* @__PURE__ */ React.createElement("td", null, (_a = d.customer) == null ? void 0 : _a.name), /* @__PURE__ */ React.createElement("td", null, d.purpose), /* @__PURE__ */ React.createElement("td", null, (d.items || []).filter((it) => it.desc).length), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: `badge ${d.status === "Delivered" ? "badge-green" : "badge-gold"}` }, d.status)), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => setForm(d) }, "Edit"), d.status !== "Delivered" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: () => persist(list.map((x) => x.id === d.id ? { ...x, status: "Delivered" } : x)) }, "Mark Delivered"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger btn-icon", onClick: () => del(d.id) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 11 })))));
  }))))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", style: { marginBottom: 14 }, onClick: () => setForm(null) }, "\u2190 Back to list"), /* @__PURE__ */ React.createElement("div", { className: "g4", style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Date"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: form.date, onChange: (e) => setForm((p) => ({ ...p, date: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Purpose"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: form.purpose, onChange: (e) => setForm((p) => ({ ...p, purpose: e.target.value })) }, /* @__PURE__ */ React.createElement("option", null, "Job Work"), /* @__PURE__ */ React.createElement("option", null, "Sale on Approval"), /* @__PURE__ */ React.createElement("option", null, "Return"), /* @__PURE__ */ React.createElement("option", null, "Other"))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Vehicle No."), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.vehicleNo, onChange: (e) => setForm((p) => ({ ...p, vehicleNo: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Transporter"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.transporter, onChange: (e) => setForm((p) => ({ ...p, transporter: e.target.value })) }))), /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 12, maxWidth: 400 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Customer Name"), /* @__PURE__ */ React.createElement(SimpleCustomerPicker, { customer: form.customer, onChange: (c) => setForm((p) => ({ ...p, customer: c })) })), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, marginBottom: 8 } }, "Items"), form.items.map((it, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", gap: 8, marginBottom: 6 } }, /* @__PURE__ */ React.createElement("input", { className: "field-input", style: { flex: 3 }, placeholder: "Description", value: it.desc, onChange: (e) => setForm((p) => ({ ...p, items: p.items.map((x, j) => j === i ? { ...x, desc: e.target.value } : x) })) }), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { flex: 1 }, placeholder: "Qty", value: it.qty, onChange: (e) => setForm((p) => ({ ...p, items: p.items.map((x, j) => j === i ? { ...x, qty: e.target.value } : x) })) }), /* @__PURE__ */ React.createElement("input", { className: "field-input", style: { flex: 1 }, placeholder: "Unit", value: it.unit, onChange: (e) => setForm((p) => ({ ...p, items: p.items.map((x, j) => j === i ? { ...x, unit: e.target.value } : x) })) }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger btn-icon", onClick: () => setForm((p) => ({ ...p, items: p.items.filter((_, j) => j !== i) })) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 11 })))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: () => setForm((p) => ({ ...p, items: [...p.items, blankSimpleItem()] })) }, /* @__PURE__ */ React.createElement(Ic, { n: "plus", s: 11 }), " Add Item"), /* @__PURE__ */ React.createElement("div", { className: "field", style: { margin: "12px 0" } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Notes"), /* @__PURE__ */ React.createElement("textarea", { className: "field-input", value: form.notes, onChange: (e) => setForm((p) => ({ ...p, notes: e.target.value })) })), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: save }, "Save Delivery Challan")))));
};
const RecurringInvoicesPage = ({ inline = true, onClose, currentUser }) => {
  const [list, setList] = useState(() => S.get(SK.RECUR, []));
  const blank = () => ({ id: Date.now().toString(), name: "", customer: blankSimpleCustomer(), items: [blankSimpleItem()], frequency: "Monthly", startDate: today(), nextRunDate: today(), active: true, generatedCount: 0, lastGeneratedInvNo: "" });
  const [form, setForm] = useState(null);
  const persist = (u) => {
    setList(u);
    S.set(SK.RECUR, u);
  };
  const total = (f) => (f.items || []).reduce((s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0), 0);
  const save = () => {
    var _a;
    if (!form.name || !form.customer.name) {
      toast.error("Template name and customer are required");
      return;
    }
    const exists = list.some((r) => r.id === form.id);
    persist(exists ? list.map((r) => r.id === form.id ? form : r) : [...list, form]);
    logAudit(exists ? "RECURRING_TEMPLATE_EDITED" : "RECURRING_TEMPLATE_CREATED", `${form.name} \u2014 ${((_a = form.customer) == null ? void 0 : _a.name) || ""} \u2014 ${form.frequency}`, currentUser);
    setForm(null);
    toast.success("Recurring template saved");
  };
  const del = (id) => {
    if (!window.confirm("Delete this recurring template?")) return;
    const r = list.find((x) => x.id === id);
    persist(list.filter((r3) => r3.id !== id));
    logAudit("RECURRING_TEMPLATE_DELETED", `${(r == null ? void 0 : r.name) || ""}`, currentUser);
  };
  const generateNow = (r) => {
    const inv = convertItemsToInvoice(r.customer, r.items, `Recurring invoice \u2014 ${r.name}`, currentUser);
    if (!inv) {
      toast.error("Add at least one item first");
      return;
    }
    persist(list.map((x) => x.id === r.id ? { ...x, nextRunDate: advanceDate(x.nextRunDate, x.frequency), generatedCount: (x.generatedCount || 0) + 1, lastGeneratedInvNo: inv.invNo } : x));
    logAudit("RECURRING_INVOICE_GENERATED", `${r.name} \u2192 invoice ${inv.invNo}`, currentUser);
    toast.success(`Invoice ${inv.invNo} generated`);
  };
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay" }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal" }, !inline && /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("span", { className: "modal-title" }, /* @__PURE__ */ React.createElement(Ic, { n: "refresh", s: 18 }), " Recurring Invoices"), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Ic, { n: "x" }))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, !form ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", style: { marginBottom: 14 }, onClick: () => setForm(blank()) }, /* @__PURE__ */ React.createElement(Ic, { n: "plus", s: 13 }), " New Recurring Template"), /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Template"), /* @__PURE__ */ React.createElement("th", null, "Customer"), /* @__PURE__ */ React.createElement("th", null, "Frequency"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Amount"), /* @__PURE__ */ React.createElement("th", null, "Next Run"), /* @__PURE__ */ React.createElement("th", null, "Generated"), /* @__PURE__ */ React.createElement("th", { style: { width: 180 } }, "Actions"))), /* @__PURE__ */ React.createElement("tbody", null, list.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 7, style: { textAlign: "center", padding: 24, color: "var(--text3)" } }, "No recurring templates yet.")) : list.map((r) => {
    var _a;
    const due = r.active && r.nextRunDate <= today();
    return /* @__PURE__ */ React.createElement("tr", { key: r.id, style: due ? { background: "rgba(241,73,92,0.06)" } : {} }, /* @__PURE__ */ React.createElement("td", { style: { fontWeight: 600 } }, r.name, !r.active && /* @__PURE__ */ React.createElement("span", { className: "badge badge-gray", style: { marginLeft: 6 } }, "Paused")), /* @__PURE__ */ React.createElement("td", null, (_a = r.customer) == null ? void 0 : _a.name), /* @__PURE__ */ React.createElement("td", null, r.frequency), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, fmt(total(r))), /* @__PURE__ */ React.createElement("td", null, fmtDate(r.nextRunDate), " ", due && /* @__PURE__ */ React.createElement("span", { className: "badge badge-gold", style: { marginLeft: 4 } }, "Due")), /* @__PURE__ */ React.createElement("td", null, r.generatedCount || 0, r.lastGeneratedInvNo ? ` (last: ${r.lastGeneratedInvNo})` : ""), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: () => generateNow(r) }, "Generate Now"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => setForm(r) }, "Edit"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => persist(list.map((x) => x.id === r.id ? { ...x, active: !x.active } : x)) }, r.active ? "Pause" : "Resume"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger btn-icon", onClick: () => del(r.id) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 11 })))));
  }))))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", style: { marginBottom: 14 }, onClick: () => setForm(null) }, "\u2190 Back to list"), /* @__PURE__ */ React.createElement("div", { className: "g4", style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Template Name"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.name, onChange: (e) => setForm((p) => ({ ...p, name: e.target.value })), placeholder: "e.g. Monthly Retainer \u2014 ABC Corp" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Customer Name"), /* @__PURE__ */ React.createElement(SimpleCustomerPicker, { customer: form.customer, onChange: (c) => setForm((p) => ({ ...p, customer: c })) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Frequency"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: form.frequency, onChange: (e) => setForm((p) => ({ ...p, frequency: e.target.value })) }, /* @__PURE__ */ React.createElement("option", null, "Weekly"), /* @__PURE__ */ React.createElement("option", null, "Monthly"), /* @__PURE__ */ React.createElement("option", null, "Quarterly"), /* @__PURE__ */ React.createElement("option", null, "Yearly"))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Next Run Date"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: form.nextRunDate, onChange: (e) => setForm((p) => ({ ...p, nextRunDate: e.target.value })) }))), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, marginBottom: 8 } }, "Items"), form.items.map((it, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", gap: 8, marginBottom: 6 } }, /* @__PURE__ */ React.createElement("input", { className: "field-input", style: { flex: 3 }, placeholder: "Description", value: it.desc, onChange: (e) => setForm((p) => ({ ...p, items: p.items.map((x, j) => j === i ? { ...x, desc: e.target.value } : x) })) }), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { flex: 1 }, placeholder: "Qty", value: it.qty, onChange: (e) => setForm((p) => ({ ...p, items: p.items.map((x, j) => j === i ? { ...x, qty: e.target.value } : x) })) }), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { flex: 1 }, placeholder: "Rate", value: it.rate, onChange: (e) => setForm((p) => ({ ...p, items: p.items.map((x, j) => j === i ? { ...x, rate: e.target.value } : x) })) }), /* @__PURE__ */ React.createElement("div", { style: { width: 100, alignSelf: "center", textAlign: "right", fontWeight: 600 } }, fmt((parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger btn-icon", onClick: () => setForm((p) => ({ ...p, items: p.items.filter((_, j) => j !== i) })) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 11 })))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: () => setForm((p) => ({ ...p, items: [...p.items, blankSimpleItem()] })) }, /* @__PURE__ */ React.createElement(Ic, { n: "plus", s: 11 }), " Add Item"), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", fontWeight: 700, fontSize: 15, margin: "12px 0" } }, "Amount per invoice: ", fmt(total(form))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: save }, "Save Template")))));
};
const RemindersPage = ({ inline = true, onClose, currentUser }) => {
  const [tick, setTick] = useState(0);
  const invs = S.get(SK.INV, []).filter((i) => ["TAX INVOICE", "NON GST INVOICE"].includes(i.docType) && i.status !== "Paid" && i.status !== "Draft" && i.status !== "Cancelled");
  const rows = useMemo(() => invs.map((i) => {
    const due = i.dueDate || i.date;
    const daysOver = Math.floor((new Date(today()) - new Date(due)) / (1e3 * 60 * 60 * 24));
    return { ...i, daysOver };
  }).sort((a, b) => b.daysOver - a.daysOver), [tick]);
  const sendWhatsApp = (inv) => {
    var _a, _b;
    const phone = (((_a = inv.billTo) == null ? void 0 : _a.phone) || "").replace(/\D/g, "");
    if (!phone) {
      toast.error("No phone number on file for this customer");
      return;
    }
    const msg = `Hi ${((_b = inv.billTo) == null ? void 0 : _b.name) || ""}, this is a friendly reminder that invoice ${inv.invNo} dated ${fmtDate(inv.date)} for ${fmt(getGrand(inv))} is ${inv.daysOver > 0 ? `overdue by ${inv.daysOver} day(s)` : "due soon"}. Please arrange payment at your earliest convenience. Thank you!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
    const invs2 = S.get(SK.INV, []).map((x) => x.invNo === inv.invNo ? { ...x, lastReminderSent: (/* @__PURE__ */ new Date()).toISOString() } : x);
    S.set(SK.INV, invs2);
    logAudit("PAYMENT_REMINDER_SENT", `WhatsApp reminder sent for ${inv.invNo}`, currentUser);
    setTick((x) => x + 1);
    toast.success("Reminder opened in WhatsApp");
  };
  const sendEmail = (inv) => {
    var _a, _b;
    const email = (_a = inv.billTo) == null ? void 0 : _a.email;
    if (!email) {
      toast.error("No email on file for this customer");
      return;
    }
    const subject = `Payment Reminder \u2014 Invoice ${inv.invNo}`;
    const body = `Hi ${((_b = inv.billTo) == null ? void 0 : _b.name) || ""},

This is a reminder that invoice ${inv.invNo} dated ${fmtDate(inv.date)} for ${fmt(getGrand(inv))} is ${inv.daysOver > 0 ? `overdue by ${inv.daysOver} day(s)` : "due soon"}.

Please arrange payment at your earliest convenience.

Thank you!`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const invs2 = S.get(SK.INV, []).map((x) => x.invNo === inv.invNo ? { ...x, lastReminderSent: (/* @__PURE__ */ new Date()).toISOString() } : x);
    S.set(SK.INV, invs2);
    setTick((x) => x + 1);
  };
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay" }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal" }, !inline && /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("span", { className: "modal-title" }, /* @__PURE__ */ React.createElement(Ic, { n: "alert", s: 18 }), " Payment Reminders"), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Ic, { n: "x" }))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text3)", marginBottom: 14 } }, "Every unpaid invoice, sorted with the most overdue first. Send a one-click WhatsApp or email nudge straight from here."), /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Invoice"), /* @__PURE__ */ React.createElement("th", null, "Customer"), /* @__PURE__ */ React.createElement("th", null, "Due Date"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Amount"), /* @__PURE__ */ React.createElement("th", null, "Status"), /* @__PURE__ */ React.createElement("th", null, "Last Reminder"), /* @__PURE__ */ React.createElement("th", { style: { width: 180 } }, "Send"))), /* @__PURE__ */ React.createElement("tbody", null, rows.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 7, style: { textAlign: "center", padding: 24, color: "var(--text3)" } }, "Nothing outstanding \u2014 all caught up!")) : rows.map((i) => {
    var _a;
    return /* @__PURE__ */ React.createElement("tr", { key: i.invNo, style: i.daysOver > 0 ? { background: "rgba(255,77,106,0.05)" } : {} }, /* @__PURE__ */ React.createElement("td", { style: { fontWeight: 600 } }, i.invNo), /* @__PURE__ */ React.createElement("td", null, (_a = i.billTo) == null ? void 0 : _a.name), /* @__PURE__ */ React.createElement("td", null, fmtDate(i.dueDate || i.date)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", fontWeight: 600 } }, fmt(getGrand(i))), /* @__PURE__ */ React.createElement("td", null, i.daysOver > 0 ? /* @__PURE__ */ React.createElement("span", { className: "badge badge-red" }, i.daysOver, "d overdue") : /* @__PURE__ */ React.createElement("span", { className: "badge badge-gold" }, "Due soon")), /* @__PURE__ */ React.createElement("td", { style: { fontSize: 11, color: "var(--text3)" } }, i.lastReminderSent ? new Date(i.lastReminderSent).toLocaleDateString() : "Never"), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: () => sendWhatsApp(i) }, /* @__PURE__ */ React.createElement(Ic, { n: "whatsapp", s: 11 }), " WhatsApp"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => sendEmail(i) }, /* @__PURE__ */ React.createElement(Ic, { n: "mail", s: 11 }), " Email"))));
  })))))));
};
const pad2 = (n) => String(n).padStart(2, "0");
const addDaysISO = (ds, n) => {
  const d = _pd(ds);
  d.setDate(d.getDate() + n);
  return _iso(d);
};
const monthEndISO = (y, m) => `${y}-${pad2(m)}-${pad2(new Date(y, m, 0).getDate())}`;
const addMonthsISO = (ds, n, anchorDay) => {
  const d = _pd(ds);
  const day = anchorDay || d.getDate();
  const t = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
  t.setDate(Math.min(day, last));
  return _iso(t);
};
const r2 = (x) => +(Number(x) || 0).toFixed(2);
const newId = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const sameParty = (a, b) => {
  const x = String(a || "").trim().toLowerCase(), y = String(b || "").trim().toLowerCase();
  return !!x && !!y && (x === y || x.includes(y) || y.includes(x));
};
const FA_PRESETS = [
  // indicative: Companies Act Sch. II useful life (SLM, years) / Income-tax WDV rate (%)
  { name: "Buildings (RCC)", life: 60, rate: 10 },
  { name: "Plant & Machinery", life: 15, rate: 15 },
  { name: "Furniture & Fixtures", life: 10, rate: 10 },
  { name: "Office Equipment", life: 5, rate: 15 },
  { name: "Computers & Laptops", life: 3, rate: 40 },
  { name: "Servers & Networking", life: 6, rate: 40 },
  { name: "Motor Vehicles", life: 8, rate: 15 },
  { name: "Electrical Installations", life: 10, rate: 10 },
  { name: "Software (Intangible)", life: 3, rate: 40 },
  { name: "Other", life: 5, rate: 15 }
];
const getAssets = () => S.get(SK.FA, []) || [];
const faSchedule = (a, asOf) => {
  asOf = asOf || today();
  const cost = parseFloat(a.cost) || 0, salvage = Math.max(0, parseFloat(a.salvage) || 0);
  const accBF = a.mode === "opening" ? parseFloat(a.accDepBF) || 0 : 0;
  const rows = [];
  let acc = accBF;
  const startStr = a.depFrom || a.purchaseDate || "";
  if (!startStr || cost <= 0) return { rows, accBF, acc, cost };
  const endStr = a.disposal && a.disposal.date ? a.disposal.date : "9999-12-31";
  const sy = +startStr.slice(0, 4), sm = +startStr.slice(5, 7), sd = +startStr.slice(8, 10) || 1;
  const maxDep = Math.max(0, cost - salvage);
  const life = parseFloat(a.lifeYears) || 0, rate = parseFloat(a.rate) || 0;
  let y = sy, m = sm;
  for (let guard = 0; guard < 1500; guard++) {
    const dim = new Date(y, m, 0).getDate();
    const mStart = `${y}-${pad2(m)}-01`, mEnd = `${y}-${pad2(m)}-${pad2(dim)}`;
    if (mStart > endStr || mStart > asOf) break;
    const first = y === sy && m === sm;
    const fromDay = first && a.mode !== "opening" ? sd : 1;
    const dispHere = endStr <= mEnd;
    const toDay = dispHere ? +endStr.slice(8, 10) : dim;
    const entryDate = dispHere ? endStr : mEnd;
    if (entryDate > asOf) break;
    const days = Math.max(0, toDay - fromDay + 1);
    const monthly = a.method === "WDV" ? (cost - acc) * rate / 1200 : life > 0 ? maxDep / (life * 12) : 0;
    let amt = monthly * days / dim;
    amt = r2(Math.min(amt, Math.max(0, maxDep - acc)));
    if (amt > 4e-3) {
      acc = r2(acc + amt);
      rows.push({ date: entryDate, ym: `${y}-${pad2(m)}`, amount: amt, accAfter: acc, wdvAfter: r2(cost - acc) });
    }
    if (dispHere) break;
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return { rows, accBF, acc, cost };
};
const faAcquiredOn = (a) => a.mode === "opening" ? OPENING_DATE : a.purchaseDate || "";
const buildFixedAssetEntries = (add) => {
  getAssets().forEach((a) => {
    const cost = parseFloat(a.cost) || 0;
    if (cost <= 0) return;
    const code = a.code || a.id;
    const tag = String(code).replace(/\s+/g, "").toUpperCase();
    if (a.mode === "opening") {
      add(OPENING_DATE, `Opening fixed asset \u2014 ${a.name}`, "FAOB", a.id, [{ account: "FIXED_ASSETS", debit: cost, credit: 0 }, { account: "CAPITAL", debit: 0, credit: cost }], "OPEN-" + tag, { docNo: code, category: "Opening Fixed Asset" });
      const bf = parseFloat(a.accDepBF) || 0;
      if (bf > 4e-3) add(OPENING_DATE, `Opening accumulated depreciation \u2014 ${a.name}`, "FAOB", a.id + "-AD", [{ account: "CAPITAL", debit: bf, credit: 0 }, { account: "ACC_DEPRECIATION", debit: 0, credit: bf }], "OPEN-" + tag + "-AD", { docNo: code, category: "Opening Fixed Asset" });
    } else if (a.mode === "new" && a.purchaseDate) {
      add(a.purchaseDate, `Asset purchase \u2014 ${a.name}`, "FAPUR", a.id, [{ account: "FIXED_ASSETS", debit: cost, credit: 0 }, { account: a.paidFromKey || "TRADE_PAYABLE", debit: 0, credit: cost }], a.voucherNo || "", { txnRefNo: a.txnRefNo || "", docNo: code, category: "Fixed Asset Purchase" });
    }
    faSchedule(a, today()).rows.forEach((r) => {
      add(
        r.date,
        `Depreciation \u2014 ${a.name} (${r.ym})`,
        "FADEP",
        a.id + "-" + r.ym,
        [{ account: "DEPRECIATION", debit: r.amount, credit: 0 }, { account: "ACC_DEPRECIATION", debit: 0, credit: r.amount }],
        "DEP-" + tag + "-" + r.ym.replace("-", ""),
        { docNo: code, category: "Depreciation" }
      );
    });
    if (a.disposal && a.disposal.date) {
      const dd = a.disposal.date, proceeds = parseFloat(a.disposal.proceeds) || 0;
      const acc = faSchedule(a, dd).acc;
      const nbv = r2(cost - acc), diff = r2(proceeds - nbv);
      const lines = [{ account: "FIXED_ASSETS", debit: 0, credit: cost }];
      if (acc > 4e-3) lines.push({ account: "ACC_DEPRECIATION", debit: acc, credit: 0 });
      if (proceeds > 4e-3) lines.push({ account: a.disposal.receivedKey || "TRADE_RECEIVABLE", debit: proceeds, credit: 0 });
      if (diff > 4e-3) lines.push({ account: "GAIN_ON_ASSET_SALE", debit: 0, credit: diff });
      else if (diff < -4e-3) lines.push({ account: "LOSS_ON_ASSET_SALE", debit: -diff, credit: 0 });
      add(dd, `Sale / disposal of asset \u2014 ${a.name}`, "FADISP", a.id, lines, a.disposal.voucherNo || "", { txnRefNo: a.disposal.txnRefNo || "", docNo: code, category: "Asset Disposal" });
    }
  });
};
const faPeriodRow = (a, from, to) => {
  const cost = parseFloat(a.cost) || 0;
  const acq = faAcquiredOn(a);
  const dis = a.disposal && a.disposal.date ? a.disposal.date : "";
  if (!acq || acq > to || cost <= 0) return null;
  if (dis && dis < from) return null;
  const dayBefore = addDaysISO(from, -1);
  const opened = acq < from;
  const grossOpen = opened ? cost : 0, additions = opened ? 0 : cost;
  const disposedIn = !!dis && dis >= from && dis <= to;
  const grossDisp = disposedIn ? cost : 0, grossClose = cost - grossDisp;
  const accOpen = opened ? faSchedule(a, dayBefore).acc : 0;
  const accTo = faSchedule(a, to).acc;
  const depYear = r2(accTo - accOpen);
  const accDisp = disposedIn ? faSchedule(a, dis).acc : 0;
  const accClose = r2(accTo - accDisp);
  const accPrevEnd = opened ? accOpen : 0;
  return {
    a,
    grossOpen,
    additions,
    grossDisp,
    grossClose,
    accOpen: r2(accOpen),
    depYear,
    accDisp: r2(accDisp),
    accClose,
    netClose: r2(grossClose - accClose),
    netOpen: r2(grossOpen - accPrevEnd),
    disposedIn
  };
};
const RJV_FREQ = [["monthly", "Monthly", 1], ["quarterly", "Quarterly", 3], ["halfyearly", "Half-yearly", 6], ["yearly", "Yearly", 12]];
const rjvStep = (t) => t.kind === "emi" || t.kind === "prepaid" ? 1 : (RJV_FREQ.find((f) => f[0] === t.frequency) || [0, 0, 1])[2];
const rjvDate = (t, k) => addMonthsISO(t.startDate, k * rjvStep(t));
const emiOf = (P, annualRate, n) => {
  P = +P || 0;
  n = +n || 0;
  const r = (+annualRate || 0) / 1200;
  if (n <= 0) return 0;
  if (r === 0) return r2(P / n);
  return r2(P * r / (1 - Math.pow(1 + r, -n)));
};
const emiSchedule = (P, annualRate, n, emiOverride) => {
  P = +P || 0;
  n = Math.round(+n || 0);
  const r = (+annualRate || 0) / 1200;
  const emi = emiOverride > 0 ? +emiOverride : emiOf(P, annualRate, n);
  const rows = [];
  let bal = P;
  for (let k = 0; k < n; k++) {
    const interest = r2(bal * r);
    let principal = r2(emi - interest);
    if (k === n - 1 || principal > bal) principal = r2(bal);
    const pay = r2(principal + interest);
    bal = r2(bal - principal);
    rows.push({ k, interest, principal, emi: pay, balance: bal });
  }
  return rows;
};
const prepaidSchedule = (total, months) => {
  total = +total || 0;
  months = Math.round(+months || 0);
  if (months <= 0) return [];
  const each = r2(total / months);
  const rows = [];
  let left = r2(total);
  for (let k = 0; k < months; k++) {
    const amt = k === months - 1 ? left : each;
    rows.push({ k, amount: amt });
    left = r2(left - amt);
  }
  return rows;
};
const rjvTotal = (t) => {
  if (t.kind === "emi") return Math.round(+t.tenure || 0);
  if (t.kind === "prepaid") return Math.round(+t.months || 0);
  if (t.count && +t.count > 0) return Math.round(+t.count);
  return t.endDate ? 600 : 600;
};
const rjvLines = (t, k) => {
  if (t.kind === "emi") {
    const row = emiSchedule(t.principal, t.rate, t.tenure, +t.emiOverride || 0)[k];
    if (!row) return null;
    const ls = [];
    if (row.principal > 4e-3) ls.push({ account: t.loanKey, desc: "Principal repaid", debit: row.principal, credit: 0 });
    if (row.interest > 4e-3) ls.push({ account: "FINANCE_COST", desc: "Interest", debit: row.interest, credit: 0 });
    ls.push({ account: t.payKey, desc: "EMI paid", debit: 0, credit: row.emi });
    return ls;
  }
  if (t.kind === "prepaid") {
    const row = prepaidSchedule(t.total, t.months)[k];
    if (!row || row.amount <= 4e-3) return null;
    return [{ account: t.expenseKey, desc: "Prepaid amortisation", debit: row.amount, credit: 0 }, { account: "PREPAID_EXP", desc: "Reducing prepaid balance", debit: 0, credit: row.amount }];
  }
  return (t.lines || []).map((l) => ({ account: l.account, desc: l.desc || "", debit: r2(l.debit), credit: r2(l.credit) })).filter((l) => l.account && (l.debit || l.credit));
};
const runRecurringJournals = (user, asOf) => {
  asOf = asOf || today();
  const tpls = S.get(SK.RJV, []) || [];
  if (!tpls.length) return 0;
  const jvs = [...getManualJournal()];
  let created = 0, changed = false;
  const next = tpls.map((t) => {
    if (!t.active) return t;
    let gen = parseInt(t.generated, 10) || 0;
    const total = rjvTotal(t);
    while (gen < total) {
      const d = rjvDate(t, gen);
      if (d > asOf || t.endDate && d > t.endDate) break;
      const lines = rjvLines(t, gen);
      if (!lines || lines.length < 2) {
        gen++;
        changed = true;
        continue;
      }
      const id = `RJV-${t.id}-${gen}`;
      if (!jvs.some((e) => e.id === id)) {
        jvs.push({
          id,
          date: d,
          narration: `${t.name} \u2014 #${gen + 1}${t.kind === "emi" || t.kind === "prepaid" || t.count && +t.count > 0 ? " of " + total : ""}`,
          referenceNo: t.refNo || "",
          reportingMethod: "both",
          lines,
          voucherNo: nextVoucherNo(),
          txnRefNo: nextTxnRefNo(d),
          srcType: "JV",
          recurringId: t.id,
          createdBy: user && (user.email || user.name) || "auto",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        created++;
      }
      gen++;
      changed = true;
    }
    return changed ? { ...t, generated: gen } : t;
  });
  if (created) S.set(SK.JOURNAL, jvs);
  if (changed) S.set(SK.RJV, next);
  return created;
};
const getAdvApps = () => S.get(SK.ADV_APPS, []) || [];
const getAdvanceRows = () => {
  const usedBy = {};
  getAdvApps().filter((a) => a.kind === "customer" || a.kind === "supplier").forEach((a) => {
    usedBy[a.advTxnId] = (usedBy[a.advTxnId] || 0) + (parseFloat(a.amt) || 0);
  });
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
  const rows = [];
  (S.get(SK.BANK, []) || []).forEach((t) => {
    var _a, _b, _c, _d;
    const amt = parseFloat(t.amount) || 0;
    if (!amt || !t.matched) return;
    const isCredit = t.type === "credit";
    const advKey = isCredit ? "CUSTOMER_ADVANCE" : "ADVANCES";
    const allocs = Array.isArray(t.allocs) ? t.allocs.filter((a) => (parseFloat(a.amt) || 0) > 4e-3) : [];
    let adv = 0, party = t.advParty || "";
    if (t.matchedType === "ledger" && t.ledgerKey === advKey) adv = amt;
    else if (allocs.length && !["creditnote", "suprefund"].includes(allocs[0].kind)) {
      const A = allocs.reduce((s, a) => s + (parseFloat(a.amt) || 0), 0);
      const d = r2(amt - A);
      const rk = t.restKey || (isCredit ? d > 0 ? "CUSTOMER_ADVANCE" : "TDS_RECEIVABLE" : d > 0 ? "ADVANCES" : "OTHER_INCOME");
      if (d > 4e-3 && rk === advKey) adv = d;
      if (!party) {
        const a0 = allocs[0];
        party = a0.kind === "invoice" ? ((_b = (_a = invByNo[a0.ref]) == null ? void 0 : _a.billTo) == null ? void 0 : _b.name) || "" : a0.kind === "quicksale" ? ((_c = qsById[a0.ref]) == null ? void 0 : _c.customer) || "" : ((_d = expById[a0.ref]) == null ? void 0 : _d.vendor) || "";
      }
    }
    if (adv <= 4e-3) return;
    const used = r2(usedBy[t.id] || 0);
    rows.push({ txnId: t.id, kind: isCredit ? "customer" : "supplier", date: t.date, party, amount: r2(adv), used, balance: r2(adv - used), ref: t.refNo || "", desc: t.desc || "", acctId: t.acctId || "PRIMARY" });
  });
  return rows.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
};
const tagAdvanceParty = (txnId, party) => S.set(SK.BANK, (S.get(SK.BANK, []) || []).map((t) => t.id === txnId ? { ...t, advParty: party } : t));
const cnSettledMap = () => {
  const m = {};
  (S.get(SK.BANK, []) || []).forEach((t) => {
    if (Array.isArray(t.allocs)) t.allocs.forEach((a) => {
      if (a.kind === "creditnote") m[a.ref] = (m[a.ref] || 0) + (parseFloat(a.amt) || 0);
    });
  });
  getAdvApps().filter((a) => a.kind === "cn").forEach((a) => {
    m[a.advTxnId] = (m[a.advTxnId] || 0) + (parseFloat(a.amt) || 0);
  });
  return m;
};
const getOpenCreditNotes = () => {
  const sm = cnSettledMap();
  return S.get(SK.INV, []).filter((i) => i.docType === "CREDIT NOTE" && i.status !== "Draft" && i.status !== "Cancelled").map((i) => {
    var _a;
    const total = Math.abs(getGrand(i));
    const settled = r2(sm[i.invNo] || 0);
    return { kind: "creditnote", ref: i.invNo, docNo: i.invNo, party: ((_a = i.billTo) == null ? void 0 : _a.name) || "Unknown customer", total, settled, out: r2(total - settled), date: i.date, due: i.date, extra: i.origInvNo ? "against " + i.origInvNo : "" };
  }).filter((o) => o.out > 0.01);
};
const creditNoteAgingRows = (asOn) => getOpenCreditNotes().map((o) => ({
  id: o.ref,
  party: o.party,
  gstin: "",
  docNo: o.ref,
  date: o.date,
  dueDate: o.date,
  gross: -o.total,
  paid: -o.settled,
  due: -o.out,
  daysOverdue: 0,
  bucket: "current",
  status: "Credit",
  docType: "CREDIT NOTE"
}));
const applyAdvance = ({ kind, advTxnId, party, docKind, docRef, docNo, amt, date, user }) => {
  amt = r2(amt);
  if (amt <= 4e-3) return null;
  const rec = {
    id: newId("AA-"),
    date: date || today(),
    kind,
    advTxnId,
    party: party || "",
    docKind,
    docRef,
    docNo: docNo || docRef,
    amt,
    voucherNo: nextVoucherNo(),
    txnRefNo: nextTxnRefNo(date || today()),
    createdBy: user && (user.email || user.name) || "",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  S.set(SK.ADV_APPS, [...getAdvApps(), rec]);
  adjustDocPaid(docKind, docRef, amt, { date: rec.date, refNo: (kind === "cn" ? "CN " : "ADV ") + advTxnId });
  return rec;
};
const reverseAdvanceApp = (id) => {
  const a = getAdvApps().find((x) => x.id === id);
  if (!a) return;
  S.set(SK.ADV_APPS, getAdvApps().filter((x) => x.id !== id));
  adjustDocPaid(a.docKind, a.docRef, -a.amt, { date: a.date, refNo: "" });
};
const buildAdvanceEntries = (add) => {
  getAdvApps().forEach((a) => {
    const amt = parseFloat(a.amt) || 0;
    if (amt <= 4e-3) return;
    if (a.kind === "customer") add(a.date, `Advance adjusted \u2014 ${a.party || "customer"} against ${a.docNo}`, "ADVAPP", a.id, [{ account: "CUSTOMER_ADVANCE", debit: amt, credit: 0 }, { account: "TRADE_RECEIVABLE", debit: 0, credit: amt }], a.voucherNo, { txnRefNo: a.txnRefNo, docNo: a.docNo, category: "Advance Adjustment" });
    else if (a.kind === "supplier") add(a.date, `Advance adjusted \u2014 ${a.party || "supplier"} against ${a.docNo}`, "ADVAPP", a.id, [{ account: "TRADE_PAYABLE", debit: amt, credit: 0 }, { account: "ADVANCES", debit: 0, credit: amt }], a.voucherNo, { txnRefNo: a.txnRefNo, docNo: a.docNo, category: "Advance Adjustment" });
  });
};
const FX_CURRENCIES = [
  { code: "INR", name: "Indian Rupee", sym: "\u20B9" },
  { code: "USD", name: "US Dollar", sym: "$" },
  { code: "EUR", name: "Euro", sym: "\u20AC" },
  { code: "GBP", name: "Pound Sterling", sym: "\xA3" },
  { code: "AED", name: "UAE Dirham", sym: "AED " },
  { code: "SGD", name: "Singapore Dollar", sym: "S$" },
  { code: "AUD", name: "Australian Dollar", sym: "A$" },
  { code: "CAD", name: "Canadian Dollar", sym: "C$" },
  { code: "CHF", name: "Swiss Franc", sym: "CHF " },
  { code: "JPY", name: "Japanese Yen", sym: "\xA5" },
  { code: "SAR", name: "Saudi Riyal", sym: "SAR " },
  { code: "QAR", name: "Qatari Riyal", sym: "QAR " },
  { code: "MYR", name: "Malaysian Ringgit", sym: "RM " },
  { code: "ZAR", name: "South African Rand", sym: "R " },
  { code: "CNY", name: "Chinese Yuan", sym: "CN\xA5" },
  { code: "NZD", name: "New Zealand Dollar", sym: "NZ$" }
];
const FX_WORD = { USD: "US Dollar", EUR: "Euro", GBP: "Pound Sterling", AED: "UAE Dirham", SGD: "Singapore Dollar", AUD: "Australian Dollar", CAD: "Canadian Dollar", CHF: "Swiss Franc", JPY: "Japanese Yen", SAR: "Saudi Riyal", QAR: "Qatari Riyal", MYR: "Malaysian Ringgit", ZAR: "South African Rand", CNY: "Chinese Yuan", NZD: "New Zealand Dollar" };
const fxSym = (c) => (FX_CURRENCIES.find((x) => x.code === c) || {}).sym || (c ? c + " " : "\u20B9");
const fmtC = (n, cur) => !cur || cur === "INR" ? fmt(n) : fxSym(cur) + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const isFxInv = (inv) => !!(inv && inv.currency && inv.currency !== "INR" && inv.fc);
const amountInWordsFC = (amt, cur) => {
  const n = Math.abs(Number(amt) || 0);
  let whole = Math.floor(n + 1e-9), cents = Math.round((n - whole) * 100);
  if (cents >= 100) {
    whole += 1;
    cents = 0;
  }
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (x) => x < 20 ? ones[x] : tens[Math.floor(x / 10)] + (x % 10 ? "-" + ones[x % 10] : "");
  const three = (x) => x >= 100 ? ones[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " + two(x % 100) : "") : two(x);
  const parts = [[1e9, "Billion"], [1e6, "Million"], [1e3, "Thousand"]];
  let rest = whole, out = [];
  parts.forEach(([v, l]) => {
    const q = Math.floor(rest / v);
    if (q) {
      out.push(three(q) + " " + l);
      rest -= q * v;
    }
  });
  if (rest) out.push(three(rest));
  let s = (FX_WORD[cur] || cur) + " " + (out.join(" ") || "Zero");
  if (cents) s += " and " + two(cents) + " Cents";
  return s + " Only";
};
const toBaseInvoice = (inv, rate) => {
  const m = (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? v : r2(n * rate);
  };
  const fc = { items: inv.items, subtotal: inv.subtotal, taxBreakdown: inv.taxBreakdown || {}, totalGST: inv.totalGST, roundOff: inv.roundOff, grand: inv.grand };
  const items = (inv.items || []).map((it) => ({ ...it, rate: m(it.rate), taxable: m(it.taxable), gstAmt: m(it.gstAmt), total: m(it.total) }));
  const tb = {};
  Object.entries(inv.taxBreakdown || {}).forEach(([k, v]) => {
    tb[k] = m(v);
  });
  const grand = r2((parseFloat(inv.grand) || 0) * rate), sub = r2((parseFloat(inv.subtotal) || 0) * rate), gst = r2((parseFloat(inv.totalGST) || 0) * rate);
  return { ...inv, items, subtotal: sub.toFixed(2), taxBreakdown: tb, totalGST: gst.toFixed(2), roundOff: inv.docType === "NON GST INVOICE" ? 0 : r2(Math.abs(grand) - (sub + gst)), grand, exchRate: rate, fc };
};
const unwrapFcInvoice = (inv) => inv && inv.fc ? { ...inv, ...inv.fc } : inv;
