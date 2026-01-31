import api from './api';
import type {
  TimeOffTypeResponse,
  CreateTimeOffTypeRequest,
  UpdateTimeOffTypeRequest,
  TimeOffRequestResponse,
  CreateTimeOffRequestData,
  ApproveTimeOffData,
  DenyTimeOffData,
  TimeOffStatus,
} from '../types/timeOff';

interface GetTimeOffRequestsParams {
  staffMemberId?: string;
  status?: TimeOffStatus;
}

const timeOffApiService = {
  // Time-off types
  getTimeOffTypes: (businessId: string) =>
    api.get<TimeOffTypeResponse[]>(`/api/businesses/${businessId}/time-off/types`).then(r => r.data),

  createTimeOffType: (businessId: string, data: CreateTimeOffTypeRequest) =>
    api.post<TimeOffTypeResponse>(`/api/businesses/${businessId}/time-off/types`, data).then(r => r.data),

  updateTimeOffType: (businessId: string, typeId: string, data: UpdateTimeOffTypeRequest) =>
    api.put<TimeOffTypeResponse>(`/api/businesses/${businessId}/time-off/types/${typeId}`, data).then(r => r.data),

  deleteTimeOffType: (businessId: string, typeId: string) =>
    api.delete(`/api/businesses/${businessId}/time-off/types/${typeId}`).then(r => r.data),

  // Time-off requests
  getTimeOffRequests: (businessId: string, params?: GetTimeOffRequestsParams) => {
    const queryParams = new URLSearchParams();
    if (params?.staffMemberId) queryParams.append('staffMemberId', params.staffMemberId);
    if (params?.status) queryParams.append('status', params.status);
    const query = queryParams.toString() ? `?${queryParams}` : '';
    return api.get<TimeOffRequestResponse[]>(`/api/businesses/${businessId}/time-off/requests${query}`).then(r => r.data);
  },

  getTimeOffRequest: (businessId: string, requestId: string) =>
    api.get<TimeOffRequestResponse>(`/api/businesses/${businessId}/time-off/requests/${requestId}`).then(r => r.data),

  createTimeOffRequest: (businessId: string, data: CreateTimeOffRequestData) =>
    api.post<TimeOffRequestResponse>(`/api/businesses/${businessId}/time-off/requests`, data).then(r => r.data),

  approveTimeOffRequest: (businessId: string, requestId: string, data?: ApproveTimeOffData) =>
    api.post<TimeOffRequestResponse>(`/api/businesses/${businessId}/time-off/requests/${requestId}/approve`, data).then(r => r.data),

  denyTimeOffRequest: (businessId: string, requestId: string, data?: DenyTimeOffData) =>
    api.post<TimeOffRequestResponse>(`/api/businesses/${businessId}/time-off/requests/${requestId}/deny`, data).then(r => r.data),

  cancelTimeOffRequest: (businessId: string, requestId: string) =>
    api.post<TimeOffRequestResponse>(`/api/businesses/${businessId}/time-off/requests/${requestId}/cancel`).then(r => r.data),

  getPendingCount: (businessId: string) =>
    api.get<{ count: number }>(`/api/businesses/${businessId}/time-off/requests/pending/count`).then(r => r.data.count),
};

export default timeOffApiService;
