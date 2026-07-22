import { useState, useMemo } from 'react'
import { ChartPie, Clock, Users, TrendingUp, CheckCircle2, ChevronLeft, ChevronRight, Circle, LogIn } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAuth } from '@/shared/hooks/use-auth'
import {
  usePhysicalDistribution,
  useDesignDistribution,
  useDevDistribution,
  useMarkStaffGiven,
  useAllWeekGivenStatuses,
} from '@/shared/hooks/use-distributions'
import { supabase } from '@/shared/api/supabase'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type {
  DistributionPeriod,
  PhysicalStaffPayout,
  DesignDevStaffPayout,
} from '@/shared/api/distributions.types'

// ─── Week helpers ────────────────────────────────────────────────────────────

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(d: Date, days: number): Date {
  const result = new Date(d)
  result.setDate(result.getDate() + days)
  return result
}

function formatWeekLabel(monday: Date): string {
  const sunday = addDays(monday, 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${monday.toLocaleDateString('en-US', opts)} – ${sunday.toLocaleDateString('en-US', opts)}`
}

function toIsoStart(d: Date): string {
  return d.toISOString()
}

function toIsoEnd(d: Date): string {
  const end = new Date(d)
  end.setHours(23, 59, 59, 999)
  return end.toISOString()
}

interface WeekEntry {
  monday: Date
  label: string
  periodFrom: string
  periodTo: string
}

function generateWeeks(count: number): WeekEntry[] {
  const today = new Date()
  const currentMonday = getMonday(today)
  const weeks: WeekEntry[] = []
  for (let i = 0; i < count; i++) {
    const monday = addDays(currentMonday, -i * 7)
    weeks.push({
      monday,
      label: formatWeekLabel(monday),
      periodFrom: toIsoStart(monday),
      periodTo: toIsoEnd(addDays(monday, 6)),
    })
  }
  return weeks
}

function weekToPeriod(week: WeekEntry): DistributionPeriod {
  return { dateFrom: week.periodFrom, dateTo: week.periodTo }
}

// ─── Format ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── Staff lookup hook ───────────────────────────────────────────────────────

function useCurrentStaffMember(userEmail: string | undefined) {
  return useQuery({
    queryKey: ['current-staff-member', userEmail],
    queryFn: async () => {
      if (!userEmail) return null
      const { data: allowedUser } = await supabase
        .from('allowed_users')
        .select('name')
        .eq('email', userEmail)
        .single()
      if (!allowedUser?.name) return null

      const { data: staffMember } = await supabase
        .from('staff_members')
        .select('id, name, department')
        .eq('name', allowedUser.name)
        .eq('is_active', true)
        .single()
      return staffMember
    },
    enabled: !!userEmail,
    staleTime: 10 * 60_000,
  })
}

function useActiveStaffSession(staffMemberId: string | undefined) {
  return useQuery({
    queryKey: ['active-staff-session', staffMemberId],
    queryFn: async () => {
      if (!staffMemberId) return null
      const { data } = await supabase
        .from('staff_sessions')
        .select('id, time_in')
        .eq('staff_member_id', staffMemberId)
        .is('time_out', null)
        .maybeSingle()
      return data
    },
    enabled: !!staffMemberId,
    staleTime: 30_000,
  })
}

// ─── Summary Cards ───────────────────────────────────────────────────────────

function PhysicalSummaryCards({
  isLoading,
  totalHours,
  totalPayroll,
}: {
  isLoading: boolean
  totalHours: number
  totalPayroll: number
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="border-border/50">
        <CardContent className="p-5 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <Clock className="h-4 w-4 text-blue-400" />
            <p className="text-3xl font-bold text-blue-400">
              {totalHours.toFixed(1)}h
            </p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Total Hours</p>
        </CardContent>
      </Card>
      <Card className="border-border/50">
        <CardContent className="p-5 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <p className="text-3xl font-bold text-emerald-400">
              {formatCurrency(totalPayroll)}
            </p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Total Payroll (₱15.38/hr)</p>
        </CardContent>
      </Card>
    </div>
  )
}

function DesignDevSummaryCards({
  isLoading,
  totalRevenue,
  ownershipShare,
  deptShare,
  reinvestment,
}: {
  isLoading: boolean
  totalRevenue: number
  ownershipShare: number
  deptShare: number
  reinvestment: number
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-4">
      <Card className="border-border/50">
        <CardContent className="p-5 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <p className="text-2xl font-bold text-emerald-400">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Total Revenue</p>
        </CardContent>
      </Card>
      <Card className="border-border/50">
        <CardContent className="p-5 text-center">
          <p className="text-2xl font-bold text-blue-400">
            {formatCurrency(ownershipShare)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Owner (18%)</p>
        </CardContent>
      </Card>
      <Card className="border-border/50">
        <CardContent className="p-5 text-center">
          <p className="text-2xl font-bold text-violet-400">
            {formatCurrency(deptShare)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Dept Share (68%)</p>
        </CardContent>
      </Card>
      <Card className="border-border/50">
        <CardContent className="p-5 text-center">
          <p className="text-2xl font-bold text-amber-400">
            {formatCurrency(reinvestment)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Reinvestment (14%)</p>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Staff Tables (Owner view — with per-staff paid toggle) ──────────────────

function PhysicalStaffTable({
  isLoading,
  payouts,
  givenStatus,
  onToggleStaff,
  isToggling,
  isOwner,
}: {
  isLoading: boolean
  payouts: PhysicalStaffPayout[]
  givenStatus: Record<string, boolean>
  onToggleStaff: (staffMemberId: string, staffName: string) => void
  isToggling: boolean
  isOwner: boolean
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (payouts.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No attendance records found for this week.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Staff</th>
            <th className="pb-2 pr-4 font-medium text-right">Hours</th>
            <th className="pb-2 pr-4 font-medium text-right">Payout</th>
            {isOwner && <th className="pb-2 font-medium text-center">Paid</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {payouts.map((p) => {
            const isPaid = givenStatus[p.staffMemberId] ?? false
            return (
              <tr key={p.staffMemberId}>
                <td className="py-2.5 pr-4 font-medium">{p.staffName}</td>
                <td className="py-2.5 pr-4 text-right tabular-nums">
                  {p.totalHours.toFixed(1)}h
                </td>
                <td className="py-2.5 pr-4 text-right font-semibold tabular-nums">
                  {formatCurrency(p.payout)}
                </td>
                {isOwner && (
                  <td className="py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleStaff(p.staffMemberId, p.staffName)}
                      disabled={isToggling}
                      className="inline-flex items-center justify-center transition-colors"
                      title={isPaid ? 'Mark as unpaid' : 'Mark as paid'}
                    >
                      {isPaid ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/40 hover:text-muted-foreground/70" />
                      )}
                    </button>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function DesignDevStaffTable({
  isLoading,
  payouts,
  givenStatus,
  onToggleStaff,
  isToggling,
  isOwner,
}: {
  isLoading: boolean
  payouts: DesignDevStaffPayout[]
  givenStatus: Record<string, boolean>
  onToggleStaff: (staffMemberId: string, staffName: string) => void
  isToggling: boolean
  isOwner: boolean
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (payouts.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No contributors found for this week. Assign contributors to Design/Dev sales to see distributions.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Staff</th>
            <th className="pb-2 pr-4 font-medium text-right">Transactions</th>
            <th className="pb-2 pr-4 font-medium text-right">Share %</th>
            <th className="pb-2 pr-4 font-medium text-right">Payout</th>
            {isOwner && <th className="pb-2 font-medium text-center">Paid</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {payouts.map((p) => {
            const isPaid = givenStatus[p.staffMemberId] ?? false
            return (
              <tr key={p.staffMemberId}>
                <td className="py-2.5 pr-4 font-medium">{p.staffName}</td>
                <td className="py-2.5 pr-4 text-right tabular-nums">
                  {p.transactionCount}
                </td>
                <td className="py-2.5 pr-4 text-right tabular-nums">
                  {p.sharePercent.toFixed(1)}%
                </td>
                <td className="py-2.5 pr-4 text-right font-semibold tabular-nums">
                  {formatCurrency(p.payout)}
                </td>
                {isOwner && (
                  <td className="py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleStaff(p.staffMemberId, p.staffName)}
                      disabled={isToggling}
                      className="inline-flex items-center justify-center transition-colors"
                      title={isPaid ? 'Mark as unpaid' : 'Mark as paid'}
                    >
                      {isPaid ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/40 hover:text-muted-foreground/70" />
                      )}
                    </button>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Tab Panels (Owner) ──────────────────────────────────────────────────────

function PhysicalPanel({
  period,
  givenStatus,
  onToggleStaff,
  isToggling,
  isOwner,
}: {
  period: DistributionPeriod
  givenStatus: Record<string, boolean>
  onToggleStaff: (staffMemberId: string, staffName: string) => void
  isToggling: boolean
  isOwner: boolean
}) {
  const { data, isLoading } = usePhysicalDistribution(period)
  const payouts = (data?.staffPayouts as PhysicalStaffPayout[]) ?? []
  const totalHours = payouts.reduce((sum, p) => sum + p.totalHours, 0)
  const totalPayroll = data?.deptShare ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PhysicalSummaryCards
          isLoading={isLoading}
          totalHours={totalHours}
          totalPayroll={totalPayroll}
        />
      </div>
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-brand" />
            Staff Payouts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PhysicalStaffTable
            isLoading={isLoading}
            payouts={payouts}
            givenStatus={givenStatus}
            onToggleStaff={onToggleStaff}
            isToggling={isToggling}
            isOwner={isOwner}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function DesignPanel({
  period,
  givenStatus,
  onToggleStaff,
  isToggling,
  isOwner,
}: {
  period: DistributionPeriod
  givenStatus: Record<string, boolean>
  onToggleStaff: (staffMemberId: string, staffName: string) => void
  isToggling: boolean
  isOwner: boolean
}) {
  const { data, isLoading } = useDesignDistribution(period)
  const payouts = (data?.staffPayouts as DesignDevStaffPayout[]) ?? []

  return (
    <div className="space-y-6">
      <DesignDevSummaryCards
        isLoading={isLoading}
        totalRevenue={data?.totalRevenue ?? 0}
        ownershipShare={data?.ownershipShare ?? 0}
        deptShare={data?.deptShare ?? 0}
        reinvestment={data?.reinvestment ?? 0}
      />
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-brand" />
            Contributor Payouts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DesignDevStaffTable
            isLoading={isLoading}
            payouts={payouts}
            givenStatus={givenStatus}
            onToggleStaff={onToggleStaff}
            isToggling={isToggling}
            isOwner={isOwner}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function DevPanel({
  period,
  givenStatus,
  onToggleStaff,
  isToggling,
  isOwner,
}: {
  period: DistributionPeriod
  givenStatus: Record<string, boolean>
  onToggleStaff: (staffMemberId: string, staffName: string) => void
  isToggling: boolean
  isOwner: boolean
}) {
  const { data, isLoading } = useDevDistribution(period)
  const payouts = (data?.staffPayouts as DesignDevStaffPayout[]) ?? []

  return (
    <div className="space-y-6">
      <DesignDevSummaryCards
        isLoading={isLoading}
        totalRevenue={data?.totalRevenue ?? 0}
        ownershipShare={data?.ownershipShare ?? 0}
        deptShare={data?.deptShare ?? 0}
        reinvestment={data?.reinvestment ?? 0}
      />
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-brand" />
            Contributor Payouts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DesignDevStaffTable
            isLoading={isLoading}
            payouts={payouts}
            givenStatus={givenStatus}
            onToggleStaff={onToggleStaff}
            isToggling={isToggling}
            isOwner={isOwner}
          />
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Staff Own Payout View ───────────────────────────────────────────────────

function StaffOwnPayout({
  period,
  staffMemberId,
  staffName,
  department,
}: {
  period: DistributionPeriod
  staffMemberId: string
  staffName: string
  department: string
}) {
  const { data: physicalData, isLoading: physicalLoading } = usePhysicalDistribution(period)
  const { data: designData, isLoading: designLoading } = useDesignDistribution(period)
  const { data: devData, isLoading: devLoading } = useDevDistribution(period)

  let payout: number | null = null
  let isLoading = false

  if (department === 'physical_dept') {
    isLoading = physicalLoading
    const payouts = (physicalData?.staffPayouts as PhysicalStaffPayout[]) ?? []
    const match = payouts.find((p) => p.staffMemberId === staffMemberId)
    payout = match?.payout ?? null
  } else if (department === 'design_dept') {
    isLoading = designLoading
    const payouts = (designData?.staffPayouts as DesignDevStaffPayout[]) ?? []
    const match = payouts.find((p) => p.staffMemberId === staffMemberId)
    payout = match?.payout ?? null
  } else if (department === 'dev_dept') {
    isLoading = devLoading
    const payouts = (devData?.staffPayouts as DesignDevStaffPayout[]) ?? []
    const match = payouts.find((p) => p.staffMemberId === staffMemberId)
    payout = match?.payout ?? null
  }

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-8">
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-8 text-center">
        <p className="text-sm text-muted-foreground mb-2">Your payout this week</p>
        <p className="text-4xl font-bold text-emerald-400">
          {payout !== null ? formatCurrency(payout) : '—'}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {staffName}
        </p>
      </CardContent>
    </Card>
  )
}

// ─── Week Chip ───────────────────────────────────────────────────────────────

function WeekChip({
  label,
  isSelected,
  isAllGiven,
  isAnyGiven,
  showStatus,
  onClick,
}: {
  label: string
  isSelected: boolean
  isAllGiven: boolean
  isAnyGiven: boolean
  showStatus: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all whitespace-nowrap ${
        isSelected
          ? 'border-brand/50 bg-brand/10 text-foreground ring-1 ring-brand/20'
          : 'border-border/60 bg-card text-muted-foreground hover:border-border hover:bg-muted/30 hover:text-foreground'
      }`}
    >
      {showStatus && isAllGiven && (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
      )}
      {showStatus && isAnyGiven && !isAllGiven && (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-amber-400" />
      )}
      {label}
    </button>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

const WEEK_COUNT = 8
const DEPARTMENTS = ['physical_dept', 'design_dept', 'dev_dept']

export function DistributionsPage() {
  const { role, department, user } = useAuth()
  const navigate = useNavigate()
  const isOwner = role === 'owner'

  const [weekCount, setWeekCount] = useState(WEEK_COUNT)
  const allWeeks = useMemo(() => generateWeeks(weekCount), [weekCount])
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0)
  const selectedWeek = allWeeks[selectedWeekIndex]
  const period = weekToPeriod(selectedWeek)
  const periodFrom = selectedWeek.periodFrom
  const periodTo = selectedWeek.periodTo

  const weekKeys = useMemo(
    () => allWeeks.map((w) => ({ periodFrom: w.periodFrom, periodTo: w.periodTo })),
    [allWeeks],
  )

  const { data: allGivenStatuses } = useAllWeekGivenStatuses(weekKeys)
  const markStaffGiven = useMarkStaffGiven()

  // Staff: look up their staff_member_id
  const { data: currentStaffMember, isLoading: staffLoading } = useCurrentStaffMember(user?.email)

  function getDeptGivenStatus(week: WeekEntry, dept: string): Record<string, boolean> {
    const weekKey = `${new Date(week.periodFrom).getTime()}|${new Date(week.periodTo).getTime()}`
    return allGivenStatuses?.[weekKey]?.[dept] ?? {}
  }

  function isDeptAllGiven(week: WeekEntry, dept: string): boolean {
    // We can't know "all" without the payout data, so check if any are given
    const status = getDeptGivenStatus(week, dept)
    return Object.keys(status).length > 0 && Object.values(status).every(Boolean)
  }

  function isDeptAnyGiven(week: WeekEntry, dept: string): boolean {
    const status = getDeptGivenStatus(week, dept)
    return Object.values(status).some(Boolean)
  }

  function handleToggleStaff(department: string, staffMemberId: string, staffName: string) {
    const current = getDeptGivenStatus(selectedWeek, department)
    const isCurrentlyGiven = current[staffMemberId] ?? false
    markStaffGiven.mutate({
      staffMemberId,
      staffName,
      department,
      periodFrom,
      periodTo,
      given: !isCurrentlyGiven,
    })
  }

  // Staff view: simplified — must be clocked in to see distributions
  if (!isOwner && staffLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Distributions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Loading…</p>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-8">
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isOwner && currentStaffMember) {
    const { data: activeSession, isLoading: sessionLoading } = useActiveStaffSession(currentStaffMember.id)

    return (
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Distributions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your weekly payout information.
          </p>
        </div>

        {sessionLoading && (
          <Card className="border-border/50">
            <CardContent className="p-8">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        )}

        {!sessionLoading && !activeSession && (
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center p-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <LogIn className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Please time in first</p>
              <p className="mt-1 text-xs text-muted-foreground">
                You need to be clocked in to view your distributions.
              </p>
              <Button
                size="sm"
                className="mt-4 gap-1.5"
                onClick={() => navigate('/staff')}
              >
                <LogIn className="h-3.5 w-3.5" />
                Go to Staff Shifts
              </Button>
            </CardContent>
          </Card>
        )}

        {!sessionLoading && activeSession && (
          <>
            {/* Week Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground">Select Week</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setWeekCount((c) => c + 4)}
                >
                  Show more weeks
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setSelectedWeekIndex((i) => Math.min(i + 1, allWeeks.length - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex flex-wrap gap-2 overflow-x-auto">
                  {allWeeks.map((week, i) => (
                    <WeekChip
                      key={week.periodFrom}
                      label={week.label}
                      isSelected={selectedWeekIndex === i}
                      isAllGiven={false}
                      isAnyGiven={false}
                      showStatus={false}
                      onClick={() => setSelectedWeekIndex(i)}
                    />
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setSelectedWeekIndex((i) => Math.max(i - 1, 0))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <StaffOwnPayout
              period={period}
              staffMemberId={currentStaffMember.id}
              staffName={currentStaffMember.name}
              department={currentStaffMember.department}
            />
          </>
        )}
      </div>
    )
  }

  // Non-owners without a staff member record — block access to the full view
  if (!isOwner) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Distributions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your weekly payout information.
          </p>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No staff record found. Contact an owner if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Owner view: full page with tabs and per-staff paid toggles
  // Determine which tabs to show
  const tabsToShow = isOwner ? DEPARTMENTS : department ? [department] : []

  const defaultTab = tabsToShow[0] === 'physical_dept' ? 'physical'
    : tabsToShow[0] === 'design_dept' ? 'design'
    : 'dev'

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Distributions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Salary distributions by department. Select a week to view breakdowns and mark payouts as given.
        </p>
      </div>

      {/* Week Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Select Week</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setWeekCount((c) => c + 4)}
          >
            Show more weeks
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setSelectedWeekIndex((i) => Math.min(i + 1, allWeeks.length - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-wrap gap-2 overflow-x-auto">
            {allWeeks.map((week, i) => {
              // For owner: aggregate across all shown departments
              const anyGiven = DEPARTMENTS.some((d) => isDeptAnyGiven(week, d))
              const allGiven = DEPARTMENTS.every((d) => isDeptAllGiven(week, d)) && DEPARTMENTS.length > 0
              return (
                <WeekChip
                  key={week.periodFrom}
                  label={week.label}
                  isSelected={selectedWeekIndex === i}
                  isAllGiven={allGiven}
                  isAnyGiven={anyGiven}
                  showStatus={isOwner}
                  onClick={() => setSelectedWeekIndex(i)}
                />
              )
            })}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setSelectedWeekIndex((i) => Math.max(i - 1, 0))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab}>
        <TabsList variant="line">
          {tabsToShow.includes('physical_dept') && (
            <TabsTrigger value="physical">
              <Clock className="h-3.5 w-3.5" />
              Physical
            </TabsTrigger>
          )}
          {tabsToShow.includes('design_dept') && (
            <TabsTrigger value="design">
              <ChartPie className="h-3.5 w-3.5" />
              Design
            </TabsTrigger>
          )}
          {tabsToShow.includes('dev_dept') && (
            <TabsTrigger value="dev">
              <ChartPie className="h-3.5 w-3.5" />
              Dev
            </TabsTrigger>
          )}
        </TabsList>

        {tabsToShow.includes('physical_dept') && (
          <TabsContent value="physical" className="mt-4">
            <PhysicalPanel
              period={period}
              givenStatus={getDeptGivenStatus(selectedWeek, 'physical_dept')}
              onToggleStaff={(id, name) => handleToggleStaff('physical_dept', id, name)}
              isToggling={markStaffGiven.isPending}
              isOwner={isOwner}
            />
          </TabsContent>
        )}
        {tabsToShow.includes('design_dept') && (
          <TabsContent value="design" className="mt-4">
            <DesignPanel
              period={period}
              givenStatus={getDeptGivenStatus(selectedWeek, 'design_dept')}
              onToggleStaff={(id, name) => handleToggleStaff('design_dept', id, name)}
              isToggling={markStaffGiven.isPending}
              isOwner={isOwner}
            />
          </TabsContent>
        )}
        {tabsToShow.includes('dev_dept') && (
          <TabsContent value="dev" className="mt-4">
            <DevPanel
              period={period}
              givenStatus={getDeptGivenStatus(selectedWeek, 'dev_dept')}
              onToggleStaff={(id, name) => handleToggleStaff('dev_dept', id, name)}
              isToggling={markStaffGiven.isPending}
              isOwner={isOwner}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
