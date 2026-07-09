import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getPhysicalDistribution,
  getDesignDevDistribution,
  upsertPayoutGiven,
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

export function useMarkPayoutGiven(period: DistributionPeriod) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: upsertPayoutGiven,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: distributionKeys.physical(period) })
      queryClient.invalidateQueries({ queryKey: distributionKeys.design(period) })
      queryClient.invalidateQueries({ queryKey: distributionKeys.dev(period) })
    },
    onError: () => {
      toast.error('Failed to update payout status')
    },
  })
}
