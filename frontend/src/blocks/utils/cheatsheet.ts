/**
 * Cheatsheet Rendering Engine for EDITOR-3301
 *
 * Computes and formats cheatsheet content when a bullet is folded.
 * The cheatsheet displays a summary of descriptor children in a formatted way.
 *
 * Format: "{What children} | {Why} | {How} | {Pros} vs. {Cons}"
 * Example: "React => A JavaScript Library | Fast, Component-based vs. Steep learning curve"
 */

import type { DescriptorType } from './descriptor'

/**
 * Maximum length for the cheatsheet before truncation
 */
export const CHEATSHEET_MAX_LENGTH = 100

/**
 * Separator between descriptor sections
 */
export const CHEATSHEET_SEPARATOR = '|'

/**
 * Separator between Pros and Cons sections
 */
export const PROS_CONS_SEPARATOR = 'vs.'

/**
 * Interface for descriptor child input
 */
export interface DescriptorChild {
  /** Text content of the descriptor */
  text: string
  /** Type of descriptor (what, why, how, pros, cons, custom) or null */
  descriptorType: DescriptorType | null
  /** Whether this child is a descriptor */
  isDescriptor: boolean
}

/**
 * Grouped descriptors by type
 */
export interface GroupedDescriptors {
  what: string[]
  why: string[]
  how: string[]
  pros: string[]
  cons: string[]
  custom: string[]
}

/**
 * Order of descriptor types in the cheatsheet
 * Informational (What, Why, How) come first, then evaluative (Pros vs. Cons)
 */
const DESCRIPTOR_ORDER: (keyof GroupedDescriptors)[] = [
  'what',
  'why',
  'how',
  // Pros and cons are handled specially with vs. separator
]

/**
 * Group descriptor children by their type
 *
 * @param children - Array of descriptor children
 * @returns Grouped descriptors by type
 */
export function groupDescriptorsByType(
  children: DescriptorChild[]
): GroupedDescriptors {
  const grouped: GroupedDescriptors = {
    what: [],
    why: [],
    how: [],
    pros: [],
    cons: [],
    custom: [],
  }

  for (const child of children) {
    // Skip non-descriptors
    if (!child.isDescriptor || !child.descriptorType) {
      continue
    }

    // Skip empty text
    const text = child.text.trim()
    if (!text) {
      continue
    }

    // Add to appropriate group
    const type = child.descriptorType
    if (type in grouped) {
      grouped[type as keyof GroupedDescriptors].push(text)
    }
  }

  return grouped
}

/**
 * Format a section of items into a comma-separated string
 *
 * @param items - Array of text items
 * @returns Comma-separated string
 */
export function formatCheatsheetSection(items: string[]): string {
  return items.join(', ')
}

/**
 * Truncate cheatsheet text if it exceeds max length
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length (defaults to CHEATSHEET_MAX_LENGTH)
 * @returns Truncated text with ellipsis if needed
 */
export function truncateCheatsheet(
  text: string,
  maxLength: number = CHEATSHEET_MAX_LENGTH
): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength) + '…'
}

/**
 * Compute the cheatsheet content from descriptor children
 *
 * Format: "{What} | {Why} | {How} | {Pros} vs. {Cons} | {Custom}"
 *
 * @param children - Array of descriptor children
 * @returns Formatted cheatsheet string
 */
export function computeCheatsheet(children: DescriptorChild[]): string {
  const grouped = groupDescriptorsByType(children)
  const sections: string[] = []

  // Add informational sections in order: What, Why, How
  for (const type of DESCRIPTOR_ORDER) {
    const items = grouped[type]
    if (items.length > 0) {
      sections.push(formatCheatsheetSection(items))
    }
  }

  // Handle Pros vs. Cons specially with vs. separator
  const prosText = formatCheatsheetSection(grouped.pros)
  const consText = formatCheatsheetSection(grouped.cons)

  if (prosText && consText) {
    // Both pros and cons present - use vs. separator
    sections.push(`${prosText} ${PROS_CONS_SEPARATOR} ${consText}`)
  } else if (prosText) {
    // Only pros
    sections.push(prosText)
  } else if (consText) {
    // Only cons
    sections.push(consText)
  }

  // Add custom descriptors at the end
  const customText = formatCheatsheetSection(grouped.custom)
  if (customText) {
    sections.push(customText)
  }

  // Join sections with separator
  const cheatsheet = sections.join(` ${CHEATSHEET_SEPARATOR} `)

  // Truncate if too long
  return truncateCheatsheet(cheatsheet)
}
