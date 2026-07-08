import { useState } from 'react'
import { ChartPie, DollarSign, Clock, Users, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  usePhysicalDistribution,
  useDesignDistribution,
  useDevDistribution,
} from '@/shared/hooks/use-distributions'
import type {
  DistributionPeriod,
  PhysicalStaffPayout,
  DesignDevStaffPayout,
} from '@/shared/api/distributions.types'

function getDefaultDateFrom(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().split('T')[0]
}

function getDefaultDateTo(): string {
  return new Date().toISOString().split('T')[0]
}

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
            <DollarSign className="h-4 w-4 text-emerald-400" />
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
        No attendance records found for this period.
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
        No contributors found for this period. Assign contributors to Design/Dev sales to see distributions.
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

function PhysicalPanel({ period }: { period: DistributionPeriod }) {
  const { data, isLoading } = usePhysicalDistribution(period)
  const payouts = (data?.staffPayouts as PhysicalStaffPayout[]) ?? []
  const totalHours = payouts.reduce((sum, p) => sum + p.totalHours, 0)
  const totalPayroll = data?.deptShare ?? 0

  return (
    <div className="space-y-6">
      <PhysicalSummaryCards
        isLoading={isLoading}
        totalHours={totalHours}
        totalPayroll={totalPayroll}
      />
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-brand" />
            Staff Payouts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PhysicalStaffTable isLoading={isLoading} payouts={payouts} />
        </CardContent>
      </Card>
    </div>
  )
}

function DesignPanel({ period }: { period: DistributionPeriod }) {
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
          <DesignDevStaffTable isLoading={isLoading} payouts={payouts} />
        </CardContent>
      </Card>
    </div>
  )
}

function DevPanel({ period }: { period: DistributionPeriod }) {
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
          <DesignDevStaffTable isLoading={isLoading} payouts={payouts} />
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function DistributionsPage() {
  const [dateFrom, setDateFrom] = useState(getDefaultDateFrom)
  const [dateTo, setDateTo] = useState(getDefaultDateTo)
  const [appliedPeriod, setAppliedPeriod] = useState<DistributionPeriod>({
    dateFrom: `${getDefaultDateFrom()}T00:00:00.000Z`,
    dateTo: getDefaultDateTo(),
  })

  function handleFilter() {
    setAppliedPeriod({
      dateFrom: dateFrom ? `${dateFrom}T00:00:00.000Z` : null,
      dateTo: dateTo || null,
    })
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Distributions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Salary distributions by department.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
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
        <button
          type="button"
          onClick={handleFilter}
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Filter
        </button>
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
          <PhysicalPanel period={appliedPeriod} />
        </TabsContent>
        <TabsContent value="design" className="mt-4">
          <DesignPanel period={appliedPeriod} />
        </TabsContent>
        <TabsContent value="dev" className="mt-4">
          <DevPanel period={appliedPeriod} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
