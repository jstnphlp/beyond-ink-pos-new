import { Search, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { HistoryFilters } from '@/shared/api/history.types'

const STATUS_TABS = [
  { value: 'all' as const, label: 'All' },
  { value: 'completed' as const, label: 'Completed' },
  { value: 'cancelled' as const, label: 'Cancelled' },
]

const PAYMENT_TABS = [
  { value: 'all' as const, label: 'All Methods' },
  { value: 'cash' as const, label: 'Cash' },
  { value: 'gcash' as const, label: 'GCash' },
]

export function HistoryFilters({
  filters,
  onFilterChange,
}: {
  filters: HistoryFilters
  onFilterChange: <K extends keyof HistoryFilters>(key: K, value: HistoryFilters[K]) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-3">
      {/* Search */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search transactions…"
          className="pl-9"
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
        />
      </div>

      {/* Status tabs */}
      <div className="inline-flex rounded-lg bg-muted p-[3px]">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`rounded-md px-2 md:px-3 py-1 text-xs font-medium transition-colors ${
              filters.status === tab.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => onFilterChange('status', tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Payment method */}
      <div className="inline-flex rounded-lg bg-muted p-[3px]">
        {PAYMENT_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`rounded-md px-2 md:px-3 py-1 text-xs font-medium transition-colors ${
              filters.paymentMethod === tab.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => onFilterChange('paymentMethod', tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date range */}
      <div className="flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
        <input
          type="date"
          className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground"
          value={filters.dateFrom ?? ''}
          onChange={(e) => onFilterChange('dateFrom', e.target.value || null)}
        />
        <span className="text-xs text-muted-foreground">to</span>
        <input
          type="date"
          className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground"
          value={filters.dateTo ?? ''}
          onChange={(e) => onFilterChange('dateTo', e.target.value || null)}
        />
      </div>

      {/* Clear filters */}
      {(filters.status !== 'all' ||
        filters.paymentMethod !== 'all' ||
        filters.dateFrom ||
        filters.dateTo ||
        filters.search) && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => {
            onFilterChange('status', 'all')
            onFilterChange('paymentMethod', 'all')
            onFilterChange('dateFrom', null)
            onFilterChange('dateTo', null)
            onFilterChange('search', '')
          }}
        >
          Clear
        </Button>
      )}
    </div>
  )
}
