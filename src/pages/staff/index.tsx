import { useState } from 'react'
import { Users, LogIn, LogOut, History, Timer, UserCircle, Clock, MessageSquareText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import {
  useStaffMembers,
  useActiveSessions,
  useAttendanceInfinite,
  useClockIn,
  useClockOut,
} from '@/shared/hooks/use-staff'
import type { StaffSession } from '@/shared/api/staff.types'
import { useAuth } from '@/shared/hooks/use-auth'
import { useStaffStore } from '@/stores/staff-store'

const DEPT_OPTIONS = [
  { value: 'physical_dept', label: 'Physical' },
  { value: 'design_dept', label: 'Design' },
  { value: 'dev_dept', label: 'Development' },
]

const DEPT_LABELS: Record<string, string> = {
  physical_dept: 'Physical',
  design_dept: 'Design',
  dev_dept: 'Development',
}

const DEPT_BADGE_COLORS: Record<string, string> = {
  physical_dept: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  design_dept: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
  dev_dept: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function calcHours(timeIn: string, timeOut: string): number {
  const ms = new Date(timeOut).getTime() - new Date(timeIn).getTime()
  return Math.round((ms / (1000 * 60 * 60)) * 100) / 100
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getDefaultDateFrom(): string {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString().split('T')[0]
}

function getDefaultDateTo(): string {
  return new Date().toISOString().split('T')[0]
}

// ─── Clock-In Dialog ─────────────────────────────────────────────────────────

function ClockInDialog({
  role,
  userDepartment,
  displayName,
}: {
  role: 'owner' | 'staff'
  userDepartment: string | null
  displayName: string | null
}) {
  const isOwner = role === 'owner'
  const [ownerDept, setOwnerDept] = useState<string>('physical_dept')
  const effectiveDept = isOwner ? ownerDept : userDepartment ?? undefined

  const { data: members } = useStaffMembers(effectiveDept)
  const { data: activeSessions } = useActiveSessions()
  const clockInMutation = useClockIn()
  const [open, setOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [clockInSelf, setClockInSelf] = useState(false)

  const activeIds = new Set(
    (activeSessions ?? [])
      .filter((s) => s.staffMemberId)
      .map((s) => s.staffMemberId!)
  )
  const available = (members ?? []).filter((m) => !activeIds.has(m.id))

  const isOwnerAlreadyClockedIn = (activeSessions ?? []).some(
    (s) => !s.staffMemberId && s.staffName === displayName
  )

  function toggleMember(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleClockInSelected() {
    const total = selectedIds.size + (clockInSelf ? 1 : 0)
    let completed = 0

    function onDone() {
      completed++
      if (completed === total) {
        setSelectedIds(new Set())
        setClockInSelf(false)
        setOpen(false)
      }
    }

    for (const id of selectedIds) {
      const member = available.find((m) => m.id === id)
      if (!member) continue
      clockInMutation.mutate(
        { staffMemberId: member.id, staffName: member.name, department: effectiveDept! },
        { onSettled: onDone },
      )
    }

    if (clockInSelf && displayName) {
      clockInMutation.mutate(
        { staffName: displayName, department: effectiveDept! },
        { onSettled: onDone },
      )
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setSelectedIds(new Set())
      setClockInSelf(false)
    }
  }

  const hasSelection = selectedIds.size > 0 || clockInSelf

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <LogIn className="h-3.5 w-3.5" />
        Time In
      </DialogTrigger>
      <DialogPopup>
        <DialogTitle>Clock In</DialogTitle>
        <DialogDescription>
          {isOwner
            ? 'Pick a department, then select who to clock in.'
            : 'Select staff members to start their shift.'}
        </DialogDescription>

        {isOwner && (
          <div className="mt-4 flex gap-1.5">
            {DEPT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setOwnerDept(opt.value)
                  setSelectedIds(new Set())
                  setClockInSelf(false)
                }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  ownerDept === opt.value
                    ? `${DEPT_BADGE_COLORS[opt.value]} border-current`
                    : 'border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-2">
          {/* Owner self clock-in */}
          {isOwner && displayName && !isOwnerAlreadyClockedIn && (
            <button
              type="button"
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 disabled:opacity-50 ${
                clockInSelf
                  ? 'border-emerald-500/60 bg-emerald-500/10'
                  : 'border-dashed border-muted-foreground/30'
              }`}
              disabled={clockInMutation.isPending}
              onClick={() => setClockInSelf((v) => !v)}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                  clockInSelf
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-muted-foreground/40 bg-transparent'
                }`}
              >
                {clockInSelf && (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
                <UserCircle className="h-4 w-4 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">Clock in yourself</p>
              </div>
            </button>
          )}

          {isOwner && displayName && isOwnerAlreadyClockedIn && (
            <p className="py-2 text-center text-xs text-muted-foreground">
              You are already clocked in.
            </p>
          )}

          {/* Staff members */}
          {available.length === 0 && !isOwner && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Everyone is already clocked in.
            </p>
          )}
          {available.map((member) => {
            const isSelected = selectedIds.has(member.id)
            return (
              <button
                key={member.id}
                type="button"
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 disabled:opacity-50 ${
                  isSelected
                    ? 'border-emerald-500/60 bg-emerald-500/10'
                    : 'border-border'
                }`}
                disabled={clockInMutation.isPending}
                onClick={() => toggleMember(member.id)}
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-muted-foreground/40 bg-transparent'
                  }`}
                >
                  {isSelected && (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarFallback className="bg-muted text-xs font-semibold">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{member.name}</p>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <DialogClose render={<Button variant="ghost" size="sm" />}>
            Cancel
          </DialogClose>
          {(available.length > 0 || (isOwner && displayName && !isOwnerAlreadyClockedIn)) && (
            <Button
              size="sm"
              className="gap-1.5"
              disabled={!hasSelection || clockInMutation.isPending}
              onClick={handleClockInSelected}
            >
              <LogIn className="h-3.5 w-3.5" />
              Clock In {selectedIds.size + (clockInSelf ? 1 : 0) > 0
                ? `(${selectedIds.size + (clockInSelf ? 1 : 0)})`
                : ''}
            </Button>
          )}
        </div>
      </DialogPopup>
    </Dialog>
  )
}

// ─── Owner Clock-Out Dialog ─────────────────────────────────────────────────

function OwnerClockOutDialog({
  session,
  open,
  onOpenChange,
}: {
  session: { staffMemberId: string | null; staffName: string }
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const clockOutMutation = useClockOut()
  const [note, setNote] = useState('')

  function handleSubmit() {
    if (!note.trim()) return
    clockOutMutation.mutate(
      {
        staffMemberId: session.staffMemberId,
        staffName: session.staffName,
        note: note.trim(),
      },
      {
        onSettled: () => {
          setNote('')
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogPopup>
        <DialogTitle>Before you go!</DialogTitle>
        <DialogDescription className="mt-1.5">
          What great thing did you accomplish today?
        </DialogDescription>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Share something you're proud of..."
          autoFocus
          rows={4}
          className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30 focus:outline-none resize-none"
        />

        <div className="mt-4 flex justify-end">
          <Button
            size="sm"
            className="gap-1.5"
            disabled={!note.trim() || clockOutMutation.isPending}
            onClick={handleSubmit}
          >
            <LogOut className="h-3.5 w-3.5" />
            {clockOutMutation.isPending ? 'Clocking out...' : 'Clock Out'}
          </Button>
        </div>
      </DialogPopup>
    </Dialog>
  )
}

// ─── Active Sessions Panel ───────────────────────────────────────────────────

function ActiveSessionsPanel({
  role,
  userDepartment,
  displayName,
}: {
  role: 'owner' | 'staff'
  userDepartment: string | null
  displayName: string | null
}) {
  const isOwner = role === 'owner'
  const dept = isOwner ? undefined : userDepartment ?? undefined
  const { data: sessions, isLoading } = useActiveSessions(dept)
  const clockOutMutation = useClockOut()
  const [ownerClockOutSession, setOwnerClockOutSession] = useState<{
    staffMemberId: string | null
    staffName: string
  } | null>(null)

  function handleClockOut(session: { staffMemberId: string | null; staffName: string }) {
    if (!session.staffMemberId) {
      setOwnerClockOutSession(session)
    } else {
      clockOutMutation.mutate({
        staffMemberId: session.staffMemberId,
        staffName: session.staffName,
      })
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-brand" />
            Active Sessions
          </CardTitle>
          <ClockInDialog role={role} userDepartment={userDepartment} displayName={displayName} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        )}
        {!isLoading && (sessions ?? []).length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No staff currently clocked in.
          </p>
        )}
        <div className="space-y-0 divide-y divide-border/40">
          {(sessions ?? []).map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between py-3.5 transition-default hover:bg-muted/30 px-2 -mx-2 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarFallback className="bg-muted text-xs font-semibold">
                      {getInitials(session.staffName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{session.staffName}</p>
                    {isOwner && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${DEPT_BADGE_COLORS[session.department] ?? ''}`}
                      >
                        {DEPT_LABELS[session.department] ?? session.department}
                      </Badge>
                    )}
                    {!session.staffMemberId && (
                      <Badge
                        variant="outline"
                        className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-500"
                      >
                        owner
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    on shift since {formatTime(session.timeIn)}
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1"
                disabled={clockOutMutation.isPending}
                onClick={() => handleClockOut(session)}
              >
                <LogOut className="h-3 w-3" />
                Time Out
              </Button>
            </div>
          ))}
        </div>
      </CardContent>

      {ownerClockOutSession && (
        <OwnerClockOutDialog
          session={ownerClockOutSession}
          open={!!ownerClockOutSession}
          onOpenChange={(open) => {
            if (!open) setOwnerClockOutSession(null)
          }}
        />
      )}
    </Card>
  )
}

// ─── Attendance Detail Dialog (Owner Only) ──────────────────────────────────

function AttendanceDetailDialog({
  session,
  open,
  onOpenChange,
}: {
  session: StaffSession
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const hours = session.timeOut ? calcHours(session.timeIn, session.timeOut) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogTitle>Attendance Detail</DialogTitle>
        <DialogDescription className="mt-1.5">
          Shift record for {session.staffName}
        </DialogDescription>

        <div className="mt-4 space-y-4">
          {/* Hours Worked */}
          <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10">
              <Clock className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Hours Worked</p>
              <p className="text-lg font-bold tabular-nums">
                {hours !== null ? `${hours.toFixed(2)} hours` : '—'}
              </p>
            </div>
          </div>

          {/* Shift Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">{formatDate(session.timeIn)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Department</p>
              <Badge
                variant="outline"
                className={`text-[10px] ${DEPT_BADGE_COLORS[session.department] ?? ''}`}
              >
                {DEPT_LABELS[session.department] ?? session.department}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Time In</p>
              <p className="font-medium">{formatTime(session.timeIn)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Time Out</p>
              <div className="flex items-center gap-1.5">
                <p className="font-medium">
                  {session.timeOut ? formatTime(session.timeOut) : '—'}
                </p>
                {session.autoLoggedOut && (
                  <Badge
                    variant="outline"
                    className="border-destructive/30 bg-destructive/10 text-[10px] text-destructive"
                  >
                    auto
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="mb-1.5 flex items-center gap-1.5">
              <MessageSquareText className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Clock-Out Note</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
              <p className="text-sm whitespace-pre-wrap">
                {session.note || 'No notes provided.'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <DialogClose className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors">
            Close
          </DialogClose>
        </div>
      </DialogPopup>
    </Dialog>
  )
}

// ─── Attendance Log ──────────────────────────────────────────────────────────

function AttendanceLog({
  role,
  userDepartment,
}: {
  role: 'owner' | 'staff'
  userDepartment: string | null
}) {
  const isOwner = role === 'owner'
  const { attendanceFilters, setAttendanceFilters } = useStaffStore()
  const { data: members } = useStaffMembers(isOwner ? undefined : userDepartment ?? undefined)
  const [dateFrom, setDateFrom] = useState(getDefaultDateFrom)
  const [dateTo, setDateTo] = useState(getDefaultDateTo)
  const [staffFilter, setStaffFilter] = useState<string>('all')
  const [deptFilter, setDeptFilter] = useState<string>(isOwner ? 'all' : userDepartment ?? 'all')
  const [appliedFilters, setAppliedFilters] = useState(attendanceFilters)
  const [selectedSession, setSelectedSession] = useState<StaffSession | null>(null)

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAttendanceInfinite(appliedFilters)

  function handleFilter() {
    const filters = {
      staffMemberId: staffFilter,
      department: isOwner ? deptFilter : (userDepartment ?? 'all'),
      dateFrom: dateFrom ? `${dateFrom}T00:00:00.000Z` : null,
      dateTo: dateTo || null,
    }
    setAttendanceFilters(filters)
    setAppliedFilters(filters)
  }

  const sessions = data?.pages.flatMap((page) => page.sessions) ?? []

  const hoursByName: Record<string, number> = {}
  for (const s of sessions) {
    if (s.timeOut) {
      hoursByName[s.staffName] =
        (hoursByName[s.staffName] ?? 0) + calcHours(s.timeIn, s.timeOut)
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-brand" />
          Attendance Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm"
            />
          </label>
          {isOwner && (
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Department</span>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm"
              >
                <option value="all">All Departments</option>
                {DEPT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Staff</span>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm"
            >
              <option value="all">All Staff</option>
              {(members ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <Button
            size="sm"
            onClick={handleFilter}
            disabled={isFetching}
          >
            Filter
          </Button>
        </div>

        {/* Summary */}
        {Object.keys(hoursByName).length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {Object.entries(hoursByName).map(([name, hours]) => (
              <Badge
                key={name}
                variant="outline"
                className="border-border/50 bg-muted/30 px-2.5 py-1 text-xs font-medium"
              >
                {name}: {hours.toFixed(1)}h
              </Badge>
            ))}
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No attendance records found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Staff</th>
                  {isOwner && <th className="pb-2 pr-4 font-medium">Dept</th>}
                  <th className="pb-2 pr-4 font-medium">Time In</th>
                  <th className="pb-2 pr-4 font-medium">Time Out</th>
                  <th className="pb-2 font-medium">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {sessions.map((s) => {
                  const hours = s.timeOut ? calcHours(s.timeIn, s.timeOut) : null
                  return (
                    <tr
                      key={s.id}
                      onClick={isOwner ? () => setSelectedSession(s) : undefined}
                      className={[
                        s.autoLoggedOut ? 'bg-destructive/5' : '',
                        isOwner ? 'cursor-pointer hover:bg-muted/30 transition-colors' : '',
                      ].filter(Boolean).join(' ') || undefined}
                    >
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {formatDate(s.timeIn)}
                      </td>
                      <td className="py-2.5 pr-4 font-medium">
                        {s.staffName}
                        {!s.staffMemberId && (
                          <Badge
                            variant="outline"
                            className="ml-1.5 border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-500"
                          >
                            owner
                          </Badge>
                        )}
                      </td>
                      {isOwner && (
                        <td className="py-2.5 pr-4">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${DEPT_BADGE_COLORS[s.department] ?? ''}`}
                          >
                            {DEPT_LABELS[s.department] ?? s.department}
                          </Badge>
                        </td>
                      )}
                      <td className="py-2.5 pr-4">{formatTime(s.timeIn)}</td>
                      <td className="py-2.5 pr-4">
                        {s.timeOut ? formatTime(s.timeOut) : '—'}
                        {s.autoLoggedOut && (
                          <Badge
                            variant="outline"
                            className="ml-1.5 border-destructive/30 bg-destructive/10 text-[10px] text-destructive"
                          >
                            auto
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 tabular-nums">
                        {hours !== null ? `${hours.toFixed(1)}h` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Show More */}
        {!isLoading && sessions.length > 0 && (
          <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4">
            <p className="text-xs text-muted-foreground">
              Showing {sessions.length} record{sessions.length !== 1 ? 's' : ''}
            </p>
            {hasNextPage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Loading...' : 'Show More'}
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {selectedSession && (
        <AttendanceDetailDialog
          session={selectedSession}
          open={!!selectedSession}
          onOpenChange={(open) => {
            if (!open) setSelectedSession(null)
          }}
        />
      )}
    </Card>
  )
}

// ─── Summary Cards ───────────────────────────────────────────────────────────

function SummaryCards({
  role,
  userDepartment,
}: {
  role: 'owner' | 'staff'
  userDepartment: string | null
}) {
  const isOwner = role === 'owner'
  const dept = isOwner ? undefined : userDepartment ?? undefined
  const { data: sessions, isLoading } = useActiveSessions(dept)

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    )
  }

  const activeCount = (sessions ?? []).length
  const totalHoursToday = (sessions ?? []).reduce((sum, s) => {
    const end = s.timeOut ?? new Date().toISOString()
    return sum + calcHours(s.timeIn, end)
  }, 0)

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="border-border/50">
        <CardContent className="p-5 text-center">
          <p className="text-3xl font-bold text-emerald-400">{activeCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Active Now</p>
        </CardContent>
      </Card>
      <Card className="border-border/50">
        <CardContent className="p-5 text-center">
          <p className="text-3xl font-bold text-blue-400">
            {totalHoursToday.toFixed(1)}h
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Hours Today</p>
        </CardContent>
      </Card>
      <Card className="border-border/50">
        <CardContent className="p-5 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <Timer className="h-5 w-5 text-muted-foreground" />
            <p className="text-lg font-semibold tabular-nums">
              {new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Current Time</p>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function StaffPage() {
  const { role, department, displayName } = useAuth()

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff Shifts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {role === 'owner'
            ? 'Monitor who\'s clocked in across all departments and manage shifts.'
            : `Monitor who's clocked in and manage shifts — ${DEPT_LABELS[department ?? ''] ?? 'your department'}.`}
        </p>
      </div>

      <SummaryCards role={role!} userDepartment={department} />
      <ActiveSessionsPanel role={role!} userDepartment={department} displayName={displayName} />
      <AttendanceLog role={role!} userDepartment={department} />
    </div>
  )
}
