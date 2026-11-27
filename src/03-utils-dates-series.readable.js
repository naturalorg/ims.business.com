const proShort = (v) => {
  const a = Math.abs(v), s = v < 0 ? "-" : "";
  return a >= 1e7 ? s + (a / 1e7).toFixed(2) + " Cr" : a >= 1e5 ? s + (a / 1e5).toFixed(2) + " L" : s + a.toLocaleString("en-IN", { maximumFractionDigits: 0 });
};
const proRs = (v) => "\u20B9" + Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const proSummarise = (P) => {
  const { headers, body, info } = P;
  const rows = body.filter((r) => !proIsTotalRow(r));
  const money = [];
  info.forEach((c, i) => {
    if (c.kind === "money" && !/rate|price|%|balance|opening|closing/i.test(headers[i])) {
      const sum = rows.reduce((a, r) => a + (proIsNum(r[i]) ? proToNum(r[i]) : 0), 0);
      money.push({ i, h: headers[i], sum });
    }
  });
  money.sort((a, b) => Math.abs(b.sum) - Math.abs(a.sum));
  const gi = info.findIndex((c, i) => !c.numeric && !/date|no\.?$|invoice|voucher|ref|gstin|sl\.?\s?no|status|type|unit|hsn|code/i.test(headers[i]) && new Set(rows.map((r) => r[i]).filter(Boolean)).size > 1);
  let groups = [];
  if (gi >= 0 && money.length) {
    const m = /* @__PURE__ */ new Map();
    rows.forEach((r) => {
      const k = String(r[gi] || "").trim();
      if (!k) return;
      m.set(k, (m.get(k) || 0) + (proIsNum(r[money[0].i]) ? proToNum(r[money[0].i]) : 0));
    });
    groups = [...m.entries()].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  }
  const ins = [];
  const tot = money[0] ? money[0].sum : 0;
  if (money[0]) ins.push(["\u25CF", `${money[0].h}: ${proRs(money[0].sum)} across ${rows.length.toLocaleString("en-IN")} record(s).`]);
  if (groups.length > 1 && tot) ins.push(["\u25CF", `Top ${headers[gi]} "${groups[0][0]}" contributes ${proRs(groups[0][1])} (${(Math.abs(groups[0][1]) / Math.abs(tot) * 100).toFixed(1)}% of ${money[0].h}); ${groups.length} distinct in total.`]);
  if (money[0]) {
    let mx = null;
    rows.forEach((r) => {
      const v = proIsNum(r[money[0].i]) ? proToNum(r[money[0].i]) : 0;
      if (!mx || Math.abs(v) > Math.abs(mx.v)) mx = { v, r };
    });
    if (mx && mx.v) {
      const lab = mx.r.find((c) => typeof c === "string" && c && !proIsNum(c)) || "";
      ins.push(["\u25B2", `Largest single line: ${proRs(mx.v)}${lab ? " \u2014 " + lab : ""}.`]);
    }
  }
  const neg = money[0] ? rows.filter((r) => proIsNum(r[money[0].i]) && proToNum(r[money[0].i]) < 0).length : 0;
  if (neg) ins.push(["\u25B2", `${neg} record(s) carry a negative ${money[0].h} (credit notes / reversals) \u2014 they reduce the total.`]);
  return { money, groups, gi, ins, count: rows.length };
};
const proChartPng = (title, pairs) => {
  try {
    if (!pairs.length || typeof document === "undefined") return null;
    const cv = document.createElement("canvas");
    cv.width = 1240;
    cv.height = 600;
    const g = cv.getContext("2d");
    if (!g) return null;
    g.fillStyle = "#fff";
    g.fillRect(0, 0, 1240, 600);
    g.fillStyle = "#14141C";
    g.font = "bold 26px Arial";
    g.fillText(title, 32, 46);
    const n = pairs.length, band = 480 / n, bh = Math.min(48, band * 0.6), max = Math.max(...pairs.map((p) => Math.abs(p[1]))) || 1, x0 = 392, W = 680;
    pairs.forEach((p, i) => {
      const y = 96 + i * band + (band - bh) / 2, w = Math.max(4, Math.abs(p[1]) / max * W);
      const gr = g.createLinearGradient(x0, 0, x0 + w, 0);
      gr.addColorStop(0, "#4F6FE8");
      gr.addColorStop(1, "#F1495C");
      g.fillStyle = gr;
      g.fillRect(x0, y, w, bh);
      g.fillStyle = "#5A5A78";
      g.font = "22px Arial";
      g.textAlign = "right";
      let l = String(p[0]);
      if (l.length > 26) l = l.slice(0, 25) + "\u2026";
      g.fillText(l, x0 - 16, y + bh / 2 + 8);
      g.fillStyle = "#14141C";
      g.textAlign = "left";
      g.fillText(proShort(p[1]), x0 + w + 12, y + bh / 2 + 8);
    });
    return cv.toDataURL("image/png");
  } catch (e) {
    return null;
  }
};
const proXlsx = async (spec, filename) => {
  const EJ = window.ExcelJS;
  const { co } = proCompanyInfo();
  const wb = new EJ.Workbook();
  wb.creator = co.name || "Arctic Books";
  wb.created = /* @__PURE__ */ new Date();
  const fill = (c) => ({ type: "pattern", pattern: "solid", fgColor: { argb: "FF" + c } });
  const thin = { style: "thin", color: { argb: "FFE4E4F0" } };
  const prepared = [];
  spec.sheets.forEach((sh, si) => {
    const N = proNorm(sh);
    if (!N) return;
    const info = proAnalyze(N.headers, N.body, sh.cols);
    const dcols = N.headers.map((h, ci) => proIsDateCol(h, N.body, ci));
    dcols.forEach((d, ci) => {
      if (d) {
        info[ci].numeric = false;
        info[ci].center = true;
        info[ci].width = Math.max(info[ci].width, 13);
      }
    });
    const nm = String(sh.name || "Sheet" + (si + 1)).replace(/[\\\/\?\*\[\]:]/g, "").substring(0, 31) || "Sheet" + (si + 1);
    prepared.push({ sh, nm, headers: N.headers, body: N.body, info, dcols });
  });
  if (!prepared.length) throw new Error("Nothing to export");
  const main = prepared.reduce((a, b) => b.body.length > a.body.length ? b : a, prepared[0]);
  const sum = proSummarise(main);
  const ov = wb.addWorksheet("Overview", { properties: { tabColor: { argb: "FF" + PRO_GRAD[1] } }, views: [{ showGridLines: false }], pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
  [2.7, 14.4, 10, 17, 10, 15, 10, 14.4, 10, 15, 10, 14.4, 10, 2.7].forEach((w, i) => {
    ov.getColumn(i + 1).width = w;
  });
  const title = spec.title || main.nm;
  const when = proNowText();
  ov.mergeCells("A1:N4");
  const bn = ov.getCell("A1");
  bn.value = { richText: [{ text: "ARCTIC BOOKS\n", font: { name: PRO_FONT, size: 22, bold: true, color: { argb: "FFFFFFFF" } } }, { text: title + (spec.period ? "  \xB7  " + spec.period.replace(/^Period:\s*/, "") : "") + "\n", font: { name: PRO_FONT, size: 11, color: { argb: "FFFFFFFF" } } }, { text: "Complete Accounting  \xB7  arcticbooks-in.web.app", font: { name: PRO_FONT, size: 9, color: { argb: "FFFFFFFF" } } }] };
  bn.alignment = { vertical: "middle", horizontal: "left", indent: 2, wrapText: true };
  for (let r3 = 1; r3 <= 4; r3++) {
    ov.getRow(r3).height = 24;
    for (let c = 1; c <= 14; c++) ov.getCell(r3, c).fill = { type: "gradient", gradient: "angle", degree: 0, stops: PRO_GRAD.map((c2, i) => ({ position: i / 2, color: { argb: "FF" + c2 } })) };
  }
  ov.getRow(5).height = 4;
  const lab = (a, t, sz) => {
    const c = ov.getCell(a);
    c.value = t;
    c.font = { name: PRO_FONT, size: sz || 9.5, bold: true, color: { argb: "FF5A5A78" } };
    c.fill = fill(PRO_CARD);
    c.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  };
  const val = (a, t) => {
    const c = ov.getCell(a);
    c.value = t;
    c.font = { name: PRO_FONT, size: 10.5, bold: true, color: { argb: "FF14141C" } };
    c.alignment = { vertical: "middle", horizontal: "left" };
  };
  const meta = [["Company", co.name || "\u2014", "Period", (spec.period || "All dates").replace(/^Period:\s*/, "")], ["GSTIN", co.gstin || "\u2014", "Report generated", when], ["Report", title, "Sheets in workbook", String(prepared.length)]];
  meta.forEach((m, i) => {
    const r3 = 7 + i;
    ov.getRow(r3).height = 19;
    lab("B" + r3, m[0]);
    ov.mergeCells(`D${r3}:G${r3}`);
    val("D" + r3, m[1]);
    lab("H" + r3, m[2]);
    ov.mergeCells(`J${r3}:M${r3}`);
    val("J" + r3, m[3]);
    ov.mergeCells(`B${r3}:C${r3}`);
    ov.mergeCells(`H${r3}:I${r3}`);
  });
  ov.getRow(10).height = 10;
  const section = (r3, t) => {
    ov.mergeCells(`B${r3}:M${r3}`);
    const c = ov.getCell(`B${r3}`);
    c.value = t;
    c.font = { name: PRO_FONT, size: 11, bold: true, color: { argb: "FF14141C" } };
    c.alignment = { vertical: "middle" };
    for (let i = 2; i <= 13; i++) ov.getCell(r3, i).border = { bottom: { style: "medium", color: { argb: "FFF1495C" } } };
    ov.getRow(r3).height = 22;
  };
  section(11, "KEY METRICS");
  ov.getRow(12).height = 4;
  const cards = [{ l: "RECORDS", v: sum.count, f: "#,##0", s: "count" }, ...sum.money.slice(0, 5).map((m) => ({ l: m.h.toUpperCase().replace(/\s*\(RS\.?\)\s*/, " (\u20B9)"), v: m.sum, f: PRO_MONEY_FMT, s: "amount in \u20B9" }))];
  cards.slice(0, 6).forEach((cd, i) => {
    const c1 = 2 + i * 2, a = ov.getCell(13, c1), b = ov.getCell(14, c1), d = ov.getCell(15, c1);
    [13, 14, 15].forEach((r3) => {
      ov.mergeCells(r3, c1, r3, c1 + 1);
      ov.getCell(r3, c1).fill = fill(PRO_CARD);
      ov.getCell(r3, c1 + 1).fill = fill(PRO_CARD);
    });
    a.value = cd.l;
    a.font = { name: PRO_FONT, size: 8.5, bold: true, color: { argb: "FF5A5A78" } };
    a.alignment = { vertical: "middle", horizontal: "left", indent: 1, wrapText: true };
    b.value = cd.v;
    b.numFmt = cd.f;
    b.font = { name: PRO_FONT, size: 18, bold: true, color: { argb: "FF14141C" } };
    b.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    d.value = cd.s;
    d.font = { name: PRO_FONT, size: 8.5, color: { argb: "FF5A5A78" } };
    d.alignment = { horizontal: "left", indent: 1 };
  });
  ov.getRow(13).height = 26;
  ov.getRow(14).height = 30;
  ov.getRow(15).height = 16;
  let r = 17;
  if (sum.ins.length) {
    section(r, "KEY INSIGHTS  (auto-generated)");
    r += 2;
    sum.ins.forEach((t, i) => {
      ov.mergeCells(`C${r}:M${r}`);
      const a = ov.getCell(r, 2), b = ov.getCell(r, 3);
      a.value = t[0];
      b.value = t[1];
      const bg = fill(i % 2 ? "FFFFFF" : PRO_ZEB);
      for (let c = 2; c <= 13; c++) ov.getCell(r, c).fill = bg;
      a.font = { name: PRO_FONT, size: 10, bold: true, color: { argb: "FFF1495C" } };
      a.alignment = { horizontal: "center", vertical: "middle" };
      b.font = { name: PRO_FONT, size: 10, color: { argb: "FF14141C" } };
      b.alignment = { vertical: "middle", wrapText: true };
      ov.getRow(r).height = 20;
      r++;
    });
    r++;
  }
  if (sum.groups.length > 1) {
    section(r, `TOP ${Math.min(10, sum.groups.length)} BY ${main.headers[sum.gi].toUpperCase()}  (${sum.money[0].h})`);
    r += 2;
    const hd = [[2, 5, main.headers[sum.gi], "left"], [6, 8, sum.money[0].h, "right"], [9, 10, "Share %", "right"]];
    hd.forEach(([a, b, t, al]) => {
      ov.mergeCells(r, a, r, b);
      const c = ov.getCell(r, a);
      c.value = t;
      c.font = { name: PRO_FONT, size: 9.5, bold: true, color: { argb: "FF0B0B16" } };
      c.alignment = { horizontal: al, indent: 1 };
      for (let k = a; k <= b; k++) ov.getCell(r, k).fill = fill(PRO_CARD);
    });
    r++;
    const totAbs = Math.abs(sum.money[0].sum) || 1;
    sum.groups.slice(0, 10).forEach((g, i) => {
      [[2, 5, g[0], "left", null], [6, 8, g[1], "right", PRO_MONEY_FMT], [9, 10, Math.abs(g[1]) / totAbs, "right", "0.0%"]].forEach(([a, b, v, al, f]) => {
        ov.mergeCells(r, a, r, b);
        const c = ov.getCell(r, a);
        c.value = v;
        if (f) c.numFmt = f;
        c.font = { name: PRO_FONT, size: 10, color: { argb: "FF14141C" } };
        c.alignment = { horizontal: al, indent: 1 };
        for (let k = a; k <= b; k++) ov.getCell(r, k).fill = fill(i % 2 ? "FFFFFF" : PRO_ZEB);
      });
      r++;
    });
    r++;
    const png = proChartPng(sum.money[0].h + " by " + main.headers[sum.gi], sum.groups.slice(0, 8));
    if (png) {
      section(r, "VISUAL SNAPSHOT");
      r += 2;
      try {
        const id = wb.addImage({ base64: png, extension: "png" });
        ov.addImage(id, { tl: { col: 1, row: r - 1 }, ext: { width: 620, height: 300 } });
        r += 16;
      } catch (e) {
      }
    }
  }
  section(r, "WORKBOOK GUIDE");
  r += 2;
  prepared.forEach((p) => {
    const c = ov.getCell(r, 2);
    c.value = "\u203A  " + p.nm;
    c.font = { name: PRO_FONT, size: 10, bold: true, color: { argb: "FF4F6FE8" } };
    ov.mergeCells(`E${r}:M${r}`);
    const d = ov.getCell(r, 5);
    d.value = `${p.body.filter((x) => !proIsTotalRow(x)).length.toLocaleString("en-IN")} rows  \xB7  ${p.headers.length} columns`;
    d.font = { name: PRO_FONT, size: 10, color: { argb: "FF5A5A78" } };
    r++;
  });
  r++;
  ov.mergeCells(`B${r}:M${r}`);
  const nt = ov.getCell(r, 2);
  nt.value = "Notes: Figures are generated from the books as at the time shown above. Verify against source documents before filing. Negative values are credit notes / reversals.";
  nt.font = { name: PRO_FONT, size: 9, italic: true, color: { argb: "FF5A5A78" } };
  nt.alignment = { wrapText: true, vertical: "top" };
  ov.getRow(r).height = 28;
  r += 2;
  ov.mergeCells(`A${r}:N${r}`);
  const ft = ov.getCell(r, 1);
  ft.value = PRO_BRAND;
  ft.font = { name: PRO_FONT, size: 9, color: { argb: "FFFFFFFF" } };
  ft.alignment = { horizontal: "center", vertical: "middle" };
  for (let c = 1; c <= 14; c++) ov.getCell(r, c).fill = { type: "gradient", gradient: "angle", degree: 0, stops: PRO_GRAD.map((c2, i) => ({ position: i / 2, color: { argb: "FF" + c2 } })) };
  ov.getRow(r).height = 22;
  prepared.forEach((p, pi) => {
    const { headers, body, info, dcols } = p;
    const nc = headers.length;
    const ws = wb.addWorksheet(p.nm, {
      properties: { tabColor: { argb: "FF" + (pi % 2 ? PRO_GRAD[0] : PRO_GRAD[2]) } },
      views: [{ state: "frozen", ySplit: 1, showGridLines: false }],
      pageSetup: { orientation: nc > 7 ? "landscape" : "portrait", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.4, right: 0.4, top: 0.6, bottom: 0.7, header: 0.3, footer: 0.3 } }
    });
    info.forEach((c, i) => {
      ws.getColumn(i + 1).width = c.width;
    });
    headers.forEach((h, i) => {
      const c = ws.getCell(1, i + 1);
      c.value = h;
      c.font = { name: PRO_FONT, size: 9.5, bold: true, color: { argb: "FF0B0B16" } };
      c.fill = fill(PRO_CARD);
      c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      c.border = { bottom: { style: "medium", color: { argb: "FFF1495C" } } };
    });
    ws.getRow(1).height = 30;
    body.forEach((row, bi) => {
      const rr = ws.getRow(2 + bi);
      const tot = proIsTotalRow(row);
      info.forEach((c, ci) => {
        const v = row[ci], cell = rr.getCell(ci + 1);
        if (dcols[ci] && v !== "" && v != null) {
          cell.value = proDateOf(v);
          cell.numFmt = "dd\\-mmm\\-yyyy";
          cell.alignment = { vertical: "middle", horizontal: "center" };
        } else if (c.numeric && v !== "" && proIsNum(v)) {
          cell.value = proToNum(v);
          cell.numFmt = c.kind === "money" ? PRO_MONEY_FMT : c.fmt;
          cell.alignment = { vertical: "middle", horizontal: "right" };
        } else {
          cell.value = v === "" || v == null ? null : v;
          cell.numFmt = "@";
          cell.alignment = { vertical: "middle", horizontal: typeof v === "string" && proIsNum(v) ? "right" : c.center ? "center" : "left", wrapText: true };
        }
        cell.font = { name: PRO_FONT, size: 10, bold: tot, color: { argb: "FF14141C" } };
        if (tot) {
          cell.fill = fill(PRO_CARD);
          cell.border = { top: { style: "thin", color: { argb: "FFF1495C" } }, bottom: thin };
        } else if (bi % 2 === 1) cell.fill = fill(PRO_ZEB);
      });
    });
    if (body.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: nc } };
    ws.pageSetup.printTitlesRow = "1:1";
    ws.headerFooter = { oddFooter: `&L&8${String(co.name || "").replace(/&/g, "&&")}&C&8Page &P of &N&R&8Arctic Books \xB7 &D &T` };
  });
  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
};
const proXlsxFallback = (spec, filename) => {
  const X = window.XLSX;
  const wb = X.utils.book_new();
  spec.sheets.forEach((sh, i) => {
    const N = proNorm(sh);
    if (!N) return;
    const ws = X.utils.aoa_to_sheet([...companyHeaderRows(), [sh.title || spec.title || sh.name || "Report"], [], N.headers, ...N.body]);
    if (sh.cols) ws["!cols"] = sh.cols;
    X.utils.book_append_sheet(wb, ws, String(sh.name || "Sheet" + (i + 1)).replace(/[\\\/\?\*\[\]:]/g, "").substring(0, 31));
  });
  X.writeFile(wb, filename);
};
const proCsv = (spec, filename) => {
  const N = proNorm(spec.sheets[0]);
  if (!N) throw new Error("Nothing to export");
  const info = proAnalyze(N.headers, N.body, null);
  const dcols = N.headers.map((h, ci) => proIsDateCol(h, N.body, ci));
  const body = N.body.map((r) => r.map((v, ci) => {
    if (v === "" || v == null) return "";
    if (dcols[ci]) return proDateTxt(proDateOf(v));
    if (info[ci].numeric && proIsNum(v)) {
      const n = proToNum(v);
      return info[ci].kind === "money" ? n.toFixed(2) : String(n);
    }
    return v;
  }));
  const X = window.XLSX;
  const csv = X.utils.sheet_to_csv(X.utils.aoa_to_sheet([N.headers, ...body]));
  downloadBlob(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }), filename);
};
const pdfSafe = (s) => String(s == null ? "" : s).replace(/₹/g, "Rs. ").replace(/→/g, "->").replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u00FF\u2013\u2014\u2022]/g, "");
const proFmtPdf = (v, kind) => {
  if (v === "" || v == null) return "";
  if (!proIsNum(v)) return pdfSafe(v);
  const n = proToNum(v);
  if (kind === "money") return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (kind === "int") return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
};
const proPdf = (spec, filename) => {
  const { jsPDF } = window.jspdf;
  const { co, addr } = proCompanyInfo();
  const list = (spec.pdfSheets || spec.sheets).map((sh) => ({ sh, N: proNorm(sh) })).filter((x) => x.N);
  if (!list.length) throw new Error("Nothing to export");
  const prepared = list.map(({ sh, N }) => {
    let keep = N.headers.map((_, i) => i);
    if (sh.pdfCols) {
      const idx = sh.pdfCols.map((nm) => N.headers.indexOf(nm)).filter((i) => i >= 0);
      if (idx.length) keep = idx;
    }
    const headers = keep.map((i) => N.headers[i]);
    const body = N.body.map((r) => keep.map((i) => r[i]));
    return { sh, headers, body, info: proAnalyze(headers, body, null) };
  });
  const maxCols = Math.max(...prepared.map((p) => p.headers.length));
  const orient = maxCols > 6 ? "l" : "p";
  const size = maxCols > 18 ? "a3" : "a4";
  const doc = new jsPDF({ orientation: orient, unit: "mm", format: size });
  const PW = doc.internal.pageSize.getWidth(), PH = doc.internal.pageSize.getHeight();
  const ML = 10, MR = 10;
  const gen = proNowText();
  const firstPages = [];
  prepared.forEach((p, si) => {
    if (si > 0) doc.addPage();
    const startPage = doc.internal.getNumberOfPages();
    firstPages.push(startPage);
    const title = p.sh.title || si === 0 && spec.title || p.sh.name || "Report";
    const grad = (x, y2, w, h) => {
      const n = 60, cs = [[79, 111, 232], [179, 79, 194], [241, 73, 92]];
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1), k = t < 0.5 ? 0 : 1, u = t < 0.5 ? t * 2 : (t - 0.5) * 2;
        const c = cs[k].map((v, j) => Math.round(v + (cs[k + 1][j] - v) * u));
        doc.setFillColor(c[0], c[1], c[2]);
        doc.rect(x + w * i / n, y2, w / n + 0.3, h, "F");
      }
    };
    grad(0, 0, PW, 24);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text("ARCTIC BOOKS", ML, 10.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const tl = doc.splitTextToSize(pdfSafe(title + (spec.period ? "  -  " + String(spec.period).replace(/^Period:\s*/, "") : "")), PW - ML - MR - 70);
    doc.text(tl.slice(0, 2), ML, 16);
    doc.setFontSize(8);
    doc.text("Complete Accounting  |  arcticbooks-in.web.app", PW - MR, 10.5, { align: "right" });
    doc.text("Generated: " + gen, PW - MR, 16, { align: "right" });
    let y = 29;
    doc.setFillColor(241, 241, 250);
    doc.roundedRect(ML, y - 4, PW - ML - MR, 9, 1.5, 1.5, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(90, 90, 120);
    doc.text("COMPANY", ML + 3, y + 1.6);
    doc.setTextColor(20, 20, 28);
    doc.text(pdfSafe(co.name || "-"), ML + 22, y + 1.6);
    doc.setTextColor(90, 90, 120);
    doc.text("GSTIN", PW / 2, y + 1.6);
    doc.setTextColor(20, 20, 28);
    doc.text(pdfSafe(co.gstin || "-"), PW / 2 + 14, y + 1.6);
    y += 12;
    const sm = proSummarise({ headers: p.headers, body: p.body, info: p.info });
    const kp = [["RECORDS", String(sm.count)], ...sm.money.slice(0, 3).map((m) => [pdfSafe(m.h).toUpperCase(), "Rs. " + Number(m.sum).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })])];
    const cw = (PW - ML - MR - (kp.length - 1) * 3) / kp.length;
    kp.forEach((k, i) => {
      const x = ML + i * (cw + 3);
      doc.setFillColor(241, 241, 250);
      doc.roundedRect(x, y, cw, 13, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(90, 90, 120);
      doc.text(k[0].slice(0, 34), x + 3, y + 4.5);
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 28);
      doc.text(k[1], x + 3, y + 10.5);
    });
    y += 17;
    doc.setDrawColor(241, 73, 92);
    doc.setLineWidth(0.5);
    doc.line(ML, y, PW - MR, y);
    y += 3;
    const nc = p.headers.length;
    const fs = nc > 18 ? 5.5 : nc > 13 ? 6.5 : nc > 9 ? 7.5 : 8.5;
    const totals = /* @__PURE__ */ new Set();
    p.body.forEach((r, i) => {
      if (proIsTotalRow(r)) totals.add(i);
    });
    const bodyFmt = p.body.map((r) => r.map((v, ci) => proFmtPdf(v, p.info[ci].kind)));
    const colStyles = {};
    p.info.forEach((c, i) => {
      colStyles[i] = { halign: c.numeric ? "right" : c.center ? "center" : "left" };
    });
    doc.autoTable({
      head: [p.headers.map(pdfSafe)],
      body: bodyFmt,
      startY: y,
      margin: { left: ML, right: MR, top: 20, bottom: 16 },
      styles: { font: "helvetica", fontSize: fs, cellPadding: { top: 1.6, bottom: 1.6, left: 1.8, right: 1.8 }, textColor: [20, 20, 28], lineColor: [228, 228, 240], lineWidth: 0.12, valign: "middle", overflow: "linebreak" },
      headStyles: { fillColor: [241, 241, 250], textColor: [11, 11, 22], fontStyle: "bold", halign: "center", lineColor: [241, 73, 92], lineWidth: 0.2 },
      alternateRowStyles: { fillColor: [248, 248, 252] },
      columnStyles: colStyles,
      showHead: "everyPage",
      didParseCell: (d) => {
        if (d.section === "head" && p.info[d.column.index] && p.info[d.column.index].numeric) d.cell.styles.halign = "right";
        if (d.section === "body" && totals.has(d.row.index)) {
          d.cell.styles.fontStyle = "bold";
          d.cell.styles.fillColor = [241, 241, 250];
        }
      },
      didDrawPage: () => {
        const pg = doc.internal.getCurrentPageInfo().pageNumber;
        if (pg > startPage) {
          grad(0, 0, PW, 2);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(30, 42, 90);
          doc.text(pdfSafe(co.name || ""), ML, 9);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(107, 114, 128);
          doc.text(pdfSafe(title), PW - MR, 9, { align: "right" });
          doc.setDrawColor(213, 218, 240);
          doc.setLineWidth(0.3);
          doc.line(ML, 12, PW - MR, 12);
        }
      }
    });
  });
  const total = doc.getNumberOfPages();
  for (let pg = 1; pg <= total; pg++) {
    doc.setPage(pg);
    doc.setDrawColor(213, 218, 240);
    doc.setLineWidth(0.3);
    doc.line(ML, PH - 11, PW - MR, PH - 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text(pdfSafe(co.name || ""), ML, PH - 6.5);
    doc.text(`Page ${pg} of ${total}`, PW / 2, PH - 6.5, { align: "center" });
    doc.text("Arctic Books  |  arcticbooks-in.web.app", PW - MR, PH - 6.5, { align: "right" });
  }
  doc.save(filename);
};
const PRO_FMT_LABEL = { xlsx: "Excel", pdf: "PDF", csv: "CSV" };
const proExport = async (fmt2, spec, base) => {
  const f = PRO_FMT_LABEL[fmt2] ? fmt2 : "xlsx";
  const name = String(base || "Report").replace(/\.(xlsx|csv|pdf)$/i, "") + "." + f;
  try {
    if (f === "pdf") proPdf(spec, name);
    else if (f === "csv") proCsv(spec, name);
    else if (window.ExcelJS) await proXlsx(spec, name);
    else proXlsxFallback(spec, name);
    toast.success(`Exported as ${PRO_FMT_LABEL[f]} \u2014 ${name}`);
    return true;
  } catch (err) {
    console.error(err);
    toast.error("Export failed: " + (err.message || err));
    return false;
  }
};
const proWbToSpec = (wb, meta) => ({
  ...meta,
  sheets: wb.SheetNames.map((n) => ({
    name: n,
    aoa: window.XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: "" }),
    cols: wb.Sheets[n]["!cols"]
  }))
});
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
