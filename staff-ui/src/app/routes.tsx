import { lazy } from 'react';
const Page = lazy(() => import('./Page'));
export const routes = [{ path: '/staff', element: <Page /> }];

