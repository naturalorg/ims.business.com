const CompanyModal = ({ onClose, currentUser, inline = false }) => {
  const [d, setD] = useState(S.get(SK.CO, { name: "", formerName: "", address: "", city: "", state: "", pin: "", gstin: "", phone: "", email: "", website: "", logo: "", bankName: "", bankAccount: "", bankIFSC: "", bankBranch: "", signatory: "", panNo: "", paymentMode: "netbanking", upiId: "", upiQR: "", waEnabled: false }));
  const [waNum, setWaNum] = useState(S.get(SK.WA, ""));
  const [prev, setPrev] = useState(d.logo || "");
  const [upiQRPrev, setUpiQRPrev] = useState(d.upiQR || "");
  const fileRef = useRef();
  const upiQRRef = useRef();
  const up = (k) => (e) => setD((p) => ({ ...p, [k]: e.target.value }));
  const isSuper = isSuperAdmin(currentUser == null ? void 0 : currentUser.email);
  const save = () => {
    if (!d.name) {
      toast.error("Company name required");
      return;
    }
    S.set(SK.CO, d);
    if (isSuper) S.set(SK.WA, waNum.replace(/\D/g, ""));
    logAudit("COMPANY_SETTINGS_UPDATED", `${d.name}`, currentUser);
    toast.success("Company saved!");
    onClose();
  };
  const handleLogo = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      toast.error("Max 2MB");
      return;
    }
    const r = new FileReader();
    r.onload = (ev) => {
      const b = ev.target.result;
      setD((p) => ({ ...p, logo: b }));
      setPrev(b);
    };
    r.readAsDataURL(f);
  };
  const handleUpiQR = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 1 * 1024 * 1024) {
      toast.error("Max 1MB for QR");
      return;
    }
    const r = new FileReader();
    r.onload = (ev) => {
      const b = ev.target.result;
      setD((p) => ({ ...p, upiQR: b }));
      setUpiQRPrev(b);
    };
    r.readAsDataURL(f);
  };
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay", onClick: inline ? void 0 : ((e) => e.target === e.currentTarget && onClose()) }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal", style: { ...inline ? {} : { maxWidth: "min(860px, 95vw)", width: "100%" } } }, /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("span", { className: "modal-title" }, /* @__PURE__ */ React.createElement(Ic, { n: "building", s: 16 }), " Company Details"), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Ic, { n: "x" }))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 18 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "field-label" }, "Company Logo"), /* @__PURE__ */ React.createElement("div", { className: "logo-box", onClick: () => fileRef.current.click() }, prev ? /* @__PURE__ */ React.createElement("img", { src: prev, alt: "logo" }) : /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", color: "var(--text3)", fontSize: 11 } }, /* @__PURE__ */ React.createElement(Ic, { n: "upload", s: 20 }), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 4 } }, "Upload"))), /* @__PURE__ */ React.createElement("input", { ref: fileRef, type: "file", accept: "image/*", style: { display: "none" }, onChange: handleLogo }), prev && /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm", style: { marginTop: 6, width: 88 }, onClick: () => {
    setPrev("");
    setD((p) => ({ ...p, logo: "" }));
  } }, "Remove"), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6, fontSize: 10.5, color: "var(--text3)", maxWidth: 88 } }, "Appears on your invoices & PDFs \u2014 not the Arctic Books app icon.")), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Company Name *"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.name, onChange: up("name"), placeholder: "Your Business Name" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Formerly Known As (optional)"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.formerName || "", onChange: up("formerName"), placeholder: "Old registered name, if any \u2014 prints under company name on PDF" })), /* @__PURE__ */ React.createElement("div", { className: "g2" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "GSTIN"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.gstin, onChange: (e) => setD((p) => ({ ...p, gstin: e.target.value.toUpperCase() })), placeholder: "29AAAAA0000A1Z5", maxLength: 15, style: { textTransform: "uppercase" } })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "PAN Number"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.panNo, onChange: up("panNo"), placeholder: "AAAAA0000A", maxLength: 10, style: { textTransform: "uppercase" } }))))), /* @__PURE__ */ React.createElement("div", { className: "sep-text" }, "Address"), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Street Address"), /* @__PURE__ */ React.createElement("textarea", { className: "field-input", value: d.address, onChange: up("address"), rows: 2, placeholder: "Door No, Street, Area" })), /* @__PURE__ */ React.createElement("div", { className: "g3" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "City"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.city, onChange: up("city"), placeholder: "City" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "State"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.state, onChange: up("state"), placeholder: "State" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "PIN Code"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.pin, onChange: up("pin"), placeholder: "560001", maxLength: 6 }))), /* @__PURE__ */ React.createElement("div", { className: "sep-text" }, "Contact"), /* @__PURE__ */ React.createElement("div", { className: "g3" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Phone"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.phone, onChange: up("phone") })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Email"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.email, onChange: up("email") })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Website"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.website, onChange: up("website") }))), /* @__PURE__ */ React.createElement("div", { className: "sep-text" }, "Bank Details"), /* @__PURE__ */ React.createElement("div", { className: "g2" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Bank Name"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.bankName, onChange: up("bankName") })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Account Number"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.bankAccount, onChange: up("bankAccount") })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "IFSC Code"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.bankIFSC, onChange: up("bankIFSC"), style: { textTransform: "uppercase" } })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Branch Name"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.bankBranch, onChange: up("bankBranch") }))), /* @__PURE__ */ React.createElement("div", { className: "field", style: { maxWidth: 340 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Authorised Signatory Name"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.signatory, onChange: up("signatory"), placeholder: "Proprietor / Director" })), /* @__PURE__ */ React.createElement("div", { className: "sep-text" }, "WhatsApp Share Button"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: "rgba(37,211,102,0.05)", border: "1px solid rgba(37,211,102,0.2)", borderRadius: 10 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flex: 1 } }, /* @__PURE__ */ React.createElement("div", { onClick: () => setD((p) => ({ ...p, waEnabled: !p.waEnabled })), style: { width: 44, height: 24, borderRadius: 12, background: d.waEnabled ? "#25D366" : "var(--border2)", position: "relative", transition: "background 0.2s", cursor: "pointer", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: 3, left: d.waEnabled ? 22 : 3, width: 18, height: 18, borderRadius: 9, background: "white", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.25)" } })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--text)", fontSize: 13 } }, d.waEnabled ? "WhatsApp button enabled" : "WhatsApp button disabled"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", marginTop: 2 } }, d.waEnabled ? "Button visible on invoice form \u2014 sends PDF + message to customer" : "Button hidden. Enable to allow sharing invoices via WhatsApp.")))), /* @__PURE__ */ React.createElement("div", { className: "sep-text" }, "Payment Method on Invoice"), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "field-label", style: { marginBottom: 8 } }, "Show in PDF Invoice"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, [["netbanking", "Net Banking Only"], ["upi", "UPI Only"], ["both", "Both"]].map(([v, l]) => /* @__PURE__ */ React.createElement("label", { key: v, style: { display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: "7px 14px", borderRadius: 8, border: `2px solid ${d.paymentMode === v ? "var(--primary)" : "var(--border2)"}`, background: d.paymentMode === v ? "var(--primary-bg)" : "transparent", fontSize: 12, fontWeight: d.paymentMode === v ? 700 : 500, color: d.paymentMode === v ? "var(--primary2)" : "var(--text2)", transition: "all 0.2s" } }, /* @__PURE__ */ React.createElement("input", { type: "radio", name: "paymode", value: v, checked: d.paymentMode === v, onChange: up("paymentMode"), style: { display: "none" } }), l)))), (d.paymentMode === "upi" || d.paymentMode === "both") && /* @__PURE__ */ React.createElement("div", { style: { background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--primary2)", fontSize: 13, marginBottom: 12 } }, "UPI Settings"), /* @__PURE__ */ React.createElement("div", { className: "g2", style: { alignItems: "start" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "UPI ID"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.upiId || "", onChange: up("upiId"), placeholder: "yourname@bank or 9876543210@upi" })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", marginTop: -8 } }, "This appears on the invoice as UPI ID")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "field-label", style: { marginBottom: 6 } }, "UPI QR Code Image"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center" } }, /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { width: 72, height: 72, border: "2px dashed var(--border2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "var(--card)", cursor: "pointer", flexShrink: 0 },
      onClick: () => upiQRRef.current.click()
    },
    upiQRPrev ? /* @__PURE__ */ React.createElement("img", { src: upiQRPrev, alt: "QR", style: { width: "100%", height: "100%", objectFit: "contain" } }) : /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", color: "var(--text3)", fontSize: 10 } }, /* @__PURE__ */ React.createElement(Ic, { n: "upload", s: 18 }), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 2 } }, "QR Code"))
  ), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("input", { ref: upiQRRef, type: "file", accept: "image/*", style: { display: "none" }, onChange: handleUpiQR }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-primary btn-sm", onClick: () => upiQRRef.current.click() }, /* @__PURE__ */ React.createElement(Ic, { n: "camera", s: 16 }), " Upload QR"), upiQRPrev && /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm", style: { marginTop: 6, display: "block" }, onClick: () => {
    setUpiQRPrev("");
    setD((p) => ({ ...p, upiQR: "" }));
  } }, "Remove"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text3)", marginTop: 4 } }, "PNG/JPG \xB7 max 1MB")))))), isSuper && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, padding: "12px 14px", background: "rgba(37,211,102,0.06)", border: "1px solid rgba(37,211,102,0.2)", borderRadius: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "#16a34a", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "#16a34a" }, /* @__PURE__ */ React.createElement("path", { d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" })), "WhatsApp Business Number ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#16a34a", fontWeight: 500 } }, "(Super Admin only)")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "var(--text3)", fontWeight: 600, flexShrink: 0 } }, "+91"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: waNum, onChange: (e) => setWaNum(e.target.value), placeholder: "9876543210 (10 digits)", maxLength: 10, style: { maxWidth: 200 } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text3)" } }, "Your business WhatsApp number (for reference)")), waNum && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#16a34a", marginTop: 6 } }, "Saved: +91 ", waNum, " \u2014 Invoice WhatsApp button sends to customer's phone number"))), /* @__PURE__ */ React.createElement("div", { className: "modal-ftr" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: onClose }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: save }, /* @__PURE__ */ React.createElement(Ic, { n: "save" }), "Save Company"))));
};
const HSNModal = ({ onClose, inline = false, searchQuery = "", currentUser }) => {
  const [activeTab, setActiveTab] = useState("hsn");
  const [list, setList] = useState(S.get(SK.HSN, []));
  const [form, setForm] = useState({ code: "", desc: "", taxRate: "18", unit: "Nos", type: "HSN", category: "" });
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState(searchQuery);
  useEffect(() => {
    if (searchQuery !== void 0) setQ(searchQuery);
  }, [searchQuery]);
  const up = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const filtered = list.filter((h) => h.code.includes(q) || h.desc.toLowerCase().includes(q.toLowerCase()) || (h.category || "").toLowerCase().includes(q.toLowerCase()));
  const save = () => {
    if (!form.code || !form.desc) {
      toast.error("Code & description required");
      return;
    }
    let u;
    const wasEditing = editing !== null;
    if (editing !== null) {
      u = list.map((h, i) => i === editing ? { ...form } : h);
    } else {
      if (list.find((h) => h.code === form.code)) {
        toast.error("Code exists");
        return;
      }
      u = [...list, { ...form }];
    }
    setList(u);
    S.set(SK.HSN, u);
    logAudit(wasEditing ? "HSN_EDITED" : "HSN_ADDED", `${form.code} \u2014 ${form.desc}`, currentUser);
    setForm({ code: "", desc: "", taxRate: "18", unit: "Nos", type: "HSN", category: "" });
    setEditing(null);
    toast.success(editing !== null ? "Updated!" : "Added!");
  };
  const del = (i) => {
    const h = list[i];
    const u = list.filter((_, j) => j !== i);
    setList(u);
    S.set(SK.HSN, u);
    logAudit("HSN_DELETED", `${(h == null ? void 0 : h.code) || ""} \u2014 ${(h == null ? void 0 : h.desc) || ""}`, currentUser);
    toast.info("Deleted");
  };
  const editE = (i) => {
    setForm({ ...list[i] });
    setEditing(i);
  };
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay", onClick: inline ? void 0 : ((e) => e.target === e.currentTarget && onClose()) }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal", style: { ...inline ? {} : { maxWidth: "min(1060px, 95vw)", width: "100%" } } }, /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("span", { className: "modal-title" }, /* @__PURE__ */ React.createElement(Ic, { n: "tag", s: 16 }), " HSN / SAC Database"), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Ic, { n: "x" }))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: 18 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--primary2)", marginBottom: 14, fontSize: 13 } }, editing !== null ? "Edit Entry" : "Add HSN/SAC Code"), /* @__PURE__ */ React.createElement("div", { className: "g4" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Type"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: form.type, onChange: up("type") }, /* @__PURE__ */ React.createElement("option", { value: "HSN" }, "HSN (Goods)"), /* @__PURE__ */ React.createElement("option", { value: "SAC" }, "SAC (Services)"))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Code *"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.code, onChange: up("code"), placeholder: "e.g. 8471", maxLength: 8 })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "GST Rate %"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: form.taxRate, onChange: up("taxRate") }, TAX_RATES.map((r) => /* @__PURE__ */ React.createElement("option", { key: r, value: r }, r, "%")))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Default Unit"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: form.unit, onChange: up("unit") }, UNITS.map((u) => /* @__PURE__ */ React.createElement("option", { key: u }, u))))), /* @__PURE__ */ React.createElement("div", { className: "g2" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Description *"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.desc, onChange: up("desc"), placeholder: "Detailed description of goods/services" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Category (optional)"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.category, onChange: up("category"), placeholder: "e.g. Electronics, IT Products" }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: save }, editing !== null ? "Update" : "Add Entry"), editing !== null && /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: () => {
    setForm({ code: "", desc: "", taxRate: "18", unit: "Nos", type: "HSN", category: "" });
    setEditing(null);
  } }, "Cancel"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text2)", fontSize: 13 } }, list.length, " entries"), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", maxWidth: 260 } }, /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", zIndex: 1 } }, /* @__PURE__ */ React.createElement(Ic, { n: "search", s: 14 })), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search...", style: { paddingLeft: 38, width: "100%" } }))), filtered.length > 0 ? /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Type"), /* @__PURE__ */ React.createElement("th", null, "Code"), /* @__PURE__ */ React.createElement("th", null, "Description"), /* @__PURE__ */ React.createElement("th", null, "Category"), /* @__PURE__ */ React.createElement("th", null, "Rate"), /* @__PURE__ */ React.createElement("th", null, "Unit"), /* @__PURE__ */ React.createElement("th", { style: { width: 80 } }, "Actions"))), /* @__PURE__ */ React.createElement("tbody", null, filtered.map((h, i) => {
    const idx = list.indexOf(h);
    return /* @__PURE__ */ React.createElement("tr", { key: i }, /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: `badge ${h.type === "SAC" ? "badge-blue" : "badge-gold"}` }, h.type)), /* @__PURE__ */ React.createElement("td", { style: { fontWeight: 700, color: "var(--gold)", fontFamily: "monospace" } }, h.code), /* @__PURE__ */ React.createElement("td", { style: { maxWidth: 250 } }, h.desc), /* @__PURE__ */ React.createElement("td", { style: { color: "var(--text3)", fontSize: 12 } }, h.category || "\u2014"), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: "badge badge-green" }, h.taxRate, "%")), /* @__PURE__ */ React.createElement("td", { style: { color: "var(--text2)" } }, h.unit), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline btn-icon", onClick: () => editE(idx) }, /* @__PURE__ */ React.createElement(Ic, { n: "edit", s: 12 })), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger btn-icon", onClick: () => del(idx) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 12 })))));
  })))) : /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "32px", color: "var(--text3)" } }, q ? "No matches." : "No entries yet."))), /* @__PURE__ */ React.createElement("div", { className: "modal-ftr" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: onClose }, "Done"))));
};
const TermsModal = ({ onClose, inline = false, currentUser }) => {
  const [tab, setTab] = useState("invoice");
  const [t, setT] = useState(S.get(SK.TERMS, DEFAULT_TERMS));
  const [pt, setPt] = useState(S.get(SK.PO_TERMS, DEFAULT_PO_TERMS));
  const [showT, setShowT] = useState(S.get(SK.SHOW_TERMS, true));
  const save = () => {
    const prevShowT = S.get(SK.SHOW_TERMS, true);
    S.set(SK.TERMS, t);
    S.set(SK.PO_TERMS, pt);
    S.set(SK.SHOW_TERMS, showT);
    logAudit("TERMS_UPDATED", `Invoice/PO terms saved${prevShowT !== showT ? ` \u2014 Show on invoice PDF: ${showT ? "ON" : "OFF"}` : ""}`, currentUser);
    toast.success("Terms saved!");
    onClose();
  };
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay", onClick: inline ? void 0 : ((e) => e.target === e.currentTarget && onClose()) }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal", style: { ...inline ? {} : { maxWidth: "min(760px, 95vw)", width: "100%" } } }, /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("span", { className: "modal-title" }, /* @__PURE__ */ React.createElement(Ic, { n: "file", s: 20 }), " Terms & Conditions"), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Ic, { n: "x" }))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 8, padding: 3, gap: 3, marginBottom: 16 } }, [["invoice", "Invoice T&C"], ["po", "PO T&C"]].map(([k, l]) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: k,
      onClick: () => setTab(k),
      style: {
        flex: 1,
        padding: "7px 0",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: tab === k ? 700 : 500,
        cursor: "pointer",
        border: "none",
        background: tab === k ? "var(--primary)" : "transparent",
        color: tab === k ? "#fff" : "var(--text2)",
        transition: "all 0.2s"
      }
    },
    l
  ))), tab === "invoice" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--text)" } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: showT, onChange: (e) => setShowT(e.target.checked), style: { width: 16, height: 16, cursor: "pointer" } }), "Show Terms & Conditions on Invoice PDF"), /* @__PURE__ */ React.createElement("p", { style: { color: "var(--text2)", fontSize: 13, marginBottom: 10 } }, "These appear at the bottom of each ", /* @__PURE__ */ React.createElement("strong", null, "Tax Invoice PDF"), !showT && " (currently hidden \u2014 toggle above to show them)", "."), /* @__PURE__ */ React.createElement("textarea", { className: "field-input", value: t, onChange: (e) => setT(e.target.value), rows: 11, style: { fontFamily: "monospace", fontSize: 12.5, opacity: showT ? 1 : 0.5 }, disabled: !showT }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", style: { marginTop: 10 }, onClick: () => setT(DEFAULT_TERMS) }, "Reset to Default")), tab === "po" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { style: { color: "var(--text2)", fontSize: 13, marginBottom: 10 } }, "These appear at the bottom of each ", /* @__PURE__ */ React.createElement("strong", null, "Purchase Order PDF"), " automatically."), /* @__PURE__ */ React.createElement("textarea", { className: "field-input", value: pt, onChange: (e) => setPt(e.target.value), rows: 11, style: { fontFamily: "monospace", fontSize: 12.5 } }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", style: { marginTop: 10 }, onClick: () => setPt(DEFAULT_PO_TERMS) }, "Reset to Default"))), /* @__PURE__ */ React.createElement("div", { className: "modal-ftr" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: onClose }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: save }, /* @__PURE__ */ React.createElement(Ic, { n: "save" }), "Save Both"))));
};
const EXP_CATEGORIES = ["Raw Materials", "Packaging", "Freight / Transport", "Office Supplies", "Rent", "Electricity / Utilities", "Labour / Wages", "Professional Fees", "Repairs & Maintenance", "Software / IT", "Travel & Conveyance", "Advertising / Marketing", "Bank Charges", "Insurance", "Statutory / Tax Payments", "Other"];
const PAY_MODES = ["Cash", "Bank Transfer / NEFT", "UPI / GPay / PhonePe", "Cheque", "Credit Card", "Debit Card", "Other"];
const TDS_SECTIONS = [
  { code: "", label: "No TDS", rate: 0 },
  { code: "194C", label: "194C \u2014 Payment to Contractors", rate: 1 },
  { code: "194C-HUF", label: "194C \u2014 Contractors (Individual/HUF)", rate: 1 },
  { code: "194J", label: "194J \u2014 Professional / Technical Fees", rate: 10 },
  { code: "194Q", label: "194Q \u2014 Purchase of Goods", rate: 0.1 },
  { code: "194I", label: "194I \u2014 Rent", rate: 10 },
  { code: "194H", label: "194H \u2014 Commission / Brokerage", rate: 5 },
  { code: "194A", label: "194A \u2014 Interest (other than securities)", rate: 10 },
  { code: "OTHER", label: "Other Section", rate: 0 }
];
const tdsSectionRate = (code) => {
  var _a, _b;
  return (_b = (_a = TDS_SECTIONS.find((s) => s.code === code)) == null ? void 0 : _a.rate) != null ? _b : 0;
};
const ensureDefaultExpenseHeads = () => {
  const existingNames = getAllAccounts().filter((a) => a.type === "expense").map((a) => a.name.toLowerCase());
  const toSeed = EXP_CATEGORIES.filter((c) => c !== "Other" && !existingNames.includes(c.toLowerCase()));
  if (!toSeed.length) return;
  const seeded = toSeed.map((name) => ({
    key: "CUST_" + name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 24) + "_SEED",
    name,
    type: "expense",
    group: "Expenses",
    scheduleGroup: "Other Expenses",
    custom: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  }));
  S.set(SK.COA_CUSTOM, [...getCustomAccounts(), ...seeded]);
};
const addDaysStr = (dateStr, days) => {
  if (!dateStr) return "";
  const d = _pd(dateStr);
  if (isNaN(d)) return "";
  d.setDate(d.getDate() + (parseInt(days) || 0));
  return _iso(d);
};
const expItems = (e) => {
  if (!e) return [];
  if (Array.isArray(e.items) && e.items.length) return e.items;
  if (e.description || e.qty || e.rate) {
    const qty = parseFloat(e.qty) || 0, rate = parseFloat(e.rate) || 0;
    const taxable = qty * rate, tR = parseFloat(e.taxRate) || 0, gstAmt = taxable * tR / 100;
    return [{
      key: "legacy",
      product: e.product || "",
      desc: e.description || "",
      hsnCode: e.hsnCode || "",
      unit: e.unit || "Nos",
      qty,
      rate,
      taxRate: e.taxRate || "18",
      taxable: +taxable.toFixed(2),
      gstAmt: +gstAmt.toFixed(2),
      total: +(taxable + gstAmt).toFixed(2),
      toStock: !!e.addToStock
    }];
  }
  return [];
};
const expTotal = (e) => parseFloat(e == null ? void 0 : e.total) || 0;
const expTdsAmt = (e) => parseFloat(e == null ? void 0 : e.tdsAmount) || 0;
const expNetPayable = (e) => (e == null ? void 0 : e.netPayable) != null ? parseFloat(e.netPayable) : Math.max(0, expTotal(e) - expTdsAmt(e));
const expPaid = (e) => {
  if (!e) return 0;
  const base = expNetPayable(e);
  if (e.payStatus === "Paid") return base;
  if (e.payStatus === "Partial") return Math.min(base, parseFloat(e.paidAmount) || 0);
  return 0;
};
const expDue = (e) => Math.max(0, expNetPayable(e) - expPaid(e));
const expDueDate = (e) => {
  var _a;
  return (e == null ? void 0 : e.dueDate) || addDaysStr((e == null ? void 0 : e.billDate) || (e == null ? void 0 : e.date), (_a = e == null ? void 0 : e.creditDays) != null ? _a : 30);
};
const expStockQty = (e) => expItems(e).filter((it) => it.toStock !== false).reduce((t, it) => t + (parseFloat(it.qty) || 0), 0);
const reverseStockForPurchase = (e) => {
  if (e) removeStockForSource("PUR-" + e.id);
};
let _pItemSeq = 0;
const blankPItem = () => ({
  key: Date.now().toString(36) + ++_pItemSeq,
  product: "",
  desc: "",
  hsnCode: "",
  unit: "Nos",
  qty: 1,
  rate: "",
  taxRate: "18",
  taxable: 0,
  gstAmt: 0,
  total: 0,
  toStock: true
});
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
const HistoryModal = ({ onClose, onLoad, currentUser, inline = false, searchQuery = "" }) => {
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
  )), sorted.length > 0 ? /* @__PURE__ */ React.createElement("div", { className: "hist-table-wrap", style: { maxHeight: "58vh", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: 780 } }, /* @__PURE__ */ React.createElement("colgroup", null, /* @__PURE__ */ React.createElement("col", { style: { width: 48 } }), /* @__PURE__ */ React.createElement("col", { style: { width: 140 } }), /* @__PURE__ */ React.createElement("col", null), /* @__PURE__ */ React.createElement("col", { style: { width: 90 } }), /* @__PURE__ */ React.createElement("col", { style: { width: 90 } }), /* @__PURE__ */ React.createElement("col", { style: { width: 32 } }), /* @__PURE__ */ React.createElement("col", { style: { width: 110 } }), /* @__PURE__ */ React.createElement("col", { style: { width: isAdmin ? 178 : 138 } })), /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)", borderBottom: "2px solid var(--border2)", position: "sticky", top: 0, zIndex: 2 } }, ["Type", "Invoice No.", "Customer", "Date", "Status", "S", "Amount", "Actions"].map((h, i) => /* @__PURE__ */ React.createElement("th", { key: i, style: { padding: "9px 8px", fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: i === 6 ? "right" : i === 7 ? "center" : i === 5 ? "center" : "left", whiteSpace: "nowrap" } }, h)))), /* @__PURE__ */ React.createElement("tbody", null, sorted.map((inv, i) => {
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
            onLoad(inv);
            onClose();
          }
        },
        "Load"
      ), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", style: { padding: "4px 8px", fontSize: 11 }, title: "Create a NEW copy of this invoice (nothing is saved until you press Save)", onClick: () => {
        if (!window.confirm("Create a duplicate of " + inv.invNo + "?\nA new invoice number will be used. Nothing is saved to the books until you press Save.")) return;
        const dup = { ...inv, invNo: genInvNo(inv.docType), date: today(), dueDate: "", status: "Draft", sentToCustomer: false, paidDate: "", payments: [], time: nowTime(), _isDuplicate: true };
        onLoad(dup);
        onClose();
        toast.success("Duplicate opened \u2014 review and Save to create it");
      } }, "Duplicate"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline btn-icon", style: { width: 28, height: 28 }, title: "Download PDF", onClick: () => makePDF(inv, co, S.get(SK.TERMS, DEFAULT_TERMS)) }, /* @__PURE__ */ React.createElement(Ic, { n: "pdf", s: 12 })), isSalesFrozen(inv) && /* @__PURE__ */ React.createElement("span", { title: "Frozen", style: { fontSize: 10, fontWeight: 700, color: "var(--gold)", background: "rgba(241,73,92,0.15)", padding: "2px 6px", borderRadius: 4 } }, "FROZEN"), isAdmin && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger btn-icon", style: { width: 28, height: 28, opacity: !isSuperAdmin(currentUser == null ? void 0 : currentUser.email) && isSalesFrozen(inv) ? 0.4 : 1 }, title: !isSuperAdmin(currentUser == null ? void 0 : currentUser.email) && isSalesFrozen(inv) ? "Month frozen \u2014 Super Admin only" : "Delete", onClick: () => del(inv.invNo) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 12 }))))
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
const FreezeTab = ({ invs, isSuper, currentUser }) => {
  const [freezeData, setFreezeData] = useState(() => getFreezeData());
  const [selMonth, setSelMonth] = useState(() => {
    const d = /* @__PURE__ */ new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const saveFreeze = (updated) => {
    S.set(SK.FREEZE, updated);
    setFreezeData({ ...updated });
  };
  const toggleSales = (ym) => {
    if (!isSuper) {
      toast.error("Only Super Admin can freeze/unfreeze periods");
      return;
    }
    const cur = getFreezeData();
    const nowFrozen = !cur.sales.includes(ym);
    const arr = nowFrozen ? [...cur.sales, ym].sort() : cur.sales.filter((x) => x !== ym);
    const updated = { ...cur, sales: arr };
    saveFreeze(updated);
    logAudit(
      nowFrozen ? "PERIOD_FROZEN" : "PERIOD_UNFROZEN",
      `Sales ${ym} ${nowFrozen ? "frozen" : "unfrozen"} by ${(currentUser == null ? void 0 : currentUser.name) || ""}`,
      currentUser
    );
    toast.success(nowFrozen ? ` Sales ${ym} frozen! No edits allowed for non-admins.` : `UNLOCK Sales ${ym} unfrozen!`);
  };
  const toggleExp = (ym) => {
    if (!isSuper) {
      toast.error("Only Super Admin can freeze/unfreeze periods");
      return;
    }
    const cur = getFreezeData();
    const nowFrozen = !cur.expenses.includes(ym);
    const arr = nowFrozen ? [...cur.expenses, ym].sort() : cur.expenses.filter((x) => x !== ym);
    const updated = { ...cur, expenses: arr };
    saveFreeze(updated);
    logAudit(
      nowFrozen ? "PERIOD_FROZEN" : "PERIOD_UNFROZEN",
      `Expenses ${ym} ${nowFrozen ? "frozen" : "unfrozen"} by ${(currentUser == null ? void 0 : currentUser.name) || ""}`,
      currentUser
    );
    toast.success(nowFrozen ? ` Expenses ${ym} frozen! No edits allowed for non-admins.` : `UNLOCK Expenses ${ym} unfrozen!`);
  };
  const invMonths = [...new Set(invs.map((i) => (i.date || "").substring(0, 7)).filter(Boolean))].sort().reverse();
  const expMonths = [...new Set(S.get(SK.EXP, []).map((e) => (e.date || "").substring(0, 7)).filter(Boolean))].sort().reverse();
  const allMonths = [.../* @__PURE__ */ new Set([...invMonths, ...expMonths])].sort().reverse();
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "alert alert-info", style: { marginBottom: 20 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, "Period Lock"), " \u2014 Freeze a month to prevent any edits to invoices or expenses for that period. Once frozen, ", /* @__PURE__ */ React.createElement("strong", null, "only Super Admin"), " can edit or unfreeze.", !isSuper && /* @__PURE__ */ React.createElement("span", { style: { color: "var(--gold)", marginLeft: 6, fontWeight: 600 } }, "View only \u2014 Super Admin required to change locks."))), isSuper && /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: 18, padding: "16px 20px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--primary2)", fontSize: 13, marginBottom: 12 } }, "LOCK Lock a Specific Month"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "month",
      className: "field-input",
      value: selMonth,
      onChange: (e) => setSelMonth(e.target.value),
      style: { maxWidth: 180, fontFamily: "monospace", fontWeight: 600 }
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-outline-primary",
      onClick: () => toggleSales(selMonth),
      style: {
        background: freezeData.sales.includes(selMonth) ? "rgba(239,68,68,0.08)" : "",
        borderColor: freezeData.sales.includes(selMonth) ? "var(--red)" : "",
        color: freezeData.sales.includes(selMonth) ? "var(--red)" : ""
      }
    },
    freezeData.sales.includes(selMonth) ? "UNLOCK Unfreeze Sales" : " Freeze Sales"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-outline",
      onClick: () => toggleExp(selMonth),
      style: {
        background: freezeData.expenses.includes(selMonth) ? "rgba(239,68,68,0.08)" : "",
        borderColor: freezeData.expenses.includes(selMonth) ? "var(--red)" : "",
        color: freezeData.expenses.includes(selMonth) ? "var(--red)" : ""
      }
    },
    freezeData.expenses.includes(selMonth) ? "UNLOCK Unfreeze Expenses" : " Freeze Expenses"
  )), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", marginTop: 8 } }, /* @__PURE__ */ React.createElement(Ic, { n: "info", s: 14 }), " Use the table below to toggle individual months, or pick any month above including future months.")), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--text)", fontSize: 13, marginBottom: 12 } }, /* @__PURE__ */ React.createElement(Ic, { n: "calendar", s: 16 }), " All Months with Activity"), allMonths.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "40px", color: "var(--text3)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 32, marginBottom: 8 } }, /* @__PURE__ */ React.createElement(Ic, { n: "inbox", s: 16 })), /* @__PURE__ */ React.createElement("div", null, "No invoices or expenses recorded yet."), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, marginTop: 6 } }, "Use the picker above to lock future months proactively.")) : /* @__PURE__ */ React.createElement("div", { style: { border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "grid",
    gridTemplateColumns: `130px 1fr 140px 140px${isSuper ? " 160px" : ""}`,
    gap: 0,
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
    zIndex: 1
  } }, /* @__PURE__ */ React.createElement("span", null, "Month"), /* @__PURE__ */ React.createElement("span", null, "Activity"), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "center" } }, "Sales Lock"), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "center" } }, "Expenses Lock"), isSuper && /* @__PURE__ */ React.createElement("span", { style: { textAlign: "center" } }, "Actions")), allMonths.map((ym, i) => {
    const mInvs = invs.filter((x) => (x.date || "").startsWith(ym));
    const mExps = S.get(SK.EXP, []).filter((x) => (x.date || "").startsWith(ym));
    const mRev = mInvs.reduce((s, x) => s + getGrand(x), 0);
    const mExp = mExps.reduce((s, x) => s + (parseFloat(x.total) || 0), 0);
    const salesFrz = freezeData.sales.includes(ym);
    const expFrz = freezeData.expenses.includes(ym);
    return /* @__PURE__ */ React.createElement("div", { key: ym, style: {
      display: "grid",
      gridTemplateColumns: `130px 1fr 140px 140px${isSuper ? " 160px" : ""}`,
      gap: 0,
      padding: "11px 16px",
      borderBottom: i < allMonths.length - 1 ? "1px solid var(--border)" : "none",
      alignItems: "center",
      background: salesFrz && expFrz ? "rgba(239,68,68,0.04)" : salesFrz || expFrz ? "rgba(79,111,232,0.03)" : ""
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: "var(--gold)" } }, ym), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12 } }, mInvs.length > 0 && /* @__PURE__ */ React.createElement("span", { style: { color: "var(--green)", marginRight: 10 } }, /* @__PURE__ */ React.createElement(Ic, { n: "file", s: 16 }), " ", mInvs.length, " \xB7 ", fmt(mRev)), mExps.length > 0 && /* @__PURE__ */ React.createElement("span", { style: { color: "var(--red)" } }, /* @__PURE__ */ React.createElement(Ic, { n: "receipt", s: 16 }), " ", mExps.length, " \xB7 ", fmt(mExp)), mInvs.length === 0 && mExps.length === 0 && /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text3)", fontSize: 11 } }, "No activity")), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("span", { style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      background: salesFrz ? "rgba(239,68,68,0.1)" : "rgba(15,217,138,0.08)",
      color: salesFrz ? "var(--red)" : "var(--green)",
      border: `1px solid ${salesFrz ? "rgba(239,68,68,0.25)" : "rgba(15,217,138,0.2)"}`
    } }, salesFrz ? " Frozen" : " Open")), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("span", { style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      background: expFrz ? "rgba(239,68,68,0.1)" : "rgba(15,217,138,0.08)",
      color: expFrz ? "var(--red)" : "var(--green)",
      border: `1px solid ${expFrz ? "rgba(239,68,68,0.25)" : "rgba(15,217,138,0.2)"}`
    } }, expFrz ? " Frozen" : " Open")), isSuper && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5, justifyContent: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => toggleSales(ym),
        style: {
          fontSize: 10,
          padding: "4px 10px",
          background: salesFrz ? "rgba(239,68,68,0.08)" : "rgba(79,111,232,0.08)",
          color: salesFrz ? "var(--red)" : "var(--primary2)",
          border: `1px solid ${salesFrz ? "rgba(239,68,68,0.3)" : "rgba(79,111,232,0.25)"}`,
          borderRadius: 6,
          cursor: "pointer",
          fontWeight: 600,
          whiteSpace: "nowrap",
          fontFamily: "inherit"
        }
      },
      salesFrz ? "UNLOCK Sales" : " Sales"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => toggleExp(ym),
        style: {
          fontSize: 10,
          padding: "4px 10px",
          background: expFrz ? "rgba(239,68,68,0.08)" : "rgba(241,73,92,0.08)",
          color: expFrz ? "var(--red)" : "var(--gold)",
          border: `1px solid ${expFrz ? "rgba(239,68,68,0.3)" : "rgba(241,73,92,0.25)"}`,
          borderRadius: 6,
          cursor: "pointer",
          fontWeight: 600,
          whiteSpace: "nowrap",
          fontFamily: "inherit"
        }
      },
      expFrz ? "UNLOCK Exp" : " Exp"
    )));
  })), (freezeData.sales.length > 0 || freezeData.expenses.length > 0) && /* @__PURE__ */ React.createElement("div", { style: {
    padding: "14px 16px",
    background: "rgba(239,68,68,0.04)",
    border: "1px solid rgba(239,68,68,0.15)",
    borderRadius: 10
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--red)", marginBottom: 8 } }, " Currently Frozen Periods"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, freezeData.sales.map((ym) => /* @__PURE__ */ React.createElement("span", { key: "s" + ym, style: {
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    background: "rgba(239,68,68,0.1)",
    color: "var(--red)",
    border: "1px solid rgba(239,68,68,0.25)"
  } }, /* @__PURE__ */ React.createElement(Ic, { n: "file", s: 16 }), " ", ym, " Sales")), freezeData.expenses.map((ym) => /* @__PURE__ */ React.createElement("span", { key: "e" + ym, style: {
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    background: "rgba(245,158,11,0.1)",
    color: "var(--gold)",
    border: "1px solid rgba(245,158,11,0.25)"
  } }, /* @__PURE__ */ React.createElement(Ic, { n: "receipt", s: 16 }), " ", ym, " Expenses")))));
};
const SeriesTab = ({ isSuper, currentUser }) => {
  const fy = getFY();
  const fyS = getFYShort();
  const mm = getMonthCode();
  const [cfg, setCfg] = useState(() => S.get(SK.SERIES, {}));
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ letters: "", nextNum: 1 });
  const [justSaved, setJustSaved] = useState(null);
  const ctrKey = (id) => SK.CTR + "_" + id + "_" + fy + "_" + mm;
  const getCounter = (id) => S.get(ctrKey(id), 1);
  const getLiveLetters = (id) => {
    var _a;
    return cfg[id] && cfg[id].letters || ((_a = SERIES_TYPES.find((s) => s.id === id)) == null ? void 0 : _a.defLetters) || id;
  };
  const getFullPrefix = (id, lets) => `${lets || getLiveLetters(id)}${fyS}${mm}`;
  const buildNo = (id, n, lets) => `${getFullPrefix(id, lets)}${String(parseInt(n) || 1).padStart(4, "0")}`;
  const startEdit = (id) => {
    setForm({ letters: getLiveLetters(id), nextNum: getCounter(id) });
    setEditing(id);
    setJustSaved(null);
  };
  const saveSeries = () => {
    var _a;
    if (!form.letters.trim()) {
      toast.error("Letters cannot be empty");
      return;
    }
    if (!/^[A-Za-z]+$/.test(form.letters.trim())) {
      toast.error("Only letters A-Z allowed");
      return;
    }
    const num = parseInt(form.nextNum, 10);
    if (isNaN(num) || num < 1) {
      toast.error("Next number must be \u2265 1");
      return;
    }
    const lets = form.letters.trim().toUpperCase();
    const newCfg = { ...cfg, [editing]: { letters: lets } };
    setCfg(newCfg);
    S.set(SK.SERIES, newCfg);
    S.set(ctrKey(editing), num);
    logAudit("NUMBERING_SERIES_UPDATED", `${((_a = SERIES_TYPES.find((s) => s.id === editing)) == null ? void 0 : _a.label) || editing} \u2014 prefix "${lets}", next no. ${buildNo(editing, num, lets)}`, currentUser);
    setJustSaved(editing);
    setEditing(null);
    toast.success(`Saved! Next: ${buildNo(editing, num, lets)}`);
  };
  const resetSeries = (id) => {
    var _a, _b;
    if (!window.confirm("Reset to default letters and restart from 0001?")) return;
    const newCfg = { ...cfg };
    delete newCfg[id];
    setCfg(newCfg);
    S.set(SK.SERIES, newCfg);
    S.set(ctrKey(id), 1);
    logAudit("NUMBERING_SERIES_RESET", `${((_a = SERIES_TYPES.find((s) => s.id === id)) == null ? void 0 : _a.label) || id} reset to default`, currentUser);
    toast.info(`Reset: ${getFullPrefix(id, (_b = SERIES_TYPES.find((s) => s.id === id)) == null ? void 0 : _b.defLetters)}0001`);
  };
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { background: "rgba(79,111,232,0.06)", border: "1px solid rgba(79,111,232,0.2)", borderRadius: 10, padding: "14px 16px", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--primary2)", marginBottom: 6 } }, /* @__PURE__ */ React.createElement(Ic, { n: "hash", s: 16 }), " Invoice Number Format"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text3)", lineHeight: 1.8 } }, "Format: ", /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "monospace", color: "var(--gold)", fontWeight: 700 } }, "LETTERS + ", fyS, " + ", mm, " + 0001"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, marginLeft: 6 } }, "\u2190 FY and Month are automatic"), /* @__PURE__ */ React.createElement("br", null), "Example: ", /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "monospace", color: "var(--gold)" } }, "INV", fyS, mm, "0001 \u2192 INV", fyS, mm, "0002 \u2192 ..."), /* @__PURE__ */ React.createElement("br", null), "You can only change the ", /* @__PURE__ */ React.createElement("strong", { style: { color: "var(--text2)" } }, "letters part"), ". FY and month update automatically each month.")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, SERIES_TYPES.map((st) => {
    const lets = getLiveLetters(st.id);
    const ctr = getCounter(st.id);
    const nextNo = buildNo(st.id, ctr, lets);
    const isEdit = editing === st.id;
    const custom = !!(cfg[st.id] && cfg[st.id].letters);
    const eLets = (form.letters || "").toUpperCase();
    return /* @__PURE__ */ React.createElement("div", { key: st.id, style: { background: "var(--card)", border: `1.5px solid ${isEdit ? "var(--primary)" : "var(--border)"}`, borderRadius: 11, padding: "14px 16px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 38, height: 38, borderRadius: 9, background: "var(--primary-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontWeight: 800, fontSize: 13, color: "var(--primary2)", flexShrink: 0 } }, st.id === "INV" ? "I" : st.id === "INVDN" ? "D" : st.id === "INVCN" ? "C" : "N"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--text)", fontSize: 13, display: "flex", alignItems: "center", gap: 8 } }, st.label, custom && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, padding: "1px 7px", borderRadius: 9, background: "rgba(241,73,92,0.12)", color: "var(--gold)", border: "1px solid rgba(241,73,92,0.25)", fontWeight: 600 } }, "Custom")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginTop: 3, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "var(--gold)", background: "var(--gold-bg)", padding: "2px 9px", borderRadius: 6 } }, nextNo), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text3)" } }, "\u2190 next"), justSaved === st.id && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--green)", fontWeight: 700 } }, " Saved")))), !isEdit && isSuper && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 7 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: () => startEdit(st.id) }, "\u270F\uFE0F Edit"), custom && /* @__PURE__ */ React.createElement("button", { onClick: () => resetSeries(st.id), style: { fontSize: 11, padding: "4px 11px", borderRadius: 7, cursor: "pointer", fontWeight: 600, background: "rgba(239,68,68,0.06)", color: "var(--red)", border: "1px solid rgba(239,68,68,0.25)", fontFamily: "inherit" } }, "\u21A9 Reset")), !isEdit && !isSuper && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text3)", padding: "2px 9px", background: "var(--card2)", borderRadius: 8 } }, "View only")), isEdit && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 150px", gap: 12, marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Letters Only ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text3)", fontWeight: 400, textTransform: "none", letterSpacing: 0 } }, "(A-Z only, no numbers)")), /* @__PURE__ */ React.createElement(
      "input",
      {
        className: "field-input",
        value: form.letters,
        maxLength: 8,
        onChange: (e) => setForm((p) => ({ ...p, letters: e.target.value.replace(/[^A-Za-z]/g, "").toUpperCase() })),
        placeholder: st.defLetters,
        style: { fontFamily: "monospace", fontWeight: 700, fontSize: 16, letterSpacing: 2 }
      }
    ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", marginTop: 3 } }, "FY ", /* @__PURE__ */ React.createElement("strong", null, fyS), " and month ", /* @__PURE__ */ React.createElement("strong", null, mm), " are added automatically")), /* @__PURE__ */ React.createElement("div", { className: "field", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Next Number"), /* @__PURE__ */ React.createElement(
      "input",
      {
        className: "field-input",
        type: "number",
        min: 1,
        value: form.nextNum,
        onChange: (e) => setForm((p) => ({ ...p, nextNum: e.target.value })),
        style: { fontFamily: "monospace", fontWeight: 700, fontSize: 16 }
      }
    ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", marginTop: 3 } }, "Auto 4-digit padded"))), /* @__PURE__ */ React.createElement("div", { style: { background: "var(--card2)", borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "var(--text3)", fontWeight: 600 } }, "Preview:"), /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "monospace", fontWeight: 800, fontSize: 16, color: "var(--gold)" } }, buildNo(st.id, form.nextNum, eLets)), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "var(--text3)" } }, "\u2192"), /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "monospace", fontWeight: 700, fontSize: 14, color: "var(--text2)" } }, buildNo(st.id, (parseInt(form.nextNum) || 1) + 1, eLets)), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "var(--text3)" } }, "\u2192 ..."), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text3)", marginLeft: "auto" } }, /* @__PURE__ */ React.createElement("strong", null, eLets || st.defLetters), " + ", /* @__PURE__ */ React.createElement("strong", null, fyS), " + ", /* @__PURE__ */ React.createElement("strong", null, mm), " + 4-digits")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary btn-sm", onClick: saveSeries }, /* @__PURE__ */ React.createElement(Ic, { n: "save", s: 13 }), "Save"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", onClick: () => setEditing(null) }, "Cancel"))));
  })), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14, padding: "11px 14px", background: "rgba(241,73,92,0.06)", border: "1px solid rgba(241,73,92,0.2)", borderRadius: 9, fontSize: 12, color: "var(--text3)", lineHeight: 1.7 } }, /* @__PURE__ */ React.createElement(Ic, { n: "alert", s: 14 }), " ", /* @__PURE__ */ React.createElement("strong", { style: { color: "var(--gold)" } }, "Note:"), " Changes apply to new invoices only. Counters reset on 1st of each month automatically."));
};
const ExportTab = ({ invs, isSuper, currentUser }) => {
  var _a, _b;
  const fy = getFY();
  const fyShort = getFYShort();
  const allInvFYs = [...new Set(invs.map((i) => {
    const y = parseInt((i.date || "").slice(0, 4));
    const m = parseInt((i.date || "").slice(5, 7));
    return m >= 4 ? y : y - 1;
  }))].sort((a, b) => b - a);
  const allExpFYs = [...new Set((S.get(SK.EXP, []) || []).map((e) => {
    const y = parseInt((e.date || "").slice(0, 4));
    const m = parseInt((e.date || "").slice(5, 7));
    return m >= 4 ? y : y - 1;
  }))].sort((a, b) => b - a);
  const allFYs = [.../* @__PURE__ */ new Set([...allInvFYs, ...allExpFYs, fy])].sort((a, b) => b - a);
  const [selFY, setSelFY] = useState(fy);
  const [fromMonth, setFromMonth] = useState("04");
  const [toMonth, setToMonth] = useState("03");
  const MONTHS = [["04", "Apr"], ["05", "May"], ["06", "Jun"], ["07", "Jul"], ["08", "Aug"], ["09", "Sep"], ["10", "Oct"], ["11", "Nov"], ["12", "Dec"], ["01", "Jan"], ["02", "Feb"], ["03", "Mar"]];
  const FY_LABEL = (y) => `FY ${y}-${String(y + 1).slice(2)}`;
  const isMonthInRange = (month, from, to) => {
    const mIdx = MONTHS.findIndex((m) => m[0] === month);
    const fIdx = MONTHS.findIndex((m) => m[0] === from);
    const tIdx = MONTHS.findIndex((m) => m[0] === to);
    if (fIdx === -1 || tIdx === -1 || mIdx === -1) return true;
    if (fIdx <= tIdx) return mIdx >= fIdx && mIdx <= tIdx;
    return mIdx >= fIdx || mIdx <= tIdx;
  };
  const filterData = (arr, dateKey = "date") => {
    return arr.filter((item) => {
      const d = item[dateKey] || "";
      const y = parseInt(d.slice(0, 4)), m = parseInt(d.slice(5, 7));
      const itemFY = m >= 4 ? y : y - 1;
      if (itemFY !== selFY) return false;
      const monthStr = d.slice(5, 7);
      if (!isMonthInRange(monthStr, fromMonth, toMonth)) return false;
      return true;
    });
  };
  const filteredInvs = filterData(invs);
  const allExps = S.get(SK.EXP, []) || [];
  const filteredExps = filterData(allExps);
  const allPOs = S.get(SK.PO, []) || [];
  const filteredPOs = filterData(allPOs, "createdAt");
  const fromLabel = ((_a = MONTHS.find((m) => m[0] === fromMonth)) == null ? void 0 : _a[1]) || "Apr";
  const toLabel = ((_b = MONTHS.find((m) => m[0] === toMonth)) == null ? void 0 : _b[1]) || "Mar";
  const periodLabel = fromMonth === toMonth ? `${fromLabel} ${selFY}` : fromMonth === "04" && toMonth === "03" ? FY_LABEL(selFY) : `${fromLabel} - ${toLabel} ${selFY}`;
  const CARDS = [
    {
      icon: /* @__PURE__ */ React.createElement(Ic, { n: "chart", s: 20 }),
      label: "Sales Register",
      desc: "Invoices with HSN, tax breakup, customer details",
      color: "var(--green)",
      count: filteredInvs.length,
      unit: "invoices",
      action: () => makeExcel(filteredInvs),
      btnLabel: "Download",
      btnCls: "btn-success"
    },
    {
      icon: /* @__PURE__ */ React.createElement(Ic, { n: "building", s: 20 }),
      label: "GSTR-1 Report",
      desc: "B2B, B2C, HSN Summary and CDNR sheets",
      color: "var(--primary2)",
      count: filteredInvs.filter((i) => i.docType !== "CREDIT NOTE" && i.docType !== "DEBIT NOTE").length,
      unit: "invoices",
      action: () => makeGSTR1(filteredInvs),
      btnLabel: "Download",
      btnCls: "btn-outline-primary"
    },
    {
      icon: /* @__PURE__ */ React.createElement(Ic, { n: "receipt", s: 20 }),
      label: "Purchase Register",
      desc: "Expenses and purchase bills with monthly summary",
      color: "var(--gold)",
      count: filteredExps.length,
      unit: "records",
      action: () => makePurchaseExcel(filteredExps),
      btnLabel: "Download",
      btnCls: "btn-outline"
    },
    {
      icon: /* @__PURE__ */ React.createElement(Ic, { n: "cart", s: 20 }),
      label: "PO Register",
      desc: "Purchase Orders with vendor, items and status",
      color: "var(--cyan)",
      count: filteredPOs.length,
      unit: "POs",
      action: () => makePOExcel(filteredPOs),
      btnLabel: "Download",
      btnCls: "btn-outline-primary"
    }
  ];
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: "var(--text3)", flexShrink: 0 } }, "Filter:"), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", minWidth: 145 } }, /* @__PURE__ */ React.createElement(
    "select",
    {
      value: selFY,
      onChange: (e) => setSelFY(parseInt(e.target.value)),
      style: {
        width: "100%",
        fontSize: 12,
        fontWeight: 700,
        padding: "8px 36px 8px 36px",
        borderRadius: 10,
        cursor: "pointer",
        fontFamily: "inherit",
        background: "linear-gradient(135deg, #E0E7FF, #C7D2FE)",
        color: "#1E1B4B",
        border: "2px solid #4F6FE8",
        boxShadow: "0 2px 8px rgba(79,111,232,0.25)",
        outline: "none",
        appearance: "none",
        WebkitAppearance: "none",
        MozAppearance: "none",
        transition: "all 0.2s ease"
      },
      onMouseEnter: (e) => {
        e.target.style.boxShadow = "0 4px 16px rgba(79,111,232,0.4)";
        e.target.style.transform = "translateY(-1px)";
      },
      onMouseLeave: (e) => {
        e.target.style.boxShadow = "0 2px 8px rgba(79,111,232,0.25)";
        e.target.style.transform = "translateY(0)";
      }
    },
    allFYs.map((y) => /* @__PURE__ */ React.createElement("option", { key: y, value: y }, FY_LABEL(y)))
  ), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#3B57C9" } }, /* @__PURE__ */ React.createElement(Ic, { n: "calendar", s: 14 })), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#3B57C9" } }, /* @__PURE__ */ React.createElement("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement("path", { d: "M6 8L2 4h8z", fill: "currentColor" })))), /* @__PURE__ */ React.createElement("div", { style: { width: 1, height: 20, background: "var(--border)", flexShrink: 0 } }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 600, color: "var(--text3)" } }, "From:"), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", minWidth: 95 } }, /* @__PURE__ */ React.createElement(
    "select",
    {
      value: fromMonth,
      onChange: (e) => setFromMonth(e.target.value),
      style: {
        width: "100%",
        fontSize: 12,
        fontWeight: 700,
        padding: "7px 28px 7px 10px",
        borderRadius: 9,
        cursor: "pointer",
        fontFamily: "inherit",
        background: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
        color: "#78350F",
        border: "2px solid #F1495C",
        boxShadow: "0 2px 8px rgba(245,158,11,0.2)",
        outline: "none",
        appearance: "none",
        WebkitAppearance: "none",
        MozAppearance: "none",
        transition: "all 0.2s ease"
      },
      onMouseEnter: (e) => {
        e.target.style.boxShadow = "0 4px 14px rgba(245,158,11,0.35)";
        e.target.style.transform = "translateY(-1px)";
      },
      onMouseLeave: (e) => {
        e.target.style.boxShadow = "0 2px 8px rgba(245,158,11,0.2)";
        e.target.style.transform = "translateY(0)";
      }
    },
    MONTHS.map(([v, l]) => /* @__PURE__ */ React.createElement("option", { key: v, value: v }, l))
  ), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#78350F" } }, /* @__PURE__ */ React.createElement("svg", { width: "10", height: "10", viewBox: "0 0 12 12", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement("path", { d: "M6 8L2 4h8z", fill: "currentColor" }))))), /* @__PURE__ */ React.createElement("div", { style: { color: "var(--text3)", fontSize: 14, fontWeight: 700 } }, "\u2192"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 600, color: "var(--text3)" } }, "To:"), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", minWidth: 95 } }, /* @__PURE__ */ React.createElement(
    "select",
    {
      value: toMonth,
      onChange: (e) => setToMonth(e.target.value),
      style: {
        width: "100%",
        fontSize: 12,
        fontWeight: 700,
        padding: "7px 28px 7px 10px",
        borderRadius: 9,
        cursor: "pointer",
        fontFamily: "inherit",
        background: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
        color: "#78350F",
        border: "2px solid #F1495C",
        boxShadow: "0 2px 8px rgba(245,158,11,0.2)",
        outline: "none",
        appearance: "none",
        WebkitAppearance: "none",
        MozAppearance: "none",
        transition: "all 0.2s ease"
      },
      onMouseEnter: (e) => {
        e.target.style.boxShadow = "0 4px 14px rgba(245,158,11,0.35)";
        e.target.style.transform = "translateY(-1px)";
      },
      onMouseLeave: (e) => {
        e.target.style.boxShadow = "0 2px 8px rgba(245,158,11,0.2)";
        e.target.style.transform = "translateY(0)";
      }
    },
    MONTHS.map(([v, l]) => /* @__PURE__ */ React.createElement("option", { key: v, value: v }, l))
  ), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#78350F" } }, /* @__PURE__ */ React.createElement("svg", { width: "10", height: "10", viewBox: "0 0 12 12", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement("path", { d: "M6 8L2 4h8z", fill: "currentColor" }))))), /* @__PURE__ */ React.createElement("div", { style: { marginLeft: "auto", fontSize: 12, color: "var(--text3)", fontWeight: 600, flexShrink: 0, display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--primary-bg)", border: "1px solid var(--primary)", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "var(--primary2)", display: "flex", alignItems: "center", gap: 5 } }, /* @__PURE__ */ React.createElement(Ic, { n: "database", s: 13 }), /* @__PURE__ */ React.createElement("span", null, allFYs.length, " Year", allFYs.length > 1 ? "s" : "")), /* @__PURE__ */ React.createElement(Ic, { n: "calendar", s: 16 }), " ", periodLabel)), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 } }, CARDS.map((c) => /* @__PURE__ */ React.createElement("div", { key: c.label, style: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 28, flexShrink: 0 } }, c.icon), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--text)", fontSize: 13 } }, c.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", marginBottom: 8, lineHeight: 1.4 } }, c.desc), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: `btn btn-sm ${c.btnCls}`, onClick: c.action, disabled: c.count === 0, style: { opacity: c.count === 0 ? 0.45 : 1 } }, /* @__PURE__ */ React.createElement(Ic, { n: "xlsx", s: 12 }), c.btnLabel), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: c.count > 0 ? c.color : "var(--text3)", fontWeight: 600 } }, c.count, " ", c.unit)))))), /* @__PURE__ */ React.createElement("div", { style: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 28, flexShrink: 0 } }, /* @__PURE__ */ React.createElement(Ic, { n: "package", s: 16 })), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--text)", fontSize: 13, marginBottom: 2 } }, "Full Data Backup"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", marginBottom: 8 } }, "13-sheet Excel: Company, Sales, Purchases, POs, Customers, HSN, P&L, Audit + JSON backup"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary btn-sm", onClick: () => {
    makeFullExcel();
    logAudit("BACKUP_EXPORTED", "Full data backup \u2014 Excel (13-sheet)", currentUser);
  } }, /* @__PURE__ */ React.createElement(Ic, { n: "xlsx", s: 12 }), "Excel Backup"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", onClick: () => {
    const data = {
      exportDate: (/* @__PURE__ */ new Date()).toISOString(),
      company: S.get(SK.CO, {}),
      hsn: S.get(SK.HSN, []),
      invoices: S.get(SK.INV, []),
      expenses: S.get(SK.EXP, []),
      purchaseOrders: S.get(SK.PO, []),
      customers: S.get(SK.CUST, []),
      products: S.get(SK.PRODUCTS, []),
      terms: S.get(SK.TERMS, ""),
      poTerms: S.get(SK.PO_TERMS, ""),
      auditLog: S.get(SK.AUDIT, []),
      frozenPeriods: S.get(SK.FREEZE, { sales: [], expenses: [] }),
      bankTxns: S.get(SK.BANK, []),
      bankAccounts: S.get(SK.BANK_ACCTS, []),
      quickSales: S.get(SK.QSALE, []),
      quotations: S.get(SK.QUOTE, []),
      deliveryChallans: S.get(SK.DC, []),
      recurring: S.get(SK.RECUR, []),
      series: S.get(SK.SERIES, {}),
      stockLog: S.get(SK.STOCK, []),
      journal: S.get(SK.JOURNAL, []),
      coaCustom: S.get(SK.COA_CUSTOM, []),
      accMap: S.get(SK.ACCMAP, {}),
      bankRules: S.get(SK.BANK_RULES, [])
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ArcticBooks_Backup_${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logAudit("BACKUP_EXPORTED", `Full data backup \u2014 JSON (${(data.invoices || []).length} invoices, ${(data.expenses || []).length} expenses)`, currentUser);
    toast.success(`JSON backup: ${(data.invoices || []).length} invoices, ${(data.expenses || []).length} expenses`);
  } }, /* @__PURE__ */ React.createElement(Ic, { n: "save", s: 12 }), "JSON"), /* @__PURE__ */ React.createElement("input", { type: "file", id: "__restoreInput", accept: ".json", style: { display: "none" }, onChange: (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data || typeof data !== "object" || !data.invoices && !data.company) {
          toast.error("This does not look like an Arctic Books backup file");
          return;
        }
        if (!window.confirm(`This will REPLACE all current data with the backup dated ${data.exportDate ? new Date(data.exportDate).toLocaleString() : "unknown"} (${(data.invoices || []).length} invoices, ${(data.expenses || []).length} expenses). This cannot be undone. Continue?`)) return;
        const map = [
          [SK.CO, "company", {}],
          [SK.HSN, "hsn", []],
          [SK.INV, "invoices", []],
          [SK.EXP, "expenses", []],
          [SK.PO, "purchaseOrders", []],
          [SK.CUST, "customers", []],
          [SK.PRODUCTS, "products", []],
          [SK.TERMS, "terms", ""],
          [SK.PO_TERMS, "poTerms", ""],
          [SK.AUDIT, "auditLog", []],
          [SK.FREEZE, "frozenPeriods", { sales: [], expenses: [] }],
          [SK.BANK, "bankTxns", []],
          [SK.BANK_ACCTS, "bankAccounts", []],
          [SK.QSALE, "quickSales", []],
          [SK.QUOTE, "quotations", []],
          [SK.DC, "deliveryChallans", []],
          [SK.RECUR, "recurring", []],
          [SK.SERIES, "series", {}],
          [SK.STOCK, "stockLog", []]
        ];
        map.forEach(([key, field, dflt]) => {
          if (data[field] !== void 0) S.set(key, data[field]);
          else S.set(key, dflt);
        });
        [[SK.JOURNAL, "journal"], [SK.COA_CUSTOM, "coaCustom"], [SK.ACCMAP, "accMap"], [SK.BANK_RULES, "bankRules"]].forEach(([key, field]) => {
          if (data[field] !== void 0) S.set(key, data[field]);
        });
        logAudit("DATA_RESTORED", `Restored from backup dated ${data.exportDate || "unknown"}`, currentUser);
        toast.success("Backup restored! Reloading\u2026");
        setTimeout(() => window.location.reload(), 1200);
      } catch (err) {
        toast.error("Could not read backup file: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  } }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", style: { borderColor: "var(--red)", color: "var(--red)" }, onClick: () => document.getElementById("__restoreInput").click() }, /* @__PURE__ */ React.createElement(Ic, { n: "upload", s: 12 }), "Restore from Backup"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text3)" } }, "Full database backup \u2014 not filtered by period")))));
};
