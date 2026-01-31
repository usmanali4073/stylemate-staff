import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import staffService from '@/services/staffService';
import type {
  CreateStaffMemberRequest,
  UpdateStaffMemberRequest,
  ChangeStaffStatusRequest,
} from '@/types/staff';

// Query key factory for consistent cache management
export const staffKeys = {
  all: (businessId: string) => ['staff', businessId] as const,
  list: (businessId: string) => [...staffKeys.all(businessId), 'list'] as const,
  detail: (businessId: string, staffId: string) => [...staffKeys.all(businessId), staffId] as const,
  locations: (businessId: string, staffId: string) => [...staffKeys.detail(businessId, staffId), 'locations'] as const,
  services: (businessId: string, staffId: string) => [...staffKeys.detail(businessId, staffId), 'services'] as const,
};

// Query hooks
export function useStaffMembers(businessId: string | null) {
  return useQuery({
    queryKey: staffKeys.list(businessId!),
    queryFn: () => staffService.getStaffMembers(businessId!),
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useStaffMember(businessId: string | null, staffId: string | null) {
  return useQuery({
    queryKey: staffKeys.detail(businessId!, staffId!),
    queryFn: () => staffService.getStaffMember(businessId!, staffId!),
    enabled: !!businessId && !!staffId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useStaffLocations(businessId: string | null, staffId: string | null) {
  return useQuery({
    queryKey: staffKeys.locations(businessId!, staffId!),
    queryFn: () => staffService.getStaffLocations(businessId!, staffId!),
    enabled: !!businessId && !!staffId,
  });
}

export function useStaffServices(businessId: string | null, staffId: string | null) {
  return useQuery({
    queryKey: staffKeys.services(businessId!, staffId!),
    queryFn: () => staffService.getStaffServices(businessId!, staffId!),
    enabled: !!businessId && !!staffId,
  });
}

// Mutation hooks
export function useCreateStaffMember(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStaffMemberRequest) =>
      staffService.createStaffMember(businessId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.list(businessId) });
    },
  });
}

export function useUpdateStaffMember(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ staffId, data }: { staffId: string; data: UpdateStaffMemberRequest }) =>
      staffService.updateStaffMember(businessId, staffId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.list(businessId) });
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(businessId, variables.staffId) });
    },
  });
}

export function useChangeStaffStatus(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ staffId, data }: { staffId: string; data: ChangeStaffStatusRequest }) =>
      staffService.changeStatus(businessId, staffId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.list(businessId) });
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(businessId, variables.staffId) });
    },
  });
}

export function useDeleteStaffMember(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (staffId: string) =>
      staffService.deleteStaffMember(businessId, staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.list(businessId) });
    },
  });
}

export function useToggleBookable(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ staffId, isBookable }: { staffId: string; isBookable: boolean }) =>
      staffService.toggleBookable(businessId, staffId, isBookable),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.list(businessId) });
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(businessId, variables.staffId) });
    },
  });
}

// Location assignment mutations
export function useAssignLocation(businessId: string, staffId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { locationId: string; isPrimary?: boolean }) =>
      staffService.assignLocation(businessId, staffId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.locations(businessId, staffId) });
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(businessId, staffId) });
      queryClient.invalidateQueries({ queryKey: staffKeys.list(businessId) });
    },
  });
}

export function useRemoveLocation(businessId: string, staffId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (locationId: string) =>
      staffService.removeLocation(businessId, staffId, locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.locations(businessId, staffId) });
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(businessId, staffId) });
      queryClient.invalidateQueries({ queryKey: staffKeys.list(businessId) });
    },
  });
}

export function useSetPrimaryLocation(businessId: string, staffId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (locationId: string) =>
      staffService.setPrimaryLocation(businessId, staffId, locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.locations(businessId, staffId) });
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(businessId, staffId) });
      queryClient.invalidateQueries({ queryKey: staffKeys.list(businessId) });
    },
  });
}

// Service assignment mutations
export function useAssignService(businessId: string, staffId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { serviceId: string }) =>
      staffService.assignService(businessId, staffId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.services(businessId, staffId) });
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(businessId, staffId) });
    },
  });
}

export function useRemoveService(businessId: string, staffId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serviceId: string) =>
      staffService.removeService(businessId, staffId, serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.services(businessId, staffId) });
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(businessId, staffId) });
    },
  });
}
