export type PermissionLevel = 'Basic' | 'Low' | 'Medium' | 'High' | 'Owner';
export type StaffStatus = 'Active' | 'Suspended' | 'Archived';

export interface CreateStaffMemberRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  photoUrl?: string;
  permissionLevel?: PermissionLevel;
  isBookable?: boolean;
  locationIds?: string[];
}

export interface UpdateStaffMemberRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  jobTitle?: string;
  photoUrl?: string;
  permissionLevel?: PermissionLevel;
  isBookable?: boolean;
}

export interface StaffMemberResponse {
  id: string;
  businessId: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  photoUrl: string | null;
  permissionLevel: PermissionLevel;
  status: StaffStatus;
  isBookable: boolean;
  createdAt: string;
  updatedAt: string;
  locations: StaffLocationResponse[];
  hasPendingInvitation: boolean;
}

export interface StaffMemberListResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string | null;
  photoUrl: string | null;
  permissionLevel: PermissionLevel;
  status: StaffStatus;
  isBookable: boolean;
  primaryLocationName: string | null;
}

export interface StaffLocationResponse {
  id: string;
  staffMemberId: string;
  locationId: string;
  locationName: string | null;
  isPrimary: boolean;
  roleId: string | null;
  roleName: string | null;
  assignedAt: string;
}

export interface StaffServiceResponse {
  id: string;
  staffMemberId: string;
  serviceId: string;
  serviceName: string | null;
  assignedAt: string;
}

export interface ChangeStaffStatusRequest {
  status: 'Active' | 'Suspended' | 'Archived';
}
