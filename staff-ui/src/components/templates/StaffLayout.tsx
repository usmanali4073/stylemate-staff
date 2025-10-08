import React from 'react';
import { Box } from '@mui/material';
import StaffSidebar from '../organisms/StaffSidebar';

interface StaffLayoutProps {
  children: React.ReactNode;
}

const StaffLayout: React.FC<StaffLayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex' }}>
      <StaffSidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: '240px', // Sidebar width
          minHeight: '100vh'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default StaffLayout;