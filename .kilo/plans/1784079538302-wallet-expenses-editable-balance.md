# Wallet: Add Expenses/Income + Editable Balance

## Goal
Extend the Wallet page to support:
1. Recording money in/out entries (expenses and income not from sales)
2. Inline-editable balance cards (direct override)

## Decisions
- **Entries**: Each entry has `type` (expense/income), `amount`, `description`, `category`, `payment_method` (cash/gcash), `entry_date`
- **Categories**: Predefined defaults (Supplies, Rent, Utilities, Transport, Marketing, Other) stored in a `wallet_categories` table + ability to add custom ones
- **Balance override**: Inline edit on each balance card (click amount → input → save on Enter/blur). Stored as a single override row per payment method in `wallet_balance_overrides`
- **Net balance**: Shown as `sales_total + income_entries - expense_entries`, but if an override exists, the override value takes precedence for display

## Tasks

### 1. Database Migration — `supabase/migrations/009_wallet_entries.sql`
Create three tables:

**`wallet_categories`**
- `id` uuid PK, `name` text unique not null, `is_default` boolean default false, `created_at` timestamptz

**`wallet_entries`**
- `id` uuid PK
- `type` text not null check (expense/income)
- `amount` numeric(10,2) not null
- `description` text not null
- `category_id` uuid references wallet_categories(id)
- `payment_method` text not null check (cash/gcash)
- `entry_date` date not null default current_date
- `created_at` timestamptz default now()

**`wallet_balance_overrides`**
- `id` uuid PK
- `payment_method` text not null unique check (cash/gcash)
- `amount` numeric(10,2) not null
- `updated_at` timestamptz default now()

Seed default categories. Enable RLS with `is_allowed_user()` policies (select/insert/update/delete) matching existing pattern.

### 2. API Layer — `src/shared/api/wallet.ts`
Add functions:
- `fetchWalletCategories()` → list categories
- `createWalletCategory(name)` → insert custom category
- `createWalletEntry(entry)` → insert entry
- `deleteWalletEntry(id)` → delete entry
- `fetchWalletEntries(paymentMethod?)` → list entries with optional filter
- `setWalletBalanceOverride(paymentMethod, amount)` → upsert override
- `clearWalletBalanceOverride(paymentMethod)` → delete override
- Update `fetchWalletSummary()` to include:
  - Sum of income/expense entries per payment method
  - Any active overrides
  - Return `cashOverride`, `gcashOverride` fields (number | null)

### 3. Hooks — `src/shared/hooks/use-wallet.ts`
Create using react-query pattern (matches `use-distributions.ts`, `use-catalog.ts`):
- `walletKeys` query key factory
- `useWalletSummary()` — wraps fetchWalletSummary with refetchInterval
- `useWalletTransactions()` — wraps fetchWalletTransactions
- `useWalletEntries(paymentMethod?)` — wraps fetchWalletEntries
- `useWalletCategories()` — wraps fetchWalletCategories
- `useCreateWalletEntry()` — mutation, invalidates summary + entries
- `useDeleteWalletEntry()` — mutation, invalidates summary + entries
- `useCreateWalletCategory()` — mutation, invalidates categories
- `useSetBalanceOverride()` — mutation, invalidates summary
- `useClearBalanceOverride()` — mutation, invalidates summary

### 4. UI — `src/pages/wallet/index.tsx`

**Balance Cards**:
- Each card shows the computed balance (sales + entries) or override if set
- Click the amount text → switch to an `<Input>` field pre-filled with current value
- On Enter or blur → call `setBalanceOverride`
- Small "×" button appears when override is active to clear it
- Show a subtle indicator (e.g. asterisk or pencil icon) when override is active

**Add Entry**:
- "Add Entry" button at the top (next to the heading)
- Opens a dialog with fields: type (expense/income toggle), amount, description, category (dropdown with "Add custom..." option), payment method (cash/gcash), date
- On submit → createWalletEntry mutation → toast + invalidate

**Entries List**:
- Below the transactions table, add an "Entries" section
- Table showing: date, type (badge: green income / red expense), category, description, payment method, amount
- Each row has a delete button (trash icon)
- Filter tabs or dropdown to filter by payment method

### 5. Update Router (no change needed)
The `/wallet` route already lazy-loads `@/pages/wallet`. No router changes required.

### 6. Refactor `src/pages/wallet/index.tsx`
Currently uses raw `useQuery` — switch to using the new `use-wallet.ts` hooks for consistency.

## File Changes Summary
| File | Action |
|---|---|
| `supabase/migrations/009_wallet_entries.sql` | Create |
| `src/shared/api/wallet.ts` | Edit (add new functions, update summary) |
| `src/shared/hooks/use-wallet.ts` | Create |
| `src/pages/wallet/index.tsx` | Edit (major UI additions) |

## UI Patterns (from existing codebase)
- Dropdowns: native `<select>` elements (no custom Select component exists)
- Dialogs: `Dialog`, `DialogTrigger`, `DialogPopup`, `DialogTitle`, `DialogDescription`, `DialogClose` from `@/components/ui/dialog` (wraps `@base-ui/react`)
- Toasts: `toast` from `sonner`
- Mutations: `useMutation` + `useQueryClient` from `@tanstack/react-query`, invalidate queries on success
- Buttons: `Button` from `@/components/ui/button` with variants `default`, `outline`, `ghost`, `destructive`
- Inputs: `Input` from `@/components/ui/input`

## Validation
1. Run `npm run typecheck` to verify TypeScript
2. Run `npm run lint` to verify linting
3. Manual test: add expense/income entries, verify balance updates, verify inline edit overrides, verify clear override restores computed balance
