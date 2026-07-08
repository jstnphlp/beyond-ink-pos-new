export interface StaffMember {
  id: string
  name: string
  department: string
  isActive: boolean
  createdAt: string
}

export interface StaffSession {
  id: string
  staffMemberId: string
  staffName: string
  timeIn: string
  timeOut: string | null
  autoLoggedOut: boolean
  createdAt: string
}

export interface AttendanceFilters {
  staffMemberId: string | 'all'
  dateFrom: string | null
  dateTo: string | null
}

export interface AttendancePageResult {
  sessions: StaffSession[]
  nextCursor: { timeIn: string; id: string } | null
}
