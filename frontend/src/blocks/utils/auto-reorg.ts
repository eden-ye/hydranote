/**
 * EDITOR-3407: Auto-Reorg Foundation
 *
 * Document observer with debouncing for auto-reorganization feature.
 * Observes document changes via Yjs and triggers callbacks after debounce period.
 */

/**
 * Auto-reorg configuration interface
 */
export interface AutoReorgConfig {
  /** Whether auto-reorg is enabled */
  enabled: boolean
  /** Similarity threshold score (0-1) */
  thresholdScore: number
  /** Debounce delay in milliseconds */
  debounceMs: number
  /** Maximum results per concept */
  maxResults: number
}

/**
 * Default auto-reorg configuration
 */
export const DEFAULT_AUTO_REORG_CONFIG: AutoReorgConfig = {
  enabled: true,
  thresholdScore: 0.8,
  debounceMs: 2000,
  maxResults: 5,
}

/**
 * Context passed to auto-reorg trigger callback
 */
export interface AutoReorgContext {
  /** ID of the document being reorganized */
  documentId: string
  /** Full text content of the document */
  documentText: string
  /** All bullet IDs in the document */
  allBulletIds: string[]
}

/**
 * Auto-reorg observer interface
 */
export interface AutoReorgObserver {
  /** Dispose the observer and cleanup listeners */
  dispose: () => void
}

/**
 * Mock Doc interface for type safety
 * In production, this would be the actual BlockSuite Doc type
 */
export interface MockDoc {
  id: string
  spaceDoc: {
    on: (event: string, callback: () => void) => void
    off: (event: string, callback: () => void) => void
  }
  getText?: () => string
  getAllBulletIds?: () => string[]
}

/**
 * Validate and normalize auto-reorg configuration
 */
export function validateAutoReorgConfig(
  config: Partial<AutoReorgConfig>
): AutoReorgConfig {
  return {
    enabled:
      typeof config.enabled === 'boolean'
        ? config.enabled
        : DEFAULT_AUTO_REORG_CONFIG.enabled,
    debounceMs:
      typeof config.debounceMs === 'number' && config.debounceMs >= 0
        ? config.debounceMs
        : DEFAULT_AUTO_REORG_CONFIG.debounceMs,
    thresholdScore: clampThreshold(config.thresholdScore),
    maxResults:
      typeof config.maxResults === 'number' && config.maxResults > 0
        ? config.maxResults
        : DEFAULT_AUTO_REORG_CONFIG.maxResults,
  }
}

/**
 * Clamp threshold score to valid range (0-1)
 */
function clampThreshold(value: number | undefined): number {
  if (typeof value !== 'number') {
    return DEFAULT_AUTO_REORG_CONFIG.thresholdScore
  }
  return Math.max(0, Math.min(1, value))
}

/**
 * Create an auto-reorg observer for a document
 *
 * Observes document changes via Yjs and triggers callback after debounce period.
 * The callback receives context with document ID, text, and bullet IDs.
 *
 * @param doc - The document to observe
 * @param config - Auto-reorg configuration
 * @param onTrigger - Callback to invoke when auto-reorg should run
 * @returns Observer with dispose method for cleanup
 */
export function createAutoReorgObserver(
  doc: MockDoc,
  config: AutoReorgConfig,
  onTrigger: (context: AutoReorgContext) => void
): AutoReorgObserver {
  // Don't observe if disabled
  if (!config.enabled) {
    return { dispose: () => {} }
  }

  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let disposed = false

  const handleUpdate = () => {
    if (disposed) return

    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Set new debounced timeout
    timeoutId = setTimeout(() => {
      if (disposed) return

      const context: AutoReorgContext = {
        documentId: doc.id,
        documentText: doc.getText?.() ?? '',
        allBulletIds: doc.getAllBulletIds?.() ?? [],
      }

      onTrigger(context)
    }, config.debounceMs)
  }

  // Subscribe to document updates
  doc.spaceDoc.on('update', handleUpdate)

  return {
    dispose: () => {
      disposed = true
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      doc.spaceDoc.off('update', handleUpdate)
    },
  }
}

/**
 * Extract text content from a document
 * Used to gather text for concept extraction
 *
 * @param doc - The document to extract text from
 * @returns Combined text content of all bullets
 */
export function extractDocumentText(doc: MockDoc): string {
  return doc.getText?.() ?? ''
}

/**
 * Get all bullet block IDs from a document
 *
 * @param doc - The document to get bullet IDs from
 * @returns Array of bullet block IDs
 */
export function getAllBulletIds(doc: MockDoc): string[] {
  return doc.getAllBulletIds?.() ?? []
}
