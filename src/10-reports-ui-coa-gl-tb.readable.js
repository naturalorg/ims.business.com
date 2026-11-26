const RbChev = () => /* @__PURE__ */ React.createElement("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.6", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "6 9 12 15 18 9" }));
const RbFunnel = () => /* @__PURE__ */ React.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polygon", { points: "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" }));
const RbDown = () => /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" }), /* @__PURE__ */ React.createElement("polyline", { points: "7 10 12 15 17 10" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "15", x2: "12", y2: "3" }));
const useOutsideClose = (ref, onClose) => {
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
};
const DateRangePill = ({ value, from, to, onChange, allowAll = true, label = "Date Range" }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClose(ref, () => setOpen(false));
  const presets = allowAll ? DATE_PRESETS : DATE_PRESETS.filter((p) => p !== "All Time");
  const pick = (p) => {
    setOpen(false);
    if (p === "Custom") {
      const t = resolveRange("This Year");
      onChange({ preset: "Custom", from: from || t.from, to: to || t.to });
    } else onChange(resolveRange(p));
  };
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { ref, style: { position: "relative" } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "rb-pill", onClick: () => setOpen((o) => !o) }, /* @__PURE__ */ React.createElement("span", { className: "rb-k" }, label, " :"), /* @__PURE__ */ React.createElement("b", null, value), /* @__PURE__ */ React.createElement(RbChev, null)), open && /* @__PURE__ */ React.createElement("div", { className: "rb-menu" }, presets.map((p) => /* @__PURE__ */ React.createElement("div", { key: p, className: "rb-item" + (p === value ? " sel" : ""), onClick: () => pick(p) }, p)))), value === "Custom" && /* @__PURE__ */ React.createElement("div", { className: "rb-custom" }, /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: from || "", onChange: (e) => onChange({ preset: "Custom", from: e.target.value, to: to || "" }), style: { width: 150 } }), /* @__PURE__ */ React.createElement("span", null, "to"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: to || "", onChange: (e) => onChange({ preset: "Custom", from: from || "", to: e.target.value }), style: { width: 150 } })));
};
const ExportMenu = ({ onExport, label = "Export", disabled = false }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClose(ref, () => setOpen(false));
  const go = (f) => {
    setOpen(false);
    onExport(f);
  };
  return /* @__PURE__ */ React.createElement("div", { ref, style: { position: "relative", display: "inline-block" } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "rb-pill", disabled, onClick: () => setOpen((o) => !o), style: { fontWeight: 600 } }, /* @__PURE__ */ React.createElement(RbDown, null), " ", label, " ", /* @__PURE__ */ React.createElement(RbChev, null)), open && /* @__PURE__ */ React.createElement("div", { className: "rb-menu right", style: { minWidth: 190 } }, /* @__PURE__ */ React.createElement("div", { className: "rb-item", onClick: () => go("pdf") }, /* @__PURE__ */ React.createElement(Ic, { n: "pdf", s: 15 }), " PDF ", /* @__PURE__ */ React.createElement("small", null, ".pdf")), /* @__PURE__ */ React.createElement("div", { className: "rb-item", onClick: () => go("xlsx") }, /* @__PURE__ */ React.createElement(Ic, { n: "xlsx", s: 15 }), " Excel ", /* @__PURE__ */ React.createElement("small", null, ".xlsx")), /* @__PURE__ */ React.createElement("div", { className: "rb-item", onClick: () => go("csv") }, /* @__PURE__ */ React.createElement(Ic, { n: "file", s: 15 }), " CSV ", /* @__PURE__ */ React.createElement("small", null, ".csv"))));
};
const useReportRange = (initial = "All Time") => {
  const init = resolveRange(initial);
  const [draft, setDraft] = useState(init);
  const [applied, setApplied] = useState(init);
  const dirty = draft.from !== applied.from || draft.to !== applied.to || draft.preset !== applied.preset;
  return {
    draft,
    applied,
    dirty,
    setDraft,
    fetchData: () => setApplied(draft),
    reset: () => {
      setDraft(init);
      setApplied(init);
    }
  };
};
const ReportToolbar = ({ section, title, range, onExport, count = 0, canExport = true, children }) => {
  const { draft, applied, dirty, setDraft, fetchData, reset } = range;
  const [more, setMore] = useState(false);
  const [fm, setFm] = useState(false);
  const fref = useRef(null);
  useOutsideClose(fref, () => setFm(false));
  const doFetch = () => {
    if (draft.preset === "Custom" && draft.from && draft.to && draft.from > draft.to) {
      toast.error('"From" date cannot be after "To" date');
      return;
    }
    fetchData();
  };
  const doExport = (f) => {
    if (!count) {
      toast.error("No records in the selected date range to export");
      return;
    }
    onExport(f, applied);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "rb-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "rb-head" }, /* @__PURE__ */ React.createElement("div", null, section && /* @__PURE__ */ React.createElement("div", { className: "rb-crumb" }, section), /* @__PURE__ */ React.createElement("div", { className: "rb-title" }, /* @__PURE__ */ React.createElement("span", null, title), /* @__PURE__ */ React.createElement("span", { className: "rb-dot" }), /* @__PURE__ */ React.createElement("span", { className: "rb-period" }, rangeLabel(applied)), /* @__PURE__ */ React.createElement("span", { className: "rb-count" }, count, " record", count === 1 ? "" : "s"))), /* @__PURE__ */ React.createElement("div", { className: "rb-actions" }, canExport && /* @__PURE__ */ React.createElement(ExportMenu, { onExport: doExport }))), /* @__PURE__ */ React.createElement("div", { className: "rb-filters" }, /* @__PURE__ */ React.createElement("span", { className: "rb-flabel" }, /* @__PURE__ */ React.createElement(RbFunnel, null), " Filters :"), /* @__PURE__ */ React.createElement(DateRangePill, { value: draft.preset, from: draft.from, to: draft.to, onChange: setDraft }), children && /* @__PURE__ */ React.createElement("button", { type: "button", className: "rb-pill", onClick: () => setMore((m) => !m) }, /* @__PURE__ */ React.createElement("b", { style: { color: "var(--primary2)" } }, "\uFF0B"), " More Filters"), /* @__PURE__ */ React.createElement("div", { ref: fref, className: "rb-fetch" + (dirty ? " dirty" : ""), style: { position: "relative" } }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: doFetch, title: "Apply the selected date range" }, "Fetch Data"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "caret", onClick: () => setFm((o) => !o) }, /* @__PURE__ */ React.createElement(RbChev, null)), fm && /* @__PURE__ */ React.createElement("div", { className: "rb-menu", style: { minWidth: 190 } }, /* @__PURE__ */ React.createElement("div", { className: "rb-item", onClick: () => {
    setFm(false);
    doFetch();
  } }, "Fetch Data"), /* @__PURE__ */ React.createElement("div", { className: "rb-item", onClick: () => {
    setFm(false);
    reset();
  } }, "Reset to All Dates"))), dirty && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--gold)", fontWeight: 600 } }, "Range changed \u2014 click Fetch Data to apply")), children && more && /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" } }, children));
};
const ExportBar = ({ onExport, from, to, onFromChange, onToChange, showDateFilter = false, label = "Export" }) => {
  const [preset, setPreset] = useState("Custom");
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" } }, showDateFilter && /* @__PURE__ */ React.createElement(
    DateRangePill,
    {
      value: preset,
      from,
      to,
      allowAll: false,
      onChange: (o) => {
        setPreset(o.preset);
        onFromChange(o.from);
        onToChange(o.to);
      }
    }
  ), /* @__PURE__ */ React.createElement(ExportMenu, { label, onExport }));
};
const computeLedgerData = (account, fromDate, toDate, allLines, withChildren = false) => {
  const source = allLines || getAllLedgerLines();
  const keys = withChildren ? [account, ...descendantKeys(account)] : [account];
  const all = source.filter((l) => keys.includes(l.account)).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const before = all.filter((l) => (l.date || "") < fromDate);
  const inRange = all.filter((l) => (l.date || "") >= fromDate && (l.date || "") <= toDate);
  const acc = coaByKey(account);
  const natural = acc.type === "asset" || acc.type === "expense" ? 1 : -1;
  let bal = before.reduce((s, l) => s + natural * (l.debit - l.credit), 0);
  const opening = bal;
  const rows = inRange.map((l) => {
    bal += natural * (l.debit - l.credit);
    return { ...l, running: bal };
  });
  return { opening, rows, closing: bal };
};
const useLedgerData = (account, fromDate, toDate, withChildren = false) => useMemo(() => computeLedgerData(account, fromDate, toDate, null, withChildren), [account, fromDate, toDate, withChildren]);
const LEDGER_COLS = ["Date", "Chart of Accounts", "Voucher No.", "Txn Ref No.", "Type", "Invoice / Bill No.", "Category", "Narration", "Debit", "Credit", "Balance"];
const LedgerHeadRow = () => /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Date"), /* @__PURE__ */ React.createElement("th", null, "Chart of Accounts"), /* @__PURE__ */ React.createElement("th", null, "Voucher No."), /* @__PURE__ */ React.createElement("th", null, "Txn Ref No."), /* @__PURE__ */ React.createElement("th", null, "Type"), /* @__PURE__ */ React.createElement("th", null, "Invoice / Bill No."), /* @__PURE__ */ React.createElement("th", null, "Category"), /* @__PURE__ */ React.createElement("th", null, "Narration"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Debit"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Credit"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Balance"));
const LedgerBodyRow = ({ r }) => /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", null, fmtDate(r.date)), /* @__PURE__ */ React.createElement("td", null, coaByKey(r.account).name), /* @__PURE__ */ React.createElement("td", { style: { fontFamily: "monospace", fontSize: 11.5, color: "var(--text3)" } }, r.voucherNo || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { fontFamily: "monospace", fontSize: 11.5, color: "var(--text3)" } }, r.txnRefNo || "\u2014"), /* @__PURE__ */ React.createElement("td", null, r.docType || "Journal"), /* @__PURE__ */ React.createElement("td", { style: { fontFamily: "monospace", fontSize: 11.5 } }, r.docNo || "\u2014"), /* @__PURE__ */ React.createElement("td", null, r.category || "\u2014"), /* @__PURE__ */ React.createElement("td", null, r.narration), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, r.debit ? fmtN(r.debit) : ""), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, r.credit ? fmtN(r.credit) : ""), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", fontWeight: 600 } }, fmtN(r.running)));
const ledgerExportRow = (r) => [fmtDate(r.date), coaByKey(r.account).name, r.voucherNo || "", r.txnRefNo || "", r.docType || "Journal", r.docNo || "", r.category || "", r.narration, r.debit ? fmtN(r.debit) : "", r.credit ? fmtN(r.credit) : "", fmtN(r.running)];
const LedgerTable = ({ account, fromDate, toDate, withChildren = false }) => {
  const { opening, rows, closing } = useLedgerData(account, fromDate, toDate, withChildren);
  const accName = coaByKey(account).name;
  const doExport = (fmt2) => {
    const headers = LEDGER_COLS;
    const body = [["", accName, "", "", "", "", "", "Opening Balance", "", "", fmtN(opening)], ...rows.map(ledgerExportRow)];
    exportTableAs(fmt2, `Ledger_${accName.replace(/\s+/g, "_")}_${fromDate}_to_${toDate}`, `${accName} \u2014 Ledger (${fmtDate(fromDate)} to ${fmtDate(toDate)})`, headers, body);
  };
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-end", flexWrap: "wrap", gap: 20, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "g3", style: { flex: 1, minWidth: 280 } }, /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16 } }, fmt(opening)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Opening Balance")), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16 } }, rows.length), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Postings in Range")), /* @__PURE__ */ React.createElement("div", { className: "stat-card", style: { borderLeft: "3px solid var(--primary)" } }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16 } }, fmt(closing)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Closing Balance")))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement(ExportBar, { onExport: doExport, label: "Export Ledger" })), /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement(LedgerHeadRow, null)), /* @__PURE__ */ React.createElement("tbody", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("td", { colSpan: 8, style: { fontStyle: "italic" } }, "Opening Balance"), /* @__PURE__ */ React.createElement("td", null), /* @__PURE__ */ React.createElement("td", null), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", fontWeight: 700 } }, fmt(opening))), rows.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 11, style: { color: "var(--text3)", textAlign: "center" } }, "No postings in this range")) : rows.map((r, i) => /* @__PURE__ */ React.createElement(LedgerBodyRow, { key: i, r }))))));
};
const Breadcrumb = ({ items }) => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 14, fontSize: 12.5 } }, items.map((it, i) => /* @__PURE__ */ React.createElement(React.Fragment, { key: i }, i > 0 && /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text3)" } }, "\u203A"), it.onClick ? /* @__PURE__ */ React.createElement("span", { onClick: it.onClick, style: { color: "var(--primary2)", cursor: "pointer", fontWeight: i === items.length - 1 ? 700 : 500 } }, it.label) : /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700 } }, it.label))));
const SearchSelect = ({ value, onChange, options = [], placeholder = "Select\u2026", style, disabled = false, onCreate, emptyText = "No matches", minPopWidth = 280, clearable = false }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null), popRef = useRef(null), listRef = useRef(null), inpRef = useRef(null);
  const sel = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const toks = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!toks.length) return options;
    return options.filter((o) => {
      const hay = `${o.label} ${o.sub || ""} ${o.keywords || ""} ${o.group || ""}`.toLowerCase();
      return toks.every((t) => hay.includes(t));
    });
  }, [q, options]);
  const canCreate = !!onCreate && q.trim().length > 0 && !options.some((o) => String(o.label).toLowerCase() === q.trim().toLowerCase());
  const total = filtered.length + (canCreate ? 1 : 0);
  const firstEnabled = (list) => {
    const i = list.findIndex((o) => !o.disabled);
    return i < 0 ? 0 : i;
  };
  const place = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const below = window.innerHeight - r.bottom, above = r.top;
    const up = below < 260 && above > below;
    const width = Math.max(r.width, minPopWidth);
    setPos({
      left: Math.max(8, Math.min(r.left, window.innerWidth - width - 8)),
      width,
      top: up ? void 0 : r.bottom + 4,
      bottom: up ? window.innerHeight - r.top + 4 : void 0,
      maxH: Math.max(170, Math.min(360, (up ? above : below) - 16))
    });
  };
  const openPop = (initial = "") => {
    if (disabled) return;
    place();
    setQ(initial);
    setOpen(true);
  };
  useEffect(() => {
    setHi(firstEnabled(filtered));
  }, [q, open]);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      var _a, _b;
      if (((_a = btnRef.current) == null ? void 0 : _a.contains(e.target)) || ((_b = popRef.current) == null ? void 0 : _b.contains(e.target))) return;
      setOpen(false);
    };
    const onWin = (e) => {
      if (e && e.target && popRef.current && popRef.current.contains(e.target)) return;
      place();
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    const tm = setTimeout(() => inpRef.current && inpRef.current.focus(), 0);
    return () => {
      clearTimeout(tm);
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
  }, [open]);
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector('[data-i="' + hi + '"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  }, [hi, open]);
  const pick = (o) => {
    if (!o || o.disabled) return;
    onChange(o.value);
    setOpen(false);
  };
  const doCreate = () => {
    const t = q.trim();
    setOpen(false);
    if (t && onCreate) onCreate(t);
  };
  const move = (dir) => {
    if (!total) return;
    let i = hi;
    for (let n = 0; n < total; n++) {
      i = (i + dir + total) % total;
      if (i >= filtered.length || !filtered[i].disabled) break;
    }
    setHi(i);
  };
  const onInpKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (hi < filtered.length) pick(filtered[hi]);
      else if (canCreate) doCreate();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      btnRef.current && btnRef.current.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };
  const onBtnKey = (e) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      openPop();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      openPop(e.key);
    }
  };
  let lastGroup = null;
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "div",
    {
      ref: btnRef,
      tabIndex: disabled ? -1 : 0,
      className: "field-input ss-btn",
      style: { ...style || {}, opacity: disabled ? 0.6 : 1 },
      onClick: () => open ? setOpen(false) : openPop(),
      onKeyDown: onBtnKey
    },
    /* @__PURE__ */ React.createElement("span", { className: "ss-val" + (sel ? "" : " ss-ph") }, sel ? sel.label : value ? String(value) : placeholder),
    clearable && sel && value !== "" && !disabled && /* @__PURE__ */ React.createElement("span", { title: "Clear", style: { color: "var(--text3)", padding: "0 2px" }, onClick: (e) => {
      e.stopPropagation();
      onChange("");
    } }, "\xD7"),
    /* @__PURE__ */ React.createElement("svg", { width: "11", height: "11", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.6", strokeLinecap: "round", strokeLinejoin: "round", style: { flexShrink: 0, opacity: 0.6 } }, /* @__PURE__ */ React.createElement("polyline", { points: "6 9 12 15 18 9" }))
  ), open && pos && ReactDOM.createPortal(
    /* @__PURE__ */ React.createElement("div", { ref: popRef, className: "ss-pop", style: { left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxH } }, /* @__PURE__ */ React.createElement("div", { className: "ss-search" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        ref: inpRef,
        className: "field-input",
        style: { padding: "7px 10px", fontSize: 12.5 },
        value: q,
        onChange: (e) => setQ(e.target.value),
        onKeyDown: onInpKey,
        placeholder: onCreate ? "Type to search, or type a new name to add\u2026" : "Type to search\u2026"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "ss-list", ref: listRef }, filtered.length === 0 && !canCreate && /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 12px", fontSize: 12, color: "var(--text3)" } }, emptyText), filtered.map((o, i) => {
      const hdr = o.group && o.group !== lastGroup ? /* @__PURE__ */ React.createElement("div", { key: "g" + i, className: "ss-grp" }, o.group) : null;
      lastGroup = o.group || lastGroup;
      return /* @__PURE__ */ React.createElement(React.Fragment, { key: String(o.value) + "_" + i }, hdr, /* @__PURE__ */ React.createElement(
        "div",
        {
          "data-i": i,
          className: "ss-opt" + (i === hi ? " hi" : "") + (o.value === value ? " sel" : "") + (o.disabled ? " dis" : ""),
          style: { paddingLeft: 12 + (o.indent || 0) * 16 },
          onMouseEnter: () => !o.disabled && setHi(i),
          onClick: () => pick(o)
        },
        /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "ss-lbl" }, o.indent > 0 ? "\u2514 " : "", o.label), o.sub && /* @__PURE__ */ React.createElement("div", { className: "ss-sub" }, o.sub)),
        o.badge && /* @__PURE__ */ React.createElement("span", { className: "ss-badge" }, o.badge)
      ));
    }), canCreate && /* @__PURE__ */ React.createElement("div", { "data-i": filtered.length, className: "ss-opt ss-create" + (hi === filtered.length ? " hi" : ""), onMouseEnter: () => setHi(filtered.length), onClick: doCreate }, "+ Create \u201C", q.trim(), "\u201D"))),
    document.body
  ));
};
const simpleOptions = (list) => list.map((x) => typeof x === "object" ? x : { value: x, label: String(x) });
const ACCOUNT_TYPE_GROUPS = [["asset", "Assets"], ["liability", "Liabilities"], ["equity", "Equity"], ["income", "Income"], ["expense", "Expenses"]];
const accountTree = (all = getAllAccounts()) => {
  const keys = new Set(all.map((a) => a.key));
  const byParent = {};
  all.forEach((a) => {
    const p = a.parent && keys.has(a.parent) && a.parent !== a.key ? a.parent : "";
    (byParent[p] = byParent[p] || []).push(a);
  });
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const walk = (p, depth) => (byParent[p] || []).forEach((a) => {
    if (seen.has(a.key)) return;
    seen.add(a.key);
    out.push({ acc: a, depth });
    walk(a.key, depth + 1);
  });
  walk("", 0);
  return out;
};
const descendantKeys = (key, all = getAllAccounts()) => {
  const out = [];
  const st = [key];
  while (st.length) {
    const k = st.pop();
    all.forEach((c) => {
      if (c.parent === k && !out.includes(c.key)) {
        out.push(c.key);
        st.push(c.key);
      }
    });
  }
  return out;
};
const ledgerPathName = (key) => {
  const all = getAllAccounts();
  const a = all.find((x) => x.key === key);
  if (!a) return key;
  const p = a.parent ? all.find((x) => x.key === a.parent) : null;
  return p ? `${p.name} \u203A ${a.name}` : a.name;
};
const buildAccountOptions = (types, { forParent = false, excludeKeys = [], onlyPostableBanks = false } = {}) => {
  const all = getAllAccounts();
  const tree = accountTree(all);
  const order = types && types.length ? types : ACCOUNT_TYPE_GROUPS.map((g) => g[0]);
  const out = [];
  order.forEach((t) => {
    const label = (ACCOUNT_TYPE_GROUPS.find((g) => g[0] === t) || [t, t])[1];
    tree.filter((n) => n.acc.type === t && !excludeKeys.includes(n.acc.key) && !(forParent && (n.acc.computed || n.acc.derived))).forEach(({ acc, depth }) => {
      const parent = acc.parent ? all.find((x) => x.key === acc.parent) : null;
      out.push({
        value: acc.key,
        label: acc.name,
        group: label,
        indent: depth,
        disabled: !forParent && !!acc.groupOnly,
        sub: acc.groupOnly && !forParent ? "Parent \u2014 choose a specific bank / cash ledger below" : parent ? `Sub-ledger of ${parent.name}` : acc.scheduleGroup,
        badge: acc.derived ? "bank a/c" : acc.custom ? "custom" : "",
        keywords: `${acc.scheduleGroup || ""} ${parent ? parent.name : ""} ${label}`
      });
    });
  });
  return out;
};
const AccountSelect = ({ value, onChange, style, types, createType, createParent, placeholder = "Select account\u2026", forParent = false, excludeKeys, clearable = false }) => {
  const [, setTick] = useState(0);
  const options = buildAccountOptions(types, { forParent, excludeKeys: excludeKeys || [] });
  const create = createType ? (name) => {
    const key = createLedgerAccount({ name, type: createType, parent: createParent || "" });
    toast.success(`Ledger "${name}" created`);
    setTick((x) => x + 1);
    onChange(key);
  } : void 0;
  return /* @__PURE__ */ React.createElement(SearchSelect, { value, onChange, options, style, placeholder, onCreate: create, clearable });
};
const blankNewLedger = () => ({ name: "", type: "expense", group: GROUP_OPTIONS.expense[0], scheduleGroup: SCHEDULE_CAPTIONS.expense[0], customCaption: false, customCaptionText: "", parent: "" });
const ChartOfAccountsPage = ({ inline = true, isAdmin, currentUser }) => {
  const [map, setMap] = useState(S.get(SK.ACCMAP, {}));
  const [tick, setTick] = useState(0);
  const [adding, setAdding] = useState(false);
  const [editKey, setEditKey] = useState(null);
  const [nl, setNl] = useState(blankNewLedger());
  const [drillAccount, setDrillAccount] = useState(null);
  const [q, setQ] = useState("");
  const refresh = () => setTick((x) => x + 1);
  const allAccs = useMemo(() => getAllAccounts(), [tick]);
  const tree = useMemo(() => accountTree(allAccs), [allAccs]);
  const tbMap = useMemo(() => {
    const m = {};
    getTrialBalance("9999-12-31").forEach((r) => {
      m[r.account] = r.balance;
    });
    return m;
  }, [tick]);
  const naturalBal = (a) => {
    const b = tbMap[a.key] || 0;
    return a.type === "asset" || a.type === "expense" ? b : -b;
  };
  const rollupBal = (a) => [a.key, ...descendantKeys(a.key, allAccs)].reduce((s, k) => {
    const x = allAccs.find((z) => z.key === k);
    return s + (x ? naturalBal(x) : 0);
  }, 0);
  const suspense = +((tbMap.SUSPENSE_OUT || 0) + -(tbMap.SUSPENSE_IN || 0)).toFixed(2);
  const suspenseCount = S.get(SK.BANK, []).filter((t) => !t.matched).length;
  const cats = useMemo(() => {
    const m = {};
    S.get(SK.EXP, []).forEach((e) => {
      if (e.category) {
        const k = e.category;
        if (!m[k]) m[k] = { name: k, count: 0, total: 0 };
        m[k].count++;
        m[k].total += parseFloat(e.total) || 0;
      }
    });
    return Object.values(m).sort((a, b) => a.name.localeCompare(b.name));
  }, [tick]);
  const updateMap = (cat, accKey) => {
    setExpenseAccountMap(cat, accKey);
    setMap(S.get(SK.ACCMAP, {}));
    logAudit("EXPENSE_ACCOUNT_MAPPING_UPDATED", `"${cat}" \u2192 ${coaByKey(accKey).name}`, currentUser);
    toast.success(`"${cat}" now posts to ${coaByKey(accKey).name}`);
  };
  const applyToBills = (cat) => {
    const key = map[cat.toLowerCase().trim()] || guessExpenseAccount(cat);
    const canEditFrozen = isSuperAdmin(currentUser == null ? void 0 : currentUser.email);
    let changed = 0, skipped = 0;
    const updated = S.get(SK.EXP, []).map((e) => {
      if (e.category !== cat || e.expenseAccountKey === key) return e;
      if (!canEditFrozen && isExpenseFrozen(e)) {
        skipped++;
        return e;
      }
      changed++;
      return { ...e, expenseAccountKey: key };
    });
    if (!changed) {
      toast.info(skipped ? `${skipped} bill(s) are in frozen periods and were left as they are.` : "All bills in this category already post to that ledger.");
      return;
    }
    if (!window.confirm(`Re-point ${changed} bill(s) in "${cat}" to ${coaByKey(key).name}? Their journal entries will move to that ledger.`)) return;
    S.set(SK.EXP, updated);
    logAudit("EXPENSE_ACCOUNT_MAPPING_APPLIED", `"${cat}" \u2192 ${coaByKey(key).name} on ${changed} bill(s)`, currentUser);
    toast.success(`${changed} bill(s) now post to ${coaByKey(key).name}${skipped ? ` \xB7 ${skipped} frozen bill(s) skipped` : ""}`);
    refresh();
  };
  const autoMapByName = () => {
    const exp = allAccs.filter((a) => a.type === "expense");
    let n = 0;
    const cur = { ...S.get(SK.ACCMAP, {}) };
    cats.forEach((c) => {
      const k = c.name.toLowerCase().trim();
      if (cur[k]) return;
      const hit = exp.find((a) => a.name.toLowerCase().trim() === k) || exp.find((a) => a.name.toLowerCase().includes(k) || k.includes(a.name.toLowerCase()));
      if (hit) {
        cur[k] = hit.key;
        n++;
      }
    });
    if (!n) {
      toast.info("Nothing left to map by name \u2014 map the rest from the list below.");
      return;
    }
    S.set(SK.ACCMAP, cur);
    setMap(cur);
    logAudit("EXPENSE_ACCOUNT_MAPPING_UPDATED", `Auto-mapped ${n} categories by name`, currentUser);
    toast.success(`Mapped ${n} categor${n === 1 ? "y" : "ies"} to the ledger with the same name`);
  };
  const parentAcc = nl.parent ? allAccs.find((a) => a.key === nl.parent) : null;
  const upNl = (k, v) => setNl((p) => {
    const next = { ...p, [k]: v };
    if (k === "type") {
      next.group = GROUP_OPTIONS[v][0];
      next.scheduleGroup = SCHEDULE_CAPTIONS[v][0];
      next.customCaption = false;
      next.parent = "";
    }
    return next;
  });
  const pickParent = (key) => {
    const par = allAccs.find((a) => a.key === key);
    if (!par) {
      setNl((p) => ({ ...p, parent: "" }));
      return;
    }
    setNl((p) => ({ ...p, parent: key, type: par.type, group: par.group, scheduleGroup: par.scheduleGroup, customCaption: false }));
  };
  const startAdd = (parentKey = "") => {
    const base = blankNewLedger();
    setEditKey(null);
    setNl(base);
    setAdding(true);
    if (parentKey) {
      const par = allAccs.find((a) => a.key === parentKey);
      if (par) setNl({ ...base, parent: parentKey, type: par.type, group: par.group, scheduleGroup: par.scheduleGroup });
    }
    setTimeout(() => window.scrollTo && window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };
  const startEdit = (a) => {
    setAdding(true);
    setEditKey(a.key);
    setNl({ name: a.name, type: a.type, group: a.group, scheduleGroup: a.scheduleGroup, customCaption: false, customCaptionText: "", parent: a.parent || "" });
  };
  const cancelForm = () => {
    setNl(blankNewLedger());
    setAdding(false);
    setEditKey(null);
  };
  const saveLedger = () => {
    if (!nl.name.trim()) {
      toast.error("Give the ledger a name");
      return;
    }
    const dup = allAccs.find((a) => a.key !== editKey && a.name.trim().toLowerCase() === nl.name.trim().toLowerCase());
    if (dup) {
      toast.error(`A ledger called "${dup.name}" already exists`);
      return;
    }
    const scheduleGroup = nl.customCaption ? nl.customCaptionText.trim() || nl.name.trim() : nl.scheduleGroup;
    if (editKey) {
      if (nl.parent) {
        if (nl.parent === editKey || descendantKeys(editKey, allAccs).includes(nl.parent)) {
          toast.error("A ledger cannot sit under itself or its own sub-ledgers");
          return;
        }
      }
      const patch = { name: nl.name.trim(), scheduleGroup };
      if (nl.parent) {
        patch.parent = nl.parent;
        patch.group = parentAcc.group;
        patch.scheduleGroup = parentAcc.scheduleGroup;
      } else {
        patch.parent = "";
        patch.group = nl.group;
      }
      updateLedgerAccount(editKey, patch);
      S.set(SK.EXP, S.get(SK.EXP, []).map((e) => e.expenseAccountKey === editKey ? { ...e, category: nl.name.trim() } : e));
      logAudit("LEDGER_EDITED", `${nl.name}${nl.parent ? " (under " + parentAcc.name + ")" : ""}`, currentUser);
      toast.success("Ledger updated");
    } else {
      createLedgerAccount({ name: nl.name, type: nl.type, group: nl.group, scheduleGroup, parent: nl.parent });
      logAudit("LEDGER_CREATED", `${nl.name} (${nl.type})${nl.parent ? " under " + parentAcc.name : ' under "' + scheduleGroup + '"'}`, currentUser);
      toast.success(`Ledger "${nl.name}" created \u2014 it's now available in every account picker`);
    }
    cancelForm();
    refresh();
  };
  const removeLedger = (key, name) => {
    if (!isAdmin) {
      toast.error("Only Admin can delete ledger accounts");
      return;
    }
    if (!window.confirm(`Delete the "${name}" ledger?`)) return;
    const r = deleteLedgerAccount(key);
    if (!r.ok) {
      toast.error(r.reason);
      return;
    }
    logAudit("LEDGER_DELETED", `${name}`, currentUser);
    toast.info("Ledger deleted");
    refresh();
  };
  const doExportCOA = (fmtType) => {
    const headers = ["Type", "Ledger Account", "Parent Ledger", "Statement Caption", "Closing Balance (incl. sub-ledgers)", "Custom?"];
    const rows = tree.map(({ acc }) => [acc.type, acc.name, acc.parent ? (allAccs.find((x) => x.key === acc.parent) || {}).name || "" : "", acc.scheduleGroup || "", fmtN(rollupBal(acc)), acc.custom ? "Yes" : "No"]);
    exportTableAs(fmtType, `ChartOfAccounts_${today()}`, "Chart of Accounts", headers, rows);
  };
  if (drillAccount) {
    const hasKids = allAccs.some((a) => a.parent === drillAccount);
    return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay" }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal" }, /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement(Breadcrumb, { items: [{ label: "Chart of Accounts", onClick: () => setDrillAccount(null) }, ...coaByKey(drillAccount).parent ? [{ label: coaByKey(coaByKey(drillAccount).parent).name, onClick: () => setDrillAccount(coaByKey(drillAccount).parent) }] : [], { label: coaByKey(drillAccount).name }] }), hasKids && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text3)", marginBottom: 10 } }, "Showing this ledger together with all its sub-ledgers \u2014 the \u201CChart of Accounts\u201D column on each line tells you which sub-ledger it was posted to."), /* @__PURE__ */ React.createElement(LedgerTable, { account: drillAccount, fromDate: `${getFY() - 5}-04-01`, toDate: today(), withChildren: true }))));
  }
  const ql = q.trim().toLowerCase();
  const visibleKeys = (() => {
    if (!ql) return null;
    const set = /* @__PURE__ */ new Set();
    allAccs.forEach((a) => {
      if (`${a.name} ${a.scheduleGroup || ""} ${a.type}`.toLowerCase().includes(ql)) {
        let cur = a;
        let guard = 0;
        while (cur && guard++ < 10) {
          set.add(cur.key);
          cur = cur.parent ? allAccs.find((x) => x.key === cur.parent) : null;
        }
      }
    });
    return set;
  })();
  const mappableOptions = buildAccountOptions(["expense", "asset", "liability", "equity", "income"]);
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay" }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal" }, /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { className: "alert", style: { background: "rgba(79,111,232,0.06)", border: "1px solid rgba(79,111,232,0.2)", marginBottom: 16, borderRadius: 10, fontSize: 12 } }, "Ledgers are arranged ", /* @__PURE__ */ React.createElement("b", null, "parent \u2192 sub-ledger"), ". Every bank account you add in Bank Reconciliation automatically appears under ", /* @__PURE__ */ React.createElement("b", null, "Cash and Cash Equivalents"), " as its own ledger, and you can add more sub-ledgers (a petty-cash box, a wallet, \u201CTravel \u203A Fuel\u201D\u2026) with ", /* @__PURE__ */ React.createElement("b", null, "+ Sub"), ". Click any ledger to see every transaction posted to it \u2014 a parent shows its sub-ledgers\u2019 transactions too."), Math.abs(suspense) > 0.01 && /* @__PURE__ */ React.createElement("div", { className: "alert", style: { background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.35)", marginBottom: 16, borderRadius: 10, fontSize: 12 } }, /* @__PURE__ */ React.createElement("b", null, fmt(Math.abs(suspense))), " is sitting in the Suspense ledgers because ", suspenseCount, " bank line(s) are not yet reconciled. Open ", /* @__PURE__ */ React.createElement("b", null, "Bank Reconciliation"), " and link or post them so they land in the right ledger."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 12 } }, !adding && /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => startAdd() }, "+ New Ledger Account"), /* @__PURE__ */ React.createElement("input", { className: "field-input", style: { maxWidth: 260 }, placeholder: "Search ledgers\u2026", value: q, onChange: (e) => setQ(e.target.value) }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), /* @__PURE__ */ React.createElement(ExportBar, { onExport: doExportCOA, label: "Export Chart of Accounts" })), adding && /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 16, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13.5, marginBottom: 10 } }, editKey ? "Edit Ledger" : parentAcc ? `New sub-ledger under ${parentAcc.name}` : "New Ledger Account"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { flex: 1, minWidth: 200 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Ledger Name"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: nl.name, onChange: (e) => upNl("name", e.target.value), placeholder: "e.g. Printing & Stationery" })), /* @__PURE__ */ React.createElement("div", { className: "field", style: { minWidth: 240 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Parent Ledger (optional \u2014 makes this a sub-ledger)"), /* @__PURE__ */ React.createElement(
    SearchSelect,
    {
      value: nl.parent,
      onChange: pickParent,
      clearable: true,
      placeholder: "None \u2014 top-level ledger",
      options: buildAccountOptions(editKey ? [nl.type] : null, { forParent: true, excludeKeys: editKey ? [editKey, ...descendantKeys(editKey, allAccs)] : [] })
    }
  ))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Type"), /* @__PURE__ */ React.createElement(
    SearchSelect,
    {
      value: nl.type,
      onChange: (v) => upNl("type", v),
      disabled: !!parentAcc || !!editKey,
      options: [{ value: "asset", label: "Asset" }, { value: "liability", label: "Liability" }, { value: "equity", label: "Equity" }, { value: "income", label: "Income" }, { value: "expense", label: "Expense" }]
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Group"), /* @__PURE__ */ React.createElement(SearchSelect, { value: nl.group, onChange: (v) => setNl((p) => ({ ...p, group: v })), disabled: !!parentAcc, options: simpleOptions(GROUP_OPTIONS[nl.type]) })), /* @__PURE__ */ React.createElement("div", { className: "field", style: { minWidth: 230 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Statement Caption"), parentAcc ? /* @__PURE__ */ React.createElement("div", { className: "field-input", style: { opacity: 0.7 } }, parentAcc.scheduleGroup, " (from parent)") : !nl.customCaption ? /* @__PURE__ */ React.createElement(
    SearchSelect,
    {
      value: nl.scheduleGroup,
      onChange: (v) => v === "__new__" ? setNl((p) => ({ ...p, customCaption: true })) : setNl((p) => ({ ...p, scheduleGroup: v })),
      options: [...simpleOptions(SCHEDULE_CAPTIONS[nl.type]), { value: "__new__", label: "+ New caption\u2026" }]
    }
  ) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: nl.customCaptionText, onChange: (e) => setNl((p) => ({ ...p, customCaptionText: e.target.value })), placeholder: "New caption name" }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: () => setNl((p) => ({ ...p, customCaption: false })) }, "Use existing")))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--text3)", marginBottom: 10 } }, parentAcc ? "A sub-ledger takes its type, group and statement caption from its parent, so it rolls up into the parent on the Financial Statements." : "Ledgers sharing the same Statement Caption are grouped together on the Financial Statements \u2014 click the caption there to see the individual ledgers."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: saveLedger }, editKey ? "Save Changes" : "Create Ledger"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: cancelForm }, "Cancel"))), ACCOUNT_TYPE_GROUPS.map(([t, label]) => {
    const rows = tree.filter((n) => n.acc.type === t && (!visibleKeys || visibleKeys.has(n.acc.key)));
    if (!rows.length) return null;
    return /* @__PURE__ */ React.createElement("div", { key: t, className: "dt-wrap", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, label), /* @__PURE__ */ React.createElement("th", null, "Statement Caption"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Balance"), /* @__PURE__ */ React.createElement("th", { style: { width: 150 } }))), /* @__PURE__ */ React.createElement("tbody", null, rows.map(({ acc: a, depth }) => {
      const kids = allAccs.some((x) => x.parent === a.key);
      const bal = kids ? rollupBal(a) : naturalBal(a);
      return /* @__PURE__ */ React.createElement("tr", { key: a.key }, /* @__PURE__ */ React.createElement("td", { style: { paddingLeft: 12 + depth * 22 } }, /* @__PURE__ */ React.createElement("span", { style: { cursor: "pointer", color: "var(--primary2)", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: "3px", fontWeight: kids ? 700 : 500 }, onClick: () => setDrillAccount(a.key) }, depth > 0 ? "\u2514 " : "", a.name), a.custom && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "var(--gold)", marginLeft: 6 } }, "custom"), a.derived && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "var(--primary2)", marginLeft: 6 } }, "bank account \xB7 auto"), a.groupOnly && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "var(--text3)", marginLeft: 6 } }, "parent \u2014 post to a sub-ledger")), /* @__PURE__ */ React.createElement("td", { style: { color: "var(--text3)", fontSize: 11.5 } }, a.scheduleGroup), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", fontWeight: kids ? 700 : 500 } }, Math.abs(bal) < 5e-3 ? "\u2014" : fmt(bal), kids && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9.5, color: "var(--text3)", marginLeft: 4 } }, "incl. sub")), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", whiteSpace: "nowrap" } }, !a.derived && !a.computed && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", style: { padding: "2px 8px", fontSize: 11, marginRight: 4 }, onClick: () => startAdd(a.key) }, "+ Sub"), a.custom && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", style: { padding: "2px 8px", fontSize: 11, marginRight: 4 }, onClick: () => startEdit(a) }, "Edit"), a.custom && /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: () => removeLedger(a.key, a.name) }, /* @__PURE__ */ React.createElement(Ic, { n: "x", s: 13 }))));
    }))));
  }), visibleKeys && visibleKeys.size === 0 && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", color: "var(--text3)", padding: 20 } }, "No ledger matches \u201C", q, "\u201D."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, margin: "22px 0 8px", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13.5 } }, "Purchase / Expense Category \u2192 Ledger mapping"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline-primary", onClick: autoMapByName }, "Auto-map by name")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--text3)", marginBottom: 8 } }, "A bill saved with an Expense Head always posts to that head. This mapping decides where free-typed or older categories post \u2014 use ", /* @__PURE__ */ React.createElement("b", null, "Apply to bills"), " to re-point bills already saved."), /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Category (as typed on bills)"), /* @__PURE__ */ React.createElement("th", null, "Bills"), /* @__PURE__ */ React.createElement("th", { style: { minWidth: 280 } }, "Posts to Ledger Account"), /* @__PURE__ */ React.createElement("th", { style: { width: 130 } }))), /* @__PURE__ */ React.createElement("tbody", null, cats.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 4, style: { color: "var(--text3)", textAlign: "center" } }, "No categorised purchase bills yet")) : cats.map((c) => {
    const mapped = !!map[c.name.toLowerCase().trim()];
    return /* @__PURE__ */ React.createElement("tr", { key: c.name }, /* @__PURE__ */ React.createElement("td", null, c.name, !mapped && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "var(--gold)", marginLeft: 6 } }, "auto-guess")), /* @__PURE__ */ React.createElement("td", { style: { fontSize: 12, color: "var(--text3)" } }, c.count, " \xB7 ", fmt(c.total)), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(SearchSelect, { value: map[c.name.toLowerCase().trim()] || guessExpenseAccount(c.name), onChange: (v) => updateMap(c.name, v), options: mappableOptions })), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => applyToBills(c.name) }, "Apply to bills")));
  })))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 16 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Accounting Policies (shown on the Companies Act format statements)"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      className: "field-input",
      rows: 7,
      defaultValue: getPolicies(),
      onBlur: (e) => {
        S.set(SK.POLICIES, e.target.value);
        logAudit("ACCOUNTING_POLICIES_UPDATED", "Accounting policies text updated", currentUser);
        toast.success("Accounting policies updated");
      },
      style: { width: "100%", fontFamily: "inherit", fontSize: 12.5 }
    }
  )))));
};
const blankJVLine = () => ({ account: "", desc: "", debit: "", credit: "" });
const JV_TEMPLATES = [
  {
    key: "depreciation",
    label: "Depreciation",
    narration: "Depreciation for the period",
    lines: [{ account: "DEPRECIATION", desc: "Depreciation expense" }, { account: "ACC_DEPRECIATION", desc: "Accumulated depreciation" }],
    help: "Debit the Depreciation expense, Credit Accumulated Depreciation \u2014 same amount both sides. This spreads an asset's cost over its useful life without touching Bank or Cash."
  },
  {
    key: "provision",
    label: "Provision (bad debts / warranty / tax)",
    narration: "Provision for \u2014",
    lines: [{ account: "OTHER_EXP", desc: "Provision expense (change the account if you have a specific one)" }, { account: "ST_PROVISION", desc: "Provision for \u2014" }],
    help: "Debit an Expense (swap in Bad Debts / Tax / Warranty if you've created that ledger), Credit Short-term Provisions. This recognises a probable future cost now, before it's actually paid \u2014 the opposite direction of Prepaid Expenses below."
  },
  {
    key: "prepaid_pay",
    label: "Prepaid Expense \u2014 record advance payment",
    narration: "Advance payment for \u2014",
    lines: [{ account: "PREPAID_EXP", desc: "Prepaid \u2014 advance paid" }, { account: "BANK", desc: "Paid from Bank" }],
    help: "Debit Prepaid Expenses (an asset \u2014 you've paid for something you haven't used yet), Credit Bank. If it went on credit instead of being paid immediately, change the second line to Trade Payables."
  },
  {
    key: "prepaid_amort",
    label: "Prepaid Expense \u2014 monthly amortisation",
    narration: "Amortisation of prepaid \u2014 for the month",
    lines: [{ account: "OTHER_EXP", desc: "This month's share of the prepaid expense (change to the right ledger, e.g. Rent)" }, { account: "PREPAID_EXP", desc: "Reducing the prepaid balance" }],
    help: "Debit the actual Expense (Rent, Insurance, etc.), Credit Prepaid Expenses. Post this once per period until the Prepaid balance reaches zero \u2014 that's what actually recognises the cost."
  },
  {
    key: "adv_supplier",
    label: "Adjust advance paid to a supplier against a bill",
    narration: "Advance adjusted against bill \u2014",
    lines: [{ account: "TRADE_PAYABLE", desc: "Bill settled by advance" }, { account: "ADVANCES", desc: "Advance to supplier adjusted" }],
    help: "Debit Trade Payables, Credit Short-term Loans & Advances (where an advance given to a supplier is recorded). Use when a supplier bill is cleared against money you paid earlier in advance."
  },
  {
    key: "adv_customer",
    label: "Adjust advance from a customer against an invoice",
    narration: "Advance adjusted against invoice \u2014",
    lines: [{ account: "CUSTOMER_ADVANCE", desc: "Advance from customer adjusted" }, { account: "TRADE_RECEIVABLE", desc: "Invoice settled by advance" }],
    help: "Debit Advances from Customers, Credit Trade Receivables. Use when an invoice is cleared against money the customer paid earlier in advance."
  }
];
const JournalVouchersPage = ({ inline = true, currentUser }) => {
  const [list, setList] = useState(getManualJournal());
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState(today());
  const [referenceNo, setReferenceNo] = useState("");
  const [narration, setNarration] = useState("");
  const [reportingMethod, setReportingMethod] = useState("both");
  const [reverseOn, setReverseOn] = useState(false);
  const [reverseDate, setReverseDate] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [lines, setLines] = useState([blankJVLine(), blankJVLine()]);
  const fyStart = `${getFY() - 5}-04-01`;
  const [fFrom, setFFrom] = useState(fyStart);
  const [fTo, setFTo] = useState(today());
  const [drillAccount, setDrillAccount] = useState(null);
  const isAdmin = (currentUser == null ? void 0 : currentUser.role) === "admin" || (currentUser == null ? void 0 : currentUser.role) === "superadmin";
  const filteredList = useMemo(() => list.filter((e) => (e.date || "") >= fFrom && (e.date || "") <= fTo).sort((a, b) => (b.date || "").localeCompare(a.date || "")), [list, fFrom, fTo]);
  const doExport = (f) => {
    const headers = ["Date", "Reversal Date", "Voucher No.", "Txn Ref No.", "Chart of Accounts", "Invoice Ref", "Narration", "Line Description", "Reporting Method", "Debit", "Credit"];
    const rows = [];
    filteredList.forEach((e) => (e.lines || []).forEach((l) => rows.push([fmtDate(e.date), fmtDate(e.reverseDate) || "", e.voucherNo || "", e.txnRefNo || "", coaByKey(l.account).name, e.referenceNo || "", e.narration, l.desc || "", e.reportingMethod || "both", l.debit ? fmtN(l.debit) : "", l.credit ? fmtN(l.credit) : ""])));
    exportTableAs(f, `JournalVouchers_${fFrom}_to_${fTo}`, `Journal Vouchers (${fmtDate(fFrom)} to ${fmtDate(fTo)})`, headers, rows);
  };
  const totalDr = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCr = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const diff = +(totalDr - totalCr).toFixed(2);
  const balanced = Math.abs(diff) < 0.01 && totalDr > 0;
  const upLine = (i, k, v) => setLines((p) => p.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  const addLine = () => setLines((p) => [...p, blankJVLine()]);
  const delLine = (i) => setLines((p) => p.length > 2 ? p.filter((_, idx) => idx !== i) : p);
  const applyTemplate = (t) => {
    setNarration(t.narration);
    setLines(t.lines.map((l) => ({ account: l.account === "BANK" ? (getPaymentLedgers()[0] || {}).key || "CASH_IN_HAND" : l.account, desc: l.desc, debit: "", credit: "" })));
    setShowTemplates(false);
    toast.info(t.help);
  };
  const reset = () => {
    setDate(today());
    setReferenceNo("");
    setNarration("");
    setReportingMethod("both");
    setReverseOn(false);
    setReverseDate("");
    setLines([blankJVLine(), blankJVLine()]);
    setAdding(false);
    setShowTemplates(false);
  };
  const save = () => {
    if (!narration.trim()) {
      toast.error("Add a narration describing this entry");
      return;
    }
    if (reverseOn && !reverseDate) {
      toast.error("Pick a reverse date, or turn off auto-reverse");
      return;
    }
    if (reverseOn && reverseDate <= date) {
      toast.error("Reverse date must be after the entry date");
      return;
    }
    const validLines = lines.filter((l) => l.account && (parseFloat(l.debit) || parseFloat(l.credit)));
    if (validLines.length < 2) {
      toast.error("A journal entry needs at least two lines");
      return;
    }
    const parentLine = validLines.find((l) => coaByKey(l.account).groupOnly);
    if (parentLine) {
      toast.error('"' + coaByKey(parentLine.account).name + '" is a parent group \u2014 pick the specific bank / cash ledger under it');
      return;
    }
    const d = +validLines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0).toFixed(2);
    const c = +validLines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0).toFixed(2);
    if (Math.abs(d - c) > 0.01) {
      toast.error(`Debit (${fmt(d)}) and Credit (${fmt(c)}) must be equal`);
      return;
    }
    const entry = {
      date,
      referenceNo,
      narration,
      reportingMethod,
      reverseDate: reverseOn ? reverseDate : "",
      srcType: "JV",
      lines: validLines.map((l) => ({ account: l.account, desc: l.desc || "", debit: +(parseFloat(l.debit) || 0).toFixed(2), credit: +(parseFloat(l.credit) || 0).toFixed(2) })),
      createdBy: (currentUser == null ? void 0 : currentUser.email) || "",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    saveManualJournalEntry(entry);
    setList(getManualJournal());
    logAudit("JOURNAL_VOUCHER_ADDED", `${narration} \u2014 Dr/Cr ${fmt(d)}${reverseOn ? " (auto-reverses " + fmtDate(reverseDate) + ")" : ""}`, currentUser);
    toast.success("Journal voucher posted" + (reverseOn ? " \u2014 reversal scheduled for " + fmtDate(reverseDate) : ""));
    reset();
  };
  const del = (id) => {
    if (!isAdmin) {
      toast.error("Only Admin can delete journal vouchers");
      return;
    }
    if (!window.confirm("Delete this journal voucher? Its scheduled reversal (if any) will be removed too.")) return;
    const jv = list.find((e) => e.id === id);
    deleteManualJournalEntry(id);
    setList(getManualJournal());
    logAudit("JOURNAL_VOUCHER_DELETED", `${(jv == null ? void 0 : jv.narration) || id}`, currentUser);
    toast.info("Journal voucher deleted");
  };
  if (drillAccount) {
    return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay" }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal" }, /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement(Breadcrumb, { items: [{ label: "Journal Vouchers", onClick: () => setDrillAccount(null) }, { label: coaByKey(drillAccount).name }] }), /* @__PURE__ */ React.createElement(LedgerTable, { account: drillAccount, fromDate: fFrom, toDate: fTo }))));
  }
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay" }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal" }, /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { className: "alert", style: { background: "rgba(79,111,232,0.06)", border: "1px solid rgba(79,111,232,0.2)", marginBottom: 16, borderRadius: 10, fontSize: 12 } }, "Use this only for entries with no source document \u2014 depreciation, provisions, prepaid expenses, opening capital, write-offs. Sales, Purchases and Bank transactions post themselves. Click any account name below to see its full ledger."), !adding ? /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => setAdding(true), style: { marginBottom: 16 } }, "+ New Journal Voucher") : /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: 16, padding: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 14 } }, "New Journal Voucher"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "monospace", fontSize: 11, color: "var(--text3)" } }, "Voucher No. / Txn Ref No. auto-assigned on save"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", style: { fontSize: 12, padding: "5px 10px" }, onClick: () => setShowTemplates((s) => !s) }, showTemplates ? "Hide templates" : "Choose Template"))), showTemplates && /* @__PURE__ */ React.createElement("div", { className: "dt-wrap", style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("tbody", null, JV_TEMPLATES.map((t) => /* @__PURE__ */ React.createElement("tr", { key: t.key, style: { cursor: "pointer" }, onClick: () => applyTemplate(t) }, /* @__PURE__ */ React.createElement("td", { style: { fontWeight: 600, color: "var(--primary2)" } }, t.label), /* @__PURE__ */ React.createElement("td", { style: { fontSize: 11.5, color: "var(--text3)" } }, t.help)))))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Date"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: date, onChange: (e) => setDate(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Reference No. (optional)"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: referenceNo, onChange: (e) => setReferenceNo(e.target.value), placeholder: "e.g. Fixed asset register #12" })), /* @__PURE__ */ React.createElement("div", { className: "field", style: { flex: 1, minWidth: 220 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Notes / Narration"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: narration, onChange: (e) => setNarration(e.target.value), placeholder: "e.g. Depreciation for March 2026" }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 20, marginBottom: 12, flexWrap: "wrap", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "field-label", style: { display: "block", marginBottom: 4 } }, "Reporting Method"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 14, fontSize: 12.5 } }, [["both", "Accrual and Cash"], ["accrual", "Accrual Only"], ["cash", "Cash Only"]].map(([k, l]) => /* @__PURE__ */ React.createElement("label", { key: k, style: { display: "flex", alignItems: "center", gap: 5, cursor: "pointer" } }, /* @__PURE__ */ React.createElement("input", { type: "radio", name: "repmethod", checked: reportingMethod === k, onChange: () => setReportingMethod(k) }), " ", l)))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12.5, fontWeight: 600 } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: reverseOn, onChange: (e) => setReverseOn(e.target.checked) }), " Auto-reverse this entry"), reverseOn && /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", style: { marginTop: 6, maxWidth: 180 }, value: reverseDate, onChange: (e) => setReverseDate(e.target.value) }))), /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Account"), /* @__PURE__ */ React.createElement("th", null, "Description"), /* @__PURE__ */ React.createElement("th", { style: { width: 130 } }, "Debit"), /* @__PURE__ */ React.createElement("th", { style: { width: 130 } }, "Credit"), /* @__PURE__ */ React.createElement("th", { style: { width: 36 } }))), /* @__PURE__ */ React.createElement("tbody", null, lines.map((l, i) => /* @__PURE__ */ React.createElement("tr", { key: i }, /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(AccountSelect, { value: l.account, onChange: (v) => upLine(i, "account", v) })), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("input", { className: "field-input", value: l.desc || "", onChange: (e) => upLine(i, "desc", e.target.value), placeholder: "Optional line description" })), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: l.debit, onChange: (e) => upLine(i, "debit", e.target.value), placeholder: "0.00" })), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("input", { type: "number", className: "field-input", value: l.credit, onChange: (e) => upLine(i, "credit", e.target.value), placeholder: "0.00" })), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: () => delLine(i) }, /* @__PURE__ */ React.createElement(Ic, { n: "x", s: 14 })))))))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", marginTop: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { minWidth: 220, fontSize: 12.5 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", padding: "3px 0" } }, /* @__PURE__ */ React.createElement("span", null, "Sub Total"), /* @__PURE__ */ React.createElement("span", null, fmtN(totalDr), " / ", fmtN(totalCr))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", padding: "3px 0", fontWeight: 700, borderTop: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("span", null, "Total"), /* @__PURE__ */ React.createElement("span", null, fmtN(totalDr), " / ", fmtN(totalCr))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", padding: "3px 0", color: Math.abs(diff) < 0.01 ? "var(--green)" : "var(--red)", fontWeight: 700 } }, /* @__PURE__ */ React.createElement("span", null, "Difference"), /* @__PURE__ */ React.createElement("span", null, fmtN(diff))))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 12 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: addLine }, "+ Add New Row"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: save, disabled: !balanced, style: { opacity: balanced ? 1 : 0.5 } }, "Post Journal Voucher"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: reset }, "Cancel"), !balanced && /* @__PURE__ */ React.createElement("span", { style: { color: "var(--red)", fontSize: 12, alignSelf: "center" } }, "Debit must equal Credit to post"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-end", flexWrap: "wrap", gap: 20, marginBottom: 12 } }, /* @__PURE__ */ React.createElement(ExportBar, { onExport: doExport, from: fFrom, to: fTo, onFromChange: setFFrom, onToChange: setFTo, showDateFilter: true, label: "Export Vouchers" })), /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Date"), /* @__PURE__ */ React.createElement("th", null, "Reversal Date"), /* @__PURE__ */ React.createElement("th", null, "Voucher No."), /* @__PURE__ */ React.createElement("th", null, "Txn Ref No."), /* @__PURE__ */ React.createElement("th", null, "Chart of Accounts"), /* @__PURE__ */ React.createElement("th", null, "Invoice Ref"), /* @__PURE__ */ React.createElement("th", null, "Narration"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Debit"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Credit"), /* @__PURE__ */ React.createElement("th", null))), /* @__PURE__ */ React.createElement("tbody", null, filteredList.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 10, style: { color: "var(--text3)", textAlign: "center" } }, "No journal vouchers in this range")) : filteredList.map((e) => {
    const ls = e.lines && e.lines.length ? e.lines : [{ account: "", desc: "", debit: 0, credit: 0 }];
    return ls.map((l, i) => /* @__PURE__ */ React.createElement("tr", { key: e.id + "-" + i }, i === 0 && /* @__PURE__ */ React.createElement("td", { rowSpan: ls.length }, fmtDate(e.date)), i === 0 && /* @__PURE__ */ React.createElement("td", { rowSpan: ls.length, style: { color: "var(--gold)" } }, e.reverseDate ? fmtDate(e.reverseDate) : "\u2014"), i === 0 && /* @__PURE__ */ React.createElement("td", { rowSpan: ls.length, style: { fontFamily: "monospace", fontSize: 11.5, color: "var(--text3)" } }, e.voucherNo || "\u2014"), i === 0 && /* @__PURE__ */ React.createElement("td", { rowSpan: ls.length, style: { fontFamily: "monospace", fontSize: 11.5, color: "var(--text3)" } }, e.txnRefNo || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { cursor: "pointer", color: "var(--primary2)", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: "3px" }, onClick: () => setDrillAccount(l.account) }, coaByKey(l.account).name), i === 0 && /* @__PURE__ */ React.createElement("td", { rowSpan: ls.length }, e.referenceNo || "\u2014"), i === 0 && /* @__PURE__ */ React.createElement("td", { rowSpan: ls.length }, e.narration, e.reportingMethod && e.reportingMethod !== "both" && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "var(--text3)", marginLeft: 6 } }, "(", e.reportingMethod === "accrual" ? "Accrual only" : "Cash only", ")")), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, l.debit ? fmtN(l.debit) : ""), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, l.credit ? fmtN(l.credit) : ""), i === 0 && /* @__PURE__ */ React.createElement("td", { rowSpan: ls.length }, /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: () => del(e.id) }, /* @__PURE__ */ React.createElement(Ic, { n: "x", s: 14 })))));
  })))))));
};
const FullGLTable = ({ fromDate, toDate }) => {
  const sections = useMemo(() => {
    const allLines = getAllLedgerLines();
    return getAllAccounts().map((a) => ({ acc: a, data: computeLedgerData(a.key, fromDate, toDate, allLines) })).filter(({ data }) => data.rows.length > 0 || Math.abs(data.opening) > 4e-3 || Math.abs(data.closing) > 4e-3);
  }, [fromDate, toDate]);
  const totalDebit = sections.reduce((s, { data }) => s + data.rows.reduce((x, r) => x + (r.debit || 0), 0), 0);
  const totalCredit = sections.reduce((s, { data }) => s + data.rows.reduce((x, r) => x + (r.credit || 0), 0), 0);
  const totalPostings = sections.reduce((s, { data }) => s + data.rows.length, 0);
  const doExport = (fmt2) => {
    const headers = LEDGER_COLS;
    const rows = [];
    sections.forEach(({ acc, data }) => {
      rows.push(["", acc.name, "", "", "", "", "", "Opening Balance", "", "", fmtN(data.opening)]);
      data.rows.forEach((r) => rows.push(ledgerExportRow(r)));
      rows.push(["", acc.name, "", "", "", "", "", "Closing Balance", "", "", fmtN(data.closing)]);
      rows.push(["", "", "", "", "", "", "", "", "", "", ""]);
    });
    exportTableAs(fmt2, `FullGeneralLedger_${fromDate}_to_${toDate}`, `Full General Ledger Dump (${fmtDate(fromDate)} to ${fmtDate(toDate)})`, headers, rows);
  };
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "g3", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16 } }, sections.length), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Accounts with Activity")), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16 } }, totalPostings), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Total Postings in Range")), /* @__PURE__ */ React.createElement("div", { className: "stat-card", style: { borderLeft: "3px solid var(--primary)" } }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 14 } }, fmt(totalDebit), " / ", fmt(totalCredit)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Total Debit / Credit"))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement(ExportBar, { onExport: doExport, label: "Export Full GL Dump" })), sections.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "40px", color: "var(--text3)" } }, "No postings anywhere in this date range.") : sections.map(({ acc, data }) => /* @__PURE__ */ React.createElement("div", { key: acc.key, className: "dt-wrap", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { colSpan: 11 }, acc.name, " \u2014 Opening ", fmt(data.opening), " \xB7 Closing ", fmt(data.closing))), /* @__PURE__ */ React.createElement(LedgerHeadRow, null)), /* @__PURE__ */ React.createElement("tbody", null, data.rows.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 11, style: { color: "var(--text3)", textAlign: "center" } }, "No postings in this range")) : data.rows.map((r, i) => /* @__PURE__ */ React.createElement(LedgerBodyRow, { key: i, r })))))));
};
const GeneralLedgerPage = ({ inline = true }) => {
  const [account, setAccount] = useState("BANK");
  const [fullDump, setFullDump] = useState(false);
  const [inclSub, setInclSub] = useState(true);
  const fyStart = `${getFY()}-04-01`;
  const [fromDate, setFromDate] = useState(fyStart);
  const [toDate, setToDate] = useState(today());
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay" }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal" }, /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "flex-end" } }, !fullDump && /* @__PURE__ */ React.createElement("div", { className: "field", style: { minWidth: 260 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Account"), /* @__PURE__ */ React.createElement(AccountSelect, { value: account, onChange: setAccount })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "From"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: fromDate, onChange: (e) => setFromDate(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "To"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: toDate, onChange: (e) => setToDate(e.target.value) })), /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12.5, fontWeight: 600, marginBottom: 8 } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: fullDump, onChange: (e) => setFullDump(e.target.checked) }), " Full GL Dump (all accounts)"), !fullDump && /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12.5, fontWeight: 600, marginBottom: 8 } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: inclSub, onChange: (e) => setInclSub(e.target.checked) }), " Include sub-ledgers")), fullDump ? /* @__PURE__ */ React.createElement(FullGLTable, { fromDate, toDate }) : /* @__PURE__ */ React.createElement(LedgerTable, { account, fromDate, toDate, withChildren: inclSub }))));
};
const TrialBalancePage = ({ inline = true }) => {
  const [asOf, setAsOf] = useState(today());
  const [drillAccount, setDrillAccount] = useState(null);
  const co = S.get(SK.CO, {});
  const prevAsOf = prevFYEnd(asOf);
  const tb = useMemo(() => getTrialBalance(asOf), [asOf]);
  const tbPrev = useMemo(() => getTrialBalance(prevAsOf), [prevAsOf]);
  const debitTotal = tb.filter((r) => r.balance >= 0).reduce((s, r) => s + r.balance, 0);
  const creditTotal = tb.filter((r) => r.balance < 0).reduce((s, r) => s - r.balance, 0);
  const debitTotalPrev = tbPrev.filter((r) => r.balance >= 0).reduce((s, r) => s + r.balance, 0);
  const creditTotalPrev = tbPrev.filter((r) => r.balance < 0).reduce((s, r) => s - r.balance, 0);
  const allAccOrder = getAllAccounts();
  const unionAccounts = useMemo(() => {
    const keys = [];
    tb.forEach((r) => {
      if (!keys.includes(r.account)) keys.push(r.account);
    });
    tbPrev.forEach((r) => {
      if (!keys.includes(r.account)) keys.push(r.account);
    });
    return keys.sort((a, b) => allAccOrder.findIndex((x) => x.key === a) - allAccOrder.findIndex((x) => x.key === b));
  }, [tb, tbPrev]);
  const balOf = (list, key) => {
    var _a;
    return ((_a = list.find((x) => x.account === key)) == null ? void 0 : _a.balance) || 0;
  };
  const doExport = (f) => {
    const headers = ["Account", `Debit (as at ${fmtDate(asOf)})`, `Credit (as at ${fmtDate(asOf)})`, `Debit (as at ${fmtDate(prevAsOf)})`, `Credit (as at ${fmtDate(prevAsOf)})`];
    const rows = unionAccounts.map((key) => {
      const bal = balOf(tb, key), balP = balOf(tbPrev, key);
      return [coaByKey(key).name, bal >= 0 ? fmtN(bal) : "", bal < 0 ? fmtN(-bal) : "", balP >= 0 ? fmtN(balP) : "", balP < 0 ? fmtN(-balP) : ""];
    });
    rows.push(["Total", fmtN(debitTotal), fmtN(creditTotal), fmtN(debitTotalPrev), fmtN(creditTotalPrev)]);
    exportTableAs(f, `TrialBalance_${asOf}`, `Trial Balance as at ${fmtDateLong(asOf)}${co.name ? " \u2014 " + co.name : ""}`, headers, rows);
  };
  if (drillAccount) {
    return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay" }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal" }, /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement(Breadcrumb, { items: [{ label: "Trial Balance", onClick: () => setDrillAccount(null) }, { label: coaByKey(drillAccount).name }] }), /* @__PURE__ */ React.createElement(LedgerTable, { account: drillAccount, fromDate: OPENING_DATE, toDate: asOf }))));
  }
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay" }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal" }, /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-end", flexWrap: "wrap", gap: 20, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { maxWidth: 220 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "As of"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: asOf, onChange: (e) => setAsOf(e.target.value) })), /* @__PURE__ */ React.createElement(ExportBar, { onExport: doExport, label: "Export Trial Balance" })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--text3)", marginBottom: 10 } }, "Click any account to see every transaction posted to it. Figures as at ", fmtDate(prevAsOf), " (the previous financial year-end) are shown alongside for comparison."), /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { colSpan: 5 }, "Trial Balance as at ", fmtDateLong(asOf), co.name ? " \u2014 " + co.name : "")), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { rowSpan: 2, style: { verticalAlign: "bottom" } }, "Account"), /* @__PURE__ */ React.createElement("th", { colSpan: 2, style: { textAlign: "center" } }, "As at ", fmtDate(asOf)), /* @__PURE__ */ React.createElement("th", { colSpan: 2, style: { textAlign: "center", color: "var(--text3)" } }, "As at ", fmtDate(prevAsOf), " (Previous Year)")), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Debit"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Credit"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right", color: "var(--text3)" } }, "Debit"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right", color: "var(--text3)" } }, "Credit"))), /* @__PURE__ */ React.createElement("tbody", null, unionAccounts.map((key) => {
    const bal = balOf(tb, key), balP = balOf(tbPrev, key);
    return /* @__PURE__ */ React.createElement("tr", { key }, /* @__PURE__ */ React.createElement("td", { style: { cursor: "pointer", color: "var(--primary2)", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: "3px" }, onClick: () => setDrillAccount(key) }, coaByKey(key).name), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, bal >= 0 ? fmtN(bal) : ""), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, bal < 0 ? fmtN(-bal) : ""), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, balP >= 0 ? fmtN(balP) : ""), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, balP < 0 ? fmtN(-balP) : ""));
  }), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 700, borderTop: "2px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", null, "Total"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, fmtN(debitTotal)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, fmtN(creditTotal)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmtN(debitTotalPrev)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmtN(creditTotalPrev)))))), Math.abs(debitTotal - creditTotal) > 0.5 && /* @__PURE__ */ React.createElement("div", { className: "alert", style: { marginTop: 12, color: "var(--red)" } }, "Trial Balance does not tie out \u2014 please check recent Journal Vouchers."))));
};
const EXP_CAPTION_ORDER_LOCAL = ["Cost of Materials Consumed", "Employee Benefit Expense", "Finance Costs", "Depreciation and Amortisation Expense", "Rent Expense", "Other Expenses"];
const BS_ASSET_GROUPS = ["Non-Current Assets", "Current Assets"];
const BS_LIAB_GROUPS = ["Non-Current Liabilities", "Current Liabilities"];
const ReportsPage = ({ inline = true, onClose, currentUser }) => {
  var _a;
  const [tab, setTab] = useState("pl");
  const [format, setFormat] = useState("schedule3");
  const [basis, setBasis] = useState("accrual");
  const [selFY, setSelFY] = useState(getFY());
  const fyStart = fyStartOf(selFY);
  const [fromDate, setFromDate] = useState(fyStart);
  const [toDate, setToDate] = useState(today());
  const [asOf, setAsOf] = useState(today());
  const pickFY = (y) => {
    y = parseInt(y);
    setSelFY(y);
    const end = fyEndOf(y), t = today();
    const e = end < t ? end : t;
    setFromDate(fyStartOf(y));
    setToDate(e);
    setAsOf(e);
  };
  const fySel = /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Financial Year"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: selFY, onChange: (ev) => pickFY(ev.target.value) }, [0, 1, 2, 3, 4, 5].map((k) => getFY() - k).map((y) => /* @__PURE__ */ React.createElement("option", { key: y, value: y }, fyLabelOf(y), " (1 Apr ", y, " - 31 Mar ", y + 1, ")"))));
  const co = S.get(SK.CO, {});
  const [drill, setDrill] = useState(null);
  const effBasis = format === "schedule3" ? "accrual" : basis;
  const pl = useMemo(() => effBasis === "cash" ? getPLCash(fromDate, toDate) : getPLAccrual(fromDate, toDate), [fromDate, toDate, effBasis]);
  const bs = useMemo(() => getBalanceSheet(asOf), [asOf]);
  const tb = useMemo(() => getTrialBalance(asOf), [asOf]);
  const tbDebit = tb.filter((r) => r.balance >= 0).reduce((s, r) => s + r.balance, 0);
  const tbCredit = tb.filter((r) => r.balance < 0).reduce((s, r) => s - r.balance, 0);
  const allAccOrder = getAllAccounts();
  const prevFrom = shiftYear(fromDate, -1), prevTo = shiftYear(toDate, -1);
  const prevAsOf = prevFYEnd(asOf);
  const plPrev = useMemo(() => effBasis === "cash" ? getPLCash(prevFrom, prevTo) : getPLAccrual(prevFrom, prevTo), [prevFrom, prevTo, effBasis]);
  const bsPrev = useMemo(() => getBalanceSheet(prevAsOf), [prevAsOf]);
  const tbPrev = useMemo(() => getTrialBalance(prevAsOf), [prevAsOf]);
  const tbDebitPrev = tbPrev.filter((r) => r.balance >= 0).reduce((s, r) => s + r.balance, 0);
  const tbCreditPrev = tbPrev.filter((r) => r.balance < 0).reduce((s, r) => s - r.balance, 0);
  const tbUnionAccounts = useMemo(() => {
    const keys = [];
    tb.forEach((r) => {
      if (!keys.includes(r.account)) keys.push(r.account);
    });
    tbPrev.forEach((r) => {
      if (!keys.includes(r.account)) keys.push(r.account);
    });
    return keys.sort((a, b) => allAccOrder.findIndex((x) => x.key === a) - allAccOrder.findIndex((x) => x.key === b));
  }, [tb, tbPrev]);
  const tbBalOf = (list, key) => {
    var _a2;
    return ((_a2 = list.find((x) => x.account === key)) == null ? void 0 : _a2.balance) || 0;
  };
  const bsPrevAll = [...bsPrev.assets, ...bsPrev.liabilities, ...bsPrev.equity];
  const prevAmtByKey = (key) => {
    var _a2;
    return ((_a2 = bsPrevAll.find((a) => a.key === key)) == null ? void 0 : _a2.amount) || 0;
  };
  const expByKey = (key) => {
    var _a2;
    return ((_a2 = (pl.rows || []).find((r) => r.account === key)) == null ? void 0 : _a2.amount) || 0;
  };
  const otherIncome = (pl.rows || []).filter((r) => r.type === "income" && r.account !== "SALES").reduce((s, r) => s + r.amount, 0);
  const salesRevenue = expByKey("SALES");
  const otherIncomePrev = (plPrev.rows || []).filter((r) => r.type === "income" && r.account !== "SALES").reduce((s, r) => s + r.amount, 0);
  const salesRevenuePrev = ((_a = (plPrev.rows || []).find((r) => r.account === "SALES")) == null ? void 0 : _a.amount) || 0;
  const expenseCaptions = useMemo(() => groupByCaption((pl.rows || []).filter((r) => r.type === "expense"), EXP_CAPTION_ORDER_LOCAL), [pl]);
  const incomeCaptions = useMemo(() => groupByCaption((pl.rows || []).filter((r) => r.type === "income"), ["Revenue from Operations", "Other Income"]), [pl]);
  const expenseCaptionsPrev = useMemo(() => groupByCaption((plPrev.rows || []).filter((r) => r.type === "expense"), EXP_CAPTION_ORDER_LOCAL), [plPrev]);
  const incomeCaptionsPrev = useMemo(() => groupByCaption((plPrev.rows || []).filter((r) => r.type === "income"), ["Revenue from Operations", "Other Income"]), [plPrev]);
  const expenseCaptionsCmp = useMemo(() => mergeCaptionAmounts(expenseCaptions, expenseCaptionsPrev), [expenseCaptions, expenseCaptionsPrev]);
  const incomeCaptionsCmp = useMemo(() => mergeCaptionAmounts(incomeCaptions, incomeCaptionsPrev), [incomeCaptions, incomeCaptionsPrev]);
  const plNormalIncomeCmp = useMemo(() => {
    const cur = (pl.rows || []).filter((r) => r.type === "income" && r.account !== "SALES"), prev = (plPrev.rows || []).filter((r) => r.type === "income" && r.account !== "SALES");
    const accs = [.../* @__PURE__ */ new Set([...cur.map((r) => r.account), ...prev.map((r) => r.account)])];
    return accs.map((acc) => {
      var _a2, _b, _c, _d;
      return { account: acc, name: ((_a2 = cur.find((r) => r.account === acc)) == null ? void 0 : _a2.name) || ((_b = prev.find((r) => r.account === acc)) == null ? void 0 : _b.name), amount: ((_c = cur.find((r) => r.account === acc)) == null ? void 0 : _c.amount) || 0, prevAmount: ((_d = prev.find((r) => r.account === acc)) == null ? void 0 : _d.amount) || 0 };
    });
  }, [pl, plPrev]);
  const plNormalExpenseCmp = useMemo(() => {
    const cur = (pl.rows || []).filter((r) => r.type === "expense"), prev = (plPrev.rows || []).filter((r) => r.type === "expense");
    const accs = [.../* @__PURE__ */ new Set([...cur.map((r) => r.account), ...prev.map((r) => r.account)])];
    return accs.map((acc) => {
      var _a2, _b, _c, _d;
      return { account: acc, name: ((_a2 = cur.find((r) => r.account === acc)) == null ? void 0 : _a2.name) || ((_b = prev.find((r) => r.account === acc)) == null ? void 0 : _b.name), amount: ((_c = cur.find((r) => r.account === acc)) == null ? void 0 : _c.amount) || 0, prevAmount: ((_d = prev.find((r) => r.account === acc)) == null ? void 0 : _d.amount) || 0 };
    }).sort((a, b) => b.amount - a.amount);
  }, [pl, plPrev]);
  const closeDrill = () => setDrill(null);
  const openCaptionDrill = (side, caption, accounts) => setDrill({ kind: "caption", side, caption, accounts });
  const openLedgerDrill = (account) => setDrill({ kind: "ledger", account });
  const doExportPL = (f) => {
    const headers = ["Head", `Current (${fmtDate(fromDate)} to ${fmtDate(toDate)})`, `Previous Year (${fmtDate(prevFrom)} to ${fmtDate(prevTo)})`];
    const rows = [];
    if (effBasis === "cash") {
      rows.push(["Total Receipts", fmtN(pl.income), fmtN(plPrev.income)], ["Total Payments", fmtN(pl.expense), fmtN(plPrev.expense)], ["Net Cash Surplus/(Deficit)", fmtN(pl.net), fmtN(plPrev.net)]);
    } else if (format === "schedule3") {
      rows.push(
        ["I. Revenue from Operations", fmtN(salesRevenue), fmtN(salesRevenuePrev)],
        ["II. Other Income", fmtN(otherIncome), fmtN(otherIncomePrev)],
        ["III. Total Income", fmtN(pl.income), fmtN(plPrev.income)],
        ["IV. Expenses", "", ""],
        ...expenseCaptionsCmp.map((c) => ["   " + c.caption, fmtN(c.amount), fmtN(c.prevAmount)]),
        ["Total Expenses", fmtN(pl.expense), fmtN(plPrev.expense)],
        ["V. Profit Before Tax", fmtN(pl.net), fmtN(plPrev.net)],
        ["VI. Profit for the Period", fmtN(pl.net), fmtN(plPrev.net)]
      );
    } else {
      rows.push(["Sales", fmtN(salesRevenue), fmtN(salesRevenuePrev)]);
      if (otherIncome > 5e-3 || otherIncomePrev > 5e-3) rows.push(["Other Income", fmtN(otherIncome), fmtN(otherIncomePrev)]);
      const expNames = [.../* @__PURE__ */ new Set([...(pl.rows || []).filter((r) => r.type === "expense").map((r) => r.name), ...(plPrev.rows || []).filter((r) => r.type === "expense").map((r) => r.name)])];
      expNames.forEach((name) => {
        var _a2, _b;
        return rows.push([name, fmtN(((_a2 = (pl.rows || []).find((r) => r.name === name)) == null ? void 0 : _a2.amount) || 0), fmtN(((_b = (plPrev.rows || []).find((r) => r.name === name)) == null ? void 0 : _b.amount) || 0)]);
      });
      rows.push(["Net Profit/(Loss)", fmtN(pl.net), fmtN(plPrev.net)]);
    }
    exportTableAs(f, `PL_${fromDate}_to_${toDate}`, `Statement of Profit & Loss (${effBasis === "cash" ? "Cash" : format === "schedule3" ? "Companies Act" : "Normal"} format) \u2014 for the period ${fmtDateLong(fromDate)} to ${fmtDateLong(toDate)}${co.name ? " \u2014 " + co.name : ""}`, headers, rows);
  };
  const doExportBS = (f) => {
    const headers = ["Head", `As at ${fmtDate(asOf)}`, `As at ${fmtDate(prevAsOf)} (Previous Year)`];
    const rows = [
      ["EQUITY AND LIABILITIES", "", ""],
      ...bs.equity.map((e) => ["  " + e.name, fmtN(e.amount), fmtN(prevAmtByKey(e.key))]),
      ...bs.liabilities.map((l) => ["  " + l.name, fmtN(l.amount), fmtN(prevAmtByKey(l.key))]),
      ["TOTAL", fmtN(bs.totalLiab + bs.totalEquity), fmtN(bsPrev.totalLiab + bsPrev.totalEquity)],
      ["ASSETS", "", ""],
      ...bs.assets.map((a) => ["  " + a.name, fmtN(a.amount), fmtN(prevAmtByKey(a.key))]),
      ["TOTAL", fmtN(bs.totalAssets), fmtN(bsPrev.totalAssets)]
    ];
    exportTableAs(f, `BalanceSheet_${asOf}`, `Balance Sheet as at ${fmtDateLong(asOf)} (${format === "schedule3" ? "Companies Act" : "Normal"} format)${co.name ? " \u2014 " + co.name : ""}`, headers, rows);
  };
  const doExportTB = (f) => {
    const headers = ["Account", `Debit (as at ${fmtDate(asOf)})`, `Credit (as at ${fmtDate(asOf)})`, `Debit (as at ${fmtDate(prevAsOf)})`, `Credit (as at ${fmtDate(prevAsOf)})`];
    const rows = tbUnionAccounts.map((key) => {
      const bal = tbBalOf(tb, key), balP = tbBalOf(tbPrev, key);
      return [coaByKey(key).name, bal >= 0 ? fmtN(bal) : "", bal < 0 ? fmtN(-bal) : "", balP >= 0 ? fmtN(balP) : "", balP < 0 ? fmtN(-balP) : ""];
    });
    rows.push(["Total", fmtN(tbDebit), fmtN(tbCredit), fmtN(tbDebitPrev), fmtN(tbCreditPrev)]);
    exportTableAs(f, `TrialBalance_${asOf}`, `Trial Balance as at ${fmtDateLong(asOf)}${co.name ? " \u2014 " + co.name : ""}`, headers, rows);
  };
  const clickable = { cursor: "pointer", color: "var(--primary2)", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: "3px" };
  if ((drill == null ? void 0 : drill.kind) === "ledger") {
    return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay" }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal" }, /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement(Breadcrumb, { items: [
      { label: "Financial Statements", onClick: closeDrill },
      { label: coaByKey(drill.account).name }
    ] }), /* @__PURE__ */ React.createElement(LedgerTable, { account: drill.account, fromDate: tab === "pl" ? fromDate : OPENING_DATE, toDate: tab === "pl" ? toDate : asOf }))));
  }
  if ((drill == null ? void 0 : drill.kind) === "caption") {
    const dExport = (f) => {
      const headers = ["Ledger", "Amount"];
      const rows = drill.accounts.map((a) => [a.name || coaByKey(a.key || a.account).name, fmtN(a.amount)]);
      exportTableAs(f, `${drill.caption.replace(/\s+/g, "_")}`, `${drill.caption} \u2014 constituent ledgers`, headers, rows);
    };
    return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay" }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal" }, /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement(Breadcrumb, { items: [{ label: "Financial Statements", onClick: closeDrill }, { label: drill.caption }] }), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement(ExportBar, { onExport: dExport, label: "Export" })), /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Ledger Account"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Amount"))), /* @__PURE__ */ React.createElement("tbody", null, drill.accounts.map((a, i) => /* @__PURE__ */ React.createElement("tr", { key: i }, /* @__PURE__ */ React.createElement("td", { style: clickable, onClick: () => openLedgerDrill(a.key || a.account) }, a.name || coaByKey(a.key || a.account).name), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, fmt(a.amount)))), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 700, borderTop: "2px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", null, "Total"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, fmt(drill.accounts.reduce((s, a) => s + a.amount, 0))))))))));
  }
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay" }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal" }, !inline && /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("span", { className: "modal-title" }, /* @__PURE__ */ React.createElement(Ic, { n: "chart", s: 18 }), " Financial Statements"), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Ic, { n: "x" }))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { className: "alert", style: { background: "rgba(79,111,232,0.06)", border: "1px solid rgba(79,111,232,0.2)", marginBottom: 16, borderRadius: 10, fontSize: 12 } }, "Generated from a full double-entry ledger (see Chart of Accounts, Journal Vouchers, General Ledger & Trial Balance) \u2014 posted automatically from your Sales, Purchases and Bank Reconciliation. Click any caption or ledger below to drill into its transactions. Not a substitute for statements reviewed and signed off by your CA."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, [["pl", "Profit & Loss"], ["bs", "Balance Sheet"], ["tb", "Trial Balance"]].map(([k, l]) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: k,
      onClick: () => setTab(k),
      style: {
        padding: "6px 14px",
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
  ))), (tab === "pl" || tab === "bs") && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, [["schedule3", "Companies Act Format"], ["normal", "Normal Format"]].map(([k, l]) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: k,
      onClick: () => setFormat(k),
      style: {
        padding: "6px 14px",
        borderRadius: 8,
        fontSize: 11.5,
        fontWeight: format === k ? 700 : 500,
        cursor: "pointer",
        border: `2px solid ${format === k ? "var(--green)" : "var(--border2)"}`,
        background: format === k ? "rgba(46,160,67,0.12)" : "transparent",
        color: format === k ? "var(--green)" : "var(--text2)"
      }
    },
    l
  ))), tab === "pl" && format === "normal" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, [["accrual", "Accrual Basis"], ["cash", "Cash Basis"]].map(([k, l]) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: k,
      onClick: () => setBasis(k),
      style: {
        padding: "6px 14px",
        borderRadius: 8,
        fontSize: 11.5,
        fontWeight: basis === k ? 700 : 500,
        cursor: "pointer",
        border: `2px solid ${basis === k ? "var(--gold)" : "var(--border2)"}`,
        background: basis === k ? "rgba(241,73,92,0.12)" : "transparent",
        color: basis === k ? "var(--gold)" : "var(--text2)"
      }
    },
    l
  )))), tab === "pl" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 16, alignItems: "flex-end" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" } }, fySel, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "From"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: fromDate, onChange: (e) => setFromDate(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "To"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: toDate, onChange: (e) => setToDate(e.target.value) }))), /* @__PURE__ */ React.createElement(ExportBar, { onExport: doExportPL, label: "Export P&L" })), /* @__PURE__ */ React.createElement("div", { className: "g3", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16, color: "var(--green)" } }, fmt(pl.income)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Total Income (", effBasis === "cash" ? "Cash" : "Accrual", ")")), /* @__PURE__ */ React.createElement("div", { className: "stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16, color: "var(--red)" } }, fmt(pl.expense)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Total Expenses")), /* @__PURE__ */ React.createElement("div", { className: "stat-card", style: { borderLeft: `3px solid ${pl.net >= 0 ? "var(--green)" : "var(--red)"}` } }, /* @__PURE__ */ React.createElement("div", { className: "stat-val", style: { fontSize: 16, color: pl.net >= 0 ? "var(--green)" : "var(--red)" } }, fmt(pl.net)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, effBasis === "cash" ? "Net Cash Surplus" : "Profit for the Period"))), effBasis === "cash" ? /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { colSpan: 3 }, "Receipts & Payments Statement \u2014 for the period ", fmtDateLong(fromDate), " to ", fmtDateLong(toDate), co.name ? " \u2014 " + co.name : "")), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Head"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Current (", fmtDate(fromDate), "\u2013", fmtDate(toDate), ")"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right", color: "var(--text3)" } }, "Previous Year (", fmtDate(prevFrom), "\u2013", fmtDate(prevTo), ")"))), /* @__PURE__ */ React.createElement("tbody", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", null, "Total Receipts (Bank credits in period)"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", fontWeight: 600 } }, fmt(pl.income)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(plPrev.income))), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", null, "Total Payments (Bank debits in period)"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, fmt(pl.expense)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(plPrev.expense))), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 700, borderTop: "2px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", null, "Net Cash Surplus / (Deficit)"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: pl.net >= 0 ? "var(--green)" : "var(--red)" } }, fmt(pl.net)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(plPrev.net))))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--text3)", marginTop: 8 } }, "Receipts & Payments basis \u2014 counts only actual money that moved through the Bank in this period, ignoring unpaid invoices/bills. Companies Act statements must use the Accrual basis. (No ledger drill-down here \u2014 the underlying view is Bank Reconciliation.) The Previous Year column covers the corresponding period one year earlier (", fmtDate(prevFrom), " to ", fmtDate(prevTo), ").")) : format === "schedule3" ? /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { colSpan: 3 }, "Statement of Profit & Loss \u2014 for the period ended ", fmtDateLong(toDate), co.name ? " \u2014 " + co.name : "")), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Particulars"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Current Year (", fmtDate(fromDate), " to ", fmtDate(toDate), ")"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right", color: "var(--text3)" } }, "Previous Year (", fmtDate(prevFrom), " to ", fmtDate(prevTo), ")"))), /* @__PURE__ */ React.createElement("tbody", null, incomeCaptionsCmp.filter((c) => c.caption === "Revenue from Operations").map((c) => /* @__PURE__ */ React.createElement("tr", { key: c.caption }, /* @__PURE__ */ React.createElement("td", null, "I. ", c.caption), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", ...clickable }, onClick: () => openCaptionDrill("income", c.caption, c.accounts) }, fmt(c.amount)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(c.prevAmount)))), incomeCaptionsCmp.filter((c) => c.caption === "Other Income").map((c) => /* @__PURE__ */ React.createElement("tr", { key: c.caption }, /* @__PURE__ */ React.createElement("td", null, "II. ", c.caption), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", ...clickable }, onClick: () => openCaptionDrill("income", c.caption, c.accounts) }, fmt(c.amount)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(c.prevAmount)))), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 700 } }, /* @__PURE__ */ React.createElement("td", null, "III. Total Income (I + II)"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, fmt(pl.income)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(plPrev.income))), /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("td", { colSpan: 3, style: { fontWeight: 700 } }, "IV. Expenses")), expenseCaptionsCmp.map((c) => /* @__PURE__ */ React.createElement("tr", { key: c.caption }, /* @__PURE__ */ React.createElement("td", { style: { paddingLeft: 20, ...clickable }, onClick: () => openCaptionDrill("expense", c.caption, c.accounts) }, c.caption), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", ...clickable }, onClick: () => openCaptionDrill("expense", c.caption, c.accounts) }, fmt(c.amount)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(c.prevAmount)))), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 700, borderTop: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", null, "Total Expenses"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, fmt(pl.expense)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(plPrev.expense))), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 700, borderTop: "2px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", null, "V. Profit Before Tax (III \u2212 IV)"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: pl.net >= 0 ? "var(--green)" : "var(--red)" } }, fmt(pl.net)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(plPrev.net))), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { paddingLeft: 20, color: "var(--text3)" } }, "Tax Expense (to be computed by your CA)"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, "\u2014")), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 700, borderTop: "2px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", null, "VI. Profit for the Period"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: pl.net >= 0 ? "var(--green)" : "var(--red)" } }, fmt(pl.net)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(plPrev.net))))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--text3)", marginTop: 10, whiteSpace: "pre-line" } }, /* @__PURE__ */ React.createElement("b", null, "Notes \u2014 Significant Accounting Policies:"), "\n", getPolicies())) : /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { colSpan: 3 }, "Profit & Loss Statement \u2014 for the period ", fmtDateLong(fromDate), " to ", fmtDateLong(toDate), co.name ? " \u2014 " + co.name : "")), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Head"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Current (", fmtDate(fromDate), "\u2013", fmtDate(toDate), ")"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right", color: "var(--text3)" } }, "Previous Year (", fmtDate(prevFrom), "\u2013", fmtDate(prevTo), ")"))), /* @__PURE__ */ React.createElement("tbody", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("td", { colSpan: 3, style: { fontWeight: 700 } }, "Income")), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: clickable, onClick: () => openLedgerDrill("SALES") }, "Sales"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", fontWeight: 600, ...clickable }, onClick: () => openLedgerDrill("SALES") }, fmt(salesRevenue)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(salesRevenuePrev))), plNormalIncomeCmp.map((r) => /* @__PURE__ */ React.createElement("tr", { key: r.account }, /* @__PURE__ */ React.createElement("td", { style: clickable, onClick: () => openLedgerDrill(r.account) }, r.name), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", ...clickable }, onClick: () => openLedgerDrill(r.account) }, fmt(r.amount)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(r.prevAmount)))), /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("td", { colSpan: 3, style: { fontWeight: 700 } }, "Expenses")), plNormalExpenseCmp.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 3, style: { color: "var(--text3)", textAlign: "center" } }, "No expenses in either period")) : plNormalExpenseCmp.map((r) => /* @__PURE__ */ React.createElement("tr", { key: r.account }, /* @__PURE__ */ React.createElement("td", { style: clickable, onClick: () => openLedgerDrill(r.account) }, r.name), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", ...clickable }, onClick: () => openLedgerDrill(r.account) }, fmt(r.amount)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(r.prevAmount)))), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 700, borderTop: "2px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", null, "Net Profit / (Loss)"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: pl.net >= 0 ? "var(--green)" : "var(--red)" } }, fmt(pl.net)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(plPrev.net))))))), tab === "bs" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 16, alignItems: "flex-end" } }, fySel, /* @__PURE__ */ React.createElement("div", { className: "field", style: { maxWidth: 220 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "As of"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: asOf, onChange: (e) => setAsOf(e.target.value) })), /* @__PURE__ */ React.createElement(ExportBar, { onExport: doExportBS, label: "Export Balance Sheet" })), format === "schedule3" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "dt-wrap", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { colSpan: 3 }, "Balance Sheet as at ", fmtDateLong(asOf), " \u2014 ", co.name || "Company")), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Particulars"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "As at ", fmtDate(asOf)), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right", color: "var(--text3)" } }, "As at ", fmtDate(prevAsOf), " (Previous Year)"))), /* @__PURE__ */ React.createElement("tbody", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--card2)" } }, /* @__PURE__ */ React.createElement("td", { colSpan: 3, style: { fontWeight: 700 } }, "I. EQUITY AND LIABILITIES")), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 600 } }, /* @__PURE__ */ React.createElement("td", null, "1. Shareholders' Funds"), /* @__PURE__ */ React.createElement("td", null), /* @__PURE__ */ React.createElement("td", null)), mergeCaptionAmounts(groupByCaption(bs.equity, ["Equity"]), groupByCaption(bsPrev.equity, ["Equity"])).map((c) => /* @__PURE__ */ React.createElement("tr", { key: c.caption }, /* @__PURE__ */ React.createElement("td", { style: { paddingLeft: 20, ...clickable }, onClick: () => openCaptionDrill("equity", c.caption, c.accounts) }, c.caption), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", ...clickable }, onClick: () => openCaptionDrill("equity", c.caption, c.accounts) }, fmt(c.amount)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(c.prevAmount)))), BS_LIAB_GROUPS.map((g) => {
    const rows = bs.liabilities.filter((l) => l.group === g), prevRows = bsPrev.liabilities.filter((l) => l.group === g);
    if (!rows.length && !prevRows.length) return null;
    return /* @__PURE__ */ React.createElement(React.Fragment, { key: g }, /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 600 } }, /* @__PURE__ */ React.createElement("td", null, g === "Non-Current Liabilities" ? "2. Non-Current Liabilities" : "3. Current Liabilities"), /* @__PURE__ */ React.createElement("td", null), /* @__PURE__ */ React.createElement("td", null)), mergeCaptionAmounts(groupByCaption(rows), groupByCaption(prevRows)).map((c) => /* @__PURE__ */ React.createElement("tr", { key: c.caption }, /* @__PURE__ */ React.createElement("td", { style: { paddingLeft: 20, ...clickable }, onClick: () => openCaptionDrill("liability", c.caption, c.accounts) }, c.caption), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", ...clickable }, onClick: () => openCaptionDrill("liability", c.caption, c.accounts) }, fmt(c.amount)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(c.prevAmount)))));
  }), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 700, borderTop: "2px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", null, "TOTAL"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, fmt(bs.totalLiab + bs.totalEquity)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(bsPrev.totalLiab + bsPrev.totalEquity)))))), /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { colSpan: 3 }, "II. ASSETS")), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Particulars"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "As at ", fmtDate(asOf)), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right", color: "var(--text3)" } }, "As at ", fmtDate(prevAsOf), " (Previous Year)"))), /* @__PURE__ */ React.createElement("tbody", null, BS_ASSET_GROUPS.map((g) => {
    const rows = bs.assets.filter((a) => a.group === g), prevRows = bsPrev.assets.filter((a) => a.group === g);
    if (!rows.length && !prevRows.length) return null;
    return /* @__PURE__ */ React.createElement(React.Fragment, { key: g }, /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 600 } }, /* @__PURE__ */ React.createElement("td", null, g === "Non-Current Assets" ? "1. Non-Current Assets" : "2. Current Assets"), /* @__PURE__ */ React.createElement("td", null), /* @__PURE__ */ React.createElement("td", null)), mergeCaptionAmounts(groupByCaption(rows), groupByCaption(prevRows)).map((c) => /* @__PURE__ */ React.createElement("tr", { key: c.caption }, /* @__PURE__ */ React.createElement("td", { style: { paddingLeft: 20, ...clickable }, onClick: () => openCaptionDrill("asset", c.caption, c.accounts) }, c.caption), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", ...clickable }, onClick: () => openCaptionDrill("asset", c.caption, c.accounts) }, fmt(c.amount)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(c.prevAmount)))));
  }), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 700, borderTop: "2px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", null, "TOTAL"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, fmt(bs.totalAssets)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(bsPrev.totalAssets)))))), !bs.tallies && /* @__PURE__ */ React.createElement("div", { className: "alert", style: { marginTop: 12, color: "var(--red)" } }, "Balance Sheet does not tie out exactly \u2014 check the Trial Balance / recent Journal Vouchers."), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--text3)", marginTop: 10, whiteSpace: "pre-line" } }, /* @__PURE__ */ React.createElement("b", null, "Notes \u2014 Significant Accounting Policies:"), "\n", getPolicies())) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, marginBottom: 10 } }, "Balance Sheet as at ", fmtDateLong(asOf), co.name ? " \u2014 " + co.name : "", " ", /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 400, color: "var(--text3)", fontSize: 11.5 } }, "(Normal format, comparing against ", fmtDate(prevAsOf), ")")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Assets"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "As at ", fmtDate(asOf)), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right", color: "var(--text3)" } }, "As at ", fmtDate(prevAsOf)))), /* @__PURE__ */ React.createElement("tbody", null, bs.assets.map((a) => /* @__PURE__ */ React.createElement("tr", { key: a.key }, /* @__PURE__ */ React.createElement("td", { style: clickable, onClick: () => openLedgerDrill(a.key) }, a.name), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", ...clickable }, onClick: () => openLedgerDrill(a.key) }, fmt(a.amount)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(prevAmtByKey(a.key))))), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 700, borderTop: "2px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", null, "Total Assets"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, fmt(bs.totalAssets)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(bsPrev.totalAssets)))))), /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Liabilities & Equity"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "As at ", fmtDate(asOf)), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right", color: "var(--text3)" } }, "As at ", fmtDate(prevAsOf)))), /* @__PURE__ */ React.createElement("tbody", null, [...bs.liabilities, ...bs.equity].map((a) => /* @__PURE__ */ React.createElement("tr", { key: a.key }, /* @__PURE__ */ React.createElement("td", { style: clickable, onClick: () => openLedgerDrill(a.key) }, a.name), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", ...clickable }, onClick: () => openLedgerDrill(a.key) }, fmt(a.amount)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(prevAmtByKey(a.key))))), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 700, borderTop: "2px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", null, "Total Liabilities & Equity"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, fmt(bs.totalLiab + bs.totalEquity)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmt(bsPrev.totalLiab + bsPrev.totalEquity))))))))), tab === "tb" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 16, alignItems: "flex-end" } }, fySel, /* @__PURE__ */ React.createElement("div", { className: "field", style: { maxWidth: 220 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "As of"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "field-input", value: asOf, onChange: (e) => setAsOf(e.target.value) })), /* @__PURE__ */ React.createElement(ExportBar, { onExport: doExportTB, label: "Export Trial Balance" })), /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { colSpan: 5 }, "Trial Balance as at ", fmtDateLong(asOf), co.name ? " \u2014 " + co.name : "")), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { rowSpan: 2, style: { verticalAlign: "bottom" } }, "Account"), /* @__PURE__ */ React.createElement("th", { colSpan: 2, style: { textAlign: "center" } }, "As at ", fmtDate(asOf)), /* @__PURE__ */ React.createElement("th", { colSpan: 2, style: { textAlign: "center", color: "var(--text3)" } }, "As at ", fmtDate(prevAsOf), " (Previous Year)")), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Debit"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Credit"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right", color: "var(--text3)" } }, "Debit"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right", color: "var(--text3)" } }, "Credit"))), /* @__PURE__ */ React.createElement("tbody", null, tbUnionAccounts.map((key) => {
    const bal = tbBalOf(tb, key), balP = tbBalOf(tbPrev, key);
    return /* @__PURE__ */ React.createElement("tr", { key }, /* @__PURE__ */ React.createElement("td", { style: clickable, onClick: () => openLedgerDrill(key) }, coaByKey(key).name), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, bal >= 0 ? fmtN(bal) : ""), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, bal < 0 ? fmtN(-bal) : ""), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, balP >= 0 ? fmtN(balP) : ""), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, balP < 0 ? fmtN(-balP) : ""));
  }), /* @__PURE__ */ React.createElement("tr", { style: { fontWeight: 700, borderTop: "2px solid var(--border)" } }, /* @__PURE__ */ React.createElement("td", null, "Total"), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, fmtN(tbDebit)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right" } }, fmtN(tbCredit)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmtN(tbDebitPrev)), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "right", color: "var(--text3)" } }, fmtN(tbCreditPrev))))))))));
};
