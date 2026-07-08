import { useDashboardStore } from '@/stores/dashboard-store'
import { Card, CardContent } from '@/components/ui/card'
import {
  Printer,
  Palette,
  Code2,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Printer,
  Palette,
  Code2,
}

const DEPARTMENT_STYLES: Record<string, { gradient: string; glow: string; accent: string }> = {
  Physical: {
    gradient: 'from-blue-500/10 to-blue-600/5',
    glow: 'shadow-blue-500/5',
    accent: 'text-blue-400',
  },
  Design: {
    gradient: 'from-purple-500/10 to-purple-600/5',
    glow: 'shadow-purple-500/5',
    accent: 'text-purple-400',
  },
  Dev: {
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    glow: 'shadow-emerald-500/5',
    accent: 'text-emerald-400',
  },
}

export function SummaryCards() {
  const summaries = useDashboardStore((s) => s.summaries)

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {(summaries ?? []).map((summary) => {
        const Icon = ICON_MAP[summary.icon] ?? Printer
        const style = DEPARTMENT_STYLES[summary.department]

        return (
          <Card
            key={summary.department}
            className={`card-hover relative overflow-hidden border-border/50 bg-gradient-to-br ${style.gradient} ${style.glow} shadow-lg`}
          >
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-background/50 ${style.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-success">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-[11px] font-semibold">+12%</span>
                </div>
              </div>

              {/* Label */}
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                {summary.label}
              </p>

              {/* Revenue */}
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-3xl font-bold tracking-tight text-foreground">
                  ₱{summary.dailyRevenue.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">today</span>
              </div>

              {/* Active transactions */}
              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                <span className="text-xs text-muted-foreground">
                  Active transactions
                </span>
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-bold ${style.accent}`}>
                    {summary.activeTransactions}
                  </span>
                  <ArrowUpRight className={`h-3 w-3 ${style.accent}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
