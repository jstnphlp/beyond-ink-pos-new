import { DollarSign, Calculator, ShieldAlert } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAuth } from '@/shared/hooks/use-auth'
import { CostProfilesPanel } from './cost-profiles-panel'
import { QuotePlaygroundPanel } from './quote-playground-panel'

export function CostingPage() {
  const { role, department } = useAuth()

  if (role !== 'owner' && department !== 'physical_dept') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="max-w-sm space-y-3 text-center">
          <ShieldAlert className="text-muted-foreground mx-auto h-8 w-8" />
          <h2 className="text-foreground text-xl font-semibold">
            Access Restricted
          </h2>
          <p className="text-muted-foreground text-sm">
            The Costing page is available to owners and the Physical department
            only.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Costing</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Analyze costs, margins, and build internal quotes for your services.
        </p>
      </div>

      <Tabs defaultValue="profiles">
        <TabsList variant="line">
          <TabsTrigger value="profiles">
            <DollarSign className="h-3.5 w-3.5" />
            Cost Profiles
          </TabsTrigger>
          <TabsTrigger value="quotes">
            <Calculator className="h-3.5 w-3.5" />
            Quote Playground
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="mt-4" keepMounted>
          <CostProfilesPanel />
        </TabsContent>
        <TabsContent value="quotes" className="mt-4" keepMounted>
          <QuotePlaygroundPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
