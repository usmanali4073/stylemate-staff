import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  useMediaQuery,
  useTheme,
  Stack,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useActiveBusinessId } from '@/hooks/useActiveBusinessId';
import { useShiftOccurrences } from '@/hooks/useSchedule';
import { useTimeOffRequests } from '@/hooks/useTimeOff';
import staffService from '@/services/staffService';
import TimeOffRequestDrawer from '@/components/molecules/TimeOffRequestDrawer';
import ScheduleCalendar from '@/components/organisms/ScheduleCalendar';
import type { ShiftOccurrence } from '@/types/schedule';

const MySchedule: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const businessId = useActiveBusinessId();

  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [timeOffDrawerOpen, setTimeOffDrawerOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<ShiftOccurrence | null>(null);

  // Fetch current user's staff profile
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['staff', businessId, 'me'],
    queryFn: () => staffService.getCurrentUserProfile(businessId!),
    enabled: !!businessId,
  });

  // Calculate week range
  const weekRange = useMemo(() => {
    const weekStart = new Date(currentWeek);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return {
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0],
      startDate: weekStart,
      endDate: weekEnd,
    };
  }, [currentWeek]);

  // Fetch shifts for current user
  const { data: shifts = [], isLoading: isLoadingShifts } = useShiftOccurrences(
    businessId,
    weekRange.start,
    weekRange.end,
    currentUser?.id // Filter by current user's staff member ID
  );

  // Fetch pending time-off requests for current user
  const { data: timeOffRequests = [] } = useTimeOffRequests(businessId, {
    staffMemberId: currentUser?.id,
    status: 'Pending',
  });

  // Navigation
  const goToPreviousWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    setCurrentWeek(newWeek);
  };

  const goToNextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  };

  // Calculate total hours for the week
  const totalHours = useMemo(() => {
    return shifts.reduce((total, shift) => {
      const start = new Date(`2000-01-01T${shift.startTime}:00`);
      const end = new Date(`2000-01-01T${shift.endTime}:00`);
      return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);
  }, [shifts]);

  if (!businessId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No active business selected. Please select a business to continue.</Alert>
      </Box>
    );
  }

  if (isLoadingUser) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Typography>Loading your schedule...</Typography>
      </Box>
    );
  }

  if (!currentUser) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          You don't have a staff profile in this business. Contact your manager to get access.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          px: { xs: 2, sm: 3 },
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            My Schedule
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentUser.firstName} {currentUser.lastName} • {currentUser.jobTitle || 'Staff'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Week Navigation */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              backgroundColor: 'background.default',
              borderRadius: 1,
              px: 0.5,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Button onClick={goToPreviousWeek} size="small" sx={{ minWidth: 'auto', px: 1 }}>
              <ArrowBackIcon fontSize="small" />
            </Button>
            <Typography variant="caption" sx={{ minWidth: 120, textAlign: 'center', fontSize: '0.75rem' }}>
              {weekRange.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
              {weekRange.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Typography>
            <Button onClick={goToNextWeek} size="small" sx={{ minWidth: 'auto', px: 1 }}>
              <ArrowForwardIcon fontSize="small" />
            </Button>
          </Box>

          {/* Request Time Off Button */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setTimeOffDrawerOpen(true)}
            size="small"
          >
            Request Time Off
          </Button>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, p: { xs: 2, sm: 3 }, overflow: 'auto' }}>
        {/* Stats Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Total Hours This Week
              </Typography>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                {totalHours.toFixed(1)}h
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Shifts This Week
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {shifts.length}
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Pending Time-off
              </Typography>
              <Typography variant="h4" fontWeight={700} color="warning.main">
                {timeOffRequests.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Pending Time-off Requests */}
        {timeOffRequests.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Pending Time-off Requests
            </Typography>
            <Stack spacing={1}>
              {timeOffRequests.map(request => (
                <Card key={request.id} variant="outlined">
                  <CardContent sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: request.timeOffTypeColor,
                          }}
                        />
                        <Typography variant="body2" fontWeight={600}>
                          {request.timeOffTypeName}
                        </Typography>
                      </Box>
                      <Chip label="Pending" color="warning" size="small" />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {new Date(request.startDate + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}{' '}
                      -{' '}
                      {new Date(request.endDate + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>
        )}

        {/* Calendar View */}
        <Box sx={{ minHeight: 500 }}>
          {isLoadingShifts ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
              <Typography>Loading shifts...</Typography>
            </Box>
          ) : (
            <ScheduleCalendar
              businessId={businessId}
              staffMemberId={currentUser.id}
              startDate={weekRange.start}
              endDate={weekRange.end}
              view={isMobile ? 'day' : 'week'}
              onShiftClick={(shift) => setSelectedShift(shift)}
            />
          )}
        </Box>

        {/* Shift Details (when clicked) */}
        {selectedShift && (
          <Card sx={{ mt: 2 }} variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Shift Details
              </Typography>
              <Box sx={{ display: 'grid', gap: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Date
                  </Typography>
                  <Typography variant="body2">
                    {new Date(selectedShift.date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Time
                  </Typography>
                  <Typography variant="body2">
                    {selectedShift.startTime} - {selectedShift.endTime}
                  </Typography>
                </Box>
                {selectedShift.notes && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography variant="body2">{selectedShift.notes}</Typography>
                  </Box>
                )}
                <Button variant="outlined" size="small" onClick={() => setSelectedShift(null)} sx={{ mt: 1 }}>
                  Close
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Time-off Request Drawer */}
      <TimeOffRequestDrawer
        open={timeOffDrawerOpen}
        onClose={() => setTimeOffDrawerOpen(false)}
        businessId={businessId}
        staffMemberId={currentUser.id}
        onSaved={() => setTimeOffDrawerOpen(false)}
      />
    </Box>
  );
};

export default MySchedule;
