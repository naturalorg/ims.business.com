
## v6.2 changes
- Exports (Excel / CSV / PDF) now follow the Arctic GSTR-1 report design for every register and report:
  - Excel: "Overview" sheet (gradient banner, company/GSTIN/period/generated, KEY METRICS cards, auto KEY INSIGHTS, Top-10 table, gradient bar chart, workbook guide, footer) + data sheets with lavender header row, zebra rows, ₹ number format, real dd-mmm-yyyy dates, filters, frozen header.
  - CSV: same column order, plain numbers (2 dp), dd-mmm-yyyy dates, UTF-8 BOM.
  - PDF: gradient banner, company/GSTIN strip, KPI cards, lavender-header table, branded footer.
- Product Master is now a normal page (Items > Product Master), not a popup.
- Invoice History / Dashboard: "Open" shows a read-only invoice card (items, totals, payment progress, details) with Download PDF, Duplicate (confirm) and Edit (blocked on frozen months). Nothing is created by opening.
- History table: wider Actions column, no nested scrolling in page mode.
- Tested: syntax, server-side render of all new pages, export code against a stub library. NOT tested in a real browser (Excel/PDF files not opened).
