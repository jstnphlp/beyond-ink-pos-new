import { useEffect } from 'react'
import { useCatalog } from '@/shared/hooks/use-catalog'
import { usePosStore } from '@/stores/pos-store'
import { useAuth } from '@/shared/hooks/use-auth'

export function CatalogSync() {
  const { data } = useCatalog()
  const setCatalog = usePosStore((s) => s.setCatalog)

  useEffect(() => {
    if (data) setCatalog(data)
  }, [data, setCatalog])

  return null
}

export function DepartmentSync() {
  const { department } = useAuth()
  const setUserDepartment = usePosStore((s) => s.setUserDepartment)

  useEffect(() => {
    setUserDepartment(department)
  }, [department, setUserDepartment])

  return null
}
