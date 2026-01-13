/**
 * EDITOR-3703: Dashing button (==) syntax parser
 *
 * Parses text containing == syntax to create a dashing button (—) separator
 * that splits main text from inline preview/cheat sheet content.
 */

/**
 * Result of parsing == syntax
 */
export interface DashingSyntaxResult {
  /** Text before == (main bullet text) */
  mainText: string
  /** Text after == (inline preview/cheat sheet) */
  previewText: string
  /** Whether space was detected after == */
  hasSpace: boolean
}

/**
 * Parse text to detect == syntax for dashing button creation
 *
 * Detects pattern:
 * - `text== ` or `text == ` - Creates dashing button with optional preview
 * - Only first == occurrence is parsed (only one dashing button per bullet)
 * - Requires space after == to trigger
 *
 * @param text - Text to parse for == syntax
 * @returns Result with main text and preview text, or null if no match
 */
export function parseDashingSyntax(text: string): DashingSyntaxResult | null {
  if (!text) return null

  // Pattern: any text, followed by ==, followed by space, then optional preview
  // We use a simple indexOf approach to find the first ==
  const dashIndex = text.indexOf('==')

  if (dashIndex === -1) return null // No == found
  if (dashIndex === 0) return null // == at start is invalid

  // Check if there's a space after ==
  const afterDash = text.slice(dashIndex + 2)
  if (!afterDash.startsWith(' ')) return null // Requires space after ==

  // Check if this is a subsequent == (already has a dashing button)
  // We detect this by checking if the remaining text after the first ==
  // contains another == without space (which would indicate existing structure)
  // For simplicity, we'll allow the first == to be parsed
  // The constraint "only one per bullet" will be enforced at the component level

  const mainText = text.slice(0, dashIndex).trimEnd()
  // Remove the first space after == but keep the rest
  const previewText = afterDash.slice(1)

  return {
    mainText,
    previewText,
    hasSpace: true,
  }
}

/**
 * Check if text ends with == (potentially waiting for space)
 * Used for early detection before space is typed
 *
 * @param text - Text to check
 * @returns True if text ends with ==
 */
export function endsWithDashingPrefix(text: string): boolean {
  return text.trim().endsWith('==')
}
