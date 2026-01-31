import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Chip,
  Avatar,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Container,
} from '@mui/material';
import { ArrowBack, Edit } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useActiveBusinessId } from '@/hooks/useActiveBusinessId';
import { useStaffMember } from '@/hooks/useStaff';
import InvitationStatus from '@/components/molecules/InvitationStatus';
import StaffLocationAssignments from '@/components/organisms/StaffLocationAssignments';
import StaffLifecycleActions from '@/components/organisms/StaffLifecycleActions';
import type { StaffStatus } from '@/types/staff';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`staff-detail-tabpanel-${index}`}
      aria-labelledby={`staff-detail-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const getStatusColor = (status: StaffStatus): 'success' | 'warning' | 'default' => {
  switch (status) {
    case 'Active':
      return 'success';
    case 'Suspended':
      return 'warning';
    case 'Archived':
      return 'default';
    default:
      return 'default';
  }
};

const StaffDetail: React.FC = () => {
  const { staffId } = useParams<{ staffId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const businessId = useActiveBusinessId();

  const [tabValue, setTabValue] = useState(0);

  const { data: staffMember, isLoading, error } = useStaffMember(businessId, staffId || null);

  const handleBack = () => {
    navigate('/staff');
  };

  const handleEdit = () => {
    // TODO: Open edit drawer (will be implemented when TeamMembers.tsx is updated)
    console.log('Edit staff member', staffId);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !staffMember || !businessId || !staffId) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Staff member not found. Please try again.
          </Alert>
          <Button onClick={handleBack} variant="outlined" startIcon={<ArrowBack />}>
            Back to Staff
          </Button>
        </Box>
      </Container>
    );
  }

  const fullName = `${staffMember.firstName} ${staffMember.lastName}`;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', pb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          backgroundColor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          zIndex: 1100,
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              py: 2,
            }}
          >
            <IconButton onClick={handleBack} size="small">
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" fontWeight={600} sx={{ flex: 1 }}>
              {fullName}
            </Typography>
            <Chip label={staffMember.status} color={getStatusColor(staffMember.status)} />
            <Button
              variant="contained"
              size="small"
              startIcon={<Edit />}
              onClick={handleEdit}
              sx={{ textTransform: 'none' }}
            >
              Edit
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl">
        {/* Profile Section */}
        <Card sx={{ mt: 3, mb: 3 }}>
          <CardContent sx={{ p: isMobile ? 2.5 : 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, mb: 3 }}>
              <Avatar
                src={staffMember.photoUrl || undefined}
                alt={fullName}
                sx={{ width: 80, height: 80, fontSize: '2rem' }}
              >
                {staffMember.firstName[0]}
                {staffMember.lastName[0]}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  {fullName}
                </Typography>
                {staffMember.jobTitle && (
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    {staffMember.jobTitle}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip label={staffMember.permissionLevel} size="small" variant="outlined" />
                  {staffMember.isBookable && (
                    <Chip label="Bookable" size="small" color="primary" variant="outlined" />
                  )}
                </Box>
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Email
                </Typography>
                <Typography variant="body1">{staffMember.email}</Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Phone
                </Typography>
                <Typography variant="body1">{staffMember.phone || 'Not set'}</Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Created
                </Typography>
                <Typography variant="body1">
                  {new Date(staffMember.createdAt).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabbed Sections */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Locations" />
            <Tab label="Invitation" />
            <Tab label="Actions" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <StaffLocationAssignments businessId={businessId} staffId={staffId} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <InvitationStatus
            businessId={businessId}
            staffId={staffId}
            staffEmail={staffMember.email}
            hasPendingInvitation={staffMember.hasPendingInvitation}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <StaffLifecycleActions
            businessId={businessId}
            staffId={staffId}
            currentStatus={staffMember.status}
          />
        </TabPanel>
      </Container>
    </Box>
  );
};

export default StaffDetail;
