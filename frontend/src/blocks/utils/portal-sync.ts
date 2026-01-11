import type { Doc, Text } from '@blocksuite/store'
import type { SyncStatus } from '../schemas/portal-block-schema'

/**
 * Observer for source block changes
 */
export interface SourceObserver {
  /** Dispose the observer and cleanup listeners */
  dispose: () => void
}

/**
 * Parameters for creating a source observer
 */
export interface CreateSourceObserverParams {
  /** The document containing the source block */
  doc: Doc
  /** ID of the source block to observe */
  sourceBlockId: string
  /** Callback when source text changes */
  onTextChange: (newText: string) => void
  /** Callback when source block is deleted (orphaned) */
  onOrphaned: () => void
}

/**
 * Creates an observer that watches for changes to a source block's text.
 * Uses Yjs observation for real-time sync.
 *
 * @param params - Observer configuration
 * @returns SourceObserver with dispose method for cleanup
 */
export function createSourceObserver(
  params: CreateSourceObserverParams
): SourceObserver {
  const { doc, sourceBlockId, onTextChange, onOrphaned } = params

  // Try to get the source block
  const sourceBlock = doc.getBlock(sourceBlockId)

  if (!sourceBlock) {
    // Source block doesn't exist - it's orphaned
    onOrphaned()
    return { dispose: () => {} }
  }

  // Get the text property from the source block model
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sourceModel = sourceBlock.model as any
  const sourceText = sourceModel.text as Text | undefined

  if (!sourceText) {
    // No text property - treat as orphaned
    onOrphaned()
    return { dispose: () => {} }
  }

  // Create the text change observer
  const textObserver = () => {
    const newText = sourceText.toString()
    onTextChange(newText)
  }

  // Observe text changes
  sourceText.yText.observe(textObserver)

  // Initial sync - send current text
  onTextChange(sourceText.toString())

  // Return observer with dispose method
  return {
    dispose: () => {
      sourceText.yText.unobserve(textObserver)
    },
  }
}

/**
 * Detects if a source block has been deleted (orphaned state)
 *
 * @param doc - The document to check
 * @param sourceBlockId - ID of the source block
 * @returns true if the source block no longer exists
 */
export function detectOrphanedState(doc: Doc, sourceBlockId: string): boolean {
  const block = doc.getBlock(sourceBlockId)
  return block === null || block === undefined
}

/**
 * Parameters for computing sync state
 */
export interface ComputeSyncStateParams {
  /** Current source text (null if orphaned) */
  sourceText: string | null
  /** Current portal text (cached) */
  portalText: string
  /** Whether the source block exists */
  sourceExists: boolean
}

/**
 * Computes the sync status based on source and portal state
 *
 * @param params - Sync state parameters
 * @returns The computed sync status
 */
export function computeSyncState(params: ComputeSyncStateParams): SyncStatus {
  const { sourceText, portalText, sourceExists } = params

  if (!sourceExists || sourceText === null) {
    return 'orphaned'
  }

  if (sourceText !== portalText) {
    return 'stale'
  }

  return 'synced'
}

/**
 * Debounce utility for sync updates
 * Prevents excessive re-renders during rapid edits
 *
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Sync debounce delay in milliseconds
 * Balance between responsiveness and performance
 */
export const SYNC_DEBOUNCE_DELAY = 50
