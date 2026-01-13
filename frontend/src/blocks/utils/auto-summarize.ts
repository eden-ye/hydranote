/**
 * Auto-Summarize Utilities (EDITOR-3704)
 *
 * Provides functions for automatically generating notations for long bullet text.
 * Bullets with more than 30 words (configurable) get a short notation (<5 words)
 * displayed before the original text with a dash separator.
 */

/**
 * Configuration for auto-summarize feature
 */
export interface NotationConfig {
  /** Whether auto-summarize is enabled */
  enabled: boolean
  /** Word count threshold to trigger summarization */
  wordThreshold: number
}

/**
 * Default configuration values
 */
export const DEFAULT_NOTATION_CONFIG: NotationConfig = {
  enabled: false,
  wordThreshold: 30,
}

/**
 * Cache entry for storing notation
 */
interface NotationCacheEntry {
  notation: string
  textHash: string
}

/**
 * Cache for storing generated notations
 */
export interface NotationCache {
  entries: Map<string, NotationCacheEntry>
}

/**
 * Create an empty notation cache
 */
export function createNotationCache(): NotationCache {
  return {
    entries: new Map(),
  }
}

/**
 * Get cached notation for a block
 * @param cache The notation cache
 * @param blockId The block ID
 * @param textHash Optional text hash to check if cache is still valid
 * @returns The cached notation or null if not found/invalid
 */
export function getCachedNotation(
  cache: NotationCache,
  blockId: string,
  textHash?: string
): string | null {
  const entry = cache.entries.get(blockId)
  if (!entry) {
    return null
  }

  // If textHash is provided, check if cache is still valid
  if (textHash !== undefined && entry.textHash !== textHash) {
    return null
  }

  return entry.notation
}

/**
 * Set cached notation for a block
 * @param cache The notation cache
 * @param blockId The block ID
 * @param notation The notation text
 * @param textHash The text hash for cache invalidation
 */
export function setCachedNotation(
  cache: NotationCache,
  blockId: string,
  notation: string,
  textHash: string
): void {
  cache.entries.set(blockId, { notation, textHash })
}

/**
 * Count words in a text string
 * Words are separated by whitespace
 */
export function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) {
    return 0
  }
  return trimmed.split(/\s+/).length
}

/**
 * Check if notation should be generated for the given text
 * @param text The text to check
 * @param config The notation configuration
 * @returns true if notation should be generated
 */
export function shouldGenerateNotation(
  text: string,
  config: NotationConfig
): boolean {
  if (!config.enabled) {
    return false
  }

  const wordCount = countWords(text)
  return wordCount > config.wordThreshold
}

/**
 * Extract notation from text that already has a notation (before dash separator)
 * Supports em-dash (—), en-dash (–), and double-hyphen (--)
 * @param text The text to extract from
 * @returns The notation if found, null otherwise
 */
export function extractNotationFromText(text: string): string | null {
  // Try em-dash first, then en-dash, then double-hyphen
  const separators = [' — ', ' – ', ' -- ']

  for (const separator of separators) {
    const index = text.indexOf(separator)
    if (index > 0) {
      const notation = text.slice(0, index).trim()
      return notation || null
    }
  }

  return null
}

/**
 * Build a prompt for the AI to generate a notation
 * @param text The text to summarize
 * @returns The prompt for AI generation
 */
export function buildNotationPrompt(text: string): string {
  return `Generate a very brief notation (key concepts, <5 words) for the following text. Just return the notation, nothing else.

Text: ${text}`
}

/**
 * Compute a simple hash of text for cache invalidation
 * Uses a simple string hash for performance
 */
export function computeTextHash(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString(16)
}

/**
 * Format text with notation and separator
 * @param notation The notation text
 * @param originalText The original long text
 * @returns Formatted text with notation — original
 */
export function formatWithNotation(notation: string, originalText: string): string {
  return `${notation} — ${originalText}`
}
