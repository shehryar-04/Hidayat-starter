import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { RoleProvider } from './app/RoleProvider'
import { FeatureFlagProvider } from './app/FeatureFlagProvider'
import AnalyticsProvider from './app/AnalyticsProvider'
import ErrorBoundary from './app/ErrorBoundary'
import SessionGuard from './app/SessionGuard'
import AppRouter from './app/router'
import { ToastProvider } from './shared/ui'

import { ThemeProvider } from './theme'
import { IntlProvider } from './lib/intl'

export default function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider>
          <IntlProvider>
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
          </IntlProvider>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  )
}
