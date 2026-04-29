import { BrowserRouter } from 'react-router-dom'
import { RoleProvider } from './app/RoleProvider'
import { FeatureFlagProvider } from './app/FeatureFlagProvider'
import AppRouter from './app/router'

export default function App() {
  return (
    <BrowserRouter>
      <RoleProvider>
        <FeatureFlagProvider>
          <AppRouter />
        </FeatureFlagProvider>
      </RoleProvider>
    </BrowserRouter>
  )
}
