import React from 'react';
import {
  Box,
  Typography,
  Button,
  Avatar,
  Chip,
  IconButton,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';

interface EmployeeShift {
  employeeId: string;
  employeeName: string;
  avatar?: string;
  initials: string;
  startTime: string;
  endTime: string;
  duration: string;
  status: 'confirmed' | 'pending' | 'unavailable';
}

interface DaySchedule {
  date: string;
  dayName: string;
  dateNum: string;
  shifts: EmployeeShift[];
}

const mockSchedule: DaySchedule[] = [
  {
    date: '2025-09-21',
    dayName: 'Sun',
    dateNum: '21',
    shifts: []
  },
  {
    date: '2025-09-22',
    dayName: 'Mon',
    dateNum: '22',
    shifts: [
      {
        employeeId: '1',
        employeeName: 'Tak shah',
        initials: 'TS',
        startTime: '10:00',
        endTime: '19:00',
        duration: '9h',
        status: 'confirmed'
      },
      {
        employeeId: '2',
        employeeName: 'Usman Ali',
        initials: 'UA',
        startTime: '14:00',
        endTime: '22:00',
        duration: '8h',
        status: 'pending'
      }
    ]
  },
  {
    date: '2025-09-23',
    dayName: 'Tue',
    dateNum: '23',
    shifts: [
      {
        employeeId: '1',
        employeeName: 'Tak shah',
        initials: 'TS',
        startTime: '10:00',
        endTime: '19:00',
        duration: '9h',
        status: 'confirmed'
      }
    ]
  },
  {
    date: '2025-09-24',
    dayName: 'Wed',
    dateNum: '24',
    shifts: [
      {
        employeeId: '2',
        employeeName: 'Usman Ali',
        initials: 'UA',
        startTime: '10:00',
        endTime: '19:00',
        duration: '9h',
        status: 'confirmed'
      }
    ]
  },
  {
    date: '2025-09-25',
    dayName: 'Thu',
    dateNum: '25',
    shifts: [
      {
        employeeId: '1',
        employeeName: 'Tak shah',
        initials: 'TS',
        startTime: '10:00',
        endTime: '19:00',
        duration: '9h',
        status: 'confirmed'
      },
      {
        employeeId: '2',
        employeeName: 'Usman Ali',
        initials: 'UA',
        startTime: '14:00',
        endTime: '22:00',
        duration: '8h',
        status: 'confirmed'
      }
    ]
  },
  {
    date: '2025-09-26',
    dayName: 'Fri',
    dateNum: '26',
    shifts: [
      {
        employeeId: '1',
        employeeName: 'Tak shah',
        initials: 'TS',
        startTime: '10:00',
        endTime: '19:00',
        duration: '9h',
        status: 'confirmed'
      }
    ]
  },
  {
    date: '2025-09-27',
    dayName: 'Sat',
    dateNum: '27',
    shifts: [
      {
        employeeId: '2',
        employeeName: 'Usman Ali',
        initials: 'UA',
        startTime: '10:00',
        endTime: '17:00',
        duration: '7h',
        status: 'confirmed'
      }
    ]
  }
];

const ScheduledShifts: React.FC = () => {
  const currentWeek = 'This week';

  const getAvatarColor = (initials: string) => {
    const colors = ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2', '#00796b'];
    const index = initials.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'unavailable':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1" fontWeight={600}>
            Scheduled shifts
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
          >
            Options
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add
          </Button>
        </Box>
      </Box>

      {/* Week Navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
        <IconButton>
          <ChevronLeftIcon />
        </IconButton>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mx: 4 }}>
          <Typography variant="h6" fontWeight={600}>
            {currentWeek}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            21 - 27 Sep, 2025
          </Typography>
        </Box>
        <IconButton>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* Weekly Schedule Grid */}
      <Grid container spacing={2}>
        {mockSchedule.map((day) => (
          <Grid key={day.date} size={{ xs: 12, sm: 6, md: 12/7 }}>
            <Card
              sx={{
                minHeight: 200,
                backgroundColor: day.shifts.length === 0
                  ? (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50'
                  : 'background.paper',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {day.dayName}
                  </Typography>
                  <Typography variant="h6" fontWeight={600} color="text.secondary">
                    {day.dateNum}
                  </Typography>
                </Box>

                {day.shifts.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      No shifts
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {day.shifts.map((shift) => (
                      <Card
                        key={`${shift.employeeId}-${shift.startTime}`}
                        sx={{
                          backgroundColor: 'primary.50',
                          border: '1px solid',
                          borderColor: 'primary.200'
                        }}
                      >
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar
                              sx={{
                                width: 24,
                                height: 24,
                                fontSize: '0.75rem',
                                backgroundColor: getAvatarColor(shift.initials),
                                mr: 1
                              }}
                            >
                              {shift.initials}
                            </Avatar>
                            <Typography variant="caption" fontWeight={500} noWrap>
                              {shift.employeeName}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <TimeIcon sx={{ fontSize: 12, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {shift.startTime} - {shift.endTime}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Chip
                              label={shift.duration}
                              size="small"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                            <Chip
                              label={shift.status}
                              size="small"
                              color={getStatusColor(shift.status)}
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Weekly Summary */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Weekly Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={600} color="primary.main">
                  2
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Staff
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={600} color="success.main">
                  44h
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Hours
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={600} color="warning.main">
                  2
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Shifts
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={600} color="info.main">
                  8
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Shifts
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ScheduledShifts;