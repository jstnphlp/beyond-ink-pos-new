import { create } from 'zustand'
import type { Department } from './pos-store'

// ─── Types ────────────────────────────────────────────────

export interface DepartmentSummary {
  department: Department
  label: string
  activeTransactions: number
  dailyRevenue: number
  icon: string
}

export interface Transaction {
  id: string
  transactionNumber: string
  customer: string
  department: Department
  amount: number
  status: 'completed' | 'pending' | 'refunded'
  timestamp: string
  cashier: string
}

export interface StaffSession {
  id: string
  staffMemberId: string
  staffName: string
  timeIn: string
  timeOut: string | null
  autoLoggedOut: boolean
}

// ─── Mock Data ────────────────────────────────────────────

const MOCK_SUMMARIES: DepartmentSummary[] = [
  {
    department: 'Physical',
    label: 'Physical Print Shop',
    activeTransactions: 12,
    dailyRevenue: 8450,
    icon: 'Printer',
  },
  {
    department: 'Design',
    label: 'Design Studio',
    activeTransactions: 5,
    dailyRevenue: 12300,
    icon: 'Palette',
  },
  {
    department: 'Dev',
    label: 'Dev Operations',
    activeTransactions: 3,
    dailyRevenue: 24500,
    icon: 'Code2',
  },
]

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', transactionNumber: 'TXN-2026-0047', customer: 'Maria Santos', department: 'Physical', amount: 350, status: 'completed', timestamp: '2026-07-08T08:32:00', cashier: 'Juan C.' },
  { id: '2', transactionNumber: 'TXN-2026-0046', customer: 'Carlo Reyes', department: 'Design', amount: 1500, status: 'completed', timestamp: '2026-07-08T08:15:00', cashier: 'Ana M.' },
  { id: '3', transactionNumber: 'TXN-2026-0045', customer: 'Lisa Gomez', department: 'Physical', amount: 85, status: 'pending', timestamp: '2026-07-08T07:58:00', cashier: 'Juan C.' },
  { id: '4', transactionNumber: 'TXN-2026-0044', customer: 'Mark Tan', department: 'Dev', amount: 5000, status: 'completed', timestamp: '2026-07-08T07:30:00', cashier: 'Ana M.' },
  { id: '5', transactionNumber: 'TXN-2026-0043', customer: 'Rosa Lim', department: 'Physical', amount: 220, status: 'refunded', timestamp: '2026-07-08T07:12:00', cashier: 'Juan C.' },
  { id: '6', transactionNumber: 'TXN-2026-0042', customer: 'Jake Cruz', department: 'Design', amount: 800, status: 'completed', timestamp: '2026-07-07T17:45:00', cashier: 'Ana M.' },
]

// ─── Store ────────────────────────────────────────────────

interface DashboardState {
  summaries: DepartmentSummary[]
  transactions: Transaction[]
  activeTab: 'transactions' | 'drafts' | 'staff'
  setActiveTab: (tab: DashboardState['activeTab']) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  summaries: MOCK_SUMMARIES,
  transactions: MOCK_TRANSACTIONS,
  activeTab: 'transactions',
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
