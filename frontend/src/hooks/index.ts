/**
 * Hooks barrel export
 */
export {
  createPersistence,
  destroyPersistence,
  clearPersistedDocument,
  HYDRA_DB_PREFIX,
  // BUG-EDITOR-3064: Version-based cleanup exports
  PERSISTENCE_VERSION,
  PERSISTENCE_VERSION_KEY,
  getStoredPersistenceVersion,
  savePersistenceVersion,
  shouldClearPersistence,
  clearAllHydraDatabases,
  checkAndClearOnVersionMismatch,
  type PersistenceState,
  type PersistenceStatus,
  type PersistenceResult,
} from './useIndexedDBPersistence'

export { useSpotlight } from './useSpotlight'

export { useFocusMode } from './useFocusMode'

export { useExpandBlock, type ExpandBlockContext } from './useExpandBlock'
