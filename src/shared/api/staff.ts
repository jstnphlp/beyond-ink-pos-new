import { supabase } from './supabase'
import type {
  StaffMember,
  StaffSession,
  AttendanceFilters,
  AttendancePageResult,
} from './staff.types'

const PAGE_SIZE = 20

let staleCleanupDone = false

export async function getStaffMembers(): Promise<StaffMember[]> {
  const { data, error } = await supabase
    .from('staff_members')
    .select('id, name, department, is_active, created_at')
    .eq('is_active', true)
    .order('name')

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    department: row.department,
    isActive: row.is_active,
    createdAt: row.created_at,
  }))
}

export async function getActiveSessions(): Promise<StaffSession[]> {
  // Stale session cleanup — runs ONCE per page load, not on every fetch
  if (!staleCleanupDone) {
    staleCleanupDone = true
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    supabase
      .from('staff_sessions')
      .update({ time_out: new Date().toISOString(), auto_logged_out: true })
      .is('time_out', null)
      .lt('time_in', today.toISOString())
      .then(() => {})
  }

  const { data, error } = await supabase
    .from('staff_sessions')
    .select('id, staff_member_id, staff_name, time_in, time_out, auto_logged_out, created_at')
    .is('time_out', null)
    .order('time_in')

  if (error) throw error

  return (data ?? []).map(mapSession)
}

export async function clockIn(staffMemberId: string, staffName: string): Promise<StaffSession> {
  const { data: existing } = await supabase
    .from('staff_sessions')
    .select('id')
    .eq('staff_member_id', staffMemberId)
    .is('time_out', null)
    .maybeSingle()

  if (existing) {
    const { data } = await supabase
      .from('staff_sessions')
      .select('id, staff_member_id, staff_name, time_in, time_out, auto_logged_out, created_at')
      .eq('id', existing.id)
      .single()
    return mapSession(data!)
  }

  const { data, error } = await supabase
    .from('staff_sessions')
    .insert({
      staff_member_id: staffMemberId,
      staff_name: staffName,
    })
    .select('id, staff_member_id, staff_name, time_in, time_out, auto_logged_out, created_at')
    .single()

  if (error) throw error
  return mapSession(data)
}

export async function clockOut(staffMemberId: string): Promise<void> {
  const { error } = await supabase
    .from('staff_sessions')
    .update({ time_out: new Date().toISOString() })
    .eq('staff_member_id', staffMemberId)
    .is('time_out', null)

  if (error) throw error
}

export async function getAttendance(
  filters: AttendanceFilters,
  cursor?: { timeIn: string; id: string } | null,
): Promise<AttendancePageResult> {
  let query = supabase
    .from('staff_sessions')
    .select('id, staff_member_id, staff_name, time_in, time_out, auto_logged_out, created_at')
    .not('time_out', 'is', null)
    .order('time_in', { ascending: false })
    .order('id', { ascending: false })
    .limit(PAGE_SIZE + 1)

  if (filters.staffMemberId !== 'all') {
    query = query.eq('staff_member_id', filters.staffMemberId)
  }
  if (filters.dateFrom) {
    query = query.gte('time_in', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('time_in', `${filters.dateTo}T23:59:59.999Z`)
  }

  if (cursor) {
    query = query.or(
      `time_in.lt.${cursor.timeIn},and(time_in.eq.${cursor.timeIn},id.lt.${cursor.id})`,
    )
  }

  const { data, error } = await query
  if (error) throw error

  const rows = data ?? []
  const hasMore = rows.length > PAGE_SIZE
  const page = rows.slice(0, PAGE_SIZE)

  const lastRow = page[page.length - 1]
  const nextCursor =
    hasMore && lastRow
      ? { timeIn: lastRow.time_in, id: lastRow.id }
      : null

  return {
    sessions: page.map(mapSession),
    nextCursor,
  }
}

export async function updateSession(
  id: string,
  updates: { timeIn?: string; timeOut?: string | null },
): Promise<void> {
  const payload: Record<string, unknown> = {}
  if (updates.timeIn !== undefined) payload.time_in = updates.timeIn
  if (updates.timeOut !== undefined) payload.time_out = updates.timeOut

  const { error } = await supabase
    .from('staff_sessions')
    .update(payload)
    .eq('id', id)

  if (error) throw error
}

function mapSession(row: {
  id: string
  staff_member_id: string
  staff_name: string
  time_in: string
  time_out: string | null
  auto_logged_out: boolean
  created_at: string
}): StaffSession {
  return {
    id: row.id,
    staffMemberId: row.staff_member_id,
    staffName: row.staff_name,
    timeIn: row.time_in,
    timeOut: row.time_out,
    autoLoggedOut: row.auto_logged_out,
    createdAt: row.created_at,
  }
}
