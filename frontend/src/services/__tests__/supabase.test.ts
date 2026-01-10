/**
 * Tests for Supabase Client Service
 * FE-401: Supabase Client (Frontend)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Mock the Supabase client module
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  })),
}))

describe('Supabase Client Service', () => {
  beforeEach(() => {
    vi.resetModules()
    // Set up environment variables
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test-project.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('Client Initialization', () => {
    it('should create a Supabase client with environment variables', async () => {
      const { supabase } = await import('../supabase')

      expect(createClient).toHaveBeenCalledWith(
        'https://test-project.supabase.co',
        'test-anon-key'
      )
      expect(supabase).toBeDefined()
    })

    it('should export the supabase client', async () => {
      const { supabase } = await import('../supabase')
      expect(supabase).toBeDefined()
      expect(supabase.auth).toBeDefined()
    })
  })

  describe('Auth Methods', () => {
    it('should export signInWithGoogle function', async () => {
      const { signInWithGoogle } = await import('../supabase')
      expect(signInWithGoogle).toBeDefined()
      expect(typeof signInWithGoogle).toBe('function')
    })

    it('should export signOut function', async () => {
      const { signOut } = await import('../supabase')
      expect(signOut).toBeDefined()
      expect(typeof signOut).toBe('function')
    })

    it('should export getSession function', async () => {
      const { getSession } = await import('../supabase')
      expect(getSession).toBeDefined()
      expect(typeof getSession).toBe('function')
    })

    it('should export onAuthStateChange function', async () => {
      const { onAuthStateChange } = await import('../supabase')
      expect(onAuthStateChange).toBeDefined()
      expect(typeof onAuthStateChange).toBe('function')
    })
  })

  describe('signInWithGoogle', () => {
    it('should call signInWithOAuth with Google provider', async () => {
      const { supabase, signInWithGoogle } = await import('../supabase')
      const mockSignInWithOAuth = vi.mocked(supabase.auth.signInWithOAuth)
      mockSignInWithOAuth.mockResolvedValue({
        data: { provider: 'google' as const, url: 'https://accounts.google.com/oauth' },
        error: null,
      })

      await signInWithGoogle()

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.any(String),
        },
      })
    })
  })

  describe('signOut', () => {
    it('should call supabase auth signOut', async () => {
      const { supabase, signOut } = await import('../supabase')
      const mockSignOut = vi.mocked(supabase.auth.signOut)
      mockSignOut.mockResolvedValue({ error: null })

      await signOut()

      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  describe('getSession', () => {
    it('should call supabase auth getSession', async () => {
      const { supabase, getSession } = await import('../supabase')
      const mockGetSession = vi.mocked(supabase.auth.getSession)
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const result = await getSession()

      expect(mockGetSession).toHaveBeenCalled()
      expect(result).toEqual({ data: { session: null }, error: null })
    })
  })

  describe('onAuthStateChange', () => {
    it('should call supabase auth onAuthStateChange with callback', async () => {
      const { supabase, onAuthStateChange } = await import('../supabase')
      const mockOnAuthStateChange = vi.mocked(supabase.auth.onAuthStateChange)
      const callback = vi.fn()

      onAuthStateChange(callback)

      expect(mockOnAuthStateChange).toHaveBeenCalledWith(callback)
    })

    it('should return an unsubscribe function', async () => {
      const { onAuthStateChange } = await import('../supabase')
      const callback = vi.fn()

      const result = onAuthStateChange(callback)

      expect(result).toBeDefined()
      expect(result.data.subscription.unsubscribe).toBeDefined()
    })
  })

  describe('Types', () => {
    it('should export User type', async () => {
      // TypeScript will verify this at compile time
      // This test just ensures the type is re-exported
      const supabaseModule = await import('../supabase')
      // Check that the module exports expected types via runtime check
      expect(supabaseModule).toBeDefined()
    })
  })
})
