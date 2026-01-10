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
} from '@blocksuite/affine-components/rich-text'

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
 * ## Keyboard Shortcuts (EDITOR-306)
 *
 * ### Navigation
 * - Arrow Up: Move to previous sibling or parent
 * - Arrow Down: Move to next sibling or first child (if expanded)
 * - Arrow Left: Collapse (if expanded) or move to parent
 * - Arrow Right: Expand (if collapsed) or move to first child
 *
 * ### Structure Manipulation
 * - Tab: Indent (make child of previous sibling)
 * - Shift+Tab: Outdent (make sibling of parent)
 * - Enter: Create new sibling bullet below
 * - Cmd/Ctrl+Enter: Create new child bullet
 *
 * ### Folding
 * - Cmd/Ctrl+.: Toggle expand/collapse
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
// EDITOR-306: Keyboard Shortcuts - Pure Logic Functions
// ============================================================================

/**
 * Documented keyboard shortcuts for the bullet block component.
 * Can be used to display help/documentation to users.
 */
export const KEYBOARD_SHORTCUTS = {
  navigation: [
    { key: 'Arrow Up', description: 'Move to previous sibling or parent' },
    { key: 'Arrow Down', description: 'Move to next sibling or first child (if expanded)' },
    { key: 'Arrow Left', description: 'Collapse (if expanded) or move to parent' },
    { key: 'Arrow Right', description: 'Expand (if collapsed) or move to first child' },
  ],
  structure: [
    { key: 'Tab', description: 'Indent (make child of previous sibling)' },
    { key: 'Shift+Tab', description: 'Outdent (make sibling of parent)' },
    { key: 'Enter', description: 'Create new sibling bullet below' },
    { key: 'Cmd/Ctrl+Enter', description: 'Create new child bullet' },
  ],
  folding: [
    { key: 'Cmd/Ctrl+.', description: 'Toggle expand/collapse' },
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
 * Returns block ID to navigate to, special action string, or null if no navigation possible
 */
export function getNavigationTarget(
  direction: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight',
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

    case 'ArrowLeft':
      // If expanded with children, collapse
      if (ctx.hasChildren && ctx.isExpanded) {
        return NAVIGATION_COLLAPSE
      }
      // Otherwise navigate to parent
      return ctx.parentId

    case 'ArrowRight':
      // If collapsed with children, expand
      if (ctx.hasChildren && !ctx.isExpanded) {
        return NAVIGATION_EXPAND
      }
      // If expanded with children, navigate to first child
      if (ctx.hasChildren && ctx.isExpanded && ctx.firstChildId) {
        return ctx.firstChildId
      }
      // No children, no navigation
      return null
  }
}

@customElement('hydra-bullet-block')
export class HydraBulletBlock extends BlockComponent<BulletBlockModel> {
  /**
   * Static variable to track which block should auto-focus when it renders.
   * Set by _createSibling/_createChild, checked by firstUpdated.
   */
  static _pendingFocusBlockId: string | null = null

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
        // Cmd+. / Ctrl+. to toggle fold
        'Mod-.': () => {
          // Guard: Only handle if this block has the text selection
          if (!this._hasTextSelection()) return false
          this._toggleExpand()
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

        // Cmd+Enter to create child bullet
        'Mod-Enter': (ctx) => {
          // Guard: Only handle if this block has the text selection
          if (!this._hasTextSelection()) return false
          ctx.get('defaultState').event.preventDefault()
          this._createChild()
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

        ArrowLeft: () => {
          // Guard: Only handle if this block has the text selection
          if (!this._hasTextSelection()) return false
          this._handleArrowLeft()
          return true
        },

        ArrowRight: () => {
          // Guard: Only handle if this block has the text selection
          if (!this._hasTextSelection()) return false
          this._handleArrowRight()
          return true
        },
      },
      { flavour: true }
    )
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
   * Navigate to a different block
   */
  private _navigate(direction: 'ArrowUp' | 'ArrowDown'): void {
    const ctx = this._getNavigationContext()
    const targetId = getNavigationTarget(direction, ctx)

    if (targetId && targetId !== NAVIGATION_COLLAPSE && targetId !== NAVIGATION_EXPAND) {
      this._focusBlock(targetId)
    }
  }

  /**
   * Handle ArrowLeft - collapse or navigate to parent
   */
  private _handleArrowLeft(): void {
    const ctx = this._getNavigationContext()
    const result = getNavigationTarget('ArrowLeft', ctx)

    if (result === NAVIGATION_COLLAPSE) {
      this._toggleExpand()
    } else if (result) {
      this._focusBlock(result)
    }
  }

  /**
   * Handle ArrowRight - expand or navigate to first child
   */
  private _handleArrowRight(): void {
    const ctx = this._getNavigationContext()
    const result = getNavigationTarget('ArrowRight', ctx)

    if (result === NAVIGATION_EXPAND) {
      this._toggleExpand()
    } else if (result) {
      this._focusBlock(result)
    }
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
   * EDITOR-3053: Simplified to use focusTextModel + asyncSetInlineRange
   */
  private _focusBlockAtPosition(blockId: string, position: number): void {
    console.log('[Focus] Focusing block', blockId, 'at position', position)

    // EDITOR-3053: Use focusTextModel for immediate selection-based focus
    try {
      focusTextModel(this.std, blockId, position)
      console.log('[Focus] focusTextModel called')
    } catch (e) {
      console.log('[Focus] focusTextModel error:', e)
    }

    // Also set cursor position using asyncSetInlineRange after render
    const model = this.doc.getBlockById(blockId)
    if (model) {
      asyncSetInlineRange(this.host, model, { index: position, length: 0 }).then(() => {
        console.log('[Focus] asyncSetInlineRange completed')
      }).catch(e => {
        console.log('[Focus] asyncSetInlineRange error:', e)
      })
    }
  }

  /**
   * Compute the inline preview text from children.
   * Returns truncated preview of child content when collapsed.
   */
  private _getInlinePreview(): string {
    if (this.model.isExpanded || !this._hasChildren) {
      return ''
    }

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
    const title = this.model.isExpanded ? 'Collapse (⌘.)' : 'Expand (⌘.)'
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
   */
  private _handleBackspaceAtStart(): void {
    const ctx = this._getNavigationContext()
    const currentText = this.model.text.toString()

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
      const parent = this.doc.getBlockById(ctx.parentId) as BulletBlockModel | null
      if (!parent || !parent.text) return // Parent must be a bullet block with text

      const parentText = parent.text.toString()
      const mergePoint = parentText.length

      // Merge: append current text to parent's text
      if (currentText) {
        parent.text.insert(currentText, mergePoint)
      }

      // Store refs before deletion
      const blockToDelete = this.model
      const doc = this.doc
      const std = this.std
      const host = this.host
      const targetBlockId = ctx.parentId

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
   */
  private _handleKeydown(e: KeyboardEvent): void {
    // Backspace at start of line merges with previous sibling
    // NOTE: This is the ONLY handler here - all other shortcuts (Enter, Tab, etc.)
    // are handled by _bindKeyboardShortcuts() via BlockSuite's bindHotKey system.
    // Do NOT add duplicate handlers here!
    if (e.key === 'Backspace') {
      const cursorPos = this._getCursorPosition()
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

  override renderBlock(): TemplateResult {
    // Additional guard (render() guard should catch this, but being defensive)
    if (!this.model) {
      return html``
    }

    const childrenClass = this.model.isExpanded ? '' : 'collapsed'

    // EDITOR-3053: Use rich-text component instead of contenteditable
    // This provides InlineEditor which routes input based on selection, not DOM focus
    return html`
      <div class="bullet-container">
        ${this._renderToggle()}
        <rich-text
          .yText=${this.model.text.yText}
          .enableFormat=${false}
          .enableClipboard=${true}
          .enableUndoRedo=${false}
          .readonly=${false}
        ></rich-text>
        ${this._renderInlinePreview()}
      </div>
      <div class="bullet-children ${childrenClass}">
        ${this.std ? this.renderChildren(this.model) : nothing}
      </div>
    `
  }
}
