// ========================================
// MOCK DATA STORE
// ========================================

// Local type definitions to avoid bundling issues
type UUID = string;
type DateString = string;
type TimeString = string;

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

interface TeamMember {
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
    preferredShifts: ('opening' | 'mid' | 'closing' | 'custom')[];
    unavailableDays: string[];
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

interface BreakPeriod {
  id: UUID;
  startTime: TimeString;
  endTime: TimeString;
  isPaid: boolean;
  notes?: string;
}

interface Shift {
  id: UUID;
  employeeId: UUID;
  date: DateString;
  startTime: TimeString;
  endTime: TimeString;
  shiftType: 'opening' | 'mid' | 'closing' | 'custom';
  position: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  breakTimes: BreakPeriod[];
  notes?: string;
  hourlyRate: number;
  location?: string;
  createdAt: DateString;
  updatedAt: DateString;
  createdBy: UUID;
}

interface BreakRecord {
  id: UUID;
  startTime: Date;
  endTime?: Date;
  duration: number;
  isPaid: boolean;
  notes?: string;
}

interface TimeAdjustment {
  id: UUID;
  type: 'clock-in' | 'clock-out' | 'break' | 'manual-entry';
  originalValue: Date | number;
  adjustedValue: Date | number;
  reason: string;
  adjustedBy: UUID;
  adjustedAt: Date;
}

interface Timesheet {
  id: UUID;
  employeeId: UUID;
  shiftId?: UUID;
  date: DateString;
  clockIn?: Date;
  clockOut?: Date;
  breaks: BreakRecord[];
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  status: 'pending' | 'approved' | 'rejected' | 'needs-review';
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

interface Deduction {
  id: UUID;
  type: 'tax' | 'benefit' | 'advance' | 'garnishment' | 'other';
  name: string;
  amount: number;
  isPercentage: boolean;
  isPreTax: boolean;
}

interface Bonus {
  id: UUID;
  type: 'performance' | 'commission' | 'holiday' | 'other';
  name: string;
  amount: number;
  date: DateString;
  notes?: string;
}

interface PayStub {
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

interface PayrollEmployee {
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

interface PayRun {
  id: UUID;
  name: string;
  periodStart: DateString;
  periodEnd: DateString;
  status: 'draft' | 'processing' | 'completed' | 'paid';
  employees: PayrollEmployee[];
  totalPayroll: number;
  totalHours: number;
  generatedDate: DateString;
  completedDate?: DateString;
  createdBy: UUID;
  notes?: string;
}

interface ShiftTemplate {
  id: UUID;
  name: string;
  shifts: any[];
  daysOfWeek: number[];
  isActive: boolean;
  createdAt: DateString;
}

interface BusinessHours {
  dayOfWeek: number;
  isOpen: boolean;
  openTime?: TimeString;
  closeTime?: TimeString;
  breaks?: BreakPeriod[];
}

interface PayrollSettings {
  payPeriodType: 'weekly' | 'bi-weekly' | 'monthly';
  overtimeThreshold: number;
  overtimeRate: number;
  defaultDeductions: Deduction[];
  payDay: number;
}

interface StaffSettings {
  businessHours: BusinessHours[];
  payrollSettings: PayrollSettings;
  minimumShiftLength: number;
  maximumShiftLength: number;
  requireBreakAfterHours: number;
  minimumBreakLength: number;
  allowSelfScheduling: boolean;
  requireManagerApproval: boolean;
  enableGPSTracking: boolean;
  enablePhotoVerification: boolean;
}

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  todayScheduled: number;
  pendingTimesheets: number;
  thisWeekHours: number;
  thisWeekCost: number;
  upcomingShifts: Shift[];
  recentActivity: any[];
}

// Utility function to generate UUIDs
export const generateId = (): string => {
  return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Date utilities
export const formatDate = (date: Date): string => date.toISOString().split('T')[0];
export const formatTime = (date: Date): string => date.toTimeString().split(' ')[0].substring(0, 5);

// ========================================
// MOCK TEAM MEMBERS
// ========================================

export const mockTeamMembers: TeamMember[] = [
  {
    id: 'tm-001',
    personalInfo: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1 (555) 123-4567',
      address: {
        street: '123 Main St',
        city: 'Seattle',
        state: 'WA',
        zipCode: '98101',
        country: 'USA'
      },
      emergencyContact: {
        name: 'Mike Johnson',
        relationship: 'Spouse',
        phone: '+1 (555) 123-4568'
      },
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      dateOfBirth: '1992-03-15',
      hireDate: '2023-01-15'
    },
    employment: {
      role: 'Senior Stylist',
      department: 'Hair Services',
      employmentType: 'full-time',
      status: 'active',
      hourlyRate: 28.50,
      overtimeRate: 42.75,
      maxHoursPerWeek: 40,
      canManageOthers: true
    },
    availability: {
      preferredShifts: ['opening', 'mid'],
      unavailableDays: ['sunday'],
      maxHoursPerDay: 8,
      canWorkWeekends: true,
      canWorkHolidays: false,
      notes: 'Prefers morning shifts'
    },
    skills: ['Hair Cutting', 'Hair Coloring', 'Highlights', 'Keratin Treatments'],
    notes: 'Excellent with difficult clients. 5+ years experience.',
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: '2024-03-01T14:30:00Z'
  },
  {
    id: 'tm-002',
    personalInfo: {
      firstName: 'Marcus',
      lastName: 'Rodriguez',
      email: 'marcus.rodriguez@email.com',
      phone: '+1 (555) 234-5678',
      address: {
        street: '456 Oak Ave',
        city: 'Seattle',
        state: 'WA',
        zipCode: '98102',
        country: 'USA'
      },
      emergencyContact: {
        name: 'Maria Rodriguez',
        relationship: 'Mother',
        phone: '+1 (555) 234-5679'
      },
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      hireDate: '2023-06-01'
    },
    employment: {
      role: 'Barber',
      department: 'Men\'s Grooming',
      employmentType: 'full-time',
      status: 'active',
      hourlyRate: 25.00,
      overtimeRate: 37.50,
      maxHoursPerWeek: 40,
      canManageOthers: false
    },
    availability: {
      preferredShifts: ['mid', 'closing'],
      unavailableDays: [],
      maxHoursPerDay: 8,
      canWorkWeekends: true,
      canWorkHolidays: true
    },
    skills: ['Men\'s Haircuts', 'Beard Trimming', 'Shaving', 'Hot Towel Service'],
    notes: 'Specializes in classic men\'s cuts and beard work.',
    createdAt: '2023-06-01T09:00:00Z',
    updatedAt: '2024-02-15T11:20:00Z'
  },
  {
    id: 'tm-003',
    personalInfo: {
      firstName: 'Emily',
      lastName: 'Chen',
      email: 'emily.chen@email.com',
      phone: '+1 (555) 345-6789',
      hireDate: '2024-01-10'
    },
    employment: {
      role: 'Junior Stylist',
      department: 'Hair Services',
      employmentType: 'part-time',
      status: 'active',
      hourlyRate: 18.00,
      maxHoursPerWeek: 25,
      canManageOthers: false
    },
    availability: {
      preferredShifts: ['mid'],
      unavailableDays: ['monday', 'tuesday'],
      maxHoursPerDay: 6,
      canWorkWeekends: true,
      canWorkHolidays: false,
      notes: 'Student - available evenings and weekends only'
    },
    skills: ['Basic Cuts', 'Blow Drying', 'Hair Washing'],
    notes: 'Recent graduate from beauty school. Very eager to learn.',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-10T08:00:00Z'
  },
  {
    id: 'tm-004',
    personalInfo: {
      firstName: 'David',
      lastName: 'Thompson',
      email: 'david.thompson@email.com',
      phone: '+1 (555) 456-7890',
      hireDate: '2022-08-20'
    },
    employment: {
      role: 'Receptionist',
      department: 'Front Desk',
      employmentType: 'full-time',
      status: 'active',
      hourlyRate: 16.50,
      overtimeRate: 24.75,
      maxHoursPerWeek: 40,
      canManageOthers: false
    },
    availability: {
      preferredShifts: ['opening'],
      unavailableDays: ['saturday', 'sunday'],
      maxHoursPerDay: 8,
      canWorkWeekends: false,
      canWorkHolidays: false
    },
    skills: ['Customer Service', 'Appointment Scheduling', 'Point of Sale', 'Phone Support'],
    notes: 'Excellent customer service skills. Handles front desk operations.',
    createdAt: '2022-08-20T10:00:00Z',
    updatedAt: '2023-12-01T16:00:00Z'
  },
  {
    id: 'tm-005',
    personalInfo: {
      firstName: 'Lisa',
      lastName: 'Williams',
      email: 'lisa.williams@email.com',
      phone: '+1 (555) 567-8901',
      hireDate: '2021-11-15'
    },
    employment: {
      role: 'Salon Manager',
      department: 'Management',
      employmentType: 'full-time',
      status: 'active',
      hourlyRate: 35.00,
      overtimeRate: 52.50,
      maxHoursPerWeek: 45,
      canManageOthers: true
    },
    availability: {
      preferredShifts: ['opening', 'mid'],
      unavailableDays: [],
      maxHoursPerDay: 9,
      canWorkWeekends: true,
      canWorkHolidays: true
    },
    skills: ['Team Management', 'Inventory Management', 'Staff Training', 'Customer Relations', 'P&L Management'],
    notes: 'Salon manager with 10+ years experience. Handles all operational aspects.',
    createdAt: '2021-11-15T09:00:00Z',
    updatedAt: '2024-01-20T13:45:00Z'
  }
];

// ========================================
// MOCK SHIFTS
// ========================================

const today = new Date();
const getDateString = (daysFromToday: number): string => {
  const date = new Date(today);
  date.setDate(date.getDate() + daysFromToday);
  return formatDate(date);
};

export const mockShifts: Shift[] = [
  // Today's shifts
  {
    id: 'shift-001',
    employeeId: 'tm-004', // David (Receptionist)
    date: getDateString(0),
    startTime: '09:00',
    endTime: '17:00',
    shiftType: 'opening',
    position: 'Front Desk',
    status: 'confirmed',
    breakTimes: [
      {
        id: 'break-001',
        startTime: '12:00',
        endTime: '13:00',
        isPaid: false,
        notes: 'Lunch break'
      }
    ],
    hourlyRate: 16.50,
    location: 'Main Salon',
    createdAt: '2024-09-20T10:00:00Z',
    updatedAt: '2024-09-20T10:00:00Z',
    createdBy: 'tm-005'
  },
  {
    id: 'shift-002',
    employeeId: 'tm-001', // Sarah (Senior Stylist)
    date: getDateString(0),
    startTime: '10:00',
    endTime: '18:00',
    shiftType: 'mid',
    position: 'Styling Station 1',
    status: 'confirmed',
    breakTimes: [
      {
        id: 'break-002',
        startTime: '14:00',
        endTime: '14:15',
        isPaid: true,
        notes: 'Afternoon break'
      }
    ],
    hourlyRate: 28.50,
    location: 'Main Salon',
    createdAt: '2024-09-20T10:00:00Z',
    updatedAt: '2024-09-20T10:00:00Z',
    createdBy: 'tm-005'
  },
  {
    id: 'shift-003',
    employeeId: 'tm-002', // Marcus (Barber)
    date: getDateString(0),
    startTime: '11:00',
    endTime: '19:00',
    shiftType: 'closing',
    position: 'Barber Station',
    status: 'confirmed',
    breakTimes: [
      {
        id: 'break-003',
        startTime: '15:00',
        endTime: '16:00',
        isPaid: false,
        notes: 'Late lunch'
      }
    ],
    hourlyRate: 25.00,
    location: 'Main Salon',
    createdAt: '2024-09-20T10:00:00Z',
    updatedAt: '2024-09-20T10:00:00Z',
    createdBy: 'tm-005'
  },
  // Tomorrow's shifts
  {
    id: 'shift-004',
    employeeId: 'tm-004', // David (Receptionist)
    date: getDateString(1),
    startTime: '09:00',
    endTime: '17:00',
    shiftType: 'opening',
    position: 'Front Desk',
    status: 'scheduled',
    breakTimes: [
      {
        id: 'break-004',
        startTime: '12:00',
        endTime: '13:00',
        isPaid: false,
        notes: 'Lunch break'
      }
    ],
    hourlyRate: 16.50,
    location: 'Main Salon',
    createdAt: '2024-09-21T10:00:00Z',
    updatedAt: '2024-09-21T10:00:00Z',
    createdBy: 'tm-005'
  },
  {
    id: 'shift-005',
    employeeId: 'tm-003', // Emily (Junior Stylist)
    date: getDateString(1),
    startTime: '13:00',
    endTime: '19:00',
    shiftType: 'closing',
    position: 'Styling Station 3',
    status: 'scheduled',
    breakTimes: [
      {
        id: 'break-005',
        startTime: '16:00',
        endTime: '16:15',
        isPaid: true,
        notes: 'Break'
      }
    ],
    hourlyRate: 18.00,
    location: 'Main Salon',
    createdAt: '2024-09-21T10:00:00Z',
    updatedAt: '2024-09-21T10:00:00Z',
    createdBy: 'tm-005'
  }
];

// ========================================
// MOCK TIMESHEETS
// ========================================

export const mockTimesheets: Timesheet[] = [
  {
    id: 'ts-001',
    employeeId: 'tm-001', // Sarah
    shiftId: 'shift-002',
    date: getDateString(-1), // Yesterday
    clockIn: new Date(new Date().setDate(new Date().getDate() - 1)),
    clockOut: new Date(new Date().setDate(new Date().getDate() - 1)),
    breaks: [
      {
        id: 'br-001',
        startTime: new Date(),
        endTime: new Date(),
        duration: 15,
        isPaid: true,
        notes: 'Afternoon break'
      }
    ],
    totalHours: 7.75,
    regularHours: 7.75,
    overtimeHours: 0,
    status: 'pending',
    employeeNotes: 'Normal day, handled 8 clients',
    adjustments: [],
    isManualEntry: false,
    createdAt: getDateString(-1),
    updatedAt: getDateString(-1)
  },
  {
    id: 'ts-002',
    employeeId: 'tm-002', // Marcus
    shiftId: 'shift-003',
    date: getDateString(-1),
    clockIn: new Date(new Date().setDate(new Date().getDate() - 1)),
    clockOut: new Date(new Date().setDate(new Date().getDate() - 1)),
    breaks: [
      {
        id: 'br-002',
        startTime: new Date(),
        endTime: new Date(),
        duration: 60,
        isPaid: false,
        notes: 'Lunch break'
      }
    ],
    totalHours: 7.0,
    regularHours: 7.0,
    overtimeHours: 0,
    status: 'approved',
    employeeNotes: 'Busy day with walk-ins',
    managerNotes: 'Good performance',
    adjustments: [],
    isManualEntry: false,
    approvedBy: 'tm-005',
    approvedAt: getDateString(-1),
    createdAt: getDateString(-1),
    updatedAt: getDateString(-1)
  }
];

// ========================================
// MOCK PAY RUNS
// ========================================

export const mockPayRuns: PayRun[] = [
  {
    id: 'pr-001',
    name: 'Bi-weekly Pay - Sep 9-22, 2024',
    periodStart: '2024-09-09',
    periodEnd: '2024-09-22',
    status: 'completed',
    employees: [],
    totalPayroll: 5420.50,
    totalHours: 164,
    generatedDate: '2024-09-23T10:00:00Z',
    completedDate: '2024-09-23T15:00:00Z',
    createdBy: 'tm-005',
    notes: 'Regular bi-weekly payroll'
  }
];

// ========================================
// MOCK SHIFT TEMPLATES
// ========================================

export const mockShiftTemplates: ShiftTemplate[] = [
  {
    id: 'st-001',
    name: 'Standard Weekday Schedule',
    shifts: [
      {
        employeeId: 'tm-004',
        startTime: '09:00',
        endTime: '17:00',
        shiftType: 'opening',
        position: 'Front Desk'
      },
      {
        employeeId: 'tm-001',
        startTime: '10:00',
        endTime: '18:00',
        shiftType: 'mid',
        position: 'Styling Station 1'
      },
      {
        employeeId: 'tm-002',
        startTime: '11:00',
        endTime: '19:00',
        shiftType: 'closing',
        position: 'Barber Station'
      }
    ],
    daysOfWeek: [1, 2, 3, 4, 5], // Monday through Friday
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

// ========================================
// MOCK STAFF SETTINGS
// ========================================

export const mockStaffSettings: StaffSettings = {
  businessHours: [
    { dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '19:00' }, // Monday
    { dayOfWeek: 2, isOpen: true, openTime: '09:00', closeTime: '19:00' }, // Tuesday
    { dayOfWeek: 3, isOpen: true, openTime: '09:00', closeTime: '19:00' }, // Wednesday
    { dayOfWeek: 4, isOpen: true, openTime: '09:00', closeTime: '19:00' }, // Thursday
    { dayOfWeek: 5, isOpen: true, openTime: '09:00', closeTime: '20:00' }, // Friday
    { dayOfWeek: 6, isOpen: true, openTime: '10:00', closeTime: '18:00' }, // Saturday
    { dayOfWeek: 0, isOpen: false } // Sunday - Closed
  ],
  payrollSettings: {
    payPeriodType: 'bi-weekly',
    overtimeThreshold: 40,
    overtimeRate: 1.5,
    defaultDeductions: [],
    payDay: 26 // 26th of each month for monthly, day of week for weekly
  },
  minimumShiftLength: 3,
  maximumShiftLength: 10,
  requireBreakAfterHours: 6,
  minimumBreakLength: 15,
  allowSelfScheduling: false,
  requireManagerApproval: true,
  enableGPSTracking: false,
  enablePhotoVerification: false
};

// ========================================
// IN-MEMORY DATA STORE
// ========================================

export class MockDataStore {
  private static instance: MockDataStore;

  public teamMembers: TeamMember[] = [...mockTeamMembers];
  public shifts: Shift[] = [...mockShifts];
  public timesheets: Timesheet[] = [...mockTimesheets];
  public payRuns: PayRun[] = [...mockPayRuns];
  public shiftTemplates: ShiftTemplate[] = [...mockShiftTemplates];
  public staffSettings: StaffSettings = { ...mockStaffSettings };

  private constructor() {}

  public static getInstance(): MockDataStore {
    if (!MockDataStore.instance) {
      MockDataStore.instance = new MockDataStore();
    }
    return MockDataStore.instance;
  }

  public reset(): void {
    this.teamMembers = [...mockTeamMembers];
    this.shifts = [...mockShifts];
    this.timesheets = [...mockTimesheets];
    this.payRuns = [...mockPayRuns];
    this.shiftTemplates = [...mockShiftTemplates];
    this.staffSettings = { ...mockStaffSettings };
  }

  // Utility methods
  public findTeamMemberById(id: string): TeamMember | undefined {
    return this.teamMembers.find(member => member.id === id);
  }

  public findShiftById(id: string): Shift | undefined {
    return this.shifts.find(shift => shift.id === id);
  }

  public findTimesheetById(id: string): Timesheet | undefined {
    return this.timesheets.find(timesheet => timesheet.id === id);
  }

  public getActiveTeamMembers(): TeamMember[] {
    return this.teamMembers.filter(member => member.employment.status === 'active');
  }

  public getShiftsByDate(date: string): Shift[] {
    return this.shifts.filter(shift => shift.date === date);
  }

  public getShiftsByEmployee(employeeId: string): Shift[] {
    return this.shifts.filter(shift => shift.employeeId === employeeId);
  }

  public getTimesheetsByEmployee(employeeId: string): Timesheet[] {
    return this.timesheets.filter(timesheet => timesheet.employeeId === employeeId);
  }

  public getPendingTimesheets(): Timesheet[] {
    return this.timesheets.filter(timesheet => timesheet.status === 'pending');
  }

  public calculateDashboardStats(): DashboardStats {
    const activeEmployees = this.getActiveTeamMembers();
    const today = formatDate(new Date());
    const todayShifts = this.getShiftsByDate(today);
    const pendingTimesheets = this.getPendingTimesheets();

    // Calculate this week's hours (simplified)
    const thisWeekHours = this.timesheets
      .filter(ts => ts.status === 'approved')
      .reduce((total, ts) => total + ts.totalHours, 0);

    // Calculate average hourly rate for cost estimation
    const avgRate = activeEmployees.reduce((sum, emp) => sum + emp.employment.hourlyRate, 0) / activeEmployees.length;
    const thisWeekCost = thisWeekHours * avgRate;

    return {
      totalEmployees: this.teamMembers.length,
      activeEmployees: activeEmployees.length,
      todayScheduled: todayShifts.length,
      pendingTimesheets: pendingTimesheets.length,
      thisWeekHours,
      thisWeekCost,
      upcomingShifts: this.shifts
        .filter(shift => new Date(shift.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5),
      recentActivity: [] // TODO: Implement activity tracking
    };
  }
}

export const dataStore = MockDataStore.getInstance();