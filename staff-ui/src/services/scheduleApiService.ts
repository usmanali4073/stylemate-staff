import api from './api';
import type {
  ShiftResponse,
  ShiftConflictResponse,
  CreateShiftRequest,
  UpdateShiftRequest,
  BulkCreateShiftRequest,
} from '../types/schedule';

export interface ConflictError {
  isConflict: true;
  conflicts: ShiftConflictResponse[];
  hasErrors: boolean; // true if any conflict has severity "error"
}

const scheduleApiService = {
  getShifts: (businessId: string, startDate: string, endDate: string, staffMemberId?: string) => {
    const params = new URLSearchParams({ startDate, endDate });
    if (staffMemberId) params.append('staffMemberId', staffMemberId);
    return api.get<ShiftResponse[]>(`/api/businesses/${businessId}/schedule?${params}`).then(r => r.data);
  },

  getShift: (businessId: string, shiftId: string) =>
    api.get<ShiftResponse>(`/api/businesses/${businessId}/schedule/${shiftId}`).then(r => r.data),

  createShift: async (businessId: string, data: CreateShiftRequest, forceCreate = false): Promise<ShiftResponse> => {
    try {
      const headers: Record<string, string> = {};
      if (forceCreate) headers['X-Force-Create'] = 'true';
      const response = await api.post<ShiftResponse>(`/api/businesses/${businessId}/schedule`, data, { headers });
      return response.data;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status: number; data: unknown } };
        if (axiosErr.response?.status === 409) {
          const conflicts = axiosErr.response.data as ShiftConflictResponse[];
          const conflictError: ConflictError = {
            isConflict: true,
            conflicts,
            hasErrors: conflicts.some(c => c.severity === 'error'),
          };
          throw conflictError;
        }
      }
      throw err;
    }
  },

  updateShift: (businessId: string, shiftId: string, data: UpdateShiftRequest) =>
    api.put<ShiftResponse>(`/api/businesses/${businessId}/schedule/${shiftId}`, data).then(r => r.data),

  deleteShift: (businessId: string, shiftId: string) =>
    api.delete(`/api/businesses/${businessId}/schedule/${shiftId}`).then(r => r.data),

  bulkCreateShifts: async (businessId: string, data: BulkCreateShiftRequest, forceCreate = false): Promise<ShiftResponse[]> => {
    try {
      const headers: Record<string, string> = {};
      if (forceCreate) headers['X-Force-Create'] = 'true';
      const response = await api.post<ShiftResponse[]>(`/api/businesses/${businessId}/schedule/bulk`, data, { headers });
      return response.data;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status: number; data: unknown } };
        if (axiosErr.response?.status === 409) {
          const conflicts = axiosErr.response.data as ShiftConflictResponse[];
          const conflictError: ConflictError = {
            isConflict: true,
            conflicts,
            hasErrors: conflicts.some(c => c.severity === 'error'),
          };
          throw conflictError;
        }
      }
      throw err;
    }
  },
};

export default scheduleApiService;
