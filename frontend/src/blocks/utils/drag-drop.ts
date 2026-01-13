/**
 * Drag-drop calculation utilities for EDITOR-3507
 *
 * Provides pure functions for computing drop placement and validating
 * drop targets for bullet block drag-and-drop operations.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Drop placement position relative to target block
 * - 'before': Drop above the target block (same level)
 * - 'after': Drop below the target block (same level)
 * - 'in': Drop as a child of the target block
 */
export type DropPlacement = 'before' | 'after' | 'in'

/**
 * Rectangle bounds for a block element
 */
export interface BlockRect {
  top: number
  bottom: number
  left: number
  right: number
  height: number
  width: number
}

/**
 * Information about a potential drop target
 */
export interface DropTargetInfo {
  blockId: string
  placement: DropPlacement
}

/**
 * Position coordinates
 */
export interface Position {
  x: number
  y: number
}

/**
 * Current drag state
 */
export interface DragState {
  isDragging: boolean
  draggedBlockIds: string[]
  startPosition: Position
  currentPosition: Position
  dropTarget: DropTargetInfo | null
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Horizontal threshold for determining 'in' vs 'after' placement.
 * When mouse X is >= blockRect.left + INDENT_THRESHOLD, we treat it as 'in'.
 * This matches the 24px children padding.
 */
export const INDENT_THRESHOLD = 24

/**
 * Vertical zone ratio for 'before' placement (top 25% of block)
 */
export const TOP_ZONE_RATIO = 0.25

/**
 * Vertical zone ratio for 'after' placement (bottom 25% of block)
 */
export const BOTTOM_ZONE_RATIO = 0.25

// ============================================================================
// Pure Functions
// ============================================================================

/**
 * Compute drop placement based on mouse position relative to block bounds.
 *
 * Drop logic:
 * - Top 25%: 'before' (drop above as sibling)
 * - Bottom 25%: 'after' (drop below as sibling)
 * - Middle 50%:
 *   - If mouse X < block.left + indentThreshold: 'after'
 *   - If mouse X >= block.left + indentThreshold: 'in' (drop as child)
 *
 * @param mouseX - Current mouse X coordinate
 * @param mouseY - Current mouse Y coordinate
 * @param blockRect - Target block bounding rectangle
 * @param indentThreshold - X offset threshold for 'in' placement
 * @returns The computed drop placement
 */
export function computeDropPlacement(
  mouseX: number,
  mouseY: number,
  blockRect: BlockRect,
  indentThreshold: number = INDENT_THRESHOLD
): DropPlacement {
  const { top, height, left } = blockRect

  // Calculate zone boundaries
  const topZoneEnd = top + height * TOP_ZONE_RATIO
  const bottomZoneStart = top + height * (1 - BOTTOM_ZONE_RATIO)

  // Check vertical position
  if (mouseY < topZoneEnd) {
    return 'before'
  }

  if (mouseY >= bottomZoneStart) {
    return 'after'
  }

  // Middle zone - check horizontal position for nest behavior
  const nestThreshold = left + indentThreshold
  if (mouseX >= nestThreshold) {
    return 'in'
  }

  return 'after'
}

/**
 * Check if a drop target is valid (not self, not descendant of dragged blocks).
 *
 * @param draggedBlockIds - IDs of blocks being dragged
 * @param targetBlockId - ID of potential drop target
 * @param descendantIds - IDs of all descendants of dragged blocks
 * @returns true if the drop target is valid
 */
export function isValidDropTarget(
  draggedBlockIds: string[],
  targetBlockId: string,
  descendantIds: string[]
): boolean {
  // Cannot drop on self
  if (draggedBlockIds.includes(targetBlockId)) {
    return false
  }

  // Cannot drop on descendant
  if (descendantIds.includes(targetBlockId)) {
    return false
  }

  return true
}

/**
 * Check if a block is a descendant of another block.
 *
 * @param blockId - Block to check
 * @param potentialAncestorId - Block that might be an ancestor
 * @param blockParentMap - Map of block ID -> parent block ID
 * @returns true if blockId is a descendant of potentialAncestorId
 */
export function isDescendantOf(
  blockId: string,
  potentialAncestorId: string,
  blockParentMap: Map<string, string | null>
): boolean {
  // Self is not a descendant of self
  if (blockId === potentialAncestorId) {
    return false
  }

  let currentId: string | null = blockId

  while (currentId !== null) {
    const parentId = blockParentMap.get(currentId)

    if (parentId === potentialAncestorId) {
      return true
    }

    if (parentId === null || parentId === undefined) {
      break
    }

    currentId = parentId
  }

  return false
}

/**
 * Get all descendant IDs for a set of blocks.
 * Used to determine invalid drop targets.
 *
 * @param blockIds - IDs of blocks to get descendants for
 * @param getChildren - Function to get children IDs for a block
 * @returns Set of all descendant IDs
 */
export function getAllDescendantIds(
  blockIds: string[],
  getChildren: (blockId: string) => string[]
): Set<string> {
  const descendants = new Set<string>()

  function collectDescendants(blockId: string): void {
    const children = getChildren(blockId)
    for (const childId of children) {
      descendants.add(childId)
      collectDescendants(childId)
    }
  }

  for (const blockId of blockIds) {
    collectDescendants(blockId)
  }

  return descendants
}

/**
 * Create initial drag state when drag starts.
 *
 * @param blockIds - IDs of blocks being dragged
 * @param startX - Starting X coordinate
 * @param startY - Starting Y coordinate
 * @returns Initial drag state
 */
export function createDragState(
  blockIds: string[],
  startX: number,
  startY: number
): DragState {
  return {
    isDragging: true,
    draggedBlockIds: blockIds,
    startPosition: { x: startX, y: startY },
    currentPosition: { x: startX, y: startY },
    dropTarget: null,
  }
}

/**
 * Create empty/reset drag state.
 *
 * @returns Empty drag state
 */
export function createEmptyDragState(): DragState {
  return {
    isDragging: false,
    draggedBlockIds: [],
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    dropTarget: null,
  }
}

/**
 * Update drag state with new position and optional drop target.
 *
 * @param state - Current drag state
 * @param x - New X coordinate
 * @param y - New Y coordinate
 * @param dropTarget - New drop target (or null)
 * @returns Updated drag state
 */
export function updateDragState(
  state: DragState,
  x: number,
  y: number,
  dropTarget: DropTargetInfo | null
): DragState {
  return {
    ...state,
    currentPosition: { x, y },
    dropTarget,
  }
}
