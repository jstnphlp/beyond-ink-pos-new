import { useState } from 'react'
import {
  Tags,
  Wrench,
  Package,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Search,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import {
  useCatalog,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
  useSetMaterialServices,
} from '@/shared/hooks/use-catalog'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CatalogCategory {
  id: string
  name: string
  department: string
  icon: string
  isActive: boolean
}

interface CatalogService {
  id: string
  name: string
  categoryId: string
  description: string
  basePrice: number
  icon: string
  isActive: boolean
}

interface CatalogMaterial {
  id: string
  name: string
  unit: string
  costPerUnit: number
  stockOnHand: number
  isActive: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── Department grouping constants ────────────────────────────────────────────

const DEPT_ORDER = ['physical_dept', 'design_dept', 'dev_dept'] as const
const DEPT_LABELS: Record<string, string> = {
  physical_dept: 'Physical',
  design_dept: 'Design',
  dev_dept: 'Dev',
}
const DEPT_COLORS: Record<
  string,
  { border: string; bg: string; text: string; headerBg: string }
> = {
  physical_dept: {
    border: 'border-blue-500/20',
    bg: 'bg-blue-500/5',
    text: 'text-blue-400',
    headerBg: 'bg-blue-500/10',
  },
  design_dept: {
    border: 'border-violet-500/20',
    bg: 'bg-violet-500/5',
    text: 'text-violet-400',
    headerBg: 'bg-violet-500/10',
  },
  dev_dept: {
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/5',
    text: 'text-amber-400',
    headerBg: 'bg-amber-500/10',
  },
}

// ─── Delete Confirmation Dialog ───────────────────────────────────────────────

function DeleteDialog({
  label,
  onConfirm,
  isPending,
}: {
  label: string
  onConfirm: () => void
  isPending: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="icon-sm" />}>
        <Trash2 className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogPopup>
        <DialogTitle>Delete {label}</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete "{label}"? This action cannot be
          undone.
        </DialogDescription>
        <div className="border-destructive/30 bg-destructive/5 mt-4 flex items-start gap-3 rounded-lg border p-3">
          <AlertTriangle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-muted-foreground text-sm">
            This will permanently remove this item from your catalog.
          </p>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <DialogClose render={<Button variant="ghost" size="sm" />}>
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={() => {
              onConfirm()
              setOpen(false)
            }}
          >
            Delete
          </Button>
        </div>
      </DialogPopup>
    </Dialog>
  )
}

// ─── Categories Tab ───────────────────────────────────────────────────────────

function CategoryFormDialog({
  category,
  trigger,
}: {
  category?: CatalogCategory
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(category?.name ?? '')
  const [department, setDepartment] = useState(
    category?.department ?? 'physical_dept'
  )
  const [icon, setIcon] = useState(category?.icon ?? '')

  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const isPending = createMutation.isPending || updateMutation.isPending
  const isEdit = !!category

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    if (isEdit) {
      updateMutation.mutate(
        {
          id: category.id,
          data: { name: name.trim(), department, icon: icon.trim() },
        },
        { onSuccess: () => setOpen(false) }
      )
    } else {
      createMutation.mutate(
        { name: name.trim(), department, icon: icon.trim() },
        {
          onSuccess: () => {
            setName('')
            setDepartment('physical_dept')
            setIcon('')
            setOpen(false)
          },
        }
      )
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen && category) {
      setName(category.name)
      setDepartment(category.department)
      setIcon(category.icon)
    } else if (!nextOpen && !isEdit) {
      setName('')
      setDepartment('physical_dept')
      setIcon('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogPopup>
        <DialogTitle>{isEdit ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? 'Update the category details.'
            : 'Create a new service category.'}
        </DialogDescription>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Name
            </span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Department
            </span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-8 rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3"
            >
              <option value="physical_dept">Physical</option>
              <option value="design_dept">Design</option>
              <option value="dev_dept">Dev</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Icon (lucide name)
            </span>
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="e.g. tag, folder, star"
            />
          </label>
          <div className="flex items-center justify-end gap-2 pt-2">
            <DialogClose render={<Button variant="ghost" size="sm" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !name.trim()}
            >
              {isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  )
}

function DepartmentCategorySection({
  department,
  categories,
}: {
  department: string
  categories: CatalogCategory[]
}) {
  const deleteMutation = useDeleteCategory()
  const colors = DEPT_COLORS[department] ?? DEPT_COLORS.physical_dept

  return (
    <Card className={`${colors.border} overflow-hidden`}>
      <div className={`${colors.headerBg} border-b ${colors.border} px-5 py-3`}>
        <h3 className={`text-sm font-bold ${colors.text}`}>
          {DEPT_LABELS[department] ?? department}
        </h3>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
        </p>
      </div>
      <CardContent className="p-0">
        <div className="divide-border/20 divide-y">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-4 px-5 py-2.5">
              <div className="bg-muted text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                <Tags className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{cat.name}</p>
                <p className="text-muted-foreground text-[11px]">
                  {cat.icon || 'No icon'}
                </p>
              </div>
              <Badge
                variant="outline"
                className={
                  cat.isActive
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-border text-muted-foreground'
                }
              >
                {cat.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <div className="flex shrink-0 items-center gap-1">
                <CategoryFormDialog
                  category={cat}
                  trigger={
                    <Button variant="ghost" size="icon-sm">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
                <DeleteDialog
                  label={cat.name}
                  onConfirm={() => deleteMutation.mutate(cat.id)}
                  isPending={deleteMutation.isPending}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function CategoriesPanel({
  categories,
  isLoading,
}: {
  categories: CatalogCategory[]
  isLoading: boolean
}) {
  const [search, setSearch] = useState('')

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  const filtered = search
    ? categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories

  const grouped = DEPT_ORDER.map((dept) => ({
    department: dept,
    categories: filtered.filter((c) => c.department === dept),
  })).filter((g) => g.categories.length > 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="h-8 pl-8 text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <p className="text-muted-foreground text-sm whitespace-nowrap">
            {filtered.length} {search ? 'found' : `categor${filtered.length !== 1 ? 'ies' : 'y'}`}
          </p>
          <CategoryFormDialog
            trigger={
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add Category
              </Button>
            }
          />
        </div>
      </div>

      {grouped.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          {search ? 'No categories match your search.' : 'No categories yet. Add your first category to get started.'}
        </p>
      ) : (
        grouped.map((g) => (
          <DepartmentCategorySection
            key={g.department}
            department={g.department}
            categories={g.categories}
          />
        ))
      )}
    </div>
  )
}

// ─── Services Tab ─────────────────────────────────────────────────────────────

function ServiceFormDialog({
  service,
  categories,
  open,
  onOpenChange,
}: {
  service?: CatalogService
  categories: CatalogCategory[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [name, setName] = useState(service?.name ?? '')
  const [categoryId, setCategoryId] = useState(service?.categoryId ?? '')
  const [description, setDescription] = useState(service?.description ?? '')
  const [basePrice, setBasePrice] = useState(
    service?.basePrice?.toString() ?? ''
  )
  const [icon, setIcon] = useState(service?.icon ?? '')

  const createMutation = useCreateService()
  const updateMutation = useUpdateService()
  const isPending = createMutation.isPending || updateMutation.isPending
  const isEdit = !!service

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !categoryId) return

    const price = parseFloat(basePrice) || 0

    if (isEdit) {
      updateMutation.mutate(
        {
          id: service.id,
          data: {
            name: name.trim(),
            categoryId,
            description: description.trim(),
            basePrice: price,
            icon: icon.trim(),
          },
        },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createMutation.mutate(
        {
          name: name.trim(),
          categoryId,
          description: description.trim(),
          basePrice: price,
          icon: icon.trim(),
        },
        {
          onSuccess: () => {
            setName('')
            setCategoryId('')
            setDescription('')
            setBasePrice('')
            setIcon('')
            onOpenChange(false)
          },
        }
      )
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen)
    if (nextOpen && service) {
      setName(service.name)
      setCategoryId(service.categoryId)
      setDescription(service.description)
      setBasePrice(service.basePrice.toString())
      setIcon(service.icon)
    } else if (!nextOpen && !isEdit) {
      setName('')
      setCategoryId('')
      setDescription('')
      setBasePrice('')
      setIcon('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup>
        <DialogTitle>{isEdit ? 'Edit Service' : 'Add Service'}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? 'Update the service details.'
            : 'Add a new service to your catalog.'}
        </DialogDescription>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Name
            </span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Service name"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Category
            </span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-8 rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3"
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Description
            </span>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Base Price (₱)
            </span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="0.00"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Icon (lucide name)
            </span>
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="e.g. scissors, brush, code"
            />
          </label>
          <div className="flex items-center justify-end gap-2 pt-2">
            <DialogClose render={<Button variant="ghost" size="sm" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !name.trim() || !categoryId}
            >
              {isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  )
}

function DepartmentServiceSection({
  department,
  categories,
  services,
}: {
  department: string
  categories: CatalogCategory[]
  services: CatalogService[]
}) {
  const deleteMutation = useDeleteService()
  const [editingId, setEditingId] = useState<string | null>(null)
  const colors = DEPT_COLORS[department] ?? DEPT_COLORS.physical_dept

  return (
    <Card className={`${colors.border} overflow-hidden`}>
      <div className={`${colors.headerBg} border-b ${colors.border} px-5 py-3`}>
        <h3 className={`text-sm font-bold ${colors.text}`}>
          {DEPT_LABELS[department] ?? department}
        </h3>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {services.length} service{services.length !== 1 ? 's' : ''} across{' '}
          {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
        </p>
      </div>
      <CardContent className="p-0">
        {categories.map((cat) => {
          const catServices = services.filter((s) => s.categoryId === cat.id)
          if (catServices.length === 0) return null
          return (
            <div
              key={cat.id}
              className="border-border/30 border-b last:border-b-0"
            >
              <div className="bg-muted/30 flex items-center justify-between px-5 py-2">
                <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  {cat.name}
                </span>
                <span className="text-muted-foreground text-[11px]">
                  {catServices.length} service
                  {catServices.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="divide-border/20 divide-y">
                {catServices.map((svc) => (
                  <div
                    key={svc.id}
                    className="flex items-center gap-4 px-5 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{svc.name}</p>
                      {svc.description && (
                        <p className="text-muted-foreground truncate text-[11px]">
                          {svc.description}
                        </p>
                      )}
                    </div>
                    <span className="text-muted-foreground shrink-0 text-sm font-semibold tabular-nums">
                      {formatCurrency(svc.basePrice)}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <ServiceFormDialog
                        service={svc}
                        categories={categories}
                        open={editingId === svc.id}
                        onOpenChange={(o) => setEditingId(o ? svc.id : null)}
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditingId(svc.id)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <DeleteDialog
                        label={svc.name}
                        onConfirm={() => deleteMutation.mutate(svc.id)}
                        isPending={deleteMutation.isPending}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function ServicesPanel({
  services,
  categories,
  isLoading,
}: {
  services: CatalogService[]
  categories: CatalogCategory[]
  isLoading: boolean
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState('')

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  const filtered = search
    ? services.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : services

  const catMap = new Map(categories.map((c) => [c.id, c]))
  const grouped = DEPT_ORDER.map((dept) => ({
    department: dept,
    categories: categories.filter((c) => c.department === dept),
    services: filtered.filter((s) => {
      const cat = catMap.get(s.categoryId)
      return cat?.department === dept
    }),
  })).filter((g) => g.services.length > 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            className="h-8 pl-8 text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <p className="text-muted-foreground text-sm whitespace-nowrap">
            {filtered.length} {search ? 'found' : `service${filtered.length !== 1 ? 's' : ''}`}
          </p>
          <ServiceFormDialog
            categories={categories}
            open={addOpen}
            onOpenChange={setAddOpen}
          />
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Service
          </Button>
        </div>
      </div>

      {grouped.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          {search ? 'No services match your search.' : 'No services yet. Add your first service to get started.'}
        </p>
      ) : (
        grouped.map((g) => (
          <DepartmentServiceSection
            key={g.department}
            department={g.department}
            categories={g.categories}
            services={g.services}
          />
        ))
      )}
    </div>
  )
}

// ─── Materials Tab ────────────────────────────────────────────────────────────

function MaterialFormDialog({
  material,
  services,
  serviceMaterialLinks,
  trigger,
}: {
  material?: CatalogMaterial
  services: CatalogService[]
  serviceMaterialLinks: { serviceId: string; inventoryItemId: string }[]
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(material?.name ?? '')
  const [unit, setUnit] = useState(material?.unit ?? '')
  const [costPerUnit, setCostPerUnit] = useState(
    material?.costPerUnit?.toString() ?? ''
  )
  const [stockOnHand, setStockOnHand] = useState(
    material?.stockOnHand?.toString() ?? ''
  )
  const [linkedServiceIds, setLinkedServiceIds] = useState<string[]>([])
  const [serviceSearch, setServiceSearch] = useState('')

  const createMutation = useCreateMaterial()
  const updateMutation = useUpdateMaterial()
  const linkMutation = useSetMaterialServices()
  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    linkMutation.isPending
  const isEdit = !!material

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    const price = parseFloat(costPerUnit) || 0
    const stock = parseInt(stockOnHand, 10) || 0

    function afterSave(itemId: string) {
      linkMutation.mutate(
        { inventoryItemId: itemId, serviceIds: linkedServiceIds },
        { onSuccess: () => setOpen(false) }
      )
    }

    if (isEdit) {
      updateMutation.mutate(
        {
          id: material.id,
          data: {
            name: name.trim(),
            unit: unit.trim(),
            costPerUnit: price,
            stockOnHand: stock,
          },
        },
        { onSuccess: () => afterSave(material.id) }
      )
    } else {
      createMutation.mutate(
        {
          name: name.trim(),
          unit: unit.trim(),
          costPerUnit: price,
          stockOnHand: stock,
        },
        {
          onSuccess: (itemId) => {
            setName('')
            setUnit('')
            setCostPerUnit('')
            setStockOnHand('')
            setLinkedServiceIds([])
            afterSave(itemId)
          },
        }
      )
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) {
      if (material) {
        setName(material.name)
        setUnit(material.unit)
        setCostPerUnit(material.costPerUnit.toString())
        setStockOnHand(material.stockOnHand.toString())
        setLinkedServiceIds(
          serviceMaterialLinks
            .filter((l) => l.inventoryItemId === material.id)
            .map((l) => l.serviceId)
        )
      } else {
        setName('')
        setUnit('')
        setCostPerUnit('')
        setStockOnHand('')
        setLinkedServiceIds([])
      }
    }
  }

  function toggleService(id: string) {
    setLinkedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogPopup>
        <DialogTitle>{isEdit ? 'Edit Material' : 'Add Material'}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? 'Update the material details and linked services.'
            : 'Add a new material and link it to services.'}
        </DialogDescription>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Name
            </span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Material name"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Unit
            </span>
            <Input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. pcs, ml, roll"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Cost Price (₱)
            </span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={costPerUnit}
              onChange={(e) => setCostPerUnit(e.target.value)}
              placeholder="0.00"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Stock on Hand
            </span>
            <Input
              type="number"
              min="0"
              step="1"
              value={stockOnHand}
              onChange={(e) => setStockOnHand(e.target.value)}
              placeholder="0"
              required
            />
          </label>

          {services.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs font-medium">
                Link to Services
              </span>
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
                <Input
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  placeholder="Search services..."
                  className="h-7 pl-8 text-xs"
                />
              </div>
              <div className="border-border/50 divide-border/20 max-h-40 divide-y overflow-y-auto rounded-lg border">
                {services
                  .filter(
                    (svc) =>
                      !serviceSearch ||
                      svc.name
                        .toLowerCase()
                        .includes(serviceSearch.toLowerCase())
                  )
                  .map((svc) => (
                    <label
                      key={svc.id}
                      className="hover:bg-muted/30 flex cursor-pointer items-center gap-2.5 px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={linkedServiceIds.includes(svc.id)}
                        onChange={() => toggleService(svc.id)}
                        className="accent-brand h-3.5 w-3.5"
                      />
                      <span className="text-sm">{svc.name}</span>
                    </label>
                  ))}
              </div>
              <span className="text-muted-foreground text-[11px]">
                {linkedServiceIds.length} service
                {linkedServiceIds.length !== 1 ? 's' : ''} linked
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <DialogClose render={<Button variant="ghost" size="sm" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !name.trim()}
            >
              {isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  )
}

function MaterialsPanel({
  materials,
  services,
  serviceMaterialLinks,
  isLoading,
}: {
  materials: CatalogMaterial[]
  services: CatalogService[]
  serviceMaterialLinks: { serviceId: string; inventoryItemId: string }[]
  isLoading: boolean
}) {
  const deleteMutation = useDeleteMaterial()
  const [search, setSearch] = useState('')

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  const filtered = search
    ? materials.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    : materials

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="text-brand h-4 w-4" />
            Materials
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search materials..."
                className="h-8 w-48 pl-8 text-sm"
              />
            </div>
            <p className="text-muted-foreground text-sm whitespace-nowrap">
              {filtered.length} {search ? 'found' : `material${filtered.length !== 1 ? 's' : ''}`}
            </p>
            <MaterialFormDialog
              services={services}
              serviceMaterialLinks={serviceMaterialLinks}
              trigger={
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Add Material
                </Button>
              }
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            {search ? 'No materials match your search.' : 'No materials yet. Add your first material or inventory item.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border/50 text-muted-foreground border-b text-left text-xs">
                  <th className="pr-4 pb-2 font-medium">Name</th>
                  <th className="pr-4 pb-2 font-medium">Unit</th>
                  <th className="pr-4 pb-2 font-medium">Cost Price</th>
                  <th className="pr-4 pb-2 font-medium">Stock</th>
                  <th className="pr-4 pb-2 font-medium">Status</th>
                  <th className="pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-border/30 divide-y">
                {filtered.map((mat) => (
                  <tr key={mat.id}>
                    <td className="py-2.5 pr-4 font-medium">{mat.name}</td>
                    <td className="text-muted-foreground py-2.5 pr-4">
                      {mat.unit || '—'}
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums">
                      {formatCurrency(mat.costPerUnit)}
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums">
                      {mat.stockOnHand}
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge
                        variant="outline"
                        className={
                          mat.isActive
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                            : 'border-border text-muted-foreground'
                        }
                      >
                        {mat.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <MaterialFormDialog
                          material={mat}
                          services={services}
                          serviceMaterialLinks={serviceMaterialLinks}
                          trigger={
                            <Button variant="ghost" size="icon-sm">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                        <DeleteDialog
                          label={mat.name}
                          onConfirm={() => deleteMutation.mutate(mat.id)}
                          isPending={deleteMutation.isPending}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function ServicesPage() {
  const { data, isLoading } = useCatalog()

  const categories = data?.categories ?? []
  const services = data?.services ?? []
  const materials = data?.materials ?? []
  const serviceMaterialLinks = data?.serviceMaterialLinks ?? []

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Services</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your service catalog, categories, and inventory materials.
        </p>
      </div>

      <Tabs defaultValue="categories">
        <TabsList variant="line">
          <TabsTrigger value="categories">
            <Tags className="h-3.5 w-3.5" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="services">
            <Wrench className="h-3.5 w-3.5" />
            Services
          </TabsTrigger>
          <TabsTrigger value="materials">
            <Package className="h-3.5 w-3.5" />
            Materials
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-4">
          <CategoriesPanel categories={categories} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="services" className="mt-4">
          <ServicesPanel
            services={services}
            categories={categories}
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="materials" className="mt-4">
          <MaterialsPanel
            materials={materials}
            services={services}
            serviceMaterialLinks={serviceMaterialLinks}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
