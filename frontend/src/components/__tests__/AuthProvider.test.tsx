/**
 * Tests for AuthProvider Component
 * FE-403: Login/Logout UI
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// Create mock state with all required fields
const createMockState = (overrides = {}) => ({
  user: null,
  session: null,
  isLoading: false,
  isInitialized: true,
  setUser: vi.fn(),
  setSession: vi.fn(),
  setLoading: vi.fn(),
  clearUser: vi.fn(),
  ...overrides,
})

// Mock the stores and services
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = createMockState()
    return selector ? selector(state) : state
  }),
  initializeAuth: vi.fn(() => Promise.resolve(() => {})),
}))

import { AuthProvider } from '../AuthProvider'
import { initializeAuth, useAuthStore } from '@/stores/auth-store'

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock to default state
    vi.mocked(useAuthStore).mockImplementation((selector) => {
      const state = createMockState()
      return selector ? selector(state) : state
    })
  })

  it('should render children', async () => {
    render(
      <AuthProvider>
        <div data-testid="child">Child content</div>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('child')).toBeInTheDocument()
    })
  })

  it('should call initializeAuth on mount', async () => {
    render(
      <AuthProvider>
        <div>Content</div>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(initializeAuth).toHaveBeenCalled()
    })
  })

  it('should show loading state while initializing', () => {
    vi.mocked(useAuthStore).mockImplementation((selector) => {
      const state = createMockState({
        isLoading: true,
        isInitialized: false,
      })
      return selector ? selector(state) : state
    })

    render(
      <AuthProvider>
        <div data-testid="child">Child content</div>
      </AuthProvider>
    )

    expect(screen.getByTestId('auth-loading')).toBeInTheDocument()
  })
})
