import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Clock,
  Users,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/new-sale', label: 'New Sale', icon: ShoppingCart },
  { to: '/drafts', label: 'Drafts', icon: FileText },
  { to: '/history', label: 'History', icon: Clock },
  { to: '/staff', label: 'Staff Shifts', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-sidebar">
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
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-default',
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

      {/* Footer */}
      <div className="border-t border-border px-4 py-3">
        <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          Beyond Ink POS v1.0
        </p>
      </div>
    </aside>
  )
}
