import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App'
import Onboarding from './pages/Onboarding'

// Eager-loaded (always needed)
import Dashboard from './pages/Dashboard'

// Lazy-loaded pages
const Analytics     = lazy(() => import('./pages/Analytics'))
const NicheDiscovery= lazy(() => import('./pages/NicheDiscovery'))
const TweetWriter   = lazy(() => import('./pages/TweetWriter'))
const Settings      = lazy(() => import('./pages/Settings'))
const Queue         = lazy(() => import('./pages/Queue'))
const Context       = lazy(() => import('./pages/Context'))
const DailyMix      = lazy(() => import('./pages/DailyMix'))
const Inspiration   = lazy(() => import('./pages/Inspiration'))
const ViralLibrary  = lazy(() => import('./pages/ViralLibrary'))
const Trends        = lazy(() => import('./pages/Trends'))
const Monitored     = lazy(() => import('./pages/Monitored'))
const Upgrade       = lazy(() => import('./pages/Upgrade'))

function PageLoader() {
  return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="queue"      element={<Suspense fallback={<PageLoader />}><Queue /></Suspense>} />
          <Route path="analytics"  element={<Suspense fallback={<PageLoader />}><Analytics /></Suspense>} />
          <Route path="context"    element={<Suspense fallback={<PageLoader />}><Context /></Suspense>} />
          <Route path="inspiration" element={<Suspense fallback={<PageLoader />}><Inspiration /></Suspense>} />
          <Route path="daily-mix"   element={<Suspense fallback={<PageLoader />}><DailyMix /></Suspense>} />
          <Route path="writer"     element={<Suspense fallback={<PageLoader />}><TweetWriter /></Suspense>} />
          <Route path="viral"      element={<Suspense fallback={<PageLoader />}><ViralLibrary /></Suspense>} />
          <Route path="trends"     element={<Suspense fallback={<PageLoader />}><Trends /></Suspense>} />
          <Route path="monitored"  element={<Suspense fallback={<PageLoader />}><Monitored /></Suspense>} />
          <Route path="discover"   element={<Suspense fallback={<PageLoader />}><NicheDiscovery /></Suspense>} />
          <Route path="settings"   element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
          <Route path="upgrade"   element={<Suspense fallback={<PageLoader />}><Upgrade /></Suspense>} />
        </Route>
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
