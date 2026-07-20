import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Clock,
  Users,
  LogOut,
  Wallet,
  ChartPie,
  Wrench,
  DollarSign,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/shared/hooks/use-auth'
import { Button } from '@/components/ui/button'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: ('owner' | 'staff')[]
  departments?: string[]
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['owner'],
  },
  {
    to: '/new-sale',
    label: 'New Sale',
    icon: ShoppingCart,
    roles: ['owner', 'staff'],
  },
  { to: '/drafts', label: 'Drafts', icon: FileText, roles: ['owner', 'staff'] },
  { to: '/history', label: 'History', icon: Clock, roles: ['owner', 'staff'] },
  { to: '/wallet', label: 'Wallet', icon: Wallet, roles: ['owner'] },
  {
    to: '/distributions',
    label: 'Distributions',
    icon: ChartPie,
    roles: ['owner'],
  },
  { to: '/services', label: 'Services', icon: Wrench, roles: ['owner'] },
  {
    to: '/costing',
    label: 'Costing',
    icon: DollarSign,
    roles: ['owner', 'staff'],
    departments: ['physical_dept'],
  },
  {
    to: '/staff',
    label: 'Staff Shifts',
    icon: Users,
    roles: ['owner', 'staff'],
  },
  { to: '/trash', label: 'Trash', icon: Trash2, roles: ['owner'] },
]

const DEPT_LABELS: Record<string, string> = {
  physical_dept: 'Physical',
  design_dept: 'Design',
  dev_dept: 'Development',
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { role, department, displayName, signOut } = useAuth()

  const visibleItems = NAV_ITEMS.filter(
    (item) =>
      role &&
      item.roles.includes(role) &&
      (!item.departments ||
        !department ||
        role === 'owner' ||
        item.departments.includes(department))
  )

  return (
    <div className="border-border bg-sidebar flex h-full w-64 flex-col border-r">
      {/* Logo */}
      <div className="border-border flex h-16 items-center gap-2 border-b px-6">
        <div className="bg-foreground flex h-8 w-8 items-center justify-center rounded-lg">
          <span className="text-background text-xs font-black tracking-tight">
            b.
          </span>
        </div>
        <span className="text-sidebar-foreground text-lg font-bold tracking-tight">
          beyond<span className="text-brand">.</span>ink
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group transition-default relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="bg-brand absolute left-0 h-6 w-[3px] rounded-r-full" />
                )}
                <item.icon
                  className={cn(
                    'h-4.5 w-4.5 shrink-0 transition-colors',
                    isActive
                      ? 'text-brand'
                      : 'text-muted-foreground group-hover:text-sidebar-foreground'
                  )}
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Sign out */}
      <div className="border-border space-y-2 border-t px-4 py-3">
        <p className="text-foreground truncate text-xs font-medium">
          {displayName}
        </p>
        <p className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
          {role === 'owner'
            ? 'Owner'
            : department
              ? (DEPT_LABELS[department] ?? 'Staff')
              : 'Staff'}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="text-muted-foreground hover:text-foreground w-full justify-start gap-2"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="text-xs">Sign out</span>
        </Button>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 md:block">
      <SidebarContent />
    </aside>
  )
}
