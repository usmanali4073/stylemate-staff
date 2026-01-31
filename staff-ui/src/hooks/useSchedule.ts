import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import scheduleApiService from '@/services/scheduleApiService';
import type {
  CreateShiftRequest,
  UpdateShiftRequest,
  BulkCreateShiftRequest,
} from '@/types/schedule';

export const scheduleKeys = {
  all: (businessId: string) => ['schedule', businessId] as const,
  list: (businessId: string, startDate: string, endDate: string) =>
    [...scheduleKeys.all(businessId), 'list', startDate, endDate] as const,
  detail: (businessId: string, shiftId: string) =>
    [...scheduleKeys.all(businessId), shiftId] as const,
};

export function useShifts(businessId: string | null, startDate: string, endDate: string, staffMemberId?: string) {
  return useQuery({
    queryKey: [...scheduleKeys.list(businessId!, startDate, endDate), staffMemberId],
    queryFn: () => scheduleApiService.getShifts(businessId!, startDate, endDate, staffMemberId),
    enabled: !!businessId && !!startDate && !!endDate,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateShift(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, forceCreate }: { data: CreateShiftRequest; forceCreate?: boolean }) =>
      scheduleApiService.createShift(businessId, data, forceCreate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all(businessId) });
    },
  });
}

export function useUpdateShift(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shiftId, data }: { shiftId: string; data: UpdateShiftRequest }) =>
      scheduleApiService.updateShift(businessId, shiftId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all(businessId) });
    },
  });
}

export function useDeleteShift(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shiftId: string) =>
      scheduleApiService.deleteShift(businessId, shiftId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all(businessId) });
    },
  });
}

export function useBulkCreateShifts(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, forceCreate }: { data: BulkCreateShiftRequest; forceCreate?: boolean }) =>
      scheduleApiService.bulkCreateShifts(businessId, data, forceCreate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all(businessId) });
    },
  });
}
