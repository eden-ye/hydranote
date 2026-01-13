/**
 * EDITOR-3408: Real API Client
 *
 * Real API client for semantic search and concept extraction.
 * Replaces mocks from EDITOR-3407 with actual backend calls.
 */

import type { DescriptorType } from '@/blocks/utils/descriptor'

/**
 * Get the API base URL from environment or default to localhost
 */
function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL || 'http://localhost:8000'
}

/**
 * Semantic search result from API
 * Matches backend SemanticSearchResult model
 */
export interface SemanticSearchResult {
  /** Document ID containing the matching block */
  document_id: string
  /** Block ID of the matching bullet */
  block_id: string
  /** Text content of the matching bullet */
  bullet_text: string
  /** Hierarchical path to the bullet */
  context_path: string
  /** Summary of children under this bullet */
  children_summary: string | null
  /** Descriptor type if the match is in a descriptor */
  descriptor_type: DescriptorType | null
  /** Similarity score (0-1) */
  score: number
}

/**
 * Semantic search request parameters
 * Matches backend SemanticSearchRequest model
 */
export interface SemanticSearchRequest {
  /** Query string to search for */
  query: string
  /** Maximum number of results to return */
  limit?: number
  /** Minimum similarity threshold (0-1) */
  threshold?: number
  /** Filter by descriptor type */
  descriptor_filter?: string
}

/**
 * Concept extracted from text
 * Matches backend Concept model
 */
export interface Concept {
  /** Name/label of the concept */
  name: string
  /** Category of the concept */
  category: string | null
}

/**
 * Concept extraction response from API
 */
export interface ConceptExtractionResponse {
  /** Extracted concepts */
  concepts: Concept[]
  /** Tokens used by the AI model */
  tokens_used: number
}

/**
 * API error class for handling backend errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Perform semantic search against the backend
 *
 * @param request - Search request parameters
 * @param accessToken - User's auth token
 * @returns Promise resolving to search results
 * @throws ApiError if the request fails
 */
export async function semanticSearch(
  request: SemanticSearchRequest,
  accessToken: string
): Promise<SemanticSearchResult[]> {
  const baseUrl = getApiBaseUrl()
  const response = await fetch(`${baseUrl}/api/notes/semantic-search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      query: request.query,
      limit: request.limit ?? 5,
      threshold: request.threshold ?? 0.8,
      descriptor_filter: request.descriptor_filter ?? null,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new ApiError(
      `Semantic search failed: ${response.statusText}`,
      response.status,
      errorText
    )
  }

  return await response.json()
}

/**
 * Extract concepts from text using AI
 *
 * @param text - Text to extract concepts from
 * @param maxConcepts - Maximum number of concepts to extract
 * @param accessToken - User's auth token
 * @returns Promise resolving to extracted concepts
 * @throws ApiError if the request fails
 */
export async function extractConcepts(
  text: string,
  maxConcepts: number = 5,
  accessToken: string
): Promise<Concept[]> {
  const baseUrl = getApiBaseUrl()
  const response = await fetch(`${baseUrl}/api/ai/extract-concepts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      text,
      max_concepts: maxConcepts,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new ApiError(
      `Concept extraction failed: ${response.statusText}`,
      response.status,
      errorText
    )
  }

  const data: ConceptExtractionResponse = await response.json()
  return data.concepts
}

/**
 * Check if we should use real APIs or mocks
 *
 * Returns true if:
 * 1. VITE_USE_MOCK_API is not set to 'true'
 * 2. AND VITE_API_URL is set (backend is available)
 *
 * For local development without backend, set VITE_USE_MOCK_API=true
 */
export function shouldUseRealApi(): boolean {
  const useMock = import.meta.env.VITE_USE_MOCK_API === 'true'
  const hasApiUrl = !!import.meta.env.VITE_API_URL
  return !useMock && hasApiUrl
}
