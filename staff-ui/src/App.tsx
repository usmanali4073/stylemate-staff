import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import staffRoutes from './routes'
import './App.css'

// QueryClient for standalone dev mode
// In Module Federation mode, the portal shell provides the QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            {/* Default route - redirect to staff */}
            <Route path="/" element={<Navigate to="/staff" replace />} />

            {/* Map all staff routes */}
            {staffRoutes.map((route, index) => (
              <Route key={index} path={route.path} element={route.element} />
            ))}
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
