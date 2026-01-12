/**
 * Stores barrel export
 */
export {
  useAuthStore,
  initializeAuth,
  type AuthState,
} from './auth-store'

export {
  useAIStore,
  selectCanGenerate,
  selectGenerationsRemaining,
} from './ai-store'

export {
  useEditorStore,
  selectIsInFocusMode,
  selectFocusedBlockId,
  selectCurrentDocumentId,
  selectSelectedBlockIds,
  selectHasSelection,
  selectEditorMode,
  type EditorMode,
} from './editor-store'

export {
  useSettingsStore,
  selectSemanticLinkingEnabled,
  selectSemanticLinkingThreshold,
  selectSemanticLinkingMaxSuggestions,
  SEMANTIC_LINKING_DEFAULTS,
  SETTINGS_STORAGE_KEY,
} from './settings-store'
