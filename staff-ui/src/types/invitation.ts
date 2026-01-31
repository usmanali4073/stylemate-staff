export interface InvitationResponse {
  id: string;
  staffMemberId: string;
  email: string;
  status: 'Pending' | 'Accepted' | 'Expired' | 'Cancelled';
  expiresAt: string;
  createdAt: string;
  acceptedAt: string | null;
  isExpired: boolean;
}

export interface AcceptInvitationRequest {
  token: string;
  password: string;
  firstName?: string;
  lastName?: string;
}
