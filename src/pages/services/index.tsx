import { useState } from 'react'
import { Tags, Wrench, Package, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
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
  sellingPrice: number
  stockOnHand: number
  isActive: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const DEPARTMENT_MAP: Record<string, string> = {
  physical_dept: 'Physical',
  design_dept: 'Design',
  dev_dept: 'Dev',
}

function getDepartmentBadgeClass(dept: string): string {
  switch (dept) {
    case 'physical_dept':
      return 'border-blue-500/30 bg-blue-500/10 text-blue-400'
    case 'design_dept':
      return 'border-violet-500/30 bg-violet-500/10 text-violet-400'
    case 'dev_dept':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-400'
    default:
      return 'border-border text-muted-foreground'
  }
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
          Are you sure you want to delete "{label}"? This action cannot be undone.
        </DialogDescription>
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-muted-foreground">
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
  const [department, setDepartment] = useState(category?.department ?? 'physical_dept')
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
        { id: category.id, data: { name: name.trim(), department, icon: icon.trim() } },
        { onSuccess: () => setOpen(false) },
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
        },
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
          {isEdit ? 'Update the category details.' : 'Create a new service category.'}
        </DialogDescription>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Name</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Department</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="physical_dept">Physical</option>
              <option value="design_dept">Design</option>
              <option value="dev_dept">Dev</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Icon (lucide name)</span>
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
            <Button size="sm" disabled={isPending || !name.trim()}>
              {isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  )
}

function CategoriesPanel({
  categories,
  isLoading,
}: {
  categories: CatalogCategory[]
  isLoading: boolean
}) {
  const deleteMutation = useDeleteCategory()

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Tags className="h-4 w-4 text-brand" />
            Categories
          </CardTitle>
          <CategoryFormDialog
            trigger={
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add Category
              </Button>
            }
          />
        </div>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No categories yet. Add your first category to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Department</th>
                  <th className="pb-2 pr-4 font-medium">Icon</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td className="py-2.5 pr-4 font-medium">{cat.name}</td>
                    <td className="py-2.5 pr-4">
                      <Badge
                        variant="outline"
                        className={getDepartmentBadgeClass(cat.department)}
                      >
                        {DEPARTMENT_MAP[cat.department] ?? cat.department}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{cat.icon || '—'}</td>
                    <td className="py-2.5 pr-4">
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
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center justify-end gap-1">
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

// ─── Services Tab ─────────────────────────────────────────────────────────────

function ServiceFormDialog({
  service,
  categories,
  trigger,
}: {
  service?: CatalogService
  categories: CatalogCategory[]
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(service?.name ?? '')
  const [categoryId, setCategoryId] = useState(service?.categoryId ?? '')
  const [description, setDescription] = useState(service?.description ?? '')
  const [basePrice, setBasePrice] = useState(service?.basePrice?.toString() ?? '')
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
        { onSuccess: () => setOpen(false) },
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
            setOpen(false)
          },
        },
      )
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
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
      <DialogTrigger render={trigger} />
      <DialogPopup>
        <DialogTitle>{isEdit ? 'Edit Service' : 'Add Service'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Update the service details.' : 'Add a new service to your catalog.'}
        </DialogDescription>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Name</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Service name"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Category</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
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
            <span className="text-xs font-medium text-muted-foreground">Description</span>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Base Price (₱)</span>
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
            <span className="text-xs font-medium text-muted-foreground">Icon (lucide name)</span>
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
            <Button size="sm" disabled={isPending || !name.trim() || !categoryId}>
              {isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
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
  const deleteMutation = useDeleteService()

  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-4 w-4 text-brand" />
            Services
          </CardTitle>
          <ServiceFormDialog
            categories={categories}
            trigger={
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add Service
              </Button>
            }
          />
        </div>
      </CardHeader>
      <CardContent>
        {services.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No services yet. Add your first service to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Category</th>
                  <th className="pb-2 pr-4 font-medium">Base Price</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {services.map((svc) => {
                  const cat = categoryMap.get(svc.categoryId)
                  return (
                    <tr key={svc.id}>
                      <td className="py-2.5 pr-4 font-medium">{svc.name}</td>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-1.5">
                          {cat && (
                            <Badge
                              variant="outline"
                              className={getDepartmentBadgeClass(cat.department)}
                            >
                              {DEPARTMENT_MAP[cat.department] ?? cat.department}
                            </Badge>
                          )}
                          <span className="text-muted-foreground">{cat?.name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums">{formatCurrency(svc.basePrice)}</td>
                      <td className="py-2.5 pr-4">
                        <Badge
                          variant="outline"
                          className={
                            svc.isActive
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                              : 'border-border text-muted-foreground'
                          }
                        >
                          {svc.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <ServiceFormDialog
                            service={svc}
                            categories={categories}
                            trigger={
                              <Button variant="ghost" size="icon-sm">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            }
                          />
                          <DeleteDialog
                            label={svc.name}
                            onConfirm={() => deleteMutation.mutate(svc.id)}
                            isPending={deleteMutation.isPending}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Materials Tab ────────────────────────────────────────────────────────────

function MaterialFormDialog({
  material,
  trigger,
}: {
  material?: CatalogMaterial
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(material?.name ?? '')
  const [unit, setUnit] = useState(material?.unit ?? '')
  const [sellingPrice, setSellingPrice] = useState(material?.sellingPrice?.toString() ?? '')
  const [stockOnHand, setStockOnHand] = useState(material?.stockOnHand?.toString() ?? '')

  const createMutation = useCreateMaterial()
  const updateMutation = useUpdateMaterial()
  const isPending = createMutation.isPending || updateMutation.isPending
  const isEdit = !!material

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    const price = parseFloat(sellingPrice) || 0
    const stock = parseInt(stockOnHand, 10) || 0

    if (isEdit) {
      updateMutation.mutate(
        {
          id: material.id,
          data: {
            name: name.trim(),
            unit: unit.trim(),
            sellingPrice: price,
            stockOnHand: stock,
          },
        },
        { onSuccess: () => setOpen(false) },
      )
    } else {
      createMutation.mutate(
        {
          name: name.trim(),
          unit: unit.trim(),
          sellingPrice: price,
          stockOnHand: stock,
        },
        {
          onSuccess: () => {
            setName('')
            setUnit('')
            setSellingPrice('')
            setStockOnHand('')
            setOpen(false)
          },
        },
      )
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen && material) {
      setName(material.name)
      setUnit(material.unit)
      setSellingPrice(material.sellingPrice.toString())
      setStockOnHand(material.stockOnHand.toString())
    } else if (!nextOpen && !isEdit) {
      setName('')
      setUnit('')
      setSellingPrice('')
      setStockOnHand('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogPopup>
        <DialogTitle>{isEdit ? 'Edit Material' : 'Add Material'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Update the material details.' : 'Add a new material or inventory item.'}
        </DialogDescription>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Name</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Material name"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Unit</span>
            <Input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. pcs, ml, roll"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Selling Price (₱)</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              placeholder="0.00"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Stock on Hand</span>
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
          <div className="flex items-center justify-end gap-2 pt-2">
            <DialogClose render={<Button variant="ghost" size="sm" />}>
              Cancel
            </DialogClose>
            <Button size="sm" disabled={isPending || !name.trim()}>
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
  isLoading,
}: {
  materials: CatalogMaterial[]
  isLoading: boolean
}) {
  const deleteMutation = useDeleteMaterial()

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-brand" />
            Materials
          </CardTitle>
          <MaterialFormDialog
            trigger={
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add Material
              </Button>
            }
          />
        </div>
      </CardHeader>
      <CardContent>
        {materials.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No materials yet. Add your first material or inventory item.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Unit</th>
                  <th className="pb-2 pr-4 font-medium">Selling Price</th>
                  <th className="pb-2 pr-4 font-medium">Stock</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {materials.map((mat) => (
                  <tr key={mat.id}>
                    <td className="py-2.5 pr-4 font-medium">{mat.name}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{mat.unit || '—'}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{formatCurrency(mat.sellingPrice)}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{mat.stockOnHand}</td>
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

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Services</h1>
        <p className="mt-1 text-sm text-muted-foreground">
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
          <MaterialsPanel materials={materials} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
