import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  Chip
} from '@mui/material';
import {
  Group as TeamIcon,
  Schedule as ScheduleIcon,
  Assignment as TimesheetsIcon,
  Payment as PayRunsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import StaffCard from '../components/atoms/StaffCard';

type PaletteKey = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';

interface StaffCardData {
  id: string;
  title: string;
  description: string;
  icon: typeof TeamIcon;
  colorKey: PaletteKey;
  path: string;
  count?: number;
}

const staffCards: StaffCardData[] = [
  {
    id: 'team-members',
    title: 'Team members',
    description: 'Manage staff profiles, permissions, and contact information.',
    icon: TeamIcon,
    colorKey: 'primary',
    path: '/staff/team-members',
    count: 3
  },
  {
    id: 'schedule',
    title: 'Schedule',
    description: 'Weekly schedule view with drag & drop, shift templates, and conflict detection.',
    icon: ScheduleIcon,
    colorKey: 'secondary',
    path: '/staff/schedule',
    count: 12
  },
  {
    id: 'timesheets',
    title: 'Timesheets',
    description: 'Track working hours and approve timesheet submissions.',
    icon: TimesheetsIcon,
    colorKey: 'success',
    path: '/staff/timesheets'
  },
  {
    id: 'pay-runs',
    title: 'Pay runs',
    description: 'Process payroll and manage staff compensation.',
    icon: PayRunsIcon,
    colorKey: 'warning',
    path: '/staff/pay-runs'
  }
];

const StaffDashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
          Team
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your staff and scheduling
        </Typography>
      </Box>

      {/* Navigation Tabs */}
      <Box sx={{ mb: 4, display: { xs: 'none', md: 'block' } }}>
        <Box sx={{
          display: 'flex',
          gap: 2,
          pb: 2
        }}>
          <Chip
            label="Team members"
            variant="filled"
            sx={{
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              fontWeight: 500
            }}
          />
          <Chip
            label="Schedule"
            variant="outlined"
            sx={{ fontWeight: 500 }}
            onClick={() => navigate('/staff/schedule')}
          />
          <Chip
            label="Timesheets"
            variant="outlined"
            sx={{ fontWeight: 500 }}
            onClick={() => navigate('/staff/timesheets')}
          />
          <Chip
            label="Pay runs"
            variant="outlined"
            sx={{ fontWeight: 500 }}
            onClick={() => navigate('/staff/pay-runs')}
          />
        </Box>
      </Box>

      <Grid container spacing={3}>
        {staffCards.map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={card.id}>
            <StaffCard
              title={card.title}
              description={card.description}
              icon={card.icon}
              colorKey={card.colorKey}
              count={card.count}
              onClick={() => handleCardClick(card.path)}
            />
          </Grid>
        ))}
      </Grid>

      {/* Quick Stats */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Quick Overview
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={600} color="primary.main">
                3
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Staff
              </Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={600} color="secondary.main">
                24h
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This Week
              </Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={600} color="success.main">
                12
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Shifts Scheduled
              </Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={600} color="warning.main">
                2
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Approvals
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default StaffDashboard;