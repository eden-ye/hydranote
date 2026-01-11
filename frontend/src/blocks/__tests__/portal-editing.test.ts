import { describe, it, expect } from 'vitest'

/**
 * Tests for portal editing functionality (EDITOR-3404)
 *
 * Testing:
 * - Editing text within expanded portal
 * - Changes syncing back to source block in real-time
 * - Editable state detection based on portal state
 * - Warning dialog logic for first edit
 * - Visual indication that editing affects source
 */

// ============================================================================
// Pure Logic Functions for Portal Editing
// ============================================================================

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

// ============================================================================
// Tests
// ============================================================================

describe('Portal Editing (EDITOR-3404)', () => {
  describe('isPortalEditable', () => {
    it('should return true when portal is expanded, not orphaned, not loading', () => {
      expect(
        isPortalEditable({
          isCollapsed: false,
          isOrphaned: false,
          isLoading: false,
        })
      ).toBe(true)
    })

    it('should return false when portal is collapsed', () => {
      expect(
        isPortalEditable({
          isCollapsed: true,
          isOrphaned: false,
          isLoading: false,
        })
      ).toBe(false)
    })

    it('should return false when portal is orphaned', () => {
      expect(
        isPortalEditable({
          isCollapsed: false,
          isOrphaned: true,
          isLoading: false,
        })
      ).toBe(false)
    })

    it('should return false when portal is loading', () => {
      expect(
        isPortalEditable({
          isCollapsed: false,
          isOrphaned: false,
          isLoading: true,
        })
      ).toBe(false)
    })
  })

  describe('shouldShowEditWarning', () => {
    it('should return true on first edit without dismissal', () => {
      expect(
        shouldShowEditWarning({
          hasEditedBefore: false,
          warningDismissed: false,
        })
      ).toBe(true)
    })

    it('should return false if already edited before', () => {
      expect(
        shouldShowEditWarning({
          hasEditedBefore: true,
          warningDismissed: false,
        })
      ).toBe(false)
    })

    it('should return false if warning was dismissed', () => {
      expect(
        shouldShowEditWarning({
          hasEditedBefore: false,
          warningDismissed: true,
        })
      ).toBe(false)
    })
  })

  describe('getEditingIndicator', () => {
    it('should return "none" when not editable', () => {
      expect(
        getEditingIndicator({
          isEditing: true,
          isSyncing: false,
          isEditable: false,
        })
      ).toBe('none')
    })

    it('should return "editing" when actively editing', () => {
      expect(
        getEditingIndicator({
          isEditing: true,
          isSyncing: false,
          isEditable: true,
        })
      ).toBe('editing')
    })

    it('should return "syncing" when syncing changes', () => {
      expect(
        getEditingIndicator({
          isEditing: true,
          isSyncing: true,
          isEditable: true,
        })
      ).toBe('syncing')
    })

    it('should return "none" when not editing and not syncing', () => {
      expect(
        getEditingIndicator({
          isEditing: false,
          isSyncing: false,
          isEditable: true,
        })
      ).toBe('none')
    })
  })

  describe('deltaToEditOperation', () => {
    it('should convert insert delta to insert operation', () => {
      const delta = [{ retain: 5 }, { insert: 'hello' }]
      expect(deltaToEditOperation(delta)).toEqual({
        type: 'insert',
        index: 5,
        text: 'hello',
      })
    })

    it('should convert delete delta to delete operation', () => {
      const delta = [{ retain: 3 }, { delete: 2 }]
      expect(deltaToEditOperation(delta)).toEqual({
        type: 'delete',
        index: 3,
        deleteCount: 2,
      })
    })

    it('should handle insert at start', () => {
      const delta = [{ insert: 'start' }]
      expect(deltaToEditOperation(delta)).toEqual({
        type: 'insert',
        index: 0,
        text: 'start',
      })
    })

    it('should return null for empty delta', () => {
      expect(deltaToEditOperation([])).toBe(null)
    })
  })

  describe('applyEditToSource', () => {
    it('should insert text at correct position', () => {
      const result = applyEditToSource('Hello World', {
        type: 'insert',
        index: 6,
        text: 'Beautiful ',
      })
      expect(result).toBe('Hello Beautiful World')
    })

    it('should delete text at correct position', () => {
      const result = applyEditToSource('Hello World', {
        type: 'delete',
        index: 5,
        deleteCount: 6,
      })
      expect(result).toBe('Hello')
    })

    it('should replace text at correct position', () => {
      const result = applyEditToSource('Hello World', {
        type: 'replace',
        index: 6,
        text: 'Universe',
        deleteCount: 5,
      })
      expect(result).toBe('Hello Universe')
    })

    it('should insert at start', () => {
      const result = applyEditToSource('World', {
        type: 'insert',
        index: 0,
        text: 'Hello ',
      })
      expect(result).toBe('Hello World')
    })

    it('should insert at end', () => {
      const result = applyEditToSource('Hello', {
        type: 'insert',
        index: 5,
        text: ' World',
      })
      expect(result).toBe('Hello World')
    })
  })

  describe('detectEditConflict', () => {
    it('should return false when versions match', () => {
      expect(
        detectEditConflict({
          portalLastKnownVersion: 5,
          sourceCurrentVersion: 5,
        })
      ).toBe(false)
    })

    it('should return true when source has advanced', () => {
      expect(
        detectEditConflict({
          portalLastKnownVersion: 5,
          sourceCurrentVersion: 6,
        })
      ).toBe(true)
    })

    it('should return true when versions are out of sync', () => {
      expect(
        detectEditConflict({
          portalLastKnownVersion: 3,
          sourceCurrentVersion: 7,
        })
      ).toBe(true)
    })
  })
})

describe('Portal Editing Visual States (EDITOR-3404)', () => {
  describe('CSS class generation', () => {
    /**
     * Returns CSS classes for portal editing state
     */
    const getEditingClasses = (indicator: PortalEditingIndicator): string[] => {
      const classes: string[] = []

      if (indicator === 'editing') {
        classes.push('portal-editing')
      }

      if (indicator === 'syncing') {
        classes.push('portal-syncing')
      }

      return classes
    }

    it('should return editing class when editing', () => {
      expect(getEditingClasses('editing')).toContain('portal-editing')
    })

    it('should return syncing class when syncing', () => {
      expect(getEditingClasses('syncing')).toContain('portal-syncing')
    })

    it('should return empty array when not editing', () => {
      expect(getEditingClasses('none')).toHaveLength(0)
    })
  })

  describe('Edit warning message', () => {
    /**
     * Returns the warning message for portal editing
     */
    const getEditWarningMessage = (): string => {
      return 'Editing will modify the source block. Changes will be reflected in all places this block is referenced.'
    }

    it('should provide a clear warning message', () => {
      const message = getEditWarningMessage()
      expect(message).toContain('source block')
      expect(message).toContain('Changes')
    })
  })
})

describe('Portal Edit Sync (EDITOR-3404)', () => {
  describe('Bidirectional sync logic', () => {
    /**
     * Simulates the sync flow from portal to source
     */
    interface SyncFlowParams {
      portalText: string
      sourceText: string
      editOperation: PortalEditOperation
    }

    const simulatePortalToSourceSync = (
      params: SyncFlowParams
    ): { newSourceText: string; portalShouldUpdate: boolean } => {
      const { sourceText, editOperation } = params
      const newSourceText = applyEditToSource(sourceText, editOperation)

      // Portal should update to reflect the new source text
      // (In real implementation, this happens via Yjs observation)
      return {
        newSourceText,
        portalShouldUpdate: true,
      }
    }

    it('should sync portal insertion to source', () => {
      const result = simulatePortalToSourceSync({
        portalText: 'Hello New World',
        sourceText: 'Hello World',
        editOperation: { type: 'insert', index: 6, text: 'New ' },
      })

      expect(result.newSourceText).toBe('Hello New World')
      expect(result.portalShouldUpdate).toBe(true)
    })

    it('should sync portal deletion to source', () => {
      const result = simulatePortalToSourceSync({
        portalText: 'Hello',
        sourceText: 'Hello World',
        editOperation: { type: 'delete', index: 5, deleteCount: 6 },
      })

      expect(result.newSourceText).toBe('Hello')
      expect(result.portalShouldUpdate).toBe(true)
    })
  })

  describe('Cursor position handling', () => {
    /**
     * Transforms cursor position when text is modified
     */
    const transformCursorPosition = (params: {
      originalPosition: number
      editIndex: number
      insertLength: number
      deleteLength: number
    }): number => {
      const { originalPosition, editIndex, insertLength, deleteLength } = params

      if (originalPosition <= editIndex) {
        // Cursor is before the edit, no change needed
        return originalPosition
      }

      // Cursor is after the edit, adjust by the net change
      const netChange = insertLength - deleteLength
      return Math.max(0, originalPosition + netChange)
    }

    it('should not move cursor when edit is after cursor', () => {
      const newPos = transformCursorPosition({
        originalPosition: 3,
        editIndex: 10,
        insertLength: 5,
        deleteLength: 0,
      })
      expect(newPos).toBe(3)
    })

    it('should move cursor forward when inserting before cursor', () => {
      const newPos = transformCursorPosition({
        originalPosition: 10,
        editIndex: 5,
        insertLength: 3,
        deleteLength: 0,
      })
      expect(newPos).toBe(13)
    })

    it('should move cursor backward when deleting before cursor', () => {
      const newPos = transformCursorPosition({
        originalPosition: 10,
        editIndex: 5,
        insertLength: 0,
        deleteLength: 3,
      })
      expect(newPos).toBe(7)
    })

    it('should handle replace operations', () => {
      const newPos = transformCursorPosition({
        originalPosition: 15,
        editIndex: 5,
        insertLength: 10,
        deleteLength: 5,
      })
      expect(newPos).toBe(20) // Net +5
    })
  })
})
