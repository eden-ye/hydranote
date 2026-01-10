/**
 * useFocusMode hook
 * FE-406: Focus Mode Navigation
 *
 * Provides focus mode functionality for zooming into specific blocks.
 * - Double-click or shortcut enters focus mode
 * - Escape key exits focus mode
 * - Only shows focused block + children (siblings hidden)
 */
import { useCallback, useEffect } from 'react'
import {
  useEditorStore,
  selectIsInFocusMode,
  selectFocusedBlockId,
} from '../stores/editor-store'

/**
 * Hook for managing focus mode in the editor
 */
export function useFocusMode() {
  const isInFocusMode = useEditorStore(selectIsInFocusMode)
  const focusedBlockId = useEditorStore(selectFocusedBlockId)
  const enterFocusModeAction = useEditorStore((state) => state.enterFocusMode)
  const exitFocusModeAction = useEditorStore((state) => state.exitFocusMode)

  /**
   * Enter focus mode on a specific block
   */
  const enterFocusMode = useCallback(
    (blockId: string) => {
      enterFocusModeAction(blockId)
    },
    [enterFocusModeAction]
  )

  /**
   * Exit focus mode
   */
  const exitFocusMode = useCallback(() => {
    exitFocusModeAction()
  }, [exitFocusModeAction])

  /**
   * Check if a specific block is the focused block
   */
  const isFocused = useCallback(
    (blockId: string) => {
      return focusedBlockId === blockId
    },
    [focusedBlockId]
  )

  /**
   * Handle keyboard events for focus mode
   * - Escape: Exit focus mode
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isInFocusMode) {
        exitFocusMode()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isInFocusMode, exitFocusMode])

  return {
    isInFocusMode,
    focusedBlockId,
    enterFocusMode,
    exitFocusMode,
    isFocused,
  }
}
