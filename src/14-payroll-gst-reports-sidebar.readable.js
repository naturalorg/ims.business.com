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
