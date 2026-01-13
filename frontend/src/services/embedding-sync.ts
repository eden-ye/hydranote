/**
 * EDITOR-3501: Background Embedding Sync Service
 *
 * Syncs note embeddings to backend on document save.
 * Features:
 * - Builds embedding payloads from blocks with context path + children summary
 * - Debounces saves to avoid excessive API calls
 * - Background catch-up job for unindexed notes
 * - Handles offline gracefully (queue for later sync)
 */

import type { Doc } from '@blocksuite/store'
import type { DescriptorType } from '@/blocks/utils/descriptor'

/**
 * Embedding payload sent to backend API
 */
export interface EmbeddingPayload {
  /** Document ID containing the block */
  document_id: string
  /** Block ID of the bullet */
  block_id: string
  /** Text content of the bullet */
  bullet_text: string
  /** Hierarchical path: "Apple > What it is > Red Sweet Fruit" */
  context_path: string
  /** Descriptor type if block is a descriptor */
  descriptor_type?: DescriptorType | null
  /** Summary of first 5 children (50 chars each) */
  children_summary?: string | null
}

/**
 * Sync status for tracking progress
 */
export interface SyncStatus {
  /** Whether currently syncing */
  isSyncing: boolean
  /** Document IDs pending sync */
  pendingDocs: string[]
  /** Document IDs that failed to sync */
  failedDocs: string[]
  /** Timestamp of last successful sync */
  lastSyncTime: Date | null
}

/**
 * Configuration for embedding sync service
 */
export interface EmbeddingSyncConfig {
  /** Function to get current access token */
  getAccessToken: () => string | null
  /** Base URL for API calls */
  apiBaseUrl: string
}

/**
 * Embedding sync service interface
 */
export interface EmbeddingSyncService {
  /** Sync a document immediately */
  syncDocument: (doc: Doc) => Promise<void>
  /** Queue a document for debounced sync */
  queueSync: (doc: Doc) => void
  /** Process all queued documents */
  processQueue: () => Promise<void>
  /** Get current sync status */
  getSyncStatus: () => SyncStatus
  /** Check for unindexed documents (background catch-up) */
  checkUnindexedDocuments: () => Promise<string[]>
  /** Cleanup resources */
  dispose: () => void
}

/**
 * Debounce delay for embedding sync (2 seconds)
 * Balances responsiveness with reducing API calls
 */
export const EMBEDDING_SYNC_DEBOUNCE_MS = 2000

/**
 * Maximum number of ancestors to include in context path
 */
const MAX_ANCESTOR_LEVELS = 3

/**
 * Maximum number of children to include in summary
 */
const MAX_CHILDREN_SUMMARY = 5

/**
 * Maximum characters per child in summary
 */
const MAX_CHILD_TEXT_LENGTH = 50

/**
 * Block-like interface for type safety
 */
interface BlockLike {
  id: string
  flavour: string
  model?: {
    text?: { toString: () => string }
    isDescriptor?: boolean
    descriptorType?: DescriptorType | null
  }
  parent?: BlockLike | null
  children?: BlockLike[]
}

/**
 * Build the context path for a block by traversing ancestors.
 * Limits to last 3 ancestor levels + current block.
 *
 * @param block - The block to build path for
 * @returns Context path string: "Grandparent > Parent > Current"
 */
export function buildContextPath(block: BlockLike): string {
  const pathParts: string[] = []

  // Traverse up to collect ancestors
  let current: BlockLike | null | undefined = block
  while (current) {
    if (current.flavour === 'hydra:bullet' && current.model?.text) {
      pathParts.unshift(current.model.text.toString())
    }
    current = current.parent
  }

  // Limit to last MAX_ANCESTOR_LEVELS ancestors + current
  // If we have more ancestors, take the last ones
  if (pathParts.length > MAX_ANCESTOR_LEVELS) {
    return pathParts.slice(-(MAX_ANCESTOR_LEVELS)).join(' > ')
  }

  return pathParts.join(' > ')
}

/**
 * Build a summary of block's children.
 * Takes first 5 children, truncates each to 50 chars.
 *
 * @param block - The block to summarize children for
 * @returns Children summary string or null if no children
 */
export function buildChildrenSummary(block: BlockLike): string | null {
  const children = block.children || []

  if (children.length === 0) {
    return null
  }

  const summaryParts = children
    .slice(0, MAX_CHILDREN_SUMMARY)
    .filter((child) => child.flavour === 'hydra:bullet' && child.model?.text)
    .map((child) => {
      const text = child.model!.text!.toString()
      return text.length > MAX_CHILD_TEXT_LENGTH
        ? text.slice(0, MAX_CHILD_TEXT_LENGTH)
        : text
    })

  return summaryParts.length > 0 ? summaryParts.join(', ') : null
}

/**
 * Build embedding payload for a single block.
 *
 * @param block - The block to build payload for
 * @param doc - The document containing the block
 * @returns Embedding payload
 */
export function buildEmbeddingPayload(block: BlockLike, doc: Doc): EmbeddingPayload {
  const bulletText = block.model?.text?.toString() || ''
  const contextPath = buildContextPath(block)
  const childrenSummary = buildChildrenSummary(block)
  const descriptorType = block.model?.descriptorType ?? null

  return {
    document_id: doc.id,
    block_id: block.id,
    bullet_text: bulletText,
    context_path: contextPath,
    descriptor_type: descriptorType,
    children_summary: childrenSummary,
  }
}

/**
 * Get all bullet blocks from a document.
 *
 * @param doc - The document to get bullets from
 * @returns Array of bullet blocks
 */
export function getAllBullets(doc: Doc): BlockLike[] {
  // BlockSuite documents have a getBlocksByFlavour method
  const docWithMethod = doc as unknown as {
    getBlocksByFlavour?: (flavour: string) => BlockLike[]
  }

  if (typeof docWithMethod.getBlocksByFlavour === 'function') {
    return docWithMethod.getBlocksByFlavour('hydra:bullet')
  }

  // Fallback: iterate over blocks map if available
  const docWithBlocks = doc as unknown as {
    blocks?: Map<string, { model: unknown; flavour: string }>
  }

  if (docWithBlocks.blocks) {
    const bullets: BlockLike[] = []
    docWithBlocks.blocks.forEach((block, id) => {
      if (block.flavour === 'hydra:bullet') {
        bullets.push({
          id,
          flavour: block.flavour,
          model: block.model as BlockLike['model'],
        })
      }
    })
    return bullets
  }

  return []
}

/**
 * Create an embedding sync service.
 *
 * @param config - Service configuration
 * @returns Embedding sync service instance
 */
export function createEmbeddingSyncService(
  config: EmbeddingSyncConfig
): EmbeddingSyncService {
  const { getAccessToken, apiBaseUrl } = config

  // Internal state
  let disposed = false
  let syncTimeout: ReturnType<typeof setTimeout> | null = null
  const pendingDocs = new Map<string, EmbeddingPayload[]>()
  const failedDocs = new Set<string>()
  let lastSyncTime: Date | null = null
  let isSyncing = false

  /**
   * Send payloads to the backend API
   */
  async function sendToApi(payloads: EmbeddingPayload[]): Promise<boolean> {
    const token = getAccessToken()
    if (!token) {
      console.warn('[EmbeddingSync] No access token available')
      return false
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/notes/embeddings/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ embeddings: payloads }),
      })

      if (!response.ok) {
        console.error('[EmbeddingSync] API error:', response.status)
        return false
      }

      return true
    } catch (error) {
      console.error('[EmbeddingSync] Network error:', error)
      return false
    }
  }

  /**
   * Sync a document immediately
   */
  async function syncDocument(doc: Doc): Promise<void> {
    if (disposed) return

    const bullets = getAllBullets(doc)
    if (bullets.length === 0) return

    const payloads = bullets.map((block) => buildEmbeddingPayload(block, doc))

    isSyncing = true
    const success = await sendToApi(payloads)
    isSyncing = false

    if (success) {
      lastSyncTime = new Date()
      failedDocs.delete(doc.id)
      pendingDocs.delete(doc.id)
    } else {
      failedDocs.add(doc.id)
    }
  }

  /**
   * Queue a document for debounced sync
   */
  function queueSync(doc: Doc): void {
    if (disposed) return

    // Build payloads now to capture current state
    const bullets = getAllBullets(doc)
    if (bullets.length === 0) return

    const payloads = bullets.map((block) => buildEmbeddingPayload(block, doc))
    pendingDocs.set(doc.id, payloads)

    // Clear existing timeout
    if (syncTimeout) {
      clearTimeout(syncTimeout)
    }

    // Set new debounced timeout
    syncTimeout = setTimeout(async () => {
      if (disposed) return

      // Check if online
      if (!navigator.onLine) {
        console.log('[EmbeddingSync] Offline, keeping docs in queue')
        return
      }

      await processQueue()
    }, EMBEDDING_SYNC_DEBOUNCE_MS)
  }

  /**
   * Process all queued documents
   */
  async function processQueue(): Promise<void> {
    if (disposed || pendingDocs.size === 0) return

    isSyncing = true

    // Collect all payloads
    const allPayloads: EmbeddingPayload[] = []
    const docIds: string[] = []

    pendingDocs.forEach((payloads, docId) => {
      allPayloads.push(...payloads)
      docIds.push(docId)
    })

    // Send to API
    const success = await sendToApi(allPayloads)

    isSyncing = false

    if (success) {
      lastSyncTime = new Date()
      // Clear processed docs
      docIds.forEach((docId) => {
        pendingDocs.delete(docId)
        failedDocs.delete(docId)
      })
    } else {
      // Mark as failed
      docIds.forEach((docId) => {
        failedDocs.add(docId)
      })
    }
  }

  /**
   * Get current sync status
   */
  function getSyncStatus(): SyncStatus {
    return {
      isSyncing,
      pendingDocs: Array.from(pendingDocs.keys()),
      failedDocs: Array.from(failedDocs),
      lastSyncTime,
    }
  }

  /**
   * Check for unindexed documents (background catch-up)
   * Returns document IDs that need indexing
   */
  async function checkUnindexedDocuments(): Promise<string[]> {
    // This would typically call an API endpoint to check
    // which documents have no embeddings yet
    // For now, return empty array as a placeholder
    const token = getAccessToken()
    if (!token) return []

    try {
      const response = await fetch(`${apiBaseUrl}/api/notes/embeddings/unindexed`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) return []

      const data = await response.json()
      return data.document_ids || []
    } catch {
      return []
    }
  }

  /**
   * Cleanup resources
   */
  function dispose(): void {
    disposed = true
    if (syncTimeout) {
      clearTimeout(syncTimeout)
      syncTimeout = null
    }
    pendingDocs.clear()
    failedDocs.clear()
  }

  return {
    syncDocument,
    queueSync,
    processQueue,
    getSyncStatus,
    checkUnindexedDocuments,
    dispose,
  }
}
