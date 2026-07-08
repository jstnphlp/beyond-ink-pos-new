import type { ReactNode } from 'react'
import { QueryProvider } from './query-provider'
import { TooltipProvider } from '@/components/ui/tooltip'

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryProvider>
  )
}
