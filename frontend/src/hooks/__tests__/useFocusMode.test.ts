/**
 * Tests for useFocusMode hook
 * FE-406: Focus Mode Navigation
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFocusMode } from '../useFocusMode'
import { useEditorStore } from '../../stores/editor-store'

describe('useFocusMode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store to initial state
    useEditorStore.setState({
      focusedBlockId: null,
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('initial state', () => {
    it('should not be in focus mode initially', () => {
      const { result } = renderHook(() => useFocusMode())
      expect(result.current.isInFocusMode).toBe(false)
    })

    it('should have null focusedBlockId initially', () => {
      const { result } = renderHook(() => useFocusMode())
      expect(result.current.focusedBlockId).toBeNull()
    })
  })

  describe('enterFocusMode', () => {
    it('should enter focus mode on a block', () => {
      const { result } = renderHook(() => useFocusMode())

      act(() => {
        result.current.enterFocusMode('block-123')
      })

      expect(result.current.isInFocusMode).toBe(true)
      expect(result.current.focusedBlockId).toBe('block-123')
    })

    it('should update focused block when entering focus on different block', () => {
      const { result } = renderHook(() => useFocusMode())

      act(() => {
        result.current.enterFocusMode('block-123')
      })

      expect(result.current.focusedBlockId).toBe('block-123')

      act(() => {
        result.current.enterFocusMode('block-456')
      })

      expect(result.current.focusedBlockId).toBe('block-456')
    })
  })

  describe('exitFocusMode', () => {
    it('should exit focus mode', () => {
      const { result } = renderHook(() => useFocusMode())

      act(() => {
        result.current.enterFocusMode('block-123')
      })

      expect(result.current.isInFocusMode).toBe(true)

      act(() => {
        result.current.exitFocusMode()
      })

      expect(result.current.isInFocusMode).toBe(false)
      expect(result.current.focusedBlockId).toBeNull()
    })
  })

  describe('keyboard handling', () => {
    it('should exit focus mode on Escape key', () => {
      const { result } = renderHook(() => useFocusMode())

      act(() => {
        result.current.enterFocusMode('block-123')
      })

      expect(result.current.isInFocusMode).toBe(true)

      // Simulate Escape key
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      })

      expect(result.current.isInFocusMode).toBe(false)
      expect(result.current.focusedBlockId).toBeNull()
    })

    it('should not exit when not in focus mode and Escape is pressed', () => {
      const { result } = renderHook(() => useFocusMode())

      expect(result.current.isInFocusMode).toBe(false)

      // Simulate Escape key when not in focus mode
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      })

      expect(result.current.isInFocusMode).toBe(false)
    })

    it('should not exit on other keys', () => {
      const { result } = renderHook(() => useFocusMode())

      act(() => {
        result.current.enterFocusMode('block-123')
      })

      // Simulate another key
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
      })

      expect(result.current.isInFocusMode).toBe(true)
      expect(result.current.focusedBlockId).toBe('block-123')
    })
  })

  describe('isFocused helper', () => {
    it('should return true for the focused block', () => {
      const { result } = renderHook(() => useFocusMode())

      act(() => {
        result.current.enterFocusMode('block-123')
      })

      expect(result.current.isFocused('block-123')).toBe(true)
    })

    it('should return false for non-focused blocks', () => {
      const { result } = renderHook(() => useFocusMode())

      act(() => {
        result.current.enterFocusMode('block-123')
      })

      expect(result.current.isFocused('block-456')).toBe(false)
    })

    it('should return false when not in focus mode', () => {
      const { result } = renderHook(() => useFocusMode())

      expect(result.current.isFocused('block-123')).toBe(false)
    })
  })

  describe('cleanup', () => {
    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      const { unmount } = renderHook(() => useFocusMode())

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      )
    })
  })
})
