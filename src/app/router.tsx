import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const router = createBrowserRouter([
  {
    path: '/',
    lazy: async () => {
      const { CheckoutPage } = await import('@/pages/checkout')
      return { Component: CheckoutPage }
    },
  },
  {
    path: '/checkout',
    lazy: async () => {
      const { CheckoutPage } = await import('@/pages/checkout')
      return { Component: CheckoutPage }
    },
  },
  {
    path: '/inventory',
    lazy: async () => {
      const { InventoryPage } = await import('@/pages/inventory')
      return { Component: InventoryPage }
    },
  },
  {
    path: '/reports',
    lazy: async () => {
      const { ReportsPage } = await import('@/pages/reports')
      return { Component: ReportsPage }
    },
  },
  {
    path: '/settings',
    lazy: async () => {
      const { SettingsPage } = await import('@/pages/settings')
      return { Component: SettingsPage }
    },
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
