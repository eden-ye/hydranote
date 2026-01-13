/**
 * EDITOR-3510: Markdown shortcuts for block type conversion
 *
 * Parses markdown-style shortcuts typed at the beginning of a line
 * and converts them into block type changes.
 */

/**
 * Block types supported by the type system
 */
export type BlockType =
  | 'bullet'
  | 'numbered'
  | 'checkbox'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'divider'

/**
 * Result of parsing a markdown shortcut
 */
export interface MarkdownShortcutResult {
  /** The block type to convert to */
  blockType: BlockType
  /** Whether checkbox is checked (only relevant for checkbox type) */
  isChecked: boolean
  /** Text remaining after the shortcut pattern */
  remainingText: string
}

/**
 * Shortcut patterns for markdown-style block conversion
 * Format: [pattern regex, block type, isChecked flag extractor]
 */
const SHORTCUT_PATTERNS: Array<{
  pattern: RegExp
  blockType: BlockType
  getChecked: (match: RegExpMatchArray) => boolean
}> = [
  // Checkbox patterns: [], [ ], [x], [X]
  {
    pattern: /^\[\s*\]\s(.*)$/,
    blockType: 'checkbox',
    getChecked: () => false,
  },
  {
    pattern: /^\[[xX]\]\s(.*)$/,
    blockType: 'checkbox',
    getChecked: () => true,
  },
  // Numbered list: 1., 2., etc.
  {
    pattern: /^\d+\.\s(.*)$/,
    blockType: 'numbered',
    getChecked: () => false,
  },
  // Bullet list: - or *
  {
    pattern: /^[-*]\s(.*)$/,
    blockType: 'bullet',
    getChecked: () => false,
  },
  // Heading 3: ###
  {
    pattern: /^###\s(.*)$/,
    blockType: 'heading3',
    getChecked: () => false,
  },
  // Heading 2: ##
  {
    pattern: /^##\s(.*)$/,
    blockType: 'heading2',
    getChecked: () => false,
  },
  // Heading 1: #
  {
    pattern: /^#\s(.*)$/,
    blockType: 'heading1',
    getChecked: () => false,
  },
  // Divider: --- (with or without trailing space)
  {
    pattern: /^---\s?$/,
    blockType: 'divider',
    getChecked: () => false,
  },
]

/**
 * Parse text to detect markdown shortcuts
 *
 * Detects patterns like:
 * - `[] ` or `[ ] ` - Unchecked checkbox
 * - `[x] ` or `[X] ` - Checked checkbox
 * - `1. ` or `2. ` - Numbered list
 * - `- ` or `* ` - Bullet list
 * - `# ` - Heading 1
 * - `## ` - Heading 2
 * - `### ` - Heading 3
 * - `---` - Divider
 *
 * @param text - Text to parse for shortcuts
 * @returns Result with block type and remaining text, or null if no match
 */
export function parseMarkdownShortcut(text: string): MarkdownShortcutResult | null {
  if (!text) return null

  for (const { pattern, blockType, getChecked } of SHORTCUT_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      return {
        blockType,
        isChecked: getChecked(match),
        remainingText: match[1] ?? '',
      }
    }
  }

  return null
}

/**
 * Check if text starts with a potential markdown shortcut prefix
 * Used for early detection before space is typed
 *
 * @param text - Text to check
 * @returns True if text could be the start of a shortcut
 */
export function isPotentialShortcut(text: string): boolean {
  const prefixes = [
    /^\[.*/, // Start of checkbox
    /^\d+\.?$/, // Start of numbered list
    /^[-*]$/, // Bullet prefix
    /^#{1,3}$/, // Heading prefix
    /^-{1,3}$/, // Divider prefix
  ]

  return prefixes.some(p => p.test(text))
}
