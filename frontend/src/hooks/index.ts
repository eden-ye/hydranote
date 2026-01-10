/**
 * Hooks barrel export
 */
export {
  createPersistence,
  destroyPersistence,
  clearPersistedDocument,
  HYDRA_DB_PREFIX,
  type PersistenceState,
  type PersistenceStatus,
  type PersistenceResult,
} from './useIndexedDBPersistence'

export { useSpotlight } from './useSpotlight'

export { useFocusMode } from './useFocusMode'
