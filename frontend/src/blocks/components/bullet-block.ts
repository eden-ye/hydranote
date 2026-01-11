import { BlockComponent } from '@blocksuite/block-std'
import type { BulletBlockModel } from '../schemas/bullet-block-schema'
import { html, css, nothing, type TemplateResult } from 'lit'
import { customElement } from 'lit/decorators.js'
// EDITOR-3053: Import rich-text component and focus utilities
// Note: rich-text effects are registered in Editor.tsx via registerBlocksEffects()
import {
  type RichText,
  focusTextModel,
  asyncSetInlineRange,
  getInlineEditorByModel,
} from '@blocksuite/affine-components/rich-text'
// EDITOR-3102: Import color palette for highlight shortcuts
// EDITOR-3103: Also import COLOR_PALETTE for context menu
import { type ColorId, getColorById, COLOR_PALETTE } from '../utils/color-palette'
// EDITOR-3102: Import zod and baseTextAttributes for schema extension
import { z } from 'zod'
import { baseTextAttributes } from '@blocksuite/inline'
// EDITOR-3201: Import descriptor utilities
import { getDescriptorLabel, getDescriptorPrefix } from '../utils/descriptor'
// EDITOR-3301: Import cheatsheet utilities
import { computeCheatsheet, type DescriptorChild } from '../utils/cheatsheet'

/**
 * EDITOR-3102: Extended text attributes schema with background and color
 * Required because baseTextAttributes only includes: bold, italic, underline, strike, code, link
 * This adds support for text highlighting with background color and contrast text color
 */
const hydraTextAttributesSchema = baseTextAttributes.extend({
  background: z.string().optional().nullable().catch(undefined),
  color: z.string().optional().nullable().catch(undefined),
})

// EDITOR-3102: Debug log to verify schema creation
console.log('[EDITOR-3102] Schema created:', hydraTextAttributesSchema ? 'yes' : 'no')
console.log('[EDITOR-3102] Schema shape keys:', hydraTextAttributesSchema?.shape ? Object.keys(hydraTextAttributesSchema.shape) : 'no shape')

// Re-export for type checking
export type { RichText }

/**
 * Bullet block component for Hydra Notes.
 *
 * Renders a hierarchical bullet point with:
 * - Expand/collapse toggle for folding
 * - Editable text content
 * - Nested child bullets
 * - Inline preview when collapsed (EDITOR-304)
 *
 * ## Keyboard Shortcuts (EDITOR-306, EDITOR-3062)
 *
 * ### Navigation
 * - Arrow Up: Move to previous sibling or parent
 * - Arrow Down: Move to next sibling or first child (if expanded)
 * - Arrow Left/Right: Standard text cursor movement (browser default)
 *
 * ### Structure Manipulation
 * - Tab: Indent (make child of previous sibling)
 * - Shift+Tab: Outdent (make sibling of parent)
 * - Enter: Create new sibling bullet below
 *
 * ### Folding
 * - Cmd/Ctrl+Enter: Toggle expand/collapse
 * - Bullet click: Toggle expand/collapse
 */

/**
 * Maximum length for inline preview text before truncation
 */
export const PREVIEW_MAX_LENGTH = 50

/**
 * Separator between child texts in the preview
 */
export const PREVIEW_SEPARATOR = ' · '

/**
 * Compute inline preview from child blocks' text content.
 * Concatenates child texts with separator, skipping empty content.
 */
export function computeInlinePreview(
  children: Array<{ text: string }>
): string {
  return children
    .map((child) => child.text.trim())
    .filter((text) => text.length > 0)
    .join(PREVIEW_SEPARATOR)
}

/**
 * Truncate preview text if it exceeds max length.
 * Adds ellipsis when truncated.
 */
export function truncatePreview(text: string): string {
  if (text.length <= PREVIEW_MAX_LENGTH) {
    return text
  }
  return text.slice(0, PREVIEW_MAX_LENGTH) + '…'
}

/**
 * Check if keyboard event is the fold toggle shortcut (Cmd+. / Ctrl+.)
 */
export function shouldHandleFoldShortcut(event: {
  key: string
  metaKey: boolean
  ctrlKey: boolean
}): boolean {
  const isCorrectKey = event.key === '.'
  const hasModifier = event.metaKey || event.ctrlKey
  return isCorrectKey && hasModifier
}

// ============================================================================
// EDITOR-3057: Undo/Redo Support - Pure Logic Functions
// ============================================================================

/**
 * Check if keyboard event is the undo shortcut (Cmd+Z / Ctrl+Z)
 * Note: Cmd+Shift+Z is redo, not undo
 */
export function shouldHandleUndoShortcut(event: {
  key: string
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
}): boolean {
  const isCorrectKey = event.key === 'z' || event.key === 'Z'
  const hasModifier = event.metaKey || event.ctrlKey
  const noShift = !event.shiftKey
  return isCorrectKey && hasModifier && noShift
}

/**
 * Check if keyboard event is the redo shortcut (Cmd+Shift+Z / Ctrl+Shift+Z)
 */
export function shouldHandleRedoShortcut(event: {
  key: string
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
}): boolean {
  const isCorrectKey = event.key === 'z' || event.key === 'Z'
  const hasModifier = event.metaKey || event.ctrlKey
  const hasShift = event.shiftKey
  return isCorrectKey && hasModifier && hasShift
}

/**
 * Returns whether undo/redo is enabled for the rich-text component.
 * EDITOR-3057: Changed from false to true to enable undo/redo for inline formatting.
 */
export function isUndoRedoEnabled(): boolean {
  return true
}

// ============================================================================
// EDITOR-306: Keyboard Shortcuts - Pure Logic Functions
// ============================================================================

/**
 * Documented keyboard shortcuts for the bullet block component.
 * Can be used to display help/documentation to users.
 * EDITOR-3062: ArrowLeft/ArrowRight removed - use browser default text navigation
 */
export const KEYBOARD_SHORTCUTS = {
  navigation: [
    { key: 'Arrow Up', description: 'Move to previous sibling or parent (preserves column)' },
    { key: 'Arrow Down', description: 'Move to next sibling or first child (preserves column)' },
    { key: 'Arrow Left', description: 'Move cursor left; at start jumps to end of previous bullet' },
    { key: 'Arrow Right', description: 'Move cursor right; at end jumps to start of next bullet' },
  ],
  structure: [
    { key: 'Tab', description: 'Indent (make child of previous sibling)' },
    { key: 'Shift+Tab', description: 'Outdent (make sibling of parent)' },
    { key: 'Enter', description: 'Create new sibling bullet below' },
  ],
  folding: [
    { key: 'Cmd/Ctrl+Enter', description: 'Toggle expand/collapse' },
  ],
} as const

/**
 * Compute the indent level (depth) of a block
 */
export function computeIndentLevel(depth: number): number {
  return depth
}

/**
 * Check if a block can be indented (moved to become child of previous sibling)
 * Can only indent if there's a previous sibling to become parent
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function canIndent(hasPreviousSibling: boolean, _depth: number): boolean {
  return hasPreviousSibling
}

/**
 * Check if a block can be outdented (moved to become sibling of parent)
 * Can only outdent if not at root level (depth > 0)
 */
export function canOutdent(depth: number): boolean {
  return depth > 0
}

/**
 * Input for computing backspace merge strategy
 * EDITOR-3063: Added to handle children reparenting
 */
export interface BackspaceMergeInput {
  hasChildren: boolean
  childrenIds: string[]
  hasPreviousSibling: boolean
  previousSiblingId: string | null
  parentId: string | null
  grandparentId?: string | null
}

/**
 * Output strategy for backspace merge operation
 * EDITOR-3063: Determines if and how children should be reparented
 */
export interface BackspaceMergeStrategy {
  shouldReparentChildren: boolean
  childrenToReparent: string[]
  newParentId: string | null
}

/**
 * Compute the strategy for handling backspace at the start of a bullet.
 * EDITOR-3063: When a bullet with children is deleted, its children should
 * be unindented (promoted to the parent's level), not deleted.
 *
 * @param input - The current block context
 * @returns Strategy describing how to handle children during merge
 */
export function computeBackspaceMergeStrategy(input: BackspaceMergeInput): BackspaceMergeStrategy {
  // If no children, no reparenting needed
  if (!input.hasChildren || input.childrenIds.length === 0) {
    return {
      shouldReparentChildren: false,
      childrenToReparent: [],
      newParentId: null,
    }
  }

  // Case 1: Has previous sibling - children become siblings of current block
  // (they stay at the same level, under the same parent)
  if (input.hasPreviousSibling && input.parentId) {
    return {
      shouldReparentChildren: true,
      childrenToReparent: input.childrenIds,
      newParentId: input.parentId,
    }
  }

  // Case 2: First child (no previous sibling) - merging with parent
  // Children should become siblings of the parent (move to grandparent)
  if (!input.hasPreviousSibling && input.parentId && input.grandparentId) {
    return {
      shouldReparentChildren: true,
      childrenToReparent: input.childrenIds,
      newParentId: input.grandparentId,
    }
  }

  // Case 3: Root level with no previous sibling - backspace does nothing
  // No reparenting needed since the block itself won't be deleted
  return {
    shouldReparentChildren: false,
    childrenToReparent: [],
    newParentId: null,
  }
}

/**
 * Context for block navigation
 */
export interface BlockNavigationContext {
  currentBlockId: string
  previousSiblingId: string | null
  nextSiblingId: string | null
  parentId: string | null
  firstChildId: string | null
  isExpanded: boolean
  hasChildren: boolean
}

/**
 * Special navigation targets for expand/collapse actions
 */
export const NAVIGATION_COLLAPSE = '__COLLAPSE__'
export const NAVIGATION_EXPAND = '__EXPAND__'

/**
 * Get the navigation target based on arrow key direction and block context
 * Returns block ID to navigate to, or null if no navigation possible
 * EDITOR-3062: Only handles ArrowUp/Down - ArrowLeft/Right use browser default
 */
export function getNavigationTarget(
  direction: 'ArrowUp' | 'ArrowDown',
  ctx: BlockNavigationContext
): string | null {
  switch (direction) {
    case 'ArrowUp':
      // Navigate to previous sibling, or parent if no sibling
      return ctx.previousSiblingId ?? ctx.parentId

    case 'ArrowDown':
      // If expanded with children, go to first child
      if (ctx.hasChildren && ctx.isExpanded && ctx.firstChildId) {
        return ctx.firstChildId
      }
      // Otherwise go to next sibling
      return ctx.nextSiblingId
  }
}

@customElement('hydra-bullet-block')
export class HydraBulletBlock extends BlockComponent<BulletBlockModel> {
  /**
   * Static variable to track which block should auto-focus when it renders.
   * Set by _createSibling/_createChild, checked by firstUpdated.
   */
  static _pendingFocusBlockId: string | null = null

  /**
   * EDITOR-3103: Context menu state for color picker
   */
  private _contextMenuVisible = false
  private _contextMenuX = 0
  private _contextMenuY = 0

  static override styles = css`
    :host {
      display: block;
      position: relative;
    }

    .bullet-container {
      display: flex;
      align-items: flex-start;
      gap: 4px;
      min-height: 24px;
      padding: 2px 0;
    }

    .bullet-toggle {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--affine-icon-color, #888);
      border-radius: 4px;
      flex-shrink: 0;
      user-select: none;
      font-size: 12px;
      transition: background-color 0.15s ease;
    }

    .bullet-toggle:hover {
      background-color: var(--affine-hover-color, #f0f0f0);
    }

    .bullet-toggle.has-children {
      cursor: pointer;
    }

    .bullet-toggle.no-children {
      cursor: default;
    }

    /* FE-408: Expand button styles */
    .bullet-expand {
      width: 20px;
      height: 20px;
      display: none;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--affine-icon-color, #888);
      border-radius: 4px;
      flex-shrink: 0;
      user-select: none;
      font-size: 12px;
      transition: background-color 0.15s ease, color 0.15s ease;
      margin-left: 4px;
    }

    .bullet-container:hover .bullet-expand {
      display: flex;
    }

    .bullet-expand:hover {
      background-color: var(--affine-hover-color, #f0f0f0);
      color: var(--affine-primary-color, #1976d2);
    }

    .bullet-expand.expanding {
      color: var(--affine-primary-color, #1976d2);
      animation: pulse 1s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .bullet-icon {
      width: 6px;
      height: 6px;
      background-color: currentColor;
      border-radius: 50%;
    }

    /* EDITOR-3053: Styles for rich-text component */
    rich-text {
      flex: 1;
      min-width: 0;
      outline: none;
      display: block;
    }

    /* EDITOR-3056: Inline formatting styles */
    /* Bold - Cmd+B */
    rich-text [data-v-bold="true"] {
      font-weight: bold;
    }

    /* Italic - Cmd+I */
    rich-text [data-v-italic="true"] {
      font-style: italic;
    }

    /* Underline - Cmd+U */
    rich-text [data-v-underline="true"] {
      text-decoration: underline;
    }

    /* Strikethrough */
    rich-text [data-v-strike="true"] {
      text-decoration: line-through;
    }

    /* Code formatting */
    rich-text [data-v-code="true"] {
      font-family: 'SF Mono', Monaco, Menlo, Consolas, 'Liberation Mono', monospace;
      background: var(--affine-code-background, rgba(135, 131, 120, 0.15));
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-size: 0.9em;
    }

    /* Link formatting */
    rich-text [data-v-link] {
      color: var(--affine-link-color, #0066cc);
      text-decoration: underline;
      cursor: pointer;
    }

    rich-text [data-v-link]:hover {
      text-decoration: underline;
      opacity: 0.8;
    }

    /* EDITOR-3101/3102: Background highlight colors
     * Note: Colors are now applied via inline styles (background-color, color)
     * using the background and color attributes with hex values.
     * This follows the Affine/BlockSuite pattern for text formatting.
     * CSS rules for data-v-highlight removed - inline styles handle it.
     */

    /* Placeholder styling - rich-text handles this internally */
    rich-text .inline-editor.empty::before {
      content: 'Type here...';
      color: var(--affine-placeholder-color, #999);
      position: absolute;
      pointer-events: none;
    }

    /* Legacy contenteditable styles (kept for fallback) */
    .bullet-content {
      flex: 1;
      min-width: 0;
      outline: none;
    }

    .bullet-content:empty::before {
      content: attr(data-placeholder);
      color: var(--affine-placeholder-color, #999);
    }

    .bullet-children {
      margin-left: 24px;
    }

    .bullet-children.collapsed {
      display: none;
    }

    /* EDITOR-3201: Descriptor block styles */
    .descriptor-prefix {
      color: var(--affine-text-secondary-color, #6B7280);
      font-weight: 600;
      font-size: 0.95em;
      user-select: none;
      flex-shrink: 0;
      margin-right: 4px;
    }

    .descriptor-label {
      color: var(--affine-text-secondary-color, #6B7280);
      font-weight: 500;
      font-size: 0.95em;
      user-select: none;
      flex-shrink: 0;
      margin-right: 8px;
    }

    .bullet-container.descriptor-block .bullet-toggle {
      color: var(--affine-text-secondary-color, #6B7280);
    }

    .inline-preview {
      color: var(--affine-text-secondary-color, #666);
      font-size: 0.9em;
      margin-left: 8px;
      opacity: 0.7;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 50%;
    }

    /* EDITOR-3103: Context menu color picker styles */
    .color-context-menu {
      position: fixed;
      z-index: 1000;
      background: white;
      border: 1px solid var(--affine-border-color, #e0e0e0);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 160px;
    }

    .color-menu-label {
      font-size: 11px;
      color: var(--affine-text-secondary-color, #666);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 8px;
      margin-bottom: 4px;
    }

    .color-swatches {
      display: flex;
      gap: 6px;
      padding: 4px 8px;
    }

    .color-swatch {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      cursor: pointer;
      border: 2px solid transparent;
      transition: transform 0.1s ease, border-color 0.1s ease;
    }

    .color-swatch:hover {
      transform: scale(1.15);
      border-color: var(--affine-primary-color, #1976d2);
    }

    .color-menu-divider {
      height: 1px;
      background: var(--affine-border-color, #e0e0e0);
      margin: 4px 0;
    }

    .color-menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      color: var(--affine-text-primary-color, #333);
      transition: background-color 0.15s ease;
    }

    .color-menu-item:hover {
      background: var(--affine-hover-color, #f5f5f5);
    }

    .color-menu-item svg {
      width: 16px;
      height: 16px;
      color: var(--affine-icon-color, #888);
    }
  `

  /**
   * Check if this block has children.
   * Computed dynamically in render to stay in sync.
   */
  private get _hasChildren(): boolean {
    return this.model.children.length > 0
  }

  override connectedCallback(): void {
    super.connectedCallback()
    // Defer binding keyboard shortcuts until std is available
    // This is needed because this.std may not be ready in connectedCallback
    requestAnimationFrame(() => {
      if (this.std) {
        this._bindKeyboardShortcuts()
      }
    })
  }

  override firstUpdated(): void {
    // EDITOR-3053: With rich-text, we no longer need manual text sync
    // rich-text handles Yjs binding internally via the .yText property

    // Get rich-text element for keydown handling
    const richText = this.querySelector('rich-text') as HTMLElement
    if (richText) {
      // Bind keydown handler for shortcuts that rich-text doesn't handle
      richText.addEventListener('keydown', (e: Event) => this._handleKeydown(e as KeyboardEvent))
    }

    // EDITOR-3102: Apply highlight styles after first render
    this._applyHighlightStyles()

    // AUTO-FOCUS: If this block was just created and should receive focus
    if (HydraBulletBlock._pendingFocusBlockId === this.model.id) {
      HydraBulletBlock._pendingFocusBlockId = null
      console.log('[AutoFocus] Block', this.model.id, 'auto-focusing in firstUpdated via focusTextModel')

      // EDITOR-3053: Use BlockSuite's focusTextModel for proper selection-based focus
      // This sets the selection immediately, and InlineEditor routes input correctly
      try {
        focusTextModel(this.std, this.model.id, 0)
        // Also position cursor using asyncSetInlineRange after render
        asyncSetInlineRange(this.host, this.model, { index: 0, length: 0 }).catch(e => {
          console.log('[AutoFocus] asyncSetInlineRange error:', e)
        })
      } catch (e) {
        console.log('[AutoFocus] focusTextModel error:', e)
      }
    }
  }

  /**
   * EDITOR-3102: Called after each update to re-apply highlight styles
   */
  override updated(): void {
    // Re-apply highlight styles after any re-render
    requestAnimationFrame(() => this._applyHighlightStyles())
  }

  /**
   * EDITOR-3102: Apply inline styles for background/color attributes
   * This is needed because the default renderer doesn't handle custom attributes
   */
  private _applyHighlightStyles(): void {
    const richText = this.querySelector('rich-text') as RichText | null
    if (!richText?.inlineEditor) return

    const inlineEditor = richText.inlineEditor
    const yText = inlineEditor.yText
    if (!yText) return

    // Get the delta which contains text and attributes
    const delta = yText.toDelta()
    if (!delta || delta.length === 0) return

    // Find the v-line and v-text elements
    const vLine = richText.querySelector('v-line')
    if (!vLine) return

    // Get all v-element and v-text children
    const vChildren = vLine.querySelectorAll('v-element, v-text')

    // Track position in delta
    let deltaIndex = 0

    vChildren.forEach((vChild) => {
      // Get the span inside
      const span = vChild.querySelector('span')
      if (!span) return

      // Find matching delta segment
      if (deltaIndex < delta.length) {
        const segment = delta[deltaIndex]
        const attrs = segment?.attributes as { background?: string; color?: string } | undefined

        // Apply or clear background color
        if (attrs?.background) {
          span.style.backgroundColor = attrs.background
          span.style.borderRadius = '2px'
          span.style.padding = '0 2px'
          span.style.margin = '0 -2px'
        } else {
          span.style.backgroundColor = ''
          span.style.borderRadius = ''
          span.style.padding = ''
          span.style.margin = ''
        }

        // Apply or clear text color
        if (attrs?.color) {
          span.style.color = attrs.color
        } else {
          span.style.color = ''
        }
      }

      deltaIndex++
    })
  }

  /**
   * Check if this block currently has the text selection.
   * This guard prevents handlers from running on unfocused blocks.
   */
  private _hasTextSelection(): boolean {
    const text = this.std?.selection?.find('text')
    if (!text) return false
    return text.from.blockId === this.model.id
  }

  /**
   * Bind keyboard shortcuts using BlockSuite's hotkey system.
   * This properly integrates with BlockSuite's focus management.
   */
  private _bindKeyboardShortcuts(): void {
    // Use BlockSuite's bindHotKey for proper focus handling
    // The 'flavour' option scopes shortcuts to hydra:bullet blocks
    this.bindHotKey(
      {
        // Cmd+. / Ctrl+. - reserved for future use (EDITOR-3061: do nothing)
        'Mod-.': () => {
          // Guard: Only handle if this block has the text selection
          if (!this._hasTextSelection()) return false
          // EDITOR-3061: Do nothing - reserved for future functionality
          return true // Prevent default
        },

        // Tab to indent (make child of previous sibling)
        Tab: (ctx) => {
          // Guard: Only handle if this block has the text selection
          if (!this._hasTextSelection()) return false
          ctx.get('defaultState').event.preventDefault()
          this._indent()
          return true
        },

        // Shift+Tab to outdent (make sibling of parent)
        'Shift-Tab': (ctx) => {
          // Guard: Only handle if this block has the text selection
          if (!this._hasTextSelection()) return false
          ctx.get('defaultState').event.preventDefault()
          this._outdent()
          return true
        },

        // Enter to create new sibling bullet (or split if cursor in middle)
        Enter: (ctx) => {
          // Guard: Only handle if this block has the text selection
          if (!this._hasTextSelection()) return false
          ctx.get('defaultState').event.preventDefault()
          this._handleEnter()
          return true
        },

        // Cmd+Enter to toggle fold (EDITOR-3061)
        'Mod-Enter': (ctx) => {
          // Guard: Only handle if this block has the text selection
          if (!this._hasTextSelection()) return false
          ctx.get('defaultState').event.preventDefault()
          this._toggleExpand()
          return true
        },

        // Arrow keys for navigation
        ArrowUp: () => {
          // Guard: Only handle if this block has the text selection
          if (!this._hasTextSelection()) return false
          this._navigate('ArrowUp')
          return true
        },

        ArrowDown: () => {
          // Guard: Only handle if this block has the text selection
          if (!this._hasTextSelection()) return false
          this._navigate('ArrowDown')
          return true
        },

        // EDITOR-3062: ArrowLeft/ArrowRight - standard text editor behavior
        // Only intercept at text boundaries to jump between bullets
        ArrowLeft: () => {
          if (!this._hasTextSelection()) return false
          // Only handle if cursor is at start of text
          const cursorPos = this._getCursorPosition()
          if (cursorPos === 0) {
            return this._handleArrowLeftAtStart()
          }
          // Let browser handle normal cursor movement
          return false
        },

        ArrowRight: () => {
          if (!this._hasTextSelection()) return false
          // Only handle if cursor is at end of text
          const cursorPos = this._getCursorPosition()
          const textLength = this.model.text.toString().length
          if (cursorPos >= textLength) {
            return this._handleArrowRightAtEnd()
          }
          // Let browser handle normal cursor movement
          return false
        },

        // EDITOR-3102: Cmd+Alt+1-6 for highlight colors, Cmd+Alt+0 to clear
        'Mod-Alt-1': (ctx) => {
          if (!this._hasTextSelection()) return false
          ctx.get('defaultState').event.preventDefault()
          this._applyHighlight('yellow')
          return true
        },
        'Mod-Alt-2': (ctx) => {
          if (!this._hasTextSelection()) return false
          ctx.get('defaultState').event.preventDefault()
          this._applyHighlight('green')
          return true
        },
        'Mod-Alt-3': (ctx) => {
          if (!this._hasTextSelection()) return false
          ctx.get('defaultState').event.preventDefault()
          this._applyHighlight('blue')
          return true
        },
        'Mod-Alt-4': (ctx) => {
          if (!this._hasTextSelection()) return false
          ctx.get('defaultState').event.preventDefault()
          this._applyHighlight('purple')
          return true
        },
        'Mod-Alt-5': (ctx) => {
          if (!this._hasTextSelection()) return false
          ctx.get('defaultState').event.preventDefault()
          this._applyHighlight('pink')
          return true
        },
        'Mod-Alt-6': (ctx) => {
          if (!this._hasTextSelection()) return false
          ctx.get('defaultState').event.preventDefault()
          this._applyHighlight('gray')
          return true
        },
        'Mod-Alt-0': (ctx) => {
          if (!this._hasTextSelection()) return false
          ctx.get('defaultState').event.preventDefault()
          this._applyHighlight(null) // Clear highlight
          return true
        },
      },
      { flavour: true }
    )
  }

  /**
   * EDITOR-3102: Apply or toggle highlight color on selected text
   * Uses `background` and `color` attributes with hex values (Affine pattern)
   * @param colorId - Color to apply, or null to clear
   */
  private _applyHighlight(colorId: ColorId | null): void {
    const richText = this.querySelector('rich-text') as RichText | null
    if (!richText?.inlineEditor) {
      console.log('[Highlight] No InlineEditor available')
      return
    }

    const inlineEditor = richText.inlineEditor
    const range = inlineEditor.getInlineRange()
    if (!range || range.length === 0) {
      console.log('[Highlight] No selection')
      return
    }

    // Get current format at selection to check for toggle behavior
    const currentFormat = inlineEditor.getFormat(range) as Record<string, unknown>
    const currentBg = currentFormat.background as string | undefined

    if (colorId === null) {
      // Clear highlight
      inlineEditor.formatText(range, { background: null, color: null } as Record<string, unknown>)
      // EDITOR-3102: Apply styles immediately after format
      requestAnimationFrame(() => this._applyHighlightStyles())
      console.log('[Highlight] Cleared')
      return
    }

    // Get the color definition with hex values
    const colorDef = getColorById(colorId)
    if (!colorDef) {
      console.log('[Highlight] Invalid color:', colorId)
      return
    }

    // Toggle behavior: if same color, remove it
    if (currentBg === colorDef.backgroundColor) {
      inlineEditor.formatText(range, { background: null, color: null } as Record<string, unknown>)
      // EDITOR-3102: Apply styles immediately after format
      requestAnimationFrame(() => this._applyHighlightStyles())
      console.log('[Highlight] Toggled off:', colorId)
    } else {
      // Apply new color with both background and text color for contrast
      inlineEditor.formatText(range, {
        background: colorDef.backgroundColor,
        color: colorDef.textColor
      } as Record<string, unknown>)
      // EDITOR-3102: Apply styles immediately after format
      requestAnimationFrame(() => this._applyHighlightStyles())
      console.log('[Highlight] Applied:', colorId, colorDef.backgroundColor)
    }
  }

  // ============================================================================
  // EDITOR-3103: Context Menu Color Picker
  // ============================================================================

  /**
   * Show the context menu at the specified position
   */
  private _showContextMenu(x: number, y: number): void {
    this._contextMenuX = x
    this._contextMenuY = y
    this._contextMenuVisible = true
    this.requestUpdate()

    // Add global listeners for dismissing
    document.addEventListener('click', this._handleDocumentClick)
    document.addEventListener('keydown', this._handleDocumentKeydown)
  }

  /**
   * Hide the context menu
   */
  private _hideContextMenu(): void {
    this._contextMenuVisible = false
    this.requestUpdate()

    // Remove global listeners
    document.removeEventListener('click', this._handleDocumentClick)
    document.removeEventListener('keydown', this._handleDocumentKeydown)
  }

  /**
   * Handle contextmenu event on rich-text area
   */
  private _handleContextMenu = (e: MouseEvent): void => {
    // Only show custom menu when text is selected
    const richText = this.querySelector('rich-text') as RichText | null
    if (!richText?.inlineEditor) return

    const range = richText.inlineEditor.getInlineRange()
    if (!range || range.length === 0) {
      // No selection, use browser default
      return
    }

    // Prevent browser context menu
    e.preventDefault()

    // Show our custom menu at cursor position
    this._showContextMenu(e.clientX, e.clientY)
  }

  /**
   * Handle document click to dismiss menu
   */
  private _handleDocumentClick = (e: MouseEvent): void => {
    const menu = this.shadowRoot?.querySelector('.color-context-menu')
    if (menu && !menu.contains(e.target as Node)) {
      this._hideContextMenu()
    }
  }

  /**
   * Handle document keydown to dismiss menu on Escape
   */
  private _handleDocumentKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this._hideContextMenu()
    }
  }

  /**
   * Handle color selection from context menu
   */
  private _handleColorSelect(colorId: ColorId | null): void {
    this._applyHighlight(colorId)
    this._hideContextMenu()
  }

  /**
   * Render the context menu
   */
  private _renderContextMenu(): TemplateResult {
    if (!this._contextMenuVisible) {
      return html``
    }

    return html`
      <div
        class="color-context-menu"
        style="left: ${this._contextMenuX}px; top: ${this._contextMenuY}px;"
        @click=${(e: Event) => e.stopPropagation()}
      >
        <div class="color-menu-label">Highlight Color</div>
        <div class="color-swatches">
          ${COLOR_PALETTE.map(color => html`
            <div
              class="color-swatch"
              style="background-color: ${color.backgroundColor};"
              title="${color.name} (Cmd+Alt+${color.shortcutKey})"
              @click=${() => this._handleColorSelect(color.id as ColorId)}
            ></div>
          `)}
        </div>
        <div class="color-menu-divider"></div>
        <div
          class="color-menu-item"
          @click=${() => this._handleColorSelect(null)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          Remove Highlight
        </div>
      </div>
    `
  }

  /**
   * Toggle expand/collapse state
   */
  private _toggleExpand(): void {
    if (!this._hasChildren) return

    this.doc.updateBlock(this.model, {
      isExpanded: !this.model.isExpanded,
    })
  }

  /**
   * Get navigation context for this block
   */
  private _getNavigationContext(): BlockNavigationContext {
    const parent = this.model.parent
    const siblings = parent?.children ?? []
    const currentIndex = siblings.indexOf(this.model)

    return {
      currentBlockId: this.model.id,
      previousSiblingId: currentIndex > 0 ? siblings[currentIndex - 1].id : null,
      nextSiblingId:
        currentIndex < siblings.length - 1
          ? siblings[currentIndex + 1].id
          : null,
      parentId: parent?.id ?? null,
      firstChildId: this._hasChildren ? this.model.children[0].id : null,
      isExpanded: this.model.isExpanded,
      hasChildren: this._hasChildren,
    }
  }

  /**
   * Indent this block (make it a child of previous sibling)
   * EDITOR-3057: Save and restore cursor position after structure change
   */
  private _indent(): void {
    const ctx = this._getNavigationContext()
    if (!canIndent(ctx.previousSiblingId !== null, 0)) return

    const previousSibling = this.doc.getBlockById(ctx.previousSiblingId!)
    if (!previousSibling) return

    // Save cursor position before structure change
    const cursorPos = this._getCursorPosition()

    // Move this block to be the last child of the previous sibling
    this.doc.moveBlocks([this.model], previousSibling)

    // Restore cursor after structure change
    this._focusBlockAtPosition(this.model.id, cursorPos)
  }

  /**
   * Outdent this block (make it a sibling of its parent)
   * EDITOR-3057: Save and restore cursor position after structure change
   */
  private _outdent(): void {
    const parent = this.model.parent
    if (!parent || !parent.parent) return // Can't outdent root-level blocks

    const grandparent = parent.parent
    const parentIndex = grandparent.children.indexOf(parent)

    // Save cursor position before structure change
    const cursorPos = this._getCursorPosition()

    // Move this block to be after its parent in the grandparent's children
    this.doc.moveBlocks([this.model], grandparent, grandparent.children[parentIndex + 1])

    // Restore cursor after structure change
    this._focusBlockAtPosition(this.model.id, cursorPos)
  }

  /**
   * Create a new sibling bullet after this one
   * EDITOR-3053: Updated to use focusTextModel for immediate selection-based focus
   */
  private _createSibling(): void {
    const parent = this.model.parent
    if (!parent) return

    const siblings = parent.children
    const currentIndex = siblings.indexOf(this.model)
    console.log('[CreateSibling] Current block ID:', this.model.id, 'index:', currentIndex)

    // Add new block after current block (index is the position to insert at)
    const newBlockId = this.doc.addBlock(
      'hydra:bullet',
      { text: new this.doc.Text() },
      parent,
      currentIndex + 1
    )
    console.log('[CreateSibling] NEW block ID:', newBlockId)

    // Mark this block for auto-focus when it renders in firstUpdated()
    HydraBulletBlock._pendingFocusBlockId = newBlockId

    // EDITOR-3053: Set BlockSuite selection IMMEDIATELY
    // This notifies the framework which block should be active
    // InlineEditor will route keystrokes based on this selection
    try {
      focusTextModel(this.std, newBlockId, 0)
      console.log('[CreateSibling] focusTextModel called for new block')
    } catch (e) {
      console.log('[CreateSibling] focusTextModel error:', e)
    }
  }

  /**
   * Handle Enter key - split text at cursor position or create empty sibling/child.
   * If cursor is at end or text is empty:
   *   - If block has children: create new first child (EDITOR-3057)
   *   - Otherwise: create new sibling
   * If cursor is in middle, split the text.
   * EDITOR-3053: Updated to use focusTextModel for immediate selection-based focus
   */
  private _handleEnter(): void {
    const cursorPos = this._getCursorPosition()
    const currentText = this.model.text.toString()

    // If at end or empty
    if (cursorPos >= currentText.length) {
      // EDITOR-3057: If block has children, create first child instead of sibling
      // This matches RemNote behavior where Enter continues "inside" the bullet
      if (this._hasChildren) {
        this._createChild()
      } else {
        this._createSibling()
      }
      return
    }

    // Split the text at cursor position
    const textBefore = currentText.slice(0, cursorPos)
    const textAfter = currentText.slice(cursorPos)

    // Update current block with text before cursor
    this.model.text.delete(0, this.model.text.length)
    if (textBefore) {
      this.model.text.insert(textBefore, 0)
    }

    // EDITOR-3053: No need to update DOM directly - rich-text syncs via Yjs

    // Create new sibling with text after cursor
    const parent = this.model.parent
    if (!parent) return

    const siblings = parent.children
    const currentIndex = siblings.indexOf(this.model)

    const newBlockId = this.doc.addBlock(
      'hydra:bullet',
      { text: new this.doc.Text(textAfter) },
      parent,
      currentIndex + 1
    )
    console.log('[HandleEnter:Split] NEW block ID:', newBlockId)

    // Mark this block for auto-focus when it renders in firstUpdated()
    HydraBulletBlock._pendingFocusBlockId = newBlockId

    // EDITOR-3053: Set BlockSuite selection IMMEDIATELY
    // This notifies the framework which block should be active
    try {
      focusTextModel(this.std, newBlockId, 0)
      console.log('[HandleEnter:Split] focusTextModel called for new block')
    } catch (e) {
      console.log('[HandleEnter:Split] focusTextModel error:', e)
    }
  }

  /**
   * Create a new child bullet
   * EDITOR-3053: Updated to use focusTextModel for immediate selection-based focus
   */
  private _createChild(): void {
    // Expand if collapsed
    if (!this.model.isExpanded && this._hasChildren) {
      this.doc.updateBlock(this.model, { isExpanded: true })
    }

    // Add new block as first child (index 0)
    const newBlockId = this.doc.addBlock(
      'hydra:bullet',
      { text: new this.doc.Text() },
      this.model,
      0
    )
    console.log('[CreateChild] NEW block ID:', newBlockId)

    // Mark this block for auto-focus when it renders in firstUpdated()
    HydraBulletBlock._pendingFocusBlockId = newBlockId

    // EDITOR-3053: Set BlockSuite selection IMMEDIATELY
    // This notifies the framework which block should be active
    try {
      focusTextModel(this.std, newBlockId, 0)
      console.log('[CreateChild] focusTextModel called for new block')
    } catch (e) {
      console.log('[CreateChild] focusTextModel error:', e)
    }
  }

  /**
   * Navigate to a different block, preserving column position.
   * EDITOR-3061: Arrow up/down should maintain cursor column like VSCode.
   */
  private _navigate(direction: 'ArrowUp' | 'ArrowDown'): void {
    const ctx = this._getNavigationContext()
    const targetId = getNavigationTarget(direction, ctx)

    if (targetId && targetId !== NAVIGATION_COLLAPSE && targetId !== NAVIGATION_EXPAND) {
      // EDITOR-3061: Preserve column position when navigating
      const currentColumn = this._getCursorPosition()
      this._focusBlockPreserveColumn(targetId, currentColumn)
    }
  }

  /**
   * Focus a block by ID while preserving the cursor column position.
   * EDITOR-3061: Places cursor at the same column, or at end of text if text is shorter.
   */
  private _focusBlockPreserveColumn(blockId: string, targetColumn: number): void {
    const targetModel = this.doc.getBlockById(blockId) as BulletBlockModel | null
    if (!targetModel || !targetModel.text) {
      this._focusBlock(blockId)
      return
    }

    // Clamp column to text length (go to end if text is shorter)
    const textLength = targetModel.text.toString().length
    const clampedPosition = Math.min(targetColumn, textLength)

    console.log('[Navigate] Preserving column:', targetColumn, '→ clamped:', clampedPosition, 'for block:', blockId)
    this._focusBlockAtPosition(blockId, clampedPosition)
  }

  /**
   * Handle ArrowLeft when cursor is at start of text.
   * EDITOR-3062: Jump to end of previous visible bullet (standard text editor behavior).
   * Returns true if navigation happened, false to let browser handle.
   */
  private _handleArrowLeftAtStart(): boolean {
    const ctx = this._getNavigationContext()
    // Get previous block (same logic as ArrowUp)
    const targetId = ctx.previousSiblingId ?? ctx.parentId
    if (!targetId) return false

    // For previous sibling, navigate to its last visible descendant
    if (ctx.previousSiblingId) {
      const previousBlock = this.doc.getBlockById(ctx.previousSiblingId) as BulletBlockModel | null
      if (previousBlock) {
        const targetBlock = this._getLastVisibleDescendant(previousBlock)
        const textLength = targetBlock.text.toString().length
        this._focusBlockAtPosition(targetBlock.id, textLength)
        return true
      }
    }

    // For parent, go to end of parent's text
    const parentBlock = this.doc.getBlockById(targetId) as BulletBlockModel | null
    if (parentBlock?.text) {
      const textLength = parentBlock.text.toString().length
      this._focusBlockAtPosition(targetId, textLength)
      return true
    }

    return false
  }

  /**
   * Handle ArrowRight when cursor is at end of text.
   * EDITOR-3062: Jump to start of next visible bullet (standard text editor behavior).
   * Returns true if navigation happened, false to let browser handle.
   */
  private _handleArrowRightAtEnd(): boolean {
    const ctx = this._getNavigationContext()
    // Get next block (same logic as ArrowDown)
    let targetId: string | null = null

    // If expanded with children, go to first child
    if (ctx.hasChildren && ctx.isExpanded && ctx.firstChildId) {
      targetId = ctx.firstChildId
    } else {
      // Otherwise go to next sibling
      targetId = ctx.nextSiblingId
    }

    if (!targetId) return false

    // Navigate to start of target block
    this._focusBlockAtPosition(targetId, 0)
    return true
  }

  /**
   * Focus a block by ID and position cursor at the start.
   * EDITOR-3053: Updated to use focusTextModel + asyncSetInlineRange
   */
  private _focusBlock(blockId: string): void {
    this._focusBlockAtPosition(blockId, 0)
  }

  /**
   * Focus a block by ID and position cursor at a specific character position.
   * EDITOR-3061: Hide cursor during transition to prevent visible jump.
   *
   * The challenge: BlockSuite's selection system has async behavior that causes
   * the cursor to visibly jump to position 0 before our correction takes effect.
   *
   * Solution: Hide the caret during the transition using CSS, then restore it
   * after the cursor position has been correctly set.
   */
  private _focusBlockAtPosition(blockId: string, position: number): void {
    const model = this.doc.getBlockById(blockId)
    if (!model) return

    // Get the target block's element to hide its caret during transition
    const blockElement = this.host.view.getBlock(blockId)
    const richText = blockElement?.querySelector('rich-text') as HTMLElement | null

    // Hide cursor during transition to prevent visual jump
    if (richText) {
      richText.style.caretColor = 'transparent'
    }

    // Use BlockSuite's focus mechanism
    focusTextModel(this.std, blockId, position)

    // After focusTextModel's effects settle, set correct position and restore cursor
    setTimeout(() => {
      const inlineEditor = getInlineEditorByModel(this.host, blockId)
      if (inlineEditor) {
        inlineEditor.setInlineRange({ index: position, length: 0 })
      }

      // Restore cursor visibility
      if (richText) {
        richText.style.caretColor = ''
      }
    }, 0)
  }

  /**
   * Compute the inline preview text from children.
   * Returns truncated preview of child content when collapsed.
   * EDITOR-3301: Use cheatsheet format when children include descriptors.
   */
  private _getInlinePreview(): string {
    if (this.model.isExpanded || !this._hasChildren) {
      return ''
    }

    // EDITOR-3301: Convert children to DescriptorChild format for cheatsheet
    const descriptorChildren: DescriptorChild[] = this.model.children.map((child) => {
      const bulletChild = child as BulletBlockModel
      return {
        text: bulletChild.text?.toString() ?? '',
        descriptorType: bulletChild.isDescriptor ? bulletChild.descriptorType : null,
        isDescriptor: bulletChild.isDescriptor ?? false,
      }
    })

    // Check if any children are descriptors
    const hasDescriptors = descriptorChildren.some((c) => c.isDescriptor)

    if (hasDescriptors) {
      // EDITOR-3301: Use cheatsheet format for descriptor children
      return computeCheatsheet(descriptorChildren)
    }

    // Fallback to simple inline preview for non-descriptor children
    const childTexts = this.model.children.map((child) => ({
      text: (child as BulletBlockModel).text?.toString() ?? '',
    }))

    const preview = computeInlinePreview(childTexts)
    return truncatePreview(preview)
  }

  /**
   * Get the last visible descendant of a block.
   * Traverses down through expanded children to find the deepest last child.
   * Used by Backspace to find the visually preceding bullet.
   * EDITOR-3058: Fix backspace to navigate to visual hierarchy, not tree structure.
   */
  private _getLastVisibleDescendant(block: BulletBlockModel): BulletBlockModel {
    let target = block
    while (target.isExpanded && target.children.length > 0) {
      target = target.children[target.children.length - 1] as BulletBlockModel
    }
    return target
  }

  /**
   * Render inline preview element when collapsed with children.
   */
  private _renderInlinePreview(): TemplateResult | typeof nothing {
    const previewText = this._getInlinePreview()
    if (!previewText) {
      return nothing
    }

    return html`<span class="inline-preview" title="${previewText}"
      >${previewText}</span
    >`
  }

  private _renderToggle(): TemplateResult {
    if (!this._hasChildren) {
      return html`
        <div class="bullet-toggle no-children">
          <span class="bullet-icon"></span>
        </div>
      `
    }

    const icon = this.model.isExpanded ? '▼' : '▶'
    const title = this.model.isExpanded ? 'Collapse (⌘↵)' : 'Expand (⌘↵)'
    return html`
      <div
        class="bullet-toggle has-children"
        @click=${this._toggleExpand}
        title=${title}
        role="button"
        aria-expanded=${this.model.isExpanded ? 'true' : 'false'}
        aria-label=${this.model.isExpanded ? 'Collapse children' : 'Expand children'}
        tabindex="0"
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            this._toggleExpand()
          }
        }}
      >
        ${icon}
      </div>
    `
  }

  // EDITOR-3053: _handleInput() removed - rich-text handles Yjs sync automatically

  /**
   * Get the cursor position from rich-text's InlineEditor.
   * EDITOR-3053: Updated to use InlineEditor API instead of DOM selection.
   * Falls back to BlockSuite TextSelection if InlineEditor range is unavailable.
   */
  private _getCursorPosition(): number {
    // First try InlineEditor (most accurate for current editing)
    const richText = this.querySelector('rich-text') as RichText | null
    if (richText?.inlineEditor) {
      const range = richText.inlineEditor.getInlineRange()
      if (range) {
        return range.index
      }
    }

    // Fallback: Check BlockSuite TextSelection (set by focusTextModel)
    // This handles cases where InlineEditor hasn't synced yet (e.g., after Backspace merge)
    if (this.std?.selection) {
      const selections = this.std.selection.filter('text')
      for (const sel of selections) {
        if (sel.from?.blockId === this.model.id) {
          return sel.from.index ?? 0
        }
      }
    }

    return 0
  }

  // EDITOR-3053: Helper methods _isCursorAtStart() and _isCursorAtEnd() removed
  // They can be added back in EDITOR-3056 for inline formatting if needed

  /**
   * Handle Backspace at the start of a bullet.
   * Behavior depends on context:
   * - Has previous sibling: Merge content with previous sibling
   * - First child (no sibling): Merge with parent and delete this block
   * - Root level (no sibling, no parent): Do nothing
   * EDITOR-3053: Updated to use focusTextModel + asyncSetInlineRange
   * EDITOR-3063: Children are now reparented (unindented) instead of deleted
   */
  private _handleBackspaceAtStart(): void {
    const ctx = this._getNavigationContext()
    const currentText = this.model.text.toString()
    const parent = this.model.parent

    // EDITOR-3063: Get children to reparent before deletion
    const children = [...this.model.children] // Copy array since we'll modify structure

    // Case 1: Has previous sibling - merge with its last visible descendant
    // EDITOR-3058: Navigate to visual hierarchy, not just tree structure
    if (ctx.previousSiblingId) {
      const previousBlock = this.doc.getBlockById(ctx.previousSiblingId) as BulletBlockModel | null
      if (!previousBlock) return

      // Find the last visible descendant of the previous sibling
      // This handles cases where the previous sibling is expanded with children
      const targetBlock = this._getLastVisibleDescendant(previousBlock)
      const targetText = targetBlock.text.toString()
      const mergePoint = targetText.length

      // Merge: append current text to target block's text
      if (currentText) {
        targetBlock.text.insert(currentText, mergePoint)
      }

      // Store refs before deletion
      const blockToDelete = this.model
      const doc = this.doc
      const std = this.std
      const host = this.host
      const targetBlockId = targetBlock.id

      // EDITOR-3063: Reparent children to become siblings (stay under same parent)
      // They should appear after the current block's position (which we're about to delete)
      if (children.length > 0 && parent) {
        // Find the position after current block in parent's children
        const currentIndex = parent.children.indexOf(blockToDelete)
        const nextSibling = parent.children[currentIndex + 1] || null
        // Move children to parent, before the next sibling (or at end if no next sibling)
        doc.moveBlocks(children, parent, nextSibling)
      }

      // Defer deletion to avoid render cycle crash
      requestAnimationFrame(() => {
        doc.deleteBlock(blockToDelete)
        // EDITOR-3053: Use focusTextModel + asyncSetInlineRange for focus
        try {
          focusTextModel(std, targetBlockId, mergePoint)
          const targetModel = doc.getBlockById(targetBlockId)
          if (targetModel) {
            asyncSetInlineRange(host, targetModel, { index: mergePoint, length: 0 }).catch(e => {
              console.log('[Backspace] asyncSetInlineRange error:', e)
            })
          }
        } catch (e) {
          console.log('[Backspace] focusTextModel error:', e)
        }
      })
      return
    }

    // Case 2: First child (no previous sibling) - merge with parent
    if (ctx.parentId) {
      const parentBlock = this.doc.getBlockById(ctx.parentId) as BulletBlockModel | null
      if (!parentBlock || !parentBlock.text) return // Parent must be a bullet block with text

      const parentText = parentBlock.text.toString()
      const mergePoint = parentText.length

      // Merge: append current text to parent's text
      if (currentText) {
        parentBlock.text.insert(currentText, mergePoint)
      }

      // Store refs before deletion
      const blockToDelete = this.model
      const doc = this.doc
      const std = this.std
      const host = this.host
      const targetBlockId = ctx.parentId

      // EDITOR-3063: Reparent children to become siblings of parent (move to grandparent)
      if (children.length > 0) {
        const grandparent = parentBlock.parent
        if (grandparent) {
          // Find position after parent in grandparent's children
          const parentIndex = grandparent.children.indexOf(parentBlock)
          const nextSiblingOfParent = grandparent.children[parentIndex + 1] || null
          // Move children to grandparent, after the parent
          doc.moveBlocks(children, grandparent, nextSiblingOfParent)
        }
      }

      // Defer deletion to avoid render cycle crash
      requestAnimationFrame(() => {
        doc.deleteBlock(blockToDelete)
        // EDITOR-3053: Use focusTextModel + asyncSetInlineRange for focus
        try {
          focusTextModel(std, targetBlockId, mergePoint)
          const targetModel = doc.getBlockById(targetBlockId)
          if (targetModel) {
            asyncSetInlineRange(host, targetModel, { index: mergePoint, length: 0 }).catch(e => {
              console.log('[Backspace] asyncSetInlineRange error:', e)
            })
          }
        } catch (e) {
          console.log('[Backspace] focusTextModel error:', e)
        }
      })
      return
    }

    // Case 3: Root level with no previous sibling - do nothing
  }

  /**
   * Handle keydown events to intercept special keys before rich-text
   * EDITOR-3053: Updated comments - now handles rich-text instead of contenteditable
   * EDITOR-3059: Fix backspace with selection - only trigger merge when no text selected
   */
  private _handleKeydown(e: KeyboardEvent): void {
    // EDITOR-3203: Detect ~ key for descriptor autocomplete
    // Note: ~ is typed with Shift+` on US keyboards, but e.key gives us '~' directly
    if (e.key === '~') {
      // Dispatch event to open descriptor autocomplete
      this._dispatchDescriptorAutocompleteOpen()
      // Don't prevent default - let the ~ character be typed
      return
    }

    // Backspace at start of line merges with previous sibling
    // NOTE: This is the ONLY handler here - all other shortcuts (Enter, Tab, etc.)
    // are handled by _bindKeyboardShortcuts() via BlockSuite's bindHotKey system.
    // Do NOT add duplicate handlers here!
    if (e.key === 'Backspace') {
      // EDITOR-3059: Check for selection - if text is selected, let rich-text handle deletion
      const richText = this.querySelector('rich-text') as RichText | null
      const range = richText?.inlineEditor?.getInlineRange()

      // If text is selected (length > 0), let rich-text handle the deletion normally
      if (range && range.length > 0) {
        return // Don't prevent default - rich-text will delete selected text
      }

      // Only handle backspace at position 0 with no selection (cursor only)
      const cursorPos = range?.index ?? this._getCursorPosition()
      if (cursorPos === 0) {
        e.preventDefault()
        this._handleBackspaceAtStart()
        return
      }
    }
  }

  /**
   * Override shouldUpdate to prevent render when model is null.
   * This is necessary because after deleteBlock(), this.model becomes null
   * but Lit may still trigger an update. By returning false here, we prevent
   * the entire update/render cycle from running.
   */
  override shouldUpdate(): boolean {
    // Don't update if model is null (component being destroyed)
    if (!this.model) {
      return false
    }
    return true
  }

  /**
   * Override base render() to guard against null model.
   * This is a secondary guard in case shouldUpdate doesn't catch all cases.
   */
  override render(): unknown {
    if (!this.model) {
      return html``
    }
    return super.render()
  }

  /**
   * FE-408: Dispatch expand request event
   * This event is handled by the React layer to trigger AI expansion
   */
  private _handleExpandClick(e: Event): void {
    e.stopPropagation()

    // Get context for the expansion
    const parent = this.model.parent
    const siblings = parent?.children.filter(c => c.flavour === 'hydra:bullet') || []
    const siblingTexts = siblings
      .filter(s => s.id !== this.model.id)
      .map(s => (s as BulletBlockModel).text?.toString() || '')
      .filter(text => text.length > 0)

    const parentText = parent?.flavour === 'hydra:bullet'
      ? (parent as BulletBlockModel).text?.toString() || null
      : null

    // Dispatch custom event with expand context
    const event = new CustomEvent('hydra-expand-block', {
      bubbles: true,
      composed: true,
      detail: {
        blockId: this.model.id,
        blockText: this.model.text.toString(),
        siblingTexts,
        parentText,
      },
    })
    this.dispatchEvent(event)
  }

  /**
   * EDITOR-3203: Dispatch event to open descriptor autocomplete
   * Called when user types `~` to trigger descriptor selection
   */
  private _dispatchDescriptorAutocompleteOpen(): void {
    // Get cursor position for dropdown positioning
    const richText = this.querySelector('rich-text') as RichText | null
    const selection = window.getSelection()
    let position = { top: 0, left: 0 }

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      // Position dropdown below the cursor
      position = {
        top: rect.bottom + 4,
        left: rect.left,
      }
    } else if (richText) {
      // Fallback to element position
      const rect = richText.getBoundingClientRect()
      position = {
        top: rect.bottom + 4,
        left: rect.left,
      }
    }

    // Dispatch custom event with autocomplete context
    const event = new CustomEvent('hydra-descriptor-autocomplete-open', {
      bubbles: true,
      composed: true,
      detail: {
        blockId: this.model.id,
        position,
      },
    })
    this.dispatchEvent(event)
  }

  /**
   * FE-408: Render expand button with AI icon
   */
  private _renderExpandButton(): TemplateResult {
    return html`
      <div
        class="bullet-expand"
        @click=${this._handleExpandClick}
        title="Expand with AI (generates child bullets)"
        role="button"
        aria-label="Expand this bullet with AI"
        tabindex="0"
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            this._handleExpandClick(e)
          }
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 3v6m0 6v6M3 12h6m6 0h6" />
        </svg>
      </div>
    `
  }

  /**
   * EDITOR-3201: Render descriptor prefix and label
   * Shows "| What", "| Why", etc. for descriptor blocks
   */
  private _renderDescriptorPrefix(): TemplateResult | typeof nothing {
    if (!this.model.isDescriptor || !this.model.descriptorType) {
      return nothing
    }

    const prefix = getDescriptorPrefix()
    const label = getDescriptorLabel(
      this.model.descriptorType,
      this.model.descriptorLabel
    )

    return html`
      <span class="descriptor-prefix">${prefix}</span>
      <span class="descriptor-label">${label}</span>
    `
  }

  override renderBlock(): TemplateResult {
    // Additional guard (render() guard should catch this, but being defensive)
    if (!this.model) {
      return html``
    }

    const childrenClass = this.model.isExpanded ? '' : 'collapsed'
    // EDITOR-3201: Add descriptor class for styling
    const containerClass = this.model.isDescriptor
      ? 'bullet-container descriptor-block'
      : 'bullet-container'

    // EDITOR-3053: Use rich-text component instead of contenteditable
    // This provides InlineEditor which routes input based on selection, not DOM focus
    // EDITOR-3102: Pass extended schema to enable background/color attributes
    // EDITOR-3103: Add contextmenu handler for color picker
    return html`
      <div class="${containerClass}">
        ${this._renderToggle()}
        ${this._renderDescriptorPrefix()}
        <rich-text
          .yText=${this.model.text.yText}
          .attributesSchema=${hydraTextAttributesSchema}
          .enableFormat=${true}
          .enableClipboard=${true}
          .enableUndoRedo=${true}
          .readonly=${false}
          @contextmenu=${this._handleContextMenu}
        ></rich-text>
        ${this._renderInlinePreview()}
        ${this._renderExpandButton()}
      </div>
      <div class="bullet-children ${childrenClass}">
        ${this.std ? this.renderChildren(this.model) : nothing}
      </div>
      ${this._renderContextMenu()}
    `
  }
}
