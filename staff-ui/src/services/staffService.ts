import api from './api';
import type {
  CreateStaffMemberRequest,
  UpdateStaffMemberRequest,
  StaffMemberResponse,
  StaffMemberListResponse,
  StaffLocationResponse,
  StaffServiceResponse,
  ChangeStaffStatusRequest,
} from '../types/staff';

const staffService = {
  getStaffMembers: (businessId: string) =>
    api.get<StaffMemberListResponse[]>(`/api/businesses/${businessId}/staff`).then(r => r.data),

  getStaffMember: (businessId: string, staffId: string) =>
    api.get<StaffMemberResponse>(`/api/businesses/${businessId}/staff/${staffId}`).then(r => r.data),

  createStaffMember: (businessId: string, data: CreateStaffMemberRequest) =>
    api.post<StaffMemberResponse>(`/api/businesses/${businessId}/staff`, data).then(r => r.data),

  updateStaffMember: (businessId: string, staffId: string, data: UpdateStaffMemberRequest) =>
    api.put<StaffMemberResponse>(`/api/businesses/${businessId}/staff/${staffId}`, data).then(r => r.data),

  changeStatus: (businessId: string, staffId: string, data: ChangeStaffStatusRequest) =>
    api.put(`/api/businesses/${businessId}/staff/${staffId}/status`, data).then(r => r.data),

  deleteStaffMember: (businessId: string, staffId: string) =>
    api.delete(`/api/businesses/${businessId}/staff/${staffId}`).then(r => r.data),

  toggleBookable: (businessId: string, staffId: string, isBookable: boolean) =>
    api.put(`/api/businesses/${businessId}/staff/${staffId}/bookable`, { isBookable }).then(r => r.data),

  // Location assignments
  getStaffLocations: (businessId: string, staffId: string) =>
    api.get<StaffLocationResponse[]>(`/api/businesses/${businessId}/staff/${staffId}/locations`).then(r => r.data),

  assignLocation: (businessId: string, staffId: string, data: { locationId: string; isPrimary?: boolean }) =>
    api.post<StaffLocationResponse>(`/api/businesses/${businessId}/staff/${staffId}/locations`, data).then(r => r.data),

  removeLocation: (businessId: string, staffId: string, locationId: string) =>
    api.delete(`/api/businesses/${businessId}/staff/${staffId}/locations/${locationId}`).then(r => r.data),

  setPrimaryLocation: (businessId: string, staffId: string, locationId: string) =>
    api.put(`/api/businesses/${businessId}/staff/${staffId}/locations/${locationId}/primary`).then(r => r.data),

  // Service assignments
  getStaffServices: (businessId: string, staffId: string) =>
    api.get<StaffServiceResponse[]>(`/api/businesses/${businessId}/staff/${staffId}/services`).then(r => r.data),

  assignService: (businessId: string, staffId: string, data: { serviceId: string }) =>
    api.post<StaffServiceResponse>(`/api/businesses/${businessId}/staff/${staffId}/services`, data).then(r => r.data),

  removeService: (businessId: string, staffId: string, serviceId: string) =>
    api.delete(`/api/businesses/${businessId}/staff/${staffId}/services/${serviceId}`).then(r => r.data),
};

export default staffService;
