// Role and permission types matching backend DTOs

export interface RolePermissions {
  // Scheduling permissions
  schedulingView: boolean;
  schedulingManage: boolean;

  // Time-off permissions
  timeOffView: boolean;
  timeOffManage: boolean;
  timeOffApprove: boolean;

  // Staff permissions
  staffView: boolean;
  staffManage: boolean;

  // Service permissions
  servicesView: boolean;
  servicesManage: boolean;

  // Client permissions
  clientsView: boolean;
  clientsManage: boolean;

  // Report permissions
  reportsView: boolean;
  reportsExport: boolean;

  // Settings permissions
  settingsView: boolean;
  settingsManage: boolean;
}

export interface RoleResponse {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isImmutable: boolean;
  permissions: RolePermissions;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions?: RolePermissions;
  cloneFromRoleId?: string;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: RolePermissions;
}

export interface PermissionAction {
  name: string;
  description: string;
  enabled: boolean;
}

export interface PermissionArea {
  area: string;
  actions: PermissionAction[];
}

export interface AssignRoleRequest {
  staffMemberId: string;
  locationId: string;
  roleId: string;
}
