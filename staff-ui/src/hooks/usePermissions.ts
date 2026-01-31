import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import staffService from '@/services/staffService';
import roleApiService from '@/services/roleApiService';
import type { RoleResponse } from '@/types/role';

/**
 * Hook to check current user's permissions at a specific location.
 *
 * Returns:
 * - can(permission): Function to check if user has a specific permission
 * - isLoading: Whether permission data is still loading
 * - role: The user's role at the specified location (or null)
 *
 * Usage:
 * const { can, isLoading, role } = usePermissions(businessId, locationId);
 * if (can('Scheduling.Manage')) {
 *   // Show "Add Shift" button
 * }
 */
export function usePermissions(businessId: string | null, locationId: string | null) {
  // Fetch current user's staff profile
  const { data: staffProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['staff', businessId, 'me'],
    queryFn: () => staffService.getCurrentUserProfile(businessId!),
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Find the staff location for the specified location
  const staffLocation = useMemo(() => {
    if (!staffProfile || !locationId) return null;
    return staffProfile.locations.find(loc => loc.locationId === locationId);
  }, [staffProfile, locationId]);

  // Fetch the role if the staff location has a roleId
  const { data: role, isLoading: isLoadingRole } = useQuery({
    queryKey: ['roles', businessId, staffLocation?.roleId],
    queryFn: () => roleApiService.getRole(businessId!, staffLocation!.roleId!),
    enabled: !!businessId && !!staffLocation?.roleId,
    staleTime: 10 * 60 * 1000, // 10 minutes - roles rarely change
  });

  const isLoading = isLoadingProfile || isLoadingRole;

  // Create the permission checker function
  const can = useMemo(() => {
    return (permission: string): boolean => {
      if (!role) return false;

      // Parse permission string (e.g., "Scheduling.Manage" -> area: "scheduling", action: "manage")
      const [area, action] = permission.split('.').map(s => s.toLowerCase());

      // Map permission string to RolePermissions property name
      const permissionKey = `${area}${action.charAt(0).toUpperCase()}${action.slice(1)}`;

      // Check if the permission exists and is enabled
      return (role.permissions as Record<string, boolean>)[permissionKey] === true;
    };
  }, [role]);

  return {
    can,
    isLoading,
    role: role ?? null,
  };
}

/**
 * Hook to check current user's permissions across all locations.
 * Useful for global features that don't depend on a specific location.
 *
 * Returns the role from the user's primary location, or the first available role.
 */
export function useGlobalPermissions(businessId: string | null) {
  // Fetch current user's staff profile
  const { data: staffProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['staff', businessId, 'me'],
    queryFn: () => staffService.getCurrentUserProfile(businessId!),
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Find primary location or first location with a role
  const staffLocation = useMemo(() => {
    if (!staffProfile) return null;
    const primary = staffProfile.locations.find(loc => loc.isPrimary && loc.roleId);
    if (primary) return primary;
    return staffProfile.locations.find(loc => loc.roleId) ?? null;
  }, [staffProfile]);

  // Fetch the role
  const { data: role, isLoading: isLoadingRole } = useQuery({
    queryKey: ['roles', businessId, staffLocation?.roleId],
    queryFn: () => roleApiService.getRole(businessId!, staffLocation!.roleId!),
    enabled: !!businessId && !!staffLocation?.roleId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const isLoading = isLoadingProfile || isLoadingRole;

  // Create the permission checker function
  const can = useMemo(() => {
    return (permission: string): boolean => {
      if (!role) return false;

      const [area, action] = permission.split('.').map(s => s.toLowerCase());
      const permissionKey = `${area}${action.charAt(0).toUpperCase()}${action.slice(1)}`;

      return (role.permissions as Record<string, boolean>)[permissionKey] === true;
    };
  }, [role]);

  return {
    can,
    isLoading,
    role: role ?? null,
  };
}
