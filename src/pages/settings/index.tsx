import {
  Building2,
  Percent,
  UserPlus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Loader2,
  Users,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/shared/hooks/use-auth'
import { useSettingsStore } from '@/stores/settings-store'
import {
  useMarginThresholds,
  useUpdateMarginThresholds,
} from '@/shared/hooks/use-costing'
import { useState, useEffect, memo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPosUsers,
  createPosUser,
  updatePosUser,
  deletePosUser,
  type PosUser,
} from '@/shared/api/pos-users'
import { toast } from 'sonner'

const DEPT_LABELS: Record<string, string> = {
  physical_dept: 'Physical',
  design_dept: 'Design',
  dev_dept: 'Development',
}

const DEPT_COLORS: Record<string, string> = {
  physical_dept: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  design_dept: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
  dev_dept: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
}

const DEPT_OPTIONS = [
  { value: '', label: 'None (All departments)' },
  { value: 'physical_dept', label: 'Physical' },
  { value: 'design_dept', label: 'Design' },
  { value: 'dev_dept', label: 'Development' },
]

export function SettingsDialog() {
  const { role, department, displayName } = useAuth()
  const { open, closeSettings } = useSettingsStore()

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) closeSettings() }}>
      <DialogPopup className="flex max-h-[85vh] w-full max-w-3xl flex-col p-0">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
          <div>
            <DialogTitle className="text-lg font-semibold">Settings</DialogTitle>
            <DialogDescription className="mt-0.5 text-sm text-muted-foreground">
              Manage your POS preferences and configuration.
            </DialogDescription>
          </div>
          <DialogClose className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted">
            <X className="h-4 w-4" />
          </DialogClose>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
              {/* Account info */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="text-brand h-4 w-4" />
                    Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Name</span>
                    <span className="text-sm font-medium">{displayName ?? '—'}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Role</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {role ?? '—'}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Department</span>
                    {department ? (
                      <Badge
                        variant="outline"
                        className={`text-xs ${DEPT_COLORS[department] ?? ''}`}
                      >
                        {DEPT_LABELS[department] ?? department}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        All departments
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Margin Thresholds (owner only) */}
              {role === 'owner' && <MarginThresholdsCard />}

              {/* Staff Management (owner only) */}
              {role === 'owner' && <StaffManagementCard />}
            </div>
          </div>
      </DialogPopup>
    </Dialog>
  )
}

// ─── Margin Thresholds ────────────────────────────────────────────────────────

function MarginThresholdsCard() {
  const { data: thresholds, isLoading } = useMarginThresholds()
  const updateMutation = useUpdateMarginThresholds()
  const [great, setGreat] = useState('')
  const [good, setGood] = useState('')

  useEffect(() => {
    if (thresholds) {
      setGreat(thresholds.great.toString())
      setGood(thresholds.good.toString())
    }
  }, [thresholds])

  function handleSave() {
    const greatVal = parseFloat(great) || 0
    const goodVal = parseFloat(good) || 0
    updateMutation.mutate({ great: greatVal, good: goodVal })
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Percent className="text-brand h-4 w-4" />
          Margin Thresholds
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-xs">
          Configure the profit margin thresholds used by the Costing page to
          classify profiles as Great, Good, or OK.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Great (%)
            </span>
            <Input
              type="number"
              min="0"
              max="100"
              step="1"
              value={great}
              onChange={(e) => setGreat(e.target.value)}
              placeholder="60"
              disabled={isLoading}
            />
            <span className="text-muted-foreground text-[11px]">
              Margin at or above this is "Great"
            </span>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Good (%)
            </span>
            <Input
              type="number"
              min="0"
              max="100"
              step="1"
              value={good}
              onChange={(e) => setGood(e.target.value)}
              placeholder="40"
              disabled={isLoading}
            />
            <span className="text-muted-foreground text-[11px]">
              Margin at or above this is "Good"
            </span>
          </label>
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Thresholds'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Staff Management ─────────────────────────────────────────────────────────

interface UserFormData {
  email: string
  name: string
  role: 'owner' | 'staff'
  department: string
}

const EMPTY_FORM: UserFormData = {
  email: '',
  name: '',
  role: 'staff',
  department: '',
}

function StaffManagementCard() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['pos-users'],
    queryFn: getPosUsers,
  })

  const [addOpen, setAddOpen] = useState(false)

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="text-brand h-4 w-4" />
            Staff Management
            {users && users.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {users.length}
              </Badge>
            )}
          </CardTitle>
          <UserFormDialog
            mode="create"
            open={addOpen}
            onOpenChange={setAddOpen}
            trigger={
              <Button size="sm" className="gap-1.5">
                <UserPlus className="h-3.5 w-3.5" />
                Add User
              </Button>
            }
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        ) : (users ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Users className="text-muted-foreground/30 h-8 w-8" />
            <p className="text-muted-foreground/60 mt-2 text-sm font-medium">
              No users found
            </p>
          </div>
        ) : (
          <div className="divide-border/40 space-y-0 divide-y">
            {(users ?? []).map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const UserRow = memo(function UserRow({ user }: { user: PosUser }) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  return (
    <>
      <div className="transition-default hover:bg-muted/30 -mx-2 flex items-center justify-between rounded-lg px-2 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">
              {user.name || user.email}
            </p>
            <Badge
              variant="outline"
              className={`text-[10px] capitalize ${
                user.role === 'owner'
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                  : ''
              }`}
            >
              {user.role}
            </Badge>
            {user.department && (
              <Badge
                variant="outline"
                className={`text-[10px] ${DEPT_COLORS[user.department] ?? ''}`}
              >
                {DEPT_LABELS[user.department]}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-0.5 truncate text-xs">
            {user.email}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="hover:bg-muted inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors focus:outline-none">
            <MoreHorizontal className="text-muted-foreground h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4}>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                setEditOpen(true)
              }}
            >
              <Pencil className="h-4 w-4" />
              Edit User
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault()
                setDeleteOpen(true)
              }}
            >
              <Trash2 className="h-4 w-4" />
              Remove User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <UserFormDialog
        mode="edit"
        user={user}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteUserDialog
        user={user}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  )
})

function UserFormDialog({
  mode,
  user,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  mode: 'create' | 'edit'
  user?: PosUser
  trigger?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen
  const [form, setForm] = useState<UserFormData>(
    user
      ? {
          email: user.email,
          name: user.name ?? '',
          role: user.role,
          department: user.department ?? '',
        }
      : EMPTY_FORM
  )

  const createMutation = useMutation({
    mutationFn: () =>
      createPosUser({
        email: form.email,
        name: form.name || undefined,
        role: form.role,
        department: form.department
          ? (form.department as PosUser['department'])
          : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-users'] })
      toast.success('User created')
      setOpen(false)
      setForm(EMPTY_FORM)
    },
    onError: (err) => {
      toast.error('Failed to create user', {
        description:
          err instanceof Error ? err.message : 'Something went wrong',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      updatePosUser(user!.id, {
        name: form.name,
        role: form.role,
        department: form.department
          ? (form.department as PosUser['department'])
          : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-users'] })
      toast.success('User updated')
      setOpen(false)
    },
    onError: (err) => {
      toast.error('Failed to update user', {
        description:
          err instanceof Error ? err.message : 'Something went wrong',
      })
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  function handleSubmit() {
    if (!form.email.trim()) {
      toast.error('Email is required')
      return
    }
    if (mode === 'create') {
      createMutation.mutate()
    } else {
      updateMutation.mutate()
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen && user) {
      setForm({
        email: user.email,
        name: user.name ?? '',
        role: user.role,
        department: user.department ?? '',
      })
    } else if (!nextOpen && mode === 'create') {
      setForm(EMPTY_FORM)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogPopup className="z-[60]">
        <DialogTitle>
          {mode === 'create' ? 'Add User' : 'Edit User'}
        </DialogTitle>
          <DialogDescription className="mt-1.5">
            {mode === 'create'
              ? 'Grant POS access to a new user by their Google email.'
              : `Update permissions for ${user?.email}.`}
          </DialogDescription>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-muted-foreground mb-1 block text-xs font-medium">
                Email (Google account)
              </label>
              <Input
                placeholder="user@gmail.com"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                disabled={mode === 'edit'}
                autoFocus={mode === 'create'}
              />
            </div>
            <div>
              <label className="text-muted-foreground mb-1 block text-xs font-medium">
                Display Name
              </label>
              <Input
                placeholder="e.g. Juan"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus={mode === 'edit'}
              />
            </div>
            <div>
              <label className="text-muted-foreground mb-1 block text-xs font-medium">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    role: e.target.value as 'owner' | 'staff',
                    department: e.target.value === 'owner' ? '' : f.department,
                  }))
                }
                className="border-border bg-background transition-default focus:border-ring focus:ring-ring/30 h-10 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
              >
                <option value="staff">Staff</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            {form.role === 'staff' && (
              <div>
                <label className="text-muted-foreground mb-1 block text-xs font-medium">
                  Department
                </label>
                <select
                  value={form.department}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, department: e.target.value }))
                  }
                  className="border-border bg-background transition-default focus:border-ring focus:ring-ring/30 h-10 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
                >
                  {DEPT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <DialogClose className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors">
              Cancel
            </DialogClose>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="gap-1.5"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Add User' : 'Save Changes'}
            </Button>
          </div>
      </DialogPopup>
    </Dialog>
  )
}

function DeleteUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: PosUser
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const deleteMutation = useMutation({
    mutationFn: () => deletePosUser(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-users'] })
      toast.success('User removed')
      onOpenChange(false)
    },
    onError: (err) => {
      toast.error('Failed to remove user', {
        description:
          err instanceof Error ? err.message : 'Something went wrong',
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="z-[60]">
        <DialogTitle>Remove User</DialogTitle>
          <DialogDescription className="mt-1.5">
            Are you sure you want to remove{' '}
            <span className="text-foreground font-medium">{user.email}</span>?
            They will lose all POS access immediately.
          </DialogDescription>
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors">
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="gap-1.5"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Remove
            </Button>
          </div>
      </DialogPopup>
    </Dialog>
  )
}
