/**
 * Editor Store
 * FE-406: Focus Mode Navigation
 *
 * Manages editor state including focus mode for zooming into specific blocks.
 */
import { create } from 'zustand'

/**
 * Editor Store state interface
 */
interface EditorState {
  /** ID of the currently focused block (null if not in focus mode) */
  focusedBlockId: string | null
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
}

/**
 * Editor store combining state and actions
 */
export const useEditorStore = create<EditorState & EditorActions>((set) => ({
  // Initial state
  focusedBlockId: null,

  // Actions
  setFocusedBlockId: (id) => set({ focusedBlockId: id }),

  enterFocusMode: (blockId) => set({ focusedBlockId: blockId }),

  exitFocusMode: () => set({ focusedBlockId: null }),
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
