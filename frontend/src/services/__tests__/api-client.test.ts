/**
 * EDITOR-3408: Real API Client Tests
 *
 * Tests for the real API client that calls backend endpoints
 * for semantic search and concept extraction.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  semanticSearch,
  extractConcepts,
  shouldUseRealApi,
  ApiError,
  type SemanticSearchRequest,
} from '../api-client'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('api-client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset environment variables
    vi.stubEnv('VITE_API_URL', 'http://localhost:8000')
    vi.stubEnv('VITE_USE_MOCK_API', 'false')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('semanticSearch', () => {
    const mockAccessToken = 'test-token-123'

    it('should call semantic search endpoint with correct parameters', async () => {
      const mockResults = [
        {
          document_id: 'doc-1',
          block_id: 'block-1',
          bullet_text: 'Test bullet',
          context_path: 'Parent > Child',
          children_summary: null,
          descriptor_type: null,
          score: 0.9,
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResults),
      })

      const request: SemanticSearchRequest = {
        query: 'neural networks',
        limit: 5,
        threshold: 0.8,
      }

      const results = await semanticSearch(request, mockAccessToken)

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/notes/semantic-search',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            query: 'neural networks',
            limit: 5,
            threshold: 0.8,
            descriptor_filter: null,
          }),
        })
      )

      expect(results).toEqual(mockResults)
    })

    it('should use default values for limit and threshold', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })

      await semanticSearch({ query: 'test' }, mockAccessToken)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            query: 'test',
            limit: 5,
            threshold: 0.8,
            descriptor_filter: null,
          }),
        })
      )
    })

    it('should throw ApiError on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('Invalid token'),
      })

      try {
        await semanticSearch({ query: 'test' }, mockAccessToken)
        // Should not reach here
        expect.fail('Expected ApiError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).status).toBe(401)
        expect((error as ApiError).message).toContain('Unauthorized')
      }
    })

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(
        semanticSearch({ query: 'test' }, mockAccessToken)
      ).rejects.toThrow('Network error')
    })
  })

  describe('extractConcepts', () => {
    const mockAccessToken = 'test-token-456'

    it('should call concept extraction endpoint with correct parameters', async () => {
      const mockResponse = {
        concepts: [
          { name: 'machine learning', category: 'topic' },
          { name: 'neural networks', category: 'topic' },
        ],
        tokens_used: 150,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const concepts = await extractConcepts(
        'Machine learning uses neural networks',
        5,
        mockAccessToken
      )

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/ai/extract-concepts',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            text: 'Machine learning uses neural networks',
            max_concepts: 5,
          }),
        })
      )

      expect(concepts).toEqual(mockResponse.concepts)
    })

    it('should use default maxConcepts of 5', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ concepts: [], tokens_used: 0 }),
      })

      await extractConcepts('test text', undefined as unknown as number, mockAccessToken)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            text: 'test text',
            max_concepts: 5,
          }),
        })
      )
    })

    it('should throw ApiError on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server error'),
      })

      await expect(
        extractConcepts('test', 5, mockAccessToken)
      ).rejects.toThrow(ApiError)
    })

    it('should handle empty concepts gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ concepts: [], tokens_used: 10 }),
      })

      const concepts = await extractConcepts('', 5, mockAccessToken)

      expect(concepts).toEqual([])
    })
  })

  describe('shouldUseRealApi', () => {
    it('should return true when VITE_API_URL is set and VITE_USE_MOCK_API is not true', () => {
      vi.stubEnv('VITE_API_URL', 'http://localhost:8000')
      vi.stubEnv('VITE_USE_MOCK_API', 'false')

      expect(shouldUseRealApi()).toBe(true)
    })

    it('should return false when VITE_USE_MOCK_API is true', () => {
      vi.stubEnv('VITE_API_URL', 'http://localhost:8000')
      vi.stubEnv('VITE_USE_MOCK_API', 'true')

      expect(shouldUseRealApi()).toBe(false)
    })

    it('should return false when VITE_API_URL is not set', () => {
      vi.stubEnv('VITE_API_URL', '')
      vi.stubEnv('VITE_USE_MOCK_API', 'false')

      expect(shouldUseRealApi()).toBe(false)
    })

    it('should return false when both conditions fail', () => {
      vi.stubEnv('VITE_API_URL', '')
      vi.stubEnv('VITE_USE_MOCK_API', 'true')

      expect(shouldUseRealApi()).toBe(false)
    })
  })

  describe('ApiError', () => {
    it('should create error with correct properties', () => {
      const error = new ApiError('Test error', 404, 'Not found')

      expect(error.message).toBe('Test error')
      expect(error.status).toBe(404)
      expect(error.detail).toBe('Not found')
      expect(error.name).toBe('ApiError')
    })

    it('should work without detail', () => {
      const error = new ApiError('Test error', 500)

      expect(error.message).toBe('Test error')
      expect(error.status).toBe(500)
      expect(error.detail).toBeUndefined()
    })
  })
})
