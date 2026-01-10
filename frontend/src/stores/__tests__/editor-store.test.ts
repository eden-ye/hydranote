/**
 * Tests for Editor Store
 * FE-406: Focus Mode Navigation
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  useEditorStore,
  selectIsInFocusMode,
  selectFocusedBlockId,
} from '../editor-store'

describe('Editor Store', () => {
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

  describe('Initial State', () => {
    it('should have null focusedBlockId initially', () => {
      const { result } = renderHook(() => useEditorStore())
      expect(result.current.focusedBlockId).toBeNull()
    })
  })

  describe('setFocusedBlockId action', () => {
    it('should set the focused block ID', () => {
      const { result } = renderHook(() => useEditorStore())

      act(() => {
        result.current.setFocusedBlockId('block-123')
      })

      expect(result.current.focusedBlockId).toBe('block-123')
    })

    it('should be able to clear the focused block', () => {
      const { result } = renderHook(() => useEditorStore())

      act(() => {
        result.current.setFocusedBlockId('block-123')
      })

      expect(result.current.focusedBlockId).toBe('block-123')

      act(() => {
        result.current.setFocusedBlockId(null)
      })

      expect(result.current.focusedBlockId).toBeNull()
    })
  })

  describe('enterFocusMode action', () => {
    it('should enter focus mode on a block', () => {
      const { result } = renderHook(() => useEditorStore())

      act(() => {
        result.current.enterFocusMode('block-456')
      })

      expect(result.current.focusedBlockId).toBe('block-456')
    })
  })

  describe('exitFocusMode action', () => {
    it('should exit focus mode', () => {
      const { result } = renderHook(() => useEditorStore())

      act(() => {
        result.current.enterFocusMode('block-456')
      })

      expect(result.current.focusedBlockId).toBe('block-456')

      act(() => {
        result.current.exitFocusMode()
      })

      expect(result.current.focusedBlockId).toBeNull()
    })
  })

  describe('selectIsInFocusMode selector', () => {
    it('should return false when not in focus mode', () => {
      const { result } = renderHook(() => useEditorStore(selectIsInFocusMode))
      expect(result.current).toBe(false)
    })

    it('should return true when in focus mode', () => {
      const { result: storeResult } = renderHook(() => useEditorStore())
      const { result: selectorResult } = renderHook(() =>
        useEditorStore(selectIsInFocusMode)
      )

      act(() => {
        storeResult.current.enterFocusMode('block-789')
      })

      expect(selectorResult.current).toBe(true)
    })
  })

  describe('selectFocusedBlockId selector', () => {
    it('should return null when not in focus mode', () => {
      const { result } = renderHook(() =>
        useEditorStore(selectFocusedBlockId)
      )
      expect(result.current).toBeNull()
    })

    it('should return the focused block ID when in focus mode', () => {
      const { result: storeResult } = renderHook(() => useEditorStore())
      const { result: selectorResult } = renderHook(() =>
        useEditorStore(selectFocusedBlockId)
      )

      act(() => {
        storeResult.current.enterFocusMode('block-abc')
      })

      expect(selectorResult.current).toBe('block-abc')
    })
  })
})
