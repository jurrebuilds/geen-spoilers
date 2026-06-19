import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'
import { initAnalytics, trackAppOpen } from './lib/analytics.js'
import './index.css'

// PostHog opstarten (naast Vercel). Doet stil niets zonder VITE_POSTHOG_KEY.
initAnalytics()
// Meteen vastleggen hoe iemand binnenkomt: als app of in de browser.
trackAppOpen()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>,
)
