import { useQuery, useInfiniteQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getStaffMembers,
  getActiveSessions,
  clockIn as apiClockIn,
  clockOut as apiClockOut,
  getAttendance,
  updateSession,
} from '@/shared/api/staff'
import type { StaffSession, AttendanceFilters } from '@/shared/api/staff.types'

export const staffKeys = {
  all: ['staff'] as const,
  members: (department?: string) => [...staffKeys.all, 'members', department] as const,
  activeSessions: (department?: string) => [...staffKeys.all, 'active-sessions', department] as const,
  attendance: (filters: AttendanceFilters) =>
    [...staffKeys.all, 'attendance', filters] as const,
}

export function useStaffMembers(department?: string) {
  return useQuery({
    queryKey: staffKeys.members(department),
    queryFn: () => getStaffMembers(department),
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    placeholderData: keepPreviousData,
  })
}

export function useActiveSessions(department?: string) {
  return useQuery({
    queryKey: staffKeys.activeSessions(department),
    queryFn: () => getActiveSessions(department),
    staleTime: 2 * 60_000,
    gcTime: 30 * 60_000,
    placeholderData: keepPreviousData,
  })
}

export function useAttendance(filters: AttendanceFilters) {
  return useQuery({
    queryKey: staffKeys.attendance(filters),
    queryFn: () => getAttendance(filters),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    placeholderData: keepPreviousData,
  })
}

export function useAttendanceInfinite(filters: AttendanceFilters) {
  return useInfiniteQuery({
    queryKey: staffKeys.attendance(filters),
    queryFn: ({ pageParam }) => getAttendance(filters, pageParam),
    initialPageParam: null as { timeIn: string; id: string } | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })
}

export function useClockIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { staffMemberId?: string; staffName: string; department: string }) =>
      apiClockIn(params),

    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: staffKeys.activeSessions() })

      const previous = queryClient.getQueryData<StaffSession[]>(staffKeys.activeSessions())

      queryClient.setQueryData<StaffSession[]>(staffKeys.activeSessions(), (old) => {
        if (!old) return old
        const key = params.staffMemberId ?? params.staffName
        if (old.some((s) => (s.staffMemberId ?? s.staffName) === key)) return old
        return [
          ...old,
          {
            id: `optimistic-${key}`,
            staffMemberId: params.staffMemberId ?? null,
            staffName: params.staffName,
            department: params.department,
            timeIn: new Date().toISOString(),
            timeOut: null,
            autoLoggedOut: false,
            note: null,
            createdAt: new Date().toISOString(),
          },
        ]
      })

      return { previous }
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(staffKeys.activeSessions(), context.previous)
      }
      toast.error('Failed to clock in')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.activeSessions() })
    },
  })
}

export function useClockOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { staffMemberId: string | null; staffName: string; note?: string }) =>
      apiClockOut(params.staffMemberId, params.staffName, params.note),

    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: staffKeys.activeSessions() })

      const previous = queryClient.getQueryData<StaffSession[]>(staffKeys.activeSessions())

      queryClient.setQueryData<StaffSession[]>(staffKeys.activeSessions(), (old) => {
        if (!old) return old
        const key = params.staffMemberId ?? params.staffName
        return old.filter((s) => (s.staffMemberId ?? s.staffName) !== key)
      })

      return { previous }
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(staffKeys.activeSessions(), context.previous)
      }
      toast.error('Failed to clock out')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.activeSessions() })
      queryClient.invalidateQueries({ queryKey: staffKeys.all })
    },
  })
}

export function useUpdateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { timeIn?: string; timeOut?: string | null } }) =>
      updateSession(id, updates),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all })
      toast.success('Session updated')
    },

    onError: () => {
      toast.error('Failed to update session')
    },
  })
}
