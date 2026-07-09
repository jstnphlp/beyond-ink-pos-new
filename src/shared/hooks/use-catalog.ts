import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getCatalog,
  createService,
  updateService,
  deleteService,
  createCategory,
  updateCategory,
  deleteCategory,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  setServiceMaterials,
} from '@/shared/api/catalog'

export const catalogKeys = {
  all: ['catalog'] as const,
}

export function useCatalog() {
  return useQuery({
    queryKey: catalogKeys.all,
    queryFn: getCatalog,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useCreateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createService,
    onSuccess: () => { qc.invalidateQueries({ queryKey: catalogKeys.all }); toast.success('Service created') },
    onError: () => { toast.error('Failed to create service') },
  })
}

export function useUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateService>[1] }) => updateService(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: catalogKeys.all }); toast.success('Service updated') },
    onError: () => { toast.error('Failed to update service') },
  })
}

export function useDeleteService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteService,
    onSuccess: () => { qc.invalidateQueries({ queryKey: catalogKeys.all }); toast.success('Service deleted') },
    onError: () => { toast.error('Failed to delete service') },
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: catalogKeys.all }); toast.success('Category created') },
    onError: () => { toast.error('Failed to create category') },
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateCategory>[1] }) => updateCategory(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: catalogKeys.all }); toast.success('Category updated') },
    onError: () => { toast.error('Failed to update category') },
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: catalogKeys.all }); toast.success('Category deleted') },
    onError: () => { toast.error('Failed to delete category') },
  })
}

export function useCreateMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createMaterial,
    onSuccess: () => { qc.invalidateQueries({ queryKey: catalogKeys.all }); toast.success('Material created') },
    onError: () => { toast.error('Failed to create material') },
  })
}

export function useUpdateMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateMaterial>[1] }) => updateMaterial(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: catalogKeys.all }); toast.success('Material updated') },
    onError: () => { toast.error('Failed to update material') },
  })
}

export function useDeleteMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteMaterial,
    onSuccess: () => { qc.invalidateQueries({ queryKey: catalogKeys.all }); toast.success('Material deleted') },
    onError: () => { toast.error('Failed to delete material') },
  })
}

export function useSetServiceMaterials() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ serviceId, materials }: { serviceId: string; materials: { inventoryItemId: string; suggestedUnitPrice: number }[] }) =>
      setServiceMaterials(serviceId, materials),
    onSuccess: () => { qc.invalidateQueries({ queryKey: catalogKeys.all }); toast.success('Materials updated') },
    onError: () => { toast.error('Failed to update materials') },
  })
}
