import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import invitationService from '@/services/invitationService';
import type { AcceptInvitationRequest } from '@/types/invitation';
import { staffKeys } from './useStaff';

// Query key factory for invitations
export const invitationKeys = {
  all: (businessId: string) => ['invitations', businessId] as const,
  detail: (businessId: string, staffId: string) => [...invitationKeys.all(businessId), staffId] as const,
};

// Query hooks
export function useLatestInvitation(businessId: string | null, staffId: string | null) {
  return useQuery({
    queryKey: invitationKeys.detail(businessId!, staffId!),
    queryFn: () => invitationService.getLatestInvitation(businessId!, staffId!),
    enabled: !!businessId && !!staffId,
    retry: false, // Don't retry on 404 (no invitation exists)
  });
}

// Mutation hooks
export function useSendInvitation(businessId: string, staffId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => invitationService.sendInvitation(businessId, staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.detail(businessId, staffId) });
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(businessId, staffId) });
      queryClient.invalidateQueries({ queryKey: staffKeys.list(businessId) });
    },
  });
}

export function useResendInvitation(businessId: string, staffId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => invitationService.resendInvitation(businessId, staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.detail(businessId, staffId) });
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(businessId, staffId) });
      queryClient.invalidateQueries({ queryKey: staffKeys.list(businessId) });
    },
  });
}

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: (data: AcceptInvitationRequest) =>
      invitationService.acceptInvitation(data),
  });
}
