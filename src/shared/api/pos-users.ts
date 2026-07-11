import { supabase } from './supabase'

export interface PosUser {
  id: string
  email: string
  name: string | null
  role: 'owner' | 'staff'
  department: 'physical_dept' | 'design_dept' | 'dev_dept' | null
  createdAt: string
}

export async function getPosUsers(): Promise<PosUser[]> {
  const { data, error } = await supabase
    .from('allowed_users')
    .select('id, email, name, role, department, created_at')
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    department: row.department,
    createdAt: row.created_at,
  }))
}

export async function createPosUser(params: {
  email: string
  name?: string
  role: 'owner' | 'staff'
  department?: 'physical_dept' | 'design_dept' | 'dev_dept' | null
}): Promise<void> {
  const { error } = await supabase
    .from('allowed_users')
    .insert({
      email: params.email.toLowerCase().trim(),
      name: params.name?.trim() || null,
      role: params.role,
      department: params.department ?? null,
    })

  if (error) throw error
}

export async function updatePosUser(
  id: string,
  params: {
    name?: string | null
    role?: 'owner' | 'staff'
    department?: 'physical_dept' | 'design_dept' | 'dev_dept' | null
  },
): Promise<void> {
  const updates: Record<string, unknown> = {}
  if (params.name !== undefined) updates.name = params.name?.trim() || null
  if (params.role !== undefined) updates.role = params.role
  if (params.department !== undefined) updates.department = params.department

  const { error } = await supabase
    .from('allowed_users')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

export async function deletePosUser(id: string): Promise<void> {
  const { error } = await supabase
    .from('allowed_users')
    .delete()
    .eq('id', id)

  if (error) throw error
}
