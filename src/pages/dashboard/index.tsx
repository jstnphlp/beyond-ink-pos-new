import { SummaryCards } from './summary-cards'
import { DashboardTabs } from './dashboard-tabs'
import { WalletCards } from './wallet-cards'
import { QuickWalletEntry } from './quick-entry'
import { ExportButton } from './export-button'

export function DashboardPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your command center — real-time overview across all departments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton />
          <QuickWalletEntry />
        </div>
      </div>

      {/* Department summary cards */}
      <SummaryCards />

      {/* Wallet summary cards */}
      <WalletCards />

      {/* Tabbed interface */}
      <DashboardTabs />
    </div>
  )
}
