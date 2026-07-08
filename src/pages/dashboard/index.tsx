import { SummaryCards } from './summary-cards'
import { DashboardTabs } from './dashboard-tabs'

export function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your command center — real-time overview across all departments.
        </p>
      </div>

      {/* Summary cards */}
      <SummaryCards />

      {/* Tabbed interface */}
      <DashboardTabs />
    </div>
  )
}
