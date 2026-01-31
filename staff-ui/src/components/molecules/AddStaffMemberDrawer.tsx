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
  CircularProgress,
  Alert,
  FormControlLabel,
  Switch,
  Checkbox,
  ListItemText,
  Chip,
} from '@mui/material';
import { Close, PersonAdd } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useActiveBusinessId } from '@/hooks/useActiveBusinessId';
import { useCreateStaffMember } from '@/hooks/useStaff';
import type { CreateStaffMemberRequest } from '@/types/staff';

interface BusinessLocation {
  id: string;
  locationName: string;
  addressLine1: string | null;
  isPrimary: boolean;
  isActive: boolean;
}

interface AddStaffMemberDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface FormData extends CreateStaffMemberRequest {}

const AddStaffMemberDrawer: React.FC<AddStaffMemberDrawerProps> = ({
  open,
  onClose,
}) => {
  const businessId = useActiveBusinessId();
  const createMutation = useCreateStaffMember(businessId || '');

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [businessLocations, setBusinessLocations] = useState<BusinessLocation[]>([]);

  // Fetch business locations
  useEffect(() => {
    if (!businessId || !open) return;
    const apiUrl = import.meta.env.VITE_BUSINESS_API_URL || '';
    const token = localStorage.getItem('stylemate-auth-token') || sessionStorage.getItem('stylemate-auth-token');
    fetch(`${apiUrl}/api/businesses/${businessId}/locations`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : [])
      .then((data: BusinessLocation[]) => setBusinessLocations(data.filter(l => l.isActive)))
      .catch(() => setBusinessLocations([]));
  }, [businessId, open]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      photoUrl: '',
      permissionLevel: 'Basic',
      isBookable: true,
      locationIds: [],
    },
  });

  // Reset form when drawer opens
  useEffect(() => {
    if (open) {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        jobTitle: '',
        photoUrl: '',
        permissionLevel: 'Basic',
        isBookable: true,
        locationIds: [],
      });
      setSubmitError(null);
      setSubmitSuccess(false);
    }
  }, [open, reset]);

  const onSubmit = async (data: FormData) => {
    if (!businessId) {
      setSubmitError('No active business selected');
      return;
    }

    try {
      setSubmitError(null);
      const payload = {
        ...data,
        locationIds: data.locationIds && data.locationIds.length > 0 ? data.locationIds : undefined,
      };
      await createMutation.mutateAsync(payload);
      setSubmitSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to create staff member'
      );
    }
  };

  const handleClose = () => {
    reset();
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
          width: { xs: '100%', sm: 500 },
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
            Add Team Member
          </Typography>
          <IconButton onClick={handleClose} edge="end">
            <Close />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        {submitSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Staff member created successfully
          </Alert>
        )}

        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid size={12}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
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
                name="email"
                control={control}
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Please enter a valid email address',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    type="email"
                    fullWidth
                    required
                    error={!!errors.email}
                    helperText={errors.email?.message}
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
                    helperText="Placeholder until file upload is implemented"
                    placeholder="https://example.com/photo.jpg"
                  />
                )}
              />
            </Grid>

            {/* Workspace Settings */}
            <Grid size={12} sx={{ mt: 1 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                Workspace Settings
              </Typography>
            </Grid>

            {businessLocations.length > 1 && (
              <Grid size={12}>
                <Controller
                  name="locationIds"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Locations</InputLabel>
                      <Select
                        multiple
                        value={field.value || []}
                        onChange={(e) => field.onChange(e.target.value as string[])}
                        label="Locations"
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(selected as string[]).map((id) => {
                              const loc = businessLocations.find(l => l.id === id);
                              return <Chip key={id} label={loc?.locationName || id} size="small" />;
                            })}
                          </Box>
                        )}
                      >
                        {businessLocations.map((loc) => (
                          <MenuItem key={loc.id} value={loc.id}>
                            <Checkbox checked={(field.value || []).includes(loc.id)} />
                            <ListItemText primary={loc.locationName} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            )}

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
      </Box>

      {/* Actions */}
      <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            startIcon={isSubmitting || createMutation.isPending ? <CircularProgress size={20} /> : <PersonAdd />}
            disabled={isSubmitting || createMutation.isPending}
          >
            {isSubmitting || createMutation.isPending ? 'Adding...' : 'Add Staff Member'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default AddStaffMemberDrawer;
