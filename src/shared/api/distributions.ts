import { supabase } from './supabase'
import type {
  DistributionPeriod,
  DepartmentDistribution,
  PhysicalStaffPayout,
  DesignDevStaffPayout,
} from './distributions.types'

const HOURLY_RATE = 15.3846154

function calcHours(timeIn: string, timeOut: string): number {
  const ms = new Date(timeOut).getTime() - new Date(timeIn).getTime()
  return Math.round((ms / (1000 * 60 * 60)) * 100) / 100
}

async function getPayoutStatuses(
  department: string,
  periodFrom: string,
  periodTo: string,
): Promise<Map<string, { given: boolean; payoutId: string }>> {
  const { data, error } = await supabase
    .from('distribution_payouts')
    .select('id, staff_member_id, given')
    .eq('department', department)
    .eq('period_from', periodFrom)
    .eq('period_to', periodTo)

  if (error) throw error

  const map = new Map<string, { given: boolean; payoutId: string }>()
  for (const row of data ?? []) {
    map.set(row.staff_member_id, { given: row.given, payoutId: row.id })
  }
  return map
}

export async function getPhysicalDistribution(
  period: DistributionPeriod,
): Promise<DepartmentDistribution> {
  const periodFrom = period.dateFrom ?? '1970-01-01T00:00:00.000Z'
  const periodTo = period.dateTo ? `${period.dateTo}T23:59:59.999Z` : '2099-12-31T23:59:59.999Z'

  let query = supabase
    .from('staff_sessions')
    .select('staff_member_id, staff_name, time_in, time_out')
    .not('time_out', 'is', null)

  if (period.dateFrom) {
    query = query.gte('time_in', period.dateFrom)
  }
  if (period.dateTo) {
    query = query.lte('time_in', `${period.dateTo}T23:59:59.999Z`)
  }

  const { data: sessions, error } = await query
  if (error) throw error

  const staffMembers = await getPhysicalStaffMembers()
  const staffMap = new Map(staffMembers.map((s) => [s.id, s.name]))

  const hoursMap = new Map<string, { name: string; hours: number }>()
  for (const row of sessions ?? []) {
    if (!row.time_out) continue
    const existing = hoursMap.get(row.staff_member_id)
    const hours = calcHours(row.time_in, row.time_out)
    if (existing) {
      existing.hours += hours
    } else {
      hoursMap.set(row.staff_member_id, {
        name: staffMap.get(row.staff_member_id) ?? row.staff_name,
        hours,
      })
    }
  }

  const statusMap = await getPayoutStatuses('physical_dept', periodFrom, periodTo)

  const payouts: PhysicalStaffPayout[] = Array.from(hoursMap.entries()).map(
    ([staffMemberId, { name, hours }]) => {
      const status = statusMap.get(staffMemberId)
      return {
        staffMemberId,
        staffName: name,
        totalHours: Math.round(hours * 100) / 100,
        payout: Math.round(hours * HOURLY_RATE * 100) / 100,
        given: status?.given ?? false,
        payoutId: status?.payoutId ?? null,
      }
    },
  )

  const totalPayroll = payouts.reduce((sum, p) => sum + p.payout, 0)

  return {
    department: 'physical_dept',
    totalRevenue: 0,
    ownershipShare: 0,
    deptShare: totalPayroll,
    reinvestment: 0,
    staffPayouts: payouts,
  }
}

export async function getDesignDevDistribution(
  department: 'design_dept' | 'dev_dept',
  period: DistributionPeriod,
): Promise<DepartmentDistribution> {
  const periodFrom = period.dateFrom ?? '1970-01-01T00:00:00.000Z'
  const periodTo = period.dateTo ? `${period.dateTo}T23:59:59.999Z` : '2099-12-31T23:59:59.999Z'

  let txnQuery = supabase
    .from('sales_transactions')
    .select('id, final_total')
    .eq('status', 'completed')
    .eq('department', department)

  if (period.dateFrom) {
    txnQuery = txnQuery.gte('completed_at', period.dateFrom)
  }
  if (period.dateTo) {
    txnQuery = txnQuery.lte('completed_at', `${period.dateTo}T23:59:59.999Z`)
  }

  const { data: transactions, error: txnError } = await txnQuery
  if (txnError) throw txnError

  const totalRevenue = (transactions ?? []).reduce(
    (sum, t) => sum + Number(t.final_total),
    0,
  )

  const txnIds = (transactions ?? []).map((t) => t.id)

  let payouts: DesignDevStaffPayout[] = []

  if (txnIds.length > 0) {
    const { data: contributors, error: contribError } = await supabase
      .from('transaction_contributors')
      .select('staff_member_id, staff_name, transaction_id')
      .in('transaction_id', txnIds)

    if (contribError) throw contribError

    const staffTxnMap = new Map<string, { name: string; txnIds: Set<string> }>()
    for (const row of contributors ?? []) {
      const existing = staffTxnMap.get(row.staff_member_id)
      if (existing) {
        existing.txnIds.add(row.transaction_id)
      } else {
        staffTxnMap.set(row.staff_member_id, {
          name: row.staff_name,
          txnIds: new Set([row.transaction_id]),
        })
      }
    }

    const totalContributions = Array.from(staffTxnMap.values()).reduce(
      (sum, s) => sum + s.txnIds.size,
      0,
    )

    const deptShare = Math.round(totalRevenue * 0.68 * 100) / 100

    const statusMap = await getPayoutStatuses(department, periodFrom, periodTo)

    payouts = Array.from(staffTxnMap.entries()).map(
      ([staffMemberId, { name, txnIds }]) => {
        const transactionCount = txnIds.size
        const sharePercent =
          totalContributions > 0
            ? Math.round((transactionCount / totalContributions) * 10000) / 100
            : 0
        const payout =
          totalContributions > 0
            ? Math.round((deptShare * transactionCount) / totalContributions * 100) / 100
            : 0
        const status = statusMap.get(staffMemberId)
        return {
          staffMemberId,
          staffName: name,
          transactionCount,
          sharePercent,
          payout,
          given: status?.given ?? false,
          payoutId: status?.payoutId ?? null,
        }
      },
    )
  }

  return {
    department,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    ownershipShare: Math.round(totalRevenue * 0.18 * 100) / 100,
    deptShare: Math.round(totalRevenue * 0.68 * 100) / 100,
    reinvestment: Math.round(totalRevenue * 0.14 * 100) / 100,
    staffPayouts: payouts,
  }
}

export async function upsertPayoutGiven(params: {
  staffMemberId: string
  staffName: string
  department: string
  periodFrom: string
  periodTo: string
  amount: number
  given: boolean
}): Promise<void> {
  const { staffMemberId, staffName, department, periodFrom, periodTo, amount, given } = params

  const { data: existing } = await supabase
    .from('distribution_payouts')
    .select('id')
    .eq('staff_member_id', staffMemberId)
    .eq('department', department)
    .eq('period_from', periodFrom)
    .eq('period_to', periodTo)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('distribution_payouts')
      .update({
        given,
        given_at: given ? new Date().toISOString() : null,
        amount,
        staff_name: staffName,
      })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('distribution_payouts')
      .insert({
        staff_member_id: staffMemberId,
        staff_name: staffName,
        department,
        period_from: periodFrom,
        period_to: periodTo,
        amount,
        given,
        given_at: given ? new Date().toISOString() : null,
      })
    if (error) throw error
  }
}

async function getPhysicalStaffMembers(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from('staff_members')
    .select('id, name')
    .eq('is_active', true)
    .eq('department', 'physical_dept')

  if (error) throw error
  return data ?? []
}

export async function getWeekGivenStatuses(
  periodFrom: string,
  periodTo: string,
): Promise<Record<string, boolean>> {
  const { data, error } = await supabase
    .from('distribution_payouts')
    .select('department, given')
    .eq('period_from', periodFrom)
    .eq('period_to', periodTo)

  if (error) throw error

  const result: Record<string, boolean> = {}
  for (const row of data ?? []) {
    if (row.given) {
      result[row.department] = true
    }
  }
  return result
}

export async function markWeekGiven(params: {
  department: string
  periodFrom: string
  periodTo: string
  given: boolean
}): Promise<void> {
  const { department, periodFrom, periodTo, given } = params

  if (given) {
    const { data: payouts } = await supabase
      .from('distribution_payouts')
      .select('id')
      .eq('department', department)
      .eq('period_from', periodFrom)
      .eq('period_to', periodTo)

    if (payouts && payouts.length > 0) {
      const { error } = await supabase
        .from('distribution_payouts')
        .update({ given: true, given_at: new Date().toISOString() })
        .eq('department', department)
        .eq('period_from', periodFrom)
        .eq('period_to', periodTo)
      if (error) throw error
    }
  } else {
    const { error } = await supabase
      .from('distribution_payouts')
      .update({ given: false, given_at: null })
      .eq('department', department)
      .eq('period_from', periodFrom)
      .eq('period_to', periodTo)
    if (error) throw error
  }
}
