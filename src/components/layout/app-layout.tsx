import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { Toaster } from 'sonner'
import { CatalogSync } from '@/components/catalog-sync'

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <CatalogSync />
      <Sidebar />
      <div className="flex flex-1 flex-col md:pl-64">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  )
}
