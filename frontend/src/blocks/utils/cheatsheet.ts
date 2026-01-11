/**
 * Cheatsheet Rendering Engine for EDITOR-3301
 *
 * Computes and formats cheatsheet content when a bullet is folded.
 * The cheatsheet displays a summary of descriptor children in a formatted way.
 *
 * Format: "{What children} | {Why} | {How} | {Pros} vs. {Cons}"
 * Example: "React => A JavaScript Library | Fast, Component-based vs. Steep learning curve"
 *
 * EDITOR-3302: Added support for auto-colors on Pros (green) and Cons (pink) sections.
 */

import type { DescriptorType } from './descriptor'

/**
 * EDITOR-3302: Color definition for cheatsheet segments
 */
export interface CheatsheetColor {
  backgroundColor: string
  textColor: string
}

/**
 * EDITOR-3304: Type of separator for styling
 */
export type SeparatorType = 'pipe' | 'versus' | 'arrow'

/**
 * EDITOR-3302: Segment of the cheatsheet with optional color
 * EDITOR-3304: Added separatorType for styled separators
 */
export interface CheatsheetSegment {
  /** Text content of the segment */
  text: string
  /** Optional color for this segment (Pros = green, Cons = pink) */
  color?: CheatsheetColor
  /** EDITOR-3304: Type of separator for CSS styling (pipe, versus, arrow) */
  separatorType?: SeparatorType
}

/**
 * EDITOR-3302: Auto-colors for Pros and Cons sections
 * Uses colors from the color palette (EDITOR-3101) for consistency
 */
export const CHEATSHEET_COLORS: Record<string, CheatsheetColor | undefined> = {
  pros: {
    backgroundColor: '#D1FAE5', // Emerald-100 (same as green in color-palette)
    textColor: '#065F46', // Emerald-800
  },
  cons: {
    backgroundColor: '#FCE7F3', // Pink-100 (same as pink in color-palette)
    textColor: '#9D174D', // Pink-800
  },
  // Neutral descriptors have no color
  what: undefined,
  why: undefined,
  how: undefined,
  custom: undefined,
}

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

/**
 * EDITOR-3302: Compute the cheatsheet as colored segments
 * EDITOR-3304: Added separatorType for styled separators
 *
 * Returns an array of segments, each with text and optional color.
 * Pros sections get green, Cons get pink, others are neutral.
 * Separators are marked with their type for CSS styling.
 *
 * @param children - Array of descriptor children
 * @returns Array of cheatsheet segments with color info
 */
export function computeCheatsheetSegments(
  children: DescriptorChild[]
): CheatsheetSegment[] {
  const grouped = groupDescriptorsByType(children)
  const segments: CheatsheetSegment[] = []

  // EDITOR-3304: Helper to add pipe separator if segments already exist
  const addSeparator = () => {
    if (segments.length > 0) {
      segments.push({ text: ` ${CHEATSHEET_SEPARATOR} `, separatorType: 'pipe' })
    }
  }

  // Add informational sections in order: What, Why, How (no color)
  for (const type of DESCRIPTOR_ORDER) {
    const items = grouped[type]
    if (items.length > 0) {
      addSeparator()
      segments.push({
        text: formatCheatsheetSection(items),
        color: CHEATSHEET_COLORS[type],
      })
    }
  }

  // Handle Pros vs. Cons specially with vs. separator and colors
  const prosText = formatCheatsheetSection(grouped.pros)
  const consText = formatCheatsheetSection(grouped.cons)

  if (prosText && consText) {
    // Both pros and cons present
    addSeparator()
    segments.push({
      text: prosText,
      color: CHEATSHEET_COLORS.pros,
    })
    // EDITOR-3304: Mark vs. separator with versus type
    segments.push({ text: ` ${PROS_CONS_SEPARATOR} `, separatorType: 'versus' })
    segments.push({
      text: consText,
      color: CHEATSHEET_COLORS.cons,
    })
  } else if (prosText) {
    // Only pros
    addSeparator()
    segments.push({
      text: prosText,
      color: CHEATSHEET_COLORS.pros,
    })
  } else if (consText) {
    // Only cons
    addSeparator()
    segments.push({
      text: consText,
      color: CHEATSHEET_COLORS.cons,
    })
  }

  // Add custom descriptors at the end (no color)
  const customText = formatCheatsheetSection(grouped.custom)
  if (customText) {
    addSeparator()
    segments.push({
      text: customText,
      color: CHEATSHEET_COLORS.custom,
    })
  }

  // Apply truncation to the full text
  const fullText = segments.map((s) => s.text).join('')
  if (fullText.length > CHEATSHEET_MAX_LENGTH) {
    // Truncate from the end, preserving segment structure as much as possible
    let remaining = CHEATSHEET_MAX_LENGTH
    const truncatedSegments: CheatsheetSegment[] = []

    for (const segment of segments) {
      if (remaining <= 0) break

      if (segment.text.length <= remaining) {
        truncatedSegments.push(segment)
        remaining -= segment.text.length
      } else {
        // Truncate this segment
        truncatedSegments.push({
          text: segment.text.slice(0, remaining) + '…',
          color: segment.color,
          separatorType: segment.separatorType,
        })
        break
      }
    }

    return truncatedSegments
  }

  return segments
}
