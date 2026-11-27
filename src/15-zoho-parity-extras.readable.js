const PayrollReports = ({ currentUser }) => {
  const [open, setOpen] = useState(null);
  const [q, setQ] = useState("");
  const [fy, setFy] = useState(getFY());
  const [month, setMonth] = useState(prNextMonth());
  const [empId, setEmpId] = useState("");
  const [fav, setFav] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ab_pr_fav") || "[]");
    } catch (e) {
      return [];
    }
  });
  const emps = getEmployees();
  const toggleFav = (id) => {
    const n = fav.includes(id) ? fav.filter((x) => x !== id) : [...fav, id];
    setFav(n);
    try {
      localStorage.setItem("ab_pr_fav", JSON.stringify(n));
    } catch (e) {
    }
  };
  const cats = [...new Set(PR_REPORTS.map((r) => r.cat))];
  const [cat, setCat] = useState("All");
  const list = PR_REPORTS.filter((r) => (cat === "All" || (cat === "Favorites" ? fav.includes(r.id) : r.cat === cat)) && r.name.toLowerCase().includes(q.toLowerCase()));
  if (open) {
    const rep = PR_REPORTS.find((r) => r.id === open);
    const data = prBuildReport(open, { fy, month, empId: empId || (emps[0] || {}).id });
    const exp = (f) => exportTableAs(f, rep.name.replace(/\W+/g, "_"), data.title, data.headers, data.rows);
    const ecr = () => {
      const run = getPayRuns().find((r) => r.month === month && r.status !== "draft");
      if (!run) {
        toast.error("No approved run for this month");
        return;
      }
      const lines = run.rows.filter((r) => r.pfEmp > 0).map((r) => {
        const e = emps.find((y) => y.id === r.empId) || {};
        const cap = prPfCeiling(month, prSettings());
        const epsW = Math.min(r.pfWage, cap);
        return [e.uan || "", r.name, Math.round(r.gross), Math.round(r.pfWage), Math.round(epsW), Math.round(epsW), r.pfEmp, r.eps, r.epfDiff, r.lopDays, 0].join("#~#");
      });
      prDownload(`ECR_${month}.txt`, lines.join("\n"), "text/plain");
      toast.info("ECR text downloaded \u2014 validate it on the EPFO portal before upload");
    };
    return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(PrHead, { title: data.title }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: () => setOpen(null) }, "\u2190 Reports"), rep.needs === "fy" && /* @__PURE__ */ React.createElement(FyPicker, { value: fy, onChange: setFy }), rep.needs === "month" && /* @__PURE__ */ React.createElement("input", { type: "month", className: "field-input", style: { width: 160 }, value: month, onChange: (e) => setMonth(e.target.value) }), rep.needs === "emp" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(FyPicker, { value: fy, onChange: setFy }), /* @__PURE__ */ React.createElement("select", { className: "field-input", style: { width: 200 }, value: empId || (emps[0] || {}).id || "", onChange: (e) => setEmpId(e.target.value) }, emps.map((e) => /* @__PURE__ */ React.createElement("option", { key: e.id, value: e.id }, e.name)))), open === "epf" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-primary", onClick: ecr }, "Download ECR"), open === "esi" && /* @__PURE__ */ React.createElement(InfoNote, null, "ESIC portal upload: use these figures in the monthly contribution template."), /* @__PURE__ */ React.createElement(ExportMenu, { onExport: exp, disabled: !data.rows.length })), data.rows.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "No data for this selection." }) : /* @__PURE__ */ React.createElement(Wrap, { min: Math.max(700, data.headers.length * 110) }, /* @__PURE__ */ React.createElement(HeadRow, null, data.headers.map((h, i) => /* @__PURE__ */ React.createElement("th", { key: i, style: i > 1 ? thR : th }, h))), /* @__PURE__ */ React.createElement("tbody", null, data.rows.map((r, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: "1px solid var(--border)" } }, r.map((c, j) => /* @__PURE__ */ React.createElement("td", { key: j, style: j > 1 ? tdR : td }, c)))))));
  }
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(PrHead, { title: "Reports centre", sub: `${PR_REPORTS.length} payroll reports` }, /* @__PURE__ */ React.createElement("input", { className: "field-input", style: { width: 260 }, placeholder: "Search reports\u2026", value: q, onChange: (e) => setQ(e.target.value) })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 } }, ["All", "Favorites", ...cats].map((c) => /* @__PURE__ */ React.createElement("button", { key: c, className: "btn btn-sm " + (cat === c ? "btn-primary" : "btn-outline"), onClick: () => setCat(c) }, c))), /* @__PURE__ */ React.createElement(Wrap, { min: 640 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Report name"), /* @__PURE__ */ React.createElement("th", { style: th }, "Category"), /* @__PURE__ */ React.createElement("th", { style: th }, "Created by")), /* @__PURE__ */ React.createElement("tbody", null, list.map((r) => /* @__PURE__ */ React.createElement("tr", { key: r.id, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement("span", { style: { cursor: "pointer", marginRight: 8, color: fav.includes(r.id) ? "#E69A12" : "var(--text3)" }, onClick: () => toggleFav(r.id) }, fav.includes(r.id) ? "\u2605" : "\u2606"), /* @__PURE__ */ React.createElement("span", { style: { color: "var(--primary2)", fontWeight: 600, cursor: "pointer" }, onClick: () => setOpen(r.id) }, r.name)), /* @__PURE__ */ React.createElement("td", { style: td }, r.cat), /* @__PURE__ */ React.createElement("td", { style: td }, "System generated"))))));
};
const PayrollSettings = ({ currentUser }) => {
  const [tab, setTab] = useState("org");
  const [s, setS] = useState(prSettings());
  const [dirty, setDirty] = useState(false);
  const up = (k, v) => {
    setS((x) => ({ ...x, [k]: v }));
    setDirty(true);
  };
  const save = () => {
    S.set(SK.PR_SET, s);
    setDirty(false);
    toast.success("Payroll settings saved");
  };
  const chips = (k) => /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 } }, s[k].map((d) => /* @__PURE__ */ React.createElement("span", { key: d, className: "badge badge-blue", style: { cursor: "pointer" }, title: "Click to remove", onClick: () => up(k, s[k].filter((x) => x !== d)) }, d, " \u2715"))), /* @__PURE__ */ React.createElement("form", { onSubmit: (e) => e.preventDefault(), style: { display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement("input", { id: "chip_" + k, className: "field-input", style: { maxWidth: 260 }, placeholder: "Add new\u2026", onKeyDown: (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      up(k, [...s[k], e.target.value.trim()]);
      e.target.value = "";
    }
  } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text3)", alignSelf: "center" } }, "press Enter to add")));
  const ptSlabs = (PR_PT_STATES[s.ptState] || {}).custom ? s.ptCustom || [] : (PR_PT_STATES[s.ptState] || {}).slabs || [];
  return /* @__PURE__ */ React.createElement(PrSetCtx.Provider, { value: { s, up } }, /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(PrHead, { title: "Payroll settings" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", disabled: !dirty, onClick: save }, "Save settings")), /* @__PURE__ */ React.createElement(TabBar, { value: tab, onChange: setTab, tabs: [["org", "Organisation"], ["stat", "Statutory components"], ["sal", "Salary & pay schedule"], ["pt", "Professional tax"], ["lists", "Departments & designations"]] }), tab === "org" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(PrF, { label: "Company PAN", k: "pan" }), /* @__PURE__ */ React.createElement(PrF, { label: "TAN (for TDS / 24Q)", k: "tan" }), /* @__PURE__ */ React.createElement(PrF, { label: "PF establishment code", k: "pfCode" }), /* @__PURE__ */ React.createElement(PrF, { label: "ESI code", k: "esiCode" }), /* @__PURE__ */ React.createElement(PrF, { label: "PT registration no.", k: "ptRegNo" })), /* @__PURE__ */ React.createElement("div", { className: "field", style: { maxWidth: 260 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Professional tax state"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: s.ptState, onChange: (e) => up("ptState", e.target.value) }, Object.keys(PR_PT_STATES).map((k) => /* @__PURE__ */ React.createElement("option", { key: k }, k))))), tab === "stat" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 14 } }, /* @__PURE__ */ React.createElement(PrTg, { k: "pfOn", label: "Employees\u2019 Provident Fund", sub: "12% employee + 12% employer. Wage ceiling \u20B925,000 from 17-Sep-2026 (\u20B915,000 earlier) \u2014 applied automatically by month." }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(PrF, { label: "PF rate %", k: "pfRate", type: "number", w: "0 1 100px" }), /* @__PURE__ */ React.createElement(PrF, { label: "Ceiling override \u20B9", k: "pfCeilingOverride", type: "number", w: "0 1 150px", ph: "auto" })), /* @__PURE__ */ React.createElement(PrTg, { k: "applyFiftyRule", label: "Apply the 50% \u201Cwages\u201D rule", sub: "New Labour Codes (21-Nov-2025): PF wage = higher of Basic or 50% of remuneration." }), /* @__PURE__ */ React.createElement(PrTg, { k: "adminOn", label: "Employer admin charges", sub: "Added to employer cost" }), /* @__PURE__ */ React.createElement(PrTg, { k: "edliOn", label: "EDLI contribution", sub: "Added to employer cost" })), /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 14 } }, /* @__PURE__ */ React.createElement(PrTg, { k: "esiOn", label: "Employees\u2019 State Insurance", sub: "Applies when fixed monthly gross is within the ceiling." }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(PrF, { label: "Employee %", k: "esiEmpRate", type: "number", w: "0 1 110px" }), /* @__PURE__ */ React.createElement(PrF, { label: "Employer %", k: "esiErRate", type: "number", w: "0 1 110px" }), /* @__PURE__ */ React.createElement(PrF, { label: "Gross ceiling \u20B9", k: "esiCeiling", type: "number", w: "0 1 130px" }))), /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 14 } }, /* @__PURE__ */ React.createElement(PrTg, { k: "ptOn", label: "Professional tax", sub: "State slab set under the Professional tax tab." }), /* @__PURE__ */ React.createElement(PrTg, { k: "tdsOn", label: "Income-tax TDS on salary (192)", sub: "Projected annual tax (FY 2026-27 slabs, 4% cess, 87A rebate) spread over the remaining months. No surcharge / marginal relief." })))), tab === "sal" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(PrF, { label: "Basic % of gross (Auto-split)", k: "basicPct", type: "number", w: "0 1 200px", hint: "Labour Codes need \u2265 50% for PF/gratuity wages" }), /* @__PURE__ */ React.createElement(PrF, { label: "HRA % of basic (Auto-split)", k: "hraPct", type: "number", w: "0 1 200px" })), /* @__PURE__ */ React.createElement("div", { className: "field", style: { maxWidth: 300 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Days in a month for pay"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: s.daysBasis, onChange: (e) => up("daysBasis", e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "calendar" }, "Actual calendar days"), /* @__PURE__ */ React.createElement("option", { value: "26" }, "26 working days"), /* @__PURE__ */ React.createElement("option", { value: "30" }, "30 days")))), tab === "pt" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(InfoNote, null, "Slabs for ", /* @__PURE__ */ React.createElement("b", null, s.ptState), ". ", s.ptState === "Karnataka" ? "\u20B9200 per month for gross \u2265 \u20B925,000, \u20B9300 in February (\u20B92,500 a year). " : "", "Verify against your state notification \u2014 switch the state to \u201CCustom\u201D to enter your own slabs."), /* @__PURE__ */ React.createElement(Wrap, { min: 420 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: thR }, "Monthly gross from"), /* @__PURE__ */ React.createElement("th", { style: thR }, "to"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Tax per month")), /* @__PURE__ */ React.createElement("tbody", null, ptSlabs.map((x, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: "1px solid var(--border)" } }, s.ptState === "Custom" ? [["from"], ["to"], ["amt"]].map(([k]) => /* @__PURE__ */ React.createElement("td", { key: k, style: tdR }, /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { width: 110, textAlign: "right" }, value: x[k], onChange: (e) => {
    const n = [...s.ptCustom];
    n[i] = { ...n[i], [k]: parseFloat(e.target.value) || 0 };
    up("ptCustom", n);
  } }))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(x.from)), /* @__PURE__ */ React.createElement("td", { style: tdR }, x.to >= 1e8 ? "and above" : fmtN(x.to)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(x.amt))))))), s.ptState === "Custom" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", style: { marginTop: 8 }, onClick: () => up("ptCustom", [...s.ptCustom || [], { from: 0, to: 99999999, amt: 0 }]) }, "+ Add slab")), tab === "lists" && /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 18 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, marginBottom: 8 } }, "Departments"), chips("departments")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, marginBottom: 8 } }, "Designations"), chips("designations")))));
};
const KpiStrip = ({ items }) => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 0, flexWrap: "wrap", border: "1px solid var(--border)", borderRadius: 12, background: "var(--card2)", marginBottom: 14, overflow: "hidden" } }, items.map((k, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { flex: "1 1 170px", padding: "12px 16px", borderRight: i < items.length - 1 ? "1px solid var(--border)" : "none" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", fontWeight: 600 } }, k.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 17, fontWeight: 800, fontFamily: "Sora,sans-serif", color: k.color || "var(--text)", marginTop: 2 } }, k.value))));
const getPaymentRows = (kind) => {
  const invByNo = {};
  S.get(SK.INV, []).forEach((i) => {
    invByNo[i.invNo] = i;
  });
  const expById = {};
  S.get(SK.EXP, []).forEach((e) => {
    expById[e.id] = e;
  });
  const qs = {};
  S.get(SK.QSALE, []).forEach((q) => {
    qs[q.id] = q;
  });
  const accts = S.get(SK.BANK_ACCTS, []) || [];
  const out = [];
  (S.get(SK.BANK, []) || []).forEach((t) => {
    if (!t.matched) return;
    const isIn = t.type === "credit";
    if (kind === "recv" !== isIn) return;
    const allocs = Array.isArray(t.allocs) ? t.allocs : [];
    let party = "", docs = [], used = 0;
    allocs.forEach((a) => {
      var _a, _b, _c, _d;
      used += parseFloat(a.amt) || 0;
      if (a.kind === "invoice" || a.kind === "creditnote") {
        docs.push(a.ref);
        if (!party) party = ((_b = (_a = invByNo[a.ref]) == null ? void 0 : _a.billTo) == null ? void 0 : _b.name) || "";
      } else if (a.kind === "quicksale") {
        docs.push(((_c = qs[a.ref]) == null ? void 0 : _c.invNo) || a.ref);
        if (!party) party = ((_d = qs[a.ref]) == null ? void 0 : _d.customer) || "";
      } else if (a.kind === "expense") {
        const e = expById[a.ref];
        docs.push((e == null ? void 0 : e.billNo) || a.ref);
        if (!party) party = (e == null ? void 0 : e.vendor) || "";
      } else if (a.kind === "suprefund") {
        party = a.ref;
        docs.push("Refund");
      }
    });
    if (!party && t.advParty) party = t.advParty;
    const isAdv = t.matchedType === "ledger" && (t.ledgerKey === "CUSTOMER_ADVANCE" || t.ledgerKey === "ADVANCES");
    if (!allocs.length && !isAdv) return;
    const acct = (accts.find((a) => a.id === t.acctId) || {}).name || "Bank";
    out.push({ id: t.id, date: t.date, no: t.txnRefNo || t.refNo || "", ref: t.refNo || "", party: party || (isAdv ? "(advance \u2014 party not tagged)" : ""), docs: docs.join(", ") || (isAdv ? "Advance" : ""), mode: "Bank Transfer", acct, amount: parseFloat(t.amount) || 0, unused: isAdv ? parseFloat(t.amount) || 0 : Math.max(0, r2((parseFloat(t.amount) || 0) - used)) });
  });
  return out.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
};
const PaymentsRegisterPage = ({ kind }) => {
  const [q, setQ] = useState("");
  const rows = useMemo(() => getPaymentRows(kind), [kind]);
  const isIn = kind === "recv";
  const shown = rows.filter((r) => `${r.party} ${r.docs} ${r.ref} ${r.no}`.toLowerCase().includes(q.toLowerCase()));
  const tot = shown.reduce((s, r) => s + r.amount, 0), unused = shown.reduce((s, r) => s + r.unused, 0);
  const doExport = (f) => exportTableAs(f, isIn ? "Payments_Received" : "Payments_Made", isIn ? "Payments Received" : "Payments Made", ["Date", "Payment #", "Reference", "Party", isIn ? "Invoice #" : "Bill #", "Mode", "Account", "Amount", "Unused amount"], shown.map((r) => [fmtDate(r.date), r.no, r.ref, r.party, r.docs, r.mode, r.acct, fmtN(r.amount), fmtN(r.unused)]));
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(PrHead, { title: isIn ? "All received payments" : "All payments made", sub: `${shown.length} payments \xB7 created when you match bank lines in Bank Reconciliation` }, /* @__PURE__ */ React.createElement("input", { className: "field-input", style: { width: 240 }, placeholder: "Search party, invoice, reference\u2026", value: q, onChange: (e) => setQ(e.target.value) }), /* @__PURE__ */ React.createElement(ExportMenu, { onExport: doExport, disabled: !shown.length })), /* @__PURE__ */ React.createElement(KpiStrip, { items: [{ label: isIn ? "Total received" : "Total paid", value: fmt(tot), color: isIn ? "var(--green)" : "var(--red)" }, { label: "Payments", value: String(shown.length) }, { label: isIn ? "Unused (advances)" : "Unapplied (advances)", value: fmt(unused), color: "var(--gold)" }] }), shown.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "No payments yet. Match a bank line to an invoice or bill and it appears here." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 960 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Date"), /* @__PURE__ */ React.createElement("th", { style: th }, "Payment #"), /* @__PURE__ */ React.createElement("th", { style: th }, "Reference"), /* @__PURE__ */ React.createElement("th", { style: th }, isIn ? "Customer" : "Vendor"), /* @__PURE__ */ React.createElement("th", { style: th }, isIn ? "Invoice #" : "Bill #"), /* @__PURE__ */ React.createElement("th", { style: th }, "Mode"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Amount"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Unused")), /* @__PURE__ */ React.createElement("tbody", null, shown.map((r) => /* @__PURE__ */ React.createElement("tr", { key: r.id, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, fmtDate(r.date)), /* @__PURE__ */ React.createElement("td", { style: { ...td, color: "var(--primary2)", fontWeight: 600 } }, r.no || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: td }, r.ref), /* @__PURE__ */ React.createElement("td", { style: td }, r.party), /* @__PURE__ */ React.createElement("td", { style: td }, r.docs), /* @__PURE__ */ React.createElement("td", { style: td }, r.mode, " ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10.5, color: "var(--text3)" } }, "\xB7 ", r.acct)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700 } }, fmt(r.amount)), /* @__PURE__ */ React.createElement("td", { style: tdR }, r.unused > 0.01 ? fmt(r.unused) : "\u2014"))))));
};
const getVendorList = () => {
  const exps = S.get(SK.EXP, []) || [];
  const m = {};
  exps.forEach((e) => {
    const n = (e.vendor || "").trim();
    if (!n) return;
    const v = m[n] = m[n] || { name: n, gstin: e.vendorGstin || "", bills: 0, billed: 0, due: 0, overdue: 0 };
    v.bills++;
    v.billed += expTotal(e);
    const d = expDue(e);
    v.due += d;
    if (d > 0.01 && expDueDate(e) < today()) v.overdue += d;
    if (!v.gstin && e.vendorGstin) v.gstin = e.vendorGstin;
  });
  return Object.values(m).sort((a, b) => b.due - a.due || a.name.localeCompare(b.name));
};
const VendorsPage = ({ go }) => {
  const [q, setQ] = useState("");
  const list = getVendorList().filter((v) => v.name.toLowerCase().includes(q.toLowerCase()));
  const doExport = (f) => exportTableAs(f, "Vendors", "Vendors", ["Vendor", "GSTIN", "Bills", "Billed", "Outstanding payable", "Overdue"], list.map((v) => [v.name, v.gstin, v.bills, fmtN(v.billed), fmtN(v.due), fmtN(v.overdue)]));
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(PrHead, { title: "All vendors", sub: "Built from your purchase bills" }, /* @__PURE__ */ React.createElement("input", { className: "field-input", style: { width: 240 }, placeholder: "Search vendors\u2026", value: q, onChange: (e) => setQ(e.target.value) }), /* @__PURE__ */ React.createElement(ExportMenu, { onExport: doExport, disabled: !list.length }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => go("expenses") }, "+ New bill")), /* @__PURE__ */ React.createElement(KpiStrip, { items: [{ label: "Vendors", value: String(list.length) }, { label: "Total outstanding payables", value: fmt(list.reduce((s, v) => s + v.due, 0)), color: "var(--red)" }, { label: "Overdue", value: fmt(list.reduce((s, v) => s + v.overdue, 0)), color: "var(--gold)" }] }), list.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "No vendors yet \u2014 they appear as you record purchase bills." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 820 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Name"), /* @__PURE__ */ React.createElement("th", { style: th }, "GSTIN"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Bills"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Billed"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Outstanding payables"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Overdue"), /* @__PURE__ */ React.createElement("th", { style: th })), /* @__PURE__ */ React.createElement("tbody", null, list.map((v) => /* @__PURE__ */ React.createElement("tr", { key: v.name, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 600, color: "var(--primary2)" } }, v.name), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontFamily: "monospace", fontSize: 11 } }, v.gstin), /* @__PURE__ */ React.createElement("td", { style: tdR }, v.bills), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(v.billed)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700 } }, fmt(v.due)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: v.overdue > 0 ? "var(--red)" : "inherit" } }, v.overdue > 0 ? fmt(v.overdue) : "\u2014"), /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => {
    try {
      sessionStorage.setItem("ab_stmt", JSON.stringify({ type: "vendor", party: v.name }));
    } catch (e) {
    }
    go("statements");
  } }, "Statement")))))));
};
const buildStatement = (type, party, from, to) => {
  const tx = [];
  const invs = (S.get(SK.INV, []) || []).filter((i) => {
    var _a, _b;
    return i.status !== "Draft" && i.status !== "Cancelled" && sameParty((_a = i.billTo) == null ? void 0 : _a.name, party) && String(((_b = i.billTo) == null ? void 0 : _b.name) || "").trim().toLowerCase() === String(party).trim().toLowerCase();
  });
  const bank = S.get(SK.BANK, []) || [];
  const invByNo = {};
  invs.forEach((i) => {
    invByNo[i.invNo] = i;
  });
  if (type === "customer") {
    invs.forEach((i) => {
      const g = getGrand(i);
      if (i.docType === "CREDIT NOTE") tx.push({ date: i.date, type: "Credit note", ref: i.invNo, dr: 0, cr: Math.abs(g) });
      else tx.push({ date: i.date, type: i.docType === "DEBIT NOTE" ? "Debit note" : "Invoice", ref: i.invNo, dr: Math.abs(g), cr: 0 });
    });
    bank.forEach((t) => {
      if (!t.matched) return;
      const allocs = Array.isArray(t.allocs) ? t.allocs : [];
      allocs.forEach((a) => {
        if (a.kind === "invoice" && invByNo[a.ref]) tx.push({ date: t.date, type: "Payment received", ref: t.refNo || t.txnRefNo || "", dr: 0, cr: parseFloat(a.amt) || 0 });
        if (a.kind === "creditnote" && invByNo[a.ref]) tx.push({ date: t.date, type: "Refund paid", ref: t.refNo || "", dr: parseFloat(a.amt) || 0, cr: 0 });
      });
    });
    getAdvanceRows().filter((r) => r.kind === "customer" && sameParty(r.party, party)).forEach((r) => tx.push({ date: r.date, type: "Advance received", ref: r.ref, dr: 0, cr: r.amount }));
  } else {
    const exps = (S.get(SK.EXP, []) || []).filter((e) => String(e.vendor || "").trim().toLowerCase() === String(party).trim().toLowerCase());
    const byId = {};
    exps.forEach((e) => {
      byId[e.id] = e;
    });
    exps.forEach((e) => tx.push({ date: e.billDate || e.date, type: "Bill", ref: e.billNo || "", dr: 0, cr: expNetPayable(e) }));
    bank.forEach((t) => {
      if (!t.matched) return;
      (Array.isArray(t.allocs) ? t.allocs : []).forEach((a) => {
        if (a.kind === "expense" && byId[a.ref]) tx.push({ date: t.date, type: "Payment made", ref: t.refNo || "", dr: parseFloat(a.amt) || 0, cr: 0 });
        if (a.kind === "suprefund" && sameParty(a.ref, party)) tx.push({ date: t.date, type: "Refund received", ref: t.refNo || "", dr: 0, cr: parseFloat(a.amt) || 0 });
      });
    });
    getAdvanceRows().filter((r) => r.kind === "supplier" && sameParty(r.party, party)).forEach((r) => tx.push({ date: r.date, type: "Advance paid", ref: r.ref, dr: r.amount, cr: 0 }));
  }
  const sign = type === "customer" ? ((r) => r.dr - r.cr) : ((r) => r.cr - r.dr);
  const all = tx.filter((r) => r.date).sort((a, b) => a.date.localeCompare(b.date));
  const opening = all.filter((r) => r.date < from).reduce((s, r) => s + sign(r), 0);
  let bal = opening;
  const rows = all.filter((r) => r.date >= from && r.date <= to).map((r) => {
    bal = r2(bal + sign(r));
    return { ...r, bal };
  });
  const debits = rows.reduce((s, r) => s + r.dr, 0), credits = rows.reduce((s, r) => s + r.cr, 0);
  return { opening: r2(opening), rows, closing: r2(bal), debits: r2(debits), credits: r2(credits) };
};
const StatementsPage = ({ currentUser }) => {
  const pre = (() => {
    try {
      const x = JSON.parse(sessionStorage.getItem("ab_stmt") || "null");
      sessionStorage.removeItem("ab_stmt");
      return x;
    } catch (e) {
      return null;
    }
  })();
  const [type, setType] = useState(pre ? pre.type : "customer");
  const [party, setParty] = useState(pre ? pre.party : "");
  const [from, setFrom] = useState(fyStartOf(getFY()));
  const [to, setTo] = useState(today());
  const customers = [...new Set([...(S.get(SK.CUST, []) || []).map((c) => c.name), ...(S.get(SK.INV, []) || []).map((i) => {
    var _a;
    return (_a = i.billTo) == null ? void 0 : _a.name;
  })].filter(Boolean))].sort();
  const vendors = getVendorList().map((v) => v.name);
  const names = type === "customer" ? customers : vendors;
  const st = useMemo(() => party ? buildStatement(type, party, from, to) : null, [type, party, from, to]);
  const co = S.get(SK.CO, {}) || {};
  const doPrint = () => {
    const f = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const w = window.open("", "_blank");
    if (!w) {
      toast.error("Allow pop-ups to print");
      return;
    }
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Statement</title><style>body{font-family:Arial;padding:32px;font-size:12px;color:#1a1a2e}h2{margin:0}table{width:100%;border-collapse:collapse}th{background:#333;color:#fff;text-align:left;padding:7px}td{padding:6px 7px;border-bottom:1px solid #e4e4ee}.r{text-align:right}.sum{width:300px;margin:14px 0 14px auto}.sum td{border:none;padding:3px 7px}</style></head><body>
    <h2>${co.name || ""}</h2><div>${[co.address, co.city, co.state].filter(Boolean).join(", ")}<br>GSTIN ${co.gstin || ""}</div><h2 style="text-align:right">Statement of Accounts</h2><div style="text-align:right">${fmtDate(from)} to ${fmtDate(to)}</div>
    <p><b>To:</b> ${party}</p><table class="sum"><tr><td colspan=2 style="background:#eee"><b>Account summary</b></td></tr><tr><td>Opening balance</td><td class="r">\u20B9 ${f(st.opening)}</td></tr><tr><td>${type === "customer" ? "Invoiced amount" : "Billed amount"}</td><td class="r">\u20B9 ${f(type === "customer" ? st.debits : st.credits)}</td></tr><tr><td>${type === "customer" ? "Amount received" : "Amount paid"}</td><td class="r">\u20B9 ${f(type === "customer" ? st.credits : st.debits)}</td></tr><tr><td><b>Balance due</b></td><td class="r"><b>\u20B9 ${f(st.closing)}</b></td></tr></table>
    <table><tr><th>Date</th><th>Transactions</th><th>Details</th><th class="r">${type === "customer" ? "Amount" : "Billed"}</th><th class="r">${type === "customer" ? "Payments" : "Paid"}</th><th class="r">Balance</th></tr>
    <tr><td>${fmtDate(from)}</td><td>*** Opening balance ***</td><td></td><td></td><td></td><td class="r">${f(st.opening)}</td></tr>
    ${st.rows.map((r) => `<tr><td>${fmtDate(r.date)}</td><td>${r.type}</td><td>${r.ref || ""}</td><td class="r">${f(type === "customer" ? r.dr : r.cr)}</td><td class="r">${f(type === "customer" ? r.cr : r.dr)}</td><td class="r">${f(r.bal)}</td></tr>`).join("")}</table>
    <script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>`);
    w.document.close();
  };
  const doExport = (fm) => exportTableAs(fm, "Statement_" + party.replace(/\W+/g, "_"), `Statement of Accounts \u2014 ${party}`, ["Date", "Transaction", "Reference", "Debit", "Credit", "Balance"], [["", "Opening balance", "", "", "", fmtN(st.opening)], ...st.rows.map((r) => [fmtDate(r.date), r.type, r.ref, fmtN(r.dr), fmtN(r.cr), fmtN(r.bal)])]);
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(PrHead, { title: "Statement of accounts", sub: "Customer and vendor statements \u2014 print or send to the party" }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Statement for"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: type, onChange: (e) => {
    setType(e.target.value);
    setParty("");
  } }, /* @__PURE__ */ React.createElement("option", { value: "customer" }, "Customer"), /* @__PURE__ */ React.createElement("option", { value: "vendor" }, "Vendor"))), /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 0, minWidth: 260 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, type === "customer" ? "Customer" : "Vendor"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: party, onChange: (e) => setParty(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "\u2014 choose \u2014"), names.map((n) => /* @__PURE__ */ React.createElement("option", { key: n }, n)))), /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "From"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: from, onChange: (e) => setFrom(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "To"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: to, onChange: (e) => setTo(e.target.value) })), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), st && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(ExportMenu, { onExport: doExport }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: doPrint }, "Print / PDF"))), !st ? /* @__PURE__ */ React.createElement(Empty, { text: "Choose a party to see the statement." }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(KpiStrip, { items: [{ label: "Opening balance", value: fmt(st.opening) }, { label: type === "customer" ? "Invoiced" : "Billed", value: fmt(type === "customer" ? st.debits : st.credits) }, { label: type === "customer" ? "Received" : "Paid", value: fmt(type === "customer" ? st.credits : st.debits), color: "var(--green)" }, { label: "Balance due", value: fmt(st.closing), color: st.closing > 0 ? "var(--red)" : "var(--green)" }] }), /* @__PURE__ */ React.createElement(Wrap, { min: 760 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Date"), /* @__PURE__ */ React.createElement("th", { style: th }, "Transaction"), /* @__PURE__ */ React.createElement("th", { style: th }, "Details"), /* @__PURE__ */ React.createElement("th", { style: thR }, type === "customer" ? "Amount" : "Billed"), /* @__PURE__ */ React.createElement("th", { style: thR }, type === "customer" ? "Payments" : "Paid"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Balance")), /* @__PURE__ */ React.createElement("tbody", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, fmtDate(from)), /* @__PURE__ */ React.createElement("td", { style: td, colSpan: 4 }, /* @__PURE__ */ React.createElement("i", null, "*** Opening balance ***")), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(st.opening))), st.rows.map((r, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, fmtDate(r.date)), /* @__PURE__ */ React.createElement("td", { style: td }, r.type), /* @__PURE__ */ React.createElement("td", { style: td }, r.ref), /* @__PURE__ */ React.createElement("td", { style: tdR }, (type === "customer" ? r.dr : r.cr) ? fmt(type === "customer" ? r.dr : r.cr) : ""), /* @__PURE__ */ React.createElement("td", { style: tdR }, (type === "customer" ? r.cr : r.dr) ? fmt(type === "customer" ? r.cr : r.dr) : ""), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700 } }, fmt(r.bal))))))));
};
const gstSummary = (ym) => {
  const inRange = (d) => (d || "").slice(0, 7) === ym;
  let out = { taxable: 0, cgst: 0, sgst: 0, igst: 0 }, itc = { taxable: 0, cgst: 0, sgst: 0, igst: 0 }, nOut = 0, nIn = 0;
  (S.get(SK.INV, []) || []).filter((i) => i.status !== "Draft" && i.status !== "Cancelled" && inRange(i.date) && i.docType !== "NON GST INVOICE").forEach((i) => {
    const sg = i.docType === "CREDIT NOTE" ? -1 : 1;
    const gst = Math.abs(invGstAmt(i));
    const tx = Math.abs(getGrand(i)) - gst;
    nOut++;
    out.taxable += sg * tx;
    if (i.gstType === "INTER") out.igst += sg * gst;
    else {
      out.cgst += sg * gst / 2;
      out.sgst += sg * gst / 2;
    }
  });
  (S.get(SK.EXP, []) || []).filter((e) => inRange(e.billDate || e.date)).forEach((e) => {
    const its = expItems(e);
    const gst = its.reduce((s, i) => s + (parseFloat(i.gstAmt) || 0), 0);
    if (gst <= 0) return;
    nIn++;
    itc.taxable += its.reduce((s, i) => s + (parseFloat(i.taxable) || 0), 0);
    if (e.gstType === "INTER") itc.igst += gst;
    else {
      itc.cgst += gst / 2;
      itc.sgst += gst / 2;
    }
  });
  Object.keys(out).forEach((k) => {
    out[k] = r2(out[k]);
    itc[k] = r2(itc[k]);
  });
  return { out, itc, nOut, nIn, payable: { cgst: r2(out.cgst - itc.cgst), sgst: r2(out.sgst - itc.sgst), igst: r2(out.igst - itc.igst) } };
};
const GstFilingPage = ({ go }) => {
  const [ym, setYm] = useState(today().slice(0, 7));
  const co = S.get(SK.CO, {}) || {};
  const g = useMemo(() => gstSummary(ym), [ym]);
  const dn = /* @__PURE__ */ new Date();
  const due = (d) => {
    let x = new Date(+ym.slice(0, 4), +ym.slice(5, 7), d);
    return _iso(x);
  };
  const tot = g.payable.cgst + g.payable.sgst + g.payable.igst;
  const doExport = (f) => exportTableAs(f, "GSTR3B_" + ym, `GSTR-3B summary \u2014 ${prMonthLabel(ym)}`, ["Particulars", "Taxable value", "IGST", "CGST", "SGST"], [["Outward supplies (net of credit notes)", fmtN(g.out.taxable), fmtN(g.out.igst), fmtN(g.out.cgst), fmtN(g.out.sgst)], ["Eligible ITC (purchase bills)", fmtN(g.itc.taxable), fmtN(g.itc.igst), fmtN(g.itc.cgst), fmtN(g.itc.sgst)], ["Net tax payable", "", fmtN(g.payable.igst), fmtN(g.payable.cgst), fmtN(g.payable.sgst)]]);
  const Card = ({ title, desc, btn, onClick, tag }) => /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 18, display: "flex", alignItems: "center", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 15 } }, title, " ", tag && /* @__PURE__ */ React.createElement("span", { style: { color: "var(--red)" } }, tag)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: "var(--text3)", marginTop: 3 } }, desc)), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick }, btn));
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(PrHead, { title: "GST filing", sub: co.gstin ? `GSTIN ${co.gstin}` : "Add your GSTIN in Company Settings" }, /* @__PURE__ */ React.createElement("input", { type: "month", className: "field-input", style: { width: 160 }, value: ym, onChange: (e) => setYm(e.target.value) }), /* @__PURE__ */ React.createElement(ExportMenu, { onExport: doExport })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 12, marginBottom: 18 } }, /* @__PURE__ */ React.createElement(Card, { title: "Sales return", tag: "GSTR-1", desc: `${g.nOut} outward documents in ${prMonthLabel(ym)} \xB7 due ${fmtDate(due(11))} (monthly filers)`, btn: "Open GSTR-1 export", onClick: () => go("history") }), /* @__PURE__ */ React.createElement(Card, { title: "Purchase register", tag: "GSTR-2B reconciliation", desc: `${g.nIn} bills with input GST in ${prMonthLabel(ym)} \u2014 match against your GSTR-2B download`, btn: "Open purchase bills", onClick: () => go("expenses") })), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 15, margin: "6px 0 10px" } }, "GSTR-3B summary ", /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 500, color: "var(--text3)", fontSize: 12 } }, "\xB7 due ", fmtDate(due(20)))), /* @__PURE__ */ React.createElement(Wrap, { min: 720 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Particulars"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Taxable value"), /* @__PURE__ */ React.createElement("th", { style: thR }, "IGST"), /* @__PURE__ */ React.createElement("th", { style: thR }, "CGST"), /* @__PURE__ */ React.createElement("th", { style: thR }, "SGST")), /* @__PURE__ */ React.createElement("tbody", null, /* @__PURE__ */ React.createElement("tr", { style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, "3.1 Outward taxable supplies (net of credit notes)"), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(g.out.taxable)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(g.out.igst)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(g.out.cgst)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(g.out.sgst))), /* @__PURE__ */ React.createElement("tr", { style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, "4. Eligible input tax credit (from purchase bills)"), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(g.itc.taxable)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(g.itc.igst)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(g.itc.cgst)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(g.itc.sgst))), /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)", fontWeight: 800 } }, /* @__PURE__ */ React.createElement("td", { style: td }, "Net tax payable in cash / (carried forward)"), /* @__PURE__ */ React.createElement("td", { style: tdR }), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(g.payable.igst)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(g.payable.cgst)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(g.payable.sgst))))), /* @__PURE__ */ React.createElement(InfoNote, null, tot > 0 ? /* @__PURE__ */ React.createElement(React.Fragment, null, "Estimated net GST payable for the month: ", /* @__PURE__ */ React.createElement("b", null, fmt(tot)), ".") : /* @__PURE__ */ React.createElement(React.Fragment, null, "No net payable \u2014 the surplus credit carries forward."), " Cross-utilisation of IGST credit against CGST/SGST and reverse-charge items are not modelled here; always cross-check with the GST portal before filing."));
};
const BOOKS_REPORTS = [
  ["Profit and Loss", "Business Overview", "reports"],
  ["Balance Sheet", "Business Overview", "reports"],
  ["Cash Flow Statement", "Business Overview", "cashflow"],
  ["Business Performance Ratios", "Business Overview", "cashflow"],
  ["Budget vs Actual", "Business Overview", "budget"],
  ["Sales Register", "Sales", "history"],
  ["Customer Statement of Accounts", "Receivables", "statements"],
  ["Receivables Ageing", "Receivables", "aging"],
  ["Payments Received", "Receivables", "payrecv"],
  ["Vendor Statement of Accounts", "Payables", "statements"],
  ["Payables Ageing", "Payables", "aging"],
  ["Payments Made", "Payables", "paymade"],
  ["Vendor Balances", "Payables", "vendors"],
  ["Purchases and Expenses", "Purchases and Expenses", "expenses"],
  ["GSTR-3B Summary", "Taxes", "gstfiling"],
  ["GSTR-1 Export", "Taxes", "history"],
  ["General Ledger", "Accountant", "ledger"],
  ["Trial Balance", "Accountant", "trialbalance"],
  ["Journal Report", "Accountant", "journal"],
  ["Fixed Asset Schedule", "Accountant", "fixedassets"],
  ["Foreign Exchange Gain/Loss", "Accountant", "fxpage"],
  ["Recurring Journals", "Accountant", "recjournal"],
  ["Advance & Credit Note Application", "Accountant", "advances"],
  ["Bank Reconciliation", "Banking", "bankrecon"],
  ["Stock Summary", "Inventory", "inventory"],
  ["Payroll Summary", "Payroll", "pr_reports"],
  ["Salary Register", "Payroll", "pr_reports"],
  ["EPF / ESI / PT / TDS Reports", "Payroll", "pr_reports"]
];
const ReportsCenterPage = ({ go }) => {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [fav, setFav] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ab_fav_reports") || "[]");
    } catch (e) {
      return [];
    }
  });
  const toggle = (n) => {
    const x = fav.includes(n) ? fav.filter((y) => y !== n) : [...fav, n];
    setFav(x);
    try {
      localStorage.setItem("ab_fav_reports", JSON.stringify(x));
    } catch (e) {
    }
  };
  const cats = [...new Set(BOOKS_REPORTS.map((r) => r[1]))];
  const list = BOOKS_REPORTS.filter((r) => (cat === "All" || (cat === "Favorites" ? fav.includes(r[0]) : r[1] === cat)) && r[0].toLowerCase().includes(q.toLowerCase()));
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(PrHead, { title: "Reports centre", sub: `${BOOKS_REPORTS.length} reports across Books and Payroll` }, /* @__PURE__ */ React.createElement("input", { className: "field-input", style: { width: 280 }, placeholder: "Search reports\u2026", value: q, onChange: (e) => setQ(e.target.value) })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 } }, ["All", "Favorites", ...cats].map((c) => /* @__PURE__ */ React.createElement("button", { key: c, className: "btn btn-sm " + (cat === c ? "btn-primary" : "btn-outline"), onClick: () => setCat(c) }, c))), /* @__PURE__ */ React.createElement(Wrap, { min: 640 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Report name"), /* @__PURE__ */ React.createElement("th", { style: th }, "Report category"), /* @__PURE__ */ React.createElement("th", { style: th }, "Created by")), /* @__PURE__ */ React.createElement("tbody", null, list.map((r) => /* @__PURE__ */ React.createElement("tr", { key: r[0], style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement("span", { style: { cursor: "pointer", marginRight: 8, color: fav.includes(r[0]) ? "#E69A12" : "var(--text3)" }, onClick: () => toggle(r[0]) }, fav.includes(r[0]) ? "\u2605" : "\u2606"), /* @__PURE__ */ React.createElement("span", { style: { color: "var(--primary2)", fontWeight: 600, cursor: "pointer" }, onClick: () => go(r[2]) }, r[0])), /* @__PURE__ */ React.createElement("td", { style: td }, r[1]), /* @__PURE__ */ React.createElement("td", { style: td }, "System generated"))))));
};
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
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "sidebar-section-label" }, "Main"), /* @__PURE__ */ React.createElement(NavItem, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "chart", s: 17 }), label: "Home", onClick: () => go("dashboard"), active: page === "dashboard", badge: overdueCount > 0 ? overdueCount : null, badgeCls: "red" }), (canSee2(user.role, "inventory") || canSee2(user.role, "company")) && /* @__PURE__ */ React.createElement(NavGroup, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "tag", s: 17 }), label: "Items", page, childKeys: ["products", "hsn"] }, canSee2(user.role, "inventory") && N({ ic: "tag", label: "Product Master", pg: "products" }), canSee2(user.role, "company") && N({ ic: "tag", label: "HSN / SAC", pg: "hsn" })), canSee2(user.role, "inventory") && /* @__PURE__ */ React.createElement(NavGroup, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "package", s: 17 }), label: "Inventory", page, childKeys: ["inventory"] }, [["package", "Stock Summary", "summary"], ["clock", "Inventory Ageing", "ageing"], ["chart", "Product-wise Movement", "product"], ["cart", "Bill-wise (Purchases)", "purchdoc"], ["receipt", "Invoice-wise (Sales)", "salesdoc"], ["file", "All Documents In / Out", "alldoc"], ["dollar", "Valuation & Slow Moving", "valuation"], ["list", "Full Stock Ledger", "log"]].map(([ic, l, v]) => /* @__PURE__ */ React.createElement(NavItem, { key: v, icon: /* @__PURE__ */ React.createElement(Ic, { n: ic, s: 14 }), label: l, onClick: () => {
    go("inventory");
    setInvView(v);
  }, active: page === "inventory" && invView === v }))), /* @__PURE__ */ React.createElement(NavGroup, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "cart", s: 17 }), label: "Sales", page, childKeys: ["salesorders", "ewaybill", "customers", "quotations", "invoice", "history", "recurring", "dc", "payrecv", "reminders", "salesview", "invview"] }, canSee2(user.role, "customers") && N({ ic: "users", label: "Customers", pg: "customers" }), canSee2(user.role, "quotations") && N({ ic: "file", label: "Quotes", pg: "quotations" }), canSee2(user.role, "quotations") && N({ ic: "file", label: "Sales Orders", pg: "salesorders" }), N({ ic: "plus", label: "New Invoice", pg: "invoice" }), /* @__PURE__ */ React.createElement(NavItem, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "history", s: 14 }), label: "Invoices", onClick: () => go("history"), active: page === "history" && !modal, badge: invCount > 0 ? invCount : null }), canSee2(user.role, "recurring") && N({ ic: "refresh", label: "Recurring Invoices", pg: "recurring" }), canSee2(user.role, "dc") && N({ ic: "package", label: "Delivery Challans", pg: "dc" }), acct && N({ ic: "dollar", label: "Payments Received", pg: "payrecv" }), acct && N({ ic: "package", label: "e-Way Bills", pg: "ewaybill" }), canSee2(user.role, "reminders") && N({ ic: "alert", label: "Payment Reminders", pg: "reminders" }), canSee2(user.role, "salesview") && N({ ic: "chart", label: "Sales Summary", pg: "salesview" })), (acct || canSee2(user.role, "expenses") || canSee2(user.role, "pohistory")) && /* @__PURE__ */ React.createElement(NavGroup, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "receipt", s: 17 }), label: "Purchases", page, childKeys: ["vendors", "expenses", "pohistory", "paymade", "recbills", "vendorcredits"] }, acct && N({ ic: "users", label: "Vendors", pg: "vendors" }), canSee2(user.role, "expenses") && N({ ic: "receipt", label: "Bills & Expenses", pg: "expenses" }), canSee2(user.role, "pohistory") && /* @__PURE__ */ React.createElement(NavItem, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "cart", s: 14 }), label: "Purchase Orders", onClick: () => go("pohistory"), active: page === "pohistory" && !modal, badge: poCount > 0 ? poCount : null, badgeCls: "gold" }), acct && N({ ic: "dollar", label: "Payments Made", pg: "paymade" }), acct && N({ ic: "receipt", label: "Recurring Bills", pg: "recbills" }), acct && N({ ic: "file", label: "Vendor Credits", pg: "vendorcredits" })), canSee2(user.role, "bankrecon") && /* @__PURE__ */ React.createElement(NavGroup, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "bank", s: 17 }), label: "Banking", page, childKeys: ["bankoverview", "bankrecon"] }, acct && N({ ic: "chart", label: "Overview", pg: "bankoverview" }), N({ ic: "bank", label: "Reconciliation & Transactions", pg: "bankrecon" })), acct && /* @__PURE__ */ React.createElement(NavGroup, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "shield", s: 17 }), label: "Filing & Compliance", page, childKeys: ["gstfiling"] }, N({ ic: "file", label: "GST Filing", pg: "gstfiling" })), acct && /* @__PURE__ */ React.createElement(NavGroup, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "users", s: 17 }), label: "Accountant", page, childKeys: ["journal", "coa", "recjournal", "fixedassets", "advances", "fxpage", "budget", "ledger", "trialbalance", "txnlock"] }, N({ ic: "file", label: "Manual Journals", pg: "journal" }), N({ ic: "history", label: "Recurring Journals", pg: "recjournal" }), N({ ic: "list", label: "Chart of Accounts", pg: "coa" }), N({ ic: "dollar", label: "Fixed Assets", pg: "fixedassets" }), N({ ic: "file", label: "Advance Application", pg: "advances" }), N({ ic: "dollar", label: "Multi-Currency (FX)", pg: "fxpage" }), N({ ic: "list", label: "Budgets", pg: "budget" }), N({ ic: "history", label: "General Ledger", pg: "ledger" }), N({ ic: "dollar", label: "Trial Balance", pg: "trialbalance" }), N({ ic: "shield", label: "Transaction Locking", pg: "txnlock" })), acct && /* @__PURE__ */ React.createElement(NavGroup, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "chart", s: 17 }), label: "Reports", page, childKeys: ["overview", "morereports", "reportscenter", "reports", "cashflow", "statements"] }, N({ ic: "chart", label: "Business Overview", pg: "overview" }), N({ ic: "list", label: "Reports Centre", pg: "reportscenter" }), N({ ic: "list", label: "More Reports", pg: "morereports" }), N({ ic: "chart", label: "Financial Statements", pg: "reports" }), N({ ic: "chart", label: "Cash Flow & Ratios", pg: "cashflow" }), N({ ic: "file", label: "Statement of Accounts", pg: "statements" })), acct && /* @__PURE__ */ React.createElement(NavGroup, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "clock", s: 17 }), label: "Time Tracking", page, childKeys: ["timetrack"] }, N({ ic: "clock", label: "Projects & Timesheet", pg: "timetrack" })), canSee2(user.role, "aging") && /* @__PURE__ */ React.createElement(NavGroup, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "clock", s: 17 }), label: "Ageing & Outstanding", page, childKeys: ["aging"] }, [["chart", "Summary", "summary"], ["users", "Trade Receivables", "ar"], ["receipt", "Receivables \u2014 Bill-wise", "arbill"], ["cart", "Trade Payables", "ap"], ["file", "Payables \u2014 Bill-wise", "apbill"]].map(([ic, l, v]) => /* @__PURE__ */ React.createElement(NavItem, { key: v, icon: /* @__PURE__ */ React.createElement(Ic, { n: ic, s: 14 }), label: l, onClick: () => {
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
