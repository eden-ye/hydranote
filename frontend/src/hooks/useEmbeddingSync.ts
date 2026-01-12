/**
 * EDITOR-3501: Embedding Sync Hook
 *
 * React hook for syncing document embeddings to the backend.
 * Integrates with auth store and document changes.
 *
 * Features:
 * - Auto-sync on document changes (debounced)
 * - Handles offline gracefully
 * - Background catch-up for unindexed notes
 * - Exposes sync status for UI indicators
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import type { Doc } from '@blocksuite/store'
import { useAuthStore, selectAccessToken } from '@/stores/auth-store'
import {
  createEmbeddingSyncService,
  type EmbeddingSyncService,
  type SyncStatus,
} from '@/services/embedding-sync'

/**
 * Configuration for embedding sync hook
 */
export interface UseEmbeddingSyncConfig {
  /** API base URL (defaults to VITE_API_URL env var) */
  apiBaseUrl?: string
  /** Whether sync is enabled (defaults to true) */
  enabled?: boolean
}

/**
 * Return type for useEmbeddingSync hook
 */
export interface UseEmbeddingSyncResult {
  /** Current sync status */
  syncStatus: SyncStatus
  /** Manually trigger sync for a document */
  syncDocument: (doc: Doc) => void
  /** Queue a document for debounced sync */
  queueSync: (doc: Doc) => void
  /** Check for unindexed documents */
  checkUnindexed: () => Promise<string[]>
  /** Whether embedding sync is available (requires auth) */
  isAvailable: boolean
}

/**
 * Default sync status when service is not initialized
 */
const DEFAULT_SYNC_STATUS: SyncStatus = {
  isSyncing: false,
  pendingDocs: [],
  failedDocs: [],
  lastSyncTime: null,
}

/**
 * Hook for syncing document embeddings to the backend.
 *
 * @param config - Hook configuration
 * @returns Sync control functions and status
 *
 * @example
 * ```tsx
 * function Editor({ doc }) {
 *   const { queueSync, syncStatus } = useEmbeddingSync()
 *
 *   // Sync on document changes
 *   useEffect(() => {
 *     const observer = () => queueSync(doc)
 *     doc.on('update', observer)
 *     return () => doc.off('update', observer)
 *   }, [doc, queueSync])
 *
 *   return (
 *     <div>
 *       {syncStatus.isSyncing && <span>Syncing...</span>}
 *     </div>
 *   )
 * }
 * ```
 */
export function useEmbeddingSync(
  config: UseEmbeddingSyncConfig = {}
): UseEmbeddingSyncResult {
  const {
    apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000',
    enabled = true,
  } = config

  // Get access token from auth store
  const accessToken = useAuthStore(selectAccessToken)

  // Service instance ref
  const serviceRef = useRef<EmbeddingSyncService | null>(null)

  // Sync status state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(DEFAULT_SYNC_STATUS)

  // Update sync status periodically while syncing
  const updateStatusRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Create or update service when auth changes
  useEffect(() => {
    // Dispose previous service
    if (serviceRef.current) {
      serviceRef.current.dispose()
      serviceRef.current = null
    }

    // Clear status update interval
    if (updateStatusRef.current) {
      clearInterval(updateStatusRef.current)
      updateStatusRef.current = null
    }

    // Don't create service if disabled or no auth
    if (!enabled || !accessToken) {
      setSyncStatus(DEFAULT_SYNC_STATUS)
      return
    }

    // Create new service
    serviceRef.current = createEmbeddingSyncService({
      getAccessToken: () => accessToken,
      apiBaseUrl,
    })

    // Set up status polling
    updateStatusRef.current = setInterval(() => {
      if (serviceRef.current) {
        setSyncStatus(serviceRef.current.getSyncStatus())
      }
    }, 1000)

    // Cleanup on unmount
    return () => {
      if (serviceRef.current) {
        serviceRef.current.dispose()
        serviceRef.current = null
      }
      if (updateStatusRef.current) {
        clearInterval(updateStatusRef.current)
        updateStatusRef.current = null
      }
    }
  }, [accessToken, apiBaseUrl, enabled])

  // Sync document immediately
  const syncDocument = useCallback((doc: Doc) => {
    if (serviceRef.current) {
      serviceRef.current.syncDocument(doc)
    }
  }, [])

  // Queue document for debounced sync
  const queueSync = useCallback((doc: Doc) => {
    if (serviceRef.current) {
      serviceRef.current.queueSync(doc)
    }
  }, [])

  // Check for unindexed documents
  const checkUnindexed = useCallback(async (): Promise<string[]> => {
    if (serviceRef.current) {
      return serviceRef.current.checkUnindexedDocuments()
    }
    return []
  }, [])

  return {
    syncStatus,
    syncDocument,
    queueSync,
    checkUnindexed,
    isAvailable: enabled && !!accessToken && !!serviceRef.current,
  }
}

/**
 * Hook for observing document changes and auto-syncing.
 *
 * This hook combines useEmbeddingSync with document observation
 * for automatic embedding sync on document changes.
 *
 * @param doc - The BlockSuite document to observe
 * @param config - Hook configuration
 * @returns Sync status and control functions
 *
 * @example
 * ```tsx
 * function Editor({ doc }) {
 *   const { syncStatus, isAvailable } = useDocumentEmbeddingSync(doc)
 *
 *   return (
 *     <div>
 *       {isAvailable && syncStatus.isSyncing && <SyncIndicator />}
 *     </div>
 *   )
 * }
 * ```
 */
export function useDocumentEmbeddingSync(
  doc: Doc | null,
  config: UseEmbeddingSyncConfig = {}
): UseEmbeddingSyncResult {
  const result = useEmbeddingSync(config)
  const { queueSync } = result

  // Observe document changes and queue sync
  useEffect(() => {
    if (!doc) return

    // Subscribe to block updates
    const subscription = doc.slots.blockUpdated.on(() => {
      queueSync(doc)
    })

    // Cleanup
    return () => {
      subscription.dispose()
    }
  }, [doc, queueSync])

  return result
}
