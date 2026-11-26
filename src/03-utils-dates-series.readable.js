const DATE_PRESETS = ["Today", "This Week", "This Month", "This Quarter", "This Year", "Yesterday", "Previous Week", "Previous Month", "Previous Quarter", "Previous Year", "All Time", "Custom"];
const _iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const resolveRange = (preset, cf = "", ct = "") => {
  const now = /* @__PURE__ */ new Date();
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
  const fy = m >= 3 ? y : y - 1;
  const q = Math.floor((m + 9) % 12 / 3);
  const wd = (now.getDay() + 6) % 7;
  let a = null, b = null;
  switch (preset) {
    case "Today":
      a = b = new Date(y, m, d);
      break;
    case "Yesterday":
      a = b = new Date(y, m, d - 1);
      break;
    case "This Week":
      a = new Date(y, m, d - wd);
      b = new Date(y, m, d - wd + 6);
      break;
    case "Previous Week":
      a = new Date(y, m, d - wd - 7);
      b = new Date(y, m, d - wd - 1);
      break;
    case "This Month":
      a = new Date(y, m, 1);
      b = new Date(y, m + 1, 0);
      break;
    case "Previous Month":
      a = new Date(y, m - 1, 1);
      b = new Date(y, m, 0);
      break;
    case "This Quarter":
      a = new Date(fy, 3 + 3 * q, 1);
      b = new Date(fy, 3 + 3 * q + 3, 0);
      break;
    case "Previous Quarter":
      a = new Date(fy, 3 + 3 * q - 3, 1);
      b = new Date(fy, 3 + 3 * q, 0);
      break;
    case "This Year":
      a = new Date(fy, 3, 1);
      b = new Date(fy + 1, 3, 0);
      break;
    case "Previous Year":
      a = new Date(fy - 1, 3, 1);
      b = new Date(fy, 3, 0);
      break;
    case "Custom":
      return { preset: "Custom", from: cf, to: ct };
    default:
      return { preset: "All Time", from: "", to: "" };
  }
  return { preset, from: _iso(a), to: _iso(b) };
};
const inRangeDate = (dt, r) => {
  if (!r || !r.preset || r.preset === "All Time" || !r.from && !r.to) return true;
  const s = String(dt || "").substring(0, 10);
  if (r.from && s < r.from) return false;
  if (r.to && s > r.to) return false;
  return true;
};
const _MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const _fmtDM = (s) => {
  if (!s) return "";
  const p = s.split("-");
  return p.length === 3 ? `${p[2]} ${_MON[parseInt(p[1], 10) - 1]} ${p[0]}` : s;
};
const rangeLabel = (r) => !r || r.preset === "All Time" || !r.from && !r.to ? "All dates" : `From ${_fmtDM(r.from)} To ${_fmtDM(r.to)}`;
const rangePeriodText = (r) => !r || r.preset === "All Time" || !r.from && !r.to ? "Period: All dates" : `Period: ${fmtDate(r.from)} to ${fmtDate(r.to)}`;
const _pd = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || "");
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(s);
};
const today = () => _iso(/* @__PURE__ */ new Date());
const fyStartYearOf = (d) => {
  const x = typeof d === "string" ? _pd(d) : d || /* @__PURE__ */ new Date();
  return x.getMonth() >= 3 ? x.getFullYear() : x.getFullYear() - 1;
};
const fyStartOf = (y) => `${y}-04-01`;
const fyEndOf = (y) => `${y + 1}-03-31`;
const fyLabelOf = (y) => `FY ${y}-${String(y + 1).slice(2)}`;
const fmtDate = (d) => {
  if (!d) return "";
  if (typeof d === "number") {
    const dt = new Date(Math.round((d - 25569) * 86400 * 1e3));
    if (isNaN(dt)) return "";
    d = dt.toISOString().split("T")[0];
  }
  if (typeof d !== "string") return "";
  const parts = d.split("-");
  if (parts.length !== 3) return d;
  const [y, m, dd] = parts;
  return `${dd}/${m}/${y}`;
};
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const fmtDateLong = (d) => {
  if (!d || typeof d !== "string") return "";
  const parts = d.split("-");
  if (parts.length !== 3) return fmtDate(d);
  const [y, m, dd] = parts;
  const mi = parseInt(m, 10) - 1;
  return `${parseInt(dd, 10)} ${MONTH_NAMES[mi] || m} ${y}`;
};
const shiftYear = (dateStr, delta) => {
  if (!dateStr) return dateStr;
  const d = _pd(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const m = d.getMonth();
  d.setFullYear(d.getFullYear() + delta);
  if (d.getMonth() !== m) d.setDate(0);
  return _iso(d);
};
const prevFYEnd = (asOf) => {
  if (!asOf) return asOf;
  const d = _pd(asOf);
  if (isNaN(d.getTime())) return asOf;
  return `${fyStartYearOf(d)}-03-31`;
};
const getGrand = (inv) => {
  if (inv.docType === "NON GST INVOICE") {
    const items = (inv.items || []).filter((r) => r.desc);
    const ng = items.reduce((s, r) => s + (parseFloat(r.total) || (parseFloat(r.qty) || 0) * (parseFloat(r.rate) || 0)), 0);
    return ng || parseFloat(inv.grand) || 0;
  }
  return parseFloat(inv.grand) || 0;
};
const getFreezeData = () => {
  const d = S.get(SK.FREEZE, { sales: [], expenses: [] });
  return { sales: Array.isArray(d.sales) ? d.sales : [], expenses: Array.isArray(d.expenses) ? d.expenses : [] };
};
const isMonthFrozen = (dateStr, type = "sales") => {
  if (!dateStr) return false;
  const ym = dateStr.substring(0, 7);
  return getFreezeData()[type].includes(ym) || isLockedDate(dateStr, type);
};
const isSalesFrozen = (inv) => isMonthFrozen(inv == null ? void 0 : inv.date, "sales");
const isExpenseFrozen = (exp) => isMonthFrozen(exp == null ? void 0 : exp.date, "expenses");
const nowTime = () => {
  const d = /* @__PURE__ */ new Date();
  const h = d.getHours().toString().padStart(2, "0"), mi = d.getMinutes().toString().padStart(2, "0"), s = d.getSeconds().toString().padStart(2, "0");
  return `${h}:${mi}:${s}`;
};
const validateGSTIN = (g) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(g || "");
const stateCode = (g) => g && g.length >= 2 ? g.substring(0, 2) : null;
const stateName = (g) => g && g.length >= 2 ? STATE_CODES[g.substring(0, 2)] || "Other State" : "";
const getFY = () => {
  const d = /* @__PURE__ */ new Date(), y = d.getFullYear(), m = d.getMonth() + 1;
  return m >= 4 ? y : y - 1;
};
const getFYShort = () => {
  const y = getFY();
  return String(y).slice(2) + String(y + 1).slice(2);
};
const getMonthCode = () => String((/* @__PURE__ */ new Date()).getMonth() + 1).padStart(2, "0");
const SERIES_TYPES = [
  { id: "INV", label: "Tax Invoice (B2B & B2C)", defLetters: "INV" },
  { id: "INVDN", label: "Debit Note", defLetters: "INVDN" },
  { id: "INVCN", label: "Credit Note", defLetters: "INVCN" },
  { id: "INVNG", label: "Non-GST Invoice", defLetters: "INVNG" }
];
const getSeriesCfg = () => S.get(SK.SERIES, {});
const getSeriesLetters = (id) => {
  var _a;
  const cfg = getSeriesCfg();
  return cfg[id] && cfg[id].letters || ((_a = SERIES_TYPES.find((s) => s.id === id)) == null ? void 0 : _a.defLetters) || id;
};
const buildSeriesPrefix = (id) => `${getSeriesLetters(id)}${getFYShort()}${getMonthCode()}`;
const peekInvNo = (docType) => {
  const typeId = docType === "DEBIT NOTE" ? "INVDN" : docType === "CREDIT NOTE" ? "INVCN" : docType === "NON GST INVOICE" ? "INVNG" : "INV";
  const prefix = buildSeriesPrefix(typeId);
  const key = SK.CTR + "_" + typeId + "_" + getFY() + "_" + getMonthCode();
  const c = S.get(key, 1);
  return `${prefix}${String(c).padStart(4, "0")}`;
};
const commitInvNo = (docType) => {
  const typeId = docType === "DEBIT NOTE" ? "INVDN" : docType === "CREDIT NOTE" ? "INVCN" : docType === "NON GST INVOICE" ? "INVNG" : "INV";
  const key = SK.CTR + "_" + typeId + "_" + getFY() + "_" + getMonthCode();
  const c = S.get(key, 1);
  S.set(key, c + 1);
};
const genInvNo = peekInvNo;
const numberToWords = (amount) => {
  if (!amount || amount === 0) return "Zero Rupees Only";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const toW = (n) => {
    if (n === 0) return "";
    if (n < 20) return ones[n] + " ";
    if (n < 100) return tens[Math.floor(n / 10)] + " " + (n % 10 ? ones[n % 10] + " " : "");
    return ones[Math.floor(n / 100)] + "Hundred " + (n % 100 ? toW(n % 100) : "");
  };
  const r = Math.floor(amount), p = Math.round((amount - r) * 100);
  let res = "";
  if (r > 0) {
    const cr = Math.floor(r / 1e7), lakh = Math.floor(r % 1e7 / 1e5), thou = Math.floor(r % 1e5 / 1e3), rest = r % 1e3;
    if (cr) res += toW(cr) + "Crore ";
    if (lakh) res += toW(lakh) + "Lakh ";
    if (thou) res += toW(thou) + "Thousand ";
    if (rest) res += toW(rest);
    res += "Rupees ";
  }
  if (p > 0) res += "and " + toW(p) + "Paise ";
  return res.trim() + " Only";
};
const logAudit = (action, detail, user) => {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1e3;
  const logs = S.get(SK.AUDIT, []).filter((l) => new Date(l.ts).getTime() > thirtyDaysAgo);
  const entry = { id: Date.now().toString(), action, detail, user: (user == null ? void 0 : user.email) || "system", userName: (user == null ? void 0 : user.name) || "System", ts: (/* @__PURE__ */ new Date()).toISOString() };
  const updated = [entry, ...logs].slice(0, 500);
  S.set(SK.AUDIT, updated);
};
const seedUsers = () => {
  let users = S.get(SK.USERS, []);
  if (!Array.isArray(users)) users = [];
  const superAdminDefs = [
    { id: "SA1", email: "Adithya@business.com", name: "Adithya M", password: "Business@2026", role: "superadmin", active: true },
    { id: "SA2", email: "Invoice@business.com", name: "Invoice Admin", password: "Business@2026", role: "superadmin", active: true }
  ];
  let changed = false;
  superAdminDefs.forEach((sa) => {
    if (!users.find((u) => u.email.toLowerCase() === sa.email.toLowerCase())) {
      users = [sa, ...users];
      changed = true;
    }
  });
  if (changed) S.set(SK.USERS, users);
  return users;
};
let _toast = null;
let _toastSeq = 0;
const toast = { success: (m) => _toast && _toast(m, "success"), error: (m) => _toast && _toast(m, "error"), info: (m) => _toast && _toast(m, "info") };
const Toast = () => {
  const [list, setList] = useState([]);
  const dismiss = (id) => setList((p) => p.filter((x) => x.id !== id));
  useEffect(() => {
    _toast = (msg, type) => {
      const id = Date.now() + "-" + ++_toastSeq;
      setList((p) => [...p, { id, msg, type }]);
      setTimeout(() => dismiss(id), 3500);
    };
  }, []);
  return /* @__PURE__ */ React.createElement("div", { className: "toast-wrap" }, list.map((t) => /* @__PURE__ */ React.createElement("div", { key: t.id, className: `toast toast-${t.type}` }, /* @__PURE__ */ React.createElement("span", null, t.type === "success" ? "\u2713" : t.type === "error" ? "\u2717" : "i"), /* @__PURE__ */ React.createElement("span", { style: { flex: 1 } }, t.msg), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => dismiss(t.id),
      title: "Dismiss",
      "aria-label": "Dismiss notification",
      style: { background: "none", border: "none", cursor: "pointer", color: "inherit", opacity: 0.55, padding: "2px 0 2px 6px", lineHeight: 0, flexShrink: 0 },
      onMouseEnter: (e) => e.currentTarget.style.opacity = 1,
      onMouseLeave: (e) => e.currentTarget.style.opacity = 0.55
    },
    /* @__PURE__ */ React.createElement(Ic, { n: "x", s: 12 })
  ))));
};
