/**
 * Fuzzy Search Utilities (EDITOR-3409)
 *
 * Client-side fuzzy search for portal search modal
 *
 * Scoring system:
 * - Exact match: 100 points
 * - Starts with query: 80-90 points (bonus for longer match ratio)
 * - Contains query: 50-60 points (bonus for longer match ratio)
 * - Threshold: 30 (filter out low scores)
 * - Limit: Top 20 results
 */

export interface BulletSearchItem {
  documentId: string
  blockId: string
  text: string
  contextPath: string
}

export interface FuzzySearchResult extends BulletSearchItem {
  score: number
}

export interface FuzzySearchOptions {
  limit?: number
  threshold?: number // Minimum score (0-100)
}

/**
 * Calculate fuzzy match score (0-100)
 */
export function calculateFuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase().trim()
  const t = target.toLowerCase()

  if (q === '') return 0
  if (t === q) return 100
  if (t.startsWith(q)) return 80 + (q.length / t.length) * 10
  if (t.includes(q)) return 50 + (q.length / t.length) * 10

  return 0
}

/**
 * Search bullets using fuzzy matching
 */
export function fuzzySearchBullets(
  query: string,
  allBullets: BulletSearchItem[],
  options: FuzzySearchOptions = {}
): FuzzySearchResult[] {
  const { limit = 20, threshold = 30 } = options

  if (!query.trim()) {
    return []
  }

  const results: FuzzySearchResult[] = []

  for (const bullet of allBullets) {
    const score = calculateFuzzyScore(query, bullet.text)

    if (score >= threshold) {
      results.push({
        ...bullet,
        score,
      })
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit)
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Highlight matching parts of text
 * Returns HTML string with <mark> tags around matches
 */
export function highlightMatches(text: string, query: string): string {
  if (!query) return text

  try {
    const escapedQuery = escapeRegExp(query)
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'))

    return parts
      .map((part) =>
        part.toLowerCase() === query.toLowerCase()
          ? `<mark class="search-highlight">${part}</mark>`
          : part
      )
      .join('')
  } catch {
    // If regex fails for any reason, return original text
    return text
  }
}
