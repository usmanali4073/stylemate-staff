import React, { useState, useEffect, useMemo } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  IconButton,
  Alert,
  Checkbox,
  FormControlLabel,
  Collapse,
  Stack,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useActiveBusinessId } from '@/hooks/useActiveBusinessId';
import { useStaffMembers, useStaffLocations } from '@/hooks/useStaff';
import {
  useCreateShift,
  useUpdateShift,
  useDeleteShift,
  useCreateRecurringPattern,
} from '@/hooks/useSchedule';
import type { ShiftOccurrence, ShiftType } from '@/types/schedule';

interface BusinessLocation {
  id: string;
  locationName: string;
  isPrimary: boolean;
  isActive: boolean;
}

interface ShiftFormDrawerProps {
  open: boolean;
  onClose: () => void;
  businessId: string | null;
  mode: 'add' | 'edit';
  shift?: ShiftOccurrence;
  prefillDate?: string;
  prefillStaffMemberId?: string;
  onSaved?: () => void;
}

const SHIFT_TYPES: ShiftType[] = ['Opening', 'Mid', 'Closing', 'Custom'];
const DAYS_OF_WEEK = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ShiftFormDrawer: React.FC<ShiftFormDrawerProps> = ({
  open,
  onClose,
  businessId,
  mode,
  shift,
  prefillDate,
  prefillStaffMemberId,
  onSaved,
}) => {
  // State
  const [staffMemberId, setStaffMemberId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [shiftType, setShiftType] = useState<ShiftType>('Custom');
  const [notes, setNotes] = useState('');

  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringExpanded, setRecurringExpanded] = useState(false);
  const [repeatType, setRepeatType] = useState<'daily' | 'weekly'>('weekly');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [patternStart, setPatternStart] = useState('');
  const [patternEnd, setPatternEnd] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [businessLocations, setBusinessLocations] = useState<BusinessLocation[]>([]);

  // Hooks
  const { data: staffMembers = [] } = useStaffMembers(businessId);
  const { data: staffLocations } = useStaffLocations(businessId, staffMemberId || null);
  const createShiftMutation = useCreateShift(businessId || '');
  const updateShiftMutation = useUpdateShift(businessId || '');
  const deleteShiftMutation = useDeleteShift(businessId || '');
  const createRecurringMutation = useCreateRecurringPattern(businessId || '');

  // Filter to active staff only
  const activeStaff = useMemo(
    () => staffMembers.filter((s) => s.status === 'Active'),
    [staffMembers]
  );

  // Fetch business locations
  useEffect(() => {
    if (!businessId || !open) return;
    const apiUrl = import.meta.env.VITE_BUSINESS_API_URL || '';
    const token =
      localStorage.getItem('stylemate-auth-token') ||
      sessionStorage.getItem('stylemate-auth-token');
    fetch(`${apiUrl}/api/businesses/${businessId}/locations`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: BusinessLocation[]) => setBusinessLocations(data.filter((l) => l.isActive)))
      .catch(() => setBusinessLocations([]));
  }, [businessId, open]);

  // Filter locations to those assigned to the selected staff member
  const availableLocations = useMemo(() => {
    if (!staffLocations || staffLocations.length === 0) return businessLocations;
    const assignedIds = new Set(staffLocations.map((sl) => sl.locationId));
    return businessLocations.filter((l) => assignedIds.has(l.id));
  }, [businessLocations, staffLocations]);

  // Auto-set locationId when only 1 location available
  useEffect(() => {
    if (availableLocations.length === 1 && staffMemberId && !locationId) {
      setLocationId(availableLocations[0].id);
    }
  }, [availableLocations, staffMemberId, locationId]);

  // Initialize form on open (drawer form reset pattern)
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && shift) {
        setStaffMemberId(shift.staffMemberId);
        setLocationId(shift.locationId || '');
        setDate(shift.date);
        setStartTime(shift.startTime);
        setEndTime(shift.endTime);
        setShiftType(shift.shiftType as ShiftType);
        setNotes(shift.notes || '');
        setIsRecurring(false); // Cannot edit recurring pattern from shift edit
      } else {
        setStaffMemberId(prefillStaffMemberId || '');
        setLocationId('');
        setDate(prefillDate || '');
        setStartTime('09:00');
        setEndTime('17:00');
        setShiftType('Custom');
        setNotes('');
        setIsRecurring(false);
        setRepeatType('weekly');
        setSelectedDays([]);
        setPatternStart(prefillDate || '');
        setPatternEnd('');
      }
      setError(null);
    }
  }, [open, mode, shift, prefillDate, prefillStaffMemberId]);

  // Auto-select current day when date is set for weekly recurrence
  useEffect(() => {
    if (date && isRecurring && repeatType === 'weekly' && selectedDays.length === 0) {
      const dayOfWeek = new Date(date + 'T00:00:00').getDay();
      setSelectedDays([DAYS_OF_WEEK[dayOfWeek]]);
    }
  }, [date, isRecurring, repeatType, selectedDays.length]);

  // Auto-set pattern start to shift date
  useEffect(() => {
    if (date && isRecurring && !patternStart) {
      setPatternStart(date);
    }
  }, [date, isRecurring, patternStart]);

  // Toggle day selection
  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Build rrule string
  const buildRrule = (): string => {
    if (repeatType === 'daily') {
      return 'FREQ=DAILY';
    } else if (repeatType === 'weekly') {
      const byday = selectedDays.join(',');
      return `FREQ=WEEKLY${byday ? `;BYDAY=${byday}` : ''}`;
    }
    return 'FREQ=WEEKLY';
  };

  const handleSave = async () => {
    try {
      setError(null);

      if (!staffMemberId || !date || !startTime || !endTime) {
        setError('Please fill in all required fields');
        return;
      }

      if (isRecurring && mode === 'add') {
        // Create recurring pattern
        if (repeatType === 'weekly' && selectedDays.length === 0) {
          setError('Please select at least one day for weekly recurrence');
          return;
        }

        await createRecurringMutation.mutateAsync({
          staffMemberId,
          locationId: locationId || undefined,
          rrule: buildRrule(),
          startTime,
          endTime,
          patternStart: patternStart || date,
          patternEnd: patternEnd || undefined,
          shiftType,
          notes: notes || undefined,
        });
      } else if (mode === 'edit' && shift?.shiftId) {
        // Update existing shift
        await updateShiftMutation.mutateAsync({
          shiftId: shift.shiftId,
          data: {
            date,
            startTime,
            endTime,
            shiftType,
            locationId: locationId || undefined,
            notes: notes || undefined,
          },
        });
      } else {
        // Create one-off shift
        await createShiftMutation.mutateAsync({
          data: {
            staffMemberId,
            date,
            startTime,
            endTime,
            shiftType,
            locationId: locationId || undefined,
            notes: notes || undefined,
          },
        });
      }

      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save shift');
    }
  };

  const handleDelete = async () => {
    if (!shift?.shiftId) return;

    try {
      setError(null);
      await deleteShiftMutation.mutateAsync(shift.shiftId);
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete shift');
    }
  };

  const isPending =
    createShiftMutation.isPending ||
    updateShiftMutation.isPending ||
    deleteShiftMutation.isPending ||
    createRecurringMutation.isPending;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 450 },
          maxWidth: '100%',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'background.default',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScheduleIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            {mode === 'add' ? 'Add New Shift' : 'Edit Shift'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
        <Stack spacing={3}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <FormControl fullWidth>
            <InputLabel>Staff Member</InputLabel>
            <Select
              value={staffMemberId}
              onChange={(e) => {
                setStaffMemberId(e.target.value);
                setLocationId(''); // Reset location when staff changes
              }}
              label="Staff Member"
              disabled={mode === 'edit'}
            >
              <MenuItem value="">Select Staff Member</MenuItem>
              {activeStaff.map((member) => (
                <MenuItem key={member.id} value={member.id}>
                  {member.firstName} {member.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {staffMemberId && availableLocations.length > 1 && (
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                label="Location"
              >
                <MenuItem value="">No location</MenuItem>
                {availableLocations.map((loc) => (
                  <MenuItem key={loc.id} value={loc.id}>
                    {loc.locationName}
                    {loc.isPrimary ? ' (Primary)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            label="Date"
            type="date"
            fullWidth
            value={date}
            onChange={(e) => setDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            disabled={mode === 'edit' && !!shift?.isFromPattern}
            required
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Start Time"
              type="time"
              fullWidth
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              required
            />
            <TextField
              label="End Time"
              type="time"
              fullWidth
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              required
            />
          </Box>

          <FormControl fullWidth>
            <InputLabel>Shift Type</InputLabel>
            <Select
              value={shiftType}
              onChange={(e) => setShiftType(e.target.value as ShiftType)}
              label="Shift Type"
            >
              {SHIFT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Notes"
            fullWidth
            multiline
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes..."
          />

          {/* Recurrence Section - Only on create mode */}
          {mode === 'add' && (
            <>
              <Divider />
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                  onClick={() => setRecurringExpanded(!recurringExpanded)}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isRecurring}
                        onChange={(e) => {
                          setIsRecurring(e.target.checked);
                          if (e.target.checked) {
                            setRecurringExpanded(true);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    }
                    label="Make recurring"
                  />
                  <IconButton
                    size="small"
                    sx={{
                      transform: recurringExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s',
                    }}
                  >
                    <ExpandMoreIcon />
                  </IconButton>
                </Box>

                <Collapse in={isRecurring && recurringExpanded} timeout="auto">
                  <Stack spacing={2} sx={{ mt: 2, pl: 4 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Repeat</InputLabel>
                      <Select
                        value={repeatType}
                        onChange={(e) => setRepeatType(e.target.value as 'daily' | 'weekly')}
                        label="Repeat"
                      >
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                      </Select>
                    </FormControl>

                    {repeatType === 'weekly' && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Repeat on
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {DAYS_OF_WEEK.map((day, idx) => (
                            <Button
                              key={day}
                              variant={selectedDays.includes(day) ? 'contained' : 'outlined'}
                              size="small"
                              onClick={() => toggleDay(day)}
                              sx={{ minWidth: 40, flex: 1 }}
                            >
                              {DAY_LABELS[idx]}
                            </Button>
                          ))}
                        </Box>
                      </Box>
                    )}

                    <TextField
                      label="Pattern Start Date"
                      type="date"
                      fullWidth
                      size="small"
                      value={patternStart}
                      onChange={(e) => setPatternStart(e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />

                    <TextField
                      label="Pattern End Date (Optional)"
                      type="date"
                      fullWidth
                      size="small"
                      value={patternEnd}
                      onChange={(e) => setPatternEnd(e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                      helperText="Leave empty for no end date"
                    />
                  </Stack>
                </Collapse>
              </Box>
            </>
          )}
        </Stack>
      </Box>

      {/* Footer */}
      <Divider />
      <Box
        sx={{
          p: 2,
          display: 'flex',
          gap: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'background.default',
        }}
      >
        {mode === 'edit' && shift?.shiftId && (
          <Button color="error" startIcon={<DeleteIcon />} onClick={handleDelete} disabled={isPending}>
            Delete
          </Button>
        )}
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!staffMemberId || !date || isPending}
        >
          {mode === 'add' ? (isRecurring ? 'Create Pattern' : 'Add Shift') : 'Save Changes'}
        </Button>
      </Box>
    </Drawer>
  );
};

export default ShiftFormDrawer;
