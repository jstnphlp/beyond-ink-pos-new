# Distributions Page Changes

## Overview
Make distributions page visible to staff (their department only), hide given/paid status from staff, and change "mark as distributed" from bulk department-level to per-staff.

## Current State
- `distribution_payouts` table already has `staff_member_id` in its UNIQUE constraint — DB is per-staff capable
- But `markWeekGiven` API operates at department level (no `staff_memberId` filter)
- Sidebar only shows Distributions to `owner` role
- Page shows all 3 department tabs to everyone

## Changes

### 1. Sidebar — Add staff access
**File:** `src/components/layout/sidebar.tsx`
- Add `'staff'` to the `roles` array for the distributions nav item

### 2. Page — Staff view: own payout only
**File:** `src/pages/distributions/index.tsx`
- Import `useAuth` and get `role` + `department` + `user` (for staff_member_id lookup)
- For staff users: hide department tabs entirely, show only a simplified view
- For staff users: show only their own payout amount for the selected week (no full table)
- For staff users: hide the "Mark as Given/Unpaid" button
- For staff users: hide the week chip checkmark indicators (isAllGiven/isAnyGiven)
- For staff users: hide the summary cards (total hours, total payroll, etc.)
- Look up staff_member_id by matching `allowed_users.name` (via auth email) to `staff_members.name`
- For staff: query their own payout from the distribution data (filter by staffMemberId)
- Show a simple card: "Your payout this week: ₱X,XXX.XX" instead of the full table

### 3. Per-staff "Mark as Paid" button
**File:** `src/pages/distributions/index.tsx`
- In the staff tables (`PhysicalStaffTable`, `DesignDevStaffTable`), add a per-row button/checkbox to mark individual staff as paid
- Show a small paid/unpaid indicator per staff row (only visible to owners)
- The button calls the updated per-staff API

### 4. API — Per-staff marking
**File:** `src/shared/api/distributions.ts`
- Update `markWeekGiven` to accept `staffMemberId` parameter
- Query/update by `(staff_member_id, department, period_from, period_to)` instead of just department
- Update `getAllWeekGivenStatuses` to return per-staff statuses (keyed by staffMemberId)

**File:** `src/shared/api/distributions.types.ts`
- No schema changes needed — the types already have `staffMemberId`

### 5. Hook — Update mutation
**File:** `src/shared/hooks/use-distributions.ts`
- Update `useMarkWeekGiven` mutation to handle per-staff updates
- Update optimistic updates to work with per-staff keys
- Add new query key for per-staff given statuses

## Files to Modify
1. `src/components/layout/sidebar.tsx` — add `'staff'` to distributions roles
2. `src/pages/distributions/index.tsx` — filter tabs for staff, hide given status, add per-staff buttons
3. `src/shared/api/distributions.ts` — per-staff `markWeekGiven`, per-staff `getAllWeekGivenStatuses`
4. `src/shared/hooks/use-distributions.ts` — update mutation and query keys

## Verification
- Owner sees all 3 department tabs, can mark individual staff as paid/unpaid
- Staff sees only their department tab, no given status indicators
- Per-staff paid status persists correctly in `distribution_payouts` table
