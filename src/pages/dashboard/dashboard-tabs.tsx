import { useDashboardStore } from '@/stores/dashboard-store'
import { useRecentTransactions } from '@/shared/hooks/use-dashboard'
import { useQuery } from '@tanstack/react-query'
import { getDrafts } from '@/shared/api/drafts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Receipt, FileText, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useActiveSessions } from '@/shared/hooks/use-staff'

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  refunded: 'bg-red-500/15 text-red-400 border-red-500/25',
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  break: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  offline: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
}

const DEPT_DOT: Record<string, string> = {
  physical_dept: 'bg-blue-400',
  design_dept: 'bg-purple-400',
  dev_dept: 'bg-emerald-400',
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function DashboardTabs() {
  const { activeTab, setActiveTab } = useDashboardStore()
  const navigate = useNavigate()

  const { data: transactions } = useRecentTransactions()
  const { data: drafts } = useQuery({
    queryKey: ['drafts'],
    queryFn: getDrafts,
  })

  const { data: activeSessions } = useActiveSessions()

  return (
    <Card className="border-border/50">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
      >
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold">
              Activity Overview
            </CardTitle>
            <TabsList className="bg-muted/50">
              <TabsTrigger
                value="transactions"
                className="gap-1.5 text-xs data-[state=active]:bg-background"
              >
                <Receipt className="h-3.5 w-3.5" />
                Transactions
              </TabsTrigger>
              <TabsTrigger
                value="drafts"
                className="gap-1.5 text-xs data-[state=active]:bg-background"
              >
                <FileText className="h-3.5 w-3.5" />
                Drafts
              </TabsTrigger>
              <TabsTrigger
                value="staff"
                className="gap-1.5 text-xs data-[state=active]:bg-background"
              >
                <Users className="h-3.5 w-3.5" />
                Staff
              </TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Recent Transactions */}
          <TabsContent value="transactions" className="mt-0">
            <div className="space-y-0 divide-y divide-border/50">
              {(transactions ?? []).map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between gap-2 py-3.5 transition-default hover:bg-muted/30 px-2 -mx-2 rounded-lg"
                >
                  <div className="flex items-center gap-2 min-w-0 md:gap-3">
                    <div
                      className={`h-2 w-2 shrink-0 rounded-full ${DEPT_DOT[txn.department] ?? 'bg-zinc-400'}`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{txn.customer}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {txn.transactionNumber} · {txn.cashier}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 md:gap-4">
                    <Badge
                      variant="outline"
                      className={`border text-[10px] font-semibold uppercase hidden sm:inline-flex ${STATUS_STYLES[txn.status]}`}
                    >
                      {txn.status}
                    </Badge>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        ₱{txn.amount.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDate(txn.timestamp)} {formatTime(txn.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {transactions && transactions.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No recent transactions
                </p>
              )}
            </div>
          </TabsContent>

          {/* Saved Drafts */}
          <TabsContent value="drafts" className="mt-0">
            <div className="space-y-0 divide-y divide-border/50">
              {(drafts ?? []).map((draft) => {
                const services = (draft.draftPayload.selectedServices ?? []).map((ss) => ss.service?.name ?? 'Unknown')
                const label = draft.draftPayload.name || `DRF-${draft.transactionNumber.slice(-4)}`
                return (
                  <div
                    key={draft.id}
                    className="flex items-center justify-between py-3.5 transition-default hover:bg-muted/30 px-2 -mx-2 rounded-lg cursor-pointer"
                    onClick={() => navigate(`/new-sale?draftId=${draft.id}`)}
                  >
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">
                        {services.join(', ') || 'No services'} · {draft.cashierName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        ₱{draft.finalTotal.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDate(draft.createdAt)}{' '}
                        {formatTime(draft.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
              {drafts && drafts.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No saved drafts
                </p>
              )}
            </div>
          </TabsContent>

          {/* Active Staff Sessions */}
          <TabsContent value="staff" className="mt-0">
            <div className="space-y-0 divide-y divide-border/50">
              {(activeSessions ?? []).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-3.5 transition-default hover:bg-muted/30 px-2 -mx-2 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                    <div>
                      <p className="text-sm font-medium">{session.staffName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant="outline"
                      className="border text-[10px] font-semibold uppercase bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                    >
                      active
                    </Badge>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Clocked in {formatTime(session.timeIn)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {(activeSessions ?? []).length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No staff currently clocked in
                </p>
              )}
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}
