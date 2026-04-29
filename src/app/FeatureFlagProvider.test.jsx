import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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

// Test component that uses the feature flags context
function TestComponent() {
  const { flags, loading } = useFeatureFlags()
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
      <div data-testid="dars_e_nizami">{flags.dars_e_nizami ? 'enabled' : 'disabled'}</div>
      <div data-testid="hifz">{flags.hifz ? 'enabled' : 'disabled'}</div>
      <div data-testid="nazra">{flags.nazra ? 'enabled' : 'disabled'}</div>
      <div data-testid="short_courses">{flags.short_courses ? 'enabled' : 'disabled'}</div>
      <div data-testid="darul_ifta">{flags.darul_ifta ? 'enabled' : 'disabled'}</div>
      <div data-testid="research_center">{flags.research_center ? 'enabled' : 'disabled'}</div>
      <div data-testid="wazifa">{flags.wazifa ? 'enabled' : 'disabled'}</div>
      <div data-testid="student_reports">{flags.student_reports ? 'enabled' : 'disabled'}</div>
    </div>
  )
}

describe('FeatureFlagProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch all feature flags on initialization', async () => {
    // Mock the select query
    const mockSelect = vi.fn().mockResolvedValue({
      data: [
        { module: 'dars_e_nizami', enabled: true },
        { module: 'hifz', enabled: false },
        { module: 'nazra', enabled: true },
        { module: 'short_courses', enabled: true },
        { module: 'darul_ifta', enabled: false },
        { module: 'research_center', enabled: true },
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

    render(
      <FeatureFlagProvider>
        <TestComponent />
      </FeatureFlagProvider>
    )

    // Wait for flags to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
    })

    // Verify flags are set correctly
    expect(screen.getByTestId('dars_e_nizami')).toHaveTextContent('enabled')
    expect(screen.getByTestId('hifz')).toHaveTextContent('disabled')
    expect(screen.getByTestId('nazra')).toHaveTextContent('enabled')
    expect(screen.getByTestId('short_courses')).toHaveTextContent('enabled')
    expect(screen.getByTestId('darul_ifta')).toHaveTextContent('disabled')
    expect(screen.getByTestId('research_center')).toHaveTextContent('enabled')
    expect(screen.getByTestId('wazifa')).toHaveTextContent('enabled')
    expect(screen.getByTestId('student_reports')).toHaveTextContent('disabled')
  })

  it('should initialize with default flags when no data is returned', async () => {
    // Mock the select query to return empty data
    const mockSelect = vi.fn().mockResolvedValue({
      data: [],
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
      <FeatureFlagProvider>
        <TestComponent />
      </FeatureFlagProvider>
    )

    // Wait for flags to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
    })

    // All flags should be disabled (default state)
    expect(screen.getByTestId('dars_e_nizami')).toHaveTextContent('disabled')
    expect(screen.getByTestId('hifz')).toHaveTextContent('disabled')
    expect(screen.getByTestId('nazra')).toHaveTextContent('disabled')
    expect(screen.getByTestId('short_courses')).toHaveTextContent('disabled')
    expect(screen.getByTestId('darul_ifta')).toHaveTextContent('disabled')
    expect(screen.getByTestId('research_center')).toHaveTextContent('disabled')
    expect(screen.getByTestId('wazifa')).toHaveTextContent('disabled')
    expect(screen.getByTestId('student_reports')).toHaveTextContent('disabled')
  })
})
