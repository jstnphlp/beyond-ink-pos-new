# Distributions Page — Implementation Plan

## Goal

Add a **Distributions** page that calculates and displays salary distributions for each department. Physical dept is hours-based; Design and Dev use a 18/68/14 revenue split where the 68% dept share is divided among per-transaction contributors (not evenly, not by hours).

## Prerequisite: Contributor Tracking

The current system has no way to track which staff contributed to a sale. This must be added first.

### Step 1: Database — `transaction_contributors` table

**New migration: `003_transaction_contributors.sql`**

```sql
CREATE TABLE public.transaction_contributors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES public.sales_transactions(id) ON DELETE CASCADE,
  staff_member_id uuid NOT NULL REFERENCES public.staff_members(id),
  staff_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_transaction_contributors_txn ON public.transaction_contributors(transaction_id);
CREATE INDEX idx_transaction_contributors_staff ON public.transaction_contributors(staff_member_id);

-- RLS
ALTER TABLE public.transaction_contributors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transaction_contributors_select" ON public.transaction_contributors FOR SELECT TO authenticated USING (public.is_allowed_user());
CREATE POLICY "transaction_contributors_insert" ON public.transaction_contributors FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user());

GRANT ALL ON public.transaction_contributors TO anon, authenticated, service_role;
```

**Also update Prisma schema** (`prisma/schema.prisma`) to add the new model and relation on `SalesTransaction`.

### Step 2: New Sale Flow — Contributor Selector

**Where**: Step 5 (Payment) in `src/pages/new-sale/step-payment.tsx`, rendered above the payment method selection.

**Behavior**:
- Only visible when the selected services include Design or Dev department items
- Shows a multi-select list of staff members from the relevant department(s)
- Physical department services do NOT need contributor selection (hours-based)
- Selected contributors stored in `pos-store` state

**Changes**:
1. `src/stores/pos-store.ts` — add `contributors: StaffMember[]` state, `setContributors()`, `resetSale()` update
2. `src/pages/new-sale/step-payment.tsx` — add contributor selector component (uses `useStaffMembers()` filtered by department)
3. `src/shared/api/sales.ts` — pass `contributors` to `completeSale()`, insert into `transaction_contributors` after sale completes
4. `src/pages/new-sale/order-summary.tsx` — pass `contributors` from store to `completeSale()`

### Step 3: API Layer — `src/shared/api/distributions.ts` + types

**Types** (`src/shared/api/distributions.types.ts`):
```ts
export interface DistributionPeriod {
  dateFrom: string | null
  dateTo: string | null
}

export interface PhysicalStaffPayout {
  staffMemberId: string
  staffName: string
  totalHours: number
  payout: number  // hours × hourlyRate
}

export interface DesignDevStaffPayout {
  staffMemberId: string
  staffName: string
  transactionCount: number  // how many txns they contributed to
  sharePercent: number       // their % of the 68% pool
  payout: number             // their dollar share of the 68%
}

export interface DepartmentDistribution {
  department: 'physical_dept' | 'design_dept' | 'dev_dept'
  totalRevenue: number       // total completed sales for this dept in period
  ownershipShare: number     // 18% (design/dev) or N/A (physical)
  deptShare: number          // 68% (design/dev) or total payroll (physical)
  reinvestment: number       // 14% (design/dev) or N/A (physical)
  staffPayouts: PhysicalStaffPayout[] | DesignDevStaffPayout[]
}
```

**Queries** (`src/shared/api/distributions.ts`):

1. `getPhysicalDistribution(period)` —
   - Query `staff_sessions` for `physical_dept` staff with `time_out IS NOT NULL` in period
   - Calculate total hours per staff member
   - `payout = hours × hourlyRate` (constant: ₱50/hr, defined in file)

2. `getDesignDevDistribution(department, period)` —
   - Query `sales_transactions` for completed sales where `department` matches, in period → get `totalRevenue`
   - Query `transaction_contributors` joined with those transactions → count per staff member
   - `ownershipShare = totalRevenue × 0.18`
   - `deptShare = totalRevenue × 0.68`
   - `reinvestment = totalRevenue × 0.14`
   - For each contributor: `payout = deptShare × (theirTxnCount / totalTxnCount)`
     - Note: a staff member who contributed to 3 out of 10 transactions gets 30% of the 68%

**Hook** (`src/shared/hooks/use-distributions.ts`):
```ts
export function usePhysicalDistribution(period: DistributionPeriod)
export function useDesignDistribution(period: DistributionPeriod)
export function useDevDistribution(period: DistributionPeriod)
```

### Step 4: Distributions Page — `src/pages/distributions/index.tsx`

**Layout**:
```
┌─────────────────────────────────────────────────┐
│ Distributions                                   │
│ Salary distributions by department.             │
├─────────────────────────────────────────────────┤
│ [Date From] [Date To] [Filter]                  │
├─────────────────────────────────────────────────┤
│ [Physical] [Design] [Dev]  ← tabs               │
├─────────────────────────────────────────────────┤
│                                                 │
│ Summary Cards (Design/Dev):                     │
│ ┌────────┬────────┬────────┐                    │
│ │ Total  │ Owner  │ Dept   │ Reinvestment       │
│ │ Revenue│ 18%    │ 68%    │ 14%                │
│ └────────┴────────┴────────┘                    │
│                                                 │
│ Summary Cards (Physical):                       │
│ ┌────────┬────────────────┐                     │
│ │ Total  │ Total          │                     │
│ │ Hours  │ Payroll        │                     │
│ └────────┴────────────────┘                     │
│                                                 │
│ Staff Payout Table:                             │
│ ┌──────┬───────┬────────┬────────┐              │
│ │ Name │ Hours │ Share% │ Payout │  (Design/Dev)│
│ └──────┴───────┴────────┴────────┘              │
│ ┌──────┬───────┬────────┐                       │
│ │ Name │ Hours │ Payout │           (Physical)  │
│ └──────┴───────┴────────┘                       │
└─────────────────────────────────────────────────┘
```

### Step 5: Router + Sidebar

**`src/app/router.tsx`** — add lazy route:
```ts
{
  path: '/distributions',
  lazy: async () => {
    const { DistributionsPage } = await import('@/pages/distributions')
    return { Component: DistributionsPage }
  },
},
```

**`src/components/layout/sidebar.tsx`** — add nav item:
```ts
{ to: '/distributions', label: 'Distributions', icon: PieChart, roles: ['owner'] },
```

## File Change Summary

| File | Action |
|---|---|
| `supabase/migrations/003_transaction_contributors.sql` | **CREATE** — new table + RLS |
| `prisma/schema.prisma` | **EDIT** — add `TransactionContributor` model + relation |
| `src/stores/pos-store.ts` | **EDIT** — add `contributors` state |
| `src/pages/new-sale/step-payment.tsx` | **EDIT** — add contributor selector |
| `src/shared/api/sales.ts` | **EDIT** — save contributors on sale complete |
| `src/pages/new-sale/order-summary.tsx` | **EDIT** — pass contributors to `completeSale()` |
| `src/shared/api/distributions.types.ts` | **CREATE** — types |
| `src/shared/api/distributions.ts` | **CREATE** — Supabase queries |
| `src/shared/hooks/use-distributions.ts` | **CREATE** — React Query hooks |
| `src/pages/distributions/index.tsx` | **CREATE** — full page |
| `src/app/router.tsx` | **EDIT** — add `/distributions` route |
| `src/components/layout/sidebar.tsx` | **EDIT** — add nav item |

## Design Decisions

1. **Contributor split = proportional to transaction count**, not hours. If Alice contributed to 3 transactions and Bob contributed to 7, Alice gets 30% of the 68% pool and Bob gets 70%.

2. **Hourly rate for Physical** = ₱50/hr, defined as a constant in `distributions.ts`. Can be made configurable later (e.g., per-staff rate in `staff_members` table).

3. **Contributor assignment is optional**. If no contributors are assigned to a transaction, it's excluded from the 68% split (the dept share still counts toward ownership/reinvestment totals).

4. **Physical dept does not use the 18/68/14 split**. It's purely hours × rate.

## Validation

1. Run `npx prisma migrate dev` to create the new table
2. Run the SQL migration manually against Supabase if needed
3. Create a test sale for Design dept with contributors assigned
4. Navigate to `/distributions`, verify the 18/68/14 breakdown
5. Verify Physical tab shows hours × ₱50
6. Run `npm run lint` and `npm run typecheck` (if available)

## Open Questions

- Should contributors be **required** for Design/Dev sales, or optional? (Plan assumes optional with a warning)
- Should the hourly rate be per-staff or global? (Plan assumes global ₱50/hr for now)
