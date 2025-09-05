import federation from '@originjs/vite-plugin-federation';
export default federation({
  name: 'staff_ui',
  filename: 'remoteEntry.js',
  exposes: {
    './routes': './src/app/routes.tsx',
    './page': './src/app/Page.tsx'
  },
  shared: {
    react: { singleton: true, requiredVersion: false },
    'react-dom': { singleton: true, requiredVersion: false },
    'react-router-dom': { singleton: true, requiredVersion: false }
  }
} as any);
