const blankExp = (user) => ({
  id: Date.now().toString(),
  date: today(),
  vendor: "",
  vendorGSTIN: "",
  vendorState: "",
  billNo: "",
  billDate: today(),
  creditDays: 30,
  dueDate: "",
  category: "",
  expenseAccountKey: "",
  gstType: "INTRA",
  notes: "",
  tdsSection: "",
  tdsRate: "",
  tdsAmount: 0,
  netPayable: 0,
  payMode: "Bank Transfer / NEFT",
  payStatus: "Pending",
  paidAmount: "",
  paidDate: "",
  items: [blankPItem()],
  taxable: 0,
  gstAmt: 0,
  total: 0,
  createdBy: user && user.email || ""
});
const calcPurchase = (f) => {
  const items = (f.items && f.items.length ? f.items : [blankPItem()]).map((it) => {
    const qty = parseFloat(it.qty) || 0, rate = parseFloat(it.rate) || 0;
    const taxable2 = qty * rate, tR = parseFloat(it.taxRate) || 0;
    const gstAmt2 = taxable2 * tR / 100;
    return { ...it, taxable: +taxable2.toFixed(2), gstAmt: +gstAmt2.toFixed(2), total: +(taxable2 + gstAmt2).toFixed(2) };
  });
  const taxable = items.reduce((t, x) => t + (x.taxable || 0), 0);
  const gstAmt = items.reduce((t, x) => t + (x.gstAmt || 0), 0);
  const total = +(taxable + gstAmt).toFixed(2);
  const dueDate = f.dueDate || addDaysStr(f.billDate || f.date, f.creditDays);
  const tdsRate = f.tdsSection ? parseFloat(f.tdsRate) || 0 : 0;
  const tdsAmount = +(taxable * tdsRate / 100).toFixed(2);
  const netPayable = +(total - tdsAmount).toFixed(2);
  return { ...f, items, dueDate, taxable: +taxable.toFixed(2), gstAmt: +gstAmt.toFixed(2), total, tdsRate: f.tdsSection ? f.tdsRate : "", tdsAmount, netPayable };
};
const PurchaseModal = ({ onClose, currentUser, inline = false, searchQuery = "" }) => {
  const [expenses, setExpenses] = useState(S.get(SK.EXP, []));
  const [form, setForm] = useState(() => blankExp(currentUser));
  const [tab, setTab] = useState("list");
  const [editId, setEditId] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [q, setQ] = useState(searchQuery);
  useEffect(() => {
    if (searchQuery !== void 0) {
      setQ(searchQuery);
      setTab("list");
    }
  }, [searchQuery]);
  const [filterCat, setFilterCat] = useState("");
  const rr = useReportRange("All Time");
  const [filterStatus, setFilterStatus] = useState("");
  const isAdmin = (currentUser == null ? void 0 : currentUser.role) === "admin" || (currentUser == null ? void 0 : currentUser.role) === "superadmin";
  const productList = S.get(SK.PRODUCTS, []);
  const [expenseAccounts, setExpenseAccounts] = useState(() => getAllAccounts().filter((a) => a.type === "expense"));
  const [addingHead, setAddingHead] = useState(false);
  const [newHeadName, setNewHeadName] = useState("");
  const usedCats = useMemo(() => {
    const s = /* @__PURE__ */ new Set();
    expenses.forEach((e) => {
      if (e.category) s.add(e.category);
    });
    return [...s].sort();
  }, [expenses]);
  const createHead = () => {
    if (!newHeadName.trim()) {
      toast.error("Give the expense head a name");
      return;
    }
    const key = createLedgerAccount({ name: newHeadName, type: "expense", group: "Expenses", scheduleGroup: "Other Expenses" });
    setExpenseAccounts(getAllAccounts().filter((a) => a.type === "expense"));
    setForm((p) => calcPurchase({ ...p, category: newHeadName.trim(), expenseAccountKey: key }));
    toast.success(`"${newHeadName.trim()}" added to Chart of Accounts \u2014 it'll post there from now on.`);
    setAddingHead(false);
    setNewHeadName("");
  };
  const upF = (k) => (e) => setForm((p) => calcPurchase({ ...p, [k]: e.target.value }));
  const upItem = (idx, k, val) => setForm((p) => calcPurchase({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, [k]: val } : it) }));
  const addItem = () => setForm((p) => calcPurchase({ ...p, items: [...p.items, blankPItem()] }));
  const delItem = (idx) => setForm((p) => calcPurchase({ ...p, items: p.items.length > 1 ? p.items.filter((_, i) => i !== idx) : p.items }));
  const pickProduct = (idx, name) => {
    const prod = productList.find((p) => p.name.toLowerCase() === String(name).toLowerCase());
    setForm((p) => calcPurchase({ ...p, items: p.items.map((it, i) => i !== idx ? it : {
      ...it,
      product: name,
      hsnCode: prod ? prod.hsnCode || it.hsnCode : it.hsnCode,
      unit: prod ? prod.unit || it.unit : it.unit,
      rate: prod && !it.rate ? prod.rate || "" : it.rate,
      taxRate: prod ? prod.taxRate || it.taxRate : it.taxRate,
      desc: it.desc || (prod ? prod.desc || "" : "")
    }) }));
  };
  const saveExp = () => {
    if (!form.vendor) {
      toast.error("Vendor name is required");
      return;
    }
    if (!form.items.some((it) => (parseFloat(it.qty) || 0) > 0 && (it.product || it.desc))) {
      toast.error("Add at least one line item with a name and quantity");
      return;
    }
    if (!isSuperAdmin(currentUser == null ? void 0 : currentUser.email) && isExpenseFrozen(form)) {
      toast.error(`${(form.date || "").substring(0, 7)} purchases are frozen. Only Super Admin can edit this month.`);
      return;
    }
    const calc = { ...calcPurchase(form), vendorGSTIN: (form.vendorGSTIN || "").toUpperCase() };
    let updated, rec;
    if (editId) {
      rec = { ...calc, id: editId, voucherNo: calc.voucherNo || nextVoucherNo(), txnRefNo: calc.txnRefNo || nextTxnRefNo(calc.billDate || calc.date) };
      updated = expenses.map((e) => e.id === editId ? rec : e);
      logAudit("EXPENSE_EDITED", `${calc.vendor} \u2014 ${calc.billNo} \u2014 \u20B9${calc.total}`, currentUser);
    } else {
      rec = { ...calc, id: calc.id || Date.now().toString(), createdAt: (/* @__PURE__ */ new Date()).toISOString(), voucherNo: nextVoucherNo(), txnRefNo: nextTxnRefNo(calc.billDate || calc.date) };
      updated = [...expenses, rec];
      logAudit("EXPENSE_ADDED", `${calc.vendor} \u2014 ${calc.billNo} \u2014 \u20B9${calc.total}`, currentUser);
    }
    setExpenses(updated);
    S.set(SK.EXP, updated);
    const newProducts = applyStockForPurchase(rec, currentUser);
    const inQty = expItems(rec).filter((it) => it.toStock !== false).reduce((t, it) => t + (parseFloat(it.qty) || 0), 0);
    toast.success(editId ? `Purchase updated \u2014 ${inQty} unit(s) synced to inventory` : `Purchase saved \u2014 ${inQty} unit(s) added to inventory`);
    if (newProducts.length) {
      toast.info(`Added to Product master & tracked as stock: ${newProducts.join(", ")}`);
    }
    setForm(blankExp(currentUser));
    setEditId(null);
    setTab("list");
  };
  const delExp = (id) => {
    if (!isAdmin) {
      toast.error("Only Admin can delete purchases");
      return;
    }
    const e = expenses.find((x) => x.id === id);
    if (!isSuperAdmin(currentUser == null ? void 0 : currentUser.email) && isExpenseFrozen(e)) {
      toast.error(`${((e == null ? void 0 : e.date) || "").substring(0, 7)} purchases are frozen. Only Super Admin can delete.`);
      return;
    }
    if (!window.confirm("Delete this purchase bill? The stock it added will be removed from inventory.")) return;
    reverseStockForPurchase(e);
    const updated = expenses.filter((x) => x.id !== id);
    setExpenses(updated);
    S.set(SK.EXP, updated);
    logAudit("EXPENSE_DELETED", `${e == null ? void 0 : e.vendor} \u2014 ${e == null ? void 0 : e.billNo} \u2014 \u20B9${e == null ? void 0 : e.total}`, currentUser);
    toast.info("Purchase deleted and inventory reversed");
  };
  const editExp = (e) => {
    const norm = calcPurchase({ ...blankExp(currentUser), ...e, items: expItems(e).map((it) => ({ ...blankPItem(), ...it })) });
    setForm(norm);
    setEditId(e.id);
    setTab("add");
  };
  const filtered = expenses.filter((e) => {
    const hay = [e.vendor, e.billNo, e.category, e.description, e.notes, ...expItems(e).map((i) => i.product + " " + i.desc)].join(" ").toLowerCase();
    const mQ = !q || hay.includes(q.toLowerCase());
    const mC = !filterCat || e.category === filterCat;
    const mS = !filterStatus || e.payStatus === filterStatus;
    const mR = inRangeDate(e.date, rr.applied);
    return mQ && mC && mS && mR;
  }).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const rangeExps = expenses.filter((e) => inRangeDate(e.date, rr.applied));
  const totalPurchase = filtered.reduce((s, e) => s + (parseFloat(e.total) || 0), 0);
  const totalTax = filtered.reduce((s, e) => s + (parseFloat(e.gstAmt) || 0), 0);
  const totalPaid = filtered.reduce((s, e) => s + expPaid(e), 0);
  const totalDue = filtered.reduce((s, e) => s + expDue(e), 0);
  const totalQty = filtered.reduce((s, e) => s + expItems(e).reduce((t, i) => t + (parseFloat(i.qty) || 0), 0), 0);
  const payBadge = (s) => s === "Paid" ? { bg: "rgba(63,185,80,0.12)", color: "var(--green)" } : s === "Partial" ? { bg: "rgba(241,73,92,0.12)", color: "var(--gold)" } : { bg: "rgba(248,81,73,0.12)", color: "var(--red)" };
  const GRID = "86px 1fr 112px 102px 102px 122px 72px 108px 108px 86px 108px";
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay", onClick: inline ? void 0 : ((e) => e.target === e.currentTarget && onClose()) }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal", style: { ...inline ? {} : { maxWidth: "min(1340px, 96vw)", width: "100%" } } }, /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { className: "modal-title" }, /* @__PURE__ */ React.createElement(Ic, { n: "receipt", s: 20 }), " Purchases"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text3)", background: "var(--card2)", padding: "3px 10px", borderRadius: 20, border: "1px solid var(--border)" } }, expenses.length, " bills")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Ic, { n: "x" })))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setTab("list"),
      className: tab === "list" ? "btn btn-sm btn-primary" : "btn btn-sm btn-outline",
      style: { display: "flex", alignItems: "center", gap: 6 }
    },
    /* @__PURE__ */ React.createElement(Ic, { n: "list", s: 14 }),
    " All Purchases"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setTab("add");
        if (!editId) setForm(blankExp(currentUser));
      },
      className: tab === "add" ? "btn btn-sm btn-primary" : "btn btn-sm btn-outline",
      style: { display: "flex", alignItems: "center", gap: 6 }
    },
    /* @__PURE__ */ React.createElement(Ic, { n: editId ? "edit" : "plus", s: 14 }),
    " ",
    editId ? "Edit Purchase" : "Record Purchase"
  )), tab === "list" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    ReportToolbar,
    {
      section: "Purchases",
      title: "Purchase Register",
      range: rr,
      count: rangeExps.length,
      canExport: isAdmin,
      onExport: (f, r) => makePurchaseExcel(rangeExps, f, { period: rangePeriodText(r) })
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "g4", style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 15 } }, fmt(totalPurchase)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Total Purchases")), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 15, color: "var(--blue)" } }, fmt(totalTax)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Input GST Credit")), /* @__PURE__ */ React.createElement("div", { className: "stat-card", style: { borderLeft: "3px solid var(--green)" } }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 15, color: "var(--green)" } }, fmt(totalPaid)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Paid to Vendors")), /* @__PURE__ */ React.createElement("div", { className: "stat-card", style: { borderLeft: "3px solid var(--red)" } }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 15, color: "var(--red)" } }, fmt(totalDue)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Outstanding (Payables)"))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", marginBottom: 12 } }, /* @__PURE__ */ React.createElement(Ic, { n: "package", s: 11 }), " ", totalQty.toLocaleString("en-IN"), " total units purchased across ", filtered.length, " bill(s) \u2014 all stock-flagged lines are live in Inventory."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { position: "relative", flex: 1, minWidth: 200 } }, /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", zIndex: 1 } }, /* @__PURE__ */ React.createElement(Ic, { n: "search", s: 14 })), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search vendor, bill no, product, category...", style: { paddingLeft: 38, width: "100%" } })), /* @__PURE__ */ React.createElement(SearchSelect, { value: filterCat, onChange: setFilterCat, style: { width: 200 }, options: [{ value: "", label: "All Categories" }, ...usedCats.map((c) => ({ value: c, label: c }))] }), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), style: { width: 130 } }, /* @__PURE__ */ React.createElement("option", { value: "" }, "All Status"), /* @__PURE__ */ React.createElement("option", { value: "Paid" }, "Paid"), /* @__PURE__ */ React.createElement("option", { value: "Pending" }, "Pending"), /* @__PURE__ */ React.createElement("option", { value: "Partial" }, "Partial"))), filtered.length > 0 ? /* @__PURE__ */ React.createElement("div", { style: { border: "1px solid var(--border)", borderRadius: 10, overflow: "auto", maxHeight: "54vh" } }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "grid",
    gridTemplateColumns: GRID,
    padding: "9px 16px",
    background: "var(--card2)",
    borderBottom: "2px solid var(--border2)",
    fontSize: 10,
    fontWeight: 700,
    color: "var(--text3)",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    position: "sticky",
    top: 0,
    zIndex: 2,
    minWidth: 1300
  } }, /* @__PURE__ */ React.createElement("span", null, "Date"), /* @__PURE__ */ React.createElement("span", null, "Vendor"), /* @__PURE__ */ React.createElement("span", null, "Bill No."), /* @__PURE__ */ React.createElement("span", null, "Voucher No."), /* @__PURE__ */ React.createElement("span", null, "Txn Ref No."), /* @__PURE__ */ React.createElement("span", null, "Category"), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "center" } }, "Qty In"), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "right" } }, "Bill Value"), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "right" } }, "Outstanding"), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "center" } }, "Status"), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "center" } }, "Actions")), filtered.map((e, i) => {
    const pb = payBadge(e.payStatus);
    const items = expItems(e);
    const qty = items.reduce((t, x) => t + (parseFloat(x.qty) || 0), 0);
    const due = expDue(e);
    const open = expanded === e.id;
    return /* @__PURE__ */ React.createElement("div", { key: e.id || i, style: { borderBottom: "1px solid var(--border)", minWidth: 1300 } }, /* @__PURE__ */ React.createElement(
      "div",
      {
        style: { display: "grid", gridTemplateColumns: GRID, padding: "9px 16px", alignItems: "center", cursor: "pointer" },
        onClick: () => setExpanded(open ? null : e.id)
      },
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text3)", fontWeight: 500 } }, fmtDate(e.date)),
      /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 } }, e.vendor),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, fontFamily: "monospace", color: "var(--text2)" } }, e.billNo || "\u2014"),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, fontFamily: "monospace", color: "var(--text3)" } }, e.voucherNo || "\u2014"),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, fontFamily: "monospace", color: "var(--text3)" } }, e.txnRefNo || "\u2014"),
      /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: {
        display: "inline-block",
        fontSize: 11,
        color: "var(--primary2)",
        background: "var(--primary-bg)",
        padding: "3px 10px",
        borderRadius: 20,
        border: "1px solid rgba(79,111,232,0.2)",
        fontWeight: 600,
        maxWidth: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      } }, e.category || "\u2014")),
      /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", fontWeight: 700, color: "var(--green)", fontSize: 13 } }, "+", qty),
      /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, textAlign: "right" } }, fmt(e.total)),
      /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", fontWeight: 700, fontSize: 13, color: due > 0 ? "var(--red)" : "var(--text3)" } }, due > 0 ? fmt(due) : "\u2014"),
      /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("span", { style: {
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        background: pb.bg,
        color: pb.color,
        border: `1px solid ${pb.color}33`
      } }, e.payStatus || "\u2014")),
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5, justifyContent: "center" }, onClick: (ev) => ev.stopPropagation() }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-xs btn-outline", style: { padding: "4px 10px" }, onClick: () => editExp(e) }, /* @__PURE__ */ React.createElement(Ic, { n: "edit", s: 11 }), " Edit"), isAdmin && /* @__PURE__ */ React.createElement("button", { className: "btn btn-xs btn-danger btn-icon", onClick: () => delExp(e.id) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 11 })))
    ), open && /* @__PURE__ */ React.createElement("div", { style: { padding: "0 16px 12px 16px", background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("div", { style: {
      display: "grid",
      gridTemplateColumns: "1fr 100px 70px 70px 90px 70px 100px 80px",
      gap: 0,
      padding: "7px 0",
      fontSize: 10,
      fontWeight: 700,
      color: "var(--text3)",
      textTransform: "uppercase",
      borderBottom: "1px solid var(--border)"
    } }, /* @__PURE__ */ React.createElement("span", null, "Product / Description"), /* @__PURE__ */ React.createElement("span", null, "HSN"), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "center" } }, "Unit"), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "center" } }, "Qty"), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "right" } }, "Rate"), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "center" } }, "GST%"), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "right" } }, "Line Total"), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "center" } }, "Stock")), items.map((it, k) => /* @__PURE__ */ React.createElement("div", { key: k, style: {
      display: "grid",
      gridTemplateColumns: "1fr 100px 70px 70px 90px 70px 100px 80px",
      gap: 0,
      padding: "7px 0",
      fontSize: 12,
      borderBottom: "1px solid var(--border)"
    } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600 } }, it.product || it.desc || "\u2014", it.product && it.desc ? /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text3)", fontWeight: 400 } }, " \u2014 ", it.desc) : null), /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "monospace", color: "var(--text3)" } }, it.hsnCode || "\u2014"), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "center", color: "var(--text3)" } }, it.unit), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "center", fontWeight: 700 } }, it.qty), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "right" } }, fmt(it.rate)), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "center", color: "var(--text3)" } }, it.taxRate, "%"), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "right", fontWeight: 700 } }, fmt(it.total)), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "center" } }, it.toStock === false ? /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text3)" } }, "\u2014") : /* @__PURE__ */ React.createElement("span", { className: "badge badge-green" }, "IN")))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 18, paddingTop: 9, fontSize: 11, color: "var(--text2)", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", null, "Bill Date: ", /* @__PURE__ */ React.createElement("strong", null, fmtDate(e.billDate) || "\u2014")), /* @__PURE__ */ React.createElement("span", null, "Due Date: ", /* @__PURE__ */ React.createElement("strong", null, fmtDate(expDueDate(e)) || "\u2014")), /* @__PURE__ */ React.createElement("span", null, "Paid: ", /* @__PURE__ */ React.createElement("strong", { style: { color: "var(--green)" } }, fmt(expPaid(e)))), /* @__PURE__ */ React.createElement("span", null, "Payment Mode: ", /* @__PURE__ */ React.createElement("strong", null, e.payMode || "\u2014")), e.notes && /* @__PURE__ */ React.createElement("span", null, "Notes: ", /* @__PURE__ */ React.createElement("strong", null, e.notes)))));
  })) : /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "50px", color: "var(--text3)" } }, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement(Ic, { n: "cart", s: 34 })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14 } }, "No purchases recorded yet."), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, marginTop: 4 } }, 'Click "Record Purchase" \u2014 every quantity you enter flows straight into Inventory.'))), tab === "add" && /* @__PURE__ */ React.createElement("div", null, isExpenseFrozen(form) && !isSuperAdmin(currentUser == null ? void 0 : currentUser.email) && /* @__PURE__ */ React.createElement("div", { className: "alert", style: { background: "rgba(79,111,232,0.08)", border: "1px solid rgba(79,111,232,0.3)", color: "var(--primary2)", marginBottom: 12 } }, /* @__PURE__ */ React.createElement(Ic, { n: "lock", s: 16 }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("strong", null, (form.date || "").substring(0, 7), " purchases are frozen."), " Contact Super Admin to unfreeze.")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "monospace", fontSize: 11.5, color: "var(--text3)", background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 10px" } }, "Voucher No. ", editId && form.voucherNo ? form.voucherNo : "auto-assigned on save"), /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "monospace", fontSize: 11.5, color: "var(--text3)", background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 10px" } }, "Txn Ref No. ", editId && form.txnRefNo ? form.txnRefNo : "auto-assigned on save")), /* @__PURE__ */ React.createElement("div", { className: "g4", style: { marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Entry Date *"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      className: "field-input",
      value: form.date,
      onChange: (e) => {
        const nd = e.target.value;
        if (!isSuperAdmin(currentUser == null ? void 0 : currentUser.email) && isMonthFrozen(nd, "expenses")) {
          toast.error(`${nd.substring(0, 7)} purchases are frozen.`);
          return;
        }
        upF("date")(e);
      }
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Vendor / Supplier *"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.vendor, onChange: upF("vendor"), placeholder: "Supplier name" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Vendor GSTIN"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.vendorGSTIN || "", onChange: (e) => setForm((p) => calcPurchase({ ...p, vendorGSTIN: e.target.value.toUpperCase() })), placeholder: "29XXXXX0000X1Z5", maxLength: 15, style: { textTransform: "uppercase" } })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Vendor State"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.vendorState || "", onChange: upF("vendorState"), placeholder: "e.g. Karnataka" }))), /* @__PURE__ */ React.createElement("div", { className: "g4", style: { marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Invoice / Bill No *"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.billNo || "", onChange: upF("billNo"), placeholder: "e.g. SUP/2026/0142" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Bill Date"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: form.billDate || "", onChange: upF("billDate") })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Credit Days"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: form.creditDays, onChange: (e) => setForm((p) => calcPurchase({ ...p, creditDays: e.target.value, dueDate: "" })), min: "0" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Payment Due Date"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: form.dueDate || "", onChange: upF("dueDate") }))), /* @__PURE__ */ React.createElement("div", { className: "g3", style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Expense Head (Chart of Accounts)"), /* @__PURE__ */ React.createElement(
    SearchSelect,
    {
      value: form.expenseAccountKey || (expenseAccounts.find((a) => a.name === form.category) || {}).key || "",
      options: buildAccountOptions(["expense"]),
      placeholder: "\u2014 Select / type to search Expense Head \u2014",
      onChange: (key) => {
        const acc = getAllAccounts().find((a) => a.key === key);
        if (acc) setForm((p) => calcPurchase({ ...p, category: acc.name, expenseAccountKey: acc.key }));
      },
      onCreate: (name) => {
        const key = createLedgerAccount({ name, type: "expense" });
        setExpenseAccounts(getAllAccounts().filter((a) => a.type === "expense"));
        setForm((p) => calcPurchase({ ...p, category: name, expenseAccountKey: key }));
        toast.success(`"${name}" added to Chart of Accounts \u2014 it'll post there from now on.`);
      }
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text3)", marginTop: 3 } }, "Posts straight to that ledger. Type to search, or type a new name to add one \u2014 sub-heads (e.g. Travel \u203A Fuel) are managed under Reports \u2192 Chart of Accounts.")), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "GST Type"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: form.gstType || "INTRA", onChange: upF("gstType") }, /* @__PURE__ */ React.createElement("option", { value: "INTRA" }, "Intra-State (CGST + SGST)"), /* @__PURE__ */ React.createElement("option", { value: "INTER" }, "Inter-State (IGST)"))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Notes / Remarks"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.notes || "", onChange: upF("notes"), placeholder: "Transport, LR number, remarks..." }))), /* @__PURE__ */ React.createElement("div", { className: "g3", style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "TDS Section"), /* @__PURE__ */ React.createElement(
    SearchSelect,
    {
      value: form.tdsSection || "",
      options: TDS_SECTIONS.map((s) => ({ value: s.code, label: s.label })),
      onChange: (code) => setForm((p) => calcPurchase({ ...p, tdsSection: code, tdsRate: code ? String(tdsSectionRate(code)) : "" }))
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "TDS Rate (%)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.01",
      min: "0",
      className: "field-input",
      value: form.tdsRate || "",
      disabled: !form.tdsSection,
      onChange: upF("tdsRate"),
      placeholder: "0.00"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "TDS Deducted (Rs.)"), /* @__PURE__ */ React.createElement("div", { className: "field-input", style: { display: "flex", alignItems: "center", color: "var(--red)", fontWeight: 700, background: "var(--card2)" } }, fmt(form.tdsAmount || 0)))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 7 } }, /* @__PURE__ */ React.createElement(Ic, { n: "package", s: 15 }), " Items Purchased", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 500, color: "var(--text3)" } }, "\u2014 ticked lines are added to Inventory")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: addItem }, /* @__PURE__ */ React.createElement(Ic, { n: "plus", s: 13 }), " Add Line")), /* @__PURE__ */ React.createElement("datalist", { id: "purch-products" }, productList.map((p, i) => /* @__PURE__ */ React.createElement("option", { key: i, value: p.name }))), /* @__PURE__ */ React.createElement("div", { style: { border: "1px solid var(--border)", borderRadius: 10, overflowX: "auto", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1.2fr 110px 88px 78px 98px 84px 104px 60px 44px",
    gap: 6,
    padding: "8px 12px",
    background: "var(--card2)",
    borderBottom: "2px solid var(--border2)",
    fontSize: 10,
    fontWeight: 700,
    color: "var(--text3)",
    textTransform: "uppercase",
    minWidth: 1080
  } }, /* @__PURE__ */ React.createElement("span", null, "Product *"), /* @__PURE__ */ React.createElement("span", null, "Description"), /* @__PURE__ */ React.createElement("span", null, "HSN / SAC"), /* @__PURE__ */ React.createElement("span", null, "Unit"), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "center" } }, "Qty *"), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "right" } }, "Rate"), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "center" } }, "GST %"), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "right" } }, "Line Total"), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "center" } }, "Stock"), /* @__PURE__ */ React.createElement("span", null)), form.items.map((it, idx) => /* @__PURE__ */ React.createElement("div", { key: it.key || idx, style: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1.2fr 110px 88px 78px 98px 84px 104px 60px 44px",
    gap: 6,
    padding: "8px 12px",
    borderBottom: "1px solid var(--border)",
    alignItems: "center",
    minWidth: 1080
  } }, /* @__PURE__ */ React.createElement("input", { className: "field-input", list: "purch-products", value: it.product, onChange: (e) => pickProduct(idx, e.target.value), placeholder: "Item name" }), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: it.desc, onChange: (e) => upItem(idx, "desc", e.target.value), placeholder: "Optional details" }), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: it.hsnCode, onChange: (e) => upItem(idx, "hsnCode", e.target.value), placeholder: "84713010" }), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: it.unit, onChange: (e) => upItem(idx, "unit", e.target.value) }, UNITS.map((u) => /* @__PURE__ */ React.createElement("option", { key: u, value: u }, u))), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { textAlign: "center" }, value: it.qty, onChange: (e) => upItem(idx, "qty", e.target.value), min: "0" }), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { textAlign: "right" }, value: it.rate, onChange: (e) => upItem(idx, "rate", e.target.value), placeholder: "0.00", min: "0" }), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: it.taxRate, onChange: (e) => upItem(idx, "taxRate", e.target.value) }, ["0", "0.1", "0.25", "1", "1.5", "3", "5", "6", "12", "18", "28"].map((r) => /* @__PURE__ */ React.createElement("option", { key: r, value: r }, r, "%"))), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", fontWeight: 700, fontSize: 13 } }, fmt(it.total)), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      checked: it.toStock !== false,
      onChange: (e) => upItem(idx, "toStock", e.target.checked),
      title: "Add this quantity to inventory",
      style: { width: 16, height: 16, cursor: "pointer" }
    }
  )), /* @__PURE__ */ React.createElement("button", { className: "btn btn-xs btn-danger btn-icon", onClick: () => delItem(idx), disabled: form.items.length <= 1 }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 11 }))))), /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    gap: 14,
    padding: "11px 16px",
    background: "var(--card2)",
    borderRadius: 10,
    marginBottom: 12,
    border: "1px solid var(--border)",
    flexWrap: "wrap",
    alignItems: "center"
  } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)" } }, "Total Qty"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--green)" } }, form.items.reduce((t, i) => t + (parseFloat(i.qty) || 0), 0))), /* @__PURE__ */ React.createElement("div", { style: { color: "var(--border2)" } }, "|"), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)" } }, "Taxable"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700 } }, fmt(form.taxable))), /* @__PURE__ */ React.createElement("div", { style: { color: "var(--border2)" } }, "|"), form.gstType === "INTRA" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)" } }, "CGST"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--text2)" } }, fmt(form.gstAmt / 2))), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)" } }, "SGST"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--text2)" } }, fmt(form.gstAmt / 2)))) : /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)" } }, "IGST"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--text2)" } }, fmt(form.gstAmt))), /* @__PURE__ */ React.createElement("div", { style: { color: "var(--border2)" } }, "|"), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)" } }, "Input GST"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--blue)" } }, fmt(form.gstAmt))), /* @__PURE__ */ React.createElement("div", { style: { color: "var(--border2)" } }, "|"), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)" } }, "Bill Total"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, color: "var(--primary2)", fontSize: 17 } }, fmt(form.total))), form.tdsAmount > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { color: "var(--border2)" } }, "|"), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)" } }, "TDS Deducted"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--red)" } }, "\u2212 ", fmt(form.tdsAmount))), /* @__PURE__ */ React.createElement("div", { style: { color: "var(--border2)" } }, "|"), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)" } }, "Net Payable to Vendor"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, color: "var(--green)", fontSize: 15 } }, fmt(form.netPayable))))), /* @__PURE__ */ React.createElement("div", { className: "g4", style: { marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Payment Mode"), /* @__PURE__ */ React.createElement(
    SearchSelect,
    {
      value: form.payMode || "",
      options: simpleOptions(PAY_MODES),
      onChange: (v) => setForm((p) => calcPurchase({ ...p, payMode: v, paidFromKey: v === "Cash" && !p.paidFromKey ? "CASH_IN_HAND" : p.paidFromKey }))
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Payment Status"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: form.payStatus || "Pending", onChange: upF("payStatus") }, /* @__PURE__ */ React.createElement("option", { value: "Pending" }, "Pending"), /* @__PURE__ */ React.createElement("option", { value: "Partial" }, "Partial"), /* @__PURE__ */ React.createElement("option", { value: "Paid" }, "Paid"))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Amount Paid (Rs.)", form.tdsAmount > 0 ? " \u2014 after TDS" : ""), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      className: "field-input",
      value: form.payStatus === "Paid" ? form.netPayable : form.paidAmount || "",
      disabled: form.payStatus === "Paid",
      onChange: upF("paidAmount"),
      placeholder: "0.00",
      min: "0"
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: form.payStatus === "Paid" ? "var(--green)" : "var(--red)", marginTop: 3 } }, "Balance payable: ", fmt(expDue(calcPurchase(form))))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Paid Date"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: form.paidDate || "", onChange: upF("paidDate") }))), (form.payStatus === "Paid" || form.payStatus === "Partial") && /* @__PURE__ */ React.createElement("div", { className: "field", style: { maxWidth: 420, marginTop: 8 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Paid From (bank / cash ledger)"), /* @__PURE__ */ React.createElement(
    SearchSelect,
    {
      value: form.paidFromKey || "",
      clearable: true,
      placeholder: "Choose where the money came from\u2026",
      options: getPaymentLedgers().map((a) => ({ value: a.key, label: a.name, sub: a.derived ? "Bank account" : "Cash / wallet ledger" })),
      onChange: (v) => setForm((p) => ({ ...p, paidFromKey: v }))
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text3)", marginTop: 3 } }, "Posts this payment to that ledger so Trade Payables clears in the books. Leave blank if you will reconcile it from the bank statement instead \u2014 a statement line linked later is never counted twice.")))), /* @__PURE__ */ React.createElement("div", { className: "modal-ftr" }, tab === "list" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: onClose }, "Close"), tab === "add" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: () => {
    setForm(blankExp(currentUser));
    setEditId(null);
    setTab("list");
  } }, "Cancel"), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-primary",
      disabled: !isSuperAdmin(currentUser == null ? void 0 : currentUser.email) && isExpenseFrozen(form),
      onClick: saveExp
    },
    /* @__PURE__ */ React.createElement(Ic, { n: "save" }),
    editId ? "Update Purchase" : "Save Purchase & Add to Stock"
  )))));
};
const ExpenseModal = PurchaseModal;
const CustomerModal = ({ onClose, onSelect, inline = false, searchQuery = "", currentUser }) => {
  const blank = { name: "", address: "", city: "", state: "", pin: "", gstin: "", phone: "", email: "", notes: "" };
  const [list, setList] = useState(S.get(SK.CUST, []));
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState(searchQuery);
  useEffect(() => {
    if (searchQuery !== void 0) {
      setQ(searchQuery);
      setTab("list");
    }
  }, [searchQuery]);
  const [tab, setTab] = useState(onSelect ? "search" : "list");
  const save = () => {
    if (!form.name) {
      toast.error("Customer name required");
      return;
    }
    let u;
    const wasEditing = editing !== null;
    if (editing !== null) {
      u = list.map((c, i) => i === editing ? { ...form } : c);
    } else {
      if (list.find((c) => c.name.toLowerCase() === form.name.toLowerCase() && c.gstin === form.gstin)) {
        toast.error("Customer already exists");
        return;
      }
      u = [...list, { ...form, createdAt: (/* @__PURE__ */ new Date()).toISOString() }];
    }
    setList(u);
    S.set(SK.CUST, u);
    logAudit(wasEditing ? "CUSTOMER_EDITED" : "CUSTOMER_ADDED", `${form.name}${form.gstin ? " \u2014 GSTIN " + form.gstin : ""}`, currentUser);
    setForm(blank);
    setEditing(null);
    setTab("list");
    toast.success(editing !== null ? "Customer updated!" : "Customer saved!");
  };
  const del = (i) => {
    if (!window.confirm("Delete customer?")) return;
    const c = list[i];
    const u = list.filter((_, j) => j !== i);
    setList(u);
    S.set(SK.CUST, u);
    logAudit("CUSTOMER_DELETED", `${(c == null ? void 0 : c.name) || ""}`, currentUser);
  };
  const edit = (i) => {
    setForm({ ...list[i] });
    setEditing(i);
    setTab("add");
  };
  const filtered = list.filter((c) => {
    var _a, _b;
    return !q || c.name.toLowerCase().includes(q.toLowerCase()) || ((_a = c.gstin) == null ? void 0 : _a.includes(q)) || ((_b = c.city) == null ? void 0 : _b.toLowerCase().includes(q.toLowerCase()));
  });
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay", onClick: inline ? void 0 : ((e) => e.target === e.currentTarget && onClose()) }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal", style: { ...inline ? {} : { maxWidth: "min(1200px, 95vw)", width: "100%" } } }, /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("span", { className: "modal-title" }, /* @__PURE__ */ React.createElement(Ic, { n: "users", s: 20 }), " Customer Database"), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Ic, { n: "x" }))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" } }, [["list", `All Customers (${list.length})`], ["add", editing !== null ? "Edit Customer" : "Add Customer"]].map(([k, l]) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: k,
      onClick: () => setTab(k),
      style: {
        padding: "7px 18px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: tab === k ? 700 : 500,
        cursor: "pointer",
        border: `2px solid ${tab === k ? "var(--primary)" : "var(--border2)"}`,
        background: tab === k ? "var(--primary-bg)" : "transparent",
        color: tab === k ? "var(--primary2)" : "var(--text2)",
        display: "flex",
        alignItems: "center",
        gap: 6
      }
    },
    /* @__PURE__ */ React.createElement(Ic, { n: k === "list" ? "list" : editing !== null ? "edit" : "plus", s: 14 }),
    l
  ))), tab === "list" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { position: "relative", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", zIndex: 1 } }, /* @__PURE__ */ React.createElement(Ic, { n: "search", s: 14 })), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search by name, GSTIN, city...", style: { paddingLeft: 38, width: "100%" } })), filtered.length > 0 ? /* @__PURE__ */ React.createElement("div", { style: { border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", maxHeight: "50vh", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", { className: "cust-grid-hdr", style: { display: "grid", gridTemplateColumns: "1fr 130px 110px 120px auto", gap: 0, padding: "9px 14px", background: "var(--card2)", borderBottom: "2px solid var(--border2)", fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px" } }, /* @__PURE__ */ React.createElement("span", null, "Name"), /* @__PURE__ */ React.createElement("span", null, "GSTIN"), /* @__PURE__ */ React.createElement("span", null, "City"), /* @__PURE__ */ React.createElement("span", null, "Phone"), /* @__PURE__ */ React.createElement("span", null, "Actions")), filtered.map((c, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "cust-grid-row", style: { display: "grid", gridTemplateColumns: "1fr 130px 110px 120px auto", gap: 0, padding: "9px 14px", borderBottom: "1px solid var(--border)", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--text)", fontSize: 13 } }, c.name), c.email && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)" } }, c.email)), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "monospace", fontSize: 11, color: "var(--gold)" } }, c.gstin || "\u2014"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text2)" } }, c.city || "\u2014"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text2)" } }, c.phone || "\u2014"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5 } }, onSelect && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: () => {
    onSelect(c);
    onClose();
  } }, "Select"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline btn-icon", onClick: () => edit(list.indexOf(c)) }, /* @__PURE__ */ React.createElement(Ic, { n: "edit", s: 12 })), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger btn-icon", onClick: () => del(list.indexOf(c)) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 12 })))))) : /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "40px", color: "var(--text3)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 36, marginBottom: 8 } }, /* @__PURE__ */ React.createElement(Ic, { n: "users", s: 36 })), /* @__PURE__ */ React.createElement("div", null, "No customers yet. Add your first customer!"))), tab === "add" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "g2" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Customer Name *"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.name, onChange: (e) => setForm((p) => ({ ...p, name: e.target.value })), placeholder: "Business or Individual Name" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "GSTIN"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.gstin || "", onChange: (e) => setForm((p) => ({ ...p, gstin: e.target.value.toUpperCase() })), placeholder: "29XXXXX0000X1Z5", maxLength: 15 }))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Address"), /* @__PURE__ */ React.createElement("textarea", { className: "field-input", value: form.address || "", onChange: (e) => setForm((p) => ({ ...p, address: e.target.value })), rows: 2, placeholder: "Street, Area" })), /* @__PURE__ */ React.createElement("div", { className: "g3" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "City"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.city || "", onChange: (e) => setForm((p) => ({ ...p, city: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "State"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.state || "", onChange: (e) => setForm((p) => ({ ...p, state: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "PIN"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.pin || "", onChange: (e) => setForm((p) => ({ ...p, pin: e.target.value })), maxLength: 6 }))), /* @__PURE__ */ React.createElement("div", { className: "g2" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Phone"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.phone || "", onChange: (e) => setForm((p) => ({ ...p, phone: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Email"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.email || "", onChange: (e) => setForm((p) => ({ ...p, email: e.target.value })) }))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Notes"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.notes || "", onChange: (e) => setForm((p) => ({ ...p, notes: e.target.value })), placeholder: "Any notes about this customer..." })))), /* @__PURE__ */ React.createElement("div", { className: "modal-ftr" }, tab === "add" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: () => {
    setForm(blank);
    setEditing(null);
    setTab("list");
  } }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: save }, /* @__PURE__ */ React.createElement(Ic, { n: "save" }), "Save Customer")), tab === "list" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: onClose }, "Done"))));
};
const docBadge = (dt, isB2C) => {
  if (isB2C) return { label: "B2C", bg: "#E0F2FE", color: "#0369A1" };
  if (dt === "DEBIT NOTE") return { label: "DN", bg: "#FEF3C7", color: "#92400E" };
  if (dt === "CREDIT NOTE") return { label: "CN", bg: "#D1FAE5", color: "#065F46" };
  if (dt === "NON GST INVOICE") return { label: "NG", bg: "#F3E8FF", color: "#6B21A8" };
  return { label: "B2B", bg: "var(--primary-bg)", color: "var(--primary2)" };
};
const HistoryModal = ({ onClose, onLoad, onView, currentUser, inline = false, searchQuery = "" }) => {
  const [invs, setInvs] = useState(S.get(SK.INV, []));
  const [q, setQ] = useState(searchQuery);
  useEffect(() => {
    if (searchQuery !== void 0) setQ(searchQuery);
  }, [searchQuery]);
  const co = S.get(SK.CO, {});
  const rr = useReportRange("All Time");
  const isAdmin = (currentUser == null ? void 0 : currentUser.role) === "admin" || (currentUser == null ? void 0 : currentUser.role) === "superadmin";
  const del = (id) => {
    var _a;
    const inv = invs.find((i) => i.invNo === id);
    if (!isSuperAdmin(currentUser == null ? void 0 : currentUser.email) && isSalesFrozen(inv)) {
      toast.error(` ${((inv == null ? void 0 : inv.date) || "").substring(0, 7)} is frozen. Only Super Admin can delete invoices for this month.`);
      return;
    }
    if (!window.confirm("Delete this invoice permanently? Any stock it moved will be reversed.")) return;
    const u = invs.filter((i) => i.invNo !== id);
    setInvs(u);
    S.set(SK.INV, u);
    removeStockForSource(id);
    logAudit("INVOICE_DELETED", `${inv == null ? void 0 : inv.invNo} \u2014 ${(_a = inv == null ? void 0 : inv.billTo) == null ? void 0 : _a.name} \u2014 \u20B9${Math.abs(getGrand(inv || {})) || 0}`, currentUser);
    toast.info("Invoice deleted \u2014 stock reversed");
  };
  const rangeInvs = invs.filter((i) => inRangeDate(i.date, rr.applied));
  const sorted = [...invs].filter((i) => {
    var _a, _b, _c;
    return inRangeDate(i.date, rr.applied) && (!q || ((_a = i.invNo) == null ? void 0 : _a.toLowerCase().includes(q.toLowerCase())) || ((_c = (_b = i.billTo) == null ? void 0 : _b.name) == null ? void 0 : _c.toLowerCase().includes(q.toLowerCase())) || (i.docType || "").toLowerCase().includes(q.toLowerCase()) || (i.isB2C ? "b2c" : "b2b").includes(q.toLowerCase()));
  }).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const total = invs.reduce((s, i) => s + getGrand(i), 0);
  const mn = /* @__PURE__ */ new Date(), mInvs = invs.filter((i) => {
    const d = new Date(i.date || "");
    return d.getMonth() === mn.getMonth() && d.getFullYear() === mn.getFullYear();
  });
  if (inline) return /* @__PURE__ */ React.createElement("div", { className: "inline-card" }, /* @__PURE__ */ React.createElement("div", { className: "inline-card-inner" }, /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { className: "modal-title" }, /* @__PURE__ */ React.createElement(Ic, { n: "folder-open", s: 16 }), " Invoice History"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text3)", background: "var(--card2)", padding: "3px 10px", borderRadius: 20, border: "1px solid var(--border)" } }, sorted.length, " of ", invs.length, " records")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } }, isAdmin && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-primary btn-sm", onClick: () => makeGSTR1(invs) }, /* @__PURE__ */ React.createElement(Ic, { n: "xlsx", s: 13 }), "GSTR-1")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", onClick: pickSaveFolder, title: "Set folder for auto-saving PDFs" }, /* @__PURE__ */ React.createElement(Ic, { n: "folder", s: 16 }), " Save Folder"), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Ic, { n: "x" })))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement(
    ReportToolbar,
    {
      section: "Sales",
      title: "Sales Register",
      range: rr,
      count: rangeInvs.length,
      canExport: isAdmin,
      onExport: (f, r) => makeExcel(rangeInvs, f, { period: rangePeriodText(r) })
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "g4", style: { marginBottom: 18 } }, /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val" }, invs.length), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Total Records")), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16, color: total < 0 ? "var(--red)" : void 0 } }, fmt(total)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Net Revenue")), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val" }, mInvs.length), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "This Month")), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16 } }, fmt(mInvs.reduce((s, i) => s + getGrand(i), 0))), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Month Revenue"))), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", zIndex: 1 } }, /* @__PURE__ */ React.createElement(Ic, { n: "search", s: 14 })), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "field-input",
      value: q,
      onChange: (e) => setQ(e.target.value),
      placeholder: "Search by invoice no., customer name, type...",
      style: { paddingLeft: 38, fontSize: 13, width: "100%" }
    }
  )), sorted.length > 0 ? /* @__PURE__ */ React.createElement("div", { className: "hist-table-wrap", style: inline ? {} : { maxHeight: "58vh", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: 900 } }, /* @__PURE__ */ React.createElement("colgroup", null, /* @__PURE__ */ React.createElement("col", { style: { width: 48 } }), /* @__PURE__ */ React.createElement("col", { style: { width: 140 } }), /* @__PURE__ */ React.createElement("col", null), /* @__PURE__ */ React.createElement("col", { style: { width: 90 } }), /* @__PURE__ */ React.createElement("col", { style: { width: 90 } }), /* @__PURE__ */ React.createElement("col", { style: { width: 32 } }), /* @__PURE__ */ React.createElement("col", { style: { width: 110 } }), /* @__PURE__ */ React.createElement("col", { style: { width: isAdmin ? 300 : 262 } })), /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)", borderBottom: "2px solid var(--border2)", position: "sticky", top: 0, zIndex: 2 } }, ["Type", "Invoice No.", "Customer", "Date", "Status", "S", "Amount", "Actions"].map((h, i) => /* @__PURE__ */ React.createElement("th", { key: i, style: { padding: "9px 8px", fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: i === 6 ? "right" : i === 7 ? "center" : i === 5 ? "center" : "left", whiteSpace: "nowrap" } }, h)))), /* @__PURE__ */ React.createElement("tbody", null, sorted.map((inv, i) => {
    var _a;
    const b = docBadge(inv.docType, inv.isB2C);
    const isCN = inv.docType === "CREDIT NOTE";
    const stCfg = {
      Draft: { bg: "rgba(71,85,105,0.12)", color: "#475569" },
      Sent: { bg: "rgba(29,78,216,0.1)", color: "#1D4ED8" },
      Paid: { bg: "rgba(22,101,52,0.1)", color: "#166534" },
      Overdue: { bg: "rgba(220,38,38,0.1)", color: "#DC2626" }
    }[inv.status || "Draft"] || { bg: "rgba(71,85,105,0.12)", color: "#475569" };
    return /* @__PURE__ */ React.createElement(
      "tr",
      {
        key: i,
        style: { borderBottom: "1px solid var(--border)", transition: "background 0.15s" },
        onMouseEnter: (e) => e.currentTarget.style.background = "var(--primary-bg)",
        onMouseLeave: (e) => e.currentTarget.style.background = ""
      },
      /* @__PURE__ */ React.createElement("td", { style: { padding: "9px 10px" } }, /* @__PURE__ */ React.createElement("span", { style: { background: b.bg, color: b.color, borderRadius: 5, padding: "3px 6px", fontSize: 10, fontWeight: 700, display: "inline-block", whiteSpace: "nowrap" } }, b.label)),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "9px 10px", fontFamily: "monospace", fontWeight: 700, color: "var(--gold)", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, inv.invNo, inv.voucherNo && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9.5, fontWeight: 500, color: "var(--text3)", marginTop: 1 }, title: "Accounting Voucher No." }, "V# ", inv.voucherNo), inv.txnRefNo && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9.5, fontWeight: 500, color: "var(--text3)" }, title: "Transaction Reference No." }, "Ref# ", inv.txnRefNo)),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "9px 10px", color: "var(--text)", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, ((_a = inv.billTo) == null ? void 0 : _a.name) || "Unknown"),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "9px 10px", color: "var(--text3)", fontSize: 12, whiteSpace: "nowrap" } }, fmtDate(inv.date)),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "9px 6px" } }, /* @__PURE__ */ React.createElement("span", { style: { padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: stCfg.bg, color: stCfg.color, whiteSpace: "nowrap", display: "inline-block" } }, inv.status === "Draft" ? "Draft" : inv.status === "Sent" ? "Sent" : inv.status === "Paid" ? "Paid" : "Overdue")),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "9px 6px", textAlign: "center", fontSize: 14 } }, inv.sentToCustomer ? "S" : "\u2014"),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "9px 8px", textAlign: "right", fontWeight: 700, color: isCN ? "var(--red)" : "var(--text)", fontSize: 13, whiteSpace: "nowrap" } }, isCN && /* @__PURE__ */ React.createElement("span", { style: { color: "var(--red)" } }, "\u2212"), fmt(Math.abs(getGrand(inv) || 0))),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 4px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 3, justifyContent: "center", alignItems: "center", flexWrap: "nowrap" } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "btn btn-sm btn-outline-primary",
          style: {
            padding: "4px 8px",
            fontSize: 11,
            opacity: !isSuperAdmin(currentUser == null ? void 0 : currentUser.email) && isSalesFrozen(inv) ? 0.6 : 1
          },
          title: !isSuperAdmin(currentUser == null ? void 0 : currentUser.email) && isSalesFrozen(inv) ? ` ${(inv.date || "").substring(0, 7)} is frozen \u2014 you can view but cannot save changes` : "Load invoice",
          onClick: () => {
            if (!isSuperAdmin(currentUser == null ? void 0 : currentUser.email) && isSalesFrozen(inv)) {
              toast.error(` ${(inv.date || "").substring(0, 7)} is frozen. You can view but changes cannot be saved. Contact Super Admin to unfreeze.`);
            }
            (onView || onLoad)(inv);
            onClose();
          }
        },
        "Open"
      ), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", style: { padding: "4px 8px", fontSize: 11 }, title: "Create a NEW copy of this invoice (nothing is saved until you press Save)", onClick: () => {
        if (!window.confirm("Create a duplicate of " + inv.invNo + "?\nA new invoice number will be used. Nothing is saved to the books until you press Save.")) return;
        const dup = { ...inv, invNo: genInvNo(inv.docType), date: today(), dueDate: "", status: "Draft", sentToCustomer: false, paidDate: "", payments: [], time: nowTime(), _isDuplicate: true };
        onLoad(dup);
        onClose();
        toast.success("Duplicate opened \u2014 review and Save to create it");
      } }, "Duplicate"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline btn-icon", style: { width: 28, height: 28 }, title: "Download PDF", onClick: () => makePDF(inv, co, S.get(SK.TERMS, DEFAULT_TERMS)) }, /* @__PURE__ */ React.createElement(Ic, { n: "pdf", s: 12 })), isSalesFrozen(inv) && /* @__PURE__ */ React.createElement("span", { title: "Month is frozen", style: { fontSize: 10, fontWeight: 700, color: "var(--gold)", background: "rgba(241,73,92,0.15)", padding: "2px 6px", borderRadius: 4 } }, "\u{1F512}"), isAdmin && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger btn-icon", style: { width: 28, height: 28, opacity: !isSuperAdmin(currentUser == null ? void 0 : currentUser.email) && isSalesFrozen(inv) ? 0.4 : 1 }, title: !isSuperAdmin(currentUser == null ? void 0 : currentUser.email) && isSalesFrozen(inv) ? "Month frozen \u2014 Super Admin only" : "Delete", onClick: () => del(inv.invNo) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 12 }))))
    );
  })))) : /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "60px", color: "var(--text3)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 40, marginBottom: 12 } }, /* @__PURE__ */ React.createElement(Ic, { n: "inbox", s: 16 })), /* @__PURE__ */ React.createElement("div", null, "No records saved yet."))), /* @__PURE__ */ React.createElement("div", { className: "modal-ftr" }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "var(--text3)", display: "flex", alignItems: "center", gap: 6 } }, isAdmin ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--green)" } }, "Admin"), " \u2014 full access") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(Ic, { n: "eye", s: 16 }), "\uFE0F"), " Staff \u2014 view & download only. Contact admin to delete.")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: onClose }, "Close"))));
};
const ItemRow = ({ row, idx, onChange, onDelete, hsnList, gstType, descOnly = false, cur = "INR" }) => {
  const [showHsnDrop, setShowHsnDrop] = useState(false);
  const [showDescDrop, setShowDescDrop] = useState(false);
  const [hsnQ, setHsnQ] = useState(row.hsnCode || "");
  const [descQ, setDescQ] = useState(row.desc || "");
  const [hsnPos, setHsnPos] = useState({ top: 0, left: 0, width: 380 });
  const [descPos, setDescPos] = useState({ top: 0, left: 0, width: 380 });
  const hsnRef = useRef();
  const descRef = useRef();
  const hsnDropRef = useRef();
  const descDropRef = useRef();
  useEffect(() => {
    setHsnQ(row.hsnCode || "");
  }, [row.hsnCode]);
  useEffect(() => {
    setDescQ(row.desc || "");
  }, [row.desc]);
  useEffect(() => {
    const h = (e) => {
      if (hsnRef.current && !hsnRef.current.contains(e.target) && hsnDropRef.current && !hsnDropRef.current.contains(e.target))
        setShowHsnDrop(false);
      if (descRef.current && !descRef.current.contains(e.target) && descDropRef.current && !descDropRef.current.contains(e.target))
        setShowDescDrop(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const updatePos = (ref, setter) => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setter({ top: r.bottom + 4, left: Math.min(r.left, window.innerWidth - 390), width: Math.max(r.width, 370) });
    }
  };
  useEffect(() => {
    if (showHsnDrop) {
      updatePos(hsnRef, setHsnPos);
      const fn = () => updatePos(hsnRef, setHsnPos);
      window.addEventListener("scroll", fn, true);
      window.addEventListener("resize", fn);
      return () => {
        window.removeEventListener("scroll", fn, true);
        window.removeEventListener("resize", fn);
      };
    }
  }, [showHsnDrop]);
  useEffect(() => {
    if (showDescDrop) {
      updatePos(descRef, setDescPos);
      const fn = () => updatePos(descRef, setDescPos);
      window.addEventListener("scroll", fn, true);
      window.addEventListener("resize", fn);
      return () => {
        window.removeEventListener("scroll", fn, true);
        window.removeEventListener("resize", fn);
      };
    }
  }, [showDescDrop]);
  const hsnMatched = hsnQ.length > 0 ? hsnList.filter((h) => h.code.startsWith(hsnQ) || h.code.includes(hsnQ) || h.desc.toLowerCase().includes(hsnQ.toLowerCase())).slice(0, 15) : [];
  const products = S.get(SK.PRODUCTS, []);
  const descMatched = descQ.length > 1 ? [
    ...products.filter((p) => p.name.toLowerCase().includes(descQ.toLowerCase()) || (p.desc || "").toLowerCase().includes(descQ.toLowerCase())).slice(0, 6).map((p) => ({ code: p.hsnCode || "", desc: p.name, taxRate: p.taxRate || "18", unit: p.unit || "Nos", category: p.category || "Product", _rate: p.rate })),
    ...hsnList.filter((h) => h.desc.toLowerCase().includes(descQ.toLowerCase()) || h.code.startsWith(descQ)).slice(0, 8)
  ].slice(0, 12) : [];
  const calc = (updated) => {
    const qty = parseFloat(updated.qty) || 0, rate = parseFloat(updated.rate) || 0;
    const disc = parseFloat(updated.discount) || 0, tax = parseFloat(updated.taxRate) || 0;
    const gross = qty * rate, discAmt = gross * (disc / 100), taxable = gross - discAmt;
    updated.taxable = taxable.toFixed(2);
    updated.gstAmt = (taxable * tax / 100).toFixed(2);
    updated.total = (taxable * (1 + tax / 100)).toFixed(2);
    return updated;
  };
  const up = (k) => (e) => {
    onChange(idx, calc({ ...row, [k]: e.target.value }));
  };
  const selectHSN = (h) => {
    const updated = calc({ ...row, hsnCode: h.code, taxRate: h.taxRate, unit: h.unit });
    if (!row.desc) {
      updated.desc = h.desc;
      setDescQ(h.desc);
    }
    onChange(idx, updated);
    setHsnQ(h.code);
    setShowHsnDrop(false);
  };
  const selectDesc = (h) => {
    const updated = calc({ ...row, desc: h.desc, hsnCode: h.code, taxRate: h.taxRate, unit: h.unit, rate: h._rate || row.rate || "" });
    onChange(idx, updated);
    setDescQ(h.desc);
    setHsnQ(h.code);
    setShowDescDrop(false);
  };
  const taxLabel = gstType === "INTRA" ? `CGST ${parseFloat(row.taxRate || 0) / 2}%+SGST ${parseFloat(row.taxRate || 0) / 2}%` : `IGST ${row.taxRate || 0}%`;
  const Dropdown = ({ dRef, pos, items, onSel, label }) => ReactDOM.createPortal(
    /* @__PURE__ */ React.createElement("div", { ref: dRef, style: {
      position: "fixed",
      top: pos.top,
      left: pos.left,
      width: pos.width,
      background: "var(--card)",
      border: "1.5px solid var(--border2)",
      borderRadius: 10,
      boxShadow: "0 8px 40px rgba(0,0,0,0.45)",
      zIndex: 99999,
      maxHeight: 300,
      overflowY: "auto"
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      padding: "6px 12px",
      fontSize: 10,
      color: "var(--text3)",
      borderBottom: "1px solid var(--border)",
      fontWeight: 600,
      background: "var(--card2)",
      borderRadius: "10px 10px 0 0"
    } }, items.length, " match", items.length !== 1 ? "es" : "", " \u2014 ", label), items.map((h, j) => /* @__PURE__ */ React.createElement("div", { key: j, className: "hsn-opt", onMouseDown: (e) => {
      e.preventDefault();
      onSel(h);
    } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "hsn-code" }, h.code || "\u2014"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, alignItems: "center" } }, h._rate && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "var(--primary2)", fontWeight: 600 } }, "\u20B9", Number(h._rate).toLocaleString("en-IN")), h.taxRate && /* @__PURE__ */ React.createElement("span", { className: "badge badge-green", style: { fontSize: 10 } }, h.taxRate, "%"), h.category && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, background: "var(--primary-bg)", color: "var(--primary2)", padding: "1px 5px", borderRadius: 6, fontWeight: 600 } }, h.category.slice(0, 10)))), /* @__PURE__ */ React.createElement("div", { className: "hsn-desc" }, h.desc)))),
    document.body
  );
  return /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { className: "p-sno" }, idx + 1), /* @__PURE__ */ React.createElement("td", { style: { minWidth: 220, position: "relative" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      ref: descRef,
      className: "p-input",
      value: descQ,
      onChange: (e) => {
        setDescQ(e.target.value);
        up("desc")(e);
        setShowDescDrop(e.target.value.length > 1);
      },
      onFocus: () => {
        if (descQ.length > 1) setShowDescDrop(true);
      },
      placeholder: "Type description or search HSN..."
    }
  ), showDescDrop && descMatched.length > 0 && /* @__PURE__ */ React.createElement(Dropdown, { dRef: descDropRef, pos: descPos, items: descMatched, onSel: selectDesc, label: "click to auto-fill HSN" })), /* @__PURE__ */ React.createElement("td", { style: { minWidth: 130 } }, /* @__PURE__ */ React.createElement("div", { className: "hsn-wrap" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      ref: hsnRef,
      className: "p-input gold",
      value: hsnQ,
      onChange: (e) => {
        setHsnQ(e.target.value);
        up("hsnCode")(e);
        setShowHsnDrop(true);
      },
      onFocus: () => setShowHsnDrop(true),
      placeholder: "HSN/SAC",
      style: { maxWidth: 110 }
    }
  ), showHsnDrop && hsnMatched.length > 0 && /* @__PURE__ */ React.createElement(Dropdown, { dRef: hsnDropRef, pos: hsnPos, items: hsnMatched, onSel: selectHSN, label: "click to auto-fill" }))), /* @__PURE__ */ React.createElement("td", { style: { minWidth: 90 } }, /* @__PURE__ */ React.createElement("select", { value: row.unit || "Nos", onChange: up("unit"), className: "p-input", style: { maxWidth: 80 } }, UNITS.map((u) => /* @__PURE__ */ React.createElement("option", { key: u, value: u }, u)))), /* @__PURE__ */ React.createElement("td", { style: { minWidth: 70 } }, /* @__PURE__ */ React.createElement("input", { type: "number", className: "p-input r", value: row.qty || "", onChange: up("qty"), placeholder: "1", min: "0" })), /* @__PURE__ */ React.createElement("td", { style: { minWidth: 90 } }, /* @__PURE__ */ React.createElement("input", { type: "number", className: "p-input r", value: row.rate || "", onChange: up("rate"), placeholder: "0.00", min: "0" })), !descOnly && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("td", { style: { minWidth: 60 } }, /* @__PURE__ */ React.createElement("input", { type: "number", className: "p-input r", value: row.discount || "", onChange: up("discount"), placeholder: "0", min: "0", max: "100" })), /* @__PURE__ */ React.createElement("td", { style: { minWidth: 80 } }, /* @__PURE__ */ React.createElement("select", { value: row.taxRate || "18", onChange: up("taxRate"), className: "p-input", style: { maxWidth: 72 } }, TAX_RATES.map((r) => /* @__PURE__ */ React.createElement("option", { key: r, value: r }, r, "%")))), /* @__PURE__ */ React.createElement("td", { className: "p-num", style: { minWidth: 100 } }, fmtC(row.taxable || 0, cur)), /* @__PURE__ */ React.createElement("td", { style: { minWidth: 130, fontSize: 10, color: "var(--text3)", textAlign: "center", whiteSpace: "nowrap" } }, taxLabel), /* @__PURE__ */ React.createElement("td", { className: "p-total", style: { minWidth: 100 } }, fmtC(row.total || 0, cur))), descOnly && /* @__PURE__ */ React.createElement("td", { className: "p-total", style: { minWidth: 110 } }, "\u20B9", ((row.qty || 0) * (parseFloat(row.rate) || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })), /* @__PURE__ */ React.createElement("td", { style: { width: 38 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-icon btn-danger btn-sm", onClick: () => onDelete(idx) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 13 }))));
};
const ProductRow = (props) => /* @__PURE__ */ React.createElement(ItemRow, { ...props, descOnly: false });
const NonGSTRow = ({ row, idx, onChange, onDelete, hsnList }) => {
  const [showDescDrop, setShowDescDrop] = useState(false);
  const [descQ, setDescQ] = useState(row.desc || "");
  const [descPos, setDescPos] = useState({ top: 0, left: 0, width: 380 });
  const descRef = useRef();
  const descDropRef = useRef();
  const products = S.get(SK.PRODUCTS, []);
  useEffect(() => {
    setDescQ(row.desc || "");
  }, [row.desc]);
  useEffect(() => {
    const h = (e) => {
      if (descRef.current && !descRef.current.contains(e.target) && descDropRef.current && !descDropRef.current.contains(e.target))
        setShowDescDrop(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => {
    if (showDescDrop && descRef.current) {
      const r = descRef.current.getBoundingClientRect();
      setDescPos({ top: r.bottom + 4, left: Math.min(r.left, window.innerWidth - 390), width: Math.max(r.width, 370) });
    }
  }, [showDescDrop]);
  const descMatched = descQ.length > 1 ? [
    ...products.filter((p) => p.name.toLowerCase().includes(descQ.toLowerCase()) || (p.desc || "").toLowerCase().includes(descQ.toLowerCase())).slice(0, 6).map((p) => ({ type: "product", label: p.name, sub: p.category, rate: p.rate })),
    ...hsnList.filter((h) => h.desc.toLowerCase().includes(descQ.toLowerCase()) || h.code.startsWith(descQ)).slice(0, 6).map((h) => ({ type: "hsn", label: h.desc, sub: h.code, rate: "" }))
  ].slice(0, 12) : [];
  const calcNG = (updated) => {
    updated.total = ((parseFloat(updated.qty) || 0) * (parseFloat(updated.rate) || 0)).toFixed(2);
    return updated;
  };
  const up = (k) => (e) => onChange(idx, calcNG({ ...row, [k]: e.target.value }));
  const selectItem = (item) => {
    const updated = calcNG({ ...row, desc: item.label, rate: item.rate || row.rate || "" });
    onChange(idx, updated);
    setDescQ(item.label);
    setShowDescDrop(false);
  };
  return /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { className: "p-sno" }, idx + 1), /* @__PURE__ */ React.createElement("td", { style: { minWidth: 260, position: "relative" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      ref: descRef,
      className: "p-input",
      value: descQ,
      onChange: (e) => {
        setDescQ(e.target.value);
        up("desc")(e);
        setShowDescDrop(e.target.value.length > 1);
      },
      onFocus: () => {
        if (descQ.length > 1) setShowDescDrop(true);
      },
      placeholder: "Type to search products/services..."
    }
  ), showDescDrop && descMatched.length > 0 && ReactDOM.createPortal(
    /* @__PURE__ */ React.createElement("div", { ref: descDropRef, style: {
      position: "fixed",
      top: descPos.top,
      left: descPos.left,
      width: descPos.width,
      background: "var(--card)",
      border: "1.5px solid var(--border2)",
      borderRadius: 10,
      boxShadow: "0 8px 40px rgba(0,0,0,0.45)",
      zIndex: 99999,
      maxHeight: 280,
      overflowY: "auto"
    } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "6px 12px", fontSize: 10, color: "var(--text3)", borderBottom: "1px solid var(--border)", fontWeight: 700, background: "var(--card2)", borderRadius: "10px 10px 0 0" } }, descMatched.length, " matches"), descMatched.map((item, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "hsn-opt", onMouseDown: (e) => {
      e.preventDefault();
      selectItem(item);
    } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: "var(--text)", fontSize: 12 } }, item.label), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, background: item.type === "product" ? "var(--primary-bg)" : "var(--gold-bg)", color: item.type === "product" ? "var(--primary2)" : "var(--gold)", padding: "1px 6px", borderRadius: 8, fontWeight: 700 } }, item.type === "product" ? "Product" : "HSN")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text3)", marginTop: 2 } }, item.sub, item.rate && ` \xB7 \u20B9${Number(item.rate).toLocaleString("en-IN")}`)))),
    document.body
  )), /* @__PURE__ */ React.createElement("td", { style: { minWidth: 80 } }, /* @__PURE__ */ React.createElement("input", { type: "number", className: "p-input r", value: row.rate || "", onChange: up("rate"), placeholder: "0.00", min: "0" })), /* @__PURE__ */ React.createElement("td", { style: { minWidth: 70 } }, /* @__PURE__ */ React.createElement("input", { type: "number", className: "p-input r", value: row.qty || "", onChange: up("qty"), placeholder: "1", min: "0" })), /* @__PURE__ */ React.createElement("td", { className: "p-total", style: { minWidth: 100 } }, "\u20B9", Number(row.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })), /* @__PURE__ */ React.createElement("td", { style: { width: 38 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-icon btn-danger btn-sm", onClick: () => onDelete(idx) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 13 }))));
};
