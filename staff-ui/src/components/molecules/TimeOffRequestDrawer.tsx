import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Alert,
  FormControlLabel,
  Switch,
  Stack,
} from '@mui/material';
import { Close, Save } from '@mui/icons-material';
import { useActiveBusinessId } from '@/hooks/useActiveBusinessId';
import { useTimeOffTypes, useCreateTimeOffRequest } from '@/hooks/useTimeOff';
import { useStaffMembers } from '@/hooks/useStaff';
import type { CreateTimeOffRequestData } from '@/types/timeOff';

interface TimeOffRequestDrawerProps {
  open: boolean;
  onClose: () => void;
  businessId: string;
  staffMemberId?: string; // Pre-selected staff member
  onSaved?: () => void;
}

const TimeOffRequestDrawer: React.FC<TimeOffRequestDrawerProps> = ({
  open,
  onClose,
  businessId,
  staffMemberId,
  onSaved,
}) => {
  const { data: timeOffTypes = [] } = useTimeOffTypes(businessId);
  const { data: staffMembers = [] } = useStaffMembers(businessId);
  const createMutation = useCreateTimeOffRequest(businessId);

  const [formData, setFormData] = useState<CreateTimeOffRequestData>({
    staffMemberId: staffMemberId || '',
    timeOffTypeId: '',
    startDate: '',
    endDate: '',
    isAllDay: true,
    startTime: '09:00',
    endTime: '17:00',
    notes: '',
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Reset form when drawer opens
  useEffect(() => {
    if (open) {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        staffMemberId: staffMemberId || '',
        timeOffTypeId: '',
        startDate: today,
        endDate: today,
        isAllDay: true,
        startTime: '09:00',
        endTime: '17:00',
        notes: '',
      });
      setSubmitError(null);
      setSubmitSuccess(false);
    }
  }, [open, staffMemberId]);

  const handleSubmit = async () => {
    try {
      setSubmitError(null);
      const submitData: CreateTimeOffRequestData = {
        staffMemberId: formData.staffMemberId,
        timeOffTypeId: formData.timeOffTypeId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isAllDay: formData.isAllDay,
        notes: formData.notes || undefined,
      };

      // Only include times if not all-day
      if (!formData.isAllDay) {
        submitData.startTime = formData.startTime;
        submitData.endTime = formData.endTime;
      }

      await createMutation.mutateAsync(submitData);
      setSubmitSuccess(true);
      setTimeout(() => {
        onSaved?.();
        onClose();
      }, 1000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create time-off request');
    }
  };

  const handleClose = () => {
    setFormData({
      staffMemberId: staffMemberId || '',
      timeOffTypeId: '',
      startDate: '',
      endDate: '',
      isAllDay: true,
      startTime: '09:00',
      endTime: '17:00',
      notes: '',
    });
    setSubmitError(null);
    setSubmitSuccess(false);
    onClose();
  };

  const activeStaff = staffMembers.filter(s => s.status === 'Active');

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 420 },
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
            Request Time Off
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
            Time-off request submitted successfully
          </Alert>
        )}

        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        <Stack spacing={3}>
          {/* Staff Member (only shown if not pre-selected) */}
          {!staffMemberId && (
            <FormControl fullWidth required>
              <InputLabel>Staff Member</InputLabel>
              <Select
                value={formData.staffMemberId}
                onChange={(e) => setFormData({ ...formData, staffMemberId: e.target.value })}
                label="Staff Member"
              >
                <MenuItem value="">Select Staff Member</MenuItem>
                {activeStaff.map(member => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Time-off Type */}
          <FormControl fullWidth required>
            <InputLabel>Time-off Type</InputLabel>
            <Select
              value={formData.timeOffTypeId}
              onChange={(e) => setFormData({ ...formData, timeOffTypeId: e.target.value })}
              label="Time-off Type"
              renderValue={(value) => {
                const type = timeOffTypes.find(t => t.id === value);
                return type ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: type.color,
                      }}
                    />
                    {type.name}
                  </Box>
                ) : 'Select Type';
              }}
            >
              <MenuItem value="">Select Type</MenuItem>
              {timeOffTypes.filter(t => t.isActive).map(type => (
                <MenuItem key={type.id} value={type.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: type.color,
                      }}
                    />
                    {type.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Start Date */}
          <TextField
            label="Start Date"
            type="date"
            fullWidth
            required
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          {/* End Date */}
          <TextField
            label="End Date"
            type="date"
            fullWidth
            required
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          {/* All Day Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={formData.isAllDay}
                onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
              />
            }
            label="All Day"
          />

          {/* Time fields (only shown when not all-day) */}
          {!formData.isAllDay && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Start Time"
                type="time"
                fullWidth
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="End Time"
                type="time"
                fullWidth
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
          )}

          {/* Notes */}
          <TextField
            label="Notes"
            fullWidth
            multiline
            rows={4}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Optional notes for manager review..."
          />
        </Stack>
      </Box>

      {/* Actions */}
      <Divider />
      <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'flex-end', backgroundColor: 'background.default' }}>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={<Save />}
          disabled={
            !formData.staffMemberId ||
            !formData.timeOffTypeId ||
            !formData.startDate ||
            !formData.endDate ||
            createMutation.isPending
          }
        >
          {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
        </Button>
      </Box>
    </Drawer>
  );
};

export default TimeOffRequestDrawer;
