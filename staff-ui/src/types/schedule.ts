// Schedule types matching backend DTOs

export type ShiftType = 'Opening' | 'Mid' | 'Closing' | 'Custom';
export type ShiftStatus = 'Pending' | 'Scheduled' | 'Confirmed' | 'Rejected' | 'Completed' | 'Cancelled' | 'NoShow';

export interface ShiftResponse {
  id: string;
  businessId: string;
  staffMemberId: string;
  staffMemberName: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  shiftType: string;
  status: string;
  locationId: string | null;
  locationName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShiftRequest {
  staffMemberId: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  shiftType: string;
  locationId?: string;
  notes?: string;
}

export interface UpdateShiftRequest {
  date?: string;
  startTime?: string;
  endTime?: string;
  shiftType?: string;
  locationId?: string;
  notes?: string;
  status?: string;
}

export interface BulkCreateShiftRequest {
  shifts: CreateShiftRequest[];
}

export interface ShiftConflictResponse {
  type: string;
  message: string;
  severity: string;
}
