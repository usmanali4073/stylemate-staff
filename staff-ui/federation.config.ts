import { federation } from '@module-federation/vite';

export default federation({
  name: 'staff',
  filename: 'remoteEntry.js',
  exposes: {
    './routes': './src/routes.tsx',
  },
  shared: {
    react: { singleton: true, requiredVersion: '^19.1.1' },
    'react-dom': { singleton: true, requiredVersion: '^19.1.1' },
    'react-router-dom': { singleton: true },
    '@mui/material': { singleton: true },
    '@mui/system': { singleton: true },
    '@mui/icons-material': { singleton: true },
    '@emotion/react': { singleton: true },
    '@emotion/styled': { singleton: true },
    '@tanstack/react-query': { singleton: true },
    'react-hook-form': { singleton: true },
    zod: { singleton: true },
  },
});
