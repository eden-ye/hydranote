/**
 * IndexedDB Persistence for Hydra Notes
 * EDITOR-305: Local-first persistence using y-indexeddb
 * BUG-EDITOR-3064: Added version-based cleanup for orphaned blocks
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
 * BUG-EDITOR-3064: Persistence schema version
 * Increment this when the data structure changes or orphaned blocks accumulate.
 * When version mismatches, IndexedDB is cleared to remove orphaned blocks.
 */
export const PERSISTENCE_VERSION = 2

/**
 * BUG-EDITOR-3064: LocalStorage key for persistence version
 */
export const PERSISTENCE_VERSION_KEY = 'hydra-persistence-version'

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

/**
 * BUG-EDITOR-3064: Get the stored persistence version from localStorage.
 * Returns 0 if no version is stored (first run or after cache clear).
 */
export function getStoredPersistenceVersion(): number {
  try {
    const stored = localStorage.getItem(PERSISTENCE_VERSION_KEY)
    return stored ? parseInt(stored, 10) : 0
  } catch {
    // localStorage may be unavailable in some contexts
    return 0
  }
}

/**
 * BUG-EDITOR-3064: Save the current persistence version to localStorage.
 */
export function savePersistenceVersion(): void {
  try {
    localStorage.setItem(PERSISTENCE_VERSION_KEY, String(PERSISTENCE_VERSION))
  } catch {
    // localStorage may be unavailable in some contexts
    console.warn('[Persistence] Failed to save persistence version to localStorage')
  }
}

/**
 * BUG-EDITOR-3064: Check if persistence version has changed.
 * Returns true if IndexedDB should be cleared due to version mismatch.
 */
export function shouldClearPersistence(): boolean {
  const storedVersion = getStoredPersistenceVersion()
  return storedVersion !== PERSISTENCE_VERSION
}

/**
 * BUG-EDITOR-3064: Clear all Hydra IndexedDB databases.
 * This removes all persisted documents, clearing any orphaned blocks.
 *
 * Uses the IndexedDB API directly to list and delete all databases
 * with the Hydra prefix.
 */
export async function clearAllHydraDatabases(): Promise<void> {
  try {
    // Get all database names using the IndexedDB API
    if ('databases' in indexedDB) {
      const databases = await indexedDB.databases()
      const hydraDbs = databases.filter(
        (db) => db.name && db.name.startsWith(HYDRA_DB_PREFIX)
      )

      console.log(`[Persistence] Clearing ${hydraDbs.length} Hydra databases due to version upgrade`)

      // Delete each database
      for (const db of hydraDbs) {
        if (db.name) {
          await new Promise<void>((resolve, reject) => {
            const request = indexedDB.deleteDatabase(db.name!)
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
            request.onblocked = () => {
              console.warn(`[Persistence] Database ${db.name} is blocked, waiting...`)
              resolve() // Continue anyway
            }
          })
        }
      }
    } else {
      // Fallback: Try to clear the main document database
      // This works on browsers that don't support indexedDB.databases()
      await clearPersistedDocument('main')
    }

    console.log('[Persistence] Successfully cleared all Hydra databases')
  } catch (error) {
    console.error('[Persistence] Failed to clear databases:', error)
  }
}

/**
 * BUG-EDITOR-3064: Check and clear persistence if version has changed.
 * This should be called before creating any persistence instances.
 *
 * Returns true if databases were cleared, false otherwise.
 */
export async function checkAndClearOnVersionMismatch(): Promise<boolean> {
  if (shouldClearPersistence()) {
    console.log(
      `[Persistence] Version mismatch: stored=${getStoredPersistenceVersion()}, current=${PERSISTENCE_VERSION}`
    )
    await clearAllHydraDatabases()
    savePersistenceVersion()
    return true
  }
  return false
}
