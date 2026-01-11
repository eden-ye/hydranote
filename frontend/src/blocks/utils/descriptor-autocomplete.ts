/**
 * Descriptor Autocomplete Utilities (EDITOR-3203)
 *
 * Provides fuzzy matching and filtering for descriptor autocomplete.
 * Used when user types `~` to insert a descriptor.
 */

import { getAllDescriptors, type Descriptor } from './descriptor-repository'

/**
 * Result of filtering descriptors
 */
export interface AutocompleteResult {
  /** The matched descriptor */
  descriptor: Descriptor
  /** Match score (higher = better match) */
  score: number
  /** Which field was matched */
  matchedField: 'key' | 'label' | 'shortLabel'
}

/**
 * Fuzzy match a query against a target string
 *
 * @param query - The search query
 * @param target - The target string to match against
 * @returns True if the query matches the target
 */
export function fuzzyMatch(query: string, target: string): boolean {
  const normalizedQuery = query.toLowerCase().trim()
  const normalizedTarget = target.toLowerCase()

  // Empty query matches everything
  if (normalizedQuery === '') {
    return true
  }

  // Query can't match if it's longer than target
  if (normalizedQuery.length > normalizedTarget.length) {
    return false
  }

  // Check if target contains query as substring
  return normalizedTarget.includes(normalizedQuery)
}

/**
 * Calculate match score for ranking results
 *
 * @param query - The search query
 * @param target - The target string that matched
 * @param field - Which field was matched
 * @returns A score (higher = better match)
 */
function calculateScore(
  query: string,
  target: string,
  field: 'key' | 'label' | 'shortLabel'
): number {
  const normalizedQuery = query.toLowerCase().trim()
  const normalizedTarget = target.toLowerCase()

  // Empty query gets base score
  if (normalizedQuery === '') {
    return 50
  }

  let score = 0

  // Exact match gets highest score
  if (normalizedTarget === normalizedQuery) {
    score = 100
  }
  // Starts with query gets high score
  else if (normalizedTarget.startsWith(normalizedQuery)) {
    score = 80 + (normalizedQuery.length / normalizedTarget.length) * 10
  }
  // Contains query gets medium score
  else {
    score = 50 + (normalizedQuery.length / normalizedTarget.length) * 10
  }

  // Boost score based on field priority
  // key > shortLabel > label
  if (field === 'key') {
    score += 10
  } else if (field === 'shortLabel') {
    score += 5
  }

  return score
}

/**
 * Filter descriptors based on a search query
 *
 * Searches across key, label, and shortLabel fields.
 * Results are ranked by match quality.
 *
 * @param query - The search query (text after `~`)
 * @returns Array of matching descriptors with scores, sorted by score descending
 */
export function filterDescriptors(query: string): AutocompleteResult[] {
  const normalizedQuery = query.trim()
  const descriptors = getAllDescriptors()
  const results: AutocompleteResult[] = []

  for (const descriptor of descriptors) {
    // Check each field for matches
    const fields: Array<{ name: 'key' | 'label' | 'shortLabel'; value: string }> = [
      { name: 'key', value: descriptor.key },
      { name: 'shortLabel', value: descriptor.shortLabel },
      { name: 'label', value: descriptor.label },
    ]

    let bestMatch: AutocompleteResult | null = null

    for (const field of fields) {
      if (fuzzyMatch(normalizedQuery, field.value)) {
        const score = calculateScore(normalizedQuery, field.value, field.name)

        if (!bestMatch || score > bestMatch.score) {
          bestMatch = {
            descriptor,
            score,
            matchedField: field.name,
          }
        }
      }
    }

    if (bestMatch) {
      results.push(bestMatch)
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score)

  return results
}

/**
 * Trigger character for descriptor autocomplete
 */
export const DESCRIPTOR_TRIGGER = '~'

/**
 * Check if a key event should trigger descriptor autocomplete
 *
 * @param event - The keyboard event
 * @returns True if the event should trigger autocomplete
 */
export function shouldTriggerDescriptorAutocomplete(event: {
  key: string
  shiftKey?: boolean
}): boolean {
  // ~ is typed with Shift+` on US keyboards
  return event.key === DESCRIPTOR_TRIGGER
}
