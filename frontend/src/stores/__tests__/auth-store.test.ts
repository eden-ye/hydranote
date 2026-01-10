/**
 * Tests for Auth Store
 * FE-402: Auth Store (Zustand)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { Session, User } from '@supabase/supabase-js'

// Mock the supabase service
vi.mock('@/services/supabase', () => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({
    data: {
      subscription: {
        id: 'mock-sub-id',
        callback: vi.fn(),
        unsubscribe: vi.fn(),
      },
    },
  })),
}))

// Helper to create mock user
function createMockUser(): User {
  return {
    id: 'user-123',
    email: 'test@example.com',
    aud: 'authenticated',
    created_at: '2024-01-01',
    app_metadata: {},
    user_metadata: {},
  } as User
}

// Helper to create mock session
function createMockSession(): Session {
  return {
    access_token: 'token-123',
    refresh_token: 'refresh-123',
    expires_in: 3600,
    token_type: 'bearer',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: createMockUser(),
  } as Session
}

// Import after mocking
import { useAuthStore, initializeAuth } from '../auth-store'
import { getSession, onAuthStateChange } from '@/services/supabase'

describe('Auth Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store to initial state before each test
    useAuthStore.setState({
      user: null,
      session: null,
      isLoading: true,
      isInitialized: false,
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Initial State', () => {
    it('should have null user initially', () => {
      const { result } = renderHook(() => useAuthStore())
      expect(result.current.user).toBeNull()
    })

    it('should have null session initially', () => {
      const { result } = renderHook(() => useAuthStore())
      expect(result.current.session).toBeNull()
    })

    it('should be loading initially', () => {
      const { result } = renderHook(() => useAuthStore())
      expect(result.current.isLoading).toBe(true)
    })

    it('should not be initialized initially', () => {
      const { result } = renderHook(() => useAuthStore())
      expect(result.current.isInitialized).toBe(false)
    })
  })

  describe('setUser action', () => {
    it('should set the user', () => {
      const mockUser = createMockUser()

      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setUser(mockUser)
      })

      expect(result.current.user).toEqual(mockUser)
    })

    it('should be able to clear the user by setting null', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setUser(createMockUser())
      })

      expect(result.current.user).not.toBeNull()

      act(() => {
        result.current.setUser(null)
      })

      expect(result.current.user).toBeNull()
    })
  })

  describe('setSession action', () => {
    it('should set the session', () => {
      const mockSession = createMockSession()

      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setSession(mockSession)
      })

      expect(result.current.session).toEqual(mockSession)
    })
  })

  describe('setLoading action', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setLoading(false)
      })

      expect(result.current.isLoading).toBe(false)

      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('clearUser action', () => {
    it('should clear user and session', () => {
      const { result } = renderHook(() => useAuthStore())

      // First set user and session
      act(() => {
        result.current.setUser(createMockUser())
        result.current.setSession(createMockSession())
      })

      expect(result.current.user).not.toBeNull()
      expect(result.current.session).not.toBeNull()

      act(() => {
        result.current.clearUser()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
    })
  })

  describe('initializeAuth', () => {
    it('should get current session on initialize', async () => {
      const mockSession = createMockSession()

      vi.mocked(getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      await act(async () => {
        await initializeAuth()
      })

      const state = useAuthStore.getState()
      expect(getSession).toHaveBeenCalled()
      expect(state.session).toEqual(mockSession)
      expect(state.user).toEqual(mockSession.user)
      expect(state.isLoading).toBe(false)
      expect(state.isInitialized).toBe(true)
    })

    it('should subscribe to auth state changes', async () => {
      vi.mocked(getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      await act(async () => {
        await initializeAuth()
      })

      expect(onAuthStateChange).toHaveBeenCalled()
    })

    it('should handle null session', async () => {
      vi.mocked(getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      await act(async () => {
        await initializeAuth()
      })

      const state = useAuthStore.getState()
      expect(state.session).toBeNull()
      expect(state.user).toBeNull()
      expect(state.isLoading).toBe(false)
      expect(state.isInitialized).toBe(true)
    })

    it('should return unsubscribe function', async () => {
      const mockUnsubscribe = vi.fn()
      vi.mocked(onAuthStateChange).mockReturnValue({
        data: {
          subscription: {
            id: 'mock-sub-id',
            callback: vi.fn(),
            unsubscribe: mockUnsubscribe,
          },
        },
      })
      vi.mocked(getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      let unsubscribe: (() => void) | undefined
      await act(async () => {
        unsubscribe = await initializeAuth()
      })

      expect(unsubscribe).toBeDefined()
      unsubscribe?.()
      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })

  describe('Selector hooks', () => {
    it('should provide isAuthenticated selector', () => {
      const { result } = renderHook(() => useAuthStore((state) => state.user !== null))
      expect(result.current).toBe(false)

      act(() => {
        useAuthStore.getState().setUser(createMockUser())
      })

      // Re-render to get updated value
      const { result: result2 } = renderHook(() => useAuthStore((state) => state.user !== null))
      expect(result2.current).toBe(true)
    })
  })
})
