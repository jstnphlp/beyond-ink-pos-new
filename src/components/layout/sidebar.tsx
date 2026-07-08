import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Clock,
  Users,
  Settings,
  LogOut,
  Wallet,
  ChartPie,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/shared/hooks/use-auth'
import { Button } from '@/components/ui/button'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: ('owner' | 'staff')[]
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['owner'] },
  { to: '/new-sale', label: 'New Sale', icon: ShoppingCart, roles: ['owner', 'staff'] },
  { to: '/drafts', label: 'Drafts', icon: FileText, roles: ['owner', 'staff'] },
  { to: '/history', label: 'History', icon: Clock, roles: ['owner', 'staff'] },
  { to: '/wallet', label: 'Wallet', icon: Wallet, roles: ['owner'] },
  { to: '/distributions', label: 'Distributions', icon: ChartPie, roles: ['owner'] },
  { to: '/staff', label: 'Staff Shifts', icon: Users, roles: ['owner', 'staff'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['owner'] },
]

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { role, displayName, signOut } = useAuth()

  const visibleItems = NAV_ITEMS.filter(
    (item) => role && item.roles.includes(role)
  )

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
          <span className="text-xs font-black tracking-tight text-background">
            b.
          </span>
        </div>
        <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
          beyond<span className="text-brand">.</span>ink
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-default',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 h-6 w-[3px] rounded-r-full bg-brand" />
                )}
                <item.icon
                  className={cn(
                    'h-4.5 w-4.5 shrink-0 transition-colors',
                    isActive ? 'text-brand' : 'text-muted-foreground group-hover:text-sidebar-foreground'
                  )}
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Sign out */}
      <div className="border-t border-border px-4 py-3 space-y-2">
        <p className="truncate text-xs font-medium text-foreground">
          {displayName}
        </p>
        <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          {role === 'owner' ? 'Owner' : 'Staff'}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
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
