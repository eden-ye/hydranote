/**
 * Portal Creation Shortcut Utilities (EDITOR-3405)
 *
 * Provides keyboard shortcut detection for portal creation.
 * Shortcut: Cmd+Shift+P (Mac) / Ctrl+Shift+P (Windows/Linux)
 */

/**
 * Check if keyboard event is the portal creation shortcut
 *
 * @param event - The keyboard event
 * @returns True if event is Cmd+Shift+P or Ctrl+Shift+P
 */
export function isPortalCreationShortcut(event: KeyboardEvent): boolean {
  const key = event.key.toLowerCase()
  const hasModifier = event.metaKey || event.ctrlKey
  const hasShift = event.shiftKey
  const hasNoAlt = !event.altKey

  return key === 'p' && hasModifier && hasShift && hasNoAlt
}
