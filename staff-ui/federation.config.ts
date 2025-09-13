import { federation } from '@module-federation/vite';
export default federation({
  name: 'staff_ui',
  filename: 'remoteEntry.js',
  exposes: {
    './routes': './src/app/routes.tsx',
    './page': './src/app/Page.tsx'
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
    'react-router-dom': { singleton: true }
  }
});
