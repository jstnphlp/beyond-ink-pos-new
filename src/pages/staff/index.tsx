import { useState } from 'react'
import { Users, LogIn, LogOut, History, Timer } from 'lucide-react'
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
import { useStaffStore } from '@/stores/staff-store'

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

function ClockInDialog() {
  const { data: members } = useStaffMembers()
  const { data: activeSessions } = useActiveSessions()
  const clockInMutation = useClockIn()
  const [open, setOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const activeIds = new Set((activeSessions ?? []).map((s) => s.staffMemberId))
  const available = (members ?? []).filter((m) => !activeIds.has(m.id))

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
    const toClockIn = available.filter((m) => selectedIds.has(m.id))
    let completed = 0
    for (const member of toClockIn) {
      clockInMutation.mutate(
        { staffMemberId: member.id, staffName: member.name },
        {
          onSettled: () => {
            completed++
            if (completed === toClockIn.length) {
              setSelectedIds(new Set())
              setOpen(false)
            }
          },
        },
      )
    }
  }

  // Reset selection when dialog opens/closes
  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setSelectedIds(new Set())
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button size="sm" className="gap-1.5" />}
      >
        <LogIn className="h-3.5 w-3.5" />
        Time In
      </DialogTrigger>
      <DialogPopup>
        <DialogTitle>Clock In</DialogTitle>
        <DialogDescription>
          Select staff members to start their shift.
        </DialogDescription>

        <div className="mt-4 space-y-2">
          {available.length === 0 && (
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
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
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
          {available.length > 0 && (
            <Button
              size="sm"
              className="gap-1.5"
              disabled={selectedIds.size === 0 || clockInMutation.isPending}
              onClick={handleClockInSelected}
            >
              <LogIn className="h-3.5 w-3.5" />
              Clock In {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
            </Button>
          )}
        </div>
      </DialogPopup>
    </Dialog>
  )
}

// ─── Active Sessions Panel ───────────────────────────────────────────────────

function ActiveSessionsPanel() {
  const { data: sessions, isLoading } = useActiveSessions()
  const clockOutMutation = useClockOut()

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-brand" />
            Active Sessions
          </CardTitle>
          <ClockInDialog />
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
                  <p className="text-sm font-medium">{session.staffName}</p>
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
                onClick={() => clockOutMutation.mutate(session.staffMemberId)}
              >
                <LogOut className="h-3 w-3" />
                Time Out
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Attendance Log ──────────────────────────────────────────────────────────

function AttendanceLog() {
  const { attendanceFilters, setAttendanceFilters } = useStaffStore()
  const { data: members } = useStaffMembers()
  const [dateFrom, setDateFrom] = useState(getDefaultDateFrom)
  const [dateTo, setDateTo] = useState(getDefaultDateTo)
  const [staffFilter, setStaffFilter] = useState<string>('all')
  const [appliedFilters, setAppliedFilters] = useState(attendanceFilters)

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAttendanceInfinite(appliedFilters)

  function handleFilter() {
    const filters = {
      staffMemberId: staffFilter,
      dateFrom: dateFrom ? `${dateFrom}T00:00:00.000Z` : null,
      dateTo: dateTo || null,
    }
    setAttendanceFilters(filters)
    setAppliedFilters(filters)
  }

  const sessions = data?.pages.flatMap((page) => page.sessions) ?? []

  // Summary hours
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
                      className={s.autoLoggedOut ? 'bg-destructive/5' : undefined}
                    >
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {formatDate(s.timeIn)}
                      </td>
                      <td className="py-2.5 pr-4 font-medium">{s.staffName}</td>
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
    </Card>
  )
}

// ─── Summary Cards ───────────────────────────────────────────────────────────

function SummaryCards() {
  const { data: sessions, isLoading } = useActiveSessions()

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
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff Shifts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor who's clocked in and manage shifts.
        </p>
      </div>

      <SummaryCards />
      <ActiveSessionsPanel />
      <AttendanceLog />
    </div>
  )
}
