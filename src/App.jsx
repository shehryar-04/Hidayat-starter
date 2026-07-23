import { BrowserRouter } from 'react-router-dom'
import { RoleProvider } from './app/RoleProvider'
import { FeatureFlagProvider } from './app/FeatureFlagProvider'
import AnalyticsProvider from './app/AnalyticsProvider'
import ErrorBoundary from './app/ErrorBoundary'
import SessionGuard from './app/SessionGuard'
import AppRouter from './app/router'
import { ToastProvider } from './shared/ui'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AnalyticsProvider />
          <RoleProvider>
            <FeatureFlagProvider>
              <SessionGuard />
              <AppRouter />
            </FeatureFlagProvider>
          </RoleProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
