/**
 * Portal Subtree Editing Utilities (EDITOR-3505)
 *
 * Enables editing of any bullet within the portal subtree:
 * - Track which subtree node is being edited
 * - Show edit warning for subtree nodes
 * - Get Y.Text for subtree nodes from source doc
 * - CSS classes for editing state
 */

import type { Doc } from '@blocksuite/store'
import type { Text } from '@blocksuite/store'

/**
 * State for tracking which subtree node is being edited
 */
export interface SubtreeEditingState {
  /** ID of the currently edited subtree node (null if none) */
  editingNodeId: string | null
  /** Whether the edit warning has been shown/dismissed for this portal */
  hasShownEditWarning: boolean
  /** Whether the warning was dismissed by user */
  warningDismissed: boolean
}

/**
 * Information about an editable subtree node
 */
export interface EditableSubtreeNode {
  /** Block ID */
  id: string
  /** Block text (for display purposes) */
  text: string
  /** Whether this node is currently being edited */
  isEditing: boolean
  /** Whether this node can be edited */
  isEditable: boolean
  /** Depth in the subtree */
  depth: number
}

/**
 * Creates initial subtree editing state
 */
export function createInitialSubtreeEditingState(): SubtreeEditingState {
  return {
    editingNodeId: null,
    hasShownEditWarning: false,
    warningDismissed: false,
  }
}

/**
 * Determines if a subtree node should be editable
 */
export function isSubtreeNodeEditable(params: {
  portalIsOrphaned: boolean
  portalIsLoading: boolean
  portalIsCollapsed: boolean
  nodeExists: boolean
}): boolean {
  const { portalIsOrphaned, portalIsLoading, portalIsCollapsed, nodeExists } = params

  if (portalIsOrphaned) return false
  if (portalIsLoading) return false
  if (portalIsCollapsed) return false
  if (!nodeExists) return false

  return true
}

/**
 * Determines if the edit warning should be shown when editing a subtree node
 */
export function shouldShowSubtreeEditWarning(params: {
  hasShownEditWarning: boolean
  warningDismissed: boolean
}): boolean {
  const { hasShownEditWarning, warningDismissed } = params

  // Don't show if already shown before
  if (hasShownEditWarning) return false
  // Don't show if user dismissed it
  if (warningDismissed) return false

  return true
}

/**
 * Updates the editing state when a subtree node gains focus
 */
export function handleSubtreeNodeFocus(
  state: SubtreeEditingState,
  nodeId: string
): SubtreeEditingState {
  return {
    ...state,
    editingNodeId: nodeId,
    hasShownEditWarning: true, // Mark as shown when first edit happens
  }
}

/**
 * Updates the editing state when a subtree node loses focus
 */
export function handleSubtreeNodeBlur(
  state: SubtreeEditingState
): SubtreeEditingState {
  return {
    ...state,
    editingNodeId: null,
  }
}

/**
 * Dismisses the edit warning
 */
export function dismissSubtreeEditWarning(
  state: SubtreeEditingState
): SubtreeEditingState {
  return {
    ...state,
    warningDismissed: true,
  }
}

/**
 * Gets the editing indicator text for a subtree node
 */
export function getSubtreeEditingIndicator(params: {
  isEditing: boolean
  nodeId: string
  editingNodeId: string | null
}): 'editing' | 'none' {
  const { isEditing, nodeId, editingNodeId } = params

  if (isEditing && editingNodeId === nodeId) {
    return 'editing'
  }

  return 'none'
}

/**
 * Gets CSS classes for a subtree node based on editing state
 */
export function getSubtreeNodeEditingClasses(params: {
  isEditing: boolean
  isEditable: boolean
}): string[] {
  const classes: string[] = []

  if (params.isEditable) {
    classes.push('portal-subtree-editable')
  }

  if (params.isEditing) {
    classes.push('portal-subtree-editing')
  }

  return classes
}

/**
 * Gets the warning message for subtree editing
 */
export function getSubtreeEditWarningMessage(): string {
  return 'Changes will affect the source document. Other portals referencing this content will also update.'
}

/**
 * Gets the Y.Text for a subtree node from the document
 * Used to bind rich-text components to source block text
 */
export function getSubtreeNodeYText(
  doc: Doc,
  blockId: string
): Text | null {
  const block = doc.getBlock(blockId)
  if (!block) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = block.model as any
  if (!model.text) return null

  return model.text as Text
}

/**
 * Map to cache Y.Text references for subtree nodes
 * This avoids repeated lookups during rendering
 */
export type SubtreeYTextCache = Map<string, Text | null>

/**
 * Gets or creates cached Y.Text for a subtree node
 */
export function getCachedSubtreeNodeYText(
  cache: SubtreeYTextCache,
  doc: Doc,
  blockId: string
): Text | null {
  if (cache.has(blockId)) {
    return cache.get(blockId)!
  }

  const yText = getSubtreeNodeYText(doc, blockId)
  cache.set(blockId, yText)
  return yText
}

/**
 * Clears the Y.Text cache (e.g., when subtree changes)
 */
export function clearSubtreeYTextCache(cache: SubtreeYTextCache): void {
  cache.clear()
}
