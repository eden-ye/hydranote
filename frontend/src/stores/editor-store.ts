/**
 * Editor Store
 * FE-406: Focus Mode Navigation
 * EDITOR-307: Document ID and Selection State
 * EDITOR-3203: Descriptor Autocomplete State
 * EDITOR-3405: Portal Picker State
 * EDITOR-3409: Portal Search Modal State
 * EDITOR-3510: Slash Menu State
 * EDITOR-3602: Auto-Generate Settings
 * EDITOR-3407: Auto-Reorg Settings
 * EDITOR-3502: Reorganization Modal State
 * FE-503: Favorites State
 *
 * Manages editor state including:
 * - Current document ID
 * - Selection state (selected block IDs)
 * - Editor mode (normal, focus)
 * - Descriptor autocomplete state
 * - Portal picker state
 * - Portal search modal state
 * - Slash menu state (EDITOR-3510)
 * - Auto-generate settings and status
 * - Auto-reorg settings and status
 * - Reorganization modal state (Cmd+Shift+L)
 * - Favorite blocks list (FE-503)
 */
import { create } from 'zustand'
import type { AutoGenerateStatus } from '@/blocks/utils/auto-generate'
import type { RecentItem } from '@/utils/frecency'
import type { FuzzySearchResult } from '@/utils/fuzzy-search'
import type { SemanticSearchResult } from '@/services/api-client.mock'

/**
 * Editor mode type
 */
export type EditorMode = 'normal' | 'focus'

/**
 * EDITOR-3407: Auto-reorg status type
 */
export type AutoReorgStatus = 'idle' | 'processing' | 'completed'

/**
 * EDITOR-3502: Reorganization modal status type
 */
export type ReorgModalStatus = 'idle' | 'extracting' | 'searching' | 'loaded' | 'error'

/**
 * EDITOR-3502: Concept match for reorganization modal
 */
export interface ConceptMatch {
  /** Name of the extracted concept */
  concept: string
  /** Category of the concept */
  category: string
  /** Matching search results for this concept */
  matches: SemanticSearchResult[]
  /** Set of selected match block IDs */
  selectedMatches: Set<string>
}

/**
 * Editor Store state interface
 */
interface EditorState {
  /** ID of the currently focused block (null if not in focus mode) */
  focusedBlockId: string | null
  /** ID of the current document (null if no document loaded) */
  currentDocumentId: string | null
  /** Array of currently selected block IDs */
  selectedBlockIds: string[]
  // EDITOR-3203: Autocomplete state
  /** Whether the descriptor autocomplete is open */
  autocompleteOpen: boolean
  /** Current search query in autocomplete (text after ~) */
  autocompleteQuery: string
  /** Block ID where autocomplete was triggered */
  autocompleteBlockId: string | null
  /** Currently selected index in autocomplete list */
  autocompleteSelectedIndex: number
  // EDITOR-3405: Portal picker state
  /** Whether the portal picker is open */
  portalPickerOpen: boolean
  /** Current search query in portal picker */
  portalPickerQuery: string
  /** Block ID where portal picker was triggered */
  portalPickerBlockId: string | null
  /** Currently selected index in portal picker list */
  portalPickerSelectedIndex: number
  // EDITOR-3409: Portal search modal state
  /** Whether the portal search modal is open */
  portalSearchModalOpen: boolean
  /** Current search query in portal search modal */
  portalSearchQuery: string
  /** Search results from fuzzy search */
  portalSearchResults: FuzzySearchResult[]
  /** Recent items from frecency tracker */
  portalSearchRecents: RecentItem[]
  /** Currently selected index in portal search modal */
  portalSearchSelectedIndex: number
  /** Block ID where Cmd+S was pressed */
  portalSearchCurrentBulletId: string | null
  // EDITOR-3510: Slash menu state
  /** Whether the slash menu is open */
  slashMenuOpen: boolean
  /** Current search query in slash menu (text after /) */
  slashMenuQuery: string
  /** Block ID where slash menu was triggered */
  slashMenuBlockId: string | null
  /** Currently selected index in slash menu list */
  slashMenuSelectedIndex: number
  // EDITOR-3602: Auto-generate settings
  /** Whether auto-generate after descriptor is enabled */
  autoGenerateEnabled: boolean
  /** Current auto-generate status */
  autoGenerateStatus: AutoGenerateStatus
  /** Block ID of the descriptor being auto-generated */
  autoGenerateBlockId: string | null
  // EDITOR-3407: Auto-reorg settings
  /** Whether auto-reorg is enabled */
  autoReorgEnabled: boolean
  /** Similarity threshold for auto-reorg (0-1) */
  autoReorgThreshold: number
  /** Current auto-reorg status */
  autoReorgStatus: AutoReorgStatus
  // EDITOR-3502: Reorganization modal state
  /** Whether the reorganization modal is open */
  reorgModalOpen: boolean
  /** Current status of the reorganization modal */
  reorgModalStatus: ReorgModalStatus
  /** Document ID being reorganized */
  reorgModalDocumentId: string | null
  /** Concept matches with search results */
  reorgModalConceptMatches: ConceptMatch[]
  /** Error message if any */
  reorgModalError: string | null
  // FE-503: Favorites state
  /** Array of favorite block IDs in display order */
  favoriteBlockIds: string[]
  // FE-504: Block data for sidebar
  /** Map of block IDs to their titles for sidebar display */
  blockTitles: Map<string, string>
  /** Array of top-level block IDs (root bullets in document) */
  topLevelBlockIds: string[]
}

/**
 * Editor Store actions interface
 */
interface EditorActions {
  /** Set the focused block ID */
  setFocusedBlockId: (id: string | null) => void
  /** Enter focus mode on a specific block */
  enterFocusMode: (blockId: string) => void
  /** Exit focus mode */
  exitFocusMode: () => void
  /** Set the current document ID */
  setCurrentDocumentId: (id: string | null) => void
  /** Set the selected block IDs */
  setSelectedBlocks: (ids: string[]) => void
  /** Clear all selected blocks */
  clearSelection: () => void
  // EDITOR-3203: Autocomplete actions
  /** Open autocomplete for a block */
  openAutocomplete: (blockId: string) => void
  /** Close autocomplete and reset state */
  closeAutocomplete: () => void
  /** Update the autocomplete search query */
  setAutocompleteQuery: (query: string) => void
  /** Set the selected index in autocomplete list */
  setAutocompleteSelectedIndex: (index: number) => void
  // EDITOR-3405: Portal picker actions
  /** Open portal picker for a block */
  openPortalPicker: (blockId: string) => void
  /** Close portal picker and reset state */
  closePortalPicker: () => void
  /** Update the portal picker search query */
  setPortalPickerQuery: (query: string) => void
  /** Set the selected index in portal picker list */
  setPortalPickerSelectedIndex: (index: number) => void
  // EDITOR-3409: Portal search modal actions
  /** Open portal search modal for a block */
  openPortalSearchModal: (bulletId: string) => void
  /** Close portal search modal and reset state */
  closePortalSearchModal: () => void
  /** Update the portal search query */
  setPortalSearchQuery: (query: string) => void
  /** Set the search results */
  setPortalSearchResults: (results: FuzzySearchResult[]) => void
  /** Set the recents list */
  setPortalSearchRecents: (recents: RecentItem[]) => void
  /** Set the selected index in portal search modal */
  setPortalSearchSelectedIndex: (index: number) => void
  // EDITOR-3510: Slash menu actions
  /** Open slash menu for a block */
  openSlashMenu: (blockId: string) => void
  /** Close slash menu and reset state */
  closeSlashMenu: () => void
  /** Update the slash menu search query */
  setSlashMenuQuery: (query: string) => void
  /** Set the selected index in slash menu list */
  setSlashMenuSelectedIndex: (index: number) => void
  // EDITOR-3602: Auto-generate actions
  /** Toggle auto-generate setting */
  setAutoGenerateEnabled: (enabled: boolean) => void
  /** Set auto-generate status */
  setAutoGenerateStatus: (status: AutoGenerateStatus) => void
  /** Start pending auto-generation for a block */
  startAutoGenerate: (blockId: string) => void
  /** Complete auto-generation */
  completeAutoGenerate: () => void
  /** Cancel auto-generation */
  cancelAutoGenerate: () => void
  /** Reset auto-generate state to idle */
  resetAutoGenerate: () => void
  // EDITOR-3407: Auto-reorg actions
  /** Toggle auto-reorg setting */
  setAutoReorgEnabled: (enabled: boolean) => void
  /** Set auto-reorg threshold (0-1) */
  setAutoReorgThreshold: (threshold: number) => void
  /** Set auto-reorg status */
  setAutoReorgStatus: (status: AutoReorgStatus) => void
  // EDITOR-3502: Reorganization modal actions
  /** Open reorganization modal for a document */
  openReorgModal: (documentId: string) => void
  /** Close reorganization modal and reset state */
  closeReorgModal: () => void
  /** Set reorganization modal status */
  setReorgModalStatus: (status: ReorgModalStatus) => void
  /** Set concept matches */
  setReorgModalConceptMatches: (matches: ConceptMatch[]) => void
  /** Set error message */
  setReorgModalError: (error: string | null) => void
  /** Toggle selection of a match for a concept */
  toggleReorgMatch: (concept: string, blockId: string) => void
  // FE-503: Favorites actions
  /** Load favorites from localStorage */
  loadFavorites: () => void
  /** Toggle a block as favorite (add if not present, remove if present) */
  toggleFavorite: (blockId: string) => void
  /** Check if a block is favorited */
  isFavorite: (blockId: string) => boolean
  /** Reorder favorites by moving a block to a new index */
  reorderFavorites: (blockId: string, newIndex: number) => void
  /** Clear all favorites */
  clearFavorites: () => void
  // FE-504: Block data actions
  /** Sync all block data from document */
  syncBlockData: (topLevelBlockIds: string[], blockTitles: Map<string, string>) => void
}

/**
 * Editor store combining state and actions
 */
export const useEditorStore = create<EditorState & EditorActions>((set) => ({
  // Initial state
  focusedBlockId: null,
  currentDocumentId: null,
  selectedBlockIds: [],
  // EDITOR-3203: Autocomplete initial state
  autocompleteOpen: false,
  autocompleteQuery: '',
  autocompleteBlockId: null,
  autocompleteSelectedIndex: 0,
  // EDITOR-3405: Portal picker initial state
  portalPickerOpen: false,
  portalPickerQuery: '',
  portalPickerBlockId: null,
  portalPickerSelectedIndex: 0,
  // EDITOR-3409: Portal search modal initial state
  portalSearchModalOpen: false,
  portalSearchQuery: '',
  portalSearchResults: [],
  portalSearchRecents: [],
  portalSearchSelectedIndex: 0,
  portalSearchCurrentBulletId: null,
  // EDITOR-3510: Slash menu initial state
  slashMenuOpen: false,
  slashMenuQuery: '',
  slashMenuBlockId: null,
  slashMenuSelectedIndex: 0,
  // EDITOR-3602: Auto-generate initial state
  autoGenerateEnabled: true, // Enabled by default
  autoGenerateStatus: 'idle',
  autoGenerateBlockId: null,
  // EDITOR-3407: Auto-reorg initial state
  autoReorgEnabled: true, // Enabled by default
  autoReorgThreshold: 0.8, // Default 0.8 threshold
  autoReorgStatus: 'idle',
  // EDITOR-3502: Reorganization modal initial state
  reorgModalOpen: false,
  reorgModalStatus: 'idle',
  reorgModalDocumentId: null,
  reorgModalConceptMatches: [],
  reorgModalError: null,
  // FE-503: Favorites initial state
  favoriteBlockIds: [],
  // FE-504: Block data initial state
  blockTitles: new Map(),
  topLevelBlockIds: [],

  // Focus mode actions
  setFocusedBlockId: (id) => set({ focusedBlockId: id }),

  enterFocusMode: (blockId) => set({ focusedBlockId: blockId }),

  exitFocusMode: () => set({ focusedBlockId: null }),

  // Document actions
  setCurrentDocumentId: (id) => set({ currentDocumentId: id }),

  // Selection actions
  setSelectedBlocks: (ids) => set({ selectedBlockIds: ids }),

  clearSelection: () => set({ selectedBlockIds: [] }),

  // EDITOR-3203: Autocomplete actions
  openAutocomplete: (blockId) =>
    set({
      autocompleteOpen: true,
      autocompleteBlockId: blockId,
      autocompleteQuery: '',
      autocompleteSelectedIndex: 0,
    }),

  closeAutocomplete: () =>
    set({
      autocompleteOpen: false,
      autocompleteQuery: '',
      autocompleteBlockId: null,
      autocompleteSelectedIndex: 0,
    }),

  setAutocompleteQuery: (query) =>
    set({
      autocompleteQuery: query,
      autocompleteSelectedIndex: 0, // Reset selection when query changes
    }),

  setAutocompleteSelectedIndex: (index) =>
    set({ autocompleteSelectedIndex: index }),

  // EDITOR-3405: Portal picker actions
  openPortalPicker: (blockId) =>
    set({
      portalPickerOpen: true,
      portalPickerBlockId: blockId,
      portalPickerQuery: '',
      portalPickerSelectedIndex: 0,
    }),

  closePortalPicker: () =>
    set({
      portalPickerOpen: false,
      portalPickerQuery: '',
      portalPickerBlockId: null,
      portalPickerSelectedIndex: 0,
    }),

  setPortalPickerQuery: (query) =>
    set({
      portalPickerQuery: query,
      portalPickerSelectedIndex: 0, // Reset selection when query changes
    }),

  setPortalPickerSelectedIndex: (index) =>
    set({ portalPickerSelectedIndex: index }),

  // EDITOR-3409: Portal search modal actions
  openPortalSearchModal: (bulletId) =>
    set({
      portalSearchModalOpen: true,
      portalSearchCurrentBulletId: bulletId,
      portalSearchQuery: '',
      portalSearchResults: [],
      portalSearchSelectedIndex: 0,
    }),

  closePortalSearchModal: () =>
    set({
      portalSearchModalOpen: false,
      portalSearchQuery: '',
      portalSearchResults: [],
      portalSearchRecents: [],
      portalSearchCurrentBulletId: null,
      portalSearchSelectedIndex: 0,
    }),

  setPortalSearchQuery: (query) =>
    set({
      portalSearchQuery: query,
      portalSearchSelectedIndex: 0, // Reset selection when query changes
    }),

  setPortalSearchResults: (results) =>
    set({ portalSearchResults: results }),

  setPortalSearchRecents: (recents) =>
    set({ portalSearchRecents: recents }),

  setPortalSearchSelectedIndex: (index) =>
    set({ portalSearchSelectedIndex: index }),

  // EDITOR-3510: Slash menu actions
  openSlashMenu: (blockId) =>
    set({
      slashMenuOpen: true,
      slashMenuBlockId: blockId,
      slashMenuQuery: '',
      slashMenuSelectedIndex: 0,
    }),

  closeSlashMenu: () =>
    set({
      slashMenuOpen: false,
      slashMenuQuery: '',
      slashMenuBlockId: null,
      slashMenuSelectedIndex: 0,
    }),

  setSlashMenuQuery: (query) =>
    set({
      slashMenuQuery: query,
      slashMenuSelectedIndex: 0, // Reset selection when query changes
    }),

  setSlashMenuSelectedIndex: (index) =>
    set({ slashMenuSelectedIndex: index }),

  // EDITOR-3602: Auto-generate actions
  setAutoGenerateEnabled: (enabled) =>
    set({ autoGenerateEnabled: enabled }),

  setAutoGenerateStatus: (status) =>
    set({ autoGenerateStatus: status }),

  startAutoGenerate: (blockId) =>
    set({
      autoGenerateStatus: 'pending',
      autoGenerateBlockId: blockId,
    }),

  completeAutoGenerate: () =>
    set({
      autoGenerateStatus: 'completed',
    }),

  cancelAutoGenerate: () =>
    set({
      autoGenerateStatus: 'cancelled',
    }),

  resetAutoGenerate: () =>
    set({
      autoGenerateStatus: 'idle',
      autoGenerateBlockId: null,
    }),

  // EDITOR-3407: Auto-reorg actions
  setAutoReorgEnabled: (enabled) =>
    set({ autoReorgEnabled: enabled }),

  setAutoReorgThreshold: (threshold) =>
    set({ autoReorgThreshold: threshold }),

  setAutoReorgStatus: (status) =>
    set({ autoReorgStatus: status }),

  // EDITOR-3502: Reorganization modal actions
  openReorgModal: (documentId) =>
    set({
      reorgModalOpen: true,
      reorgModalDocumentId: documentId,
      reorgModalStatus: 'idle',
      reorgModalConceptMatches: [],
      reorgModalError: null,
    }),

  closeReorgModal: () =>
    set({
      reorgModalOpen: false,
      reorgModalStatus: 'idle',
      reorgModalDocumentId: null,
      reorgModalConceptMatches: [],
      reorgModalError: null,
    }),

  setReorgModalStatus: (status) =>
    set({ reorgModalStatus: status }),

  setReorgModalConceptMatches: (matches) =>
    set({ reorgModalConceptMatches: matches }),

  setReorgModalError: (error) =>
    set({ reorgModalError: error }),

  toggleReorgMatch: (concept, blockId) =>
    set((state) => {
      const updatedMatches = state.reorgModalConceptMatches.map((cm) => {
        if (cm.concept === concept) {
          const newSelected = new Set(cm.selectedMatches)
          if (newSelected.has(blockId)) {
            newSelected.delete(blockId)
          } else {
            newSelected.add(blockId)
          }
          return { ...cm, selectedMatches: newSelected }
        }
        return cm
      })
      return { reorgModalConceptMatches: updatedMatches }
    }),

  // FE-503: Favorites actions
  loadFavorites: () => {
    try {
      const stored = localStorage.getItem('hydra:favorites')
      if (stored) {
        const favoriteBlockIds = JSON.parse(stored)
        if (Array.isArray(favoriteBlockIds)) {
          set({ favoriteBlockIds })
        }
      }
    } catch {
      // Ignore parse errors
    }
  },

  toggleFavorite: (blockId) =>
    set((state) => {
      const index = state.favoriteBlockIds.indexOf(blockId)
      let newFavorites: string[]
      if (index >= 0) {
        // Remove from favorites
        newFavorites = state.favoriteBlockIds.filter((id) => id !== blockId)
      } else {
        // Add to favorites
        newFavorites = [...state.favoriteBlockIds, blockId]
      }
      // Persist to localStorage
      localStorage.setItem('hydra:favorites', JSON.stringify(newFavorites))
      return { favoriteBlockIds: newFavorites }
    }),

  isFavorite: function (blockId: string): boolean {
    // Access state via this method to avoid circular reference
    // This is a bound method that checks current favorites
    const { favoriteBlockIds } = useEditorStore.getState()
    return favoriteBlockIds.includes(blockId)
  },

  reorderFavorites: (blockId, newIndex) =>
    set((state) => {
      const currentIndex = state.favoriteBlockIds.indexOf(blockId)
      if (currentIndex < 0) return state // Block not in favorites

      const newFavorites = [...state.favoriteBlockIds]
      // Remove from current position
      newFavorites.splice(currentIndex, 1)
      // Insert at new position
      newFavorites.splice(newIndex, 0, blockId)
      // Persist to localStorage
      localStorage.setItem('hydra:favorites', JSON.stringify(newFavorites))
      return { favoriteBlockIds: newFavorites }
    }),

  clearFavorites: () => {
    localStorage.setItem('hydra:favorites', JSON.stringify([]))
    set({ favoriteBlockIds: [] })
  },

  // FE-504: Block data actions
  syncBlockData: (topLevelBlockIds, blockTitles) =>
    set({ topLevelBlockIds, blockTitles }),
}))

/**
 * Selector for checking if editor is in focus mode
 */
export const selectIsInFocusMode = (state: EditorState): boolean =>
  state.focusedBlockId !== null

/**
 * Selector for getting the focused block ID
 */
export const selectFocusedBlockId = (state: EditorState): string | null =>
  state.focusedBlockId

/**
 * Selector for getting the current document ID
 */
export const selectCurrentDocumentId = (state: EditorState): string | null =>
  state.currentDocumentId

/**
 * Selector for getting the selected block IDs
 */
export const selectSelectedBlockIds = (state: EditorState): string[] =>
  state.selectedBlockIds

/**
 * Selector for checking if any blocks are selected
 */
export const selectHasSelection = (state: EditorState): boolean =>
  state.selectedBlockIds.length > 0

/**
 * Selector for getting the current editor mode
 */
export const selectEditorMode = (state: EditorState): EditorMode =>
  state.focusedBlockId !== null ? 'focus' : 'normal'

// EDITOR-3203: Autocomplete selectors

/**
 * Selector for checking if autocomplete is open
 */
export const selectIsAutocompleteOpen = (state: EditorState): boolean =>
  state.autocompleteOpen

/**
 * Selector for getting the autocomplete query
 */
export const selectAutocompleteQuery = (state: EditorState): string =>
  state.autocompleteQuery

/**
 * Selector for getting the autocomplete block ID
 */
export const selectAutocompleteBlockId = (state: EditorState): string | null =>
  state.autocompleteBlockId

/**
 * Selector for getting the autocomplete selected index
 */
export const selectAutocompleteSelectedIndex = (state: EditorState): number =>
  state.autocompleteSelectedIndex

// EDITOR-3405: Portal picker selectors

/**
 * Selector for checking if portal picker is open
 */
export const selectIsPortalPickerOpen = (state: EditorState): boolean =>
  state.portalPickerOpen

/**
 * Selector for getting the portal picker query
 */
export const selectPortalPickerQuery = (state: EditorState): string =>
  state.portalPickerQuery

/**
 * Selector for getting the portal picker block ID
 */
export const selectPortalPickerBlockId = (state: EditorState): string | null =>
  state.portalPickerBlockId

/**
 * Selector for getting the portal picker selected index
 */
export const selectPortalPickerSelectedIndex = (state: EditorState): number =>
  state.portalPickerSelectedIndex

// EDITOR-3409: Portal search modal selectors

/**
 * Selector for checking if portal search modal is open
 */
export const selectIsPortalSearchModalOpen = (state: EditorState): boolean =>
  state.portalSearchModalOpen

/**
 * Selector for getting the portal search query
 */
export const selectPortalSearchQuery = (state: EditorState): string =>
  state.portalSearchQuery

/**
 * Selector for getting the portal search results
 */
export const selectPortalSearchResults = (state: EditorState): FuzzySearchResult[] =>
  state.portalSearchResults

/**
 * Selector for getting the portal search recents
 */
export const selectPortalSearchRecents = (state: EditorState): RecentItem[] =>
  state.portalSearchRecents

/**
 * Selector for getting the portal search selected index
 */
export const selectPortalSearchSelectedIndex = (state: EditorState): number =>
  state.portalSearchSelectedIndex

/**
 * Selector for getting the current bullet ID for portal search
 */
export const selectPortalSearchCurrentBulletId = (state: EditorState): string | null =>
  state.portalSearchCurrentBulletId

// EDITOR-3602: Auto-generate selectors

/**
 * Selector for checking if auto-generate is enabled
 */
export const selectAutoGenerateEnabled = (state: EditorState): boolean =>
  state.autoGenerateEnabled

/**
 * Selector for getting auto-generate status
 */
export const selectAutoGenerateStatus = (state: EditorState): AutoGenerateStatus =>
  state.autoGenerateStatus

/**
 * Selector for getting auto-generate block ID
 */
export const selectAutoGenerateBlockId = (state: EditorState): string | null =>
  state.autoGenerateBlockId

/**
 * Selector for checking if auto-generate is currently active (pending or generating)
 */
export const selectIsAutoGenerating = (state: EditorState): boolean =>
  state.autoGenerateStatus === 'pending' || state.autoGenerateStatus === 'generating'

// EDITOR-3407: Auto-reorg selectors

/**
 * Selector for checking if auto-reorg is enabled
 */
export const selectAutoReorgEnabled = (state: EditorState): boolean =>
  state.autoReorgEnabled

/**
 * Selector for getting auto-reorg threshold
 */
export const selectAutoReorgThreshold = (state: EditorState): number =>
  state.autoReorgThreshold

/**
 * Selector for getting auto-reorg status
 */
export const selectAutoReorgStatus = (state: EditorState): AutoReorgStatus =>
  state.autoReorgStatus

/**
 * Selector for checking if auto-reorg is currently processing
 */
export const selectIsAutoReorgProcessing = (state: EditorState): boolean =>
  state.autoReorgStatus === 'processing'

// EDITOR-3502: Reorganization modal selectors

/**
 * Selector for checking if reorganization modal is open
 */
export const selectIsReorgModalOpen = (state: EditorState): boolean =>
  state.reorgModalOpen

/**
 * Selector for getting reorganization modal status
 */
export const selectReorgModalStatus = (state: EditorState): ReorgModalStatus =>
  state.reorgModalStatus

/**
 * Selector for getting reorganization modal document ID
 */
export const selectReorgModalDocumentId = (state: EditorState): string | null =>
  state.reorgModalDocumentId

/**
 * Selector for getting reorganization modal concept matches
 */
export const selectReorgModalConceptMatches = (state: EditorState): ConceptMatch[] =>
  state.reorgModalConceptMatches

/**
 * Selector for getting reorganization modal error
 */
export const selectReorgModalError = (state: EditorState): string | null =>
  state.reorgModalError

/**
 * Selector for getting total selected matches count
 */
export const selectReorgModalSelectedCount = (state: EditorState): number =>
  state.reorgModalConceptMatches.reduce((total, cm) => total + cm.selectedMatches.size, 0)

// FE-503: Favorites selectors

/**
 * Selector for getting the favorite block IDs
 */
export const selectFavoriteBlockIds = (state: EditorState): string[] =>
  state.favoriteBlockIds

/**
 * Selector for checking if there are any favorites
 */
export const selectHasFavorites = (state: EditorState): boolean =>
  state.favoriteBlockIds.length > 0

/**
 * Selector for getting favorites count
 */
export const selectFavoritesCount = (state: EditorState): number =>
  state.favoriteBlockIds.length
