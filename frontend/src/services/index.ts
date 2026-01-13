/**
 * Services barrel export
 */
export {
  supabase,
  signInWithGoogle,
  signOut,
  getSession,
  onAuthStateChange,
  type User,
  type Session,
  type AuthChangeEvent,
} from './supabase'

// EDITOR-3501: Background embedding sync
export {
  createEmbeddingSyncService,
  buildEmbeddingPayload,
  buildContextPath,
  buildChildrenSummary,
  getAllBullets,
  EMBEDDING_SYNC_DEBOUNCE_MS,
  type EmbeddingPayload,
  type EmbeddingSyncService,
  type EmbeddingSyncConfig,
  type SyncStatus,
} from './embedding-sync'
