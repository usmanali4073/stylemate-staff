import api from './api';
import type {
  RoleResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
  PermissionArea,
  AssignRoleRequest,
} from '../types/role';

const roleApiService = {
  getRoles: (businessId: string) =>
    api.get<RoleResponse[]>(`/api/businesses/${businessId}/roles`).then(r => r.data),

  getRole: (businessId: string, roleId: string) =>
    api.get<RoleResponse>(`/api/businesses/${businessId}/roles/${roleId}`).then(r => r.data),

  createRole: (businessId: string, data: CreateRoleRequest) =>
    api.post<RoleResponse>(`/api/businesses/${businessId}/roles`, data).then(r => r.data),

  updateRole: (businessId: string, roleId: string, data: UpdateRoleRequest) =>
    api.put<RoleResponse>(`/api/businesses/${businessId}/roles/${roleId}`, data).then(r => r.data),

  deleteRole: (businessId: string, roleId: string) =>
    api.delete(`/api/businesses/${businessId}/roles/${roleId}`).then(r => r.data),

  getPermissionAreas: (businessId: string) =>
    api.get<PermissionArea[]>(`/api/businesses/${businessId}/roles/permissions`).then(r => r.data),

  assignRole: (businessId: string, data: AssignRoleRequest) =>
    api.post(`/api/businesses/${businessId}/roles/assign`, data).then(r => r.data),
};

export default roleApiService;
