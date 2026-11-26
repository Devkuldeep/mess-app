# mess-app

## 0.2.0

### Minor Changes

- "Download my data" for owners: ZIP with Excel-ready CSVs (customers, balances, payments, skips, deliveries, plans, holidays, staff) plus a full `data.json`.
- Mess management MVP: multi-tenant orgs with owner/manager/delivery roles, phone + password login, today/tomorrow cooking count (lunch/dinner, veg/non-veg, special requests), delivery checklist grouped by area, customers with plans, monthly billing from scheduled meals (skips and holidays deducted) with WhatsApp payment reminders, and a no-login customer link to skip meals before the cutoff and pay by UPI/QR. Hindi-first UI with English toggle.
- Installable offline PWA: Serwist service worker caches the app and visited pages (opens without internet, `/offline` fallback), and delivery ticks and payments are saved on the phone (Dexie outbox) and synced automatically when the connection returns.
- Wastage tracking: 30-second daily "kitna bana / kitna bacha" entry per meal (works offline), 7/30-day report with waste %, ₹ loss, worst dishes and varieties, and reasons, and a "cook about" suggestion on the count screen learned from the last 4 weeks. Dishes and wastage target are configurable; wastage is included in the data export.
