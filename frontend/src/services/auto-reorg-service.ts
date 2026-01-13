/**
 * EDITOR-3407: Auto-Reorg Service
 * EDITOR-3408: Real API Integration
 *
 * Orchestration logic for auto-reorganization flow:
 * 1. Call concept extraction
 * 2. For each concept, semantic search
 * 3. Deduplicate and sort by score
 * 4. Track portal creation results
 *
 * Uses real APIs when available, falls back to mocks for local development.
 */

import type { AutoReorgConfig, AutoReorgContext } from '@/blocks/utils/auto-reorg'
// Mock API client for fallback
import {
  extractConcepts as mockExtractConcepts,
  semanticSearch as mockSemanticSearch,
  type SemanticSearchResult as MockSemanticSearchResult,
} from './api-client.mock'
// Real API client
import {
  extractConcepts as realExtractConcepts,
  semanticSearch as realSemanticSearch,
  shouldUseRealApi,
  type SemanticSearchResult as RealSemanticSearchResult,
}  from './api-client'

/**
 * Unified semantic search result type
 * Maps between mock and real API formats
 */
type SemanticSearchResult = MockSemanticSearchResult | RealSemanticSearchResult

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
 * Normalized search result for internal use
 * Uses camelCase regardless of API source
 */
export interface NormalizedSearchResult {
  documentId: string
  blockId: string
  bulletText: string
  contextPath: string
  childrenSummary: string | null
  descriptorType: string | null
  score: number
}

/**
 * Normalize a search result from either mock or real API
 * Real API uses snake_case, mock uses camelCase
 */
function normalizeSearchResult(result: SemanticSearchResult): NormalizedSearchResult {
  // Check if it's from real API (snake_case) or mock (camelCase)
  if ('document_id' in result) {
    // Real API result
    return {
      documentId: result.document_id,
      blockId: result.block_id,
      bulletText: result.bullet_text,
      contextPath: result.context_path,
      childrenSummary: result.children_summary,
      descriptorType: result.descriptor_type,
      score: result.score,
    }
  } else {
    // Mock API result (already camelCase)
    return {
      documentId: result.documentId,
      blockId: result.blockId,
      bulletText: result.bulletText,
      contextPath: result.contextPath,
      childrenSummary: result.childrenSummary,
      descriptorType: result.descriptorType,
      score: result.score,
    }
  }
}

/**
 * Execute auto-reorganization flow
 *
 * 1. Extract concepts from document text
 * 2. For each concept, perform semantic search
 * 3. Deduplicate and sort results by score
 * 4. Return summary of results (portal creation happens separately)
 *
 * Uses real APIs when VITE_API_URL is set, otherwise falls back to mocks.
 *
 * @param context - Auto-reorg context with document info
 * @param config - Auto-reorg configuration
 * @param accessToken - User access token for API calls
 * @returns Promise resolving to execution result
 */
export async function executeAutoReorg(
  context: AutoReorgContext,
  config: AutoReorgConfig,
  accessToken: string
): Promise<AutoReorgResult> {
  const errors: string[] = []
  const useRealApi = shouldUseRealApi()

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
  let concepts: { name: string; category: string | null }[] = []
  try {
    if (useRealApi) {
      console.log('[AutoReorg] Using real API for concept extraction')
      concepts = await realExtractConcepts(
        context.documentText,
        config.maxResults,
        accessToken
      )
    } else {
      console.log('[AutoReorg] Using mock API for concept extraction')
      concepts = await mockExtractConcepts(context.documentText)
    }
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
  const allResults: NormalizedSearchResult[] = []

  for (const concept of concepts) {
    try {
      let rawResults: SemanticSearchResult[]

      if (useRealApi) {
        console.log('[AutoReorg] Semantic search for concept:', concept.name)
        rawResults = await realSemanticSearch(
          {
            query: concept.name,
            limit: config.maxResults,
            threshold: config.thresholdScore,
          },
          accessToken
        )
      } else {
        rawResults = await mockSemanticSearch({
          query: concept.name,
          limit: config.maxResults,
          threshold: config.thresholdScore,
          excludeDocIds: [context.documentId],
        })
      }

      // Normalize and filter results
      const normalizedResults = rawResults
        .map(normalizeSearchResult)
        // Exclude results from the same document
        .filter((r) => r.documentId !== context.documentId)

      allResults.push(...normalizedResults)
    } catch (error) {
      errors.push(`Search failed for concept "${concept.name}": ${error}`)
    }
  }

  // Step 3: Deduplicate and sort results
  const sortedResults = deduplicateAndSortNormalized(allResults)

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
 * Deduplicate normalized search results by block ID and sort by score
 *
 * When multiple results have the same block ID, keeps the one with highest score.
 * Results are sorted in descending order by score.
 *
 * @param results - Array of normalized search results to process
 * @returns Deduplicated and sorted results
 */
export function deduplicateAndSortNormalized(
  results: NormalizedSearchResult[]
): NormalizedSearchResult[] {
  if (!results || results.length === 0) {
    return []
  }

  // Deduplicate by blockId, keeping highest score
  const byBlockId = new Map<string, NormalizedSearchResult>()

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
 * Deduplicate search results by block ID and sort by score (mock API format)
 *
 * When multiple results have the same block ID, keeps the one with highest score.
 * Results are sorted in descending order by score.
 *
 * @param results - Array of search results to process
 * @returns Deduplicated and sorted results
 * @deprecated Use deduplicateAndSortNormalized instead
 */
export function deduplicateAndSort(
  results: MockSemanticSearchResult[]
): MockSemanticSearchResult[] {
  if (!results || results.length === 0) {
    return []
  }

  // Deduplicate by blockId, keeping highest score
  const byBlockId = new Map<string, MockSemanticSearchResult>()

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
