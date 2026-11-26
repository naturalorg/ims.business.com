const AdminPanel = ({ currentUser, onClose, inline = false }) => {
  const [tab, setTab] = useState("dashboard");
  const [users, setUsers] = useState(() => {
    const u = S.get(SK.USERS, []);
    return Array.isArray(u) ? u : [];
  });
  useEffect(() => {
    getDb().ref("invoicepro/" + SK.USERS).once("value").then((snap) => {
      const val = snap.val();
      if (val && Array.isArray(val)) {
        _cache[SK.USERS] = val;
        setUsers(val);
      } else if (val && typeof val === "object") {
        const arr = Object.values(val);
        _cache[SK.USERS] = arr;
        setUsers(arr);
      }
    }).catch(() => {
    });
  }, []);
  const [uForm, setUForm] = useState({ email: "", name: "", password: "", role: "user", active: true });
  const [editUID, setEditUID] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [auditQ, setAuditQ] = useState("");
  const [auditData, setAuditData] = useState(() => S.get(SK.AUDIT, []));
  const modalBodyRef = useRef();
  useEffect(() => {
    if (tab === "audit") {
      setAuditData(S.get(SK.AUDIT, []));
      getDb().ref("invoicepro/" + SK.AUDIT).once("value").then((snap) => {
        const val = snap.val();
        if (val) {
          _cache[SK.AUDIT] = val;
          setAuditData(Array.isArray(val) ? val : Object.values(val));
        }
      }).catch(() => {
      });
    }
  }, [tab]);
  useEffect(() => {
    const timer = setInterval(() => {
      getDb().ref("invoicepro/" + SK.AUDIT).once("value").then((snap) => {
        const val = snap.val();
        if (val) {
          _cache[SK.AUDIT] = val;
          setAuditData(Array.isArray(val) ? val : Object.values(val));
        } else {
          setAuditData(S.get(SK.AUDIT, []));
        }
      }).catch(() => setAuditData(S.get(SK.AUDIT, [])));
    }, 10 * 60 * 1e3);
    return () => clearInterval(timer);
  }, []);
  const invs = S.get(SK.INV, []);
  const co = S.get(SK.CO, {});
  const isSuper = isSuperAdmin(currentUser == null ? void 0 : currentUser.email);
  const total = invs.reduce((s, i) => s + getGrand(i), 0);
  const mn = /* @__PURE__ */ new Date(), mInvs = invs.filter((i) => {
    const d = new Date(i.date || "");
    return d.getMonth() === mn.getMonth() && d.getFullYear() === mn.getFullYear();
  });
  const cnCount = invs.filter((i) => i.docType === "CREDIT NOTE").length;
  const dnCount = invs.filter((i) => i.docType === "DEBIT NOTE").length;
  const hsnCount = S.get(SK.HSN, []).length;
  const expenses = S.get(SK.EXP, []);
  const totalExp = expenses.reduce((s, e) => s + (parseFloat(e.total) || 0), 0);
  const netProfit = total - totalExp;
  const saveUser = async () => {
    if (!uForm.email || !uForm.name) {
      toast.error("Name and email are required");
      return;
    }
    if (!uForm.email.includes("@")) {
      toast.error("Valid email required");
      return;
    }
    if (!isSuper && uForm.role === "superadmin") {
      toast.error("Only Super Admin can assign Super Admin role");
      return;
    }
    if (!editUID) {
      if (users.find((u) => u.email.toLowerCase() === uForm.email.toLowerCase())) {
        toast.error("Email already exists");
        return;
      }
      try {
        await adminCreateAuthUser(uForm.email.trim());
      } catch (e) {
        toast.error("Could not create login: " + (e.message || e.code));
        return;
      }
    }
    let updated;
    if (editUID) {
      updated = users.map((u) => {
        if (u.id !== editUID) return u;
        const m = { ...u, ...uForm };
        delete m.password;
        return m;
      });
    } else {
      if (users.find((u) => u.email.toLowerCase() === uForm.email.toLowerCase())) {
        toast.error("Email already exists");
        return;
      }
      const newU = { id: Date.now().toString(), ...uForm, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
      delete newU.password;
      updated = [...users, newU];
    }
    setUsers(updated);
    _cache[SK.USERS] = updated;
    try {
      localStorage.setItem(SK.USERS, JSON.stringify(updated));
    } catch (e) {
    }
    getDb().ref("invoicepro/" + SK.USERS).set(updated).then(() => {
      logAudit(editUID ? "USER_EDITED" : "USER_CREATED", `${uForm.name} (${uForm.email}) role:${uForm.role}`, currentUser);
    }).catch((e) => {
      console.warn("Firebase user write failed:", e.message);
      logAudit(editUID ? "USER_EDITED" : "USER_CREATED", `${uForm.name} (${uForm.email}) role:${uForm.role}`, currentUser);
    });
    setUForm({ email: "", name: "", password: "", role: "user", active: true });
    setEditUID(null);
    toast.success(editUID ? "User updated!" : "User created! A password-setup email was sent to them.");
  };
  const delUser = (id) => {
    if (!isSuper) {
      toast.error("Only Super Admin can delete users");
      return;
    }
    const u = users.find((u2) => u2.id === id);
    if (isSuperAdmin(u == null ? void 0 : u.email)) {
      toast.error("Cannot delete Super Admin");
      return;
    }
    if (id === currentUser.id) {
      toast.error("Cannot delete yourself");
      return;
    }
    if (!window.confirm(`Delete user "${u == null ? void 0 : u.name}"?`)) return;
    const updated = users.filter((u2) => u2.id !== id);
    setUsers(updated);
    _cache[SK.USERS] = updated;
    try {
      localStorage.setItem(SK.USERS, JSON.stringify(updated));
    } catch (e) {
    }
    getDb().ref("invoicepro/" + SK.USERS).set(updated).catch((e) => console.warn("Firebase write:", e.message));
    logAudit("USER_DELETED", `${u == null ? void 0 : u.name} (${u == null ? void 0 : u.email})`, currentUser);
    toast.info("User deleted");
  };
  const editUser = (u) => {
    if (isSuperAdmin(u.email) && !isSuper) {
      toast.error("Only Super Admin can edit Super Admin credentials");
      return;
    }
    setUForm({ email: u.email, name: u.name, password: "", role: u.role, active: u.active });
    setEditUID(u.id);
    setTab("users");
    setTimeout(() => {
      var _a;
      return (_a = modalBodyRef.current) == null ? void 0 : _a.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  };
  const toggleActive = (id) => {
    const u = users.find((u2) => u2.id === id);
    if (isSuperAdmin(u == null ? void 0 : u.email)) {
      toast.error("Cannot deactivate Super Admin");
      return;
    }
    const updated = users.map((u2) => u2.id === id ? { ...u2, active: !u2.active } : u2);
    setUsers(updated);
    _cache[SK.USERS] = updated;
    try {
      localStorage.setItem(SK.USERS, JSON.stringify(updated));
    } catch (e) {
    }
    getDb().ref("invoicepro/" + SK.USERS).set(updated).catch((e) => console.warn("Firebase write:", e.message));
    logAudit("USER_TOGGLED", `${u == null ? void 0 : u.name} \u2192 ${(u == null ? void 0 : u.active) ? "Inactive" : "Active"}`, currentUser);
  };
  const auditLogs = auditData.filter(
    (l) => !auditQ || (l.action || "").toLowerCase().includes(auditQ.toLowerCase()) || (getAuditMeta(l.action).module || "").toLowerCase().includes(auditQ.toLowerCase()) || (getAuditMeta(l.action).action || "").toLowerCase().includes(auditQ.toLowerCase()) || (l.detail || "").toLowerCase().includes(auditQ.toLowerCase()) || (l.userName || "").toLowerCase().includes(auditQ.toLowerCase())
  );
  const roleBadge = (r) => r === "superadmin" ? { cls: "badge-gold", label: "Super Admin" } : r === "admin" ? { cls: "badge-primary", label: "Admin" } : r === "accountant" ? { cls: "badge-primary", label: "Accountant" } : r === "sales" ? { cls: "badge-green", label: "Sales" } : { cls: "badge-green", label: "User" };
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay", onClick: inline ? void 0 : ((e) => e.target === e.currentTarget && onClose()) }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal", style: { ...inline ? {} : { maxWidth: "min(1100px, 95vw)", width: "100%" } } }, /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 22 } }, isSuper ? /* @__PURE__ */ React.createElement(Ic, { n: "crown", s: 22 }) : /* @__PURE__ */ React.createElement(Ic, { n: "shield", s: 22 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "modal-title" }, isSuper ? "Super Admin Panel" : "Admin Panel"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)" } }, "Logged in as: ", currentUser.name, " ", isSuper && /* @__PURE__ */ React.createElement("span", { style: { color: "var(--gold)", fontWeight: 700 } }, "\u2605 Super Admin")))), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Ic, { n: "x" }))), /* @__PURE__ */ React.createElement("div", { className: "modal-body", ref: modalBodyRef }, /* @__PURE__ */ React.createElement("div", { className: "admin-tabs" }, [
    { k: "dashboard", icon: null, label: "Dashboard" },
    { k: "users", icon: null, label: "Users" },
    { k: "invoices", icon: null, label: "All Invoices" },
    { k: "audit", icon: null, label: "Audit Log" },
    { k: "export", icon: null, label: "Export Data" },
    { k: "freeze", icon: "lock", label: "Period Lock" },
    { k: "series", icon: "hash", label: "Series" }
  ].map(({ k, icon, label }) => /* @__PURE__ */ React.createElement("button", { key: k, className: `admin-tab${tab === k ? " active" : ""}`, onClick: () => setTab(k) }, icon && /* @__PURE__ */ React.createElement(Ic, { n: icon, s: 14 }), " ", label))), tab === "dashboard" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "g4", style: { marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "stat-card", style: { background: "linear-gradient(135deg,#1E3A8A,#1D4ED8)" } }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { color: "#fff" } }, invs.length), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl", style: { color: "rgba(255,255,255,0.7)" } }, "Total Records")), /* @__PURE__ */ React.createElement("div", { className: "stat-card", style: { background: "linear-gradient(135deg,#064E3B,#065F46)" } }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { color: "#6EE7B7", fontSize: 16 } }, fmt(total)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl", style: { color: "rgba(255,255,255,0.7)" } }, "Net Revenue")), /* @__PURE__ */ React.createElement("div", { className: "stat-card", style: { background: "linear-gradient(135deg,#7F1D1D,#991B1B)" } }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { color: "#FCA5A5", fontSize: 16 } }, fmt(totalExp)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl", style: { color: "rgba(255,255,255,0.7)" } }, "Total Expenses")), /* @__PURE__ */ React.createElement("div", { className: "stat-card", style: { background: netProfit >= 0 ? "linear-gradient(135deg,#14532D,#15803D)" : "linear-gradient(135deg,#450A0A,#7F1D1D)" } }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { color: netProfit >= 0 ? "#86EFAC" : "#FCA5A5", fontSize: 16 } }, fmt(netProfit)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl", style: { color: "rgba(255,255,255,0.7)" } }, "Net Profit"))), /* @__PURE__ */ React.createElement("div", { className: "g4", style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "stat-card", style: { background: "linear-gradient(135deg,#78350F,#92400E)" } }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { color: "#FCD34D" } }, mInvs.length), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl", style: { color: "rgba(255,255,255,0.7)" } }, "This Month")), /* @__PURE__ */ React.createElement("div", { className: "stat-card", style: { background: "linear-gradient(135deg,#4A044E,#701A75)" } }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { color: "#E879F9", fontSize: 16 } }, fmt(mInvs.reduce((s, i) => s + getGrand(i), 0))), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl", style: { color: "rgba(255,255,255,0.7)" } }, "Month Revenue")), /* @__PURE__ */ React.createElement("div", { className: "stat-card", style: { background: "linear-gradient(135deg,#1C1917,#292524)" } }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { color: "#D6D3D1", fontSize: 16 } }, fmt(expenses.filter((e) => {
    const d = new Date(e.date || "");
    return d.getMonth() === mn.getMonth() && d.getFullYear() === mn.getFullYear();
  }).reduce((s, e) => s + (parseFloat(e.total) || 0), 0))), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl", style: { color: "rgba(255,255,255,0.7)" } }, "Month Expenses")), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val" }, expenses.length), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Purchase Records"))), /* @__PURE__ */ React.createElement("div", { className: "g3" }, /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val" }, users.length), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "App Users")), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val" }, hsnCount), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "HSN Entries")), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val" }, co.name || "\u2014"), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Company")), /* @__PURE__ */ React.createElement("div", { className: "stat-card", style: { borderLeft: "3px solid #B45309" } }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { color: "#B45309" } }, dnCount), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Debit Notes")), /* @__PURE__ */ React.createElement("div", { className: "stat-card", style: { borderLeft: "3px solid #065F46" } }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { color: "#065F46" } }, cnCount), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Credit Notes")))), tab === "users" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: 18 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--primary2)", marginBottom: 14, fontSize: 13 } }, editUID ? "\u270F\uFE0F Edit User" : " Add New User"), !isSuper && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#B45309", background: "#FEF3C7", padding: "6px 10px", borderRadius: 6, marginBottom: 12, border: "1px solid #FDE68A" } }, /* @__PURE__ */ React.createElement(Ic, { n: "info", s: 14 }), " As Admin you can create and edit users. Only Super Admin can delete users or assign Super Admin role."), /* @__PURE__ */ React.createElement("div", { className: "g2" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Full Name *"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: uForm.name, onChange: (e) => setUForm((p) => ({ ...p, name: e.target.value })), placeholder: "Full Name" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Email Address *"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: uForm.email, onChange: (e) => setUForm((p) => ({ ...p, email: e.target.value })), placeholder: "user@company.com", type: "email" }))), /* @__PURE__ */ React.createElement("div", { className: "g3" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Password"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text3)", padding: "9px 0", lineHeight: 1.5 } }, "Not set by admin. The user gets an email to choose their own password, and can use \u201CForgot password?\u201D any time.")), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Role"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: uForm.role, onChange: (e) => setUForm((p) => ({ ...p, role: e.target.value })) }, /* @__PURE__ */ React.createElement("option", { value: "user" }, "User (full access)"), /* @__PURE__ */ React.createElement("option", { value: "sales" }, "Sales (invoices, history, customers only)"), /* @__PURE__ */ React.createElement("option", { value: "accountant" }, "Accountant (billing, purchases, inventory, ageing, bank recon \u2014 no admin/company settings)"), /* @__PURE__ */ React.createElement("option", { value: "admin" }, "Admin"), isSuper && /* @__PURE__ */ React.createElement("option", { value: "superadmin" }, "Super Admin"))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Status"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: uForm.active ? "1" : "0", onChange: (e) => setUForm((p) => ({ ...p, active: e.target.value === "1" })) }, /* @__PURE__ */ React.createElement("option", { value: "1" }, "Active"), /* @__PURE__ */ React.createElement("option", { value: "0" }, "Inactive")))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: saveUser }, editUID ? "Update User" : "Create User"), editUID && /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: () => {
    setUForm({ email: "", name: "", password: "", role: "user", active: true });
    setEditUID(null);
  } }, "Cancel"))), /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Name"), /* @__PURE__ */ React.createElement("th", null, "Email"), /* @__PURE__ */ React.createElement("th", null, "Role"), /* @__PURE__ */ React.createElement("th", null, "Status"), /* @__PURE__ */ React.createElement("th", null, "Created"), /* @__PURE__ */ React.createElement("th", { style: { width: isSuper ? 140 : 100 } }, "Actions"))), /* @__PURE__ */ React.createElement("tbody", null, users.map((u) => {
    var _a;
    const rb = roleBadge(u.role);
    return /* @__PURE__ */ React.createElement("tr", { key: u.id }, /* @__PURE__ */ React.createElement("td", { style: { fontWeight: 600 } }, u.name, isSuperAdmin(u.email) && /* @__PURE__ */ React.createElement("span", { style: { color: "var(--gold)", fontSize: 11, marginLeft: 4 } }, "\u2605")), /* @__PURE__ */ React.createElement("td", { style: { color: "var(--text2)" } }, u.email), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: `badge ${rb.cls}` }, rb.label)), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(
      "span",
      {
        className: `badge ${u.active ? "badge-green" : "badge-red"}`,
        style: { cursor: isSuperAdmin(u.email) ? "default" : "pointer" },
        onClick: () => !isSuperAdmin(u.email) && toggleActive(u.id)
      },
      u.active ? "Active" : "Inactive"
    )), /* @__PURE__ */ React.createElement("td", { style: { color: "var(--text3)", fontSize: 12 } }, ((_a = u.createdAt) == null ? void 0 : _a.split("T")[0]) || "\u2014"), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "btn btn-xs btn-outline",
        onClick: () => editUser(u),
        disabled: isSuperAdmin(u.email) && !isSuper,
        style: { opacity: isSuperAdmin(u.email) && !isSuper ? 0.3 : 1, cursor: isSuperAdmin(u.email) && !isSuper ? "not-allowed" : "pointer" },
        title: isSuperAdmin(u.email) && !isSuper ? "Super Admin credentials are protected" : "Edit user"
      },
      /* @__PURE__ */ React.createElement(Ic, { n: "edit", s: 11 }),
      "Edit"
    ), isSuper && !isSuperAdmin(u.email) && /* @__PURE__ */ React.createElement("button", { className: "btn btn-xs btn-danger", onClick: () => delUser(u.id) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 11 })))));
  }))))), tab === "audit" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text2)", fontSize: 13, fontWeight: 600 } }, "Audit Log \u2014 ", auditLogs.length, " entries ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "var(--text3)", fontWeight: 400 } }, "(auto-refreshes every 10 min)")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: () => {
    const localLogs = S.get(SK.AUDIT, []);
    setAuditData(localLogs);
    getDb().ref("invoicepro/" + SK.AUDIT).once("value").then((snap) => {
      const val = snap.val();
      if (val) {
        const arr = Array.isArray(val) ? val : Object.values(val);
        _cache[SK.AUDIT] = arr;
        setAuditData(arr);
        toast.success(`Audit log refreshed \u2014 ${arr.length} entries`);
      } else {
        toast.info(`Showing ${localLogs.length} local entries`);
      }
    }).catch(() => {
      toast.info(`Showing ${localLogs.length} local entries`);
    });
  } }, /* @__PURE__ */ React.createElement(Ic, { n: "refresh", s: 12 }), "Refresh Now"), isSuper && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-success", onClick: () => makeAuditExcel(auditLogs.length > 0 ? auditLogs : auditData) }, /* @__PURE__ */ React.createElement(Ic, { n: "xlsx", s: 12 }), "Export Excel"), isSuper && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger", onClick: () => {
    if (window.confirm("Clear all audit logs?")) {
      S.set(SK.AUDIT, []);
      setAuditData([]);
      toast.info("Audit log cleared");
    }
  } }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 16 }), "\uFE0F Clear"))), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", zIndex: 1 } }, /* @__PURE__ */ React.createElement(Ic, { n: "search", s: 14 })), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: auditQ, onChange: (e) => setAuditQ(e.target.value), placeholder: "Search by module, action, user or detail...", style: { paddingLeft: 38, width: "100%" } })), auditLogs.length > 0 ? /* @__PURE__ */ React.createElement("div", { style: { border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", maxHeight: "52vh", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "150px 130px 1fr 130px 160px", gap: 0, padding: "9px 16px", background: "var(--card2)", borderBottom: "2px solid var(--border2)", fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px", position: "sticky", top: 0 } }, /* @__PURE__ */ React.createElement("span", null, "Module"), /* @__PURE__ */ React.createElement("span", null, "Action"), /* @__PURE__ */ React.createElement("span", null, "Detail"), /* @__PURE__ */ React.createElement("span", null, "By"), /* @__PURE__ */ React.createElement("span", null, "When")), auditLogs.map((l, i) => {
    const meta = getAuditMeta(l.action);
    return /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "grid", gridTemplateColumns: "150px 130px 1fr 130px 160px", gap: 0, padding: "9px 16px", borderBottom: "1px solid var(--border)", alignItems: "start" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: "var(--text)" } }, meta.module), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, color: meta.color, background: meta.color + "22", padding: "2px 7px", borderRadius: 8, display: "inline-block" } }, meta.action), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "var(--text)", paddingRight: 8, lineHeight: 1.5 } }, l.detail), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text2)", fontWeight: 600 } }, l.userName), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "var(--text3)", fontFamily: "monospace" } }, new Date(l.ts).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })));
  })) : /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "40px", color: "var(--text3)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 32, marginBottom: 8 } }, /* @__PURE__ */ React.createElement(Ic, { n: "list", s: 32 })), /* @__PURE__ */ React.createElement("div", null, "No audit entries yet. Actions will appear here."))), tab === "invoices" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text2)", fontSize: 13 } }, invs.length, " invoices total"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-success btn-sm", onClick: () => makeExcel(invs) }, /* @__PURE__ */ React.createElement(Ic, { n: "xlsx", s: 13 }), "Download Sales Register (Excel)"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-primary btn-sm", style: { marginLeft: 8 }, onClick: () => makeGSTR1(invs) }, /* @__PURE__ */ React.createElement(Ic, { n: "xlsx", s: 13 }), "Download GSTR-1 (Excel)"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", style: { marginLeft: 8 }, onClick: () => makePurchaseExcel(S.get(SK.EXP, [])) }, /* @__PURE__ */ React.createElement(Ic, { n: "xlsx", s: 13 }), "Download Purchase Register")), /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Invoice No"), /* @__PURE__ */ React.createElement("th", null, "Date"), /* @__PURE__ */ React.createElement("th", null, "Time"), /* @__PURE__ */ React.createElement("th", null, "Customer"), /* @__PURE__ */ React.createElement("th", null, "GSTIN"), /* @__PURE__ */ React.createElement("th", null, "GST Type"), /* @__PURE__ */ React.createElement("th", null, "Total"), /* @__PURE__ */ React.createElement("th", null, "By"))), /* @__PURE__ */ React.createElement("tbody", null, [...invs].sort((a, b) => new Date(b.date) - new Date(a.date)).map((inv, i) => {
    var _a, _b;
    return /* @__PURE__ */ React.createElement("tr", { key: i }, /* @__PURE__ */ React.createElement("td", { style: { fontFamily: "monospace", fontWeight: 700, color: "var(--gold)" } }, inv.invNo), /* @__PURE__ */ React.createElement("td", null, fmtDate(inv.date)), /* @__PURE__ */ React.createElement("td", { style: { color: "var(--text3)", fontSize: 12 } }, inv.time || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { fontWeight: 600 } }, ((_a = inv.billTo) == null ? void 0 : _a.name) || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { fontFamily: "monospace", fontSize: 12, color: "var(--text2)" } }, ((_b = inv.billTo) == null ? void 0 : _b.gstin) || "\u2014"), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: `badge ${inv.gstType === "INTRA" ? "badge-green" : "badge-blue"}` }, inv.gstType === "INTRA" ? "CGST+SGST" : "IGST")), /* @__PURE__ */ React.createElement("td", { style: { fontWeight: 700 } }, fmt(getGrand(inv))), /* @__PURE__ */ React.createElement("td", { style: { color: "var(--text3)", fontSize: 12 } }, inv.createdBy || "\u2014"));
  }))))), tab === "export" && /* @__PURE__ */ React.createElement(ExportTab, { invs, isSuper, currentUser }), tab === "freeze" && /* @__PURE__ */ React.createElement(FreezeTab, { invs, isSuper, currentUser }), tab === "series" && /* @__PURE__ */ React.createElement(SeriesTab, { isSuper, currentUser }))));
};
const Login = ({ onAuthed }) => {
  const [email, setEmail] = useState(""), [pw, setPw] = useState(""), [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState(""), [info, setInfo] = useState(""), [loading, setLoading] = useState(false);
  const qs = new URLSearchParams(window.location.search), aMode = qs.get("mode"), aCode = qs.get("oobCode");
  const [np, setNp] = useState(""), [acctEmail, setAcctEmail] = useState("");
  const [stage, setStage] = useState(aMode === "resetPassword" && aCode ? "newpw" : "cred"), [code, setCode] = useState(""), [resolver, setResolver] = useState(null), [secret, setSecret] = useState(null);
  const qrRef = useRef();
  useEffect(() => {
    const { L, auth } = getFB();
    if (aMode === "resetPassword" && aCode) {
      L.verifyPasswordResetCode(auth, aCode).then((em) => {
        setAcctEmail(em);
        setEmail(em);
      }).catch(() => {
        setErr('This reset link is invalid or has expired. Request a new one with "Forgot password?".');
        setStage("cred");
      });
    } else if (aMode === "verifyEmail" && aCode) {
      L.applyActionCode(auth, aCode).then(() => setInfo("Email verified. You can sign in now.")).catch(() => {
      });
    }
  }, []);
  const [pasted, setPasted] = useState("");
  const usePasted = () => {
    try {
      const u = new URL(pasted.trim());
      if (!u.searchParams.get("oobCode")) throw new Error("x");
      window.location.href = window.location.pathname + u.search;
    } catch (e) {
      setErr("That does not look like a reset link. Copy the full link from the email and paste it here.");
    }
  };
  const setNewPw = async () => {
    if (np.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    setErr("");
    setLoading(true);
    const { L, auth } = getFB();
    try {
      await L.confirmPasswordReset(auth, aCode, np);
      window.history.replaceState({}, "", window.location.pathname);
      setNp("");
      setPw("");
      setStage("cred");
      setInfo("Password updated. Please sign in with your new password.");
      setLoading(false);
    } catch (e) {
      setErr('This link is invalid or has expired. Request a new one with "Forgot password?".');
      setLoading(false);
    }
  };
  const fail = (e) => {
    console.warn(e);
    const c = (e == null ? void 0 : e.code) || "";
    setErr(["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"].includes(c) ? "Invalid email or password." : c === "auth/too-many-requests" ? "Too many attempts. Wait a few minutes or reset your password." : c === "auth/invalid-verification-code" ? "Wrong code. Check your authenticator app and try again." : c === "auth/weak-password" ? "Your old password is too short for the new system. Contact your admin." : (e == null ? void 0 : e.message) || "Something went wrong.");
    setLoading(false);
  };
  const startEnrol = async () => {
    const { L, auth } = getFB();
    try {
      const s = await L.multiFactor(auth.currentUser).getSession();
      setSecret(await L.TotpMultiFactorGenerator.generateSecret(s));
      setStage("enrol");
      setLoading(false);
    } catch (e) {
      if (e.code === "auth/unverified-email") {
        try {
          await L.sendEmailVerification(auth.currentUser);
        } catch (x) {
        }
        setStage("verify");
        setLoading(false);
      } else fail(e);
    }
  };
  const afterSignIn = async () => {
    const { L, auth } = getFB();
    if (REQUIRE_2FA && L.multiFactor(auth.currentUser).enrolledFactors.length === 0) {
      await startEnrol();
    } else {
      await onAuthed();
    }
  };
  const legacyMigrate = async (em) => {
    try {
      const v = (await getDb().ref("invoicepro/" + SK.USERS).once("value")).val();
      const list = v ? Object.values(v) : [];
      const p = list.find((u) => u.email && u.email.toLowerCase() === em.toLowerCase() && u.password && u.password === pw && u.active);
      if (!p) return false;
      const { L, auth } = getFB();
      await L.createUserWithEmailAndPassword(auth, em, pw);
      await getDb().ref("invoicepro/" + SK.USERS).set(list.map((u) => {
        if (u.id !== p.id) return u;
        const c = { ...u };
        delete c.password;
        return c;
      }));
      await afterSignIn();
      return true;
    } catch (e) {
      if (e.code === "auth/email-already-in-use") return false;
      fail(e);
      return true;
    }
  };
  const login = async () => {
    setErr("");
    setInfo("");
    setLoading(true);
    const { L, auth } = getFB();
    const em = email.trim();
    try {
      await L.signInWithEmailAndPassword(auth, em, pw);
      await afterSignIn();
    } catch (e) {
      if (e.code === "auth/multi-factor-auth-required") {
        setResolver(L.getMultiFactorResolver(auth, e));
        setStage("mfa");
        setCode("");
        setLoading(false);
        return;
      }
      if (LEGACY_MIGRATION && ["auth/invalid-credential", "auth/user-not-found", "auth/wrong-password"].includes(e.code)) {
        if (await legacyMigrate(em)) return;
      }
      fail(e);
    }
  };
  const verifyMfa = async () => {
    setErr("");
    setLoading(true);
    const { L } = getFB();
    try {
      const h = resolver.hints.find((h2) => h2.factorId === "totp") || resolver.hints[0];
      await resolver.resolveSignIn(L.TotpMultiFactorGenerator.assertionForSignIn(h.uid, code.trim()));
      await onAuthed();
    } catch (e) {
      fail(e);
    }
  };
  const confirmEnrol = async () => {
    setErr("");
    setLoading(true);
    const { L, auth } = getFB();
    try {
      await L.multiFactor(auth.currentUser).enroll(L.TotpMultiFactorGenerator.assertionForEnrollment(secret, code.trim()), "Authenticator");
      await onAuthed();
    } catch (e) {
      fail(e);
    }
  };
  const afterVerify = async () => {
    setErr("");
    setLoading(true);
    const { auth } = getFB();
    try {
      await auth.currentUser.reload();
      await auth.currentUser.getIdToken(true);
      await startEnrol();
    } catch (e) {
      fail(e);
    }
  };
  const forgot = async () => {
    if (!email.includes("@")) {
      setErr("Enter your email above first.");
      return;
    }
    const { L, auth } = getFB();
    try {
      await L.sendPasswordResetEmail(auth, email.trim());
    } catch (e) {
      if (e.code === "auth/invalid-email") {
        fail(e);
        return;
      }
    }
    setErr("");
    setInfo("If this email has an account, a password reset link is on its way. Check your inbox (and spam).");
  };
  const cancel = async () => {
    try {
      await getFB().L.signOut(getFB().auth);
    } catch (e) {
    }
    setStage("cred");
    setPw("");
    setCode("");
    setErr("");
  };
  useEffect(() => {
    if (stage === "enrol" && secret && qrRef.current && window.QRCode) {
      qrRef.current.innerHTML = "";
      new QRCode(qrRef.current, { text: secret.generateQrCodeUrl(getFB().auth.currentUser.email, "Arctic Books"), width: 180, height: 180 });
    }
  }, [stage, secret]);
  const codeBox = (go) => /* @__PURE__ */ React.createElement("input", { className: "field-input", inputMode: "numeric", maxLength: 6, value: code, onChange: (e) => setCode(e.target.value.replace(/\D/g, "")), placeholder: "123456", style: { textAlign: "center", letterSpacing: 6, fontSize: 20 }, onKeyDown: (e) => e.key === "Enter" && go(), autoFocus: true });
  const btn = (label, fn, icon) => /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", style: { width: "100%", justifyContent: "center", padding: "11px", fontSize: 14 }, onClick: fn, disabled: loading }, loading ? /* @__PURE__ */ React.createElement("span", { className: "spinner" }) : /* @__PURE__ */ React.createElement(React.Fragment, null, icon && /* @__PURE__ */ React.createElement(Ic, { n: icon, s: 14 }), label));
  const link = (label, fn) => /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginTop: 12 } }, /* @__PURE__ */ React.createElement("a", { href: "#", onClick: (e) => {
    e.preventDefault();
    fn();
  }, style: { color: "var(--primary2)", fontSize: 12.5, fontWeight: 600, textDecoration: "none" } }, label));
  return /* @__PURE__ */ React.createElement("div", { className: "login-bg" }, /* @__PURE__ */ React.createElement("div", { className: "login-card" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 8 } }, /* @__PURE__ */ React.createElement(LogoIcon, { size: 44 }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "login-logo", style: { background: "linear-gradient(135deg,#4F6FE8,#F1495C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" } }, "Arctic Books"), /* @__PURE__ */ React.createElement("div", { className: "login-sub", style: { margin: 0, fontSize: 11 } }, "Complete Accounting Software"))), stage === "cred" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "login-title" }, "Welcome back"), /* @__PURE__ */ React.createElement("div", { className: "login-desc", style: { marginBottom: 28 } }, "Sign in to manage your invoices"), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Email Address"), /* @__PURE__ */ React.createElement("input", { className: "field-input", type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "you@company.com", onKeyDown: (e) => e.key === "Enter" && login() })), /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 20 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Password"), /* @__PURE__ */ React.createElement("div", { className: "pw-wrap" }, /* @__PURE__ */ React.createElement("input", { className: "field-input", type: showPw ? "text" : "password", value: pw, onChange: (e) => setPw(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", onKeyDown: (e) => e.key === "Enter" && login() }), /* @__PURE__ */ React.createElement("button", { className: "pw-eye", onClick: () => setShowPw((p) => !p) }, showPw ? /* @__PURE__ */ React.createElement(Ic, { n: "eyeoff", s: 14 }) : /* @__PURE__ */ React.createElement(Ic, { n: "eye", s: 14 }))))), stage === "mfa" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "login-title" }, "Two-step verification"), /* @__PURE__ */ React.createElement("div", { className: "login-desc" }, "Open Google Authenticator and enter the 6-digit code for Arctic Books."), /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 20 } }, codeBox(verifyMfa))), stage === "verify" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "login-title" }, "Verify your email"), /* @__PURE__ */ React.createElement("div", { className: "login-desc" }, "We emailed a verification link to your address. Click it, then press Continue to set up Google Authenticator.")), stage === "enrol" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "login-title" }, "Set up Google Authenticator"), /* @__PURE__ */ React.createElement("div", { className: "login-desc" }, "1. Install Google Authenticator on your phone.", /* @__PURE__ */ React.createElement("br", null), "2. Tap + and scan this QR code.", /* @__PURE__ */ React.createElement("br", null), "3. Enter the 6-digit code it shows."), /* @__PURE__ */ React.createElement("div", { ref: qrRef, style: { display: "flex", justifyContent: "center", background: "#fff", padding: 10, borderRadius: 10, margin: "0 auto 10px", width: 200 } }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", textAlign: "center", marginBottom: 14, wordBreak: "break-all" } }, "Can't scan? Enter this key manually:", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("b", { style: { color: "var(--text2)" } }, secret == null ? void 0 : secret.secretKey)), /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 20 } }, codeBox(confirmEnrol))), stage === "paste" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "login-title" }, "Use your reset link"), /* @__PURE__ */ React.createElement("div", { className: "login-desc" }, "In the email, right-click the reset link, choose Copy link address, and paste it here."), /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 20 } }, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: pasted, onChange: (e) => setPasted(e.target.value), placeholder: "https://...", onKeyDown: (e) => e.key === "Enter" && usePasted(), autoFocus: true }))), stage === "newpw" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "login-title" }, "Set a new password"), /* @__PURE__ */ React.createElement("div", { className: "login-desc" }, acctEmail ? "For " + acctEmail : "Checking your link\u2026"), /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 20 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "New password"), /* @__PURE__ */ React.createElement("input", { className: "field-input", type: "password", value: np, onChange: (e) => setNp(e.target.value), placeholder: "At least 6 characters", onKeyDown: (e) => e.key === "Enter" && setNewPw(), autoFocus: true }))), err && /* @__PURE__ */ React.createElement("div", { style: { color: "var(--red)", fontSize: 13, marginBottom: 14, padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)" } }, err), info && /* @__PURE__ */ React.createElement("div", { style: { color: "var(--text2)", fontSize: 13, marginBottom: 14, padding: "10px 14px", background: "var(--card2)", borderRadius: 8, border: "1px solid var(--border)" } }, info), stage === "cred" && /* @__PURE__ */ React.createElement(React.Fragment, null, btn("Sign In", login, "lock"), link("Forgot password?", forgot), link("Have a reset link? Paste it here", () => {
    setErr("");
    setInfo("");
    setStage("paste");
  })), stage === "mfa" && /* @__PURE__ */ React.createElement(React.Fragment, null, btn("Verify", verifyMfa, "lock"), link("Back to sign in", cancel)), stage === "verify" && /* @__PURE__ */ React.createElement(React.Fragment, null, btn("Continue", afterVerify), link("Back to sign in", cancel)), stage === "paste" && /* @__PURE__ */ React.createElement(React.Fragment, null, btn("Continue", usePasted), link("Back to sign in", () => {
    setErr("");
    setStage("cred");
  })), stage === "newpw" && btn("Save new password", setNewPw, "lock"), stage === "enrol" && /* @__PURE__ */ React.createElement(React.Fragment, null, btn("Activate & Sign In", confirmEnrol, "lock"), link("Cancel", cancel)), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 28, borderTop: "1px solid var(--border)", paddingTop: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", fontSize: 11, color: "var(--text3)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 600 } }, "Need Help?"), /* @__PURE__ */ React.createElement("div", { style: { background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", fontSize: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "var(--text2)", marginBottom: 8, lineHeight: 1.6 } }, "For login credentials, technical support, or any issues with this application \u2014 please contact:"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderTop: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15 } }, /* @__PURE__ */ React.createElement(Ic, { n: "mail", s: 16 })), /* @__PURE__ */ React.createElement("a", { href: "mailto:contact@business.com", style: { color: "var(--primary2)", fontWeight: 600, textDecoration: "none", fontSize: 13 } }, "contact@business.com")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderTop: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15 } }, /* @__PURE__ */ React.createElement(Ic, { n: "phone", s: 16 })), /* @__PURE__ */ React.createElement("a", { href: "tel:+918800112233", style: { color: "var(--primary2)", fontWeight: 600, textDecoration: "none", fontSize: 13 } }, "+91 8800112233"))), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginTop: 12, fontSize: 10, color: "var(--text3)" } }, "Arctic Books \xA9 ", (/* @__PURE__ */ new Date()).getFullYear(), " \u2014 All rights reserved"))));
};
const newItem = () => ({ desc: "", hsnCode: "", unit: "Nos", qty: 1, rate: "", discount: 0, taxRate: "18", taxable: 0, gstAmt: 0, total: 0 });
const newNonGSTItem = () => ({ desc: "", qty: 1, rate: "", total: 0 });
const newInvoice = (user, docType) => ({
  invNo: genInvNo(docType || "TAX INVOICE"),
  date: today(),
  dueDate: "",
  poNo: "",
  subject: "",
  billTo: { name: "", address: "", city: "", state: "", pin: "", gstin: "", phone: "", email: "" },
  shipTo: { name: "", address: "", city: "", state: "", pin: "" },
  sameAddress: true,
  items: [docType === "NON GST INVOICE" ? newNonGSTItem() : newItem()],
  notes: "",
  gstType: "INTRA",
  docType: docType || "TAX INVOICE",
  isB2C: false,
  status: "Sent",
  sentToCustomer: true,
  paidDate: "",
  origInvNo: "",
  origInvDate: "",
  creditsUsed: "",
  subtotal: 0,
  taxBreakdown: {},
  totalGST: 0,
  roundOff: 0,
  grand: 0,
  createdBy: (user == null ? void 0 : user.email) || "",
  time: nowTime()
});
const InvoiceForm = ({ currentUser, initial, onSave }) => {
  var _a, _b, _c;
  const [inv, setInv] = useState(() => initial ? unwrapFcInvoice(initial) : newInvoice(currentUser));
  const fmtX = (n) => fmtC(n, inv.currency);
  const co = S.get(SK.CO, {});
  const hsnList = S.get(SK.HSN, []);
  const [showCustModal, setShowCustModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [custQ, setCustQ] = useState("");
  const [showCustDrop, setShowCustDrop] = useState(false);
  const custList = S.get(SK.CUST, []);
  const custMatched = custQ.length > 1 ? custList.filter((c) => {
    var _a2;
    return c.name.toLowerCase().includes(custQ.toLowerCase()) || ((_a2 = c.gstin) == null ? void 0 : _a2.includes(custQ));
  }).slice(0, 6) : [];
  const custInputRef = useRef();
  const custDropRef = useRef();
  useEffect(() => {
    const h = (e) => {
      if (custInputRef.current && !custInputRef.current.contains(e.target) && custDropRef.current && !custDropRef.current.contains(e.target)) setShowCustDrop(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const [origInvQ, setOrigInvQ] = useState(inv.origInvNo || "");
  const [showOrigDrop, setShowOrigDrop] = useState(false);
  const origInvRef = useRef();
  const origDropRef = useRef();
  const allTaxInvs = S.get(SK.INV, []).filter((i) => i.docType === "TAX INVOICE" && i.invNo);
  const origMatched = origInvQ.length > 0 ? allTaxInvs.filter((i) => {
    var _a2;
    return i.invNo.toLowerCase().includes(origInvQ.toLowerCase()) || (((_a2 = i.billTo) == null ? void 0 : _a2.name) || "").toLowerCase().includes(origInvQ.toLowerCase());
  }).slice(0, 8) : allTaxInvs.slice(-8).reverse();
  useEffect(() => {
    const h = (e) => {
      if (origInvRef.current && !origInvRef.current.contains(e.target) && origDropRef.current && !origDropRef.current.contains(e.target)) setShowOrigDrop(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => {
    setOrigInvQ(inv.origInvNo || "");
  }, [inv.origInvNo]);
  useEffect(() => {
    if (inv.docType !== "CREDIT NOTE" && inv.docType !== "DEBIT NOTE") {
      setOrigInvQ("");
      setShowOrigDrop(false);
    }
  }, [inv.docType]);
  const fillCustomer = (c) => {
    setInv((p) => ({ ...p, billTo: { name: c.name, address: c.address || "", city: c.city || "", state: c.state || "", pin: c.pin || "", gstin: c.gstin || "", phone: c.phone || "", email: c.email || "" } }));
    setCustQ(c.name);
    setShowCustDrop(false);
  };
  const saveCustomerFromBillTo = () => {
    const bt = inv.billTo;
    if (!bt.name) {
      toast.error("Customer name required");
      return;
    }
    const existing = custList.findIndex((c) => c.name.toLowerCase() === bt.name.toLowerCase());
    let u;
    if (existing >= 0) {
      u = custList.map((c, i) => i === existing ? { ...c, ...bt } : c);
      toast.success("Customer updated in database!");
    } else {
      u = [...custList, { ...bt, createdAt: (/* @__PURE__ */ new Date()).toISOString() }];
      toast.success("Customer saved to database!");
    }
    S.set(SK.CUST, u);
  };
  const STATUS_CFG = {
    "Draft": { bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" },
    "Sent": { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
    "Paid": { bg: "#F0FDF4", color: "#166534", border: "#86EFAC" },
    "Overdue": { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" }
  };
  useEffect(() => {
    const items = inv.items || [];
    const isNG = inv.docType === "NON GST INVOICE";
    if (isNG) {
      let ngTotal = 0;
      items.forEach((r) => {
        ngTotal += (parseFloat(r.qty) || 0) * (parseFloat(r.rate) || 0);
      });
      const rounded = Math.round(ngTotal);
      setInv((p) => ({ ...p, subtotal: "0", taxBreakdown: {}, totalGST: "0", roundOff: 0, grand: rounded }));
    } else {
      let sub = 0, gstMap = {};
      items.forEach((r) => {
        const taxable = parseFloat(r.taxable) || 0, gst = parseFloat(r.gstAmt) || 0, rate = r.taxRate || "0";
        sub += taxable;
        gstMap[rate] = (gstMap[rate] || 0) + gst;
      });
      const tgst = Object.values(gstMap).reduce((a, b) => a + b, 0);
      const raw = sub + tgst, rounded = Math.round(raw), roff = parseFloat((rounded - raw).toFixed(2));
      setInv((p) => ({ ...p, subtotal: sub.toFixed(2), taxBreakdown: gstMap, totalGST: tgst.toFixed(2), roundOff: roff, grand: rounded }));
    }
  }, [JSON.stringify(inv.items), inv.docType]);
  useEffect(() => {
    var _a2;
    if (inv.isB2C) return;
    const sc = stateCode(co.gstin), bc = stateCode((_a2 = inv.billTo) == null ? void 0 : _a2.gstin);
    let type = "INTRA";
    if (sc && bc && sc !== bc) type = "INTER";
    setInv((p) => ({ ...p, gstType: type }));
  }, [(_a = inv.billTo) == null ? void 0 : _a.gstin, inv.isB2C]);
  const upB = (k) => (e) => setInv((p) => ({ ...p, billTo: { ...p.billTo, [k]: e.target.value } }));
  const upS = (k) => (e) => setInv((p) => ({ ...p, shipTo: { ...p.shipTo, [k]: e.target.value } }));
  const upF = (k) => (e) => setInv((p) => ({ ...p, [k]: e.target.value }));
  const addItem = () => setInv((p) => ({ ...p, items: [...p.items, p.docType === "NON GST INVOICE" ? newNonGSTItem() : newItem()] }));
  const updateItem = (i, u) => setInv((p) => ({ ...p, items: p.items.map((it, j) => j === i ? u : it) }));
  const deleteItem = (i) => setInv((p) => ({ ...p, items: p.items.filter((_, j) => j !== i) }));
  const save = (autoNew = false) => {
    var _a2, _b2, _c2;
    if (!((_a2 = inv.billTo) == null ? void 0 : _a2.name)) {
      toast.error("Customer name required");
      return;
    }
    const isSuperUser = isSuperAdmin(currentUser == null ? void 0 : currentUser.email);
    if (!isSuperUser && isSalesFrozen(inv)) {
      const ym = (inv.date || "").substring(0, 7);
      toast.error(` ${ym} is frozen. Only Super Admin can edit invoices for this month.`);
      return;
    }
    const isCN = inv.docType === "CREDIT NOTE";
    const isNG = inv.docType === "NON GST INVOICE";
    const computedGrand = isNG ? inv.items.filter((r) => r.desc).reduce((s, r) => s + (parseFloat(r.total) || (parseFloat(r.qty) || 0) * (parseFloat(r.rate) || 0)), 0) : inv.grand || 0;
    const grandVal = isCN ? -Math.abs(computedGrand) : Math.abs(computedGrand);
    const cleanBillTo = { ...inv.billTo, gstin: (((_b2 = inv.billTo) == null ? void 0 : _b2.gstin) || "").toUpperCase() };
    let toSave = { ...inv, grand: grandVal, billTo: cleanBillTo, voucherNo: inv.voucherNo || nextVoucherNo(), txnRefNo: inv.txnRefNo || nextTxnRefNo(inv.date) };
    const _cur = inv.currency || "INR";
    if (_cur !== "INR") {
      const _rt = parseFloat(inv.exchRate) || 0;
      if (_rt <= 0) {
        toast.error("Enter the exchange rate (\u20B9 per 1 " + _cur + ")");
        return;
      }
      toSave = toBaseInvoice(toSave, _rt);
      saveFxRate(_cur, _rt, inv.date);
    } else if (toSave.fc) {
      const { fc: _fc, ...restInv } = toSave;
      toSave = { ...restInv, currency: "INR", exchRate: "" };
    }
    const invs = S.get(SK.INV, []);
    const ex = invs.findIndex((i) => i.invNo === inv.invNo);
    let updated;
    const isEdit = ex >= 0;
    if (isEdit) {
      updated = [...invs];
      updated[ex] = { ...toSave };
    } else {
      updated = [...invs, { ...toSave }];
      commitInvNo(inv.docType);
    }
    S.set(SK.INV, updated);
    applyStockForInvoice(toSave, currentUser);
    logAudit(isEdit ? "INVOICE_EDITED" : "INVOICE_CREATED", `${inv.docType} ${inv.invNo} \u2014 ${(_c2 = inv.billTo) == null ? void 0 : _c2.name} \u2014 \u20B9${Math.abs(grandVal)}`, currentUser);
    if (onSave) onSave(toSave);
    toast.success(`${inv.docType} ${inv.invNo} saved!`);
    if (autoNew) setTimeout(() => setInv(newInvoice(currentUser)), 400);
  };
  const gstType = inv.gstType;
  const isNonGST = inv.docType === "NON GST INVOICE";
  const sellerSC = stateCode(co.gstin);
  const buyerGSTINOK = ((_b = inv.billTo) == null ? void 0 : _b.gstin) ? validateGSTIN(inv.billTo.gstin) : true;
  const terms = S.get(SK.TERMS, DEFAULT_TERMS);
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, gap: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "inv-header-left" }, /* @__PURE__ */ React.createElement("div", { className: "inv-title", style: { fontFamily: "Sora,sans-serif", fontSize: 26, fontWeight: 800, color: "var(--text)" } }, inv.docType === "DEBIT NOTE" ? "New Debit Note" : inv.docType === "CREDIT NOTE" ? "New Credit Note" : inv.docType === "NON GST INVOICE" ? "New Non-GST Invoice" : inv.isB2C ? "New B2C Invoice" : "New Tax Invoice"), /* @__PURE__ */ React.createElement("div", { className: "inv-co-row", style: { color: "var(--text3)", fontSize: 13, marginTop: 3, display: "flex", alignItems: "center", gap: 6 } }, co.name && /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text2)", fontWeight: 600, flexShrink: 0 } }, co.name), co.gstin && /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "monospace", fontSize: 11, flexShrink: 0 } }, co.gstin), sellerSC && /* @__PURE__ */ React.createElement("span", { className: "badge badge-primary", style: { flexShrink: 0 } }, stateName(co.gstin)))), /* @__PURE__ */ React.createElement("div", { style: { flexShrink: 0, textAlign: "right" } }, /* @__PURE__ */ React.createElement("div", { className: "inv-no-badge" }, inv.invNo), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "monospace", fontSize: 11, color: "var(--text3)", marginTop: 5 } }, "Voucher No. ", inv.voucherNo || "auto-assigned on save"), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "monospace", fontSize: 11, color: "var(--text3)", marginTop: 2 } }, "Txn Ref No. ", inv.txnRefNo || "auto-assigned on save"))), !co.name && /* @__PURE__ */ React.createElement("div", { className: "alert alert-warn" }, /* @__PURE__ */ React.createElement("span", null, "Alert"), /* @__PURE__ */ React.createElement("span", null, "Please configure ", /* @__PURE__ */ React.createElement("strong", null, "Company Details"), " before creating invoices.")), isSalesFrozen(inv) && !isSuperAdmin(currentUser == null ? void 0 : currentUser.email) && /* @__PURE__ */ React.createElement("div", { className: "alert", style: { background: "rgba(79,111,232,0.08)", border: "1px solid rgba(79,111,232,0.3)", color: "var(--primary2)", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("strong", null, (inv.date || "").substring(0, 7), " is frozen."), " This month's sales are locked. Contact Super Admin to unfreeze.")), /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "field-label", style: { marginBottom: 8 } }, "Document Type"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, [
    { dt: "TAX INVOICE", bc: "var(--primary)", bg: "var(--primary-bg)", tc: "var(--primary2)", icon: "file", text: "Tax Invoice (B2B)", b2c: false },
    { dt: "TAX INVOICE", bc: "#0369A1", bg: "#E0F2FE", tc: "#0369A1", icon: "receipt", text: "Tax Invoice (B2C)", b2c: true },
    { dt: "DEBIT NOTE", bc: "#B45309", bg: "#FEF3C7", tc: "#92400E", icon: "trending-up", text: "Debit Note", b2c: false },
    { dt: "CREDIT NOTE", bc: "#065F46", bg: "#D1FAE5", tc: "#064E3B", icon: "trending-down", text: "Credit Note", b2c: false },
    { dt: "NON GST INVOICE", bc: "#6B21A8", bg: "#F3E8FF", tc: "#6B21A8", icon: "receipt", text: "Non GST Invoice", b2c: false }
  ].map(({ dt, bc, bg, tc, icon, text, b2c }) => {
    const isActive = inv.docType === dt && !!inv.isB2C === b2c;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: text,
        onClick: () => {
          const newNo = genInvNo(dt, inv.date);
          const wasNote = inv.docType === "CREDIT NOTE" || inv.docType === "DEBIT NOTE";
          const isNote = dt === "CREDIT NOTE" || dt === "DEBIT NOTE";
          const typeChanged = inv.docType !== dt || !!inv.isB2C !== b2c;
          if (typeChanged && (wasNote || isNote)) {
            setOrigInvQ("");
            setShowOrigDrop(false);
          }
          setInv((p) => ({
            ...p,
            docType: dt,
            invNo: newNo,
            isB2C: b2c,
            origInvNo: typeChanged && (wasNote || isNote) ? "" : "",
            origInvDate: typeChanged && (wasNote || isNote) ? "" : "",
            gstType: b2c ? "INTRA" : p.gstType
          }));
        },
        style: {
          padding: "7px 18px",
          borderRadius: 8,
          border: `2px solid ${isActive ? bc : "var(--border2)"}`,
          background: isActive ? bg : "transparent",
          color: isActive ? tc : "var(--text2)",
          fontWeight: isActive ? 700 : 500,
          cursor: "pointer",
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          gap: 6
        }
      },
      /* @__PURE__ */ React.createElement(Ic, { n: icon, s: 16 }),
      " ",
      text
    );
  })), inv.docType === "CREDIT NOTE" && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, fontSize: 11, color: "#065F46", background: "#D1FAE5", padding: "5px 10px", borderRadius: 6 } }, /* @__PURE__ */ React.createElement(Ic, { n: "alert", s: 14 }), " Credit Note values will be stored as ", /* @__PURE__ */ React.createElement("strong", null, "negative"), " and will reduce revenue totals."), inv.docType === "NON GST INVOICE" && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, fontSize: 11, color: "#6B21A8", background: "#F3E8FF", padding: "5px 10px", borderRadius: 6 } }, /* @__PURE__ */ React.createElement(Ic, { n: "info", s: 14 }), " Non-GST Invoice \u2014 ", /* @__PURE__ */ React.createElement("strong", null, "no HSN, tax or GST"), " applied. Only Description, Rate, Qty and Total. Useful for small/exempt sales."), (inv.docType === "CREDIT NOTE" || inv.docType === "DEBIT NOTE") && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, padding: "14px 16px", background: inv.docType === "CREDIT NOTE" ? "rgba(16,185,129,0.07)" : "rgba(245,158,11,0.07)", borderRadius: 12, border: `1px solid ${inv.docType === "CREDIT NOTE" ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}` } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 28, height: 28, borderRadius: 8, background: inv.docType === "CREDIT NOTE" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 } }, inv.docType === "CREDIT NOTE" ? /* @__PURE__ */ React.createElement(Ic, { n: "trending-down", s: 16 }) : /* @__PURE__ */ React.createElement(Ic, { n: "trending-up", s: 16 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: inv.docType === "CREDIT NOTE" ? "var(--green)" : "var(--gold)", textTransform: "uppercase", letterSpacing: "0.7px" } }, "Original Invoice Reference"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text3)", marginTop: 1 } }, "Required for GST filing \u2014 select from your saved invoices")), inv.origInvNo && /* @__PURE__ */ React.createElement("div", { style: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: inv.docType === "CREDIT NOTE" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", border: `1px solid ${inv.docType === "CREDIT NOTE" ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`, fontSize: 11, fontWeight: 700, color: inv.docType === "CREDIT NOTE" ? "var(--green)" : "var(--gold)" } }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(Ic, { n: "check", s: 12 })), /* @__PURE__ */ React.createElement("span", null, "Linked"))), /* @__PURE__ */ React.createElement("div", { className: "g2" }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 0, position: "relative" } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Original Invoice No *"), /* @__PURE__ */ React.createElement("div", { ref: origInvRef, style: { position: "relative" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "field-input",
      value: origInvQ,
      onChange: (e) => {
        setOrigInvQ(e.target.value);
        setInv((p) => ({ ...p, origInvNo: e.target.value, origInvDate: "" }));
        setShowOrigDrop(true);
      },
      onFocus: () => setShowOrigDrop(true),
      placeholder: "Type to search invoices\u2026",
      style: {
        fontFamily: "monospace",
        paddingRight: 32,
        borderColor: inv.origInvNo ? inv.docType === "CREDIT NOTE" ? "rgba(16,185,129,0.5)" : "rgba(245,158,11,0.5)" : void 0
      },
      autoComplete: "off"
    }
  ), origInvQ && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setOrigInvQ("");
        setInv((p) => ({ ...p, origInvNo: "", origInvDate: "" }));
      },
      style: { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", padding: 0 }
    },
    "x"
  )), showOrigDrop && origMatched.length > 0 && ReactDOM.createPortal(
    /* @__PURE__ */ React.createElement("div", { ref: origDropRef, style: {
      position: "fixed",
      zIndex: 9999,
      background: "var(--card)",
      border: "1px solid var(--border2)",
      borderRadius: 10,
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      overflow: "hidden",
      minWidth: 320,
      maxWidth: 460,
      maxHeight: 280,
      overflowY: "auto",
      ...(() => {
        var _a2;
        const el = (_a2 = origInvRef.current) == null ? void 0 : _a2.querySelector("input");
        if (!el) return { top: 200, left: 200 };
        const r = el.getBoundingClientRect();
        return { top: r.bottom + 4, left: r.left };
      })()
    } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "8px 12px 6px", fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.6px", borderBottom: "1px solid var(--border)" } }, origInvQ ? `Results for "${origInvQ}"` : "Recent Invoices"), origMatched.map((oi, idx) => {
      var _a2;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: idx,
          onMouseDown: (e) => {
            e.preventDefault();
            setOrigInvQ(oi.invNo);
            setInv((p) => ({ ...p, origInvNo: oi.invNo, origInvDate: oi.date || "" }));
            setShowOrigDrop(false);
            toast.success(`Linked to ${oi.invNo}`);
          },
          style: { padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", transition: "background 0.1s" },
          onMouseEnter: (e) => e.currentTarget.style.background = "var(--card2)",
          onMouseLeave: (e) => e.currentTarget.style.background = "transparent"
        },
        /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: inv.docType === "CREDIT NOTE" ? "var(--green)" : "var(--gold)" } }, oi.invNo), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text3)", flexShrink: 0 } }, fmtDate(oi.date) || "")),
        /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 3 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "var(--text2)", fontWeight: 500 } }, ((_a2 = oi.billTo) == null ? void 0 : _a2.name) || "Unknown Customer"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 600, color: "var(--primary2)" } }, "\u20B9", Number(Math.abs(getGrand(oi) || 0)).toLocaleString("en-IN")))
      );
    }), origMatched.length === 0 && origInvQ.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { padding: "14px", textAlign: "center", color: "var(--text3)", fontSize: 12 } }, 'No invoices found for "', origInvQ, '"')),
    document.body
  )), /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Original Invoice Date *", inv.origInvDate && /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 6, fontSize: 10, color: "var(--green)", fontWeight: 600 } }, " Auto-filled")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      className: "field-input",
      value: inv.origInvDate || "",
      onChange: upF("origInvDate"),
      style: {
        borderColor: inv.origInvDate ? "rgba(16,185,129,0.4)" : void 0,
        background: inv.origInvDate ? "rgba(16,185,129,0.04)" : void 0
      }
    }
  ), !inv.origInvDate && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text3)", marginTop: 3 } }, "Auto-filled when you select an invoice above")), inv.docType === "CREDIT NOTE" && /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Credits Used"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: inv.creditsUsed || "", onChange: upF("creditsUsed"), placeholder: "Defaults to full note amount on PDF" }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text3)", marginTop: 3 } }, "Leave blank to show the full amount as used (Credits Remaining \u20B90.00)")))), inv.isB2C && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "var(--text2)", fontWeight: 600 } }, "GST Type:"), [["INTRA", "Intra-State (CGST + SGST)", "#1D4ED8", "#DBEAFE"], ["INTER", "Inter-State (IGST)", "#065F46", "#D1FAE5"]].map(([type, label, color, bg]) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: type,
      onClick: () => setInv((p) => ({ ...p, gstType: type })),
      style: {
        padding: "5px 16px",
        borderRadius: 7,
        fontSize: 12,
        fontWeight: inv.gstType === type ? 700 : 500,
        cursor: "pointer",
        border: `2px solid ${inv.gstType === type ? color : "var(--border2)"}`,
        background: inv.gstType === type ? bg : "transparent",
        color: inv.gstType === type ? color : "var(--text2)",
        transition: "all 0.2s"
      }
    },
    label
  )), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text3)" } }, inv.gstType === "INTRA" ? "\u2192 CGST + SGST applies" : "\u2192 IGST applies"))), /* @__PURE__ */ React.createElement("div", { className: "g4" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Invoice Number"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: inv.invNo, onChange: upF("invNo"), style: { fontFamily: "monospace", fontWeight: 700, color: "var(--gold)" } })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Invoice Date"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      className: "field-input",
      value: inv.date,
      onChange: (e) => {
        const newDate = e.target.value;
        const isSuperUser = isSuperAdmin(currentUser == null ? void 0 : currentUser.email);
        if (!isSuperUser && isMonthFrozen(newDate, "sales")) {
          toast.error(` ${newDate.substring(0, 7)} sales are frozen. Cannot create/edit invoices for this month.`);
          return;
        }
        upF("date")(e);
      },
      style: { borderColor: !isSuperAdmin(currentUser == null ? void 0 : currentUser.email) && isSalesFrozen(inv) ? "var(--red)" : "" }
    }
  ), !isSuperAdmin(currentUser == null ? void 0 : currentUser.email) && isSalesFrozen(inv) && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--red)", marginTop: 3 } }, " This month is frozen")), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Due Date"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: inv.dueDate, onChange: upF("dueDate") })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "PO / Ref No."), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: inv.poNo || "", onChange: upF("poNo"), placeholder: "PO-001 (optional)" }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", marginTop: 12, padding: "10px 12px", border: "1px dashed var(--border2)", borderRadius: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 0, minWidth: 200 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Invoice currency"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: inv.currency || "INR", onChange: (e) => {
    const c = e.target.value;
    const sv = getFxRates()[c];
    setInv((p) => ({ ...p, currency: c, exchRate: c === "INR" ? "" : p.exchRate || (sv ? sv.rate : "") }));
  } }, FX_CURRENCIES.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.code, value: c.code }, c.code, " \u2014 ", c.name)))), inv.currency && inv.currency !== "INR" && /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 0, minWidth: 170 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Exchange rate (\u20B9 per 1 ", inv.currency, ")"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: inv.exchRate || "", onChange: (e) => setInv((p) => ({ ...p, exchRate: e.target.value })), placeholder: "e.g. 83.50" })), inv.currency && inv.currency !== "INR" && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--text3)", flex: 1, minWidth: 230 } }, "Enter item rates in ", /* @__PURE__ */ React.createElement("b", null, inv.currency), ". Your books stay in \u20B9 at this rate; when the customer pays, the difference is booked as exchange gain / loss automatically.")), /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginTop: 12, marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Subject"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: inv.subject || "", onChange: upF("subject"), placeholder: "e.g. EST/2025-26/0130 Dt.22-05-2025 \u2014 Project name (optional, prints on PDF)" }))), /* @__PURE__ */ React.createElement("div", { className: "g2 bill-ship-grid", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "dot" }), "Bill To"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: () => setShowCustModal(true), title: "Pick from Customer Database" }, /* @__PURE__ */ React.createElement(Ic, { n: "users", s: 12 }), "Customer DB"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: saveCustomerFromBillTo, title: "Save this customer to database" }, /* @__PURE__ */ React.createElement(Ic, { n: "save", s: 12 }), "Save Customer"))), /* @__PURE__ */ React.createElement("div", { className: "field", style: { position: "relative" } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Customer Name *"), /* @__PURE__ */ React.createElement(
    "input",
    {
      ref: custInputRef,
      className: "field-input",
      value: inv.billTo.name,
      onChange: (e) => {
        upB("name")(e);
        setCustQ(e.target.value);
        setShowCustDrop(true);
      },
      onFocus: () => {
        setCustQ(inv.billTo.name);
        setShowCustDrop(true);
      },
      placeholder: "Type to search saved customers..."
    }
  ), showCustDrop && custMatched.length > 0 && ReactDOM.createPortal(
    /* @__PURE__ */ React.createElement("div", { ref: custDropRef, style: {
      position: "fixed",
      top: (() => {
        var _a2;
        const r = (_a2 = custInputRef.current) == null ? void 0 : _a2.getBoundingClientRect();
        return r ? r.bottom + 4 : 0;
      })(),
      left: (() => {
        var _a2;
        const r = (_a2 = custInputRef.current) == null ? void 0 : _a2.getBoundingClientRect();
        return r ? r.left : 0;
      })(),
      width: 380,
      background: "var(--card)",
      border: "1.5px solid var(--border2)",
      borderRadius: 10,
      boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
      zIndex: 99999,
      maxHeight: 220,
      overflowY: "auto"
    } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "5px 12px", fontSize: 10, color: "var(--text3)", borderBottom: "1px solid var(--border)", fontWeight: 700, background: "var(--card2)", borderRadius: "10px 10px 0 0" } }, /* @__PURE__ */ React.createElement(Ic, { n: "users", s: 16 }), " ", custMatched.length, " customer", custMatched.length !== 1 ? "s" : "", " found"), custMatched.map((c, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "hsn-opt", onMouseDown: (e) => {
      e.preventDefault();
      fillCustomer(c);
    } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, color: "var(--text)" } }, c.name), c.gstin && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontFamily: "monospace", color: "var(--gold)" } }, c.gstin)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)" } }, [c.city, c.state].filter(Boolean).join(", "))))),
    document.body
  )), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Address"), /* @__PURE__ */ React.createElement("textarea", { className: "field-input", value: inv.billTo.address, onChange: upB("address"), rows: 2, placeholder: "Street, Area" })), /* @__PURE__ */ React.createElement("div", { className: "g3" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "City"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: inv.billTo.city, onChange: upB("city"), placeholder: "City" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "State"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: inv.billTo.state, onChange: upB("state"), placeholder: "State" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "PIN"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: inv.billTo.pin, onChange: upB("pin"), placeholder: "560001", maxLength: 6 }))), /* @__PURE__ */ React.createElement("div", { className: "g2" }, inv.isB2C ? /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Customer State"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: inv.billTo.state || "", onChange: upB("state"), placeholder: "e.g. Karnataka" }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text3)", marginTop: 3 } }, "B2C \u2014 no GSTIN required. Use toggle above for GST type.")) : /* @__PURE__ */ React.createElement("div", { className: "field gstin-wrap" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Customer GSTIN"), /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: inv.billTo.gstin || "", onChange: (e) => setInv((p) => ({ ...p, billTo: { ...p.billTo, gstin: e.target.value.toUpperCase() } })), placeholder: "29XXXXX0000X1Z5", maxLength: 15, style: { textTransform: "uppercase", paddingRight: 72 } }), inv.billTo.gstin && /* @__PURE__ */ React.createElement("span", { className: "gstin-badge", style: { color: buyerGSTINOK ? "var(--green)" : "var(--red)" } }, buyerGSTINOK ? " Valid" : "Invalid"))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Phone"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: inv.billTo.phone || "", onChange: upB("phone") }))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Email"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: inv.billTo.email || "", onChange: upB("email") }))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "dot" }), "Ship To"), /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "var(--text2)" } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: inv.sameAddress, onChange: (e) => setInv((p) => ({ ...p, sameAddress: e.target.checked })), style: { accentColor: "var(--primary)" } }), "Same as Bill To")), inv.sameAddress ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "32px 0", color: "var(--text3)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 36, marginBottom: 8 } }, /* @__PURE__ */ React.createElement(Ic, { n: "package", s: 16 })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13 } }, "Shipping address same as billing address")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Recipient Name"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: inv.shipTo.name || inv.billTo.name, onChange: upS("name") })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Address"), /* @__PURE__ */ React.createElement("textarea", { className: "field-input", value: inv.shipTo.address, onChange: upS("address"), rows: 2 })), /* @__PURE__ */ React.createElement("div", { className: "g3" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "City"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: inv.shipTo.city, onChange: upS("city") })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "State"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: inv.shipTo.state, onChange: upS("state") })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "PIN"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: inv.shipTo.pin, onChange: upS("pin"), maxLength: 6 })))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, padding: "12px 14px", background: "var(--card2)", borderRadius: 10, border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--text2)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 } }, "Invoice Status"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 } }, Object.entries(STATUS_CFG).map(([st, cfg]) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: st,
      onClick: () => setInv((p) => ({ ...p, status: st, paidDate: st === "Paid" ? today() : p.paidDate })),
      style: {
        padding: "4px 12px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: inv.status === st ? 700 : 500,
        cursor: "pointer",
        border: `2px solid ${inv.status === st ? cfg.color : cfg.border}`,
        background: inv.status === st ? cfg.bg : "transparent",
        color: inv.status === st ? cfg.color : "var(--text3)",
        transition: "all 0.15s"
      }
    },
    st === "Draft" ? "D" : st === "Sent" ? "S" : st === "Paid" ? "P" : "O",
    " ",
    st
  ))), inv.status === "Paid" && /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 8 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Payment Received Date"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: inv.paidDate || "", onChange: upF("paidDate") })), /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      checked: !!inv.sentToCustomer,
      onChange: (e) => setInv((p) => ({ ...p, sentToCustomer: e.target.checked, status: e.target.checked && p.status === "Draft" ? "Sent" : p.status })),
      style: { accentColor: "var(--primary)", width: 14, height: 14 }
    }
  ), /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text2)" } }, "S Sent to customer"), inv.sentToCustomer && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#1D4ED8", background: "#EFF6FF", padding: "1px 7px", borderRadius: 10, border: "1px solid #BFDBFE" } }, " Sent"))), !isNonGST && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, padding: "10px 14px", background: "var(--card2)", borderRadius: 8, fontSize: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--text2)", marginBottom: 4 } }, "GST Determination"), /* @__PURE__ */ React.createElement("div", { style: { color: "var(--text3)" } }, "Seller: ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text)" } }, sellerSC ? stateName(co.gstin) : "Not configured")), ((_c = inv.billTo) == null ? void 0 : _c.gstin) && /* @__PURE__ */ React.createElement("div", { style: { color: "var(--text3)" } }, "Buyer: ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text)" } }, stateName(inv.billTo.gstin))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6 } }, /* @__PURE__ */ React.createElement("span", { className: `badge ${gstType === "INTRA" ? "badge-green" : "badge-blue"}` }, gstType === "INTRA" ? "CGST + SGST (Intra)" : "IGST (Inter-State)"))))), showCustModal && /* @__PURE__ */ React.createElement(CustomerModal, { onClose: () => setShowCustModal(false), onSelect: fillCustomer, currentUser }), showProductModal && /* @__PURE__ */ React.createElement(ProductMasterModal, { onClose: () => setShowProductModal(false), currentUser, onSelect: (p) => {
    const item = { desc: p.name + (p.desc ? " \u2014 " + p.desc : ""), hsnCode: p.hsnCode || "", unit: p.unit || "Nos", qty: 1, rate: p.rate || "", discount: 0, taxRate: p.taxRate || "18", taxable: 0, gstAmt: 0, total: 0 };
    const calc = (it) => {
      const qty = parseFloat(it.qty) || 0, rate = parseFloat(it.rate) || 0, disc = parseFloat(it.discount) || 0, tax = parseFloat(it.taxRate) || 0, gross = qty * rate, discAmt = gross * (disc / 100), taxable = gross - discAmt;
      it.taxable = taxable.toFixed(2);
      it.gstAmt = (taxable * tax / 100).toFixed(2);
      it.total = (taxable * (1 + tax / 100)).toFixed(2);
      return it;
    };
    setInv((prev) => ({ ...prev, items: [...prev.items, calc(item)] }));
    toast.success(`${p.name} added!`);
  } }), /* @__PURE__ */ React.createElement("div", { className: "card item-table-card", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "dot" }), "Products / Services"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, inv.docType !== "NON GST INVOICE" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: () => setShowProductModal(true) }, /* @__PURE__ */ React.createElement(Ic, { n: "tag", s: 12 }), "Pick from Master"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-primary btn-sm", onClick: addItem }, /* @__PURE__ */ React.createElement(Ic, { n: "plus", s: 13 }), "Add Row"))), inv.docType === "NON GST INVOICE" ? /* @__PURE__ */ React.createElement("div", { className: "table-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "ptable", style: { minWidth: 500 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { style: { width: 28 } }, "#"), /* @__PURE__ */ React.createElement("th", null, "Description"), /* @__PURE__ */ React.createElement("th", { className: "r", style: { width: 120 } }, "Rate (\u20B9)"), /* @__PURE__ */ React.createElement("th", { className: "r", style: { width: 90 } }, "Qty"), /* @__PURE__ */ React.createElement("th", { className: "r", style: { width: 120 } }, "Total (\u20B9)"), /* @__PURE__ */ React.createElement("th", { style: { width: 38 } }))), /* @__PURE__ */ React.createElement("tbody", null, inv.items.map((row, i) => /* @__PURE__ */ React.createElement(
    NonGSTRow,
    {
      key: i,
      row,
      idx: i,
      hsnList,
      onChange: (idx, r) => setInv((p) => {
        const items = [...p.items];
        items[idx] = r;
        return { ...p, items };
      }),
      onDelete: (idx) => setInv((p) => {
        const items = p.items.filter((_, j) => j !== idx);
        return { ...p, items: items.length ? items : [newNonGSTItem()] };
      })
    }
  ))), /* @__PURE__ */ React.createElement("tfoot", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 6, style: { padding: "8px 10px" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", onClick: addItem }, /* @__PURE__ */ React.createElement(Ic, { n: "plus", s: 12 }), "Add Row")))))) : /* @__PURE__ */ React.createElement("div", { className: "table-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "ptable" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { style: { width: 28 } }, "#"), /* @__PURE__ */ React.createElement("th", null, "Description (auto-fills from HSN)"), /* @__PURE__ */ React.createElement("th", null, "HSN / SAC Code"), /* @__PURE__ */ React.createElement("th", null, "Unit"), /* @__PURE__ */ React.createElement("th", { className: "r" }, "Qty"), /* @__PURE__ */ React.createElement("th", { className: "r" }, "Rate (\u20B9)"), /* @__PURE__ */ React.createElement("th", { className: "r" }, "Disc%"), /* @__PURE__ */ React.createElement("th", null, "GST%"), /* @__PURE__ */ React.createElement("th", { className: "r" }, "Taxable"), /* @__PURE__ */ React.createElement("th", null, "Tax Split"), /* @__PURE__ */ React.createElement("th", { className: "r" }, "Total"), /* @__PURE__ */ React.createElement("th", { style: { width: 38 } }))), /* @__PURE__ */ React.createElement("tbody", null, inv.items.map((row, i) => /* @__PURE__ */ React.createElement(ProductRow, { key: i, row, idx: i, onChange: updateItem, onDelete: deleteItem, hsnList, gstType, cur: inv.currency || "INR" }))), /* @__PURE__ */ React.createElement("tfoot", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 12, style: { padding: "8px 10px" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", onClick: addItem }, /* @__PURE__ */ React.createElement(Ic, { n: "plus", s: 12 }), "Add Another Row"))))))), /* @__PURE__ */ React.createElement("div", { className: "two-col", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Notes / Remarks"), /* @__PURE__ */ React.createElement("textarea", { className: "field-input", value: inv.notes || "", onChange: upF("notes"), rows: 3, placeholder: "Payment instructions, additional notes..." })), /* @__PURE__ */ React.createElement("div", { className: "card-sm" }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 } }, "Terms & Conditions"), (terms || DEFAULT_TERMS).split("\n").filter(Boolean).map((t, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { fontSize: 12, color: "var(--text3)", lineHeight: 1.8 } }, t))), (co.bankName || co.bankAccount) && /* @__PURE__ */ React.createElement("div", { className: "card-sm", style: { marginTop: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement(Ic, { n: "bank", s: 12 }), "Bank Details"), [[co.bankName, "Bank"], [co.bankAccount, "A/c No."], [co.bankIFSC, "IFSC"], [co.bankBranch, "Branch"]].filter(([v]) => v).map(([val, lbl], i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", fontSize: 13, padding: "4px 0", borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text3)", minWidth: 90, fontSize: 12 } }, lbl), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: "var(--text)" } }, val))))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "tax-box", style: { marginBottom: 10 } }, inv.docType === "NON GST INVOICE" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "tax-row" }, /* @__PURE__ */ React.createElement("span", { className: "tax-label" }, "Total (No GST)"), /* @__PURE__ */ React.createElement("span", { className: "tax-val" }, fmtX(inv.grand))), /* @__PURE__ */ React.createElement("div", { className: "tax-row", style: { padding: "5px 16px", background: "rgba(107,33,168,0.06)", borderRadius: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#6B21A8" } }, /* @__PURE__ */ React.createElement(Ic, { n: "info", s: 14 }), " Non-GST \u2014 no tax applied")), /* @__PURE__ */ React.createElement("div", { className: "tax-row total-row", style: { padding: "7px 16px" } }, /* @__PURE__ */ React.createElement("span", { className: "tax-label" }, "Grand Total"), /* @__PURE__ */ React.createElement("span", { className: "tax-val" }, fmtX(inv.grand)))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "tax-row" }, /* @__PURE__ */ React.createElement("span", { className: "tax-label" }, "Sub Total (Taxable)"), /* @__PURE__ */ React.createElement("span", { className: "tax-val" }, fmtX(inv.subtotal))), Object.entries(inv.taxBreakdown || {}).filter(([, a]) => a > 0).flatMap(
    ([rate, amt]) => gstType === "INTRA" ? [
      /* @__PURE__ */ React.createElement("div", { key: `c${rate}`, className: "tax-row" }, /* @__PURE__ */ React.createElement("span", { className: "tax-label" }, "CGST @ ", parseFloat(rate) / 2, "%"), /* @__PURE__ */ React.createElement("span", { className: "tax-val", style: { color: "var(--text2)" } }, fmtX(amt / 2))),
      /* @__PURE__ */ React.createElement("div", { key: `s${rate}`, className: "tax-row" }, /* @__PURE__ */ React.createElement("span", { className: "tax-label" }, "SGST @ ", parseFloat(rate) / 2, "%"), /* @__PURE__ */ React.createElement("span", { className: "tax-val", style: { color: "var(--text2)" } }, fmtX(amt / 2)))
    ] : [
      /* @__PURE__ */ React.createElement("div", { key: `i${rate}`, className: "tax-row" }, /* @__PURE__ */ React.createElement("span", { className: "tax-label" }, "IGST @ ", rate, "%"), /* @__PURE__ */ React.createElement("span", { className: "tax-val", style: { color: "var(--text2)" } }, fmtX(amt)))
    ]
  ), /* @__PURE__ */ React.createElement("div", { className: "tax-row" }, /* @__PURE__ */ React.createElement("span", { className: "tax-label" }, "Total Tax"), /* @__PURE__ */ React.createElement("span", { className: "tax-val" }, fmtX(inv.totalGST))), inv.roundOff !== 0 && /* @__PURE__ */ React.createElement("div", { className: "tax-row" }, /* @__PURE__ */ React.createElement("span", { className: "tax-label" }, "Round Off"), /* @__PURE__ */ React.createElement("span", { className: "tax-val", style: { fontSize: 12, color: "var(--text3)" } }, inv.roundOff > 0 ? "+" : "", fmtX(Math.abs(inv.roundOff)))), /* @__PURE__ */ React.createElement("div", { className: "tax-row total-row", style: { padding: "7px 16px" } }, /* @__PURE__ */ React.createElement("span", { className: "tax-label" }, "Grand Total"), /* @__PURE__ */ React.createElement("span", { className: "tax-val" }, fmtX(inv.grand))))), inv.currency && inv.currency !== "INR" && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text2)", margin: "0 0 6px 4px" } }, "\u2248 ", fmt(r2((parseFloat(inv.grand) || 0) * (parseFloat(inv.exchRate) || 0))), " at \u20B9", inv.exchRate || "\u2014", " per ", inv.currency), /* @__PURE__ */ React.createElement("div", { className: "amt-words" }, inv.currency && inv.currency !== "INR" ? amountInWordsFC(inv.grand, inv.currency) : numberToWords(inv.grand)))), /* @__PURE__ */ React.createElement("div", { className: "inv-actions", style: { display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderTop: "1px solid var(--border)", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { className: "inv-actions-left", style: { display: "flex", gap: 8, alignItems: "center" } }, inv.status && (() => {
    const cfg = STATUS_CFG[inv.status] || {};
    return /* @__PURE__ */ React.createElement("span", { style: {
      padding: "4px 12px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      background: cfg.bg,
      color: cfg.color,
      border: `1.5px solid ${cfg.border}`
    } }, inv.status[0], " ", inv.status);
  })(), inv.sentToCustomer && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#1D4ED8", background: "#EFF6FF", padding: "4px 10px", borderRadius: 20, border: "1px solid #BFDBFE" } }, "S Sent to Customer"), !isSuperAdmin(currentUser == null ? void 0 : currentUser.email) && isSalesFrozen(inv) && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--red)", background: "rgba(239,68,68,0.08)", padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(239,68,68,0.25)", fontWeight: 700 } }, (inv.date || "").substring(0, 7), " Frozen \u2014 Save disabled")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: () => {
    if (window.confirm("Start new invoice?")) setInv(newInvoice(currentUser));
  } }, /* @__PURE__ */ React.createElement(Ic, { n: "new", s: 14 }), "New Invoice"), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-outline-primary",
      disabled: !isSuperAdmin(currentUser == null ? void 0 : currentUser.email) && isSalesFrozen(inv),
      title: !isSuperAdmin(currentUser == null ? void 0 : currentUser.email) && isSalesFrozen(inv) ? "Month frozen \u2014 Super Admin only" : void 0,
      onClick: () => save(false)
    },
    /* @__PURE__ */ React.createElement(Ic, { n: "save", s: 14 }),
    "Save"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-outline",
      style: { borderColor: "#1D4ED8", color: "#1D4ED8" },
      onClick: () => setInv((p) => ({ ...p, sentToCustomer: true, status: p.status === "Draft" ? "Sent" : p.status }))
    },
    "S Mark Sent"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-gold",
      disabled: !isSuperAdmin(currentUser == null ? void 0 : currentUser.email) && isSalesFrozen(inv),
      title: !isSuperAdmin(currentUser == null ? void 0 : currentUser.email) && isSalesFrozen(inv) ? "Month frozen \u2014 Super Admin only" : void 0,
      onClick: () => {
        save(true);
        makePDF(inv, co, terms);
      }
    },
    /* @__PURE__ */ React.createElement(Ic, { n: "pdf", s: 15 }),
    "Download PDF + New"
  ), co.waEnabled && /* @__PURE__ */ React.createElement(
    "button",
    {
      title: "Share on WhatsApp with PDF",
      style: { padding: "9px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "#25D366", color: "#fff", border: "none", display: "inline-flex", alignItems: "center", gap: 6, boxShadow: "0 4px 14px rgba(37,211,102,0.35)" },
      onClick: async () => {
        var _a2, _b2, _c2;
        let raw = (((_a2 = inv.billTo) == null ? void 0 : _a2.phone) || "").replace(/\D/g, "");
        if (raw.startsWith("91") && raw.length === 12) raw = raw.slice(2);
        if (raw.startsWith("0") && raw.length === 11) raw = raw.slice(1);
        if (raw.length !== 10) {
          const entered = window.prompt(`No valid phone for ${((_b2 = inv.billTo) == null ? void 0 : _b2.name) || "customer"}.
Enter 10-digit WhatsApp number:`, "");
          if (!entered) return;
          raw = entered.replace(/\D/g, "");
          if (raw.length !== 10) {
            toast.error("Invalid number. Must be 10 digits.");
            return;
          }
        }
        const msg = `Dear ${((_c2 = inv.billTo) == null ? void 0 : _c2.name) || "Customer"},

Please find your ${inv.docType || "Tax Invoice"} *${inv.invNo}* dated *${fmtDate(inv.date)}* for *${fmt(getGrand(inv))}*.

Thank you for your business!

\u2014 ${co.name || ""}`;
        const waUrl = `https://wa.me/91${raw}?text=${encodeURIComponent(msg)}`;
        try {
          const { jsPDF } = window.jspdf;
          const terms2 = S.get(SK.TERMS, DEFAULT_TERMS);
          const doc2 = new jsPDF({ unit: "mm", format: "a4" });
          const tryShare = async () => {
            if (navigator.canShare && navigator.share) {
              try {
                const tempDiv = document.createElement("div");
                makePDF(inv, co, terms2);
                toast.success("PDF downloaded! Opening WhatsApp...");
                setTimeout(() => window.open(waUrl, "_blank"), 800);
              } catch (e) {
                window.open(waUrl, "_blank");
              }
            } else {
              makePDF(inv, co, terms2);
              toast.success("PDF downloaded! Opening WhatsApp \u2014 please attach the PDF there.");
              setTimeout(() => window.open(waUrl, "_blank"), 800);
            }
          };
          await tryShare();
        } catch (e) {
          window.open(waUrl, "_blank");
        }
      }
    },
    /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "currentColor" }, /* @__PURE__ */ React.createElement("path", { d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" })),
    "WhatsApp"
  ))));
};
const makePOPDF = (po, co) => {
  var _a;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW = 210, PH = 297, ML = 14, MR = 14, CW = PW - ML - MR;
  const WHITE = [255, 255, 255], BG = [247, 248, 252];
  const BLUE = [30, 85, 135], LBLUE = [212, 226, 242];
  const DARK = [22, 22, 22], MED = [95, 95, 95], LGRAY = [165, 165, 165], XGRAY = [218, 218, 222];
  const ALTROW = [244, 247, 252];
  doc.setFillColor(...BG);
  doc.rect(0, 0, PW, PH, "F");
  doc.setFillColor(...WHITE);
  doc.rect(11, 11, PW - 22, PH - 22, "F");
  doc.setDrawColor(...XGRAY);
  doc.setLineWidth(0.5);
  doc.line(11, 11, 11, PH - 11);
  doc.line(PW - 11, 11, PW - 11, PH - 11);
  doc.line(11, 11, PW - 11, 11);
  doc.line(11, PH - 11, PW - 11, PH - 11);
  [[11, 11], [PW - 11, 11], [11, PH - 11], [PW - 11, PH - 11]].forEach(([x, y]) => {
    doc.setFillColor(...XGRAY);
    doc.circle(x, y, 3.5, "F");
    doc.setFillColor(...WHITE);
    doc.circle(x, y, 2, "F");
  });
  let Y = 15;
  const logoAreaX = PW - MR - 34;
  if (co.logo) {
    try {
      const mime = co.logo.substring(5, co.logo.indexOf(";"));
      const ext = mime.split("/")[1].toUpperCase();
      doc.addImage(co.logo, ext === "JPG" ? "JPEG" : ext, logoAreaX, Y, 32, 32);
    } catch (e) {
    }
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...DARK);
  doc.text(co.name || "Your Company", ML + 2, Y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MED);
  const addrStr = [co.address, co.city, co.state, co.pin].filter(Boolean).join(", ");
  let coY = Y + 12;
  if (addrStr) {
    doc.splitTextToSize(addrStr, logoAreaX - ML - 8).slice(0, 2).forEach((l) => {
      doc.text(l, ML + 2, coY);
      coY += 3.8;
    });
  }
  if (co.gstin) {
    doc.text("GSTIN: " + co.gstin, ML + 2, coY);
    coY += 3.8;
  }
  if (co.email) {
    doc.text("Email: " + co.email, ML + 2, coY);
    coY += 3.8;
  }
  if (co.phone) {
    doc.text("Phone: " + co.phone, ML + 2, coY);
    coY += 3.8;
  }
  if (co.website) {
    doc.text(co.website, ML + 2, coY);
  }
  Y = Math.max(coY + 5, Y + 36);
  doc.setDrawColor(...XGRAY);
  doc.setLineWidth(0.5);
  doc.line(ML, Y, PW - MR, Y);
  Y += 5;
  const colW = CW / 2 - 3, col2X = ML + colW + 6;
  doc.setFillColor(...LBLUE);
  doc.rect(ML, Y, colW, 7, "F");
  doc.setFillColor(...LBLUE);
  doc.rect(col2X, Y, colW, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...BLUE);
  doc.text("VENDOR / SUPPLIER", ML + 4, Y + 5.2);
  doc.text("DELIVER TO", col2X + 4, Y + 5.2);
  Y += 9;
  const drawParty = (cx, d, maxW) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text(d.name || "\u2014", cx + 2, Y + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MED);
    const ls = [];
    if (d.address) ls.push(d.address);
    const cc = [d.city, d.state, d.pin].filter(Boolean).join(", ");
    if (cc) ls.push(cc);
    if (d.gstin) ls.push("GSTIN: " + d.gstin);
    if (d.phone) ls.push("Ph: " + d.phone);
    let ly = Y + 10;
    ls.slice(0, 5).forEach((l) => {
      doc.splitTextToSize(l, maxW - 4).forEach((s) => {
        doc.text(s, cx + 2, ly);
        ly += 3.8;
      });
    });
    return ly;
  };
  const vBot = drawParty(ML, po.vendorTo || { name: "Vendor Name" }, colW);
  const dBot = drawParty(col2X, po.deliverTo || {}, colW);
  Y = Math.max(vBot, dBot) + 6;
  doc.setDrawColor(...XGRAY);
  doc.setLineWidth(0.5);
  doc.line(ML, Y, PW - MR, Y);
  Y += 5;
  const mRows = [
    ["Number:", po.poNo || "\u2014"],
    ["Date:", fmtDate(po.date) || "\u2014"],
    ["Delivery By:", po.deliveryDate ? fmtDate(po.deliveryDate) : "\u2014"],
    ...po.refNo ? [["Ref No:", po.refNo]] : []
  ];
  const sectionH = Math.max(mRows.length * 5.5 + 5, 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...BLUE);
  doc.text("PURCHASE ORDER", ML + 2, Y + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...LGRAY);
  doc.text(po.status || "Draft", ML + 2, Y + 16);
  let iy = Y + 3;
  mRows.forEach(([l, v]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MED);
    doc.text(l, PW - MR - 44, iy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    doc.text(v, PW - MR - 2, iy, { align: "right" });
    iy += 5.5;
  });
  Y += sectionH;
  doc.setDrawColor(...XGRAY);
  doc.setLineWidth(0.5);
  doc.line(ML, Y, PW - MR, Y);
  Y += 3;
  const bS = { fontSize: 8, cellPadding: { top: 4, bottom: 4, left: 3, right: 3 }, textColor: DARK, lineColor: XGRAY, lineWidth: 0, overflow: "linebreak", fillColor: WHITE };
  const hS = { fillColor: BLUE, textColor: WHITE, fontStyle: "bold", fontSize: 7.5, halign: "center", cellPadding: { top: 4, bottom: 4, left: 2, right: 2 }, lineColor: BLUE, lineWidth: 0 };
  const tH = [["DESCRIPTION", "HSN/SAC", "QTY", "UNIT", "RATE (Rs.)", "AMOUNT (Rs.)"]];
  const tB = (po.items || []).filter((r) => r.desc).map((r) => [
    r.desc,
    r.hsnCode || "\u2014",
    String(r.qty || 0),
    r.unit || "Nos",
    Number(r.rate || 0).toFixed(2),
    Number((r.qty || 0) * (r.rate || 0)).toFixed(2)
  ]);
  if (!tB.length) tB.push(["No items", "", "", "", "", "0.00"]);
  doc.autoTable({
    head: tH,
    body: tB,
    startY: Y,
    margin: { left: ML, right: MR },
    theme: "grid",
    headStyles: hS,
    bodyStyles: bS,
    alternateRowStyles: { fillColor: ALTROW },
    columnStyles: { 0: { cellWidth: 64 }, 1: { cellWidth: 22 }, 2: { cellWidth: 18, halign: "right" }, 3: { cellWidth: 18 }, 4: { cellWidth: 28, halign: "right" }, 5: { cellWidth: 32, halign: "right" } }
  });
  Y = doc.lastAutoTable.finalY + 6;
  const subTotal = (po.items || []).reduce((s, r) => s + (r.qty || 0) * (parseFloat(r.rate) || 0), 0);
  const grandTotal = subTotal + Number(po.taxes || 0);
  const totLines = [
    ["Sub Total (before tax):", subTotal.toFixed(2)],
    ["Taxes / Freight / Other:", Number(po.taxes || 0).toFixed(2)],
    ["GRAND TOTAL:", grandTotal.toFixed(2)]
  ];
  const totX = PW - MR - 85;
  totLines.forEach(([l, v], i) => {
    const isLast = i === totLines.length - 1;
    if (isLast) {
      doc.setFillColor(...LBLUE);
      doc.rect(totX, Y, 85, 8, "F");
      doc.setDrawColor(...BLUE);
      doc.setLineWidth(0.4);
      doc.line(totX, Y, totX + 85, Y);
    }
    doc.setFont("helvetica", isLast ? "bold" : "normal");
    doc.setFontSize(isLast ? 9 : 8);
    doc.setTextColor(...isLast ? BLUE : MED);
    doc.text(l, totX + 3, Y + 5.5);
    doc.setFont("helvetica", "bold");
    doc.text("Rs. " + Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 }), totX + 83, Y + 5.5, { align: "right" });
    Y += isLast ? 10 : 7;
  });
  Y += 3;
  doc.setFillColor(255, 251, 230);
  doc.rect(ML, Y, CW, 7, "F");
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(...MED);
  doc.text("Amount in words: " + numberToWords(grandTotal), ML + 3, Y + 5);
  Y += 10;
  if (po.terms) {
    doc.setDrawColor(...XGRAY);
    doc.setLineWidth(0.3);
    doc.line(ML, Y, PW - MR, Y);
    Y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...BLUE);
    doc.text("Terms & Conditions", ML, Y);
    Y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...LGRAY);
    po.terms.split("\n").filter(Boolean).slice(0, 6).forEach((t) => {
      doc.splitTextToSize(t, CW).forEach((s) => {
        if (Y < PH - 25) {
          doc.text(s, ML, Y);
          Y += 3.8;
        }
      });
    });
  }
  const sigY = Math.max(Y + 10, PH - 35);
  doc.setDrawColor(...XGRAY);
  doc.setLineWidth(0.3);
  doc.line(PW - MR - 55, sigY, PW - MR, sigY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MED);
  doc.text("For " + (co.name || ""), PW - MR - 27, sigY - 5, { align: "center" });
  doc.text("Authorised Signatory", PW - MR - 27, sigY + 4, { align: "center" });
  doc.save(`${po.poNo || "PO"}_${((_a = po.vendorTo) == null ? void 0 : _a.name) || "Vendor"}.pdf`);
  toast.success("PO PDF downloaded!");
};
const makePOExcel = (orders, fmt2 = "xlsx", meta = {}) => {
  const wb = window.XLSX.utils.book_new();
  const headers = [
    "Sl.No",
    "PO Number",
    "PO Date",
    "Delivery By",
    "Vendor Name",
    "Vendor GSTIN",
    "Vendor Address",
    "Deliver To",
    "Description",
    "HSN/SAC",
    "Qty",
    "Unit",
    "Rate (Rs.)",
    "Amount (Rs.)",
    "Sub Total",
    "Taxes",
    "Grand Total",
    "Status",
    "Ref No",
    "Terms",
    "Created By"
  ];
  const rows = [...companyHeaderRows(), headers];
  let sl = 1;
  orders.forEach((po) => {
    const items = (po.items || []).filter((r) => r.desc);
    const grand = (po.items || []).reduce((s, r) => s + (r.qty || 0) * (r.rate || 0), 0) + Number(po.taxes || 0);
    (items.length ? items : [{ desc: "", hsnCode: "", qty: "", unit: "", rate: "" }]).forEach((it, idx) => {
      var _a, _b, _c, _d, _e, _f, _g;
      rows.push([
        idx === 0 ? sl : "",
        idx === 0 ? po.poNo : "",
        idx === 0 ? po.date : "",
        idx === 0 ? po.deliveryDate : "",
        idx === 0 ? ((_a = po.vendorTo) == null ? void 0 : _a.name) || "" : "",
        idx === 0 ? ((_b = po.vendorTo) == null ? void 0 : _b.gstin) || "" : "",
        idx === 0 ? [(_c = po.vendorTo) == null ? void 0 : _c.address, (_d = po.vendorTo) == null ? void 0 : _d.city, (_e = po.vendorTo) == null ? void 0 : _e.state].filter(Boolean).join(", ") : "",
        idx === 0 ? [(_f = po.deliverTo) == null ? void 0 : _f.name, (_g = po.deliverTo) == null ? void 0 : _g.city].filter(Boolean).join(", ") : "",
        it.desc,
        it.hsnCode || "",
        it.qty || "",
        it.unit || "",
        it.rate || "",
        ((it.qty || 0) * (it.rate || 0)).toFixed(2),
        idx === 0 ? (po.items || []).reduce((s, r) => s + (r.qty || 0) * (r.rate || 0), 0).toFixed(2) : "",
        idx === 0 ? Number(po.taxes || 0).toFixed(2) : "",
        idx === 0 ? grand.toFixed(2) : "",
        idx === 0 ? po.status || "Draft" : "",
        idx === 0 ? po.refNo || "" : "",
        idx === 0 ? po.terms || "" : "",
        idx === 0 ? po.createdBy || "" : ""
      ]);
    });
    sl++;
  });
  const ws = window.XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 5 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 24 },
    { wch: 18 },
    { wch: 30 },
    { wch: 24 },
    { wch: 30 },
    { wch: 12 },
    { wch: 8 },
    { wch: 8 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 10 },
    { wch: 12 },
    { wch: 30 },
    { wch: 20 }
  ];
  window.XLSX.utils.book_append_sheet(wb, ws, "PO Register");
  proExport(fmt2, {
    ...proWbToSpec(wb, { title: "Purchase Order Register", period: meta.period || "" }),
    pdfSheets: fmt2 === "pdf" ? [{ name: "PO Register", aoa: regPOPdf(orders), h0: true }] : void 0
  }, `PO_Register_${today()}`);
};
const POForm = ({ currentUser, initial, onSave }) => {
  const newPO = () => ({
    poNo: (() => {
      const fy = getFY();
      const k = "ip_ctr_PO_" + fy;
      let c = S.get(k, 1);
      const n = `PO-${fy}-${String(c).padStart(4, "0")}`;
      S.set(k, c + 1);
      return n;
    })(),
    date: today(),
    deliveryDate: "",
    refNo: "",
    status: "Draft",
    taxes: 0,
    terms: S.get(SK.PO_TERMS, DEFAULT_PO_TERMS),
    vendorTo: { name: "", address: "", city: "", state: "", pin: "", gstin: "", phone: "", email: "" },
    deliverTo: { name: "", address: "", city: "", state: "", pin: "" },
    items: [{ desc: "", hsnCode: "", qty: 1, unit: "Nos", rate: "" }],
    notes: "",
    createdBy: (currentUser == null ? void 0 : currentUser.email) || "",
    time: nowTime()
  });
  const [po, setPo] = useState(() => initial ? { ...initial } : newPO());
  const [showVendorDrop, setShowVendorDrop] = useState(false);
  const [vendorQ, setVendorQ] = useState("");
  const vendorInputRef = useRef();
  const co = S.get(SK.CO, {});
  const hsnList = S.get(SK.HSN, []);
  useEffect(() => {
    if (initial) setPo({ ...initial });
  }, [initial]);
  const upV = (k) => (e) => setPo((p) => ({ ...p, vendorTo: { ...p.vendorTo, [k]: e.target.value } }));
  const upD = (k) => (e) => setPo((p) => ({ ...p, deliverTo: { ...p.deliverTo, [k]: e.target.value } }));
  const upF = (k) => (e) => setPo((p) => ({ ...p, [k]: e.target.value }));
  const customers = S.get(SK.CUST, []);
  const vendorMatched = vendorQ.length > 1 ? customers.filter((c) => {
    var _a, _b;
    return ((_a = c.name) == null ? void 0 : _a.toLowerCase().includes(vendorQ.toLowerCase())) || ((_b = c.gstin) == null ? void 0 : _b.toLowerCase().includes(vendorQ.toLowerCase()));
  }) : [];
  const addItem = () => setPo((p) => ({ ...p, items: [...p.items, { desc: "", hsnCode: "", qty: 1, unit: "Nos", rate: "", taxRate: "18", taxable: 0, gstAmt: 0, total: 0 }] }));
  const delItem = (i) => setPo((p) => ({ ...p, items: p.items.filter((_, j) => j !== i) }));
  const updateItem = (i, updated) => setPo((p) => ({ ...p, items: p.items.map((it, j) => j === i ? updated : it) }));
  const subTotal = (po.items || []).reduce((s, r) => s + (r.qty || 0) * (parseFloat(r.rate) || 0), 0);
  const grandTotal = subTotal + Number(po.taxes || 0);
  const save = () => {
    var _a, _b;
    if (!((_a = po.vendorTo) == null ? void 0 : _a.name)) {
      toast.error("Vendor name required");
      return;
    }
    const pos = S.get(SK.PO, []);
    const ex = pos.findIndex((p) => p.poNo === po.poNo);
    let updated;
    if (ex >= 0) {
      updated = [...pos];
      updated[ex] = { ...po };
    } else {
      updated = [...pos, { ...po }];
    }
    S.set(SK.PO, updated);
    logAudit(ex >= 0 ? "PO_EDITED" : "PO_CREATED", `${po.poNo} \u2014 ${(_b = po.vendorTo) == null ? void 0 : _b.name}`, currentUser);
    toast.success(`${po.poNo} saved!`);
    if (onSave) onSave(po);
  };
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, gap: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "inv-header-left" }, /* @__PURE__ */ React.createElement("div", { className: "inv-title", style: { fontFamily: "Sora,sans-serif", fontSize: 26, fontWeight: 800, color: "var(--text)" } }, "Purchase Order"), /* @__PURE__ */ React.createElement("div", { className: "inv-co-row", style: { color: "var(--text3)", fontSize: 13, marginTop: 3, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" } }, co.name && /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text2)", fontWeight: 600 } }, co.name), co.gstin && /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "monospace", fontSize: 11 } }, co.gstin))), /* @__PURE__ */ React.createElement("div", { className: "inv-no-badge", style: { flexShrink: 0 } }, po.poNo)), /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "g4" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "PO Number"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: po.poNo, onChange: upF("poNo"), style: { fontFamily: "monospace", fontWeight: 700, color: "var(--gold)" } })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "PO Date"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: po.date, onChange: upF("date") })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Delivery By"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: po.deliveryDate || "", onChange: upF("deliveryDate") })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Ref / Invoice No."), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: po.refNo || "", onChange: upF("refNo"), placeholder: "Ref-001 (optional)" }))), /* @__PURE__ */ React.createElement("div", { className: "g2", style: { marginTop: 4 } }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Status"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: po.status || "Draft", onChange: upF("status") }, ["Draft", "Sent", "Approved", "Partially Received", "Received", "Cancelled"].map((s) => /* @__PURE__ */ React.createElement("option", { key: s }, s)))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Taxes / Freight / Other Charges (\u20B9)"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: po.taxes || "", onChange: upF("taxes"), placeholder: "0" })))), /* @__PURE__ */ React.createElement("div", { className: "g2 bill-ship-grid", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", { className: "dot" }), "Vendor / Supplier"), /* @__PURE__ */ React.createElement("div", { className: "field", style: { position: "relative" } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Vendor Name *"), /* @__PURE__ */ React.createElement(
    "input",
    {
      ref: vendorInputRef,
      className: "field-input",
      value: po.vendorTo.name,
      onChange: (e) => {
        upV("name")(e);
        setVendorQ(e.target.value);
        setShowVendorDrop(true);
      },
      onFocus: () => {
        setVendorQ(po.vendorTo.name);
        setShowVendorDrop(true);
      },
      onBlur: () => setTimeout(() => setShowVendorDrop(false), 150),
      placeholder: "Type vendor name..."
    }
  ), showVendorDrop && vendorMatched.length > 0 && /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "var(--card)",
    border: "1.5px solid var(--border2)",
    borderRadius: 10,
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    zIndex: 9999,
    maxHeight: 200,
    overflowY: "auto"
  } }, vendorMatched.map((c, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "hsn-opt", onMouseDown: (e) => {
    e.preventDefault();
    setPo((p) => ({ ...p, vendorTo: { name: c.name, address: c.address || "", city: c.city || "", state: c.state || "", pin: c.pin || "", gstin: c.gstin || "", phone: c.phone || "", email: c.email || "" } }));
    setVendorQ(c.name);
    setShowVendorDrop(false);
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--text)" } }, c.name), c.gstin && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--gold)", fontFamily: "monospace" } }, c.gstin))))), /* @__PURE__ */ React.createElement("div", { className: "g2" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "GSTIN"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: po.vendorTo.gstin || "", onChange: upV("gstin"), placeholder: "29XXXXX...", style: { textTransform: "uppercase" } })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Phone"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: po.vendorTo.phone || "", onChange: upV("phone") }))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Address"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: po.vendorTo.address || "", onChange: upV("address"), placeholder: "Street, Area" })), /* @__PURE__ */ React.createElement("div", { className: "g3" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "City"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: po.vendorTo.city || "", onChange: upV("city") })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "State"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: po.vendorTo.state || "", onChange: upV("state") })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "PIN"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: po.vendorTo.pin || "", onChange: upV("pin") })))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", { className: "dot" }), "Deliver To"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", marginBottom: 10, background: "var(--card2)", padding: "6px 10px", borderRadius: 6 } }, /* @__PURE__ */ React.createElement(Ic, { n: "map-pin", s: 16 }), " Where goods should be delivered (usually your company address)"), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Company / Name"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: po.deliverTo.name || co.name || "", onChange: upD("name"), placeholder: co.name || "Your company name" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Address"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: po.deliverTo.address || co.address || "", onChange: upD("address"), placeholder: co.address || "Delivery address" })), /* @__PURE__ */ React.createElement("div", { className: "g3" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "City"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: po.deliverTo.city || co.city || "", onChange: upD("city") })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "State"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: po.deliverTo.state || "", onChange: upD("state") })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "PIN"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: po.deliverTo.pin || co.pin || "", onChange: upD("pin") }))), /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginTop: 4 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Notes"), /* @__PURE__ */ React.createElement("textarea", { className: "field-input", value: po.notes || "", onChange: upF("notes"), rows: 2, placeholder: "Special delivery instructions..." })))), /* @__PURE__ */ React.createElement("div", { className: "card item-table-card", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, padding: "0 2px" } }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "dot" }), "Items / Products"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-primary btn-sm", onClick: addItem }, /* @__PURE__ */ React.createElement(Ic, { n: "plus", s: 13 }), "Add Row")), /* @__PURE__ */ React.createElement("div", { className: "table-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "ptable" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { style: { width: 28 } }, "#"), /* @__PURE__ */ React.createElement("th", null, "Description (type to search HSN)"), /* @__PURE__ */ React.createElement("th", null, "HSN / SAC Code"), /* @__PURE__ */ React.createElement("th", null, "Unit"), /* @__PURE__ */ React.createElement("th", { className: "r" }, "Qty"), /* @__PURE__ */ React.createElement("th", { className: "r" }, "Rate (\u20B9)"), /* @__PURE__ */ React.createElement("th", { className: "r" }, "Amount (\u20B9)"), /* @__PURE__ */ React.createElement("th", { style: { width: 38 } }))), /* @__PURE__ */ React.createElement("tbody", null, po.items.map((row, i) => /* @__PURE__ */ React.createElement(
    ItemRow,
    {
      key: i,
      row,
      idx: i,
      onChange: updateItem,
      onDelete: delItem,
      hsnList,
      gstType: "INTRA",
      descOnly: true
    }
  ))), /* @__PURE__ */ React.createElement("tfoot", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 8, style: { padding: "8px 10px" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", onClick: addItem }, /* @__PURE__ */ React.createElement(Ic, { n: "plus", s: 12 }), "Add Row"))))))), /* @__PURE__ */ React.createElement("div", { className: "two-col", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Terms & Conditions"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      className: "field-input",
      value: po.terms || "",
      onChange: upF("terms"),
      rows: 5,
      placeholder: `1. Goods must be delivered within the agreed delivery date.
2. Invoice must accompany each delivery.
3. Price once confirmed cannot be changed.
4. Partial deliveries must be pre-informed.`
    }
  ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "tax-box" }, /* @__PURE__ */ React.createElement("div", { className: "tax-row" }, /* @__PURE__ */ React.createElement("span", { className: "tax-label" }, "Sub Total"), /* @__PURE__ */ React.createElement("span", { className: "tax-val" }, "\u20B9", subTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 }))), /* @__PURE__ */ React.createElement("div", { className: "tax-row" }, /* @__PURE__ */ React.createElement("span", { className: "tax-label" }, "Taxes / Freight"), /* @__PURE__ */ React.createElement("span", { className: "tax-val" }, "\u20B9", Number(po.taxes || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }))), /* @__PURE__ */ React.createElement("div", { className: "tax-row total-row" }, /* @__PURE__ */ React.createElement("span", { className: "tax-label" }, "Grand Total"), /* @__PURE__ */ React.createElement("span", { className: "tax-val" }, "\u20B9", grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })))), /* @__PURE__ */ React.createElement("div", { className: "amt-words", style: { marginTop: 8 } }, numberToWords(grandTotal)))), /* @__PURE__ */ React.createElement("div", { className: "inv-actions", style: { display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderTop: "1px solid var(--border)", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { className: "inv-actions-left", style: { display: "flex", gap: 8, alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "var(--text3)" } }, "PO will be saved to ", /* @__PURE__ */ React.createElement("strong", { style: { color: "var(--text)" } }, "PO Register"))), /* @__PURE__ */ React.createElement("div", { className: "inv-actions-right", style: { display: "flex", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: () => {
    if (window.confirm("Start new PO?")) setPo(newPO());
  } }, /* @__PURE__ */ React.createElement(Ic, { n: "new", s: 14 }), "New PO"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-primary", onClick: save }, /* @__PURE__ */ React.createElement(Ic, { n: "save", s: 14 }), "Save PO"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-gold", onClick: () => {
    save();
    makePOPDF(po, co);
  } }, /* @__PURE__ */ React.createElement(Ic, { n: "pdf", s: 15 }), "Download PDF"))));
};
const POHistoryModal = ({ onClose, onLoad, currentUser, onNewPO, inline = false, searchQuery = "" }) => {
  const [orders, setOrders] = useState(S.get(SK.PO, []));
  const [q, setQ] = useState(searchQuery);
  useEffect(() => {
    if (searchQuery !== void 0) setQ(searchQuery);
  }, [searchQuery]);
  const isAdmin = (currentUser == null ? void 0 : currentUser.role) === "admin" || (currentUser == null ? void 0 : currentUser.role) === "superadmin";
  const rr = useReportRange("All Time");
  const rangeOrders = orders.filter((p) => inRangeDate(p.date, rr.applied));
  const filtered = [...orders].reverse().filter((p) => {
    var _a, _b, _c, _d;
    return inRangeDate(p.date, rr.applied) && (!q || ((_a = p.poNo) == null ? void 0 : _a.toLowerCase().includes(q.toLowerCase())) || ((_c = (_b = p.vendorTo) == null ? void 0 : _b.name) == null ? void 0 : _c.toLowerCase().includes(q.toLowerCase())) || ((_d = p.refNo) == null ? void 0 : _d.toLowerCase().includes(q.toLowerCase())));
  });
  const delPO = (poNo) => {
    if (!window.confirm("Delete this PO?")) return;
    const updated = orders.filter((p) => p.poNo !== poNo);
    setOrders(updated);
    S.set(SK.PO, updated);
    logAudit("PO_DELETED", `PO ${poNo} deleted`, currentUser);
    toast.info("PO deleted");
  };
  const STATUS_COLOR = { "Draft": "#6B7280", "Sent": "#1D4ED8", "Approved": "#065F46", "Partially Received": "#B45309", "Received": "#15803D", "Cancelled": "#991B1B" };
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay", onClick: inline ? void 0 : ((e) => e.target === e.currentTarget && onClose()) }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal", style: { ...inline ? {} : { maxWidth: "min(1260px, 95vw)", width: "100%" } } }, /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("span", { className: "modal-title" }, /* @__PURE__ */ React.createElement(Ic, { n: "cart", s: 20 }), " Purchase Orders (", orders.length, ")"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: () => {
    onClose();
    onNewPO && onNewPO();
  } }, /* @__PURE__ */ React.createElement(Ic, { n: "plus", s: 14 }), " New PO"), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Ic, { n: "x" })))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement(
    ReportToolbar,
    {
      section: "Purchases",
      title: "Purchase Order Register",
      range: rr,
      count: rangeOrders.length,
      canExport: isAdmin,
      onExport: (f, r) => makePOExcel(rangeOrders, f, { period: rangePeriodText(r) })
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", zIndex: 1 } }, /* @__PURE__ */ React.createElement(Ic, { n: "search", s: 14 })), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "field-input",
      value: q,
      onChange: (e) => setQ(e.target.value),
      placeholder: "Search by PO number, vendor, ref no...",
      style: { paddingLeft: 38, width: "100%" }
    }
  )), filtered.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "40px", color: "var(--text3)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 36, marginBottom: 8 } }, /* @__PURE__ */ React.createElement(Ic, { n: "cart", s: 36 })), /* @__PURE__ */ React.createElement("div", null, "No purchase orders yet")) : /* @__PURE__ */ React.createElement("div", { style: { border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)", borderBottom: "2px solid var(--border2)" } }, ["PO No.", "Status", "Vendor", "Date", "Delivery", "Amount", "Items", "Actions"].map((h, i) => /* @__PURE__ */ React.createElement("th", { key: i, style: {
    padding: "10px 12px",
    fontSize: 10,
    fontWeight: 700,
    color: "var(--text2)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    textAlign: i >= 5 ? "right" : i === 7 ? "center" : "left",
    whiteSpace: "nowrap"
  } }, h)))), /* @__PURE__ */ React.createElement("tbody", null, filtered.map((p, i) => {
    var _a;
    const grand = (p.items || []).reduce((s, r) => s + (r.qty || 0) * (parseFloat(r.rate) || 0), 0) + Number(p.taxes || 0);
    const sc = STATUS_COLOR[p.status] || "#6B7280";
    return /* @__PURE__ */ React.createElement(
      "tr",
      {
        key: i,
        style: { borderBottom: "1px solid var(--border)", transition: "background 0.12s" },
        onMouseEnter: (e) => e.currentTarget.style.background = "var(--primary-bg)",
        onMouseLeave: (e) => e.currentTarget.style.background = ""
      },
      /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", fontFamily: "monospace", fontWeight: 700, fontSize: 12, color: "var(--gold)", whiteSpace: "nowrap" } }, p.poNo),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 8px", whiteSpace: "nowrap" } }, /* @__PURE__ */ React.createElement("span", { style: {
        fontSize: 10,
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: 20,
        background: sc + "22",
        color: sc,
        border: `1px solid ${sc}44`,
        whiteSpace: "nowrap"
      } }, p.status || "Draft")),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", fontWeight: 600, fontSize: 13, color: "var(--text)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, ((_a = p.vendorTo) == null ? void 0 : _a.name) || "\u2014"),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", fontSize: 12, color: "var(--text2)", whiteSpace: "nowrap" } }, fmtDate(p.date)),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", fontSize: 12, color: "var(--text2)", whiteSpace: "nowrap" } }, p.deliveryDate ? fmtDate(p.deliveryDate) : "\u2014"),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: 13, color: "var(--primary2)", whiteSpace: "nowrap" } }, fmt(grand)),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "right", fontSize: 12, color: "var(--text2)", whiteSpace: "nowrap" } }, (p.items || []).filter((r) => r.desc).length),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px", textAlign: "center", whiteSpace: "nowrap" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, justifyContent: "center", alignItems: "center" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", style: { padding: "4px 10px", fontSize: 11 }, onClick: () => {
        onLoad(p);
      } }, "Edit"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", style: { padding: "4px 10px", fontSize: 11 }, onClick: () => makePOPDF(p, S.get(SK.CO, {})) }, "PDF"), isAdmin && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger btn-icon", style: { width: 28, height: 28 }, onClick: () => delPO(p.poNo) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 11 }))))
    );
  }))))), /* @__PURE__ */ React.createElement("div", { className: "modal-ftr" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: onClose }, "Close"))));
};
