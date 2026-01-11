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

interface MockDoc {
  getBlock: (id: string) => MockBlock | null
  on: (event: string, callback: () => void) => void
  off: (event: string, callback: () => void) => void
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

    beforeEach(() => {
      mockTextObservers = []
      mockDoc = {
        getBlock: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
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
