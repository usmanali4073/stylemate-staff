import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import roleApiService from '@/services/roleApiService';
import type {
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignRoleRequest,
} from '@/types/role';

// Query key factory for consistent cache management
export const roleKeys = {
  all: (businessId: string) => ['roles', businessId] as const,
  list: (businessId: string) => [...roleKeys.all(businessId), 'list'] as const,
  detail: (businessId: string, roleId: string) => [...roleKeys.all(businessId), roleId] as const,
  permissions: (businessId: string) => [...roleKeys.all(businessId), 'permissions'] as const,
};

// Query hooks
export function useRoles(businessId: string | null) {
  return useQuery({
    queryKey: roleKeys.list(businessId!),
    queryFn: () => roleApiService.getRoles(businessId!),
    enabled: !!businessId,
    staleTime: 10 * 60 * 1000, // 10 minutes - roles rarely change
  });
}

export function useRole(businessId: string | null, roleId: string | null) {
  return useQuery({
    queryKey: roleKeys.detail(businessId!, roleId!),
    queryFn: () => roleApiService.getRole(businessId!, roleId!),
    enabled: !!businessId && !!roleId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function usePermissionAreas(businessId: string | null) {
  return useQuery({
    queryKey: roleKeys.permissions(businessId!),
    queryFn: () => roleApiService.getPermissionAreas(businessId!),
    enabled: !!businessId,
    staleTime: 30 * 60 * 1000, // 30 minutes - permission structure very stable
  });
}

// Mutation hooks
export function useCreateRole(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoleRequest) =>
      roleApiService.createRole(businessId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.list(businessId) });
    },
  });
}

export function useUpdateRole(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: UpdateRoleRequest }) =>
      roleApiService.updateRole(businessId, roleId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.list(businessId) });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(businessId, variables.roleId) });
    },
  });
}

export function useDeleteRole(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) =>
      roleApiService.deleteRole(businessId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.list(businessId) });
    },
  });
}

export function useAssignRole(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssignRoleRequest) =>
      roleApiService.assignRole(businessId, data),
    onSuccess: (_, variables) => {
      // Invalidate staff member queries since their role changed
      queryClient.invalidateQueries({ queryKey: ['staff', businessId] });
      // Also invalidate the specific staff member's location assignments
      queryClient.invalidateQueries({ queryKey: ['staff', businessId, variables.staffMemberId, 'locations'] });
    },
  });
}
