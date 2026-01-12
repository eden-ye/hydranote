/**
 * EDITOR-3501: Background Embedding Sync Tests
 *
 * Tests for syncing note embeddings to backend on document changes.
 * Features tested:
 * - Building embedding payloads from blocks
 * - Debounced sync on document changes
 * - Background catch-up for unindexed notes
 * - Offline queue handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { DescriptorType } from '@/blocks/utils/descriptor'

// Mock types for testing
interface MockText {
  toString: () => string
}

interface MockBlock {
  id: string
  flavour: string
  model: {
    text?: MockText
    isDescriptor?: boolean
    descriptorType?: DescriptorType | null
    children?: MockBlock[]
  }
  parent?: MockBlock | null
  children?: MockBlock[]
}

interface MockDoc {
  id: string
  getBlock: (id: string) => MockBlock | null
  getBlockById: (id: string) => MockBlock | null
}

// Import the functions we'll implement
import {
  buildEmbeddingPayload,
  buildContextPath,
  buildChildrenSummary,
  getAllBullets,
  createEmbeddingSyncService,
  EMBEDDING_SYNC_DEBOUNCE_MS,
} from '../embedding-sync'

describe('Embedding Sync (EDITOR-3501)', () => {
  describe('buildContextPath', () => {
    it('should build path from ancestors', () => {
      const grandparent: MockBlock = {
        id: 'gp-1',
        flavour: 'hydra:bullet',
        model: { text: { toString: () => 'Apple' } },
        parent: null,
        children: [],
      }

      const parent: MockBlock = {
        id: 'p-1',
        flavour: 'hydra:bullet',
        model: {
          text: { toString: () => 'What it is' },
          isDescriptor: true,
          descriptorType: 'what',
        },
        parent: grandparent,
        children: [],
      }
      grandparent.children = [parent]

      const block: MockBlock = {
        id: 'b-1',
        flavour: 'hydra:bullet',
        model: { text: { toString: () => 'Red Sweet Fruit' } },
        parent: parent,
        children: [],
      }
      parent.children = [block]

      const path = buildContextPath(
        block as unknown as Parameters<typeof buildContextPath>[0]
      )

      expect(path).toBe('Apple > What it is > Red Sweet Fruit')
    })

    it('should handle block with no ancestors', () => {
      const block: MockBlock = {
        id: 'b-1',
        flavour: 'hydra:bullet',
        model: { text: { toString: () => 'Standalone Bullet' } },
        parent: null,
        children: [],
      }

      const path = buildContextPath(
        block as unknown as Parameters<typeof buildContextPath>[0]
      )

      expect(path).toBe('Standalone Bullet')
    })

    it('should limit to 3 ancestor levels', () => {
      // Create deep hierarchy (4+ levels)
      const greatGreatGrandparent: MockBlock = {
        id: 'gggp',
        flavour: 'hydra:bullet',
        model: { text: { toString: () => 'Level 0' } },
        parent: null,
        children: [],
      }

      const greatGrandparent: MockBlock = {
        id: 'ggp',
        flavour: 'hydra:bullet',
        model: { text: { toString: () => 'Level 1' } },
        parent: greatGreatGrandparent,
        children: [],
      }

      const grandparent: MockBlock = {
        id: 'gp',
        flavour: 'hydra:bullet',
        model: { text: { toString: () => 'Level 2' } },
        parent: greatGrandparent,
        children: [],
      }

      const parent: MockBlock = {
        id: 'p',
        flavour: 'hydra:bullet',
        model: { text: { toString: () => 'Level 3' } },
        parent: grandparent,
        children: [],
      }

      const block: MockBlock = {
        id: 'b',
        flavour: 'hydra:bullet',
        model: { text: { toString: () => 'Current' } },
        parent: parent,
        children: [],
      }

      const path = buildContextPath(
        block as unknown as Parameters<typeof buildContextPath>[0]
      )

      // Should only include last 3 ancestors + current
      expect(path).toBe('Level 2 > Level 3 > Current')
    })

    it('should skip non-bullet ancestors', () => {
      const noteBlock: MockBlock = {
        id: 'note-1',
        flavour: 'affine:note',
        model: {},
        parent: null,
        children: [],
      }

      const bullet: MockBlock = {
        id: 'b-1',
        flavour: 'hydra:bullet',
        model: { text: { toString: () => 'First bullet' } },
        parent: noteBlock,
        children: [],
      }

      const path = buildContextPath(
        bullet as unknown as Parameters<typeof buildContextPath>[0]
      )

      expect(path).toBe('First bullet')
    })
  })

  describe('buildChildrenSummary', () => {
    it('should summarize first 5 children', () => {
      const children: MockBlock[] = [
        { id: 'c1', flavour: 'hydra:bullet', model: { text: { toString: () => 'Child 1' } }, children: [] },
        { id: 'c2', flavour: 'hydra:bullet', model: { text: { toString: () => 'Child 2' } }, children: [] },
        { id: 'c3', flavour: 'hydra:bullet', model: { text: { toString: () => 'Child 3' } }, children: [] },
      ]

      const block: MockBlock = {
        id: 'b-1',
        flavour: 'hydra:bullet',
        model: { text: { toString: () => 'Parent' } },
        children: children,
      }

      const summary = buildChildrenSummary(
        block as unknown as Parameters<typeof buildChildrenSummary>[0]
      )

      expect(summary).toBe('Child 1, Child 2, Child 3')
    })

    it('should limit to 5 children', () => {
      const children: MockBlock[] = Array.from({ length: 10 }, (_, i) => ({
        id: `c${i}`,
        flavour: 'hydra:bullet',
        model: { text: { toString: () => `Child ${i + 1}` } },
        children: [],
      }))

      const block: MockBlock = {
        id: 'b-1',
        flavour: 'hydra:bullet',
        model: { text: { toString: () => 'Parent' } },
        children: children,
      }

      const summary = buildChildrenSummary(
        block as unknown as Parameters<typeof buildChildrenSummary>[0]
      )

      expect(summary).toBe('Child 1, Child 2, Child 3, Child 4, Child 5')
    })

    it('should truncate long child text to 50 chars', () => {
      const longText = 'This is a very long child text that should be truncated at fifty characters'
      const children: MockBlock[] = [
        { id: 'c1', flavour: 'hydra:bullet', model: { text: { toString: () => longText } }, children: [] },
      ]

      const block: MockBlock = {
        id: 'b-1',
        flavour: 'hydra:bullet',
        model: { text: { toString: () => 'Parent' } },
        children: children,
      }

      const summary = buildChildrenSummary(
        block as unknown as Parameters<typeof buildChildrenSummary>[0]
      )

      expect(summary!.length).toBeLessThanOrEqual(50)
      expect(summary).toBe(longText.slice(0, 50))
    })

    it('should return null for blocks with no children', () => {
      const block: MockBlock = {
        id: 'b-1',
        flavour: 'hydra:bullet',
        model: { text: { toString: () => 'Parent' } },
        children: [],
      }

      const summary = buildChildrenSummary(
        block as unknown as Parameters<typeof buildChildrenSummary>[0]
      )

      expect(summary).toBeNull()
    })
  })

  describe('buildEmbeddingPayload', () => {
    it('should build complete embedding payload', () => {
      const grandparent: MockBlock = {
        id: 'gp-1',
        flavour: 'hydra:bullet',
        model: { text: { toString: () => 'Apple' } },
        parent: null,
        children: [],
      }

      const parent: MockBlock = {
        id: 'p-1',
        flavour: 'hydra:bullet',
        model: {
          text: { toString: () => 'What it is' },
          isDescriptor: true,
          descriptorType: 'what',
        },
        parent: grandparent,
        children: [],
      }
      grandparent.children = [parent]

      const children: MockBlock[] = [
        { id: 'c1', flavour: 'hydra:bullet', model: { text: { toString: () => 'Crunchy' } }, children: [] },
        { id: 'c2', flavour: 'hydra:bullet', model: { text: { toString: () => 'Grows on trees' } }, children: [] },
      ]

      const block: MockBlock = {
        id: 'b-1',
        flavour: 'hydra:bullet',
        model: {
          text: { toString: () => 'Red Sweet Fruit' },
          isDescriptor: false,
          descriptorType: null,
        },
        parent: parent,
        children: children,
      }
      parent.children = [block]

      const mockDoc: MockDoc = {
        id: 'doc-123',
        getBlock: vi.fn(),
        getBlockById: vi.fn(),
      }

      const payload = buildEmbeddingPayload(
        block as unknown as Parameters<typeof buildEmbeddingPayload>[0],
        mockDoc as unknown as Parameters<typeof buildEmbeddingPayload>[1]
      )

      expect(payload).toEqual({
        document_id: 'doc-123',
        block_id: 'b-1',
        bullet_text: 'Red Sweet Fruit',
        context_path: 'Apple > What it is > Red Sweet Fruit',
        descriptor_type: null,
        children_summary: 'Crunchy, Grows on trees',
      })
    })

    it('should include descriptor type when block is descriptor', () => {
      const block: MockBlock = {
        id: 'b-1',
        flavour: 'hydra:bullet',
        model: {
          text: { toString: () => 'What it is' },
          isDescriptor: true,
          descriptorType: 'what',
        },
        parent: null,
        children: [],
      }

      const mockDoc: MockDoc = {
        id: 'doc-123',
        getBlock: vi.fn(),
        getBlockById: vi.fn(),
      }

      const payload = buildEmbeddingPayload(
        block as unknown as Parameters<typeof buildEmbeddingPayload>[0],
        mockDoc as unknown as Parameters<typeof buildEmbeddingPayload>[1]
      )

      expect(payload.descriptor_type).toBe('what')
    })
  })

  describe('getAllBullets', () => {
    it('should collect all bullet blocks from document', () => {
      const bullet1: MockBlock = {
        id: 'b1',
        flavour: 'hydra:bullet',
        model: { text: { toString: () => 'Bullet 1' } },
        parent: null,
        children: [],
      }

      const bullet2: MockBlock = {
        id: 'b2',
        flavour: 'hydra:bullet',
        model: { text: { toString: () => 'Bullet 2' } },
        parent: bullet1,
        children: [],
      }
      bullet1.children = [bullet2]

      const mockDoc = {
        id: 'doc-1',
        getBlock: vi.fn((id: string) => {
          if (id === 'b1') return bullet1
          if (id === 'b2') return bullet2
          return null
        }),
        getBlockById: vi.fn(),
        // Mock iteration over blocks
        blocks: new Map([
          ['b1', { model: bullet1.model, flavour: 'hydra:bullet' }],
          ['b2', { model: bullet2.model, flavour: 'hydra:bullet' }],
        ]),
        // BlockSuite uses this to iterate blocks
        getBlocksByFlavour: vi.fn(() => [bullet1, bullet2]),
      }

      const bullets = getAllBullets(
        mockDoc as unknown as Parameters<typeof getAllBullets>[0]
      )

      expect(bullets.length).toBe(2)
    })

    it('should skip non-bullet blocks', () => {
      // Note: noteBlock is not returned by getBlocksByFlavour since it's not a bullet
      // This tests that the function only returns hydra:bullet flavoured blocks
      const bullet1: MockBlock = {
        id: 'b1',
        flavour: 'hydra:bullet',
        model: { text: { toString: () => 'Bullet 1' } },
        parent: null,
        children: [],
      }

      const mockDoc = {
        id: 'doc-1',
        getBlock: vi.fn(),
        getBlockById: vi.fn(),
        getBlocksByFlavour: vi.fn((flavour: string) => {
          if (flavour === 'hydra:bullet') return [bullet1]
          return []
        }),
      }

      const bullets = getAllBullets(
        mockDoc as unknown as Parameters<typeof getAllBullets>[0]
      )

      expect(bullets.length).toBe(1)
      expect(bullets[0].id).toBe('b1')
    })
  })
})

describe('EmbeddingSyncService (EDITOR-3501)', () => {
  let mockFetch: ReturnType<typeof vi.fn>
  let originalFetch: typeof fetch

  beforeEach(() => {
    vi.useFakeTimers()
    originalFetch = globalThis.fetch
    mockFetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
    globalThis.fetch = mockFetch as typeof fetch
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    globalThis.fetch = originalFetch
  })

  describe('createEmbeddingSyncService', () => {
    it('should create service with correct methods', () => {
      const service = createEmbeddingSyncService({
        getAccessToken: () => 'test-token',
        apiBaseUrl: 'http://localhost:8000',
      })

      expect(service).toHaveProperty('syncDocument')
      expect(service).toHaveProperty('queueSync')
      expect(service).toHaveProperty('processQueue')
      expect(service).toHaveProperty('getSyncStatus')
      expect(service).toHaveProperty('dispose')
    })
  })

  describe('Debounced sync', () => {
    it('should debounce rapid sync requests', async () => {
      const service = createEmbeddingSyncService({
        getAccessToken: () => 'test-token',
        apiBaseUrl: 'http://localhost:8000',
      })

      const bullet1: MockBlock = {
        id: 'b1',
        flavour: 'hydra:bullet',
        model: { text: { toString: () => 'Test bullet' } },
        parent: null,
        children: [],
      }

      const mockDoc = {
        id: 'doc-1',
        getBlock: vi.fn(),
        getBlockById: vi.fn(),
        getBlocksByFlavour: vi.fn(() => [bullet1]),
      }

      // Trigger multiple syncs rapidly
      service.queueSync(mockDoc as unknown as Parameters<typeof service.queueSync>[0])
      service.queueSync(mockDoc as unknown as Parameters<typeof service.queueSync>[0])
      service.queueSync(mockDoc as unknown as Parameters<typeof service.queueSync>[0])

      // Should not have called fetch yet
      expect(mockFetch).not.toHaveBeenCalled()

      // Advance past debounce time
      await vi.advanceTimersByTimeAsync(EMBEDDING_SYNC_DEBOUNCE_MS + 100)

      // Should only have made one request
      expect(mockFetch).toHaveBeenCalledTimes(1)

      service.dispose()
    })

    it('should use correct debounce delay', () => {
      // Verify the constant is set appropriately (2 seconds)
      expect(EMBEDDING_SYNC_DEBOUNCE_MS).toBe(2000)
    })
  })

  describe('Offline queue', () => {
    it('should queue sync when offline', async () => {
      // Simulate offline
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true })

      const service = createEmbeddingSyncService({
        getAccessToken: () => 'test-token',
        apiBaseUrl: 'http://localhost:8000',
      })

      const bullet1: MockBlock = {
        id: 'b1',
        flavour: 'hydra:bullet',
        model: { text: { toString: () => 'Test bullet' } },
        parent: null,
        children: [],
      }

      const mockDoc = {
        id: 'doc-1',
        getBlock: vi.fn(),
        getBlockById: vi.fn(),
        getBlocksByFlavour: vi.fn(() => [bullet1]),
      }

      service.queueSync(mockDoc as unknown as Parameters<typeof service.queueSync>[0])

      await vi.advanceTimersByTimeAsync(EMBEDDING_SYNC_DEBOUNCE_MS + 100)

      // Should NOT have called fetch when offline
      expect(mockFetch).not.toHaveBeenCalled()

      // Verify document is queued
      const status = service.getSyncStatus()
      expect(status.pendingDocs).toContain('doc-1')

      // Restore online
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true })

      service.dispose()
    })

    it('should process queue when coming back online', async () => {
      // First simulate offline to queue a doc
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true })

      const service = createEmbeddingSyncService({
        getAccessToken: () => 'test-token',
        apiBaseUrl: 'http://localhost:8000',
      })

      const bullet1: MockBlock = {
        id: 'b1',
        flavour: 'hydra:bullet',
        model: { text: { toString: () => 'Test bullet' } },
        parent: null,
        children: [],
      }

      const mockDoc = {
        id: 'doc-1',
        getBlock: vi.fn(),
        getBlockById: vi.fn(),
        getBlocksByFlavour: vi.fn(() => [bullet1]),
      }

      // Queue the doc while offline
      service.queueSync(mockDoc as unknown as Parameters<typeof service.queueSync>[0])

      // Wait for debounce - API should not be called while offline
      await vi.advanceTimersByTimeAsync(EMBEDDING_SYNC_DEBOUNCE_MS + 100)
      expect(mockFetch).not.toHaveBeenCalled()

      // Come back online
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true })

      // Manually trigger queue processing (simulating online event)
      await service.processQueue()

      // Should have made API call now
      expect(mockFetch).toHaveBeenCalled()

      service.dispose()
    })
  })

  describe('API integration', () => {
    it('should send payloads to correct endpoint', async () => {
      const service = createEmbeddingSyncService({
        getAccessToken: () => 'test-token',
        apiBaseUrl: 'http://localhost:8000',
      })

      const bullet1: MockBlock = {
        id: 'b1',
        flavour: 'hydra:bullet',
        model: { text: { toString: () => 'Test bullet' } },
        parent: null,
        children: [],
      }

      const mockDoc = {
        id: 'doc-1',
        getBlock: vi.fn(),
        getBlockById: vi.fn(),
        getBlocksByFlavour: vi.fn(() => [bullet1]),
      }

      service.queueSync(mockDoc as unknown as Parameters<typeof service.queueSync>[0])

      await vi.advanceTimersByTimeAsync(EMBEDDING_SYNC_DEBOUNCE_MS + 100)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/notes/embeddings/batch',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          }),
        })
      )

      service.dispose()
    })

    it('should include auth token in requests', async () => {
      const getAccessToken = vi.fn().mockReturnValue('my-jwt-token')

      const service = createEmbeddingSyncService({
        getAccessToken,
        apiBaseUrl: 'http://localhost:8000',
      })

      const bullet1: MockBlock = {
        id: 'b1',
        flavour: 'hydra:bullet',
        model: { text: { toString: () => 'Test' } },
        parent: null,
        children: [],
      }

      const mockDoc = {
        id: 'doc-1',
        getBlock: vi.fn(),
        getBlockById: vi.fn(),
        getBlocksByFlavour: vi.fn(() => [bullet1]),
      }

      service.queueSync(mockDoc as unknown as Parameters<typeof service.queueSync>[0])

      await vi.advanceTimersByTimeAsync(EMBEDDING_SYNC_DEBOUNCE_MS + 100)

      expect(getAccessToken).toHaveBeenCalled()
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-jwt-token',
          }),
        })
      )

      service.dispose()
    })

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const service = createEmbeddingSyncService({
        getAccessToken: () => 'test-token',
        apiBaseUrl: 'http://localhost:8000',
      })

      const bullet1: MockBlock = {
        id: 'b1',
        flavour: 'hydra:bullet',
        model: { text: { toString: () => 'Test' } },
        parent: null,
        children: [],
      }

      const mockDoc = {
        id: 'doc-1',
        getBlock: vi.fn(),
        getBlockById: vi.fn(),
        getBlocksByFlavour: vi.fn(() => [bullet1]),
      }

      // Should not throw
      service.queueSync(mockDoc as unknown as Parameters<typeof service.queueSync>[0])

      await vi.advanceTimersByTimeAsync(EMBEDDING_SYNC_DEBOUNCE_MS + 100)

      // Document should be re-queued for retry
      const status = service.getSyncStatus()
      expect(status.failedDocs).toContain('doc-1')

      service.dispose()
    })
  })

  describe('Sync status', () => {
    it('should track sync status', () => {
      const service = createEmbeddingSyncService({
        getAccessToken: () => 'test-token',
        apiBaseUrl: 'http://localhost:8000',
      })

      const status = service.getSyncStatus()

      expect(status).toHaveProperty('isSyncing')
      expect(status).toHaveProperty('pendingDocs')
      expect(status).toHaveProperty('failedDocs')
      expect(status).toHaveProperty('lastSyncTime')

      service.dispose()
    })

    it('should update lastSyncTime after successful sync', async () => {
      const service = createEmbeddingSyncService({
        getAccessToken: () => 'test-token',
        apiBaseUrl: 'http://localhost:8000',
      })

      const initialStatus = service.getSyncStatus()
      expect(initialStatus.lastSyncTime).toBeNull()

      const bullet1: MockBlock = {
        id: 'b1',
        flavour: 'hydra:bullet',
        model: { text: { toString: () => 'Test' } },
        parent: null,
        children: [],
      }

      const mockDoc = {
        id: 'doc-1',
        getBlock: vi.fn(),
        getBlockById: vi.fn(),
        getBlocksByFlavour: vi.fn(() => [bullet1]),
      }

      service.queueSync(mockDoc as unknown as Parameters<typeof service.queueSync>[0])

      await vi.advanceTimersByTimeAsync(EMBEDDING_SYNC_DEBOUNCE_MS + 100)

      const updatedStatus = service.getSyncStatus()
      expect(updatedStatus.lastSyncTime).not.toBeNull()

      service.dispose()
    })
  })

  describe('Background catch-up', () => {
    it('should have method to check for unindexed documents', () => {
      const service = createEmbeddingSyncService({
        getAccessToken: () => 'test-token',
        apiBaseUrl: 'http://localhost:8000',
      })

      expect(service).toHaveProperty('checkUnindexedDocuments')

      service.dispose()
    })
  })

  describe('Cleanup', () => {
    it('should cleanup resources on dispose', () => {
      const service = createEmbeddingSyncService({
        getAccessToken: () => 'test-token',
        apiBaseUrl: 'http://localhost:8000',
      })

      // Should not throw
      expect(() => service.dispose()).not.toThrow()
    })

    it('should not sync after dispose', async () => {
      const service = createEmbeddingSyncService({
        getAccessToken: () => 'test-token',
        apiBaseUrl: 'http://localhost:8000',
      })

      const bullet1: MockBlock = {
        id: 'b1',
        flavour: 'hydra:bullet',
        model: { text: { toString: () => 'Test' } },
        parent: null,
        children: [],
      }

      const mockDoc = {
        id: 'doc-1',
        getBlock: vi.fn(),
        getBlockById: vi.fn(),
        getBlocksByFlavour: vi.fn(() => [bullet1]),
      }

      service.dispose()

      // Queue sync after dispose
      service.queueSync(mockDoc as unknown as Parameters<typeof service.queueSync>[0])

      await vi.advanceTimersByTimeAsync(EMBEDDING_SYNC_DEBOUNCE_MS + 100)

      // Should not have made any API calls
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })
})
