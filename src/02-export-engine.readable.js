const fmt = (n) => "\u20B9" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const companyHeaderRows = () => {
  const co = S.get(SK.CO, {});
  const addr = [co.address, co.city, co.state, co.pin].filter(Boolean).join(", ");
  const rows = [];
  if (co.name) rows.push([co.name]);
  if (addr) rows.push([addr]);
  if (co.gstin) rows.push(["GSTIN: " + co.gstin]);
  if (rows.length) rows.push([]);
  return rows;
};
const fmtN = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const regSalesPdf = (invoices) => {
  const rows = [["Date", "Invoice No", "Type", "Customer", "GSTIN", "Taxable (Rs.)", "CGST (Rs.)", "SGST (Rs.)", "IGST (Rs.)", "Total Tax (Rs.)", "Invoice Total (Rs.)", "Status"]];
  const T = [0, 0, 0, 0, 0, 0];
  invoices.forEach((inv) => {
    var _a, _b;
    const items = (inv.items || []).filter((r) => r.desc);
    if (!items.length) return;
    const isNG = inv.docType === "NON GST INVOICE", isCN = inv.docType === "CREDIT NOTE", sign = isCN ? -1 : 1, gt = inv.gstType || "INTRA";
    const dt = inv.isB2C ? "B2C" : isNG ? "Non-GST" : isCN ? "Credit Note" : inv.docType === "DEBIT NOTE" ? "Debit Note" : "Tax Invoice";
    let tax = 0, gst = 0, ng = 0;
    items.forEach((r) => {
      if (isNG) {
        ng += (parseFloat(r.qty) || 0) * (parseFloat(r.rate) || 0);
      } else {
        tax += sign * (parseFloat(r.taxable) || 0);
        gst += sign * (parseFloat(r.gstAmt) || 0);
      }
    });
    const cg = gt === "INTRA" ? gst / 2 : 0, ig = gt !== "INTRA" ? gst : 0;
    const total = Number(isNG ? ng : getGrand(inv)) || 0;
    rows.push([fmtDate(inv.date), inv.invNo || "", dt, ((_a = inv.billTo) == null ? void 0 : _a.name) || "", (((_b = inv.billTo) == null ? void 0 : _b.gstin) || "").toUpperCase(), tax.toFixed(2), cg.toFixed(2), cg.toFixed(2), ig.toFixed(2), gst.toFixed(2), total.toFixed(2), inv.status || "Sent"]);
    T[0] += tax;
    T[1] += cg;
    T[2] += cg;
    T[3] += ig;
    T[4] += gst;
    T[5] += total;
  });
  rows.push(["TOTAL", "", "", "", "", ...T.map((x) => x.toFixed(2)), ""]);
  return rows;
};
const regPurchasePdf = (expenses) => {
  const rows = [["Date", "Vendor", "GSTIN", "Bill No", "Category", "Taxable (Rs.)", "GST (Rs.)", "Bill Total (Rs.)", "Paid (Rs.)", "Balance (Rs.)", "Status"]];
  const T = [0, 0, 0, 0, 0];
  expenses.forEach((e) => {
    const tx = parseFloat(e.taxable) || 0, g = parseFloat(e.gstAmt) || 0, tot = parseFloat(e.total) || 0, pd = expPaid(e), du = expDue(e);
    rows.push([fmtDate(e.date), e.vendor || "", (e.vendorGSTIN || "").toUpperCase(), e.billNo || "", e.category || "", tx.toFixed(2), g.toFixed(2), tot.toFixed(2), pd.toFixed(2), du.toFixed(2), e.payStatus || ""]);
    T[0] += tx;
    T[1] += g;
    T[2] += tot;
    T[3] += pd;
    T[4] += du;
  });
  rows.push(["TOTAL", "", "", "", "", ...T.map((x) => x.toFixed(2)), ""]);
  return rows;
};
const regPOPdf = (orders) => {
  const rows = [["PO No", "PO Date", "Vendor", "Delivery By", "Sub Total (Rs.)", "Taxes (Rs.)", "Grand Total (Rs.)", "Status"]];
  const T = [0, 0, 0];
  orders.forEach((po) => {
    var _a;
    const sub = (po.items || []).reduce((t, r) => t + (r.qty || 0) * (r.rate || 0), 0), tx = Number(po.taxes || 0);
    rows.push([po.poNo || "", fmtDate(po.date), ((_a = po.vendorTo) == null ? void 0 : _a.name) || "", fmtDate(po.deliveryDate), sub.toFixed(2), tx.toFixed(2), (sub + tx).toFixed(2), po.status || "Draft"]);
    T[0] += sub;
    T[1] += tx;
    T[2] += sub + tx;
  });
  rows.push(["TOTAL", "", "", "", ...T.map((x) => x.toFixed(2)), ""]);
  return rows;
};
const PRO_C = { navy: "1E2A5A", primary: "3B57C9", soft: "E8ECFF", zebra: "F7F8FE", line: "D5DAF0", text: "1B1F3B", muted: "6B7280" };
const PRO_NUM_RE = /^-?\d{1,3}(,\d{2,3})*(\.\d+)?$|^-?\d+(\.\d+)?$/;
const proIsNum = (v) => typeof v === "number" ? isFinite(v) : typeof v === "string" && PRO_NUM_RE.test(v.trim());
const proToNum = (v) => typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""));
const PRO_TEXTY = /gstin|hsn|sac|\bpin\b|code|voucher|ref|invoice no|bill no|inv no|po number|document|txn|phone|mobile|date|month|bucket|status|sl\.?\s?no|s\.?\s?no\b|\bno\.?$/i;
const PRO_MONEY = /\(rs|amount|value|taxable|outstanding|payable|gross|debit|credit|cgst|sgst|igst|net position|purchased/i;
const PRO_TOTAL_RE = /^\s*(grand\s+)?total\b|^\s*of which\b|^\s*net\b/i;
const proIsTotalRow = (r) => {
  const f = (r || []).find((c) => c !== "" && c !== null && c !== void 0);
  return typeof f === "string" && PRO_TOTAL_RE.test(f);
};
const proNorm = (sh) => {
  const aoa = (sh.aoa || []).map((r) => Array.isArray(r) ? r : []);
  const ne = (r) => r.filter((c) => c !== "" && c !== null && c !== void 0).length;
  let hi = sh.h0 ? 0 : aoa.findIndex((r) => ne(r) >= 2);
  if (hi < 0) hi = aoa.findIndex((r) => ne(r) >= 1);
  if (hi < 0) return null;
  let headers = aoa[hi].map((c) => c == null ? "" : String(c));
  let n = headers.length;
  while (n > 0 && headers[n - 1] === "") n--;
  if (n === 0) return null;
  headers = headers.slice(0, n);
  let body = aoa.slice(hi + 1).map((r) => {
    const o = [];
    for (let i = 0; i < n; i++) o.push(r[i] == null ? "" : r[i]);
    return o;
  });
  while (body.length && ne(body[body.length - 1]) === 0) body.pop();
  return { headers, body };
};
const proAnalyze = (headers, body, cols) => headers.map((h, ci) => {
  const hs = String(h || "");
  const vals = body.map((r) => r[ci]).filter((v) => v !== "" && v !== null && v !== void 0);
  const allNum = vals.length > 0 && vals.every(proIsNum);
  const texty = PRO_TEXTY.test(hs) && !/\(rs|amount|value|balance|payable|outstanding/i.test(hs);
  const numeric = allNum && !texty;
  let kind = "text", fmt2 = "@";
  if (numeric) {
    if (/%/.test(hs)) {
      kind = "pct";
      fmt2 = "0.##";
    } else if (PRO_MONEY.test(hs) || vals.some((v) => /\.\d{2}$/.test(String(v).trim()))) {
      kind = "money";
      fmt2 = "#,##0.00;[Red]-#,##0.00";
    } else if (vals.every((v) => Number.isInteger(proToNum(v)))) {
      kind = "int";
      fmt2 = "#,##0";
    } else {
      kind = "num";
      fmt2 = "#,##0.##";
    }
  }
  const center = !numeric && /^(sl|s)\.?\s?no\.?$|status|type|unit|^s$|date|bucket|month/i.test(hs.trim());
  let width = cols && cols[ci] && cols[ci].wch ? cols[ci].wch : 0;
  if (!width) {
    const mx = Math.max(hs.length * 1.05, ...vals.slice(0, 300).map((v) => String(v).length));
    width = Math.min(46, Math.max(10, Math.ceil(mx) + 2));
  }
  if (kind === "money") width = Math.max(width, 15);
  width = Math.max(width, 10);
  return { numeric, kind, fmt: fmt2, center, width };
});
const proCompanyInfo = () => {
  const co = S.get(SK.CO, {});
  const addr = [co.address, co.city, co.state, co.pin].filter(Boolean).join(", ");
  const line2 = [addr, co.gstin ? "GSTIN: " + co.gstin : "", co.phone ? "Ph: " + co.phone : "", co.email || ""].filter(Boolean).join("   |   ");
  return { co, addr, line2 };
};
const proNowText = () => (/* @__PURE__ */ new Date()).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const proXlsx = async (spec, filename) => {
  const EJ = window.ExcelJS;
  const { co, line2 } = proCompanyInfo();
  const wb = new EJ.Workbook();
  wb.creator = co.name || "Accounts";
  wb.created = /* @__PURE__ */ new Date();
  const thin = { style: "thin", color: { argb: "FF" + PRO_C.line } };
  let made = 0;
  spec.sheets.forEach((sh, si) => {
    const N = proNorm(sh);
    if (!N) return;
    const { headers, body } = N;
    const info = proAnalyze(headers, body, sh.cols);
    const nc = headers.length;
    const nm = String(sh.name || "Sheet" + (si + 1)).replace(/[\\\/\?\*\[\]:]/g, "").substring(0, 31) || "Sheet" + (si + 1);
    const ws = wb.addWorksheet(nm, {
      properties: { tabColor: { argb: "FF" + (si === 0 ? PRO_C.primary : "7C93EE") } },
      views: [{ showGridLines: false }],
      pageSetup: {
        orientation: nc > 7 ? "landscape" : "portrait",
        paperSize: 9,
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.4, right: 0.4, top: 0.6, bottom: 0.7, header: 0.3, footer: 0.3 }
      }
    });
    info.forEach((c, i) => {
      ws.getColumn(i + 1).width = c.width;
    });
    const merge = (r3) => {
      if (nc > 1) ws.mergeCells(r3, 1, r3, nc);
    };
    let r = 1;
    if (spec.band !== false) {
      merge(r);
      let c = ws.getCell(r, 1);
      c.value = co.name || "Company";
      c.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
      c.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
      for (let i = 1; i <= nc; i++) ws.getCell(r, i).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + PRO_C.navy } };
      ws.getRow(r).height = 30;
      r++;
      merge(r);
      c = ws.getCell(r, 1);
      c.value = line2 || " ";
      c.font = { name: "Calibri", size: 9, color: { argb: "FFC9D1F5" } };
      c.alignment = { vertical: "middle", horizontal: "left", indent: 1, wrapText: true };
      for (let i = 1; i <= nc; i++) ws.getCell(r, i).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + PRO_C.navy } };
      ws.getRow(r).height = 20;
      r++;
      merge(r);
      c = ws.getCell(r, 1);
      c.value = sh.title || si === 0 && spec.title || sh.name || "Report";
      c.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FF" + PRO_C.navy } };
      c.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
      ws.getRow(r).height = 28;
      r++;
      merge(r);
      c = ws.getCell(r, 1);
      c.value = [spec.period, "Generated on " + proNowText()].filter(Boolean).join("   \u2022   ");
      c.font = { name: "Calibri", size: 9, italic: true, color: { argb: "FF" + PRO_C.muted } };
      c.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
      ws.getRow(r).height = 18;
      r++;
      ws.getRow(r).height = 6;
      r++;
    }
    const hr = r;
    headers.forEach((h, i) => {
      const c = ws.getCell(hr, i + 1);
      c.value = h;
      c.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + PRO_C.primary } };
      c.alignment = { vertical: "middle", horizontal: info[i].numeric ? "right" : info[i].center ? "center" : "left", wrapText: true };
      c.border = { top: thin, bottom: { style: "medium", color: { argb: "FF" + PRO_C.navy } }, left: { style: "thin", color: { argb: "FF5C74D6" } }, right: { style: "thin", color: { argb: "FF5C74D6" } } };
    });
    ws.getRow(hr).height = 34;
    let lines = 0;
    body.forEach((row, bi) => {
      const rr = ws.getRow(hr + 1 + bi);
      const tot = proIsTotalRow(row);
      if (!tot && row.some((v) => v !== "" && v !== null && v !== void 0)) lines++;
      info.forEach((c, ci) => {
        let v = row[ci];
        const cell = rr.getCell(ci + 1);
        if (c.numeric && v !== "" && proIsNum(v)) {
          cell.value = proToNum(v);
          cell.numFmt = c.fmt;
          cell.alignment = { vertical: "middle", horizontal: "right" };
        } else {
          cell.value = v === "" || v == null ? null : v;
          const looksNum = typeof v === "string" && proIsNum(v);
          cell.alignment = { vertical: "middle", horizontal: looksNum ? "right" : c.center ? "center" : "left", wrapText: true };
        }
        cell.font = { name: "Calibri", size: 10, bold: tot, color: { argb: "FF" + PRO_C.text } };
        cell.border = tot ? { top: { style: "medium", color: { argb: "FF" + PRO_C.primary } }, bottom: thin, left: thin, right: thin } : { bottom: thin, left: thin, right: thin };
        if (tot) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + PRO_C.soft } };
        else if (bi % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + PRO_C.zebra } };
      });
    });
    const endR = hr + body.length + 2;
    if (nc > 1) ws.mergeCells(endR, 1, endR, nc);
    const ec = ws.getCell(endR, 1);
    ec.value = `\u2014 ${lines} record(s)  \u2022  End of report \u2014`;
    ec.font = { name: "Calibri", size: 9, italic: true, color: { argb: "FF" + PRO_C.muted } };
    ec.alignment = { horizontal: "center" };
    ws.views = [{ state: "frozen", ySplit: hr, showGridLines: false }];
    if (body.length) ws.autoFilter = { from: { row: hr, column: 1 }, to: { row: hr, column: nc } };
    ws.pageSetup.printTitlesRow = `${hr}:${hr}`;
    ws.headerFooter = { oddFooter: `&L&8${String(co.name || "").replace(/&/g, "&&")}&C&8Page &P of &N&R&8Generated &D &T` };
    made++;
  });
  if (!made) throw new Error("Nothing to export");
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
  const X = window.XLSX;
  const csv = X.utils.sheet_to_csv(X.utils.aoa_to_sheet([N.headers, ...N.body]));
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
    doc.setFillColor(59, 87, 201);
    doc.rect(0, 0, PW, 3, "F");
    doc.setTextColor(30, 42, 90);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(pdfSafe(co.name || "Company"), ML, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    let y = 16;
    if (addr) {
      doc.text(pdfSafe(addr), ML, y);
      y += 4;
    }
    if (co.gstin) {
      doc.text("GSTIN: " + pdfSafe(co.gstin), ML, y);
      y += 4;
    }
    doc.text("Generated: " + gen, PW - MR, 12, { align: "right" });
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(27, 31, 59);
    const tl = doc.splitTextToSize(pdfSafe(title), PW - ML - MR);
    tl.forEach((t, i) => {
      doc.text(t, ML, y + 3 + i * 5);
    });
    y += 3 + tl.length * 5;
    if (spec.period) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(pdfSafe(spec.period), ML, y + 1);
      y += 4;
    }
    doc.setDrawColor(213, 218, 240);
    doc.setLineWidth(0.3);
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
      styles: { font: "helvetica", fontSize: fs, cellPadding: { top: 1.6, bottom: 1.6, left: 1.8, right: 1.8 }, textColor: [27, 31, 59], lineColor: [213, 218, 240], lineWidth: 0.15, valign: "middle", overflow: "linebreak" },
      headStyles: { fillColor: [59, 87, 201], textColor: [255, 255, 255], fontStyle: "bold", halign: "center", lineColor: [59, 87, 201] },
      alternateRowStyles: { fillColor: [247, 248, 254] },
      columnStyles: colStyles,
      showHead: "everyPage",
      didParseCell: (d) => {
        if (d.section === "head" && p.info[d.column.index] && p.info[d.column.index].numeric) d.cell.styles.halign = "right";
        if (d.section === "body" && totals.has(d.row.index)) {
          d.cell.styles.fontStyle = "bold";
          d.cell.styles.fillColor = [232, 236, 255];
        }
      },
      didDrawPage: () => {
        const pg = doc.internal.getCurrentPageInfo().pageNumber;
        if (pg > startPage) {
          doc.setFillColor(59, 87, 201);
          doc.rect(0, 0, PW, 2, "F");
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
    doc.text(pdfSafe(spec.title || ""), PW - MR, PH - 6.5, { align: "right" });
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
