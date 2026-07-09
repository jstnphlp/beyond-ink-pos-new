import { useState } from 'react'
import { usePosStore, resolveCategories, resolveServices } from '@/stores/pos-store'
import type { Department, SelectedService, Service } from '@/stores/pos-store'
import { cn } from '@/lib/utils'
import { X, FileText, ChevronDown, Check } from 'lucide-react'

const DEPT_ACCENT: Record<Department, string> = {
  Physical: 'border-blue-500/40 bg-blue-500/5',
  Design: 'border-purple-500/40 bg-purple-500/5',
  Dev: 'border-emerald-500/40 bg-emerald-500/5',
}

function CategoryDropdown({
  categoryId,
  selectedServices,
  selectedIds,
  onToggle,
  onRemove,
  categories,
  services,
}: {
  categoryId: string
  selectedServices: SelectedService[]
  selectedIds: Set<string>
  onToggle: (service: Service) => void
  onRemove: () => void
  categories: ReturnType<typeof resolveCategories>
  services: ReturnType<typeof resolveServices>
}) {
  const [open, setOpen] = useState(false)

  const category = categories.find((c) => c.id === categoryId)
  const catServices = services.filter((s) => s.categoryId === categoryId)
  const unselected = catServices.filter((s) => !selectedIds.has(s.id))
  const selected = selectedServices.filter((ss) => ss.service.categoryId === categoryId)

  if (!category) return null

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all duration-200',
        selected.length > 0
          ? DEPT_ACCENT[category.department]
          : 'border-border/60 bg-card'
      )}
    >
      {/* Category header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{category.name}</p>
          <p className="text-xs text-muted-foreground">
            {selected.length} of {services.length} selected
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1">
              <span className="text-[10px] font-bold text-brand-foreground">
                {selected.length}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={onRemove}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Remove category"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Dropdown trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-lg border border-border bg-background px-3 text-sm transition-colors',
            'hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring/50',
            open && 'ring-2 ring-ring/50'
          )}
        >
          <span className={unselected.length === 0 ? 'text-muted-foreground' : 'text-foreground'}>
            {unselected.length === 0 ? 'All added' : 'Add a service...'}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              open && 'rotate-180'
            )}
          />
        </button>

        {open && unselected.length > 0 && (
          <div className="absolute z-50 mt-1 w-full overflow-y-auto rounded-lg border border-border bg-popover shadow-lg" style={{ maxHeight: Math.min(unselected.length * 40, 280) }}>
              {unselected.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => {
                    onToggle(service)
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{service.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ₱{service.basePrice}
                  </span>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Selected services for this category */}
      {selected.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {selected.map((ss) => (
            <div
              key={ss.service.id}
              className="flex items-center gap-2.5 rounded-lg bg-background/60 px-3 py-2"
            >
              <Check className="h-3.5 w-3.5 shrink-0 text-brand" />
              <span className="flex-1 truncate text-sm font-medium">
                {ss.service.name}
              </span>
              <span className="text-xs text-muted-foreground">
                ₱{ss.service.basePrice}
              </span>
              <button
                type="button"
                onClick={() => onToggle(ss.service)}
                className="text-muted-foreground transition-colors hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function StepServices() {
  const { selectedCategoryIds, toggleCategory, selectedServices, toggleService, catalog } = usePosStore()
  const categories = resolveCategories(catalog)
  const services = resolveServices(catalog)
  const selectedIds = new Set(selectedServices.map((s) => s.service.id))

  if (selectedCategoryIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-muted-foreground">
          Go back and select at least one category first.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Select Services
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Pick services from each selected category. Remove a category with the ✕ button.
        </p>
      </div>

      <div className="space-y-3">
        {selectedCategoryIds.map((catId) => (
          <CategoryDropdown
            key={catId}
            categoryId={catId}
            selectedServices={selectedServices}
            selectedIds={selectedIds}
            onToggle={toggleService}
            onRemove={() => toggleCategory(catId)}
            categories={categories}
            services={services}
          />
        ))}
      </div>

      {selectedServices.length === 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Use the dropdowns above to add services from each category.
        </p>
      )}
    </div>
  )
}
