import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPosUsers,
  createPosUser,
  updatePosUser,
  deletePosUser,
  type PosUser,
} from '@/shared/api/pos-users'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  UserPlus,
  Pencil,
  Trash2,
  Shield,
  Building2,
  Loader2,
  MoreHorizontal,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const DEPT_OPTIONS = [
  { value: '', label: 'None (All departments)' },
  { value: 'physical_dept', label: 'Physical' },
  { value: 'design_dept', label: 'Design' },
  { value: 'dev_dept', label: 'Development' },
]

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

function UserFormDialog({
  mode,
  user,
  trigger,
}: {
  mode: 'create' | 'edit'
  user?: PosUser
  trigger: React.ReactNode
}) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<UserFormData>(
    user
      ? {
          email: user.email,
          name: user.name ?? '',
          role: user.role,
          department: user.department ?? '',
        }
      : EMPTY_FORM,
  )

  const createMutation = useMutation({
    mutationFn: () =>
      createPosUser({
        email: form.email,
        name: form.name || undefined,
        role: form.role,
        department: form.department ? (form.department as PosUser['department']) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-users'] })
      toast.success('User created')
      setOpen(false)
      setForm(EMPTY_FORM)
    },
    onError: (err) => {
      toast.error('Failed to create user', {
        description: err instanceof Error ? err.message : 'Something went wrong',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      updatePosUser(user!.id, {
        name: form.name,
        role: form.role,
        department: form.department ? (form.department as PosUser['department']) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-users'] })
      toast.success('User updated')
      setOpen(false)
    },
    onError: (err) => {
      toast.error('Failed to update user', {
        description: err instanceof Error ? err.message : 'Something went wrong',
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
      <DialogTrigger render={trigger} />
      <DialogPopup>
        <DialogTitle>{mode === 'create' ? 'Add User' : 'Edit User'}</DialogTitle>
        <DialogDescription className="mt-1.5">
          {mode === 'create'
            ? 'Grant POS access to a new user by their Google email.'
            : `Update permissions for ${user?.email}.`}
        </DialogDescription>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Email (Google account)
            </label>
            <Input
              placeholder="user@gmail.com"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              disabled={mode === 'edit'}
              autoFocus={mode === 'create'}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
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
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
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
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm transition-default focus:border-ring focus:ring-2 focus:ring-ring/30 focus:outline-none"
            >
              <option value="staff">Staff</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          {form.role === 'staff' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Department
              </label>
              <select
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm transition-default focus:border-ring focus:ring-2 focus:ring-ring/30 focus:outline-none"
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
          <DialogClose
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Cancel
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isPending} className="gap-1.5">
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
        description: err instanceof Error ? err.message : 'Something went wrong',
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogTitle>Remove User</DialogTitle>
        <DialogDescription className="mt-1.5">
          Are you sure you want to remove{' '}
          <span className="font-medium text-foreground">{user.email}</span>? They
          will lose all POS access immediately.
        </DialogDescription>
        <div className="mt-5 flex justify-end gap-2">
          <DialogClose
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
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

function UserRow({ user }: { user: PosUser }) {
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between py-3.5 transition-default hover:bg-muted/30 px-2 -mx-2 rounded-lg">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate">
              {user.name || user.email}
            </p>
            <Badge
              variant="outline"
              className={`text-[10px] capitalize ${
                user.role === 'owner'
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
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
          <p className="mt-0.5 text-xs text-muted-foreground truncate">
            {user.email}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted focus:outline-none"
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4}>
            <UserFormDialog
              mode="edit"
              user={user}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Pencil className="h-4 w-4" />
                  Edit User
                </DropdownMenuItem>
              }
            />
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

      <DeleteUserDialog user={user} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  )
}

export function StaffsPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['pos-users'],
    queryFn: getPosUsers,
  })

  const ownerCount = (users ?? []).filter((u) => u.role === 'owner').length
  const staffCount = (users ?? []).filter((u) => u.role === 'staff').length

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staffs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage POS user accounts and permissions.
          </p>
        </div>
        <UserFormDialog
          mode="create"
          trigger={
            <Button className="gap-1.5">
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          }
        />
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-foreground">
              {(users ?? []).length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-amber-400">{ownerCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Owners</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-blue-400">{staffCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Staff</p>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-brand" />
            All Users
            {users && users.length > 0 && (
              <Badge variant="secondary" className="ml-auto text-[10px]">
                {users.length}
              </Badge>
            )}
          </CardTitle>
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
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm font-medium text-muted-foreground/60">
                No users found
              </p>
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-border/40">
              {(users ?? []).map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
