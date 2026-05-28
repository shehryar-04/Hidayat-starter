import { BrowserRouter } from 'react-router-dom'
import { RoleProvider } from './app/RoleProvider'
import { FeatureFlagProvider } from './app/FeatureFlagProvider'
import AnalyticsProvider from './app/AnalyticsProvider'
import AppRouter from './app/router'

export default function App() {
  return (
    <BrowserRouter>
      <AnalyticsProvider />
      <RoleProvider>
        <FeatureFlagProvider>
          <AppRouter />
        </FeatureFlagProvider>
      </RoleProvider>
    </BrowserRouter>
  )
}
