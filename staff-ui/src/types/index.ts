// ========================================
// STAFF MANAGEMENT SYSTEM - DATA MODELS
// ========================================

// Base Types
export type UUID = string;
export type DateString = string; // ISO format
export type TimeString = string; // HH:MM format

// ========================================
// TEAM MEMBERS
// ========================================

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface TeamMember {
  id: UUID;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address?: Address;
    emergencyContact?: EmergencyContact;
    avatar?: string;
    dateOfBirth?: DateString;
    hireDate: DateString;
  };
  employment: {
    role: string;
    department: string;
    employmentType: 'full-time' | 'part-time' | 'contract' | 'intern';
    status: 'active' | 'inactive' | 'on-leave' | 'terminated';
    hourlyRate: number;
    overtimeRate?: number;
    maxHoursPerWeek?: number;
    canManageOthers: boolean;
  };
  availability: {
    preferredShifts: ShiftType[];
    unavailableDays: string[]; // ['monday', 'tuesday', etc.]
    maxHoursPerDay: number;
    canWorkWeekends: boolean;
    canWorkHolidays: boolean;
    notes?: string;
  };
  skills: string[];
  notes: string;
  createdAt: DateString;
  updatedAt: DateString;
}

export interface CreateTeamMemberData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  employmentType: TeamMember['employment']['employmentType'];
  hourlyRate: number;
  hireDate: DateString;
}

export interface UpdateTeamMemberData extends Partial<Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>> {}

// ========================================
// SCHEDULING
// ========================================

export type ShiftType = 'opening' | 'mid' | 'closing' | 'custom';
export type ShiftStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';

export interface BreakPeriod {
  id: UUID;
  startTime: TimeString;
  endTime: TimeString;
  isPaid: boolean;
  notes?: string;
}

export interface Shift {
  id: UUID;
  employeeId: UUID;
  date: DateString;
  startTime: TimeString;
  endTime: TimeString;
  shiftType: ShiftType;
  position: string;
  status: ShiftStatus;
  breakTimes: BreakPeriod[];
  notes?: string;
  hourlyRate: number;
  location?: string;
  createdAt: DateString;
  updatedAt: DateString;
  createdBy: UUID; // Manager who created the shift
}

export interface CreateShiftData {
  employeeId: UUID;
  date: DateString;
  startTime: TimeString;
  endTime: TimeString;
  shiftType: ShiftType;
  position: string;
  notes?: string;
  location?: string;
}

export interface UpdateShiftData extends Partial<Omit<Shift, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>> {}

export interface ShiftTemplate {
  id: UUID;
  name: string;
  shifts: Omit<CreateShiftData, 'date'>[];
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, etc.
  isActive: boolean;
  createdAt: DateString;
}

export interface ScheduleConflict {
  type: 'double-booking' | 'overtime' | 'availability' | 'break-violation';
  message: string;
  affectedShifts: UUID[];
  severity: 'warning' | 'error';
}

// ========================================
// TIMESHEETS
// ========================================

export type TimesheetStatus = 'pending' | 'approved' | 'rejected' | 'needs-review';

export interface BreakRecord {
  id: UUID;
  startTime: Date;
  endTime?: Date;
  duration: number; // minutes
  isPaid: boolean;
  notes?: string;
}

export interface TimeAdjustment {
  id: UUID;
  type: 'clock-in' | 'clock-out' | 'break' | 'manual-entry';
  originalValue: Date | number;
  adjustedValue: Date | number;
  reason: string;
  adjustedBy: UUID;
  adjustedAt: Date;
}

export interface Timesheet {
  id: UUID;
  employeeId: UUID;
  shiftId?: UUID; // Link to scheduled shift if applicable
  date: DateString;
  clockIn?: Date;
  clockOut?: Date;
  breaks: BreakRecord[];
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  status: TimesheetStatus;
  managerNotes?: string;
  employeeNotes?: string;
  adjustments: TimeAdjustment[];
  isManualEntry: boolean;
  clockInLocation?: { lat: number; lng: number; address: string };
  clockOutLocation?: { lat: number; lng: number; address: string };
  createdAt: DateString;
  updatedAt: DateString;
  approvedBy?: UUID;
  approvedAt?: DateString;
}

export interface CreateTimesheetData {
  employeeId: UUID;
  date: DateString;
  clockIn: Date;
  shiftId?: UUID;
}

export interface ClockInData {
  employeeId: UUID;
  location?: { lat: number; lng: number; address: string };
  notes?: string;
}

export interface ClockOutData {
  timesheetId: UUID;
  location?: { lat: number; lng: number; address: string };
  notes?: string;
}

// ========================================
// PAYROLL
// ========================================

export type PayRunStatus = 'draft' | 'processing' | 'completed' | 'paid';

export interface Deduction {
  id: UUID;
  type: 'tax' | 'benefit' | 'advance' | 'garnishment' | 'other';
  name: string;
  amount: number;
  isPercentage: boolean;
  isPreTax: boolean;
}

export interface Bonus {
  id: UUID;
  type: 'performance' | 'commission' | 'holiday' | 'other';
  name: string;
  amount: number;
  date: DateString;
  notes?: string;
}

export interface PayStub {
  id: UUID;
  employeeId: UUID;
  payRunId: UUID;
  periodStart: DateString;
  periodEnd: DateString;
  hoursBreakdown: {
    regularHours: number;
    overtimeHours: number;
    holidayHours: number;
    sickHours: number;
    vacationHours: number;
  };
  ratesBreakdown: {
    regularRate: number;
    overtimeRate: number;
    holidayRate: number;
  };
  grossPay: number;
  bonuses: Bonus[];
  deductions: Deduction[];
  netPay: number;
  ytdGrossPay: number;
  ytdNetPay: number;
  generatedAt: DateString;
}

export interface PayrollEmployee {
  employeeId: UUID;
  employee: TeamMember;
  timesheets: Timesheet[];
  regularHours: number;
  overtimeHours: number;
  holidayHours: number;
  regularPay: number;
  overtimePay: number;
  holidayPay: number;
  bonuses: Bonus[];
  deductions: Deduction[];
  grossPay: number;
  netPay: number;
  payStub: PayStub;
}

export interface PayRun {
  id: UUID;
  name: string;
  periodStart: DateString;
  periodEnd: DateString;
  status: PayRunStatus;
  employees: PayrollEmployee[];
  totalPayroll: number;
  totalHours: number;
  generatedDate: DateString;
  completedDate?: DateString;
  createdBy: UUID;
  notes?: string;
}

export interface CreatePayRunData {
  name: string;
  periodStart: DateString;
  periodEnd: DateString;
  employeeIds?: UUID[]; // If not provided, includes all active employees
}

// ========================================
// BUSINESS RULES & SETTINGS
// ========================================

export interface BusinessHours {
  dayOfWeek: number; // 0 = Sunday
  isOpen: boolean;
  openTime?: TimeString;
  closeTime?: TimeString;
  breaks?: BreakPeriod[];
}

export interface PayrollSettings {
  payPeriodType: 'weekly' | 'bi-weekly' | 'monthly';
  overtimeThreshold: number; // hours per week
  overtimeRate: number; // multiplier (e.g., 1.5)
  defaultDeductions: Deduction[];
  payDay: number; // day of week for weekly, day of month for monthly
}

export interface StaffSettings {
  businessHours: BusinessHours[];
  payrollSettings: PayrollSettings;
  minimumShiftLength: number; // hours
  maximumShiftLength: number; // hours
  requireBreakAfterHours: number;
  minimumBreakLength: number; // minutes
  allowSelfScheduling: boolean;
  requireManagerApproval: boolean;
  enableGPSTracking: boolean;
  enablePhotoVerification: boolean;
}

// ========================================
// API RESPONSE TYPES
// ========================================

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  details?: any;
}

// Explicit re-exports to fix bundling issues
export type { ApiResponse as ApiResponseType };
export type { PaginatedResponse as PaginatedResponseType };
export type { DashboardStats as DashboardStatsType };

// ========================================
// FILTERING & SEARCH
// ========================================

export interface TeamMemberFilters {
  status?: TeamMember['employment']['status'][];
  roles?: string[];
  departments?: string[];
  employmentTypes?: TeamMember['employment']['employmentType'][];
  skills?: string[];
  search?: string; // name, email, or phone
}

export interface ShiftFilters {
  dateRange?: { start: DateString; end: DateString };
  employeeIds?: UUID[];
  shiftTypes?: ShiftType[];
  statuses?: ShiftStatus[];
  positions?: string[];
}

export interface TimesheetFilters {
  dateRange?: { start: DateString; end: DateString };
  employeeIds?: UUID[];
  statuses?: TimesheetStatus[];
  needsApproval?: boolean;
}

// ========================================
// DASHBOARD & ANALYTICS
// ========================================

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  todayScheduled: number;
  pendingTimesheets: number;
  thisWeekHours: number;
  thisWeekCost: number;
  upcomingShifts: Shift[];
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: UUID;
  type: 'shift-created' | 'timesheet-submitted' | 'employee-added' | 'schedule-published';
  message: string;
  timestamp: Date;
  relatedId?: UUID;
  performedBy: UUID;
}

export interface LaborCostAnalysis {
  period: { start: DateString; end: DateString };
  totalHours: number;
  totalCost: number;
  averageHourlyRate: number;
  overtimeHours: number;
  overtimeCost: number;
  byDepartment: { department: string; hours: number; cost: number }[];
  byEmployee: { employeeId: UUID; hours: number; cost: number }[];
}

// ========================================
// VIEW TYPES FOR SCHEDULING
// ========================================

export type ScheduleViewType = 'daily' | 'weekly' | 'monthly' | 'employee' | 'department';

export interface DaySchedule {
  date: DateString;
  dayName: string;
  shifts: Shift[];
  totalHours: number;
  totalEmployees: number;
  coverage: { [timeSlot: string]: number }; // number of employees per hour
}

export interface WeekSchedule {
  weekStart: DateString;
  weekEnd: DateString;
  days: DaySchedule[];
  totalHours: number;
  totalCost: number;
  employeesScheduled: UUID[];
}

export interface EmployeeScheduleView {
  employeeId: UUID;
  employee: TeamMember;
  shifts: Shift[];
  totalHours: number;
  upcomingShifts: Shift[];
  availability: TeamMember['availability'];
}