import { BlockComponent } from '@blocksuite/block-std'
import { customElement } from 'lit/decorators.js'
import { html, css, nothing, type TemplateResult } from 'lit'
import type { PortalBlockModel, SyncStatus } from '../schemas/portal-block-schema'
import {
  createSourceObserver,
  type SourceObserver,
  debounce,
  SYNC_DEBOUNCE_DELAY,
} from '../utils/portal-sync'

/**
 * Display state for portal rendering
 */
export type PortalDisplayState =
  | 'loading'
  | 'orphaned'
  | 'collapsed'
  | 'expanded'
  | 'stale'

/**
 * Compute the display state for a portal based on its properties
 */
export function getPortalDisplayState(params: {
  syncStatus: SyncStatus
  isCollapsed: boolean
  isLoading: boolean
  sourceExists: boolean
}): PortalDisplayState {
  const { syncStatus, isCollapsed, isLoading, sourceExists } = params

  if (isLoading) return 'loading'
  if (syncStatus === 'orphaned' || !sourceExists) return 'orphaned'
  if (syncStatus === 'stale') return 'stale'
  if (isCollapsed) return 'collapsed'
  return 'expanded'
}

/**
 * Get the human-readable label for sync status
 */
export function getSyncStatusLabel(status: SyncStatus): string {
  switch (status) {
    case 'synced':
      return ''
    case 'stale':
      return 'Updating...'
    case 'orphaned':
      return 'Source deleted'
  }
}

/**
 * Get the CSS class for sync status styling
 */
export function getSyncStatusClass(status: SyncStatus): string {
  switch (status) {
    case 'synced':
      return ''
    case 'stale':
      return 'portal-stale'
    case 'orphaned':
      return 'portal-orphaned'
  }
}

/**
 * Determine if source content should be shown
 */
export function shouldShowSourceContent(params: {
  syncStatus: SyncStatus
  isCollapsed: boolean
  sourceExists: boolean
}): boolean {
  const { syncStatus, isCollapsed, sourceExists } = params

  if (isCollapsed) return false
  if (syncStatus === 'orphaned' || !sourceExists) return false
  return true
}

/**
 * Portal Block Component
 *
 * Renders a live-syncing embed that references and displays content from another bullet.
 * Features:
 * - Distinctive "cool border" styling to distinguish from regular bullets
 * - Collapsed/expanded state for portal content
 * - Visual indicators for sync status (synced, stale, orphaned)
 * - Source location hint showing where the content comes from
 */
@customElement('hydra-portal-block')
export class HydraPortalBlock extends BlockComponent<PortalBlockModel> {
  static override styles = css`
    :host {
      display: block;
      margin: 4px 0;
    }

    .portal-container {
      position: relative;
      padding: 12px 16px;
      border-radius: 8px;
      border-left: 3px solid #6366f1;
      background: linear-gradient(
        135deg,
        rgba(99, 102, 241, 0.05) 0%,
        rgba(99, 102, 241, 0.02) 100%
      );
      transition: all 0.2s ease;
    }

    .portal-container:hover {
      background: linear-gradient(
        135deg,
        rgba(99, 102, 241, 0.08) 0%,
        rgba(99, 102, 241, 0.04) 100%
      );
    }

    /* Loading state */
    .portal-container.portal-loading {
      border-left-style: dashed;
      border-left-color: #9ca3af;
      background: rgba(156, 163, 175, 0.05);
    }

    /* Orphaned state */
    .portal-container.portal-orphaned {
      border-left-style: dashed;
      border-left-color: #ef4444;
      background: rgba(239, 68, 68, 0.05);
    }

    /* Stale state */
    .portal-container.portal-stale {
      border-left-color: #f59e0b;
      background: rgba(245, 158, 11, 0.05);
    }

    /* Collapsed state */
    .portal-container.portal-collapsed {
      padding: 8px 16px;
    }

    .portal-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .portal-collapsed .portal-header {
      margin-bottom: 0;
    }

    .portal-icon {
      font-size: 14px;
      cursor: pointer;
      user-select: none;
    }

    .portal-icon:hover {
      opacity: 0.7;
    }

    .portal-source-hint {
      font-size: 12px;
      color: #6b7280;
      font-style: italic;
    }

    .portal-status {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: auto;
    }

    .portal-status.stale {
      background: #fef3c7;
      color: #92400e;
    }

    .portal-status.orphaned {
      background: #fee2e2;
      color: #991b1b;
    }

    .portal-content {
      padding-left: 22px;
    }

    .portal-content.hidden {
      display: none;
    }

    .portal-orphaned-message {
      padding: 8px 12px;
      background: #fef2f2;
      border-radius: 4px;
      color: #991b1b;
      font-size: 13px;
    }

    .portal-loading-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #6b7280;
      font-size: 13px;
    }

    .portal-loading-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid #e5e7eb;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* Source block content wrapper */
    .source-block-content {
      font-size: 14px;
      line-height: 1.6;
      color: #374151;
    }

    .source-preview {
      font-size: 13px;
      color: #6b7280;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 300px;
    }
  `

  private _isLoading = true
  private _sourceText = ''
  private _sourceDocName: string | null = null
  private _sourceObserver: SourceObserver | null = null

  private _debouncedUpdate = debounce((newText: string) => {
    this._sourceText = newText
    // Update sync status to synced after receiving the update
    if (this.model.syncStatus === 'stale') {
      this.doc.updateBlock(this.model, { syncStatus: 'synced' })
    }
    // Trigger re-render
    this.requestUpdate()
  }, SYNC_DEBOUNCE_DELAY)

  override connectedCallback(): void {
    super.connectedCallback()
    this._setupSourceObserver()
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this._cleanupSourceObserver()
  }

  override renderBlock(): TemplateResult {
    const displayState = getPortalDisplayState({
      syncStatus: this.model.syncStatus,
      isCollapsed: this.model.isCollapsed,
      isLoading: this._isLoading,
      sourceExists: !!this._sourceText || this._isLoading,
    })

    const statusLabel = getSyncStatusLabel(this.model.syncStatus)
    const statusClass = getSyncStatusClass(this.model.syncStatus)

    const containerClasses = [
      'portal-container',
      displayState === 'loading' ? 'portal-loading' : '',
      displayState === 'orphaned' ? 'portal-orphaned' : '',
      displayState === 'stale' ? 'portal-stale' : '',
      displayState === 'collapsed' ? 'portal-collapsed' : '',
    ]
      .filter(Boolean)
      .join(' ')

    return html`
      <div class=${containerClasses}>
        <div class="portal-header">
          <span class="portal-icon" @click=${this._toggleCollapse}>
            ${this.model.isCollapsed ? '🔗' : '📎'}
          </span>
          <span class="portal-source-hint">
            ${this._formatSourceHint()}
          </span>
          ${statusLabel
            ? html`<span class="portal-status ${statusClass === 'portal-stale' ? 'stale' : 'orphaned'}"
                >${statusLabel}</span
              >`
            : nothing}
        </div>

        ${this._renderContent(displayState)}
      </div>
    `
  }

  private _renderContent(displayState: PortalDisplayState): TemplateResult {
    switch (displayState) {
      case 'loading':
        return html`
          <div class="portal-content">
            <div class="portal-loading-indicator">
              <div class="portal-loading-spinner"></div>
              <span>Loading source...</span>
            </div>
          </div>
        `

      case 'orphaned':
        return html`
          <div class="portal-content">
            <div class="portal-orphaned-message">
              The source block has been deleted. This portal is now orphaned.
            </div>
          </div>
        `

      case 'collapsed':
        return html`
          <div class="source-preview">${this._sourceText || 'Empty'}</div>
        `

      case 'stale':
      case 'expanded':
        return html`
          <div class="portal-content">
            <div class="source-block-content">${this._sourceText}</div>
          </div>
        `
    }
  }

  private _toggleCollapse(): void {
    this.doc.updateBlock(this.model, {
      isCollapsed: !this.model.isCollapsed,
    })
  }

  private _formatSourceHint(): string {
    const docName = this._sourceDocName
    const preview = this._sourceText

    if (!docName && !this.model.sourceDocId) return 'Unknown source'
    if (!preview) return `from: ${docName || 'Document'}`

    const truncatedPreview =
      preview.length > 30 ? preview.substring(0, 30) + '...' : preview
    return `from: ${docName || 'Document'} • "${truncatedPreview}"`
  }

  /**
   * Sets up the Yjs observer for live sync with the source block
   */
  private _setupSourceObserver(): void {
    this._isLoading = true
    this._cleanupSourceObserver()
    this.requestUpdate()

    // For same-document portals, set up direct Yjs observation
    this._sourceObserver = createSourceObserver({
      doc: this.doc,
      sourceBlockId: this.model.sourceBlockId,
      onTextChange: (newText: string) => {
        this._isLoading = false
        this._sourceDocName = 'This document'
        this._debouncedUpdate(newText)
      },
      onOrphaned: () => {
        this._isLoading = false
        this.doc.updateBlock(this.model, {
          syncStatus: 'orphaned',
        })
        this.requestUpdate()
      },
    })
  }

  /**
   * Cleans up the source observer on unmount
   */
  private _cleanupSourceObserver(): void {
    if (this._sourceObserver) {
      this._sourceObserver.dispose()
      this._sourceObserver = null
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hydra-portal-block': HydraPortalBlock
  }
}
