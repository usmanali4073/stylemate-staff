import api from './api';
import type { InvitationResponse, AcceptInvitationRequest } from '../types/invitation';

const invitationService = {
  sendInvitation: (businessId: string, staffId: string) =>
    api.post<InvitationResponse>(`/api/businesses/${businessId}/staff/${staffId}/invite`).then(r => r.data),

  resendInvitation: (businessId: string, staffId: string) =>
    api.post<InvitationResponse>(`/api/businesses/${businessId}/staff/${staffId}/invite/resend`).then(r => r.data),

  getLatestInvitation: (businessId: string, staffId: string) =>
    api.get<InvitationResponse>(`/api/businesses/${businessId}/staff/${staffId}/invitation`).then(r => r.data),

  acceptInvitation: (data: AcceptInvitationRequest) =>
    api.post('/api/invitations/accept', data).then(r => r.data),
};

export default invitationService;
