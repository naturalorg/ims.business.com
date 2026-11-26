const blankTxn = () => ({ id: Date.now().toString() + Math.random().toString(36).slice(2, 6), date: today(), desc: "", amount: "", type: "credit", refNo: "", matched: false, matchedRef: "", matchedType: "" });
const NAME_NOISE = ["pvt", "ltd", "private", "limited", "and", "the", "co", "company", "enterprises", "traders", "trading", "india", "services", "solutions", "llp", "corp", "neft", "imps", "upi", "rtgs", "from", "payment", "transfer"];
const nameTokens = (s) => (s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w.length >= 3 && !NAME_NOISE.includes(w));
const daysApart = (a, b) => {
  const x = new Date(a), y = new Date(b);
  if (isNaN(x) || isNaN(y)) return 999;
  return Math.abs(x - y) / 864e5;
};
const txnDupKey = (t) => `${t.acctId || "PRIMARY"}|${t.date}|${t.type}|${(parseFloat(t.amount) || 0).toFixed(2)}|${String(t.refNo || t.desc || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 40)}`;
const suggestKeyword = (desc) => {
  const skip = ["neft", "imps", "upi", "rtgs", "from", "to", "by", "txn", "ref", "transfer", "payment", "chq", "cheque", "cr", "dr", "ach", "pos", "atm", "the", "for", "and"];
  return (desc || "").toLowerCase().replace(/[^a-z ]+/g, " ").split(/\s+/).filter((w) => w.length >= 3 && !skip.includes(w)).slice(0, 2).join(" ");
};
const matchBankRule = (t, rules) => (rules || []).find((r) => r.keyword && (t.desc || "").toLowerCase().includes(String(r.keyword).toLowerCase()) && (r.type === "any" || r.type === t.type));
const getOpenItems = (type) => {
  if (type === "credit") {
    return S.get(SK.INV, []).filter((i) => (i.docType === "TAX INVOICE" || i.docType === "NON GST INVOICE" || i.docType === "DEBIT NOTE") && i.status !== "Paid" && i.status !== "Draft" && i.status !== "Cancelled").map((i) => {
      var _a;
      const total = Math.abs(getGrand(i));
      const out = +(total - invPaid(i)).toFixed(2);
      return {
        kind: "invoice",
        ref: i.invNo,
        party: ((_a = i.billTo) == null ? void 0 : _a.name) || "Unknown",
        total,
        out,
        date: i.date,
        due: i.dueDate || i.date,
        docNo: i.invNo,
        extra: "",
        ...isFxInv(i) ? { cur: i.currency, rate: parseFloat(i.exchRate) || 1, fcOut: +(out / (parseFloat(i.exchRate) || 1)).toFixed(2), extra: i.currency + " invoice @ " + i.exchRate } : {}
      };
    }).filter((o) => o.out > 0.01);
  }
  return S.get(SK.EXP, []).filter((e) => e.payStatus !== "Paid").map((e) => ({ kind: "expense", ref: e.id, party: e.vendor || "Unknown Vendor", total: expNetPayable(e), out: +expDue(e).toFixed(2), date: e.billDate || e.date, due: expDueDate(e), docNo: e.billNo || "", extra: e.category || "" })).filter((o) => o.out > 0.01);
};
const scoreOpenItem = (t, o) => {
  let score = 0;
  const reasons = [];
  const hay = `${t.desc || ""} ${t.refNo || ""}`.toLowerCase();
  const amt = parseFloat(t.amount) || 0;
  if (Math.abs(o.out - amt) < 0.01) {
    score += 60;
    reasons.push("Exact amount");
  } else if (Math.abs(o.total - amt) < 0.01) {
    score += 45;
    reasons.push("Equals full bill");
  } else if (o.out > 0 && Math.abs(o.out - amt) / o.out <= 0.02) {
    score += 20;
    reasons.push("Within 2%");
  }
  const no = String(o.docNo || "").toLowerCase();
  if (no.length >= 3 && hay.includes(no)) {
    score += 40;
    reasons.push("Doc no. in narration");
  }
  const toks = nameTokens(o.party);
  if (toks.length) {
    const hit = toks.filter((w) => hay.includes(w)).length;
    if (hit) {
      score += Math.round(30 * hit / toks.length);
      reasons.push("Name match");
    }
  }
  const dd = daysApart(t.date, o.due || o.date);
  if (dd <= 30) score += Math.round(10 * (1 - dd / 30));
  return { score, reasons };
};
const computeAllocs = (items, B, partial) => {
  const sorted = [...items].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  if (!partial) return sorted.map((o) => ({ kind: o.kind, ref: o.ref, amt: +o.out.toFixed(2) }));
  let rem = B;
  const out = [];
  sorted.forEach((o) => {
    const a = Math.min(o.out, rem);
    if (a > 4e-3) {
      out.push({ kind: o.kind, ref: o.ref, amt: +a.toFixed(2) });
      rem = +(rem - a).toFixed(2);
    }
  });
  return out;
};
const adjustDocPaid = (kind, ref, delta, t) => {
  if (kind === "invoice") {
    S.set(SK.INV, S.get(SK.INV, []).map((i) => {
      if (i.invNo !== ref) return i;
      const total = Math.abs(getGrand(i));
      const np = Math.max(0, Math.min(total, invPaid(i) + delta));
      const full = total - np <= 0.01;
      if (delta > 0) return { ...i, paidAmount: +np.toFixed(2), status: full ? "Paid" : i.status, paidDate: t.date, paymentRef: t.refNo || "" };
      return { ...i, paidAmount: +np.toFixed(2), status: i.status === "Paid" && !full ? "Sent" : i.status, paymentRef: np <= 0.01 ? "" : i.paymentRef };
    }));
  } else if (kind === "expense") {
    S.set(SK.EXP, S.get(SK.EXP, []).map((e) => {
      if (e.id !== ref) return e;
      const net = expNetPayable(e);
      const np = Math.max(0, Math.min(net, expPaid(e) + delta));
      const full = net - np <= 0.01;
      if (delta > 0) return { ...e, payStatus: full ? "Paid" : "Partial", paidAmount: +np.toFixed(2), reconciled: full, paidDate: t.date, paymentRef: t.refNo || "" };
      return { ...e, payStatus: np <= 0.01 ? "Pending" : "Partial", paidAmount: +np.toFixed(2), reconciled: false, paymentRef: np <= 0.01 ? "" : e.paymentRef };
    }));
  }
};
const BankLinkPanel = ({ t, accounts, allTxns, onLinkDocs, onPostLedger, onTransfer, onQuickSale, onSupplierRefund, onClose }) => {
  const isCredit = t.type === "credit";
  const [mode, setMode] = useState("docs");
  const items = useMemo(() => (mode === "refund" ? getOpenCreditNotes() : getOpenItems(t.type)).map((o) => ({ ...o, ...scoreOpenItem(t, o) })).sort((a, b) => b.score - a.score || (a.date || "").localeCompare(b.date || "")), [t.id, mode]);
  const [fcAmt, setFcAmt] = useState("");
  const [advParty, setAdvParty] = useState("");
  const [sv, setSv] = useState("");
  const [svLedger, setSvLedger] = useState("TRADE_PAYABLE");
  const [dq, setDq] = useState("");
  const [sel, setSel] = useState(() => {
    const b = items[0];
    return b && Math.abs(b.out - t.amount) < 0.01 ? [b.ref] : [];
  });
  const [shortMode, setShortMode] = useState("partial");
  const [restKey, setRestKey] = useState("");
  const [lk, setLk] = useState("");
  const [remember, setRemember] = useState(false);
  const [kw, setKw] = useState(() => suggestKeyword(t.desc));
  const [xferId, setXferId] = useState("");
  const [qsCustomer, setQsCustomer] = useState("");
  const [qsNotes, setQsNotes] = useState("");
  const toks = dq.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = items.filter((o) => !toks.length || toks.every((w) => `${o.ref} ${o.docNo} ${o.party} ${o.extra} ${o.out}`.toLowerCase().includes(w)));
  const chosen = items.filter((o) => sel.includes(o.ref));
  const selOut = +chosen.reduce((s, o) => s + o.out, 0).toFixed(2);
  const diff = +(t.amount - selOut).toFixed(2);
  const short = chosen.length > 0 && diff < -0.01, excess = chosen.length > 0 && diff > 0.01;
  const fxAny = chosen.some((o) => o.cur);
  const fxOne = chosen.length === 1 && !!chosen[0].cur;
  const restDefault = fxAny ? "FX" : mode === "refund" ? excess ? "OTHER_EXP" : "OTHER_INCOME" : isCredit ? excess ? "CUSTOMER_ADVANCE" : "TDS_RECEIVABLE" : excess ? "ADVANCES" : "OTHER_INCOME";
  const restEff = restKey || restDefault;
  const toggle = (ref) => setSel((p) => p.includes(ref) ? p.filter((x) => x !== ref) : [...p, ref]);
  const confirmDocs = () => {
    if (!chosen.length) {
      toast.error("Tick at least one " + (isCredit ? "invoice" : "bill") + " to link");
      return;
    }
    const partial = short && shortMode === "partial";
    let allocs = computeAllocs(chosen, t.amount, partial);
    let needsRest = !partial && Math.abs(diff) > 0.01;
    let restOut = restEff;
    if (partial && fxOne && parseFloat(fcAmt) > 0) {
      const a = Math.min(chosen[0].out, +(parseFloat(fcAmt) * chosen[0].rate).toFixed(2));
      allocs = [{ kind: "invoice", ref: chosen[0].ref, amt: a }];
      needsRest = Math.abs(t.amount - a) > 0.01;
      restOut = "FX";
    }
    onLinkDocs(t, chosen, allocs, needsRest ? restOut : "");
  };
  const candidates = useMemo(() => allTxns.filter((x) => x.id !== t.id && (x.acctId || "PRIMARY") !== (t.acctId || "PRIMARY") && !x.matched && x.type !== t.type && Math.abs((parseFloat(x.amount) || 0) - t.amount) < 0.01 && daysApart(x.date, t.date) <= 10).sort((a, b) => daysApart(a.date, t.date) - daysApart(b.date, t.date)), [t.id, allTxns]);
  const acctName = (id) => {
    const a = accounts.find((x) => x.id === (id || "PRIMARY"));
    return a ? a.name : "Other account";
  };
  const ledgerTypes = isCredit ? ["income", "liability", "equity", "asset", "expense"] : ["expense", "asset", "liability", "equity", "income"];
  const tabs = [["docs", isCredit ? "Match invoices" : "Match bills"], ["ledger", "Post to ledger"], ["transfer", "Transfer between my banks"]].concat(isCredit ? [["sale", "New sale"], ["suprefund", "Supplier refund"]] : [["refund", "Refund to customer"]]);
  return /* @__PURE__ */ React.createElement("div", { style: { background: "var(--card2)", padding: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12, alignItems: "center" } }, tabs.map(([k, l]) => /* @__PURE__ */ React.createElement("button", { key: k, onClick: () => {
    setMode(k);
    setSel([]);
  }, style: {
    padding: "5px 12px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: mode === k ? 700 : 500,
    cursor: "pointer",
    border: `2px solid ${mode === k ? "var(--primary)" : "var(--border2)"}`,
    background: mode === k ? "var(--primary-bg)" : "transparent",
    color: mode === k ? "var(--primary2)" : "var(--text2)"
  } }, l)), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: onClose }, "Close")), (mode === "docs" || mode === "refund") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--text3)", marginBottom: 8 } }, mode === "refund" ? /* @__PURE__ */ React.createElement(React.Fragment, null, "Money going out to a customer? Tick the ", /* @__PURE__ */ React.createElement("b", null, "credit note(s)"), " this ", fmt(t.amount), " refund settles \u2014 it posts Dr Receivables / Cr Bank so the credit note is cleared.") : /* @__PURE__ */ React.createElement(React.Fragment, null, "Tick one or more ", isCredit ? "unpaid invoices" : "unpaid bills", " this ", fmt(t.amount), " ", isCredit ? "receipt" : "payment", " settles."), " Best matches (amount, document no., party name, date) are on top."), /* @__PURE__ */ React.createElement("input", { className: "field-input", style: { marginBottom: 8, maxWidth: 340 }, placeholder: `Search ${isCredit ? "invoice no., customer" : "bill no., vendor, head"}, amount\u2026`, value: dq, onChange: (e) => setDq(e.target.value) }), items.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text3)", padding: "8px 0" } }, mode === "refund" ? "No credit notes are waiting for a refund." : /* @__PURE__ */ React.createElement(React.Fragment, null, "Nothing open to link \u2014 ", isCredit ? "every invoice is already paid." : "every bill is already paid.", " Use \u201CPost to ledger\u201D for an advance, charge or other entry.")) : /* @__PURE__ */ React.createElement("div", { style: { maxHeight: 230, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8, background: "var(--card)" } }, shown.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { padding: 12, fontSize: 12, color: "var(--text3)" } }, "No documents match \u201C", dq, "\u201D."), shown.map((o) => /* @__PURE__ */ React.createElement("label", { key: o.ref, style: { display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: sel.includes(o.ref) ? "var(--primary-bg)" : "transparent" } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: sel.includes(o.ref), onChange: () => toggle(o.ref) }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 12.5 } }, o.docNo || o.ref, " \u2014 ", o.party), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)" } }, fmtDate ? fmtDate(o.date) : o.date, o.extra ? ` \xB7 ${o.extra}` : "", o.total - o.out > 0.01 ? ` \xB7 already paid ${fmt(o.total - o.out)} of ${fmt(o.total)}` : "")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" } }, o.reasons.map((r) => /* @__PURE__ */ React.createElement("span", { key: r, className: "badge badge-green", style: { fontSize: 9.5 } }, r))), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 12.5, minWidth: 90, textAlign: "right" } }, fmt(o.out))))), chosen.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, padding: 10, border: "1px solid var(--border)", borderRadius: 8, background: "var(--card)", fontSize: 12.5 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", null, "Selected ", mode === "refund" ? "credit notes" : isCredit ? "invoices" : "bills", " outstanding"), /* @__PURE__ */ React.createElement("b", null, fmt(selOut))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", null, "Bank ", isCredit ? "receipt" : "payment"), /* @__PURE__ */ React.createElement("b", null, fmt(t.amount))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontWeight: 700, color: Math.abs(diff) < 0.01 ? "var(--green)" : "var(--gold)" } }, /* @__PURE__ */ React.createElement("span", null, Math.abs(diff) < 0.01 ? "\u2713 Exact \u2014 clears in full" : short ? "Short by" : "Excess of"), Math.abs(diff) >= 0.01 && /* @__PURE__ */ React.createElement("span", null, fmt(Math.abs(diff)))), short && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--text3)", marginBottom: 4 } }, "The bank amount is less than the documents. What should the ", fmt(Math.abs(diff)), " be?"), /* @__PURE__ */ React.createElement("label", { style: { display: "flex", gap: 6, alignItems: "center", cursor: "pointer", marginBottom: 3 } }, /* @__PURE__ */ React.createElement("input", { type: "radio", checked: shortMode === "partial", onChange: () => setShortMode("partial") }), " Partial payment \u2014 leave the balance open (oldest first)"), /* @__PURE__ */ React.createElement("label", { style: { display: "flex", gap: 6, alignItems: "center", cursor: "pointer" } }, /* @__PURE__ */ React.createElement("input", { type: "radio", checked: shortMode === "adjust", onChange: () => setShortMode("adjust") }), " Settle in full \u2014 post the difference to a ledger ", isCredit ? "(e.g. TDS deducted by customer, discount)" : "(e.g. discount received)")), (short && shortMode === "adjust" || excess) && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--text3)", marginBottom: 4 } }, excess ? isCredit ? "Extra received \u2014 keep as customer advance, or post elsewhere:" : "Extra paid \u2014 keep as advance to supplier, or post elsewhere:" : "Post the difference to:"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 } }, [...fxAny ? [["FX", "Exchange gain / loss"]] : [], ...mode === "refund" ? [["OTHER_EXP", "Refund charges / other expense"], ["OTHER_INCOME", "Amount retained / other income"]] : isCredit ? [["TDS_RECEIVABLE", "TDS receivable"], ["CUSTOMER_ADVANCE", "Customer advance"]] : [["ADVANCES", "Advance to supplier"], ["OTHER_INCOME", "Discount / other income"]]].map(([k, l]) => /* @__PURE__ */ React.createElement("button", { key: k, className: "btn btn-sm " + (restEff === k ? "btn-primary" : "btn-outline"), onClick: () => setRestKey(k) }, l))), restEff !== "FX" ? /* @__PURE__ */ React.createElement(AccountSelect, { value: restEff, onChange: setRestKey, types: ledgerTypes, createType: isCredit ? "income" : "expense" }) : /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--text3)" } }, "The difference between the \u20B9 received and the \u20B9 booked is posted to Foreign Exchange ", diff > 0 ? "Gain" : "Loss", ".")), fxOne && short && shortMode === "partial" && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12 } }, "Foreign amount being settled (", chosen[0].cur, ")"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { width: 120, padding: "5px 8px" }, placeholder: String(+(t.amount / chosen[0].rate).toFixed(2)), value: fcAmt, onChange: (e) => setFcAmt(e.target.value) }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text3)" } }, "booked at \u20B9", chosen[0].rate, "; any difference becomes exchange gain/loss")), fxOne && !short && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6, fontSize: 11.5, color: "var(--text3)" } }, "Outstanding ", fmtC(chosen[0].fcOut, chosen[0].cur), " \xB7 effective rate received \u20B9", (t.amount / chosen[0].fcOut).toFixed(4), " vs booked \u20B9", chosen[0].rate), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-primary", onClick: confirmDocs }, "Confirm Link")))), mode === "ledger" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--text3)", marginBottom: 8 } }, "Post this ", isCredit ? "receipt" : "payment", " straight to a ledger \u2014 bank charges, interest, loan EMI, capital introduced, GST/TDS paid, or an advance. Type to search; type a new name to create the ledger."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 } }, (isCredit ? [["CUSTOMER_ADVANCE", "Customer advance"], ["OTHER_INCOME", "Other income"], ["CAPITAL", "Capital introduced"]] : [["ADVANCES", "Advance to supplier"], ["FINANCE_COST", "Finance cost / interest"], ["TDS_PAYABLE", "TDS deposited"]]).map(([k, l]) => /* @__PURE__ */ React.createElement("button", { key: k, className: "btn btn-sm " + (lk === k ? "btn-primary" : "btn-outline"), onClick: () => setLk(k) }, l))), /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 420 } }, /* @__PURE__ */ React.createElement(AccountSelect, { value: lk, onChange: setLk, types: ledgerTypes, createType: isCredit ? "income" : "expense", placeholder: "Choose the ledger this posts to\u2026" })), (lk === "CUSTOMER_ADVANCE" || lk === "ADVANCES") && /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 420, marginTop: 8 } }, /* @__PURE__ */ React.createElement("input", { className: "field-input", placeholder: lk === "ADVANCES" ? "Which supplier is this advance for? (so it can be applied to their bill later)" : "Which customer is this advance from? (so it can be applied to their invoice later)", value: advParty, onChange: (e) => setAdvParty(e.target.value) })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 10 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "flex", gap: 6, alignItems: "center", cursor: "pointer", fontSize: 12 } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: remember, onChange: (e) => setRemember(e.target.checked) }), " Remember: whenever the narration contains"), /* @__PURE__ */ React.createElement("input", { className: "field-input", style: { maxWidth: 180, padding: "5px 9px", fontSize: 12 }, value: kw, onChange: (e) => setKw(e.target.value), disabled: !remember }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text3)" } }, "\u2192 post to this ledger automatically")), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-primary", onClick: () => onPostLedger(t, lk, remember ? kw.trim() : "", advParty.trim()) }, "Post to Ledger"))), mode === "transfer" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--text3)", marginBottom: 8 } }, "Moving money between your own bank accounts? Pick the opposite leg in the other account (same amount, within 10 days). It posts once between the two bank ledgers \u2014 it is not income or expense."), candidates.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text3)" } }, "No unreconciled ", isCredit ? "money-out" : "money-in", " of ", fmt(t.amount), " found in your other accounts. Import or add that account\u2019s statement line first.") : /* @__PURE__ */ React.createElement("div", { style: { border: "1px solid var(--border)", borderRadius: 8, background: "var(--card)" } }, candidates.map((x) => /* @__PURE__ */ React.createElement("label", { key: x.id, style: { display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", borderBottom: "1px solid var(--border)", cursor: "pointer" } }, /* @__PURE__ */ React.createElement("input", { type: "radio", name: "xf" + t.id, checked: xferId === x.id, onChange: () => setXferId(x.id) }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("b", { style: { fontSize: 12.5 } }, acctName(x.acctId)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)" } }, fmtDate ? fmtDate(x.date) : x.date, " \xB7 ", x.desc)), /* @__PURE__ */ React.createElement("b", { style: { fontSize: 12.5 } }, fmt(x.amount))))), candidates.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-primary", disabled: !xferId, onClick: () => onTransfer(t, allTxns.find((x) => x.id === xferId)) }, "Link as Transfer"))), mode === "suprefund" && isCredit && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--text3)", marginBottom: 8 } }, "A supplier returned money (refund of an overpayment, returned goods, or an advance you had paid)? Record it here \u2014 it posts Dr Bank / Cr the supplier\u2019s account."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" } }, /* @__PURE__ */ React.createElement("input", { className: "field-input", list: "sv" + t.id, style: { flex: "1 1 220px" }, placeholder: "Supplier name", value: sv, onChange: (e) => setSv(e.target.value) }), /* @__PURE__ */ React.createElement("datalist", { id: "sv" + t.id }, [...new Set((S.get(SK.EXP, []) || []).map((e) => e.vendor).filter(Boolean))].map((n) => /* @__PURE__ */ React.createElement("option", { key: n, value: n }))), /* @__PURE__ */ React.createElement("select", { className: "field-input", style: { flex: "1 1 240px" }, value: svLedger, onChange: (e) => setSvLedger(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "TRADE_PAYABLE" }, "Reduce amount payable (returns / overpayment)"), /* @__PURE__ */ React.createElement("option", { value: "ADVANCES" }, "Refund of advance paid to supplier")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-primary", onClick: () => onSupplierRefund(t, sv, svLedger) }, "Record supplier refund"))), mode === "sale" && isCredit && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--text3)", marginBottom: 6 } }, "No matching invoice? Record this credit directly as a new Sale:"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("input", { className: "field-input", style: { flex: "1 1 160px" }, placeholder: "Customer name (optional)", value: qsCustomer, onChange: (e) => setQsCustomer(e.target.value) }), /* @__PURE__ */ React.createElement("input", { className: "field-input", style: { flex: "1 1 160px" }, placeholder: "Notes (optional)", value: qsNotes, onChange: (e) => setQsNotes(e.target.value) }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: () => onQuickSale(t, qsCustomer, qsNotes) }, /* @__PURE__ */ React.createElement(Ic, { n: "plus", s: 12 }), " Record as New Sale"))));
};
const BankReconPage = ({ inline = true, onClose, currentUser }) => {
  var _a;
  const [accounts, setAccounts] = useState(() => {
    let accts = S.get(SK.BANK_ACCTS, []);
    if (accts.length === 0) {
      accts = [{ id: "PRIMARY", name: "Primary Account", bankName: "", accountNo: "", openingBalance: parseFloat(S.get(SK.BANK_OB, 0)) || 0 }];
      S.set(SK.BANK_ACCTS, accts);
    }
    return accts;
  });
  const [activeAcctId, setActiveAcctId] = useState(() => {
    var _a2;
    return ((_a2 = accounts[0]) == null ? void 0 : _a2.id) || "PRIMARY";
  });
  const [acctForm, setAcctForm] = useState(null);
  const [allTxns, setAllTxns] = useState(() => S.get(SK.BANK, []));
  const txns = useMemo(() => allTxns.filter((t) => (t.acctId || "PRIMARY") === activeAcctId), [allTxns, activeAcctId]);
  const [form, setForm] = useState(blankTxn());
  const [filter, setFilter] = useState("unmatched");
  const [search, setSearch] = useState("");
  const [matchingId, setMatchingId] = useState(null);
  const [editingOB, setEditingOB] = useState(false);
  const [rules, setRules] = useState(() => S.get(SK.BANK_RULES, []) || []);
  const [showRules, setShowRules] = useState(false);
  const fileRef = useRef();
  const activeAcct = accounts.find((a) => a.id === activeAcctId) || accounts[0];
  const openingBal = String((activeAcct == null ? void 0 : activeAcct.openingBalance) || 0);
  const acctName = (id) => (accounts.find((a) => a.id === (id || "PRIMARY")) || {}).name || "Other account";
  const saveAccounts = (u) => {
    setAccounts(u);
    S.set(SK.BANK_ACCTS, u);
  };
  const setOpeningBal = (v) => saveAccounts(accounts.map((a) => a.id === activeAcctId ? { ...a, openingBalance: parseFloat(v) || 0 } : a));
  const saveOpeningBal = () => {
    setEditingOB(false);
    toast.success("Opening balance saved");
  };
  const commit = (fn) => {
    const next = fn(S.get(SK.BANK, []));
    setAllTxns(next);
    S.set(SK.BANK, next);
    return next;
  };
  const persist = (u) => commit((all) => [...all.filter((t) => (t.acctId || "PRIMARY") !== activeAcctId), ...u]);
  const submitAcct = () => {
    const f = acctForm;
    if (!f) return;
    if (!f.name.trim()) {
      toast.error("Account name is required");
      return;
    }
    if (f.mode === "add") {
      const acct = { id: "ACC" + Date.now().toString(36), name: f.name.trim(), bankName: f.bankName.trim(), accountNo: f.accountNo.trim(), openingBalance: parseFloat(f.openingBalance) || 0 };
      saveAccounts([...accounts, acct]);
      logAudit("BANK_ACCOUNT_ADDED", `${acct.name}${acct.bankName ? " \u2014 " + acct.bankName : ""}`, currentUser);
      setActiveAcctId(acct.id);
      toast.success("Bank account added \u2014 it now has its own ledger under Cash and Cash Equivalents");
    } else {
      saveAccounts(accounts.map((a) => a.id === activeAcctId ? { ...a, name: f.name.trim(), bankName: f.bankName.trim(), accountNo: f.accountNo.trim() } : a));
      logAudit("BANK_ACCOUNT_EDITED", `${f.name.trim()}`, currentUser);
      toast.success("Bank account updated");
    }
    setAcctForm(null);
  };
  const deleteAccount = () => {
    if (accounts.length <= 1) {
      toast.error("You need at least one bank account");
      return;
    }
    if (allTxns.some((t) => (t.acctId || "PRIMARY") === activeAcctId)) {
      toast.error("Delete or move this account's transactions first");
      return;
    }
    const lk = bankLedgerKey(activeAcctId);
    if (getAllLedgerLines().some((l) => l.account === lk && l.srcType !== "BANKOB")) {
      toast.error("Journal vouchers or bill payments are posted to this account's ledger \u2014 it can't be removed.");
      return;
    }
    if (!window.confirm(`Delete "${activeAcct.name}"? This cannot be undone.`)) return;
    const remaining = accounts.filter((a) => a.id !== activeAcctId);
    saveAccounts(remaining);
    logAudit("BANK_ACCOUNT_DELETED", `${activeAcct.name}`, currentUser);
    setActiveAcctId(remaining[0].id);
  };
  const sortedTxns = useMemo(() => [...txns].sort((a, b) => (a.date || "").localeCompare(b.date || "") || String(a.id).localeCompare(String(b.id))), [txns]);
  const balanceById = useMemo(() => {
    let bal = parseFloat(openingBal) || 0;
    const map = {};
    sortedTxns.forEach((t) => {
      bal += (t.type === "credit" ? 1 : -1) * (parseFloat(t.amount) || 0);
      map[t.id] = bal;
    });
    return map;
  }, [sortedTxns, openingBal]);
  const currentBalance = sortedTxns.length ? balanceById[sortedTxns[sortedTxns.length - 1].id] : parseFloat(openingBal) || 0;
  const totalIn = txns.filter((t) => t.type === "credit").reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
  const totalOut = txns.filter((t) => t.type === "debit").reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
  const unmatchedIn = txns.filter((t) => !t.matched && t.type === "credit");
  const unmatchedOut = txns.filter((t) => !t.matched && t.type === "debit");
  const stmtDate = (activeAcct == null ? void 0 : activeAcct.stmtDate) || today();
  const registerAsOf = sortedTxns.filter((t) => (t.date || "") <= stmtDate).reduce((b, t) => b + (t.type === "credit" ? 1 : -1) * (parseFloat(t.amount) || 0), parseFloat(openingBal) || 0);
  const stmtBalNum = (activeAcct == null ? void 0 : activeAcct.stmtBalance) === void 0 || (activeAcct == null ? void 0 : activeAcct.stmtBalance) === "" || (activeAcct == null ? void 0 : activeAcct.stmtBalance) === null ? null : parseFloat(activeAcct.stmtBalance);
  const stmtDiff = stmtBalNum === null || isNaN(stmtBalNum) ? null : +(stmtBalNum - registerAsOf).toFixed(2);
  const ledgerBal = useMemo(() => {
    const r = getTrialBalance("9999-12-31").find((x) => x.account === bankLedgerKey(activeAcctId));
    return r ? r.balance : 0;
  }, [allTxns, accounts, activeAcctId]);
  const ledgerGap = +(ledgerBal - currentBalance).toFixed(2);
  const setStmt = (patch) => saveAccounts(accounts.map((a) => a.id === activeAcctId ? { ...a, ...patch } : a));
  const addTxn = () => {
    if (!form.desc || !form.amount) {
      toast.error("Description and amount required");
      return;
    }
    const rec = { ...form, amount: parseFloat(form.amount), acctId: activeAcctId };
    if (txns.some((t) => txnDupKey(t) === txnDupKey(rec)) && !window.confirm("A transaction with the same date, amount and reference/description already exists in this account. Add it anyway?")) return;
    const rule = matchBankRule(rec, rules);
    if (rule) {
      rec.matched = true;
      rec.matchedType = "ledger";
      rec.ledgerKey = rule.ledgerKey;
      rec.matchedRef = coaByKey(rule.ledgerKey).name;
    }
    persist([...txns, rec]);
    setForm(blankTxn());
    toast.success(rule ? `Transaction added \u2014 auto-posted to ${coaByKey(rule.ledgerKey).name}` : "Transaction added");
  };
  const delTxn = (id) => {
    if (hasAdvanceApps(id)) {
      toast.error("This advance has been applied to invoices/bills \u2014 reverse those first (Accounting \u2192 Advance Application).");
      return;
    }
    if (!window.confirm("Delete this bank transaction?")) return;
    persist(txns.filter((t) => t.id !== id));
  };
  const importFile = (e) => {
    var _a2;
    const file = (_a2 = e.target.files) == null ? void 0 : _a2[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const toISODate = (v) => {
          if (v === void 0 || v === null || v === "") return today();
          if (typeof v === "number") {
            const dt = new Date(Math.round((v - 25569) * 86400 * 1e3));
            return isNaN(dt) ? today() : dt.toISOString().split("T")[0];
          }
          if (v instanceof Date) return isNaN(v) ? today() : _iso(v);
          const s = String(v).trim();
          const dmY = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
          if (dmY) {
            const [, dd, mm, yy] = dmY;
            return `${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
          }
          return s || today();
        };
        const imported = rows.map((r) => {
          const get = (...keys) => keys.map((k) => r[k]).find((v) => v !== void 0 && v !== "");
          const debitCol = get("Debit", "debit", "Withdrawal", "Withdrawals", "Withdrawal Amt.");
          const creditCol = get("Credit", "credit", "Deposit", "Deposits", "Deposit Amt.");
          const amtCol = get("Amount", "amount", "AMOUNT");
          const typeCol = get("Type", "type");
          let isDebit, rawAmt;
          if (debitCol !== void 0 || creditCol !== void 0) {
            isDebit = debitCol !== void 0 && parseFloat(String(debitCol).replace(/,/g, "") || 0) > 0;
            rawAmt = isDebit ? debitCol : creditCol;
          } else if (amtCol !== void 0) {
            const n = parseFloat(String(amtCol).replace(/,/g, "")) || 0;
            isDebit = typeCol ? String(typeCol).toLowerCase() === "debit" : n < 0;
            rawAmt = amtCol;
          } else {
            isDebit = typeCol ? String(typeCol).toLowerCase() === "debit" : false;
            rawAmt = 0;
          }
          return {
            id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
            date: toISODate(get("Date", "date", "DATE", "Txn Date", "Value Date")),
            desc: get("Description", "description", "Narration", "narration", "Particulars") || "",
            amount: Math.abs(parseFloat(String(rawAmt).replace(/,/g, "")) || 0),
            type: isDebit ? "debit" : "credit",
            refNo: String(get("Ref No", "RefNo", "Reference", "Chq/Ref No", "Chq./Ref.No.", "UTR", "Ref") || ""),
            matched: false,
            matchedRef: "",
            matchedType: "",
            acctId: activeAcctId
          };
        }).filter((t) => (t.desc || t.amount) && t.amount > 0);
        if (imported.length === 0) {
          toast.error("No rows found \u2014 check the file has Date/Description/Amount columns");
          return;
        }
        const seen = {};
        txns.forEach((t) => {
          const k = txnDupKey(t);
          seen[k] = (seen[k] || 0) + 1;
        });
        const fresh = [];
        let skipped = 0, ruled = 0;
        imported.forEach((t) => {
          const k = txnDupKey(t);
          if (seen[k] > 0) {
            seen[k]--;
            skipped++;
            return;
          }
          const rule = matchBankRule(t, rules);
          if (rule) {
            t.matched = true;
            t.matchedType = "ledger";
            t.ledgerKey = rule.ledgerKey;
            t.matchedRef = coaByKey(rule.ledgerKey).name;
            ruled++;
          }
          fresh.push(t);
        });
        if (fresh.length === 0) {
          toast.info(`All ${skipped} rows were already imported \u2014 nothing new to add.`);
          if (fileRef.current) fileRef.current.value = "";
          return;
        }
        persist([...txns, ...fresh]);
        toast.success(`Imported ${fresh.length} transaction${fresh.length === 1 ? "" : "s"}${skipped ? ` \xB7 ${skipped} duplicate${skipped === 1 ? "" : "s"} skipped` : ""}${ruled ? ` \xB7 ${ruled} auto-categorised by your rules` : ""}`);
      } catch (err) {
        toast.error("Could not read file: " + err.message);
      }
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsBinaryString(file);
  };
  const linkDocs = (t, chosen, allocs, restKey) => {
    const applied = +allocs.reduce((s, a) => s + a.amt, 0).toFixed(2);
    commit((all) => all.map((x) => x.id === t.id ? {
      ...x,
      matched: true,
      matchedType: chosen[0].kind,
      matchedRef: chosen.length > 1 ? `${chosen[0].docNo || chosen[0].ref} +${chosen.length - 1} more` : chosen[0].docNo || chosen[0].ref,
      allocs,
      restKey: restKey || "",
      ledgerKey: ""
    } : x));
    allocs.forEach((a) => adjustDocPaid(a.kind, a.ref, a.amt, t));
    const isInv = chosen[0].kind === "invoice";
    logAudit(isInv ? "INVOICE_MARKED_PAID" : "EXPENSE_MARKED_PAID", `${allocs.map((a) => a.ref).join(", ")} settled by bank transaction${t.refNo ? " (ref " + t.refNo + ")" : ""} \u2014 ${fmt(applied)} applied${Math.abs(t.amount - applied) > 0.01 ? ", difference " + fmt(Math.abs(t.amount - applied)) + " \u2192 " + coaByKey(restKey || "").name : ""}`, currentUser);
    setMatchingId(null);
    toast.success(allocs.every((a) => {
      const o = chosen.find((c) => c.ref === a.ref);
      return o && a.amt >= o.out - 0.01;
    }) ? "Linked and marked paid!" : "Linked \u2014 partial payment recorded, balance stays open");
  };
  const postLedger = (t, ledgerKey, keyword, party) => {
    if (!ledgerKey) {
      toast.error("Choose a ledger first");
      return;
    }
    if (coaByKey(ledgerKey).groupOnly) {
      toast.error("Pick a specific ledger, not the parent group");
      return;
    }
    commit((all) => all.map((x) => x.id === t.id ? { ...x, matched: true, matchedType: "ledger", ledgerKey, matchedRef: coaByKey(ledgerKey).name, allocs: void 0, restKey: "", advParty: party || "" } : x));
    logAudit("BANK_TXN_POSTED_TO_LEDGER", `${t.desc || "Bank line"} (${fmt(t.amount)}) \u2192 ${coaByKey(ledgerKey).name}`, currentUser);
    if (keyword) {
      const nr = [...rules.filter((r) => !(r.keyword.toLowerCase() === keyword.toLowerCase() && r.type === t.type)), { id: "R" + Date.now().toString(36), keyword, type: t.type, ledgerKey }];
      setRules(nr);
      S.set(SK.BANK_RULES, nr);
      toast.success(`Posted \u2014 and \u201C${keyword}\u201D will auto-post to ${coaByKey(ledgerKey).name} from now on`);
    } else toast.success(`Posted to ${coaByKey(ledgerKey).name}`);
    setMatchingId(null);
  };
  const supplierRefund = (t, vendor, ledger) => {
    if (!(vendor || "").trim()) {
      toast.error("Enter the supplier name");
      return;
    }
    commit((all) => all.map((x) => x.id === t.id ? { ...x, matched: true, matchedType: "suprefund", matchedRef: vendor.trim(), allocs: [{ kind: "suprefund", ref: vendor.trim(), amt: t.amount }], restKey: "", ledgerKey: "", refundLedger: ledger || "TRADE_PAYABLE" } : x));
    logAudit("SUPPLIER_REFUND_RECORDED", `${fmt(t.amount)} received from ${vendor.trim()}`, currentUser);
    setMatchingId(null);
    toast.success("Supplier refund recorded");
  };
  const linkTransfer = (t, partner) => {
    if (!partner) {
      toast.error("Pick the matching transaction in the other account");
      return;
    }
    commit((all) => all.map((x) => x.id === t.id ? { ...x, matched: true, matchedType: "transfer", matchedRef: partner.id } : x.id === partner.id ? { ...x, matched: true, matchedType: "transfer", matchedRef: t.id } : x));
    logAudit("BANK_TRANSFER_LINKED", `${fmt(t.amount)} between ${acctName(t.acctId)} and ${acctName(partner.acctId)}`, currentUser);
    setMatchingId(null);
    toast.success("Linked as an inter-bank transfer \u2014 no income/expense booked");
  };
  const createQuickSale = (t, customer, notes) => {
    const qs = {
      id: "QS-" + Date.now().toString() + Math.random().toString(36).slice(2, 5),
      date: t.date,
      customer: (customer || "").trim() || "Unknown / Walk-in",
      desc: t.desc || notes || "Bank credit",
      notes: (notes || "").trim(),
      amount: t.amount,
      refNo: t.refNo || "",
      voucherNo: nextVoucherNo(),
      txnRefNo: nextTxnRefNo(t.date),
      source: "bank",
      createdBy: (currentUser == null ? void 0 : currentUser.username) || (currentUser == null ? void 0 : currentUser.name) || "",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    S.set(SK.QSALE, [...S.get(SK.QSALE, []), qs]);
    commit((all) => all.map((x) => x.id === t.id ? { ...x, matched: true, matchedRef: qs.id, matchedType: "quicksale" } : x));
    logAudit("QUICK_SALE_CREATED", `${qs.id} created from bank credit${t.refNo ? " (ref " + t.refNo + ")" : ""} \u2014 ${fmt(qs.amount)}`, currentUser);
    setMatchingId(null);
    toast.success("Recorded as a new Sale");
  };
  const unlink = (t) => {
    if (hasAdvanceApps(t.id)) {
      toast.error("This advance has been applied to invoices/bills \u2014 reverse those under Accounting \u2192 Advance Application first.");
      return;
    }
    const clear = { matched: false, matchedRef: "", matchedType: "", allocs: void 0, restKey: "", ledgerKey: "", refundLedger: "", advParty: "" };
    if (t.matchedType === "transfer") {
      commit((all) => all.map((x) => x.id === t.id || x.id === t.matchedRef ? { ...x, ...clear } : x));
    } else {
      commit((all) => all.map((x) => x.id === t.id ? { ...x, ...clear } : x));
      if (t.matchedType === "invoice" || t.matchedType === "expense") {
        if (Array.isArray(t.allocs) && t.allocs.length) t.allocs.forEach((a) => adjustDocPaid(a.kind, a.ref, -a.amt, t));
        else adjustDocPaid(t.matchedType, t.matchedRef, -1e12, t);
      } else if (t.matchedType === "quicksale") {
        S.set(SK.QSALE, S.get(SK.QSALE, []).filter((q2) => q2.id !== t.matchedRef));
      }
    }
    toast.info("Unlinked");
  };
  const autoMatchAll = () => {
    const cands = [];
    txns.filter((t) => !t.matched).forEach((t) => {
      const exact = getOpenItems(t.type).filter((o) => Math.abs(o.out - t.amount) < 0.01).map((o) => ({ ...o, ...scoreOpenItem(t, o) }));
      let pick = null;
      if (exact.length === 1) pick = exact[0];
      else if (exact.length > 1) {
        const strong = exact.filter((o) => o.reasons.includes("Doc no. in narration") || o.reasons.includes("Name match"));
        if (strong.length === 1) pick = strong[0];
      }
      if (pick) cands.push({ t, pick });
    });
    const used = /* @__PURE__ */ new Set();
    const final = cands.filter(({ pick }) => {
      if (used.has(pick.ref)) return false;
      used.add(pick.ref);
      return true;
    });
    if (final.length === 0) {
      toast.info("No unambiguous matches found. Link the rest manually \u2014 the panel ranks the best suggestions for you.");
      return;
    }
    if (!window.confirm(`Found ${final.length} transaction(s) that match exactly one open invoice/bill (same amount, confirmed by document no. or party name where several share the amount). Link them all now?`)) return;
    final.forEach(({ t, pick }) => linkDocs(t, [pick], [{ kind: pick.kind, ref: pick.ref, amt: pick.out }], ""));
    toast.success(`Auto-matched ${final.length} transaction(s)`);
  };
  const applyRulesNow = () => {
    const hits = txns.filter((t) => !t.matched && matchBankRule(t, rules));
    if (!hits.length) {
      toast.info(rules.length ? "No unreconciled lines match your rules." : "You have no rules yet \u2014 post a line to a ledger and tick \u201CRemember\u201D.");
      return;
    }
    commit((all) => all.map((x) => {
      if (x.matched || (x.acctId || "PRIMARY") !== activeAcctId) return x;
      const r = matchBankRule(x, rules);
      return r ? { ...x, matched: true, matchedType: "ledger", ledgerKey: r.ledgerKey, matchedRef: coaByKey(r.ledgerKey).name } : x;
    }));
    toast.success(`${hits.length} line(s) posted by your rules`);
  };
  const deleteRule = (id) => {
    const nr = rules.filter((r) => r.id !== id);
    setRules(nr);
    S.set(SK.BANK_RULES, nr);
  };
  const q = search.trim().toLowerCase();
  const filtered = sortedTxns.filter((t) => (filter === "all" || (filter === "matched" ? t.matched : !t.matched)) && (!q || `${t.desc} ${t.refNo} ${t.amount} ${t.matchedRef || ""}`.toLowerCase().includes(q)));
  const statusLabel = (t) => {
    if (!t.matched) return null;
    if (t.matchedType === "creditnote") return `Customer refund: ${t.matchedRef}`;
    if (t.matchedType === "suprefund") return `Supplier refund: ${t.matchedRef}`;
    if (t.matchedType === "quicksale") return `New Sale: ${t.matchedRef}`;
    if (t.matchedType === "ledger") return `Posted: ${t.matchedRef}`;
    if (t.matchedType === "transfer") {
      const p = allTxns.find((x) => x.id === t.matchedRef);
      return `Transfer \u21C4 ${p ? acctName(p.acctId) : "other bank"}`;
    }
    const applied = Array.isArray(t.allocs) ? t.allocs.reduce((s, a) => s + a.amt, 0) : t.amount;
    return `Linked: ${t.matchedRef}${Math.abs(applied - t.amount) > 0.01 ? " (+ difference)" : ""}`;
  };
  const acctOptions = accounts.map((a) => {
    const bal = allTxns.filter((t) => (t.acctId || "PRIMARY") === a.id).reduce((b, t) => b + (t.type === "credit" ? 1 : -1) * (parseFloat(t.amount) || 0), parseFloat(a.openingBalance) || 0);
    return { value: a.id, label: `${a.name}${a.bankName ? ` \u2014 ${a.bankName}` : ""}${a.accountNo ? ` (\u2022\u2022${String(a.accountNo).slice(-4)})` : ""}`, sub: `Balance ${fmt(bal)} \xB7 ledger: ${bankLedgerName(a)}`, keywords: `${a.bankName} ${a.accountNo}` };
  });
  const upAF = (k) => (e) => setAcctForm((p) => ({ ...p, [k]: e.target.value }));
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay" }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal" }, !inline && /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("span", { className: "modal-title" }, /* @__PURE__ */ React.createElement(Ic, { n: "bank", s: 18 }), " Bank Reconciliation"), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Ic, { n: "x" }))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 6, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(Ic, { n: "bank", s: 15 }), /* @__PURE__ */ React.createElement("div", { style: { width: 300, maxWidth: "100%" } }, /* @__PURE__ */ React.createElement(SearchSelect, { value: activeAcctId, onChange: setActiveAcctId, options: acctOptions, style: { fontWeight: 600 }, placeholder: "Select bank account\u2026" })), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: () => setAcctForm({ mode: "add", name: "", bankName: "", accountNo: "", openingBalance: "" }) }, /* @__PURE__ */ React.createElement(Ic, { n: "plus", s: 12 }), " Add Account"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => setAcctForm({ mode: "edit", name: activeAcct.name || "", bankName: activeAcct.bankName || "", accountNo: activeAcct.accountNo || "", openingBalance: "" }) }, "Edit"), accounts.length > 1 && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", style: { borderColor: "var(--red)", color: "var(--red)" }, onClick: deleteAccount }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 11 }), " Remove")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", marginBottom: 12 } }, "Posts to its own ledger: ", /* @__PURE__ */ React.createElement("b", null, bankLedgerName(activeAcct)), " \u2014 a sub-ledger of Cash and Cash Equivalents (see Chart of Accounts)."), acctForm && /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, marginBottom: 8, fontSize: 13 } }, acctForm.mode === "add" ? "New Bank Account" : "Edit Bank Account"), /* @__PURE__ */ React.createElement("div", { className: "g4" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Account Name"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: acctForm.name, onChange: upAF("name"), placeholder: "e.g. HDFC Current A/c" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Bank Name"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: acctForm.bankName, onChange: upAF("bankName"), placeholder: "Optional" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Account No."), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: acctForm.accountNo, onChange: upAF("accountNo"), placeholder: "Optional" })), acctForm.mode === "add" && /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Opening Balance (\u20B9)"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: acctForm.openingBalance, onChange: upAF("openingBalance"), placeholder: "0.00" }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary btn-sm", onClick: submitAcct }, acctForm.mode === "add" ? "Add Account" : "Save"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", onClick: () => setAcctForm(null) }, "Cancel"))), /* @__PURE__ */ React.createElement("div", { className: "g4", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, editingOB ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, alignItems: "center" } }, /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", style: { fontSize: 14 }, value: openingBal, onChange: (e) => setOpeningBal(e.target.value), autoFocus: true }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-primary", onClick: saveOpeningBal }, /* @__PURE__ */ React.createElement(Ic, { n: "check", s: 12 }))) : /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16, cursor: "pointer" }, onClick: () => setEditingOB(true), title: "Click to edit" }, fmt(parseFloat(openingBal) || 0)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Opening Balance ", !editingOB && /* @__PURE__ */ React.createElement("span", { style: { textDecoration: "underline", cursor: "pointer" }, onClick: () => setEditingOB(true) }, "(edit)"))), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16, color: "var(--green)" } }, "+", fmt(totalIn)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Total Money In")), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16, color: "var(--red)" } }, "-", fmt(totalOut)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Total Money Out")), /* @__PURE__ */ React.createElement("div", { className: "stat-card", style: { borderLeft: "3px solid var(--primary)" } }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16, color: "var(--primary2)" } }, fmt(currentBalance)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Current Bank Balance"))), /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, marginBottom: 8, fontSize: 13 } }, "Reconciliation Check \u2014 ", activeAcct == null ? void 0 : activeAcct.name), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { width: 200 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Closing balance per bank statement (\u20B9)"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: (_a = activeAcct == null ? void 0 : activeAcct.stmtBalance) != null ? _a : "", onChange: (e) => setStmt({ stmtBalance: e.target.value }), placeholder: "From your bank statement" })), /* @__PURE__ */ React.createElement("div", { className: "field", style: { width: 160 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Statement date"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: (activeAcct == null ? void 0 : activeAcct.stmtDate) || "", onChange: (e) => setStmt({ stmtDate: e.target.value }) })), stmtDiff !== null && /* @__PURE__ */ React.createElement("div", { style: { padding: "8px 14px", borderRadius: 9, fontWeight: 700, fontSize: 13, background: Math.abs(stmtDiff) < 0.01 ? "rgba(34,197,94,.12)" : "rgba(245,158,11,.14)", color: Math.abs(stmtDiff) < 0.01 ? "var(--green)" : "var(--gold)" } }, Math.abs(stmtDiff) < 0.01 ? "\u2713 Statement agrees with your bank records" : `Difference ${fmt(Math.abs(stmtDiff))} \u2014 ${stmtDiff > 0 ? "statement is higher: a credit may be missing" : "statement is lower: a debit may be missing"}`)), /* @__PURE__ */ React.createElement("div", { className: "g4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)" } }, "Bank records as at ", fmtDate ? fmtDate(stmtDate) : stmtDate), /* @__PURE__ */ React.createElement("b", null, fmt(registerAsOf))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)" } }, "Ledger balance (books)"), /* @__PURE__ */ React.createElement("b", null, fmt(ledgerBal))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)" } }, "Not yet reconciled \u2014 money in"), /* @__PURE__ */ React.createElement("b", { style: { color: unmatchedIn.length ? "var(--gold)" : "inherit" } }, unmatchedIn.length, " \xB7 ", fmt(unmatchedIn.reduce((s, t) => s + t.amount, 0)))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)" } }, "Not yet reconciled \u2014 money out"), /* @__PURE__ */ React.createElement("b", { style: { color: unmatchedOut.length ? "var(--gold)" : "inherit" } }, unmatchedOut.length, " \xB7 ", fmt(unmatchedOut.reduce((s, t) => s + t.amount, 0))))), Math.abs(ledgerGap) > 0.01 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--gold)", marginTop: 8 } }, "The ledger differs from the bank records by ", fmt(Math.abs(ledgerGap)), " \u2014 usually a journal voucher or a bill payment (\u201CPaid From\u201D this bank) posted outside the statement. Open this ledger in Chart of Accounts to see it."), unmatchedIn.length + unmatchedOut.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--text3)", marginTop: 6 } }, "Unreconciled lines sit in the Suspense ledger until you link or post them, so nothing is lost \u2014 but they are not yet in the right account.")), /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, marginBottom: 10, fontSize: 13 } }, "Add Transaction"), /* @__PURE__ */ React.createElement("div", { className: "g4" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Date"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: form.date, onChange: (e) => setForm((p) => ({ ...p, date: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Description"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.desc, onChange: (e) => setForm((p) => ({ ...p, desc: e.target.value })), placeholder: "e.g. NEFT from ABC Corp" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Amount (\u20B9)"), /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: form.amount, onChange: (e) => setForm((p) => ({ ...p, amount: e.target.value })), placeholder: "0.00" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Type"), /* @__PURE__ */ React.createElement(SearchSelect, { value: form.type, onChange: (v) => setForm((p) => ({ ...p, type: v })), options: [{ value: "credit", label: "Credit (money in)" }, { value: "debit", label: "Debit (money out)" }] }))), /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginTop: 8, maxWidth: 260 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Transaction Ref No. / UTR"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.refNo, onChange: (e) => setForm((p) => ({ ...p, refNo: e.target.value })), placeholder: "Optional" })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: addTxn }, /* @__PURE__ */ React.createElement(Ic, { n: "plus", s: 13 }), " Add"), /* @__PURE__ */ React.createElement("input", { type: "file", ref: fileRef, accept: ".csv,.xlsx,.xls", style: { display: "none" }, onChange: importFile }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-primary", onClick: () => {
    var _a2;
    return (_a2 = fileRef.current) == null ? void 0 : _a2.click();
  } }, /* @__PURE__ */ React.createElement(Ic, { n: "upload", s: 13 }), " Import Excel/CSV")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", marginTop: 6 } }, "Import expects columns like Date, Description, Amount (or separate Debit/Credit or Withdrawal/Deposit columns) and optionally a Ref No/UTR column. Lines already imported are skipped automatically, so overlapping statements are safe.")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" } }, [["unmatched", "Unmatched", txns.filter((t) => !t.matched).length], ["matched", "Matched", txns.filter((t) => t.matched).length], ["all", "All", txns.length]].map(([k, l, n]) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: k,
      onClick: () => setFilter(k),
      style: {
        padding: "6px 14px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: filter === k ? 700 : 500,
        cursor: "pointer",
        border: `2px solid ${filter === k ? "var(--primary)" : "var(--border2)"}`,
        background: filter === k ? "var(--primary-bg)" : "transparent",
        color: filter === k ? "var(--primary2)" : "var(--text2)"
      }
    },
    l,
    " (",
    n,
    ")"
  )), /* @__PURE__ */ React.createElement("input", { className: "field-input", style: { maxWidth: 230 }, placeholder: "Search narration, ref, amount\u2026", value: search, onChange: (e) => setSearch(e.target.value) }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => setShowRules((s) => !s) }, "Rules (", rules.length, ")"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: applyRulesNow }, /* @__PURE__ */ React.createElement(Ic, { n: "check", s: 12 }), " Apply Rules"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: autoMatchAll }, /* @__PURE__ */ React.createElement(Ic, { n: "check", s: 12 }), " Smart Auto-Match")), showRules && /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, marginBottom: 6 } }, "Auto-categorisation rules"), rules.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text3)" } }, "No rules yet. When you \u201CPost to ledger\u201D, tick \u201CRemember\u201D and every future statement line with that narration posts itself.") : rules.map((r) => /* @__PURE__ */ React.createElement("div", { key: r.id, style: { display: "flex", gap: 10, alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: 12.5 } }, /* @__PURE__ */ React.createElement("span", { className: `badge ${r.type === "credit" ? "badge-green" : "badge-red"}` }, r.type === "credit" ? "Money in" : "Money out"), /* @__PURE__ */ React.createElement("span", { style: { flex: 1 } }, "narration contains ", /* @__PURE__ */ React.createElement("b", null, "\u201C", r.keyword, "\u201D"), " \u2192 ", /* @__PURE__ */ React.createElement("b", null, coaByKey(r.ledgerKey).name)), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: () => deleteRule(r.id) }, /* @__PURE__ */ React.createElement(Ic, { n: "x", s: 13 }))))), filtered.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "40px", color: "var(--text3)" } }, "No transactions here yet.") : /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Description"), /* @__PURE__ */ React.createElement("th", null, "Date"), /* @__PURE__ */ React.createElement("th", null, "Ref No / UTR"), /* @__PURE__ */ React.createElement("th", null, "Type"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Amount"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Balance"), /* @__PURE__ */ React.createElement("th", null, "Status"), /* @__PURE__ */ React.createElement("th", { style: { width: 150 } }, "Actions"))), /* @__PURE__ */ React.createElement("tbody", null, filtered.map((t) => /* @__PURE__ */ React.createElement(React.Fragment, { key: t.id }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { fontWeight: 600 } }, t.desc), /* @__PURE__ */ React.createElement("td", null, fmtDate ? fmtDate(t.date) : t.date), /* @__PURE__ */ React.createElement("td", { style: { color: "var(--text3)", fontSize: 12 } }, t.refNo || "\u2014"), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: `badge ${t.type === "credit" ? "badge-green" : "badge-red"}` }, t.type === "credit" ? "Money In" : "Money Out")), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", fontWeight: 700, color: t.type === "credit" ? "var(--green)" : "var(--red)" } }, t.type === "credit" ? "+" : "-", fmt(t.amount)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)", fontSize: 12 } }, fmt(balanceById[t.id])), /* @__PURE__ */ React.createElement("td", null, t.matched ? /* @__PURE__ */ React.createElement("span", { className: "badge badge-green" }, statusLabel(t)) : /* @__PURE__ */ React.createElement("span", { className: "badge badge-gold" }, "Unmatched")), /* @__PURE__ */ React.createElement("td", null, t.matched ? /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => unlink(t) }, "Unlink") : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: () => setMatchingId(matchingId === t.id ? null : t.id) }, "Link"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger btn-icon", onClick: () => delTxn(t.id) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 11 }))))), matchingId === t.id && !t.matched && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 8, style: { padding: 0 } }, /* @__PURE__ */ React.createElement(
    BankLinkPanel,
    {
      key: t.id,
      t,
      accounts,
      allTxns,
      onLinkDocs: linkDocs,
      onPostLedger: postLedger,
      onTransfer: linkTransfer,
      onQuickSale: createQuickSale,
      onSupplierRefund: supplierRefund,
      onClose: () => setMatchingId(null)
    }
  )))))))))));
};
const SalesPage = ({ inline = true, onClose, currentUser }) => {
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((x) => x + 1);
  const [view, setView] = useState("all");
  const [selCustomer, setSelCustomer] = useState(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [custQ, setCustQ] = useState("");
  const docLabel = (dt) => dt === "NON GST INVOICE" ? "Non-GST Invoice" : dt === "CREDIT NOTE" ? "Credit Note" : dt === "DEBIT NOTE" ? "Debit Note" : dt === "TAX INVOICE" ? "Tax Invoice" : dt || "Invoice";
  const rows = useMemo(() => {
    const invoices = S.get(SK.INV, []).filter((i) => ["TAX INVOICE", "NON GST INVOICE", "DEBIT NOTE", "CREDIT NOTE"].includes(i.docType));
    const quickSales = S.get(SK.QSALE, []);
    const invRows = invoices.map((i) => {
      var _a;
      const sign = i.docType === "CREDIT NOTE" ? -1 : 1;
      return {
        id: i.invNo,
        kind: i.docType,
        kindLabel: docLabel(i.docType),
        ref: i.invNo,
        date: i.date,
        customer: ((_a = i.billTo) == null ? void 0 : _a.name) || "Unknown",
        amount: sign * getGrand(i),
        status: i.status || "Draft",
        refNo: i.paymentRef || "",
        notes: docLabel(i.docType)
      };
    });
    const qsRows = quickSales.map((qs) => ({
      id: qs.id,
      kind: "QUICK SALE",
      kindLabel: "Quick Sale",
      ref: qs.id,
      date: qs.date,
      customer: qs.customer,
      amount: qs.amount,
      status: "Paid",
      refNo: qs.refNo || "",
      notes: qs.desc || qs.notes || "Bank credit"
    }));
    return [...invRows, ...qsRows].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [tick]);
  const filteredRows = rows.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (q && !`${r.ref} ${r.customer} ${r.notes}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const totalAmt = filteredRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const paidAmt = filteredRows.filter((r) => r.status === "Paid").reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const customerStats = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const key = (r.customer || "Unknown").trim() || "Unknown";
      if (!map[key]) map[key] = { name: key, totalSales: 0, received: 0, outstanding: 0, count: 0, lastDate: "" };
      const amt = parseFloat(r.amount) || 0;
      map[key].totalSales += amt;
      if (r.status === "Paid") map[key].received += amt;
      else map[key].outstanding += amt;
      map[key].count += 1;
      if (!map[key].lastDate || (r.date || "") > map[key].lastDate) map[key].lastDate = r.date;
    });
    return Object.values(map).sort((a, b) => b.totalSales - a.totalSales);
  }, [rows]);
  const filteredCustomers = customerStats.filter((c) => !custQ || c.name.toLowerCase().includes(custQ.toLowerCase()));
  const custRows = selCustomer ? rows.filter((r) => (r.customer || "Unknown") === selCustomer).sort((a, b) => (b.date || "").localeCompare(a.date || "")) : [];
  const custSummary = selCustomer ? customerStats.find((c) => c.name === selCustomer) : null;
  const renderTable = (rowsToShow, showCustomerCol = true) => /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Type"), /* @__PURE__ */ React.createElement("th", null, "Ref"), /* @__PURE__ */ React.createElement("th", null, "Date"), showCustomerCol && /* @__PURE__ */ React.createElement("th", null, "Customer"), /* @__PURE__ */ React.createElement("th", null, "Notes"), /* @__PURE__ */ React.createElement("th", null, "Bank Ref"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Amount"), /* @__PURE__ */ React.createElement("th", null, "Status"))), /* @__PURE__ */ React.createElement("tbody", null, rowsToShow.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: showCustomerCol ? 8 : 7, style: { textAlign: "center", padding: 24, color: "var(--text3)" } }, "No sales found.")) : rowsToShow.map((r) => /* @__PURE__ */ React.createElement("tr", { key: r.kind + r.id }, /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: `badge ${r.kind === "QUICK SALE" ? "badge-blue" : r.kind === "CREDIT NOTE" ? "badge-gold" : "badge"}` }, r.kindLabel)), /* @__PURE__ */ React.createElement("td", { style: { fontWeight: 600 } }, r.ref), /* @__PURE__ */ React.createElement("td", null, fmtDate ? fmtDate(r.date) : r.date), showCustomerCol && /* @__PURE__ */ React.createElement("td", null, r.customer), /* @__PURE__ */ React.createElement("td", { style: { color: "var(--text3)", fontSize: 12 } }, r.notes), /* @__PURE__ */ React.createElement("td", { style: { color: "var(--text3)", fontSize: 12 } }, r.refNo || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", fontWeight: 600, color: r.amount < 0 ? "var(--red)" : "inherit" } }, fmt(r.amount)), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: `badge ${r.status === "Paid" ? "badge-green" : r.status === "Overdue" ? "badge-red" : "badge-gold"}` }, r.status)))))));
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay" }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal" }, !inline && /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("span", { className: "modal-title" }, /* @__PURE__ */ React.createElement(Ic, { n: "bank", s: 18 }), " Sales"), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Ic, { n: "x" }))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, selCustomer ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", style: { marginBottom: 14 }, onClick: () => setSelCustomer(null) }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-block", transform: "rotate(180deg)" } }, /* @__PURE__ */ React.createElement(Ic, { n: "chevron", s: 11 })), " Back to Customers"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 16, marginBottom: 2 } }, selCustomer), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text3)", marginBottom: 14 } }, (custSummary == null ? void 0 : custSummary.count) || 0, " transaction", (custSummary == null ? void 0 : custSummary.count) === 1 ? "" : "s", " \xB7 last activity ", (custSummary == null ? void 0 : custSummary.lastDate) ? fmtDate ? fmtDate(custSummary.lastDate) : custSummary.lastDate : "\u2014"), /* @__PURE__ */ React.createElement("div", { className: "g3", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16 } }, fmt((custSummary == null ? void 0 : custSummary.totalSales) || 0)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Total Sales")), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16, color: "var(--green)" } }, fmt((custSummary == null ? void 0 : custSummary.received) || 0)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Received")), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16, color: "var(--red)" } }, fmt((custSummary == null ? void 0 : custSummary.outstanding) || 0)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Outstanding"))), renderTable(custRows, false)) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 16 } }, [["all", "All Sales"], ["customers", "Customers"]].map(([k, l]) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: k,
      onClick: () => setView(k),
      style: {
        padding: "6px 14px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: view === k ? 700 : 500,
        cursor: "pointer",
        border: `2px solid ${view === k ? "var(--primary)" : "var(--border2)"}`,
        background: view === k ? "var(--primary-bg)" : "transparent",
        color: view === k ? "var(--primary2)" : "var(--text2)"
      }
    },
    l
  ))), view === "all" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text3)", marginBottom: 12 } }, "Every sales invoice, credit/debit note, plus quick sales recorded directly from bank credits \u2014 in one place."), /* @__PURE__ */ React.createElement("div", { className: "g3", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16 } }, fmt(totalAmt)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Total Sales (", filteredRows.length, ")")), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16, color: "var(--green)" } }, fmt(paidAmt)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Received")), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16, color: "var(--red)" } }, fmt(totalAmt - paidAmt)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Outstanding"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("input", { className: "field-input", style: { maxWidth: 260 }, placeholder: "Search ref, customer, notes\u2026", value: q, onChange: (e) => setQ(e.target.value) }), /* @__PURE__ */ React.createElement("select", { className: "field-input", style: { maxWidth: 160 }, value: statusFilter, onChange: (e) => setStatusFilter(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "all" }, "All statuses"), /* @__PURE__ */ React.createElement("option", { value: "Paid" }, "Paid"), /* @__PURE__ */ React.createElement("option", { value: "Sent" }, "Sent"), /* @__PURE__ */ React.createElement("option", { value: "Draft" }, "Draft"), /* @__PURE__ */ React.createElement("option", { value: "Overdue" }, "Overdue")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: refresh }, /* @__PURE__ */ React.createElement(Ic, { n: "refresh", s: 13 }), " Refresh")), renderTable(filteredRows, true)) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text3)", marginBottom: 12 } }, "Click a customer to see every transaction with them \u2014 sales, receipts, outstanding, and document type."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("input", { className: "field-input", style: { maxWidth: 260 }, placeholder: "Search customer\u2026", value: custQ, onChange: (e) => setCustQ(e.target.value) }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: refresh }, /* @__PURE__ */ React.createElement(Ic, { n: "refresh", s: 13 }), " Refresh")), /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Customer"), /* @__PURE__ */ React.createElement("th", null, "# Docs"), /* @__PURE__ */ React.createElement("th", null, "Last Activity"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Total Sales"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Received"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Outstanding"))), /* @__PURE__ */ React.createElement("tbody", null, filteredCustomers.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 6, style: { textAlign: "center", padding: 24, color: "var(--text3)" } }, "No customers found.")) : filteredCustomers.map((c) => /* @__PURE__ */ React.createElement("tr", { key: c.name, style: { cursor: "pointer" }, onClick: () => setSelCustomer(c.name) }, /* @__PURE__ */ React.createElement("td", { style: { fontWeight: 600, color: "var(--primary2)" } }, c.name), /* @__PURE__ */ React.createElement("td", null, c.count), /* @__PURE__ */ React.createElement("td", null, c.lastDate ? fmtDate ? fmtDate(c.lastDate) : c.lastDate : "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", fontWeight: 600 } }, fmt(c.totalSales)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--green)" } }, fmt(c.received)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--red)" } }, fmt(c.outstanding))))))))))));
};
