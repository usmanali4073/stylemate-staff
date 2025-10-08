import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarItem {
  label: string;
  path: string;
}

const sidebarItems: SidebarItem[] = [
  { label: 'Team members', path: '/staff/team-members' },
  { label: 'Scheduled shifts', path: '/staff/scheduled-shifts' },
  { label: 'Timesheets', path: '/staff/timesheets' },
  { label: 'Pay runs', path: '/staff/pay-runs' }
];

const StaffSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box
      sx={{
        width: 240,
        backgroundColor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        pt: 2
      }}
    >
      <Box sx={{ px: 2, mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Team
        </Typography>
      </Box>

      <List sx={{ px: 1 }}>
        {sidebarItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  backgroundColor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'primary.contrastText' : 'text.primary',
                  '&:hover': {
                    backgroundColor: isActive ? 'primary.dark' : 'action.hover'
                  }
                }}
              >
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 400
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default StaffSidebar;