import { z } from 'zod';

// Enum schemas
const PermissionLevelSchema = z.enum(['Basic', 'Low', 'Medium', 'High', 'Owner']);
const StaffStatusSchema = z.enum(['Active', 'Suspended', 'Archived']);

// Request schemas
export const CreateStaffMemberRequestSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  photoUrl: z.string().url().optional(),
  permissionLevel: PermissionLevelSchema.optional(),
  isBookable: z.boolean().optional(),
});

export const UpdateStaffMemberRequestSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  photoUrl: z.string().url().optional(),
  permissionLevel: PermissionLevelSchema.optional(),
  isBookable: z.boolean().optional(),
});

export const ChangeStaffStatusRequestSchema = z.object({
  status: z.enum(['Active', 'Suspended', 'Archived']),
});

// Response schemas
export const StaffLocationResponseSchema = z.object({
  id: z.string(),
  staffMemberId: z.string(),
  locationId: z.string(),
  locationName: z.string().nullable(),
  isPrimary: z.boolean(),
  assignedAt: z.string(),
});

export const StaffServiceResponseSchema = z.object({
  id: z.string(),
  staffMemberId: z.string(),
  serviceId: z.string(),
  serviceName: z.string().nullable(),
  assignedAt: z.string(),
});

export const StaffMemberResponseSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  userId: z.string().nullable(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  jobTitle: z.string().nullable(),
  photoUrl: z.string().nullable(),
  permissionLevel: PermissionLevelSchema,
  status: StaffStatusSchema,
  isBookable: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  locations: z.array(StaffLocationResponseSchema),
  hasPendingInvitation: z.boolean(),
});

export const StaffMemberListResponseSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  jobTitle: z.string().nullable(),
  photoUrl: z.string().nullable(),
  permissionLevel: PermissionLevelSchema,
  status: StaffStatusSchema,
  isBookable: z.boolean(),
  primaryLocationName: z.string().nullable(),
});

// Parse functions for runtime validation
export function parseStaffMemberResponse(data: unknown) {
  return StaffMemberResponseSchema.parse(data);
}

export function parseStaffMemberListResponse(data: unknown) {
  return z.array(StaffMemberListResponseSchema).parse(data);
}

export function parseStaffLocationResponse(data: unknown) {
  return z.array(StaffLocationResponseSchema).parse(data);
}

export function parseStaffServiceResponse(data: unknown) {
  return z.array(StaffServiceResponseSchema).parse(data);
}
