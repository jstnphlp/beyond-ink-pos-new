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

let cachedStaffMembers: { id: string; name: string }[] | null = null
let staffCacheTime = 0
const STAFF_CACHE_TTL = 5 * 60 * 1000

async function getPhysicalStaffMembers(): Promise<{ id: string; name: string }[]> {
  if (cachedStaffMembers && Date.now() - staffCacheTime < STAFF_CACHE_TTL) {
    return cachedStaffMembers
  }
  const { data, error } = await supabase
    .from('staff_members')
    .select('id, name')
    .eq('is_active', true)
    .eq('department', 'physical_dept')

  if (error) throw error
  cachedStaffMembers = data ?? []
  staffCacheTime = Date.now()
  return cachedStaffMembers
}

export async function getPhysicalDistribution(
  period: DistributionPeriod,
): Promise<DepartmentDistribution> {
  let query = supabase
    .from('staff_sessions')
    .select('staff_member_id, staff_name, time_in, time_out')
    .not('time_out', 'is', null)
    .not('staff_member_id', 'is', null)

  if (period.dateFrom) {
    query = query.gte('time_in', period.dateFrom)
  }
  if (period.dateTo) {
    query = query.lte('time_in', period.dateTo)
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

  const payouts: PhysicalStaffPayout[] = Array.from(hoursMap.entries()).map(
    ([staffMemberId, { name, hours }]) => ({
      staffMemberId,
      staffName: name,
      totalHours: Math.round(hours * 100) / 100,
      payout: Math.round(hours * HOURLY_RATE * 100) / 100,
    }),
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
  let txnQuery = supabase
    .from('sales_transactions')
    .select('id, final_total')
    .eq('status', 'completed')
    .eq('department', department)

  if (period.dateFrom) {
    txnQuery = txnQuery.gte('completed_at', period.dateFrom)
  }
  if (period.dateTo) {
    txnQuery = txnQuery.lte('completed_at', period.dateTo)
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
        return {
          staffMemberId,
          staffName: name,
          transactionCount,
          sharePercent,
          payout,
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

export async function getAllWeekGivenStatuses(
  weeks: { periodFrom: string; periodTo: string }[],
): Promise<Record<string, Record<string, Record<string, boolean>>>> {
  if (weeks.length === 0) return {}

  const allFroms = weeks.map((w) => w.periodFrom)
  const minFrom = allFroms.sort()[0]
  const allTos = weeks.map((w) => w.periodTo)
  const maxTo = allTos.sort().reverse()[0]

  const { data, error } = await supabase
    .from('distribution_payouts')
    .select('staff_member_id, department, period_from, period_to, given')
    .gte('period_from', minFrom)
    .lte('period_to', maxTo)

  if (error) throw error

  // Result: weekKey -> department -> staffMemberId -> given
  const result: Record<string, Record<string, Record<string, boolean>>> = {}
  for (const week of weeks) {
    const key = `${new Date(week.periodFrom).getTime()}|${new Date(week.periodTo).getTime()}`
    result[key] = {}
  }

  for (const row of data ?? []) {
    if (!row.given) continue
    const key = `${new Date(row.period_from).getTime()}|${new Date(row.period_to).getTime()}`
    if (result[key]) {
      if (!result[key][row.department]) {
        result[key][row.department] = {}
      }
      result[key][row.department][row.staff_member_id] = true
    }
  }

  return result
}

export async function markStaffGiven(params: {
  staffMemberId: string
  staffName: string
  department: string
  periodFrom: string
  periodTo: string
  given: boolean
}): Promise<void> {
  const { staffMemberId, staffName, department, periodFrom, periodTo, given } = params

  const { data: existing } = await supabase
    .from('distribution_payouts')
    .select('id')
    .eq('staff_member_id', staffMemberId)
    .eq('department', department)
    .eq('period_from', periodFrom)
    .eq('period_to', periodTo)
    .limit(1)

  if (existing && existing.length > 0) {
    const { error } = await supabase
      .from('distribution_payouts')
      .update({ given, given_at: given ? new Date().toISOString() : null })
      .eq('staff_member_id', staffMemberId)
      .eq('department', department)
      .eq('period_from', periodFrom)
      .eq('period_to', periodTo)
    if (error) throw error
  } else if (given) {
    const { error } = await supabase
      .from('distribution_payouts')
      .insert({
        staff_member_id: staffMemberId,
        staff_name: staffName,
        department,
        period_from: periodFrom,
        period_to: periodTo,
        amount: 0,
        given: true,
        given_at: new Date().toISOString(),
      })
    if (error) throw error
  }
}
