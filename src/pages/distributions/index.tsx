import { useState, useMemo } from 'react'
import { ChartPie, Clock, Users, TrendingUp, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  usePhysicalDistribution,
  useDesignDistribution,
  useDevDistribution,
  useMarkWeekGiven,
  useWeekGivenStatuses,
} from '@/shared/hooks/use-distributions'
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

function generateWeeks(count: number): { monday: Date; label: string }[] {
  const today = new Date()
  const currentMonday = getMonday(today)
  const weeks: { monday: Date; label: string }[] = []
  for (let i = 0; i < count; i++) {
    const monday = addDays(currentMonday, -i * 7)
    weeks.push({ monday, label: formatWeekLabel(monday) })
  }
  return weeks
}

function weekToPeriod(monday: Date): DistributionPeriod {
  return {
    dateFrom: toIsoStart(monday),
    dateTo: toIsoEnd(addDays(monday, 6)),
  }
}

// ─── Format ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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

// ─── Staff Tables ────────────────────────────────────────────────────────────

function PhysicalStaffTable({
  isLoading,
  payouts,
}: {
  isLoading: boolean
  payouts: PhysicalStaffPayout[]
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
            <th className="pb-2 font-medium text-right">Payout</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {payouts.map((p) => (
            <tr key={p.staffMemberId}>
              <td className="py-2.5 pr-4 font-medium">{p.staffName}</td>
              <td className="py-2.5 pr-4 text-right tabular-nums">
                {p.totalHours.toFixed(1)}h
              </td>
              <td className="py-2.5 text-right font-semibold tabular-nums">
                {formatCurrency(p.payout)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DesignDevStaffTable({
  isLoading,
  payouts,
}: {
  isLoading: boolean
  payouts: DesignDevStaffPayout[]
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
            <th className="pb-2 font-medium text-right">Payout</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {payouts.map((p) => (
            <tr key={p.staffMemberId}>
              <td className="py-2.5 pr-4 font-medium">{p.staffName}</td>
              <td className="py-2.5 pr-4 text-right tabular-nums">
                {p.transactionCount}
              </td>
              <td className="py-2.5 pr-4 text-right tabular-nums">
                {p.sharePercent.toFixed(1)}%
              </td>
              <td className="py-2.5 text-right font-semibold tabular-nums">
                {formatCurrency(p.payout)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Tab Panels ──────────────────────────────────────────────────────────────

function PhysicalPanel({
  period,
  isGiven,
  onToggleGiven,
  isToggling,
}: {
  period: DistributionPeriod
  isGiven: boolean
  onToggleGiven: () => void
  isToggling: boolean
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-brand" />
              Staff Payouts
            </CardTitle>
            {payouts.length > 0 && (
              <Button
                size="sm"
                variant={isGiven ? 'outline' : 'default'}
                className={isGiven ? 'gap-1.5' : 'gap-1.5 bg-emerald-600 hover:bg-emerald-700'}
                onClick={onToggleGiven}
                disabled={isToggling}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isGiven ? 'Mark as Unpaid' : 'Mark as Given'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <PhysicalStaffTable isLoading={isLoading} payouts={payouts} />
        </CardContent>
      </Card>
    </div>
  )
}

function DesignPanel({
  period,
  isGiven,
  onToggleGiven,
  isToggling,
}: {
  period: DistributionPeriod
  isGiven: boolean
  onToggleGiven: () => void
  isToggling: boolean
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-brand" />
              Contributor Payouts
            </CardTitle>
            {payouts.length > 0 && (
              <Button
                size="sm"
                variant={isGiven ? 'outline' : 'default'}
                className={isGiven ? 'gap-1.5' : 'gap-1.5 bg-emerald-600 hover:bg-emerald-700'}
                onClick={onToggleGiven}
                disabled={isToggling}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isGiven ? 'Mark as Unpaid' : 'Mark as Given'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DesignDevStaffTable isLoading={isLoading} payouts={payouts} />
        </CardContent>
      </Card>
    </div>
  )
}

function DevPanel({
  period,
  isGiven,
  onToggleGiven,
  isToggling,
}: {
  period: DistributionPeriod
  isGiven: boolean
  onToggleGiven: () => void
  isToggling: boolean
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-brand" />
              Contributor Payouts
            </CardTitle>
            {payouts.length > 0 && (
              <Button
                size="sm"
                variant={isGiven ? 'outline' : 'default'}
                className={isGiven ? 'gap-1.5' : 'gap-1.5 bg-emerald-600 hover:bg-emerald-700'}
                onClick={onToggleGiven}
                disabled={isToggling}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isGiven ? 'Mark as Unpaid' : 'Mark as Given'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DesignDevStaffTable isLoading={isLoading} payouts={payouts} />
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Week Chip ───────────────────────────────────────────────────────────────

function WeekChip({
  label,
  isSelected,
  periodFrom,
  periodTo,
  onClick,
}: {
  label: string
  isSelected: boolean
  periodFrom: string
  periodTo: string
  onClick: () => void
}) {
  const { data: givenMap } = useWeekGivenStatuses(periodFrom, periodTo)
  const anyGiven = givenMap
    ? Object.values(givenMap).some(Boolean)
    : false
  const allGiven = givenMap
    ? Object.values(givenMap).length > 0 && Object.values(givenMap).every(Boolean)
    : false

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
      {allGiven && (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
      )}
      {anyGiven && !allGiven && (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-amber-400" />
      )}
      {label}
    </button>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

const WEEK_COUNT = 8

export function DistributionsPage() {
  const [weekCount, setWeekCount] = useState(WEEK_COUNT)
  const allWeeks = useMemo(() => generateWeeks(weekCount), [weekCount])
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0)
  const selectedWeek = allWeeks[selectedWeekIndex]
  const period = weekToPeriod(selectedWeek.monday)
  const periodFrom = period.dateFrom!
  const periodTo = period.dateTo!

  const { data: givenStatuses } = useWeekGivenStatuses(periodFrom, periodTo)
  const markWeekGiven = useMarkWeekGiven()

  function handleToggleGiven(department: string) {
    markWeekGiven.mutate({
      department,
      periodFrom,
      periodTo,
      given: !(givenStatuses?.[department] ?? false),
    })
  }

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
              const wp = weekToPeriod(week.monday)
              return (
                <WeekChip
                  key={week.monday.toISOString()}
                  label={week.label}
                  isSelected={selectedWeekIndex === i}
                  periodFrom={wp.dateFrom!}
                  periodTo={wp.dateTo!}
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
      <Tabs defaultValue="physical">
        <TabsList variant="line">
          <TabsTrigger value="physical">
            <Clock className="h-3.5 w-3.5" />
            Physical
          </TabsTrigger>
          <TabsTrigger value="design">
            <ChartPie className="h-3.5 w-3.5" />
            Design
          </TabsTrigger>
          <TabsTrigger value="dev">
            <ChartPie className="h-3.5 w-3.5" />
            Dev
          </TabsTrigger>
        </TabsList>

        <TabsContent value="physical" className="mt-4">
          <PhysicalPanel
            period={period}
            isGiven={givenStatuses?.['physical_dept'] ?? false}
            onToggleGiven={() => handleToggleGiven('physical_dept')}
            isToggling={markWeekGiven.isPending}
          />
        </TabsContent>
        <TabsContent value="design" className="mt-4">
          <DesignPanel
            period={period}
            isGiven={givenStatuses?.['design_dept'] ?? false}
            onToggleGiven={() => handleToggleGiven('design_dept')}
            isToggling={markWeekGiven.isPending}
          />
        </TabsContent>
        <TabsContent value="dev" className="mt-4">
          <DevPanel
            period={period}
            isGiven={givenStatuses?.['dev_dept'] ?? false}
            onToggleGiven={() => handleToggleGiven('dev_dept')}
            isToggling={markWeekGiven.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
