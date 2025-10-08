import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense } from 'react'
import staffRoutes from './routes'
import './App.css'

function App() {
  return (
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
  )
}

export default App
