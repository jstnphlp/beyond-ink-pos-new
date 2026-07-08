import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const staffKeys = {
  all: ['staff'] as const,
  members: () => [...staffKeys.all, 'members'] as const,
  activeSessions: () => [...staffKeys.all, 'active-sessions'] as const,
  attendance: (filters: AttendanceFilters) =>
    [...staffKeys.all, 'attendance', filters] as const,
}

// ─── Query Hooks ─────────────────────────────────────────────────────────────

export function useStaffMembers() {
  return useQuery({
    queryKey: staffKeys.members(),
    queryFn: getStaffMembers,
    staleTime: 10 * 60_000, // 10min — staff list rarely changes
    gcTime: 30 * 60_000,
  })
}

export function useActiveSessions() {
  return useQuery({
    queryKey: staffKeys.activeSessions(),
    queryFn: getActiveSessions,
    staleTime: 10_000, // 10s
    refetchInterval: 30_000, // 30s background refresh
    gcTime: 5 * 60_000,
  })
}

export function useAttendance(filters: AttendanceFilters) {
  return useQuery({
    queryKey: staffKeys.attendance(filters),
    queryFn: () => getAttendance(filters),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

// ─── Mutation Hooks ──────────────────────────────────────────────────────────

export function useClockIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ staffMemberId, staffName }: { staffMemberId: string; staffName: string }) =>
      apiClockIn(staffMemberId, staffName),

    onMutate: async ({ staffMemberId, staffName }) => {
      await queryClient.cancelQueries({ queryKey: staffKeys.activeSessions() })

      const previous = queryClient.getQueryData<StaffSession[]>(staffKeys.activeSessions())

      queryClient.setQueryData<StaffSession[]>(staffKeys.activeSessions(), (old) => {
        if (!old) return old
        // Don't add if already present
        if (old.some((s) => s.staffMemberId === staffMemberId)) return old
        return [
          ...old,
          {
            id: `optimistic-${staffMemberId}`,
            staffMemberId,
            staffName,
            timeIn: new Date().toISOString(),
            timeOut: null,
            autoLoggedOut: false,
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
    mutationFn: (staffMemberId: string) => apiClockOut(staffMemberId),

    onMutate: async (staffMemberId) => {
      await queryClient.cancelQueries({ queryKey: staffKeys.activeSessions() })

      const previous = queryClient.getQueryData<StaffSession[]>(staffKeys.activeSessions())

      queryClient.setQueryData<StaffSession[]>(staffKeys.activeSessions(), (old) => {
        if (!old) return old
        return old.filter((s) => s.staffMemberId !== staffMemberId)
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
