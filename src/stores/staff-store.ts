import { create } from 'zustand'
import type { AttendanceFilters } from '@/shared/api/staff.types'

interface StaffState {
  selectedStaffId: string | null
  setSelectedStaffId: (id: string | null) => void
  attendanceFilters: AttendanceFilters
  setAttendanceFilters: (filters: Partial<AttendanceFilters>) => void
  clockInDialogOpen: boolean
  setClockInDialogOpen: (open: boolean) => void
}

export const useStaffStore = create<StaffState>((set) => ({
  selectedStaffId: null,
  setSelectedStaffId: (id) => set({ selectedStaffId: id }),

  attendanceFilters: {
    staffMemberId: 'all',
    dateFrom: null,
    dateTo: null,
  },
  setAttendanceFilters: (filters) =>
    set((s) => ({ attendanceFilters: { ...s.attendanceFilters, ...filters } })),

  clockInDialogOpen: false,
  setClockInDialogOpen: (open) => set({ clockInDialogOpen: open }),
}))
