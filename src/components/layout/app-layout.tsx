import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { Toaster } from 'sonner'
import { CatalogSync, DepartmentSync } from '@/components/catalog-sync'

export function AppLayout() {
  return (
    <div className="bg-background flex min-h-screen">
      <CatalogSync />
      <DepartmentSync />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col md:pl-64">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  )
}
