// ========================================
// SCHEDULE SERVICE - Shift Management
// ========================================

import { dataStore, generateId } from './mockData';
import type {
  ApiResponse,
  Shift,
  CreateShiftData,
  UpdateShiftData,
  ShiftFilters,
  ScheduleConflict,
  DaySchedule,
  WeekSchedule
} from '../types';

export class ScheduleService {
  private static instance: ScheduleService;

  private constructor() {}

  // Get team members for scheduling
  async getTeamMembers(): Promise<ApiResponse<any[]>> {
    try {
      const teamMembers = dataStore.teamMembers.filter(member =>
        member.employment.status === 'active'
      );

      return {
        success: true,
        message: 'Team members retrieved successfully',
        data: teamMembers
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve team members',
        data: []
      };
    }
  }

  // Get weekly schedule with shifts
  async getWeeklySchedule(weekDate: Date): Promise<ApiResponse<any[]>> {
    try {
      // Get start and end of week
      const startOfWeek = new Date(weekDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
      startOfWeek.setDate(diff);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      // Filter shifts for the week
      const weeklyShifts = dataStore.shifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate >= startOfWeek && shiftDate <= endOfWeek;
      });

      return {
        success: true,
        message: 'Weekly schedule retrieved successfully',
        data: weeklyShifts
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve weekly schedule',
        data: []
      };
    }
  }

  public static getInstance(): ScheduleService {
    if (!ScheduleService.instance) {
      ScheduleService.instance = new ScheduleService();
    }
    return ScheduleService.instance;
  }

  // ========================================
  // CRUD OPERATIONS
  // ========================================

  async getSchedule(
    startDate: string,
    endDate: string,
    filters?: ShiftFilters
  ): Promise<ApiResponse<Shift[]>> {
    try {
      let shifts = dataStore.shifts.filter(
        shift => shift.date >= startDate && shift.date <= endDate
      );

      // Apply filters
      if (filters) {
        if (filters.employeeIds && filters.employeeIds.length > 0) {
          shifts = shifts.filter(shift => filters.employeeIds!.includes(shift.employeeId));
        }

        if (filters.shiftTypes && filters.shiftTypes.length > 0) {
          shifts = shifts.filter(shift => filters.shiftTypes!.includes(shift.shiftType));
        }

        if (filters.statuses && filters.statuses.length > 0) {
          shifts = shifts.filter(shift => filters.statuses!.includes(shift.status));
        }

        if (filters.positions && filters.positions.length > 0) {
          shifts = shifts.filter(shift => filters.positions!.includes(shift.position));
        }
      }

      // Sort by date and start time
      shifts.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        data: shifts,
        message: 'Schedule retrieved successfully',
        success: true
      };
    } catch (error) {
      return {
        data: [],
        message: 'Failed to retrieve schedule',
        success: false
      };
    }
  }

  async getShift(id: string): Promise<ApiResponse<Shift | null>> {
    try {
      const shift = dataStore.findShiftById(id);

      await new Promise(resolve => setTimeout(resolve, 50));

      if (!shift) {
        return {
          data: null,
          message: 'Shift not found',
          success: false
        };
      }

      return {
        data: shift,
        message: 'Shift retrieved successfully',
        success: true
      };
    } catch (error) {
      return {
        data: null,
        message: 'Failed to retrieve shift',
        success: false
      };
    }
  }

  async createShift(data: CreateShiftData): Promise<ApiResponse<Shift>> {
    try {
      // Validate employee exists
      const employee = dataStore.findTeamMemberById(data.employeeId);
      if (!employee) {
        return {
          data: {} as Shift,
          message: 'Employee not found',
          success: false
        };
      }

      // Check for conflicts
      const conflicts = await this.checkConflicts({
        employeeId: data.employeeId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime
      });

      if (conflicts.some(conflict => conflict.severity === 'error')) {
        return {
          data: {} as Shift,
          message: conflicts.find(c => c.severity === 'error')?.message || 'Scheduling conflict detected',
          success: false
        };
      }

      // Create new shift
      const newShift: Shift = {
        id: generateId(),
        employeeId: data.employeeId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        shiftType: data.shiftType,
        position: data.position,
        status: 'scheduled',
        breakTimes: [],
        notes: data.notes || '',
        hourlyRate: employee.employment.hourlyRate,
        location: data.location || 'Main Location',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current-user' // TODO: Get from auth context
      };

      // Add automatic break if shift is long enough
      const shiftDuration = this.calculateShiftDuration(data.startTime, data.endTime);
      if (shiftDuration >= dataStore.staffSettings.requireBreakAfterHours) {
        const breakStart = this.calculateBreakTime(data.startTime, data.endTime);
        newShift.breakTimes.push({
          id: generateId(),
          startTime: breakStart,
          endTime: this.addMinutesToTime(breakStart, dataStore.staffSettings.minimumBreakLength),
          isPaid: false,
          notes: 'Auto-generated break'
        });
      }

      dataStore.shifts.push(newShift);

      await new Promise(resolve => setTimeout(resolve, 200));

      return {
        data: newShift,
        message: 'Shift created successfully',
        success: true
      };
    } catch (error) {
      return {
        data: {} as Shift,
        message: 'Failed to create shift',
        success: false
      };
    }
  }

  async updateShift(id: string, data: UpdateShiftData): Promise<ApiResponse<Shift>> {
    try {
      const shiftIndex = dataStore.shifts.findIndex(shift => shift.id === id);

      if (shiftIndex === -1) {
        return {
          data: {} as Shift,
          message: 'Shift not found',
          success: false
        };
      }

      const currentShift = dataStore.shifts[shiftIndex];

      // If changing time or employee, check for conflicts
      if (data.employeeId || data.date || data.startTime || data.endTime) {
        const conflicts = await this.checkConflicts({
          employeeId: data.employeeId || currentShift.employeeId,
          date: data.date || currentShift.date,
          startTime: data.startTime || currentShift.startTime,
          endTime: data.endTime || currentShift.endTime
        }, id); // Exclude current shift from conflict check

        if (conflicts.some(conflict => conflict.severity === 'error')) {
          return {
            data: {} as Shift,
            message: conflicts.find(c => c.severity === 'error')?.message || 'Scheduling conflict detected',
            success: false
          };
        }
      }

      // Update hourly rate if employee changed
      let updatedHourlyRate = currentShift.hourlyRate;
      if (data.employeeId && data.employeeId !== currentShift.employeeId) {
        const newEmployee = dataStore.findTeamMemberById(data.employeeId);
        if (newEmployee) {
          updatedHourlyRate = newEmployee.employment.hourlyRate;
        }
      }

      const updatedShift: Shift = {
        ...currentShift,
        ...data,
        hourlyRate: updatedHourlyRate,
        updatedAt: new Date().toISOString()
      };

      dataStore.shifts[shiftIndex] = updatedShift;

      await new Promise(resolve => setTimeout(resolve, 150));

      return {
        data: updatedShift,
        message: 'Shift updated successfully',
        success: true
      };
    } catch (error) {
      return {
        data: {} as Shift,
        message: 'Failed to update shift',
        success: false
      };
    }
  }

  async deleteShift(id: string): Promise<ApiResponse<boolean>> {
    try {
      const shiftIndex = dataStore.shifts.findIndex(shift => shift.id === id);

      if (shiftIndex === -1) {
        return {
          data: false,
          message: 'Shift not found',
          success: false
        };
      }

      const shift = dataStore.shifts[shiftIndex];

      // Check if shift has associated timesheet
      const hasTimesheet = dataStore.timesheets.some(ts => ts.shiftId === id);
      if (hasTimesheet) {
        return {
          data: false,
          message: 'Cannot delete shift with existing timesheet records',
          success: false
        };
      }

      // Check if shift is in the past
      const shiftDate = new Date(shift.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (shiftDate < today) {
        return {
          data: false,
          message: 'Cannot delete past shifts',
          success: false
        };
      }

      dataStore.shifts.splice(shiftIndex, 1);

      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        data: true,
        message: 'Shift deleted successfully',
        success: true
      };
    } catch (error) {
      return {
        data: false,
        message: 'Failed to delete shift',
        success: false
      };
    }
  }

  // ========================================
  // SCHEDULING VIEWS
  // ========================================

  async getDaySchedule(date: string): Promise<ApiResponse<DaySchedule>> {
    try {
      const shifts = dataStore.getShiftsByDate(date);
      const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });

      const coverage: { [timeSlot: string]: number } = {};
      let totalHours = 0;

      // Calculate coverage and total hours
      shifts.forEach(shift => {
        const duration = this.calculateShiftDuration(shift.startTime, shift.endTime);
        totalHours += duration;

        // Track hourly coverage (simplified)
        const startHour = parseInt(shift.startTime.split(':')[0]);
        const endHour = parseInt(shift.endTime.split(':')[0]);

        for (let hour = startHour; hour < endHour; hour++) {
          const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
          coverage[timeSlot] = (coverage[timeSlot] || 0) + 1;
        }
      });

      const uniqueEmployees = new Set(shifts.map(shift => shift.employeeId));

      const daySchedule: DaySchedule = {
        date,
        dayName,
        shifts,
        totalHours,
        totalEmployees: uniqueEmployees.size,
        coverage
      };

      await new Promise(resolve => setTimeout(resolve, 50));

      return {
        data: daySchedule,
        message: 'Day schedule retrieved successfully',
        success: true
      };
    } catch (error) {
      return {
        data: {} as DaySchedule,
        message: 'Failed to retrieve day schedule',
        success: false
      };
    }
  }

  async getWeekSchedule(weekStartDate: string): Promise<ApiResponse<WeekSchedule>> {
    try {
      const weekStart = new Date(weekStartDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const days: DaySchedule[] = [];
      let totalHours = 0;
      let totalCost = 0;
      const employeesScheduled = new Set<string>();

      // Get each day of the week
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(weekStart);
        currentDate.setDate(currentDate.getDate() + i);
        const dateString = currentDate.toISOString().split('T')[0];

        const dayScheduleResponse = await this.getDaySchedule(dateString);
        if (dayScheduleResponse.success) {
          days.push(dayScheduleResponse.data);
          totalHours += dayScheduleResponse.data.totalHours;

          // Calculate cost
          dayScheduleResponse.data.shifts.forEach(shift => {
            const duration = this.calculateShiftDuration(shift.startTime, shift.endTime);
            totalCost += duration * shift.hourlyRate;
            employeesScheduled.add(shift.employeeId);
          });
        }
      }

      const weekSchedule: WeekSchedule = {
        weekStart: weekStartDate,
        weekEnd: weekEnd.toISOString().split('T')[0],
        days,
        totalHours,
        totalCost,
        employeesScheduled: Array.from(employeesScheduled)
      };

      return {
        data: weekSchedule,
        message: 'Week schedule retrieved successfully',
        success: true
      };
    } catch (error) {
      return {
        data: {} as WeekSchedule,
        message: 'Failed to retrieve week schedule',
        success: false
      };
    }
  }

  // ========================================
  // CONFLICT CHECKING
  // ========================================

  async checkConflicts(
    shiftData: {
      employeeId: string;
      date: string;
      startTime: string;
      endTime: string;
    },
    excludeShiftId?: string
  ): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = [];

    try {
      const employee = dataStore.findTeamMemberById(shiftData.employeeId);
      if (!employee) {
        conflicts.push({
          type: 'availability',
          message: 'Employee not found',
          affectedShifts: [],
          severity: 'error'
        });
        return conflicts;
      }

      // Check employee availability
      const dayOfWeek = new Date(shiftData.date).getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];

      if (employee.availability.unavailableDays.includes(dayName)) {
        conflicts.push({
          type: 'availability',
          message: `${employee.personalInfo.firstName} is not available on ${dayName}s`,
          affectedShifts: [],
          severity: 'error'
        });
      }

      // Check weekend availability
      if ((dayOfWeek === 0 || dayOfWeek === 6) && !employee.availability.canWorkWeekends) {
        conflicts.push({
          type: 'availability',
          message: `${employee.personalInfo.firstName} cannot work weekends`,
          affectedShifts: [],
          severity: 'error'
        });
      }

      // Check shift duration against max hours per day
      const shiftDuration = this.calculateShiftDuration(shiftData.startTime, shiftData.endTime);
      if (shiftDuration > employee.availability.maxHoursPerDay) {
        conflicts.push({
          type: 'overtime',
          message: `Shift duration (${shiftDuration}h) exceeds employee's daily limit (${employee.availability.maxHoursPerDay}h)`,
          affectedShifts: [],
          severity: 'warning'
        });
      }

      // Check for double booking
      const existingShifts = dataStore.shifts.filter(
        shift => shift.employeeId === shiftData.employeeId &&
        shift.date === shiftData.date &&
        shift.id !== excludeShiftId
      );

      for (const existingShift of existingShifts) {
        if (this.timesOverlap(
          shiftData.startTime,
          shiftData.endTime,
          existingShift.startTime,
          existingShift.endTime
        )) {
          conflicts.push({
            type: 'double-booking',
            message: `Conflicts with existing shift from ${existingShift.startTime} to ${existingShift.endTime}`,
            affectedShifts: [existingShift.id],
            severity: 'error'
          });
        }
      }

      // Check weekly overtime
      const weekStart = this.getWeekStart(shiftData.date);
      const weekEnd = this.getWeekEnd(shiftData.date);
      const weekShifts = dataStore.shifts.filter(
        shift => shift.employeeId === shiftData.employeeId &&
        shift.date >= weekStart &&
        shift.date <= weekEnd &&
        shift.id !== excludeShiftId
      );

      const weeklyHours = weekShifts.reduce((total, shift) => {
        return total + this.calculateShiftDuration(shift.startTime, shift.endTime);
      }, 0) + shiftDuration;

      const overtimeThreshold = dataStore.staffSettings.payrollSettings.overtimeThreshold;
      if (weeklyHours > overtimeThreshold) {
        conflicts.push({
          type: 'overtime',
          message: `Total weekly hours (${weeklyHours.toFixed(1)}h) will exceed overtime threshold (${overtimeThreshold}h)`,
          affectedShifts: weekShifts.map(s => s.id),
          severity: 'warning'
        });
      }

    } catch (error) {
      conflicts.push({
        type: 'availability',
        message: 'Error checking conflicts',
        affectedShifts: [],
        severity: 'error'
      });
    }

    return conflicts;
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  private calculateShiftDuration(startTime: string, endTime: string): number {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    let duration = end - start;

    // Handle overnight shifts
    if (duration < 0) {
      duration += 24 * 60;
    }

    return duration / 60; // Convert to hours
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private addMinutesToTime(time: string, minutes: number): string {
    const totalMinutes = this.timeToMinutes(time) + minutes;
    return this.minutesToTime(totalMinutes);
  }

  private calculateBreakTime(startTime: string, endTime: string): string {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    const midpoint = start + (end - start) / 2;
    return this.minutesToTime(midpoint);
  }

  private timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const s1 = this.timeToMinutes(start1);
    const e1 = this.timeToMinutes(end1);
    const s2 = this.timeToMinutes(start2);
    const e2 = this.timeToMinutes(end2);

    return s1 < e2 && s2 < e1;
  }

  private getWeekStart(date: string): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Adjust to Monday start
    const weekStart = new Date(d.setDate(diff));
    return weekStart.toISOString().split('T')[0];
  }

  private getWeekEnd(date: string): string {
    const weekStart = new Date(this.getWeekStart(date));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return weekEnd.toISOString().split('T')[0];
  }

  // ========================================
  // ADVANCED FEATURES
  // ========================================

  async bulkCreateShifts(shifts: CreateShiftData[]): Promise<ApiResponse<Shift[]>> {
    try {
      const createdShifts: Shift[] = [];
      const errors: string[] = [];

      for (const shiftData of shifts) {
        const result = await this.createShift(shiftData);
        if (result.success) {
          createdShifts.push(result.data);
        } else {
          errors.push(`${shiftData.employeeId} on ${shiftData.date}: ${result.message}`);
        }
      }

      if (errors.length === shifts.length) {
        return {
          data: [],
          message: `Failed to create any shifts: ${errors.join(', ')}`,
          success: false
        };
      }

      return {
        data: createdShifts,
        message: `Created ${createdShifts.length} shifts${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
        success: true
      };
    } catch (error) {
      return {
        data: [],
        message: 'Failed to create bulk shifts',
        success: false
      };
    }
  }

  async publishSchedule(startDate: string, endDate: string): Promise<ApiResponse<boolean>> {
    try {
      const shifts = dataStore.shifts.filter(
        shift => shift.date >= startDate &&
        shift.date <= endDate &&
        shift.status === 'scheduled'
      );

      // Update all shifts to confirmed status
      shifts.forEach(shift => {
        shift.status = 'confirmed';
        shift.updatedAt = new Date().toISOString();
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      return {
        data: true,
        message: `Published ${shifts.length} shifts for the period ${startDate} to ${endDate}`,
        success: true
      };
    } catch (error) {
      return {
        data: false,
        message: 'Failed to publish schedule',
        success: false
      };
    }
  }

  async copyWeekSchedule(fromWeekStart: string, toWeekStart: string): Promise<ApiResponse<Shift[]>> {
    try {
      const fromWeekEnd = this.getWeekEnd(fromWeekStart);
      const sourceShifts = dataStore.shifts.filter(
        shift => shift.date >= fromWeekStart && shift.date <= fromWeekEnd
      );

      if (sourceShifts.length === 0) {
        return {
          data: [],
          message: 'No shifts found in source week',
          success: false
        };
      }

      const newShifts: CreateShiftData[] = sourceShifts.map(shift => {
        const dayOffset = Math.floor((new Date(shift.date).getTime() - new Date(fromWeekStart).getTime()) / (24 * 60 * 60 * 1000));
        const newDate = new Date(toWeekStart);
        newDate.setDate(newDate.getDate() + dayOffset);

        return {
          employeeId: shift.employeeId,
          date: newDate.toISOString().split('T')[0],
          startTime: shift.startTime,
          endTime: shift.endTime,
          shiftType: shift.shiftType,
          position: shift.position,
          notes: shift.notes,
          location: shift.location
        };
      });

      return this.bulkCreateShifts(newShifts);
    } catch (error) {
      return {
        data: [],
        message: 'Failed to copy week schedule',
        success: false
      };
    }
  }
}

export const scheduleService = ScheduleService.getInstance();