const PageShell = ({ children }) => /* @__PURE__ */ React.createElement("div", { className: "inline-card" }, /* @__PURE__ */ React.createElement("div", { className: "inline-card-inner" }, /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, children)));
const Kpi = ({ label, value, color, sub }) => /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: "12px 14px", flex: "1 1 170px", minWidth: 150 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10.5, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px" } }, label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 19, fontWeight: 800, color: color || "var(--text)", marginTop: 4, fontFamily: "Sora,sans-serif" } }, value), sub && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", marginTop: 2 } }, sub));
const InfoNote = ({ children, tone }) => /* @__PURE__ */ React.createElement("div", { className: "alert", style: { background: tone === "warn" ? "rgba(241,73,92,0.07)" : "rgba(79,111,232,0.06)", border: `1px solid ${tone === "warn" ? "rgba(241,73,92,0.25)" : "rgba(79,111,232,0.2)"}`, borderRadius: 10, fontSize: 12, marginBottom: 14 } }, children);
const isAdminUser = (u) => (u == null ? void 0 : u.role) === "admin" || (u == null ? void 0 : u.role) === "superadmin";
const FyPicker = ({ value, onChange }) => /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Financial Year"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value, onChange: (e) => onChange(parseInt(e.target.value, 10)) }, [0, 1, 2, 3, 4, 5].map((k) => getFY() - k).map((y) => /* @__PURE__ */ React.createElement("option", { key: y, value: y }, "FY ", y, "-", String(y + 1).slice(2)))));
const LedgerSelect = ({ value, onChange, extra = [], style }) => {
  const opts = [...getPaymentLedgers().map((a) => [a.key, a.name]), ...extra];
  return /* @__PURE__ */ React.createElement("select", { className: "field-input", style, value, onChange: (e) => onChange(e.target.value) }, opts.map(([k, l]) => /* @__PURE__ */ React.createElement("option", { key: k, value: k }, l)));
};
const blankAsset = () => ({ id: newId("FA"), code: "", name: "", category: "Office Equipment", mode: "new", purchaseDate: today(), depFrom: "", cost: "", salvage: "", method: "SLM", lifeYears: 5, rate: 15, accDepBF: "", paidFromKey: "TRADE_PAYABLE", billId: "", location: "", serial: "", notes: "" });
const FixedAssetsPage = ({ currentUser }) => {
  const [list, setList] = useState(getAssets());
  const [tab, setTab] = useState("register");
  const [form, setForm] = useState(null);
  const [dispose, setDispose] = useState(null);
  const [selId, setSelId] = useState(null);
  const [selFY, setSelFY] = useState(getFY());
  const isAdmin = isAdminUser(currentUser);
  const from = fyStartOf(selFY), fyEnd = fyEndOf(selFY), to = fyEnd < today() ? fyEnd : today();
  const reload = () => setList(getAssets());
  const rows = useMemo(() => list.map((a) => faPeriodRow(a, from, to)).filter(Boolean), [list, selFY]);
  const tot = rows.reduce((t, r) => ({ gOpen: t.gOpen + r.grossOpen, add: t.add + r.additions, dis: t.dis + r.grossDisp, gClose: t.gClose + r.grossClose, aOpen: t.aOpen + r.accOpen, dep: t.dep + r.depYear, aDis: t.aDis + r.accDisp, aClose: t.aClose + r.accClose, net: t.net + r.netClose, netO: t.netO + r.netOpen }), { gOpen: 0, add: 0, dis: 0, gClose: 0, aOpen: 0, dep: 0, aDis: 0, aClose: 0, net: 0, netO: 0 });
  const bills = S.get(SK.EXP, []) || [];
  const startAdd = () => setForm(blankAsset());
  const preset = (name) => {
    const p = FA_PRESETS.find((x) => x.name === name);
    setForm((f) => ({ ...f, category: name, ...p ? { lifeYears: p.life, rate: p.rate } : {} }));
  };
  const pickBill = (id) => {
    const b = bills.find((x) => x.id === id);
    if (!b) {
      setForm((f) => ({ ...f, billId: "" }));
      return;
    }
    const its = expItems(b);
    const taxable = its.reduce((s, i) => s + (parseFloat(i.taxable) || 0), 0);
    setForm((f) => ({ ...f, billId: id, name: f.name || its[0] && (its[0].product || its[0].desc) || b.vendor || "", cost: r2(taxable) || f.cost, purchaseDate: b.billDate || b.date || f.purchaseDate }));
  };
  const saveAsset = () => {
    const f = form;
    if (!f.name.trim()) {
      toast.error("Asset name is required");
      return;
    }
    const cost = parseFloat(f.cost) || 0;
    if (cost <= 0) {
      toast.error("Enter the cost of the asset");
      return;
    }
    if (!f.purchaseDate) {
      toast.error("Enter the purchase / in-service date");
      return;
    }
    const life = parseFloat(f.lifeYears) || 0, rate = parseFloat(f.rate) || 0, salv = parseFloat(f.salvage) || 0;
    if (f.method === "SLM" && life <= 0) {
      toast.error("Enter the useful life in years");
      return;
    }
    if (f.method === "WDV" && rate <= 0) {
      toast.error("Enter the WDV rate (% per year)");
      return;
    }
    if (salv >= cost) {
      toast.error("Salvage value must be less than cost");
      return;
    }
    if (f.mode === "opening" && (parseFloat(f.accDepBF) || 0) >= cost) {
      toast.error("Accumulated depreciation b/f must be less than cost");
      return;
    }
    const exists = list.find((x) => x.id === f.id);
    let code = f.code;
    if (!code) {
      let n = list.length + 1;
      code = "FA-" + String(n).padStart(4, "0");
      while (list.some((x) => x.code === code)) {
        n++;
        code = "FA-" + String(n).padStart(4, "0");
      }
    }
    const rec = { ...f, code, name: f.name.trim(), cost, salvage: salv, lifeYears: life, rate, accDepBF: parseFloat(f.accDepBF) || 0, depFrom: f.depFrom || f.purchaseDate, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    if (rec.mode === "new" && !rec.voucherNo) {
      rec.voucherNo = nextVoucherNo();
      rec.txnRefNo = nextTxnRefNo(rec.purchaseDate);
    }
    if (!exists) {
      rec.createdAt = (/* @__PURE__ */ new Date()).toISOString();
      rec.createdBy = (currentUser == null ? void 0 : currentUser.email) || "";
    }
    S.set(SK.FA, exists ? list.map((x) => x.id === f.id ? rec : x) : [...list, rec]);
    logAudit(exists ? "FIXED_ASSET_EDITED" : "FIXED_ASSET_ADDED", `${rec.code} ${rec.name} \u2014 ${fmt(cost)}`, currentUser);
    reload();
    setForm(null);
    toast.success(exists ? "Asset updated \u2014 depreciation journals recalculated" : "Asset added \u2014 monthly depreciation will post automatically");
  };
  const delAsset = (a) => {
    if (!isAdmin) {
      toast.error("Only Admin can delete an asset");
      return;
    }
    if (!window.confirm(`Delete ${a.code} \u2014 ${a.name}?

The purchase / opening entry and every depreciation journal this asset generated will disappear from the ledger.`)) return;
    S.set(SK.FA, list.filter((x) => x.id !== a.id));
    reload();
    if (selId === a.id) setSelId(null);
    logAudit("FIXED_ASSET_DELETED", `${a.code} ${a.name}`, currentUser);
    toast.info("Asset deleted");
  };
  const startDispose = (a) => setDispose({ a, date: today(), proceeds: "", receivedKey: (getPaymentLedgers()[0] || {}).key || "TRADE_RECEIVABLE" });
  const dispCalc = dispose ? (() => {
    const acc = faSchedule(dispose.a, dispose.date).acc;
    const nbv = r2((parseFloat(dispose.a.cost) || 0) - acc);
    const p = parseFloat(dispose.proceeds) || 0;
    return { acc, nbv, diff: r2(p - nbv) };
  })() : null;
  const confirmDispose = () => {
    const d = dispose;
    if (d.date < (d.a.purchaseDate || "") && d.a.mode !== "opening") {
      toast.error("Sale date cannot be before the purchase date");
      return;
    }
    S.set(SK.FA, list.map((x) => x.id === d.a.id ? { ...x, disposal: { date: d.date, proceeds: parseFloat(d.proceeds) || 0, receivedKey: d.receivedKey, voucherNo: nextVoucherNo(), txnRefNo: nextTxnRefNo(d.date) } } : x));
    logAudit("FIXED_ASSET_DISPOSED", `${d.a.code} ${d.a.name} sold for ${fmt(parseFloat(d.proceeds) || 0)}`, currentUser);
    reload();
    setDispose(null);
    toast.success("Disposal posted \u2014 gain / loss on sale booked automatically");
  };
  const undoDispose = (a) => {
    if (!isAdmin) {
      toast.error("Only Admin can reverse a disposal");
      return;
    }
    if (!window.confirm("Reverse the disposal of " + a.name + "?")) return;
    const { disposal, ...rest } = a;
    S.set(SK.FA, list.map((x) => x.id === a.id ? rest : x));
    reload();
    toast.info("Disposal reversed");
  };
  const doExport = (f) => {
    if (tab === "schedule") exportTableAs(
      f,
      `FixedAssetSchedule_FY${selFY}`,
      `Fixed Asset Schedule \u2014 FY ${selFY}-${String(selFY + 1).slice(2)}`,
      ["Asset Code", "Asset", "Gross Opening", "Additions", "Disposals", "Gross Closing", "Dep. Opening", "Dep. For Year", "Dep. On Disposals", "Dep. Closing", "Net Block Closing", "Net Block Opening"],
      [
        ...rows.map((r) => [r.a.code, r.a.name, fmtN(r.grossOpen), fmtN(r.additions), fmtN(r.grossDisp), fmtN(r.grossClose), fmtN(r.accOpen), fmtN(r.depYear), fmtN(r.accDisp), fmtN(r.accClose), fmtN(r.netClose), fmtN(r.netOpen)]),
        ["", "Total", fmtN(tot.gOpen), fmtN(tot.add), fmtN(tot.dis), fmtN(tot.gClose), fmtN(tot.aOpen), fmtN(tot.dep), fmtN(tot.aDis), fmtN(tot.aClose), fmtN(tot.net), fmtN(tot.netO)]
      ]
    );
    else exportTableAs(
      f,
      "FixedAssetRegister",
      "Fixed Asset Register",
      ["Code", "Asset", "Category", "Acquired", "Method", "Cost", "Accumulated Dep.", "Book Value", "Status"],
      list.map((a) => {
        const s = faSchedule(a, today());
        return [a.code, a.name, a.category, fmtDate(faAcquiredOn(a) === "1900-01-01" ? a.depFrom : a.purchaseDate), a.method === "WDV" ? `WDV ${a.rate}%` : `SLM ${a.lifeYears}y`, fmtN(a.cost), fmtN(s.acc), fmtN((parseFloat(a.cost) || 0) - s.acc), a.disposal ? "Sold " + fmtDate(a.disposal.date) : "In use"];
      })
    );
  };
  const allDep = useMemo(() => {
    const out = [];
    list.forEach((a) => faSchedule(a, today()).rows.forEach((r) => out.push({ ...r, a })));
    return out.sort((x, y) => y.date.localeCompare(x.date));
  }, [list]);
  const sel = list.find((a) => a.id === selId);
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(InfoNote, null, "Add each asset once. From then on the software posts ", /* @__PURE__ */ React.createElement("b", null, "depreciation journals automatically at every month-end"), " (Dr Depreciation, Cr Accumulated Depreciation) \u2014 they show in the General Ledger, Trial Balance, P&L and Balance Sheet with a ", /* @__PURE__ */ React.createElement("b", null, "DEP-"), " voucher number. Selling an asset books the gain or loss for you."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 } }, /* @__PURE__ */ React.createElement(Kpi, { label: "Gross block", value: fmt(tot.gClose), sub: `${rows.filter((r) => r.grossClose > 0).length} assets in use` }), /* @__PURE__ */ React.createElement(Kpi, { label: "Accumulated depreciation", value: fmt(tot.aClose), color: "var(--gold)" }), /* @__PURE__ */ React.createElement(Kpi, { label: "Net book value", value: fmt(tot.net), color: "var(--green)" }), /* @__PURE__ */ React.createElement(Kpi, { label: `Depreciation FY ${selFY}-${String(selFY + 1).slice(2)}`, value: fmt(tot.dep), color: "var(--primary2)" })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 12 } }, /* @__PURE__ */ React.createElement(FyPicker, { value: selFY, onChange: setSelFY }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), /* @__PURE__ */ React.createElement(ExportMenu, { onExport: doExport, disabled: !list.length }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: startAdd }, "+ Add Asset")), /* @__PURE__ */ React.createElement(TabBar, { value: tab, onChange: setTab, tabs: [["register", "Asset Register"], ["schedule", "FA Schedule (Sch. III)"], ["journals", "Depreciation Journals"]] }), form && /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 16, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14, marginBottom: 12 } }, list.some((x) => x.id === form.id) ? "Edit asset" : "New fixed asset"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 } }, [["new", "New purchase \u2014 post the purchase entry"], ["bill", "Already booked via a Purchase Bill"], ["opening", "Existing asset (opening balance)"]].map(([k, l]) => /* @__PURE__ */ React.createElement("button", { key: k, className: "btn btn-sm " + (form.mode === k ? "btn-primary" : "btn-outline"), onClick: () => setForm((f) => ({ ...f, mode: k })) }, l))), form.mode === "bill" && /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Purchase bill (optional \u2014 pre-fills cost & date)"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: form.billId || "", onChange: (e) => pickBill(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "\u2014 choose a bill \u2014"), bills.map((b) => /* @__PURE__ */ React.createElement("option", { key: b.id, value: b.id }, b.billNo || b.id, " \u2014 ", b.vendor || "Vendor", " \u2014 ", fmt(b.total), b.expenseAccountKey === "FIXED_ASSETS" ? "" : "  (head: " + coaByKey(b.expenseAccountKey || guessExpenseAccount(b.category)).name + ")"))), (() => {
    const b = bills.find((x) => x.id === form.billId);
    return b && b.expenseAccountKey !== "FIXED_ASSETS" ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--red)", marginTop: 4 } }, "\u26A0 This bill is not booked to \u201CFixed Assets (Tangible)\u201D, so its cost sits in an expense. Change the bill\u2019s Expense Head to Fixed Assets so the asset is capitalised \u2014 otherwise the cost is expensed AND depreciated.") : null;
  })(), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", marginTop: 4 } }, "The bill posts the cost to Fixed Assets; this register only adds the depreciation, so nothing is counted twice.")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { flex: "2 1 220px" } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Asset name *"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.name, onChange: (e) => setForm((f) => ({ ...f, name: e.target.value })), placeholder: "e.g. Dell Latitude laptop" })), /* @__PURE__ */ React.createElement("div", { className: "field", style: { flex: "1 1 190px" } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Asset class"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: form.category, onChange: (e) => preset(e.target.value) }, FA_PRESETS.map((p) => /* @__PURE__ */ React.createElement("option", { key: p.name }, p.name)))), /* @__PURE__ */ React.createElement("div", { className: "field", style: { flex: "1 1 150px" } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Serial / location"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.serial || "", onChange: (e) => setForm((f) => ({ ...f, serial: e.target.value })), placeholder: "optional" }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, form.mode === "opening" ? "Original purchase date" : "Purchase date *"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: form.purchaseDate, onChange: (e) => setForm((f) => ({ ...f, purchaseDate: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, form.mode === "opening" ? "Depreciate from (books start)" : "In-service date"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: form.depFrom || "", onChange: (e) => setForm((f) => ({ ...f, depFrom: e.target.value })) }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text3)", marginTop: 3 } }, form.mode === "opening" ? "First month the software should post depreciation" : "Blank = purchase date. First month is pro-rated by days.")), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Cost (excl. GST) *"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: form.cost, onChange: (e) => setForm((f) => ({ ...f, cost: e.target.value })), placeholder: "0.00" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Salvage value"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: form.salvage, onChange: (e) => setForm((f) => ({ ...f, salvage: e.target.value })), placeholder: "0.00" })), form.mode === "opening" && /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Accumulated depreciation b/f"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: form.accDepBF, onChange: (e) => setForm((f) => ({ ...f, accDepBF: e.target.value })), placeholder: "0.00" })), form.mode === "new" && /* @__PURE__ */ React.createElement("div", { className: "field", style: { minWidth: 210 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Paid / payable from"), /* @__PURE__ */ React.createElement(LedgerSelect, { value: form.paidFromKey, onChange: (v) => setForm((f) => ({ ...f, paidFromKey: v })), extra: [["TRADE_PAYABLE", "Trade Payables (on credit)"], ["CAPITAL", "Owner's Capital (introduced)"], ["LT_BORROWING", "Long-term Borrowings (loan-funded)"]] }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" } }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Depreciation method"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: form.method, onChange: (e) => setForm((f) => ({ ...f, method: e.target.value })) }, /* @__PURE__ */ React.createElement("option", { value: "SLM" }, "Straight Line (SLM)"), /* @__PURE__ */ React.createElement("option", { value: "WDV" }, "Written Down Value (WDV)"))), form.method === "SLM" ? /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Useful life (years)"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: form.lifeYears, onChange: (e) => setForm((f) => ({ ...f, lifeYears: e.target.value })) })) : /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "WDV rate (% per year)"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: form.rate, onChange: (e) => setForm((f) => ({ ...f, rate: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", paddingBottom: 14, flex: 1, minWidth: 240 } }, "Indicative defaults: Companies Act Sch. II lives for SLM, Income-tax block rates for WDV \u2014 change them to match your policy.")), (() => {
    const c = parseFloat(form.cost) || 0;
    if (c <= 0) return null;
    const p = faSchedule({ ...form, cost: c, salvage: parseFloat(form.salvage) || 0, lifeYears: parseFloat(form.lifeYears) || 0, rate: parseFloat(form.rate) || 0, accDepBF: parseFloat(form.accDepBF) || 0, depFrom: form.depFrom || form.purchaseDate }, "9999-12-31");
    const first = p.rows.slice(0, 3);
    return first.length ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--text2)", marginBottom: 10 } }, "Preview \u2014 first months: ", first.map((r) => `${r.ym}: ${fmt(r.amount)}`).join("  \xB7  "), p.rows.length > 3 ? `  \u2026  fully depreciated after ${p.rows.length} months` : "") : null;
  })(), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: saveAsset }, "Save asset"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: () => setForm(null) }, "Cancel"))), dispose && /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 16, marginBottom: 16, borderColor: "var(--gold)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14, marginBottom: 10 } }, "Sell / dispose \u2014 ", dispose.a.code, " ", dispose.a.name), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Date of sale"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: dispose.date, onChange: (e) => setDispose((d) => ({ ...d, date: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Sale proceeds (0 if scrapped)"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: dispose.proceeds, onChange: (e) => setDispose((d) => ({ ...d, proceeds: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { className: "field", style: { minWidth: 230 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Proceeds received in"), /* @__PURE__ */ React.createElement(LedgerSelect, { value: dispose.receivedKey, onChange: (v) => setDispose((d) => ({ ...d, receivedKey: v })), extra: [["TRADE_RECEIVABLE", "Trade Receivables (sold on credit)"]] }))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, marginBottom: 10 } }, "Depreciation up to sale: ", /* @__PURE__ */ React.createElement("b", null, fmt(dispCalc.acc)), " \xB7 Book value: ", /* @__PURE__ */ React.createElement("b", null, fmt(dispCalc.nbv)), " \xB7 ", dispCalc.diff >= 0 ? "Gain on sale" : "Loss on sale", ": ", /* @__PURE__ */ React.createElement("b", { style: { color: dispCalc.diff >= 0 ? "var(--green)" : "var(--red)" } }, fmt(Math.abs(dispCalc.diff)))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", marginBottom: 10 } }, "GST on the sale (if any) is not included here \u2014 raise a sales invoice for it separately."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: confirmDispose }, "Post disposal"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: () => setDispose(null) }, "Cancel"))), tab === "register" && (list.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "No fixed assets yet \u2014 click \u201C+ Add Asset\u201D." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 980 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Code"), /* @__PURE__ */ React.createElement("th", { style: th }, "Asset"), /* @__PURE__ */ React.createElement("th", { style: th }, "Method"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Cost"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Acc. depreciation"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Book value"), /* @__PURE__ */ React.createElement("th", { style: th }, "Status"), /* @__PURE__ */ React.createElement("th", { style: th })), /* @__PURE__ */ React.createElement("tbody", null, list.map((a) => {
    const s = faSchedule(a, today());
    const bv = r2((parseFloat(a.cost) || 0) - s.acc);
    return /* @__PURE__ */ React.createElement("tr", { key: a.id, style: { borderBottom: "1px solid var(--border)", background: selId === a.id ? "var(--primary-bg)" : "transparent" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, fontFamily: "monospace" } }, a.code), /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600 } }, a.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10.5, color: "var(--text3)" } }, a.category, " \xB7 ", a.mode === "opening" ? "opening balance" : a.mode === "bill" ? "via bill" : "purchased " + fmtDate(a.purchaseDate))), /* @__PURE__ */ React.createElement("td", { style: td }, a.method === "WDV" ? `WDV ${a.rate}%` : `SLM ${a.lifeYears} yrs`), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(a.cost)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(s.acc)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700 } }, fmt(bv)), /* @__PURE__ */ React.createElement("td", { style: td }, a.disposal ? /* @__PURE__ */ React.createElement("span", { className: "badge badge-gold" }, "Sold ", fmtDate(a.disposal.date)) : bv <= (parseFloat(a.salvage) || 0) + 0.01 ? /* @__PURE__ */ React.createElement("span", { className: "badge badge-blue" }, "Fully depreciated") : /* @__PURE__ */ React.createElement("span", { className: "badge badge-green" }, "In use")), /* @__PURE__ */ React.createElement("td", { style: { ...td, whiteSpace: "nowrap" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => setSelId(selId === a.id ? null : a.id) }, selId === a.id ? "Hide" : "Schedule"), " ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => setForm({ ...a, cost: a.cost, salvage: a.salvage || "", accDepBF: a.accDepBF || "" }) }, "Edit"), " ", !a.disposal ? /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => startDispose(a) }, "Sell") : /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => undoDispose(a) }, "Undo sale"), " ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger btn-icon", onClick: () => delAsset(a) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 11 }))));
  })))), tab === "register" && sel && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, marginBottom: 8 } }, "Month-wise depreciation \u2014 ", sel.code, " ", sel.name), (() => {
    const s = faSchedule(sel, today());
    return s.rows.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "No depreciation has fallen due yet \u2014 the first journal posts at the end of the in-service month." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 640 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Month"), /* @__PURE__ */ React.createElement("th", { style: th }, "Posted on"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Depreciation"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Accumulated"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Book value"), /* @__PURE__ */ React.createElement("th", { style: th }, "Voucher")), /* @__PURE__ */ React.createElement("tbody", null, s.rows.map((r) => /* @__PURE__ */ React.createElement("tr", { key: r.ym, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, r.ym), /* @__PURE__ */ React.createElement("td", { style: td }, fmtDate(r.date)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(r.amount)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(r.accAfter)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(r.wdvAfter)), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontFamily: "monospace", fontSize: 11 } }, "DEP-", String(sel.code).replace(/\s+/g, "").toUpperCase(), "-", r.ym.replace("-", ""))))));
  })()), tab === "schedule" && (rows.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "No assets in this financial year." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 1100 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Asset"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Gross: Opening"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Additions"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Disposals"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Gross: Closing"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Dep: Opening"), /* @__PURE__ */ React.createElement("th", { style: thR }, "For the year"), /* @__PURE__ */ React.createElement("th", { style: thR }, "On disposals"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Dep: Closing"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Net block"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Prev. net block")), /* @__PURE__ */ React.createElement("tbody", null, rows.map((r) => /* @__PURE__ */ React.createElement("tr", { key: r.a.id, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement("b", null, r.a.code), " ", r.a.name), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(r.grossOpen)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(r.additions)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(r.grossDisp)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700 } }, fmtN(r.grossClose)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(r.accOpen)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(r.depYear)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(r.accDisp)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700 } }, fmtN(r.accClose)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700, color: "var(--green)" } }, fmtN(r.netClose)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(r.netOpen)))), /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)", fontWeight: 800 } }, /* @__PURE__ */ React.createElement("td", { style: td }, "Total"), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(tot.gOpen)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(tot.add)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(tot.dis)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(tot.gClose)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(tot.aOpen)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(tot.dep)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(tot.aDis)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(tot.aClose)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(tot.net)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(tot.netO)))))), tab === "journals" && (allDep.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "No depreciation journals yet." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 760 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Date"), /* @__PURE__ */ React.createElement("th", { style: th }, "Asset"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Debit: Depreciation"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Credit: Accumulated Dep."), /* @__PURE__ */ React.createElement("th", { style: th }, "Voucher No.")), /* @__PURE__ */ React.createElement("tbody", null, allDep.slice(0, 400).map((r) => /* @__PURE__ */ React.createElement("tr", { key: r.a.id + r.ym, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, fmtDate(r.date)), /* @__PURE__ */ React.createElement("td", { style: td }, r.a.code, " \u2014 ", r.a.name), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(r.amount)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(r.amount)), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontFamily: "monospace", fontSize: 11 } }, "DEP-", String(r.a.code).replace(/\s+/g, "").toUpperCase(), "-", r.ym.replace("-", ""))))))));
};
const blankRJV = (kind) => ({
  id: newId("RJ"),
  name: "",
  kind: kind || "fixed",
  active: true,
  startDate: today(),
  frequency: "monthly",
  count: "",
  endDate: "",
  refNo: "",
  generated: 0,
  lines: [{ account: "RENT_EXP", desc: "", debit: "", credit: "" }, { account: (getPaymentLedgers()[0] || {}).key || "CASH_IN_HAND", desc: "", debit: "", credit: "" }],
  loanKey: "",
  payKey: (getPaymentLedgers()[0] || {}).key || "CASH_IN_HAND",
  principal: "",
  rate: "",
  tenure: "",
  emiOverride: "",
  total: "",
  months: "",
  expenseKey: "RENT_EXP"
});
const rjvPerPeriod = (t) => t.kind === "emi" ? emiOf(t.principal, t.rate, t.tenure) : t.kind === "prepaid" ? +t.months > 0 ? r2((+t.total || 0) / +t.months) : 0 : r2((t.lines || []).reduce((s, l) => s + (parseFloat(l.debit) || 0), 0));
const RecurringJournalsPage = ({ currentUser }) => {
  const [list, setList] = useState(S.get(SK.RJV, []) || []);
  const [form, setForm] = useState(null);
  const [jvs, setJvs] = useState(getManualJournal());
  const isAdmin = isAdminUser(currentUser);
  const reload = () => {
    setList(S.get(SK.RJV, []) || []);
    setJvs(getManualJournal());
  };
  const runNow = () => {
    const n = runRecurringJournals(currentUser);
    reload();
    n ? toast.success(`${n} journal voucher${n === 1 ? "" : "s"} posted`) : toast.info("Nothing is due \u2014 every recurring entry is up to date");
  };
  const save = () => {
    const f = form;
    if (!f.name.trim()) {
      toast.error("Give this recurring entry a name");
      return;
    }
    if (!f.startDate) {
      toast.error("Pick the first posting date");
      return;
    }
    if (f.kind === "fixed") {
      const ls = (f.lines || []).filter((l) => l.account && (parseFloat(l.debit) || parseFloat(l.credit)));
      const d = ls.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0), c = ls.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
      if (ls.length < 2 || Math.abs(d - c) > 0.01 || d <= 0) {
        toast.error("Debits must equal credits (at least two lines)");
        return;
      }
    }
    if (f.kind === "emi") {
      if (!f.loanKey) {
        toast.error("Choose the loan ledger");
        return;
      }
      if (!(+f.principal > 0) || !(+f.tenure > 0)) {
        toast.error("Enter the loan principal and number of instalments");
        return;
      }
    }
    if (f.kind === "prepaid") {
      if (!(+f.total > 0) || !(+f.months > 0)) {
        toast.error("Enter the prepaid amount and number of months");
        return;
      }
      if (!f.expenseKey) {
        toast.error("Choose the expense ledger");
        return;
      }
    }
    const rec = { ...f, name: f.name.trim(), lines: (f.lines || []).filter((l) => l.account && (parseFloat(l.debit) || parseFloat(l.credit))).map((l) => ({ account: l.account, desc: l.desc || "", debit: parseFloat(l.debit) || 0, credit: parseFloat(l.credit) || 0 })) };
    const exists = list.some((x) => x.id === f.id);
    S.set(SK.RJV, exists ? list.map((x) => x.id === f.id ? rec : x) : [...list, rec]);
    logAudit("RECURRING_JV_SAVED", rec.name, currentUser);
    setForm(null);
    const n = runRecurringJournals(currentUser);
    reload();
    toast.success(n ? `Saved \u2014 ${n} past-due voucher${n === 1 ? "" : "s"} posted now; the rest will post on their due dates` : "Saved \u2014 it will post automatically on each due date");
  };
  const toggle = (t) => {
    S.set(SK.RJV, list.map((x) => x.id === t.id ? { ...x, active: !x.active } : x));
    reload();
  };
  const del = (t) => {
    if (!isAdmin) {
      toast.error("Only Admin can delete");
      return;
    }
    if (!window.confirm(`Delete \u201C${t.name}\u201D?

Vouchers already posted stay in the books; future ones stop.`)) return;
    S.set(SK.RJV, list.filter((x) => x.id !== t.id));
    reload();
  };
  const upLine = (i, k, v) => setForm((f) => ({ ...f, lines: f.lines.map((l, j) => j === i ? { ...l, [k]: v } : l) }));
  const locked = form && form.kind !== "fixed" && (parseInt(form.generated, 10) || 0) > 0;
  const emiRows = form && form.kind === "emi" ? emiSchedule(form.principal, form.rate, form.tenure, +form.emiOverride || 0) : [];
  const ppRows = form && form.kind === "prepaid" ? prepaidSchedule(form.total, form.months) : [];
  const fd = form ? (form.lines || []).reduce((s, l) => s + (parseFloat(l.debit) || 0), 0) : 0, fc = form ? (form.lines || []).reduce((s, l) => s + (parseFloat(l.credit) || 0), 0) : 0;
  const generatedJvs = jvs.filter((j) => j.recurringId).sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 40);
  const typeLabel = { fixed: "Fixed entry", emi: "Loan EMI", prepaid: "Prepaid amortisation" };
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(InfoNote, null, "Set up rent, loan EMIs, insurance or prepaid amortisation ", /* @__PURE__ */ React.createElement("b", null, "once"), ". A real Journal Voucher is posted automatically on every due date (when anyone opens the app) \u2014 no more month-end reminders. EMI entries split each instalment into principal and interest using the loan\u2019s amortisation schedule."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14, alignItems: "center" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => setForm(blankRJV("fixed")) }, "+ Rent / fixed entry"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: () => setForm(blankRJV("emi")) }, "+ Loan EMI"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: () => setForm(blankRJV("prepaid")) }, "+ Prepaid amortisation"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-primary", onClick: runNow }, /* @__PURE__ */ React.createElement(Ic, { n: "refresh", s: 13 }), " Post due entries now")), form && /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 16, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14, marginBottom: 10 } }, list.some((x) => x.id === form.id) ? "Edit" : "New", " recurring entry \u2014 ", typeLabel[form.kind]), locked && /* @__PURE__ */ React.createElement(InfoNote, { tone: "warn" }, form.generated, " instalment(s) have already been posted, so the schedule figures are locked. You can still change the name, ledgers for future vouchers, or pause it."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { flex: "2 1 240px" } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Name *"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.name, onChange: (e) => setForm((f) => ({ ...f, name: e.target.value })), placeholder: form.kind === "emi" ? "e.g. HDFC term loan EMI" : form.kind === "prepaid" ? "e.g. Insurance FY26-27" : "e.g. Office rent \u2014 Whitefield" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, form.kind === "fixed" ? "First posting date" : form.kind === "emi" ? "Next EMI date" : "First amortisation date", " *"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: form.startDate, disabled: locked, onChange: (e) => setForm((f) => ({ ...f, startDate: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Reference no."), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.refNo || "", onChange: (e) => setForm((f) => ({ ...f, refNo: e.target.value })), placeholder: "Loan a/c no., agreement no." }))), form.kind === "fixed" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Repeats"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: form.frequency, onChange: (e) => setForm((f) => ({ ...f, frequency: e.target.value })) }, RJV_FREQ.map(([k, l]) => /* @__PURE__ */ React.createElement("option", { key: k, value: k }, l)))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Number of times"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: form.count, onChange: (e) => setForm((f) => ({ ...f, count: e.target.value })), placeholder: "blank = no limit" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Or stop after"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: form.endDate || "", onChange: (e) => setForm((f) => ({ ...f, endDate: e.target.value })) }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text3)" } }, "Quick start:"), [["Rent", "RENT_EXP"], ["Insurance", "OTHER_EXP"], ["Salary accrual", "EMPLOYEE_EXP"], ["Subscription", "OTHER_EXP"]].map(([l, k]) => /* @__PURE__ */ React.createElement("button", { key: l, className: "btn btn-sm btn-outline", onClick: () => setForm((f) => ({ ...f, name: f.name || l, lines: [{ ...f.lines[0], account: k }, f.lines[1]] })) }, l))), /* @__PURE__ */ React.createElement("div", { className: "dt-wrap", style: { marginBottom: 8 } }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Account"), /* @__PURE__ */ React.createElement("th", null, "Line note"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Debit"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Credit"), /* @__PURE__ */ React.createElement("th", null))), /* @__PURE__ */ React.createElement("tbody", null, form.lines.map((l, i) => /* @__PURE__ */ React.createElement("tr", { key: i }, /* @__PURE__ */ React.createElement("td", { style: { minWidth: 260 } }, /* @__PURE__ */ React.createElement(AccountSelect, { value: l.account, onChange: (v) => upLine(i, "account", v), createType: "expense", placeholder: "Choose ledger\u2026" })), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: l.desc || "", onChange: (e) => upLine(i, "desc", e.target.value) })), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { textAlign: "right" }, value: l.debit, onChange: (e) => upLine(i, "debit", e.target.value) })), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { textAlign: "right" }, value: l.credit, onChange: (e) => upLine(i, "credit", e.target.value) })), /* @__PURE__ */ React.createElement("td", null, form.lines.length > 2 && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger btn-icon", onClick: () => setForm((f) => ({ ...f, lines: f.lines.filter((_, j) => j !== i) })) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 11 })))))))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "center", marginBottom: 10, fontSize: 12.5 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => setForm((f) => ({ ...f, lines: [...f.lines, blankJVLine()] })) }, "+ Add line"), /* @__PURE__ */ React.createElement("span", null, "Debit ", fmt(fd), " \xB7 Credit ", fmt(fc)), /* @__PURE__ */ React.createElement("b", { style: { color: Math.abs(fd - fc) < 0.01 && fd > 0 ? "var(--green)" : "var(--red)" } }, Math.abs(fd - fc) < 0.01 && fd > 0 ? "\u2713 Balanced" : "Difference " + fmt(Math.abs(fd - fc))))), form.kind === "emi" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { minWidth: 260 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Loan ledger (liability) *"), /* @__PURE__ */ React.createElement(AccountSelect, { value: form.loanKey, onChange: (v) => setForm((f) => ({ ...f, loanKey: v })), types: ["liability"], createType: "liability", placeholder: "e.g. Long-term Borrowings" })), /* @__PURE__ */ React.createElement("div", { className: "field", style: { minWidth: 230 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "EMI paid from *"), /* @__PURE__ */ React.createElement(LedgerSelect, { value: form.payKey, onChange: (v) => setForm((f) => ({ ...f, payKey: v })) }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Outstanding principal *"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", disabled: locked, value: form.principal, onChange: (e) => setForm((f) => ({ ...f, principal: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Interest rate % p.a."), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", disabled: locked, value: form.rate, onChange: (e) => setForm((f) => ({ ...f, rate: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Instalments remaining *"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", disabled: locked, value: form.tenure, onChange: (e) => setForm((f) => ({ ...f, tenure: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "EMI (override, optional)"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", disabled: locked, value: form.emiOverride || "", onChange: (e) => setForm((f) => ({ ...f, emiOverride: e.target.value })), placeholder: String(emiOf(form.principal, form.rate, form.tenure) || "") }))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", marginBottom: 8 } }, "For a loan already running, enter the ", /* @__PURE__ */ React.createElement("b", null, "current outstanding principal"), " and the ", /* @__PURE__ */ React.createElement("b", null, "instalments still to pay"), ". The loan receipt itself is recorded in Bank Reconciliation (post it to the loan ledger)."), emiRows.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 10, fontSize: 12.5 } }, "EMI ", /* @__PURE__ */ React.createElement("b", null, fmt(emiRows[0].emi)), " \xB7 total interest ", /* @__PURE__ */ React.createElement("b", null, fmt(emiRows.reduce((s, r) => s + r.interest, 0))), " \xB7 total payable ", /* @__PURE__ */ React.createElement("b", null, fmt(emiRows.reduce((s, r) => s + r.emi, 0))), /* @__PURE__ */ React.createElement("div", { style: { maxHeight: 170, overflow: "auto", marginTop: 6, border: "1px solid var(--border)", borderRadius: 8 } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("th", { style: th }, "#"), /* @__PURE__ */ React.createElement("th", { style: th }, "Date"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Principal"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Interest"), /* @__PURE__ */ React.createElement("th", { style: thR }, "EMI"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Balance"))), /* @__PURE__ */ React.createElement("tbody", null, emiRows.map((r) => /* @__PURE__ */ React.createElement("tr", { key: r.k, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, r.k + 1), /* @__PURE__ */ React.createElement("td", { style: td }, form.startDate ? fmtDate(rjvDate(form, r.k)) : ""), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(r.principal)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(r.interest)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(r.emi)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(r.balance))))))))), form.kind === "prepaid" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { minWidth: 260 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Expense ledger *"), /* @__PURE__ */ React.createElement(AccountSelect, { value: form.expenseKey, onChange: (v) => setForm((f) => ({ ...f, expenseKey: v })), types: ["expense"], createType: "expense" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Total prepaid amount *"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", disabled: locked, value: form.total, onChange: (e) => setForm((f) => ({ ...f, total: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Spread over (months) *"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", disabled: locked, value: form.months, onChange: (e) => setForm((f) => ({ ...f, months: e.target.value })) }))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", marginBottom: 8 } }, "Record the advance payment first (Bank Reconciliation \u2192 post to \u201CPrepaid Expenses\u201D, or the Journal template). Each month this posts ", /* @__PURE__ */ React.createElement("b", null, "Dr ", coaByKey(form.expenseKey).name, " / Cr Prepaid Expenses"), ".", ppRows.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, " Monthly amount ", /* @__PURE__ */ React.createElement("b", null, fmt(ppRows[0].amount)), ppRows.length > 1 && ppRows[ppRows.length - 1].amount !== ppRows[0].amount ? ` (last month ${fmt(ppRows[ppRows.length - 1].amount)} to absorb rounding)` : "", "."))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: save }, "Save & activate"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: () => setForm(null) }, "Cancel"))), list.length === 0 && !form ? /* @__PURE__ */ React.createElement(Empty, { text: "No recurring entries yet. Add your rent, loan EMI or an insurance premium above." }) : list.length > 0 && /* @__PURE__ */ React.createElement(Wrap, { min: 900 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Name"), /* @__PURE__ */ React.createElement("th", { style: th }, "Type"), /* @__PURE__ */ React.createElement("th", { style: th }, "Repeats"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Per period"), /* @__PURE__ */ React.createElement("th", { style: th }, "Progress"), /* @__PURE__ */ React.createElement("th", { style: th }, "Next posting"), /* @__PURE__ */ React.createElement("th", { style: th }, "Status"), /* @__PURE__ */ React.createElement("th", { style: th })), /* @__PURE__ */ React.createElement("tbody", null, list.map((t) => {
    const total = rjvTotal(t);
    const gen = parseInt(t.generated, 10) || 0;
    const done = gen >= total && total < 600;
    const nd = done ? null : rjvDate(t, gen);
    const over = nd && nd <= today() && t.active;
    return /* @__PURE__ */ React.createElement("tr", { key: t.id, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 600 } }, t.name), /* @__PURE__ */ React.createElement("td", { style: td }, typeLabel[t.kind]), /* @__PURE__ */ React.createElement("td", { style: td }, t.kind === "fixed" ? (RJV_FREQ.find((f) => f[0] === t.frequency) || [])[1] : "Monthly"), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(rjvPerPeriod(t))), /* @__PURE__ */ React.createElement("td", { style: td }, gen, total < 600 ? ` / ${total}` : "", " posted"), /* @__PURE__ */ React.createElement("td", { style: td }, done ? /* @__PURE__ */ React.createElement("span", { className: "badge badge-green" }, "Completed") : nd ? /* @__PURE__ */ React.createElement("span", { style: { color: over ? "var(--red)" : "var(--text)" } }, fmtDate(nd), over ? " (due)" : "") : "\u2014"), /* @__PURE__ */ React.createElement("td", { style: td }, t.active ? /* @__PURE__ */ React.createElement("span", { className: "badge badge-green" }, "Active") : /* @__PURE__ */ React.createElement("span", { className: "badge badge-gold" }, "Paused")), /* @__PURE__ */ React.createElement("td", { style: { ...td, whiteSpace: "nowrap" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => setForm({ ...t, lines: t.lines && t.lines.length ? t.lines : [{ account: "", desc: "", debit: "", credit: "" }, { account: "", desc: "", debit: "", credit: "" }] }) }, "Edit"), " ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => toggle(t) }, t.active ? "Pause" : "Resume"), " ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger btn-icon", onClick: () => del(t) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 11 }))));
  }))), generatedJvs.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 18 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, marginBottom: 8 } }, "Recently auto-posted vouchers"), /* @__PURE__ */ React.createElement(Wrap, { min: 680 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Date"), /* @__PURE__ */ React.createElement("th", { style: th }, "Voucher No."), /* @__PURE__ */ React.createElement("th", { style: th }, "Narration"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Amount")), /* @__PURE__ */ React.createElement("tbody", null, generatedJvs.map((j) => /* @__PURE__ */ React.createElement("tr", { key: j.id, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, fmtDate(j.date)), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontFamily: "monospace", fontSize: 11 } }, j.voucherNo), /* @__PURE__ */ React.createElement("td", { style: td }, j.narration), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt((j.lines || []).reduce((s, l) => s + (l.debit || 0), 0))))))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", marginTop: 6 } }, "Posted vouchers are ordinary Journal Vouchers \u2014 you can see (and reverse) them under Accounting \u2192 Journal Vouchers.")));
};
const AdvanceApplicationPage = ({ currentUser }) => {
  const [tab, setTab] = useState("customer");
  const [tick, setTick] = useState(0);
  const bump = () => setTick((t) => t + 1);
  const [open, setOpen] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [amts, setAmts] = useState({});
  const [appDate, setAppDate] = useState(today());
  const advRows = useMemo(() => getAdvanceRows(), [tick]);
  const cnRows = useMemo(() => getOpenCreditNotes(), [tick]);
  const apps = getAdvApps();
  const custRows = advRows.filter((r) => r.kind === "customer" && r.balance > 0.01);
  const supRows = advRows.filter((r) => r.kind === "supplier" && r.balance > 0.01);
  const sumBal = (a) => a.reduce((s, r) => s + (r.balance != null ? r.balance : r.out), 0);
  const customers = S.get(SK.CUST, []) || [];
  const vendors = [...new Set((S.get(SK.EXP, []) || []).map((e) => e.vendor).filter(Boolean))];
  const docsFor = (src) => {
    const all = src.kind === "supplier" ? getOpenItems("debit") : getOpenItems("credit");
    const mine = showAll || !src.party ? all : all.filter((o) => sameParty(o.party, src.party));
    return mine.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  };
  const doApply = (src, o, amt) => {
    amt = r2(Math.min(amt, src.balance, o.out));
    if (amt <= 4e-3) {
      toast.error("Nothing to apply");
      return 0;
    }
    if (src.kind !== "cn" && src.date && appDate < src.date) {
      toast.error("Application date cannot be before the advance date (" + fmtDate(src.date) + ")");
      return 0;
    }
    applyAdvance({ kind: src.kind, advTxnId: src.id, party: src.party || o.party, docKind: src.kind === "supplier" ? "expense" : "invoice", docRef: o.ref, docNo: o.docNo || o.ref, amt, date: appDate, user: currentUser });
    logAudit("ADVANCE_APPLIED", `${src.kind === "cn" ? "Credit note " : "Advance "}${src.label || src.id} \u2192 ${o.docNo || o.ref}: ${fmt(amt)}`, currentUser);
    return amt;
  };
  const applyOne = (src, o) => {
    const k = src.id + "|" + o.ref;
    const want = amts[k] !== void 0 && amts[k] !== "" ? parseFloat(amts[k]) : Math.min(src.balance, o.out);
    const done = doApply(src, o, want);
    if (done) {
      toast.success(`${fmt(done)} applied to ${o.docNo || o.ref}`);
      setAmts((a) => ({ ...a, [k]: "" }));
      bump();
      if (src.balance - done <= 0.01) setOpen(null);
    }
  };
  const applyAuto = (src) => {
    let rem = src.balance, n = 0, total = 0;
    const docs = docsFor(src);
    if (!docs.length) {
      toast.info("No open " + (src.kind === "supplier" ? "bills" : "invoices") + " for this party");
      return;
    }
    docs.forEach((o) => {
      if (rem <= 4e-3) return;
      const done = doApply({ ...src, balance: rem }, o, Math.min(rem, o.out));
      if (done) {
        rem = r2(rem - done);
        total += done;
        n++;
      }
    });
    bump();
    if (n) {
      toast.success(`${fmt(total)} applied across ${n} ${src.kind === "supplier" ? "bill" : "invoice"}${n === 1 ? "" : "s"} (oldest first)`);
      setOpen(null);
    }
  };
  const undo = (a) => {
    if (!window.confirm(`Reverse this application of ${fmt(a.amt)} to ${a.docNo}?

The ${a.docKind === "expense" ? "bill" : "invoice"} becomes outstanding again.`)) return;
    reverseAdvanceApp(a.id);
    logAudit("ADVANCE_APPLICATION_REVERSED", `${a.advTxnId} \u2192 ${a.docNo} ${fmt(a.amt)}`, currentUser);
    bump();
    toast.info("Reversed");
  };
  const tag = (r, name) => {
    tagAdvanceParty(r.txnId, name.trim());
    bump();
    toast.success("Party saved");
  };
  const Panel = ({ src }) => {
    const docs = docsFor(src);
    return /* @__PURE__ */ React.createElement("div", { style: { background: "var(--card2)", padding: 12, borderTop: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12 } }, "Apply ", /* @__PURE__ */ React.createElement("b", null, fmt(src.balance)), " available to:"), /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11.5, display: "flex", gap: 5, alignItems: "center", cursor: "pointer" } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: showAll, onChange: (e) => setShowAll(e.target.checked) }), " show other parties too"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), docs.length > 0 && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-primary", onClick: () => applyAuto(src) }, "Apply oldest-first \u2014 one click"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => setOpen(null) }, "Close")), docs.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text3)" } }, "No open ", src.kind === "supplier" ? "bills" : "invoices", " found", src.party ? ` for \u201C${src.party}\u201D` : "", ". ", src.party && !showAll ? "Tick \u201Cshow other parties\u201D if the name is spelt differently." : "") : /* @__PURE__ */ React.createElement("div", { style: { border: "1px solid var(--border)", borderRadius: 8, background: "var(--card)", maxHeight: 240, overflow: "auto" } }, docs.map((o) => {
      const k = src.id + "|" + o.ref;
      return /* @__PURE__ */ React.createElement("div", { key: o.ref, style: { display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 12.5 } }, o.docNo || o.ref, " \u2014 ", o.party), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)" } }, fmtDate(o.date), " \xB7 due ", fmtDate(o.due), " \xB7 outstanding ", fmt(o.out))), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { width: 110, padding: "5px 8px", textAlign: "right" }, placeholder: String(Math.min(src.balance, o.out)), value: amts[k] || "", onChange: (e) => setAmts((a) => ({ ...a, [k]: e.target.value })) }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-primary", onClick: () => applyOne(src, o) }, "Apply"));
    })));
  };
  const advTable = (rows, kind) => rows.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: kind === "customer" ? "No unapplied customer advances. Advances appear here when a bank receipt is posted to \u201CAdvances from Customers\u201D or exceeds the invoices it settles." : "No unapplied supplier advances. They appear when a bank payment is posted to \u201CAdvance to supplier\u201D or exceeds the bills it settles." }) : /* @__PURE__ */ React.createElement("div", { style: { border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "90px 1.4fr 1fr 110px 110px 110px 120px", gap: 8, padding: "9px 12px", background: "var(--card2)", fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px" } }, /* @__PURE__ */ React.createElement("div", null, "Date"), /* @__PURE__ */ React.createElement("div", null, kind === "customer" ? "Customer" : "Supplier"), /* @__PURE__ */ React.createElement("div", null, "Bank narration"), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right" } }, "Advance"), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right" } }, "Applied"), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right" } }, "Balance"), /* @__PURE__ */ React.createElement("div", null)), rows.map((r) => /* @__PURE__ */ React.createElement("div", { key: r.txnId, style: { borderTop: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "90px 1.4fr 1fr 110px 110px 110px 120px", gap: 8, padding: "9px 12px", alignItems: "center", fontSize: 12.5 } }, /* @__PURE__ */ React.createElement("div", null, fmtDate(r.date)), /* @__PURE__ */ React.createElement("div", null, r.party ? /* @__PURE__ */ React.createElement("b", null, r.party) : /* @__PURE__ */ React.createElement(PartyTagger, { r, kind, onSave: tag, list: kind === "customer" ? customers.map((c) => c.name) : vendors })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, title: r.desc }, r.desc, r.ref ? ` \xB7 ${r.ref}` : ""), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right" } }, fmt(r.amount)), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(r.used)), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", fontWeight: 700, color: "var(--green)" } }, fmt(r.balance)), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-primary", onClick: () => setOpen(open === r.txnId ? null : r.txnId) }, "Apply\u2026"))), open === r.txnId && Panel({ src: { id: r.txnId, kind, party: r.party, balance: r.balance, date: r.date, label: r.ref || r.desc } }))));
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(InfoNote, null, "When a customer pays in advance (or you pay a supplier in advance) the money sits in an advance ledger. Pick the later invoice or bill here and it is settled in one click \u2014 the ledger entry (Dr Advance / Cr Receivable, or Dr Payable / Cr Advance) and the invoice\u2019s paid status update together. No manual journal needed."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 } }, /* @__PURE__ */ React.createElement(Kpi, { label: "Customer advances held", value: fmt(sumBal(custRows)), color: "var(--primary2)", sub: `${custRows.length} unapplied` }), /* @__PURE__ */ React.createElement(Kpi, { label: "Supplier advances given", value: fmt(sumBal(supRows)), color: "var(--gold)", sub: `${supRows.length} unapplied` }), /* @__PURE__ */ React.createElement(Kpi, { label: "Open credit notes", value: fmt(sumBal(cnRows)), color: "var(--green)", sub: `${cnRows.length} not yet settled` })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 6 } }, /* @__PURE__ */ React.createElement(TabBar, { value: tab, onChange: (t) => {
    setTab(t);
    setOpen(null);
  }, tabs: [["customer", "Customer advances"], ["supplier", "Supplier advances"], ["cn", "Credit notes"], ["history", "Applications"]] }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Application date"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: appDate, onChange: (e) => setAppDate(e.target.value) }))), tab === "customer" && advTable(custRows, "customer"), tab === "supplier" && advTable(supRows, "supplier"), tab === "cn" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(InfoNote, null, "A credit note already reduces what the customer owes in your ledger. Settle it either by ", /* @__PURE__ */ React.createElement("b", null, "adjusting it against an invoice"), " (below) or by ", /* @__PURE__ */ React.createElement("b", null, "refunding the customer"), " \u2014 do that in Bank Reconciliation: open the bank debit and choose \u201CRefund to customer\u201D."), cnRows.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "Every credit note is fully settled." }) : /* @__PURE__ */ React.createElement("div", { style: { border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" } }, cnRows.map((c) => /* @__PURE__ */ React.createElement("div", { key: c.ref, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, padding: "10px 12px", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 12.5 } }, c.docNo, " \u2014 ", c.party), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)" } }, fmtDate(c.date), " ", c.extra, " \xB7 total ", fmt(c.total), c.settled > 0 ? ` \xB7 settled ${fmt(c.settled)}` : "")), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--green)" } }, fmt(c.out)), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-primary", onClick: () => setOpen(open === c.ref ? null : c.ref) }, "Adjust against invoice\u2026")), open === c.ref && Panel({ src: { id: c.ref, kind: "cn", party: c.party, balance: c.out, date: c.date, label: c.docNo } }))))), tab === "history" && (apps.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "Nothing applied yet." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 820 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Date"), /* @__PURE__ */ React.createElement("th", { style: th }, "Type"), /* @__PURE__ */ React.createElement("th", { style: th }, "Party"), /* @__PURE__ */ React.createElement("th", { style: th }, "Applied to"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Amount"), /* @__PURE__ */ React.createElement("th", { style: th }, "Voucher No."), /* @__PURE__ */ React.createElement("th", { style: th })), /* @__PURE__ */ React.createElement("tbody", null, [...apps].sort((a, b) => (b.date || "").localeCompare(a.date || "")).map((a) => /* @__PURE__ */ React.createElement("tr", { key: a.id, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, fmtDate(a.date)), /* @__PURE__ */ React.createElement("td", { style: td }, a.kind === "customer" ? "Customer advance" : a.kind === "supplier" ? "Supplier advance" : "Credit note"), /* @__PURE__ */ React.createElement("td", { style: td }, a.party), /* @__PURE__ */ React.createElement("td", { style: td }, a.docNo), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(a.amt)), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontFamily: "monospace", fontSize: 11 } }, a.voucherNo), /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => undo(a) }, "Reverse"))))))));
};
const PartyTagger = ({ r, kind, onSave, list }) => {
  const [v, setV] = useState("");
  const id = "dl" + r.txnId;
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4 } }, /* @__PURE__ */ React.createElement("input", { className: "field-input", list: id, style: { padding: "4px 8px", fontSize: 12 }, placeholder: kind === "customer" ? "Whose advance? type customer\u2026" : "Whose advance? type supplier\u2026", value: v, onChange: (e) => setV(e.target.value) }), /* @__PURE__ */ React.createElement("datalist", { id }, (list || []).map((n) => /* @__PURE__ */ React.createElement("option", { key: n, value: n }))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", disabled: !v.trim(), onClick: () => onSave(r, v) }, "Save"));
};
const FxPage = ({ currentUser }) => {
  const [tick, setTick] = useState(0);
  const bump = () => setTick((t) => t + 1);
  const [tab, setTab] = useState("exposure");
  const [asOn, setAsOn] = useState(today());
  const [close, setClose] = useState({});
  const [autoRev, setAutoRev] = useState(true);
  const [newCur, setNewCur] = useState("USD");
  const [newRate, setNewRate] = useState("");
  const [newDate, setNewDate] = useState(today());
  const [selFY, setSelFY] = useState(getFY());
  const rates = getFxRates();
  const open = useMemo(() => getOpenFxInvoices(), [tick]);
  const rateFor = (c) => {
    const v = close[c] !== void 0 && close[c] !== "" ? parseFloat(close[c]) : rates[c] ? parseFloat(rates[c].rate) : 0;
    return v > 0 ? v : 0;
  };
  const rows = open.map((o) => {
    const cr = rateFor(o.cur);
    const reval = cr > 0 ? r2(o.fcOut * cr) : o.out;
    return { ...o, cr, reval, unreal: r2(reval - o.out) };
  });
  const curs = [...new Set(rows.map((r) => r.cur))];
  const byCur = curs.map((c) => {
    const rr = rows.filter((r) => r.cur === c);
    return { cur: c, fc: r2(rr.reduce((s, r) => s + r.fcOut, 0)), booked: r2(rr.reduce((s, r) => s + r.out, 0)), reval: r2(rr.reduce((s, r) => s + r.reval, 0)), unreal: r2(rr.reduce((s, r) => s + r.unreal, 0)), rate: rateFor(c) };
  });
  const totalUnreal = r2(byCur.reduce((s, c) => s + c.unreal, 0));
  const missing = curs.filter((c) => !(rateFor(c) > 0));
  const fyFrom = fyStartOf(selFY), fyTo = fyEndOf(selFY);
  const fxLines = useMemo(() => getAllLedgerLines().filter((l) => (l.account === "FX_GAIN" || l.account === "FX_LOSS") && (l.date || "") >= fyFrom && (l.date || "") <= fyTo).sort((a, b) => (b.date || "").localeCompare(a.date || "")), [tick, selFY]);
  const gainTot = r2(fxLines.reduce((s, l) => s + (l.account === "FX_GAIN" ? l.credit - l.debit : 0), 0)), lossTot = r2(fxLines.reduce((s, l) => s + (l.account === "FX_LOSS" ? l.debit - l.credit : 0), 0));
  const postReval = () => {
    if (missing.length) {
      toast.error("Enter the closing rate for " + missing.join(", "));
      return;
    }
    if (Math.abs(totalUnreal) < 5e-3) {
      toast.info("No difference to post");
      return;
    }
    const dup = getManualJournal().some((j) => j.referenceNo === "FX-REVAL" && j.date === asOn);
    if (dup && !window.confirm("A revaluation journal already exists for " + fmtDate(asOn) + ". Post another?")) return;
    const gain = totalUnreal > 0, amt = Math.abs(totalUnreal);
    const lines = gain ? [{ account: "TRADE_RECEIVABLE", desc: "Revalue foreign-currency receivables", debit: amt, credit: 0 }, { account: "FX_GAIN", desc: "Unrealised exchange gain", debit: 0, credit: amt }] : [{ account: "FX_LOSS", desc: "Unrealised exchange loss", debit: amt, credit: 0 }, { account: "TRADE_RECEIVABLE", desc: "Revalue foreign-currency receivables", debit: 0, credit: amt }];
    const jv = {
      id: newId("JV-"),
      date: asOn,
      narration: `Unrealised FX ${gain ? "gain" : "loss"} on open receivables \u2014 ${byCur.map((c) => `${c.cur} @ ${c.rate}`).join(", ")}`,
      referenceNo: "FX-REVAL",
      reportingMethod: "both",
      lines,
      voucherNo: nextVoucherNo(),
      txnRefNo: nextTxnRefNo(asOn),
      srcType: "JV",
      createdBy: (currentUser == null ? void 0 : currentUser.email) || ""
    };
    if (autoRev) jv.reverseDate = addDaysISO(asOn, 1);
    S.set(SK.JOURNAL, [...getManualJournal(), jv]);
    byCur.forEach((c) => saveFxRate(c.cur, c.rate, asOn));
    logAudit("FX_REVALUATION_POSTED", `${fmt(amt)} ${gain ? "gain" : "loss"} as on ${asOn}`, currentUser);
    bump();
    toast.success(`Revaluation ${gain ? "gain" : "loss"} of ${fmt(amt)} posted${autoRev ? " \u2014 auto-reverses next day" : ""}`);
  };
  const addRate = () => {
    const v = parseFloat(newRate);
    if (!(v > 0)) {
      toast.error("Enter a rate");
      return;
    }
    saveFxRate(newCur, v, newDate);
    setNewRate("");
    bump();
    toast.success("Rate saved");
  };
  const doExport = (f) => exportTableAs(
    f,
    "FX_Exposure",
    "Foreign-currency receivables",
    ["Invoice", "Customer", "Date", "Currency", "Outstanding (FC)", "Booked rate", "Booked (\u20B9)", "Closing rate", "Revalued (\u20B9)", "Unrealised gain/(loss)"],
    rows.map((r) => [r.invNo, r.party, fmtDate(r.date), r.cur, fmtN(r.fcOut), r.rate, fmtN(r.out), r.cr, fmtN(r.reval), fmtN(r.unreal)])
  );
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(InfoNote, null, "Create an invoice in USD, EUR, GBP\u2026 from the invoice form (Currency + exchange rate). The ledger is kept in \u20B9 at the booking rate. When the customer pays, Bank Reconciliation books the difference between the \u20B9 received and the \u20B9 booked as ", /* @__PURE__ */ React.createElement("b", null, "Foreign Exchange Gain / Loss"), " automatically. At period end, revalue what is still open here."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 } }, /* @__PURE__ */ React.createElement(Kpi, { label: "Open foreign invoices", value: String(open.length), sub: curs.join(", ") || "none" }), /* @__PURE__ */ React.createElement(Kpi, { label: "Booked value (\u20B9)", value: fmt(rows.reduce((s, r) => s + r.out, 0)) }), /* @__PURE__ */ React.createElement(Kpi, { label: "Unrealised gain / (loss)", value: fmt(totalUnreal), color: totalUnreal >= 0 ? "var(--green)" : "var(--red)", sub: "at the closing rates below" }), /* @__PURE__ */ React.createElement(Kpi, { label: `Realised FY ${selFY}-${String(selFY + 1).slice(2)}`, value: fmt(gainTot - lossTot), color: gainTot - lossTot >= 0 ? "var(--green)" : "var(--red)", sub: `gain ${fmt(gainTot)} \xB7 loss ${fmt(lossTot)}` })), /* @__PURE__ */ React.createElement(TabBar, { value: tab, onChange: setTab, tabs: [["exposure", "Exposure & revaluation"], ["rates", "Exchange rates"], ["realised", "Realised gain / loss"]] }), tab === "exposure" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Revalue as on"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: asOn, onChange: (e) => setAsOn(e.target.value) })), curs.map((c) => /* @__PURE__ */ React.createElement("div", { className: "field", key: c, style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Closing rate \u2014 \u20B9 per ", c), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { width: 130 }, value: close[c] !== void 0 ? close[c] : rates[c] ? rates[c].rate : "", onChange: (e) => setClose((x) => ({ ...x, [c]: e.target.value })) }))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), /* @__PURE__ */ React.createElement(ExportMenu, { onExport: doExport, disabled: !rows.length })), rows.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "No open foreign-currency invoices." }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Wrap, { min: 1e3 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Invoice"), /* @__PURE__ */ React.createElement("th", { style: th }, "Customer"), /* @__PURE__ */ React.createElement("th", { style: th }, "Date"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Outstanding (FC)"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Booked rate"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Booked \u20B9"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Closing rate"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Revalued \u20B9"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Unrealised")), /* @__PURE__ */ React.createElement("tbody", null, rows.map((r) => /* @__PURE__ */ React.createElement("tr", { key: r.invNo, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, fontFamily: "monospace" } }, r.invNo), /* @__PURE__ */ React.createElement("td", { style: td }, r.party), /* @__PURE__ */ React.createElement("td", { style: td }, fmtDate(r.date)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtC(r.fcOut, r.cur)), /* @__PURE__ */ React.createElement("td", { style: tdR }, r.rate), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(r.out)), /* @__PURE__ */ React.createElement("td", { style: tdR }, r.cr || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(r.reval)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700, color: r.unreal >= 0 ? "var(--green)" : "var(--red)" } }, fmt(r.unreal)))))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 12 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "flex", gap: 6, alignItems: "center", fontSize: 12, cursor: "pointer" } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: autoRev, onChange: (e) => setAutoRev(e.target.checked) }), " Auto-reverse the next day (recommended \u2014 the real gain/loss is booked when the customer pays)"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: postReval, disabled: !rows.length }, "Post revaluation journal (", fmt(totalUnreal), ")")), missing.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--red)", marginTop: 6 } }, "Enter a closing rate for ", missing.join(", "), "."))), tab === "rates" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Currency"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: newCur, onChange: (e) => setNewCur(e.target.value) }, FX_CURRENCIES.filter((c) => c.code !== "INR").map((c) => /* @__PURE__ */ React.createElement("option", { key: c.code, value: c.code }, c.code, " \u2014 ", c.name)))), /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "\u20B9 per 1 unit"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: newRate, onChange: (e) => setNewRate(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "As on"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: newDate, onChange: (e) => setNewDate(e.target.value) })), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: addRate }, "Save rate")), Object.keys(rates).length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "No rates saved yet. They are remembered automatically whenever you save a foreign-currency invoice." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 520 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Currency"), /* @__PURE__ */ React.createElement("th", { style: thR }, "\u20B9 per unit"), /* @__PURE__ */ React.createElement("th", { style: th }, "As on")), /* @__PURE__ */ React.createElement("tbody", null, Object.entries(rates).map(([c, v]) => /* @__PURE__ */ React.createElement("tr", { key: c, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, c, " \u2014 ", (FX_CURRENCIES.find((x) => x.code === c) || {}).name), /* @__PURE__ */ React.createElement("td", { style: tdR }, v.rate), /* @__PURE__ */ React.createElement("td", { style: td }, fmtDate(v.date))))))), tab === "realised" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement(FyPicker, { value: selFY, onChange: setSelFY })), fxLines.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "No exchange gain or loss has been booked in this year." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 760 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Date"), /* @__PURE__ */ React.createElement("th", { style: th }, "Narration"), /* @__PURE__ */ React.createElement("th", { style: th }, "Voucher"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Gain"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Loss")), /* @__PURE__ */ React.createElement("tbody", null, fxLines.map((l, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, fmtDate(l.date)), /* @__PURE__ */ React.createElement("td", { style: td }, l.narration), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontFamily: "monospace", fontSize: 11 } }, l.voucherNo), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--green)" } }, l.account === "FX_GAIN" ? fmt(l.credit - l.debit) : ""), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--red)" } }, l.account === "FX_LOSS" ? fmt(l.debit - l.credit) : "")))))));
};
const CashFlowRatiosPage = ({ currentUser }) => {
  const [tab, setTab] = useState("cashflow");
  const [selFY, setSelFY] = useState(getFY());
  const [from, setFrom] = useState(fyStartOf(getFY()));
  const [to, setTo] = useState(today());
  const pickFY = (y) => {
    setSelFY(y);
    setFrom(fyStartOf(y));
    const e = fyEndOf(y);
    setTo(e < today() ? e : today());
  };
  const cf = useMemo(() => getCashFlow(from, to), [from, to]);
  const rt = useMemo(() => getRatios(from, to), [from, to]);
  const rtPrev = useMemo(() => getRatios(shiftYear(from, -1), shiftYear(to, -1)), [from, to]);
  const prevMap = {};
  rtPrev.list.forEach((x) => {
    prevMap[x.k] = x.v;
  });
  const col = { good: "var(--green)", warn: "var(--gold)", bad: "var(--red)" };
  const [drill, setDrill] = useState([]);
  useEffect(() => {
    setDrill([]);
  }, [tab, from, to]);
  const lnk = { cursor: "pointer", color: "var(--primary2)", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3 };
  const pushDrill = (title, rows) => setDrill((d) => [...d, { title, rows }]);
  const pushLedger = (account) => setDrill((d) => [...d, { ledger: account, title: coaByKey(account).name }]);
  const itemRows = (items) => (items || []).map((it) => ({ label: coaByKey(it.account).name, amount: it.amount, account: it.account }));
  const rowOpen = (r) => r.account ? () => pushLedger(r.account) : r.items && r.items.length ? () => pushDrill(r.label, itemRows(r.items)) : null;
  const D = ({ on, children }) => on ? /* @__PURE__ */ React.createElement("span", { style: lnk, title: "Click to see the line items", onClick: on }, children) : /* @__PURE__ */ React.createElement(React.Fragment, null, children);
  const secRows = (rows) => rows.map((r) => ({ label: r.label, amount: r.amount, items: r.items }));
  const opRows = () => [{ label: "Net profit for the period", amount: cf.netProfit, items: cf.netProfitItems }, ...secRows(cf.adj), ...secRows(cf.wc)];
  const Line = ({ r, pad = 28, prefix = "" }) => {
    const on = rowOpen(r);
    return /* @__PURE__ */ React.createElement("tr", { style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, paddingLeft: pad } }, /* @__PURE__ */ React.createElement(D, { on }, prefix, r.label)), /* @__PURE__ */ React.createElement("td", { style: tdR }, /* @__PURE__ */ React.createElement(D, { on }, fmt(r.amount))));
  };
  const Total = ({ label, amount, rows, color }) => {
    const on = rows && rows.length ? () => pushDrill(label, rows) : null;
    return /* @__PURE__ */ React.createElement("tr", { style: { borderBottom: "2px solid var(--border2)" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 800 } }, /* @__PURE__ */ React.createElement(D, { on }, label)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 800, color } }, /* @__PURE__ */ React.createElement(D, { on }, fmt(amount))));
  };
  const Sec = ({ title, rows, total, totalLabel }) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("td", { colSpan: 2, style: { ...td, fontWeight: 800, fontSize: 12.5 } }, title)), rows.length === 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { ...td, paddingLeft: 28, color: "var(--text3)" } }, "No movement"), /* @__PURE__ */ React.createElement("td", { style: tdR }, "\u2014")), rows.map((r, i) => /* @__PURE__ */ React.createElement(Line, { key: i, r })), /* @__PURE__ */ React.createElement(Total, { label: totalLabel, amount: total, rows: secRows(rows), color: total >= 0 ? "var(--green)" : "var(--red)" }));
  const cashRows = (which) => cf.cashItems.map((c) => ({ label: coaByKey(c.account).name, amount: which === "open" ? c.open : c.close, account: c.account }));
  const doExport = (f) => {
    if (tab === "cashflow") {
      const rows = [["Net profit for the period", fmtN(cf.netProfit)], ...cf.adj.map((r) => ["  " + r.label, fmtN(r.amount)]), ...cf.wc.map((r) => ["  " + r.label, fmtN(r.amount)]), ["NET CASH FROM OPERATING ACTIVITIES", fmtN(cf.cfo)], ...cf.invAll.map((r) => ["  " + r.label, fmtN(r.amount)]), ["NET CASH FROM INVESTING ACTIVITIES", fmtN(cf.cfi)], ...cf.fin.map((r) => ["  " + r.label, fmtN(r.amount)]), ["NET CASH FROM FINANCING ACTIVITIES", fmtN(cf.cff)], ["NET INCREASE / (DECREASE) IN CASH", fmtN(cf.netChange)], ["Cash & bank \u2014 opening", fmtN(cf.cashOpen)], ["Cash & bank \u2014 closing", fmtN(cf.cashClose)]];
      exportTableAs(f, `CashFlow_${from}_to_${to}`, `Cash Flow Statement (${fmtDate(from)} to ${fmtDate(to)})`, ["Particulars", "Amount (Rs)"], rows);
    } else exportTableAs(f, `Ratios_${from}_to_${to}`, `Ratio Analysis (${fmtDate(from)} to ${fmtDate(to)})`, ["Group", "Ratio", "This period", "Previous year", "How it is calculated"], rt.list.map((x) => [x.g, x.label, fmtRatio(x.v, x.t), fmtRatio(prevMap[x.k], x.t), x.note]));
  };
  const groups = ["Liquidity", "Profitability", "Leverage", "Efficiency"];
  const top = drill[drill.length - 1];
  if (top) {
    const crumbs = [{ label: "Cash Flow Statement", onClick: () => setDrill([]) }, ...drill.map((d, i) => ({ label: d.title, onClick: i < drill.length - 1 ? () => setDrill(drill.slice(0, i + 1)) : void 0 }))];
    if (top.ledger) return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(Breadcrumb, { items: crumbs }), /* @__PURE__ */ React.createElement(LedgerTable, { account: top.ledger, fromDate: from, toDate: to }));
    const tot = r2(top.rows.reduce((x, r) => x + (+r.amount || 0), 0));
    return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(Breadcrumb, { items: crumbs }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text3)", marginBottom: 10 } }, fmtDate(from), " to ", fmtDate(to), " \xB7 click a ledger to see its transactions"), /* @__PURE__ */ React.createElement(Wrap, { min: 420 }, /* @__PURE__ */ React.createElement("tbody", null, top.rows.length === 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { ...td, color: "var(--text3)" } }, "Nothing to show"), /* @__PURE__ */ React.createElement("td", { style: tdR }, "\u2014")), top.rows.map((r, i) => {
      const on = r.account ? () => pushLedger(r.account) : r.sub ? () => pushDrill(r.label, r.sub) : r.items && r.items.length ? () => pushDrill(r.label, itemRows(r.items)) : null;
      return /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement(D, { on }, r.label)), /* @__PURE__ */ React.createElement("td", { style: tdR }, /* @__PURE__ */ React.createElement(D, { on }, fmt(r.amount))));
    }), /* @__PURE__ */ React.createElement("tr", { style: { borderTop: "2px solid var(--border2)" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 800 } }, "Total"), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 800 } }, fmt(tot))))));
  }
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 12 } }, /* @__PURE__ */ React.createElement(FyPicker, { value: selFY, onChange: pickFY }), /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "From"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: from, onChange: (e) => setFrom(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "To"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: to, onChange: (e) => setTo(e.target.value) })), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), /* @__PURE__ */ React.createElement(ExportMenu, { onExport: doExport })), /* @__PURE__ */ React.createElement(TabBar, { value: tab, onChange: setTab, tabs: [["cashflow", "Cash Flow Statement"], ["ratios", "Ratio Analysis"]] }), tab === "cashflow" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 } }, /* @__PURE__ */ React.createElement(Kpi, { label: "Operating", value: fmt(cf.cfo), color: cf.cfo >= 0 ? "var(--green)" : "var(--red)" }), /* @__PURE__ */ React.createElement(Kpi, { label: "Investing", value: fmt(cf.cfi), color: cf.cfi >= 0 ? "var(--green)" : "var(--gold)" }), /* @__PURE__ */ React.createElement(Kpi, { label: "Financing", value: fmt(cf.cff) }), /* @__PURE__ */ React.createElement(Kpi, { label: "Closing cash & bank", value: fmt(cf.cashClose), color: "var(--primary2)" })), /* @__PURE__ */ React.createElement(Wrap, { min: 560 }, /* @__PURE__ */ React.createElement("tbody", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 800 } }, /* @__PURE__ */ React.createElement(D, { on: () => pushDrill("Operating activities", opRows()) }, "A. Cash flow from operating activities")), /* @__PURE__ */ React.createElement("td", { style: tdR })), /* @__PURE__ */ React.createElement(Line, { r: { label: "Net profit for the period", amount: cf.netProfit, items: cf.netProfitItems } }), cf.adj.map((r, i) => /* @__PURE__ */ React.createElement(Line, { key: "a" + i, r, prefix: "Add / (less): " })), cf.wc.map((r, i) => /* @__PURE__ */ React.createElement(Line, { key: "w" + i, r })), /* @__PURE__ */ React.createElement(Total, { label: "Net cash from operating activities", amount: cf.cfo, rows: opRows(), color: cf.cfo >= 0 ? "var(--green)" : "var(--red)" }), /* @__PURE__ */ React.createElement(Sec, { title: "B. Cash flow from investing activities", rows: cf.invAll, total: cf.cfi, totalLabel: "Net cash from investing activities" }), /* @__PURE__ */ React.createElement(Sec, { title: "C. Cash flow from financing activities", rows: cf.fin, total: cf.cff, totalLabel: "Net cash from financing activities" }), /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 800 } }, /* @__PURE__ */ React.createElement(D, { on: () => pushDrill("Net increase / (decrease) in cash", [{ label: "Operating activities", amount: cf.cfo, items: null, sub: opRows() }, { label: "Investing activities", amount: cf.cfi, sub: secRows(cf.invAll) }, { label: "Financing activities", amount: cf.cff, sub: secRows(cf.fin) }]) }, "Net increase / (decrease) in cash (A+B+C)")), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 800 } }, fmt(cf.netChange))), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement(D, { on: () => pushDrill("Cash & bank at the beginning", cashRows("open")) }, "Cash & bank at the beginning")), /* @__PURE__ */ React.createElement("td", { style: tdR }, /* @__PURE__ */ React.createElement(D, { on: () => pushDrill("Cash & bank at the beginning", cashRows("open")) }, fmt(cf.cashOpen)))), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 800 } }, /* @__PURE__ */ React.createElement(D, { on: () => pushDrill("Cash & bank at the end", cashRows("close")) }, "Cash & bank at the end")), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 800 } }, /* @__PURE__ */ React.createElement(D, { on: () => pushDrill("Cash & bank at the end", cashRows("close")) }, fmt(cf.cashClose)))))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, fontSize: 12, color: Math.abs(cf.diff) < 0.5 ? "var(--green)" : "var(--red)" } }, Math.abs(cf.diff) < 0.5 ? "\u2713 Ties to the closing balance of your Cash & Bank ledgers." : "\u26A0 Difference of " + fmt(cf.diff) + " against ledger cash \u2014 check for entries dated outside the period."), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", marginTop: 4 } }, "Indirect method (AS-3 / Ind AS 7). Interest paid is left inside operating activities.")), tab === "ratios" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text3)", marginBottom: 12 } }, "Period of ", rt.base.days, " days \xB7 revenue ", fmt(rt.base.revenue), " \xB7 net profit ", fmt(rt.base.np), ". Compared with the same period last year."), groups.map((g) => /* @__PURE__ */ React.createElement("div", { key: g, style: { marginBottom: 18 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 13, marginBottom: 8 } }, g), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 10 } }, rt.list.filter((x) => x.g === g).map((x) => {
    const st = x.v == null ? null : x.good(x.v);
    const pv = prevMap[x.k];
    return /* @__PURE__ */ React.createElement("div", { key: x.k, className: "card", style: { padding: "12px 14px", borderLeft: `3px solid ${st ? col[st] : "var(--border2)"}` }, title: x.note }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", fontWeight: 600 } }, x.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 21, fontWeight: 800, fontFamily: "Sora,sans-serif", color: st ? col[st] : "var(--text3)", margin: "4px 0" } }, fmtRatio(x.v, x.t)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10.5, color: "var(--text3)" } }, "Last year: ", fmtRatio(pv, x.t)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text3)", marginTop: 4, lineHeight: 1.35 } }, x.note));
  }))))));
};
const BudgetPage = ({ currentUser }) => {
  const [selFY, setSelFY] = useState(getFY());
  const [kind, setKind] = useState("expense");
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState({});
  const nowIdx = ((/* @__PURE__ */ new Date()).getMonth() + 9) % 12;
  const [m1, setM1] = useState(0);
  const [m2, setM2] = useState(selFY === getFY() ? nowIdx : 11);
  const [uplift, setUplift] = useState("10");
  const [tick, setTick] = useState(0);
  const budget = useMemo(() => getBudgetFY(selFY), [selFY, tick]);
  const actual = useMemo(() => getMonthlyActuals(selFY), [selFY, tick]);
  const accts = getAllAccounts().filter((a) => a.type === kind && !a.groupOnly);
  const sumR = (arr, a, b) => (arr || new Array(12).fill(0)).slice(a, b + 1).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const heads = accts.filter((a) => edit || sumR(budget[a.key], 0, 11) !== 0 || sumR(actual[a.key], 0, 11) !== 0);
  const changeFY = (y) => {
    setSelFY(y);
    setM1(0);
    setM2(y === getFY() ? nowIdx : 11);
    setEdit(false);
  };
  const rows = heads.map((a) => {
    const b = sumR(budget[a.key], m1, m2), ac = sumR(actual[a.key], m1, m2);
    const isExp = kind === "expense";
    const variance = isExp ? r2(b - ac) : r2(ac - b);
    const pct = b > 0 ? ac / b * 100 : ac > 0 ? 999 : 0;
    const st = b <= 0 ? ac > 0 ? "unbudgeted" : "none" : isExp ? pct > 100 ? "over" : pct >= 90 ? "near" : "ok" : pct >= 100 ? "ok" : pct >= 80 ? "near" : "over";
    return { a, b, ac, variance, pct, st };
  });
  const tb = rows.reduce((s, r) => s + r.b, 0), ta = rows.reduce((s, r) => s + r.ac, 0), overN = rows.filter((r) => r.st === "over" || r.st === "unbudgeted").length;
  const stCol = { ok: "var(--green)", near: "var(--gold)", over: "var(--red)", unbudgeted: "var(--red)", none: "var(--text3)" };
  const stTxt = kind === "expense" ? { ok: "Within budget", near: "Near limit", over: "Over budget", unbudgeted: "No budget set", none: "" } : { ok: "On target", near: "Slightly behind", over: "Behind target", unbudgeted: "No target set", none: "" };
  const startEdit = () => {
    const d = {};
    accts.forEach((a) => {
      d[a.key] = (budget[a.key] || new Array(12).fill(0)).map((v) => v || "");
    });
    setDraft(d);
    setEdit(true);
  };
  const setM = (k, i, v) => setDraft((d) => ({ ...d, [k]: d[k].map((x, j) => j === i ? v : x) }));
  const setAnnual = (k, v) => {
    const n = parseFloat(v) || 0;
    setDraft((d) => ({ ...d, [k]: new Array(12).fill(0).map((_, i) => n ? r2(n / 12) : "") }));
  };
  const fromLY = () => {
    const ly = getMonthlyActuals(selFY - 1), f = 1 + (parseFloat(uplift) || 0) / 100;
    setDraft((d) => {
      const n = { ...d };
      accts.forEach((a) => {
        if (ly[a.key]) n[a.key] = ly[a.key].map((v) => v ? r2(v * f) : "");
      });
      return n;
    });
    toast.info(`Filled from FY ${selFY - 1} actuals +${uplift || 0}% \u2014 review and save`);
  };
  const saveDraft = () => {
    const all = { ...budget };
    accts.forEach((a) => {
      const arr = (draft[a.key] || []).map((v) => parseFloat(v) || 0);
      if (arr.some((v) => v)) all[a.key] = arr;
      else delete all[a.key];
    });
    saveBudgetFY(selFY, all);
    logAudit("BUDGET_SAVED", `FY ${selFY}-${String(selFY + 1).slice(2)} ${kind}`, currentUser);
    setEdit(false);
    setTick((t) => t + 1);
    toast.success("Budget saved");
  };
  const doExport = (f) => exportTableAs(
    f,
    `Budget_vs_Actual_FY${selFY}_${kind}`,
    `Budget vs Actual \u2014 ${kind === "expense" ? "Expense" : "Income"} heads (${FY_MONTHS[m1]} to ${FY_MONTHS[m2]} FY ${selFY}-${String(selFY + 1).slice(2)})`,
    ["Head", "Budget", "Actual", "Variance", "% used"],
    [...rows.map((r) => [r.a.name, fmtN(r.b), fmtN(r.ac), fmtN(r.variance), r.b > 0 ? r.pct.toFixed(1) + "%" : "\u2014"]), ["Total", fmtN(tb), fmtN(ta), fmtN(kind === "expense" ? tb - ta : ta - tb), tb > 0 ? (ta / tb * 100).toFixed(1) + "%" : "\u2014"]]
  );
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 12 } }, /* @__PURE__ */ React.createElement(FyPicker, { value: selFY, onChange: changeFY }), /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "From month"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: m1, onChange: (e) => setM1(Math.min(+e.target.value, m2)) }, FY_MONTHS.map((m, i) => /* @__PURE__ */ React.createElement("option", { key: m, value: i }, m)))), /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "To month"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: m2, onChange: (e) => setM2(Math.max(+e.target.value, m1)) }, FY_MONTHS.map((m, i) => /* @__PURE__ */ React.createElement("option", { key: m, value: i }, m)))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), !edit && /* @__PURE__ */ React.createElement(ExportMenu, { onExport: doExport, disabled: !rows.length }), !edit ? /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: startEdit }, "Set / edit budget") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: saveDraft }, "Save budget"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: () => setEdit(false) }, "Cancel"))), /* @__PURE__ */ React.createElement(TabBar, { value: kind, onChange: (k) => {
    setKind(k);
    setEdit(false);
  }, tabs: [["expense", "Expense heads"], ["income", "Income heads"]] }), !edit && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 } }, /* @__PURE__ */ React.createElement(Kpi, { label: "Budget", value: fmt(tb) }), /* @__PURE__ */ React.createElement(Kpi, { label: "Actual", value: fmt(ta), color: "var(--primary2)" }), /* @__PURE__ */ React.createElement(Kpi, { label: kind === "expense" ? "Remaining / (overspent)" : "Ahead / (behind)", value: fmt(kind === "expense" ? tb - ta : ta - tb), color: (kind === "expense" ? tb - ta : ta - tb) >= 0 ? "var(--green)" : "var(--red)" }), /* @__PURE__ */ React.createElement(Kpi, { label: "Heads needing attention", value: String(overN), color: overN ? "var(--red)" : "var(--green)", sub: kind === "expense" ? "over budget or unbudgeted" : "behind target" })), rows.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "No budget or activity yet. Click \u201CSet / edit budget\u201D to enter one for each head." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 820 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Head"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Budget"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Actual"), /* @__PURE__ */ React.createElement("th", { style: thR }, kind === "expense" ? "Remaining" : "Ahead/(behind)"), /* @__PURE__ */ React.createElement("th", { style: { ...th, minWidth: 170 } }, "Used"), /* @__PURE__ */ React.createElement("th", { style: th }, "Status")), /* @__PURE__ */ React.createElement("tbody", null, rows.map((r) => /* @__PURE__ */ React.createElement("tr", { key: r.a.key, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 600 } }, r.a.name), /* @__PURE__ */ React.createElement("td", { style: tdR }, r.b ? fmt(r.b) : "\u2014"), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(r.ac)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700, color: r.variance >= 0 ? "var(--green)" : "var(--red)" } }, r.b || r.ac ? fmt(r.variance) : "\u2014"), /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, height: 7, background: "var(--card3)", borderRadius: 4, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { width: Math.min(100, r.pct) + "%", height: "100%", background: stCol[r.st] } })), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, minWidth: 40, textAlign: "right" } }, r.b > 0 ? r.pct.toFixed(0) + "%" : "\u2014"))), /* @__PURE__ */ React.createElement("td", { style: { ...td, color: stCol[r.st], fontWeight: 600, fontSize: 11.5 } }, stTxt[r.st]))), /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)", fontWeight: 800 } }, /* @__PURE__ */ React.createElement("td", { style: td }, "Total"), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(tb)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(ta)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(kind === "expense" ? tb - ta : ta - tb)), /* @__PURE__ */ React.createElement("td", { style: td }, tb > 0 ? (ta / tb * 100).toFixed(0) + "%" : "\u2014"), /* @__PURE__ */ React.createElement("td", { style: td }))))), edit && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(InfoNote, null, "Type a ", /* @__PURE__ */ React.createElement("b", null, "yearly"), " figure to spread it evenly across the 12 months, or type each month yourself (seasonal costs). Leave a head blank for no budget. Actuals come straight from the ledger."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12 } }, "Quick fill from last year\u2019s actuals, plus"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { width: 70, padding: "5px 8px" }, value: uplift, onChange: (e) => setUplift(e.target.value) }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12 } }, "%"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: fromLY }, "Fill budget")), /* @__PURE__ */ React.createElement("div", { style: { overflow: "auto", maxHeight: "58vh", border: "1px solid var(--border)", borderRadius: 10 } }, /* @__PURE__ */ React.createElement("table", { style: { borderCollapse: "collapse", minWidth: 1250, width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)", position: "sticky", top: 0, zIndex: 2 } }, /* @__PURE__ */ React.createElement("th", { style: { ...th, minWidth: 200 } }, "Head"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Yearly"), FY_MONTHS.map((m) => /* @__PURE__ */ React.createElement("th", { key: m, style: thR }, m)))), /* @__PURE__ */ React.createElement("tbody", null, accts.map((a) => {
    const arr = draft[a.key] || new Array(12).fill("");
    const yr = r2(arr.reduce((s, v) => s + (parseFloat(v) || 0), 0));
    return /* @__PURE__ */ React.createElement("tr", { key: a.key, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 600 } }, a.name), /* @__PURE__ */ React.createElement("td", { style: { padding: "4px 6px" } }, /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { width: 100, padding: "5px 6px", textAlign: "right" }, value: yr || "", onChange: (e) => setAnnual(a.key, e.target.value), placeholder: "0" })), arr.map((v, i) => /* @__PURE__ */ React.createElement("td", { key: i, style: { padding: "4px 3px" } }, /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { width: 74, padding: "5px 5px", textAlign: "right", fontSize: 11.5 }, value: v, onChange: (e) => setM(a.key, i, e.target.value) }))));
  }))))));
};
const PAGE_TITLES = {
  salesorders: "Sales Orders",
  vendorcredits: "Vendor Credits",
  recbills: "Recurring Bills",
  bankoverview: "Banking Overview",
  txnlock: "Transaction Locking",
  morereports: "More Reports",
  overview: "Business Overview",
  ewaybill: "e-Way Bills",
  timetrack: "Time Tracking",
  pr_dashboard: "Payroll",
  pr_employees: "Employees",
  pr_payruns: "Pay Runs",
  pr_loans: "Employee Loans",
  pr_form16: "Form 16",
  pr_docs: "Payslips",
  pr_reports: "Payroll Reports",
  pr_settings: "Payroll Settings",
  payrecv: "Payments Received",
  paymade: "Payments Made",
  vendors: "Vendors",
  statements: "Statement of Accounts",
  gstfiling: "GST Filing",
  reportscenter: "Reports Centre",
  invoice: "New Invoice",
  history: "Invoice History",
  pohistory: "Purchase Orders",
  expenses: "Purchases",
  customers: "Customer Database",
  dashboard: "Dashboard",
  company: "Company Settings",
  hsn: "HSN / SAC Database",
  terms: "Terms & Conditions",
  admin: "Admin Panel",
  inventory: "Inventory & Stock",
  aging: "Ageing \u2014 Receivables & Payables",
  bankrecon: "Bank Reconciliation",
  salesview: "Sales",
  reports: "Financial Statements",
  coa: "Chart of Accounts",
  journal: "Journal Vouchers",
  ledger: "General Ledger",
  trialbalance: "Trial Balance",
  cashflow: "Cash Flow & Ratio Analysis",
  budget: "Budget vs Actual",
  fixedassets: "Fixed Asset Register",
  recjournal: "Recurring Journal Vouchers",
  advances: "Advance & Credit Note Application",
  fxpage: "Multi-Currency & Exchange Gain/Loss",
  quotations: "Quotations / Estimates",
  dc: "Delivery Challans",
  recurring: "Recurring Invoices",
  reminders: "Payment Reminders"
};
const PAGE_SECTIONS = {
  salesorders: "Sales",
  ewaybill: "Sales",
  vendorcredits: "Purchases",
  recbills: "Purchases",
  bankoverview: "Accounting",
  txnlock: "Accounting",
  morereports: "Reports",
  overview: "Reports",
  timetrack: "Time Tracking",
  pr_dashboard: "Payroll",
  pr_employees: "Payroll",
  pr_payruns: "Payroll",
  pr_loans: "Payroll",
  pr_form16: "Payroll",
  pr_docs: "Payroll",
  pr_reports: "Payroll",
  pr_settings: "Payroll",
  payrecv: "Sales",
  paymade: "Purchases",
  vendors: "Purchases",
  statements: "Reports",
  gstfiling: "Filing & Compliance",
  reportscenter: "Reports",
  invoice: "Sales",
  history: "Sales",
  quotations: "Sales",
  dc: "Sales",
  recurring: "Sales",
  salesview: "Sales",
  reminders: "Sales",
  customers: "Sales",
  pohistory: "Purchases",
  expenses: "Purchases",
  inventory: "Inventory",
  dashboard: "Overview",
  aging: "Accounting",
  bankrecon: "Accounting",
  reports: "Accounting",
  coa: "Accounting",
  journal: "Accounting",
  ledger: "Accounting",
  trialbalance: "Accounting",
  cashflow: "Accounting",
  budget: "Accounting",
  fixedassets: "Accounting",
  recjournal: "Accounting",
  advances: "Accounting",
  fxpage: "Accounting",
  company: "Settings",
  hsn: "Settings",
  terms: "Settings",
  admin: "Settings"
};
const SEARCHABLE_PAGES = ["history", "pohistory", "expenses", "customers", "hsn"];
const useClickAway = (ref, fn) => {
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) fn();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
};
const TopSearch = ({ page, value, onChange, onGoSearch }) => {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === "k") {
        e.preventDefault();
        window.dispatchEvent(new Event("ab-palette"));
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  const can = SEARCHABLE_PAGES.includes(page);
  return /* @__PURE__ */ React.createElement("div", { className: "tb2-search" }, /* @__PURE__ */ React.createElement(Ic, { n: "search", s: 14 }), /* @__PURE__ */ React.createElement(
    "input",
    {
      ref,
      value,
      onChange: (e) => onChange(e.target.value),
      placeholder: can ? "Search this list\u2026" : "Search\u2026  (Enter)",
      onKeyDown: (e) => {
        if (e.key === "Enter" && !can && value.trim()) onGoSearch();
        if (e.key === "Escape") {
          onChange("");
          e.target.blur();
        }
      }
    }
  ), value ? /* @__PURE__ */ React.createElement("button", { className: "tb2-clear", title: "Clear", onClick: () => onChange("") }, /* @__PURE__ */ React.createElement(Ic, { n: "x", s: 11 })) : /* @__PURE__ */ React.createElement("kbd", { style: { cursor: "pointer" }, title: "Open command palette", onClick: () => window.dispatchEvent(new Event("ab-palette")) }, "Ctrl K"));
};
const TopQuickCreate = ({ user, canSee: canSee2, go, newInvoice: newInvoice2 }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickAway(ref, () => setOpen(false));
  const items = [
    ["Sales invoice", "Create a GST invoice", () => newInvoice2(), "file", true],
    ["Purchase bill", "Record a vendor bill", () => go("expenses"), "cart", canSee2(user.role, "expenses")],
    ["Journal voucher", "Manual accounting entry", () => go("journal"), "list", canSee2(user.role, "reports")],
    ["Bank entry", "Match receipts & payments", () => go("bankrecon"), "bank", canSee2(user.role, "bankrecon")],
    ["Customer", "Add to customer database", () => go("customers"), "users", canSee2(user.role, "customers")]
  ].filter((x) => x[4]);
  return /* @__PURE__ */ React.createElement("div", { className: "tb2-menu-wrap", ref }, /* @__PURE__ */ React.createElement("button", { className: "tb2-new", onClick: () => setOpen((o) => !o) }, /* @__PURE__ */ React.createElement(Ic, { n: "plus", s: 14 }), /* @__PURE__ */ React.createElement("span", { className: "tb2-hide-sm" }, "New"), /* @__PURE__ */ React.createElement(Ic, { n: "chevron", s: 10 })), open && /* @__PURE__ */ React.createElement("div", { className: "tb2-menu", style: { right: 0, minWidth: 250 } }, /* @__PURE__ */ React.createElement("div", { className: "tb2-menu-head" }, "Create new"), items.map(([t, sub, fn, ic]) => /* @__PURE__ */ React.createElement("div", { key: t, className: "tb2-menu-item", onClick: () => {
    setOpen(false);
    fn();
  } }, /* @__PURE__ */ React.createElement("span", { className: "tb2-menu-ic" }, /* @__PURE__ */ React.createElement(Ic, { n: ic, s: 14 })), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("div", { className: "tb2-menu-t" }, t), /* @__PURE__ */ React.createElement("div", { className: "tb2-menu-s" }, sub))))));
};
const SyncDot = () => {
  const [ok, setOk] = useState(_cloudReady);
  useEffect(() => {
    const t = setInterval(() => setOk(_cloudReady), 4e3);
    return () => clearInterval(t);
  }, []);
  return /* @__PURE__ */ React.createElement("div", { className: "tb2-sync " + (ok ? "ok" : "off"), title: ok ? "Connected \u2014 all changes are saved to the cloud" : "Offline \u2014 changes will NOT be saved until the connection returns" }, /* @__PURE__ */ React.createElement("span", { className: "tb2-sync-dot" }), /* @__PURE__ */ React.createElement("span", { className: "tb2-hide-md" }, ok ? "Synced" : "Offline"));
};
const TopUserMenu = ({ user, theme, setTheme, logout, goCompany }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickAway(ref, () => setOpen(false));
  return /* @__PURE__ */ React.createElement("div", { className: "tb2-menu-wrap", ref }, /* @__PURE__ */ React.createElement("div", { className: "tb2-user" + (open ? " open" : ""), onClick: () => setOpen((o) => !o) }, /* @__PURE__ */ React.createElement("div", { className: "tb2-avatar" }, (user.name || "?")[0].toUpperCase()), /* @__PURE__ */ React.createElement("div", { className: "tb2-user-txt tb2-hide-sm" }, /* @__PURE__ */ React.createElement("div", { className: "tb2-user-name" }, user.name), /* @__PURE__ */ React.createElement("div", { className: "tb2-role" }, user.role)), /* @__PURE__ */ React.createElement(Ic, { n: "chevron", s: 10 })), open && /* @__PURE__ */ React.createElement("div", { className: "tb2-menu", style: { right: 0, minWidth: 220 } }, /* @__PURE__ */ React.createElement("div", { className: "tb2-menu-head", style: { textTransform: "none", letterSpacing: 0 } }, /* @__PURE__ */ React.createElement("b", { style: { color: "var(--text)", fontSize: 13 } }, user.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", fontWeight: 500 } }, user.email || user.role)), /* @__PURE__ */ React.createElement("div", { className: "tb2-menu-item", onClick: () => {
    setTheme((t) => t === "dark" ? "light" : "dark");
    setOpen(false);
  } }, /* @__PURE__ */ React.createElement("span", { className: "tb2-menu-ic" }, /* @__PURE__ */ React.createElement(Ic, { n: theme === "dark" ? "sun" : "moon", s: 14 })), /* @__PURE__ */ React.createElement("span", { className: "tb2-menu-t" }, theme === "dark" ? "Switch to light mode" : "Switch to dark mode")), /* @__PURE__ */ React.createElement("div", { className: "tb2-menu-item", onClick: () => {
    setOpen(false);
    goCompany();
  } }, /* @__PURE__ */ React.createElement("span", { className: "tb2-menu-ic" }, /* @__PURE__ */ React.createElement(Ic, { n: "settings", s: 14 })), /* @__PURE__ */ React.createElement("span", { className: "tb2-menu-t" }, "Company settings")), /* @__PURE__ */ React.createElement("div", { className: "tb2-menu-sep" }), /* @__PURE__ */ React.createElement("div", { className: "tb2-menu-item danger", onClick: () => {
    setOpen(false);
    logout();
  } }, /* @__PURE__ */ React.createElement("span", { className: "tb2-menu-ic" }, /* @__PURE__ */ React.createElement(Ic, { n: "logout", s: 14 })), /* @__PURE__ */ React.createElement("span", { className: "tb2-menu-t" }, "Log out"))));
};
const fmtShort = (n) => {
  const v = Math.abs(Number(n) || 0), sg = (Number(n) || 0) < 0 ? "-" : "";
  return v >= 1e7 ? `${sg}\u20B9${(v / 1e7).toFixed(2)} Cr` : v >= 1e5 ? `${sg}\u20B9${(v / 1e5).toFixed(2)} L` : `${sg}\u20B9${Math.round(v).toLocaleString("en-IN")}`;
};
const computePulse = () => {
  const td2 = today(), in7 = addDaysISO(td2, 7);
  const ar = getOpenItems("credit"), ap = getOpenItems("debit");
  const sum = (a) => r2(a.reduce((s, o) => s + o.out, 0));
  const dueOf = (o) => o.due || o.date || td2;
  const arOver = ar.filter((o) => dueOf(o) < td2), apOver = ap.filter((o) => dueOf(o) < td2);
  const arSoon = ar.filter((o) => dueOf(o) >= td2 && dueOf(o) <= in7), apSoon = ap.filter((o) => dueOf(o) >= td2 && dueOf(o) <= in7);
  const unrec = (S.get(SK.BANK, []) || []).filter((t) => !t.matched).length;
  const cn = getOpenCreditNotes(), adv = getAdvanceRows().filter((r) => r.balance > 0.01);
  const rj = (S.get(SK.RJV, []) || []).filter((t) => {
    const g = parseInt(t.generated, 10) || 0;
    return t.active && g < rjvTotal(t) && rjvDate(t, g) <= td2;
  }).length;
  const tb = getTrialBalance(td2);
  const cash = r2(tb.filter((r) => isCashAcct(coaByKey(r.account))).reduce((s, r) => s + r.balance, 0));
  const over = [];
  const fy = getFY();
  const bud = getBudgetFY(fy);
  const bk = Object.keys(bud);
  if (bk.length) {
    const act = getMonthlyActuals(fy);
    const mi = ((/* @__PURE__ */ new Date()).getMonth() + 9) % 12;
    bk.forEach((k) => {
      const a = coaByKey(k);
      if (a.type !== "expense") return;
      const b = (bud[k] || []).slice(0, mi + 1).reduce((s, v) => s + (+v || 0), 0), ac = (act[k] || []).slice(0, mi + 1).reduce((s, v) => s + v, 0);
      if (b > 0 && ac > b + 0.5) over.push({ name: a.name, by: r2(ac - b) });
    });
  }
  const co = S.get(SK.CO, {}) || {};
  let gst = [];
  if (co.gstin) {
    const dn = /* @__PURE__ */ new Date();
    const nxt = (day) => {
      let d = new Date(dn.getFullYear(), dn.getMonth(), day);
      if (_iso(d) < td2) d = new Date(dn.getFullYear(), dn.getMonth() + 1, day);
      return _iso(d);
    };
    gst = [["GSTR-1", nxt(11)], ["GSTR-3B", nxt(20)]].map(([name, date]) => ({ name, date, days: daysBetween(td2, date) }));
  }
  const alerts = [];
  if (arOver.length) alerts.push({ tone: "red", t: `${arOver.length} overdue invoice${arOver.length > 1 ? "s" : ""}`, s: `${fmt(sum(arOver))} to collect`, p: "aging" });
  if (apOver.length) alerts.push({ tone: "red", t: `${apOver.length} overdue bill${apOver.length > 1 ? "s" : ""}`, s: `${fmt(sum(apOver))} to pay`, p: "aging" });
  if (over.length) alerts.push({ tone: "red", t: `${over.length} budget head${over.length > 1 ? "s" : ""} overspent`, s: over.slice(0, 2).map((o) => o.name).join(", ") + (over.length > 2 ? "\u2026" : ""), p: "budget" });
  gst.filter((g) => g.days <= 7).forEach((g) => alerts.push({ tone: g.days <= 3 ? "red" : "amber", t: `${g.name} due ${g.days === 0 ? "today" : "in " + g.days + " day" + (g.days > 1 ? "s" : "")}`, s: `${fmtDate(g.date)} \xB7 monthly filers`, p: "history" }));
  if (arSoon.length) alerts.push({ tone: "amber", t: `${arSoon.length} invoice${arSoon.length > 1 ? "s" : ""} due this week`, s: `${fmt(sum(arSoon))} expected`, p: "aging" });
  if (apSoon.length) alerts.push({ tone: "amber", t: `${apSoon.length} bill${apSoon.length > 1 ? "s" : ""} due this week`, s: `${fmt(sum(apSoon))} to pay`, p: "aging" });
  if (unrec) alerts.push({ tone: "amber", t: `${unrec} bank line${unrec > 1 ? "s" : ""} to reconcile`, s: "Match them to invoices, bills or ledgers", p: "bankrecon" });
  if (rj) alerts.push({ tone: "blue", t: `${rj} recurring entr${rj > 1 ? "ies" : "y"} waiting to post`, s: "Open Recurring Journals to post them", p: "recjournal" });
  if (adv.length) alerts.push({ tone: "blue", t: `${adv.length} unapplied advance${adv.length > 1 ? "s" : ""}`, s: `${fmt(adv.reduce((s, r) => s + r.balance, 0))} can be set off`, p: "advances" });
  if (cn.length) alerts.push({ tone: "blue", t: `${cn.length} credit note${cn.length > 1 ? "s" : ""} not settled`, s: `${fmt(cn.reduce((s, c) => s + c.out, 0))} open`, p: "advances" });
  return { cash, recv: sum(ar), pay: sum(ap), recvOver: sum(arOver), payOver: sum(apOver), alerts };
};
const useHeaderPulse = (page) => {
  const [d, setD] = useState(null);
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        setD(computePulse());
      } catch (e) {
        console.warn("Header pulse skipped:", e.message);
      }
    }, 80);
    return () => clearTimeout(id);
  }, [page]);
  useEffect(() => {
    const t = setInterval(() => {
      try {
        setD(computePulse());
      } catch (e) {
      }
    }, 9e4);
    return () => clearInterval(t);
  }, []);
  return d;
};
const BellSvg = ({ s = 16 }) => /* @__PURE__ */ React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" }), /* @__PURE__ */ React.createElement("path", { d: "M13.73 21a2 2 0 0 1-3.46 0" }));
const TopInsights = ({ page, go, role }) => {
  const d = useHeaderPulse(page);
  const [hide, setHide] = useState(() => {
    try {
      return localStorage.getItem("ab_hide_nums") === "1";
    } catch (e) {
      return false;
    }
  });
  const [pOpen, setPOpen] = useState(false), [aOpen, setAOpen] = useState(false);
  const pRef = useRef(null), aRef = useRef(null);
  useClickAway(pRef, () => setPOpen(false));
  useClickAway(aRef, () => setAOpen(false));
  const toggleHide = () => {
    setHide((h) => {
      const n = !h;
      try {
        localStorage.setItem("ab_hide_nums", n ? "1" : "0");
      } catch (e) {
      }
      return n;
    });
  };
  const mask = (v) => hide ? "\u20B9 \u2022\u2022\u2022\u2022\u2022\u2022" : fmtShort(v);
  const full = (v) => hide ? "\u20B9 \u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : fmt(v);
  const _ACCP = ["cashflow", "budget", "fixedassets", "recjournal", "advances", "fxpage", "coa", "journal", "ledger", "trialbalance"];
  const alerts = d ? d.alerts.filter((a) => canSee(role, _ACCP.includes(a.p) ? "reports" : a.p)) : [];
  const urgent = d ? alerts.filter((a) => a.tone !== "blue").length : 0;
  const tones = { red: "#F1495C", amber: "#E69A12", blue: "#4F6FE8" };
  const net = d ? d.cash + d.recv - d.pay : 0;
  const Row = ({ label, val, sub, color, p }) => /* @__PURE__ */ React.createElement("div", { className: "tb2-menu-item", onClick: () => {
    setPOpen(false);
    go(p);
  } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { className: "tb2-menu-t" }, label), sub && /* @__PURE__ */ React.createElement("div", { className: "tb2-menu-s" }, sub)), /* @__PURE__ */ React.createElement("b", { style: { fontSize: 13, color: color || "var(--text)" } }, val));
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "tb2-menu-wrap", ref: aRef }, /* @__PURE__ */ React.createElement("div", { className: "tb2-alerts" + (urgent ? " has" : "") + (aOpen ? " open" : ""), onClick: () => {
    setAOpen((o) => !o);
    setPOpen(false);
  }, title: "Action center \u2014 things that need your attention" }, /* @__PURE__ */ React.createElement(BellSvg, { s: 15 }), /* @__PURE__ */ React.createElement("span", { className: "tb2-hide-md" }, "Alerts"), urgent > 0 && /* @__PURE__ */ React.createElement("span", { className: "tb2-badge" }, urgent > 99 ? "99+" : urgent)), aOpen && /* @__PURE__ */ React.createElement("div", { className: "tb2-menu", style: { right: 0, minWidth: 330, maxHeight: "70vh", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", { className: "tb2-menu-head" }, "Action center"), !d ? /* @__PURE__ */ React.createElement("div", { style: { padding: 14, fontSize: 12, color: "var(--text3)" } }, "Checking your books\u2026") : alerts.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { padding: "18px 14px", textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22 } }, "\u2705"), /* @__PURE__ */ React.createElement("div", { className: "tb2-menu-t", style: { marginTop: 4 } }, "You\u2019re all caught up"), /* @__PURE__ */ React.createElement("div", { className: "tb2-menu-s" }, "No overdue items, nothing waiting to reconcile.")) : alerts.map((a, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "tb2-menu-item", onClick: () => {
    setAOpen(false);
    go(a.p);
  } }, /* @__PURE__ */ React.createElement("span", { className: "tb2-al-dot", style: { background: tones[a.tone] } }), /* @__PURE__ */ React.createElement("span", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "tb2-menu-t" }, a.t), /* @__PURE__ */ React.createElement("div", { className: "tb2-menu-s" }, a.s)), /* @__PURE__ */ React.createElement(Ic, { n: "chevron", s: 11 }))))));
};
const TopPalette = ({ user, canSee: canSee2, go, newInvoice: newInvoice2, openInvoice, searchFor }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inp = useRef(null);
  useEffect(() => {
    const h = () => {
      setOpen(true);
      setQ("");
      setIdx(0);
    };
    window.addEventListener("ab-palette", h);
    return () => window.removeEventListener("ab-palette", h);
  }, []);
  useEffect(() => {
    if (open) setTimeout(() => inp.current && inp.current.focus(), 30);
  }, [open]);
  const ACC = ["pr_dashboard", "pr_employees", "pr_payruns", "pr_loans", "pr_form16", "pr_docs", "pr_reports", "pr_settings", "statements", "gstfiling", "reportscenter", "vendors", "payrecv", "paymade", "cashflow", "budget", "fixedassets", "recjournal", "advances", "fxpage", "coa", "journal", "ledger", "trialbalance"];
  const allowed = (k) => k === "admin" ? user.role === "admin" || user.role === "superadmin" : ACC.includes(k) ? canSee2(user.role, "reports") : canSee2(user.role, k);
  const needle = q.trim().toLowerCase();
  const items = useMemo(() => {
    if (!open) return [];
    const out = [];
    const acts = [["New sales invoice", "Action", () => newInvoice2()], ["New purchase bill", "Action", () => go("expenses")], ["New journal voucher", "Action", () => go("journal")], ["Reconcile bank", "Action", () => go("bankrecon")]];
    acts.forEach(([t, g, fn]) => {
      if (!needle || t.toLowerCase().includes(needle)) out.push({ t, g, fn });
    });
    Object.keys(PAGE_TITLES).filter(allowed).forEach((k) => {
      const t = PAGE_TITLES[k];
      if (!needle || t.toLowerCase().includes(needle) || (PAGE_SECTIONS[k] || "").toLowerCase().includes(needle)) out.push({ t, g: "Go to \xB7 " + (PAGE_SECTIONS[k] || "App"), fn: () => go(k) });
    });
    if (needle.length >= 2) {
      (S.get(SK.INV, []) || []).filter((i) => {
        var _a;
        return `${i.invNo} ${((_a = i.billTo) == null ? void 0 : _a.name) || ""}`.toLowerCase().includes(needle);
      }).slice(0, 6).forEach((i) => {
        var _a;
        return out.push({ t: `${i.invNo} \u2014 ${((_a = i.billTo) == null ? void 0 : _a.name) || ""}`, g: "Invoice \xB7 " + fmt(Math.abs(getGrand(i))), fn: () => openInvoice(i) });
      });
      (S.get(SK.CUST, []) || []).filter((c) => (c.name || "").toLowerCase().includes(needle)).slice(0, 4).forEach((c) => out.push({ t: c.name, g: "Customer", fn: () => searchFor("customers", c.name) }));
    }
    return out.slice(0, 14);
  }, [open, needle]);
  useEffect(() => {
    setIdx(0);
  }, [needle]);
  if (!open) return null;
  const run = (it) => {
    setOpen(false);
    it && it.fn();
  };
  const onKey = (e) => {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(items[idx]);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "tb2-pal-back", onMouseDown: (e) => {
    if (e.target === e.currentTarget) setOpen(false);
  } }, /* @__PURE__ */ React.createElement("div", { className: "tb2-pal" }, /* @__PURE__ */ React.createElement("div", { className: "tb2-pal-in" }, /* @__PURE__ */ React.createElement(Ic, { n: "search", s: 16 }), /* @__PURE__ */ React.createElement("input", { ref: inp, value: q, onChange: (e) => setQ(e.target.value), onKeyDown: onKey, placeholder: "Jump to a page, start an action, or find an invoice / customer\u2026" }), /* @__PURE__ */ React.createElement("kbd", null, "Esc")), /* @__PURE__ */ React.createElement("div", { className: "tb2-pal-list" }, items.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { padding: 22, textAlign: "center", color: "var(--text3)", fontSize: 12.5 } }, "Nothing matches \u201C", q, "\u201D."), items.map((it, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "tb2-pal-item" + (i === idx ? " on" : ""), onMouseEnter: () => setIdx(i), onClick: () => run(it) }, /* @__PURE__ */ React.createElement("span", { className: "tb2-pal-t" }, it.t), /* @__PURE__ */ React.createElement("span", { className: "tb2-pal-g" }, it.g)))), /* @__PURE__ */ React.createElement("div", { className: "tb2-pal-foot" }, /* @__PURE__ */ React.createElement("span", null, "\u2191\u2193 navigate"), /* @__PURE__ */ React.createElement("span", null, "Enter open"), /* @__PURE__ */ React.createElement("span", null, "Esc close"), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto" } }, "Tip: type 2+ letters of a customer or invoice no."))));
};
const PR_DEFAULT_SETTINGS = {
  pan: "",
  tan: "",
  pfCode: "",
  esiCode: "",
  ptRegNo: "",
  ptState: "Karnataka",
  pfOn: true,
  esiOn: true,
  ptOn: true,
  tdsOn: true,
  pfRate: 12,
  pfCeilingOverride: "",
  applyFiftyRule: true,
  adminOn: true,
  adminRate: 0.5,
  edliOn: true,
  edliRate: 0.5,
  epsRate: 8.33,
  esiEmpRate: 0.75,
  esiErRate: 3.25,
  esiCeiling: 21e3,
  daysBasis: "calendar",
  payDay: "last",
  basicPct: 50,
  hraPct: 40,
  departments: ["Management", "Sales", "Engineering", "Finance & Accounts", "Operations", "HR & Admin"],
  designations: ["Director", "Manager", "Executive", "Engineer", "Accountant", "Associate"],
  ptCustom: [{ from: 0, to: 99999999, amt: 0 }]
};
const PR_PT_STATES = {
  // monthly slabs: {from,to,amt}; feb = extra-month override for the top slab
  "Karnataka": { slabs: [{ from: 0, to: 24999.99, amt: 0 }, { from: 25e3, to: 1e9, amt: 200 }], feb: { from: 25e3, amt: 300 } },
  "Maharashtra": { slabs: [{ from: 0, to: 7500, amt: 0 }, { from: 7500.01, to: 1e4, amt: 175 }, { from: 10000.01, to: 1e9, amt: 200 }], feb: { from: 10000.01, amt: 300 } },
  "Telangana": { slabs: [{ from: 0, to: 15e3, amt: 0 }, { from: 15000.01, to: 2e4, amt: 150 }, { from: 20000.01, to: 1e9, amt: 200 }] },
  "Andhra Pradesh": { slabs: [{ from: 0, to: 15e3, amt: 0 }, { from: 15000.01, to: 2e4, amt: 150 }, { from: 20000.01, to: 1e9, amt: 200 }] },
  "Gujarat": { slabs: [{ from: 0, to: 11999.99, amt: 0 }, { from: 12e3, to: 1e9, amt: 200 }] },
  "West Bengal": { slabs: [{ from: 0, to: 1e4, amt: 0 }, { from: 10000.01, to: 15e3, amt: 110 }, { from: 15000.01, to: 25e3, amt: 130 }, { from: 25000.01, to: 4e4, amt: 150 }, { from: 40000.01, to: 1e9, amt: 200 }] },
  "Not applicable": { slabs: [{ from: 0, to: 1e9, amt: 0 }] },
  "Custom": { custom: true }
};
const prSettings = () => ({ ...PR_DEFAULT_SETTINGS, ...S.get(SK.PR_SET, {}) || {} });
const getEmployees = () => S.get(SK.PR_EMP, []) || [];
const getPayRuns = () => S.get(SK.PR_RUNS, []) || [];
const getPrLoans = () => S.get(SK.PR_LOANS, []) || [];
const ymOf = (d) => (d || "").slice(0, 7);
const prMonthLabel = (ym) => {
  const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return ym ? `${m[+ym.slice(5, 7) - 1]} ${ym.slice(0, 4)}` : "";
};
const prDim = (ym) => new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate();
const prFyOf = (ym) => +ym.slice(5, 7) >= 4 ? +ym.slice(0, 4) : +ym.slice(0, 4) - 1;
const prFyIdx = (ym) => (+ym.slice(5, 7) + 8) % 12;
const prFyMonths = (fy) => Array.from({ length: 12 }, (_, i) => {
  const m = (i + 3) % 12 + 1, y = m >= 4 ? fy : fy + 1;
  return `${y}-${pad2(m)}`;
});
const prPfCeiling = (ym, set) => parseFloat(set.pfCeilingOverride) > 0 ? parseFloat(set.pfCeilingOverride) : ym >= "2026-10" ? 25e3 : 15e3;
const prPT = (gross, ym, set) => {
  if (!set.ptOn) return 0;
  const st = PR_PT_STATES[set.ptState] || PR_PT_STATES["Not applicable"];
  const slabs = st.custom ? set.ptCustom || [] : st.slabs;
  let amt = 0;
  (slabs || []).forEach((s) => {
    if (gross >= s.from && gross <= s.to) amt = s.amt;
  });
  if (st.feb && ym.slice(5, 7) === "02" && gross >= st.feb.from) amt = st.feb.amt;
  return amt;
};
const NEW_SLABS = [[4e5, 0], [8e5, 0.05], [12e5, 0.1], [16e5, 0.15], [2e6, 0.2], [24e5, 0.25], [Infinity, 0.3]];
const OLD_SLABS = [[25e4, 0], [5e5, 0.05], [1e6, 0.2], [Infinity, 0.3]];
const prSlabTax = (income, slabs) => {
  let tax = 0, prev = 0;
  for (const [lim, rate] of slabs) {
    if (income > prev) tax += (Math.min(income, lim) - prev) * rate;
    prev = lim;
    if (income <= lim) break;
  }
  return tax;
};
const prAnnualTax = (taxable, regime) => {
  taxable = Math.max(0, Math.floor(taxable / 10) * 10);
  let tax = prSlabTax(taxable, regime === "old" ? OLD_SLABS : NEW_SLABS);
  if (regime === "old") {
    if (taxable <= 5e5) tax = Math.max(0, tax - 12500);
  } else {
    if (taxable <= 12e5) tax = Math.max(0, tax - 6e4);
    else tax = Math.min(tax, tax);
  }
  return Math.round(tax * 1.04);
};
const prHraExempt = (emp, annualBasic, annualHra) => {
  const rent = (parseFloat(emp.rentMonthly) || 0) * 12;
  if (rent <= 0 || annualHra <= 0) return 0;
  return Math.max(0, Math.min(annualHra, rent - 0.1 * annualBasic, (emp.metro ? 0.5 : 0.4) * annualBasic));
};
const prStdEarnings = (emp) => {
  const e = emp.earn || {};
  const extra = (emp.extra || []).reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
  const basic = parseFloat(e.basic) || 0, hra = parseFloat(e.hra) || 0, conv = parseFloat(e.conv) || 0, special = parseFloat(e.special) || 0;
  return { basic, hra, conv, special, extra, gross: r2(basic + hra + conv + special + extra) };
};
const prYtd = (empId, ym, runs) => {
  const fy = prFyOf(ym);
  const t = { gross: 0, tds: 0, pt: 0, pf: 0, months: 0 };
  (runs || getPayRuns()).filter((r) => r.status !== "draft" && r.month < ym && prFyOf(r.month) === fy).forEach((r) => {
    const row = (r.rows || []).find((x) => x.empId === empId);
    if (!row) return;
    t.gross += row.gross;
    t.tds += row.tds;
    t.pt += row.pt;
    t.pf += row.pfEmp;
    t.months++;
  });
  return t;
};
const prTds = (emp, ym, grossNow, ptNow, pfNow, std, set, ytd) => {
  if (!set.tdsOn) return { tds: 0, annualTax: 0, taxable: 0 };
  const remaining = 12 - prFyIdx(ym);
  const annualGross = ytd.gross + grossNow + std.gross * (remaining - 1);
  const regime = emp.regime === "old" ? "old" : "new";
  let taxable;
  if (regime === "new") taxable = annualGross - 75e3;
  else {
    const hra = prHraExempt(emp, std.basic * 12, std.hra * 12);
    const d80c = Math.min(15e4, parseFloat(emp.decl80C) || 0), other = parseFloat(emp.declOther) || 0;
    const ptYear = ytd.pt + ptNow + ptNow * (remaining - 1);
    taxable = annualGross - 5e4 - hra - d80c - other - ptYear;
  }
  const annualTax = prAnnualTax(taxable, regime);
  const tds = Math.max(0, Math.round((annualTax - ytd.tds) / remaining));
  return { tds, annualTax, taxable: Math.max(0, taxable) };
};
const prLoanDue = (empId, ym, runs) => {
  const loans = getPrLoans().filter((l) => l.empId === empId && l.status !== "closed" && (l.startMonth || "0000-00") <= ym);
  let total = 0;
  const parts = [];
  loans.forEach((l) => {
    const rec = (runs || getPayRuns()).filter((r) => r.status !== "draft" && r.month !== ym).reduce((s, r) => s + (((r.rows || []).find((x) => x.empId === empId) || {}).loanParts || []).filter((p) => p.loanId === l.id).reduce((a, p) => a + p.amt, 0), 0);
    const left = r2((parseFloat(l.amount) || 0) - rec);
    const due = Math.max(0, Math.min(parseFloat(l.emi) || 0, left));
    if (due > 0) {
      total += due;
      parts.push({ loanId: l.id, amt: r2(due) });
    }
  });
  return { total: r2(total), parts };
};
const prCompute = (emp, ym, inp, set, runs) => {
  inp = inp || {};
  const dim = prDim(ym);
  const basisDays = set.daysBasis === "calendar" ? dim : parseInt(set.daysBasis, 10) || dim;
  let startDay = 1, endDay = dim;
  if (emp.doj && ymOf(emp.doj) === ym) startDay = +emp.doj.slice(8, 10);
  if (emp.dol && ymOf(emp.dol) === ym) endDay = +emp.dol.slice(8, 10);
  if (emp.doj && ymOf(emp.doj) > ym) endDay = 0;
  const present = Math.max(0, endDay - startDay + 1);
  const lop = Math.max(0, Math.min(present, parseFloat(inp.lopDays) || 0));
  const paidDays = set.daysBasis === "calendar" ? Math.max(0, present - lop) : Math.max(0, Math.min(basisDays, present - lop));
  const f = basisDays > 0 ? Math.min(1, paidDays / basisDays) : 0;
  const std = prStdEarnings(emp);
  const basic = r2(std.basic * f), hra = r2(std.hra * f), conv = r2(std.conv * f), special = r2(std.special * f), extra = r2(std.extra * f);
  const bonus = r2(parseFloat(inp.bonus) || 0), otherEarn = r2(parseFloat(inp.otherEarn) || 0);
  const gross = r2(basic + hra + conv + special + extra + bonus + otherEarn);
  let pfEmp = 0, pfWage = 0, eps = 0, epfDiff = 0, admin = 0, edli = 0, pfEr = 0;
  const ceil = prPfCeiling(ym, set);
  if (set.pfOn && emp.pfMode !== "none" && gross > 0) {
    let wage = basic;
    if (set.applyFiftyRule) wage = Math.max(basic, 0.5 * (gross - bonus));
    pfWage = emp.pfMode === "actual" ? wage : Math.min(wage, ceil);
    pfEmp = Math.round(pfWage * (parseFloat(set.pfRate) || 12) / 100);
    const epsWage = Math.min(pfWage, ceil);
    eps = Math.round(epsWage * (parseFloat(set.epsRate) || 8.33) / 100);
    const erTotal = Math.round(pfWage * (parseFloat(set.pfRate) || 12) / 100);
    epfDiff = Math.max(0, erTotal - eps);
    admin = set.adminOn ? Math.round(pfWage * (parseFloat(set.adminRate) || 0) / 100) : 0;
    edli = set.edliOn ? Math.round(epsWage * (parseFloat(set.edliRate) || 0) / 100) : 0;
    pfEr = erTotal + admin + edli;
  }
  let esiEmp = 0, esiEr = 0;
  if (set.esiOn && emp.esiMode !== "none" && std.gross <= (parseFloat(set.esiCeiling) || 21e3) && gross > 0) {
    esiEmp = Math.ceil(gross * (parseFloat(set.esiEmpRate) || 0.75) / 100);
    esiEr = Math.ceil(gross * (parseFloat(set.esiErRate) || 3.25) / 100);
  }
  const pt = emp.ptMode === "none" ? 0 : prPT(gross, ym, set);
  const ytd = prYtd(emp.id, ym, runs);
  const tx = prTds(emp, ym, gross, pt, pfEmp, std, set, ytd);
  const tds = emp.tdsMode === "none" ? 0 : tx.tds;
  const fixedDed = r2((emp.ded || []).reduce((s, x) => s + (parseFloat(x.amount) || 0), 0) * f);
  const otherDed = r2(parseFloat(inp.otherDed) || 0);
  const loan = prLoanDue(emp.id, ym, runs);
  const totalDed = r2(pfEmp + esiEmp + pt + tds + fixedDed + otherDed + loan.total);
  const net = r2(gross - totalDed);
  return {
    empId: emp.id,
    code: emp.code,
    name: emp.name,
    dept: emp.dept || "",
    lopDays: lop,
    paidDays: r2(paidDays),
    daysInMonth: basisDays,
    basic,
    hra,
    conv,
    special,
    extra,
    bonus,
    otherEarn,
    gross,
    pfWage,
    pfEmp,
    eps,
    epfDiff,
    admin,
    edli,
    pfEr,
    esiEmp,
    esiEr,
    pt,
    tds,
    fixedDed,
    otherDed,
    loan: loan.total,
    loanParts: loan.parts,
    totalDed,
    net,
    employerCost: r2(gross + pfEr + esiEr),
    annualTax: tx.annualTax,
    taxable: tx.taxable
  };
};
const prTotals = (rows) => {
  const t = { gross: 0, pfEmp: 0, pfEr: 0, esiEmp: 0, esiEr: 0, pt: 0, tds: 0, loan: 0, fixedDed: 0, otherDed: 0, totalDed: 0, net: 0, employerCost: 0, count: rows.length, eps: 0, epfDiff: 0, admin: 0, edli: 0 };
  rows.forEach((r) => {
    Object.keys(t).forEach((k) => {
      if (k !== "count") t[k] += r[k] || 0;
    });
  });
  Object.keys(t).forEach((k) => {
    t[k] = r2(t[k]);
  });
  return t;
};
const buildPayrollEntries = (add) => {
  getPayRuns().filter((r) => r.status === "approved" || r.status === "paid").forEach((run) => {
    const t = prTotals(run.rows || []);
    const date = run.postDate || monthEndISO(+run.month.slice(0, 4), +run.month.slice(5, 7));
    const pfPay = r2(t.pfEmp + t.pfEr), esiPay = r2(t.esiEmp + t.esiEr);
    const L = [];
    const dr = (a, v, d) => {
      if (v > 4e-3) L.push({ account: a, desc: d || "", debit: r2(v), credit: 0 });
    };
    const cr = (a, v, d) => {
      if (v > 4e-3) L.push({ account: a, desc: d || "", debit: 0, credit: r2(v) });
    };
    dr("EMPLOYEE_EXP", t.gross, "Salaries & wages");
    dr("EMPLOYER_CONTRIB", t.pfEr + t.esiEr, "Employer PF / ESI contribution");
    cr("SALARY_PAYABLE", t.net, "Net salary payable");
    cr("PF_PAYABLE", pfPay, "EPF (employee + employer)");
    cr("ESI_PAYABLE", esiPay, "ESI (employee + employer)");
    cr("PT_PAYABLE", t.pt, "Professional tax");
    cr("TDS_SALARY_PAYABLE", t.tds, "TDS on salary (192)");
    cr("EMP_LOAN", t.loan, "Employee loan recovered");
    cr("OTHER_CURRENT_LIAB", t.fixedDed + t.otherDed, "Other salary deductions");
    add(date, `${run.type === "bonus" ? "Bonus pay run" : "Payroll"} \u2014 ${prMonthLabel(run.month)} (${t.count} employees)`, "PAYROLL", run.id, L, run.voucherNo || "", { txnRefNo: run.txnRefNo || "", docNo: "PR-" + run.month, category: "Payroll" });
  });
};
const prLiabilities = () => {
  const tb = getTrialBalance(today());
  const g = (k) => {
    const r = tb.find((x) => x.account === k);
    return r ? -r.balance : 0;
  };
  return { salary: r2(g("SALARY_PAYABLE")), pf: r2(g("PF_PAYABLE")), esi: r2(g("ESI_PAYABLE")), pt: r2(g("PT_PAYABLE")), tds: r2(g("TDS_SALARY_PAYABLE")) };
};
const prNextMonth = () => {
  const runs = getPayRuns().filter((r) => r.type !== "bonus" && r.status !== "draft");
  const last = runs.map((r) => r.month).sort().pop();
  if (!last) {
    const t = today();
    return t.slice(0, 7);
  }
  let y = +last.slice(0, 4), m = +last.slice(5, 7) + 1;
  if (m > 12) {
    m = 1;
    y++;
  }
  return `${y}-${pad2(m)}`;
};
const prLoanOutstanding = (l, runs) => {
  const rec = (runs || getPayRuns()).filter((r) => r.status !== "draft").reduce((s, r) => s + (((r.rows || []).find((x) => x.empId === l.empId) || {}).loanParts || []).filter((p) => p.loanId === l.id).reduce((a, p) => a + p.amt, 0), 0);
  return r2((parseFloat(l.amount) || 0) - rec);
};
const prPayslipHtml = (run, row, emp, co) => {
  const f = (n2) => Number(n2 || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const earn = [["Basic", row.basic], ["House Rent Allowance", row.hra], ["Conveyance", row.conv], ["Special Allowance", row.special], ["Other fixed allowances", row.extra], ["Bonus / incentive", row.bonus], ["Other earnings", row.otherEarn]].filter((x) => x[1] > 0);
  const ded = [["Provident Fund", row.pfEmp], ["ESI", row.esiEmp], ["Professional Tax", row.pt], ["Income Tax (TDS)", row.tds], ["Loan recovery", row.loan], ["Other deductions", row.fixedDed + row.otherDed]].filter((x) => x[1] > 0);
  const n = Math.max(earn.length, ded.length);
  let body = "";
  for (let i = 0; i < n; i++) body += `<tr><td>${earn[i] ? earn[i][0] : ""}</td><td class="r">${earn[i] ? f(earn[i][1]) : ""}</td><td>${ded[i] ? ded[i][0] : ""}</td><td class="r">${ded[i] ? f(ded[i][1]) : ""}</td></tr>`;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  return `<!doctype html><html><head><meta charset="utf-8"><title>Payslip ${esc(row.name)} ${prMonthLabel(run.month)}</title><style>
  body{font-family:Arial,Helvetica,sans-serif;color:#1a1a2e;margin:0;padding:28px;font-size:12px}.box{max-width:760px;margin:auto;border:1px solid #ccd;border-radius:6px}
  .hd{padding:16px 20px;border-bottom:2px solid #4F6FE8;display:flex;justify-content:space-between}.hd h1{margin:0;font-size:17px}.hd small{color:#667}
  h2{margin:0;font-size:13px;text-align:right;color:#4F6FE8}.g{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;padding:14px 20px;border-bottom:1px solid #dde}
  .g div span{color:#667;display:inline-block;min-width:110px}table{width:100%;border-collapse:collapse}th{background:#f1f3fb;text-align:left;padding:7px 20px;font-size:11px}
  td{padding:6px 20px;border-bottom:1px solid #eef}.r{text-align:right}.tot td{font-weight:700;background:#fafbff}.net{padding:14px 20px;display:flex;justify-content:space-between;font-size:14px;font-weight:700;background:#eef2ff}
  .ft{padding:10px 20px;color:#889;font-size:10px}@media print{body{padding:0}.box{border:none}}</style></head><body><div class="box">
  <div class="hd"><div><h1>${esc(co.name || "Company")}</h1><small>${esc([co.address, co.city, co.state].filter(Boolean).join(", "))}</small></div><div><h2>PAYSLIP</h2><small>${prMonthLabel(run.month)}</small></div></div>
  <div class="g"><div><span>Employee</span><b>${esc(row.name)}</b></div><div><span>Employee ID</span>${esc(row.code)}</div>
  <div><span>Designation</span>${esc(emp.desig || "")}</div><div><span>Department</span>${esc(emp.dept || "")}</div>
  <div><span>Date of joining</span>${esc(emp.doj ? emp.doj.split("-").reverse().join("/") : "")}</div><div><span>Pay days</span>${row.paidDays} / ${row.daysInMonth} (LOP ${row.lopDays})</div>
  <div><span>PAN</span>${esc(emp.pan || "\u2014")}</div><div><span>UAN</span>${esc(emp.uan || "\u2014")}</div></div>
  <table><tr><th>Earnings</th><th class="r">Amount (\u20B9)</th><th>Deductions</th><th class="r">Amount (\u20B9)</th></tr>${body}
  <tr class="tot"><td>Gross earnings</td><td class="r">${f(row.gross)}</td><td>Total deductions</td><td class="r">${f(row.totalDed)}</td></tr></table>
  <div class="net"><span>Net pay</span><span>\u20B9 ${f(row.net)}</span></div>
  <div class="net" style="font-size:11px;font-weight:400;background:#fff"><span>Amount in words: ${esc(numberToWords(row.net))}</span></div>
  <div class="ft">Employer contribution (not part of take-home): PF \u20B9${f(row.pfEr)} \xB7 ESI \u20B9${f(row.esiEr)}. This is a computer-generated payslip.</div></div>
  <script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>`;
};
const prOpenPayslips = (run, rows, emps, co) => {
  const w = window.open("", "_blank");
  if (!w) {
    toast.error("Allow pop-ups to print payslips");
    return;
  }
  const pages = rows.map((r) => prPayslipHtml(run, r, emps.find((e) => e.id === r.empId) || {}, co).replace(/^[\s\S]*?<body>/, "").replace(/<script>[\s\S]*$/, "").replace(/<\/body><\/html>\s*$/, ""));
  const first = prPayslipHtml(run, rows[0], emps.find((e) => e.id === rows[0].empId) || {}, co);
  const head = first.slice(0, first.indexOf("<body>") + 6);
  w.document.write(head + pages.map((p) => `<div style="page-break-after:always">${p}</div>`).join("") + "<script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script></body></html>");
  w.document.close();
};
const prDownload = (name, text, mime) => {
  try {
    const b = new Blob([text], { type: mime || "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  } catch (e) {
    toast.error("Download failed");
  }
};
const PrStatus = ({ s }) => {
  const m = { active: ["badge-green", "Active"], inactive: ["badge-gold", "Inactive"], exited: ["badge-red", "Exited"], draft: ["badge-gold", "Draft"], approved: ["badge-blue", "Approved"], paid: ["badge-green", "Paid"], closed: ["badge-green", "Closed"] }[s] || ["badge-gray", s];
  return /* @__PURE__ */ React.createElement("span", { className: "badge " + m[0] }, m[1]);
};
const PrAvatar = ({ name }) => /* @__PURE__ */ React.createElement("div", { style: { width: 34, height: 34, borderRadius: "50%", background: "var(--primary-bg)", color: "var(--primary2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 } }, (name || "?")[0].toUpperCase());
