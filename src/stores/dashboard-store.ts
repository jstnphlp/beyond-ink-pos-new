import { create } from 'zustand'

interface DashboardState {
  activeTab: 'transactions' | 'drafts' | 'staff'
  setActiveTab: (tab: DashboardState['activeTab']) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  activeTab: 'transactions',
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
