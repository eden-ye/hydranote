/**
 * EDITOR-3407: Auto-Reorg Service
 *
 * Orchestration logic for auto-reorganization flow:
 * 1. Call concept extraction
 * 2. For each concept, semantic search
 * 3. Deduplicate and sort by score
 * 4. Track portal creation results
 */

import type { AutoReorgConfig, AutoReorgContext } from '@/blocks/utils/auto-reorg'
import {
  extractConcepts,
  semanticSearch,
  type SemanticSearchResult,
} from './api-client.mock'

/**
 * Result of auto-reorganization execution
 */
export interface AutoReorgResult {
  /** Number of portals created */
  portalsCreated: number
  /** Number of concepts extracted from document */
  conceptsExtracted: number
  /** Total number of search results found */
  searchResultsFound: number
  /** Any errors that occurred during execution */
  errors: string[]
}

/**
 * Execute auto-reorganization flow
 *
 * 1. Extract concepts from document text
 * 2. For each concept, perform semantic search
 * 3. Deduplicate and sort results by score
 * 4. Return summary of results (portal creation happens separately)
 *
 * @param context - Auto-reorg context with document info
 * @param config - Auto-reorg configuration
 * @param accessToken - User access token for API calls
 * @returns Promise resolving to execution result
 */
export async function executeAutoReorg(
  context: AutoReorgContext,
  config: AutoReorgConfig,
  _accessToken: string
): Promise<AutoReorgResult> {
  const errors: string[] = []

  // Handle empty document
  if (!context.documentText || context.documentText.trim().length === 0) {
    return {
      portalsCreated: 0,
      conceptsExtracted: 0,
      searchResultsFound: 0,
      errors: [],
    }
  }

  // Step 1: Extract concepts from document text
  let concepts: { name: string; category: string }[] = []
  try {
    concepts = await extractConcepts(context.documentText)
  } catch (error) {
    errors.push(`Concept extraction failed: ${error}`)
    return {
      portalsCreated: 0,
      conceptsExtracted: 0,
      searchResultsFound: 0,
      errors,
    }
  }

  // Step 2: For each concept, perform semantic search
  const allResults: SemanticSearchResult[] = []

  for (const concept of concepts) {
    try {
      const results = await semanticSearch({
        query: concept.name,
        limit: config.maxResults,
        threshold: config.thresholdScore,
        excludeDocIds: [context.documentId], // Don't link to same document
      })
      allResults.push(...results)
    } catch (error) {
      errors.push(`Search failed for concept "${concept.name}": ${error}`)
    }
  }

  // Step 3: Deduplicate and sort results
  const sortedResults = deduplicateAndSort(allResults)

  // Step 4: Return results summary
  // Actual portal creation will be handled by the caller
  return {
    portalsCreated: sortedResults.length, // Represents potential portals
    conceptsExtracted: concepts.length,
    searchResultsFound: allResults.length,
    errors,
  }
}

/**
 * Deduplicate search results by block ID and sort by score
 *
 * When multiple results have the same block ID, keeps the one with highest score.
 * Results are sorted in descending order by score.
 *
 * @param results - Array of search results to process
 * @returns Deduplicated and sorted results
 */
export function deduplicateAndSort(
  results: SemanticSearchResult[]
): SemanticSearchResult[] {
  if (!results || results.length === 0) {
    return []
  }

  // Deduplicate by blockId, keeping highest score
  const byBlockId = new Map<string, SemanticSearchResult>()

  for (const result of results) {
    const existing = byBlockId.get(result.blockId)
    if (!existing || result.score > existing.score) {
      byBlockId.set(result.blockId, result)
    }
  }

  // Convert back to array and sort by score descending
  const deduplicated = Array.from(byBlockId.values())
  deduplicated.sort((a, b) => b.score - a.score)

  return deduplicated
}

/**
 * Check if auto-reorg should be triggered
 *
 * @param config - Auto-reorg configuration
 * @returns true if auto-reorg is enabled and should run
 */
export function shouldTriggerAutoReorg(config: AutoReorgConfig): boolean {
  return config.enabled
}
