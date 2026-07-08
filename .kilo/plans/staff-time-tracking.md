# Staff Time Tracking — Implementation Plan

## Context

The old Beyond-Ink-POS had a time-in/time-out system with hardcoded staff names, no referential integrity, duplicate query helpers, no pagination, and no shift editing. This plan ports the feature to the new Vite + React + Supabase + Tanstack Query + Zustand architecture, eliminating all cons and optimizing for speed.

**Key architecture differences from old project:**
- Old: Next.js server actions + `revalidatePath()` → New: Supabase client-side + Tanstack Query + optimistic updates
- Old: Hardcoded `STAFF_NAMES` → New: DB-driven `staff_members` table
- Old: Text-based `staff_name` → New: FK `staff_member_id`
- Old: No pagination → New: Cursor-based pagination on attendance

---

## Decisions

| Decision | Choice |
|----------|--------|
| Staff management | DB-driven `staff_members` table |
| Auth | None — shared physical login |
| Auto-logout | pg_cron at 9PM PHT + client-side stale cleanup |
| Cashier auto-fill | Yes — active sessions feed into sales flow |
| Data fetching | Tanstack Query with optimistic updates |
| Real-time | Not needed (single terminal); Tanstack Query background refetch sufficient |

---

## Database Schema

### New table: `staff_members`

```prisma
model StaffMember {
  id         String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name       String    @unique @db.Text
  department String    @default("physical_dept") @db.Text
  isActive   Boolean   @default(true) @map("is_active")
  createdAt  DateTime  @default(now()) @map("created_at") @db.Timestamptz

  sessions StaffSession[]

  @@map("staff_members")
}
```

### Updated table: `staff_sessions`

```prisma
model StaffSession {
  id             String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  staffMemberId  String       @map("staff_member_id") @db.Uuid
  staffName      String       @map("staff_name") @db.Text       // denormalized for fast reads
  timeIn         DateTime     @default(now()) @map("time_in") @db.Timestamptz
  timeOut        DateTime?    @map("time_out") @db.Timestamptz
  autoLoggedOut  Boolean      @default(false) @map("auto_logged_out")
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz

  staffMember StaffMember @relation(fields: [staffMemberId], references: [id])

  @@index([staffMemberId, timeIn])
  @@index([timeOut, timeIn])
  @@map("staff_sessions")
}
```

**Key changes from old schema:**
- Added `staff_member_id` FK — referential integrity
- `staff_name` denormalized — avoids JOIN on every read
- Composite indexes on `(staff_member_id, time_in)` and `(time_out, time_in)` — fast active session lookups and date-range queries
- Kept `auto_logged_out` for attendance tab highlighting

---

## File Changes

### 1. Prisma Migration

**File:** `prisma/schema.prisma` — Update StaffSession model, add StaffMember model

**Migration:** `prisma/migrations/YYYYMMDD_staff_time_tracking/migration.sql`

The `staff_sessions` table already exists (from init migration). This migration:

1. `CREATE TABLE staff_members` — new table
2. `ALTER TABLE staff_sessions ADD COLUMN staff_member_id UUID` — nullable initially
3. Seed `staff_members` from distinct `staff_name` in existing `staff_sessions` rows (if any)
4. Backfill `staff_sessions.staff_member_id` via JOIN on `staff_name`
5. `ALTER TABLE staff_sessions ALTER COLUMN staff_member_id SET NOT NULL`
6. `ALTER TABLE staff_sessions ADD CONSTRAINT ... FOREIGN KEY (staff_member_id) REFERENCES staff_members(id)`
7. `CREATE INDEX idx_sessions_member_time ON staff_sessions(staff_member_id, time_in)`
8. `CREATE INDEX idx_sessions_active ON staff_sessions(time_out, time_in)` — for active session lookups
9. Keep `staff_name` column (denormalized for fast reads, no JOIN needed)

### 2. Supabase RLS + pg_cron Script

**File:** `supabase/migrations/002_staff_sessions_rls.sql`

- RLS policies: open read/write for anon key (shared login, no auth)
- `auto_logout_staff()` function — closes all open sessions at 9PM PHT
- pg_cron schedule: `0 13 * * *` UTC (= 9PM PHT)

### 3. API Layer

**File:** `src/shared/api/staff.ts` (new)

```ts
// Functions:
getStaffMembers(): Promise<StaffMember[]>
getActiveSessions(): Promise<StaffSession[]>
clockIn(staffMemberId: string): Promise<StaffSession>
clockOut(staffMemberId: string): Promise<void>
getAttendance(params: AttendanceParams): Promise<AttendancePageResult>
updateSession(id: string, updates: SessionUpdate): Promise<void>
```

- All functions use `supabase.from(...)` directly (matches existing pattern in `sales.ts`, `drafts.ts`)
- `getActiveSessions()` includes stale session cleanup (close sessions from previous days)
- `getAttendance()` uses cursor-based pagination (matches `history.ts` pattern)
- `clockIn()` checks for existing active session before inserting (duplicate prevention)

**File:** `src/shared/api/staff.types.ts` (new)

```ts
export interface StaffMember {
  id: string
  name: string
  department: string
  isActive: boolean
  createdAt: string
}

export interface StaffSession {
  id: string
  staffMemberId: string
  staffName: string
  timeIn: string
  timeOut: string | null
  autoLoggedOut: boolean
  createdAt: string
}

export interface AttendanceFilters {
  staffMemberId: string | 'all'
  dateFrom: string | null
  dateTo: string | null
}

export interface AttendancePageResult {
  sessions: StaffSession[]
  nextCursor: { timeIn: string; id: string } | null
}
```

### 4. Tanstack Query Hooks

**File:** `src/shared/hooks/use-staff.ts` (new)

```ts
// Query hooks
useStaffMembers()         // fetches staff list, staleTime: 10min
useActiveSessions()       // fetches active sessions, staleTime: 10s, refetchInterval: 30s
useAttendance(filters)    // paginated attendance with cursor

// Mutation hooks with optimistic updates
useClockIn()              // optimistic: adds session to active list immediately
useClockOut()             // optimistic: removes session from active list immediately
useUpdateSession()        // for editing attendance records
```

**Performance optimizations:**
- `useActiveSessions`: `staleTime: 10_000` + `refetchInterval: 30_000` — keeps data fresh without hammering DB
- `useClockIn/useClockOut`: Optimistic updates via `onMutate` — UI updates instantly, rolls back on error
- `useStaffMembers`: `staleTime: 10 * 60_000` — staff list rarely changes
- All queries use `queryKey` arrays for precise cache invalidation
- `gcTime: 5 * 60_000` — keep inactive query data in memory for 5min

### 5. Zustand Store

**File:** `src/stores/staff-store.ts` (new)

```ts
interface StaffState {
  selectedStaffId: string | null
  setSelectedStaffId: (id: string | null) => void
  attendanceFilters: AttendanceFilters
  setAttendanceFilters: (filters: Partial<AttendanceFilters>) => void
}
```

Minimal store — only UI state that doesn't belong in server cache.

### 6. Staff Page (Full Rewrite)

**File:** `src/pages/staff/index.tsx` (rewrite)

Components:
- **Active Sessions Panel** — who's currently clocked in, with clock-out buttons
- **Clock-In Dialog** — select staff member from dropdown, confirm
- **Attendance Table** — date range filter, staff filter, paginated rows with hours calculated
- **Summary Cards** — active count, on-break count, total hours today

Layout:
```
┌─────────────────────────────────────────────┐
│ Staff Shifts                                │
│ Monitor who's clocked in and manage shifts. │
├──────────┬──────────┬──────────┬────────────┤
│ Active   │ On Break │ Offline  │ Hours Today│
│    3     │    1     │    1     │   24.5h    │
├──────────┴──────────┴──────────┴────────────┤
│ ┌─ Active Sessions ──────────────────────┐  │
│ │ ● Juan Carlos  on shift since 6:00 AM │  │
│ │ ● Ana Martinez on shift since 7:00 AM │  │
│ │ ● Rico Mendoza on shift since 8:00 AM │  │
│ │                        [Time In] btn   │  │
│ └────────────────────────────────────────┘  │
│                                             │
│ ┌─ Attendance Log ───────────────────────┐  │
│ │ [From] [To] [Staff ▾] [Filter]        │  │
│ │ ┌──────┬──────┬────────┬──────┬──────┐ │  │
│ │ │ Date │ Staff│ Time In│Out   │Hours │ │  │
│ │ ├──────┼──────┼────────┼──────┼──────┤ │  │
│ │ │ ...  │ ...  │ ...    │ ...  │ ...  │ │  │
│ │ └──────┴──────┴────────┴──────┴──────┘ │  │
│ │ [Load More]                             │  │
│ └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 7. Dashboard Integration

**File:** `src/pages/dashboard/dashboard-tabs.tsx` (update Staff tab)

- Replace mock `staffSessions` from Zustand with `useActiveSessions()` hook
- Show live active sessions with clock-in times
- Add quick clock-out button per row

**File:** `src/stores/dashboard-store.ts` (update)

- Remove `MOCK_STAFF` and `staffSessions` from store
- Staff data now comes from Tanstack Query

### 8. Sales Cashier Auto-Fill

**File:** `src/pages/new-sale/step-payment.tsx` or relevant cashier component (update)

- Import `useActiveSessions()` to get currently active staff names
- Auto-populate cashier field with active staff names
- Allow override if needed

### 9. Header Integration

**File:** `src/components/layout/header.tsx` (update)

- Replace `MOCK_USER` with active session data
- Show shift status indicator (clocked in since X:XX AM)

---

## Performance Targets

| Metric | Old System | New Target |
|--------|-----------|------------|
| Clock-in perceived latency | ~500ms (server action + revalidate) | **<50ms** (optimistic update) |
| Clock-out perceived latency | ~500ms | **<50ms** (optimistic update) |
| Active sessions load | 2 DB queries (cleanup + fetch) | **1 query** (cleanup via DB function or batched) |
| Attendance query (100 rows) | No index scan | **Index scan** on `(time_out, time_in)` |
| Attendance pagination | Fetch all | **Cursor-based**, 20 rows per page |
| Dashboard staff tab | Static mock data | **Live data**, 30s auto-refresh |
| Cache hit on navigation | None (server component re-render) | **Instant** (Tanstack Query cache) |

---

## Implementation Order

1. **Prisma schema update** — Add StaffMember, update StaffSession
2. **Migration** — Run `prisma migrate dev`
3. **Supabase RLS + pg_cron** — Apply RLS policies and auto-logout function
4. **API layer** — `staff.ts` + `staff.types.ts`
5. **Tanstack Query hooks** — `use-staff.ts`
6. **Zustand store** — `staff-store.ts`
7. **Staff page rewrite** — Full UI with active sessions + attendance
8. **Dashboard integration** — Replace mock data in staff tab
9. **Sales cashier auto-fill** — Wire active sessions into sales flow
10. **Header integration** — Show shift status
11. **Cleanup** — Remove mock data, unused types

---

## Validation

1. `npm run typecheck` — no type errors
2. `npm run lint` — no lint errors
3. `npm run build` — clean build
4. Manual test: Clock in → verify appears in dashboard + staff page
5. Manual test: Clock out → verify removed from active, appears in attendance
6. Manual test: Attendance pagination → load more works
7. Manual test: Stale session cleanup → sessions from previous day auto-close
8. Manual test: Cashier auto-fill → active staff name appears in sales

---

## Risks

| Risk | Mitigation |
|------|-----------|
| RLS blocks anon reads | Apply open policies for shared-login model |
| pg_cron not enabled | Document manual setup; add client-side stale cleanup as fallback |
| Optimistic update mismatch | Rollback on error + toast notification via sonner |
| Denormalized `staff_name` drift | Update on session insert only; name changes don't affect historical records |
