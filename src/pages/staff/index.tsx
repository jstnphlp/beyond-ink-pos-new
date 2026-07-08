import { Users, Clock as ClockIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  break: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  offline: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
}

const DEPT_DOT: Record<string, string> = {
  Physical: 'bg-blue-400',
  Design: 'bg-purple-400',
  Dev: 'bg-emerald-400',
}

const MOCK_STAFF = [
  { name: 'Juan Carlos', email: 'juan@beyondink.ph', dept: 'Physical', clockIn: '6:00 AM', status: 'active', initials: 'JC' },
  { name: 'Ana Martinez', email: 'ana@beyondink.ph', dept: 'Design', clockIn: '7:00 AM', status: 'active', initials: 'AM' },
  { name: 'Rico Mendoza', email: 'rico@beyondink.ph', dept: 'Dev', clockIn: '8:00 AM', status: 'break', initials: 'RM' },
  { name: 'Kim Santos', email: 'kim@beyondink.ph', dept: 'Physical', clockIn: '6:30 AM', status: 'active', initials: 'KS' },
  { name: 'Diana Lopez', email: 'diana@beyondink.ph', dept: 'Design', clockIn: '—', status: 'offline', initials: 'DL' },
]

export function StaffPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff Shifts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor who's clocked in and their current status.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-emerald-400">3</p>
            <p className="mt-1 text-xs text-muted-foreground">Active Now</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-amber-400">1</p>
            <p className="mt-1 text-xs text-muted-foreground">On Break</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-zinc-400">1</p>
            <p className="mt-1 text-xs text-muted-foreground">Offline</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-brand" />
            Staff Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0 divide-y divide-border/40">
            {MOCK_STAFF.map((staff) => (
              <div
                key={staff.email}
                className="flex items-center justify-between py-3.5 transition-default hover:bg-muted/30 px-2 -mx-2 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarFallback className="bg-muted text-xs font-semibold">
                      {staff.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{staff.name}</p>
                      <div className={`h-1.5 w-1.5 rounded-full ${DEPT_DOT[staff.dept]}`} />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{staff.dept}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{staff.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    variant="outline"
                    className={`border text-[10px] font-semibold uppercase ${STATUS_STYLES[staff.status]}`}
                  >
                    {staff.status}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ClockIcon className="h-3 w-3" />
                    {staff.clockIn}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
