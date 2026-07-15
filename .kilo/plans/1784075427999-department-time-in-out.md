# Plan: Department-Filtered Time-In / Time-Out

## Context

Currently the Staff Shifts page (`/staff`) shows ALL staff members and active sessions with no department filtering. The `staff_sessions` table has no `department` column. The goal is to make time-in/time-out department-aware:

- **Staff users** can only clock in/out staff members belonging to their own department (same as how `step-category.tsx` filters by `userDepartment`)
- **Owners** can see all departments' active sessions, and when clocking in, they pick a department via a per-action picker in the clock-in dialog
- **Owners can clock themselves in** as ad-hoc sessions (no `staff_member_id`), limited to one active session at a time

## Decisions

| Decision | Choice |
|---|---|
| Owner active sessions view | All departments at once, with department badges |
| Owner clock-in department | Per-action picker inside the clock-in dialog |
| Owner attendance log | All departments + optional department filter dropdown |
| Owner self clock-in | Yes, ad-hoc session (nullable `staff_member_id`) |
| Owner session limit | One active session at a time |
| Schema approach | Add `department` column to `staff_sessions`, make `staff_member_id` nullable |

## Tasks

### 1. Database Migration — `supabase/migrations/008_session_department.sql`

```sql
-- Add department column to staff_sessions
ALTER TABLE staff_sessions ADD COLUMN department TEXT NOT NULL DEFAULT 'physical_dept';
CREATE INDEX idx_staff_sessions_department ON staff_sessions(department);

-- Backfill existing sessions from staff_members
UPDATE staff_sessions ss SET department = sm.department FROM staff_members sm WHERE ss.staff_member_id = sm.id;

-- Make staff_member_id nullable (for owner ad-hoc sessions)
ALTER TABLE staff_sessions ALTER COLUMN staff_member_id DROP NOT NULL;
```

### 2. Prisma Schema — `prisma/schema.prisma`

- Change `staffMemberId String` to `staffMemberId String?` (nullable) in `StaffSession`
- Add `department String @default("physical_dept") @db.Text` to `StaffSession`
- Add `@@index([department])` to `StaffSession`
- Update relation: `staffMember StaffMember? @relation(...)` (nullable)

### 3. Types — `src/shared/api/staff.types.ts`

- `StaffSession`: add `department: string`, change `staffMemberId` to `string | null`
- `AttendanceFilters`: add `department: string | 'all'`

### 4. API Layer — `src/shared/api/staff.ts`

**`getStaffMembers(department?: string)`**
- When `department` is provided, add `.eq('department', department)` to query
- When omitted, returns all staff members (for owners seeing all)

**`getActiveSessions(department?: string)`**
- When `department` is provided, add `.eq('department', department)` to query
- When omitted, returns all active sessions (for owners)

**`clockIn(params: { staffMemberId?: string; staffName: string; department: string })`**
- Change signature to accept an object with optional `staffMemberId`
- Duplicate check logic:
  - If `staffMemberId` is provided: existing check by `staff_member_id` (current behavior)
  - If `staffMemberId` is null (owner ad-hoc): check by `staff_name` where `staff_member_id IS NULL` and `time_out IS NULL`
- INSERT includes `staff_member_id` (nullable), `staff_name`, and `department`
- SELECT in response includes `department`

**`getAttendance(filters, cursor?)`**
- Add `department` filter: when `filters.department !== 'all'`, add `.eq('department', filters.department)`
- SELECT includes `department`

**`mapSession()`**
- Map the new `department` field
- Handle nullable `staff_member_id`

**`DEFAULT_STAFF`**
- Add default staff members for design_dept and dev_dept departments

### 5. Hooks — `src/shared/hooks/use-staff.ts`

**`useStaffMembers(department?: string)`**
- Accept optional `department` parameter, include in queryKey, pass to `getStaffMembers`

**`useActiveSessions(department?: string)`**
- Accept optional `department` parameter, include in queryKey, pass to `getActiveSessions`

**`useClockIn()`**
- Change mutation variables to `{ staffMemberId?: string; staffName: string; department: string }`
- Optimistic update uses the new shape
- Pass to `apiClockIn`

**`useAttendanceInfinite(filters)`**
- No structural change needed — `department` is part of `AttendanceFilters` and included in queryKey

### 6. Staff Shifts Page — `src/pages/staff/index.tsx`

**General**
- Import `useAuth` to get `role` and `department` (user's auth department)
- For staff users: `userDepartment = department` (from auth)
- For owners: `userDepartment = undefined` (sees all)

**`ClockInDialog`**
- For **staff users**: no department picker. `useStaffMembers(department)` filters automatically. Clock-in uses `department` from auth.
- For **owners**: show a department picker (3 tabs/buttons: Physical, Design, Dev) at the top of the dialog. `useStaffMembers(pickedDepartment)`. Clock-in uses `pickedDepartment`.
- "Clock in myself" button/entry for owners:
  - Appears as a special entry at the bottom of the staff list (or a separate button)
  - Uses owner's `displayName` as `staffName`, `staffMemberId = undefined`
  - Owner must pick a department first
- Selected staff members + owner self-clock-in use the same `clockInMutation.mutate()` with the appropriate params

**`ActiveSessionsPanel`**
- For staff users: `useActiveSessions(department)` — only their department
- For owners: `useActiveSessions()` — all departments
- Each session row shows a department badge (colored: blue=Physical, purple=Design, emerald=Dev)
- Clock-out button works the same regardless of department or role

**`AttendanceLog`**
- For staff users: auto-set `department` filter to their department (hidden from UI)
- For owners: add a department filter dropdown (All / Physical / Design / Dev) alongside the existing staff/date filters
- Department column in the table: show for owners, hidden for staff users

**`SummaryCards`**
- For staff users: `useActiveSessions(department)`
- For owners: `useActiveSessions()` (all departments)

### 7. Header — `src/components/layout/header.tsx`

- Import `useAuth` for `department` and `role`
- For staff users: show their department badge (Physical / Design / Dev) with matching color
- For owners: show "Owner" badge (amber color)
- Replace the hardcoded "Physical" badge

### 8. Staffs Page — `src/pages/staffs/index.tsx` (minor)

- No changes needed. Staff member management already supports department assignment.
- Owners can add staff members to any department via this page.

## Files to Modify

| File | Change |
|---|---|
| `supabase/migrations/008_session_department.sql` | **NEW** — add department column, make staff_member_id nullable, backfill |
| `prisma/schema.prisma` | Nullable staffMemberId, add department to StaffSession |
| `src/shared/api/staff.types.ts` | Add department to StaffSession + AttendanceFilters, nullable staffMemberId |
| `src/shared/api/staff.ts` | Department filtering on all queries, new clockIn signature, mapSession update |
| `src/shared/hooks/use-staff.ts` | Thread department through hooks, new clockIn mutation shape |
| `src/pages/staff/index.tsx` | Department-aware UI, owner department picker, owner self-clock-in, department badges |
| `src/components/layout/header.tsx` | Dynamic department badge based on role/department |

## Key Flows

### Staff User Clock-In
1. Staff user (dept: design_dept) opens Staff Shifts page
2. Sees only Design staff members and active sessions
3. Clicks "Time In" → dialog shows Design staff members not yet clocked in
4. Selects staff members → clocks them in with `department = 'design_dept'`

### Owner Clock-In (Self)
1. Owner opens Staff Shifts page → sees all departments' active sessions
2. Clicks "Time In" → dialog shows department picker (Physical / Design / Dev)
3. Picks "Design" → sees Design staff members
4. Clicks "Clock in myself" → ad-hoc session created with `staff_member_id = NULL`, `staff_name = owner's display name`, `department = 'design_dept'`
5. Owner appears in active sessions list with Design badge

### Owner Clock-In (Staff Member)
1. Owner clicks "Time In" → picks "Physical" department
2. Selects "Mark" from the Physical staff list
3. Clocks Mark in with `department = 'physical_dept'`

### Owner Clock-Out
1. Owner sees all active sessions (Mark from Physical, self from Design)
2. Clicks "Time Out" next to any session — works regardless of department

## Validation

1. **Staff user (design_dept)**: only sees Design staff/sessions, header shows "Design" badge
2. **Staff user (physical_dept)**: only sees Physical staff/sessions, header shows "Physical" badge
3. **Owner**: sees all departments' sessions with department badges, header shows "Owner" badge
4. **Owner clock-in dialog**: department picker appears, staff list updates per department
5. **Owner self clock-in**: creates ad-hoc session (nullable staff_member_id), appears in active sessions
6. **Owner duplicate prevention**: trying to clock in again returns existing session
7. **Attendance log**: staff user sees only their department; owner sees all with optional department filter
8. Run `npx prisma generate` after schema change
9. Run `npx tsc --noEmit` to verify no TypeScript errors
10. Run `npm run lint` to verify lint passes
