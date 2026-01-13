/**
 * Block selection utilities for EDITOR-3507
 *
 * Provides pure functions for managing multi-block selection state
 * with support for single click, Shift+Click range, and Cmd/Ctrl+Click toggle.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * State for tracking selected blocks
 */
export interface BlockSelectionState {
  /** Set of currently selected block IDs */
  selectedBlockIds: Set<string>
  /** Anchor block for range selection (Shift+Click) */
  anchorBlockId: string | null
}

/**
 * Click event with modifier keys for selection computation
 */
export interface SelectionClickEvent {
  blockId: string
  shiftKey: boolean
  metaKey: boolean
  ctrlKey: boolean
}

// ============================================================================
// Pure Functions
// ============================================================================

/**
 * Compute new selection state after a click on a block's drag handle.
 *
 * Behavior:
 * - Simple click: Select only clicked block, clear others
 * - Cmd/Ctrl+Click: Toggle clicked block in selection
 * - Shift+Click: Select range from anchor to clicked block
 *
 * @param currentState - Current selection state
 * @param event - Click event with modifiers
 * @param orderedBlockIds - Ordered list of all block IDs (for range selection)
 * @returns New selection state
 */
export function computeSelectionAfterClick(
  currentState: BlockSelectionState,
  event: SelectionClickEvent,
  orderedBlockIds: string[] = []
): BlockSelectionState {
  const { blockId, shiftKey, metaKey, ctrlKey } = event
  const hasModifierKey = metaKey || ctrlKey

  // Shift+Click: Range selection
  if (shiftKey && currentState.anchorBlockId && orderedBlockIds.length > 0) {
    const rangeSelection = computeSelectionRange(
      currentState.anchorBlockId,
      blockId,
      orderedBlockIds
    )
    return {
      selectedBlockIds: rangeSelection,
      anchorBlockId: currentState.anchorBlockId, // Keep original anchor
    }
  }

  // Cmd/Ctrl+Click: Toggle selection
  if (hasModifierKey) {
    const newSelection = new Set(currentState.selectedBlockIds)

    if (newSelection.has(blockId)) {
      // Don't allow deselecting the last block
      if (newSelection.size > 1) {
        newSelection.delete(blockId)
      }
    } else {
      newSelection.add(blockId)
    }

    return {
      selectedBlockIds: newSelection,
      anchorBlockId: blockId, // Update anchor to clicked block
    }
  }

  // Simple click: Select only this block
  return {
    selectedBlockIds: new Set([blockId]),
    anchorBlockId: blockId,
  }
}

/**
 * Compute selection range between anchor and target block.
 * Selects all blocks (inclusive) between the two in the ordered list.
 *
 * @param anchorBlockId - Starting block ID
 * @param targetBlockId - Ending block ID
 * @param orderedBlockIds - Ordered list of all visible block IDs
 * @returns Set of selected block IDs in the range
 */
export function computeSelectionRange(
  anchorBlockId: string,
  targetBlockId: string,
  orderedBlockIds: string[]
): Set<string> {
  const anchorIndex = orderedBlockIds.indexOf(anchorBlockId)
  const targetIndex = orderedBlockIds.indexOf(targetBlockId)

  // If either block not found, return empty set
  if (anchorIndex === -1 || targetIndex === -1) {
    return new Set()
  }

  // Determine range bounds (handle forward and backward selection)
  const startIndex = Math.min(anchorIndex, targetIndex)
  const endIndex = Math.max(anchorIndex, targetIndex)

  // Select all blocks in range (inclusive)
  const selectedIds = new Set<string>()
  for (let i = startIndex; i <= endIndex; i++) {
    selectedIds.add(orderedBlockIds[i])
  }

  return selectedIds
}

/**
 * Check if a block is currently selected.
 *
 * @param state - Current selection state
 * @param blockId - Block ID to check
 * @returns true if block is selected
 */
export function isBlockSelected(
  state: BlockSelectionState,
  blockId: string
): boolean {
  return state.selectedBlockIds.has(blockId)
}

/**
 * Get the count of selected blocks.
 *
 * @param state - Current selection state
 * @returns Number of selected blocks
 */
export function getSelectionCount(state: BlockSelectionState): number {
  return state.selectedBlockIds.size
}

/**
 * Clear all selection.
 *
 * @returns Empty selection state
 */
export function clearSelection(): BlockSelectionState {
  return {
    selectedBlockIds: new Set(),
    anchorBlockId: null,
  }
}

/**
 * Create initial selection state with a single block selected.
 *
 * @param blockId - Block ID to select
 * @returns Selection state with single block
 */
export function createSingleSelection(blockId: string): BlockSelectionState {
  return {
    selectedBlockIds: new Set([blockId]),
    anchorBlockId: blockId,
  }
}

/**
 * Get array of selected block IDs (useful for iteration).
 *
 * @param state - Current selection state
 * @returns Array of selected block IDs
 */
export function getSelectedBlockIds(state: BlockSelectionState): string[] {
  return Array.from(state.selectedBlockIds)
}
