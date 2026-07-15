export interface StaffMember {
  id: string
  name: string
  department: string
  isActive: boolean
  createdAt: string
}

export interface StaffSession {
  id: string
  staffMemberId: string | null
  staffName: string
  department: string
  timeIn: string
  timeOut: string | null
  autoLoggedOut: boolean
  note: string | null
  createdAt: string
}

export interface AttendanceFilters {
  staffMemberId: string | 'all'
  department: string | 'all'
  dateFrom: string | null
  dateTo: string | null
}

export interface AttendancePageResult {
  sessions: StaffSession[]
  nextCursor: { timeIn: string; id: string } | null
}
