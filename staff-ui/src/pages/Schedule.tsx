import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  MenuItem,
  Select,
  FormControl,
  IconButton,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stack,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  CalendarMonth as CalendarMonthIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  EventBusy as EventBusyIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useActiveBusinessId } from '@/hooks/useActiveBusinessId';
import { useStaffMembers } from '@/hooks/useStaff';
import { StaffHeaderControlsContext } from './StaffManagement';
import ScheduleCalendar from '@/components/organisms/ScheduleCalendar';
import ShiftFormDrawer from '@/components/molecules/ShiftFormDrawer';
import TimeOffApprovalList from '@/components/organisms/TimeOffApprovalList';
import { usePendingTimeOffCount } from '@/hooks/useTimeOff';
import type { ShiftOccurrence, ShiftConflictResponse } from '@/types/schedule';
import type { ConflictError } from '@/services/scheduleApiService';

interface BusinessLocation {
  id: string;
  locationName: string;
  addressLine1: string | null;
  isPrimary: boolean;
  isActive: boolean;
}

function isConflictError(err: unknown): err is ConflictError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'isConflict' in err &&
    (err as ConflictError).isConflict === true
  );
}

const Schedule: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { setHeaderControls } = useContext(StaffHeaderControlsContext);
  const businessId = useActiveBusinessId();

  // State
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [selectedStaffMember, setSelectedStaffMember] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [timeOffDrawerOpen, setTimeOffDrawerOpen] = useState(false);

  // Shift dialog state
  const [shiftDialog, setShiftDialog] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    shift?: ShiftOccurrence;
    prefillDate?: string;
    prefillStaffMemberId?: string;
  }>({ open: false, mode: 'add' });

  // Conflict dialog state
  const [conflictDialog, setConflictDialog] = useState<{
    open: boolean;
    conflicts: ShiftConflictResponse[];
    hasErrors: boolean;
  }>({ open: false, conflicts: [], hasErrors: false });

  // Business locations state
  const [businessLocations, setBusinessLocations] = useState<BusinessLocation[]>([]);

  // Fetch business locations from business-management API
  useEffect(() => {
    if (!businessId) return;
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
  }, [businessId]);

  // Fetch staff members
  const { data: staffMembers = [] } = useStaffMembers(businessId);

  // Fetch pending time-off count for badge
  const { data: pendingCount = 0 } = usePendingTimeOffCount(businessId);

  // Filter to active staff only
  const activeStaff = useMemo(
    () => staffMembers.filter((s) => s.status === 'Active'),
    [staffMembers]
  );

  // Calculate date range for calendar (week or day)
  const dateRange = useMemo(() => {
    const weekStart = new Date(currentWeek);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return {
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0],
    };
  }, [currentWeek]);

  // Navigation
  const goToPreviousWeek = useCallback(() => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    setCurrentWeek(newWeek);
  }, [currentWeek]);

  const goToNextWeek = useCallback(() => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  }, [currentWeek]);

  const goToToday = useCallback(() => {
    setCurrentWeek(new Date());
  }, []);

  // Header controls
  useEffect(() => {
    if (isMobile) {
      setHeaderControls(
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
          <FormControl size="small" sx={{ minWidth: 100, flex: 1 }}>
            <Select
              value={selectedStaffMember}
              onChange={(e) => setSelectedStaffMember(e.target.value)}
              displayEmpty
              variant="outlined"
              sx={{ height: 40 }}
            >
              <MenuItem value="">All</MenuItem>
              {activeStaff.map((member) => (
                <MenuItem key={member.id} value={member.id}>
                  {member.firstName} {member.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <IconButton
            onClick={() => setShiftDialog({ open: true, mode: 'add' })}
            sx={{
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': { backgroundColor: 'primary.dark' },
              width: 40,
              height: 40,
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
      );
    } else {
      setHeaderControls(
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select
              value={selectedStaffMember}
              onChange={(e) => setSelectedStaffMember(e.target.value)}
              displayEmpty
              variant="outlined"
              sx={{ height: 36 }}
            >
              <MenuItem value="">All Staff</MenuItem>
              {activeStaff.map((member) => (
                <MenuItem key={member.id} value={member.id}>
                  {member.firstName} {member.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {businessLocations.length > 1 && (
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <Select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                displayEmpty
                variant="outlined"
                sx={{ height: 36 }}
              >
                <MenuItem value="">All Locations</MenuItem>
                {businessLocations.map((loc) => (
                  <MenuItem key={loc.id} value={loc.id}>
                    {loc.locationName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'week' | 'day')}
              variant="outlined"
              sx={{ height: 36 }}
            >
              <MenuItem value="week">Week</MenuItem>
              <MenuItem value="day">Day</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            size="small"
            onClick={goToToday}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Today
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<EventBusyIcon />}
            onClick={() => setTimeOffDrawerOpen(true)}
            sx={{ whiteSpace: 'nowrap', position: 'relative' }}
          >
            Time Off
            {pendingCount > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  bgcolor: 'warning.main',
                  color: 'warning.contrastText',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}
              >
                {pendingCount}
              </Box>
            )}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShiftDialog({ open: true, mode: 'add' })}
            size="small"
            sx={{ whiteSpace: 'nowrap' }}
          >
            Add Shift
          </Button>
        </Box>
      );
    }

    return () => setHeaderControls(null);
  }, [
    selectedStaffMember,
    selectedLocation,
    viewMode,
    activeStaff,
    businessLocations,
    isMobile,
    setHeaderControls,
    goToToday,
  ]);

  // Handle shift click (edit)
  const handleShiftClick = (shift: ShiftOccurrence) => {
    setShiftDialog({
      open: true,
      mode: 'edit',
      shift,
    });
  };

  // Handle date click (add)
  const handleDateClick = (date: string, staffMemberId?: string) => {
    setShiftDialog({
      open: true,
      mode: 'add',
      prefillDate: date,
      prefillStaffMemberId: staffMemberId,
    });
  };

  // Handle shift saved
  const handleShiftSaved = () => {
    // Calendar will refresh automatically via TanStack Query invalidation
  };

  // Handle conflict dialog
  const handleConflictCancel = () => {
    setConflictDialog({ open: false, conflicts: [], hasErrors: false });
  };

  // Default to day view on mobile
  useEffect(() => {
    if (isMobile && viewMode === 'week') {
      setViewMode('day');
    }
  }, [isMobile, viewMode]);

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
      {/* Schedule-X Calendar */}
      <ScheduleCalendar
        businessId={businessId}
        locationId={selectedLocation || undefined}
        staffMemberId={selectedStaffMember || undefined}
        startDate={dateRange.start}
        endDate={dateRange.end}
        onShiftClick={handleShiftClick}
        onDateClick={handleDateClick}
        view={viewMode}
      />

      {/* Shift Form Drawer */}
      <ShiftFormDrawer
        open={shiftDialog.open}
        onClose={() => setShiftDialog({ open: false, mode: 'add' })}
        businessId={businessId}
        mode={shiftDialog.mode}
        shift={shiftDialog.shift}
        prefillDate={shiftDialog.prefillDate}
        prefillStaffMemberId={shiftDialog.prefillStaffMemberId}
        onSaved={handleShiftSaved}
      />

      {/* Time-off Drawer */}
      {timeOffDrawerOpen && (
        <Dialog
          open={timeOffDrawerOpen}
          onClose={() => setTimeOffDrawerOpen(false)}
          maxWidth="md"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              minHeight: '80vh',
            },
          }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight={600}>
              Time-off Management
            </Typography>
            <IconButton onClick={() => setTimeOffDrawerOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <TimeOffApprovalList businessId={businessId || ''} />
          </DialogContent>
        </Dialog>
      )}

      {/* Conflict Warning Dialog */}
      <Dialog open={conflictDialog.open} onClose={handleConflictCancel} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {conflictDialog.hasErrors ? (
            <ErrorIcon color="error" />
          ) : (
            <WarningIcon color="warning" />
          )}
          {conflictDialog.hasErrors ? 'Schedule Conflict' : 'Schedule Warning'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {conflictDialog.conflicts.map((conflict, idx) => (
              <Alert
                key={idx}
                severity={conflict.severity === 'error' ? 'error' : 'warning'}
                variant="outlined"
              >
                <Typography variant="body2">{conflict.message}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Type:{' '}
                  {conflict.type === 'location_conflict'
                    ? 'Location conflict'
                    : conflict.type === 'overlap'
                    ? 'Time overlap'
                    : 'Overtime'}
                </Typography>
              </Alert>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleConflictCancel}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Schedule;
