/**
 * Editor Store
 * FE-406: Focus Mode Navigation
 * EDITOR-307: Document ID and Selection State
 *
 * Manages editor state including:
 * - Current document ID
 * - Selection state (selected block IDs)
 * - Editor mode (normal, focus)
 */
import { create } from 'zustand'

/**
 * Editor mode type
 */
export type EditorMode = 'normal' | 'focus'

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
}

/**
 * Editor store combining state and actions
 */
export const useEditorStore = create<EditorState & EditorActions>((set) => ({
  // Initial state
  focusedBlockId: null,
  currentDocumentId: null,
  selectedBlockIds: [],

  // Focus mode actions
  setFocusedBlockId: (id) => set({ focusedBlockId: id }),

  enterFocusMode: (blockId) => set({ focusedBlockId: blockId }),

  exitFocusMode: () => set({ focusedBlockId: null }),

  // Document actions
  setCurrentDocumentId: (id) => set({ currentDocumentId: id }),

  // Selection actions
  setSelectedBlocks: (ids) => set({ selectedBlockIds: ids }),

  clearSelection: () => set({ selectedBlockIds: [] }),
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
