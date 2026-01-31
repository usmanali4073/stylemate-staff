import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import scheduleApiService from '@/services/scheduleApiService';
import type {
  CreateShiftRequest,
  UpdateShiftRequest,
  BulkCreateShiftRequest,
  CreateRecurringShiftRequest,
  UpdateRecurringShiftRequest,
} from '@/types/schedule';

export const scheduleKeys = {
  all: (businessId: string) => ['schedule', businessId] as const,
  list: (businessId: string, startDate: string, endDate: string) =>
    [...scheduleKeys.all(businessId), 'list', startDate, endDate] as const,
  detail: (businessId: string, shiftId: string) =>
    [...scheduleKeys.all(businessId), shiftId] as const,
  recurringPatterns: (businessId: string, staffMemberId?: string) =>
    [...scheduleKeys.all(businessId), 'recurring', staffMemberId] as const,
  recurringPattern: (businessId: string, patternId: string) =>
    [...scheduleKeys.all(businessId), 'recurring', patternId] as const,
  occurrences: (businessId: string, startDate: string, endDate: string, staffMemberId?: string, locationId?: string) =>
    [...scheduleKeys.all(businessId), 'occurrences', startDate, endDate, staffMemberId, locationId] as const,
  availability: (businessId: string, staffMemberId: string, startDate: string, endDate: string) =>
    [...scheduleKeys.all(businessId), 'availability', staffMemberId, startDate, endDate] as const,
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

// Recurring pattern query hooks
export function useRecurringPatterns(businessId: string | null, staffMemberId?: string) {
  return useQuery({
    queryKey: scheduleKeys.recurringPatterns(businessId!, staffMemberId),
    queryFn: () => scheduleApiService.getRecurringPatterns(businessId!, staffMemberId),
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRecurringPattern(businessId: string | null, patternId: string | null) {
  return useQuery({
    queryKey: scheduleKeys.recurringPattern(businessId!, patternId!),
    queryFn: () => scheduleApiService.getRecurringPattern(businessId!, patternId!),
    enabled: !!businessId && !!patternId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Recurring pattern mutation hooks
export function useCreateRecurringPattern(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRecurringShiftRequest) =>
      scheduleApiService.createRecurringPattern(businessId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all(businessId) });
    },
  });
}

export function useUpdateRecurringPattern(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ patternId, data }: { patternId: string; data: UpdateRecurringShiftRequest }) =>
      scheduleApiService.updateRecurringPattern(businessId, patternId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all(businessId) });
    },
  });
}

export function useDeleteRecurringPattern(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patternId: string) =>
      scheduleApiService.deleteRecurringPattern(businessId, patternId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all(businessId) });
    },
  });
}

// Combined occurrences and availability query hooks
export function useShiftOccurrences(
  businessId: string | null,
  startDate: string,
  endDate: string,
  staffMemberId?: string,
  locationId?: string
) {
  return useQuery({
    queryKey: scheduleKeys.occurrences(businessId!, startDate, endDate, staffMemberId, locationId),
    queryFn: () => scheduleApiService.getShiftOccurrences(businessId!, startDate, endDate, staffMemberId, locationId),
    enabled: !!businessId && !!startDate && !!endDate,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useAvailability(
  businessId: string | null,
  staffMemberId: string | null,
  startDate: string,
  endDate: string
) {
  return useQuery({
    queryKey: scheduleKeys.availability(businessId!, staffMemberId!, startDate, endDate),
    queryFn: () => scheduleApiService.getAvailability(businessId!, staffMemberId!, startDate, endDate),
    enabled: !!businessId && !!staffMemberId && !!startDate && !!endDate,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
