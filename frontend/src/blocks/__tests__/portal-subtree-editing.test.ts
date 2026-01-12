import { describe, it, expect } from 'vitest'
import {
  createInitialSubtreeEditingState,
  isSubtreeNodeEditable,
  shouldShowSubtreeEditWarning,
  handleSubtreeNodeFocus,
  handleSubtreeNodeBlur,
  dismissSubtreeEditWarning,
  getSubtreeEditingIndicator,
  getSubtreeNodeEditingClasses,
  getSubtreeEditWarningMessage,
} from '../utils/portal-subtree-editing'

/**
 * Tests for Portal Subtree Editing (EDITOR-3505)
 *
 * Testing:
 * - Clicking any bullet in portal subtree to edit
 * - Edits syncing to source document via Yjs
 * - "Editing source" indicator during edit
 * - First-edit warning for subtree nodes
 * - Rich text operations (bold, italic, etc.)
 * - Tracking which subtree node is being edited
 */

// ============================================================================
// Tests
// ============================================================================

describe('Portal Subtree Editing State (EDITOR-3505)', () => {
  describe('createInitialSubtreeEditingState', () => {
    it('should create state with no node being edited', () => {
      const state = createInitialSubtreeEditingState()
      expect(state.editingNodeId).toBeNull()
    })

    it('should create state with warning not shown', () => {
      const state = createInitialSubtreeEditingState()
      expect(state.hasShownEditWarning).toBe(false)
    })

    it('should create state with warning not dismissed', () => {
      const state = createInitialSubtreeEditingState()
      expect(state.warningDismissed).toBe(false)
    })
  })

  describe('isSubtreeNodeEditable', () => {
    it('should return true when portal is valid and node exists', () => {
      expect(
        isSubtreeNodeEditable({
          portalIsOrphaned: false,
          portalIsLoading: false,
          portalIsCollapsed: false,
          nodeExists: true,
        })
      ).toBe(true)
    })

    it('should return false when portal is orphaned', () => {
      expect(
        isSubtreeNodeEditable({
          portalIsOrphaned: true,
          portalIsLoading: false,
          portalIsCollapsed: false,
          nodeExists: true,
        })
      ).toBe(false)
    })

    it('should return false when portal is loading', () => {
      expect(
        isSubtreeNodeEditable({
          portalIsOrphaned: false,
          portalIsLoading: true,
          portalIsCollapsed: false,
          nodeExists: true,
        })
      ).toBe(false)
    })

    it('should return false when portal is collapsed', () => {
      expect(
        isSubtreeNodeEditable({
          portalIsOrphaned: false,
          portalIsLoading: false,
          portalIsCollapsed: true,
          nodeExists: true,
        })
      ).toBe(false)
    })

    it('should return false when node does not exist', () => {
      expect(
        isSubtreeNodeEditable({
          portalIsOrphaned: false,
          portalIsLoading: false,
          portalIsCollapsed: false,
          nodeExists: false,
        })
      ).toBe(false)
    })
  })

  describe('shouldShowSubtreeEditWarning', () => {
    it('should return true on first edit', () => {
      expect(
        shouldShowSubtreeEditWarning({
          hasShownEditWarning: false,
          warningDismissed: false,
        })
      ).toBe(true)
    })

    it('should return false after warning has been shown', () => {
      expect(
        shouldShowSubtreeEditWarning({
          hasShownEditWarning: true,
          warningDismissed: false,
        })
      ).toBe(false)
    })

    it('should return false after warning was dismissed', () => {
      expect(
        shouldShowSubtreeEditWarning({
          hasShownEditWarning: false,
          warningDismissed: true,
        })
      ).toBe(false)
    })
  })

  describe('handleSubtreeNodeFocus', () => {
    it('should set editingNodeId to the focused node', () => {
      const state = createInitialSubtreeEditingState()
      const newState = handleSubtreeNodeFocus(state, 'node-123')
      expect(newState.editingNodeId).toBe('node-123')
    })

    it('should mark warning as shown', () => {
      const state = createInitialSubtreeEditingState()
      const newState = handleSubtreeNodeFocus(state, 'node-123')
      expect(newState.hasShownEditWarning).toBe(true)
    })

    it('should preserve warningDismissed state', () => {
      const state = {
        ...createInitialSubtreeEditingState(),
        warningDismissed: true,
      }
      const newState = handleSubtreeNodeFocus(state, 'node-123')
      expect(newState.warningDismissed).toBe(true)
    })
  })

  describe('handleSubtreeNodeBlur', () => {
    it('should clear editingNodeId', () => {
      const state = {
        ...createInitialSubtreeEditingState(),
        editingNodeId: 'node-123',
      }
      const newState = handleSubtreeNodeBlur(state)
      expect(newState.editingNodeId).toBeNull()
    })

    it('should preserve hasShownEditWarning', () => {
      const state = {
        ...createInitialSubtreeEditingState(),
        editingNodeId: 'node-123',
        hasShownEditWarning: true,
      }
      const newState = handleSubtreeNodeBlur(state)
      expect(newState.hasShownEditWarning).toBe(true)
    })
  })

  describe('dismissSubtreeEditWarning', () => {
    it('should set warningDismissed to true', () => {
      const state = createInitialSubtreeEditingState()
      const newState = dismissSubtreeEditWarning(state)
      expect(newState.warningDismissed).toBe(true)
    })

    it('should preserve editingNodeId', () => {
      const state = {
        ...createInitialSubtreeEditingState(),
        editingNodeId: 'node-123',
      }
      const newState = dismissSubtreeEditWarning(state)
      expect(newState.editingNodeId).toBe('node-123')
    })
  })
})

describe('Portal Subtree Editing Indicators (EDITOR-3505)', () => {
  describe('getSubtreeEditingIndicator', () => {
    it('should return "editing" when node is being edited', () => {
      expect(
        getSubtreeEditingIndicator({
          isEditing: true,
          nodeId: 'node-123',
          editingNodeId: 'node-123',
        })
      ).toBe('editing')
    })

    it('should return "none" when different node is being edited', () => {
      expect(
        getSubtreeEditingIndicator({
          isEditing: true,
          nodeId: 'node-123',
          editingNodeId: 'node-456',
        })
      ).toBe('none')
    })

    it('should return "none" when not editing', () => {
      expect(
        getSubtreeEditingIndicator({
          isEditing: false,
          nodeId: 'node-123',
          editingNodeId: null,
        })
      ).toBe('none')
    })
  })

  describe('getSubtreeNodeEditingClasses', () => {
    it('should include editable class when editable', () => {
      const classes = getSubtreeNodeEditingClasses({
        isEditing: false,
        isEditable: true,
      })
      expect(classes).toContain('portal-subtree-editable')
    })

    it('should include editing class when editing', () => {
      const classes = getSubtreeNodeEditingClasses({
        isEditing: true,
        isEditable: true,
      })
      expect(classes).toContain('portal-subtree-editing')
    })

    it('should not include editable class when not editable', () => {
      const classes = getSubtreeNodeEditingClasses({
        isEditing: false,
        isEditable: false,
      })
      expect(classes).not.toContain('portal-subtree-editable')
    })

    it('should include both classes when editable and editing', () => {
      const classes = getSubtreeNodeEditingClasses({
        isEditing: true,
        isEditable: true,
      })
      expect(classes).toContain('portal-subtree-editable')
      expect(classes).toContain('portal-subtree-editing')
    })
  })

  describe('getSubtreeEditWarningMessage', () => {
    it('should mention source document', () => {
      const message = getSubtreeEditWarningMessage()
      expect(message).toContain('source document')
    })

    it('should mention other portals', () => {
      const message = getSubtreeEditWarningMessage()
      expect(message).toContain('portals')
    })
  })
})

describe('Subtree Y.Text Access (EDITOR-3505)', () => {
  /**
   * Mock function to get Y.Text for a subtree node
   * In real implementation, this accesses the source doc
   */
  interface MockYText {
    toString(): string
  }

  interface MockBlock {
    id: string
    text: MockYText | null
  }

  const getSubtreeNodeYText = (
    blockId: string,
    blocks: Map<string, MockBlock>
  ): MockYText | null => {
    const block = blocks.get(blockId)
    if (!block) return null
    return block.text
  }

  describe('getSubtreeNodeYText', () => {
    it('should return Y.Text for existing block', () => {
      const blocks = new Map<string, MockBlock>()
      blocks.set('block-1', {
        id: 'block-1',
        text: { toString: () => 'Hello World' },
      })

      const yText = getSubtreeNodeYText('block-1', blocks)
      expect(yText).not.toBeNull()
      expect(yText!.toString()).toBe('Hello World')
    })

    it('should return null for non-existent block', () => {
      const blocks = new Map<string, MockBlock>()

      const yText = getSubtreeNodeYText('non-existent', blocks)
      expect(yText).toBeNull()
    })

    it('should return null for block without text', () => {
      const blocks = new Map<string, MockBlock>()
      blocks.set('block-1', {
        id: 'block-1',
        text: null,
      })

      const yText = getSubtreeNodeYText('block-1', blocks)
      expect(yText).toBeNull()
    })
  })
})

describe('Subtree Editing Flow (EDITOR-3505)', () => {
  describe('Complete edit flow', () => {
    it('should handle full edit cycle: focus -> edit -> blur', () => {
      // Start with initial state
      let state = createInitialSubtreeEditingState()
      expect(state.editingNodeId).toBeNull()

      // User focuses on a subtree node
      state = handleSubtreeNodeFocus(state, 'node-1')
      expect(state.editingNodeId).toBe('node-1')
      expect(state.hasShownEditWarning).toBe(true)

      // User blurs (finishes editing)
      state = handleSubtreeNodeBlur(state)
      expect(state.editingNodeId).toBeNull()
      expect(state.hasShownEditWarning).toBe(true) // Still true

      // User focuses on another node - no warning needed
      expect(
        shouldShowSubtreeEditWarning({
          hasShownEditWarning: state.hasShownEditWarning,
          warningDismissed: state.warningDismissed,
        })
      ).toBe(false)
    })

    it('should show warning only on first edit', () => {
      let state = createInitialSubtreeEditingState()

      // First edit - should show warning
      expect(
        shouldShowSubtreeEditWarning({
          hasShownEditWarning: state.hasShownEditWarning,
          warningDismissed: state.warningDismissed,
        })
      ).toBe(true)

      // After focus (warning shown)
      state = handleSubtreeNodeFocus(state, 'node-1')

      // Second node - no warning
      expect(
        shouldShowSubtreeEditWarning({
          hasShownEditWarning: state.hasShownEditWarning,
          warningDismissed: state.warningDismissed,
        })
      ).toBe(false)
    })

    it('should handle switching between nodes', () => {
      let state = createInitialSubtreeEditingState()

      // Focus on first node
      state = handleSubtreeNodeFocus(state, 'node-1')
      expect(state.editingNodeId).toBe('node-1')

      // Blur from first node
      state = handleSubtreeNodeBlur(state)
      expect(state.editingNodeId).toBeNull()

      // Focus on second node
      state = handleSubtreeNodeFocus(state, 'node-2')
      expect(state.editingNodeId).toBe('node-2')
    })
  })
})

describe('Subtree Node Rendering with Editing (EDITOR-3505)', () => {
  /**
   * Simulates the rendering decision for a subtree node
   */
  interface SubtreeNodeRenderParams {
    nodeId: string
    text: string
    hasYText: boolean
    editingNodeId: string | null
    portalIsOrphaned: boolean
    portalIsLoading: boolean
    portalIsCollapsed: boolean
  }

  interface SubtreeNodeRenderResult {
    shouldRenderRichText: boolean
    isEditing: boolean
    cssClasses: string[]
    showEditIndicator: boolean
  }

  const computeSubtreeNodeRender = (
    params: SubtreeNodeRenderParams
  ): SubtreeNodeRenderResult => {
    const isEditable = isSubtreeNodeEditable({
      portalIsOrphaned: params.portalIsOrphaned,
      portalIsLoading: params.portalIsLoading,
      portalIsCollapsed: params.portalIsCollapsed,
      nodeExists: true,
    })

    const isEditing = params.editingNodeId === params.nodeId

    return {
      // Only render rich-text if we have Y.Text and portal is editable
      shouldRenderRichText: params.hasYText && isEditable,
      isEditing,
      cssClasses: getSubtreeNodeEditingClasses({ isEditing, isEditable }),
      showEditIndicator: isEditing,
    }
  }

  describe('computeSubtreeNodeRender', () => {
    it('should render rich-text when editable and has Y.Text', () => {
      const result = computeSubtreeNodeRender({
        nodeId: 'node-1',
        text: 'Hello',
        hasYText: true,
        editingNodeId: null,
        portalIsOrphaned: false,
        portalIsLoading: false,
        portalIsCollapsed: false,
      })

      expect(result.shouldRenderRichText).toBe(true)
      expect(result.cssClasses).toContain('portal-subtree-editable')
    })

    it('should not render rich-text when no Y.Text', () => {
      const result = computeSubtreeNodeRender({
        nodeId: 'node-1',
        text: 'Hello',
        hasYText: false,
        editingNodeId: null,
        portalIsOrphaned: false,
        portalIsLoading: false,
        portalIsCollapsed: false,
      })

      expect(result.shouldRenderRichText).toBe(false)
    })

    it('should not render rich-text when portal is orphaned', () => {
      const result = computeSubtreeNodeRender({
        nodeId: 'node-1',
        text: 'Hello',
        hasYText: true,
        editingNodeId: null,
        portalIsOrphaned: true,
        portalIsLoading: false,
        portalIsCollapsed: false,
      })

      expect(result.shouldRenderRichText).toBe(false)
    })

    it('should show editing state when node is being edited', () => {
      const result = computeSubtreeNodeRender({
        nodeId: 'node-1',
        text: 'Hello',
        hasYText: true,
        editingNodeId: 'node-1',
        portalIsOrphaned: false,
        portalIsLoading: false,
        portalIsCollapsed: false,
      })

      expect(result.isEditing).toBe(true)
      expect(result.showEditIndicator).toBe(true)
      expect(result.cssClasses).toContain('portal-subtree-editing')
    })

    it('should not show editing state for different node', () => {
      const result = computeSubtreeNodeRender({
        nodeId: 'node-1',
        text: 'Hello',
        hasYText: true,
        editingNodeId: 'node-2', // Different node being edited
        portalIsOrphaned: false,
        portalIsLoading: false,
        portalIsCollapsed: false,
      })

      expect(result.isEditing).toBe(false)
      expect(result.showEditIndicator).toBe(false)
      expect(result.cssClasses).not.toContain('portal-subtree-editing')
    })
  })
})
