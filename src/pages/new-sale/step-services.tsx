import { usePosStore, SERVICES } from '@/stores/pos-store'
import type { Service, Department } from '@/stores/pos-store'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import {
  FileText,
  Image,
  Sticker,
  RectangleHorizontal,
  LayoutGrid,
  Palette,
  Share2,
  Code2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  FileText,
  Image,
  Sticker,
  RectangleHorizontal,
  LayoutGrid,
  Palette,
  Share2,
  Code2,
}

const DEPT_ACCENT: Record<Department, string> = {
  Physical: 'border-blue-500/40 bg-blue-500/5',
  Design: 'border-purple-500/40 bg-purple-500/5',
  Dev: 'border-emerald-500/40 bg-emerald-500/5',
}

const DEPT_ICON_COLOR: Record<Department, string> = {
  Physical: 'text-blue-400',
  Design: 'text-purple-400',
  Dev: 'text-emerald-400',
}

export function StepServices() {
  const { selectedServices, toggleService } = usePosStore()
  const selectedIds = new Set(selectedServices.map((s) => s.service.id))

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Select Services
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Choose one or more services for this transaction.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {SERVICES.map((service: Service) => {
          const isSelected = selectedIds.has(service.id)
          const Icon = ICON_MAP[service.icon] ?? FileText

          return (
            <button
              key={service.id}
              type="button"
              onClick={() => toggleService(service)}
              className={cn(
                'group relative flex items-start gap-4 rounded-xl border p-4 text-left transition-all duration-200',
                isSelected
                  ? `${DEPT_ACCENT[service.department]} ring-1 ring-inset ring-current/10`
                  : 'border-border/60 bg-card hover:border-border hover:bg-muted/30'
              )}
            >
              {/* Selected check */}
              {isSelected && (
                <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand">
                  <Check className="h-3 w-3 text-brand-foreground" />
                </div>
              )}

              {/* Icon */}
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                  isSelected
                    ? `${DEPT_ICON_COLOR[service.department]} bg-background/50`
                    : 'bg-muted text-muted-foreground group-hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{service.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                  {service.description}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    ₱{service.basePrice.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {service.department}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
