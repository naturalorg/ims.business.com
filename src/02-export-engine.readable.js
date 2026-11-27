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
const PRO_FONT = "Arial Nova Light";
const PRO_MONEY_FMT = "#,##0.00_);[Red]\\(#,##0.00\\)";
const PRO_GRAD = ["4F6FE8", "B34FC2", "F1495C"];
const PRO_BRAND = "Arctic Books  \xB7  Complete Accounting & GST Software  |  arcticbooks-in.web.app";
const PRO_CARD = "F1F1FA", PRO_ZEB = "F8F8FC";
const proDateOf = (v) => {
  if (v instanceof Date) return v;
  const s = String(v || "").trim();
  let m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1], 12));
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12));
  return null;
};
const PRO_MON3 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const proDateTxt = (d) => String(d.getUTCDate()).padStart(2, "0") + "-" + PRO_MON3[d.getUTCMonth()] + "-" + d.getUTCFullYear();
const proIsDateCol = (h, body, ci) => {
  if (!/date/i.test(h)) return false;
  const vals = body.map((r) => r[ci]).filter((v) => v !== "" && v != null);
  return vals.length > 0 && vals.every((v) => proDateOf(v));
};
