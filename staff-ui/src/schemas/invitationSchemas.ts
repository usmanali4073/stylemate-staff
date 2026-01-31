import { z } from 'zod';

const InvitationStatusSchema = z.enum(['Pending', 'Accepted', 'Expired', 'Cancelled']);

export const InvitationResponseSchema = z.object({
  id: z.string(),
  staffMemberId: z.string(),
  email: z.string().email(),
  status: InvitationStatusSchema,
  expiresAt: z.string(),
  createdAt: z.string(),
  acceptedAt: z.string().nullable(),
  isExpired: z.boolean(),
});

export const AcceptInvitationRequestSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// Parse functions for runtime validation
export function parseInvitationResponse(data: unknown) {
  return InvitationResponseSchema.parse(data);
}
