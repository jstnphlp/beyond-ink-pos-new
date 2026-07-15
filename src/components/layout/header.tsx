import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, Clock, Menu } from 'lucide-react'
import { useActiveSessions } from '@/shared/hooks/use-staff'
import { useAuth } from '@/shared/hooks/use-auth'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { SidebarContent } from './sidebar'
import { useIsMobile } from '@/shared/hooks/use-is-mobile'

const DEPARTMENT_COLORS: Record<string, string> = {
  Physical:
    'bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/20',
  Design:
    'bg-purple-500/15 text-purple-400 border-purple-500/30 hover:bg-purple-500/20',
  Dev: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
  physical_dept:
    'bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/20',
  design_dept:
    'bg-purple-500/15 text-purple-400 border-purple-500/30 hover:bg-purple-500/20',
  dev_dept:
    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
  owner:
    'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/20',
}

const DEPT_DISPLAY: Record<string, string> = {
  physical_dept: 'Physical',
  design_dept: 'Design',
  dev_dept: 'Development',
}

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])
  return now
}

export function Header() {
  const now = useClock()
  const { data: activeSessions } = useActiveSessions()
  const { displayName, role, department } = useAuth()
  const isMobile = useIsMobile()
  const [sheetOpen, setSheetOpen] = useState(false)

  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const activeNames = (activeSessions ?? []).map((s) => s.staffName)
  const initials = displayName
    ? displayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '—'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
      {/* Left — burger menu on mobile */}
      <div>
        {isMobile && (
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-muted"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent onNavigate={() => setSheetOpen(false)} />
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Right — user info + clock */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Clock */}
        <div className="hidden items-center gap-4 md:flex">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{dateStr}</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-sm font-semibold text-foreground tabular-nums">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            {timeStr}
          </div>
        </div>

        {/* Separator */}
        <div className="hidden h-6 w-px bg-border md:block" />

        {/* Department badge */}
        <Badge
          variant="outline"
          className={`border ${
            role === 'owner'
              ? DEPARTMENT_COLORS['owner']
              : DEPARTMENT_COLORS[department ?? 'physical_dept'] ?? DEPARTMENT_COLORS['physical_dept']
          } text-xs font-semibold hidden sm:inline-flex`}
        >
          {role === 'owner' ? 'Owner' : (DEPT_DISPLAY[department ?? ''] ?? 'Staff')}
        </Badge>

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-none text-foreground">
              {displayName || 'Unknown'}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {role === 'owner' ? 'Owner' : (DEPT_DISPLAY[department ?? ''] ?? 'Staff')}
              {activeNames.length > 0 && ` · ${activeNames.length} on shift`}
            </p>
          </div>
          <Avatar className="h-8 w-8 border border-border">
            <AvatarFallback className="bg-muted text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
