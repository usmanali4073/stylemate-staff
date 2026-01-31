import React, { createContext, useState } from 'react';
import { Box, Typography, Chip, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Routes, Route, Navigate } from 'react-router-dom';
import TeamMembers from './TeamMembers';
import Schedule from './Schedule';
import MySchedule from './MySchedule';
import StaffDetail from './StaffDetail';
import AddStaffMemberDrawer from '@/components/molecules/AddStaffMemberDrawer';
import TimeOffApprovalList from '@/components/organisms/TimeOffApprovalList';
import RoleManagement from '@/components/organisms/RoleManagement';
import { useActiveBusinessId } from '@/hooks/useActiveBusinessId';
import { useGlobalPermissions } from '@/hooks/usePermissions';
import { usePendingTimeOffCount } from '@/hooks/useTimeOff';

// Context for child components (e.g., Schedule) to inject header controls
export const StaffHeaderControlsContext = createContext<{
  setHeaderControls: (controls: React.ReactNode) => void;
}>({
  setHeaderControls: () => {},
});

type StaffTab = 'team' | 'schedule' | 'my-schedule' | 'time-off' | 'roles';

const StaffManagement: React.FC = () => {
  const businessId = useActiveBusinessId();
  const [activeTab, setActiveTab] = useState<StaffTab>('team');
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [headerControls, setHeaderControls] = useState<React.ReactNode>(null);

  // Fetch permissions for tab visibility
  const { can, isLoading: isLoadingPermissions } = useGlobalPermissions(businessId);

  // Fetch pending time-off count for badge
  const { data: pendingTimeOffCount = 0 } = usePendingTimeOffCount(businessId);

  if (!businessId) {
    return (
      <Box sx={{ p: 3 }}>
        <p>No active business selected. Please select a business to continue.</p>
      </Box>
    );
  }

  return (
    <StaffHeaderControlsContext.Provider value={{ setHeaderControls }}>
      <Routes>
        <Route
          path="/:staffId"
          element={<StaffDetail />}
        />
        <Route
          path="/*"
          element={
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Header */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: { xs: 2, sm: 3 },
                  py: 2,
                  borderBottom: 1,
                  borderColor: 'divider',
                  flexWrap: 'wrap',
                  gap: 1.5,
                }}
              >
                {/* Left: Title + Tabs */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Typography variant="h5" fontWeight={700}>
                    Staff
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label="Team Members"
                      onClick={() => setActiveTab('team')}
                      color={activeTab === 'team' ? 'primary' : 'default'}
                      variant={activeTab === 'team' ? 'filled' : 'outlined'}
                      sx={{ fontWeight: activeTab === 'team' ? 600 : 400 }}
                    />
                    {can('Scheduling.View') && (
                      <Chip
                        label="Schedule"
                        onClick={() => setActiveTab('schedule')}
                        color={activeTab === 'schedule' ? 'primary' : 'default'}
                        variant={activeTab === 'schedule' ? 'filled' : 'outlined'}
                        sx={{ fontWeight: activeTab === 'schedule' ? 600 : 400 }}
                      />
                    )}
                    <Chip
                      label="My Schedule"
                      onClick={() => setActiveTab('my-schedule')}
                      color={activeTab === 'my-schedule' ? 'primary' : 'default'}
                      variant={activeTab === 'my-schedule' ? 'filled' : 'outlined'}
                      sx={{ fontWeight: activeTab === 'my-schedule' ? 600 : 400 }}
                    />
                    {can('TimeOff.View') && (
                      <Chip
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            Time Off
                            {pendingTimeOffCount > 0 && (
                              <Box
                                sx={{
                                  bgcolor: activeTab === 'time-off' ? 'primary.contrastText' : 'warning.main',
                                  color: activeTab === 'time-off' ? 'primary.main' : 'warning.contrastText',
                                  borderRadius: '50%',
                                  width: 18,
                                  height: 18,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.65rem',
                                  fontWeight: 600,
                                  ml: 0.5,
                                }}
                              >
                                {pendingTimeOffCount}
                              </Box>
                            )}
                          </Box>
                        }
                        onClick={() => setActiveTab('time-off')}
                        color={activeTab === 'time-off' ? 'primary' : 'default'}
                        variant={activeTab === 'time-off' ? 'filled' : 'outlined'}
                        sx={{ fontWeight: activeTab === 'time-off' ? 600 : 400 }}
                      />
                    )}
                    {can('Staff.Manage') && (
                      <Chip
                        label="Roles"
                        onClick={() => setActiveTab('roles')}
                        color={activeTab === 'roles' ? 'primary' : 'default'}
                        variant={activeTab === 'roles' ? 'filled' : 'outlined'}
                        sx={{ fontWeight: activeTab === 'roles' ? 600 : 400 }}
                      />
                    )}
                  </Box>
                </Box>

                {/* Right: Controls */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  {activeTab === 'team' && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setAddDrawerOpen(true)}
                      size="small"
                    >
                      Add Employee
                    </Button>
                  )}
                  {activeTab === 'schedule' && headerControls}
                </Box>
              </Box>

              {/* Tab Content */}
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                {activeTab === 'team' && <TeamMembers />}
                {activeTab === 'schedule' && can('Scheduling.View') && <Schedule />}
                {activeTab === 'my-schedule' && <MySchedule />}
                {activeTab === 'time-off' && can('TimeOff.View') && businessId && (
                  <Box sx={{ p: 3 }}>
                    <TimeOffApprovalList businessId={businessId} />
                  </Box>
                )}
                {activeTab === 'roles' && can('Staff.Manage') && businessId && (
                  <Box sx={{ p: 3 }}>
                    <RoleManagement businessId={businessId} />
                  </Box>
                )}
              </Box>

              {/* Add Staff Drawer */}
              <AddStaffMemberDrawer
                open={addDrawerOpen}
                onClose={() => setAddDrawerOpen(false)}
              />
            </Box>
          }
        />
      </Routes>
    </StaffHeaderControlsContext.Provider>
  );
};

export default StaffManagement;
