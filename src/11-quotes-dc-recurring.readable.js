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
