# Costing Page — Implementation Plan

## Context

beyond.ink POS currently tracks pricing in a Google Sheet ("printing_pricing.xlsx") with columns: Service, Material Cost, Ink Cost, Overhead (25% of material), Total Cost, Price, Profit, Profit Margin %, Status (Good/Great/OK). The Costing page replaces that spreadsheet as the analytical layer over existing prices, and adds an internal "quote playground" for testing minimum viable prices.

**Key constraint from user**: `Service.basePrice` and `InventoryItem.sellingPrice` are the source of truth for prices. The Costing page does NOT set prices — it computes costs and margins against existing prices.

---

## Decisions Made

| Question | Answer |
|----------|--------|
| Price source of truth | `basePrice` / `sellingPrice` (read-only on Costing page) |
| Paper size dimension | Not relevant — focus on material only |
| Overhead | Fixed 25% of material cost (covers electricity, maintenance, rent) |
| Spoilage | Separate field, manual % per cost profile row (v1) |
| Quote purpose | Internal-only margin playground, not client-facing |
| Access | Owner + physical department (code dept-agnostic for future) |
| Margin thresholds | Global, configurable (v1). Per-category deferred to v2 |
| Per-client pricing | Out of scope |
| Quote lifecycle | Out of scope for v1 (no draft/sent/accepted/rejected) |
| Quote → Sale conversion | Out of scope for v1 |

---

## Data Model

### New entities

**`cost_profiles`** — one row per service+material combo, stores the cost breakdown

```
cost_profiles
├── id                UUID PK
├── service_id        FK → services (CASCADE)
├── inventory_item_id FK → inventory_items (CASCADE)
├── material_cost     DECIMAL(10,2)  -- base material cost per unit
├── ink_cost          DECIMAL(10,2)  -- ink/consumable cost per unit
├── spoilage_rate     DECIMAL(5,2)   -- percentage, e.g. 5.00 = 5%
├── is_active         BOOLEAN DEFAULT true
├── created_at        TIMESTAMPTZ
├── updated_at        TIMESTAMPTZ
└── UNIQUE(service_id, inventory_item_id)
```

**`quotes`** — internal playground sessions

```
quotes
├── id                UUID PK
├── name              TEXT           -- user-defined label, e.g. "Client X - Brochures"
├── notes             TEXT?
├── created_by        TEXT           -- display name of user
├── created_at        TIMESTAMPTZ
└── updated_at        TIMESTAMPTZ
```

**`quote_line_items`** — items within a quote, with cost snapshots

```
quote_line_items
├── id                  UUID PK
├── quote_id            FK → quotes (CASCADE)
├── cost_profile_id     FK → cost_profiles
├── quantity            DECIMAL(10,2)
├── snap_material_cost  DECIMAL(10,2)  -- snapshot at quote time
├── snap_ink_cost       DECIMAL(10,2)
├── snap_overhead_cost  DECIMAL(10,2)
├── snap_spoilage_rate  DECIMAL(5,2)
├── snap_selling_price  DECIMAL(10,2)  -- from basePrice/sellingPrice at quote time
├── override_price      DECIMAL(10,2)? -- user can override for "what-if"
├── created_at          TIMESTAMPTZ
└── sort_order          INT DEFAULT 0
```

**`app_settings`** — key-value store for business config

```
app_settings
├── key    TEXT PK
├── value  JSONB
└── updated_at TIMESTAMPTZ
```

Initial setting: `{ key: "margin_thresholds", value: { "great": 60, "good": 40 } }`

### Relationships

```
Service 1──* CostProfile *──1 InventoryItem
Quote 1──* QuoteLineItem *──1 CostProfile
```

No FK from `cost_profiles` to `service_material_prices` — they share the same logical keys (service_id + inventory_item_id) but serve different purposes. `service_material_prices` links services to materials for the POS sale wizard; `cost_profiles` stores cost analysis data.

---

## Calculation Logic

All computations happen client-side (no stored procedures needed for v1).

```
Inputs per CostProfile:
  material_cost, ink_cost, spoilage_rate

Derived:
  spoilage_amount  = material_cost × (spoilage_rate / 100)
  overhead_cost    = material_cost × 0.25
  total_cost       = material_cost + spoilage_amount + ink_cost + overhead_cost

Against selling price (from Service.basePrice or InventoryItem.sellingPrice):
  profit           = selling_price - total_cost
  margin_pct       = (profit / selling_price) × 100

Status (using thresholds from app_settings):
  if margin_pct >= thresholds.great  → "Great"
  if margin_pct >= thresholds.good   → "Good"
  else                               → "OK"
```

**Quote line item** computes the same way, but uses `override_price ?? snap_selling_price` as the selling price, multiplied by `quantity` for line totals.

---

## File Structure

```
src/
├── pages/
│   └── costing/
│       ├── index.tsx                    # Page shell (Tabs: Cost Profiles | Quote Playground)
│       ├── cost-profiles-panel.tsx      # Table of all cost profiles with CRUD
│       ├── cost-profile-form.tsx        # Dialog for create/edit cost profile
│       ├── quote-playground-panel.tsx   # Quote builder UI
│       ├── quote-line-editor.tsx        # Add/edit line items in a quote
│       └── csv-import.tsx              # CSV upload + column mapping + preview
├── shared/
│   ├── api/
│   │   ├── costing.ts                  # Supabase queries for cost_profiles, quotes, settings
│   │   └── costing.types.ts            # TypeScript types
│   └── hooks/
│       └── use-costing.ts              # React Query hooks (useCostProfiles, useQuotes, etc.)
```

---

## Implementation Tasks

### Task 1: Prisma Schema + Migration

Add to `prisma/schema.prisma`:
- `CostProfile` model (fields as described above)
- `Quote` model
- `QuoteLineItem` model
- `AppSetting` model
- Relations on `Service` and `InventoryItem` to `CostProfile`

Run `npx prisma migrate dev` to generate migration.

Seed `app_settings` with default margin thresholds: `{ "great": 60, "good": 40 }`.

### Task 2: RLS Policies

- `cost_profiles`: Owner + physical_dept staff can read/write. Other departments read-only (future-proofing).
- `quotes`: Same as cost_profiles.
- `quote_line_items`: Same as quotes (via quote_id join).
- `app_settings`: Owner-only write, all authenticated read.

Pattern: Use existing `get_user_role()` and `get_user_department()` RPCs in RLS policies, matching the pattern used by other tables.

### Task 3: API Layer (`src/shared/api/costing.ts`)

Functions:
- `getCostProfiles()` — fetch all with joined service + material names
- `upsertCostProfile(data)` — create or update (upsert on service_id + inventory_item_id unique)
- `deleteCostProfile(id)` — soft delete (is_active = false)
- `getQuotes()` — list quotes with line item counts
- `getQuote(id)` — single quote with all line items
- `createQuote(data)` — create quote + line items
- `updateQuote(id, data)` — update quote metadata
- `deleteQuote(id)` — hard delete (CASCADE removes line items)
- `getMarginThresholds()` — read from app_settings
- `updateMarginThresholds(data)` — write to app_settings
- `importCostProfiles(rows)` — bulk insert from CSV (upsert)

### Task 4: React Query Hooks (`src/shared/hooks/use-costing.ts`)

Standard TanStack Query hooks wrapping the API layer, matching the pattern in `use-catalog.ts`:
- `useCostProfiles()`, `useCreateCostProfile()`, `useUpdateCostProfile()`, `useDeleteCostProfile()`
- `useQuotes()`, `useQuote(id)`, `useCreateQuote()`, `useUpdateQuote()`, `useDeleteQuote()`
- `useMarginThresholds()`, `useUpdateMarginThresholds()`

### Task 5: Cost Profiles Panel

Main table showing all active cost profiles with columns:
- Service Name (from joined Service)
- Material Name (from joined InventoryItem)
- Material Cost
- Ink Cost
- Spoilage %
- Overhead (computed: material × 0.25)
- Total Cost (computed)
- Selling Price (from Service.basePrice or InventoryItem.sellingPrice)
- Profit (computed)
- Margin % (computed)
- Status badge (Great/Good/OK with color coding)

Inline editing or edit dialog for cost fields. Filter by category. Search by service/material name.

### Task 6: Cost Profile Form Dialog

Dialog for create/edit with fields:
- Service dropdown (from active services)
- Material dropdown (from inventory items linked to selected service via `service_material_prices`, or all inventory items)
- Material Cost (₱)
- Ink Cost (₱)
- Spoilage Rate (%)
- Live preview of computed fields (overhead, total cost, margin, status)

On save: upsert against (service_id, inventory_item_id) unique constraint.

### Task 7: Quote Playground Panel

Two-section layout:

**Left: Quote configuration**
- Quote name input
- "Add Item" button → opens item selector (pick from cost profiles, set quantity)
- List of added items with inline quantity and override price editing
- Notes textarea

**Right: Quote summary**
- Per-line breakdown: qty × unit price, cost, profit, margin
- Totals: total selling price, total cost, total profit, overall margin %
- "Lowest price" indicator per line (price at which margin hits the "Good" threshold)

**Saved quotes list** below the playground, showing past quotes with ability to load/reuse/delete.

### Task 8: CSV Import Component

Step-by-step import flow:
1. Upload CSV file
2. Auto-detect or manual map columns (Service Name, Material Name, Material Cost, Ink Cost, Spoilage Rate)
3. Preview table showing mapped data + computed fields
4. "Import" button → calls `importCostProfiles()` bulk upsert
5. Success/error summary

CSV parsing: use native `FileReader` + manual split (no external library needed for simple CSV). Support for the exact column layout of the existing spreadsheet.

### Task 9: Router + Sidebar

**Router** (`src/app/router.tsx`):
```tsx
{
  path: '/costing',
  lazy: async () => {
    const { CostingPage } = await import('@/pages/costing')
    return { Component: CostingPage }
  },
}
```

**Sidebar** (`src/components/layout/sidebar.tsx`):
- Add nav item: `{ to: '/costing', label: 'Costing', icon: DollarSign, roles: ['owner', 'staff'] }`
- Place after "Services" in the nav order
- Department filtering: show only for owner or physical_dept (add `departments` field to NavItem interface, filter in `visibleItems` logic)

The existing `NavItem` interface needs a `departments?: string[]` field. Filter logic becomes:
```ts
const visibleItems = NAV_ITEMS.filter(
  (item) => role && item.roles.includes(role) &&
    (!item.departments || !department || item.departments.includes(department))
)
```

### Task 10: Settings Integration

Add a "Margin Thresholds" section to the existing Settings page (`src/pages/settings/index.tsx`):
- Two number inputs: "Great" threshold (%), "Good" threshold (%)
- Save button → calls `updateMarginThresholds()`
- Only visible to owners

---

## v1 Scope (This Plan)

- CostProfile CRUD (create, edit, delete cost breakdowns per service+material)
- Cost profiles table with computed columns (overhead, total cost, profit, margin, status)
- Spoilage rate as manual % field per cost profile
- Global margin thresholds (configurable in Settings)
- CSV import from existing spreadsheet
- Quote playground (create quotes, add items, override prices, see margin impact)
- Access: owner + physical_dept
- Route at `/costing`, sidebar link

## v2 Scope (Deferred)

- Spoilage incident logging + auto-computed spoilage rates
- Per-category margin thresholds
- Per-client custom pricing / rate cards
- Quote lifecycle (draft → sent → accepted / rejected / expired)
- Quote → Sale conversion (pre-fill POS wizard from accepted quote)
- Cost history / audit trail
- Bulk price updates ("increase all prices by X%")
- Design/Dev department costing

---

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Cost profiles drift from service_material_prices (same keys, different data) | Document clearly that cost_profiles is analytical, service_material_prices is operational. No sync needed. |
| User edits sellingPrice on Services page, margin calculations go stale | Costing page fetches live prices on every load. No caching of selling price in cost_profiles. |
| CSV import with mismatched service/material names | Import flow shows preview with "unmatched" rows flagged. User can create missing services/materials first, then re-import. |
| RLS policy complexity for dept-based access | Keep it simple: owner = full access, physical_dept = full access, others = read-only. No per-row restrictions needed. |
