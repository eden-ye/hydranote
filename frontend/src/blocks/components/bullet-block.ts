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
   * Handle Enter key - split text at cursor position or create empty sibling.
   * If cursor is at end or text is empty, just create new sibling.
   * If cursor is in middle, split the text.
   */
  private _handleEnter(): void {
    const cursorPos = this._getCursorPosition()
    const currentText = this.model.text.toString()

    // If at end or empty, just create a new sibling
    if (cursorPos >= currentText.length) {
      this._createSibling()
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

    // Update the DOM immediately to reflect the change
    const contentDiv = this.querySelector('.bullet-content') as HTMLElement
    if (contentDiv) {
      contentDiv.textContent = textBefore
    }

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

    // Focus the new block at the start
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
   * Focus a block by ID
   */
  private _focusBlock(blockId: string): void {
    // Use BlockSuite's selection system to focus the block
    requestAnimationFrame(() => {
      const blockComponent = this.std.view.getBlock(blockId)
      if (blockComponent) {
        this.std.selection.setGroup('note', [
          this.std.selection.create('text', {
            from: { blockId, index: 0, length: 0 },
            to: null,
          }),
        ])
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
   * Get the cursor position within the contenteditable element.
   * Returns 0 if at the start, or the character offset.
   */
  private _getCursorPosition(): number {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return 0

    const range = selection.getRangeAt(0)
    const contentDiv = this.querySelector('.bullet-content') as HTMLElement
    if (!contentDiv) return 0

    // Check if selection is within our content div
    if (!contentDiv.contains(range.startContainer)) return 0

    // Create a range from start of content to cursor position
    const preCaretRange = document.createRange()
    preCaretRange.selectNodeContents(contentDiv)
    preCaretRange.setEnd(range.startContainer, range.startOffset)

    return preCaretRange.toString().length
  }

  /**
   * Handle Backspace at the start of a bullet.
   * Merges content with the previous sibling and deletes this block.
   */
  private _handleBackspaceAtStart(): void {
    const ctx = this._getNavigationContext()
    if (!ctx.previousSiblingId) return // No previous sibling to merge with

    const previousBlock = this.doc.getBlockById(ctx.previousSiblingId) as BulletBlockModel | null
    if (!previousBlock) return

    const currentText = this.model.text.toString()
    const previousText = previousBlock.text.toString()
    const mergePoint = previousText.length

    // Merge: append current text to previous block's text
    if (currentText) {
      previousBlock.text.insert(currentText, mergePoint)
    }

    // Store refs before deletion invalidates this.model
    const blockToDelete = this.model
    const doc = this.doc
    const std = this.std
    const previousBlockId = ctx.previousSiblingId

    // CRITICAL: Defer deletion to next frame to avoid render cycle issue
    // After deleteBlock(), this.model becomes null but render() may still fire
    requestAnimationFrame(() => {
      doc.deleteBlock(blockToDelete)

      // Focus previous block at the merge point
      requestAnimationFrame(() => {
        const blockComponent = std.view.getBlock(previousBlockId)
        if (blockComponent) {
          std.selection.setGroup('note', [
            std.selection.create('text', {
              from: { blockId: previousBlockId, index: mergePoint, length: 0 },
              to: null,
            }),
          ])

          // Also set the DOM cursor position
          const contentDiv = blockComponent.querySelector('.bullet-content') as HTMLElement
          if (contentDiv) {
            const range = document.createRange()
            const selection = window.getSelection()

            // Find the text node and set cursor at merge point
            if (contentDiv.firstChild && contentDiv.firstChild.nodeType === Node.TEXT_NODE) {
              const textNode = contentDiv.firstChild
              const pos = Math.min(mergePoint, textNode.textContent?.length ?? 0)
              range.setStart(textNode, pos)
              range.collapse(true)
              selection?.removeAllRanges()
              selection?.addRange(range)
            }
            contentDiv.focus()
          }
        }
      })
    })
  }

  /**
   * Handle keydown events to intercept special keys before contenteditable
   */
  private _handleKeydown(e: KeyboardEvent): void {
    // Backspace at start of line merges with previous sibling
    if (e.key === 'Backspace') {
      const cursorPos = this._getCursorPosition()
      if (cursorPos === 0) {
        e.preventDefault()
        this._handleBackspaceAtStart()
        return
      }
    }

    // Enter creates a new sibling bullet (or splits if in middle of text)
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      this._handleEnter()
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
  }

  /**
   * Override base render() to guard against null model.
   * This is necessary because BlockSuite's BlockComponent.render() accesses
   * this.model.id before calling renderBlock(). After deleteBlock(), this.model
   * becomes null but Lit may still trigger a render.
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
