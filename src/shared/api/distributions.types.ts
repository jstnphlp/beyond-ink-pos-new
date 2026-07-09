export interface DistributionPeriod {
  dateFrom: string | null
  dateTo: string | null
}

export interface PhysicalStaffPayout {
  staffMemberId: string
  staffName: string
  totalHours: number
  payout: number
  given: boolean
  payoutId: string | null
}

export interface DesignDevStaffPayout {
  staffMemberId: string
  staffName: string
  transactionCount: number
  sharePercent: number
  payout: number
  given: boolean
  payoutId: string | null
}

export interface DepartmentDistribution {
  department: 'physical_dept' | 'design_dept' | 'dev_dept'
  totalRevenue: number
  ownershipShare: number
  deptShare: number
  reinvestment: number
  staffPayouts: PhysicalStaffPayout[] | DesignDevStaffPayout[]
}
