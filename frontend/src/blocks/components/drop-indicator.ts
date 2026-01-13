import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { DropPlacement } from '../utils/drag-drop'

/**
 * EDITOR-3507: Drop indicator component for drag-and-drop operations.
 *
 * Shows a visual indicator where the dragged block(s) will be placed:
 * - 'before': Line above the target block
 * - 'after': Line below the target block
 * - 'in': Highlight indicating nesting as child
 */
@customElement('hydra-drop-indicator')
export class HydraDropIndicator extends LitElement {
  @property({ type: String })
  placement: DropPlacement = 'after'

  @property({ type: Boolean })
  visible = false

  static override styles = css`
    :host {
      display: block;
      position: absolute;
      left: 0;
      right: 0;
      pointer-events: none;
      z-index: 100;
    }

    :host([hidden]) {
      display: none;
    }

    .drop-indicator {
      position: absolute;
      left: 24px; /* Account for grip handle width */
      right: 0;
      transition: opacity 0.15s ease;
    }

    .drop-indicator.before {
      top: -1px;
      height: 2px;
      background: var(--affine-primary-color, #1976d2);
      border-radius: 1px;
    }

    .drop-indicator.after {
      bottom: -1px;
      height: 2px;
      background: var(--affine-primary-color, #1976d2);
      border-radius: 1px;
    }

    .drop-indicator.in {
      top: 0;
      bottom: 0;
      left: 40px; /* Further indent to show nesting */
      background: var(--affine-primary-color, #1976d2);
      opacity: 0.15;
      border-radius: 4px;
    }

    /* Indicator circle at the start of the line */
    .drop-indicator.before::before,
    .drop-indicator.after::before {
      content: '';
      position: absolute;
      left: -4px;
      top: -3px;
      width: 8px;
      height: 8px;
      background: var(--affine-primary-color, #1976d2);
      border-radius: 50%;
    }
  `

  override render() {
    if (!this.visible) {
      return html``
    }

    return html`
      <div
        class="drop-indicator ${this.placement}"
        role="presentation"
        aria-hidden="true"
      ></div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hydra-drop-indicator': HydraDropIndicator
  }
}
