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
