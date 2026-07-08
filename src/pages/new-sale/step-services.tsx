import { useState } from 'react'
import { usePosStore, SERVICES, SERVICE_CATEGORIES } from '@/stores/pos-store'
import type { Service, ServiceCategory, Department } from '@/stores/pos-store'
import { cn } from '@/lib/utils'
import { Check, ChevronLeft, ArrowRight } from 'lucide-react'
import {
  FileText,
  Image,
  Sticker,
  RectangleHorizontal,
  LayoutGrid,
  Palette,
  Share2,
  Code2,
  BookOpen,
  BookMarked,
  Film,
  Globe,
  Copy,
  ScanLine,
  Layers,
  Camera,
  Award,
  FileSpreadsheet,
  Contact,
  Pencil,
  Keyboard,
  Search,
  ImagePlus,
  Video,
  ShoppingCart,
  Monitor,
  Cpu,
  Plug,
  Database,
  MessageSquare,
  PlayCircle,
  Layout,
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
  BookOpen,
  BookMarked,
  Film,
  Globe,
  Copy,
  ScanLine,
  Layers,
  Camera,
  Award,
  FileSpreadsheet,
  Contact,
  Pencil,
  Keyboard,
  Search,
  ImagePlus,
  Video,
  ShoppingCart,
  Monitor,
  Cpu,
  Plug,
  Database,
  MessageSquare,
  PlayCircle,
  Layout,
}

const DEPT_ACCENT: Record<Department, string> = {
  Physical: 'border-blue-500/40 bg-blue-500/5',
  Design: 'border-purple-500/40 bg-purple-500/5',
  Dev: 'border-emerald-500/40 bg-emerald-500/5',
}

const DEPT_BG: Record<Department, string> = {
  Physical: 'bg-blue-500/10',
  Design: 'bg-purple-500/10',
  Dev: 'bg-emerald-500/10',
}

const DEPT_ICON_COLOR: Record<Department, string> = {
  Physical: 'text-blue-400',
  Design: 'text-purple-400',
  Dev: 'text-emerald-400',
}

export function StepServices() {
  const { selectedServices, toggleService } = usePosStore()
  const selectedIds = new Set(selectedServices.map((s) => s.service.id))
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  const selectedCategory = selectedCategoryId
    ? SERVICE_CATEGORIES.find((c) => c.id === selectedCategoryId)
    : null

  const categoryServices = selectedCategoryId
    ? SERVICES.filter((s) => s.categoryId === selectedCategoryId)
    : []

  const getCategorySelectedCount = (categoryId: string) =>
    selectedServices.filter((ss) => ss.service.categoryId === categoryId).length

  if (!selectedCategory) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Select Service Category
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Choose a category to browse available services.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {SERVICE_CATEGORIES.map((category) => {
            const Icon = ICON_MAP[category.icon] ?? FileText
            const count = getCategorySelectedCount(category.id)

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategoryId(category.id)}
                className={cn(
                  'group relative flex items-start gap-4 rounded-xl border p-4 text-left transition-all duration-200',
                  count > 0
                    ? `${DEPT_ACCENT[category.department]} ring-1 ring-inset ring-current/10`
                    : 'border-border/60 bg-card hover:border-border hover:bg-muted/30'
                )}
              >
                {/* Selected count badge */}
                {count > 0 && (
                  <div className="absolute right-3 top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1">
                    <span className="text-[10px] font-bold text-brand-foreground">{count}</span>
                  </div>
                )}

                {/* Icon */}
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                    count > 0
                      ? `${DEPT_ICON_COLOR[category.department]} ${DEPT_BG[category.department]}`
                      : 'bg-muted text-muted-foreground group-hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{category.name}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      {SERVICES.filter((s) => s.categoryId === category.id).length} services
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <button
          type="button"
          onClick={() => setSelectedCategoryId(null)}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to categories
        </button>
        <h2 className="text-lg font-semibold tracking-tight">
          {selectedCategory.name}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Select one or more services from this category.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {categoryServices.map((service) => {
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
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
