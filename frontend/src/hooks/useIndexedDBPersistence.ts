/**
 * IndexedDB Persistence for Hydra Notes
 * EDITOR-305: Local-first persistence using y-indexeddb
 *
 * Provides automatic persistence of Yjs documents to IndexedDB.
 * Documents survive page refreshes and are hydrated on load.
 */
import { IndexeddbPersistence, clearDocument } from 'y-indexeddb'
import type { Doc } from 'yjs'

/**
 * Database name prefix for Hydra Notes documents
 */
export const HYDRA_DB_PREFIX = 'hydra-notes-'

/**
 * Persistence state for tracking sync status
 */
export type PersistenceStatus = 'loading' | 'synced' | 'error'

export interface PersistenceState {
  status: PersistenceStatus
  error: Error | null
}

export interface PersistenceResult {
  persistence: IndexeddbPersistence
  state: PersistenceState
}

/**
 * Create IndexedDB persistence for a Yjs document.
 *
 * @param docId - Unique identifier for the document
 * @param doc - Yjs document to persist
 * @returns Persistence instance and state object
 *
 * @example
 * ```ts
 * const doc = new Y.Doc()
 * const { persistence, state } = createPersistence('my-doc', doc)
 *
 * // State updates automatically:
 * // state.status: 'loading' -> 'synced'
 * // state.error: null (or Error if failed)
 * ```
 */
export function createPersistence(
  docId: string,
  doc: Doc
): PersistenceResult {
  const dbName = `${HYDRA_DB_PREFIX}${docId}`

  const state: PersistenceState = {
    status: 'loading',
    error: null,
  }

  try {
    const persistence = new IndexeddbPersistence(dbName, doc)

    // Listen for sync completion
    persistence.on('synced', () => {
      state.status = 'synced'
    })

    return { persistence, state }
  } catch (error) {
    state.status = 'error'
    state.error = error instanceof Error ? error : new Error(String(error))

    // Return a mock persistence object to satisfy the interface
    // The caller should check state.status === 'error'
    return {
      persistence: {
        destroy: async () => {},
        on: () => {},
        off: () => {},
      } as unknown as IndexeddbPersistence,
      state,
    }
  }
}

/**
 * Destroy a persistence instance and clean up resources.
 *
 * @param persistence - The persistence instance to destroy
 */
export async function destroyPersistence(
  persistence: IndexeddbPersistence | null
): Promise<void> {
  if (persistence) {
    await persistence.destroy()
  }
}

/**
 * Clear all persisted data for a document from IndexedDB.
 * Use this when you want to reset a document to its initial state.
 *
 * @param docId - The document ID to clear
 */
export async function clearPersistedDocument(docId: string): Promise<void> {
  const dbName = `${HYDRA_DB_PREFIX}${docId}`
  await clearDocument(dbName)
}
