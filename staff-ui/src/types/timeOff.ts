// Time-off types matching backend DTOs

export type TimeOffStatus = 'Pending' | 'Approved' | 'Denied' | 'Cancelled';

export interface TimeOffTypeResponse {
  id: string;
  businessId: string;
  name: string;
  color: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CreateTimeOffTypeRequest {
  name: string;
  color?: string;
}

export interface UpdateTimeOffTypeRequest {
  name?: string;
  color?: string;
  isActive?: boolean;
}

export interface TimeOffRequestResponse {
  id: string;
  businessId: string;
  staffMemberId: string;
  staffMemberName: string;
  timeOffTypeId: string;
  timeOffTypeName: string;
  timeOffTypeColor: string;
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  isAllDay: boolean;
  startTime: string | null; // HH:mm
  endTime: string | null; // HH:mm
  status: TimeOffStatus;
  notes: string | null;
  approvalNotes: string | null;
  approvedByStaffId: string | null;
  approvedByStaffName: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeOffRequestData {
  staffMemberId: string;
  timeOffTypeId: string;
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  isAllDay: boolean;
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  notes?: string;
}

export interface ApproveTimeOffData {
  approvalNotes?: string;
}

export interface DenyTimeOffData {
  approvalNotes?: string;
}
