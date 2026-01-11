/**
 * Descriptor Repository for EDITOR-3202
 *
 * Provides the repository of available descriptors for autocomplete suggestions.
 * Descriptors are pseudo-child bullets that categorize content.
 *
 * Default descriptors: What, Why, How, Pros, Cons
 * Future: User-defined descriptors stored in IndexedDB/Supabase
 */

/**
 * Descriptor interface for categorizing content
 */
export interface Descriptor {
  /** Internal key (lowercase): 'what', 'why', 'how', 'pros', 'cons' */
  key: string
  /** Full display label for autocomplete: 'What is it', 'Why it matters', etc. */
  label: string
  /** Short label for inline display: 'What', 'Why', 'How', 'Pros', 'Cons' */
  shortLabel: string
  /** Optional auto-color for cheatsheet rendering: 'green' for pros, 'pink' for cons */
  autoColor?: string
}

/**
 * Default descriptors for all users
 *
 * Order is intentional for autocomplete:
 * 1. Informational (What, Why, How) - come first
 * 2. Evaluative (Pros, Cons) - come after
 */
export const DEFAULT_DESCRIPTORS: readonly Descriptor[] = [
  {
    key: 'what',
    label: 'What is it',
    shortLabel: 'What',
  },
  {
    key: 'why',
    label: 'Why it matters',
    shortLabel: 'Why',
  },
  {
    key: 'how',
    label: 'How it works',
    shortLabel: 'How',
  },
  {
    key: 'pros',
    label: 'Pros / Advantages',
    shortLabel: 'Pros',
    autoColor: 'green',
  },
  {
    key: 'cons',
    label: 'Cons / Disadvantages',
    shortLabel: 'Cons',
    autoColor: 'pink',
  },
] as const

/**
 * Get a descriptor by its key
 *
 * @param key - The descriptor key (e.g., 'what', 'why')
 * @returns The descriptor or undefined if not found
 */
export function getDescriptorByKey(key: string): Descriptor | undefined {
  return DEFAULT_DESCRIPTORS.find((d) => d.key === key)
}

/**
 * Get all available descriptors
 *
 * Returns a copy to prevent mutation of the default array.
 * Future: Will merge user-defined descriptors with defaults.
 *
 * @returns Array of all descriptors
 */
export function getAllDescriptors(): Descriptor[] {
  return [...DEFAULT_DESCRIPTORS]
}

/**
 * Get all descriptor keys in order
 *
 * Useful for validation and iteration.
 *
 * @returns Array of descriptor keys
 */
export function getDescriptorKeys(): string[] {
  return DEFAULT_DESCRIPTORS.map((d) => d.key)
}

/**
 * Check if a key is a valid default descriptor key
 *
 * @param key - The key to validate
 * @returns True if the key is a valid descriptor key
 */
export function isValidDescriptorKey(key: string): boolean {
  return DEFAULT_DESCRIPTORS.some((d) => d.key === key)
}
