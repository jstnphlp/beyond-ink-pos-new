import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
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
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
