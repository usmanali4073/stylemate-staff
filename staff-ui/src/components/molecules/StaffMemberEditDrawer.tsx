import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  CircularProgress,
  Chip,
  Alert,
  FormControlLabel,
  Switch,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { Close, Save } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useActiveBusinessId } from '@/hooks/useActiveBusinessId';
import { useStaffMember, useUpdateStaffMember, useAssignLocation, useRemoveLocation } from '@/hooks/useStaff';
import type { UpdateStaffMemberRequest, PermissionLevel } from '@/types/staff';

interface StaffMemberEditDrawerProps {
  open: boolean;
  staffId: string | null;
  onClose: () => void;
}

interface FormData extends UpdateStaffMemberRequest {}

interface BusinessLocation {
  id: string;
  locationName: string;
}

const StaffMemberEditDrawer: React.FC<StaffMemberEditDrawerProps> = ({
  open,
  staffId,
  onClose,
}) => {
  const businessId = useActiveBusinessId();
  const { data: staffMember, isLoading } = useStaffMember(businessId, staffId);
  const updateMutation = useUpdateStaffMember(businessId || '');
  const assignLocationMutation = useAssignLocation(businessId || '', staffId || '');
  const removeLocationMutation = useRemoveLocation(businessId || '', staffId || '');

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [businessLocations, setBusinessLocations] = useState<BusinessLocation[]>([]);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);

  // Fetch business locations to resolve names
  useEffect(() => {
    if (!businessId || !open) return;
    const apiUrl = import.meta.env.VITE_BUSINESS_API_URL || '';
    const token = localStorage.getItem('stylemate-auth-token') || sessionStorage.getItem('stylemate-auth-token');
    fetch(`${apiUrl}/api/businesses/${businessId}/locations`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : [])
      .then((data: BusinessLocation[]) => setBusinessLocations(data))
      .catch(() => setBusinessLocations([]));
  }, [businessId, open]);

  const getLocationName = (locationId: string): string => {
    const loc = businessLocations.find(l => l.id === locationId);
    return loc?.locationName || locationId.slice(0, 8) + '...';
  };

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      jobTitle: '',
      photoUrl: '',
      permissionLevel: 'Basic',
      isBookable: true,
    },
  });

  // Reset form when drawer opens with new data (Phase 1 pattern)
  useEffect(() => {
    if (open && staffMember) {
      reset({
        firstName: staffMember.firstName,
        lastName: staffMember.lastName,
        phone: staffMember.phone || '',
        jobTitle: staffMember.jobTitle || '',
        photoUrl: staffMember.photoUrl || '',
        permissionLevel: staffMember.permissionLevel,
        isBookable: staffMember.isBookable,
      });
      // Initialize selected locations from staff member data
      const currentLocationIds = staffMember.locations?.map(loc => loc.locationId) || [];
      setSelectedLocationIds(currentLocationIds);
      setSubmitError(null);
      setSubmitSuccess(false);
    }
  }, [open, staffMember, reset]);

  const onSubmit = async (data: FormData) => {
    if (!businessId || !staffId) {
      setSubmitError('Missing business ID or staff ID');
      return;
    }

    try {
      setSubmitError(null);

      // Update basic staff info
      await updateMutation.mutateAsync({
        staffId,
        data,
      });

      // Handle location changes
      const currentLocationIds = staffMember?.locations?.map(loc => loc.locationId) || [];
      const locationsToAdd = selectedLocationIds.filter(id => !currentLocationIds.includes(id));
      const locationsToRemove = currentLocationIds.filter(id => !selectedLocationIds.includes(id));

      // Add new locations (first one added becomes primary if no locations exist)
      for (let i = 0; i < locationsToAdd.length; i++) {
        await assignLocationMutation.mutateAsync({
          locationId: locationsToAdd[i],
          isPrimary: currentLocationIds.length === 0 && i === 0,
        });
      }

      // Remove old locations
      for (const locationId of locationsToRemove) {
        try {
          await removeLocationMutation.mutateAsync(locationId);
        } catch (err) {
          // Ignore errors for primary location removal (backend blocks it)
          console.warn('Could not remove location:', err);
        }
      }

      setSubmitSuccess(true);
      // Close drawer after short delay
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update staff member');
    }
  };

  const handleClose = () => {
    reset();
    setSelectedLocationIds([]);
    setSubmitError(null);
    setSubmitSuccess(false);
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 500, md: 600 },
          maxWidth: '100%',
        },
      }}
    >
      {/* Header */}
      <AppBar
        position="static"
        elevation={0}
        sx={{ bgcolor: 'background.paper', color: 'text.primary', borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>
            Edit Staff Member
          </Typography>
          <IconButton onClick={handleClose} edge="end">
            <Close />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        ) : staffMember ? (
          <>
            {/* Display-only fields at top */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Email (not editable)
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {staffMember.email}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={staffMember.status}
                  size="small"
                  color={
                    staffMember.status === 'Active'
                      ? 'success'
                      : staffMember.status === 'Suspended'
                      ? 'warning'
                      : 'default'
                  }
                />
                {staffMember.hasPendingInvitation && (
                  <Chip label="Pending invitation" size="small" color="info" />
                )}
              </Box>

              {/* Location Assignment - show multi-select when >1 locations available */}
              {businessLocations.length > 1 && (
                <Box sx={{ mb: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Assigned Locations</InputLabel>
                    <Select
                      multiple
                      value={selectedLocationIds}
                      onChange={(e) => setSelectedLocationIds(e.target.value as string[])}
                      label="Assigned Locations"
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((id) => {
                            const loc = businessLocations.find(l => l.id === id);
                            const isPrimary = staffMember.locations?.find(sl => sl.locationId === id)?.isPrimary;
                            return (
                              <Chip
                                key={id}
                                label={`${loc?.locationName || id}${isPrimary ? ' (Primary)' : ''}`}
                                size="small"
                                color={isPrimary ? 'primary' : 'default'}
                              />
                            );
                          })}
                        </Box>
                      )}
                    >
                      {businessLocations.map((loc) => (
                        <MenuItem key={loc.id} value={loc.id}>
                          <Checkbox checked={selectedLocationIds.includes(loc.id)} />
                          <ListItemText primary={loc.locationName} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}

              {/* Show read-only chips when only 1 location */}
              {businessLocations.length <= 1 && staffMember.locations && staffMember.locations.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Assigned Location
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {staffMember.locations.map((loc) => (
                      <Chip
                        key={loc.id}
                        label={`${getLocationName(loc.locationId)}${loc.isPrimary ? ' (Primary)' : ''}`}
                        size="small"
                        color={loc.isPrimary ? 'primary' : 'default'}
                        variant={loc.isPrimary ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Typography variant="caption" color="text.secondary">
                Created: {new Date(staffMember.createdAt).toLocaleDateString()}
              </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Invitation Status Section */}
            {staffMember.hasPendingInvitation && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Pending Invitation
                </Typography>
                <Typography variant="body2">
                  This staff member has not yet accepted their invitation.
                </Typography>
                {/* TODO: Add Resend button when invitation service is integrated */}
              </Alert>
            )}

            {/* Success Message */}
            {submitSuccess && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Staff member updated successfully
              </Alert>
            )}

            {/* Error Message */}
            {submitError && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmitError(null)}>
                {submitError}
              </Alert>
            )}

            {/* Edit Form */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={3}>
                {/* Personal Information */}
                <Grid size={12}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                    Personal Information
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="firstName"
                    control={control}
                    rules={{ required: 'First name is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="First Name"
                        fullWidth
                        required
                        error={!!errors.firstName}
                        helperText={errors.firstName?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="lastName"
                    control={control}
                    rules={{ required: 'Last name is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Last Name"
                        fullWidth
                        required
                        error={!!errors.lastName}
                        helperText={errors.lastName?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid size={12}>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Phone"
                        fullWidth
                        error={!!errors.phone}
                        helperText={errors.phone?.message}
                        placeholder="+1 (555) 123-4567"
                      />
                    )}
                  />
                </Grid>

                <Grid size={12}>
                  <Controller
                    name="jobTitle"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Job Title"
                        fullWidth
                        error={!!errors.jobTitle}
                        helperText={errors.jobTitle?.message}
                        placeholder="e.g. Senior Hair Stylist"
                      />
                    )}
                  />
                </Grid>

                <Grid size={12}>
                  <Controller
                    name="photoUrl"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Photo URL"
                        fullWidth
                        error={!!errors.photoUrl}
                        helperText={
                          errors.photoUrl?.message ||
                          'Placeholder until file upload is implemented'
                        }
                        placeholder="https://example.com/photo.jpg"
                      />
                    )}
                  />
                </Grid>

                {/* Workspace Settings */}
                <Grid size={12} sx={{ mt: 2 }}>
                  <Divider />
                  <Typography variant="h6" fontWeight={600} sx={{ mt: 3, mb: 2 }}>
                    Workspace Settings
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="permissionLevel"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Permission Level</InputLabel>
                        <Select {...field} label="Permission Level">
                          <MenuItem value="Basic">Basic</MenuItem>
                          <MenuItem value="Low">Low</MenuItem>
                          <MenuItem value="Medium">Medium</MenuItem>
                          <MenuItem value="High">High</MenuItem>
                          <MenuItem value="Owner">Owner</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="isBookable"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                        }
                        label="Calendar Bookable"
                        sx={{ mt: 1 }}
                      />
                    )}
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Allow this staff member to receive appointments
                  </Typography>
                </Grid>
              </Grid>
            </form>
          </>
        ) : (
          <Alert severity="error">Staff member not found</Alert>
        )}
      </Box>

      {/* Actions */}
      {staffMember && (
        <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={handleClose} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              variant="contained"
              startIcon={isSubmitting || updateMutation.isPending ? <CircularProgress size={20} /> : <Save />}
              disabled={isSubmitting || updateMutation.isPending}
            >
              {isSubmitting || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      )}
    </Drawer>
  );
};

export default StaffMemberEditDrawer;
