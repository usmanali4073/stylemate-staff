import React, { useState, useEffect, createContext } from 'react';
import {
  Box,
  IconButton,
  Button,
  ButtonGroup,
  useTheme,
  useMediaQuery,
  Container,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  ArrowBack,
  People,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import TeamMembers from './TeamMembers';
import ScheduleView from './Schedule';

// Context for header controls
export const StaffHeaderControlsContext = createContext<{
  setHeaderControls: (controls: React.ReactNode) => void;
}>({
  setHeaderControls: () => {},
});

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
      id={`staff-management-tabpanel-${index}`}
      aria-labelledby={`staff-management-tab-${index}`}
    >
      {value === index && <Box sx={{ height: '100%' }}>{children}</Box>}
    </div>
  );
};

const StaffManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Default to team members tab
  const initialTab = location.state?.activeTab ?? 0;
  const [tabValue, setTabValue] = useState(initialTab);
  const [headerControls, setHeaderControls] = useState<React.ReactNode>(null);

  // Clear the location state after using it
  useEffect(() => {
    if (location.state?.activeTab !== undefined) {
      // Clear the state to prevent it from persisting on subsequent visits
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleBackClick = () => {
    navigate('/dashboard');
  };

  const renderContent = () => (
    <StaffHeaderControlsContext.Provider value={{ setHeaderControls }}>
      <TabPanel value={tabValue} index={0}>
        <TeamMembers />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <ScheduleView />
      </TabPanel>
    </StaffHeaderControlsContext.Provider>
  );

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: 'background.default',
      pb: isMobile ? 8 : 0
    }}>
      {/* Header */}
      <Box sx={{
        backgroundColor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        position: 'sticky',
        top: 0,
        zIndex: 1100
      }}>
        <Container maxWidth="xl">
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 1 : 2,
            py: isMobile ? 1 : 1.5,
          }}>
            {/* Back Button */}
            <IconButton
              onClick={handleBackClick}
              size="small"
              sx={{
                flexShrink: 0
              }}
            >
              <ArrowBack fontSize="small" />
            </IconButton>

            {isMobile ? (
              /* Mobile: Tab Navigation Only */
              <Tabs
                value={tabValue}
                onChange={(_, newValue) => setTabValue(newValue)}
                sx={{
                  flex: 1,
                  minHeight: 40,
                  '& .MuiTabs-flexContainer': {
                    justifyContent: 'center'
                  },
                  '& .MuiTab-root': {
                    minHeight: 40,
                    minWidth: 80,
                    fontSize: '0.875rem',
                    textTransform: 'none',
                    fontWeight: 500
                  }
                }}
              >
                <Tab icon={<People fontSize="small" />} iconPosition="start" label="Team" />
                <Tab icon={<ScheduleIcon fontSize="small" />} iconPosition="start" label="Schedule" />
              </Tabs>
            ) : (
              /* Desktop: Button Group + Controls */
              <>
                <ButtonGroup
                  variant="outlined"
                  size="small"
                  sx={{
                    flexShrink: 0,
                    '& .MuiButton-root': {
                      borderColor: 'divider',
                      minWidth: 110,
                      px: 1.5,
                      py: 0.75,
                      fontSize: '0.813rem'
                    }
                  }}
                >
                  <Button
                    onClick={() => setTabValue(0)}
                    startIcon={<People fontSize="small" />}
                    variant={tabValue === 0 ? 'contained' : 'outlined'}
                    sx={{
                      fontWeight: tabValue === 0 ? 600 : 500,
                      ...(tabValue === 0 && {
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          backgroundColor: 'primary.dark'
                        }
                      })
                    }}
                  >
                    Team
                  </Button>
                  <Button
                    onClick={() => setTabValue(1)}
                    startIcon={<ScheduleIcon fontSize="small" />}
                    variant={tabValue === 1 ? 'contained' : 'outlined'}
                    sx={{
                      fontWeight: tabValue === 1 ? 600 : 500,
                      ...(tabValue === 1 && {
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          backgroundColor: 'primary.dark'
                        }
                      })
                    }}
                  >
                    Schedule
                  </Button>
                </ButtonGroup>

                {/* Desktop Controls */}
                <Box sx={{ flex: 1, display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center', minWidth: 0 }}>
                  {headerControls}
                </Box>
              </>
            )}
          </Box>
        </Container>
      </Box>

      {/* Mobile Toolbar - Apple style bottom controls */}
      {isMobile && (
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
            borderTop: 1,
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            backdropFilter: 'blur(10px)',
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(30, 30, 30, 0.95)'
              : 'rgba(255, 255, 255, 0.95)'
          }}
        >
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            minHeight: 56
          }}>
            {headerControls}
          </Box>
        </Paper>
      )}

      {/* Content */}
      <Box sx={{
        pt: { xs: 0, md: 3 }
      }}>
        {renderContent()}
      </Box>
    </Box>
  );
};

export default StaffManagement;