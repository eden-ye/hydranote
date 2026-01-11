/**
 * Tests for App Component Integration
 * FE-405: AI Generation Store Integration
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAIStore } from '../stores/ai-store'

// Create mock auth state with proper types
interface MockSession {
  access_token: string | null
  refresh_token: string | null
  user: unknown | null
}

interface MockAuthState {
  user: unknown | null
  session: MockSession | null
  isLoading: boolean
  isInitialized: boolean
  setUser: ReturnType<typeof vi.fn>
  setSession: ReturnType<typeof vi.fn>
  setLoading: ReturnType<typeof vi.fn>
  clearUser: ReturnType<typeof vi.fn>
}

const createMockAuthState = (overrides: Partial<MockAuthState> = {}): MockAuthState => ({
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

// Mock the auth store and initialization
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = createMockAuthState()
    return selector ? selector(state) : state
  }),
  initializeAuth: vi.fn(() => Promise.resolve(() => {})),
  // FE-408: Add selector for access token
  selectAccessToken: (state: MockAuthState) => state.session?.access_token ?? null,
  selectIsAuthenticated: (state: MockAuthState) => state.user !== null && state.session !== null,
}))

// Mock @blocksuite/store
vi.mock('@blocksuite/store', () => {
  class MockDoc {
    isEmpty = true
    spaceDoc = {}
    load(callback?: () => void) {
      callback?.()
    }
    addBlock() {
      return 'block-id'
    }
  }

  return {
    Schema: class MockSchema { register() { return this } },
    DocCollection: class MockDocCollection {
      meta = { initialize: () => {} }
      createDoc() { return new MockDoc() }
    },
    defineBlockSchema: (opts: { flavour: string }) => ({ version: 1, model: { flavour: opts.flavour } }),
  }
})

// EDITOR-3102: Mock @blocksuite/inline for baseTextAttributes
vi.mock('@blocksuite/inline', () => {
  const baseTextAttributes = {
    extend: (schema: Record<string, unknown>) => ({
      ...schema,
      parse: (value: unknown) => value,
      safeParse: (value: unknown) => ({ success: true, data: value }),
    }),
    parse: (value: unknown) => value,
    safeParse: (value: unknown) => ({ success: true, data: value }),
  }
  return { baseTextAttributes }
})

// Mock @blocksuite/block-std
vi.mock('@blocksuite/block-std', () => ({
  BlockComponent: class MockBlockComponent extends HTMLElement {},
  FlavourExtension: () => ({}),
  BlockViewExtension: () => ({}),
}))

// Mock @blocksuite/affine-components/rich-text
vi.mock('@blocksuite/affine-components/rich-text', () => ({
  focusTextModel: vi.fn(),
  asyncSetInlineRange: vi.fn(),
  getInlineEditorByModel: vi.fn(),
}))

// Mock lit for LitElement components
vi.mock('lit', () => ({
  html: () => '',
  css: () => '',
  nothing: '',
}))

vi.mock('lit/decorators.js', () => ({
  customElement: () => () => {},
}))

// Mock y-indexeddb with a proper class
vi.mock('y-indexeddb', () => {
  return {
    IndexeddbPersistence: class MockIndexeddbPersistence {
      synced = false
      on = vi.fn().mockImplementation((event: string, callback: () => void) => {
        if (event === 'synced') {
          // Simulate immediate sync
          setTimeout(() => {
            this.synced = true
            callback()
          }, 0)
        }
      })
      off = vi.fn()
      destroy = vi.fn()
    },
    clearDocument: vi.fn().mockResolvedValue(undefined),
  }
})

// Mock supabase service
vi.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
  onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
}))

// Import App after mocks are set up
import App from '../App'

describe('App - AI Store Integration (FE-405)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset AI store to initial state
    useAIStore.setState({
      currentPrompt: null,
      isGenerating: false,
      isStreaming: false,
      generationsUsed: 0,
      generationsLimit: 50,
      error: null,
      lastGenerationId: null,
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Spotlight Integration', () => {
    it('should update AI store when submitting from spotlight', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Open spotlight with Cmd+P
      await user.keyboard('{Meta>}p{/Meta}')

      // Wait for spotlight to open
      await waitFor(() => {
        expect(screen.getByTestId('spotlight-modal')).toBeInTheDocument()
      })

      // Type and submit a query
      const input = screen.getByTestId('spotlight-input')
      await user.type(input, 'Generate notes about React{enter}')

      // Verify AI store was updated
      const state = useAIStore.getState()
      expect(state.currentPrompt).toBe('Generate notes about React')
      expect(state.isGenerating).toBe(true)
    })

    it('should not submit when canGenerate is false (at limit)', async () => {
      const user = userEvent.setup()

      // Set store to be at limit
      useAIStore.setState({
        generationsUsed: 50,
        generationsLimit: 50,
      })

      render(<App />)

      // Open spotlight
      await user.keyboard('{Meta>}p{/Meta}')

      await waitFor(() => {
        expect(screen.getByTestId('spotlight-modal')).toBeInTheDocument()
      })

      const input = screen.getByTestId('spotlight-input')
      await user.type(input, 'test query{enter}')

      // Should NOT start generating since at limit
      const state = useAIStore.getState()
      expect(state.isGenerating).toBe(false)
    })

    it('should display generation limit in spotlight hint', async () => {
      const user = userEvent.setup()

      useAIStore.setState({
        generationsUsed: 10,
        generationsLimit: 50,
      })

      render(<App />)

      // Open spotlight
      await user.keyboard('{Meta>}p{/Meta}')

      await waitFor(() => {
        expect(screen.getByTestId('spotlight-modal')).toBeInTheDocument()
      })

      // Check that generations remaining is displayed
      expect(screen.getByText(/40.*remaining/i)).toBeInTheDocument()
    })

    it('should show loading state when generating', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Open spotlight
      await user.keyboard('{Meta>}p{/Meta}')

      await waitFor(() => {
        expect(screen.getByTestId('spotlight-modal')).toBeInTheDocument()
      })

      // Submit
      const input = screen.getByTestId('spotlight-input')
      await user.type(input, 'test query{enter}')

      // Modal should close after submit
      await waitFor(() => {
        expect(screen.queryByTestId('spotlight-modal')).not.toBeInTheDocument()
      })
    })
  })
})
