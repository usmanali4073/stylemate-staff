import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  Avatar,
  Chip,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  Drawer,
  TextField,
  useMediaQuery,
  useTheme,
  Alert,
  Divider,
  Stack,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Schedule as ScheduleIcon,
  CalendarMonth as CalendarMonthIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useActiveBusinessId } from '@/hooks/useActiveBusinessId';
import { useStaffMembers, useStaffLocations } from '@/hooks/useStaff';
import { useShifts, useCreateShift, useUpdateShift, useDeleteShift, useBulkCreateShifts } from '@/hooks/useSchedule';
import type { ShiftResponse, ShiftConflictResponse } from '@/types/schedule';
import type { ConflictError } from '@/services/scheduleApiService';
import { StaffHeaderControlsContext } from './StaffManagement';

interface WeekDay {
  date: string;
  dayName: string;
  dayNumber: number;
  month: number;
  monthName: string;
  shortName: string;
}

interface BusinessLocation {
  id: string;
  locationName: string;
  addressLine1: string | null;
  isPrimary: boolean;
  isActive: boolean;
}

const getStatusBadge = (status: string) => {
  const configs: Record<string, { label: string; bgColor: string; textColor: string }> = {
    Pending: { label: 'Pending', bgColor: '#FFF4E5', textColor: '#663C00' },
    Scheduled: { label: 'Scheduled', bgColor: '#E3F2FD', textColor: '#0D47A1' },
    Confirmed: { label: 'Confirmed', bgColor: '#E8F5E9', textColor: '#1B5E20' },
    Rejected: { label: 'Rejected', bgColor: '#FFEBEE', textColor: '#B71C1C' },
    Completed: { label: 'Completed', bgColor: '#F5F5F5', textColor: '#424242' },
    Cancelled: { label: 'Cancelled', bgColor: '#FAFAFA', textColor: '#757575' },
    NoShow: { label: 'No Show', bgColor: '#FBE9E7', textColor: '#BF360C' },
  };
  return configs[status] || configs.Scheduled;
};

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
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  // Shift dialog state
  const [shiftDialog, setShiftDialog] = useState<{
    open: boolean;
    type: 'add' | 'edit';
    shift?: ShiftResponse;
    staffMemberId?: string;
    date?: string;
  }>({ open: false, type: 'add' });

  // Bulk schedule state
  const [bulkDialog, setBulkDialog] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    staffMemberId: '',
    startDate: '',
    endDate: '',
    days: [] as string[],
    startTime: '09:00',
    endTime: '17:00',
    locationId: '',
    notes: ''
  });

  // Form state
  const [shiftForm, setShiftForm] = useState({
    staffMemberId: '',
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    locationId: '',
    notes: ''
  });

  const [error, setError] = useState<string | null>(null);

  // Conflict dialog state
  const [conflictDialog, setConflictDialog] = useState<{
    open: boolean;
    conflicts: ShiftConflictResponse[];
    hasErrors: boolean;
    source: 'single' | 'bulk';
  }>({ open: false, conflicts: [], hasErrors: false, source: 'single' });

  // Business locations state
  const [businessLocations, setBusinessLocations] = useState<BusinessLocation[]>([]);

  // Fetch business locations from business-management API
  useEffect(() => {
    if (!businessId) return;
    const apiUrl = import.meta.env.VITE_BUSINESS_API_URL || '';
    const token = localStorage.getItem('stylemate-auth-token') || sessionStorage.getItem('stylemate-auth-token');
    fetch(`${apiUrl}/api/businesses/${businessId}/locations`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : [])
      .then((data: BusinessLocation[]) => setBusinessLocations(data.filter(l => l.isActive)))
      .catch(() => setBusinessLocations([]));
  }, [businessId]);

  // Staff locations for selected staff member in shift form
  const { data: staffLocations } = useStaffLocations(
    businessId || null,
    shiftForm.staffMemberId || null
  );

  // Staff locations for selected staff member in bulk form
  const { data: bulkStaffLocations } = useStaffLocations(
    businessId || null,
    bulkForm.staffMemberId || null
  );

  // Filter locations to those assigned to the selected staff member
  const availableLocationsForShift = useMemo(() => {
    if (!staffLocations || staffLocations.length === 0) return businessLocations;
    const assignedIds = new Set(staffLocations.map(sl => sl.locationId));
    return businessLocations.filter(l => assignedIds.has(l.id));
  }, [businessLocations, staffLocations]);

  const availableLocationsForBulk = useMemo(() => {
    if (!bulkStaffLocations || bulkStaffLocations.length === 0) return businessLocations;
    const assignedIds = new Set(bulkStaffLocations.map(sl => sl.locationId));
    return businessLocations.filter(l => assignedIds.has(l.id));
  }, [businessLocations, bulkStaffLocations]);

  // Auto-set locationId when only 1 location available (dropdown hidden)
  useEffect(() => {
    if (availableLocationsForShift.length === 1 && shiftForm.staffMemberId && !shiftForm.locationId) {
      setShiftForm(prev => ({ ...prev, locationId: availableLocationsForShift[0].id }));
    }
  }, [availableLocationsForShift, shiftForm.staffMemberId, shiftForm.locationId]);

  useEffect(() => {
    if (availableLocationsForBulk.length === 1 && bulkForm.staffMemberId && !bulkForm.locationId) {
      setBulkForm(prev => ({ ...prev, locationId: availableLocationsForBulk[0].id }));
    }
  }, [availableLocationsForBulk, bulkForm.staffMemberId, bulkForm.locationId]);

  // Generate week days
  const generateWeekDays = (startDate: Date): WeekDay[] => {
    const days: WeekDay[] = [];
    const current = new Date(startDate);
    for (let i = 0; i < 7; i++) {
      days.push({
        date: current.toISOString().split('T')[0],
        dayName: current.toLocaleDateString('en-US', { weekday: 'long' }),
        dayNumber: current.getDate(),
        month: current.getMonth(),
        monthName: current.toLocaleDateString('en-US', { month: 'short' }),
        shortName: current.toLocaleDateString('en-US', { weekday: 'short' })
      });
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const getWeekStart = (date: Date): Date => {
    const start = new Date(date);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  // Update week days when current week changes
  useEffect(() => {
    const weekStart = getWeekStart(currentWeek);
    setWeekDays(generateWeekDays(weekStart));
  }, [currentWeek]);

  // Computed date range for API
  const dateRange = useMemo(() => {
    if (weekDays.length < 7) return { start: '', end: '' };
    return { start: weekDays[0].date, end: weekDays[6].date };
  }, [weekDays]);

  // Real API hooks
  const { data: staffMembers = [] } = useStaffMembers(businessId);
  const { data: shifts = [], isLoading } = useShifts(
    businessId,
    dateRange.start,
    dateRange.end,
    selectedMember || undefined
  );
  const createShiftMutation = useCreateShift(businessId || '');
  const updateShiftMutation = useUpdateShift(businessId || '');
  const deleteShiftMutation = useDeleteShift(businessId || '');
  const bulkCreateMutation = useBulkCreateShifts(businessId || '');

  // Filter to active staff only
  const activeStaff = useMemo(() =>
    staffMembers.filter((s) => s.status === 'Active'),
    [staffMembers]
  );

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

  // Header controls
  useEffect(() => {
    const weekRangeDisplay = weekDays.length > 0
      ? `${weekDays[0].shortName} ${weekDays[0].dayNumber} - ${weekDays[6].shortName} ${weekDays[6].dayNumber}`
      : '';

    if (isMobile) {
      setHeaderControls(
        <>
          <FormControl size="small" sx={{ minWidth: 100, flex: 1 }}>
            <Select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              displayEmpty
              variant="outlined"
              sx={{ height: 40 }}
            >
              <MenuItem value="">All</MenuItem>
              {activeStaff.map(member => (
                <MenuItem key={member.id} value={member.id}>
                  {member.firstName} {member.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 0.5,
            backgroundColor: 'action.hover', borderRadius: 2, px: 0.5
          }}>
            <IconButton onClick={goToPreviousWeek} size="small">
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Typography variant="caption" sx={{ minWidth: 70, textAlign: 'center', fontSize: '0.75rem', fontWeight: 500 }}>
              {weekRangeDisplay}
            </Typography>
            <IconButton onClick={goToNextWeek} size="small">
              <ArrowForwardIcon fontSize="small" />
            </IconButton>
          </Box>

          <IconButton
            onClick={() => handleAddShift()}
            sx={{
              backgroundColor: 'primary.main', color: 'primary.contrastText',
              '&:hover': { backgroundColor: 'primary.dark' },
              width: 40, height: 40
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>

          <IconButton
            onClick={handleBulkSchedule}
            sx={{
              backgroundColor: 'secondary.main', color: 'secondary.contrastText',
              '&:hover': { backgroundColor: 'secondary.dark' },
              width: 40, height: 40
            }}
          >
            <CalendarMonthIcon fontSize="small" />
          </IconButton>
        </>
      );
    } else {
      setHeaderControls(
        <>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              displayEmpty
              variant="outlined"
              sx={{ height: 36 }}
            >
              <MenuItem value="">All Members</MenuItem>
              {activeStaff.map(member => (
                <MenuItem key={member.id} value={member.id}>
                  {member.firstName} {member.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 0.5,
            backgroundColor: 'background.default', borderRadius: 1, px: 0.5,
            border: 1, borderColor: 'divider'
          }}>
            <IconButton onClick={goToPreviousWeek} size="small">
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Typography variant="caption" sx={{ minWidth: 100, textAlign: 'center', fontSize: '0.75rem' }}>
              {weekRangeDisplay}
            </Typography>
            <IconButton onClick={goToNextWeek} size="small">
              <ArrowForwardIcon fontSize="small" />
            </IconButton>
          </Box>

          <Button variant="outlined" startIcon={<CalendarMonthIcon />} onClick={handleBulkSchedule} size="small" sx={{ whiteSpace: 'nowrap' }}>
            Bulk
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleAddShift()} size="small" sx={{ whiteSpace: 'nowrap' }}>
            Add Shift
          </Button>
        </>
      );
    }

    return () => setHeaderControls(null);
  }, [selectedMember, activeStaff, weekDays, isMobile, goToPreviousWeek, goToNextWeek, setHeaderControls]);

  // Get shift for a specific day and staff member
  const getShiftForDay = (date: string, staffMemberId: string): ShiftResponse | null => {
    return shifts.find(shift =>
      shift.date === date && shift.staffMemberId === staffMemberId
    ) || null;
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour % 12 || 12;
    return `${displayHour}${minutes !== '00' ? ':' + minutes : ''}${ampm}`;
  };

  const formatShiftTime = (startTime: string, endTime: string): string => {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  // Location name lookup
  const getLocationName = (locationId: string | null): string | null => {
    if (!locationId) return null;
    const loc = businessLocations.find(l => l.id === locationId);
    return loc?.locationName || null;
  };

  // Display members (filtered or all)
  const displayMembers = selectedMember
    ? activeStaff.filter(m => m.id === selectedMember)
    : activeStaff;

  // Helper to find primary location for a staff member
  const getPrimaryLocationId = (staffLocs: { locationId: string; isPrimary: boolean }[] | undefined): string => {
    if (!staffLocs || staffLocs.length === 0) return '';
    const primary = staffLocs.find(sl => sl.isPrimary);
    return primary ? primary.locationId : staffLocs[0].locationId;
  };

  // Shift management
  const handleAddShift = (staffMemberId?: string, date?: string) => {
    setShiftForm({
      staffMemberId: staffMemberId || '',
      date: date || '',
      startTime: '09:00',
      endTime: '17:00',
      locationId: '',
      notes: ''
    });
    setShiftDialog({ open: true, type: 'add', staffMemberId, date });
  };

  const handleEditShift = (shift: ShiftResponse) => {
    setShiftForm({
      staffMemberId: shift.staffMemberId,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      locationId: shift.locationId || '',
      notes: shift.notes || ''
    });
    setShiftDialog({ open: true, type: 'edit', shift });
  };

  const handleSaveShift = async (forceCreate = false) => {
    try {
      if (shiftDialog.type === 'edit' && shiftDialog.shift) {
        await updateShiftMutation.mutateAsync({
          shiftId: shiftDialog.shift.id,
          data: {
            date: shiftForm.date,
            startTime: shiftForm.startTime,
            endTime: shiftForm.endTime,
            locationId: shiftForm.locationId || undefined,
            notes: shiftForm.notes || undefined,
          }
        });
      } else {
        await createShiftMutation.mutateAsync({
          data: {
            staffMemberId: shiftForm.staffMemberId,
            date: shiftForm.date,
            startTime: shiftForm.startTime,
            endTime: shiftForm.endTime,
            shiftType: 'Custom',
            locationId: shiftForm.locationId || undefined,
            notes: shiftForm.notes || undefined,
          },
          forceCreate,
        });
      }
      setShiftDialog({ open: false, type: 'add' });
      setError(null);
    } catch (err) {
      if (isConflictError(err)) {
        setConflictDialog({
          open: true,
          conflicts: err.conflicts,
          hasErrors: err.hasErrors,
          source: 'single',
        });
      } else {
        setError(err instanceof Error ? err.message : 'Failed to save shift');
      }
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    try {
      await deleteShiftMutation.mutateAsync(shiftId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete shift');
    }
  };

  // Bulk scheduling
  const handleBulkSchedule = () => {
    const today = new Date().toISOString().split('T')[0];
    setBulkForm({
      staffMemberId: '',
      startDate: today,
      endDate: today,
      days: [],
      startTime: '09:00',
      endTime: '17:00',
      locationId: '',
      notes: ''
    });
    setBulkDialog(true);
  };

  const handleBulkSave = async (forceCreate = false) => {
    try {
      const shiftsToCreate = bulkForm.days.map(date => ({
        staffMemberId: bulkForm.staffMemberId,
        date,
        startTime: bulkForm.startTime,
        endTime: bulkForm.endTime,
        shiftType: 'Custom',
        locationId: bulkForm.locationId || undefined,
        notes: bulkForm.notes || undefined,
      }));

      await bulkCreateMutation.mutateAsync({ data: { shifts: shiftsToCreate }, forceCreate });
      setBulkDialog(false);
      setError(null);
    } catch (err) {
      if (isConflictError(err)) {
        setConflictDialog({
          open: true,
          conflicts: err.conflicts,
          hasErrors: err.hasErrors,
          source: 'bulk',
        });
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create bulk shifts');
      }
    }
  };

  // Conflict dialog handlers
  const handleConflictForceCreate = async () => {
    setConflictDialog({ open: false, conflicts: [], hasErrors: false, source: 'single' });
    if (conflictDialog.source === 'single') {
      await handleSaveShift(true);
    } else {
      await handleBulkSave(true);
    }
  };

  const handleConflictCancel = () => {
    setConflictDialog({ open: false, conflicts: [], hasErrors: false, source: 'single' });
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Typography>Loading schedule...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
      {/* Schedule Grid - Responsive */}
      {isMobile ? (
        /* Mobile View - Card-based */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
          {displayMembers.map((member) => {
            const memberShifts = shifts.filter(s =>
              s.staffMemberId === member.id &&
              weekDays.some(day => day.date === s.date)
            );
            const totalHours = memberShifts.reduce((total, shift) => {
              const start = new Date(`2000-01-01T${shift.startTime}:00`);
              const end = new Date(`2000-01-01T${shift.endTime}:00`);
              return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            }, 0);

            const isExpanded = expandedMemberId === member.id;

            return (
              <Card key={member.id} sx={{ width: '100%', overflow: 'hidden' }}>
                <Box
                  onClick={() => setExpandedMemberId(isExpanded ? null : member.id)}
                  sx={{
                    p: 2,
                    borderBottom: isExpanded ? 1 : 0,
                    borderColor: 'divider',
                    cursor: 'pointer',
                    '&:active': { backgroundColor: 'action.selected' }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={member.photoUrl || undefined}
                      sx={{ width: 48, height: 48, bgcolor: 'primary.main', flexShrink: 0 }}
                    >
                      {member.firstName[0]}{member.lastName[0]}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.firstName} {member.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.jobTitle || 'Staff'}
                      </Typography>
                      {!isExpanded && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          {memberShifts.length} {memberShifts.length === 1 ? 'shift' : 'shifts'} - {totalHours.toFixed(1)}h this week
                        </Typography>
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      sx={{
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s',
                        flexShrink: 0
                      }}
                    >
                      <ExpandMoreIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                        Weekly Schedule
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="primary.main">
                        {totalHours.toFixed(1)}h total
                      </Typography>
                    </Box>
                    <Stack spacing={1}>
                      {weekDays.map((day) => {
                        const shift = getShiftForDay(day.date, member.id);
                        const isToday = day.date === new Date().toISOString().split('T')[0];

                        return (
                          <Box key={day.date} sx={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            p: 1.5, backgroundColor: isToday ? 'primary.light' : 'background.default',
                            borderRadius: 1, border: 1, borderColor: isToday ? 'primary.main' : 'divider'
                          }}>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>{day.dayName}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </Typography>
                            </Box>
                            <Box onClick={(e) => e.stopPropagation()}>
                              {shift ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
                                  <Chip
                                    label={formatShiftTime(shift.startTime, shift.endTime)}
                                    onClick={() => handleEditShift(shift)}
                                    size="small"
                                    sx={{
                                      backgroundColor: 'primary.main', color: 'primary.contrastText',
                                      fontWeight: 500, cursor: 'pointer',
                                      '&:hover': { backgroundColor: 'primary.dark' }
                                    }}
                                  />
                                  {getLocationName(shift.locationId) && (
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                      {getLocationName(shift.locationId)}
                                    </Typography>
                                  )}
                                  <Chip
                                    label={getStatusBadge(shift.status).label}
                                    size="small"
                                    sx={{
                                      height: 18, fontSize: '0.65rem',
                                      backgroundColor: getStatusBadge(shift.status).bgColor,
                                      color: getStatusBadge(shift.status).textColor,
                                      fontWeight: 600
                                    }}
                                  />
                                </Box>
                              ) : (
                                <Button
                                  variant="outlined" size="small"
                                  onClick={() => handleAddShift(member.id, day.date)}
                                  sx={{ minWidth: 'auto', px: 2, fontSize: '0.75rem' }}
                                >
                                  Add
                                </Button>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                </Collapse>
              </Card>
            );
          })}
        </Box>
      ) : (
        /* Desktop View - Grid */
        <Card sx={{ overflow: 'auto' }}>
          {/* Header Row */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 260px) repeat(7, minmax(100px, 1fr))',
            borderBottom: 1, borderColor: 'divider',
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
            minWidth: 'fit-content'
          }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" fontWeight={600}>Team member</Typography>
            </Box>
            {weekDays.map((day, index) => {
              const showMonth = index === 0 || day.month !== weekDays[0].month;
              return (
                <Box key={day.date} sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.75rem' }}>{day.shortName}</Typography>
                  <Typography variant="caption" fontWeight={600} sx={{ display: 'block', fontSize: '0.75rem' }}>
                    {showMonth ? `${day.monthName} ${day.dayNumber}` : day.dayNumber}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    {day.date === new Date().toISOString().split('T')[0] ? 'Today' : ''}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Team Member Rows */}
          {displayMembers.map((member, index) => {
            const memberShifts = shifts.filter(s =>
              s.staffMemberId === member.id &&
              weekDays.some(day => day.date === s.date)
            );
            const totalHours = memberShifts.reduce((total, shift) => {
              const start = new Date(`2000-01-01T${shift.startTime}:00`);
              const end = new Date(`2000-01-01T${shift.endTime}:00`);
              return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            }, 0);

            return (
              <Box
                key={member.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(240px, 260px) repeat(7, minmax(100px, 1fr))',
                  borderBottom: index < displayMembers.length - 1 ? 1 : 0,
                  borderColor: 'divider', minHeight: 60, minWidth: 'fit-content'
                }}
              >
                <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    src={member.photoUrl || undefined}
                    sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '14px' }}
                  >
                    {member.firstName[0]}{member.lastName[0]}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight={500}>
                      {member.firstName} {member.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {member.jobTitle || 'Staff'}
                    </Typography>
                    <Typography variant="caption" color="primary.main" fontWeight={600}>
                      {totalHours.toFixed(1)}h this week
                    </Typography>
                  </Box>
                </Box>

                {weekDays.map((day) => {
                  const shift = getShiftForDay(day.date, member.id);
                  return (
                    <Box
                      key={`${member.id}-${day.date}`}
                      sx={{
                        p: 1, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 0.5,
                        borderRight: 1, borderColor: 'divider'
                      }}
                    >
                      {shift ? (
                        <>
                          <Chip
                            label={formatShiftTime(shift.startTime, shift.endTime)}
                            onClick={() => handleEditShift(shift)}
                            sx={{
                              backgroundColor: 'primary.light', color: 'primary.contrastText',
                              fontWeight: 500, fontSize: '0.75rem', height: 28,
                              cursor: 'pointer', '&:hover': { backgroundColor: 'primary.main' }
                            }}
                          />
                          {getLocationName(shift.locationId) && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', textAlign: 'center' }}>
                              {getLocationName(shift.locationId)}
                            </Typography>
                          )}
                          <Chip
                            label={getStatusBadge(shift.status).label}
                            size="small"
                            sx={{
                              height: 16, fontSize: '0.6rem',
                              backgroundColor: getStatusBadge(shift.status).bgColor,
                              color: getStatusBadge(shift.status).textColor,
                              fontWeight: 600, '& .MuiChip-label': { px: 0.75 }
                            }}
                          />
                        </>
                      ) : (
                        <Button
                          variant="text" size="small"
                          onClick={() => handleAddShift(member.id, day.date)}
                          sx={{
                            color: 'text.disabled', fontSize: '0.75rem', minWidth: 'auto',
                            '&:hover': { color: 'primary.main', backgroundColor: 'primary.light' }
                          }}
                        >
                          +
                        </Button>
                      )}
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mt: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Shift Drawer */}
      <Drawer
        anchor="right"
        open={shiftDialog.open}
        onClose={() => setShiftDialog({ open: false, type: 'add' })}
        sx={{
          '& .MuiDrawer-paper': {
            width: isMobile ? '100%' : 400,
            borderLeft: 1, borderColor: 'divider'
          }
        }}
      >
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          p: 2, borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.default'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              {shiftDialog.type === 'add' ? 'Add New Shift' : 'Edit Shift'}
            </Typography>
          </Box>
          <IconButton onClick={() => setShiftDialog({ open: false, type: 'add' })} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Employee</Typography>
              <Select
                value={shiftForm.staffMemberId}
                onChange={(e) => {
                  const id = e.target.value;
                  setShiftForm({ ...shiftForm, staffMemberId: id, locationId: '' });
                }}
                displayEmpty
              >
                <MenuItem value="">Select Employee</MenuItem>
                {activeStaff.map(member => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {shiftForm.staffMemberId && availableLocationsForShift.length > 1 && (
              <FormControl fullWidth>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Location</Typography>
                <Select
                  value={shiftForm.locationId}
                  onChange={(e) => setShiftForm({ ...shiftForm, locationId: e.target.value })}
                  displayEmpty
                >
                  <MenuItem value="">No location</MenuItem>
                  {availableLocationsForShift.map(loc => (
                    <MenuItem key={loc.id} value={loc.id}>
                      {loc.locationName}{loc.isPrimary ? ' (Primary)' : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label="Date"
              type="date"
              fullWidth
              value={shiftForm.date}
              onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Start Time"
                type="time"
                fullWidth
                value={shiftForm.startTime}
                onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="End Time"
                type="time"
                fullWidth
                value={shiftForm.endTime}
                onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>

            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={4}
              value={shiftForm.notes}
              onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
              placeholder="Optional notes..."
            />
          </Stack>
        </Box>

        <Divider />
        <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'flex-end', backgroundColor: 'background.default' }}>
          {shiftDialog.type === 'edit' && shiftDialog.shift && (
            <Button
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => {
                if (shiftDialog.shift) {
                  handleDeleteShift(shiftDialog.shift.id);
                  setShiftDialog({ open: false, type: 'add' });
                }
              }}
            >
              Delete
            </Button>
          )}
          <Button onClick={() => setShiftDialog({ open: false, type: 'add' })}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={() => handleSaveShift()}
            disabled={!shiftForm.staffMemberId || !shiftForm.date || createShiftMutation.isPending || updateShiftMutation.isPending}
          >
            {shiftDialog.type === 'add' ? 'Add Shift' : 'Save Changes'}
          </Button>
        </Box>
      </Drawer>

      {/* Bulk Schedule Drawer */}
      <Drawer
        anchor="right"
        open={bulkDialog}
        onClose={() => setBulkDialog(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: isMobile ? '100%' : 500,
            borderLeft: 1, borderColor: 'divider'
          }
        }}
      >
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          p: 2, borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.default'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonthIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>Bulk Schedule</Typography>
          </Box>
          <IconButton onClick={() => setBulkDialog(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Employee</Typography>
              <Select
                value={bulkForm.staffMemberId}
                onChange={(e) => {
                  const id = e.target.value;
                  setBulkForm({ ...bulkForm, staffMemberId: id, locationId: '' });
                }}
                displayEmpty
              >
                <MenuItem value="">Select Employee</MenuItem>
                {activeStaff.map(member => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {bulkForm.staffMemberId && availableLocationsForBulk.length > 1 && (
              <FormControl fullWidth>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Location</Typography>
                <Select
                  value={bulkForm.locationId}
                  onChange={(e) => setBulkForm({ ...bulkForm, locationId: e.target.value })}
                  displayEmpty
                >
                  <MenuItem value="">No location</MenuItem>
                  {availableLocationsForBulk.map(loc => (
                    <MenuItem key={loc.id} value={loc.id}>
                      {loc.locationName}{loc.isPrimary ? ' (Primary)' : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                value={bulkForm.startDate}
                onChange={(e) => {
                  const startDate = e.target.value;
                  const start = new Date(startDate + 'T00:00:00');
                  const end = new Date(start);
                  end.setDate(start.getDate() + 6);
                  const endDate = end.toISOString().split('T')[0];
                  setBulkForm({ ...bulkForm, startDate, endDate });
                }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="End Date"
                type="date"
                fullWidth
                value={bulkForm.endDate}
                onChange={(e) => setBulkForm({ ...bulkForm, endDate: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>

            {bulkForm.startDate && bulkForm.endDate && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Select Days ({new Date(bulkForm.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(bulkForm.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 1 }}>
                  {(() => {
                    const start = new Date(bulkForm.startDate + 'T00:00:00');
                    const end = new Date(bulkForm.endDate + 'T00:00:00');
                    const days: { dateStr: string; shortDay: string; monthDay: string }[] = [];
                    const current = new Date(start);
                    while (current <= end) {
                      days.push({
                        dateStr: current.toISOString().split('T')[0],
                        shortDay: current.toLocaleDateString('en-US', { weekday: 'short' }),
                        monthDay: current.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
                      });
                      current.setDate(current.getDate() + 1);
                    }
                    return days.map(({ dateStr, shortDay, monthDay }) => (
                      <Button
                        key={dateStr}
                        variant={bulkForm.days.includes(dateStr) ? 'contained' : 'outlined'}
                        size="small"
                        fullWidth
                        onClick={() => {
                          const newDays = bulkForm.days.includes(dateStr)
                            ? bulkForm.days.filter(d => d !== dateStr)
                            : [...bulkForm.days, dateStr];
                          setBulkForm({ ...bulkForm, days: newDays });
                        }}
                        sx={{ minHeight: 48, fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: 0.5 }}
                      >
                        <Box>{shortDay}</Box>
                        <Box sx={{ fontSize: '0.65rem', opacity: 0.8 }}>{monthDay}</Box>
                      </Button>
                    ));
                  })()}
                </Box>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Start Time"
                type="time"
                fullWidth
                value={bulkForm.startTime}
                onChange={(e) => setBulkForm({ ...bulkForm, startTime: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="End Time"
                type="time"
                fullWidth
                value={bulkForm.endTime}
                onChange={(e) => setBulkForm({ ...bulkForm, endTime: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>

            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={4}
              value={bulkForm.notes}
              onChange={(e) => setBulkForm({ ...bulkForm, notes: e.target.value })}
              placeholder="Optional notes..."
            />
          </Stack>
        </Box>

        <Divider />
        <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'flex-end', backgroundColor: 'background.default' }}>
          <Button onClick={() => setBulkDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={() => handleBulkSave()}
            disabled={!bulkForm.staffMemberId || !bulkForm.startDate || !bulkForm.endDate || bulkForm.days.length === 0 || bulkCreateMutation.isPending}
          >
            Create Shifts
          </Button>
        </Box>
      </Drawer>

      {/* Conflict Warning Dialog */}
      <Dialog
        open={conflictDialog.open}
        onClose={handleConflictCancel}
        maxWidth="sm"
        fullWidth
      >
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
                  Type: {conflict.type === 'location_conflict' ? 'Location conflict' : conflict.type === 'overlap' ? 'Time overlap' : 'Overtime'}
                </Typography>
              </Alert>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleConflictCancel}>Cancel</Button>
          {!conflictDialog.hasErrors && (
            <Button
              variant="contained"
              color="warning"
              onClick={handleConflictForceCreate}
            >
              Create Anyway
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Schedule;
