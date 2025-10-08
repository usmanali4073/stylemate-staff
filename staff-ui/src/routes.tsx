import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

// Lazy load pages for code splitting
const StaffManagement = lazy(() => import('./pages/StaffManagement'));
const AddStaffMember = lazy(() => import('./pages/AddStaffMember'));

// Define staff routes - these will be wrapped by portal's ThemedLayout
const staffRoutes: RouteObject[] = [
  {
    path: '/staff/*',
    element: <StaffManagement />
  },
  {
    path: '/staff/add',
    element: <AddStaffMember />
  }
];

export default staffRoutes;