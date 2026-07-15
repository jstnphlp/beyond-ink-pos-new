import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  fetchAllTransactions,
  fetchAllWalletEntries,
  fetchAllActivityLogs,
  fetchAllAttendance,
} from '@/shared/api/export'

export function useExportDashboard() {
  return useMutation({
    mutationFn: async () => {
      const XLSX = await import('xlsx')

      const [transactions, walletEntries, activityLogs, attendance] = await Promise.all([
        fetchAllTransactions(),
        fetchAllWalletEntries(),
        fetchAllActivityLogs(),
        fetchAllAttendance(),
      ])

      const wb = XLSX.utils.book_new()

      const wsTransactions = XLSX.utils.json_to_sheet(transactions)
      XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transactions')

      const wsWalletActivity = XLSX.utils.json_to_sheet(walletEntries)
      XLSX.utils.book_append_sheet(wb, wsWalletActivity, 'Wallet Activity')

      const wsActivityLogs = XLSX.utils.json_to_sheet(activityLogs)
      XLSX.utils.book_append_sheet(wb, wsActivityLogs, 'Activity Logs')

      const wsAttendance = XLSX.utils.json_to_sheet(attendance)
      XLSX.utils.book_append_sheet(wb, wsAttendance, 'Attendance')

      const dateStr = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(wb, `dashboard-export-${dateStr}.xlsx`)
    },
    onSuccess: () => {
      toast.success('Excel file downloaded')
    },
    onError: () => {
      toast.error('Failed to export data')
    },
  })
}
