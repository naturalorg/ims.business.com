const fmtDateDMY = (d) => {
  if (!d) return "";
  if (typeof d !== "string") return fmtDate(d) || "";
  const p = d.split("-");
  if (p.length !== 3) return d;
  const mi = parseInt(p[1], 10) - 1;
  return `${p[2].padStart(2, "0")} ${MON3[mi] || p[1]} ${p[0]}`;
};
const payTermsLabel = (inv) => {
  if (inv.paymentTerms) return inv.paymentTerms;
  if (!inv.date || !inv.dueDate) return "\u2014";
  const n = Math.round((new Date(inv.dueDate) - new Date(inv.date)) / 864e5);
  if (isNaN(n)) return "\u2014";
  return n <= 0 ? "Due on receipt" : "Net " + n;
};
const placeOfSupplyLabel = (inv, co) => {
  var _a, _b;
  if (inv.placeOfSupply) return inv.placeOfSupply;
  const sc = stateCode((((_a = inv.billTo) == null ? void 0 : _a.gstin) || "").trim());
  if (sc && STATE_CODES[sc]) return `${STATE_CODES[sc]} (${sc})`;
  return ((_b = inv.billTo) == null ? void 0 : _b.state) || co.state || "";
};
const amountInWordsIN = (amt) => {
  const n = Math.abs(Number(amt) || 0);
  let rup = Math.floor(n + 1e-9), paise = Math.round((n - rup) * 100);
  if (paise >= 100) {
    rup += 1;
    paise = 0;
  }
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (x) => x < 20 ? ones[x] : tens[Math.floor(x / 10)] + (x % 10 ? "-" + ones[x % 10] : "");
  const three = (x) => x >= 100 ? ones[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " + two(x % 100) : "") : two(x);
  const cr = Math.floor(rup / 1e7), lk = Math.floor(rup % 1e7 / 1e5), th2 = Math.floor(rup % 1e5 / 1e3), rest = rup % 1e3;
  const words = [cr && three(cr) + " Crore", lk && two(lk) + " Lakh", th2 && two(th2) + " Thousand", rest && three(rest)].filter(Boolean).join(" ");
  let s = "Indian Rupee " + (words || "Zero");
  if (paise) s += " and " + two(paise) + " Paise";
  return s + " Only";
};
const makePDF = (inv, co, terms) => {
  try {
    inv = fcView(inv);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const PW = 210, PH = 297;
    const L = 6.5, R = PW - 6.5, FT = 6.5, FB = PH - 6.5, CW = R - L;
    const PAD = 3.5, MIDX = 105, SPLIT = 117.5;
    const CONT_Y = 22;
    const DARK = [25, 25, 25], MED = [85, 85, 85], LGRAY = [140, 140, 140], GRID = [150, 150, 150], BAR = [238, 238, 238], RED = [200, 35, 35];
    const rawType = inv.docType || "TAX INVOICE";
    const isCN = rawType === "CREDIT NOTE", isDN = rawType === "DEBIT NOTE", isNote = isCN || isDN;
    const isNonGST = rawType === "NON GST INVOICE";
    const gstType = inv.gstType || "INTRA";
    const docTitle = isCN ? "Credit Note" : isDN ? "Debit Note" : inv.isB2C ? "TAX INVOICE (B2C)" : rawType;
    const items = (inv.items || []).filter((r) => r.desc);
    let DRY = false;
    const font = (b, i) => doc.setFont("helvetica", b && i ? "bolditalic" : b ? "bold" : i ? "italic" : "normal");
    const T = (s, x, y, o = {}) => {
      if (DRY) return;
      const { size = 7.5, bold = false, italic = false, color = DARK, align = "left" } = o;
      font(bold, italic);
      doc.setFontSize(size);
      doc.setTextColor(...color);
      doc.text(String(s), x, y, { align });
    };
    const wrap = (s, w, size = 7.5, bold = false, italic = false) => {
      font(bold, italic);
      doc.setFontSize(size);
      return doc.splitTextToSize(String(s == null ? "" : s), w);
    };
    const tw = (s, size, bold = false, italic = false) => {
      font(bold, italic);
      doc.setFontSize(size);
      return doc.getTextWidth(String(s));
    };
    const HL = (y, x1 = L, x2 = R, w = 0.25, c = GRID) => {
      if (DRY) return;
      doc.setDrawColor(...c);
      doc.setLineWidth(w);
      doc.line(x1, y, x2, y);
    };
    const VL = (x, y1, y2, w = 0.25, c = GRID) => {
      if (DRY) return;
      doc.setDrawColor(...c);
      doc.setLineWidth(w);
      doc.line(x, y1, x, y2);
    };
    const FILL = (x, y, w, h, c) => {
      if (DRY) return;
      doc.setFillColor(...c);
      doc.rect(x, y, w, h, "F");
    };
    const imgFmt = (d) => d.startsWith("data:image/png") ? "PNG" : d.startsWith("data:image/webp") ? "WEBP" : "JPEG";
    const money = (str, xr, y, size = 7.5, bold = false, color = DARK) => {
      if (DRY) return;
      const numW = tw(str, size, bold);
      const em = size * 0.3528, gw = em * 0.5, h = em * 0.72, gap = em * 0.16;
      const x0 = xr - numW - gap - gw, top = y - h;
      T(str, xr, y, { size, bold, color, align: "right" });
      doc.setDrawColor(...color);
      doc.setLineWidth(Math.max(0.12, em * (bold ? 0.085 : 0.065)));
      doc.line(x0, top, x0 + gw, top);
      doc.line(x0, top + h * 0.2, x0 + gw, top + h * 0.2);
      const cx = x0 + gw * 0.5, cy2 = top + h * 0.25, rx = gw * 0.42, ry2 = h * 0.25;
      let px = cx, py = top;
      for (let i = 1; i <= 10; i++) {
        const a = -Math.PI / 2 + Math.PI * i / 10, nx = cx + rx * Math.cos(a), ny = cy2 + ry2 * Math.sin(a);
        doc.line(px, py, nx, ny);
        px = nx;
        py = ny;
      }
      doc.line(cx, top + h * 0.5, x0, top + h * 0.5);
      doc.line(x0 + gw * 0.15, top + h * 0.5, x0 + gw * 0.95, top + h);
    };
    let Y = FT;
    const newPage = () => {
      doc.addPage();
      Y = CONT_Y;
    };
    const logoBox = 24, logoX = L + PAD, logoY = FT + 2.5;
    const textX = co.logo ? logoX + logoBox + 5 : L + PAD;
    if (co.logo) {
      try {
        let w = logoBox, h = logoBox;
        try {
          const p = doc.getImageProperties(co.logo);
          const r = p.width / p.height;
          if (r > 1) h = logoBox / r;
          else w = logoBox * r;
        } catch (e) {
        }
        doc.addImage(co.logo, imgFmt(co.logo), logoX + (logoBox - w) / 2, logoY + (logoBox - h) / 2, w, h);
      } catch (e) {
      }
    }
    const coName = co.name || "Your Company";
    const pan = co.panNo || (co.gstin && co.gstin.length >= 12 ? co.gstin.substring(2, 12) : "");
    const coLines = [];
    if (co.formerName) coLines.push("(Formerly known as " + co.formerName + ")");
    String(co.address || "").split("\n").map((s) => s.trim()).filter(Boolean).forEach((s) => coLines.push(s));
    const cityLine = [[co.city, co.pin].filter(Boolean).join(" - "), co.state, "India"].filter(Boolean).join(", ");
    if (cityLine) coLines.push(cityLine);
    if (co.gstin || pan) coLines.push([co.gstin ? "GSTIN " + co.gstin : "", pan ? "PAN:" + pan : ""].filter(Boolean).join(", "));
    const webMail = [co.website ? "web: " + co.website : "", co.email ? "Email: " + co.email : "", co.phone ? "Ph: " + co.phone : ""].filter(Boolean).join(", ");
    if (webMail) coLines.push(webMail);
    const titleSize0 = 21;
    let titleSize = titleSize0;
    while (titleSize > 13 && tw(docTitle, titleSize) > 60) titleSize -= 1;
    const coBlockW = R - PAD - 62 - textX;
    T(coName, textX, FT + 7, { size: 13, bold: true });
    let cy = FT + 10.8;
    coLines.forEach((l) => {
      wrap(l, coBlockW, 7).forEach((s) => {
        T(s, textX, cy, { size: 7, color: DARK });
        cy += 3.2;
      });
    });
    const hdrBottom = Math.max(FT + 30, cy + 1.5, logoY + logoBox + 2.5);
    T(docTitle, R - PAD, hdrBottom - 3.4, { size: titleSize, align: "right" });
    Y = hdrBottom;
    HL(Y);
    const metaL = [], metaR = [];
    if (isNote) {
      metaL.push(["#", inv.invNo || "\u2014"]);
      metaL.push([isCN ? "Credit Date" : "Debit Date", fmtDateDMY(inv.date) || "\u2014"]);
      if (inv.poNo) metaL.push(["Ref#", inv.poNo]);
      if (inv.origInvNo) metaL.push(["Invoice#", inv.origInvNo]);
      if (inv.origInvDate) metaL.push(["Invoice Date", fmtDateDMY(inv.origInvDate)]);
    } else {
      metaL.push(["INVOICE NO", inv.invNo || "\u2014"]);
      metaL.push(["INVOICE DATE", fmtDateDMY(inv.date) || "\u2014"]);
      metaL.push(["TERMS", payTermsLabel(inv)]);
      if (inv.poNo) metaR.push(["PO No", inv.poNo]);
    }
    metaR.unshift(["Place Of Supply", placeOfSupplyLabel(inv, co) || "\u2014"]);
    const mRow = 4.2, mTop = Y;
    const mH = Math.max(metaL.length, metaR.length) * mRow + 4.2;
    metaL.forEach(([k, v], i) => {
      const y = mTop + 4.4 + i * mRow;
      T(k, L + PAD, y, { color: MED });
      T(": " + v, L + PAD + 45.5, y, { bold: true });
    });
    metaR.forEach(([k, v], i) => {
      const y = mTop + 4.4 + i * mRow;
      T(k, MIDX + PAD, y, { color: MED });
      T(": " + v, MIDX + PAD + 41, y, { bold: true });
    });
    VL(MIDX, mTop, mTop + mH);
    Y = mTop + mH;
    HL(Y);
    const bt = inv.billTo || {};
    const st = inv.sameAddress ? bt : inv.shipTo || bt;
    const partyLines = (d, isBill, w) => {
      const out = [];
      out.push({ t: d.name || "", bold: isBill, size: isBill ? 9 : 7.5 });
      String(d.address || "").split("\n").map((s) => s.trim()).filter(Boolean).forEach((s) => wrap(s, w, 7.5).forEach((x) => out.push({ t: x })));
      if (d.city) out.push({ t: d.city });
      const ps = [d.pin, d.state].filter(Boolean).join(" ");
      if (ps) out.push({ t: ps });
      if (isBill && (d.city || d.state || d.pin)) out.push({ t: "India" });
      if (isBill && d.gstin) out.push({ t: "GSTIN " + d.gstin });
      if (d.phone) out.push({ t: "Ph: " + d.phone });
      if (d.email) out.push({ t: d.email });
      return out;
    };
    const colWBill = isNote ? CW - 2 * PAD : MIDX - L - 2 * PAD;
    const billLines = partyLines(bt, true, colWBill);
    const shipLines = isNote ? [] : partyLines(st, false, R - MIDX - 2 * PAD);
    const barH = 4.6;
    FILL(L, Y, CW, barH, BAR);
    T("Bill To", L + PAD, Y + 3.3, { bold: true });
    if (!isNote) T("Ship To", MIDX + PAD, Y + 3.3, { bold: true });
    HL(Y + barH);
    const partyTop = Y + barH;
    const lineH = 3.9;
    const heightOf = (ls) => ls.reduce((s, l) => s + (l.size && l.size > 8 ? 4.6 : lineH), 0);
    const partyH = Math.max(heightOf(billLines), heightOf(shipLines), 12) + 5.5;
    const drawParty = (ls, x) => {
      let y = partyTop + 4.6;
      ls.forEach((l) => {
        T(l.t, x, y, { bold: l.bold, size: l.size || 7.5 });
        y += l.size && l.size > 8 ? 4.6 : lineH;
      });
    };
    drawParty(billLines, L + PAD);
    if (!isNote) drawParty(shipLines, MIDX + PAD);
    if (!isNote) VL(MIDX, Y, partyTop + partyH);
    Y = partyTop + partyH;
    HL(Y);
    const subj = String(inv.subject || "").split("\n").map((s) => s.trim()).filter(Boolean);
    if (subj.length) {
      T("Subject :", L + PAD, Y + 4, { size: 6.5, color: LGRAY });
      let sy = Y + 7.6;
      subj.forEach((s) => wrap(s, CW - 2 * PAD, 7).forEach((x) => {
        T(x, L + PAD, sy, { size: 7 });
        sy += 3.4;
      }));
      Y = sy + 0.6;
      HL(Y);
    }
    const num = (v) => parseFloat(v) || 0;
    const qtyTxt = (r) => {
      const q = parseFloat(r.qty);
      return (isNaN(q) ? "" : q.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })) + (r.unit ? " " + r.unit : "");
    };
    const lineAmt = (r) => isNonGST ? num(r.total) || num(r.qty) * num(r.rate) : num(r.taxable) || num(r.qty) * num(r.rate) * (1 - num(r.discount) / 100);
    const hasDisc = !isNonGST && items.some((r) => num(r.discount) > 0);
    const cols = [];
    cols.push({ h: isNote ? "#" : "S.\nNo", w: 8, al: "left", get: (r, i) => String(i + 1) });
    cols.push({ h: "Item & Description", w: 0, al: "left", get: (r) => r.desc || "" });
    if (!isNonGST) cols.push({ h: "HSN\n/SAC", w: isNote ? 22 : 18, al: "left", get: (r) => r.hsnCode || "" });
    cols.push({ h: "Qty", w: isNote ? 18 : 14, al: "right", get: (r) => qtyTxt(r) });
    cols.push({ h: "Rate", w: isNonGST ? 28 : isNote ? 27 : gstType === "INTRA" ? 25 : 27, al: "right", get: (r) => fmtN(num(r.rate)) });
    if (hasDisc) cols.push({ h: "Disc\n%", w: 10, al: "right", get: (r) => String(num(r.discount)) });
    if (!isNote && !isNonGST) {
      if (gstType === "INTRA") {
        cols.push({ h: "CGST", w: 22, al: "right", get: (r) => fmtN(num(r.gstAmt) / 2) });
        cols.push({ h: "SGST", w: 22, al: "right", get: (r) => fmtN(num(r.gstAmt) / 2) });
      } else cols.push({ h: "IGST", w: 22, al: "right", get: (r) => fmtN(num(r.gstAmt)) });
    }
    cols.push({ h: "Amount", w: isNonGST ? 28 : isNote ? 27 : gstType === "INTRA" ? 22 : 28, al: "right", get: (r) => fmtN(lineAmt(r)) });
    const fixedW = cols.reduce((s, c) => s + c.w, 0);
    cols.find((c) => c.w === 0).w = CW - fixedW;
    const columnStyles = {};
    cols.forEach((c, i) => {
      columnStyles[i] = { cellWidth: c.w, halign: c.al };
    });
    doc.autoTable({
      startY: Y,
      theme: "grid",
      head: [cols.map((c) => c.h)],
      body: items.map((r, i) => cols.map((c) => c.get(r, i))),
      styles: { font: "helvetica", fontSize: 7.5, cellPadding: { top: 1.7, bottom: 1.7, left: 1.8, right: 1.8 }, textColor: DARK, lineColor: GRID, lineWidth: 0.2, overflow: "linebreak", fillColor: [255, 255, 255], valign: "top" },
      headStyles: { fillColor: BAR, textColor: DARK, fontStyle: "bold", fontSize: 7.5, valign: "middle" },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      columnStyles,
      showHead: "everyPage",
      margin: { left: L, right: PW - R, top: CONT_Y, bottom: PH - FB + 2 }
    });
    Y = doc.lastAutoTable.finalY;
    const grandRaw = isNonGST ? items.reduce((s, r) => s + lineAmt(r), 0) : num(inv.grand);
    const grand = Math.abs(grandRaw);
    const sub = Math.abs(num(inv.subtotal)), roff = num(inv.roundOff) * (isCN && num(inv.grand) < 0 ? -1 : 1);
    const rows = [];
    if (isNonGST) {
      rows.push({ label: "Total", val: fmtN(grand), bold: true, big: true, rupee: true, size: 8.5 });
    } else {
      rows.push({ label: "Sub Total", val: fmtN(sub) });
      let taxRows = Object.entries(inv.taxBreakdown || {}).map(([rt, amt]) => [parseFloat(rt) || 0, Math.abs(parseFloat(amt) || 0)]).filter(([rt, amt]) => rt > 0 || amt > 0).sort((a, b) => a[0] - b[0]);
      if (!taxRows.length) taxRows = [[0, 0]];
      taxRows.forEach(([rt, amt]) => {
        if (gstType === "INTRA") {
          const h = +(rt / 2).toFixed(2);
          rows.push({ label: `CGST${h} (${h}%)`, val: fmtN(amt / 2) });
          rows.push({ label: `SGST${h} (${h}%)`, val: fmtN(amt / 2) });
        } else rows.push({ label: `IGST${rt} (${rt}%)`, val: fmtN(amt) });
      });
      if (Math.abs(roff) >= 5e-3) rows.push({ label: "Round Off", val: (roff > 0 ? "+ " : "- ") + fmtN(Math.abs(roff)) });
      rows.push({ label: "Total", val: fmtN(grand), bold: true, big: true, rupee: true, size: 8.5 });
      if (isCN) {
        const used = inv.creditsUsed != null && inv.creditsUsed !== "" ? Math.min(Math.abs(num(inv.creditsUsed)), grand) : grand;
        rows.push({ label: "Credits Used", val: "(-) " + fmtN(used), color: RED });
        rows.push({ label: "Credits Remaining", val: fmtN(Math.max(grand - used, 0)), bold: true, big: true, rupee: true, size: 8 });
      }
    }
    if (inv.__cur) {
      rows.forEach((r) => {
        if (r.rupee) {
          r.rupee = false;
          r.val = inv.__cur + " " + r.val;
        }
      });
      rows.push({ label: "In INR @ " + inv.__rate, val: fmtN(inv.__inr), bold: true, rupee: true, size: 8 });
    }
    const rowH = (r) => r.big ? 6.2 : 4.8;
    const rowsH = rows.reduce((s, r) => s + rowH(r), 0) + 3;
    const leftX = L + PAD, leftW = SPLIT - L - 2 * PAD;
    const inWords = inv.__cur ? amountInWordsFC(grand, inv.__cur) : amountInWordsIN(grand);
    const noteTxt = inv.notes && String(inv.notes).trim() || (isCN ? "" : "Thanks for your business.");
    const pm = co.paymentMode || "netbanking";
    const showBank = !isCN && (pm === "netbanking" || pm === "both");
    const showUPI = !isCN && (pm === "upi" || pm === "both");
    const drawLeft = (y0) => {
      let y = y0 + 5;
      T("Total In Words", leftX, y, { color: MED });
      y += 4.2;
      wrap(inWords, leftW, 7.5, true, true).forEach((l) => {
        T(l, leftX, y, { bold: true, italic: true });
        y += 3.8;
      });
      y += 2.4;
      if (noteTxt) {
        T("Notes", leftX, y, { color: MED });
        y += 3.8;
        String(noteTxt).split("\n").forEach((n) => wrap(n, leftW, 7.5).forEach((l) => {
          T(l, leftX, y);
          y += 3.6;
        }));
        y += 2.4;
      }
      if (showBank || showUPI) {
        let yb = y, yu = y;
        if (showBank) {
          T("Company's Bank Details:", leftX, yb, { bold: true });
          yb += 4;
          if (co.bankName || co.bankAccount) {
            T(coName, leftX, yb, { bold: true });
            yb += 3.8;
            [["Bank Name", co.bankName], ["A/C NO", co.bankAccount], ["IFSC", co.bankIFSC], ["Branch", co.bankBranch]].filter(([, v]) => v).forEach(([k, v]) => {
              T(k, leftX, yb);
              T(": " + v, leftX + 15.5, yb);
              yb += 3.6;
            });
          } else {
            T("No bank details configured.", leftX, yb, { italic: true, color: LGRAY, size: 7 });
            yb += 3.6;
          }
        }
        if (showUPI) {
          const ux = showBank ? leftX + 66 : leftX;
          T("UPI Payment:", ux, yu, { bold: true });
          yu += 4;
          if (co.upiId) {
            T("UPI ID", ux, yu);
            T(": " + co.upiId, ux + 11, yu);
            yu += 4.2;
          }
          if (co.upiQR) {
            const qs = 24;
            if (!DRY) {
              try {
                doc.addImage(co.upiQR, imgFmt(co.upiQR), ux, yu - 1, qs, qs);
              } catch (e) {
              }
            }
            T("Scan to pay", ux + qs / 2, yu + qs + 2.6, { size: 6.5, color: MED, align: "center" });
            yu += qs + 4;
          } else if (!co.upiId) {
            T("No UPI details configured.", ux, yu, { italic: true, color: LGRAY, size: 7 });
            yu += 3.6;
          }
        }
        y = Math.max(yb, yu);
      }
      return y - y0 + 1.5;
    };
    DRY = true;
    const leftH = drawLeft(0);
    DRY = false;
    const sigMin = 24;
    const secH = Math.max(leftH, rowsH + sigMin);
    if (Y + secH > FB - 2) {
      newPage();
      HL(Y - 0.01);
    }
    const secTop = Y;
    drawLeft(secTop);
    let ry = secTop + 1.5;
    rows.forEach((r) => {
      const by = ry + rowH(r) - 1.5, sz = r.size || 7.5, col = r.color || DARK;
      T(r.label, R - 34.5, by, { align: "right", bold: r.bold, size: sz, color: col });
      if (r.rupee) money(r.val, R - 1.8, by, sz, r.bold, col);
      else T(r.val, R - 1.8, by, { align: "right", bold: r.bold, size: sz, color: col });
      ry += rowH(r);
    });
    HL(secTop + rowsH, SPLIT, R);
    const sigCx = (SPLIT + R) / 2;
    T(coName, sigCx, secTop + rowsH + 5, { align: "center" });
    if (co.signatory) T(co.signatory, sigCx, secTop + secH - 6.2, { align: "center", size: 6.5, color: LGRAY });
    T("Authorized Signature", sigCx, secTop + secH - 2.2, { align: "center" });
    VL(SPLIT, secTop, secTop + secH);
    Y = secTop + secH;
    HL(Y);
    if (S.get(SK.SHOW_TERMS, true)) {
      const tl = String(terms || DEFAULT_TERMS).split("\n").map((s) => s.trim()).filter(Boolean);
      const tLines = [];
      tl.forEach((t) => wrap(t, CW - 2 * PAD, 7).forEach((x) => tLines.push(x)));
      const tH = tLines.length * 3.35 + 9;
      if (Y + tH > FB - 2) newPage();
      T("Terms & Conditions", L + PAD, Y + 4.6, { color: MED });
      let ty = Y + 8.6;
      tLines.forEach((l) => {
        T(l, L + PAD, ty, { size: 7 });
        ty += 3.35;
      });
      Y = Y + tH;
      HL(Y);
    }
    if (inv.irn && inv.irn.irn) {
      const qs = 28, iH = qs + 8;
      if (Y + iH > FB - 2) newPage();
      let tx = L + PAD;
      if (inv.irn.qr) {
        try {
          doc.addImage(inv.irn.qr, imgFmt(inv.irn.qr), L + PAD, Y + 4, qs, qs);
        } catch (e) {
        }
        tx = L + PAD + qs + 6;
      }
      const kv = [["IRN", inv.irn.irn], ["Ack No.", inv.irn.ackNo], ["Ack Date", inv.irn.ackDate]].filter(([, v]) => v);
      kv.forEach(([k, v], i) => {
        const yy = Y + 8 + i * 7;
        T(k + " :", tx, yy, { color: MED });
        T(String(v), tx + 22, yy, { bold: true });
      });
      T("e-Invoicing detail(s) generated from the Government's e-Invoicing system.", tx, Y + 8 + kv.length * 7 + 1, { size: 6.8, color: LGRAY });
      Y = Y + iH;
      HL(Y);
    }
    const tp = doc.internal.getNumberOfPages();
    for (let pg = 1; pg <= tp; pg++) {
      doc.setPage(pg);
      doc.setDrawColor(...GRID);
      doc.setLineWidth(0.3);
      doc.rect(L, FT, CW, FB - FT);
      if (pg > 1) {
        T(coName + " \u2014 " + docTitle + " (cont.)", L + PAD, FT + 6, { size: 8, bold: true });
        T((isNote ? "No: " : "Invoice: ") + (inv.invNo || ""), R - PAD, FT + 6, { size: 7.5, color: MED, align: "right" });
        HL(FT + 9.5);
      }
      T(String(pg), PW - 8, PH - 2.6, { size: 6.5, color: LGRAY, align: "right" });
    }
    doc.save((inv.invNo || "Invoice") + ".pdf");
    autoSavePDF(doc, inv);
    toast.success("PDF downloaded!");
  } catch (err) {
    console.error("PDF Error:", err);
    toast.error("PDF error: " + (err.message || String(err)));
  }
};
let _folderHandle = null;
const pickSaveFolder = async () => {
  try {
    if (!window.showDirectoryPicker) {
      toast.error("Auto-folder save needs Chrome or Edge browser.");
      return false;
    }
    _folderHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    toast.success("Save folder set! PDFs will auto-save to B2B / B2C subfolders.");
    return true;
  } catch (e) {
    if (e.name !== "AbortError") toast.error("Could not set folder: " + e.message);
    return false;
  }
};
const autoSavePDF = async (doc, inv) => {
  if (!_folderHandle) {
    return;
  }
  try {
    const folderName = inv.docType === "NON GST INVOICE" ? "Non-GST Invoices" : inv.isB2C ? "B2C Invoices" : inv.docType === "DEBIT NOTE" ? "Debit Notes" : inv.docType === "CREDIT NOTE" ? "Credit Notes" : "B2B Invoices";
    const subFolder = await _folderHandle.getDirectoryHandle(folderName, { create: true });
    const fileName = (inv.invNo || "Invoice") + ".pdf";
    const fileHandle = await subFolder.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    const pdfBlob = doc.output("blob");
    await writable.write(pdfBlob);
    await writable.close();
    toast.success(`Auto-saved to ${folderName}/${fileName}`);
  } catch (e) {
    console.warn("Auto-save failed:", e.message);
  }
};
const makeGSTR1 = (invoices) => {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const XLSX2 = window.XLSX;
  const wb = XLSX2.utils.book_new();
  const taxInvs = invoices.filter((i) => i.docType !== "CREDIT NOTE" && i.docType !== "DEBIT NOTE");
  const b2b = taxInvs.filter((i) => {
    var _a2;
    return !i.isB2C && ((_a2 = i.billTo) == null ? void 0 : _a2.gstin);
  });
  const b2c = taxInvs.filter((i) => {
    var _a2;
    return i.isB2C || !((_a2 = i.billTo) == null ? void 0 : _a2.gstin);
  });
  const credits = invoices.filter((i) => i.docType === "CREDIT NOTE");
  const debits = invoices.filter((i) => i.docType === "DEBIT NOTE");
  const b2bHead = ["GSTIN of Recipient", "Receiver Name", "Invoice Number", "Invoice Date", "Invoice Value", "Place of Supply", "Reverse Charge", "Invoice Type", "E-Commerce GSTIN", "Rate", "Taxable Value", "IGST", "CGST", "SGST", "Cess"];
  const b2bRows = [b2bHead];
  b2b.forEach((inv) => {
    (inv.items || []).filter((r) => r.desc).forEach((r) => {
      var _a2, _b2, _c2, _d2;
      const tR = parseFloat(r.taxRate) || 0, tax = parseFloat(r.taxable) || 0, gst = parseFloat(r.gstAmt) || 0;
      const gt = inv.gstType || "INTRA";
      b2bRows.push([
        (((_a2 = inv.billTo) == null ? void 0 : _a2.gstin) || "").toUpperCase(),
        ((_b2 = inv.billTo) == null ? void 0 : _b2.name) || "",
        inv.invNo || "",
        fmtDate(inv.date) || "",
        Number(getGrand(inv) || 0).toFixed(2),
        ((_c2 = inv.billTo) == null ? void 0 : _c2.state) || stateName((_d2 = inv.billTo) == null ? void 0 : _d2.gstin) || "",
        "N",
        "Regular",
        "",
        tR,
        Number(tax).toFixed(2),
        gt === "INTER" ? Number(gst).toFixed(2) : "",
        gt === "INTRA" ? Number(gst / 2).toFixed(2) : "",
        gt === "INTRA" ? Number(gst / 2).toFixed(2) : "",
        ""
      ]);
    });
  });
  const wsB2B = XLSX2.utils.aoa_to_sheet(b2bRows);
  wsB2B["!cols"] = [{ wch: 20 }, { wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 }];
  XLSX2.utils.book_append_sheet(wb, wsB2B, "B2B");
  const b2cHead = ["Type", "Place of Supply", "Rate", "Taxable Value", "IGST", "CGST", "SGST", "Cess"];
  const b2cRows = [b2cHead];
  b2c.forEach((inv) => {
    (inv.items || []).filter((r) => r.desc).forEach((r) => {
      var _a2;
      const tR = parseFloat(r.taxRate) || 0, tax = parseFloat(r.taxable) || 0, gst = parseFloat(r.gstAmt) || 0;
      const gt = inv.gstType || "INTRA";
      b2cRows.push([
        "B2C",
        ((_a2 = inv.billTo) == null ? void 0 : _a2.state) || "",
        tR,
        Number(tax).toFixed(2),
        gt === "INTER" ? Number(gst).toFixed(2) : "",
        gt === "INTRA" ? Number(gst / 2).toFixed(2) : "",
        gt === "INTRA" ? Number(gst / 2).toFixed(2) : "",
        ""
      ]);
    });
  });
  const wsB2C = XLSX2.utils.aoa_to_sheet(b2cRows);
  wsB2C["!cols"] = [{ wch: 10 }, { wch: 18 }, { wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 }];
  XLSX2.utils.book_append_sheet(wb, wsB2C, "B2C");
  const hsnMap = {};
  invoices.forEach((inv) => {
    const sign = inv.docType === "CREDIT NOTE" ? -1 : 1;
    (inv.items || []).filter((r) => r.desc && r.hsnCode).forEach((r) => {
      const k = r.hsnCode;
      if (!hsnMap[k]) hsnMap[k] = { hsn: r.hsnCode, desc: r.desc, uom: r.unit || "Nos", qty: 0, val: 0, tax: 0, igst: 0, cgst: 0, sgst: 0 };
      const tax = parseFloat(r.taxable) || 0, gst = parseFloat(r.gstAmt) || 0;
      const gt = inv.gstType || "INTRA";
      hsnMap[k].qty += sign * (parseFloat(r.qty) || 0);
      hsnMap[k].val += sign * (parseFloat(r.total) || 0);
      hsnMap[k].tax += sign * tax;
      if (gt === "INTER") hsnMap[k].igst += sign * gst;
      else {
        hsnMap[k].cgst += sign * gst / 2;
        hsnMap[k].sgst += sign * gst / 2;
      }
    });
  });
  const hsnHead = ["HSN/SAC", "Description", "UOM", "Total Qty", "Total Value", "Taxable Value", "IGST", "CGST", "SGST", "Cess"];
  const hsnRows = [hsnHead, ...Object.values(hsnMap).map((h) => [h.hsn, h.desc, h.uom, h.qty.toFixed(2), h.val.toFixed(2), h.tax.toFixed(2), h.igst.toFixed(2), h.cgst.toFixed(2), h.sgst.toFixed(2), "0"])];
  const wsHSN = XLSX2.utils.aoa_to_sheet(hsnRows);
  wsHSN["!cols"] = [{ wch: 12 }, { wch: 30 }, { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 }];
  XLSX2.utils.book_append_sheet(wb, wsHSN, "HSN Summary");
  const dsHead = ["Nature of Document", "Sr No From", "Sr No To", "Total Issued", "Total Cancelled"];
  const dsRows = [
    dsHead,
    ["Invoices for outward supply", ((_a = b2b[0]) == null ? void 0 : _a.invNo) || "-", ((_b = b2b[b2b.length - 1]) == null ? void 0 : _b.invNo) || "-", b2b.length, 0],
    ["Invoices for inward supply (B2C)", ((_c = b2c[0]) == null ? void 0 : _c.invNo) || "-", ((_d = b2c[b2c.length - 1]) == null ? void 0 : _d.invNo) || "-", b2c.length, 0],
    ["Debit Notes", ((_e = debits[0]) == null ? void 0 : _e.invNo) || "-", ((_f = debits[debits.length - 1]) == null ? void 0 : _f.invNo) || "-", debits.length, 0],
    ["Credit Notes", ((_g = credits[0]) == null ? void 0 : _g.invNo) || "-", ((_h = credits[credits.length - 1]) == null ? void 0 : _h.invNo) || "-", credits.length, 0]
  ];
  const wsDS = XLSX2.utils.aoa_to_sheet(dsRows);
  wsDS["!cols"] = [{ wch: 34 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 14 }];
  XLSX2.utils.book_append_sheet(wb, wsDS, "Document Summary");
  const cdnrHead = [
    "GSTIN of Recipient",
    "Receiver Name",
    "Note No",
    "Note Date",
    "Note Type",
    "Note Value",
    "Original Invoice No",
    "Original Invoice Date",
    "Place of Supply",
    "Reverse Charge",
    "Rate",
    "Taxable Value",
    "IGST",
    "CGST",
    "SGST",
    "Cess"
  ];
  const cdnrRows = [cdnrHead];
  [...credits, ...debits].forEach((inv) => {
    const sign = inv.docType === "CREDIT NOTE" ? -1 : 1;
    const noteType = inv.docType === "CREDIT NOTE" ? "C" : "D";
    (inv.items || []).filter((r) => r.desc).forEach((r) => {
      var _a2, _b2, _c2, _d2;
      const tR = parseFloat(r.taxRate) || 0, tax = parseFloat(r.taxable) || 0, gst = parseFloat(r.gstAmt) || 0;
      const gt = inv.gstType || "INTRA";
      cdnrRows.push([
        (((_a2 = inv.billTo) == null ? void 0 : _a2.gstin) || "").toUpperCase(),
        ((_b2 = inv.billTo) == null ? void 0 : _b2.name) || "",
        inv.invNo || "",
        fmtDate(inv.date) || "",
        noteType,
        Number(Math.abs(getGrand(inv) || 0)).toFixed(2),
        inv.origInvNo || "",
        inv.origInvDate ? fmtDate(inv.origInvDate) : "",
        ((_c2 = inv.billTo) == null ? void 0 : _c2.state) || stateName((_d2 = inv.billTo) == null ? void 0 : _d2.gstin) || "",
        "N",
        tR,
        Number(sign * tax).toFixed(2),
        gt === "INTER" ? Number(sign * gst).toFixed(2) : "",
        gt === "INTRA" ? Number(sign * gst / 2).toFixed(2) : "",
        gt === "INTRA" ? Number(sign * gst / 2).toFixed(2) : "",
        ""
      ]);
    });
  });
  const wsCDNR = XLSX2.utils.aoa_to_sheet(cdnrRows);
  wsCDNR["!cols"] = [{ wch: 20 }, { wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 8 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 }];
  XLSX2.utils.book_append_sheet(wb, wsCDNR, "CDNR (Credit-Debit Notes)");
  XLSX2.writeFile(wb, `GSTR1_${today()}.xlsx`);
  toast.success("GSTR-1 report downloaded!");
};
const makePurchaseExcel = (expenses, fmt2 = "xlsx", meta = {}) => {
  const XLSX2 = window.XLSX;
  const wb = XLSX2.utils.book_new();
  const headers = [
    "Sl.No",
    "Date",
    "Voucher No.",
    "Txn Ref No.",
    "Vendor / Supplier Name",
    "Vendor GSTIN",
    "Vendor State",
    "Bill No / Ref No",
    "Bill Date",
    "Due Date",
    "Category",
    "Product",
    "Description",
    "HSN / SAC",
    "Unit",
    "Qty",
    "Rate (Rs.)",
    "Taxable Amount (Rs.)",
    "GST Type",
    "Tax Rate %",
    "CGST %",
    "CGST Amount (Rs.)",
    "SGST %",
    "SGST Amount (Rs.)",
    "IGST %",
    "IGST Amount (Rs.)",
    "Total Tax (Rs.)",
    "Line Total (Rs.)",
    "Added to Stock",
    "Bill Total (Rs.)",
    "TDS Section",
    "TDS Rate %",
    "TDS Amount (Rs.)",
    "Net Payable (Rs.)",
    "Amount Paid (Rs.)",
    "Balance Payable (Rs.)",
    "Payment Mode",
    "Payment Status",
    "Paid Date",
    "Notes",
    "Recorded By"
  ];
  const rows = [...companyHeaderRows(), headers];
  let sl = 1;
  expenses.forEach((e) => {
    const gt = e.gstType || "INTRA";
    const items = expItems(e);
    items.forEach((it, k) => {
      const tR = parseFloat(it.taxRate) || 0;
      const tax = parseFloat(it.taxable) || 0;
      const gst = parseFloat(it.gstAmt) || 0;
      rows.push([
        sl++,
        e.date || "",
        e.voucherNo || "",
        e.txnRefNo || "",
        e.vendor || "",
        (e.vendorGSTIN || "").toUpperCase(),
        e.vendorState || "",
        e.billNo || "",
        e.billDate || "",
        expDueDate(e),
        e.category || "",
        it.product || "",
        it.desc || "",
        it.hsnCode || "",
        it.unit || "Nos",
        parseFloat(it.qty) || 0,
        parseFloat(it.rate) || 0,
        Number(tax).toFixed(2),
        gt,
        tR,
        gt === "INTRA" ? tR / 2 : "",
        gt === "INTRA" ? Number(gst / 2).toFixed(2) : "",
        gt === "INTRA" ? tR / 2 : "",
        gt === "INTRA" ? Number(gst / 2).toFixed(2) : "",
        gt !== "INTRA" ? tR : "",
        gt !== "INTRA" ? Number(gst).toFixed(2) : "",
        Number(gst).toFixed(2),
        Number(parseFloat(it.total) || 0).toFixed(2),
        it.toStock === false ? "No" : "Yes",
        k === 0 ? Number(parseFloat(e.total) || 0).toFixed(2) : "",
        k === 0 ? e.tdsSection || "" : "",
        k === 0 ? e.tdsSection ? parseFloat(e.tdsRate) || 0 : "" : "",
        k === 0 ? Number(parseFloat(e.tdsAmount) || 0).toFixed(2) : "",
        k === 0 ? Number(expNetPayable(e)).toFixed(2) : "",
        k === 0 ? expPaid(e).toFixed(2) : "",
        k === 0 ? expDue(e).toFixed(2) : "",
        k === 0 ? e.payMode || "" : "",
        k === 0 ? e.payStatus || "" : "",
        k === 0 ? e.paidDate || "" : "",
        k === 0 ? e.notes || "" : "",
        k === 0 ? e.createdBy || "" : ""
      ]);
    });
  });
  const ws = XLSX2.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 5 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 24 },
    { wch: 20 },
    { wch: 14 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 24 },
    { wch: 24 },
    { wch: 10 },
    { wch: 8 },
    { wch: 8 },
    { wch: 12 },
    { wch: 18 },
    { wch: 10 },
    { wch: 8 },
    { wch: 8 },
    { wch: 14 },
    { wch: 8 },
    { wch: 14 },
    { wch: 8 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 12 },
    { wch: 16 },
    { wch: 12 },
    { wch: 10 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 24 },
    { wch: 20 }
  ];
  XLSX2.utils.book_append_sheet(wb, ws, "Purchase Register");
  const prodMap = {};
  expenses.forEach((e) => expItems(e).forEach((it) => {
    const n = it.product || it.desc || "Unnamed";
    if (!prodMap[n]) prodMap[n] = { n, qty: 0, taxable: 0, tax: 0, total: 0, bills: 0 };
    prodMap[n].qty += parseFloat(it.qty) || 0;
    prodMap[n].taxable += parseFloat(it.taxable) || 0;
    prodMap[n].tax += parseFloat(it.gstAmt) || 0;
    prodMap[n].total += parseFloat(it.total) || 0;
    prodMap[n].bills += 1;
  }));
  const pRows = [
    ["Product", "Qty Purchased", "Lines", "Taxable (Rs.)", "Tax (Rs.)", "Total (Rs.)", "Avg Rate (Rs.)"],
    ...Object.values(prodMap).sort((a, b) => b.total - a.total).map((p) => [
      p.n,
      p.qty,
      p.bills,
      p.taxable.toFixed(2),
      p.tax.toFixed(2),
      p.total.toFixed(2),
      (p.qty ? p.taxable / p.qty : 0).toFixed(2)
    ])
  ];
  const wsP = XLSX2.utils.aoa_to_sheet(pRows);
  wsP["!cols"] = [{ wch: 30 }, { wch: 14 }, { wch: 8 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 14 }];
  XLSX2.utils.book_append_sheet(wb, wsP, "Product-wise Purchases");
  const venMap = {};
  expenses.forEach((e) => {
    const v = e.vendor || "Unknown";
    if (!venMap[v]) venMap[v] = { v, gstin: e.vendorGSTIN || "", bills: 0, total: 0, paid: 0, due: 0 };
    venMap[v].bills++;
    venMap[v].total += parseFloat(e.total) || 0;
    venMap[v].paid += expPaid(e);
    venMap[v].due += expDue(e);
  });
  const vRows = [
    ["Vendor", "GSTIN", "Bills", "Purchased (Rs.)", "Paid (Rs.)", "Outstanding (Rs.)"],
    ...Object.values(venMap).sort((a, b) => b.due - a.due).map((v) => [
      v.v,
      v.gstin,
      v.bills,
      v.total.toFixed(2),
      v.paid.toFixed(2),
      v.due.toFixed(2)
    ])
  ];
  const wsV = XLSX2.utils.aoa_to_sheet(vRows);
  wsV["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 8 }, { wch: 18 }, { wch: 16 }, { wch: 18 }];
  XLSX2.utils.book_append_sheet(wb, wsV, "Vendor Outstanding");
  const catMap = {};
  expenses.forEach((e) => {
    const cat = e.category || "Uncategorized";
    if (!catMap[cat]) catMap[cat] = { cat, count: 0, taxable: 0, tax: 0, total: 0, paid: 0, pending: 0 };
    catMap[cat].count++;
    catMap[cat].taxable += parseFloat(e.taxable) || 0;
    catMap[cat].tax += parseFloat(e.gstAmt) || 0;
    catMap[cat].total += parseFloat(e.total) || 0;
    if ((e.payStatus || "").toLowerCase() === "paid") catMap[cat].paid += parseFloat(e.total) || 0;
    else catMap[cat].pending += parseFloat(e.total) || 0;
  });
  const catHead = ["Category", "No. of Bills", "Taxable (Rs.)", "Total Tax (Rs.)", "Total Amount (Rs.)", "Paid (Rs.)", "Pending (Rs.)"];
  const catRows = [catHead, ...Object.values(catMap).map((c) => [c.cat, c.count, c.taxable.toFixed(2), c.tax.toFixed(2), c.total.toFixed(2), c.paid.toFixed(2), c.pending.toFixed(2)])];
  const totRow = [
    "TOTAL",
    expenses.length,
    Object.values(catMap).reduce((s, c) => s + c.taxable, 0).toFixed(2),
    Object.values(catMap).reduce((s, c) => s + c.tax, 0).toFixed(2),
    Object.values(catMap).reduce((s, c) => s + c.total, 0).toFixed(2),
    Object.values(catMap).reduce((s, c) => s + c.paid, 0).toFixed(2),
    Object.values(catMap).reduce((s, c) => s + c.pending, 0).toFixed(2)
  ];
  catRows.push(totRow);
  const wsCat = XLSX2.utils.aoa_to_sheet(catRows);
  wsCat["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 16 }];
  XLSX2.utils.book_append_sheet(wb, wsCat, "Category Summary");
  const monMap = {};
  expenses.forEach((e) => {
    var _a;
    const m = ((_a = e.date) == null ? void 0 : _a.substring(0, 7)) || "?";
    if (!monMap[m]) monMap[m] = { month: m, count: 0, taxable: 0, tax: 0, total: 0 };
    monMap[m].count++;
    monMap[m].taxable += parseFloat(e.taxable) || 0;
    monMap[m].tax += parseFloat(e.gstAmt) || 0;
    monMap[m].total += parseFloat(e.total) || 0;
  });
  const monHead = ["Month", "No. of Bills", "Taxable (Rs.)", "Total Tax (Rs.)", "Total Amount (Rs.)"];
  const monRows = [monHead, ...Object.entries(monMap).sort().map(([m, v]) => [m, v.count, v.taxable.toFixed(2), v.tax.toFixed(2), v.total.toFixed(2)])];
  const wsM = XLSX2.utils.aoa_to_sheet(monRows);
  wsM["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 18 }];
  XLSX2.utils.book_append_sheet(wb, wsM, "Monthly Summary");
  proExport(fmt2, {
    ...proWbToSpec(wb, { title: "Purchase Register", period: meta.period || "" }),
    pdfSheets: fmt2 === "pdf" ? [{ name: "Purchase Register", aoa: regPurchasePdf(expenses), h0: true }, { name: "Monthly Summary", aoa: monRows, h0: true }, { name: "Vendor-wise Outstanding", aoa: vRows, h0: true }] : void 0
  }, `PurchaseRegister_${today()}`);
};
const makeAuditExcel = (logs) => {
  try {
    const { utils, writeFile } = window.XLSX;
    const rows = logs.map((l) => {
      const meta = getAuditMeta(l.action);
      return {
        "Timestamp": new Date(l.ts).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        "Module": meta.module,
        "Action": meta.action,
        "Detail": l.detail || "",
        "User Name": l.userName || "",
        "User Email": l.user || "",
        "Date": new Date(l.ts).toLocaleDateString("en-IN"),
        "Time": new Date(l.ts).toLocaleTimeString("en-IN")
      };
    });
    const ws = utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 22 }, { wch: 20 }, { wch: 16 }, { wch: 55 }, { wch: 20 }, { wch: 30 }, { wch: 14 }, { wch: 12 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Audit Log");
    const actionCounts = {};
    logs.forEach((l) => {
      const meta = getAuditMeta(l.action);
      const k = meta.module + " \u2014 " + meta.action;
      actionCounts[k] = (actionCounts[k] || 0) + 1;
    });
    const sumRows = Object.entries(actionCounts).sort((a, b) => b[1] - a[1]).map(([k, count]) => {
      const [module, action] = k.split(" \u2014 ");
      return { "Module": module, "Action": action, "Count": count };
    });
    const ws2 = utils.json_to_sheet(sumRows);
    ws2["!cols"] = [{ wch: 22 }, { wch: 20 }, { wch: 10 }];
    utils.book_append_sheet(wb, ws2, "Summary");
    const dt = today();
    writeFile(wb, `AuditLog_${dt}.xlsx`);
    toast.success(`Audit log exported \u2014 ${logs.length} entries`);
  } catch (e) {
    toast.error("Export failed: " + e.message);
  }
};
const makeFullExcel = () => {
  try {
    const XLSX2 = window.XLSX;
    const wb = XLSX2.utils.book_new();
    const dt = today();
    const co = S.get(SK.CO, {});
    const invoices = S.get(SK.INV, []);
    const expenses = S.get(SK.EXP, []);
    const pos = S.get(SK.PO, []);
    const customers = S.get(SK.CUST, []);
    const hsnList = S.get(SK.HSN, []);
    const auditLogs = S.get(SK.AUDIT, []);
    const freezeD = S.get(SK.FREEZE, { sales: [], expenses: [] });
    const terms = S.get(SK.TERMS, "");
    const poTerms = S.get(SK.PO_TERMS, "");
    const addSheet = (wb2, data, sheetName, colWidths) => {
      const ws = XLSX2.utils.aoa_to_sheet(data);
      if (colWidths) ws["!cols"] = colWidths.map((w) => ({ wch: w }));
      XLSX2.utils.book_append_sheet(wb2, ws, sheetName);
      return ws;
    };
    const coRows = [
      ["Field", "Value"],
      ["Company Name", co.name || ""],
      ["GSTIN", co.gstin || ""],
      ["PAN Number", co.panNo || ""],
      ["Address", co.address || ""],
      ["City", co.city || ""],
      ["State", co.state || ""],
      ["PIN", co.pin || ""],
      ["Phone", co.phone || ""],
      ["Email", co.email || ""],
      ["Website", co.website || ""],
      ["Bank Name", co.bankName || ""],
      ["Account Number", co.bankAccount || ""],
      ["IFSC Code", co.bankIFSC || ""],
      ["Branch", co.bankBranch || ""],
      ["Authorised Signatory", co.signatory || ""],
      ["UPI ID", co.upiId || ""],
      ["Payment Mode", co.paymentMode || ""],
      ["Export Date", (/* @__PURE__ */ new Date()).toLocaleString("en-IN")],
      ["Total Invoices", invoices.length],
      ["Total Expenses", expenses.length],
      ["Total POs", pos.length]
    ];
    addSheet(wb, coRows, "Company Info", [28, 40]);
    const salesHdr = [
      "Sl.No",
      "Document Type",
      "Invoice No",
      "Invoice Date",
      "Original Invoice No",
      "Original Invoice Date",
      "Sent to Customer",
      "Customer Name",
      "Customer GSTIN",
      "Customer State",
      "Bill To Address",
      "HSN/SAC",
      "Description",
      "Unit",
      "Qty",
      "Rate (Rs.)",
      "Discount %",
      "Taxable Amount (Rs.)",
      "GST Type",
      "Tax Rate %",
      "CGST %",
      "CGST Amount (Rs.)",
      "SGST %",
      "SGST Amount (Rs.)",
      "IGST %",
      "IGST Amount (Rs.)",
      "Total Tax (Rs.)",
      "Invoice Total (Rs.)",
      "Payment Status",
      "Due Date",
      "PO/Reference No",
      "Notes",
      "Created By",
      "Customer Phone",
      "Customer Email",
      "Round Off",
      "Paid Amount (Rs.)",
      "Balance (Rs.)",
      "Paid Date",
      "Subject",
      "Time"
    ];
    const salesRows = [salesHdr];
    let sl = 1;
    invoices.forEach((inv) => {
      const items = (inv.items || []).filter((r) => r.desc);
      const gt = inv.gstType || "INTRA";
      const isNG = inv.docType === "NON GST INVOICE";
      const dt2 = inv.isB2C ? "TAX INVOICE (B2C)" : isNG ? "NON-GST TRANSACTION" : inv.docType || "TAX INVOICE";
      const isCN = inv.docType === "CREDIT NOTE";
      const sign = isCN ? -1 : 1;
      const isCDN = inv.docType === "CREDIT NOTE" || inv.docType === "DEBIT NOTE";
      (items.length ? items : [{ desc: "\u2014", qty: 1, rate: 0 }]).forEach((r, idx) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
        const tR = isNG ? 0 : parseFloat(r.taxRate) || 0;
        const tax = isNG ? 0 : parseFloat(r.taxable) || 0;
        const gst = isNG ? 0 : parseFloat(r.gstAmt) || 0;
        const lineTotal = isNG ? (parseFloat(r.qty) || 0) * (parseFloat(r.rate) || 0) : parseFloat(r.total) || 0;
        salesRows.push([
          idx === 0 ? sl : "",
          dt2,
          inv.invNo || "",
          fmtDate(inv.date) || "",
          isCDN ? inv.origInvNo || "" : "",
          isCDN ? inv.origInvDate ? fmtDate(inv.origInvDate) : "" : "",
          inv.sentToCustomer ? "Yes" : "No",
          ((_a = inv.billTo) == null ? void 0 : _a.name) || "",
          (((_b = inv.billTo) == null ? void 0 : _b.gstin) || "").toUpperCase(),
          stateName((_c = inv.billTo) == null ? void 0 : _c.gstin) || ((_d = inv.billTo) == null ? void 0 : _d.state) || "",
          [(_e = inv.billTo) == null ? void 0 : _e.address, (_f = inv.billTo) == null ? void 0 : _f.city, (_g = inv.billTo) == null ? void 0 : _g.state, (_h = inv.billTo) == null ? void 0 : _h.pin].filter(Boolean).join(", "),
          isNG ? "" : r.hsnCode || "",
          r.desc || "",
          isNG ? "Nos" : r.unit || "Nos",
          r.qty || 1,
          r.rate || 0,
          isNG ? 0 : r.discount || 0,
          Number(sign * tax).toFixed(2),
          isNG ? "NON-GST" : gt,
          tR,
          isNG ? "" : gt === "INTRA" ? tR / 2 : "",
          isNG ? "" : gt === "INTRA" ? Number(sign * gst / 2).toFixed(2) : "",
          isNG ? "" : gt === "INTRA" ? tR / 2 : "",
          isNG ? "" : gt === "INTRA" ? Number(sign * gst / 2).toFixed(2) : "",
          isNG ? "" : gt !== "INTRA" ? tR : "",
          isNG ? "" : gt !== "INTRA" ? Number(sign * gst).toFixed(2) : "",
          isNG ? 0 : Number(sign * gst).toFixed(2),
          Number(isNG ? lineTotal : getGrand(inv)).toFixed(2),
          inv.status || "",
          inv.dueDate ? fmtDate(inv.dueDate) : "",
          inv.poNo || "",
          inv.notes || "",
          inv.createdBy || "",
          ((_i = inv.billTo) == null ? void 0 : _i.phone) || "",
          ((_j = inv.billTo) == null ? void 0 : _j.email) || "",
          idx === 0 ? inv.roundOff || 0 : "",
          idx === 0 ? Number(invPaid(inv)).toFixed(2) : "",
          idx === 0 ? Number(Math.abs(getGrand(inv)) - invPaid(inv)).toFixed(2) : "",
          inv.paidDate ? fmtDate(inv.paidDate) : "",
          inv.subject || "",
          inv.time || ""
        ]);
        if (idx === 0) sl++;
      });
    });
    addSheet(
      wb,
      salesRows,
      "Sales Register",
      [5, 20, 16, 13, 16, 16, 8, 22, 20, 16, 28, 12, 28, 8, 7, 12, 8, 18, 10, 9, 8, 16, 8, 16, 8, 16, 14, 18, 14, 13, 14, 22, 20, 14, 24, 9, 14, 14, 12, 20, 10]
    );
    const salesTotals = {};
    invoices.forEach((inv) => {
      var _a;
      const isCN = inv.docType === "CREDIT NOTE", sign = isCN ? -1 : 1;
      const isNG = inv.docType === "NON GST INVOICE";
      const m = ((_a = inv.date) == null ? void 0 : _a.substring(0, 7)) || "Unknown";
      if (!salesTotals[m]) salesTotals[m] = { b2b: 0, b2c: 0, ng: 0, dn: 0, cn: 0, taxable: 0, tax: 0, total: 0 };
      if (isCN) salesTotals[m].cn++;
      else if (inv.docType === "DEBIT NOTE") salesTotals[m].dn++;
      else if (isNG) salesTotals[m].ng++;
      else if (inv.isB2C) salesTotals[m].b2c++;
      else salesTotals[m].b2b++;
      const g = getGrand(inv);
      salesTotals[m].total += sign * g;
      (inv.items || []).filter((r) => r.desc).forEach((r) => {
        salesTotals[m].taxable += isNG ? 0 : sign * (parseFloat(r.taxable) || 0);
        salesTotals[m].tax += isNG ? 0 : sign * (parseFloat(r.gstAmt) || 0);
      });
    });
    const mSalesHdr = ["Month", "B2B", "B2C", "Non-GST", "Debit Notes", "Credit Notes", "Net Taxable (Rs.)", "Net Tax (Rs.)", "Net Total (Rs.)"];
    const mSalesRows = [mSalesHdr, ...Object.entries(salesTotals).sort().map(([m, v]) => [
      m,
      v.b2b,
      v.b2c,
      v.ng,
      v.dn,
      v.cn,
      Number(v.taxable).toFixed(2),
      Number(v.tax).toFixed(2),
      Number(v.total).toFixed(2)
    ])];
    const mTot = Object.values(salesTotals).reduce((a, v) => ({ b2b: a.b2b + v.b2b, b2c: a.b2c + v.b2c, ng: a.ng + v.ng, dn: a.dn + v.dn, cn: a.cn + v.cn, taxable: a.taxable + v.taxable, tax: a.tax + v.tax, total: a.total + v.total }), { b2b: 0, b2c: 0, ng: 0, dn: 0, cn: 0, taxable: 0, tax: 0, total: 0 });
    mSalesRows.push(["TOTAL", mTot.b2b, mTot.b2c, mTot.ng, mTot.dn, mTot.cn, mTot.taxable.toFixed(2), mTot.tax.toFixed(2), mTot.total.toFixed(2)]);
    addSheet(wb, mSalesRows, "Monthly Sales Summary", [12, 8, 8, 10, 12, 12, 18, 16, 16]);
    const purHdr = [
      "Sl.No",
      "Date",
      "Vendor Name",
      "Vendor GSTIN",
      "Vendor State",
      "Bill No",
      "Bill Date",
      "Category",
      "Description",
      "HSN/SAC",
      "Unit",
      "Qty",
      "Rate (Rs.)",
      "Taxable (Rs.)",
      "GST Type",
      "Tax Rate %",
      "CGST %",
      "CGST Amt (Rs.)",
      "SGST %",
      "SGST Amt (Rs.)",
      "IGST %",
      "IGST Amt (Rs.)",
      "Total Tax (Rs.)",
      "Total Amount (Rs.)",
      "Payment Mode",
      "Payment Status",
      "Paid Date",
      "Notes",
      "Recorded By"
    ];
    const purRows = [purHdr];
    let psl = 1;
    expenses.forEach((e) => {
      const tR = parseFloat(e.taxRate) || 0, tax = parseFloat(e.taxable) || 0;
      const gst = parseFloat(e.gstAmt) || 0, gt = e.gstType || "INTRA";
      purRows.push([
        psl++,
        e.date || "",
        e.vendor || "",
        (e.vendorGSTIN || "").toUpperCase(),
        e.vendorState || "",
        e.billNo || "",
        e.billDate || "",
        e.category || "",
        e.description || "",
        e.hsnCode || "",
        e.unit || "Nos",
        parseFloat(e.qty) || 1,
        parseFloat(e.rate) || 0,
        Number(tax).toFixed(2),
        gt,
        tR,
        gt === "INTRA" ? tR / 2 : "",
        gt === "INTRA" ? Number(gst / 2).toFixed(2) : "",
        gt === "INTRA" ? tR / 2 : "",
        gt === "INTRA" ? Number(gst / 2).toFixed(2) : "",
        gt !== "INTRA" ? tR : "",
        gt !== "INTRA" ? Number(gst).toFixed(2) : "",
        Number(gst).toFixed(2),
        Number(parseFloat(e.total) || 0).toFixed(2),
        e.payMode || "",
        e.payStatus || "",
        e.paidDate || "",
        e.notes || "",
        e.createdBy || ""
      ]);
    });
    addSheet(
      wb,
      purRows,
      "Purchase Register",
      [5, 12, 24, 20, 14, 14, 12, 16, 28, 10, 8, 6, 12, 16, 10, 8, 8, 14, 8, 14, 8, 14, 14, 16, 16, 14, 12, 24, 20]
    );
    const catMap = {};
    expenses.forEach((e) => {
      const cat = e.category || "Uncategorized";
      if (!catMap[cat]) catMap[cat] = { count: 0, taxable: 0, tax: 0, total: 0, paid: 0, pending: 0 };
      catMap[cat].count++;
      catMap[cat].taxable += parseFloat(e.taxable) || 0;
      catMap[cat].tax += parseFloat(e.gstAmt) || 0;
      catMap[cat].total += parseFloat(e.total) || 0;
      if ((e.payStatus || "").toLowerCase() === "paid") catMap[cat].paid += parseFloat(e.total) || 0;
      else catMap[cat].pending += parseFloat(e.total) || 0;
    });
    const catHdr = ["Category", "No. of Bills", "Taxable (Rs.)", "Total Tax (Rs.)", "Total Amount (Rs.)", "Paid (Rs.)", "Pending (Rs.)"];
    const catRows = [catHdr, ...Object.entries(catMap).sort().map(([cat, v]) => [
      cat,
      v.count,
      v.taxable.toFixed(2),
      v.tax.toFixed(2),
      v.total.toFixed(2),
      v.paid.toFixed(2),
      v.pending.toFixed(2)
    ])];
    const cTot = Object.values(catMap).reduce((a, v) => ({ count: a.count + v.count, taxable: a.taxable + v.taxable, tax: a.tax + v.tax, total: a.total + v.total, paid: a.paid + v.paid, pending: a.pending + v.pending }), { count: 0, taxable: 0, tax: 0, total: 0, paid: 0, pending: 0 });
    catRows.push(["TOTAL", cTot.count, cTot.taxable.toFixed(2), cTot.tax.toFixed(2), cTot.total.toFixed(2), cTot.paid.toFixed(2), cTot.pending.toFixed(2)]);
    addSheet(wb, catRows, "Purchase Category Summary", [22, 12, 16, 16, 18, 16, 16]);
    const monMap = {};
    expenses.forEach((e) => {
      var _a;
      const m = ((_a = e.date) == null ? void 0 : _a.substring(0, 7)) || "Unknown";
      if (!monMap[m]) monMap[m] = { count: 0, taxable: 0, tax: 0, total: 0, paid: 0, pending: 0 };
      monMap[m].count++;
      monMap[m].taxable += parseFloat(e.taxable) || 0;
      monMap[m].tax += parseFloat(e.gstAmt) || 0;
      monMap[m].total += parseFloat(e.total) || 0;
      if ((e.payStatus || "").toLowerCase() === "paid") monMap[m].paid += parseFloat(e.total) || 0;
      else monMap[m].pending += parseFloat(e.total) || 0;
    });
    const mPurHdr = ["Month", "No. of Bills", "Taxable (Rs.)", "Total Tax (Rs.)", "Total Amount (Rs.)", "Paid (Rs.)", "Pending (Rs.)"];
    const mPurRows = [mPurHdr, ...Object.entries(monMap).sort().map(([m, v]) => [
      m,
      v.count,
      v.taxable.toFixed(2),
      v.tax.toFixed(2),
      v.total.toFixed(2),
      v.paid.toFixed(2),
      v.pending.toFixed(2)
    ])];
    addSheet(wb, mPurRows, "Monthly Purchase Summary", [12, 12, 16, 16, 18, 16, 16]);
    const poHdr = [
      "Sl.No",
      "PO Number",
      "PO Date",
      "Delivery By",
      "Status",
      "Vendor Name",
      "Vendor GSTIN",
      "Vendor Address",
      "Deliver To",
      "Description",
      "HSN/SAC",
      "Qty",
      "Unit",
      "Rate (Rs.)",
      "Line Amount (Rs.)",
      "Sub Total (Rs.)",
      "Taxes/Freight (Rs.)",
      "Grand Total (Rs.)",
      "Ref No",
      "Notes",
      "Created By"
    ];
    const poRows = [poHdr];
    let poSl = 1;
    pos.forEach((po) => {
      const items = (po.items || []).filter((r) => r.desc);
      const grand = (po.items || []).reduce((s, r) => s + (parseFloat(r.qty) || 0) * (parseFloat(r.rate) || 0), 0) + Number(po.taxes || 0);
      (items.length ? items : [{ desc: "\u2014", qty: "", unit: "", rate: "", hsnCode: "" }]).forEach((it, idx) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i;
        poRows.push([
          idx === 0 ? poSl : "",
          idx === 0 ? po.poNo : "",
          idx === 0 ? fmtDate(po.date) : "",
          idx === 0 ? fmtDate(po.deliveryDate) : "",
          idx === 0 ? po.status || "Draft" : "",
          idx === 0 ? ((_a = po.vendorTo) == null ? void 0 : _a.name) || "" : "",
          idx === 0 ? (((_b = po.vendorTo) == null ? void 0 : _b.gstin) || "").toUpperCase() : "",
          idx === 0 ? [(_c = po.vendorTo) == null ? void 0 : _c.address, (_d = po.vendorTo) == null ? void 0 : _d.city, (_e = po.vendorTo) == null ? void 0 : _e.state, (_f = po.vendorTo) == null ? void 0 : _f.pin].filter(Boolean).join(", ") : "",
          idx === 0 ? [(_g = po.deliverTo) == null ? void 0 : _g.name, (_h = po.deliverTo) == null ? void 0 : _h.address, (_i = po.deliverTo) == null ? void 0 : _i.city].filter(Boolean).join(", ") : "",
          it.desc || "",
          it.hsnCode || "",
          it.qty || "",
          it.unit || "Nos",
          parseFloat(it.rate) || 0,
          Number((parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0)).toFixed(2),
          idx === 0 ? Number((po.items || []).reduce((s, r) => s + (parseFloat(r.qty) || 0) * (parseFloat(r.rate) || 0), 0)).toFixed(2) : "",
          idx === 0 ? Number(po.taxes || 0).toFixed(2) : "",
          idx === 0 ? Number(grand).toFixed(2) : "",
          idx === 0 ? po.refNo || "" : "",
          idx === 0 ? po.notes || "" : "",
          idx === 0 ? po.createdBy || "" : ""
        ]);
        if (idx === 0) poSl++;
      });
    });
    addSheet(
      wb,
      poRows,
      "PO Register",
      [5, 16, 12, 12, 10, 24, 18, 30, 28, 28, 12, 8, 8, 14, 16, 16, 14, 16, 14, 24, 20]
    );
    const custHdr = ["Sl.No", "Name", "Contact Person", "GSTIN", "PAN", "Address", "City", "State", "PIN", "Phone", "Email", "Payment Terms (days)", "Credit Limit (Rs.)", "Opening Balance (Rs.)", "Invoices (count)", "Total Invoiced (Rs.)", "Outstanding (Rs.)", "Notes", "Created Date"];
    const custRows = [custHdr, ...customers.map((c, i) => [
      i + 1,
      c.name || "",
      c.contact || "",
      (c.gstin || "").toUpperCase(),
      c.pan || "",
      c.address || "",
      c.city || "",
      c.state || "",
      c.pin || "",
      c.phone || "",
      c.email || "",
      c.terms || "",
      c.creditLimit || "",
      c.openingBal || "",
      invoices.filter((v) => {
        var _a;
        return (((_a = v.billTo) == null ? void 0 : _a.name) || "") === c.name;
      }).length,
      Number(invoices.filter((v) => {
        var _a;
        return (((_a = v.billTo) == null ? void 0 : _a.name) || "") === c.name && v.docType !== "CREDIT NOTE";
      }).reduce((a, v) => a + Math.abs(getGrand(v)), 0)).toFixed(2),
      Number(invoices.filter((v) => {
        var _a;
        return (((_a = v.billTo) == null ? void 0 : _a.name) || "") === c.name && v.status !== "Draft" && v.status !== "Cancelled" && v.status !== "Paid" && v.docType !== "CREDIT NOTE";
      }).reduce((a, v) => a + Math.abs(getGrand(v)) - invPaid(v), 0)).toFixed(2),
      c.notes || "",
      c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN") : ""
    ])];
    addSheet(wb, custRows, "Customer Database", [5, 24, 18, 18, 14, 28, 14, 14, 8, 14, 24, 12, 14, 14, 10, 16, 16, 24, 14]);
    const hsnHdr = ["Sl.No", "Type", "Code", "Description", "Category", "GST Rate %", "Default Unit"];
    const hsnRows = [hsnHdr, ...hsnList.map((h, i) => [i + 1, h.type || "HSN", h.code || "", h.desc || "", h.category || "", h.taxRate || "", h.unit || "Nos"])];
    addSheet(wb, hsnRows, "HSN-SAC Database", [5, 8, 12, 40, 18, 10, 10]);
    const allMonths = [.../* @__PURE__ */ new Set([
      ...invoices.map((i) => {
        var _a;
        return (_a = i.date) == null ? void 0 : _a.substring(0, 7);
      }).filter(Boolean),
      ...expenses.map((e) => {
        var _a;
        return (_a = e.date) == null ? void 0 : _a.substring(0, 7);
      }).filter(Boolean)
    ])].sort();
    const plHdr = ["Month", "Sales (Rs.)", "Total Tax Collected (Rs.)", "Purchases/Expenses (Rs.)", "Net Profit (Rs.)", "Sales Frozen", "Expenses Frozen"];
    const plRows = [plHdr, ...allMonths.map((m) => {
      const mInvs = invoices.filter((i) => {
        var _a;
        return (_a = i.date) == null ? void 0 : _a.startsWith(m);
      });
      const mExps = expenses.filter((e) => {
        var _a;
        return (_a = e.date) == null ? void 0 : _a.startsWith(m);
      });
      const mSales = mInvs.reduce((s, i) => s + getGrand(i), 0);
      const mTax = mInvs.reduce((s, i) => s + (parseFloat(i.totalGST) || 0), 0);
      const mExp = mExps.reduce((s, e) => s + (parseFloat(e.total) || 0), 0);
      const salesFrz = (freezeD.sales || []).includes(m) ? "Yes" : "No";
      const expFrz = (freezeD.expenses || []).includes(m) ? "Yes" : "No";
      return [m, mSales.toFixed(2), mTax.toFixed(2), mExp.toFixed(2), (mSales - mExp).toFixed(2), salesFrz, expFrz];
    })];
    addSheet(wb, plRows, "Period P&L Summary", [12, 16, 22, 22, 16, 12, 14]);
    const frzHdr = ["Month", "Sales Frozen", "Expenses Frozen"];
    const frzRows = [frzHdr, ...allMonths.map((m) => [
      m,
      (freezeD.sales || []).includes(m) ? " Frozen" : "Open",
      (freezeD.expenses || []).includes(m) ? " Frozen" : "Open"
    ])];
    if ((freezeD.sales || []).length > 0 || (freezeD.expenses || []).length > 0) {
      addSheet(wb, frzRows, "Frozen Periods", [12, 14, 16]);
    }
    if (auditLogs.length > 0) {
      const auditHdr = ["Timestamp", "Action", "Detail", "User Name", "User Email", "Date", "Time"];
      const auditRows = [auditHdr, ...(Array.isArray(auditLogs) ? auditLogs : Object.values(auditLogs)).map((l) => [
        new Date(l.ts).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        (l.action || "").replace(/_/g, " "),
        l.detail || "",
        l.userName || "",
        l.user || "",
        new Date(l.ts).toLocaleDateString("en-IN"),
        new Date(l.ts).toLocaleTimeString("en-IN")
      ])];
      addSheet(wb, auditRows, "Audit Log", [22, 20, 55, 20, 30, 14, 12]);
      const actCounts = {};
      (Array.isArray(auditLogs) ? auditLogs : Object.values(auditLogs)).forEach((l) => {
        const a = l.action || "UNKNOWN";
        actCounts[a] = (actCounts[a] || 0) + 1;
      });
      const actRows = [["Action", "Count"], ...Object.entries(actCounts).sort((a, b) => b[1] - a[1]).map(([a, c]) => [a.replace(/_/g, " "), c])];
      addSheet(wb, actRows, "Audit Summary", [30, 10]);
    }
    const termsRows = [["Type", "Terms & Conditions"], ["Invoice T&C", terms], ["PO T&C", poTerms]];
    addSheet(wb, termsRows, "Terms & Conditions", [14, 80]);
    XLSX2.writeFile(wb, `ArcticBooks_FullBackup_${dt}.xlsx`);
    toast.success(`Full backup downloaded \u2014 ${wb.SheetNames.length} sheets, ${invoices.length} invoices, ${expenses.length} expenses, ${pos.length} POs`);
  } catch (e) {
    console.error("Full backup error:", e);
    toast.error("Backup failed: " + (e.message || String(e)));
  }
};
const makeExcel = (invoices, fmt2 = "xlsx", meta = {}) => {
  const XLSX2 = window.XLSX;
  const wb = XLSX2.utils.book_new();
  const headers = [
    "Sl.No",
    "Document Type",
    "Invoice No",
    "Voucher No.",
    "Txn Ref No.",
    "Invoice Date",
    "Original Invoice No",
    "Original Invoice Date",
    "Sent to Customer",
    "Customer Name",
    "Customer GSTIN",
    "Customer State",
    "Bill To Address",
    "HSN/SAC",
    "Description",
    "Unit",
    "Qty",
    "Rate (Rs.)",
    "Discount %",
    "Taxable Amount (Rs.)",
    "GST Type",
    "Tax Rate %",
    "CGST %",
    "CGST Amount (Rs.)",
    "SGST %",
    "SGST Amount (Rs.)",
    "IGST %",
    "IGST Amount (Rs.)",
    "Total Tax (Rs.)",
    "Invoice Total (Rs.)",
    "Payment Status",
    "Due Date",
    "PO/Reference No",
    "Notes",
    "Created By"
  ];
  const rows = [...companyHeaderRows(), headers];
  let sl = 1;
  invoices.forEach((inv) => {
    const items = (inv.items || []).filter((r) => r.desc);
    const gt = inv.gstType || "INTRA";
    const isNG = inv.docType === "NON GST INVOICE";
    const dt = inv.isB2C ? "TAX INVOICE (B2C)" : isNG ? "NON-GST TRANSACTION" : inv.docType || "TAX INVOICE";
    const isCN = dt === "CREDIT NOTE";
    const sign = isCN ? -1 : 1;
    const isCDN = inv.docType === "CREDIT NOTE" || inv.docType === "DEBIT NOTE";
    items.forEach((r) => {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      const tR = isNG ? 0 : parseFloat(r.taxRate) || 0;
      const tax = isNG ? 0 : parseFloat(r.taxable) || 0;
      const gst = isNG ? 0 : parseFloat(r.gstAmt) || 0;
      const lineTotal = isNG ? (parseFloat(r.qty) || 0) * (parseFloat(r.rate) || 0) : parseFloat(r.total) || 0;
      rows.push([
        sl++,
        dt,
        inv.invNo || "",
        inv.voucherNo || "",
        inv.txnRefNo || "",
        fmtDate(inv.date) || "",
        isCDN ? inv.origInvNo || "" : "",
        isCDN ? inv.origInvDate ? fmtDate(inv.origInvDate) : "" : "",
        inv.sentToCustomer ? "Yes" : "No",
        ((_a = inv.billTo) == null ? void 0 : _a.name) || "",
        (((_b = inv.billTo) == null ? void 0 : _b.gstin) || "").toUpperCase(),
        stateName((_c = inv.billTo) == null ? void 0 : _c.gstin) || ((_d = inv.billTo) == null ? void 0 : _d.state) || "",
        [(_e = inv.billTo) == null ? void 0 : _e.address, (_f = inv.billTo) == null ? void 0 : _f.city, (_g = inv.billTo) == null ? void 0 : _g.state, (_h = inv.billTo) == null ? void 0 : _h.pin].filter(Boolean).join(", "),
        isNG ? "" : r.hsnCode || "",
        r.desc || "",
        isNG ? "Nos" : r.unit || "Nos",
        r.qty || 1,
        r.rate || 0,
        isNG ? 0 : r.discount || 0,
        Number(sign * tax).toFixed(2),
        isNG ? "NON-GST" : gt,
        tR,
        isNG ? "" : gt === "INTRA" ? tR / 2 : "",
        isNG ? "" : gt === "INTRA" ? Number(sign * gst / 2).toFixed(2) : "",
        isNG ? "" : gt === "INTRA" ? tR / 2 : "",
        isNG ? "" : gt === "INTRA" ? Number(sign * gst / 2).toFixed(2) : "",
        isNG ? "" : gt !== "INTRA" ? tR : "",
        isNG ? "" : gt !== "INTRA" ? Number(sign * gst).toFixed(2) : "",
        isNG ? 0 : Number(sign * gst).toFixed(2),
        Number(isNG ? lineTotal : getGrand(inv)).toFixed(2),
        inv.status || "Sent",
        inv.dueDate ? fmtDate(inv.dueDate) : "",
        inv.poNo || "",
        inv.notes || "",
        inv.createdBy || ""
      ]);
    });
  });
  const ws = XLSX2.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 5 }, { wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 13 }, { wch: 16 }, { wch: 16 }, { wch: 8 }, { wch: 22 }, { wch: 20 }, { wch: 16 }, { wch: 28 }, { wch: 12 }, { wch: 28 }, { wch: 8 }, { wch: 7 }, { wch: 12 }, { wch: 8 }, { wch: 18 }, { wch: 10 }, { wch: 9 }, { wch: 8 }, { wch: 16 }, { wch: 8 }, { wch: 16 }, { wch: 8 }, { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 13 }, { wch: 14 }, { wch: 22 }, { wch: 20 }];
  XLSX2.utils.book_append_sheet(wb, ws, "Sales Register");
  const totals = {};
  invoices.forEach((inv) => {
    var _a;
    const isCN = inv.docType === "CREDIT NOTE", sign = isCN ? -1 : 1;
    const isB2C = inv.isB2C || false;
    const isNG = inv.docType === "NON GST INVOICE";
    (inv.items || []).filter((r) => r.desc).forEach((r) => {
      var _a2;
      const m2 = ((_a2 = inv.date) == null ? void 0 : _a2.substring(0, 7)) || "?";
      if (!totals[m2]) totals[m2] = { inv: 0, b2c: 0, cn: 0, dn: 0, ng: 0, taxable: 0, tax: 0, total: 0 };
      totals[m2].taxable += isNG ? 0 : sign * (parseFloat(r.taxable) || 0);
      totals[m2].tax += isNG ? 0 : sign * (parseFloat(r.gstAmt) || 0);
      totals[m2].total += isNG ? (parseFloat(r.qty) || 0) * (parseFloat(r.rate) || 0) : sign * (parseFloat(r.total) || 0);
    });
    const m = ((_a = inv.date) == null ? void 0 : _a.substring(0, 7)) || "?";
    if (!totals[m]) totals[m] = { inv: 0, b2c: 0, cn: 0, dn: 0, ng: 0, taxable: 0, tax: 0, total: 0 };
    if (isCN) totals[m].cn++;
    else if (inv.docType === "DEBIT NOTE") totals[m].dn++;
    else if (isNG) totals[m].ng++;
    else if (isB2C) totals[m].b2c++;
    else totals[m].inv++;
  });
  const summRows = [
    ["Month", "B2B Invoices", "B2C Invoices", "Non-GST", "Debit Notes", "Credit Notes", "Net Taxable (Rs.)", "Net Tax (Rs.)", "Net Total (Rs.)"],
    ...Object.entries(totals).sort().map(([m, v]) => [m, v.inv, v.b2c, v.ng, v.dn, v.cn, Number(v.taxable).toFixed(2), Number(v.tax).toFixed(2), Number(v.total).toFixed(2)])
  ];
  const ws2 = XLSX2.utils.aoa_to_sheet(summRows);
  ws2["!cols"] = [{ wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 18 }, { wch: 18 }];
  XLSX2.utils.book_append_sheet(wb, ws2, "Monthly Summary");
  proExport(fmt2, {
    ...proWbToSpec(wb, { title: "Sales Register", period: meta.period || "" }),
    pdfSheets: fmt2 === "pdf" ? [{ name: "Sales Register", aoa: regSalesPdf(invoices), h0: true }, { name: "Monthly Summary", aoa: summRows, h0: true }] : void 0
  }, `SalesRegister_${today()}`);
};
const CompanyModal = ({ onClose, currentUser, inline = false }) => {
  const [d, setD] = useState(S.get(SK.CO, { name: "", formerName: "", address: "", city: "", state: "", pin: "", gstin: "", phone: "", email: "", website: "", logo: "", bankName: "", bankAccount: "", bankIFSC: "", bankBranch: "", signatory: "", panNo: "", paymentMode: "netbanking", upiId: "", upiQR: "", waEnabled: false }));
  const [waNum, setWaNum] = useState(S.get(SK.WA, ""));
  const [prev, setPrev] = useState(d.logo || "");
  const [upiQRPrev, setUpiQRPrev] = useState(d.upiQR || "");
  const fileRef = useRef();
  const upiQRRef = useRef();
  const up = (k) => (e) => setD((p) => ({ ...p, [k]: e.target.value }));
  const isSuper = isSuperAdmin(currentUser == null ? void 0 : currentUser.email);
  const save = () => {
    if (!d.name) {
      toast.error("Company name required");
      return;
    }
    S.set(SK.CO, d);
    if (isSuper) S.set(SK.WA, waNum.replace(/\D/g, ""));
    logAudit("COMPANY_SETTINGS_UPDATED", `${d.name}`, currentUser);
    toast.success("Company saved!");
    onClose();
  };
  const handleLogo = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      toast.error("Max 2MB");
      return;
    }
    const r = new FileReader();
    r.onload = (ev) => {
      const b = ev.target.result;
      setD((p) => ({ ...p, logo: b }));
      setPrev(b);
    };
    r.readAsDataURL(f);
  };
  const handleUpiQR = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 1 * 1024 * 1024) {
      toast.error("Max 1MB for QR");
      return;
    }
    const r = new FileReader();
    r.onload = (ev) => {
      const b = ev.target.result;
      setD((p) => ({ ...p, upiQR: b }));
      setUpiQRPrev(b);
    };
    r.readAsDataURL(f);
  };
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay", onClick: inline ? void 0 : ((e) => e.target === e.currentTarget && onClose()) }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal", style: { ...inline ? {} : { maxWidth: "min(860px, 95vw)", width: "100%" } } }, /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("span", { className: "modal-title" }, /* @__PURE__ */ React.createElement(Ic, { n: "building", s: 16 }), " Company Details"), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Ic, { n: "x" }))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 18 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "field-label" }, "Company Logo"), /* @__PURE__ */ React.createElement("div", { className: "logo-box", onClick: () => fileRef.current.click() }, prev ? /* @__PURE__ */ React.createElement("img", { src: prev, alt: "logo" }) : /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", color: "var(--text3)", fontSize: 11 } }, /* @__PURE__ */ React.createElement(Ic, { n: "upload", s: 20 }), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 4 } }, "Upload"))), /* @__PURE__ */ React.createElement("input", { ref: fileRef, type: "file", accept: "image/*", style: { display: "none" }, onChange: handleLogo }), prev && /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm", style: { marginTop: 6, width: 88 }, onClick: () => {
    setPrev("");
    setD((p) => ({ ...p, logo: "" }));
  } }, "Remove"), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6, fontSize: 10.5, color: "var(--text3)", maxWidth: 88 } }, "Appears on your invoices & PDFs \u2014 not the Arctic Books app icon.")), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Company Name *"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.name, onChange: up("name"), placeholder: "Your Business Name" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Formerly Known As (optional)"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.formerName || "", onChange: up("formerName"), placeholder: "Old registered name, if any \u2014 prints under company name on PDF" })), /* @__PURE__ */ React.createElement("div", { className: "g2" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "GSTIN"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.gstin, onChange: (e) => setD((p) => ({ ...p, gstin: e.target.value.toUpperCase() })), placeholder: "29AAAAA0000A1Z5", maxLength: 15, style: { textTransform: "uppercase" } })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "PAN Number"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.panNo, onChange: up("panNo"), placeholder: "AAAAA0000A", maxLength: 10, style: { textTransform: "uppercase" } }))))), /* @__PURE__ */ React.createElement("div", { className: "sep-text" }, "Address"), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Street Address"), /* @__PURE__ */ React.createElement("textarea", { className: "field-input", value: d.address, onChange: up("address"), rows: 2, placeholder: "Door No, Street, Area" })), /* @__PURE__ */ React.createElement("div", { className: "g3" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "City"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.city, onChange: up("city"), placeholder: "City" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "State"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.state, onChange: up("state"), placeholder: "State" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "PIN Code"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.pin, onChange: up("pin"), placeholder: "560001", maxLength: 6 }))), /* @__PURE__ */ React.createElement("div", { className: "sep-text" }, "Contact"), /* @__PURE__ */ React.createElement("div", { className: "g3" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Phone"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.phone, onChange: up("phone") })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Email"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.email, onChange: up("email") })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Website"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.website, onChange: up("website") }))), /* @__PURE__ */ React.createElement("div", { className: "sep-text" }, "Bank Details"), /* @__PURE__ */ React.createElement("div", { className: "g2" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Bank Name"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.bankName, onChange: up("bankName") })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Account Number"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.bankAccount, onChange: up("bankAccount") })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "IFSC Code"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.bankIFSC, onChange: up("bankIFSC"), style: { textTransform: "uppercase" } })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Branch Name"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.bankBranch, onChange: up("bankBranch") }))), /* @__PURE__ */ React.createElement("div", { className: "field", style: { maxWidth: 340 } }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Authorised Signatory Name"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.signatory, onChange: up("signatory"), placeholder: "Proprietor / Director" })), /* @__PURE__ */ React.createElement("div", { className: "sep-text" }, "WhatsApp Share Button"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: "rgba(37,211,102,0.05)", border: "1px solid rgba(37,211,102,0.2)", borderRadius: 10 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flex: 1 } }, /* @__PURE__ */ React.createElement("div", { onClick: () => setD((p) => ({ ...p, waEnabled: !p.waEnabled })), style: { width: 44, height: 24, borderRadius: 12, background: d.waEnabled ? "#25D366" : "var(--border2)", position: "relative", transition: "background 0.2s", cursor: "pointer", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: 3, left: d.waEnabled ? 22 : 3, width: 18, height: 18, borderRadius: 9, background: "white", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.25)" } })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--text)", fontSize: 13 } }, d.waEnabled ? "WhatsApp button enabled" : "WhatsApp button disabled"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", marginTop: 2 } }, d.waEnabled ? "Button visible on invoice form \u2014 sends PDF + message to customer" : "Button hidden. Enable to allow sharing invoices via WhatsApp.")))), /* @__PURE__ */ React.createElement("div", { className: "sep-text" }, "Payment Method on Invoice"), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "field-label", style: { marginBottom: 8 } }, "Show in PDF Invoice"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, [["netbanking", "Net Banking Only"], ["upi", "UPI Only"], ["both", "Both"]].map(([v, l]) => /* @__PURE__ */ React.createElement("label", { key: v, style: { display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: "7px 14px", borderRadius: 8, border: `2px solid ${d.paymentMode === v ? "var(--primary)" : "var(--border2)"}`, background: d.paymentMode === v ? "var(--primary-bg)" : "transparent", fontSize: 12, fontWeight: d.paymentMode === v ? 700 : 500, color: d.paymentMode === v ? "var(--primary2)" : "var(--text2)", transition: "all 0.2s" } }, /* @__PURE__ */ React.createElement("input", { type: "radio", name: "paymode", value: v, checked: d.paymentMode === v, onChange: up("paymentMode"), style: { display: "none" } }), l)))), (d.paymentMode === "upi" || d.paymentMode === "both") && /* @__PURE__ */ React.createElement("div", { style: { background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--primary2)", fontSize: 13, marginBottom: 12 } }, "UPI Settings"), /* @__PURE__ */ React.createElement("div", { className: "g2", style: { alignItems: "start" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "UPI ID"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: d.upiId || "", onChange: up("upiId"), placeholder: "yourname@bank or 9876543210@upi" })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text3)", marginTop: -8 } }, "This appears on the invoice as UPI ID")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "field-label", style: { marginBottom: 6 } }, "UPI QR Code Image"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center" } }, /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { width: 72, height: 72, border: "2px dashed var(--border2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "var(--card)", cursor: "pointer", flexShrink: 0 },
      onClick: () => upiQRRef.current.click()
    },
    upiQRPrev ? /* @__PURE__ */ React.createElement("img", { src: upiQRPrev, alt: "QR", style: { width: "100%", height: "100%", objectFit: "contain" } }) : /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", color: "var(--text3)", fontSize: 10 } }, /* @__PURE__ */ React.createElement(Ic, { n: "upload", s: 18 }), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 2 } }, "QR Code"))
  ), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("input", { ref: upiQRRef, type: "file", accept: "image/*", style: { display: "none" }, onChange: handleUpiQR }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-primary btn-sm", onClick: () => upiQRRef.current.click() }, /* @__PURE__ */ React.createElement(Ic, { n: "camera", s: 16 }), " Upload QR"), upiQRPrev && /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm", style: { marginTop: 6, display: "block" }, onClick: () => {
    setUpiQRPrev("");
    setD((p) => ({ ...p, upiQR: "" }));
  } }, "Remove"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text3)", marginTop: 4 } }, "PNG/JPG \xB7 max 1MB")))))), isSuper && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, padding: "12px 14px", background: "rgba(37,211,102,0.06)", border: "1px solid rgba(37,211,102,0.2)", borderRadius: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "#16a34a", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "#16a34a" }, /* @__PURE__ */ React.createElement("path", { d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" })), "WhatsApp Business Number ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#16a34a", fontWeight: 500 } }, "(Super Admin only)")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "var(--text3)", fontWeight: 600, flexShrink: 0 } }, "+91"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: waNum, onChange: (e) => setWaNum(e.target.value), placeholder: "9876543210 (10 digits)", maxLength: 10, style: { maxWidth: 200 } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text3)" } }, "Your business WhatsApp number (for reference)")), waNum && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#16a34a", marginTop: 6 } }, "Saved: +91 ", waNum, " \u2014 Invoice WhatsApp button sends to customer's phone number"))), /* @__PURE__ */ React.createElement("div", { className: "modal-ftr" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: onClose }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: save }, /* @__PURE__ */ React.createElement(Ic, { n: "save" }), "Save Company"))));
};
const HSNModal = ({ onClose, inline = false, searchQuery = "", currentUser }) => {
  const [activeTab, setActiveTab] = useState("hsn");
  const [list, setList] = useState(S.get(SK.HSN, []));
  const [form, setForm] = useState({ code: "", desc: "", taxRate: "18", unit: "Nos", type: "HSN", category: "" });
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState(searchQuery);
  useEffect(() => {
    if (searchQuery !== void 0) setQ(searchQuery);
  }, [searchQuery]);
  const up = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const filtered = list.filter((h) => h.code.includes(q) || h.desc.toLowerCase().includes(q.toLowerCase()) || (h.category || "").toLowerCase().includes(q.toLowerCase()));
  const save = () => {
    if (!form.code || !form.desc) {
      toast.error("Code & description required");
      return;
    }
    let u;
    const wasEditing = editing !== null;
    if (editing !== null) {
      u = list.map((h, i) => i === editing ? { ...form } : h);
    } else {
      if (list.find((h) => h.code === form.code)) {
        toast.error("Code exists");
        return;
      }
      u = [...list, { ...form }];
    }
    setList(u);
    S.set(SK.HSN, u);
    logAudit(wasEditing ? "HSN_EDITED" : "HSN_ADDED", `${form.code} \u2014 ${form.desc}`, currentUser);
    setForm({ code: "", desc: "", taxRate: "18", unit: "Nos", type: "HSN", category: "" });
    setEditing(null);
    toast.success(editing !== null ? "Updated!" : "Added!");
  };
  const del = (i) => {
    const h = list[i];
    const u = list.filter((_, j) => j !== i);
    setList(u);
    S.set(SK.HSN, u);
    logAudit("HSN_DELETED", `${(h == null ? void 0 : h.code) || ""} \u2014 ${(h == null ? void 0 : h.desc) || ""}`, currentUser);
    toast.info("Deleted");
  };
  const editE = (i) => {
    setForm({ ...list[i] });
    setEditing(i);
  };
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay", onClick: inline ? void 0 : ((e) => e.target === e.currentTarget && onClose()) }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal", style: { ...inline ? {} : { maxWidth: "min(1060px, 95vw)", width: "100%" } } }, /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("span", { className: "modal-title" }, /* @__PURE__ */ React.createElement(Ic, { n: "tag", s: 16 }), " HSN / SAC Database"), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Ic, { n: "x" }))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: 18 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--primary2)", marginBottom: 14, fontSize: 13 } }, editing !== null ? "Edit Entry" : "Add HSN/SAC Code"), /* @__PURE__ */ React.createElement("div", { className: "g4" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Type"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: form.type, onChange: up("type") }, /* @__PURE__ */ React.createElement("option", { value: "HSN" }, "HSN (Goods)"), /* @__PURE__ */ React.createElement("option", { value: "SAC" }, "SAC (Services)"))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Code *"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.code, onChange: up("code"), placeholder: "e.g. 8471", maxLength: 8 })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "GST Rate %"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: form.taxRate, onChange: up("taxRate") }, TAX_RATES.map((r) => /* @__PURE__ */ React.createElement("option", { key: r, value: r }, r, "%")))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Default Unit"), /* @__PURE__ */ React.createElement("select", { className: "field-input", value: form.unit, onChange: up("unit") }, UNITS.map((u) => /* @__PURE__ */ React.createElement("option", { key: u }, u))))), /* @__PURE__ */ React.createElement("div", { className: "g2" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Description *"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.desc, onChange: up("desc"), placeholder: "Detailed description of goods/services" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label" }, "Category (optional)"), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: form.category, onChange: up("category"), placeholder: "e.g. Electronics, IT Products" }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: save }, editing !== null ? "Update" : "Add Entry"), editing !== null && /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: () => {
    setForm({ code: "", desc: "", taxRate: "18", unit: "Nos", type: "HSN", category: "" });
    setEditing(null);
  } }, "Cancel"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text2)", fontSize: 13 } }, list.length, " entries"), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", maxWidth: 260 } }, /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", zIndex: 1 } }, /* @__PURE__ */ React.createElement(Ic, { n: "search", s: 14 })), /* @__PURE__ */ React.createElement("input", { className: "field-input", value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search...", style: { paddingLeft: 38, width: "100%" } }))), filtered.length > 0 ? /* @__PURE__ */ React.createElement("div", { className: "dt-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dt", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Type"), /* @__PURE__ */ React.createElement("th", null, "Code"), /* @__PURE__ */ React.createElement("th", null, "Description"), /* @__PURE__ */ React.createElement("th", null, "Category"), /* @__PURE__ */ React.createElement("th", null, "Rate"), /* @__PURE__ */ React.createElement("th", null, "Unit"), /* @__PURE__ */ React.createElement("th", { style: { width: 80 } }, "Actions"))), /* @__PURE__ */ React.createElement("tbody", null, filtered.map((h, i) => {
    const idx = list.indexOf(h);
    return /* @__PURE__ */ React.createElement("tr", { key: i }, /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: `badge ${h.type === "SAC" ? "badge-blue" : "badge-gold"}` }, h.type)), /* @__PURE__ */ React.createElement("td", { style: { fontWeight: 700, color: "var(--gold)", fontFamily: "monospace" } }, h.code), /* @__PURE__ */ React.createElement("td", { style: { maxWidth: 250 } }, h.desc), /* @__PURE__ */ React.createElement("td", { style: { color: "var(--text3)", fontSize: 12 } }, h.category || "\u2014"), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: "badge badge-green" }, h.taxRate, "%")), /* @__PURE__ */ React.createElement("td", { style: { color: "var(--text2)" } }, h.unit), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline btn-icon", onClick: () => editE(idx) }, /* @__PURE__ */ React.createElement(Ic, { n: "edit", s: 12 })), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger btn-icon", onClick: () => del(idx) }, /* @__PURE__ */ React.createElement(Ic, { n: "trash", s: 12 })))));
  })))) : /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "32px", color: "var(--text3)" } }, q ? "No matches." : "No entries yet."))), /* @__PURE__ */ React.createElement("div", { className: "modal-ftr" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: onClose }, "Done"))));
};
const TermsModal = ({ onClose, inline = false, currentUser }) => {
  const [tab, setTab] = useState("invoice");
  const [t, setT] = useState(S.get(SK.TERMS, DEFAULT_TERMS));
  const [pt, setPt] = useState(S.get(SK.PO_TERMS, DEFAULT_PO_TERMS));
  const [showT, setShowT] = useState(S.get(SK.SHOW_TERMS, true));
  const save = () => {
    const prevShowT = S.get(SK.SHOW_TERMS, true);
    S.set(SK.TERMS, t);
    S.set(SK.PO_TERMS, pt);
    S.set(SK.SHOW_TERMS, showT);
    logAudit("TERMS_UPDATED", `Invoice/PO terms saved${prevShowT !== showT ? ` \u2014 Show on invoice PDF: ${showT ? "ON" : "OFF"}` : ""}`, currentUser);
    toast.success("Terms saved!");
    onClose();
  };
  return /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card" : "overlay", onClick: inline ? void 0 : ((e) => e.target === e.currentTarget && onClose()) }, /* @__PURE__ */ React.createElement("div", { className: inline ? "inline-card-inner" : "modal", style: { ...inline ? {} : { maxWidth: "min(760px, 95vw)", width: "100%" } } }, /* @__PURE__ */ React.createElement("div", { className: "modal-hdr" }, /* @__PURE__ */ React.createElement("span", { className: "modal-title" }, /* @__PURE__ */ React.createElement(Ic, { n: "file", s: 20 }), " Terms & Conditions"), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Ic, { n: "x" }))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 8, padding: 3, gap: 3, marginBottom: 16 } }, [["invoice", "Invoice T&C"], ["po", "PO T&C"]].map(([k, l]) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: k,
      onClick: () => setTab(k),
      style: {
        flex: 1,
        padding: "7px 0",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: tab === k ? 700 : 500,
        cursor: "pointer",
        border: "none",
        background: tab === k ? "var(--primary)" : "transparent",
        color: tab === k ? "#fff" : "var(--text2)",
        transition: "all 0.2s"
      }
    },
    l
  ))), tab === "invoice" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--text)" } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: showT, onChange: (e) => setShowT(e.target.checked), style: { width: 16, height: 16, cursor: "pointer" } }), "Show Terms & Conditions on Invoice PDF"), /* @__PURE__ */ React.createElement("p", { style: { color: "var(--text2)", fontSize: 13, marginBottom: 10 } }, "These appear at the bottom of each ", /* @__PURE__ */ React.createElement("strong", null, "Tax Invoice PDF"), !showT && " (currently hidden \u2014 toggle above to show them)", "."), /* @__PURE__ */ React.createElement("textarea", { className: "field-input", value: t, onChange: (e) => setT(e.target.value), rows: 11, style: { fontFamily: "monospace", fontSize: 12.5, opacity: showT ? 1 : 0.5 }, disabled: !showT }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", style: { marginTop: 10 }, onClick: () => setT(DEFAULT_TERMS) }, "Reset to Default")), tab === "po" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { style: { color: "var(--text2)", fontSize: 13, marginBottom: 10 } }, "These appear at the bottom of each ", /* @__PURE__ */ React.createElement("strong", null, "Purchase Order PDF"), " automatically."), /* @__PURE__ */ React.createElement("textarea", { className: "field-input", value: pt, onChange: (e) => setPt(e.target.value), rows: 11, style: { fontFamily: "monospace", fontSize: 12.5 } }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", style: { marginTop: 10 }, onClick: () => setPt(DEFAULT_PO_TERMS) }, "Reset to Default"))), /* @__PURE__ */ React.createElement("div", { className: "modal-ftr" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: onClose }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: save }, /* @__PURE__ */ React.createElement(Ic, { n: "save" }), "Save Both"))));
};
const EXP_CATEGORIES = ["Raw Materials", "Packaging", "Freight / Transport", "Office Supplies", "Rent", "Electricity / Utilities", "Labour / Wages", "Professional Fees", "Repairs & Maintenance", "Software / IT", "Travel & Conveyance", "Advertising / Marketing", "Bank Charges", "Insurance", "Statutory / Tax Payments", "Other"];
const PAY_MODES = ["Cash", "Bank Transfer / NEFT", "UPI / GPay / PhonePe", "Cheque", "Credit Card", "Debit Card", "Other"];
const TDS_SECTIONS = [
  { code: "", label: "No TDS", rate: 0 },
  { code: "194C", label: "194C \u2014 Payment to Contractors", rate: 1 },
  { code: "194C-HUF", label: "194C \u2014 Contractors (Individual/HUF)", rate: 1 },
  { code: "194J", label: "194J \u2014 Professional / Technical Fees", rate: 10 },
  { code: "194Q", label: "194Q \u2014 Purchase of Goods", rate: 0.1 },
  { code: "194I", label: "194I \u2014 Rent", rate: 10 },
  { code: "194H", label: "194H \u2014 Commission / Brokerage", rate: 5 },
  { code: "194A", label: "194A \u2014 Interest (other than securities)", rate: 10 },
  { code: "OTHER", label: "Other Section", rate: 0 }
];
const tdsSectionRate = (code) => {
  var _a, _b;
  return (_b = (_a = TDS_SECTIONS.find((s) => s.code === code)) == null ? void 0 : _a.rate) != null ? _b : 0;
};
const ensureDefaultExpenseHeads = () => {
  const existingNames = getAllAccounts().filter((a) => a.type === "expense").map((a) => a.name.toLowerCase());
  const toSeed = EXP_CATEGORIES.filter((c) => c !== "Other" && !existingNames.includes(c.toLowerCase()));
  if (!toSeed.length) return;
  const seeded = toSeed.map((name) => ({
    key: "CUST_" + name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 24) + "_SEED",
    name,
    type: "expense",
    group: "Expenses",
    scheduleGroup: "Other Expenses",
    custom: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  }));
  S.set(SK.COA_CUSTOM, [...getCustomAccounts(), ...seeded]);
};
const addDaysStr = (dateStr, days) => {
  if (!dateStr) return "";
  const d = _pd(dateStr);
  if (isNaN(d)) return "";
  d.setDate(d.getDate() + (parseInt(days) || 0));
  return _iso(d);
};
const expItems = (e) => {
  if (!e) return [];
  if (Array.isArray(e.items) && e.items.length) return e.items;
  if (e.description || e.qty || e.rate) {
    const qty = parseFloat(e.qty) || 0, rate = parseFloat(e.rate) || 0;
    const taxable = qty * rate, tR = parseFloat(e.taxRate) || 0, gstAmt = taxable * tR / 100;
    return [{
      key: "legacy",
      product: e.product || "",
      desc: e.description || "",
      hsnCode: e.hsnCode || "",
      unit: e.unit || "Nos",
      qty,
      rate,
      taxRate: e.taxRate || "18",
      taxable: +taxable.toFixed(2),
      gstAmt: +gstAmt.toFixed(2),
      total: +(taxable + gstAmt).toFixed(2),
      toStock: !!e.addToStock
    }];
  }
  return [];
};
const expTotal = (e) => parseFloat(e == null ? void 0 : e.total) || 0;
const expTdsAmt = (e) => parseFloat(e == null ? void 0 : e.tdsAmount) || 0;
const expNetPayable = (e) => (e == null ? void 0 : e.netPayable) != null ? parseFloat(e.netPayable) : Math.max(0, expTotal(e) - expTdsAmt(e));
const expPaid = (e) => {
  if (!e) return 0;
  const base = expNetPayable(e);
  if (e.payStatus === "Paid") return base;
  if (e.payStatus === "Partial") return Math.min(base, parseFloat(e.paidAmount) || 0);
  return 0;
};
const expDue = (e) => Math.max(0, expNetPayable(e) - expPaid(e));
const expDueDate = (e) => {
  var _a;
  return (e == null ? void 0 : e.dueDate) || addDaysStr((e == null ? void 0 : e.billDate) || (e == null ? void 0 : e.date), (_a = e == null ? void 0 : e.creditDays) != null ? _a : 30);
};
const expStockQty = (e) => expItems(e).filter((it) => it.toStock !== false).reduce((t, it) => t + (parseFloat(it.qty) || 0), 0);
const reverseStockForPurchase = (e) => {
  if (e) removeStockForSource("PUR-" + e.id);
};
let _pItemSeq = 0;
const blankPItem = () => ({
  key: Date.now().toString(36) + ++_pItemSeq,
  product: "",
  desc: "",
  hsnCode: "",
  unit: "Nos",
  qty: 1,
  rate: "",
  taxRate: "18",
  taxable: 0,
  gstAmt: 0,
  total: 0,
  toStock: true
});
