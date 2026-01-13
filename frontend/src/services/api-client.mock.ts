/**
 * EDITOR-3407: Mock API Client
 *
 * Mock APIs for frontend development before backend is ready.
 * These mocks enable full testing of orchestration logic without real backend.
 */

import type { DescriptorType } from '@/blocks/utils/descriptor'

/**
 * Semantic search result from API
 */
export interface SemanticSearchResult {
  /** Document ID containing the matching block */
  documentId: string
  /** Block ID of the matching bullet */
  blockId: string
  /** Text content of the matching bullet */
  bulletText: string
  /** Hierarchical path to the bullet */
  contextPath: string
  /** Similarity score (0-1) */
  score: number
  /** Descriptor type if the match is in a descriptor */
  descriptorType: DescriptorType | null
  /** Summary of children under this bullet */
  childrenSummary: string | null
}

/**
 * Concept extracted from text
 */
export interface Concept {
  /** Name/label of the concept */
  name: string
  /** Category of the concept */
  category: 'topic' | 'entity' | 'action' | 'attribute'
}

/**
 * Check if mock API mode is enabled
 * Controlled via environment variable VITE_USE_MOCK_API
 */
export function isMockApiEnabled(): boolean {
  return import.meta.env.VITE_USE_MOCK_API === 'true'
}

/**
 * Mock semantic search API
 *
 * Simulates searching for semantically similar bullets.
 * Returns hardcoded results after a simulated delay.
 *
 * @param query - Search query string
 * @returns Promise resolving to array of search results
 */
export async function mockSemanticSearch(
  // Parameter intentionally unused - mock returns static data
  query: string
): Promise<SemanticSearchResult[]> {
  // Using query in a no-op to satisfy eslint while mock is static
  void query
  // Simulate network delay (200ms)
  await new Promise((resolve) => setTimeout(resolve, 200))

  // Return mock results
  return [
    {
      documentId: 'doc-1',
      blockId: 'block-1',
      bulletText: 'Neural networks use layers of nodes',
      contextPath: 'Machine Learning > [What] Neural Networks',
      score: 0.92,
      descriptorType: 'what',
      childrenSummary: 'Backpropagation, Activation functions',
    },
    {
      documentId: 'doc-2',
      blockId: 'block-2',
      bulletText: 'Deep learning enables pattern recognition',
      contextPath: 'AI Fundamentals > Deep Learning',
      score: 0.88,
      descriptorType: null,
      childrenSummary: null,
    },
    {
      documentId: 'doc-3',
      blockId: 'block-3',
      bulletText: 'Transformers revolutionized NLP',
      contextPath: 'Natural Language Processing > [How] Transformers',
      score: 0.85,
      descriptorType: 'how',
      childrenSummary: 'Attention mechanism, Self-attention',
    },
  ]
}

/**
 * Mock concept extraction API
 *
 * Simulates extracting concepts from text content.
 * Returns hardcoded concepts after a simulated delay.
 *
 * @param text - Text to extract concepts from
 * @returns Promise resolving to array of concepts
 */
export async function mockExtractConcepts(text: string): Promise<Concept[]> {
  // Using text in a no-op to satisfy eslint while mock is static
  void text
  // Simulate network delay (150ms)
  await new Promise((resolve) => setTimeout(resolve, 150))

  // Return mock concepts
  return [
    { name: 'machine learning', category: 'topic' },
    { name: 'neural networks', category: 'topic' },
    { name: 'data processing', category: 'action' },
  ]
}

/**
 * Semantic search request parameters
 */
export interface SemanticSearchRequest {
  /** Query string to search for */
  query: string
  /** Maximum number of results to return */
  limit?: number
  /** Minimum similarity threshold (0-1) */
  threshold?: number
  /** Document IDs to exclude from results */
  excludeDocIds?: string[]
}

/**
 * Execute semantic search (mock or real based on environment)
 *
 * @param request - Search request parameters
 * @returns Promise resolving to search results
 */
export async function semanticSearch(
  request: SemanticSearchRequest
): Promise<SemanticSearchResult[]> {
  // For now, always use mock
  // In future, this will check isMockApiEnabled() and call real API
  const results = await mockSemanticSearch(request.query)

  // Apply filters
  let filtered = results

  // Filter by threshold
  if (request.threshold !== undefined) {
    filtered = filtered.filter((r) => r.score >= request.threshold!)
  }

  // Exclude specific documents
  if (request.excludeDocIds && request.excludeDocIds.length > 0) {
    filtered = filtered.filter((r) => !request.excludeDocIds!.includes(r.documentId))
  }

  // Apply limit
  if (request.limit !== undefined) {
    filtered = filtered.slice(0, request.limit)
  }

  return filtered
}

/**
 * Extract concepts from text (mock or real based on environment)
 *
 * @param text - Text to extract concepts from
 * @returns Promise resolving to extracted concepts
 */
export async function extractConcepts(text: string): Promise<Concept[]> {
  // For now, always use mock
  // In future, this will check isMockApiEnabled() and call real API
  return mockExtractConcepts(text)
}
