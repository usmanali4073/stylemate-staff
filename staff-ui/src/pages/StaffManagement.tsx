import React, { createContext, useState } from 'react';
import { Box, Typography, Chip, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Routes, Route, Navigate } from 'react-router-dom';
import TeamMembers from './TeamMembers';
import Schedule from './Schedule';
import StaffDetail from './StaffDetail';
import AddStaffMemberDrawer from '@/components/molecules/AddStaffMemberDrawer';
import { useActiveBusinessId } from '@/hooks/useActiveBusinessId';

// Context for child components (e.g., Schedule) to inject header controls
export const StaffHeaderControlsContext = createContext<{
  setHeaderControls: (controls: React.ReactNode) => void;
}>({
  setHeaderControls: () => {},
});

type StaffTab = 'team' | 'schedule';

const StaffManagement: React.FC = () => {
  const businessId = useActiveBusinessId();
  const [activeTab, setActiveTab] = useState<StaffTab>('team');
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [headerControls, setHeaderControls] = useState<React.ReactNode>(null);

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
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label="Team Members"
                      onClick={() => setActiveTab('team')}
                      color={activeTab === 'team' ? 'primary' : 'default'}
                      variant={activeTab === 'team' ? 'filled' : 'outlined'}
                      sx={{ fontWeight: activeTab === 'team' ? 600 : 400 }}
                    />
                    <Chip
                      label="Schedule"
                      onClick={() => setActiveTab('schedule')}
                      color={activeTab === 'schedule' ? 'primary' : 'default'}
                      variant={activeTab === 'schedule' ? 'filled' : 'outlined'}
                      sx={{ fontWeight: activeTab === 'schedule' ? 600 : 400 }}
                    />
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
                {activeTab === 'schedule' && <Schedule />}
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
