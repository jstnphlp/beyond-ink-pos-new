import { usePosStore, resolveCategories, resolveServices } from '@/stores/pos-store'
import type { Department } from '@/stores/pos-store'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Check, FileText, Settings } from 'lucide-react'
import {
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

export function StepCategory() {
  const { selectedCategoryIds, toggleCategory, selectedServices, catalog, userDepartment } = usePosStore()
  const categories = resolveCategories(catalog)
  const services = resolveServices(catalog)

  const DEPT_FILTER_MAP: Record<string, Department> = {
    physical_dept: 'Physical',
    design_dept: 'Design',
    dev_dept: 'Dev',
  }
  const filteredCategories = userDepartment
    ? categories.filter((c) => c.department === DEPT_FILTER_MAP[userDepartment])
    : categories

  const getCategorySelectedCount = (categoryId: string) =>
    selectedServices.filter((ss) => ss.service.categoryId === categoryId).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Select Service Categories
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Choose one or more categories, then pick services in the next step.
          </p>
        </div>
        <Link
          to="/services"
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Settings className="h-3 w-3" />
          Manage Services
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filteredCategories.map((category) => {
          const Icon = ICON_MAP[category.icon] ?? FileText
          const count = getCategorySelectedCount(category.id)
          const isSelected = selectedCategoryIds.includes(category.id)

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => toggleCategory(category.id)}
              className={cn(
                'group relative flex items-start gap-4 rounded-xl border p-4 text-left transition-all duration-200',
                isSelected
                  ? `${DEPT_ACCENT[category.department]} ring-2 ring-inset ring-current/20`
                  : count > 0
                    ? `${DEPT_ACCENT[category.department]} ring-1 ring-inset ring-current/10`
                    : 'border-border/60 bg-card hover:border-border hover:bg-muted/30'
              )}
            >
              {/* Selected check */}
              {isSelected && (
                <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand">
                  <Check className="h-3 w-3 text-brand-foreground" />
                </div>
              )}

              {/* Selected count badge (when services selected but category not checked) */}
              {!isSelected && count > 0 && (
                <div className="absolute right-3 top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1">
                  <span className="text-[10px] font-bold text-brand-foreground">{count}</span>
                </div>
              )}

              {/* Icon */}
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                  isSelected || count > 0
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
                    {services.filter((s) => s.categoryId === category.id).length} services
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
