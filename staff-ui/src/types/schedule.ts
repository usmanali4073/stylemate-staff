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
  patternId: string | null;
  isOverride: boolean;
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

// Recurring shift pattern types
export interface RecurringShiftPatternResponse {
  id: string;
  businessId: string;
  staffMemberId: string;
  staffMemberName: string;
  locationId: string | null;
  locationName: string | null;
  rrule: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  patternStart: string; // yyyy-MM-dd
  patternEnd: string | null; // yyyy-MM-dd
  shiftType: string;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecurringShiftRequest {
  staffMemberId: string;
  locationId?: string;
  rrule: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  patternStart: string; // yyyy-MM-dd
  patternEnd?: string; // yyyy-MM-dd
  shiftType?: string;
  notes?: string;
}

export interface UpdateRecurringShiftRequest {
  locationId?: string;
  rrule?: string;
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  patternEnd?: string; // yyyy-MM-dd
  shiftType?: string;
  notes?: string;
  isActive?: boolean;
}

export interface ShiftOccurrence {
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  staffMemberId: string;
  staffMemberName: string;
  locationId: string | null;
  shiftType: string;
  isFromPattern: boolean;
  patternId: string | null;
  shiftId: string | null;
  notes: string | null;
}

export interface AvailabilitySlot {
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  type: 'shift' | 'time-off';
  source: string; // Description of source (e.g., "Opening shift", "Vacation")
}
