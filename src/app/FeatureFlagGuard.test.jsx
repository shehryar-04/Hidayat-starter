import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import FeatureFlagGuard from './FeatureFlagGuard'
import { FeatureFlagProvider, useFeatureFlags } from './FeatureFlagProvider'
import { supabase } from '../lib/supabase'

// Mock supabase
vi.mock('../lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
      channel: vi.fn(),
      removeChannel: vi.fn(),
    },
  }
})

describe('FeatureFlagGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children when flag is enabled', async () => {
    // Mock the select query with dars_e_nizami enabled
    const mockSelect = vi.fn().mockResolvedValue({
      data: [
        { module: 'dars_e_nizami', enabled: true },
        { module: 'hifz', enabled: false },
        { module: 'nazra', enabled: false },
        { module: 'short_courses', enabled: false },
        { module: 'darul_ifta', enabled: false },
        { module: 'research_center', enabled: false },
        { module: 'wazifa', enabled: false },
        { module: 'student_reports', enabled: false },
      ],
    })

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    })

    // Mock the channel subscription
    const mockOn = vi.fn().mockReturnThis()
    const mockSubscribe = vi.fn().mockReturnValue({})
    const mockChannel = {
      on: mockOn,
      subscribe: mockSubscribe,
    }

    vi.mocked(supabase.channel).mockReturnValue(mockChannel)

    render(
      <BrowserRouter>
        <FeatureFlagProvider>
          <FeatureFlagGuard flagKey="dars_e_nizami">
            <div data-testid="protected-content">Protected Content</div>
          </FeatureFlagGuard>
        </FeatureFlagProvider>
      </BrowserRouter>
    )

    // Wait for the content to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    expect(screen.getByTestId('protected-content')).toHaveTextContent('Protected Content')
  })

  it('should redirect to dashboard when flag is disabled', async () => {
    // Mock the select query with dars_e_nizami disabled
    const mockSelect = vi.fn().mockResolvedValue({
      data: [
        { module: 'dars_e_nizami', enabled: false },
        { module: 'hifz', enabled: false },
        { module: 'nazra', enabled: false },
        { module: 'short_courses', enabled: false },
        { module: 'darul_ifta', enabled: false },
        { module: 'research_center', enabled: false },
        { module: 'wazifa', enabled: false },
        { module: 'student_reports', enabled: false },
      ],
    })

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    })

    // Mock the channel subscription
    const mockOn = vi.fn().mockReturnThis()
    const mockSubscribe = vi.fn().mockReturnValue({})
    const mockChannel = {
      on: mockOn,
      subscribe: mockSubscribe,
    }

    vi.mocked(supabase.channel).mockReturnValue(mockChannel)

    render(
      <BrowserRouter>
        <FeatureFlagProvider>
          <FeatureFlagGuard flagKey="dars_e_nizami">
            <div data-testid="protected-content">Protected Content</div>
          </FeatureFlagGuard>
        </FeatureFlagProvider>
      </BrowserRouter>
    )

    // Wait for loading to complete
    await waitFor(() => {
      // The protected content should not be rendered
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })

  it('should suppress navigation items for disabled flags', async () => {
    // Mock the select query with mixed enabled/disabled flags
    const mockSelect = vi.fn().mockResolvedValue({
      data: [
        { module: 'dars_e_nizami', enabled: true },
        { module: 'hifz', enabled: false },
        { module: 'nazra', enabled: true },
        { module: 'short_courses', enabled: false },
        { module: 'darul_ifta', enabled: true },
        { module: 'research_center', enabled: false },
        { module: 'wazifa', enabled: true },
        { module: 'student_reports', enabled: false },
      ],
    })

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    })

    // Mock the channel subscription
    const mockOn = vi.fn().mockReturnThis()
    const mockSubscribe = vi.fn().mockReturnValue({})
    const mockChannel = {
      on: mockOn,
      subscribe: mockSubscribe,
    }

    vi.mocked(supabase.channel).mockReturnValue(mockChannel)

    // Test component that renders navigation based on flags
    function NavigationTest() {
      const { flags, loading } = useFeatureFlags()

      if (loading) return <div>Loading...</div>

      return (
        <nav>
          {flags.dars_e_nizami && <a data-testid="nav-dars">Dars-e-Nizami</a>}
          {flags.hifz && <a data-testid="nav-hifz">Hifz</a>}
          {flags.nazra && <a data-testid="nav-nazra">Nazra</a>}
          {flags.short_courses && <a data-testid="nav-short">Short Courses</a>}
          {flags.darul_ifta && <a data-testid="nav-ifta">Darul Ifta</a>}
          {flags.research_center && <a data-testid="nav-research">Research Center</a>}
          {flags.wazifa && <a data-testid="nav-wazifa">Wazifa</a>}
          {flags.student_reports && <a data-testid="nav-reports">Student Reports</a>}
        </nav>
      )
    }

    render(
      <BrowserRouter>
        <FeatureFlagProvider>
          <NavigationTest />
        </FeatureFlagProvider>
      </BrowserRouter>
    )

    // Wait for loading to complete
    await waitFor(() => {
      // Enabled items should be present
      expect(screen.getByTestId('nav-dars')).toBeInTheDocument()
      expect(screen.getByTestId('nav-nazra')).toBeInTheDocument()
      expect(screen.getByTestId('nav-ifta')).toBeInTheDocument()
      expect(screen.getByTestId('nav-wazifa')).toBeInTheDocument()

      // Disabled items should not be present
      expect(screen.queryByTestId('nav-hifz')).not.toBeInTheDocument()
      expect(screen.queryByTestId('nav-short')).not.toBeInTheDocument()
      expect(screen.queryByTestId('nav-research')).not.toBeInTheDocument()
      expect(screen.queryByTestId('nav-reports')).not.toBeInTheDocument()
    })
  })
})
