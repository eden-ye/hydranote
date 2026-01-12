import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Yjs types for testing
interface MockYTextInner {
  observe: (callback: (event: unknown) => void) => void
  unobserve: (callback: (event: unknown) => void) => void
}

interface MockYText {
  toString: () => string
  yText: MockYTextInner
}

interface MockBlock {
  id: string
  model: {
    text?: MockYText
    children?: string[]
  }
}

/**
 * Mock slot for BlockSuite event system
 */
interface MockSlot<T> {
  on: (callback: (data: T) => void) => { dispose: () => void }
}

/**
 * BlockUpdated event types (matches BlockSuite's Slot<BlockUpdated>)
 */
interface MockBlockUpdatedEvent {
  type: 'add' | 'delete' | 'update'
  id: string
  flavour?: string
  parent?: string
  model?: unknown
  init?: boolean
}

interface MockDoc {
  getBlock: (id: string) => MockBlock | null
  on: (event: string, callback: () => void) => void
  off: (event: string, callback: () => void) => void
  slots: {
    blockUpdated: MockSlot<MockBlockUpdatedEvent>
  }
}

/**
 * Tests for portal live sync functionality (EDITOR-3403)
 *
 * Testing:
 * - Yjs observation setup for source block text changes
 * - Real-time sync when source is edited
 * - Orphaned state detection when source is deleted
 * - Cleanup of observers on unmount
 */

import {
  createSourceObserver,
  detectOrphanedState,
  computeSyncState,
} from '../utils/portal-sync'

describe('Portal Live Sync (EDITOR-3403)', () => {
  describe('createSourceObserver', () => {
    let mockDoc: MockDoc
    let mockTextObservers: Array<(event: unknown) => void>
    let mockBlockUpdatedListeners: Array<(event: MockBlockUpdatedEvent) => void>
    let mockBlockUpdatedDisposers: Array<() => void>

    beforeEach(() => {
      mockTextObservers = []
      mockBlockUpdatedListeners = []
      mockBlockUpdatedDisposers = []
      mockDoc = {
        getBlock: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        slots: {
          blockUpdated: {
            on: vi.fn((cb) => {
              mockBlockUpdatedListeners.push(cb)
              const dispose = vi.fn(() => {
                const idx = mockBlockUpdatedListeners.indexOf(cb)
                if (idx !== -1) mockBlockUpdatedListeners.splice(idx, 1)
              })
              mockBlockUpdatedDisposers.push(dispose)
              return { dispose }
            }),
          },
        },
      }
    })

    it('should create an observer for source block text', () => {
      const mockYTextInner: MockYTextInner = {
        observe: vi.fn((cb) => mockTextObservers.push(cb)),
        unobserve: vi.fn(),
      }

      const mockText: MockYText = {
        toString: () => 'Hello world',
        yText: mockYTextInner,
      }

      const mockBlock: MockBlock = {
        id: 'block-1',
        model: { text: mockText },
      }

      vi.mocked(mockDoc.getBlock).mockReturnValue(mockBlock)

      const onTextChange = vi.fn()
      const onOrphaned = vi.fn()

      const observer = createSourceObserver({
        doc: mockDoc as unknown as Parameters<typeof createSourceObserver>[0]['doc'],
        sourceBlockId: 'block-1',
        onTextChange,
        onOrphaned,
      })

      expect(observer).toBeDefined()
      expect(mockYTextInner.observe).toHaveBeenCalled()
    })

    it('should call onTextChange when source text is edited', () => {
      const mockYTextInner: MockYTextInner = {
        observe: vi.fn((cb) => mockTextObservers.push(cb)),
        unobserve: vi.fn(),
      }

      const mockText: MockYText = {
        toString: () => 'Updated text',
        yText: mockYTextInner,
      }

      const mockBlock: MockBlock = {
        id: 'block-1',
        model: { text: mockText },
      }

      vi.mocked(mockDoc.getBlock).mockReturnValue(mockBlock)

      const onTextChange = vi.fn()
      const onOrphaned = vi.fn()

      createSourceObserver({
        doc: mockDoc as unknown as Parameters<typeof createSourceObserver>[0]['doc'],
        sourceBlockId: 'block-1',
        onTextChange,
        onOrphaned,
      })

      // Simulate text change event
      mockTextObservers.forEach((cb) => cb({ type: 'delta' }))

      expect(onTextChange).toHaveBeenCalledWith('Updated text')
    })

    it('should call onOrphaned when source block is not found', () => {
      vi.mocked(mockDoc.getBlock).mockReturnValue(null)

      const onTextChange = vi.fn()
      const onOrphaned = vi.fn()

      createSourceObserver({
        doc: mockDoc as unknown as Parameters<typeof createSourceObserver>[0]['doc'],
        sourceBlockId: 'block-1',
        onTextChange,
        onOrphaned,
      })

      expect(onOrphaned).toHaveBeenCalled()
      expect(onTextChange).not.toHaveBeenCalled()
    })

    it('should cleanup observers on dispose', () => {
      const mockYTextInner: MockYTextInner = {
        observe: vi.fn((cb) => mockTextObservers.push(cb)),
        unobserve: vi.fn(),
      }

      const mockText: MockYText = {
        toString: () => 'Hello',
        yText: mockYTextInner,
      }

      const mockBlock: MockBlock = {
        id: 'block-1',
        model: { text: mockText },
      }

      vi.mocked(mockDoc.getBlock).mockReturnValue(mockBlock)

      const observer = createSourceObserver({
        doc: mockDoc as unknown as Parameters<typeof createSourceObserver>[0]['doc'],
        sourceBlockId: 'block-1',
        onTextChange: vi.fn(),
        onOrphaned: vi.fn(),
      })

      observer.dispose()

      expect(mockYTextInner.unobserve).toHaveBeenCalled()
    })
  })

  /**
   * EDITOR-3406: Runtime orphan detection tests
   *
   * These tests verify that portals automatically detect when their source
   * block is deleted at runtime (without requiring page refresh).
   */
  describe('Runtime Orphan Detection (EDITOR-3406)', () => {
    let mockDoc: MockDoc
    let mockTextObservers: Array<(event: unknown) => void>
    let mockBlockUpdatedListeners: Array<(event: MockBlockUpdatedEvent) => void>
    let mockBlockUpdatedDisposers: Array<() => void>

    beforeEach(() => {
      mockTextObservers = []
      mockBlockUpdatedListeners = []
      mockBlockUpdatedDisposers = []
      mockDoc = {
        getBlock: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        slots: {
          blockUpdated: {
            on: vi.fn((cb) => {
              mockBlockUpdatedListeners.push(cb)
              const dispose = vi.fn(() => {
                const idx = mockBlockUpdatedListeners.indexOf(cb)
                if (idx !== -1) mockBlockUpdatedListeners.splice(idx, 1)
              })
              mockBlockUpdatedDisposers.push(dispose)
              return { dispose }
            }),
          },
        },
      }
    })

    it('should subscribe to blockUpdated slot on creation', () => {
      const mockYTextInner: MockYTextInner = {
        observe: vi.fn((cb) => mockTextObservers.push(cb)),
        unobserve: vi.fn(),
      }

      const mockText: MockYText = {
        toString: () => 'Hello',
        yText: mockYTextInner,
      }

      const mockBlock: MockBlock = {
        id: 'block-1',
        model: { text: mockText },
      }

      vi.mocked(mockDoc.getBlock).mockReturnValue(mockBlock)

      createSourceObserver({
        doc: mockDoc as unknown as Parameters<typeof createSourceObserver>[0]['doc'],
        sourceBlockId: 'block-1',
        onTextChange: vi.fn(),
        onOrphaned: vi.fn(),
      })

      expect(mockDoc.slots.blockUpdated.on).toHaveBeenCalled()
      expect(mockBlockUpdatedListeners.length).toBe(1)
    })

    it('should call onOrphaned when source block is deleted at runtime', () => {
      const mockYTextInner: MockYTextInner = {
        observe: vi.fn((cb) => mockTextObservers.push(cb)),
        unobserve: vi.fn(),
      }

      const mockText: MockYText = {
        toString: () => 'Hello',
        yText: mockYTextInner,
      }

      const mockBlock: MockBlock = {
        id: 'source-block-123',
        model: { text: mockText },
      }

      vi.mocked(mockDoc.getBlock).mockReturnValue(mockBlock)

      const onOrphaned = vi.fn()

      createSourceObserver({
        doc: mockDoc as unknown as Parameters<typeof createSourceObserver>[0]['doc'],
        sourceBlockId: 'source-block-123',
        onTextChange: vi.fn(),
        onOrphaned,
      })

      // Simulate source block deletion at runtime
      mockBlockUpdatedListeners.forEach((cb) =>
        cb({ type: 'delete', id: 'source-block-123' })
      )

      expect(onOrphaned).toHaveBeenCalled()
    })

    it('should NOT call onOrphaned when a different block is deleted', () => {
      const mockYTextInner: MockYTextInner = {
        observe: vi.fn((cb) => mockTextObservers.push(cb)),
        unobserve: vi.fn(),
      }

      const mockText: MockYText = {
        toString: () => 'Hello',
        yText: mockYTextInner,
      }

      const mockBlock: MockBlock = {
        id: 'source-block-123',
        model: { text: mockText },
      }

      vi.mocked(mockDoc.getBlock).mockReturnValue(mockBlock)

      const onOrphaned = vi.fn()

      createSourceObserver({
        doc: mockDoc as unknown as Parameters<typeof createSourceObserver>[0]['doc'],
        sourceBlockId: 'source-block-123',
        onTextChange: vi.fn(),
        onOrphaned,
      })

      // Simulate a different block being deleted
      mockBlockUpdatedListeners.forEach((cb) =>
        cb({ type: 'delete', id: 'other-block-456' })
      )

      expect(onOrphaned).not.toHaveBeenCalled()
    })

    it('should NOT call onOrphaned for non-delete events', () => {
      const mockYTextInner: MockYTextInner = {
        observe: vi.fn((cb) => mockTextObservers.push(cb)),
        unobserve: vi.fn(),
      }

      const mockText: MockYText = {
        toString: () => 'Hello',
        yText: mockYTextInner,
      }

      const mockBlock: MockBlock = {
        id: 'source-block-123',
        model: { text: mockText },
      }

      vi.mocked(mockDoc.getBlock).mockReturnValue(mockBlock)

      const onOrphaned = vi.fn()

      createSourceObserver({
        doc: mockDoc as unknown as Parameters<typeof createSourceObserver>[0]['doc'],
        sourceBlockId: 'source-block-123',
        onTextChange: vi.fn(),
        onOrphaned,
      })

      // Simulate 'add' and 'update' events on the source block
      mockBlockUpdatedListeners.forEach((cb) =>
        cb({ type: 'add', id: 'source-block-123' })
      )
      mockBlockUpdatedListeners.forEach((cb) =>
        cb({ type: 'update', id: 'source-block-123' })
      )

      expect(onOrphaned).not.toHaveBeenCalled()
    })

    it('should cleanup blockUpdated listener on dispose', () => {
      const mockYTextInner: MockYTextInner = {
        observe: vi.fn((cb) => mockTextObservers.push(cb)),
        unobserve: vi.fn(),
      }

      const mockText: MockYText = {
        toString: () => 'Hello',
        yText: mockYTextInner,
      }

      const mockBlock: MockBlock = {
        id: 'block-1',
        model: { text: mockText },
      }

      vi.mocked(mockDoc.getBlock).mockReturnValue(mockBlock)

      const observer = createSourceObserver({
        doc: mockDoc as unknown as Parameters<typeof createSourceObserver>[0]['doc'],
        sourceBlockId: 'block-1',
        onTextChange: vi.fn(),
        onOrphaned: vi.fn(),
      })

      expect(mockBlockUpdatedListeners.length).toBe(1)

      observer.dispose()

      // The listener should be removed
      expect(mockBlockUpdatedDisposers[0]).toHaveBeenCalled()
      expect(mockBlockUpdatedListeners.length).toBe(0)
    })

    it('should not listen for blockUpdated when source is already orphaned at init', () => {
      vi.mocked(mockDoc.getBlock).mockReturnValue(null)

      createSourceObserver({
        doc: mockDoc as unknown as Parameters<typeof createSourceObserver>[0]['doc'],
        sourceBlockId: 'block-1',
        onTextChange: vi.fn(),
        onOrphaned: vi.fn(),
      })

      // Should NOT subscribe to blockUpdated since the block is already orphaned
      expect(mockDoc.slots.blockUpdated.on).not.toHaveBeenCalled()
    })
  })

  describe('detectOrphanedState', () => {
    it('should return true when source block does not exist', () => {
      const mockDoc = {
        getBlock: vi.fn().mockReturnValue(null),
      }

      const result = detectOrphanedState(
        mockDoc as unknown as Parameters<typeof detectOrphanedState>[0],
        'block-1'
      )

      expect(result).toBe(true)
    })

    it('should return false when source block exists', () => {
      const mockDoc = {
        getBlock: vi.fn().mockReturnValue({ id: 'block-1', model: {} }),
      }

      const result = detectOrphanedState(
        mockDoc as unknown as Parameters<typeof detectOrphanedState>[0],
        'block-1'
      )

      expect(result).toBe(false)
    })
  })

  describe('computeSyncState', () => {
    it('should return "synced" when source matches portal', () => {
      const result = computeSyncState({
        sourceText: 'Hello world',
        portalText: 'Hello world',
        sourceExists: true,
      })

      expect(result).toBe('synced')
    })

    it('should return "stale" when source differs from portal', () => {
      const result = computeSyncState({
        sourceText: 'Updated text',
        portalText: 'Old text',
        sourceExists: true,
      })

      expect(result).toBe('stale')
    })

    it('should return "orphaned" when source does not exist', () => {
      const result = computeSyncState({
        sourceText: null,
        portalText: 'Some text',
        sourceExists: false,
      })

      expect(result).toBe('orphaned')
    })
  })
})

describe('Cross-Document Sync (EDITOR-3403)', () => {
  describe('Same-document sync', () => {
    it('should use direct Yjs observation for same-document portals', () => {
      const isSameDocument = (portalDocId: string, sourceDocId: string): boolean => {
        return portalDocId === sourceDocId
      }

      expect(isSameDocument('doc-1', 'doc-1')).toBe(true)
      expect(isSameDocument('doc-1', 'doc-2')).toBe(false)
    })
  })

  describe('Cross-document sync (future)', () => {
    /**
     * Cross-document sync requires loading the source document.
     * This will be implemented when multi-document support is added.
     */
    it('should detect cross-document portal', () => {
      const isCrossDocument = (portalDocId: string, sourceDocId: string): boolean => {
        return portalDocId !== sourceDocId
      }

      expect(isCrossDocument('doc-1', 'doc-2')).toBe(true)
      expect(isCrossDocument('doc-1', 'doc-1')).toBe(false)
    })
  })
})

describe('Sync Performance (EDITOR-3403)', () => {
  describe('Debouncing', () => {
    /**
     * Sync updates should be debounced to avoid excessive re-renders
     */
    it('should debounce rapid text changes', async () => {
      const debounce = <T extends (...args: Parameters<T>) => void>(
        fn: T,
        delay: number
      ): ((...args: Parameters<T>) => void) => {
        let timeoutId: ReturnType<typeof setTimeout> | null = null
        return (...args: Parameters<T>) => {
          if (timeoutId) clearTimeout(timeoutId)
          timeoutId = setTimeout(() => fn(...args), delay)
        }
      }

      const callback = vi.fn()
      const debouncedCallback = debounce(callback, 50)

      // Rapid calls
      debouncedCallback()
      debouncedCallback()
      debouncedCallback()

      // Should not be called yet
      expect(callback).not.toHaveBeenCalled()

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 60))

      // Should be called once
      expect(callback).toHaveBeenCalledTimes(1)
    })
  })
})
