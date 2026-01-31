import React from 'react';
import type { RouteObject } from 'react-router-dom';
import StaffManagement from './pages/StaffManagement';

// Define staff routes - these will be wrapped by portal's ThemedLayout
// StaffManagement handles internal routing: /staff (TeamMembers), /staff/add (AddStaffMember), /staff/:staffId (StaffDetail)
const staffRoutes: RouteObject[] = [
  {
    path: '/staff/*',
    element: <StaffManagement />,
  },
];

export default staffRoutes;