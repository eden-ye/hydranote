/**
 * Color Palette System for Hydra Notes (EDITOR-3101)
 *
 * Defines the 6 predefined colors for manual text/background highlighting.
 * These colors are applied as inline marks on rich-text (similar to bold/italic).
 */

/**
 * Color definition with semantic name, hex value, and display properties
 */
export interface ColorDefinition {
  /** Unique identifier for the color */
  id: string
  /** Human-readable name for the color */
  name: string
  /** Background color hex value */
  backgroundColor: string
  /** Text color for contrast (dark text on light backgrounds) */
  textColor: string
  /** Keyboard shortcut key (0-9) for Cmd+Alt+[key] */
  shortcutKey: string
}

/**
 * The 6 predefined colors for highlighting.
 * Colors are chosen for good contrast and visual distinction.
 *
 * Note: Auto-colors (Pros=green, Cons=red) are handled separately in EDITOR-3302
 */
export const COLOR_PALETTE: readonly ColorDefinition[] = [
  {
    id: 'yellow',
    name: 'Yellow',
    backgroundColor: '#FEF3C7', // Amber-100
    textColor: '#92400E', // Amber-800
    shortcutKey: '1',
  },
  {
    id: 'green',
    name: 'Green',
    backgroundColor: '#D1FAE5', // Emerald-100
    textColor: '#065F46', // Emerald-800
    shortcutKey: '2',
  },
  {
    id: 'blue',
    name: 'Blue',
    backgroundColor: '#DBEAFE', // Blue-100
    textColor: '#1E40AF', // Blue-800
    shortcutKey: '3',
  },
  {
    id: 'purple',
    name: 'Purple',
    backgroundColor: '#EDE9FE', // Violet-100
    textColor: '#5B21B6', // Violet-800
    shortcutKey: '4',
  },
  {
    id: 'pink',
    name: 'Pink',
    backgroundColor: '#FCE7F3', // Pink-100
    textColor: '#9D174D', // Pink-800
    shortcutKey: '5',
  },
  {
    id: 'gray',
    name: 'Gray',
    backgroundColor: '#F3F4F6', // Gray-100
    textColor: '#1F2937', // Gray-800
    shortcutKey: '6',
  },
] as const

/**
 * Get color by ID
 */
export function getColorById(id: string): ColorDefinition | undefined {
  return COLOR_PALETTE.find((color) => color.id === id)
}

/**
 * Get color by shortcut key
 */
export function getColorByShortcut(key: string): ColorDefinition | undefined {
  return COLOR_PALETTE.find((color) => color.shortcutKey === key)
}

/**
 * Get all color IDs as a union type
 */
export type ColorId = (typeof COLOR_PALETTE)[number]['id']

/**
 * Check if a string is a valid color ID
 */
export function isValidColorId(id: string): id is ColorId {
  return COLOR_PALETTE.some((color) => color.id === id)
}

/**
 * Generate CSS variable name for a color
 */
export function getColorCssVar(id: string, property: 'bg' | 'text'): string {
  return `--hydra-highlight-${id}-${property}`
}

/**
 * Generate inline style for a highlighted text range
 */
export function getHighlightStyle(colorId: string): {
  backgroundColor: string
  color: string
} | null {
  const color = getColorById(colorId)
  if (!color) return null
  return {
    backgroundColor: color.backgroundColor,
    color: color.textColor,
  }
}

/**
 * CSS data attribute for background color marks
 * Used by BlockSuite's rich-text inline marks
 */
export const HIGHLIGHT_ATTRIBUTE = 'data-v-highlight'
