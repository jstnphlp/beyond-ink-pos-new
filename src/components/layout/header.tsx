import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, Clock } from 'lucide-react'
import { useActiveSessions } from '@/shared/hooks/use-staff'
import { useAuth } from '@/shared/hooks/use-auth'

const DEPARTMENT_COLORS: Record<string, string> = {
  Physical:
    'bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/20',
  Design:
    'bg-purple-500/15 text-purple-400 border-purple-500/30 hover:bg-purple-500/20',
  Dev: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
  physical_dept:
    'bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/20',
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
  const { displayName, role } = useAuth()

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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-xl">
      {/* Left — page context placeholder */}
      <div />

      {/* Right — user info + clock */}
      <div className="flex items-center gap-5">
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
          className={`border ${DEPARTMENT_COLORS['physical_dept']} text-xs font-semibold`}
        >
          Physical
        </Badge>

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-none text-foreground">
              {displayName || 'Unknown'}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {role === 'owner' ? 'Owner' : 'Staff'}
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
