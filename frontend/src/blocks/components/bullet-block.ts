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
 * Compute the indent level (depth) of a block
 */
export function computeIndentLevel(depth: number): number {
  return depth
}

/**
 * Check if a block can be indented (moved to become child of previous sibling)
 * Can only indent if there's a previous sibling to become parent
 */
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
    this._bindKeyboardShortcuts()
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
    const nextSibling = siblings[currentIndex + 1]

    // Add new block after current block
    const newBlockId = this.doc.addBlock(
      'hydra:bullet',
      { text: new this.doc.Text() },
      parent,
      nextSibling ? nextSibling : undefined
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

    // Add new block as first child
    const newBlockId = this.doc.addBlock(
      'hydra:bullet',
      { text: new this.doc.Text() },
      this.model,
      this.model.children[0]
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

  override renderBlock(): TemplateResult {
    const childrenClass = this.model.isExpanded ? '' : 'collapsed'

    return html`
      <div class="bullet-container">
        ${this._renderToggle()}
        <div
          class="bullet-content"
          contenteditable="true"
          data-placeholder="Type here..."
        >
          ${this.model.text.toString()}
        </div>
        ${this._renderInlinePreview()}
      </div>
      <div class="bullet-children ${childrenClass}">
        ${this.renderChildren(this.model)}
      </div>
    `
  }
}
