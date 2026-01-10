import { BlockComponent } from '@blocksuite/block-std'
import type { BulletBlockModel } from '../schemas/bullet-block-schema'
import { html, css, type TemplateResult } from 'lit'
import { customElement } from 'lit/decorators.js'

/**
 * Bullet block component for Hydra Notes.
 *
 * Renders a hierarchical bullet point with:
 * - Expand/collapse toggle for folding
 * - Editable text content
 * - Nested child bullets
 */
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
  `

  /**
   * Bound keyboard handler reference for cleanup
   */
  private _boundKeydownHandler = this._handleKeydown.bind(this)

  /**
   * Check if this block has children.
   * Computed dynamically in render to stay in sync.
   */
  private get _hasChildren(): boolean {
    return this.model.children.length > 0
  }

  override connectedCallback(): void {
    super.connectedCallback()
    // Listen for keyboard shortcuts on the host element
    this.addEventListener('keydown', this._boundKeydownHandler)
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('keydown', this._boundKeydownHandler)
  }

  /**
   * Handle keyboard shortcuts for fold toggle (Cmd+. / Ctrl+.)
   */
  private _handleKeydown(event: KeyboardEvent): void {
    if (shouldHandleFoldShortcut(event)) {
      event.preventDefault()
      event.stopPropagation()
      this._toggleExpand()
    }
  }

  private _toggleExpand(): void {
    if (!this._hasChildren) return

    this.doc.updateBlock(this.model, {
      isExpanded: !this.model.isExpanded,
    })
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
      </div>
      <div class="bullet-children ${childrenClass}">
        ${this.renderChildren(this.model)}
      </div>
    `
  }
}
