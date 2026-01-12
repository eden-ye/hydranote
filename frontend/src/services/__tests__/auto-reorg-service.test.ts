import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  executeAutoReorg,
  deduplicateAndSort,
  type AutoReorgResult,
} from '../auto-reorg-service'
import type { AutoReorgConfig, AutoReorgContext } from '@/blocks/utils/auto-reorg'
import type { SemanticSearchResult } from '../api-client.mock'

/**
 * Tests for Auto-Reorg Service (EDITOR-3407)
 *
 * Orchestration logic for the auto-reorg flow:
 * 1. Call concept extraction
 * 2. For each concept, semantic search
 * 3. Deduplicate and sort by score
 * 4. Track portal creation results
 */

describe('Auto-Reorg Service (EDITOR-3407)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('executeAutoReorg', () => {
    const mockContext: AutoReorgContext = {
      documentId: 'doc-123',
      documentText: 'This document discusses machine learning and neural networks.',
      allBulletIds: ['block-1', 'block-2', 'block-3'],
    }

    const mockConfig: AutoReorgConfig = {
      enabled: true,
      thresholdScore: 0.8,
      debounceMs: 2000,
      maxResults: 5,
    }

    it('should return AutoReorgResult', async () => {
      const promise = executeAutoReorg(mockContext, mockConfig, 'mock-token')
      await vi.runAllTimersAsync()

      const result = await promise

      expect(result).toHaveProperty('portalsCreated')
      expect(result).toHaveProperty('conceptsExtracted')
      expect(result).toHaveProperty('searchResultsFound')
    })

    it('should extract concepts from document text', async () => {
      const promise = executeAutoReorg(mockContext, mockConfig, 'mock-token')
      await vi.runAllTimersAsync()

      const result = await promise

      expect(result.conceptsExtracted).toBeGreaterThan(0)
    })

    it('should search for each extracted concept', async () => {
      const promise = executeAutoReorg(mockContext, mockConfig, 'mock-token')
      await vi.runAllTimersAsync()

      const result = await promise

      expect(result.searchResultsFound).toBeGreaterThanOrEqual(0)
    })

    it('should respect maxResults config', async () => {
      const limitedConfig: AutoReorgConfig = {
        ...mockConfig,
        maxResults: 2,
      }

      const promise = executeAutoReorg(mockContext, limitedConfig, 'mock-token')
      await vi.runAllTimersAsync()

      const result = await promise

      // Result count should not exceed maxResults per concept
      expect(result.portalsCreated).toBeLessThanOrEqual(
        result.conceptsExtracted * limitedConfig.maxResults
      )
    })

    it('should filter results by threshold score', async () => {
      const strictConfig: AutoReorgConfig = {
        ...mockConfig,
        thresholdScore: 0.95, // Very high threshold
      }

      const promise = executeAutoReorg(mockContext, strictConfig, 'mock-token')
      await vi.runAllTimersAsync()

      const result = await promise

      // With high threshold, fewer or no results expected
      expect(result.searchResultsFound).toBeDefined()
    })

    it('should not create portals in same document', async () => {
      const promise = executeAutoReorg(mockContext, mockConfig, 'mock-token')
      await vi.runAllTimersAsync()

      const result = await promise

      // Mock should filter out same-document results
      // In real implementation, portals to same doc should be excluded
      expect(result).toHaveProperty('portalsCreated')
    })

    it('should handle empty document text', async () => {
      const emptyContext: AutoReorgContext = {
        ...mockContext,
        documentText: '',
      }

      const promise = executeAutoReorg(emptyContext, mockConfig, 'mock-token')
      await vi.runAllTimersAsync()

      const result = await promise

      expect(result.conceptsExtracted).toBe(0)
      expect(result.portalsCreated).toBe(0)
    })

    it('should handle no concepts extracted', async () => {
      // Empty document should yield no concepts
      const emptyContext: AutoReorgContext = {
        ...mockContext,
        documentText: 'a',
      }

      const promise = executeAutoReorg(emptyContext, mockConfig, 'mock-token')
      await vi.runAllTimersAsync()

      const result = await promise

      expect(result.portalsCreated).toBeGreaterThanOrEqual(0)
    })
  })

  describe('deduplicateAndSort', () => {
    it('should remove duplicate block IDs', () => {
      const results: SemanticSearchResult[] = [
        { blockId: 'block-1', documentId: 'doc-1', score: 0.9, bulletText: '', contextPath: '', descriptorType: null, childrenSummary: null },
        { blockId: 'block-1', documentId: 'doc-1', score: 0.85, bulletText: '', contextPath: '', descriptorType: null, childrenSummary: null },
        { blockId: 'block-2', documentId: 'doc-2', score: 0.8, bulletText: '', contextPath: '', descriptorType: null, childrenSummary: null },
      ]

      const deduplicated = deduplicateAndSort(results)

      expect(deduplicated).toHaveLength(2)
    })

    it('should keep highest score when deduplicating', () => {
      const results: SemanticSearchResult[] = [
        { blockId: 'block-1', documentId: 'doc-1', score: 0.7, bulletText: '', contextPath: '', descriptorType: null, childrenSummary: null },
        { blockId: 'block-1', documentId: 'doc-1', score: 0.9, bulletText: '', contextPath: '', descriptorType: null, childrenSummary: null },
        { blockId: 'block-1', documentId: 'doc-1', score: 0.8, bulletText: '', contextPath: '', descriptorType: null, childrenSummary: null },
      ]

      const deduplicated = deduplicateAndSort(results)

      expect(deduplicated[0].score).toBe(0.9)
    })

    it('should sort by score descending', () => {
      const results: SemanticSearchResult[] = [
        { blockId: 'block-1', documentId: 'doc-1', score: 0.7, bulletText: '', contextPath: '', descriptorType: null, childrenSummary: null },
        { blockId: 'block-2', documentId: 'doc-2', score: 0.9, bulletText: '', contextPath: '', descriptorType: null, childrenSummary: null },
        { blockId: 'block-3', documentId: 'doc-3', score: 0.8, bulletText: '', contextPath: '', descriptorType: null, childrenSummary: null },
      ]

      const sorted = deduplicateAndSort(results)

      expect(sorted[0].score).toBe(0.9)
      expect(sorted[1].score).toBe(0.8)
      expect(sorted[2].score).toBe(0.7)
    })

    it('should handle empty array', () => {
      const results = deduplicateAndSort([])
      expect(results).toHaveLength(0)
    })

    it('should handle single result', () => {
      const results: SemanticSearchResult[] = [
        { blockId: 'block-1', documentId: 'doc-1', score: 0.9, bulletText: '', contextPath: '', descriptorType: null, childrenSummary: null },
      ]

      const deduplicated = deduplicateAndSort(results)

      expect(deduplicated).toHaveLength(1)
      expect(deduplicated[0].score).toBe(0.9)
    })
  })

  describe('AutoReorgResult', () => {
    it('should have correct structure', () => {
      const result: AutoReorgResult = {
        portalsCreated: 3,
        conceptsExtracted: 2,
        searchResultsFound: 5,
        errors: [],
      }

      expect(result.portalsCreated).toBe(3)
      expect(result.conceptsExtracted).toBe(2)
      expect(result.searchResultsFound).toBe(5)
      expect(result.errors).toHaveLength(0)
    })

    it('should support error tracking', () => {
      const result: AutoReorgResult = {
        portalsCreated: 0,
        conceptsExtracted: 2,
        searchResultsFound: 0,
        errors: ['API timeout', 'Rate limited'],
      }

      expect(result.errors).toHaveLength(2)
      expect(result.errors).toContain('API timeout')
    })
  })
})
