import { BlockComponent } from '@blocksuite/block-std'
import type { BulletBlockModel } from '../schemas/bullet-block-schema'
import { html, css, nothing, type TemplateResult } from 'lit'
import { customElement } from 'lit/decorators.js'

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
// EDITOR-3052: Cursor Position Helpers for Backspace/Delete/Enter splitting
// ============================================================================

/**
 * Get cursor position in a contenteditable element
 * Returns the offset from the start of the text content
 */
export function getCursorPosition(element: HTMLElement): number {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return 0

  const range = selection.getRangeAt(0)
  // Check if selection is within this element
  if (!element.contains(range.startContainer)) return 0

  // For text nodes, get offset directly
  if (range.startContainer.nodeType === Node.TEXT_NODE) {
    return range.startOffset
  }

  // For element nodes, calculate based on child position
  return 0
}

/**
 * Set cursor position in a contenteditable element
 * @param position - offset from start of text content
 */
export function setCursorPosition(element: HTMLElement, position: number): void {
  const textNode = element.firstChild
  if (!textNode) {
    // If empty, just focus the element
    element.focus()
    return
  }

  const range = document.createRange()
  const selection = window.getSelection()

  // Clamp position to valid range
  const maxPos = textNode.textContent?.length ?? 0
  const clampedPos = Math.min(Math.max(0, position), maxPos)

  range.setStart(textNode, clampedPos)
  range.collapse(true)

  selection?.removeAllRanges()
  selection?.addRange(range)
}

/**
 * Check if cursor is at the start of the text (position 0)
 */
export function isCursorAtStart(element: HTMLElement): boolean {
  return getCursorPosition(element) === 0
}

/**
 * Check if cursor is at the end of the text
 */
export function isCursorAtEnd(element: HTMLElement): boolean {
  const textLength = element.textContent?.length ?? 0
  return getCursorPosition(element) >= textLength
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
    // Set up event listeners on the contenteditable
    const contentDiv = this.querySelector('.bullet-content') as HTMLElement
    if (contentDiv) {
      // Set initial text from model
      const initialText = this.model.text.toString()
      contentDiv.textContent = initialText

      // Bind input handler for text sync
      contentDiv.addEventListener('input', (e: Event) => this._handleInput(e as InputEvent))

      // Bind keydown handler for shortcuts
      contentDiv.addEventListener('keydown', (e: Event) => this._handleKeydown(e as KeyboardEvent))

      // Observe model text changes (for y-indexeddb sync restoration)
      // Only update DOM when NOT focused (avoid cursor issues during typing)
      this.model.text.yText.observe(() => {
        const modelText = this.model.text.toString()
        // Only update DOM if:
        // 1. Text differs from model AND
        // 2. Element is not focused (not being edited) - prevents cursor reset issues
        const isNotFocused = document.activeElement !== contentDiv
        if (contentDiv.textContent !== modelText && isNotFocused) {
          contentDiv.textContent = modelText
        }
      })
    }
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
          this._toggleExpand()
          return true // Prevent default
        },

        // Tab to indent (make child of previous sibling)
        Tab: (ctx) => {
          ctx.get('defaultState').event.preventDefault()
          this._indent()
          return true
        },

        // Shift+Tab to outdent (make sibling of parent)
        'Shift-Tab': (ctx) => {
          ctx.get('defaultState').event.preventDefault()
          this._outdent()
          return true
        },

        // Enter to create new sibling bullet
        Enter: (ctx) => {
          ctx.get('defaultState').event.preventDefault()
          this._createSibling()
          return true
        },

        // Cmd+Enter to create child bullet
        'Mod-Enter': (ctx) => {
          ctx.get('defaultState').event.preventDefault()
          this._createChild()
          return true
        },

        // Arrow keys for navigation
        ArrowUp: () => {
          this._navigate('ArrowUp')
          return true
        },

        ArrowDown: () => {
          this._navigate('ArrowDown')
          return true
        },

        ArrowLeft: () => {
          this._handleArrowLeft()
          return true
        },

        ArrowRight: () => {
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
   */
  private _indent(): void {
    const ctx = this._getNavigationContext()
    if (!canIndent(ctx.previousSiblingId !== null, 0)) return

    const previousSibling = this.doc.getBlockById(ctx.previousSiblingId!)
    if (!previousSibling) return

    // Move this block to be the last child of the previous sibling
    this.doc.moveBlocks([this.model], previousSibling)

    // Maintain focus after indent
    this._focusBlockAtPosition(this.model.id, this._getCurrentCursorPosition())
  }

  /**
   * Outdent this block (make it a sibling of its parent)
   */
  private _outdent(): void {
    const parent = this.model.parent
    if (!parent || !parent.parent) return // Can't outdent root-level blocks

    const grandparent = parent.parent
    const parentIndex = grandparent.children.indexOf(parent)

    // Move this block to be after its parent in the grandparent's children
    this.doc.moveBlocks([this.model], grandparent, grandparent.children[parentIndex + 1])

    // Maintain focus after outdent
    this._focusBlockAtPosition(this.model.id, this._getCurrentCursorPosition())
  }

  /**
   * Get current cursor position from the contenteditable
   */
  private _getCurrentCursorPosition(): number {
    const contentDiv = this.querySelector('.bullet-content') as HTMLElement
    if (!contentDiv) return 0
    return getCursorPosition(contentDiv)
  }

  /**
   * Create a new sibling bullet after this one
   */
  private _createSibling(): void {
    const parent = this.model.parent
    if (!parent) return

    const siblings = parent.children
    const currentIndex = siblings.indexOf(this.model)

    // Add new block after current block (index is the position to insert at)
    const newBlockId = this.doc.addBlock(
      'hydra:bullet',
      { text: new this.doc.Text() },
      parent,
      currentIndex + 1
    )

    // Focus the new block
    this._focusBlock(newBlockId)
  }

  /**
   * Create a new child bullet
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

    // Focus the new block
    this._focusBlock(newBlockId)
  }

  /**
   * Navigate to a different block using visual tree traversal
   *
   * ArrowUp: Go to the visually previous bullet
   * - If has previous sibling: go to last visible descendant of that sibling
   * - If no previous sibling: go to parent
   *
   * ArrowDown: Go to the visually next bullet
   * - If expanded with children: go to first child
   * - If has next sibling: go to next sibling
   * - Otherwise: go to parent's next sibling (recursively)
   */
  private _navigate(direction: 'ArrowUp' | 'ArrowDown'): void {
    if (direction === 'ArrowUp') {
      this._navigateUp()
    } else {
      this._navigateDown()
    }
  }

  /**
   * Navigate up to the visually previous bullet
   */
  private _navigateUp(): void {
    const ctx = this._getNavigationContext()

    // If has previous sibling, go to last visible descendant of that sibling
    if (ctx.previousSiblingId) {
      const targetId = this._getLastVisibleDescendant(ctx.previousSiblingId)
      this._focusBlock(targetId)
      return
    }

    // Otherwise, go to parent
    if (ctx.parentId) {
      this._focusBlock(ctx.parentId)
    }
  }

  /**
   * Navigate down to the visually next bullet
   */
  private _navigateDown(): void {
    const ctx = this._getNavigationContext()

    // If expanded with children, go to first child
    if (ctx.hasChildren && ctx.isExpanded && ctx.firstChildId) {
      this._focusBlock(ctx.firstChildId)
      return
    }

    // Try to go to next sibling
    if (ctx.nextSiblingId) {
      this._focusBlock(ctx.nextSiblingId)
      return
    }

    // No next sibling - go up to find parent's next sibling
    const nextInTree = this._findNextInTree()
    if (nextInTree) {
      this._focusBlock(nextInTree)
    }
  }

  /**
   * Get the last visible descendant of a block
   * Traverses down through expanded children to find the last visible bullet
   */
  private _getLastVisibleDescendant(blockId: string): string {
    const block = this.doc.getBlockById(blockId)
    if (!block) return blockId

    const model = block as unknown as BulletBlockModel
    const hasChildren = model.children && model.children.length > 0
    const isExpanded = model.isExpanded

    // If expanded with children, recurse to last child
    if (hasChildren && isExpanded) {
      const lastChild = model.children[model.children.length - 1]
      return this._getLastVisibleDescendant(lastChild.id)
    }

    // Otherwise, this is the last visible descendant
    return blockId
  }

  /**
   * Find the next block in tree traversal (going up through parents)
   */
  private _findNextInTree(): string | null {
    let current = this.model
    let parent = current.parent

    while (parent && parent.parent) {
      const siblings = parent.children
      const currentIndex = siblings.indexOf(current)

      // If there's a next sibling at this level, return it
      if (currentIndex < siblings.length - 1) {
        return siblings[currentIndex + 1].id
      }

      // Otherwise, go up a level
      current = parent as BulletBlockModel
      parent = current.parent
    }

    return null
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
   * Focus a block by ID - focuses the contenteditable at the start
   */
  private _focusBlock(blockId: string): void {
    requestAnimationFrame(() => {
      const blockComponent = this.std.view.getBlock(blockId)
      if (blockComponent) {
        const contentDiv = blockComponent.querySelector('.bullet-content') as HTMLElement
        if (contentDiv) {
          contentDiv.focus()
          // Place cursor at start
          setCursorPosition(contentDiv, 0)
        }
      }
    })
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

  /**
   * Handle input events to sync contenteditable text to Yjs model
   */
  private _handleInput(e: InputEvent): void {
    const target = e.target as HTMLElement
    const newText = target.textContent || ''
    const currentText = this.model.text.toString()

    // Only update if text actually changed (avoid feedback loops)
    if (newText !== currentText) {
      // Update the Yjs text model
      this.model.text.delete(0, this.model.text.length)
      if (newText) {
        this.model.text.insert(newText, 0)
      }
    }
  }

  /**
   * Handle keydown events to intercept special keys before contenteditable
   */
  private _handleKeydown(e: KeyboardEvent): void {
    const contentDiv = e.target as HTMLElement

    // EDITOR-3052: Backspace at start of bullet - merge with previous
    if (e.key === 'Backspace' && !e.metaKey && !e.ctrlKey) {
      if (isCursorAtStart(contentDiv)) {
        e.preventDefault()
        this._handleBackspace()
        return
      }
      // Otherwise, let default backspace behavior (delete char)
      return
    }

    // EDITOR-3052: Delete at end of bullet - merge with next
    if (e.key === 'Delete' && !e.metaKey && !e.ctrlKey) {
      if (isCursorAtEnd(contentDiv)) {
        e.preventDefault()
        this._handleDelete()
        return
      }
      // Otherwise, let default delete behavior (delete char)
      return
    }

    // EDITOR-3052: Alt+Up - move bullet up
    if (e.key === 'ArrowUp' && e.altKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      this._moveSiblingUp()
      return
    }

    // EDITOR-3052: Alt+Down - move bullet down
    if (e.key === 'ArrowDown' && e.altKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      this._moveSiblingDown()
      return
    }

    // Enter creates a new sibling bullet (or splits if cursor in middle)
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      this._handleEnter(contentDiv)
      return
    }

    // Cmd/Ctrl+Enter creates a child bullet
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      this._createChild()
      return
    }

    // Tab indents
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault()
      this._indent()
      return
    }

    // Shift+Tab outdents
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault()
      this._outdent()
      return
    }

    // Cmd/Ctrl+. toggles expand/collapse
    if (e.key === '.' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      this._toggleExpand()
      return
    }

    // ArrowUp - navigate to previous bullet (without Alt modifier)
    if (e.key === 'ArrowUp' && !e.altKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      this._navigateUp()
      return
    }

    // ArrowDown - navigate to next bullet (without Alt modifier)
    if (e.key === 'ArrowDown' && !e.altKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      this._navigateDown()
      return
    }
  }

  // ============================================================================
  // EDITOR-3052: New Keyboard Behavior Handlers
  // ============================================================================

  /**
   * Handle Backspace at start of bullet - merge with previous or parent
   *
   * RemNote-like behavior:
   * - Empty bullet with previous sibling: delete and focus previous
   * - Empty bullet as first child: outdent (become sibling of parent)
   * - Non-empty with previous sibling: merge into previous
   * - Non-empty as first child: merge into parent
   * - Root-level first bullet: do nothing
   */
  private _handleBackspace(): void {
    const ctx = this._getNavigationContext()
    const currentText = this.model.text.toString()
    const parent = this.model.parent

    // Case 1: Empty bullet
    if (currentText.length === 0) {
      // Case 1a: Has previous sibling - delete and focus previous
      if (ctx.previousSiblingId) {
        const previousBlock = this.doc.getBlockById(ctx.previousSiblingId)
        if (previousBlock) {
          const prevModel = previousBlock as unknown as BulletBlockModel
          const prevTextLength = prevModel.text?.toString().length ?? 0

          // If current has children, reparent them to previous sibling
          if (this._hasChildren) {
            const children = [...this.model.children]
            this.doc.moveBlocks(children, previousBlock)
          }

          // Delete current block
          this.doc.deleteBlock(this.model)

          // Focus previous block at end
          this._focusBlockAtPosition(ctx.previousSiblingId, prevTextLength)
        }
        return
      }

      // Case 1b: First child (no previous sibling but has parent) - delete and focus parent
      if (parent && parent.parent && ctx.parentId) {
        const parentModel = parent as unknown as BulletBlockModel
        const parentTextLength = parentModel.text?.toString().length ?? 0

        // If current has children, reparent them to parent
        if (this._hasChildren) {
          const children = [...this.model.children]
          this.doc.moveBlocks(children, parent)
        }

        // Delete current block
        this.doc.deleteBlock(this.model)

        // Focus parent at end
        this._focusBlockAtPosition(ctx.parentId, parentTextLength)
        return
      }

      // Case 1c: Root-level first bullet - do nothing
      return
    }

    // Case 2: Non-empty bullet with previous sibling - merge with it
    if (ctx.previousSiblingId) {
      const previousBlock = this.doc.getBlockById(ctx.previousSiblingId)
      if (previousBlock) {
        const prevModel = previousBlock as unknown as BulletBlockModel
        const prevText = prevModel.text?.toString() ?? ''
        const prevTextLength = prevText.length

        // Append current text to previous
        if (prevModel.text) {
          prevModel.text.insert(currentText, prevTextLength)
        }

        // If current block has children, reparent them to previous
        if (this._hasChildren) {
          const children = [...this.model.children]
          this.doc.moveBlocks(children, previousBlock)
        }

        // Delete current block
        this.doc.deleteBlock(this.model)

        // Focus previous block at join point
        this._focusBlockAtPosition(ctx.previousSiblingId, prevTextLength)
      }
      return
    }

    // Case 3: First child (no previous sibling) - merge into parent
    if (parent && parent.parent && ctx.parentId) {
      const parentModel = parent as unknown as BulletBlockModel
      // Only merge if parent is a bullet block with text
      if (parentModel.text) {
        const parentText = parentModel.text.toString()
        const parentTextLength = parentText.length

        // Append current text to parent
        parentModel.text.insert(currentText, parentTextLength)

        // If current block has children, they become siblings (after this block's position in parent)
        if (this._hasChildren) {
          const children = [...this.model.children]
          // Move children to be children of parent (after current block, which we're about to delete)
          this.doc.moveBlocks(children, parent)
        }

        // Delete current block
        this.doc.deleteBlock(this.model)

        // Focus parent at join point
        this._focusBlockAtPosition(ctx.parentId, parentTextLength)
      }
      return
    }

    // Case 4: Root-level first bullet - do nothing
  }

  /**
   * Handle Delete at end of bullet - merge next sibling into current
   */
  private _handleDelete(): void {
    const ctx = this._getNavigationContext()

    // If no next sibling, do nothing
    if (!ctx.nextSiblingId) return

    const nextBlock = this.doc.getBlockById(ctx.nextSiblingId)
    if (!nextBlock) return

    const nextModel = nextBlock as unknown as BulletBlockModel
    const nextText = nextModel.text?.toString() ?? ''
    const currentTextLength = this.model.text.toString().length

    // Append next block's text to current
    if (nextText) {
      this.model.text.insert(nextText, currentTextLength)
    }

    // Sync DOM immediately (observer won't update while focused)
    const contentDiv = this.querySelector('.bullet-content') as HTMLElement
    if (contentDiv) {
      contentDiv.textContent = this.model.text.toString()
    }

    // If next block has children, reparent them to current
    const nextChildren = nextModel.children
    if (nextChildren && nextChildren.length > 0) {
      const children = [...nextChildren]
      this.doc.moveBlocks(children, this.model)
    }

    // Delete next block
    this.doc.deleteBlock(nextBlock)

    // Keep cursor at same position
    if (contentDiv) {
      setCursorPosition(contentDiv, currentTextLength)
    }
  }

  /**
   * Handle Enter - create sibling or split if cursor in middle
   *
   * RemNote-like behavior:
   * - Cursor at end: create new sibling below
   * - Cursor in middle with children: text after becomes FIRST CHILD
   * - Cursor in middle without children: text after becomes sibling
   * - Empty bullet (indented): outdent
   */
  private _handleEnter(contentDiv: HTMLElement): void {
    const currentText = this.model.text.toString()
    const cursorPos = getCursorPosition(contentDiv)

    // Case 1: Empty bullet - outdent if indented, otherwise create sibling
    if (currentText.length === 0) {
      const parent = this.model.parent
      if (parent && parent.parent) {
        // Has parent (indented) - outdent
        this._outdent()
        // Focus after outdent
        requestAnimationFrame(() => {
          const contentDiv = this.querySelector('.bullet-content') as HTMLElement
          if (contentDiv) {
            contentDiv.focus()
          }
        })
      }
      // If at root level, just create empty sibling (default behavior)
      else {
        this._createSibling()
      }
      return
    }

    // Case 2: Cursor at end
    if (cursorPos >= currentText.length) {
      // If has children, create child instead of sibling (RemNote behavior)
      if (this._hasChildren) {
        this._createChild()
      } else {
        this._createSibling()
      }
      return
    }

    // Case 3: Cursor in middle - split the bullet
    const textBefore = currentText.slice(0, cursorPos)
    const textAfter = currentText.slice(cursorPos)

    // Update current bullet to text before cursor
    this.model.text.delete(0, this.model.text.length)
    if (textBefore) {
      this.model.text.insert(textBefore, 0)
    }

    // Sync DOM immediately (observer won't update while focused)
    contentDiv.textContent = textBefore

    // If block has children, text after cursor becomes FIRST CHILD (RemNote behavior)
    if (this._hasChildren) {
      // Expand if collapsed
      if (!this.model.isExpanded) {
        this.doc.updateBlock(this.model, { isExpanded: true })
      }

      // Create new block as first child (index 0)
      const newBlockId = this.doc.addBlock(
        'hydra:bullet',
        { text: new this.doc.Text(textAfter) },
        this.model,
        0
      )

      // Focus new block at start
      this._focusBlockAtPosition(newBlockId, 0)
      return
    }

    // If no children, text after becomes sibling
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

    // Focus new block at start
    this._focusBlockAtPosition(newBlockId, 0)
  }

  /**
   * Move this bullet up (swap with previous sibling)
   */
  private _moveSiblingUp(): void {
    const ctx = this._getNavigationContext()
    if (!ctx.previousSiblingId) return

    const parent = this.model.parent
    if (!parent) return

    const siblings = parent.children
    const currentIndex = siblings.indexOf(this.model)
    if (currentIndex <= 0) return

    // Move this block before the previous sibling
    const previousSibling = siblings[currentIndex - 1]
    this.doc.moveBlocks([this.model], parent, previousSibling)
  }

  /**
   * Move this bullet down (swap with next sibling)
   */
  private _moveSiblingDown(): void {
    const ctx = this._getNavigationContext()
    if (!ctx.nextSiblingId) return

    const parent = this.model.parent
    if (!parent) return

    const siblings = parent.children
    const currentIndex = siblings.indexOf(this.model)
    if (currentIndex >= siblings.length - 1) return

    // Move this block after the next sibling
    const afterNext = siblings[currentIndex + 2] // block to insert before, or undefined if at end
    this.doc.moveBlocks([this.model], parent, afterNext)
  }

  /**
   * Focus a block at a specific cursor position
   */
  private _focusBlockAtPosition(blockId: string, position: number): void {
    requestAnimationFrame(() => {
      const blockComponent = this.std.view.getBlock(blockId)
      if (blockComponent) {
        const contentDiv = blockComponent.querySelector('.bullet-content') as HTMLElement
        if (contentDiv) {
          contentDiv.focus()
          setCursorPosition(contentDiv, position)
        }
      }
    })
  }

  override renderBlock(): TemplateResult {
    const childrenClass = this.model.isExpanded ? '' : 'collapsed'

    return html`
      <div class="bullet-container">
        ${this._renderToggle()}
        <div
          class="bullet-content"
          contenteditable="true"
          data-placeholder="Type here..."
        ></div>
        ${this._renderInlinePreview()}
      </div>
      <div class="bullet-children ${childrenClass}">
        ${this.std ? this.renderChildren(this.model) : nothing}
      </div>
    `
  }
}
