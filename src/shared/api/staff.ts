import { supabase } from './supabase'
import type {
  StaffMember,
  StaffSession,
  AttendanceFilters,
  AttendancePageResult,
} from './staff.types'

const PAGE_SIZE = 10

let staleCleanupDone = false

const DEFAULT_STAFF = [
  { name: 'Mark', department: 'physical_dept' },
  { name: 'Buknoy', department: 'physical_dept' },
  { name: 'Ava', department: 'design_dept' },
  { name: 'Leo', department: 'dev_dept' },
]

const SESSION_COLUMNS = 'id, staff_member_id, staff_name, department, time_in, time_out, auto_logged_out, note, created_at'

export async function getStaffMembers(department?: string): Promise<StaffMember[]> {
  let query = supabase
    .from('staff_members')
    .select('id, name, department, is_active, created_at')
    .eq('is_active', true)
    .order('name')

  if (department) {
    query = query.eq('department', department)
  }

  const { data, error } = await query
  if (error) throw error

  if ((data ?? []).length === 0 && !department) {
    const { data: inserted, error: insertError } = await supabase
      .from('staff_members')
      .upsert(DEFAULT_STAFF, { onConflict: 'name' })
      .select('id, name, department, is_active, created_at')

    if (insertError) throw insertError
    return (inserted ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      department: row.department,
      isActive: row.is_active,
      createdAt: row.created_at,
    }))
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    department: row.department,
    isActive: row.is_active,
    createdAt: row.created_at,
  }))
}

export async function getActiveSessions(department?: string): Promise<StaffSession[]> {
  if (!staleCleanupDone) {
    staleCleanupDone = true
    supabase.rpc('auto_logout_stale_sessions').then(() => {})
  }

  let query = supabase
    .from('staff_sessions')
    .select(SESSION_COLUMNS)
    .is('time_out', null)
    .order('time_in')

  if (department) {
    query = query.eq('department', department)
  }

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map(mapSession)
}

export async function clockIn(params: {
  staffMemberId?: string
  staffName: string
  department: string
}): Promise<StaffSession> {
  const { staffMemberId, staffName, department } = params

  if (staffMemberId) {
    const { data: existing } = await supabase
      .from('staff_sessions')
      .select('id')
      .eq('staff_member_id', staffMemberId)
      .is('time_out', null)
      .maybeSingle()

    if (existing) {
      const { data } = await supabase
        .from('staff_sessions')
        .select(SESSION_COLUMNS)
        .eq('id', existing.id)
        .single()
      return mapSession(data!)
    }
  } else {
    const { data: existing } = await supabase
      .from('staff_sessions')
      .select('id')
      .eq('staff_name', staffName)
      .is('staff_member_id', null)
      .is('time_out', null)
      .maybeSingle()

    if (existing) {
      const { data } = await supabase
        .from('staff_sessions')
        .select(SESSION_COLUMNS)
        .eq('id', existing.id)
        .single()
      return mapSession(data!)
    }
  }

  const { data, error } = await supabase
    .from('staff_sessions')
    .insert({
      staff_member_id: staffMemberId ?? null,
      staff_name: staffName,
      department,
    })
    .select(SESSION_COLUMNS)
    .single()

  if (error) throw error
  return mapSession(data)
}

export async function clockOut(staffMemberId: string | null, staffName: string, note?: string): Promise<void> {
  const updates: Record<string, unknown> = { time_out: new Date().toISOString() }
  if (note !== undefined) updates.note = note

  let query = supabase
    .from('staff_sessions')
    .update(updates)
    .is('time_out', null)

  if (staffMemberId) {
    query = query.eq('staff_member_id', staffMemberId)
  } else {
    query = query.eq('staff_name', staffName).is('staff_member_id', null)
  }

  const { error } = await query
  if (error) throw error
}

export async function getAttendance(
  filters: AttendanceFilters,
  cursor?: { timeIn: string; id: string } | null,
): Promise<AttendancePageResult> {
  let query = supabase
    .from('staff_sessions')
    .select(SESSION_COLUMNS)
    .not('time_out', 'is', null)
    .order('time_in', { ascending: false })
    .order('id', { ascending: false })
    .limit(PAGE_SIZE + 1)

  if (filters.staffMemberId !== 'all') {
    query = query.eq('staff_member_id', filters.staffMemberId)
  }
  if (filters.department !== 'all') {
    query = query.eq('department', filters.department)
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
  staff_member_id: string | null
  staff_name: string
  department: string
  time_in: string
  time_out: string | null
  auto_logged_out: boolean
  note: string | null
  created_at: string
}): StaffSession {
  return {
    id: row.id,
    staffMemberId: row.staff_member_id,
    staffName: row.staff_name,
    department: row.department,
    timeIn: row.time_in,
    timeOut: row.time_out,
    autoLoggedOut: row.auto_logged_out,
    note: row.note,
    createdAt: row.created_at,
  }
}
