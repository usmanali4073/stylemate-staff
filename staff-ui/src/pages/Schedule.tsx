import React, { useState, useEffect, useContext, useCallback } from 'react';
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
  Collapse
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Schedule as ScheduleIcon,
  CalendarMonth as CalendarMonthIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { scheduleService, staffService } from '../services';
import type { TeamMember, Shift } from '../types';
import { getContainerStyles, getCardStyles, getGridSpacing, getScrollableContainerStyles } from '../utils/themeUtils';
import { StaffHeaderControlsContext } from './StaffManagement';

interface WeekDay {
  date: string;
  dayName: string;
  dayNumber: number;
  month: number;
  monthName: string;
  shortName: string;
}

// Status badge configuration for shift status display
const getStatusBadge = (status: string) => {
  const configs = {
    pending: {
      label: 'Pending',
      bgColor: '#FFF4E5',
      textColor: '#663C00',
      hoverBgColor: '#FFE082'
    },
    scheduled: {
      label: 'Scheduled',
      bgColor: '#E3F2FD',
      textColor: '#0D47A1',
      hoverBgColor: '#90CAF9'
    },
    confirmed: {
      label: 'Confirmed',
      bgColor: '#E8F5E9',
      textColor: '#1B5E20',
      hoverBgColor: '#81C784'
    },
    rejected: {
      label: 'Rejected',
      bgColor: '#FFEBEE',
      textColor: '#B71C1C',
      hoverBgColor: '#EF5350'
    },
    completed: {
      label: 'Completed',
      bgColor: '#F5F5F5',
      textColor: '#424242',
      hoverBgColor: '#E0E0E0'
    },
    cancelled: {
      label: 'Cancelled',
      bgColor: '#FAFAFA',
      textColor: '#757575',
      hoverBgColor: '#BDBDBD'
    },
    'no-show': {
      label: 'No Show',
      bgColor: '#FBE9E7',
      textColor: '#BF360C',
      hoverBgColor: '#FF7043'
    }
  };

  return configs[status as keyof typeof configs] || configs.scheduled;
};

const Schedule: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { setHeaderControls } = useContext(StaffHeaderControlsContext);

  // State
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  // Dialog state
  const [shiftDialog, setShiftDialog] = useState<{
    open: boolean;
    type: 'add' | 'edit';
    shift?: Shift;
    employeeId?: string;
    date?: string;
  }>({ open: false, type: 'add' });

  // Bulk schedule state
  const [bulkDialog, setBulkDialog] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    employeeId: '',
    startDate: weekDays[0]?.date || '',
    endDate: weekDays[6]?.date || '',
    days: [] as string[],
    startTime: '09:00',
    endTime: '17:00',
    position: '',
    notes: ''
  });

  // Form state
  const [shiftForm, setShiftForm] = useState({
    employeeId: '',
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    position: '',
    notes: ''
  });

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

      // Safely increment to next day
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  // Get start of week (Sunday)
  const getWeekStart = (date: Date): Date => {
    const start = new Date(date);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  // Load data
  useEffect(() => {
    const loadScheduleData = async () => {
      try {
        setLoading(true);

        const weekStart = getWeekStart(currentWeek);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const [membersResponse, shiftsResponse] = await Promise.all([
          staffService.getActiveStaff(),
          scheduleService.getSchedule(
            weekStart.toISOString().split('T')[0],
            weekEnd.toISOString().split('T')[0]
          )
        ]);

        if (membersResponse.success) {
          setTeamMembers(membersResponse.data);
        }

        if (shiftsResponse.success) {
          setShifts(shiftsResponse.data);
        }
      } catch (error) {
        console.error('Error loading schedule data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadScheduleData();
  }, [currentWeek]);

  // Update week days when current week changes
  useEffect(() => {
    const weekStart = getWeekStart(currentWeek);
    setWeekDays(generateWeekDays(weekStart));
  }, [currentWeek]);

  // Navigation functions
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

  // Set header controls
  useEffect(() => {
    const weekRangeDisplay = weekDays.length > 0
      ? `${weekDays[0].dayName.slice(0, 3)} ${weekDays[0].dayNumber} - ${weekDays[6].dayName.slice(0, 3)} ${weekDays[6].dayNumber}`
      : '';

    if (isMobile) {
      // Mobile: Icon-only toolbar at bottom
      setHeaderControls(
        <>
          {/* Member Filter */}
          <FormControl size="small" sx={{ minWidth: 100, flex: 1 }}>
            <Select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              displayEmpty
              variant="outlined"
              sx={{ height: 40 }}
            >
              <MenuItem value="">All</MenuItem>
              {teamMembers.map(member => (
                <MenuItem key={member.id} value={member.id}>
                  {member.personalInfo.firstName} {member.personalInfo.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Week Navigation */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            backgroundColor: 'action.hover',
            borderRadius: 2,
            px: 0.5
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

          {/* Add Shift Button */}
          <IconButton
            onClick={() => handleAddShift()}
            sx={{
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.dark'
              },
              width: 40,
              height: 40
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>

          {/* Bulk Schedule Button */}
          <IconButton
            onClick={handleBulkSchedule}
            sx={{
              backgroundColor: 'secondary.main',
              color: 'secondary.contrastText',
              '&:hover': {
                backgroundColor: 'secondary.dark'
              },
              width: 40,
              height: 40
            }}
          >
            <CalendarMonthIcon fontSize="small" />
          </IconButton>
        </>
      );
    } else {
      // Desktop: Full controls
      setHeaderControls(
        <>
          {/* Member Filter */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              displayEmpty
              variant="outlined"
              sx={{ height: 36 }}
            >
              <MenuItem value="">All Members</MenuItem>
              {teamMembers.map(member => (
                <MenuItem key={member.id} value={member.id}>
                  {member.personalInfo.firstName} {member.personalInfo.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Week Navigation - Compact */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            backgroundColor: 'background.default',
            borderRadius: 1,
            px: 0.5,
            border: 1,
            borderColor: 'divider'
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

          <Button
            variant="outlined"
            startIcon={<CalendarMonthIcon />}
            onClick={handleBulkSchedule}
            size="small"
            sx={{ whiteSpace: 'nowrap' }}
          >
            Bulk
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleAddShift()}
            size="small"
            sx={{ whiteSpace: 'nowrap' }}
          >
            Add Shift
          </Button>
        </>
      );
    }

    return () => setHeaderControls(null);
  }, [selectedMember, teamMembers, weekDays, isMobile, goToPreviousWeek, goToNextWeek, setHeaderControls]);

  // Get shifts for specific day and employee
  const getShiftForDay = (date: string, employeeId: string): Shift | null => {
    return shifts.find(shift =>
      shift.date === date && shift.employeeId === employeeId
    ) || null;
  };

  // Format time for display
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour % 12 || 12;
    return `${displayHour}${minutes !== '00' ? ':' + minutes : ''}${ampm}`;
  };

  // Format shift display
  const formatShiftTime = (startTime: string, endTime: string): string => {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };


  // Filter members if needed
  const displayMembers = selectedMember ?
    teamMembers.filter(m => m.id === selectedMember) :
    teamMembers;

  // Shift management functions
  const handleAddShift = (employeeId?: string, date?: string) => {
    setShiftForm({
      employeeId: employeeId || '',
      date: date || '',
      startTime: '09:00',
      endTime: '17:00',
      position: '',
      notes: ''
    });
    setShiftDialog({ open: true, type: 'add', employeeId, date });
  };

  const handleEditShift = (shift: Shift) => {
    setShiftForm({
      employeeId: shift.employeeId,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      position: shift.position,
      notes: shift.notes || ''
    });
    setShiftDialog({ open: true, type: 'edit', shift });
  };

  const handleSaveShift = async () => {
    try {
      const shiftData = {
        employeeId: shiftForm.employeeId,
        date: shiftForm.date,
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime,
        shiftType: 'custom' as const,
        position: shiftForm.position,
        notes: shiftForm.notes
      };

      let response;
      if (shiftDialog.type === 'edit' && shiftDialog.shift) {
        response = await scheduleService.updateShift(shiftDialog.shift.id, shiftData);
      } else {
        response = await scheduleService.createShift(shiftData);
      }

      if (response.success) {
        // Reload schedule data
        const weekStart = getWeekStart(currentWeek);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const shiftsResponse = await scheduleService.getSchedule(
          weekStart.toISOString().split('T')[0],
          weekEnd.toISOString().split('T')[0]
        );

        if (shiftsResponse.success) {
          setShifts(shiftsResponse.data);
        }

        setShiftDialog({ open: false, type: 'add' });
        setError(null);
      } else {
        setError(response.message);
      }
    } catch {
      setError('Failed to save shift');
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    try {
      const response = await scheduleService.deleteShift(shiftId);
      if (response.success) {
        setShifts(shifts.filter(s => s.id !== shiftId));
        setError(null);
      } else {
        setError(response.message);
      }
    } catch {
      setError('Failed to delete shift');
    }
  };

  // Bulk scheduling functions
  const handleBulkSchedule = () => {
    const today = new Date().toISOString().split('T')[0];
    setBulkForm({
      employeeId: '',
      startDate: today,
      endDate: today,
      days: [] as string[],
      startTime: '09:00',
      endTime: '17:00',
      position: '',
      notes: ''
    });
    setBulkDialog(true);
  };

  const handleBulkSave = async () => {
    try {
      // Create shifts for selected dates
      const shifts = bulkForm.days.map(date => ({
        employeeId: bulkForm.employeeId,
        date: date,
        startTime: bulkForm.startTime,
        endTime: bulkForm.endTime,
        shiftType: 'custom' as const,
        position: bulkForm.position,
        notes: bulkForm.notes
      }));

      // Create all shifts
      const promises = shifts.map(shift => scheduleService.createShift(shift));
      const responses = await Promise.all(promises);

      const failures = responses.filter(r => !r.success);
      const successes = responses.filter(r => r.success);

      // If there are any successes, navigate to the week and reload
      if (successes.length > 0) {
        const firstShiftDate = new Date(bulkForm.days[0] + 'T00:00:00');
        const weekStart = getWeekStart(firstShiftDate);
        setCurrentWeek(firstShiftDate);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const shiftsResponse = await scheduleService.getSchedule(
          weekStart.toISOString().split('T')[0],
          weekEnd.toISOString().split('T')[0]
        );

        if (shiftsResponse.success) {
          setShifts(shiftsResponse.data);
        }
      }

      if (failures.length === 0) {
        // All shifts created successfully
        setBulkDialog(false);
        setError(null);
      } else {
        // Show detailed error messages for failed shifts
        const failureDetails = responses
          .map((r, index) => ({ response: r, date: bulkForm.days[index] }))
          .filter(({ response }) => !response.success)
          .map(({ response, date }) => {
            const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric'
            });
            return `${dateFormatted}: ${response.message}`;
          })
          .join('\n');

        const shift = failures.length === 1 ? 'shift' : 'shifts';
        const summary = successes.length > 0
          ? `Created ${successes.length} ${successes.length === 1 ? 'shift' : 'shifts'}, but ${failures.length} ${shift} failed`
          : `Failed to create ${failures.length} ${shift}`;

        setError(`${summary}:\n${failureDetails}`);
      }
    } catch {
      setError('Failed to create bulk shifts');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Typography>Loading schedule...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      ...getContainerStyles('full')
    }}>

      {/* Schedule Grid - Responsive */}
      {isMobile ? (
        /* Mobile View - Card-based */
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: getGridSpacing().xs,
          width: '100%',
          ...getScrollableContainerStyles()
        }}>
          {displayMembers.map((member) => {
            // Calculate total hours for this member this week
            const memberShifts = shifts.filter(s =>
              s.employeeId === member.id &&
              weekDays.some(day => day.date === s.date)
            );
            const totalHours = memberShifts.reduce((total, shift) => {
              const start = new Date(`2000-01-01T${shift.startTime}:00`);
              const end = new Date(`2000-01-01T${shift.endTime}:00`);
              const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
              return total + hours;
            }, 0);

            const isExpanded = expandedMemberId === member.id;
            const scheduledDays = memberShifts.length;

            return (
              <Card key={member.id} sx={{
                ...getCardStyles(),
                width: '100%',
                overflow: 'hidden'
              }}>
                {/* Header - Tappable to expand/collapse */}
                <Box
                  onClick={() => setExpandedMemberId(isExpanded ? null : member.id)}
                  sx={{
                    p: 2,
                    borderBottom: isExpanded ? 1 : 0,
                    borderColor: 'divider',
                    backgroundColor: 'background.paper',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    '&:active': {
                      backgroundColor: 'action.selected'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={member.personalInfo.avatar}
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: 'primary.main',
                        flexShrink: 0
                      }}
                    >
                      {member.personalInfo.firstName[0]}{member.personalInfo.lastName[0]}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h6" fontWeight={600} sx={{
                        fontSize: '1.1rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {member.personalInfo.firstName} {member.personalInfo.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {member.employment.role}
                      </Typography>
                      {!isExpanded && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          {scheduledDays} {scheduledDays === 1 ? 'shift' : 'shifts'} • {totalHours.toFixed(1)}h this week
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

                {/* Expandable Weekly Schedule */}
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <Box sx={{ p: 2 }}>
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2
                    }}>
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
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 1.5,
                            backgroundColor: isToday ? 'primary.light' : 'background.default',
                            borderRadius: 1,
                            border: 1,
                            borderColor: isToday ? 'primary.main' : 'divider'
                          }}>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {day.dayName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
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
                                      backgroundColor: 'primary.main',
                                      color: 'primary.contrastText',
                                      fontWeight: 500,
                                      cursor: 'pointer',
                                      '&:hover': {
                                        backgroundColor: 'primary.dark'
                                      }
                                    }}
                                  />
                                  <Chip
                                    label={getStatusBadge(shift.status).label}
                                    size="small"
                                    sx={{
                                      height: 18,
                                      fontSize: '0.65rem',
                                      backgroundColor: getStatusBadge(shift.status).bgColor,
                                      color: getStatusBadge(shift.status).textColor,
                                      fontWeight: 600
                                    }}
                                  />
                                </Box>
                              ) : (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleAddShift(member.id, day.date)}
                                  sx={{
                                    minWidth: 'auto',
                                    px: 2,
                                    fontSize: '0.75rem'
                                  }}
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
        <Card sx={{
          overflow: 'hidden',
          ...getScrollableContainerStyles()
        }}>
          {/* Header Row */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 260px) repeat(7, minmax(100px, 1fr))',
            borderBottom: 1,
            borderColor: 'divider',
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
            minWidth: 'fit-content'
          }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" fontWeight={600}>
                Team member
              </Typography>
            </Box>

            {weekDays.map((day, index) => {
              const showMonth = index === 0 || day.month !== weekDays[0].month;

              return (
                <Box key={day.date} sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.75rem' }}>
                    {day.shortName}
                  </Typography>
                  <Typography variant="caption" fontWeight={600} sx={{ display: 'block', fontSize: '0.75rem' }}>
                    {showMonth
                      ? `${day.monthName} ${day.dayNumber}`
                      : day.dayNumber
                    }
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    {day.date === new Date().toISOString().split('T')[0] ? 'Today' :
                     shifts.filter(s => s.date === day.date && s.status === 'confirmed').length > 0 ? '9h' : '0h'
                    }
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Team Member Rows */}
          {displayMembers.map((member, index) => {
            // Calculate total hours for this member this week
            const memberShifts = shifts.filter(s =>
              s.employeeId === member.id &&
              weekDays.some(day => day.date === s.date)
            );
            const totalHours = memberShifts.reduce((total, shift) => {
              const start = new Date(`2000-01-01T${shift.startTime}:00`);
              const end = new Date(`2000-01-01T${shift.endTime}:00`);
              const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
              return total + hours;
            }, 0);

            return (
              <Box
                key={member.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(240px, 260px) repeat(7, minmax(100px, 1fr))',
                  borderBottom: index < displayMembers.length - 1 ? 1 : 0,
                  borderColor: 'divider',
                  minHeight: 60,
                  minWidth: 'fit-content'
                }}
              >
                {/* Member Info */}
                <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    src={member.personalInfo.avatar}
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: 'primary.main',
                      fontSize: '14px'
                    }}
                  >
                    {member.personalInfo.firstName[0]}{member.personalInfo.lastName[0]}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight={500}>
                      {member.personalInfo.firstName} {member.personalInfo.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {member.employment.role}
                    </Typography>
                    <Typography variant="caption" color="primary.main" fontWeight={600}>
                      {totalHours.toFixed(1)}h this week
                    </Typography>
                  </Box>
                </Box>

              {/* Daily Shifts */}
              {weekDays.map((day) => {
                const shift = getShiftForDay(day.date, member.id);

                return (
                  <Box
                    key={`${member.id}-${day.date}`}
                    sx={{
                      p: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.5,
                      borderRight: 1,
                      borderColor: 'divider'
                    }}
                  >
                    {shift ? (
                      <>
                        <Chip
                          label={formatShiftTime(shift.startTime, shift.endTime)}
                          onClick={() => handleEditShift(shift)}
                          sx={{
                            backgroundColor: 'primary.light',
                            color: 'primary.contrastText',
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            height: 28,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'primary.main'
                            }
                          }}
                        />
                        <Chip
                          label={getStatusBadge(shift.status).label}
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: '0.6rem',
                            backgroundColor: getStatusBadge(shift.status).bgColor,
                            color: getStatusBadge(shift.status).textColor,
                            fontWeight: 600,
                            '& .MuiChip-label': {
                              px: 0.75
                            }
                          }}
                        />
                      </>
                    ) : (
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => handleAddShift(member.id, day.date)}
                        sx={{
                          color: 'text.disabled',
                          fontSize: '0.75rem',
                          minWidth: 'auto',
                          '&:hover': {
                            color: 'primary.main',
                            backgroundColor: 'primary.light'
                          }
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
            backgroundColor: 'background.paper',
            borderLeft: 1,
            borderColor: 'divider'
          }
        }}
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'background.default'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              {shiftDialog.type === 'add' ? 'Add New Shift' : 'Edit Shift'}
            </Typography>
          </Box>
          <IconButton
            onClick={() => setShiftDialog({ open: false, type: 'add' })}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Employee
              </Typography>
              <Select
                value={shiftForm.employeeId}
                onChange={(e) => {
                  const selectedEmployeeId = e.target.value;
                  const selectedEmployee = teamMembers.find(member => member.id === selectedEmployeeId);
                  setShiftForm({
                    ...shiftForm,
                    employeeId: selectedEmployeeId,
                    position: selectedEmployee?.employment.role || ''
                  });
                }}
                displayEmpty
              >
                <MenuItem value="">Select Employee</MenuItem>
                {teamMembers.map(member => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.personalInfo.firstName} {member.personalInfo.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <DatePicker
              label="Date"
              value={shiftForm.date ? new Date(shiftForm.date + 'T00:00:00') : null}
              onChange={(newValue) => {
                if (newValue) {
                  const dateStr = newValue.toISOString().split('T')[0];
                  setShiftForm({ ...shiftForm, date: dateStr });
                }
              }}
              slotProps={{
                textField: {
                  fullWidth: true
                }
              }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TimePicker
                label="Start Time"
                value={shiftForm.startTime ? new Date(`2000-01-01T${shiftForm.startTime}:00`) : null}
                onChange={(newValue) => {
                  if (newValue) {
                    const timeStr = `${newValue.getHours().toString().padStart(2, '0')}:${newValue.getMinutes().toString().padStart(2, '0')}`;
                    setShiftForm({ ...shiftForm, startTime: timeStr });
                  }
                }}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
              <TimePicker
                label="End Time"
                value={shiftForm.endTime ? new Date(`2000-01-01T${shiftForm.endTime}:00`) : null}
                onChange={(newValue) => {
                  if (newValue) {
                    const timeStr = `${newValue.getHours().toString().padStart(2, '0')}:${newValue.getMinutes().toString().padStart(2, '0')}`;
                    setShiftForm({ ...shiftForm, endTime: timeStr });
                  }
                }}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
            </Box>

            <TextField
              label="Position/Role"
              fullWidth
              value={shiftForm.position}
              onChange={(e) => setShiftForm({ ...shiftForm, position: e.target.value })}
              placeholder="e.g., Hair Stylist, Receptionist"
            />

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

        <Box sx={{
          p: 2,
          display: 'flex',
          gap: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'background.default'
        }}>
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
          <Button
            onClick={() => setShiftDialog({ open: false, type: 'add' })}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveShift}
            disabled={!shiftForm.employeeId || !shiftForm.date}
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
            backgroundColor: 'background.paper',
            borderLeft: 1,
            borderColor: 'divider'
          }
        }}
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'background.default'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MoreVertIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Bulk Schedule
            </Typography>
          </Box>
          <IconButton
            onClick={() => setBulkDialog(false)}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Employee
              </Typography>
              <Select
                value={bulkForm.employeeId}
                onChange={(e) => {
                  const selectedEmployeeId = e.target.value;
                  const selectedEmployee = teamMembers.find(member => member.id === selectedEmployeeId);
                  setBulkForm({
                    ...bulkForm,
                    employeeId: selectedEmployeeId,
                    position: selectedEmployee?.employment.role || ''
                  });
                }}
                displayEmpty
              >
                <MenuItem value="">Select Employee</MenuItem>
                {teamMembers.map(member => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.personalInfo.firstName} {member.personalInfo.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <DatePicker
                label="Start Date"
                value={bulkForm.startDate ? new Date(bulkForm.startDate + 'T00:00:00') : null}
                onChange={(newValue) => {
                  if (newValue) {
                    const startDate = newValue.toISOString().split('T')[0];
                    // Auto-calculate end date to be 6 days later (for a week)
                    const start = new Date(startDate + 'T00:00:00');
                    const end = new Date(start);
                    end.setDate(start.getDate() + 6);
                    const endDate = end.toISOString().split('T')[0];

                    setBulkForm({
                      ...bulkForm,
                      startDate,
                      endDate
                    });
                  }
                }}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
              <DatePicker
                label="End Date"
                value={bulkForm.endDate ? new Date(bulkForm.endDate + 'T00:00:00') : null}
                onChange={(newValue) => {
                  if (newValue) {
                    const dateStr = newValue.toISOString().split('T')[0];
                    setBulkForm({ ...bulkForm, endDate: dateStr });
                  }
                }}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
            </Box>

            {bulkForm.startDate && bulkForm.endDate && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Select Days ({new Date(bulkForm.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(bulkForm.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                </Typography>
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(2, 1fr)',
                    sm: 'repeat(3, 1fr)'
                  },
                  gap: 1
                }}>
                  {(() => {
                    const start = new Date(bulkForm.startDate + 'T00:00:00');
                    const end = new Date(bulkForm.endDate + 'T00:00:00');
                    const days = [];
                    const current = new Date(start);

                    while (current <= end) {
                      const dateStr = current.toISOString().split('T')[0];
                      const shortDay = current.toLocaleDateString('en-US', { weekday: 'short' });
                      const monthDay = current.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });

                      days.push({ dateStr, shortDay, monthDay });

                      // Safely increment to next day
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
                        sx={{
                          minHeight: 48,
                          fontSize: '0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5
                        }}
                      >
                        <Box>{shortDay}</Box>
                        <Box sx={{ fontSize: '0.65rem', opacity: 0.8 }}>
                          {monthDay}
                        </Box>
                      </Button>
                    ));
                  })()}
                </Box>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TimePicker
                label="Start Time"
                value={bulkForm.startTime ? new Date(`2000-01-01T${bulkForm.startTime}:00`) : null}
                onChange={(newValue) => {
                  if (newValue) {
                    const timeStr = `${newValue.getHours().toString().padStart(2, '0')}:${newValue.getMinutes().toString().padStart(2, '0')}`;
                    setBulkForm({ ...bulkForm, startTime: timeStr });
                  }
                }}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
              <TimePicker
                label="End Time"
                value={bulkForm.endTime ? new Date(`2000-01-01T${bulkForm.endTime}:00`) : null}
                onChange={(newValue) => {
                  if (newValue) {
                    const timeStr = `${newValue.getHours().toString().padStart(2, '0')}:${newValue.getMinutes().toString().padStart(2, '0')}`;
                    setBulkForm({ ...bulkForm, endTime: timeStr });
                  }
                }}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
            </Box>

            <TextField
              label="Position/Role"
              fullWidth
              value={bulkForm.position}
              onChange={(e) => setBulkForm({ ...bulkForm, position: e.target.value })}
              placeholder="e.g., Hair Stylist, Receptionist"
            />

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

        <Box sx={{
          p: 2,
          display: 'flex',
          gap: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'background.default'
        }}>
          <Button
            onClick={() => setBulkDialog(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleBulkSave}
            disabled={
              !bulkForm.employeeId ||
              !bulkForm.startDate ||
              !bulkForm.endDate ||
              bulkForm.days.length === 0
            }
          >
            Create Shifts
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
};

export default Schedule;