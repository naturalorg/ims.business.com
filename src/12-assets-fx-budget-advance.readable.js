const pad2 = (n) => String(n).padStart(2, "0");
const addDaysISO = (ds, n) => {
  const d = _pd(ds);
  d.setDate(d.getDate() + n);
  return _iso(d);
};
const monthEndISO = (y, m) => `${y}-${pad2(m)}-${pad2(new Date(y, m, 0).getDate())}`;
const addMonthsISO = (ds, n, anchorDay) => {
  const d = _pd(ds);
  const day = anchorDay || d.getDate();
  const t = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
  t.setDate(Math.min(day, last));
  return _iso(t);
};
const r2 = (x) => +(Number(x) || 0).toFixed(2);
const newId = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const sameParty = (a, b) => {
  const x = String(a || "").trim().toLowerCase(), y = String(b || "").trim().toLowerCase();
  return !!x && !!y && (x === y || x.includes(y) || y.includes(x));
};
const FA_PRESETS = [
  // indicative: Companies Act Sch. II useful life (SLM, years) / Income-tax WDV rate (%)
  { name: "Buildings (RCC)", life: 60, rate: 10 },
  { name: "Plant & Machinery", life: 15, rate: 15 },
  { name: "Furniture & Fixtures", life: 10, rate: 10 },
  { name: "Office Equipment", life: 5, rate: 15 },
  { name: "Computers & Laptops", life: 3, rate: 40 },
  { name: "Servers & Networking", life: 6, rate: 40 },
  { name: "Motor Vehicles", life: 8, rate: 15 },
  { name: "Electrical Installations", life: 10, rate: 10 },
  { name: "Software (Intangible)", life: 3, rate: 40 },
  { name: "Other", life: 5, rate: 15 }
];
const getAssets = () => S.get(SK.FA, []) || [];
const faSchedule = (a, asOf) => {
  asOf = asOf || today();
  const cost = parseFloat(a.cost) || 0, salvage = Math.max(0, parseFloat(a.salvage) || 0);
  const accBF = a.mode === "opening" ? parseFloat(a.accDepBF) || 0 : 0;
  const rows = [];
  let acc = accBF;
  const startStr = a.depFrom || a.purchaseDate || "";
  if (!startStr || cost <= 0) return { rows, accBF, acc, cost };
  const endStr = a.disposal && a.disposal.date ? a.disposal.date : "9999-12-31";
  const sy = +startStr.slice(0, 4), sm = +startStr.slice(5, 7), sd = +startStr.slice(8, 10) || 1;
  const maxDep = Math.max(0, cost - salvage);
  const life = parseFloat(a.lifeYears) || 0, rate = parseFloat(a.rate) || 0;
  let y = sy, m = sm;
  for (let guard = 0; guard < 1500; guard++) {
    const dim = new Date(y, m, 0).getDate();
    const mStart = `${y}-${pad2(m)}-01`, mEnd = `${y}-${pad2(m)}-${pad2(dim)}`;
    if (mStart > endStr || mStart > asOf) break;
    const first = y === sy && m === sm;
    const fromDay = first && a.mode !== "opening" ? sd : 1;
    const dispHere = endStr <= mEnd;
    const toDay = dispHere ? +endStr.slice(8, 10) : dim;
    const entryDate = dispHere ? endStr : mEnd;
    if (entryDate > asOf) break;
    const days = Math.max(0, toDay - fromDay + 1);
    const monthly = a.method === "WDV" ? (cost - acc) * rate / 1200 : life > 0 ? maxDep / (life * 12) : 0;
    let amt = monthly * days / dim;
    amt = r2(Math.min(amt, Math.max(0, maxDep - acc)));
    if (amt > 4e-3) {
      acc = r2(acc + amt);
      rows.push({ date: entryDate, ym: `${y}-${pad2(m)}`, amount: amt, accAfter: acc, wdvAfter: r2(cost - acc) });
    }
    if (dispHere) break;
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return { rows, accBF, acc, cost };
};
const faAcquiredOn = (a) => a.mode === "opening" ? OPENING_DATE : a.purchaseDate || "";
const buildFixedAssetEntries = (add) => {
  getAssets().forEach((a) => {
    const cost = parseFloat(a.cost) || 0;
    if (cost <= 0) return;
    const code = a.code || a.id;
    const tag = String(code).replace(/\s+/g, "").toUpperCase();
    if (a.mode === "opening") {
      add(OPENING_DATE, `Opening fixed asset \u2014 ${a.name}`, "FAOB", a.id, [{ account: "FIXED_ASSETS", debit: cost, credit: 0 }, { account: "CAPITAL", debit: 0, credit: cost }], "OPEN-" + tag, { docNo: code, category: "Opening Fixed Asset" });
      const bf = parseFloat(a.accDepBF) || 0;
      if (bf > 4e-3) add(OPENING_DATE, `Opening accumulated depreciation \u2014 ${a.name}`, "FAOB", a.id + "-AD", [{ account: "CAPITAL", debit: bf, credit: 0 }, { account: "ACC_DEPRECIATION", debit: 0, credit: bf }], "OPEN-" + tag + "-AD", { docNo: code, category: "Opening Fixed Asset" });
    } else if (a.mode === "new" && a.purchaseDate) {
      add(a.purchaseDate, `Asset purchase \u2014 ${a.name}`, "FAPUR", a.id, [{ account: "FIXED_ASSETS", debit: cost, credit: 0 }, { account: a.paidFromKey || "TRADE_PAYABLE", debit: 0, credit: cost }], a.voucherNo || "", { txnRefNo: a.txnRefNo || "", docNo: code, category: "Fixed Asset Purchase" });
    }
    faSchedule(a, today()).rows.forEach((r) => {
      add(
        r.date,
        `Depreciation \u2014 ${a.name} (${r.ym})`,
        "FADEP",
        a.id + "-" + r.ym,
        [{ account: "DEPRECIATION", debit: r.amount, credit: 0 }, { account: "ACC_DEPRECIATION", debit: 0, credit: r.amount }],
        "DEP-" + tag + "-" + r.ym.replace("-", ""),
        { docNo: code, category: "Depreciation" }
      );
    });
    if (a.disposal && a.disposal.date) {
      const dd = a.disposal.date, proceeds = parseFloat(a.disposal.proceeds) || 0;
      const acc = faSchedule(a, dd).acc;
      const nbv = r2(cost - acc), diff = r2(proceeds - nbv);
      const lines = [{ account: "FIXED_ASSETS", debit: 0, credit: cost }];
      if (acc > 4e-3) lines.push({ account: "ACC_DEPRECIATION", debit: acc, credit: 0 });
      if (proceeds > 4e-3) lines.push({ account: a.disposal.receivedKey || "TRADE_RECEIVABLE", debit: proceeds, credit: 0 });
      if (diff > 4e-3) lines.push({ account: "GAIN_ON_ASSET_SALE", debit: 0, credit: diff });
      else if (diff < -4e-3) lines.push({ account: "LOSS_ON_ASSET_SALE", debit: -diff, credit: 0 });
      add(dd, `Sale / disposal of asset \u2014 ${a.name}`, "FADISP", a.id, lines, a.disposal.voucherNo || "", { txnRefNo: a.disposal.txnRefNo || "", docNo: code, category: "Asset Disposal" });
    }
  });
};
const faPeriodRow = (a, from, to) => {
  const cost = parseFloat(a.cost) || 0;
  const acq = faAcquiredOn(a);
  const dis = a.disposal && a.disposal.date ? a.disposal.date : "";
  if (!acq || acq > to || cost <= 0) return null;
  if (dis && dis < from) return null;
  const dayBefore = addDaysISO(from, -1);
  const opened = acq < from;
  const grossOpen = opened ? cost : 0, additions = opened ? 0 : cost;
  const disposedIn = !!dis && dis >= from && dis <= to;
  const grossDisp = disposedIn ? cost : 0, grossClose = cost - grossDisp;
  const accOpen = opened ? faSchedule(a, dayBefore).acc : 0;
  const accTo = faSchedule(a, to).acc;
  const depYear = r2(accTo - accOpen);
  const accDisp = disposedIn ? faSchedule(a, dis).acc : 0;
  const accClose = r2(accTo - accDisp);
  const accPrevEnd = opened ? accOpen : 0;
  return {
    a,
    grossOpen,
    additions,
    grossDisp,
    grossClose,
    accOpen: r2(accOpen),
    depYear,
    accDisp: r2(accDisp),
    accClose,
    netClose: r2(grossClose - accClose),
    netOpen: r2(grossOpen - accPrevEnd),
    disposedIn
  };
};
const RJV_FREQ = [["monthly", "Monthly", 1], ["quarterly", "Quarterly", 3], ["halfyearly", "Half-yearly", 6], ["yearly", "Yearly", 12]];
const rjvStep = (t) => t.kind === "emi" || t.kind === "prepaid" ? 1 : (RJV_FREQ.find((f) => f[0] === t.frequency) || [0, 0, 1])[2];
const rjvDate = (t, k) => addMonthsISO(t.startDate, k * rjvStep(t));
const emiOf = (P, annualRate, n) => {
  P = +P || 0;
  n = +n || 0;
  const r = (+annualRate || 0) / 1200;
  if (n <= 0) return 0;
  if (r === 0) return r2(P / n);
  return r2(P * r / (1 - Math.pow(1 + r, -n)));
};
const emiSchedule = (P, annualRate, n, emiOverride) => {
  P = +P || 0;
  n = Math.round(+n || 0);
  const r = (+annualRate || 0) / 1200;
  const emi = emiOverride > 0 ? +emiOverride : emiOf(P, annualRate, n);
  const rows = [];
  let bal = P;
  for (let k = 0; k < n; k++) {
    const interest = r2(bal * r);
    let principal = r2(emi - interest);
    if (k === n - 1 || principal > bal) principal = r2(bal);
    const pay = r2(principal + interest);
    bal = r2(bal - principal);
    rows.push({ k, interest, principal, emi: pay, balance: bal });
  }
  return rows;
};
const prepaidSchedule = (total, months) => {
  total = +total || 0;
  months = Math.round(+months || 0);
  if (months <= 0) return [];
  const each = r2(total / months);
  const rows = [];
  let left = r2(total);
  for (let k = 0; k < months; k++) {
    const amt = k === months - 1 ? left : each;
    rows.push({ k, amount: amt });
    left = r2(left - amt);
  }
  return rows;
};
const rjvTotal = (t) => {
  if (t.kind === "emi") return Math.round(+t.tenure || 0);
  if (t.kind === "prepaid") return Math.round(+t.months || 0);
  if (t.count && +t.count > 0) return Math.round(+t.count);
  return t.endDate ? 600 : 600;
};
const rjvLines = (t, k) => {
  if (t.kind === "emi") {
    const row = emiSchedule(t.principal, t.rate, t.tenure, +t.emiOverride || 0)[k];
    if (!row) return null;
    const ls = [];
    if (row.principal > 4e-3) ls.push({ account: t.loanKey, desc: "Principal repaid", debit: row.principal, credit: 0 });
    if (row.interest > 4e-3) ls.push({ account: "FINANCE_COST", desc: "Interest", debit: row.interest, credit: 0 });
    ls.push({ account: t.payKey, desc: "EMI paid", debit: 0, credit: row.emi });
    return ls;
  }
  if (t.kind === "prepaid") {
    const row = prepaidSchedule(t.total, t.months)[k];
    if (!row || row.amount <= 4e-3) return null;
    return [{ account: t.expenseKey, desc: "Prepaid amortisation", debit: row.amount, credit: 0 }, { account: "PREPAID_EXP", desc: "Reducing prepaid balance", debit: 0, credit: row.amount }];
  }
  return (t.lines || []).map((l) => ({ account: l.account, desc: l.desc || "", debit: r2(l.debit), credit: r2(l.credit) })).filter((l) => l.account && (l.debit || l.credit));
};
const runRecurringJournals = (user, asOf) => {
  asOf = asOf || today();
  const tpls = S.get(SK.RJV, []) || [];
  if (!tpls.length) return 0;
  const jvs = [...getManualJournal()];
  let created = 0, changed = false;
  const next = tpls.map((t) => {
    if (!t.active) return t;
    let gen = parseInt(t.generated, 10) || 0;
    const total = rjvTotal(t);
    while (gen < total) {
      const d = rjvDate(t, gen);
      if (d > asOf || t.endDate && d > t.endDate) break;
      const lines = rjvLines(t, gen);
      if (!lines || lines.length < 2) {
        gen++;
        changed = true;
        continue;
      }
      const id = `RJV-${t.id}-${gen}`;
      if (!jvs.some((e) => e.id === id)) {
        jvs.push({
          id,
          date: d,
          narration: `${t.name} \u2014 #${gen + 1}${t.kind === "emi" || t.kind === "prepaid" || t.count && +t.count > 0 ? " of " + total : ""}`,
          referenceNo: t.refNo || "",
          reportingMethod: "both",
          lines,
          voucherNo: nextVoucherNo(),
          txnRefNo: nextTxnRefNo(d),
          srcType: "JV",
          recurringId: t.id,
          createdBy: user && (user.email || user.name) || "auto",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        created++;
      }
      gen++;
      changed = true;
    }
    return changed ? { ...t, generated: gen } : t;
  });
  if (created) S.set(SK.JOURNAL, jvs);
  if (changed) S.set(SK.RJV, next);
  return created;
};
const getAdvApps = () => S.get(SK.ADV_APPS, []) || [];
const getAdvanceRows = () => {
  const usedBy = {};
  getAdvApps().filter((a) => a.kind === "customer" || a.kind === "supplier").forEach((a) => {
    usedBy[a.advTxnId] = (usedBy[a.advTxnId] || 0) + (parseFloat(a.amt) || 0);
  });
  const invByNo = {};
  S.get(SK.INV, []).forEach((i) => {
    invByNo[i.invNo] = i;
  });
  const expById = {};
  S.get(SK.EXP, []).forEach((e) => {
    expById[e.id] = e;
  });
  const qsById = {};
  S.get(SK.QSALE, []).forEach((q) => {
    qsById[q.id] = q;
  });
  const rows = [];
  (S.get(SK.BANK, []) || []).forEach((t) => {
    var _a, _b, _c, _d;
    const amt = parseFloat(t.amount) || 0;
    if (!amt || !t.matched) return;
    const isCredit = t.type === "credit";
    const advKey = isCredit ? "CUSTOMER_ADVANCE" : "ADVANCES";
    const allocs = Array.isArray(t.allocs) ? t.allocs.filter((a) => (parseFloat(a.amt) || 0) > 4e-3) : [];
    let adv = 0, party = t.advParty || "";
    if (t.matchedType === "ledger" && t.ledgerKey === advKey) adv = amt;
    else if (allocs.length && !["creditnote", "suprefund"].includes(allocs[0].kind)) {
      const A = allocs.reduce((s, a) => s + (parseFloat(a.amt) || 0), 0);
      const d = r2(amt - A);
      const rk = t.restKey || (isCredit ? d > 0 ? "CUSTOMER_ADVANCE" : "TDS_RECEIVABLE" : d > 0 ? "ADVANCES" : "OTHER_INCOME");
      if (d > 4e-3 && rk === advKey) adv = d;
      if (!party) {
        const a0 = allocs[0];
        party = a0.kind === "invoice" ? ((_b = (_a = invByNo[a0.ref]) == null ? void 0 : _a.billTo) == null ? void 0 : _b.name) || "" : a0.kind === "quicksale" ? ((_c = qsById[a0.ref]) == null ? void 0 : _c.customer) || "" : ((_d = expById[a0.ref]) == null ? void 0 : _d.vendor) || "";
      }
    }
    if (adv <= 4e-3) return;
    const used = r2(usedBy[t.id] || 0);
    rows.push({ txnId: t.id, kind: isCredit ? "customer" : "supplier", date: t.date, party, amount: r2(adv), used, balance: r2(adv - used), ref: t.refNo || "", desc: t.desc || "", acctId: t.acctId || "PRIMARY" });
  });
  return rows.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
};
const tagAdvanceParty = (txnId, party) => S.set(SK.BANK, (S.get(SK.BANK, []) || []).map((t) => t.id === txnId ? { ...t, advParty: party } : t));
const cnSettledMap = () => {
  const m = {};
  (S.get(SK.BANK, []) || []).forEach((t) => {
    if (Array.isArray(t.allocs)) t.allocs.forEach((a) => {
      if (a.kind === "creditnote") m[a.ref] = (m[a.ref] || 0) + (parseFloat(a.amt) || 0);
    });
  });
  getAdvApps().filter((a) => a.kind === "cn").forEach((a) => {
    m[a.advTxnId] = (m[a.advTxnId] || 0) + (parseFloat(a.amt) || 0);
  });
  return m;
};
const getOpenCreditNotes = () => {
  const sm = cnSettledMap();
  return S.get(SK.INV, []).filter((i) => i.docType === "CREDIT NOTE" && i.status !== "Draft" && i.status !== "Cancelled").map((i) => {
    var _a;
    const total = Math.abs(getGrand(i));
    const settled = r2(sm[i.invNo] || 0);
    return { kind: "creditnote", ref: i.invNo, docNo: i.invNo, party: ((_a = i.billTo) == null ? void 0 : _a.name) || "Unknown customer", total, settled, out: r2(total - settled), date: i.date, due: i.date, extra: i.origInvNo ? "against " + i.origInvNo : "" };
  }).filter((o) => o.out > 0.01);
};
const creditNoteAgingRows = (asOn) => getOpenCreditNotes().map((o) => ({
  id: o.ref,
  party: o.party,
  gstin: "",
  docNo: o.ref,
  date: o.date,
  dueDate: o.date,
  gross: -o.total,
  paid: -o.settled,
  due: -o.out,
  daysOverdue: 0,
  bucket: "current",
  status: "Credit",
  docType: "CREDIT NOTE"
}));
const applyAdvance = ({ kind, advTxnId, party, docKind, docRef, docNo, amt, date, user }) => {
  amt = r2(amt);
  if (amt <= 4e-3) return null;
  const rec = {
    id: newId("AA-"),
    date: date || today(),
    kind,
    advTxnId,
    party: party || "",
    docKind,
    docRef,
    docNo: docNo || docRef,
    amt,
    voucherNo: nextVoucherNo(),
    txnRefNo: nextTxnRefNo(date || today()),
    createdBy: user && (user.email || user.name) || "",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  S.set(SK.ADV_APPS, [...getAdvApps(), rec]);
  adjustDocPaid(docKind, docRef, amt, { date: rec.date, refNo: (kind === "cn" ? "CN " : "ADV ") + advTxnId });
  return rec;
};
const reverseAdvanceApp = (id) => {
  const a = getAdvApps().find((x) => x.id === id);
  if (!a) return;
  S.set(SK.ADV_APPS, getAdvApps().filter((x) => x.id !== id));
  adjustDocPaid(a.docKind, a.docRef, -a.amt, { date: a.date, refNo: "" });
};
const buildAdvanceEntries = (add) => {
  getAdvApps().forEach((a) => {
    const amt = parseFloat(a.amt) || 0;
    if (amt <= 4e-3) return;
    if (a.kind === "customer") add(a.date, `Advance adjusted \u2014 ${a.party || "customer"} against ${a.docNo}`, "ADVAPP", a.id, [{ account: "CUSTOMER_ADVANCE", debit: amt, credit: 0 }, { account: "TRADE_RECEIVABLE", debit: 0, credit: amt }], a.voucherNo, { txnRefNo: a.txnRefNo, docNo: a.docNo, category: "Advance Adjustment" });
    else if (a.kind === "supplier") add(a.date, `Advance adjusted \u2014 ${a.party || "supplier"} against ${a.docNo}`, "ADVAPP", a.id, [{ account: "TRADE_PAYABLE", debit: amt, credit: 0 }, { account: "ADVANCES", debit: 0, credit: amt }], a.voucherNo, { txnRefNo: a.txnRefNo, docNo: a.docNo, category: "Advance Adjustment" });
  });
};
const FX_CURRENCIES = [
  { code: "INR", name: "Indian Rupee", sym: "\u20B9" },
  { code: "USD", name: "US Dollar", sym: "$" },
  { code: "EUR", name: "Euro", sym: "\u20AC" },
  { code: "GBP", name: "Pound Sterling", sym: "\xA3" },
  { code: "AED", name: "UAE Dirham", sym: "AED " },
  { code: "SGD", name: "Singapore Dollar", sym: "S$" },
  { code: "AUD", name: "Australian Dollar", sym: "A$" },
  { code: "CAD", name: "Canadian Dollar", sym: "C$" },
  { code: "CHF", name: "Swiss Franc", sym: "CHF " },
  { code: "JPY", name: "Japanese Yen", sym: "\xA5" },
  { code: "SAR", name: "Saudi Riyal", sym: "SAR " },
  { code: "QAR", name: "Qatari Riyal", sym: "QAR " },
  { code: "MYR", name: "Malaysian Ringgit", sym: "RM " },
  { code: "ZAR", name: "South African Rand", sym: "R " },
  { code: "CNY", name: "Chinese Yuan", sym: "CN\xA5" },
  { code: "NZD", name: "New Zealand Dollar", sym: "NZ$" }
];
const FX_WORD = { USD: "US Dollar", EUR: "Euro", GBP: "Pound Sterling", AED: "UAE Dirham", SGD: "Singapore Dollar", AUD: "Australian Dollar", CAD: "Canadian Dollar", CHF: "Swiss Franc", JPY: "Japanese Yen", SAR: "Saudi Riyal", QAR: "Qatari Riyal", MYR: "Malaysian Ringgit", ZAR: "South African Rand", CNY: "Chinese Yuan", NZD: "New Zealand Dollar" };
const fxSym = (c) => (FX_CURRENCIES.find((x) => x.code === c) || {}).sym || (c ? c + " " : "\u20B9");
const fmtC = (n, cur) => !cur || cur === "INR" ? fmt(n) : fxSym(cur) + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const isFxInv = (inv) => !!(inv && inv.currency && inv.currency !== "INR" && inv.fc);
const amountInWordsFC = (amt, cur) => {
  const n = Math.abs(Number(amt) || 0);
  let whole = Math.floor(n + 1e-9), cents = Math.round((n - whole) * 100);
  if (cents >= 100) {
    whole += 1;
    cents = 0;
  }
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (x) => x < 20 ? ones[x] : tens[Math.floor(x / 10)] + (x % 10 ? "-" + ones[x % 10] : "");
  const three = (x) => x >= 100 ? ones[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " + two(x % 100) : "") : two(x);
  const parts = [[1e9, "Billion"], [1e6, "Million"], [1e3, "Thousand"]];
  let rest = whole, out = [];
  parts.forEach(([v, l]) => {
    const q = Math.floor(rest / v);
    if (q) {
      out.push(three(q) + " " + l);
      rest -= q * v;
    }
  });
  if (rest) out.push(three(rest));
  let s = (FX_WORD[cur] || cur) + " " + (out.join(" ") || "Zero");
  if (cents) s += " and " + two(cents) + " Cents";
  return s + " Only";
};
const toBaseInvoice = (inv, rate) => {
  const m = (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? v : r2(n * rate);
  };
  const fc = { items: inv.items, subtotal: inv.subtotal, taxBreakdown: inv.taxBreakdown || {}, totalGST: inv.totalGST, roundOff: inv.roundOff, grand: inv.grand };
  const items = (inv.items || []).map((it) => ({ ...it, rate: m(it.rate), taxable: m(it.taxable), gstAmt: m(it.gstAmt), total: m(it.total) }));
  const tb = {};
  Object.entries(inv.taxBreakdown || {}).forEach(([k, v]) => {
    tb[k] = m(v);
  });
  const grand = r2((parseFloat(inv.grand) || 0) * rate), sub = r2((parseFloat(inv.subtotal) || 0) * rate), gst = r2((parseFloat(inv.totalGST) || 0) * rate);
  return { ...inv, items, subtotal: sub.toFixed(2), taxBreakdown: tb, totalGST: gst.toFixed(2), roundOff: inv.docType === "NON GST INVOICE" ? 0 : r2(Math.abs(grand) - (sub + gst)), grand, exchRate: rate, fc };
};
const unwrapFcInvoice = (inv) => inv && inv.fc ? { ...inv, ...inv.fc } : inv;
const fcView = (inv) => inv && inv.fc ? { ...inv, ...inv.fc, __cur: inv.currency, __rate: inv.exchRate, __inr: Math.abs(parseFloat(inv.grand) || 0) } : inv;
const getFxRates = () => S.get(SK.FXR, {}) || {};
const saveFxRate = (cur, rate, date) => {
  if (!cur || cur === "INR" || !(rate > 0)) return;
  S.set(SK.FXR, { ...getFxRates(), [cur]: { rate: +rate, date: date || today() } });
};
const getOpenFxInvoices = () => S.get(SK.INV, []).filter((i) => isFxInv(i) && ["TAX INVOICE", "NON GST INVOICE", "DEBIT NOTE"].includes(i.docType) && i.status !== "Draft" && i.status !== "Cancelled").map((i) => {
  var _a;
  const total = Math.abs(getGrand(i));
  const out = r2(total - invPaid(i));
  const rate = parseFloat(i.exchRate) || 1;
  return { inv: i, invNo: i.invNo, party: ((_a = i.billTo) == null ? void 0 : _a.name) || "", date: i.date, cur: i.currency, rate, out, fcOut: r2(out / rate), fcTotal: Math.abs(parseFloat(i.fc.grand) || 0) };
}).filter((o) => o.out > 0.01);
const isCashAcct = (a) => a.key === "BANK" || a.key === "CASH_IN_HAND" || a.parent === "BANK";
const getCashFlow = (from, to) => {
  const accts = getAllAccounts();
  const open = getTrialBalance(addDaysISO(from, -1)), close = getTrialBalance(to);
  const bal = (tb, k) => {
    const r = tb.find((x) => x.account === k);
    return r ? r.balance : 0;
  };
  const keys = [.../* @__PURE__ */ new Set([...open.map((r) => r.account), ...close.map((r) => r.account)])];
  const typeOf = (k) => accts.find((a) => a.key === k) || coaByKey(k);
  let cashOpen = 0, cashClose = 0, netProfit = 0, dep = 0;
  const wc = [], inv = [], fin = [];
  const faD = { fa: 0, ad: 0 };
  const addTo = (arr, label, amt, acct) => {
    if (Math.abs(amt) < 5e-3) return;
    const ex = arr.find((x) => x.label === label);
    const it = acct ? { account: acct, amount: r2(amt) } : null;
    if (ex) {
      ex.amount = r2(ex.amount + amt);
      if (it) ex.items.push(it);
    } else arr.push({ label, amount: r2(amt), items: it ? [it] : [] });
  };
  const npItems = [], depItems = [], cashItems = [];
  keys.forEach((k) => {
    const a = typeOf(k);
    const d = bal(close, k) - bal(open, k);
    if (isCashAcct(a)) {
      cashOpen += bal(open, k);
      cashClose += bal(close, k);
      cashItems.push({ account: k, open: r2(bal(open, k)), close: r2(bal(close, k)) });
      return;
    }
    if (a.type === "income" || a.type === "expense") {
      netProfit += -d;
      if (Math.abs(d) >= 5e-3) npItems.push({ account: k, amount: r2(-d) });
      if (a.scheduleGroup === "Depreciation and Amortisation Expense") {
        dep += d;
        if (Math.abs(d) >= 5e-3) depItems.push({ account: k, amount: r2(d) });
      }
      return;
    }
    if (a.key === "RETAINED_EARNINGS") return;
    const eff = -d;
    if (k === "FIXED_ASSETS") {
      faD.fa += d;
      return;
    }
    if (k === "ACC_DEPRECIATION") {
      faD.ad += d;
      return;
    }
    if (k === "INVESTMENTS" || a.type === "asset" && a.group === "Non-Current Assets") {
      addTo(inv, a.scheduleGroup || a.name, eff, k);
      return;
    }
    if (a.type === "equity" || /Borrowings/.test(a.scheduleGroup || "") || a.type === "liability" && a.group === "Non-Current Liabilities" && k !== "LT_PROVISION") {
      const isBorrow = a.type === "liability";
      addTo(fin, a.type === "equity" ? "Capital introduced / (withdrawn)" : isBorrow ? "Borrowings raised / (repaid)" : a.scheduleGroup || a.name, eff, k);
      return;
    }
    const lbl = a.type === "asset" ? { "Trade Receivables": "(Increase)/decrease in trade receivables", "Inventories": "(Increase)/decrease in inventories" }[a.scheduleGroup] || `(Increase)/decrease in ${(a.scheduleGroup || a.name).toLowerCase()}` : { "Trade Payables": "Increase/(decrease) in trade payables" }[a.scheduleGroup] || `Increase/(decrease) in ${(a.scheduleGroup || a.name).toLowerCase()}`;
    addTo(wc, lbl, eff, k);
  });
  const lines = getAllLedgerLines().filter((l) => (l.date || "") >= from && (l.date || "") <= to);
  const gain = r2(lines.filter((l) => l.account === "GAIN_ON_ASSET_SALE").reduce((s, l) => s + l.credit - l.debit, 0));
  const loss = r2(lines.filter((l) => l.account === "LOSS_ON_ASSET_SALE").reduce((s, l) => s + l.debit - l.credit, 0));
  const adj = [];
  addTo(adj, "Depreciation and amortisation", dep);
  addTo(adj, "(Gain) on sale of fixed assets", -gain);
  addTo(adj, "Loss on sale of fixed assets", loss);
  const setItems = (arr, label, items) => {
    const r = arr.find((x) => x.label === label);
    if (r) r.items = items.filter((i) => Math.abs(i.amount) >= 5e-3);
  };
  setItems(adj, "Depreciation and amortisation", depItems);
  setItems(adj, "(Gain) on sale of fixed assets", [{ account: "GAIN_ON_ASSET_SALE", amount: -gain }]);
  setItems(adj, "Loss on sale of fixed assets", [{ account: "LOSS_ON_ASSET_SALE", amount: loss }]);
  const faNet = -(faD.fa + faD.ad) - dep;
  const invFA = [];
  addTo(invFA, "Purchase of fixed assets (net of book value of disposals)", faNet);
  addTo(invFA, "Gain / (loss) realised on sale of fixed assets", gain - loss);
  setItems(invFA, "Purchase of fixed assets (net of book value of disposals)", [{ account: "FIXED_ASSETS", amount: r2(-faD.fa) }, { account: "ACC_DEPRECIATION", amount: r2(-faD.ad) }, ...depItems.map((i) => ({ account: i.account, amount: -i.amount }))]);
  setItems(invFA, "Gain / (loss) realised on sale of fixed assets", [{ account: "GAIN_ON_ASSET_SALE", amount: gain }, { account: "LOSS_ON_ASSET_SALE", amount: -loss }]);
  const invAll = [...invFA, ...inv];
  const sum = (a) => r2(a.reduce((s, x) => s + x.amount, 0));
  netProfit = r2(netProfit);
  const cfo = r2(netProfit + sum(adj) + sum(wc)), cfi = sum(invAll), cff = sum(fin);
  const netChange = r2(cfo + cfi + cff), actual = r2(cashClose - cashOpen);
  return { netProfitItems: npItems.filter((i) => Math.abs(i.amount) >= 5e-3), cashItems, netProfit, adj, wc, cfo, invAll, cfi, fin, cff, netChange, cashOpen: r2(cashOpen), cashClose: r2(cashClose), diff: r2(actual - netChange) };
};
const getRatios = (from, to) => {
  const accts = getAllAccounts();
  const close = getTrialBalance(to);
  const sumB = (pred, sign = 1) => close.reduce((s, r) => {
    const a = coaByKey(r.account);
    return pred(a, r) ? s + sign * r.balance : s;
  }, 0);
  const cash = sumB((a) => isCashAcct(a));
  const curAssets = sumB((a) => a.type === "asset" && a.group === "Current Assets");
  const curLiab = sumB((a) => a.type === "liability" && a.group === "Current Liabilities", -1);
  const inventory = sumB((a) => a.key === "INVENTORY"), prepaid = sumB((a) => a.key === "PREPAID_EXP");
  const recv = sumB((a) => a.key === "TRADE_RECEIVABLE"), pay = sumB((a) => a.key === "TRADE_PAYABLE", -1);
  const debt = sumB((a) => a.key === "LT_BORROWING" || a.key === "ST_BORROWING", -1);
  const totalAssets = sumB((a) => a.type === "asset"), totalLiab = sumB((a) => a.type === "liability", -1);
  const bs = getBalanceSheet(to);
  const equity = bs.totalEquity;
  const pl = getPLAccrual(from, to);
  const rows = pl.rows;
  const sumPL = (pred) => rows.filter(pred).reduce((s, r) => s + r.amount, 0);
  const revenue = sumPL((r) => r.type === "income" && coaByKey(r.account).scheduleGroup === "Revenue from Operations");
  const otherInc = sumPL((r) => r.type === "income") - revenue;
  const cogs = sumPL((r) => r.type === "expense" && coaByKey(r.account).scheduleGroup === "Cost of Materials Consumed");
  const fin = sumPL((r) => r.type === "expense" && coaByKey(r.account).scheduleGroup === "Finance Costs");
  const dep = sumPL((r) => r.type === "expense" && coaByKey(r.account).scheduleGroup === "Depreciation and Amortisation Expense");
  const np = pl.net, ebit = np + fin, ebitda = ebit + dep;
  const days = Math.max(1, daysBetween(from, to) + 1);
  const ann = 365 / days;
  const lines = getAllLedgerLines().filter((l) => (l.date || "") >= from && (l.date || "") <= to && l.reportingMethod !== "cash");
  const billedSales = lines.filter((l) => l.account === "TRADE_RECEIVABLE" && (l.srcType === "INV" || l.srcType === "QSALE")).reduce((s, l) => s + l.debit - l.credit, 0);
  const billedPurch = lines.filter((l) => l.account === "TRADE_PAYABLE" && l.srcType === "EXP").reduce((s, l) => s + l.credit - l.debit, 0);
  const div = (a, b) => b > 4e-3 || b < -4e-3 ? a / b : null;
  const dso = div(recv * days, billedSales), dpo = div(pay * days, billedPurch), dio = cogs > 4e-3 ? div(inventory * days, cogs) : null;
  const ccc = dso != null && dpo != null ? dso + (dio || 0) - dpo : null;
  const list = [
    { g: "Liquidity", k: "cr", label: "Current ratio", v: div(curAssets, curLiab), t: "x", good: (v) => v >= 1.5 ? "good" : v >= 1 ? "warn" : "bad", note: "Current assets \xF7 current liabilities. 1.5\u20132 is comfortable." },
    { g: "Liquidity", k: "qr", label: "Quick ratio", v: div(curAssets - inventory - prepaid, curLiab), t: "x", good: (v) => v >= 1 ? "good" : v >= 0.7 ? "warn" : "bad", note: "(Current assets \u2212 inventory \u2212 prepaid) \xF7 current liabilities. 1+ is healthy." },
    { g: "Liquidity", k: "cash", label: "Cash ratio", v: div(cash, curLiab), t: "x", good: (v) => v >= 0.5 ? "good" : v >= 0.2 ? "warn" : "bad", note: "Cash & bank \xF7 current liabilities." },
    { g: "Liquidity", k: "wc", label: "Working capital", v: curAssets - curLiab, t: "\u20B9", good: (v) => v >= 0 ? "good" : "bad", note: "Current assets \u2212 current liabilities." },
    { g: "Profitability", k: "gm", label: "Gross margin", v: revenue > 4e-3 ? (revenue - cogs) / revenue * 100 : null, t: "%", good: (v) => v >= 30 ? "good" : v >= 15 ? "warn" : "bad", note: "(Revenue \u2212 cost of materials) \xF7 revenue." },
    { g: "Profitability", k: "em", label: "EBITDA margin", v: revenue > 4e-3 ? ebitda / revenue * 100 : null, t: "%", good: (v) => v >= 15 ? "good" : v >= 5 ? "warn" : "bad", note: "(Net profit + finance cost + depreciation) \xF7 revenue." },
    { g: "Profitability", k: "nm", label: "Net profit margin", v: revenue > 4e-3 ? np / revenue * 100 : null, t: "%", good: (v) => v >= 10 ? "good" : v >= 3 ? "warn" : "bad", note: "Net profit \xF7 revenue from operations." },
    { g: "Profitability", k: "roe", label: "Return on equity (annualised)", v: equity > 4e-3 ? np * ann / equity * 100 : null, t: "%", good: (v) => v >= 15 ? "good" : v >= 8 ? "warn" : "bad", note: "Net profit (annualised) \xF7 closing equity." },
    { g: "Profitability", k: "roa", label: "Return on assets (annualised)", v: totalAssets > 4e-3 ? np * ann / totalAssets * 100 : null, t: "%", good: (v) => v >= 8 ? "good" : v >= 3 ? "warn" : "bad", note: "Net profit (annualised) \xF7 total assets." },
    { g: "Leverage", k: "de", label: "Debt-to-equity", v: equity > 4e-3 ? debt / equity : null, t: "x", good: (v) => v <= 1 ? "good" : v <= 2 ? "warn" : "bad", note: "Borrowings \xF7 equity. Lower is safer." },
    { g: "Leverage", k: "le", label: "Total liabilities \xF7 equity", v: equity > 4e-3 ? totalLiab / equity : null, t: "x", good: (v) => v <= 1.5 ? "good" : v <= 3 ? "warn" : "bad", note: "All liabilities \xF7 equity." },
    { g: "Leverage", k: "ic", label: "Interest coverage", v: fin > 4e-3 ? ebit / fin : null, t: "x", good: (v) => v >= 3 ? "good" : v >= 1.5 ? "warn" : "bad", note: "EBIT \xF7 finance costs." },
    { g: "Efficiency", k: "dso", label: "DSO \u2014 days sales outstanding", v: dso, t: "d", good: (v) => v <= 45 ? "good" : v <= 75 ? "warn" : "bad", note: "Receivables \xF7 credit sales billed (incl. GST) \xD7 days in period. Lower = faster collection." },
    { g: "Efficiency", k: "dpo", label: "DPO \u2014 days payables outstanding", v: dpo, t: "d", good: (v) => v >= 30 ? "good" : v >= 15 ? "warn" : "bad", note: "Payables \xF7 purchase bills received \xD7 days in period. Higher = longer to pay suppliers." },
    { g: "Efficiency", k: "dio", label: "DIO \u2014 days inventory outstanding", v: dio, t: "d", good: (v) => v <= 60 ? "good" : v <= 120 ? "warn" : "bad", note: "Inventory \xF7 cost of materials \xD7 days." },
    { g: "Efficiency", k: "ccc", label: "Cash conversion cycle", v: ccc, t: "d", good: (v) => v <= 45 ? "good" : v <= 90 ? "warn" : "bad", note: "DSO + DIO \u2212 DPO. Days your cash is tied up in operations." },
    { g: "Efficiency", k: "rt", label: "Receivables turnover", v: div(billedSales * ann, recv), t: "x", good: (v) => v >= 8 ? "good" : v >= 4 ? "warn" : "bad", note: "Credit sales (annualised) \xF7 receivables." },
    { g: "Efficiency", k: "it", label: "Inventory turnover", v: cogs > 4e-3 ? div(cogs * ann, inventory) : null, t: "x", good: (v) => v >= 6 ? "good" : v >= 3 ? "warn" : "bad", note: "Cost of materials (annualised) \xF7 inventory." },
    { g: "Efficiency", k: "at", label: "Asset turnover", v: div(revenue * ann, totalAssets), t: "x", good: (v) => v >= 1 ? "good" : v >= 0.5 ? "warn" : "bad", note: "Revenue (annualised) \xF7 total assets." }
  ];
  return { list, base: { revenue: r2(revenue), cogs: r2(cogs), np: r2(np), ebitda: r2(ebitda), cash: r2(cash), recv: r2(recv), pay: r2(pay), inventory: r2(inventory), equity: r2(equity), days } };
};
const fmtRatio = (v, t) => v == null || isNaN(v) ? "\u2014" : t === "%" ? v.toFixed(1) + "%" : t === "x" ? v.toFixed(2) + "\xD7" : t === "d" ? Math.round(v) + " days" : fmt(v);
const FY_MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const getBudgetFY = (fy) => (S.get(SK.BUDGET, {}) || {})["FY" + fy] || {};
const saveBudgetFY = (fy, rows) => S.set(SK.BUDGET, { ...S.get(SK.BUDGET, {}) || {}, ["FY" + fy]: rows });
const getMonthlyActuals = (fy) => {
  const from = fyStartOf(fy), to = fyEndOf(fy);
  const out = {};
  getAllLedgerLines().forEach((l) => {
    const d = l.date || "";
    if (d < from || d > to || l.reportingMethod === "cash") return;
    const a = coaByKey(l.account);
    if (a.type !== "income" && a.type !== "expense") return;
    const mi = (parseInt(d.slice(5, 7), 10) + 8) % 12;
    if (!out[l.account]) out[l.account] = new Array(12).fill(0);
    out[l.account][mi] += a.type === "income" ? l.credit - l.debit : l.debit - l.credit;
  });
  Object.keys(out).forEach((k) => {
    out[k] = out[k].map(r2);
  });
  return out;
};
const hasAdvanceApps = (txnId) => getAdvApps().some((a) => a.advTxnId === txnId);
