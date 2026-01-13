/**
 * Tests for LeftPanel Component
 * FE-503: Left Panel with Favorites
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { User } from '@supabase/supabase-js'

// Mock stores
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/stores/editor-store', () => ({
  useEditorStore: vi.fn(),
}))

// Mock supabase
vi.mock('@/services/supabase', () => ({
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
}))

import { LeftPanel } from '../index'
import { useAuthStore } from '@/stores/auth-store'
import { useEditorStore } from '@/stores/editor-store'

// Helper to create mock user
function createMockUser(): User {
  return {
    id: 'user-123',
    email: 'test@example.com',
    aud: 'authenticated',
    created_at: '2024-01-01',
    app_metadata: {},
    user_metadata: {
      full_name: 'Test User',
      avatar_url: 'https://example.com/avatar.png',
    },
  } as User
}

// Default mock implementations
const mockAuthStore = {
  user: null,
  session: null,
  isLoading: false,
  isInitialized: true,
  setUser: vi.fn(),
  setSession: vi.fn(),
  setLoading: vi.fn(),
  clearUser: vi.fn(),
}

const mockEditorStore = {
  favoriteBlockIds: [],
  focusedBlockId: null,
  enterFocusMode: vi.fn(),
  toggleFavorite: vi.fn(),
  isFavorite: vi.fn(() => false),
  reorderFavorites: vi.fn(),
  loadFavorites: vi.fn(),
}

describe('LeftPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector(mockAuthStore)
      }
      return mockAuthStore
    })
    vi.mocked(useEditorStore).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector(mockEditorStore as any)
      }
      return mockEditorStore as any
    })
  })

  describe('Layout', () => {
    it('should render sidebar with correct width', () => {
      render(<LeftPanel />)
      const sidebar = screen.getByTestId('left-panel')
      expect(sidebar).toBeInTheDocument()
      expect(sidebar).toHaveStyle({ width: '240px' })
    })

    it('should have dark theme background', () => {
      render(<LeftPanel />)
      const sidebar = screen.getByTestId('left-panel')
      expect(sidebar).toHaveStyle({ backgroundColor: '#1e1e1e' })
    })
  })

  describe('Toggle Collapse', () => {
    it('should render toggle button', () => {
      render(<LeftPanel />)
      expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument()
    })

    it('should collapse sidebar when toggle is clicked', () => {
      render(<LeftPanel />)
      const toggle = screen.getByTestId('sidebar-toggle')
      fireEvent.click(toggle)
      const sidebar = screen.getByTestId('left-panel')
      expect(sidebar).toHaveStyle({ width: '0px' })
    })

    it('should expand sidebar when toggle is clicked again', () => {
      render(<LeftPanel />)
      const toggle = screen.getByTestId('sidebar-toggle')
      fireEvent.click(toggle) // collapse
      fireEvent.click(toggle) // expand
      const sidebar = screen.getByTestId('left-panel')
      expect(sidebar).toHaveStyle({ width: '240px' })
    })
  })

  describe('User Info Section', () => {
    it('should show login button when not authenticated', () => {
      vi.mocked(useAuthStore).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector({ ...mockAuthStore, user: null })
        }
        return { ...mockAuthStore, user: null }
      })
      render(<LeftPanel />)
      expect(screen.getByTestId('sidebar-login-button')).toBeInTheDocument()
    })

    it('should show user avatar when authenticated', () => {
      const user = createMockUser()
      vi.mocked(useAuthStore).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector({ ...mockAuthStore, user })
        }
        return { ...mockAuthStore, user }
      })
      render(<LeftPanel />)
      expect(screen.getByTestId('sidebar-user-info')).toBeInTheDocument()
    })

    it('should show user name when authenticated', () => {
      const user = createMockUser()
      vi.mocked(useAuthStore).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector({ ...mockAuthStore, user })
        }
        return { ...mockAuthStore, user }
      })
      render(<LeftPanel />)
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })
  })

  describe('Settings Button', () => {
    it('should render settings button', () => {
      render(<LeftPanel />)
      expect(screen.getByTestId('sidebar-settings-button')).toBeInTheDocument()
    })

    it('should open settings modal when clicked', () => {
      render(<LeftPanel />)
      const settingsButton = screen.getByTestId('sidebar-settings-button')
      fireEvent.click(settingsButton)
      expect(screen.getByTestId('settings-panel')).toBeInTheDocument()
    })
  })

  describe('Favorites Section', () => {
    it('should render favorites section', () => {
      render(<LeftPanel />)
      expect(screen.getByTestId('favorites-section')).toBeInTheDocument()
    })

    it('should show "No favorites" placeholder when empty', () => {
      render(<LeftPanel />)
      expect(screen.getByText(/no favorites/i)).toBeInTheDocument()
    })

    it('should list favorited blocks', () => {
      vi.mocked(useEditorStore).mockImplementation((selector) => {
        const store = {
          ...mockEditorStore,
          favoriteBlockIds: ['block-1', 'block-2'],
        }
        if (typeof selector === 'function') {
          return selector(store as any)
        }
        return store as any
      })
      render(<LeftPanel />)
      // BlockNode uses block-node-{id} pattern
      expect(screen.getByTestId('block-node-block-1')).toBeInTheDocument()
      expect(screen.getByTestId('block-node-block-2')).toBeInTheDocument()
    })
  })

  describe('All Bullets Section', () => {
    it('should render all bullets section', () => {
      render(<LeftPanel />)
      expect(screen.getByTestId('all-bullets-section')).toBeInTheDocument()
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should toggle sidebar with Cmd+\\', () => {
      render(<LeftPanel />)
      const sidebar = screen.getByTestId('left-panel')
      expect(sidebar).toHaveStyle({ width: '240px' })

      fireEvent.keyDown(document, { key: '\\', metaKey: true })
      expect(sidebar).toHaveStyle({ width: '0px' })

      fireEvent.keyDown(document, { key: '\\', metaKey: true })
      expect(sidebar).toHaveStyle({ width: '240px' })
    })
  })
})
