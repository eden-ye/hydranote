/**
 * EDITOR-3510: Slash menu utilities
 *
 * Data and utilities for the slash command menu.
 */

import type { BlockType } from './markdown-shortcuts'

/**
 * Slash menu item definition
 */
export interface SlashMenuItem {
  /** Unique identifier for the item */
  id: string
  /** Display label */
  label: string
  /** Block type this item creates */
  blockType: BlockType
  /** Icon representation (emoji or SVG string) */
  icon: string
  /** Keyboard shortcut hint */
  shortcut: string
  /** Search keywords for filtering */
  keywords: string[]
}

/**
 * All available slash menu items
 */
export const SLASH_MENU_ITEMS: SlashMenuItem[] = [
  {
    id: 'bullet',
    label: 'Bullet List',
    blockType: 'bullet',
    icon: '•',
    shortcut: '- or *',
    keywords: ['bullet', 'list', 'unordered'],
  },
  {
    id: 'numbered',
    label: 'Numbered List',
    blockType: 'numbered',
    icon: '1.',
    shortcut: '1.',
    keywords: ['numbered', 'list', 'ordered', 'number'],
  },
  {
    id: 'checkbox',
    label: 'Checkbox',
    blockType: 'checkbox',
    icon: '☐',
    shortcut: '[] or [x]',
    keywords: ['checkbox', 'todo', 'task', 'check'],
  },
  {
    id: 'heading1',
    label: 'Heading 1',
    blockType: 'heading1',
    icon: 'H1',
    shortcut: '#',
    keywords: ['heading', 'h1', 'title', 'header'],
  },
  {
    id: 'heading2',
    label: 'Heading 2',
    blockType: 'heading2',
    icon: 'H2',
    shortcut: '##',
    keywords: ['heading', 'h2', 'subtitle', 'header'],
  },
  {
    id: 'heading3',
    label: 'Heading 3',
    blockType: 'heading3',
    icon: 'H3',
    shortcut: '###',
    keywords: ['heading', 'h3', 'header'],
  },
  {
    id: 'divider',
    label: 'Divider',
    blockType: 'divider',
    icon: '―',
    shortcut: '---',
    keywords: ['divider', 'separator', 'line', 'hr'],
  },
]

/**
 * Filter menu items by search query
 *
 * Performs fuzzy matching against label, blockType, and keywords.
 *
 * @param query - Search query
 * @returns Filtered menu items
 */
export function filterMenuItems(query: string): SlashMenuItem[] {
  if (!query) {
    return SLASH_MENU_ITEMS
  }

  const lowerQuery = query.toLowerCase()

  return SLASH_MENU_ITEMS.filter((item) => {
    const labelMatch = item.label.toLowerCase().includes(lowerQuery)
    const typeMatch = item.blockType.toLowerCase().includes(lowerQuery)
    const keywordMatch = item.keywords.some((kw) =>
      kw.toLowerCase().includes(lowerQuery)
    )

    return labelMatch || typeMatch || keywordMatch
  })
}

/**
 * Get menu item by block type
 *
 * @param blockType - Block type to find
 * @returns Menu item or undefined
 */
export function getMenuItemByBlockType(
  blockType: BlockType
): SlashMenuItem | undefined {
  return SLASH_MENU_ITEMS.find((item) => item.blockType === blockType)
}

/**
 * Check if text is a slash command trigger
 *
 * @param text - Text to check
 * @returns True if text is just "/"
 */
export function isSlashTrigger(text: string): boolean {
  return text === '/'
}

/**
 * Extract query from slash command text
 *
 * @param text - Text like "/bullet" or "/head"
 * @returns Query string without the slash, or null if not a slash command
 */
export function extractSlashQuery(text: string): string | null {
  if (!text.startsWith('/')) {
    return null
  }
  return text.slice(1)
}
