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
import {
  isPortalEditable,
  shouldShowEditWarning,
  getEditingIndicator,
  getEditingClasses,
  getEditWarningMessage,
} from '../utils/portal-editing'
import {
  fetchSubtreeFromDoc,
  getIndentationPx,
  type SubtreeNode,
  type SubtreeFetchResult,
  DEFAULT_MAX_DEPTH,
} from '../utils/portal-subtree'
import type { Text } from '@blocksuite/store'

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

    /* EDITOR-3404: Editing state styles */
    .portal-container.portal-editing {
      border-left-width: 4px;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }

    .portal-container.portal-syncing {
      border-left-color: #10b981;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
    }

    /* Rich-text editing area in portal */
    .portal-editable-content {
      padding-left: 22px;
    }

    .portal-editable-content rich-text {
      font-size: 14px;
      line-height: 1.6;
      color: #374151;
      outline: none;
    }

    /* Edit warning banner */
    .portal-edit-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #fef3c7;
      border-radius: 4px;
      font-size: 12px;
      color: #92400e;
      margin-bottom: 8px;
    }

    .portal-edit-warning-icon {
      flex-shrink: 0;
    }

    .portal-edit-warning-dismiss {
      margin-left: auto;
      padding: 2px 8px;
      background: #f59e0b;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .portal-edit-warning-dismiss:hover {
      background: #d97706;
    }

    /* Edit indicator badge */
    .portal-edit-indicator {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      background: #dbeafe;
      color: #1e40af;
      margin-left: 8px;
    }

    /* EDITOR-3504: Portal Subtree Styles */
    .portal-subtree {
      padding-left: 8px;
      margin-top: 8px;
    }

    .portal-subtree-node {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      padding: 4px 0;
      font-size: 14px;
      line-height: 1.5;
      color: #374151;
    }

    .portal-subtree-node:hover {
      background: rgba(99, 102, 241, 0.04);
      border-radius: 4px;
    }

    .portal-subtree-icon {
      font-size: 12px;
      cursor: pointer;
      user-select: none;
      min-width: 14px;
      text-align: center;
      color: #9ca3af;
      margin-top: 2px;
    }

    .portal-subtree-icon:hover {
      color: #6366f1;
    }

    .portal-subtree-icon.leaf {
      cursor: default;
    }

    .portal-subtree-icon.leaf:hover {
      color: #9ca3af;
    }

    .portal-subtree-text {
      flex: 1;
      min-width: 0;
    }

    .portal-subtree-text.collapsed {
      color: #6b7280;
    }

    .portal-subtree-children-count {
      font-size: 11px;
      color: #9ca3af;
      margin-left: 4px;
    }

    .portal-subtree-depth-warning {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #fef3c7;
      border-radius: 4px;
      font-size: 12px;
      color: #92400e;
      margin-top: 8px;
    }

    .portal-subtree-loading {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
      color: #6b7280;
      font-size: 13px;
    }
  `

  private _isLoading = true
  private _sourceText = ''
  private _sourceDocName: string | null = null
  private _sourceObserver: SourceObserver | null = null

  // EDITOR-3404: Editing state
  private _isEditing = false
  private _isSyncing = false
  private _hasEditedBefore = false
  private _warningDismissed = false
  private _sourceYText: Text | null = null

  // EDITOR-3405 BUGFIX: Track model initialization errors
  // BlockSuite's model getter throws if model not found, so we need error state
  private _modelError = false

  // EDITOR-3504: Subtree state
  private _subtreeResult: SubtreeFetchResult | null = null
  private _subtreeLoading = false
  // Track which nodes are collapsed within the subtree (by block ID)
  // This is separate from the source block's actual isExpanded state
  // to allow per-level collapse in the portal view
  private _collapsedSubtreeNodes: Set<string> = new Set()

  /**
   * Safe model accessor that catches BlockSuiteError when model is missing.
   * The base class `model` getter throws if the model isn't found in the store,
   * which happens for orphaned portal blocks persisted in IndexedDB.
   */
  private get _safeModel(): PortalBlockModel | null {
    if (this._modelError) return null
    try {
      return this.model
    } catch {
      // BlockSuiteError: MissingViewModelError
      return null
    }
  }

  private _debouncedUpdate = debounce((newText: string) => {
    this._sourceText = newText
    // Update sync status to synced after receiving the update
    const model = this._safeModel
    if (model && model.syncStatus === 'stale') {
      this.doc.updateBlock(model, { syncStatus: 'synced' })
    }
    // Trigger re-render
    this.requestUpdate()
  }, SYNC_DEBOUNCE_DELAY)

  override connectedCallback(): void {
    // EDITOR-3405 BUGFIX: The base class connectedCallback() accesses this.model.id
    // which throws BlockSuiteError if model is missing (orphaned portal in IndexedDB).
    // We must catch this error to prevent the app from crashing on load.
    try {
      super.connectedCallback()
    } catch (error) {
      console.warn('PortalBlock: Failed to connect, model may be orphaned', error)
      this._modelError = true
      // Still call LitElement's connectedCallback for proper Lit lifecycle
      // but skip our observer setup since model is invalid
      return
    }
    this._setupSourceObserver()
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this._cleanupSourceObserver()
  }

  /**
   * EDITOR-3405 BUGFIX: Override render() to guard before the renderer chain.
   * The base class render() runs a chain of renderers that access this.model,
   * which throws for orphaned blocks. We must guard BEFORE the chain runs.
   */
  override render(): TemplateResult | typeof nothing {
    // Check if model is accessible before running parent's renderer chain
    const model = this._safeModel
    if (!model || this._modelError) {
      // Render fallback UI for orphaned/invalid portals
      return html`
        <div class="portal-container portal-orphaned">
          <div class="portal-content">
            <div class="portal-orphaned-message">
              Invalid portal block (missing model). Please delete this block.
            </div>
          </div>
        </div>
      `
    }
    // Model is valid, use parent's rendering chain
    return super.render() as TemplateResult
  }

  override renderBlock(): TemplateResult {
    // Note: render() guard ensures model is valid when renderBlock is called,
    // but we use _safeModel for extra safety and to satisfy TypeScript
    const model = this._safeModel
    if (!model) {
      // This shouldn't happen due to render() guard, but handle gracefully
      return html`
        <div class="portal-container portal-orphaned">
          <div class="portal-content">
            <div class="portal-orphaned-message">
              Invalid portal block (missing model). Please delete this block.
            </div>
          </div>
        </div>
      `
    }

    const displayState = getPortalDisplayState({
      syncStatus: model.syncStatus,
      isCollapsed: model.isCollapsed,
      isLoading: this._isLoading,
      sourceExists: !!this._sourceText || this._isLoading,
    })

    const statusLabel = getSyncStatusLabel(model.syncStatus)
    const statusClass = getSyncStatusClass(model.syncStatus)

    // EDITOR-3404: Compute editing indicator and classes
    const isEditable = isPortalEditable({
      isCollapsed: model.isCollapsed,
      isOrphaned: model.syncStatus === 'orphaned',
      isLoading: this._isLoading,
    })
    const editingIndicator = getEditingIndicator({
      isEditing: this._isEditing,
      isSyncing: this._isSyncing,
      isEditable,
    })
    const editingClasses = getEditingClasses(editingIndicator)

    const containerClasses = [
      'portal-container',
      displayState === 'loading' ? 'portal-loading' : '',
      displayState === 'orphaned' ? 'portal-orphaned' : '',
      displayState === 'stale' ? 'portal-stale' : '',
      displayState === 'collapsed' ? 'portal-collapsed' : '',
      ...editingClasses, // EDITOR-3404: Add editing state classes
    ]
      .filter(Boolean)
      .join(' ')

    return html`
      <div class=${containerClasses}>
        <div class="portal-header">
          <span class="portal-icon" @click=${this._toggleCollapse}>
            ${model.isCollapsed ? '🔗' : '📎'}
          </span>
          <span class="portal-source-hint">
            ${this._formatSourceHint()}
          </span>
          ${this._isEditing
            ? html`<span class="portal-edit-indicator">Editing source</span>`
            : nothing}
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
        // EDITOR-3404: Render rich-text for editable portal content
        return this._renderEditableContent()
    }
  }

  /**
   * EDITOR-3404: Render editable content with rich-text bound to source Y.Text
   * EDITOR-3504: Also render subtree when source block has children
   */
  private _renderEditableContent(): TemplateResult {
    // Check if editing should show warning
    const showWarning = shouldShowEditWarning({
      hasEditedBefore: this._hasEditedBefore,
      warningDismissed: this._warningDismissed,
    })

    // If we don't have the source Y.Text yet, show text-only content
    if (!this._sourceYText) {
      return html`
        <div class="portal-content">
          <div class="source-block-content">${this._sourceText}</div>
          ${this._renderSubtree()}
        </div>
      `
    }

    return html`
      ${showWarning ? this._renderEditWarning() : nothing}
      <div class="portal-editable-content">
        <rich-text
          .yText=${this._sourceYText.yText}
          .enableFormat=${true}
          .enableClipboard=${true}
          .enableUndoRedo=${true}
          .readonly=${false}
          @focus=${this._handleFocus}
          @blur=${this._handleBlur}
        ></rich-text>
      </div>
      ${this._renderSubtree()}
    `
  }

  /**
   * EDITOR-3504: Render the subtree of the source block
   */
  private _renderSubtree(): TemplateResult {
    // Fetch subtree if not already loaded
    if (!this._subtreeResult && !this._subtreeLoading) {
      this._fetchSubtree()
    }

    // Loading state
    if (this._subtreeLoading) {
      return html`
        <div class="portal-subtree-loading">
          <div class="portal-loading-spinner"></div>
          <span>Loading children...</span>
        </div>
      `
    }

    // No subtree data
    if (!this._subtreeResult || !this._subtreeResult.root) {
      return html``
    }

    // Get children of the source block (not the source block itself)
    const sourceChildren = this._subtreeResult.root.children
    if (sourceChildren.length === 0) {
      return html`` // No children to display
    }

    // Apply local collapse state to subtree
    const subtreeWithCollapseState = this._applyLocalCollapseState(this._subtreeResult.root)

    // Get only the children (skip the root itself since it's already shown)
    const nodesToRender = subtreeWithCollapseState.children.length > 0
      ? this._flattenChildren(subtreeWithCollapseState)
      : []

    return html`
      <div class="portal-subtree">
        ${nodesToRender.map((node) => this._renderSubtreeNode(node))}
        ${this._subtreeResult.depthLimited
          ? html`
              <div class="portal-subtree-depth-warning">
                <span>⚠️</span>
                <span>Depth limit (${DEFAULT_MAX_DEPTH} levels) reached. Some nested content may be hidden.</span>
              </div>
            `
          : nothing}
      </div>
    `
  }

  /**
   * EDITOR-3504: Flatten children of a node for rendering (skipping the root)
   */
  private _flattenChildren(root: SubtreeNode): SubtreeNode[] {
    const result: SubtreeNode[] = []

    const traverse = (node: SubtreeNode) => {
      // Add this node (but not the root)
      if (node.depth > 0) {
        result.push(node)
      }

      // Add children if expanded in local state
      const isCollapsed = this._collapsedSubtreeNodes.has(node.id)
      if (!isCollapsed) {
        for (const child of node.children) {
          traverse(child)
        }
      }
    }

    traverse(root)
    return result
  }

  /**
   * EDITOR-3504: Apply local collapse state to a subtree
   * Returns a new tree with isExpanded reflecting local state
   */
  private _applyLocalCollapseState(node: SubtreeNode): SubtreeNode {
    const isCollapsed = this._collapsedSubtreeNodes.has(node.id)
    return {
      ...node,
      isExpanded: !isCollapsed,
      children: node.children.map((child) => this._applyLocalCollapseState(child)),
    }
  }

  /**
   * EDITOR-3504: Render a single subtree node
   */
  private _renderSubtreeNode(node: SubtreeNode): TemplateResult {
    const isLeaf = node.children.length === 0
    const isCollapsed = this._collapsedSubtreeNodes.has(node.id)
    const icon = isLeaf ? '•' : isCollapsed ? '▶' : '▼'
    const indent = getIndentationPx(node.depth - 1, 20) // -1 because we skip root

    return html`
      <div
        class="portal-subtree-node"
        style="padding-left: ${indent}px"
      >
        <span
          class="portal-subtree-icon ${isLeaf ? 'leaf' : ''}"
          @click=${() => !isLeaf && this._toggleSubtreeNode(node.id)}
        >
          ${icon}
        </span>
        <span class="portal-subtree-text ${isCollapsed && !isLeaf ? 'collapsed' : ''}">
          ${node.text || '(empty)'}
          ${isCollapsed && node.children.length > 0
            ? html`<span class="portal-subtree-children-count">(${this._countAllDescendants(node)} items)</span>`
            : nothing}
        </span>
      </div>
    `
  }

  /**
   * EDITOR-3504: Count all descendants of a node
   */
  private _countAllDescendants(node: SubtreeNode): number {
    let count = node.children.length
    for (const child of node.children) {
      count += this._countAllDescendants(child)
    }
    return count
  }

  /**
   * EDITOR-3504: Toggle collapse state of a subtree node
   */
  private _toggleSubtreeNode(nodeId: string): void {
    if (this._collapsedSubtreeNodes.has(nodeId)) {
      this._collapsedSubtreeNodes.delete(nodeId)
    } else {
      this._collapsedSubtreeNodes.add(nodeId)
    }
    this.requestUpdate()
  }

  /**
   * EDITOR-3504: Fetch the subtree from the source block
   */
  private _fetchSubtree(): void {
    const model = this._safeModel
    if (!model) return

    this._subtreeLoading = true
    this.requestUpdate()

    // Use setTimeout to not block the main thread
    setTimeout(() => {
      const result = fetchSubtreeFromDoc(this.doc, model.sourceBlockId, {
        maxDepth: DEFAULT_MAX_DEPTH,
        includeCollapsed: true, // We handle collapse state locally
      })

      this._subtreeResult = result
      this._subtreeLoading = false
      this.requestUpdate()
    }, 0)
  }

  /**
   * EDITOR-3404: Render warning banner for first edit
   */
  private _renderEditWarning(): TemplateResult {
    return html`
      <div class="portal-edit-warning">
        <span class="portal-edit-warning-icon">⚠️</span>
        <span>${getEditWarningMessage()}</span>
        <button
          class="portal-edit-warning-dismiss"
          @click=${this._dismissWarning}
        >
          Got it
        </button>
      </div>
    `
  }

  /**
   * EDITOR-3404: Handle focus on rich-text (entering edit mode)
   */
  private _handleFocus(): void {
    this._isEditing = true
    this._hasEditedBefore = true
    this.requestUpdate()
  }

  /**
   * EDITOR-3404: Handle blur on rich-text (leaving edit mode)
   */
  private _handleBlur(): void {
    this._isEditing = false
    this.requestUpdate()
  }

  /**
   * EDITOR-3404: Dismiss the edit warning
   */
  private _dismissWarning(): void {
    this._warningDismissed = true
    this.requestUpdate()
  }

  private _toggleCollapse(): void {
    const model = this._safeModel
    if (!model) return

    this.doc.updateBlock(model, {
      isCollapsed: !model.isCollapsed,
    })
  }

  private _formatSourceHint(): string {
    const docName = this._sourceDocName
    const preview = this._sourceText
    const model = this._safeModel

    if (!model) return 'Invalid source'
    if (!docName && !model.sourceDocId) return 'Unknown source'
    if (!preview) return `from: ${docName || 'Document'}`

    const truncatedPreview =
      preview.length > 30 ? preview.substring(0, 30) + '...' : preview
    return `from: ${docName || 'Document'} • "${truncatedPreview}"`
  }

  /**
   * Sets up the Yjs observer for live sync with the source block
   * EDITOR-3404: Also captures Y.Text reference for bidirectional editing
   */
  private _setupSourceObserver(): void {
    this._isLoading = true
    this._sourceYText = null
    this._cleanupSourceObserver()
    this.requestUpdate()

    const model = this._safeModel
    if (!model) {
      this._isLoading = false
      return
    }

    // EDITOR-3404: Get source block and its Y.Text for editing
    const sourceBlock = this.doc.getBlock(model.sourceBlockId)
    if (sourceBlock) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sourceModel = sourceBlock.model as any
      if (sourceModel.text) {
        this._sourceYText = sourceModel.text as Text
      }
    }

    // For same-document portals, set up direct Yjs observation
    this._sourceObserver = createSourceObserver({
      doc: this.doc,
      sourceBlockId: model.sourceBlockId,
      onTextChange: (newText: string) => {
        this._isLoading = false
        this._sourceDocName = 'This document'
        this._debouncedUpdate(newText)
      },
      onOrphaned: () => {
        this._isLoading = false
        this._sourceYText = null
        const currentModel = this._safeModel
        if (currentModel) {
          this.doc.updateBlock(currentModel, {
            syncStatus: 'orphaned',
          })
        }
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
    // EDITOR-3404: Clear Y.Text reference on cleanup
    this._sourceYText = null
    // EDITOR-3504: Clear subtree state on cleanup
    this._subtreeResult = null
    this._subtreeLoading = false
    this._collapsedSubtreeNodes.clear()
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hydra-portal-block': HydraPortalBlock
  }
}
