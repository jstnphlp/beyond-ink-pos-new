import {
  Settings,
  Bell,
  Shield,
  Monitor,
  Building2,
  Percent,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/shared/hooks/use-auth'
import {
  useMarginThresholds,
  useUpdateMarginThresholds,
} from '@/shared/hooks/use-costing'
import { useState, useEffect } from 'react'

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

export function SettingsPage() {
  const { role, department, displayName } = useAuth()

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your POS preferences and configuration.
        </p>
      </div>

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

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Monitor className="text-brand h-4 w-4" />
              Display
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Dark Mode</p>
                <p className="text-muted-foreground text-xs">
                  Use dark theme for the interface
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Compact View</p>
                <p className="text-muted-foreground text-xs">
                  Reduce spacing in tables and lists
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="text-brand h-4 w-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Sale Alerts</p>
                <p className="text-muted-foreground text-xs">
                  Notification sounds on sale completion
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Low Stock Alerts</p>
                <p className="text-muted-foreground text-xs">
                  Warn when materials run low
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="text-brand h-4 w-4" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-lock</p>
                <p className="text-muted-foreground text-xs">
                  Lock screen after 5 min of inactivity
                </p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Require PIN for Refunds</p>
                <p className="text-muted-foreground text-xs">
                  Additional security for refund operations
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="text-brand h-4 w-4" />
              General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-print Receipts</p>
                <p className="text-muted-foreground text-xs">
                  Print receipt on sale completion
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Show Service Prices</p>
                <p className="text-muted-foreground text-xs">
                  Display base prices on service cards
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {role === 'owner' && <MarginThresholdsCard />}
      </div>
    </div>
  )
}

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
