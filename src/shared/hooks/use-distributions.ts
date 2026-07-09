import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getPhysicalDistribution,
  getDesignDevDistribution,
  getWeekGivenStatuses,
  markWeekGiven,
} from '@/shared/api/distributions'
import type { DistributionPeriod } from '@/shared/api/distributions.types'

export const distributionKeys = {
  all: ['distributions'] as const,
  physical: (period: DistributionPeriod) =>
    [...distributionKeys.all, 'physical', period] as const,
  design: (period: DistributionPeriod) =>
    [...distributionKeys.all, 'design', period] as const,
  dev: (period: DistributionPeriod) =>
    [...distributionKeys.all, 'dev', period] as const,
  weekStatus: (periodFrom: string, periodTo: string) =>
    [...distributionKeys.all, 'week-status', periodFrom, periodTo] as const,
}

export function usePhysicalDistribution(period: DistributionPeriod) {
  return useQuery({
    queryKey: distributionKeys.physical(period),
    queryFn: () => getPhysicalDistribution(period),
    staleTime: 5 * 60_000,
  })
}

export function useDesignDistribution(period: DistributionPeriod) {
  return useQuery({
    queryKey: distributionKeys.design(period),
    queryFn: () => getDesignDevDistribution('design_dept', period),
    staleTime: 5 * 60_000,
  })
}

export function useDevDistribution(period: DistributionPeriod) {
  return useQuery({
    queryKey: distributionKeys.dev(period),
    queryFn: () => getDesignDevDistribution('dev_dept', period),
    staleTime: 5 * 60_000,
  })
}

export function useWeekGivenStatuses(periodFrom: string, periodTo: string) {
  return useQuery({
    queryKey: distributionKeys.weekStatus(periodFrom, periodTo),
    queryFn: () => getWeekGivenStatuses(periodFrom, periodTo),
    staleTime: 5 * 60_000,
  })
}

export function useMarkWeekGiven() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markWeekGiven,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: distributionKeys.weekStatus(variables.periodFrom, variables.periodTo),
      })
      queryClient.invalidateQueries({ queryKey: distributionKeys.all })
      toast.success(variables.given ? 'Week marked as given' : 'Week marked as unpaid')
    },
    onError: () => {
      toast.error('Failed to update payout status')
    },
  })
}
