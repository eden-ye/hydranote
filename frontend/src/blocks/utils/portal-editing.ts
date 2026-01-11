/**
 * Portal editing utilities (EDITOR-3404)
 *
 * Enables bidirectional editing within portal blocks:
 * - User can edit text within expanded portal
 * - Edits sync back to source block in real-time
 * - Cursor and selection work within portal
 * - Handle concurrent edits via Yjs CRDT
 * - Visual indication that editing affects source
 */

/**
 * Determines if a portal should be editable based on its current state.
 * Portals are only editable when:
 * - They are expanded (not collapsed)
 * - They are not orphaned (source block exists)
 * - They are not in a loading state
 */
export function isPortalEditable(params: {
  isCollapsed: boolean
  isOrphaned: boolean
  isLoading: boolean
}): boolean {
  const { isCollapsed, isOrphaned, isLoading } = params

  if (isCollapsed) return false
  if (isOrphaned) return false
  if (isLoading) return false

  return true
}

/**
 * Determines if a warning should be shown before editing.
 * Warning is shown only on the first edit (hasEditedBefore = false)
 * and can be dismissed permanently.
 */
export function shouldShowEditWarning(params: {
  hasEditedBefore: boolean
  warningDismissed: boolean
}): boolean {
  const { hasEditedBefore, warningDismissed } = params

  if (hasEditedBefore) return false
  if (warningDismissed) return false

  return true
}

/**
 * Types of visual indicators for portal editing state
 */
export type PortalEditingIndicator =
  | 'none'        // Not editing
  | 'editing'     // Currently being edited (glow effect)
  | 'syncing'     // Changes being synced to source

/**
 * Determines the visual indicator to show based on editing state.
 */
export function getEditingIndicator(params: {
  isEditing: boolean
  isSyncing: boolean
  isEditable: boolean
}): PortalEditingIndicator {
  const { isEditing, isSyncing, isEditable } = params

  if (!isEditable) return 'none'
  if (isSyncing) return 'syncing'
  if (isEditing) return 'editing'

  return 'none'
}

/**
 * Returns CSS classes for portal editing state
 */
export function getEditingClasses(indicator: PortalEditingIndicator): string[] {
  const classes: string[] = []

  if (indicator === 'editing') {
    classes.push('portal-editing')
  }

  if (indicator === 'syncing') {
    classes.push('portal-syncing')
  }

  return classes
}

/**
 * Returns the warning message for portal editing
 */
export function getEditWarningMessage(): string {
  return 'Editing will modify the source block. Changes will be reflected in all places this block is referenced.'
}

/**
 * Represents a text edit operation to sync from portal to source
 */
export interface PortalEditOperation {
  type: 'insert' | 'delete' | 'replace'
  index: number
  text?: string        // For insert/replace
  deleteCount?: number // For delete/replace
}

/**
 * Converts a delta (Yjs change) to an edit operation.
 * This is used to transform portal edits into source block edits.
 */
export function deltaToEditOperation(delta: {
  retain?: number
  insert?: string
  delete?: number
}[]): PortalEditOperation | null {
  let index = 0

  for (const op of delta) {
    if (op.retain) {
      index += op.retain
    } else if (op.insert && typeof op.insert === 'string') {
      return {
        type: 'insert',
        index,
        text: op.insert,
      }
    } else if (op.delete) {
      return {
        type: 'delete',
        index,
        deleteCount: op.delete,
      }
    }
  }

  return null
}

/**
 * Applies a portal edit operation to the source block's text.
 * Returns the new text content.
 */
export function applyEditToSource(
  sourceText: string,
  operation: PortalEditOperation
): string {
  const { type, index, text, deleteCount } = operation

  switch (type) {
    case 'insert':
      return sourceText.slice(0, index) + (text ?? '') + sourceText.slice(index)

    case 'delete':
      return sourceText.slice(0, index) + sourceText.slice(index + (deleteCount ?? 0))

    case 'replace':
      return (
        sourceText.slice(0, index) +
        (text ?? '') +
        sourceText.slice(index + (deleteCount ?? 0))
      )
  }
}

/**
 * Handles concurrent edit conflict detection.
 * Returns true if there's a conflict that needs resolution.
 */
export function detectEditConflict(params: {
  portalLastKnownVersion: number
  sourceCurrentVersion: number
}): boolean {
  const { portalLastKnownVersion, sourceCurrentVersion } = params
  return portalLastKnownVersion !== sourceCurrentVersion
}

/**
 * Transforms cursor position when text is modified.
 * Keeps cursor at correct position after edits.
 */
export function transformCursorPosition(params: {
  originalPosition: number
  editIndex: number
  insertLength: number
  deleteLength: number
}): number {
  const { originalPosition, editIndex, insertLength, deleteLength } = params

  if (originalPosition <= editIndex) {
    // Cursor is before the edit, no change needed
    return originalPosition
  }

  // Cursor is after the edit, adjust by the net change
  const netChange = insertLength - deleteLength
  return Math.max(0, originalPosition + netChange)
}
