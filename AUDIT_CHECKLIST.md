
## v6.1 changes (this round)
- Payroll: Employee form and Settings had inner components re-created every render (inputs lost focus after each key, so typing "kept going back"). Hoisted to top level / context. Pay-run grid inputs verified to be inline.
- Invoice History: "Duplicate" is now a labeled button with a confirmation; it opens an unsaved Draft with a new number (nothing is written to the books until Save). "Load" only opens the existing invoice.
- New Customers page (Zoho-style): list with balances on the left; card on the right with Overview / Comments / Transactions / Mails / Statement tabs, Edit, New Transaction (prefilled invoice, credit note, quote, sales order, DC, payment) and More.
- Exports widened: Customer Database sheet (contact, PAN, terms, credit limit, opening balance, invoice count, invoiced, outstanding) and Sales Register (+8 columns: phone, email, round-off, paid, balance, paid date, subject, time). Customer list / transactions / statement exports from the card.
- Layout: tables fill the viewport height, sidebar nav no longer hidden behind the user card, top-bar page title no longer truncated.
- Not tested in a real browser (SSR + syntax + logic tests only).
