/**
 * Tests for Editor Store - Favorites functionality
 * FE-503: Left Panel with Favorites
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { act } from '@testing-library/react'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Import after mocking localStorage
import { useEditorStore } from '../editor-store'

describe('Editor Store - Favorites', () => {
  beforeEach(() => {
    // Reset store state
    act(() => {
      useEditorStore.setState({
        favoriteBlockIds: [],
      })
    })
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  describe('favoriteBlockIds state', () => {
    it('should initialize with empty array', () => {
      const { favoriteBlockIds } = useEditorStore.getState()
      expect(favoriteBlockIds).toEqual([])
    })

    it('should load favorites from localStorage on init', () => {
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(['block-1', 'block-2']))
      act(() => {
        useEditorStore.getState().loadFavorites()
      })
      const { favoriteBlockIds } = useEditorStore.getState()
      expect(favoriteBlockIds).toEqual(['block-1', 'block-2'])
    })
  })

  describe('toggleFavorite action', () => {
    it('should add block to favorites if not favorited', () => {
      act(() => {
        useEditorStore.getState().toggleFavorite('block-123')
      })
      const { favoriteBlockIds } = useEditorStore.getState()
      expect(favoriteBlockIds).toContain('block-123')
    })

    it('should remove block from favorites if already favorited', () => {
      act(() => {
        useEditorStore.setState({ favoriteBlockIds: ['block-123', 'block-456'] })
        useEditorStore.getState().toggleFavorite('block-123')
      })
      const { favoriteBlockIds } = useEditorStore.getState()
      expect(favoriteBlockIds).not.toContain('block-123')
      expect(favoriteBlockIds).toContain('block-456')
    })

    it('should persist favorites to localStorage', () => {
      act(() => {
        useEditorStore.getState().toggleFavorite('block-123')
      })
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'hydra:favorites',
        JSON.stringify(['block-123'])
      )
    })
  })

  describe('isFavorite selector', () => {
    it('should return true for favorited block', () => {
      act(() => {
        useEditorStore.setState({ favoriteBlockIds: ['block-123'] })
      })
      const result = useEditorStore.getState().isFavorite('block-123')
      expect(result).toBe(true)
    })

    it('should return false for non-favorited block', () => {
      act(() => {
        useEditorStore.setState({ favoriteBlockIds: ['block-456'] })
      })
      const result = useEditorStore.getState().isFavorite('block-123')
      expect(result).toBe(false)
    })
  })

  describe('reorderFavorites action', () => {
    it('should reorder favorites by moving block to new position', () => {
      act(() => {
        useEditorStore.setState({ favoriteBlockIds: ['a', 'b', 'c', 'd'] })
        useEditorStore.getState().reorderFavorites('a', 2) // Move 'a' to index 2
      })
      const { favoriteBlockIds } = useEditorStore.getState()
      expect(favoriteBlockIds).toEqual(['b', 'c', 'a', 'd'])
    })

    it('should move block from end to beginning', () => {
      act(() => {
        useEditorStore.setState({ favoriteBlockIds: ['a', 'b', 'c'] })
        useEditorStore.getState().reorderFavorites('c', 0) // Move 'c' to index 0
      })
      const { favoriteBlockIds } = useEditorStore.getState()
      expect(favoriteBlockIds).toEqual(['c', 'a', 'b'])
    })

    it('should move block from beginning to end', () => {
      act(() => {
        useEditorStore.setState({ favoriteBlockIds: ['a', 'b', 'c'] })
        useEditorStore.getState().reorderFavorites('a', 2) // Move 'a' to index 2
      })
      const { favoriteBlockIds } = useEditorStore.getState()
      expect(favoriteBlockIds).toEqual(['b', 'c', 'a'])
    })

    it('should persist reordered favorites to localStorage', () => {
      act(() => {
        useEditorStore.setState({ favoriteBlockIds: ['a', 'b', 'c'] })
        useEditorStore.getState().reorderFavorites('a', 2)
      })
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'hydra:favorites',
        JSON.stringify(['b', 'c', 'a'])
      )
    })

    it('should handle moving to same position (no-op)', () => {
      act(() => {
        useEditorStore.setState({ favoriteBlockIds: ['a', 'b', 'c'] })
        useEditorStore.getState().reorderFavorites('b', 1) // 'b' is already at index 1
      })
      const { favoriteBlockIds } = useEditorStore.getState()
      expect(favoriteBlockIds).toEqual(['a', 'b', 'c'])
    })

    it('should handle non-existent block id', () => {
      act(() => {
        useEditorStore.setState({ favoriteBlockIds: ['a', 'b', 'c'] })
        useEditorStore.getState().reorderFavorites('nonexistent', 1)
      })
      const { favoriteBlockIds } = useEditorStore.getState()
      expect(favoriteBlockIds).toEqual(['a', 'b', 'c']) // unchanged
    })
  })

  describe('clearFavorites action', () => {
    it('should remove all favorites', () => {
      act(() => {
        useEditorStore.setState({ favoriteBlockIds: ['a', 'b', 'c'] })
        useEditorStore.getState().clearFavorites()
      })
      const { favoriteBlockIds } = useEditorStore.getState()
      expect(favoriteBlockIds).toEqual([])
    })

    it('should update localStorage', () => {
      act(() => {
        useEditorStore.setState({ favoriteBlockIds: ['a', 'b', 'c'] })
        useEditorStore.getState().clearFavorites()
      })
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'hydra:favorites',
        JSON.stringify([])
      )
    })
  })
})
