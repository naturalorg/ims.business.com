const checkOverdue = () => {
  const invs = S.get(SK.INV, []);
  const todayStr = today();
  let changed = false;
  const updated = invs.map((inv) => {
    if (inv.dueDate && inv.dueDate < todayStr && inv.status !== "Paid" && inv.status !== "Overdue" && inv.status !== "Draft") {
      changed = true;
      return { ...inv, status: "Overdue" };
    }
    return inv;
  });
  if (changed) {
    S.set(SK.INV, updated);
    const cnt = updated.filter((i) => i.status === "Overdue").length;
    toast.error(`${cnt} invoice${cnt > 1 ? "s" : ""} marked Overdue!`);
  }
  return updated.filter((i) => i.status === "Overdue").length;
};
const DEFAULT_PRODUCTS = [];
const ProductMasterModal = ({ onClose, onSelect, currentUser }) => {
  var _a, _b;
  const blank = { name: "", desc: "", hsnCode: "", unit: "Nos", rate: "", taxRate: "18", category: "", trackStock: false, openingStock: "", openingRate: "", reorderLevel: "" };
  const [list, setList] = useState(S.get(SK.PRODUCTS, DEFAULT_PRODUCTS));
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState(onSelect ? "search" : "list");
  const up = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const save = () => {
    if (!form.name || !form.rate) {
      toast.error("Product name and rate required");
      return;
    }
    let u;
    const wasEditing = editing !== null;
    if (editing !== null) {
      u = list.map((p, i) => i === editing ? { ...p, ...form } : p);
    } else {
      if (list.find((p) => p.name.toLowerCase() === form.name.toLowerCase())) {
        toast.error("Product already exists");
        return;
      }
      const opening = form.trackStock ? parseFloat(form.openingStock) || 0 : 0;
      u = [...list, { ...form, currentStock: opening, createdAt: (/* @__PURE__ */ new Date()).toISOString() }];
    }
    S.set(SK.PRODUCTS, u);
    logAudit(wasEditing ? "PRODUCT_EDITED" : "PRODUCT_ADDED", `${form.name}${form.rate ? " \u2014 \u20B9" + form.rate : ""}`, currentUser);
    rebuildStock();
    setList(S.get(SK.PRODUCTS, []));
    setForm(blank);
    setEditing(null);
    setTab("list");
    toast.success(editing !== null ? "Product updated!" : "Product saved!");
  };
  const del = (i) => {
    if (!window.confirm("Delete product?")) return;
    const p = list[i];
    const u = list.filter((_, j) => j !== i);
    S.set(SK.PRODUCTS, u);
    logAudit("PRODUCT_DELETED", `${(p == null ? void 0 : p.name) || ""}`, currentUser);
    rebuildStock();
    setList(S.get(SK.PRODUCTS, []));
  };
  const edit = (i) => {
    setForm({ ...list[i] });
    setEditing(i);
    setTab("add");
  };
  const filtered = list.filter((p) => {
    var _a2;
    return !q || p.name.toLowerCase().includes(q.toLowerCase()) || ((_a2 = p.hsnCode) == null ? void 0 : _a2.includes(q)) || (p.category || "").toLowerCase().includes(q.toLowerCase());
  });
  return /* @__PURE__ */ React.createElement("div", { className: "overlay", onClick: (e) => e.target === e.currentTarget && onClose() }, /* @__PURE__ */ React.createElement("div", { className: "modal", style: { maxWidth: 1060, width: "96vw" } }, /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("span", { className: "modal-title" }, /* @__PURE__ */ React.createElement(Ic, { n: "package", s: 16 }), " Product / Item Master"), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Ic, { n: "x" }))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 16 } }, [["list", `All Products (${list.length})`], ["add", editing !== null ? "Edit" : "Add Product"]].map(([k, l]) => /* @__PURE__ */ React.createElement(
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
        color: tab === k ? "var(--primary2)" : "var(--text2)"
      }
    },
    l
  ))), tab === "add" && /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "g3" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Product Name *"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.name, onChange: up("name"), placeholder: "e.g. Laptop Core i5" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Category"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.category, onChange: up("category"), placeholder: "e.g. Electronics" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "HSN / SAC Code"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.hsnCode, onChange: up("hsnCode"), placeholder: "e.g. 8471" }))), /* @__PURE__ */ React.createElement("div", { className: "g4" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Default Unit"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: form.unit, onChange: up("unit") }, UNITS.map((u) => /* @__PURE__ */ React.createElement("option", { key: u }, u)))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Default Rate (\u20B9) *"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: form.rate, onChange: up("rate"), placeholder: "0.00" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "GST Rate %"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: form.taxRate, onChange: up("taxRate") }, TAX_RATES.map((r) => /* @__PURE__ */ React.createElement("option", { key: r, value: r }, r, "%")))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Description"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.desc, onChange: up("desc"), placeholder: "Optional description" }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, margin: "4px 0 12px" } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", id: "trackStock", checked: !!form.trackStock, onChange: (e) => setForm((p) => ({ ...p, trackStock: e.target.checked })) }), /* @__PURE__ */ React.createElement("label", { htmlFor: "trackStock", style: { fontSize: 13, cursor: "pointer" } }, "Track inventory / stock for this item")), form.trackStock && /* @__PURE__ */ React.createElement("div", { className: "g3", style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Opening Stock"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: form.openingStock, onChange: up("openingStock"), placeholder: "0" }), editing !== null && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text3)", marginTop: 3 } }, "Live stock now: ", /* @__PURE__ */ React.createElement("strong", null, (_b = (_a = list[editing]) == null ? void 0 : _a.currentStock) != null ? _b : 0), " \u2014 that is opening plus every purchase, sale and adjustment. Change opening only to correct your starting figure; use Inventory \u2192 Adjust for day-to-day corrections.")), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Opening Cost Rate (\u20B9)"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: form.openingRate || "", onChange: up("openingRate"), placeholder: "What you paid per unit" }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text3)", marginTop: 3 } }, "Used to value opening stock. Blank \u2192 falls back to sale rate, which overstates stock value.")), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Reorder Level"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: form.reorderLevel, onChange: up("reorderLevel"), placeholder: "e.g. 10" }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: save }, editing !== null ? "Update Product" : "Save Product"), editing !== null && /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: () => {
    setForm(blank);
    setEditing(null);
    setTab("list");
  } }, "Cancel"))), tab === "list" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { position: "relative", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", zIndex: 1 } }, /* @__PURE__ */ React.createElement(Ic, { n: "search", s: 14 })), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search by name, HSN, category...", style: { paddingLeft: 38, width: "100%" } })), filtered.length > 0 ? /* @__PURE__ */ React.createElement("div", { style: { border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", maxHeight: "52vh", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 90px 80px 80px 100px 90px auto", gap: 0, padding: "9px 14px", background: "var(--card2)", borderBottom: "2px solid var(--border2)", fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px" } }, /* @__PURE__ */ React.createElement("span", null, "Name / Category"), /* @__PURE__ */ React.createElement("span", null, "HSN/SAC"), /* @__PURE__ */ React.createElement("span", null, "Unit"), /* @__PURE__ */ React.createElement("span", null, "GST%"), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "right" } }, "Rate (\u20B9)"), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "center" } }, "Stock"), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "center" } }, "Actions")), filtered.map((p, i) => {
    var _a2;
    return /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "grid", gridTemplateColumns: "1fr 90px 80px 80px 100px 90px auto", gap: 0, padding: "9px 14px", borderBottom: "1px solid var(--border)", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--text)", fontSize: 13 } }, p.name), p.category && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)" } }, p.category), p.desc && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", fontStyle: "italic" } }, p.desc)), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "monospace", fontSize: 11, color: "var(--gold)" } }, p.hsnCode || "\u2014"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text2)" } }, p.unit || "Nos"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "badge badge-green" }, p.taxRate || "18", "%")), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--primary2)", textAlign: "right", fontSize: 13 } }, "\u20B9", Number(p.rate || 0).toLocaleString("en-IN")), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, p.trackStock ? /* @__PURE__ */ React.createElement("span", { className: `badge ${Number(p.currentStock || 0) <= Number(p.reorderLevel || 0) ? "badge-red" : "badge-green"}` }, (_a2 = p.currentStock) != null ? _a2 : 0) : /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text3)", fontSize: 11 } }, "\u2014")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5, justifyContent: "center" } }, onSelect && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: () => {
      onSelect(p);
      onClose();
    } }, "Select"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline btn-icon", onClick: () => edit(list.indexOf(p)) }, /* @__PURE__ */ React.createElement(Ic, { n: "edit", s: 12 })), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger btn-icon", onClick: () => del(list.indexOf(p)) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 12 }))));
  })) : /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "40px", color: "var(--text3)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 36, marginBottom: 8 } }, /* @__PURE__ */ React.createElement(Ic, { n: "package", s: 16 })), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, "No products yet."), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => setTab("add") }, " Add First Product")))), /* @__PURE__ */ React.createElement("div", { className: "modal-ftr" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: onClose }, "Close"))));
};
const findProductForLine = (desc, products) => {
  if (!desc) return null;
  const d = String(desc).trim().toLowerCase();
  const exact = products.find((p) => (p.name || "").toLowerCase() === d);
  if (exact) return exact;
  const head = String(desc).split(" \u2014 ")[0].trim().toLowerCase();
  return products.find((p) => (p.name || "").toLowerCase() === head) || null;
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const stockLog = () => {
  const l = S.get(SK.STOCK, []);
  return Array.isArray(l) ? l : [];
};
const guessRefType = (l) => {
  if (l.refType) return l.refType;
  const r = String(l.reason || "").toLowerCase();
  if (r.includes("purchase")) return "PURCHASE";
  if (r.includes("invoice") || r.includes("sale") || r.includes("credit note")) return "INVOICE";
  return "ADJUST";
};
const docLabelFor = (refType, qty) => {
  if (refType === "PURCHASE") return qty < 0 ? "Purchase Return" : "Purchase";
  if (refType === "INVOICE") return qty > 0 ? "Sales Return" : "Sale";
  if (refType === "OPENING") return "Opening";
  return "Adjustment";
};
const normLine = (l) => {
  const qty = Number(l.qty !== void 0 ? l.qty : l.qtyChange) || 0;
  const rate = Number(l.rate) || 0;
  const refType = guessRefType(l);
  return {
    id: l.id || uid(),
    date: l.date || today(),
    time: l.time || "",
    product: l.product || "",
    qty,
    rate,
    type: l.type || (qty >= 0 ? "IN" : "OUT"),
    refType,
    ref: l.ref || "",
    party: l.party || "",
    reason: l.reason || "",
    srcId: l.srcId || "",
    user: l.user || "",
    balanceAfter: Number(l.balanceAfter) || 0,
    // ── aliases the Inventory/Ageing screens read ──
    qtyChange: qty,
    dir: qty >= 0 ? "IN" : "OUT",
    value: Math.round(Math.abs(qty * rate) * 100) / 100,
    doc: l.doc || docLabelFor(refType, qty)
  };
};
const sortLedger = (rows) => [...rows].sort((a, b) => {
  if (a.date !== b.date) return (a.date || "") < (b.date || "") ? -1 : 1;
  return (a.time || "") < (b.time || "") ? -1 : a.time === b.time ? 0 : 1;
});
const rebuildStock = (rows) => {
  const log = sortLedger((rows || stockLog()).map(normLine));
  const products = S.get(SK.PRODUCTS, []);
  const run = {};
  products.forEach((p) => {
    run[(p.name || "").toLowerCase()] = Number(p.openingStock) || 0;
  });
  log.forEach((l) => {
    const k = (l.product || "").toLowerCase();
    if (run[k] === void 0) run[k] = 0;
    run[k] += l.qty;
    l.balanceAfter = Math.round(run[k] * 1e4) / 1e4;
  });
  const updated = products.map((p) => {
    const k = (p.name || "").toLowerCase();
    if (!p.trackStock) return p;
    const v = run[k] !== void 0 ? run[k] : Number(p.openingStock) || 0;
    return { ...p, currentStock: Math.round(v * 1e4) / 1e4 };
  });
  S.set(SK.PRODUCTS, updated);
  S.set(SK.STOCK, log);
  return log;
};
const addStockLine = (productName, qty, meta = {}, user) => {
  if (!productName || !qty) return;
  const products = S.get(SK.PRODUCTS, []);
  const prod = products.find((p) => (p.name || "").toLowerCase() === String(productName).toLowerCase());
  if (!prod || !prod.trackStock) return;
  const rate = Number(meta.rate) || 0;
  const line = {
    id: uid(),
    date: meta.date || today(),
    time: nowTime(),
    product: prod.name,
    qty: Number(qty),
    rate,
    type: Number(qty) >= 0 ? "IN" : "OUT",
    refType: meta.refType || "ADJUST",
    ref: meta.ref || "",
    party: meta.party || "",
    reason: meta.reason || "",
    srcId: meta.srcId || "",
    user: (user == null ? void 0 : user.name) || "",
    balanceAfter: 0
  };
  rebuildStock([...stockLog(), line]);
};
const adjustStock = (productName, qtyChange, reason, ref, user, meta = {}) => addStockLine(productName, qtyChange, { reason, ref, ...meta }, user);
const removeStockForSource = (srcId) => {
  if (!srcId) return;
  const rows = stockLog().filter((l) => String(l.srcId || "") !== String(srcId));
  rebuildStock(rows);
};
const applyStockForInvoice = (inv, user) => {
  if (!inv || !Array.isArray(inv.items)) return;
  removeStockForSource(inv.invNo);
  const products = S.get(SK.PRODUCTS, []);
  const isReturn = inv.docType === "CREDIT NOTE";
  const isOutward = inv.docType === "TAX INVOICE" || inv.docType === "NON GST INVOICE" || inv.docType === "DEBIT NOTE" || inv.isB2C;
  const lines = [];
  inv.items.forEach((row) => {
    var _a;
    const prod = findProductForLine(row.desc, products);
    if (!prod || !prod.trackStock) return;
    const qty = Number(row.qty) || 0;
    if (!qty) return;
    const change = isReturn ? qty : isOutward ? -qty : 0;
    if (!change) return;
    lines.push({
      id: uid(),
      date: inv.date || today(),
      time: inv.time || nowTime(),
      product: prod.name,
      qty: change,
      rate: Number(row.rate) || 0,
      type: change >= 0 ? "IN" : "OUT",
      refType: "INVOICE",
      ref: inv.invNo || "",
      party: ((_a = inv.billTo) == null ? void 0 : _a.name) || "",
      reason: isReturn ? "Credit note (sales return)" : "Sale \u2014 " + (inv.docType || "Invoice"),
      srcId: inv.invNo || "",
      user: (user == null ? void 0 : user.name) || "",
      balanceAfter: 0
    });
  });
  if (lines.length) rebuildStock([...stockLog(), ...lines]);
};
const applyStockForPurchase = (exp, user) => {
  if (!exp) return [];
  const srcId = "PUR-" + exp.id;
  removeStockForSource(srcId);
  let products = S.get(SK.PRODUCTS, []);
  let productsChanged = false;
  const newOrUpgraded = [];
  const when = exp.billDate || exp.date || today();
  const lines = [];
  expItems(exp).forEach((it) => {
    if (it.toStock === false) return;
    const name = it.product || it.desc;
    const qty = parseFloat(it.qty) || 0;
    if (!name || qty <= 0) return;
    let prod = products.find((p) => (p.name || "").toLowerCase() === String(name).toLowerCase());
    if (!prod) {
      prod = {
        name: String(name).trim(),
        desc: it.desc || "",
        hsnCode: it.hsnCode || "",
        unit: it.unit || "Nos",
        rate: parseFloat(it.rate) || 0,
        taxRate: it.taxRate || "18",
        category: exp.category || "",
        trackStock: true,
        openingStock: 0,
        openingRate: parseFloat(it.rate) || 0,
        reorderLevel: "",
        currentStock: 0
      };
      products = [...products, prod];
      productsChanged = true;
      newOrUpgraded.push(prod.name);
    } else if (!prod.trackStock) {
      products = products.map((p) => p === prod ? { ...p, trackStock: true } : p);
      prod = products.find((p) => (p.name || "").toLowerCase() === String(name).toLowerCase());
      productsChanged = true;
      newOrUpgraded.push(prod.name);
    }
    lines.push({
      id: uid(),
      date: when,
      time: nowTime(),
      product: prod.name,
      qty,
      rate: parseFloat(it.rate) || 0,
      type: "IN",
      refType: "PURCHASE",
      ref: exp.billNo || "",
      party: exp.vendor || "",
      reason: "Purchase",
      srcId,
      user: (user == null ? void 0 : user.name) || "",
      balanceAfter: 0
    });
  });
  if (productsChanged) S.set(SK.PRODUCTS, products);
  if (lines.length) rebuildStock([...stockLog(), ...lines]);
  return newOrUpgraded;
};
const computeFIFO = (log) => {
  const rows = sortLedger((log || stockLog()).map(normLine));
  const products = S.get(SK.PRODUCTS, []);
  const layers = {};
  const cogsByLine = {};
  products.filter((p) => p.trackStock && Number(p.openingStock) > 0).forEach((p) => {
    layers[(p.name || "").toLowerCase()] = [{
      qty: Number(p.openingStock) || 0,
      rate: Number(p.openingRate || p.rate) || 0,
      date: (p.createdAt || "").slice(0, 10) || "2000-01-01"
    }];
  });
  rows.forEach((l) => {
    const k = (l.product || "").toLowerCase();
    if (!layers[k]) layers[k] = [];
    if (l.qty > 0) {
      layers[k].push({ qty: l.qty, rate: l.rate || 0, date: l.date });
    } else {
      let need = -l.qty, cost = 0;
      while (need > 0 && layers[k].length) {
        const lay = layers[k][0];
        const take = Math.min(need, lay.qty);
        cost += take * (lay.rate || 0);
        lay.qty -= take;
        need -= take;
        if (lay.qty <= 1e-5) layers[k].shift();
      }
      if (need > 0) cost += need * (l.rate || 0);
      cogsByLine[l.id] = cost;
    }
  });
  return { layers, cogsByLine, rows };
};
const INV_AGE_BUCKETS = [
  { key: "a0", label: "0-30 Days", test: (d) => d <= 30 },
  { key: "a1", label: "31-60 Days", test: (d) => d > 30 && d <= 60 },
  { key: "a2", label: "61-90 Days", test: (d) => d > 60 && d <= 90 },
  { key: "a3", label: "91-180 Days", test: (d) => d > 90 && d <= 180 },
  { key: "a4", label: "180+ Days", test: (d) => d > 180 }
];
const daysBetween = (fromStr, toStr) => {
  if (!fromStr || !toStr) return 0;
  const a = new Date(fromStr), b = new Date(toStr);
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.floor((b - a) / 864e5);
};
const daysSince = (ds) => ds ? Math.max(0, daysBetween(ds, today())) : 0;
const rebuildStockBalances = () => rebuildStock();
const migrateInventory = () => {
  if (S.get("ip_stock_migrated", false)) return;
  const products = S.get(SK.PRODUCTS, []);
  if (Array.isArray(products) && products.length) {
    const log = stockLog().map(normLine);
    const moved = {};
    log.forEach((l) => {
      const k = (l.product || "").toLowerCase();
      moved[k] = (moved[k] || 0) + l.qty;
    });
    const fixed = products.map((p) => {
      if (!p.trackStock) return p;
      if (p.openingStock !== "" && p.openingStock !== void 0 && p.openingStock !== null) return p;
      const k = (p.name || "").toLowerCase();
      const opening = (Number(p.currentStock) || 0) - (moved[k] || 0);
      return { ...p, openingStock: Math.round(opening * 1e4) / 1e4 };
    });
    S.set(SK.PRODUCTS, fixed);
  }
  rebuildStock();
  S.set("ip_stock_migrated", true);
  console.log("\u2705 Inventory migrated to derived-balance model");
};
const buildFifoLayers = () => {
  const { layers } = computeFIFO();
  const out = {};
  S.get(SK.PRODUCTS, []).filter((p) => p.trackStock).forEach((p) => {
    const lay = (layers[(p.name || "").toLowerCase()] || []).filter((l) => l.qty > 1e-5);
    out[p.name] = { product: p, layers: lay };
  });
  return out;
};
const invPaid = (inv) => {
  if (!inv) return 0;
  const gross = Math.abs(getGrand(inv));
  if (inv.status === "Paid") return gross;
  const part = parseFloat(inv.paidAmount);
  if (!isNaN(part) && part > 0) return Math.min(gross, part);
  return 0;
};
const Dashboard = ({ onClose, onLoad, inline = false }) => {
  var _a, _b;
  const invs = S.get(SK.INV, []);
  const exps = S.get(SK.EXP, []);
  const co = S.get(SK.CO, {});
  const mn = /* @__PURE__ */ new Date();
  useEffect(() => {
    checkOverdue();
  }, []);
  const totalRev = invs.reduce((s, i) => s + getGrand(i), 0);
  const totalExp = exps.reduce((s, e) => s + (parseFloat(e.total) || 0), 0);
  const netProfit = totalRev - totalExp;
  const mInvs = invs.filter((i) => {
    const d = new Date(i.date || "");
    return d.getMonth() === mn.getMonth() && d.getFullYear() === mn.getFullYear();
  });
  const mRev = mInvs.reduce((s, i) => s + getGrand(i), 0);
  const overdueInvs = invs.filter((i) => i.status === "Overdue");
  const overdueAmt = overdueInvs.reduce((s, i) => s + getGrand(i), 0);
  const unpaidInvs = invs.filter((i) => i.status !== "Paid" && i.status !== "Draft" && i.status !== "Cancelled");
  const unpaidAmt = unpaidInvs.reduce((s, i) => s + getGrand(i), 0);
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(mn.getFullYear(), mn.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("default", { month: "short" });
    const rev = invs.filter((inv) => {
      var _a2;
      return (_a2 = inv.date) == null ? void 0 : _a2.startsWith(key);
    }).reduce((s, inv) => s + getGrand(inv), 0);
    const exp = exps.filter((e) => {
      var _a2;
      return (_a2 = e.date) == null ? void 0 : _a2.startsWith(key);
    }).reduce((s, e) => s + (parseFloat(e.total) || 0), 0);
    months.push({ key, label, rev, exp });
  }
  const maxBar = Math.max(...months.map((m) => Math.max(m.rev, m.exp)), 1);
  const statusCount = { Draft: 0, Sent: 0, Paid: 0, Overdue: 0, Other: 0 };
  invs.forEach((i) => {
    if (statusCount[i.status] !== void 0) statusCount[i.status]++;
    else statusCount.Other++;
  });
  const custMap = {};
  invs.filter((i) => getGrand(i) > 0).forEach((i) => {
    var _a2;
    const n = ((_a2 = i.billTo) == null ? void 0 : _a2.name) || "Unknown";
    if (!custMap[n]) custMap[n] = 0;
    custMap[n] += getGrand(i);
  });
  const top5 = Object.entries(custMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCust = ((_a = top5[0]) == null ? void 0 : _a[1]) || 1;
  const recent = [...invs].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 5);
  const StatCard = ({ icon, label, value, sub, color, bg }) => /* @__PURE__ */ React.createElement("div", { style: { background: bg || "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 20px", position: "relative", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 24, marginBottom: 6 } }, icon), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "Sora,sans-serif", fontSize: 20, fontWeight: 800, color: color || "var(--text)" } }, value), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 2 } }, label), sub && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: color || "var(--text3)", marginTop: 4, fontWeight: 600 } }, sub));
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay", onClick: inline ? void 0 : ((e) => e.target === e.currentTarget && onClose()) }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal", style: { ...inline ? {} : { maxWidth: "min(1100px, 95vw)", width: "100%" } } }, /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "modal-title" }, /* @__PURE__ */ React.createElement(Ic, { n: "chart", s: 20 }), " Dashboard"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", marginTop: 2 } }, "Welcome back, ", ((_b = S.get(SK.USERS, [])[0]) == null ? void 0 : _b.name) || "Admin", " \xB7 ", co.name || "Your Company")), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Ic, { n: "x" }))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, overdueInvs.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "alert", style: { background: "rgba(255,77,106,0.08)", border: "1px solid rgba(255,77,106,0.25)", color: "var(--red)", marginBottom: 16, borderRadius: 10 } }, /* @__PURE__ */ React.createElement(Ic, { n: "alert", s: 18 }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, overdueInvs.length, " overdue invoice", overdueInvs.length > 1 ? "s" : ""), " totalling ", /* @__PURE__ */ React.createElement("strong", null, fmt(overdueAmt)), " \u2014 immediate attention required.", /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger", style: { marginLeft: 12 }, onClick: () => {
    onClose();
  } }, "View"))), /* @__PURE__ */ React.createElement("div", { className: "g4", style: { marginBottom: 20 } }, /* @__PURE__ */ React.createElement(StatCard, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "dollar", s: 20 }), label: "Net Revenue", value: fmt(totalRev), sub: `${invs.length} invoices total`, color: "var(--green)", bg: "linear-gradient(135deg,rgba(15,217,138,0.06),var(--card))" }), /* @__PURE__ */ React.createElement(StatCard, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "calendar", s: 20 }), label: "This Month", value: fmt(mRev), sub: `${mInvs.length} invoices`, color: "var(--primary2)", bg: "linear-gradient(135deg,rgba(79,111,232,0.06),var(--card))" }), /* @__PURE__ */ React.createElement(StatCard, { icon: /* @__PURE__ */ React.createElement(Ic, { n: "clock", s: 20 }), label: "Outstanding", value: fmt(unpaidAmt), sub: `${unpaidInvs.length} unpaid`, color: "var(--gold)", bg: "linear-gradient(135deg,rgba(241,73,92,0.06),var(--card))" }), /* @__PURE__ */ React.createElement(StatCard, { icon: /* @__PURE__ */ React.createElement(Ic, { n: netProfit >= 0 ? "trending-up" : "trending-down", s: 20 }), label: "Net Profit", value: fmt(netProfit), sub: `Expenses: ${fmt(totalExp)}`, color: netProfit >= 0 ? "var(--green)" : "var(--red)", bg: `linear-gradient(135deg,rgba(${netProfit >= 0 ? "15,217,138" : "255,77,106"},0.06),var(--card))` })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--text)", marginBottom: 14, fontSize: 14 } }, "Revenue vs Expenses (Last 6 Months)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-end", gap: 8, height: 120 } }, months.map((m, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 } }, /* @__PURE__ */ React.createElement("div", { style: { width: "100%", display: "flex", gap: 2, alignItems: "flex-end", height: 100 } }, /* @__PURE__ */ React.createElement(
    "div",
    {
      title: `Revenue: ${fmt(m.rev)}`,
      style: { flex: 1, background: "var(--primary)", borderRadius: "4px 4px 0 0", height: `${Math.max(m.rev / maxBar * 100, 2)}%`, opacity: 0.85, cursor: "default", transition: "opacity 0.2s" },
      onMouseEnter: (e) => e.currentTarget.style.opacity = "1",
      onMouseLeave: (e) => e.currentTarget.style.opacity = "0.85"
    }
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      title: `Expenses: ${fmt(m.exp)}`,
      style: { flex: 1, background: "var(--red)", borderRadius: "4px 4px 0 0", height: `${Math.max(m.exp / maxBar * 100, 2)}%`, opacity: 0.6, cursor: "default", transition: "opacity 0.2s" },
      onMouseEnter: (e) => e.currentTarget.style.opacity = "1",
      onMouseLeave: (e) => e.currentTarget.style.opacity = "0.6"
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text3)", fontWeight: 600 } }, m.label)))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 16, marginTop: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "var(--primary)", fontWeight: 600 } }, "\u25A0 Revenue"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "var(--red)", fontWeight: 600 } }, "\u25A0 Expenses"))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--text)", marginBottom: 14, fontSize: 14 } }, /* @__PURE__ */ React.createElement(Ic, { n: "circle", s: 16 }), " Invoice Status"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, [["Paid", "var(--green)"], ["Sent", "var(--primary)"], ["Draft", "var(--text3)"], ["Overdue", "var(--red)"]].map(([st, col]) => {
    const cnt = statusCount[st] || 0;
    const pct = invs.length > 0 ? Math.round(cnt / invs.length * 100) : 0;
    return /* @__PURE__ */ React.createElement("div", { key: st, style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: col, fontWeight: 700, width: 54 } }, st), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, background: "var(--card2)", borderRadius: 99, height: 10, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { width: `${pct}%`, height: "100%", background: col, borderRadius: 99, transition: "width 0.5s ease" } })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", width: 36, textAlign: "right" } }, cnt, " (", pct, "%)"));
  })), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--card2)", borderRadius: 8, padding: "8px 12px", textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 800, color: "var(--green)" } }, statusCount.Paid), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text3)" } }, "PAID")), /* @__PURE__ */ React.createElement("div", { style: { background: "var(--card2)", borderRadius: 8, padding: "8px 12px", textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 800, color: "var(--red)" } }, statusCount.Overdue), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text3)" } }, "OVERDUE"))))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--text)", marginBottom: 12, fontSize: 14 } }, /* @__PURE__ */ React.createElement(Ic, { n: "award", s: 16 }), " Top 5 Customers by Revenue"), top5.length > 0 ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, top5.map(([name, rev], i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 20, height: 20, borderRadius: "50%", background: "var(--accent-grad)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff", flexShrink: 0 } }, i + 1), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, name), /* @__PURE__ */ React.createElement("div", { style: { width: `${rev / maxCust * 100}%`, height: 5, background: "var(--primary)", borderRadius: 99, marginTop: 3, opacity: 0.7 } })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--primary2)", flexShrink: 0 } }, fmt(rev))))) : /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: 20, color: "var(--text3)", fontSize: 12 } }, "No invoices yet")), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--text)", marginBottom: 12, fontSize: 14 } }, /* @__PURE__ */ React.createElement(Ic, { n: "clock", s: 16 }), " Recent Invoices"), recent.length > 0 ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 0 } }, recent.map((inv, i) => {
    var _a2;
    const b = docBadge(inv.docType, inv.isB2C);
    const stCols = { Paid: "var(--green)", Sent: "var(--primary)", Draft: "var(--text3)", Overdue: "var(--red)" };
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: i,
        style: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < recent.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer" },
        onClick: () => {
          onLoad(inv);
          onClose();
        }
      },
      /* @__PURE__ */ React.createElement("span", { style: { background: b.bg, color: b.color, borderRadius: 5, padding: "2px 6px", fontSize: 9, fontWeight: 700, flexShrink: 0 } }, b.label),
      /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--gold)", fontFamily: "monospace" } }, inv.invNo), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, ((_a2 = inv.billTo) == null ? void 0 : _a2.name) || "\u2014")),
      /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text)" } }, fmt(Math.abs(getGrand(inv) || 0))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: stCols[inv.status] || "var(--text3)", fontWeight: 600 } }, inv.status))
    );
  })) : /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: 20, color: "var(--text3)", fontSize: 12 } }, "No invoices yet")))), /* @__PURE__ */ React.createElement("div", { className: "modal-ftr" }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text3)" } }, "Last updated: ", (/* @__PURE__ */ new Date()).toLocaleTimeString()), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: onClose }, "Close"))));
};
const xlsxDownload = (sheets, filename, fmt2 = "xlsx", meta = {}) => {
  proExport(fmt2, {
    title: sheets[0][0],
    period: meta.period || "",
    sheets: sheets.map(([name, aoa, cols]) => ({ name, aoa, cols, h0: true }))
  }, filename);
};
const TabBar = ({ tabs, value, onChange }) => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 7, marginBottom: 16, flexWrap: "wrap" } }, tabs.map(([k, l, icon]) => /* @__PURE__ */ React.createElement(
  "button",
  {
    key: k,
    onClick: () => onChange(k),
    style: {
      padding: "7px 14px",
      borderRadius: 8,
      fontSize: 12,
      fontWeight: value === k ? 700 : 500,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 6,
      border: `2px solid ${value === k ? "var(--primary)" : "var(--border2)"}`,
      background: value === k ? "var(--primary-bg)" : "transparent",
      color: value === k ? "var(--primary2)" : "var(--text2)"
    }
  },
  icon ? /* @__PURE__ */ React.createElement(Ic, { n: icon, s: 13 }) : null,
  l
)));
const Empty = ({ text }) => /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "44px", color: "var(--text3)" } }, text);
const th = { textAlign: "left", padding: "9px 12px", fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px" };
const thR = { ...th, textAlign: "right" };
const thC = { ...th, textAlign: "center" };
const td = { padding: "9px 12px", fontSize: 12 };
const tdR = { ...td, textAlign: "right" };
const tdC = { ...td, textAlign: "center" };
const Wrap = ({ children, min }) => /* @__PURE__ */ React.createElement("div", { style: { border: "1px solid var(--border)", borderRadius: 10, overflow: "auto", maxHeight: "calc(100vh - 230px)", minHeight: 200 } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", minWidth: min || 760 } }, children));
const HeadRow = ({ children }) => /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)", borderBottom: "2px solid var(--border2)", position: "sticky", top: 0, zIndex: 2 } }, children));
const InventoryPage = ({ inline = true, onClose, currentUser, initialTab }) => {
  const [products, setProducts] = useState(() => S.get(SK.PRODUCTS, []));
  const [log, setLog] = useState(() => S.get(SK.STOCK, []));
  const [tab, setTab] = useState(initialTab || "summary");
  useEffect(() => {
    if (initialTab && initialTab !== tab) setTab(initialTab);
  }, [initialTab]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [selProduct, setSelProduct] = useState("");
  const [adjFor, setAdjFor] = useState(null);
  const [adjQty, setAdjQty] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const [expandedDoc, setExpandedDoc] = useState(null);
  const refresh = () => {
    setProducts(S.get(SK.PRODUCTS, []));
    setLog(S.get(SK.STOCK, []));
  };
  const tracked = products.filter((p) => p.trackStock);
  const inRange = (l) => (!from || (l.date || "") >= from) && (!to || (l.date || "") <= to);
  const moves = useMemo(() => [...log].filter(inRange).sort((a, b) => String((b.date || "") + (b.time || "")).localeCompare(String((a.date || "") + (a.time || "")))), [log, from, to]);
  const fifo = useMemo(() => buildFifoLayers(), [log, products]);
  const doAdjust = () => {
    const qv = parseFloat(adjQty);
    if (!adjFor || !qv) {
      toast.error("Enter a quantity (use a minus sign to reduce)");
      return;
    }
    adjustStock(adjFor, qv, adjReason || "Manual adjustment", "ADJ-" + today(), currentUser, { doc: "Adjustment" });
    rebuildStockBalances();
    refresh();
    setAdjFor(null);
    setAdjQty("");
    setAdjReason("");
    toast.success("Stock adjusted");
  };
  const rows = useMemo(() => tracked.map((p) => {
    const k = p.name.toLowerCase();
    const mine = log.filter((l) => String(l.product || "").toLowerCase() === k);
    const inP = mine.filter((l) => inRange(l) && l.qtyChange > 0);
    const outP = mine.filter((l) => inRange(l) && l.qtyChange < 0);
    const qtyIn = inP.reduce((t, l) => t + l.qtyChange, 0);
    const qtyOut = outP.reduce((t, l) => t - l.qtyChange, 0);
    const valIn = inP.reduce((t, l) => t + (Number(l.value) || 0), 0);
    const valOut = outP.reduce((t, l) => t + (Number(l.value) || 0), 0);
    const closing = Number(p.currentStock || 0);
    const after = log.filter((l) => String(l.product || "").toLowerCase() === k && to && (l.date || "") > to).reduce((t, l) => t + (Number(l.qtyChange) || 0), 0);
    const closingAt = closing - after;
    const opening = closingAt - qtyIn + qtyOut;
    const layers = fifo[p.name] && fifo[p.name].layers || [];
    const stockValue = layers.reduce((t, l) => t + l.qty * l.rate, 0);
    const avgRate = closing > 0 ? stockValue / closing : Number(p.rate) || 0;
    const lastMove = mine.length ? mine.map((l) => l.date).sort().slice(-1)[0] : "";
    return {
      p,
      opening,
      qtyIn,
      qtyOut,
      valIn,
      valOut,
      closing: closingAt,
      liveClosing: closing,
      stockValue,
      avgRate,
      lastMove,
      low: closing <= Number(p.reorderLevel || 0)
    };
  }).filter((r) => !q || r.p.name.toLowerCase().includes(q.toLowerCase())), [tracked, log, from, to, q, fifo]);
  const lowStock = rows.filter((r) => r.low);
  const totalStockValue = rows.reduce((t, r) => t + r.stockValue, 0);
  const totalUnits = rows.reduce((t, r) => t + r.liveClosing, 0);
  const byDoc = useMemo(() => {
    const m = {};
    moves.forEach((l) => {
      const key = (l.doc || "Other") + "||" + (l.ref || "\u2014");
      if (!m[key]) m[key] = {
        doc: l.doc || "Other",
        ref: l.ref || "\u2014",
        date: l.date,
        party: l.party || "",
        qtyIn: 0,
        qtyOut: 0,
        valIn: 0,
        valOut: 0,
        lines: []
      };
      const e = m[key];
      if (l.qtyChange > 0) {
        e.qtyIn += l.qtyChange;
        e.valIn += Number(l.value) || 0;
      } else {
        e.qtyOut += -l.qtyChange;
        e.valOut += Number(l.value) || 0;
      }
      if ((l.date || "") < (e.date || "zzzz")) e.date = l.date;
      if (!e.party && l.party) e.party = l.party;
      e.lines.push(l);
    });
    return Object.values(m).sort((a, b) => String(b.date).localeCompare(String(a.date))).filter((d) => !q || (d.ref + " " + d.party + " " + d.doc).toLowerCase().includes(q.toLowerCase()));
  }, [moves, q]);
  const salesDocs = byDoc.filter((d) => d.doc === "Sale" || d.doc === "Sales Return");
  const purchDocs = byDoc.filter((d) => d.doc === "Purchase" || d.doc === "Purchase Return");
  const ageRows = useMemo(() => {
    const td2 = today();
    return Object.entries(fifo).map(([name, { product, layers }]) => {
      const b = { a0: 0, a1: 0, a2: 0, a3: 0, a4: 0 }, bv = { a0: 0, a1: 0, a2: 0, a3: 0, a4: 0 };
      let oldest = null;
      layers.forEach((l) => {
        const age = l.date ? Math.max(0, daysBetween(l.date, td2)) : 0;
        const bk = INV_AGE_BUCKETS.find((x) => x.test(age)) || INV_AGE_BUCKETS[0];
        b[bk.key] += l.qty;
        bv[bk.key] += l.qty * l.rate;
        if (oldest === null || age > oldest) oldest = age;
      });
      const qty = layers.reduce((t, l) => t + l.qty, 0);
      const val = layers.reduce((t, l) => t + l.qty * l.rate, 0);
      return { name, product, layers, b, bv, qty, val, oldest: oldest || 0 };
    }).filter((r) => r.qty > 0).filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.oldest - a.oldest);
  }, [fifo, q]);
  const ageTotals = INV_AGE_BUCKETS.reduce((acc, bk) => {
    acc[bk.key] = { qty: ageRows.reduce((t, r) => t + r.b[bk.key], 0), val: ageRows.reduce((t, r) => t + r.bv[bk.key], 0) };
    return acc;
  }, {});
  const slow = rows.filter((r) => r.liveClosing > 0).map((r) => ({ ...r, idle: r.lastMove ? daysBetween(r.lastMove, today()) : 9999 })).filter((r) => r.idle >= 60).sort((a, b) => b.idle - a.idle);
  const expSummary = (fmt2 = "xlsx") => xlsxDownload(
    [[
      "Stock Summary",
      [
        ["Product", "Unit", "HSN", "Opening", "Qty In", "Qty Out", "Closing", "Avg Rate (Rs.)", "Stock Value (Rs.)", "Reorder Level", "Status"],
        ...rows.map((r) => [
          r.p.name,
          r.p.unit || "",
          r.p.hsnCode || "",
          r.opening,
          r.qtyIn,
          r.qtyOut,
          r.closing,
          r.avgRate.toFixed(2),
          r.stockValue.toFixed(2),
          r.p.reorderLevel || 0,
          r.low ? "LOW STOCK" : "OK"
        ]),
        ["TOTAL", "", "", "", "", "", "", "", totalStockValue.toFixed(2), "", ""]
      ],
      [{ wch: 30 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 12 }]
    ]],
    `Stock_Summary_${today()}.xlsx`,
    fmt2
  );
  const expLedger = (fmt2 = "xlsx") => xlsxDownload(
    [[
      "Stock Ledger",
      [
        ["Date", "Time", "Product", "Direction", "Document", "Ref No", "Party", "Qty", "Rate (Rs.)", "Value (Rs.)", "Balance", "Reason", "User"],
        ...moves.map((l) => [
          l.date,
          l.time || "",
          l.product,
          l.dir || (l.qtyChange > 0 ? "IN" : "OUT"),
          l.doc || "",
          l.ref || "",
          l.party || "",
          l.qtyChange,
          Number(l.rate || 0).toFixed(2),
          Number(l.value || 0).toFixed(2),
          l.balanceAfter,
          l.reason || "",
          l.user || ""
        ])
      ],
      [{ wch: 12 }, { wch: 9 }, { wch: 28 }, { wch: 9 }, { wch: 14 }, { wch: 16 }, { wch: 22 }, { wch: 9 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 24 }, { wch: 16 }]
    ]],
    `Stock_Ledger_${today()}.xlsx`,
    fmt2
  );
  const expAgeing = (fmt2 = "xlsx") => xlsxDownload(
    [[
      "Inventory Ageing",
      [
        [
          "Product",
          "Unit",
          "Qty on Hand",
          "Stock Value (Rs.)",
          "Oldest Stock (Days)",
          ...INV_AGE_BUCKETS.flatMap((b) => [b.label + " Qty", b.label + " Value (Rs.)"])
        ],
        ...ageRows.map((r) => [
          r.name,
          r.product.unit || "",
          r.qty,
          r.val.toFixed(2),
          r.oldest,
          ...INV_AGE_BUCKETS.flatMap((b) => [r.b[b.key], r.bv[b.key].toFixed(2)])
        ]),
        [
          "TOTAL",
          "",
          ageRows.reduce((t, r) => t + r.qty, 0),
          ageRows.reduce((t, r) => t + r.val, 0).toFixed(2),
          "",
          ...INV_AGE_BUCKETS.flatMap((b) => [ageTotals[b.key].qty, ageTotals[b.key].val.toFixed(2)])
        ]
      ]
    ]],
    `Inventory_Ageing_${today()}.xlsx`,
    fmt2
  );
  const expDocs = (list, label, fmt2 = "xlsx") => xlsxDownload(
    [
      [
        label,
        [
          ["Date", "Document Type", "Ref / Bill No", "Party", "Qty In", "Qty Out", "Net Qty", "Value In (Rs.)", "Value Out (Rs.)", "Line Items"],
          ...list.map((d) => [
            d.date,
            d.doc,
            d.ref,
            d.party,
            d.qtyIn,
            d.qtyOut,
            d.qtyIn - d.qtyOut,
            d.valIn.toFixed(2),
            d.valOut.toFixed(2),
            d.lines.length
          ])
        ],
        [{ wch: 12 }, { wch: 14 }, { wch: 20 }, { wch: 26 }, { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 14 }, { wch: 14 }, { wch: 10 }]
      ],
      [
        "Line Detail",
        [
          ["Date", "Ref", "Document", "Party", "Product", "Qty", "Rate (Rs.)", "Value (Rs.)", "Balance After"],
          ...list.flatMap((d) => d.lines.map((l) => [
            l.date,
            d.ref,
            d.doc,
            d.party,
            l.product,
            l.qtyChange,
            Number(l.rate || 0).toFixed(2),
            Number(l.value || 0).toFixed(2),
            l.balanceAfter
          ]))
        ]
      ]
    ],
    `${label.replace(/ /g, "_")}_${today()}.xlsx`,
    fmt2
  );
  const renderFilters = (showProduct) => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "flex-end" } }, /* @__PURE__ */ React.createElement("div", { style: { position: "relative", flex: 1, minWidth: 180 } }, /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", zIndex: 1 } }, /* @__PURE__ */ React.createElement(Ic, { n: "search", s: 14 })), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search...", style: { paddingLeft: 38, width: "100%" } })), showProduct && /* @__PURE__ */ React.createElement(SearchSelect, { value: selProduct, onChange: setSelProduct, style: { width: 240 }, placeholder: "\u2014 Select a product \u2014", options: [{ value: "", label: "\u2014 Select a product \u2014" }, ...tracked.map((p) => ({ value: p.name, label: p.name }))] }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text3)", marginBottom: 3 } }, "From"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: from, onChange: (e) => setFrom(e.target.value), style: { width: 150 } })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text3)", marginBottom: 3 } }, "To"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: to, onChange: (e) => setTo(e.target.value), style: { width: 150 } })), (from || to || q) && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => {
    setFrom("");
    setTo("");
    setQ("");
  } }, "Clear"));
  const TABS = [
    ["summary", "Stock Summary", "package"],
    ["ageing", "Inventory Ageing", "clock"],
    ["product", "Product-wise Movement", "chart"],
    ["purchdoc", "Bill-wise (Purchases)", "cart"],
    ["salesdoc", "Invoice-wise (Sales)", "receipt"],
    ["alldoc", "All Documents In / Out", "file"],
    ["valuation", "Valuation & Slow Moving", "dollar"],
    ["log", "Full Stock Ledger", "list"]
  ];
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay" }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal" }, !inline && /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("span", { className: "modal-title" }, /* @__PURE__ */ React.createElement(Ic, { n: "package", s: 18 }), " Inventory"), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Ic, { n: "x" }))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { className: "g4", style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16 } }, tracked.length), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Tracked Items")), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16, color: "var(--blue)" } }, totalUnits.toLocaleString("en-IN")), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Units on Hand")), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16, color: "var(--green)" } }, fmt(totalStockValue)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Stock Value (FIFO)")), /* @__PURE__ */ React.createElement("div", { className: "stat-card", style: { borderLeft: `3px solid ${lowStock.length ? "var(--red)" : "var(--green)"}` } }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16, color: lowStock.length ? "var(--red)" : "var(--green)" } }, lowStock.length), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Below Reorder Level"))), lowStock.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: 12, borderColor: "var(--red)", background: "rgba(248,81,73,0.06)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--red)", marginBottom: 5, fontSize: 13, display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement(Ic, { n: "alert", s: 13 }), " ", lowStock.length, " item", lowStock.length > 1 ? "s" : "", " at or below reorder level \u2014 time to raise a PO"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text2)" } }, lowStock.map((r) => `${r.p.name} (${r.liveClosing})`).join(" \xB7 "))), tab === "summary" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 280 } }, renderFilters()), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement(ExportMenu, { onExport: (f) => expSummary(f) }))), rows.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: 'No stock-tracked items yet. Record a purchase, or tick "Track inventory" on a product in Product Master.' }) : /* @__PURE__ */ React.createElement(Wrap, { min: 920 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Product"), /* @__PURE__ */ React.createElement("th", { style: thC }, "Unit"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Opening"), /* @__PURE__ */ React.createElement("th", { style: thR }, "In"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Out"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Closing"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Avg Rate"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Stock Value"), /* @__PURE__ */ React.createElement("th", { style: thC }, "Reorder"), /* @__PURE__ */ React.createElement("th", { style: thC }, "Adjust")), /* @__PURE__ */ React.createElement("tbody", null, rows.map((r, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 600 } }, r.p.name, r.p.autoCreated && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, color: "var(--gold)", marginLeft: 6 } }, "auto")), /* @__PURE__ */ React.createElement("td", { style: { ...tdC, color: "var(--text3)" } }, r.p.unit || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: tdR }, r.opening), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--green)", fontWeight: 600 } }, r.qtyIn ? "+" + r.qtyIn : "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--red)", fontWeight: 600 } }, r.qtyOut ? "-" + r.qtyOut : "\u2014"), /* @__PURE__ */ React.createElement("td", { style: tdR }, /* @__PURE__ */ React.createElement("span", { className: `badge ${r.low ? "badge-red" : "badge-green"}` }, r.closing)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--text2)" } }, fmt(r.avgRate)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700 } }, fmt(r.stockValue)), /* @__PURE__ */ React.createElement("td", { style: { ...tdC, color: "var(--text3)" } }, r.p.reorderLevel || 0), /* @__PURE__ */ React.createElement("td", { style: tdC }, adjFor === r.p.name ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, justifyContent: "center" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      className: "field-input",
      style: { width: 64, padding: "4px 6px" },
      value: adjQty,
      onChange: (e) => setAdjQty(e.target.value),
      placeholder: "\xB1qty"
    }
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "field-input",
      style: { width: 96, padding: "4px 6px" },
      value: adjReason,
      onChange: (e) => setAdjReason(e.target.value),
      placeholder: "reason"
    }
  ), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-primary", onClick: doAdjust }, "OK")) : /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => setAdjFor(r.p.name) }, "Adjust"))))), /* @__PURE__ */ React.createElement("tfoot", null, /* @__PURE__ */ React.createElement("tr", { style: { borderTop: "2px solid var(--border2)", fontWeight: 700, background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("td", { style: td, colSpan: 3 }, "Total"), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--green)" } }, "+", rows.reduce((t, r) => t + r.qtyIn, 0)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--red)" } }, "-", rows.reduce((t, r) => t + r.qtyOut, 0)), /* @__PURE__ */ React.createElement("td", { style: tdR }, rows.reduce((t, r) => t + r.closing, 0)), /* @__PURE__ */ React.createElement("td", { style: tdR }), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--primary2)" } }, fmt(totalStockValue)), /* @__PURE__ */ React.createElement("td", { colSpan: 2 }))))), tab === "ageing" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text2)", flex: 1, minWidth: 260 } }, "How long the stock you are still holding has been sitting there. Calculated FIFO \u2014 the oldest purchase layer is treated as the first one sold, so what remains is genuinely your slowest stock."), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(ExportMenu, { onExport: (f) => expAgeing(f) }))), /* @__PURE__ */ React.createElement("div", { className: "g4", style: { marginBottom: 12, gridTemplateColumns: "repeat(5,1fr)" } }, INV_AGE_BUCKETS.map((b, i) => /* @__PURE__ */ React.createElement("div", { key: b.key, className: "stat-card", style: { borderLeft: `3px solid ${["var(--green)", "var(--blue)", "var(--gold)", "#FB923C", "var(--red)"][i]}` } }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 15 } }, fmt(ageTotals[b.key].val)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, b.label, " \xB7 ", ageTotals[b.key].qty, " units")))), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search product...", style: { marginBottom: 12, maxWidth: 280 } }), ageRows.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "Nothing in stock to age right now." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 980 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Product"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Qty on Hand"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Value"), INV_AGE_BUCKETS.map((b) => /* @__PURE__ */ React.createElement("th", { key: b.key, style: thR }, b.label)), /* @__PURE__ */ React.createElement("th", { style: thC }, "Oldest")), /* @__PURE__ */ React.createElement("tbody", null, ageRows.map((r, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 600 } }, r.name), /* @__PURE__ */ React.createElement("td", { style: tdR }, r.qty), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700 } }, fmt(r.val)), INV_AGE_BUCKETS.map((b, bi) => /* @__PURE__ */ React.createElement("td", { key: b.key, style: { ...tdR, color: r.b[b.key] > 0 ? bi >= 3 ? "var(--red)" : "var(--text)" : "var(--text3)" } }, r.b[b.key] > 0 ? /* @__PURE__ */ React.createElement(React.Fragment, null, r.b[b.key], /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text3)" } }, fmt(r.bv[b.key]))) : "\u2014")), /* @__PURE__ */ React.createElement("td", { style: { ...tdC, fontWeight: 700, color: r.oldest > 180 ? "var(--red)" : r.oldest > 90 ? "var(--gold)" : "var(--text2)" } }, r.oldest, "d")))), /* @__PURE__ */ React.createElement("tfoot", null, /* @__PURE__ */ React.createElement("tr", { style: { borderTop: "2px solid var(--border2)", fontWeight: 700, background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, "Grand Total"), /* @__PURE__ */ React.createElement("td", { style: tdR }, ageRows.reduce((t, r) => t + r.qty, 0)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--primary2)" } }, fmt(ageRows.reduce((t, r) => t + r.val, 0))), INV_AGE_BUCKETS.map((b) => /* @__PURE__ */ React.createElement("td", { key: b.key, style: tdR }, ageTotals[b.key].qty, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, fontWeight: 400, color: "var(--text3)" } }, fmt(ageTotals[b.key].val)))), /* @__PURE__ */ React.createElement("td", null))))), tab === "product" && /* @__PURE__ */ React.createElement(React.Fragment, null, renderFilters(true), !selProduct ? /* @__PURE__ */ React.createElement(Empty, { text: "Pick a product above to see every movement in and out, with a running balance." }) : (() => {
    const lines = [...log].filter((l) => String(l.product || "").toLowerCase() === selProduct.toLowerCase() && inRange(l)).sort((a, b) => String((a.date || "") + (a.time || "")).localeCompare(String((b.date || "") + (b.time || ""))));
    const tin = lines.filter((l) => l.qtyChange > 0).reduce((t, l) => t + l.qtyChange, 0);
    const tout = lines.filter((l) => l.qtyChange < 0).reduce((t, l) => t - l.qtyChange, 0);
    const prod = tracked.find((p) => p.name === selProduct);
    const lay = fifo[selProduct] && fifo[selProduct].layers || [];
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "g4", style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16, color: "var(--green)" } }, "+", tin), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Total In")), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16, color: "var(--red)" } }, "-", tout), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Total Out")), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16 } }, prod ? prod.currentStock || 0 : 0), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Stock on Hand")), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16, color: "var(--primary2)" } }, fmt(lay.reduce((t, l) => t + l.qty * l.rate, 0))), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Current Value"))), lines.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "No movements for this product in the selected period." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 900 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Date"), /* @__PURE__ */ React.createElement("th", { style: thC }, "Type"), /* @__PURE__ */ React.createElement("th", { style: th }, "Document"), /* @__PURE__ */ React.createElement("th", { style: th }, "Ref No"), /* @__PURE__ */ React.createElement("th", { style: th }, "Party"), /* @__PURE__ */ React.createElement("th", { style: thR }, "In"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Out"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Rate"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Value"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Balance")), /* @__PURE__ */ React.createElement("tbody", null, lines.map((l, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, color: "var(--text2)" } }, fmtDate(l.date)), /* @__PURE__ */ React.createElement("td", { style: tdC }, /* @__PURE__ */ React.createElement("span", { className: `badge ${l.qtyChange > 0 ? "badge-green" : "badge-red"}` }, l.qtyChange > 0 ? "IN" : "OUT")), /* @__PURE__ */ React.createElement("td", { style: td }, l.doc || l.reason), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontFamily: "monospace", color: "var(--text2)" } }, l.ref || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { ...td, color: "var(--text2)" } }, l.party || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--green)", fontWeight: 600 } }, l.qtyChange > 0 ? l.qtyChange : "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--red)", fontWeight: 600 } }, l.qtyChange < 0 ? -l.qtyChange : "\u2014"), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(l.rate)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(l.value)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700 } }, l.balanceAfter))))), lay.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, margin: "16px 0 8px", display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement(Ic, { n: "clock", s: 13 }), " Stock still on hand, by purchase layer (FIFO)"), /* @__PURE__ */ React.createElement(Wrap, { min: 620 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Received On"), /* @__PURE__ */ React.createElement("th", { style: th }, "From Bill"), /* @__PURE__ */ React.createElement("th", { style: th }, "Vendor"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Qty Left"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Rate"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Value"), /* @__PURE__ */ React.createElement("th", { style: thC }, "Age")), /* @__PURE__ */ React.createElement("tbody", null, lay.map((l, i) => {
      const age = l.date ? Math.max(0, daysBetween(l.date, today())) : 0;
      return /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, fmtDate(l.date) || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontFamily: "monospace", color: "var(--text2)" } }, l.ref || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { ...td, color: "var(--text2)" } }, l.party || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700 } }, l.qty), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(l.rate)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700 } }, fmt(l.qty * l.rate)), /* @__PURE__ */ React.createElement("td", { style: { ...tdC, color: age > 180 ? "var(--red)" : age > 90 ? "var(--gold)" : "var(--text2)", fontWeight: 700 } }, age, "d"));
    })))));
  })()), (tab === "purchdoc" || tab === "salesdoc" || tab === "alldoc") && (() => {
    const list = tab === "purchdoc" ? purchDocs : tab === "salesdoc" ? salesDocs : byDoc;
    const label = tab === "purchdoc" ? "Bill-wise Inventory In" : tab === "salesdoc" ? "Invoice-wise Inventory Out" : "Document-wise Inventory Movement";
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 280 } }, renderFilters()), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement(ExportMenu, { onExport: (f) => expDocs(list, label, f) }))), list.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "No inventory movements found for this view." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 900 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Date"), /* @__PURE__ */ React.createElement("th", { style: thC }, "Type"), /* @__PURE__ */ React.createElement("th", { style: th }, "Ref / Bill No"), /* @__PURE__ */ React.createElement("th", { style: th }, "Party"), /* @__PURE__ */ React.createElement("th", { style: thC }, "Lines"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Qty In"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Qty Out"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Value In"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Value Out")), /* @__PURE__ */ React.createElement("tbody", null, list.map((d, i) => {
      const key = d.doc + d.ref;
      const open = expandedDoc === key;
      return /* @__PURE__ */ React.createElement(React.Fragment, { key: i }, /* @__PURE__ */ React.createElement("tr", { style: { borderBottom: "1px solid var(--border)", cursor: "pointer" }, onClick: () => setExpandedDoc(open ? null : key) }, /* @__PURE__ */ React.createElement("td", { style: { ...td, color: "var(--text2)" } }, fmtDate(d.date)), /* @__PURE__ */ React.createElement("td", { style: tdC }, /* @__PURE__ */ React.createElement("span", { className: "badge", style: {
        background: d.qtyIn >= d.qtyOut ? "rgba(63,185,80,0.12)" : "rgba(248,81,73,0.12)",
        color: d.qtyIn >= d.qtyOut ? "var(--green)" : "var(--red)"
      } }, d.doc)), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontFamily: "monospace", fontWeight: 600 } }, d.ref), /* @__PURE__ */ React.createElement("td", { style: { ...td, color: "var(--text2)" } }, d.party || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { ...tdC, color: "var(--text3)" } }, d.lines.length), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--green)", fontWeight: 700 } }, d.qtyIn ? "+" + d.qtyIn : "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--red)", fontWeight: 700 } }, d.qtyOut ? "-" + d.qtyOut : "\u2014"), /* @__PURE__ */ React.createElement("td", { style: tdR }, d.valIn ? fmt(d.valIn) : "\u2014"), /* @__PURE__ */ React.createElement("td", { style: tdR }, d.valOut ? fmt(d.valOut) : "\u2014")), open && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 9, style: { padding: 0, background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { style: th }, "Product"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Qty"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Rate"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Value"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Balance After"), /* @__PURE__ */ React.createElement("th", { style: th }, "Reason"))), /* @__PURE__ */ React.createElement("tbody", null, d.lines.map((l, k) => /* @__PURE__ */ React.createElement("tr", { key: k, style: { borderTop: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 600 } }, l.product), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: l.qtyChange > 0 ? "var(--green)" : "var(--red)", fontWeight: 700 } }, l.qtyChange > 0 ? "+" : "", l.qtyChange), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(l.rate)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(l.value)), /* @__PURE__ */ React.createElement("td", { style: tdR }, l.balanceAfter), /* @__PURE__ */ React.createElement("td", { style: { ...td, color: "var(--text3)" } }, l.reason || "\u2014"))))))));
    })), /* @__PURE__ */ React.createElement("tfoot", null, /* @__PURE__ */ React.createElement("tr", { style: { borderTop: "2px solid var(--border2)", fontWeight: 700, background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("td", { style: td, colSpan: 5 }, "Total \u2014 ", list.length, " document(s)"), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--green)" } }, "+", list.reduce((t, d) => t + d.qtyIn, 0)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--red)" } }, "-", list.reduce((t, d) => t + d.qtyOut, 0)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(list.reduce((t, d) => t + d.valIn, 0))), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(list.reduce((t, d) => t + d.valOut, 0)))))));
  })(), tab === "valuation" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text2)", flex: 1, minWidth: 260 } }, "Closing stock valued at FIFO cost, plus anything that has not moved in 60 days or more \u2014 money sitting on a shelf."), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(ExportMenu, { onExport: (f) => expSummary(f) }))), /* @__PURE__ */ React.createElement(Wrap, { min: 720 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Product"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Qty"), /* @__PURE__ */ React.createElement("th", { style: thR }, "FIFO Value"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Avg Cost"), /* @__PURE__ */ React.createElement("th", { style: thR }, "% of Stock Value")), /* @__PURE__ */ React.createElement("tbody", null, rows.filter((r) => r.liveClosing > 0).sort((a, b) => b.stockValue - a.stockValue).map((r, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 600 } }, r.p.name), /* @__PURE__ */ React.createElement("td", { style: tdR }, r.liveClosing), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700 } }, fmt(r.stockValue)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--text2)" } }, fmt(r.avgRate)), /* @__PURE__ */ React.createElement("td", { style: tdR }, totalStockValue ? (r.stockValue / totalStockValue * 100).toFixed(1) : "0.0", "%")))), /* @__PURE__ */ React.createElement("tfoot", null, /* @__PURE__ */ React.createElement("tr", { style: { borderTop: "2px solid var(--border2)", fontWeight: 700, background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, "Total Stock Value"), /* @__PURE__ */ React.createElement("td", { style: tdR }, totalUnits), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--primary2)" } }, fmt(totalStockValue)), /* @__PURE__ */ React.createElement("td", { colSpan: 2 })))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, margin: "18px 0 8px", display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement(Ic, { n: "alert", s: 13 }), " Slow & non-moving stock (no movement in 60+ days)"), slow.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "Nothing is sitting idle \u2014 every item has moved in the last 60 days." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 620 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Product"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Qty Idle"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Value Locked"), /* @__PURE__ */ React.createElement("th", { style: th }, "Last Movement"), /* @__PURE__ */ React.createElement("th", { style: thC }, "Days Idle")), /* @__PURE__ */ React.createElement("tbody", null, slow.map((r, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 600 } }, r.p.name), /* @__PURE__ */ React.createElement("td", { style: tdR }, r.liveClosing), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700, color: "var(--red)" } }, fmt(r.stockValue)), /* @__PURE__ */ React.createElement("td", { style: { ...td, color: "var(--text2)" } }, r.lastMove ? fmtDate(r.lastMove) : "Never moved"), /* @__PURE__ */ React.createElement("td", { style: { ...tdC, fontWeight: 700, color: "var(--red)" } }, r.idle > 9e3 ? "\u2014" : r.idle + "d")))))), tab === "log" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 280 } }, renderFilters()), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement(ExportMenu, { onExport: (f) => expLedger(f) }))), moves.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "No stock movements recorded yet." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 1e3 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Date"), /* @__PURE__ */ React.createElement("th", { style: thC }, "In/Out"), /* @__PURE__ */ React.createElement("th", { style: th }, "Product"), /* @__PURE__ */ React.createElement("th", { style: th }, "Document"), /* @__PURE__ */ React.createElement("th", { style: th }, "Ref No"), /* @__PURE__ */ React.createElement("th", { style: th }, "Party"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Qty"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Rate"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Value"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Balance"), /* @__PURE__ */ React.createElement("th", { style: th }, "By")), /* @__PURE__ */ React.createElement("tbody", null, moves.filter((l) => !q || (l.product + " " + (l.ref || "") + " " + (l.party || "") + " " + (l.doc || "")).toLowerCase().includes(q.toLowerCase())).map((l, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, color: "var(--text2)" } }, fmtDate(l.date), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text3)" } }, l.time || "")), /* @__PURE__ */ React.createElement("td", { style: tdC }, /* @__PURE__ */ React.createElement("span", { className: `badge ${l.qtyChange > 0 ? "badge-green" : "badge-red"}` }, l.qtyChange > 0 ? "IN" : "OUT")), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 600 } }, l.product), /* @__PURE__ */ React.createElement("td", { style: { ...td, color: "var(--text2)" } }, l.doc || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontFamily: "monospace", color: "var(--text2)" } }, l.ref || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { ...td, color: "var(--text2)" } }, l.party || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700, color: l.qtyChange < 0 ? "var(--red)" : "var(--green)" } }, l.qtyChange > 0 ? "+" : "", l.qtyChange), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(l.rate)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(l.value)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 600 } }, l.balanceAfter), /* @__PURE__ */ React.createElement("td", { style: { ...td, color: "var(--text3)", fontSize: 11 } }, l.user || "\u2014")))))))));
};
const AGING_BUCKETS = [
  { key: "current", label: "Not Yet Due", test: (d) => d <= 0 },
  { key: "b1", label: "1-30 Days", test: (d) => d > 0 && d <= 30 },
  { key: "b2", label: "31-60 Days", test: (d) => d > 30 && d <= 60 },
  { key: "b3", label: "61-90 Days", test: (d) => d > 60 && d <= 90 },
  { key: "b4", label: "90+ Days", test: (d) => d > 90 }
];
const emptyBuckets = () => AGING_BUCKETS.reduce((a, b) => {
  a[b.key] = 0;
  return a;
}, {});
const bucketFor = (d) => (AGING_BUCKETS.find((b) => b.test(d)) || AGING_BUCKETS[0]).key;
const AgingReportPage = ({ inline = true, onClose, initialTab }) => {
  const [tab, setTab] = useState(initialTab || "ar");
  useEffect(() => {
    if (initialTab && initialTab !== tab) {
      setTab(initialTab);
      setExpandedParty(null);
    }
  }, [initialTab]);
  const [q, setQ] = useState("");
  const [asOn, setAsOn] = useState(today());
  const [expandedParty, setExpandedParty] = useState(null);
  const invs = S.get(SK.INV, []);
  const exps = S.get(SK.EXP, []);
  const arBills = useMemo(() => invs.filter((i) => (i.docType === "TAX INVOICE" || i.docType === "NON GST INVOICE" || i.docType === "DEBIT NOTE") && i.status !== "Draft").map((inv) => {
    const gross = Math.abs(getGrand(inv));
    const paid = invPaid(inv);
    const due = Math.max(0, gross - paid);
    const dueDate = inv.dueDate || inv.date;
    const daysOverdue = daysBetween(dueDate, asOn);
    return {
      id: inv.invNo,
      party: inv.billTo && inv.billTo.name || "Unknown Customer",
      gstin: inv.billTo && inv.billTo.gstin || "",
      docNo: inv.invNo,
      date: inv.date,
      dueDate,
      gross,
      paid,
      due,
      daysOverdue,
      bucket: bucketFor(daysOverdue),
      status: inv.status || "",
      docType: inv.docType
    };
  }).filter((b) => b.due > 0.01).concat(creditNoteAgingRows(asOn)), [invs, asOn, S.get(SK.BANK, []), S.get(SK.ADV_APPS, [])]);
  const apBills = useMemo(() => exps.map((e) => {
    const gross = Number(e.total) || 0;
    const paid = expPaid(e);
    const due = Math.max(0, gross - paid);
    const dueDate = expDueDate(e);
    const daysOverdue = daysBetween(dueDate, asOn);
    return {
      id: e.id,
      party: e.vendor || "Unknown Vendor",
      gstin: e.vendorGSTIN || "",
      docNo: e.billNo || "\u2014",
      date: e.billDate || e.date,
      dueDate,
      gross,
      paid,
      due,
      daysOverdue,
      bucket: bucketFor(daysOverdue),
      status: e.payStatus || "",
      docType: "PURCHASE BILL"
    };
  }).filter((b) => b.due > 0.01), [exps, asOn]);
  const bills = tab === "ap" || tab === "apbill" ? apBills : arBills;
  const isAP = tab === "ap" || tab === "apbill";
  const filteredBills = bills.filter((b) => !q || (b.party + " " + b.docNo + " " + b.gstin).toLowerCase().includes(q.toLowerCase()));
  const byParty = useMemo(() => {
    const m = {};
    filteredBills.forEach((b) => {
      if (!m[b.party]) m[b.party] = { party: b.party, gstin: b.gstin, ...emptyBuckets(), total: 0, bills: [] };
      m[b.party][b.bucket] += b.due;
      m[b.party].total += b.due;
      m[b.party].bills.push(b);
    });
    return Object.values(m).sort((a, b) => b.total - a.total);
  }, [filteredBills]);
  const totals = AGING_BUCKETS.reduce((acc, bk) => {
    acc[bk.key] = byParty.reduce((t, p) => t + p[bk.key], 0);
    return acc;
  }, {});
  const grandTotal = byParty.reduce((t, p) => t + p.total, 0);
  const overdueTotal = filteredBills.filter((b) => b.daysOverdue > 0).reduce((t, b) => t + b.due, 0);
  const arTotal = arBills.reduce((t, b) => t + b.due, 0);
  const apTotal = apBills.reduce((t, b) => t + b.due, 0);
  const arOver = arBills.filter((b) => b.daysOverdue > 0).reduce((t, b) => t + b.due, 0);
  const apOver = apBills.filter((b) => b.daysOverdue > 0).reduce((t, b) => t + b.due, 0);
  const arBuckets = arBills.reduce((a, b) => {
    a[b.bucket] += b.due;
    return a;
  }, emptyBuckets());
  const apBuckets = apBills.reduce((a, b) => {
    a[b.bucket] += b.due;
    return a;
  }, emptyBuckets());
  const exportParty = (fmt2 = "xlsx") => xlsxDownload(
    [
      [
        isAP ? "Payables by Vendor" : "Receivables by Customer",
        [
          [isAP ? "Vendor" : "Customer", "GSTIN", ...AGING_BUCKETS.map((b) => b.label), "Total Outstanding (Rs.)", "Open Bills"],
          ...byParty.map((p) => [p.party, p.gstin, ...AGING_BUCKETS.map((b) => p[b.key].toFixed(2)), p.total.toFixed(2), p.bills.length]),
          ["GRAND TOTAL", "", ...AGING_BUCKETS.map((b) => totals[b.key].toFixed(2)), grandTotal.toFixed(2), filteredBills.length]
        ],
        [{ wch: 30 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 11 }]
      ],
      [
        "Bill Detail",
        [
          ["Date", isAP ? "Vendor" : "Customer", "Document Type", "Bill / Invoice No", "Due Date", "Gross (Rs.)", "Received/Paid (Rs.)", "Outstanding (Rs.)", "Days Overdue", "Bucket"],
          ...filteredBills.sort((a, b) => b.daysOverdue - a.daysOverdue).map((b) => [
            b.date,
            b.party,
            b.docType,
            b.docNo,
            b.dueDate,
            b.gross.toFixed(2),
            b.paid.toFixed(2),
            b.due.toFixed(2),
            b.daysOverdue,
            (AGING_BUCKETS.find((x) => x.key === b.bucket) || {}).label || ""
          ])
        ]
      ]
    ],
    `${isAP ? "Trade_Payables" : "Trade_Receivables"}_${asOn}.xlsx`,
    fmt2,
    { period: "Ageing as on " + fmtDate(asOn) }
  );
  const exportSummary = (fmt2 = "xlsx") => xlsxDownload(
    [[
      "Aging Summary",
      [
        ["Bucket", "Trade Receivables (Rs.)", "Trade Payables (Rs.)", "Net Position (Rs.)"],
        ...AGING_BUCKETS.map((b) => [b.label, arBuckets[b.key].toFixed(2), apBuckets[b.key].toFixed(2), (arBuckets[b.key] - apBuckets[b.key]).toFixed(2)]),
        ["TOTAL", arTotal.toFixed(2), apTotal.toFixed(2), (arTotal - apTotal).toFixed(2)],
        ["Of which overdue", arOver.toFixed(2), apOver.toFixed(2), (arOver - apOver).toFixed(2)]
      ],
      [{ wch: 18 }, { wch: 24 }, { wch: 22 }, { wch: 20 }]
    ]],
    `Aging_Summary_${asOn}.xlsx`,
    fmt2,
    { period: "Ageing as on " + fmtDate(asOn) }
  );
  const bucketColor = (k, v) => v <= 0 ? "var(--text3)" : k === "b3" || k === "b4" ? "var(--red)" : k === "b2" ? "var(--gold)" : "var(--text)";
  const TABS = [
    ["summary", "Summary", "chart"],
    ["ar", "Trade Receivables", "users"],
    ["arbill", "Receivables \u2014 Bill-wise", "receipt"],
    ["ap", "Trade Payables", "cart"],
    ["apbill", "Payables \u2014 Bill-wise", "file"]
  ];
  const partyTable = () => byParty.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: isAP ? "Nothing outstanding to vendors \u2014 all bills settled." : "No outstanding invoices \u2014 everything's paid up." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 900 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, isAP ? "Vendor" : "Customer"), AGING_BUCKETS.map((b) => /* @__PURE__ */ React.createElement("th", { key: b.key, style: thR }, b.label)), /* @__PURE__ */ React.createElement("th", { style: thR }, "Total Outstanding"), /* @__PURE__ */ React.createElement("th", { style: thC }, "Bills")), /* @__PURE__ */ React.createElement("tbody", null, byParty.map((p, i) => {
    const open = expandedParty === p.party;
    return /* @__PURE__ */ React.createElement(React.Fragment, { key: i }, /* @__PURE__ */ React.createElement("tr", { style: { borderBottom: "1px solid var(--border)", cursor: "pointer" }, onClick: () => setExpandedParty(open ? null : p.party) }, /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 600 } }, p.party, p.gstin && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text3)", fontFamily: "monospace" } }, p.gstin)), AGING_BUCKETS.map((b) => /* @__PURE__ */ React.createElement("td", { key: b.key, style: { ...tdR, color: bucketColor(b.key, p[b.key]) } }, Math.abs(p[b.key]) > 4e-3 ? fmt(p[b.key]) : "\u2014")), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700, color: "var(--primary2)" } }, fmt(p.total)), /* @__PURE__ */ React.createElement("td", { style: { ...tdC, color: "var(--text3)" } }, p.bills.length)), open && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: AGING_BUCKETS.length + 3, style: { padding: 0, background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { style: th }, "Date"), /* @__PURE__ */ React.createElement("th", { style: th }, isAP ? "Bill No" : "Invoice No"), /* @__PURE__ */ React.createElement("th", { style: th }, "Due Date"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Gross"), /* @__PURE__ */ React.createElement("th", { style: thR }, isAP ? "Paid" : "Received"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Outstanding"), /* @__PURE__ */ React.createElement("th", { style: thC }, "Overdue By"))), /* @__PURE__ */ React.createElement("tbody", null, p.bills.sort((a, b) => b.daysOverdue - a.daysOverdue).map((b, k) => /* @__PURE__ */ React.createElement("tr", { key: k, style: { borderTop: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, color: "var(--text2)" } }, fmtDate(b.date)), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontFamily: "monospace", fontWeight: 600 } }, b.docNo), /* @__PURE__ */ React.createElement("td", { style: { ...td, color: "var(--text2)" } }, fmtDate(b.dueDate) || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(b.gross)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--green)" } }, b.paid > 0 ? fmt(b.paid) : "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700 } }, fmt(b.due)), /* @__PURE__ */ React.createElement("td", { style: { ...tdC, fontWeight: 700, color: b.daysOverdue > 90 ? "var(--red)" : b.daysOverdue > 0 ? "var(--gold)" : "var(--green)" } }, b.daysOverdue > 0 ? b.daysOverdue + "d" : "Not due"))))))));
  })), /* @__PURE__ */ React.createElement("tfoot", null, /* @__PURE__ */ React.createElement("tr", { style: { borderTop: "2px solid var(--border2)", fontWeight: 700, background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, "Grand Total"), AGING_BUCKETS.map((b) => /* @__PURE__ */ React.createElement("td", { key: b.key, style: tdR }, fmt(totals[b.key]))), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--primary2)" } }, fmt(grandTotal)), /* @__PURE__ */ React.createElement("td", { style: tdC }, filteredBills.length))));
  const billTable = () => {
    const list = [...filteredBills].sort((a, b) => b.daysOverdue - a.daysOverdue);
    return list.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "Nothing outstanding in this view." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 960 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Date"), /* @__PURE__ */ React.createElement("th", { style: th }, isAP ? "Bill No" : "Invoice No"), /* @__PURE__ */ React.createElement("th", { style: th }, isAP ? "Vendor" : "Customer"), /* @__PURE__ */ React.createElement("th", { style: th }, "Due Date"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Gross"), /* @__PURE__ */ React.createElement("th", { style: thR }, isAP ? "Paid" : "Received"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Outstanding"), /* @__PURE__ */ React.createElement("th", { style: thC }, "Overdue By"), /* @__PURE__ */ React.createElement("th", { style: thC }, "Bucket")), /* @__PURE__ */ React.createElement("tbody", null, list.map((b, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, color: "var(--text2)" } }, fmtDate(b.date)), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontFamily: "monospace", fontWeight: 600 } }, b.docNo), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 600 } }, b.party), /* @__PURE__ */ React.createElement("td", { style: { ...td, color: "var(--text2)" } }, fmtDate(b.dueDate) || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(b.gross)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--green)" } }, b.paid > 0 ? fmt(b.paid) : "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700, color: "var(--primary2)" } }, fmt(b.due)), /* @__PURE__ */ React.createElement("td", { style: { ...tdC, fontWeight: 700, color: b.daysOverdue > 90 ? "var(--red)" : b.daysOverdue > 0 ? "var(--gold)" : "var(--green)" } }, b.daysOverdue > 0 ? b.daysOverdue + "d" : "Not due"), /* @__PURE__ */ React.createElement("td", { style: tdC }, /* @__PURE__ */ React.createElement("span", { className: "badge", style: {
      background: b.bucket === "b4" || b.bucket === "b3" ? "rgba(248,81,73,0.12)" : b.bucket === "current" ? "rgba(63,185,80,0.12)" : "rgba(241,73,92,0.12)",
      color: b.bucket === "b4" || b.bucket === "b3" ? "var(--red)" : b.bucket === "current" ? "var(--green)" : "var(--gold)"
    } }, (AGING_BUCKETS.find((x) => x.key === b.bucket) || {}).label))))), /* @__PURE__ */ React.createElement("tfoot", null, /* @__PURE__ */ React.createElement("tr", { style: { borderTop: "2px solid var(--border2)", fontWeight: 700, background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("td", { style: td, colSpan: 6 }, "Total \u2014 ", list.length, " open bill(s)"), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--primary2)" } }, fmt(grandTotal)), /* @__PURE__ */ React.createElement("td", { colSpan: 2 }))));
  };
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay" }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal" }, !inline && /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("span", { className: "modal-title" }, /* @__PURE__ */ React.createElement(Ic, { n: "clock", s: 18 }), " Ageing"), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Ic, { n: "x" }))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { className: "g4", style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "stat-card", style: { borderLeft: "3px solid var(--green)" } }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16, color: "var(--green)" } }, fmt(arTotal)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Trade Receivables")), /* @__PURE__ */ React.createElement("div", { className: "stat-card", style: { borderLeft: "3px solid var(--red)" } }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16, color: "var(--red)" } }, fmt(apTotal)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Trade Payables")), /* @__PURE__ */ React.createElement("div", { className: "stat-card", style: { borderLeft: `3px solid ${arTotal - apTotal >= 0 ? "var(--blue)" : "var(--gold)"}` } }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16, color: arTotal - apTotal >= 0 ? "var(--blue)" : "var(--gold)" } }, fmt(arTotal - apTotal)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Net Working Position")), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16, color: "var(--gold)" } }, fmt(arOver)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Receivables Past Due"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "flex-end" } }, tab !== "summary" && /* @__PURE__ */ React.createElement("div", { style: { position: "relative", flex: 1, minWidth: 200 } }, /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", zIndex: 1 } }, /* @__PURE__ */ React.createElement(Ic, { n: "search", s: 14 })), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "field-input",
      value: q,
      onChange: (e) => setQ(e.target.value),
      placeholder: isAP ? "Search vendor, bill no, GSTIN..." : "Search customer, invoice no, GSTIN...",
      style: { paddingLeft: 38, width: "100%" }
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text3)", marginBottom: 3 } }, "Ageing as on"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: asOn, onChange: (e) => setAsOn(e.target.value), style: { width: 160 } })), /* @__PURE__ */ React.createElement(ExportMenu, { onExport: (f) => tab === "summary" ? exportSummary(f) : exportParty(f) })), tab === "summary" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text2)", marginBottom: 12 } }, "Both sides of the ledger side by side. A positive net position means more is owed to you than by you."), /* @__PURE__ */ React.createElement(Wrap, { min: 700 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Ageing Bucket"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Trade Receivables"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Trade Payables"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Net")), /* @__PURE__ */ React.createElement("tbody", null, AGING_BUCKETS.map((b) => {
    const net = arBuckets[b.key] - apBuckets[b.key];
    return /* @__PURE__ */ React.createElement("tr", { key: b.key, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 600 } }, b.label), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: Math.abs(arBuckets[b.key]) > 4e-3 ? "var(--green)" : "var(--text3)" } }, Math.abs(arBuckets[b.key]) > 4e-3 ? fmt(arBuckets[b.key]) : "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: apBuckets[b.key] > 0 ? "var(--red)" : "var(--text3)" } }, apBuckets[b.key] > 0 ? fmt(apBuckets[b.key]) : "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700, color: net >= 0 ? "var(--blue)" : "var(--gold)" } }, fmt(net)));
  })), /* @__PURE__ */ React.createElement("tfoot", null, /* @__PURE__ */ React.createElement("tr", { style: { borderTop: "2px solid var(--border2)", fontWeight: 700, background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, "Total Outstanding"), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--green)" } }, fmt(arTotal)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--red)" } }, fmt(apTotal)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--primary2)" } }, fmt(arTotal - apTotal))), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 600, background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, color: "var(--text2)" } }, "Of which past due"), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--gold)" } }, fmt(arOver)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, color: "var(--gold)" } }, fmt(apOver)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(arOver - apOver))))), /* @__PURE__ */ React.createElement("div", { className: "g2", style: { marginTop: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, marginBottom: 8, color: "var(--green)" } }, "Top 5 customers owing you"), arBills.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text3)" } }, "Nothing outstanding.") : Object.entries(arBills.reduce((m, b) => {
    m[b.party] = (m[b.party] || 0) + b.due;
    return m;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, v], i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
    borderBottom: "1px solid var(--border)",
    fontSize: 12
  } }, /* @__PURE__ */ React.createElement("span", null, n), /* @__PURE__ */ React.createElement("strong", null, fmt(v))))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, marginBottom: 8, color: "var(--red)" } }, "Top 5 vendors you owe"), apBills.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text3)" } }, "Nothing outstanding.") : Object.entries(apBills.reduce((m, b) => {
    m[b.party] = (m[b.party] || 0) + b.due;
    return m;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, v], i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
    borderBottom: "1px solid var(--border)",
    fontSize: 12
  } }, /* @__PURE__ */ React.createElement("span", null, n), /* @__PURE__ */ React.createElement("strong", null, fmt(v))))))), (tab === "ar" || tab === "ap") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text2)", marginBottom: 10 } }, isAP ? "What you still owe suppliers, grouped by vendor. Click a row to open the bills behind it." : "What customers still owe you, grouped by customer. Click a row to open the invoices behind it."), partyTable()), (tab === "arbill" || tab === "apbill") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text2)", marginBottom: 10 } }, "Every open ", isAP ? "purchase bill" : "invoice", ", oldest first \u2014 the chase list."), billTable()))));
};
