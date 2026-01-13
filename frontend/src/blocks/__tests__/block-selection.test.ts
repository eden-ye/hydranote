import { describe, it, expect } from 'vitest'

/**
 * Tests for multi-block selection functionality (EDITOR-3507)
 *
 * Testing:
 * - Single click selection
 * - Shift+Click range selection
 * - Cmd/Ctrl+Click toggle selection
 * - Selection state management
 */

import {
  computeSelectionAfterClick,
  computeSelectionRange,
  isBlockSelected,
  getSelectionCount,
  clearSelection,
  type BlockSelectionState,
  type SelectionClickEvent,
} from '../utils/block-selection'

describe('Block Selection Utilities (EDITOR-3507)', () => {
  describe('computeSelectionAfterClick', () => {
    describe('Single click (no modifiers)', () => {
      it('should select only clicked block, deselecting others', () => {
        const currentSelection: BlockSelectionState = {
          selectedBlockIds: new Set(['block-1', 'block-2']),
          anchorBlockId: 'block-1',
        }
        const event: SelectionClickEvent = {
          blockId: 'block-3',
          shiftKey: false,
          metaKey: false,
          ctrlKey: false,
        }

        const result = computeSelectionAfterClick(currentSelection, event)

        expect(result.selectedBlockIds.size).toBe(1)
        expect(result.selectedBlockIds.has('block-3')).toBe(true)
        expect(result.anchorBlockId).toBe('block-3')
      })

      it('should update anchor when selecting different block', () => {
        const currentSelection: BlockSelectionState = {
          selectedBlockIds: new Set(['block-1']),
          anchorBlockId: 'block-1',
        }
        const event: SelectionClickEvent = {
          blockId: 'block-2',
          shiftKey: false,
          metaKey: false,
          ctrlKey: false,
        }

        const result = computeSelectionAfterClick(currentSelection, event)

        expect(result.anchorBlockId).toBe('block-2')
      })
    })

    describe('Ctrl/Cmd+Click (toggle selection)', () => {
      it('should add block to selection when not selected', () => {
        const currentSelection: BlockSelectionState = {
          selectedBlockIds: new Set(['block-1']),
          anchorBlockId: 'block-1',
        }
        const event: SelectionClickEvent = {
          blockId: 'block-2',
          shiftKey: false,
          metaKey: true,
          ctrlKey: false,
        }

        const result = computeSelectionAfterClick(currentSelection, event)

        expect(result.selectedBlockIds.size).toBe(2)
        expect(result.selectedBlockIds.has('block-1')).toBe(true)
        expect(result.selectedBlockIds.has('block-2')).toBe(true)
      })

      it('should remove block from selection when already selected', () => {
        const currentSelection: BlockSelectionState = {
          selectedBlockIds: new Set(['block-1', 'block-2']),
          anchorBlockId: 'block-1',
        }
        const event: SelectionClickEvent = {
          blockId: 'block-2',
          shiftKey: false,
          metaKey: true,
          ctrlKey: false,
        }

        const result = computeSelectionAfterClick(currentSelection, event)

        expect(result.selectedBlockIds.size).toBe(1)
        expect(result.selectedBlockIds.has('block-1')).toBe(true)
        expect(result.selectedBlockIds.has('block-2')).toBe(false)
      })

      it('should work with Ctrl key on Windows/Linux', () => {
        const currentSelection: BlockSelectionState = {
          selectedBlockIds: new Set(['block-1']),
          anchorBlockId: 'block-1',
        }
        const event: SelectionClickEvent = {
          blockId: 'block-2',
          shiftKey: false,
          metaKey: false,
          ctrlKey: true,
        }

        const result = computeSelectionAfterClick(currentSelection, event)

        expect(result.selectedBlockIds.size).toBe(2)
      })

      it('should update anchor to clicked block', () => {
        const currentSelection: BlockSelectionState = {
          selectedBlockIds: new Set(['block-1']),
          anchorBlockId: 'block-1',
        }
        const event: SelectionClickEvent = {
          blockId: 'block-2',
          shiftKey: false,
          metaKey: true,
          ctrlKey: false,
        }

        const result = computeSelectionAfterClick(currentSelection, event)

        expect(result.anchorBlockId).toBe('block-2')
      })

      it('should not allow deselecting last block', () => {
        const currentSelection: BlockSelectionState = {
          selectedBlockIds: new Set(['block-1']),
          anchorBlockId: 'block-1',
        }
        const event: SelectionClickEvent = {
          blockId: 'block-1',
          shiftKey: false,
          metaKey: true,
          ctrlKey: false,
        }

        const result = computeSelectionAfterClick(currentSelection, event)

        // Should keep at least one block selected
        expect(result.selectedBlockIds.size).toBeGreaterThanOrEqual(1)
      })
    })

    describe('Shift+Click (range selection)', () => {
      it('should delegate to computeSelectionRange when shift is held', () => {
        const currentSelection: BlockSelectionState = {
          selectedBlockIds: new Set(['block-1']),
          anchorBlockId: 'block-1',
        }
        const event: SelectionClickEvent = {
          blockId: 'block-3',
          shiftKey: true,
          metaKey: false,
          ctrlKey: false,
        }
        const orderedBlockIds = ['block-1', 'block-2', 'block-3', 'block-4']

        const result = computeSelectionAfterClick(currentSelection, event, orderedBlockIds)

        expect(result.selectedBlockIds.has('block-1')).toBe(true)
        expect(result.selectedBlockIds.has('block-2')).toBe(true)
        expect(result.selectedBlockIds.has('block-3')).toBe(true)
        // Anchor should remain the same
        expect(result.anchorBlockId).toBe('block-1')
      })
    })
  })

  describe('computeSelectionRange', () => {
    const orderedBlockIds = ['block-1', 'block-2', 'block-3', 'block-4', 'block-5']

    it('should select all blocks between anchor and target (forward)', () => {
      const result = computeSelectionRange('block-1', 'block-4', orderedBlockIds)

      expect(result.size).toBe(4)
      expect(result.has('block-1')).toBe(true)
      expect(result.has('block-2')).toBe(true)
      expect(result.has('block-3')).toBe(true)
      expect(result.has('block-4')).toBe(true)
      expect(result.has('block-5')).toBe(false)
    })

    it('should select all blocks between anchor and target (backward)', () => {
      const result = computeSelectionRange('block-4', 'block-1', orderedBlockIds)

      expect(result.size).toBe(4)
      expect(result.has('block-1')).toBe(true)
      expect(result.has('block-2')).toBe(true)
      expect(result.has('block-3')).toBe(true)
      expect(result.has('block-4')).toBe(true)
    })

    it('should select single block when anchor equals target', () => {
      const result = computeSelectionRange('block-2', 'block-2', orderedBlockIds)

      expect(result.size).toBe(1)
      expect(result.has('block-2')).toBe(true)
    })

    it('should select all blocks from first to last', () => {
      const result = computeSelectionRange('block-1', 'block-5', orderedBlockIds)

      expect(result.size).toBe(5)
    })

    it('should return empty set if anchor not found', () => {
      const result = computeSelectionRange('nonexistent', 'block-2', orderedBlockIds)

      expect(result.size).toBe(0)
    })

    it('should return empty set if target not found', () => {
      const result = computeSelectionRange('block-1', 'nonexistent', orderedBlockIds)

      expect(result.size).toBe(0)
    })
  })

  describe('isBlockSelected', () => {
    it('should return true when block is in selection', () => {
      const state: BlockSelectionState = {
        selectedBlockIds: new Set(['block-1', 'block-2']),
        anchorBlockId: 'block-1',
      }

      expect(isBlockSelected(state, 'block-1')).toBe(true)
      expect(isBlockSelected(state, 'block-2')).toBe(true)
    })

    it('should return false when block is not in selection', () => {
      const state: BlockSelectionState = {
        selectedBlockIds: new Set(['block-1']),
        anchorBlockId: 'block-1',
      }

      expect(isBlockSelected(state, 'block-2')).toBe(false)
      expect(isBlockSelected(state, 'block-3')).toBe(false)
    })

    it('should return false for empty selection', () => {
      const state: BlockSelectionState = {
        selectedBlockIds: new Set(),
        anchorBlockId: null,
      }

      expect(isBlockSelected(state, 'block-1')).toBe(false)
    })
  })

  describe('getSelectionCount', () => {
    it('should return correct count', () => {
      const state: BlockSelectionState = {
        selectedBlockIds: new Set(['block-1', 'block-2', 'block-3']),
        anchorBlockId: 'block-1',
      }

      expect(getSelectionCount(state)).toBe(3)
    })

    it('should return 0 for empty selection', () => {
      const state: BlockSelectionState = {
        selectedBlockIds: new Set(),
        anchorBlockId: null,
      }

      expect(getSelectionCount(state)).toBe(0)
    })
  })

  describe('clearSelection', () => {
    it('should return empty selection state', () => {
      const result = clearSelection()

      expect(result.selectedBlockIds.size).toBe(0)
      expect(result.anchorBlockId).toBeNull()
    })
  })

  describe('BlockSelectionState interface', () => {
    it('should have all required properties', () => {
      const state: BlockSelectionState = {
        selectedBlockIds: new Set(['block-1']),
        anchorBlockId: 'block-1',
      }

      expect(state).toHaveProperty('selectedBlockIds')
      expect(state).toHaveProperty('anchorBlockId')
    })

    it('should allow null anchorBlockId when no selection', () => {
      const state: BlockSelectionState = {
        selectedBlockIds: new Set(),
        anchorBlockId: null,
      }

      expect(state.anchorBlockId).toBeNull()
    })
  })

  describe('SelectionClickEvent interface', () => {
    it('should have all required modifier properties', () => {
      const event: SelectionClickEvent = {
        blockId: 'block-1',
        shiftKey: false,
        metaKey: false,
        ctrlKey: false,
      }

      expect(event).toHaveProperty('blockId')
      expect(event).toHaveProperty('shiftKey')
      expect(event).toHaveProperty('metaKey')
      expect(event).toHaveProperty('ctrlKey')
    })
  })
})
