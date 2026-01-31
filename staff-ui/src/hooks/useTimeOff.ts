import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import timeOffApiService from '@/services/timeOffApiService';
import type {
  CreateTimeOffTypeRequest,
  UpdateTimeOffTypeRequest,
  CreateTimeOffRequestData,
  ApproveTimeOffData,
  DenyTimeOffData,
  TimeOffStatus,
} from '@/types/timeOff';

interface GetTimeOffRequestsParams {
  staffMemberId?: string;
  status?: TimeOffStatus;
}

// Query key factory for consistent cache management
export const timeOffKeys = {
  all: (businessId: string) => ['time-off', businessId] as const,
  types: (businessId: string) => [...timeOffKeys.all(businessId), 'types'] as const,
  requests: (businessId: string, params?: GetTimeOffRequestsParams) =>
    [...timeOffKeys.all(businessId), 'requests', params] as const,
  requestDetail: (businessId: string, requestId: string) =>
    [...timeOffKeys.all(businessId), 'requests', requestId] as const,
  pendingCount: (businessId: string) => [...timeOffKeys.all(businessId), 'pending-count'] as const,
};

// Time-off type query hooks
export function useTimeOffTypes(businessId: string | null) {
  return useQuery({
    queryKey: timeOffKeys.types(businessId!),
    queryFn: () => timeOffApiService.getTimeOffTypes(businessId!),
    enabled: !!businessId,
    staleTime: 10 * 60 * 1000, // 10 minutes - types rarely change
  });
}

// Time-off request query hooks
export function useTimeOffRequests(businessId: string | null, params?: GetTimeOffRequestsParams) {
  return useQuery({
    queryKey: timeOffKeys.requests(businessId!, params),
    queryFn: () => timeOffApiService.getTimeOffRequests(businessId!, params),
    enabled: !!businessId,
    staleTime: 2 * 60 * 1000, // 2 minutes - requests change more frequently
  });
}

export function useTimeOffRequest(businessId: string | null, requestId: string | null) {
  return useQuery({
    queryKey: timeOffKeys.requestDetail(businessId!, requestId!),
    queryFn: () => timeOffApiService.getTimeOffRequest(businessId!, requestId!),
    enabled: !!businessId && !!requestId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function usePendingTimeOffCount(businessId: string | null) {
  return useQuery({
    queryKey: timeOffKeys.pendingCount(businessId!),
    queryFn: () => timeOffApiService.getPendingCount(businessId!),
    enabled: !!businessId,
    staleTime: 1 * 60 * 1000, // 1 minute - count needs to be fresh for notifications
  });
}

// Time-off type mutation hooks
export function useCreateTimeOffType(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTimeOffTypeRequest) =>
      timeOffApiService.createTimeOffType(businessId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeOffKeys.types(businessId) });
    },
  });
}

export function useUpdateTimeOffType(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ typeId, data }: { typeId: string; data: UpdateTimeOffTypeRequest }) =>
      timeOffApiService.updateTimeOffType(businessId, typeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeOffKeys.types(businessId) });
      // Also invalidate requests since they show type name/color
      queryClient.invalidateQueries({ queryKey: [...timeOffKeys.all(businessId), 'requests'] });
    },
  });
}

export function useDeleteTimeOffType(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (typeId: string) =>
      timeOffApiService.deleteTimeOffType(businessId, typeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeOffKeys.types(businessId) });
    },
  });
}

// Time-off request mutation hooks
export function useCreateTimeOffRequest(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTimeOffRequestData) =>
      timeOffApiService.createTimeOffRequest(businessId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...timeOffKeys.all(businessId), 'requests'] });
      queryClient.invalidateQueries({ queryKey: timeOffKeys.pendingCount(businessId) });
      // Also invalidate schedule data since time-off affects availability
      queryClient.invalidateQueries({ queryKey: ['schedule', businessId] });
    },
  });
}

export function useApproveTimeOff(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data?: ApproveTimeOffData }) =>
      timeOffApiService.approveTimeOffRequest(businessId, requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...timeOffKeys.all(businessId), 'requests'] });
      queryClient.invalidateQueries({ queryKey: timeOffKeys.pendingCount(businessId) });
      // Invalidate schedule data since approved time-off affects availability
      queryClient.invalidateQueries({ queryKey: ['schedule', businessId] });
    },
  });
}

export function useDenyTimeOff(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data?: DenyTimeOffData }) =>
      timeOffApiService.denyTimeOffRequest(businessId, requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...timeOffKeys.all(businessId), 'requests'] });
      queryClient.invalidateQueries({ queryKey: timeOffKeys.pendingCount(businessId) });
    },
  });
}

export function useCancelTimeOff(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) =>
      timeOffApiService.cancelTimeOffRequest(businessId, requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...timeOffKeys.all(businessId), 'requests'] });
      queryClient.invalidateQueries({ queryKey: timeOffKeys.pendingCount(businessId) });
      // Invalidate schedule data if cancelled request was approved
      queryClient.invalidateQueries({ queryKey: ['schedule', businessId] });
    },
  });
}
