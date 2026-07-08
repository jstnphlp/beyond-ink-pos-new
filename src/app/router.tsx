import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import { AuthGuard } from '@/components/auth/auth-guard'
import { useAuth } from '@/shared/hooks/use-auth'

function RoleRedirect() {
  const { role, loading } = useAuth()
  if (loading) return null
  if (role === 'staff') return <Navigate to="/new-sale" replace />
  return <Navigate to="/dashboard" replace />
}

const router = createBrowserRouter([
  {
    path: '/login',
    lazy: async () => {
      const { LoginPage } = await import('@/pages/login')
      return { Component: LoginPage }
    },
  },
  {
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      {
        path: '/',
        element: <RoleRedirect />,
      },
      {
        path: '/dashboard',
        lazy: async () => {
          const { DashboardPage } = await import('@/pages/dashboard')
          return { Component: DashboardPage }
        },
      },
      {
        path: '/new-sale',
        lazy: async () => {
          const { NewSalePage } = await import('@/pages/new-sale')
          return { Component: NewSalePage }
        },
      },
      {
        path: '/drafts',
        lazy: async () => {
          const { DraftsPage } = await import('@/pages/drafts')
          return { Component: DraftsPage }
        },
      },
      {
        path: '/history',
        lazy: async () => {
          const { HistoryPage } = await import('@/pages/history')
          return { Component: HistoryPage }
        },
      },
      {
        path: '/wallet',
        lazy: async () => {
          const { WalletPage } = await import('@/pages/wallet')
          return { Component: WalletPage }
        },
      },
      {
        path: '/staff',
        lazy: async () => {
          const { StaffPage } = await import('@/pages/staff')
          return { Component: StaffPage }
        },
      },
      {
        path: '/settings',
        lazy: async () => {
          const { SettingsPage } = await import('@/pages/settings')
          return { Component: SettingsPage }
        },
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
