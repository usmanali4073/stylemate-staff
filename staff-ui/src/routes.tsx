import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Lazy load pages for code splitting
const StaffManagement = lazy(() => import('./pages/StaffManagement'));
const AddStaffMember = lazy(() => import('./pages/AddStaffMember'));

// Wrapper component with LocalizationProvider for Module Federation
const withLocalizationProvider = (Component: React.LazyExoticComponent<React.FC>) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Component />
    </LocalizationProvider>
  );
};

// Define staff routes - these will be wrapped by portal's ThemedLayout
const staffRoutes: RouteObject[] = [
  {
    path: '/staff/*',
    element: withLocalizationProvider(StaffManagement)
  },
  {
    path: '/staff/add',
    element: withLocalizationProvider(AddStaffMember)
  }
];

export default staffRoutes;