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
  useTheme,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider
} from '@mui/material';
import { Close, Save } from '@mui/icons-material';
import { useResponsive } from '../../hooks/useResponsive';
import type { TeamMember } from '../../types';

interface StaffMemberEditDrawerProps {
  open: boolean;
  member: TeamMember | null;
  onSave: (member: TeamMember) => void;
  onCancel: () => void;
}

const StaffMemberEditDrawer: React.FC<StaffMemberEditDrawerProps> = ({
  open,
  member,
  onSave,
  onCancel
}) => {
  const { shouldCollapseNavigation } = useResponsive();

  const [editedMember, setEditedMember] = useState<TeamMember>({
    id: '',
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      hireDate: new Date().toISOString().split('T')[0]
    },
    employment: {
      role: '',
      department: '',
      employmentType: 'full-time',
      status: 'active',
      hourlyRate: 0,
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (member) {
      setEditedMember(member);
    } else {
      // Reset form for new member
      setEditedMember({
        id: `tm-${Date.now()}`,
        personalInfo: {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          hireDate: new Date().toISOString().split('T')[0]
        },
        employment: {
          role: '',
          department: '',
          employmentType: 'full-time',
          status: 'active',
          hourlyRate: 0,
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
      });
    }
    setErrors({});
  }, [member, open]);

  const handlePersonalInfoChange = (field: keyof TeamMember['personalInfo'], value: string) => {
    setEditedMember(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleEmploymentChange = (field: keyof TeamMember['employment'], value: string | number) => {
    setEditedMember(prev => ({
      ...prev,
      employment: {
        ...prev.employment,
        [field]: value
      }
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!editedMember.personalInfo.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!editedMember.personalInfo.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!editedMember.personalInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedMember.personalInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!editedMember.personalInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!editedMember.employment.role.trim()) {
      newErrors.role = 'Role is required';
    }
    if (!editedMember.employment.department.trim()) {
      newErrors.department = 'Department is required';
    }
    if (editedMember.employment.hourlyRate <= 0) {
      newErrors.hourlyRate = 'Hourly rate must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(editedMember);
    }
  };

  const isEditing = !!member;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onCancel}
      sx={{
        '& .MuiDrawer-paper': {
          width: shouldCollapseNavigation ? '100%' : 600,
          maxWidth: '100%'
        }
      }}
    >
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>
            {isEditing ? 'Edit Team Member' : 'Add Team Member'}
          </Typography>
          <IconButton onClick={onCancel} edge="end">
            <Close />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        <Grid container spacing={3}>
          {/* Personal Information */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Personal Information
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="First Name"
              value={editedMember.personalInfo.firstName}
              onChange={(e) => handlePersonalInfoChange('firstName', e.target.value)}
              fullWidth
              error={!!errors.firstName}
              helperText={errors.firstName}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Last Name"
              value={editedMember.personalInfo.lastName}
              onChange={(e) => handlePersonalInfoChange('lastName', e.target.value)}
              fullWidth
              error={!!errors.lastName}
              helperText={errors.lastName}
              required
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              label="Email Address"
              type="email"
              value={editedMember.personalInfo.email}
              onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
              fullWidth
              error={!!errors.email}
              helperText={errors.email}
              required
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              label="Phone Number"
              value={editedMember.personalInfo.phone}
              onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
              fullWidth
              error={!!errors.phone}
              helperText={errors.phone}
              placeholder="+1 (555) 123-4567"
              required
            />
          </Grid>

          {/* Employment Information */}
          <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
            <Divider />
            <Typography variant="h6" fontWeight={600} sx={{ mt: 3, mb: 2 }}>
              Employment Details
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Role/Position"
              value={editedMember.employment.role}
              onChange={(e) => handleEmploymentChange('role', e.target.value)}
              fullWidth
              error={!!errors.role}
              helperText={errors.role}
              placeholder="e.g. Senior Hair Stylist"
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Department"
              value={editedMember.employment.department}
              onChange={(e) => handleEmploymentChange('department', e.target.value)}
              fullWidth
              error={!!errors.department}
              helperText={errors.department}
              placeholder="e.g. Hair Services"
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Employment Type</InputLabel>
              <Select
                value={editedMember.employment.employmentType}
                label="Employment Type"
                onChange={(e) => handleEmploymentChange('employmentType', e.target.value)}
              >
                <MenuItem value="full-time">Full-time</MenuItem>
                <MenuItem value="part-time">Part-time</MenuItem>
                <MenuItem value="contractor">Contractor</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editedMember.employment.status}
                label="Status"
                onChange={(e) => handleEmploymentChange('status', e.target.value)}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="on-leave">On Leave</MenuItem>
                <MenuItem value="terminated">Terminated</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Hourly Rate"
              type="number"
              value={editedMember.employment.hourlyRate}
              onChange={(e) => handleEmploymentChange('hourlyRate', parseFloat(e.target.value) || 0)}
              fullWidth
              error={!!errors.hourlyRate}
              helperText={errors.hourlyRate}
              inputProps={{ min: 0, step: 0.5 }}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
              }}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Hire Date"
              type="date"
              value={editedMember.personalInfo.hireDate}
              onChange={(e) => handlePersonalInfoChange('hireDate', e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
        </Grid>
      </Box>

      {/* Actions */}
      <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<Save />}
          >
            {isEditing ? 'Save Changes' : 'Add Team Member'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default StaffMemberEditDrawer;