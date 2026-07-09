import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getPhysicalDistribution,
  getDesignDevDistribution,
  getAllWeekGivenStatuses,
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
  allWeekStatuses: (weeks: { periodFrom: string; periodTo: string }[]) =>
    [...distributionKeys.all, 'all-week-statuses', weeks.map((w) => w.periodFrom).join(',')] as const,
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

export function useAllWeekGivenStatuses(weeks: { periodFrom: string; periodTo: string }[]) {
  return useQuery({
    queryKey: distributionKeys.allWeekStatuses(weeks),
    queryFn: () => getAllWeekGivenStatuses(weeks),
    staleTime: 5 * 60_000,
    placeholderData: (prev) => prev,
  })
}

export function useMarkWeekGiven() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markWeekGiven,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: distributionKeys.all })
      toast.success('Payout status updated')
    },
    onError: () => {
      toast.error('Failed to update payout status')
    },
  })
}
