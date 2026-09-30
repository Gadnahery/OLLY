# OLLY — Food-Processing Business ERP

> ERP-level intelligence. The user never feels like they are using an ERP.

OLLY connects **Purchasing → Production → Inventory → Sales → Payments → Expenses → Payroll → Profit** for food processors.

## Features

### Guided workflows (Choose → Continue → Review → Save)
- **New sale** — customer → products → payment → review → atomic `record_sale` (COGS + inventory)
- **New purchase** — product → qty/cost → supplier → payment → `record_purchase`
- **New production** — product → qty → materials check → output/waste → `complete_production_batch`
- **Add expense** — category → amount → method (simple sheet-style)

### Modules
| Module | Capability |
|--------|------------|
| Dashboard | Net profit, production, inventory health, to-collect / to-pay |
| Sales | List + guided flow |
| Purchases | List + guided flow |
| Production | Batches + guided flow with recipe BOM |
| Inventory | Raw / packaging / FG with low-stock flags |
| Customers | Ledger, outstanding, record payment, activity |
| Suppliers | Payables, record payment, activity |
| Finance | Overview, expenses, P&L from ledger |
| Payroll | Employees + pay salary → ledger |
| Reports | Period filter (7D/30D/3M/1Y) + financial summary |
| Settings | Products by type |

### Architecture rules
- Inventory is **movement-based**
- Profit from **ledger_entries** (single source of truth)
- Sale calculates **Revenue − COGS = Gross profit**
- Production consumes recipe materials and posts unit cost

## Stack
React 19 · Vite 8 · Tailwind CSS 4 · Supabase (Postgres + RPCs)

## Setup
```bash
npm install
npm run dev
```

Env (Vercel / local):
```
VITE_SUPABASE_URL=https://hjvuyzjgkddkqjnilmtf.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

## Deploy (Vercel)
1. Import `Gadnahery/OLLY`
2. Framework: Vite
3. Add the two env vars above
4. Deploy — every push to `main` auto-deploys

## Database
Migrations in `supabase/migrations/` (already applied to the linked project):
- Schema + `record_sale`, `record_purchase`, `complete_production_batch`
- Seed: peanut butter / tahini products, recipes, opening stock
