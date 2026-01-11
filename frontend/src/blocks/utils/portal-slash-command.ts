/**
 * Portal Slash Command Utilities (EDITOR-3405)
 *
 * Provides detection and parsing for /portal slash command.
 */

/**
 * Check if text starts with /portal command (or partial match)
 *
 * @param text - The text to check
 * @returns True if text starts with /portal or partial match like /p, /po, etc.
 */
export function isPortalSlashCommand(text: string): boolean {
  // Original text must start with / (no leading whitespace allowed)
  if (!text.startsWith('/')) {
    return false
  }

  const normalized = text.toLowerCase()

  if (normalized === '' || normalized === '/') {
    return false
  }

  // Get the command part (everything after / until space or end)
  const spaceIndex = normalized.indexOf(' ', 1)
  const command = spaceIndex === -1 ? normalized.slice(1) : normalized.slice(1, spaceIndex)

  // Check if command is a prefix of 'portal'
  const target = 'portal'
  return target.startsWith(command) && command.length > 0
}

/**
 * Remove /portal command from text
 *
 * @param text - The text containing /portal command
 * @returns Text with /portal removed
 */
export function removePortalSlashCommand(text: string): string {
  if (!isPortalSlashCommand(text)) {
    return text
  }

  // Find the end of the command (space or end of string)
  const spaceIndex = text.indexOf(' ')
  if (spaceIndex === -1) {
    return ''
  }

  return text.slice(spaceIndex)
}
