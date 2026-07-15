import { supabase } from './supabase'

export interface DeletedRecord {
  id: string
  tableName: string
  recordId: string
  data: Record<string, unknown>
  deletedAt: string
  deletedBy: string | null
}

export interface FetchDeletedRecordsOptions {
  tableName?: string
  limit?: number
  offset?: number
}

export async function fetchDeletedRecords(
  options: FetchDeletedRecordsOptions = {}
): Promise<{ records: DeletedRecord[]; total: number }> {
  const limit = options.limit ?? 20
  const offset = options.offset ?? 0

  let query = supabase
    .from('deleted_records')
    .select('id, table_name, record_id, data, deleted_at, deleted_by', {
      count: 'exact',
    })
    .order('deleted_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (options.tableName) {
    query = query.eq('table_name', options.tableName)
  }

  const { data, error, count } = await query

  if (error) throw error

  return {
    records: (data ?? []).map((row) => ({
      id: row.id,
      tableName: row.table_name,
      recordId: row.record_id,
      data: row.data as Record<string, unknown>,
      deletedAt: row.deleted_at,
      deletedBy: row.deleted_by,
    })),
    total: count ?? 0,
  }
}

export async function fetchDistinctTableNames(): Promise<string[]> {
  const { data, error } = await supabase
    .from('deleted_records')
    .select('table_name')
    .order('table_name')

  if (error) throw error

  const names = new Set((data ?? []).map((row) => row.table_name))
  return Array.from(names)
}

export async function restoreDeletedRecord(
  tableName: string,
  recordId: string
): Promise<void> {
  const { error } = await supabase.rpc('restore_deleted_record', {
    p_table_name: tableName,
    p_record_id: recordId,
  })

  if (error) throw error
}
