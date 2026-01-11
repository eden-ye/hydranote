/**
 * Tests for Editor Store
 * FE-406: Focus Mode Navigation
 * EDITOR-307: Document ID and Selection State
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  useEditorStore,
  selectIsInFocusMode,
  selectFocusedBlockId,
  selectCurrentDocumentId,
  selectSelectedBlockIds,
  selectHasSelection,
  selectEditorMode,
} from '../editor-store'
import type { EditorMode } from '../editor-store'

// Type assertion helper to verify EditorMode type
const assertEditorMode = (mode: EditorMode): EditorMode => mode

describe('Editor Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store to initial state
    useEditorStore.setState({
      focusedBlockId: null,
      currentDocumentId: null,
      selectedBlockIds: [],
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

  // EDITOR-307: Document ID tracking
  describe('Document ID tracking', () => {
    describe('Initial State', () => {
      it('should have null currentDocumentId initially', () => {
        const { result } = renderHook(() => useEditorStore())
        expect(result.current.currentDocumentId).toBeNull()
      })
    })

    describe('setCurrentDocumentId action', () => {
      it('should set the current document ID', () => {
        const { result } = renderHook(() => useEditorStore())

        act(() => {
          result.current.setCurrentDocumentId('doc-123')
        })

        expect(result.current.currentDocumentId).toBe('doc-123')
      })

      it('should be able to clear the document ID', () => {
        const { result } = renderHook(() => useEditorStore())

        act(() => {
          result.current.setCurrentDocumentId('doc-123')
        })

        expect(result.current.currentDocumentId).toBe('doc-123')

        act(() => {
          result.current.setCurrentDocumentId(null)
        })

        expect(result.current.currentDocumentId).toBeNull()
      })

      it('should update document ID when switching documents', () => {
        const { result } = renderHook(() => useEditorStore())

        act(() => {
          result.current.setCurrentDocumentId('doc-1')
        })

        expect(result.current.currentDocumentId).toBe('doc-1')

        act(() => {
          result.current.setCurrentDocumentId('doc-2')
        })

        expect(result.current.currentDocumentId).toBe('doc-2')
      })
    })

    describe('selectCurrentDocumentId selector', () => {
      it('should return null when no document is loaded', () => {
        const { result } = renderHook(() =>
          useEditorStore(selectCurrentDocumentId)
        )
        expect(result.current).toBeNull()
      })

      it('should return the current document ID', () => {
        const { result: storeResult } = renderHook(() => useEditorStore())
        const { result: selectorResult } = renderHook(() =>
          useEditorStore(selectCurrentDocumentId)
        )

        act(() => {
          storeResult.current.setCurrentDocumentId('doc-xyz')
        })

        expect(selectorResult.current).toBe('doc-xyz')
      })
    })
  })

  // EDITOR-307: Selection state tracking
  describe('Selection state tracking', () => {
    describe('Initial State', () => {
      it('should have empty selectedBlockIds initially', () => {
        const { result } = renderHook(() => useEditorStore())
        expect(result.current.selectedBlockIds).toEqual([])
      })
    })

    describe('setSelectedBlocks action', () => {
      it('should set selected block IDs', () => {
        const { result } = renderHook(() => useEditorStore())

        act(() => {
          result.current.setSelectedBlocks(['block-1', 'block-2'])
        })

        expect(result.current.selectedBlockIds).toEqual(['block-1', 'block-2'])
      })

      it('should replace existing selection', () => {
        const { result } = renderHook(() => useEditorStore())

        act(() => {
          result.current.setSelectedBlocks(['block-1'])
        })

        act(() => {
          result.current.setSelectedBlocks(['block-2', 'block-3'])
        })

        expect(result.current.selectedBlockIds).toEqual(['block-2', 'block-3'])
      })

      it('should allow empty selection', () => {
        const { result } = renderHook(() => useEditorStore())

        act(() => {
          result.current.setSelectedBlocks(['block-1'])
        })

        act(() => {
          result.current.setSelectedBlocks([])
        })

        expect(result.current.selectedBlockIds).toEqual([])
      })
    })

    describe('clearSelection action', () => {
      it('should clear all selected blocks', () => {
        const { result } = renderHook(() => useEditorStore())

        act(() => {
          result.current.setSelectedBlocks(['block-1', 'block-2', 'block-3'])
        })

        expect(result.current.selectedBlockIds).toHaveLength(3)

        act(() => {
          result.current.clearSelection()
        })

        expect(result.current.selectedBlockIds).toEqual([])
      })
    })

    describe('selectSelectedBlockIds selector', () => {
      it('should return empty array when no selection', () => {
        const { result } = renderHook(() =>
          useEditorStore(selectSelectedBlockIds)
        )
        expect(result.current).toEqual([])
      })

      it('should return selected block IDs', () => {
        const { result: storeResult } = renderHook(() => useEditorStore())
        const { result: selectorResult } = renderHook(() =>
          useEditorStore(selectSelectedBlockIds)
        )

        act(() => {
          storeResult.current.setSelectedBlocks(['block-a', 'block-b'])
        })

        expect(selectorResult.current).toEqual(['block-a', 'block-b'])
      })
    })

    describe('selectHasSelection selector', () => {
      it('should return false when no blocks are selected', () => {
        const { result } = renderHook(() =>
          useEditorStore(selectHasSelection)
        )
        expect(result.current).toBe(false)
      })

      it('should return true when blocks are selected', () => {
        const { result: storeResult } = renderHook(() => useEditorStore())
        const { result: selectorResult } = renderHook(() =>
          useEditorStore(selectHasSelection)
        )

        act(() => {
          storeResult.current.setSelectedBlocks(['block-1'])
        })

        expect(selectorResult.current).toBe(true)
      })
    })
  })

  // EDITOR-307: Editor mode tracking
  describe('Editor mode tracking', () => {
    describe('selectEditorMode selector', () => {
      it('should return "normal" when not in focus mode', () => {
        const { result } = renderHook(() =>
          useEditorStore(selectEditorMode)
        )
        // Verify EditorMode type is correct
        const mode = assertEditorMode(result.current)
        expect(mode).toBe('normal')
      })

      it('should return "focus" when in focus mode', () => {
        const { result: storeResult } = renderHook(() => useEditorStore())
        const { result: selectorResult } = renderHook(() =>
          useEditorStore(selectEditorMode)
        )

        act(() => {
          storeResult.current.enterFocusMode('block-123')
        })

        const mode = assertEditorMode(selectorResult.current)
        expect(mode).toBe('focus')
      })

      it('should return "normal" after exiting focus mode', () => {
        const { result: storeResult } = renderHook(() => useEditorStore())
        const { result: selectorResult } = renderHook(() =>
          useEditorStore(selectEditorMode)
        )

        act(() => {
          storeResult.current.enterFocusMode('block-123')
        })

        expect(assertEditorMode(selectorResult.current)).toBe('focus')

        act(() => {
          storeResult.current.exitFocusMode()
        })

        expect(assertEditorMode(selectorResult.current)).toBe('normal')
      })
    })
  })
})
