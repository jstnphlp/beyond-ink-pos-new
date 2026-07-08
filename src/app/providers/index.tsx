import type { ReactNode } from 'react'
import { QueryProvider } from './query-provider'
import { AuthProvider } from '@/shared/hooks/use-auth'
import { TooltipProvider } from '@/components/ui/tooltip'

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </AuthProvider>
    </QueryProvider>
  )
}
