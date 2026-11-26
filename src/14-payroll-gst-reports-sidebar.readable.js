const PrHead = ({ title, sub, children }) => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 200 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, fontWeight: 800, fontFamily: "Sora,sans-serif" } }, title), sub && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text3)" } }, sub)), children);
const prActiveFor = (e, ym) => e.status !== "inactive" && (!e.doj || ymOf(e.doj) <= ym) && (!e.dol || e.dol.slice(0, 7) >= ym);
const PayrollDashboard = ({ go }) => {
  const emps = getEmployees(), runs = getPayRuns(), set = prSettings();
  const active = emps.filter((e) => e.status === "active" || !e.status);
  const done = runs.filter((r) => r.status !== "draft").sort((a, b) => b.month.localeCompare(a.month));
  const last = done[0];
  const lt = last ? prTotals(last.rows) : null;
  const nm = prNextMonth();
  const draft = runs.find((r) => r.month === nm && r.status === "draft");
  const dueDate = monthEndISO(+nm.slice(0, 4), +nm.slice(5, 7));
  const daysLeft = daysBetween(today(), dueDate);
  const [liab, setLiab] = useState(null);
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        setLiab(prLiabilities());
      } catch (e) {
      }
    }, 60);
    return () => clearTimeout(t);
  }, []);
  const todos = [];
  if (emps.length === 0) todos.push({ t: "Add your first employee", s: "Set up salary structures to begin", p: "pr_employees" });
  const noBank = active.filter((e) => !(e.bank && e.bank.acct)).length;
  if (noBank) todos.push({ t: `${noBank} employee${noBank > 1 ? "s" : ""} without bank details`, s: "Needed for salary transfer advice", p: "pr_employees" });
  const noPan = active.filter((e) => !e.pan).length;
  if (noPan) todos.push({ t: `${noPan} employee${noPan > 1 ? "s" : ""} without PAN`, s: "TDS at higher rate (206AA) may apply", p: "pr_employees" });
  const noUan = active.filter((e) => e.pfMode !== "none" && !e.uan).length;
  if (noUan && set.pfOn) todos.push({ t: `${noUan} employee${noUan > 1 ? "s" : ""} without UAN`, s: "Required for the PF ECR file", p: "pr_employees" });
  if (draft) todos.push({ t: `Pay run for ${prMonthLabel(nm)} is in draft`, s: "Review and approve it", p: "pr_payruns" });
  if (liab) {
    [["salary", "Salary payable"], ["pf", "PF payable"], ["esi", "ESI payable"], ["pt", "Professional tax payable"], ["tds", "TDS on salary payable"]].forEach(([k, l]) => {
      if (liab[k] > 0.5) todos.push({ t: `${l}: ${fmt(liab[k])}`, s: "Pay it, then match the bank debit in Bank Reconciliation \u2192 Post to ledger", p: "pr_reports" });
    });
  }
  const byDept = {};
  active.forEach((e) => {
    const d = e.dept || "Unassigned";
    byDept[d] = (byDept[d] || 0) + 1;
  });
  const dMax = Math.max(1, ...Object.values(byDept));
  const hist = done.slice(0, 6).reverse().map((r) => ({ m: prMonthLabel(r.month).slice(0, 3), t: prTotals(r.rows) }));
  const hMax = Math.max(1, ...hist.map((h) => h.t.employerCost));
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(PrHead, { title: "Payroll", sub: `${active.length} active employees \xB7 ${set.ptState} professional tax` }), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, marginBottom: 10 } }, "Upcoming pay run"), active.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: "var(--text3)" } }, "Add employees to start running payroll.") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13 } }, "Pay period ", /* @__PURE__ */ React.createElement("b", null, prMonthLabel(nm))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text3)", margin: "4px 0 12px" } }, "Pay day ", fmtDate(dueDate), " \xB7 ", daysLeft > 0 ? `${daysLeft} days to go` : daysLeft === 0 ? "today" : `${-daysLeft} days ago`, " \xB7 ", active.length, " employees"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => go("pr_payruns") }, draft ? "Continue draft pay run" : "Run payroll"))), /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, marginBottom: 10 } }, "To-do tasks"), todos.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: "var(--text3)" } }, "\u2705 Nothing pending.") : todos.slice(0, 6).map((t, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "tb2-menu-item", style: { padding: "7px 6px" }, onClick: () => go(t.p) }, /* @__PURE__ */ React.createElement("span", { className: "tb2-al-dot", style: { background: "#E69A12" } }), /* @__PURE__ */ React.createElement("span", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { className: "tb2-menu-t" }, t.t), /* @__PURE__ */ React.createElement("div", { className: "tb2-menu-s" }, t.s)))))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 14, marginTop: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, marginBottom: 12 } }, "Benefits & deductions ", /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 500, color: "var(--text3)", fontSize: 11.5 } }, "\xB7 ", last ? prMonthLabel(last.month) : "no run yet")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } }, [["EPF", lt ? lt.pfEmp + lt.pfEr : 0, "#8B5CF6"], ["ESI", lt ? lt.esiEmp + lt.esiEr : 0, "#17A673"], ["TDS", lt ? lt.tds : 0, "#F1495C"], ["Prof. tax", lt ? lt.pt : 0, "#E69A12"]].map(([l, v, c]) => /* @__PURE__ */ React.createElement("div", { key: l, style: { flex: "1 1 120px", padding: "10px 12px", borderRadius: 10, background: "var(--card2)", borderLeft: `3px solid ${c}` } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10.5, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase" } }, l), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 15, marginTop: 2 } }, v ? fmt(v) : "\u2014"))))), /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, marginBottom: 12 } }, "Employee summary"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 30, fontWeight: 800, color: "var(--green)", fontFamily: "Sora,sans-serif" } }, active.length), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "var(--text3)" } }, "active employees"), /* @__PURE__ */ React.createElement("span", { style: { flex: 1 } }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => go("pr_employees") }, "View")), Object.entries(byDept).slice(0, 5).map(([d, n]) => /* @__PURE__ */ React.createElement("div", { key: d, style: { display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, marginBottom: 5 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, d), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, height: 6, background: "var(--card3)", borderRadius: 3 } }, /* @__PURE__ */ React.createElement("div", { style: { width: n / dMax * 100 + "%", height: "100%", background: "var(--primary)", borderRadius: 3 } })), /* @__PURE__ */ React.createElement("b", null, n))))), /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 16, marginTop: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, marginBottom: 12 } }, "Payroll cost summary ", /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 500, color: "var(--text3)", fontSize: 11.5 } }, "\xB7 last ", hist.length, " runs")), hist.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: "var(--text3)" } }, "Your cost trend appears after the first approved pay run.") : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-end", gap: 18, height: 150, padding: "0 8px" } }, hist.map((h, i) => {
    const sc = 120 / hMax;
    return /* @__PURE__ */ React.createElement("div", { key: i, style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text3)" } }, fmtShort(h.t.employerCost)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column-reverse", width: "60%", minWidth: 22, maxWidth: 60 }, title: `Net ${fmt(h.t.net)} \xB7 Deductions ${fmt(h.t.totalDed)} \xB7 Employer ${fmt(h.t.pfEr + h.t.esiEr)}` }, /* @__PURE__ */ React.createElement("div", { style: { height: h.t.net * sc, background: "#17A673" } }), /* @__PURE__ */ React.createElement("div", { style: { height: h.t.totalDed * sc, background: "#4F6FE8" } }), /* @__PURE__ */ React.createElement("div", { style: { height: (h.t.pfEr + h.t.esiEr) * sc, background: "#E69A12", borderRadius: "3px 3px 0 0" } })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700 } }, h.m));
  })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 14, marginTop: 10, fontSize: 11, color: "var(--text3)" } }, /* @__PURE__ */ React.createElement("span", null, "\u25A0 ", /* @__PURE__ */ React.createElement("span", { style: { color: "#17A673" } }, "Net pay")), /* @__PURE__ */ React.createElement("span", null, "\u25A0 ", /* @__PURE__ */ React.createElement("span", { style: { color: "#4F6FE8" } }, "Employee deductions")), /* @__PURE__ */ React.createElement("span", null, "\u25A0 ", /* @__PURE__ */ React.createElement("span", { style: { color: "#E69A12" } }, "Employer contributions")))));
};
const blankEmp = (set, n) => ({
  id: newId("EMP"),
  code: "EMP-" + String(n).padStart(3, "0"),
  name: "",
  email: "",
  phone: "",
  gender: "",
  dept: "",
  desig: "",
  doj: today(),
  dol: "",
  status: "active",
  pan: "",
  uan: "",
  esiNo: "",
  bank: { name: "", acct: "", ifsc: "" },
  regime: "new",
  pfMode: "ceiling",
  esiMode: "auto",
  ptMode: "auto",
  tdsMode: "auto",
  annualGross: "",
  earn: { basic: "", hra: "", conv: "", special: "" },
  extra: [],
  ded: [],
  rentMonthly: "",
  metro: true,
  decl80C: "",
  declOther: ""
});
const PrFieldBox = ({ label, children, w }) => /* @__PURE__ */ React.createElement("div", { className: "field", style: { flex: w || "1 1 180px" } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, label), children);
const PrSetCtx = React.createContext({ s: {}, up: () => {
} });
const PrF = ({ label, k, type, w, ph, hint }) => {
  const { s, up } = React.useContext(PrSetCtx);
  return /* @__PURE__ */ React.createElement("div", { className: "field", style: { flex: w || "1 1 200px" } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, label), /* @__PURE__ */ React.createElement("input", { type: type || "text", className: "field-input", value: s[k] === void 0 ? "" : s[k], placeholder: ph || "", onChange: (e) => up(k, e.target.value) }), hint && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10.5, color: "var(--text3)", marginTop: 3 } }, hint));
};
const PrTg = ({ k, label, sub }) => {
  const { s, up } = React.useContext(PrSetCtx);
  return /* @__PURE__ */ React.createElement("label", { style: { display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", cursor: "pointer" } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: !!s[k], onChange: (e) => up(k, e.target.checked), style: { marginTop: 3 } }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 13 } }, label), sub && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--text3)" } }, sub)));
};
const PayrollEmployees = ({ currentUser }) => {
  const [list, setList] = useState(getEmployees());
  const [form, setForm] = useState(null);
  const [q, setQ] = useState("");
  const [flt, setFlt] = useState("active");
  const set = prSettings();
  const isAdmin = isAdminUser(currentUser);
  const reload = () => setList(getEmployees());
  const shown = list.filter((e) => (flt === "all" || (e.status || "active") === flt) && `${e.name} ${e.code} ${e.dept} ${e.desig}`.toLowerCase().includes(q.toLowerCase()));
  const autoSplit = () => {
    const g = (parseFloat(form.annualGross) || 0) / 12;
    if (g <= 0) {
      toast.error("Enter the annual gross salary first");
      return;
    }
    const basic = r2(g * set.basicPct / 100), hra = r2(basic * set.hraPct / 100), special = r2(g - basic - hra);
    setForm((f) => ({ ...f, earn: { basic, hra, conv: 0, special } }));
    toast.info(`Basic ${set.basicPct}% \xB7 HRA ${set.hraPct}% of basic \xB7 rest as special allowance`);
  };
  const up = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const upE = (k, v) => setForm((f) => ({ ...f, earn: { ...f.earn, [k]: v } }));
  const upB = (k, v) => setForm((f) => ({ ...f, bank: { ...f.bank, [k]: v } }));
  const save = () => {
    const f = form;
    if (!f.name.trim()) {
      toast.error("Employee name is required");
      return;
    }
    if (!f.doj) {
      toast.error("Date of joining is required");
      return;
    }
    const std2 = prStdEarnings({ ...f, earn: { basic: parseFloat(f.earn.basic) || 0, hra: parseFloat(f.earn.hra) || 0, conv: parseFloat(f.earn.conv) || 0, special: parseFloat(f.earn.special) || 0 }, extra: f.extra });
    if (std2.gross <= 0) {
      toast.error("Enter the monthly salary components");
      return;
    }
    if (list.some((x) => x.code === f.code && x.id !== f.id)) {
      toast.error("Employee ID already used");
      return;
    }
    if (f.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(f.pan.trim().toUpperCase())) {
      toast.error("PAN format looks wrong (e.g. ABCDE1234F)");
      return;
    }
    const rec = { ...f, name: f.name.trim(), pan: (f.pan || "").trim().toUpperCase(), earn: { basic: parseFloat(f.earn.basic) || 0, hra: parseFloat(f.earn.hra) || 0, conv: parseFloat(f.earn.conv) || 0, special: parseFloat(f.earn.special) || 0 } };
    const ex = list.some((x) => x.id === f.id);
    S.set(SK.PR_EMP, ex ? list.map((x) => x.id === f.id ? rec : x) : [...list, rec]);
    logAudit(ex ? "EMPLOYEE_EDITED" : "EMPLOYEE_ADDED", `${rec.code} ${rec.name}`, currentUser);
    reload();
    setForm(null);
    toast.success(ex ? "Employee updated" : "Employee added");
  };
  const del = (e) => {
    if (!isAdmin) {
      toast.error("Only Admin can delete");
      return;
    }
    if (getPayRuns().some((r) => r.status !== "draft" && (r.rows || []).some((x) => x.empId === e.id))) {
      toast.error("This employee is in a processed pay run \u2014 mark them Exited instead.");
      return;
    }
    if (!window.confirm("Delete " + e.name + "?")) return;
    S.set(SK.PR_EMP, list.filter((x) => x.id !== e.id));
    reload();
  };
  const std = form ? prStdEarnings({ earn: { basic: parseFloat(form.earn.basic) || 0, hra: parseFloat(form.earn.hra) || 0, conv: parseFloat(form.earn.conv) || 0, special: parseFloat(form.earn.special) || 0 }, extra: form.extra }) : null;
  const addRow = (k) => setForm((f) => ({ ...f, [k]: [...f[k], { name: "", amount: "" }] }));
  const upRow = (k, i, p, v) => setForm((f) => ({ ...f, [k]: f[k].map((x, j) => j === i ? { ...x, [p]: v } : x) }));
  const delRow = (k, i) => setForm((f) => ({ ...f, [k]: f[k].filter((_, j) => j !== i) }));
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(PrHead, { title: "Employees", sub: `${list.filter((e) => (e.status || "active") === "active").length} active \xB7 ${list.length} total` }, /* @__PURE__ */ React.createElement("select", { className: "field-input", style: { width: 130 }, value: flt, onChange: (e) => setFlt(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "active" }, "Active"), /* @__PURE__ */ React.createElement("option", { value: "inactive" }, "Inactive"), /* @__PURE__ */ React.createElement("option", { value: "exited" }, "Exited"), /* @__PURE__ */ React.createElement("option", { value: "all" }, "All")), /* @__PURE__ */ React.createElement("input", { className: "field-input", style: { width: 220 }, placeholder: "Search employees\u2026", value: q, onChange: (e) => setQ(e.target.value) }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => setForm(blankEmp(set, list.length + 1)) }, "+ Add employee")), form && /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 16, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14, marginBottom: 10 } }, list.some((x) => x.id === form.id) ? "Edit employee" : "New employee"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(PrFieldBox, { label: "Employee ID *", w: "0 1 130px" }, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.code, onChange: (e) => up("code", e.target.value) })), /* @__PURE__ */ React.createElement(PrFieldBox, { label: "Full name *", w: "2 1 240px" }, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.name, onChange: (e) => up("name", e.target.value) })), /* @__PURE__ */ React.createElement(PrFieldBox, { label: "Work email" }, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.email, onChange: (e) => up("email", e.target.value) })), /* @__PURE__ */ React.createElement(PrFieldBox, { label: "Phone", w: "0 1 150px" }, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.phone, onChange: (e) => up("phone", e.target.value) }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(PrFieldBox, { label: "Department" }, /* @__PURE__ */ React.createElement("input", { className: "field-input", list: "prdept", value: form.dept, onChange: (e) => up("dept", e.target.value) }), /* @__PURE__ */ React.createElement("datalist", { id: "prdept" }, set.departments.map((d) => /* @__PURE__ */ React.createElement("option", { key: d, value: d })))), /* @__PURE__ */ React.createElement(PrFieldBox, { label: "Designation" }, /* @__PURE__ */ React.createElement("input", { className: "field-input", list: "prdesig", value: form.desig, onChange: (e) => up("desig", e.target.value) }), /* @__PURE__ */ React.createElement("datalist", { id: "prdesig" }, set.designations.map((d) => /* @__PURE__ */ React.createElement("option", { key: d, value: d })))), /* @__PURE__ */ React.createElement(PrFieldBox, { label: "Date of joining *", w: "0 1 160px" }, /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: form.doj, onChange: (e) => up("doj", e.target.value) })), /* @__PURE__ */ React.createElement(PrFieldBox, { label: "Status", w: "0 1 140px" }, /* @__PURE__ */ React.createElement("select", { className: "field-input", value: form.status, onChange: (e) => up("status", e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "active" }, "Active"), /* @__PURE__ */ React.createElement("option", { value: "inactive" }, "Inactive"), /* @__PURE__ */ React.createElement("option", { value: "exited" }, "Exited"))), form.status === "exited" && /* @__PURE__ */ React.createElement(PrFieldBox, { label: "Last working day", w: "0 1 160px" }, /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: form.dol || "", onChange: (e) => up("dol", e.target.value) }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(PrFieldBox, { label: "PAN" }, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.pan, onChange: (e) => up("pan", e.target.value.toUpperCase()), placeholder: "ABCDE1234F" })), /* @__PURE__ */ React.createElement(PrFieldBox, { label: "UAN (PF)" }, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.uan, onChange: (e) => up("uan", e.target.value) })), /* @__PURE__ */ React.createElement(PrFieldBox, { label: "ESI number" }, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.esiNo, onChange: (e) => up("esiNo", e.target.value) })), /* @__PURE__ */ React.createElement(PrFieldBox, { label: "Tax regime", w: "0 1 170px" }, /* @__PURE__ */ React.createElement("select", { className: "field-input", value: form.regime, onChange: (e) => up("regime", e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "new" }, "New regime (default)"), /* @__PURE__ */ React.createElement("option", { value: "old" }, "Old regime")))), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, margin: "8px 0 6px" } }, "Salary structure (monthly)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" } }, /* @__PURE__ */ React.createElement(PrFieldBox, { label: "Annual gross (optional helper)", w: "0 1 190px" }, /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: form.annualGross, onChange: (e) => up("annualGross", e.target.value), placeholder: "e.g. 900000" })), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-primary", style: { marginBottom: 14 }, onClick: autoSplit }, "Auto-split"), /* @__PURE__ */ React.createElement(PrFieldBox, { label: "Basic", w: "0 1 130px" }, /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: form.earn.basic, onChange: (e) => upE("basic", e.target.value) })), /* @__PURE__ */ React.createElement(PrFieldBox, { label: "HRA", w: "0 1 130px" }, /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: form.earn.hra, onChange: (e) => upE("hra", e.target.value) })), /* @__PURE__ */ React.createElement(PrFieldBox, { label: "Conveyance", w: "0 1 130px" }, /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: form.earn.conv, onChange: (e) => upE("conv", e.target.value) })), /* @__PURE__ */ React.createElement(PrFieldBox, { label: "Special allowance", w: "0 1 150px" }, /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: form.earn.special, onChange: (e) => upE("special", e.target.value) }))), form.extra.map((x, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", gap: 8, marginBottom: 6 } }, /* @__PURE__ */ React.createElement("input", { className: "field-input", style: { flex: 2 }, placeholder: "Other allowance name", value: x.name, onChange: (e) => upRow("extra", i, "name", e.target.value) }), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { flex: 1 }, placeholder: "Amount", value: x.amount, onChange: (e) => upRow("extra", i, "amount", e.target.value) }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger btn-icon", onClick: () => delRow("extra", i) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 11 })))), form.ded.map((x, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", gap: 8, marginBottom: 6 } }, /* @__PURE__ */ React.createElement("input", { className: "field-input", style: { flex: 2 }, placeholder: "Fixed deduction name (e.g. insurance)", value: x.name, onChange: (e) => upRow("ded", i, "name", e.target.value) }), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { flex: 1 }, placeholder: "Amount", value: x.amount, onChange: (e) => upRow("ded", i, "amount", e.target.value) }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger btn-icon", onClick: () => delRow("ded", i) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 11 })))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 6, alignItems: "center" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => addRow("extra") }, "+ Allowance"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => addRow("ded") }, "+ Fixed deduction"), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", fontSize: 13 } }, "Monthly gross ", /* @__PURE__ */ React.createElement("b", null, fmt(std.gross)), " \xB7 Annual ", /* @__PURE__ */ React.createElement("b", null, fmt(std.gross * 12)), " \xB7 Basic is ", std.gross > 0 ? Math.round(std.basic / std.gross * 100) : 0, "% ", /* @__PURE__ */ React.createElement("span", { style: { color: std.gross > 0 && std.basic / std.gross < 0.5 ? "var(--gold)" : "var(--text3)", fontSize: 11 } }, std.gross > 0 && std.basic / std.gross < 0.5 ? "(PF/gratuity use the 50% \u201Cwages\u201D rule)" : ""))), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, margin: "8px 0 6px" } }, "Statutory & bank"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(PrFieldBox, { label: "Provident fund", w: "0 1 200px" }, /* @__PURE__ */ React.createElement("select", { className: "field-input", value: form.pfMode, onChange: (e) => up("pfMode", e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "ceiling" }, "On wage ceiling"), /* @__PURE__ */ React.createElement("option", { value: "actual" }, "On actual wages"), /* @__PURE__ */ React.createElement("option", { value: "none" }, "Not applicable"))), /* @__PURE__ */ React.createElement(PrFieldBox, { label: "ESI", w: "0 1 160px" }, /* @__PURE__ */ React.createElement("select", { className: "field-input", value: form.esiMode, onChange: (e) => up("esiMode", e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "auto" }, "Auto (\u2264 ceiling)"), /* @__PURE__ */ React.createElement("option", { value: "none" }, "Not applicable"))), /* @__PURE__ */ React.createElement(PrFieldBox, { label: "Professional tax", w: "0 1 160px" }, /* @__PURE__ */ React.createElement("select", { className: "field-input", value: form.ptMode, onChange: (e) => up("ptMode", e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "auto" }, "Auto (state slab)"), /* @__PURE__ */ React.createElement("option", { value: "none" }, "Exempt"))), /* @__PURE__ */ React.createElement(PrFieldBox, { label: "TDS", w: "0 1 150px" }, /* @__PURE__ */ React.createElement("select", { className: "field-input", value: form.tdsMode, onChange: (e) => up("tdsMode", e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "auto" }, "Auto"), /* @__PURE__ */ React.createElement("option", { value: "none" }, "Do not deduct")))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(PrFieldBox, { label: "Bank name" }, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.bank.name, onChange: (e) => upB("name", e.target.value) })), /* @__PURE__ */ React.createElement(PrFieldBox, { label: "Account number" }, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.bank.acct, onChange: (e) => upB("acct", e.target.value) })), /* @__PURE__ */ React.createElement(PrFieldBox, { label: "IFSC", w: "0 1 160px" }, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.bank.ifsc, onChange: (e) => upB("ifsc", e.target.value.toUpperCase()) }))), form.regime === "old" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, margin: "8px 0 6px" } }, "Old-regime declarations"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(PrFieldBox, { label: "Monthly rent paid (HRA exemption)", w: "0 1 220px" }, /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: form.rentMonthly, onChange: (e) => up("rentMonthly", e.target.value) })), /* @__PURE__ */ React.createElement(PrFieldBox, { label: "Metro city?", w: "0 1 130px" }, /* @__PURE__ */ React.createElement("select", { className: "field-input", value: form.metro ? "y" : "n", onChange: (e) => up("metro", e.target.value === "y") }, /* @__PURE__ */ React.createElement("option", { value: "y" }, "Yes (50%)"), /* @__PURE__ */ React.createElement("option", { value: "n" }, "No (40%)"))), /* @__PURE__ */ React.createElement(PrFieldBox, { label: "Sec 80C (max 1,50,000)", w: "0 1 200px" }, /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: form.decl80C, onChange: (e) => up("decl80C", e.target.value) })), /* @__PURE__ */ React.createElement(PrFieldBox, { label: "Other Ch. VI-A (80D, NPS\u2026)", w: "0 1 220px" }, /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: form.declOther, onChange: (e) => up("declOther", e.target.value) })))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 6 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: save }, "Save employee"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: () => setForm(null) }, "Cancel"))), shown.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: list.length ? "No employees match." : "No employees yet \u2014 click \u201C+ Add employee\u201D." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 900 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Employee"), /* @__PURE__ */ React.createElement("th", { style: th }, "Work email"), /* @__PURE__ */ React.createElement("th", { style: th }, "Department"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Monthly gross"), /* @__PURE__ */ React.createElement("th", { style: th }, "Joined"), /* @__PURE__ */ React.createElement("th", { style: th }, "Status"), /* @__PURE__ */ React.createElement("th", { style: th })), /* @__PURE__ */ React.createElement("tbody", null, shown.map((e) => /* @__PURE__ */ React.createElement("tr", { key: e.id, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center" } }, /* @__PURE__ */ React.createElement(PrAvatar, { name: e.name }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--primary2)", cursor: "pointer" }, onClick: () => setForm({ ...blankEmp(set, 1), ...e, bank: { name: "", acct: "", ifsc: "", ...e.bank || {} }, earn: { ...e.earn }, extra: e.extra || [], ded: e.ded || [] }) }, e.name, " ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text3)", fontWeight: 500 } }, "\u2014 ", e.code)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)" } }, e.desig)))), /* @__PURE__ */ React.createElement("td", { style: td }, e.email), /* @__PURE__ */ React.createElement("td", { style: td }, e.dept), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(prStdEarnings(e).gross)), /* @__PURE__ */ React.createElement("td", { style: td }, fmtDate(e.doj)), /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement(PrStatus, { s: e.status || "active" })), /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger btn-icon", onClick: () => del(e) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 11 }))))))));
};
const PayrollRuns = ({ currentUser }) => {
  const [tab, setTab] = useState("run");
  const [runs, setRuns] = useState(getPayRuns());
  const [edit, setEdit] = useState(null);
  const [month, setMonth] = useState(prNextMonth());
  const set = prSettings();
  const emps = getEmployees();
  const isAdmin = isAdminUser(currentUser);
  const co = S.get(SK.CO, {}) || {};
  const reload = () => setRuns(getPayRuns());
  const startRun = () => {
    if (runs.some((r) => r.month === month)) {
      toast.error("A pay run already exists for " + prMonthLabel(month));
      return;
    }
    const el = emps.filter((e) => prActiveFor(e, month));
    if (!el.length) {
      toast.error("No active employees for " + prMonthLabel(month));
      return;
    }
    setEdit({ id: null, month, inputs: {} });
  };
  const rowsFor = (ed) => emps.filter((e) => prActiveFor(e, ed.month)).map((e) => prCompute(e, ed.month, ed.inputs[e.id], set, runs.filter((r) => r.id !== ed.id)));
  const rows = useMemo(() => edit ? rowsFor(edit) : [], [edit, runs]);
  const tot = prTotals(rows);
  const setIn = (id, k, v) => setEdit((ed) => ({ ...ed, inputs: { ...ed.inputs, [id]: { ...ed.inputs[id] || {}, [k]: v } } }));
  const persist = (status) => {
    const base = { id: edit.id || newId("PR"), month: edit.month, type: "regular", status, inputs: edit.inputs, rows, updatedAt: (/* @__PURE__ */ new Date()).toISOString(), createdBy: (currentUser == null ? void 0 : currentUser.email) || "" };
    const ex = runs.find((r) => r.id === base.id);
    let rec = { ...ex || {}, ...base };
    if (status === "approved") {
      rec.approvedBy = (currentUser == null ? void 0 : currentUser.email) || "";
      rec.approvedAt = (/* @__PURE__ */ new Date()).toISOString();
      rec.postDate = monthEndISO(+rec.month.slice(0, 4), +rec.month.slice(5, 7));
      if (!rec.voucherNo) {
        rec.voucherNo = nextVoucherNo();
        rec.txnRefNo = nextTxnRefNo(rec.postDate);
      }
    }
    S.set(SK.PR_RUNS, ex ? runs.map((r) => r.id === base.id ? rec : r) : [...runs, rec]);
    logAudit("PAYROLL_" + status.toUpperCase(), `${prMonthLabel(rec.month)} \u2014 net ${fmt(prTotals(rows).net)}`, currentUser);
    reload();
    setEdit(null);
  };
  const approve = () => {
    if (!window.confirm(`Approve payroll for ${prMonthLabel(edit.month)}?

Gross ${fmt(tot.gross)} \xB7 Net pay ${fmt(tot.net)}
This posts the payroll journal to your books (Dr Salaries, Cr Salary/PF/ESI/PT/TDS payable).`)) return;
    persist("approved");
    toast.success("Payroll approved and posted to the books");
    setTab("history");
  };
  const markPaid = (r) => {
    const d = window.prompt("Date the salary was paid (YYYY-MM-DD):", today());
    if (!d) return;
    S.set(SK.PR_RUNS, runs.map((x) => x.id === r.id ? { ...x, status: "paid", paidOn: d } : x));
    reload();
    toast.success("Marked as paid \u2014 now match the bank debit in Bank Reconciliation (Post to ledger \u2192 Salary Payable).");
  };
  const revert = (r) => {
    if (!isAdmin) {
      toast.error("Only Admin can revert a pay run");
      return;
    }
    if (!window.confirm("Revert to draft? The payroll journal for this run is removed from the books.")) return;
    S.set(SK.PR_RUNS, runs.map((x) => x.id === r.id ? { ...x, status: "draft" } : x));
    reload();
    toast.info("Reverted to draft");
  };
  const delRun = (r) => {
    if (r.status !== "draft" && !isAdmin) {
      toast.error("Revert it to draft first");
      return;
    }
    if (!window.confirm("Delete this pay run?")) return;
    S.set(SK.PR_RUNS, runs.filter((x) => x.id !== r.id));
    reload();
  };
  const open = (r) => {
    if (r.status === "draft") setEdit({ id: r.id, month: r.month, inputs: r.inputs || {} });
    else setEdit({ id: r.id, month: r.month, inputs: r.inputs || {}, readOnly: true, run: r });
  };
  const viewRows = edit && edit.readOnly ? edit.run.rows : rows;
  const viewTot = prTotals(viewRows);
  const sorted = [...runs].sort((a, b) => b.month.localeCompare(a.month));
  if (edit) return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(PrHead, { title: `${edit.readOnly ? "Pay run" : "Run payroll"} \u2014 ${prMonthLabel(edit.month)}`, sub: edit.readOnly ? `Status: ${edit.run.status} \xB7 voucher ${edit.run.voucherNo || ""}` : "Enter loss-of-pay days, bonus and other changes. Everything else is calculated." }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: () => setEdit(null) }, "\u2190 Back"), edit.readOnly && /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-primary", onClick: () => prOpenPayslips(edit.run, edit.run.rows, emps, co) }, "Print payslips"), !edit.readOnly && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: () => {
    persist("draft");
    toast.success("Draft saved");
  } }, "Save draft"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: approve }, "Approve & post"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 } }, /* @__PURE__ */ React.createElement(Kpi, { label: "Employees", value: String(viewTot.count) }), /* @__PURE__ */ React.createElement(Kpi, { label: "Gross pay", value: fmt(viewTot.gross) }), /* @__PURE__ */ React.createElement(Kpi, { label: "Deductions", value: fmt(viewTot.totalDed), color: "var(--gold)" }), /* @__PURE__ */ React.createElement(Kpi, { label: "Net pay", value: fmt(viewTot.net), color: "var(--green)" }), /* @__PURE__ */ React.createElement(Kpi, { label: "Employer cost", value: fmt(viewTot.employerCost), color: "var(--primary2)", sub: `incl. PF/ESI ${fmt(viewTot.pfEr + viewTot.esiEr)}` })), /* @__PURE__ */ React.createElement(Wrap, { min: 1250 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Employee"), /* @__PURE__ */ React.createElement("th", { style: thR }, "LOP days"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Paid days"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Bonus"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Gross"), /* @__PURE__ */ React.createElement("th", { style: thR }, "PF"), /* @__PURE__ */ React.createElement("th", { style: thR }, "ESI"), /* @__PURE__ */ React.createElement("th", { style: thR }, "PT"), /* @__PURE__ */ React.createElement("th", { style: thR }, "TDS"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Loan"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Other ded."), /* @__PURE__ */ React.createElement("th", { style: thR }, "Net pay")), /* @__PURE__ */ React.createElement("tbody", null, viewRows.map((r) => {
    const inp = (edit.inputs || {})[r.empId] || {};
    const ro = edit.readOnly;
    return /* @__PURE__ */ React.createElement("tr", { key: r.empId, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement("b", null, r.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10.5, color: "var(--text3)" } }, r.code, " \xB7 ", r.dept)), /* @__PURE__ */ React.createElement("td", { style: tdR }, ro ? r.lopDays : /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { width: 64, padding: "4px 6px", textAlign: "right" }, value: inp.lopDays || "", onChange: (e) => setIn(r.empId, "lopDays", e.target.value) })), /* @__PURE__ */ React.createElement("td", { style: tdR }, r.paidDays), /* @__PURE__ */ React.createElement("td", { style: tdR }, ro ? fmtN(r.bonus) : /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { width: 92, padding: "4px 6px", textAlign: "right" }, value: inp.bonus || "", onChange: (e) => setIn(r.empId, "bonus", e.target.value) })), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(r.gross)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(r.pfEmp)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(r.esiEmp)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(r.pt)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(r.tds)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(r.loan)), /* @__PURE__ */ React.createElement("td", { style: tdR }, ro ? fmtN(r.otherDed) : /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { width: 80, padding: "4px 6px", textAlign: "right" }, value: inp.otherDed || "", onChange: (e) => setIn(r.empId, "otherDed", e.target.value) })), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 800, color: "var(--green)" } }, fmtN(r.net)));
  }), /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)", fontWeight: 800 } }, /* @__PURE__ */ React.createElement("td", { style: td }, "Total"), /* @__PURE__ */ React.createElement("td", { style: tdR }), /* @__PURE__ */ React.createElement("td", { style: tdR }), /* @__PURE__ */ React.createElement("td", { style: tdR }), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(viewTot.gross)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(viewTot.pfEmp)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(viewTot.esiEmp)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(viewTot.pt)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(viewTot.tds)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(viewTot.loan)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(viewTot.otherDed + viewTot.fixedDed)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmtN(viewTot.net))))), /* @__PURE__ */ React.createElement(InfoNote, null, "On approval the books get: ", /* @__PURE__ */ React.createElement("b", null, "Dr"), " Employee Benefit Expense ", fmt(viewTot.gross), " + Employer contributions ", fmt(viewTot.pfEr + viewTot.esiEr), " \xB7 ", /* @__PURE__ */ React.createElement("b", null, "Cr"), " Salary payable ", fmt(viewTot.net), ", PF ", fmt(viewTot.pfEmp + viewTot.pfEr), ", ESI ", fmt(viewTot.esiEmp + viewTot.esiEr), ", Professional tax ", fmt(viewTot.pt), ", TDS ", fmt(viewTot.tds), ". Pay the salary and statutory dues from your bank, then match those bank debits in ", /* @__PURE__ */ React.createElement("b", null, "Bank Reconciliation \u2192 Post to ledger"), "."));
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(PrHead, { title: "Pay runs" }), /* @__PURE__ */ React.createElement(TabBar, { value: tab, onChange: setTab, tabs: [["run", "Run payroll"], ["history", "Payroll history"]] }), tab === "run" && /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 20, maxWidth: 560 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 15, marginBottom: 4 } }, "Process a regular pay run"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: "var(--text3)", marginBottom: 14 } }, "Choose the month. Employees who joined or left mid-month are pro-rated automatically."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "flex-end" } }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Pay period"), /* @__PURE__ */ React.createElement("input", { type: "month", className: "field-input", value: month, onChange: (e) => setMonth(e.target.value) })), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: startRun }, "Create pay run")), runs.filter((r) => r.status === "draft").length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 16, fontSize: 12.5 } }, "Drafts: ", runs.filter((r) => r.status === "draft").map((r) => /* @__PURE__ */ React.createElement("button", { key: r.id, className: "btn btn-sm btn-outline", style: { marginRight: 6 }, onClick: () => open(r) }, prMonthLabel(r.month))))), tab === "history" && (sorted.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "No pay runs yet." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 900 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Pay period"), /* @__PURE__ */ React.createElement("th", { style: th }, "Type"), /* @__PURE__ */ React.createElement("th", { style: th }, "Employees"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Gross"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Net pay"), /* @__PURE__ */ React.createElement("th", { style: th }, "Status"), /* @__PURE__ */ React.createElement("th", { style: th }, "Voucher"), /* @__PURE__ */ React.createElement("th", { style: th })), /* @__PURE__ */ React.createElement("tbody", null, sorted.map((r) => {
    const t = prTotals(r.rows || []);
    return /* @__PURE__ */ React.createElement("tr", { key: r.id, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, fontWeight: 700 } }, prMonthLabel(r.month)), /* @__PURE__ */ React.createElement("td", { style: td }, "Regular payroll"), /* @__PURE__ */ React.createElement("td", { style: td }, t.count), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(t.gross)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700 } }, fmt(t.net)), /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement(PrStatus, { s: r.status })), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontFamily: "monospace", fontSize: 11 } }, r.voucherNo || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { ...td, whiteSpace: "nowrap" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => open(r) }, r.status === "draft" ? "Edit" : "View"), " ", r.status === "approved" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: () => markPaid(r) }, "Mark paid"), " ", r.status !== "draft" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => revert(r) }, "Revert"), " ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger btn-icon", onClick: () => delRun(r) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 11 }))));
  })))));
};
const PayrollLoans = ({ currentUser }) => {
  const [list, setList] = useState(getPrLoans());
  const [form, setForm] = useState(null);
  const emps = getEmployees();
  const runs = getPayRuns();
  const save = () => {
    const f = form;
    if (!f.empId) {
      toast.error("Choose an employee");
      return;
    }
    if (!(parseFloat(f.amount) > 0) || !(parseFloat(f.emi) > 0)) {
      toast.error("Enter the loan amount and monthly EMI");
      return;
    }
    const rec = { ...f, amount: parseFloat(f.amount), emi: parseFloat(f.emi) };
    const ex = list.some((x) => x.id === f.id);
    S.set(SK.PR_LOANS, ex ? list.map((x) => x.id === f.id ? rec : x) : [...list, rec]);
    setList(getPrLoans());
    setForm(null);
    toast.success("Loan saved \u2014 the EMI is recovered automatically in each pay run");
  };
  const del = (l) => {
    if (runs.some((r) => r.status !== "draft" && (r.rows || []).some((x) => (x.loanParts || []).some((p) => p.loanId === l.id)))) {
      toast.error("EMIs have already been recovered \u2014 close the loan instead.");
      return;
    }
    if (!window.confirm("Delete this loan?")) return;
    S.set(SK.PR_LOANS, list.filter((x) => x.id !== l.id));
    setList(getPrLoans());
  };
  const close = (l) => {
    S.set(SK.PR_LOANS, list.map((x) => x.id === l.id ? { ...x, status: "closed" } : x));
    setList(getPrLoans());
  };
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(PrHead, { title: "Employee loans & advances", sub: "EMIs are recovered through payroll and credited to the employee-loan ledger" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => setForm({ id: newId("LN"), empId: "", amount: "", emi: "", date: today(), startMonth: today().slice(0, 7), reason: "", status: "active" }) }, "+ New loan")), /* @__PURE__ */ React.createElement(InfoNote, null, "Record the money you actually lend in ", /* @__PURE__ */ React.createElement("b", null, "Bank Reconciliation \u2192 Post to ledger \u2192 Loans to Employees"), ". This screen only tracks the repayment schedule and recovers the EMI from salary."), form && /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 16, marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { flex: "1 1 220px" } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Employee"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: form.empId, onChange: (e) => setForm((f) => ({ ...f, empId: e.target.value })) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "\u2014 choose \u2014"), emps.map((e) => /* @__PURE__ */ React.createElement("option", { key: e.id, value: e.id }, e.code, " \u2014 ", e.name)))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Loan amount"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: form.amount, onChange: (e) => setForm((f) => ({ ...f, amount: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Monthly EMI"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: form.emi, onChange: (e) => setForm((f) => ({ ...f, emi: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Disbursed on"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: form.date, onChange: (e) => setForm((f) => ({ ...f, date: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Recovery starts"), /* @__PURE__ */ React.createElement("input", { type: "month", className: "field-input", value: form.startMonth, onChange: (e) => setForm((f) => ({ ...f, startMonth: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { className: "field", style: { flex: "1 1 200px" } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Reason"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.reason, onChange: (e) => setForm((f) => ({ ...f, reason: e.target.value })) }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: save }, "Save loan"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: () => setForm(null) }, "Cancel"))), list.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "No loans recorded." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 860 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Employee"), /* @__PURE__ */ React.createElement("th", { style: th }, "Disbursed"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Loan"), /* @__PURE__ */ React.createElement("th", { style: thR }, "EMI"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Recovered"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Outstanding"), /* @__PURE__ */ React.createElement("th", { style: th }, "Status"), /* @__PURE__ */ React.createElement("th", { style: th })), /* @__PURE__ */ React.createElement("tbody", null, list.map((l) => {
    const e = emps.find((x) => x.id === l.empId) || {};
    const out = prLoanOutstanding(l, runs);
    return /* @__PURE__ */ React.createElement("tr", { key: l.id, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement("b", null, e.name || "\u2014"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10.5, color: "var(--text3)" } }, l.reason)), /* @__PURE__ */ React.createElement("td", { style: td }, fmtDate(l.date)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(l.amount)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(l.emi)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(l.amount - out)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700 } }, fmt(out)), /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement(PrStatus, { s: out <= 0.01 ? "closed" : l.status || "active" })), /* @__PURE__ */ React.createElement("td", { style: { ...td, whiteSpace: "nowrap" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => setForm({ ...l }) }, "Edit"), " ", l.status !== "closed" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => close(l) }, "Close"), " ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger btn-icon", onClick: () => del(l) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 11 }))));
  }))));
};
const PayrollForm16 = ({ currentUser }) => {
  const [fy, setFy] = useState(getFY());
  const [empId, setEmpId] = useState("");
  const emps = getEmployees();
  const runs = getPayRuns().filter((r) => r.status !== "draft");
  const set = prSettings();
  const co = S.get(SK.CO, {}) || {};
  const months = prFyMonths(fy);
  const rowsOf = (id) => months.map((m) => {
    const run = runs.find((r) => r.month === m);
    const row = run && (run.rows || []).find((x) => x.empId === id);
    return { m, row };
  });
  const printStmt = (e) => {
    const rr = rowsOf(e.id).filter((x) => x.row);
    const sum = (k) => rr.reduce((s, x) => s + (x.row[k] || 0), 0);
    const gross = sum("gross"), tds = sum("tds"), pt = sum("pt"), pf = sum("pfEmp");
    const regime = e.regime === "old" ? "old" : "new";
    const std = regime === "new" ? 75e3 : 5e4;
    const taxable = Math.max(0, gross - std - (regime === "old" ? pt : 0));
    const tax = prAnnualTax(taxable, regime);
    const f = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const w = window.open("", "_blank");
    if (!w) {
      toast.error("Allow pop-ups to print");
      return;
    }
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Annual tax statement</title><style>body{font-family:Arial;padding:30px;font-size:12px;color:#1a1a2e}table{width:100%;border-collapse:collapse;margin:12px 0}th,td{border:1px solid #ccd;padding:6px 8px;text-align:right}th:first-child,td:first-child{text-align:left}th{background:#f1f3fb}h2{margin:0}.n{color:#889;font-size:10.5px}</style></head><body>
    <h2>Annual salary &amp; tax computation \u2014 FY ${fy}-${String(fy + 1).slice(2)}</h2><div class="n">Working sheet for Form 16 / Form 24Q preparation. Not the TRACES-generated Form 16.</div>
    <p><b>Employer:</b> ${co.name || ""} (TAN ${set.tan || "\u2014"}, PAN ${set.pan || "\u2014"})<br><b>Employee:</b> ${e.name} (${e.code}) \xB7 PAN ${e.pan || "\u2014"} \xB7 Regime: ${regime === "old" ? "Old" : "New"}</p>
    <table><tr><th>Month</th><th>Gross</th><th>PF</th><th>Prof. tax</th><th>TDS</th></tr>${rr.map((x) => `<tr><td>${prMonthLabel(x.m)}</td><td>${f(x.row.gross)}</td><td>${f(x.row.pfEmp)}</td><td>${f(x.row.pt)}</td><td>${f(x.row.tds)}</td></tr>`).join("")}
    <tr><th>Total</th><th>${f(gross)}</th><th>${f(pf)}</th><th>${f(pt)}</th><th>${f(tds)}</th></tr></table>
    <table><tr><td>Gross salary</td><td>${f(gross)}</td></tr><tr><td>Less: standard deduction</td><td>${f(std)}</td></tr>${regime === "old" ? `<tr><td>Less: professional tax</td><td>${f(pt)}</td></tr>` : ""}
    <tr><td><b>Taxable salary income (before Ch. VI-A / HRA)</b></td><td><b>${f(taxable)}</b></td></tr><tr><td>Tax incl. 4% cess (after rebate)</td><td>${f(tax)}</td></tr><tr><td>TDS deducted</td><td>${f(tds)}</td></tr><tr><td><b>Balance payable / (refundable)</b></td><td><b>${f(tax - tds)}</b></td></tr></table>
    <script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>`);
    w.document.close();
  };
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(PrHead, { title: "Form 16 & annual tax statements", sub: "Month-wise salary, PF, PT and TDS with the year-end tax computation per employee" }, /* @__PURE__ */ React.createElement(FyPicker, { value: fy, onChange: setFy })), /* @__PURE__ */ React.createElement(InfoNote, null, "Use this as the working sheet for Form 16 / Form 24Q. The official Form 16 (Part A) must still be generated from TRACES after you file 24Q."), emps.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "No employees yet." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 820 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Employee"), /* @__PURE__ */ React.createElement("th", { style: th }, "PAN"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Gross (FY)"), /* @__PURE__ */ React.createElement("th", { style: thR }, "TDS deducted"), /* @__PURE__ */ React.createElement("th", { style: th }, "Regime"), /* @__PURE__ */ React.createElement("th", { style: th })), /* @__PURE__ */ React.createElement("tbody", null, emps.map((e) => {
    const rr = rowsOf(e.id).filter((x) => x.row);
    const g = rr.reduce((s, x) => s + x.row.gross, 0), t = rr.reduce((s, x) => s + x.row.tds, 0);
    return /* @__PURE__ */ React.createElement("tr", { key: e.id, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement("b", null, e.name), " ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text3)" } }, e.code)), /* @__PURE__ */ React.createElement("td", { style: td }, e.pan || /* @__PURE__ */ React.createElement("span", { style: { color: "var(--red)" } }, "missing")), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(g)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(t)), /* @__PURE__ */ React.createElement("td", { style: td }, e.regime === "old" ? "Old" : "New"), /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", disabled: !rr.length, onClick: () => printStmt(e) }, "Print statement")));
  }))));
};
const PayrollDocs = ({ currentUser }) => {
  const runs = getPayRuns().filter((r) => r.status !== "draft").sort((a, b) => b.month.localeCompare(a.month));
  const emps = getEmployees();
  const co = S.get(SK.CO, {}) || {};
  const [sel, setSel] = useState("");
  const run = runs.find((r) => r.id === sel) || runs[0];
  return /* @__PURE__ */ React.createElement(PageShell, null, /* @__PURE__ */ React.createElement(PrHead, { title: "Payslips", sub: "Print or save as PDF \u2014 one payslip per employee per month" }, runs.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("select", { className: "field-input", style: { width: 190 }, value: run ? run.id : "", onChange: (e) => setSel(e.target.value) }, runs.map((r) => /* @__PURE__ */ React.createElement("option", { key: r.id, value: r.id }, prMonthLabel(r.month), " (", r.status, ")"))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => prOpenPayslips(run, run.rows, emps, co) }, "Print all payslips"))), !run ? /* @__PURE__ */ React.createElement(Empty, { text: "Payslips appear after you approve a pay run." }) : /* @__PURE__ */ React.createElement(Wrap, { min: 720 }, /* @__PURE__ */ React.createElement(HeadRow, null, /* @__PURE__ */ React.createElement("th", { style: th }, "Employee"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Gross"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Deductions"), /* @__PURE__ */ React.createElement("th", { style: thR }, "Net pay"), /* @__PURE__ */ React.createElement("th", { style: th })), /* @__PURE__ */ React.createElement("tbody", null, run.rows.map((r) => /* @__PURE__ */ React.createElement("tr", { key: r.empId, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement("b", null, r.name), " ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text3)" } }, r.code)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(r.gross)), /* @__PURE__ */ React.createElement("td", { style: tdR }, fmt(r.totalDed)), /* @__PURE__ */ React.createElement("td", { style: { ...tdR, fontWeight: 700 } }, fmt(r.net)), /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: () => prOpenPayslips(run, [r], emps, co) }, "Payslip")))))));
};
const PR_REPORTS = [
  { id: "summary", cat: "Payroll Overview", name: "Payroll Summary", needs: "fy" },
  { id: "register", cat: "Payroll Overview", name: "Salary Register \u2014 Monthly", needs: "month" },
  { id: "empstmt", cat: "Payroll Overview", name: "Employee Salary Statement", needs: "emp" },
  { id: "liab", cat: "Payroll Overview", name: "Payroll Liability Summary", needs: "fy" },
  { id: "lop", cat: "Payroll Overview", name: "Loss of Pay Summary", needs: "fy" },
  { id: "dept", cat: "Payroll Overview", name: "Department-wise Cost", needs: "fy" },
  { id: "epf", cat: "Statutory Reports", name: "EPF Summary & ECR file", needs: "month" },
  { id: "esi", cat: "Statutory Reports", name: "ESI Summary", needs: "month" },
  { id: "pt", cat: "Statutory Reports", name: "Professional Tax Summary", needs: "month" },
  { id: "tds", cat: "Taxes and Forms", name: "TDS Deduction Summary (24Q data)", needs: "fy" },
  { id: "loan", cat: "Loan Reports", name: "Loan Outstanding Summary", needs: "none" },
  { id: "bank", cat: "Payments", name: "Bank Transfer Advice", needs: "month" }
];
const prBuildReport = (id, ctx) => {
  const { fy, month, empId } = ctx;
  const emps = getEmployees();
  const runs = getPayRuns().filter((r) => r.status !== "draft");
  const months = prFyMonths(fy);
  const fyRuns = runs.filter((r) => months.includes(r.month)).sort((a, b) => a.month.localeCompare(b.month));
  const run = runs.find((r) => r.month === month);
  const rows = run ? run.rows : [];
  const N = fmtN;
  switch (id) {
    case "summary":
      return { title: `Payroll Summary \u2014 FY ${fy}-${String(fy + 1).slice(2)}`, headers: ["Month", "Employees", "Gross", "Employee deductions", "Net pay", "Employer PF/ESI", "Total cost"], rows: fyRuns.map((r) => {
        const t = prTotals(r.rows);
        return [prMonthLabel(r.month), t.count, N(t.gross), N(t.totalDed), N(t.net), N(t.pfEr + t.esiEr), N(t.employerCost)];
      }) };
    case "register":
      return { title: `Salary Register \u2014 ${prMonthLabel(month)}`, headers: ["ID", "Employee", "Dept", "Paid days", "Basic", "HRA", "Conveyance", "Special", "Other + bonus", "Gross", "PF", "ESI", "PT", "TDS", "Loan", "Other ded.", "Net pay"], rows: rows.map((r) => [r.code, r.name, r.dept, r.paidDays, N(r.basic), N(r.hra), N(r.conv), N(r.special), N(r.extra + r.bonus + r.otherEarn), N(r.gross), N(r.pfEmp), N(r.esiEmp), N(r.pt), N(r.tds), N(r.loan), N(r.fixedDed + r.otherDed), N(r.net)]) };
    case "empstmt": {
      const e = emps.find((x) => x.id === empId) || emps[0];
      return { title: `Salary Statement \u2014 ${e ? e.name : ""} FY ${fy}-${String(fy + 1).slice(2)}`, headers: ["Month", "Paid days", "Gross", "PF", "ESI", "PT", "TDS", "Other", "Net pay"], rows: fyRuns.map((r) => {
        const x = (r.rows || []).find((y) => e && y.empId === e.id);
        return x ? [prMonthLabel(r.month), x.paidDays, N(x.gross), N(x.pfEmp), N(x.esiEmp), N(x.pt), N(x.tds), N(x.loan + x.fixedDed + x.otherDed), N(x.net)] : null;
      }).filter(Boolean) };
    }
    case "liab": {
      const L = getAllLedgerLines().filter((l) => (l.date || "") >= fyStartOf(fy) && (l.date || "") <= fyEndOf(fy));
      const k = [["SALARY_PAYABLE", "Salary payable"], ["PF_PAYABLE", "PF payable"], ["ESI_PAYABLE", "ESI payable"], ["PT_PAYABLE", "Professional tax payable"], ["TDS_SALARY_PAYABLE", "TDS on salary payable"]];
      const tb = getTrialBalance(fyEndOf(fy) < today() ? fyEndOf(fy) : today());
      return { title: `Payroll Liability Summary \u2014 FY ${fy}-${String(fy + 1).slice(2)}`, headers: ["Liability", "Accrued in year", "Paid in year", "Outstanding"], rows: k.map(([a, l]) => {
        const acc = L.filter((x) => x.account === a).reduce((s, x) => s + x.credit, 0), paid = L.filter((x) => x.account === a).reduce((s, x) => s + x.debit, 0);
        const b = tb.find((x) => x.account === a);
        return [l, N(acc), N(paid), N(b ? -b.balance : 0)];
      }) };
    }
    case "lop":
      return { title: "Loss of Pay Summary", headers: ["Month", "Employee", "LOP days", "Paid days", "Salary lost (approx.)"], rows: fyRuns.flatMap((r) => (r.rows || []).filter((x) => x.lopDays > 0).map((x) => {
        const e = emps.find((y) => y.id === x.empId) || {};
        const std = prStdEarnings(e).gross;
        return [prMonthLabel(r.month), x.name, x.lopDays, x.paidDays, N(std * x.lopDays / (x.daysInMonth || 30))];
      })) };
    case "dept": {
      const m = {};
      fyRuns.forEach((r) => (r.rows || []).forEach((x) => {
        const d = x.dept || "Unassigned";
        m[d] = m[d] || { n: /* @__PURE__ */ new Set(), g: 0, c: 0 };
        m[d].n.add(x.empId);
        m[d].g += x.gross;
        m[d].c += x.employerCost;
      }));
      return { title: `Department-wise Cost \u2014 FY ${fy}-${String(fy + 1).slice(2)}`, headers: ["Department", "Employees", "Gross pay", "Total employer cost"], rows: Object.entries(m).map(([d, v]) => [d, v.n.size, N(v.g), N(v.c)]) };
    }
    case "epf":
      return { title: `EPF Summary \u2014 ${prMonthLabel(month)}`, headers: ["UAN", "Employee", "PF wages", "EE share (12%)", "EPS (ER)", "EPF diff (ER)", "Admin", "EDLI", "NCP days"], rows: rows.filter((r) => r.pfEmp > 0).map((r) => {
        const e = emps.find((y) => y.id === r.empId) || {};
        return [e.uan || "\u2014", r.name, N(r.pfWage), N(r.pfEmp), N(r.eps), N(r.epfDiff), N(r.admin), N(r.edli), r.lopDays];
      }) };
    case "esi":
      return { title: `ESI Summary \u2014 ${prMonthLabel(month)}`, headers: ["ESI no.", "Employee", "Days", "Gross wages", "Employee 0.75%", "Employer 3.25%"], rows: rows.filter((r) => r.esiEmp > 0).map((r) => {
        const e = emps.find((y) => y.id === r.empId) || {};
        return [e.esiNo || "\u2014", r.name, r.paidDays, N(r.gross), N(r.esiEmp), N(r.esiEr)];
      }) };
    case "pt":
      return { title: `Professional Tax \u2014 ${prMonthLabel(month)}`, headers: ["Employee", "Gross", "Professional tax"], rows: rows.filter((r) => r.pt > 0).map((r) => [r.name, N(r.gross), N(r.pt)]) };
    case "tds": {
      const q = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11]];
      return { title: `TDS Deduction Summary \u2014 FY ${fy}-${String(fy + 1).slice(2)}`, headers: ["Employee", "PAN", "Q1 (Apr\u2013Jun)", "Q2 (Jul\u2013Sep)", "Q3 (Oct\u2013Dec)", "Q4 (Jan\u2013Mar)", "Total TDS"], rows: emps.map((e) => {
        const qs = q.map((ix) => ix.reduce((s, i) => {
          const r = fyRuns.find((x2) => x2.month === months[i]);
          const x = r && (r.rows || []).find((y) => y.empId === e.id);
          return s + (x ? x.tds : 0);
        }, 0));
        const tot = qs.reduce((a, b) => a + b, 0);
        return tot > 0 ? [e.name, e.pan || "MISSING", ...qs.map(N), N(tot)] : null;
      }).filter(Boolean) };
    }
    case "loan":
      return { title: "Loan Outstanding Summary", headers: ["Employee", "Loan", "EMI", "Recovered", "Outstanding"], rows: getPrLoans().map((l) => {
        const e = emps.find((x) => x.id === l.empId) || {};
        const o = prLoanOutstanding(l);
        return [e.name || "\u2014", N(l.amount), N(l.emi), N(l.amount - o), N(o)];
      }) };
    case "bank":
      return { title: `Bank Transfer Advice \u2014 ${prMonthLabel(month)}`, headers: ["Employee", "Bank", "Account no.", "IFSC", "Net pay"], rows: rows.map((r) => {
        const e = emps.find((y) => y.id === r.empId) || {};
        const b = e.bank || {};
        return [r.name, b.name || "", b.acct || "MISSING", b.ifsc || "", N(r.net)];
      }) };
    default:
      return { title: "", headers: [], rows: [] };
  }
};
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
