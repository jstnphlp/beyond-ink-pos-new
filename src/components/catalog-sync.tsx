import { useEffect } from 'react'
import { useCatalog } from '@/shared/hooks/use-catalog'
import { usePosStore } from '@/stores/pos-store'

export function CatalogSync() {
  const { data } = useCatalog()
  const setCatalog = usePosStore((s) => s.setCatalog)

  useEffect(() => {
    if (data) setCatalog(data)
  }, [data, setCatalog])

  return null
}
