// ========================================
// STAFF SERVICE - Team Member Management
// ========================================

import { dataStore, generateId } from './mockData';
import type {
  ApiResponse,
  TeamMember,
  CreateTeamMemberData,
  UpdateTeamMemberData,
  TeamMemberFilters
} from '../types';

export class StaffService {
  private static instance: StaffService;

  private constructor() {}

  public static getInstance(): StaffService {
    if (!StaffService.instance) {
      StaffService.instance = new StaffService();
    }
    return StaffService.instance;
  }

  // ========================================
  // CRUD OPERATIONS
  // ========================================

  async getStaff(filters?: TeamMemberFilters): Promise<ApiResponse<TeamMember[]>> {
    try {
      let staff = [...dataStore.teamMembers];

      // Apply filters
      if (filters) {
        if (filters.status && filters.status.length > 0) {
          staff = staff.filter(member => filters.status!.includes(member.employment.status));
        }

        if (filters.roles && filters.roles.length > 0) {
          staff = staff.filter(member => filters.roles!.includes(member.employment.role));
        }

        if (filters.departments && filters.departments.length > 0) {
          staff = staff.filter(member => filters.departments!.includes(member.employment.department));
        }

        if (filters.employmentTypes && filters.employmentTypes.length > 0) {
          staff = staff.filter(member => filters.employmentTypes!.includes(member.employment.employmentType));
        }

        if (filters.skills && filters.skills.length > 0) {
          staff = staff.filter(member =>
            filters.skills!.some(skill => member.skills.includes(skill))
          );
        }

        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          staff = staff.filter(member =>
            member.personalInfo.firstName.toLowerCase().includes(searchTerm) ||
            member.personalInfo.lastName.toLowerCase().includes(searchTerm) ||
            member.personalInfo.email.toLowerCase().includes(searchTerm) ||
            member.personalInfo.phone.includes(searchTerm)
          );
        }
      }

      // Sort by name
      staff.sort((a, b) => {
        const nameA = `${a.personalInfo.firstName} ${a.personalInfo.lastName}`;
        const nameB = `${b.personalInfo.firstName} ${b.personalInfo.lastName}`;
        return nameA.localeCompare(nameB);
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        data: staff,
        message: 'Staff retrieved successfully',
        success: true
      };
    } catch (error) {
      return {
        data: [],
        message: 'Failed to retrieve staff',
        success: false
      };
    }
  }

  async getStaffMember(id: string): Promise<ApiResponse<TeamMember | null>> {
    try {
      const member = dataStore.findTeamMemberById(id);

      await new Promise(resolve => setTimeout(resolve, 50));

      if (!member) {
        return {
          data: null,
          message: 'Staff member not found',
          success: false
        };
      }

      return {
        data: member,
        message: 'Staff member retrieved successfully',
        success: true
      };
    } catch (error) {
      return {
        data: null,
        message: 'Failed to retrieve staff member',
        success: false
      };
    }
  }

  async createStaffMember(data: CreateTeamMemberData): Promise<ApiResponse<TeamMember>> {
    try {
      // Validate required fields
      if (!data.firstName || !data.lastName || !data.email || !data.hourlyRate) {
        return {
          data: {} as TeamMember,
          message: 'Missing required fields',
          success: false
        };
      }

      // Check for duplicate email
      const existingMember = dataStore.teamMembers.find(
        member => member.personalInfo.email.toLowerCase() === data.email.toLowerCase()
      );

      if (existingMember) {
        return {
          data: {} as TeamMember,
          message: 'Email address already exists',
          success: false
        };
      }

      // Create new team member
      const newMember: TeamMember = {
        id: generateId(),
        personalInfo: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          hireDate: data.hireDate
        },
        employment: {
          role: data.role,
          department: data.department,
          employmentType: data.employmentType,
          status: 'active',
          hourlyRate: data.hourlyRate,
          overtimeRate: data.hourlyRate * 1.5,
          canManageOthers: false
        },
        availability: {
          preferredShifts: ['mid'],
          unavailableDays: [],
          maxHoursPerDay: 8,
          canWorkWeekends: true,
          canWorkHolidays: true
        },
        skills: [],
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to data store
      dataStore.teamMembers.push(newMember);

      await new Promise(resolve => setTimeout(resolve, 200));

      return {
        data: newMember,
        message: 'Staff member created successfully',
        success: true
      };
    } catch (error) {
      return {
        data: {} as TeamMember,
        message: 'Failed to create staff member',
        success: false
      };
    }
  }

  async updateStaffMember(id: string, data: UpdateTeamMemberData): Promise<ApiResponse<TeamMember>> {
    try {
      const memberIndex = dataStore.teamMembers.findIndex(member => member.id === id);

      if (memberIndex === -1) {
        return {
          data: {} as TeamMember,
          message: 'Staff member not found',
          success: false
        };
      }

      // Check for duplicate email (excluding current member)
      if (data.personalInfo?.email) {
        const existingMember = dataStore.teamMembers.find(
          member => member.id !== id &&
          member.personalInfo.email.toLowerCase() === data.personalInfo!.email!.toLowerCase()
        );

        if (existingMember) {
          return {
            data: {} as TeamMember,
            message: 'Email address already exists',
            success: false
          };
        }
      }

      // Update member (deep merge)
      const currentMember = dataStore.teamMembers[memberIndex];
      const updatedMember: TeamMember = {
        ...currentMember,
        personalInfo: { ...currentMember.personalInfo, ...data.personalInfo },
        employment: { ...currentMember.employment, ...data.employment },
        availability: { ...currentMember.availability, ...data.availability },
        skills: data.skills || currentMember.skills,
        notes: data.notes !== undefined ? data.notes : currentMember.notes,
        updatedAt: new Date().toISOString()
      };

      // Calculate overtime rate if hourly rate changed
      if (data.employment?.hourlyRate) {
        updatedMember.employment.overtimeRate = data.employment.hourlyRate * 1.5;
      }

      dataStore.teamMembers[memberIndex] = updatedMember;

      await new Promise(resolve => setTimeout(resolve, 150));

      return {
        data: updatedMember,
        message: 'Staff member updated successfully',
        success: true
      };
    } catch (error) {
      return {
        data: {} as TeamMember,
        message: 'Failed to update staff member',
        success: false
      };
    }
  }

  async deleteStaffMember(id: string): Promise<ApiResponse<boolean>> {
    try {
      const memberIndex = dataStore.teamMembers.findIndex(member => member.id === id);

      if (memberIndex === -1) {
        return {
          data: false,
          message: 'Staff member not found',
          success: false
        };
      }

      // Check if member has active shifts
      const hasActiveShifts = dataStore.shifts.some(
        shift => shift.employeeId === id &&
        new Date(shift.date) >= new Date() &&
        shift.status !== 'cancelled'
      );

      if (hasActiveShifts) {
        return {
          data: false,
          message: 'Cannot delete staff member with active shifts',
          success: false
        };
      }

      // Instead of deleting, mark as terminated (soft delete)
      dataStore.teamMembers[memberIndex].employment.status = 'terminated';
      dataStore.teamMembers[memberIndex].updatedAt = new Date().toISOString();

      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        data: true,
        message: 'Staff member removed successfully',
        success: true
      };
    } catch (error) {
      return {
        data: false,
        message: 'Failed to remove staff member',
        success: false
      };
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  async getActiveStaff(): Promise<ApiResponse<TeamMember[]>> {
    const filters: TeamMemberFilters = {
      status: ['active']
    };
    return this.getStaff(filters);
  }

  async getStaffByRole(role: string): Promise<ApiResponse<TeamMember[]>> {
    const filters: TeamMemberFilters = {
      roles: [role],
      status: ['active']
    };
    return this.getStaff(filters);
  }

  async updateAvailability(id: string, availability: TeamMember['availability']): Promise<ApiResponse<TeamMember>> {
    return this.updateStaffMember(id, { availability });
  }

  async getStaffStats(): Promise<ApiResponse<{
    total: number;
    active: number;
    byDepartment: { [department: string]: number };
    byRole: { [role: string]: number };
    averageHourlyRate: number;
  }>> {
    try {
      const staff = dataStore.teamMembers;
      const activeStaff = staff.filter(member => member.employment.status === 'active');

      const byDepartment: { [department: string]: number } = {};
      const byRole: { [role: string]: number } = {};
      let totalHourlyRate = 0;

      activeStaff.forEach(member => {
        // Department stats
        const dept = member.employment.department;
        byDepartment[dept] = (byDepartment[dept] || 0) + 1;

        // Role stats
        const role = member.employment.role;
        byRole[role] = (byRole[role] || 0) + 1;

        // Average rate calculation
        totalHourlyRate += member.employment.hourlyRate;
      });

      const averageHourlyRate = activeStaff.length > 0 ? totalHourlyRate / activeStaff.length : 0;

      await new Promise(resolve => setTimeout(resolve, 50));

      return {
        data: {
          total: staff.length,
          active: activeStaff.length,
          byDepartment,
          byRole,
          averageHourlyRate
        },
        message: 'Staff statistics retrieved successfully',
        success: true
      };
    } catch (error) {
      return {
        data: {
          total: 0,
          active: 0,
          byDepartment: {},
          byRole: {},
          averageHourlyRate: 0
        },
        message: 'Failed to retrieve staff statistics',
        success: false
      };
    }
  }

  async searchStaff(query: string): Promise<ApiResponse<TeamMember[]>> {
    const filters: TeamMemberFilters = {
      search: query,
      status: ['active']
    };
    return this.getStaff(filters);
  }

  async getAvailableEmployees(date: string, startTime: string, endTime: string): Promise<ApiResponse<TeamMember[]>> {
    try {
      const dayOfWeek = new Date(date).getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];

      // Get active staff who are available on this day
      const availableStaff = dataStore.getActiveTeamMembers().filter(member => {
        // Check if they're available on this day of week
        if (member.availability.unavailableDays.includes(dayName)) {
          return false;
        }

        // Check if they can work weekends (if it's weekend)
        if ((dayOfWeek === 0 || dayOfWeek === 6) && !member.availability.canWorkWeekends) {
          return false;
        }

        return true;
      });

      // Check for scheduling conflicts
      const dateShifts = dataStore.getShiftsByDate(date);
      const conflictFreeStaff = availableStaff.filter(member => {
        const memberShifts = dateShifts.filter(shift => shift.employeeId === member.id);

        // Check for time overlaps
        return !memberShifts.some(shift => {
          const shiftStart = shift.startTime;
          const shiftEnd = shift.endTime;

          // Simple time overlap check (assumes same day)
          return !(endTime <= shiftStart || startTime >= shiftEnd);
        });
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      return {
        data: conflictFreeStaff,
        message: 'Available employees retrieved successfully',
        success: true
      };
    } catch (error) {
      return {
        data: [],
        message: 'Failed to retrieve available employees',
        success: false
      };
    }
  }
}

export const staffService = StaffService.getInstance();