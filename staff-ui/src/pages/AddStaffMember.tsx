import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useActiveBusinessId } from '@/hooks/useActiveBusinessId';
import { useCreateStaffMember } from '@/hooks/useStaff';
import type { CreateStaffMemberRequest, PermissionLevel } from '@/types/staff';

interface FormData extends CreateStaffMemberRequest {}

const AddStaffMember: React.FC = () => {
  const navigate = useNavigate();
  const businessId = useActiveBusinessId();
  const createMutation = useCreateStaffMember(businessId || '');

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

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
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!businessId) {
      setSnackbarMessage('No active business selected');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      await createMutation.mutateAsync(data);
      setSnackbarMessage('Staff member created successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      reset();
      // Navigate after short delay
      setTimeout(() => {
        navigate('/staff');
      }, 1000);
    } catch (err) {
      setSnackbarMessage(
        `Failed to create staff member: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleBack = () => {
    navigate('/staff');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          px: 3,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <IconButton onClick={handleBack} size="small">
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" fontWeight={600}>
          Add Team Member
        </Typography>
      </Box>

      {/* Form Content */}
      <Box sx={{ maxWidth: 800, mx: 'auto', px: 3, pt: 4 }}>
        <Paper sx={{ p: 4 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* Personal Information Section */}
              <Grid size={12}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Personal Information
                </Typography>
              </Grid>

              {/* First Name */}
              <Grid size={{ xs: 12, md: 6 }}>
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

              {/* Last Name */}
              <Grid size={{ xs: 12, md: 6 }}>
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

              {/* Email */}
              <Grid size={{ xs: 12, md: 6 }}>
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

              {/* Phone */}
              <Grid size={{ xs: 12, md: 6 }}>
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

              {/* Job Title */}
              <Grid size={{ xs: 12, md: 6 }}>
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

              {/* Photo URL */}
              <Grid size={{ xs: 12, md: 6 }}>
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

              {/* Workspace Section */}
              <Grid size={12} sx={{ mt: 2 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Workspace Settings
                </Typography>
              </Grid>

              {/* Permission Level */}
              <Grid size={{ xs: 12, md: 6 }}>
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

              {/* Calendar Bookable */}
              <Grid size={{ xs: 12, md: 6 }}>
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
                <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4 }}>
                  Allow this staff member to receive appointments
                </Typography>
              </Grid>

              {/* Form Actions */}
              <Grid size={12} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button variant="outlined" onClick={handleBack}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting || createMutation.isPending}
                    startIcon={isSubmitting || createMutation.isPending ? <CircularProgress size={20} /> : null}
                  >
                    {isSubmitting || createMutation.isPending ? 'Adding...' : 'Add Staff Member'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddStaffMember;
