/**
 * Unit Tests for Frecency Tracker (EDITOR-3409)
 *
 * Tests the Mozilla Firefox-based frecency algorithm:
 * - Decay factors based on age (<4h: 100, <24h: 70, <1w: 50, >1w: 30)
 * - Access count multiplied by decay factor
 * - localStorage persistence
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { FrecencyTracker } from '@/utils/frecency'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('FrecencyTracker', () => {
  let tracker: FrecencyTracker

  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear()
    tracker = new FrecencyTracker()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('recordAccess', () => {
    it('should record a new item with accessCount 1', () => {
      tracker.recordAccess({
        documentId: 'doc-1',
        blockId: 'block-1',
        bulletText: 'Test bullet',
        contextPath: 'Root / *Test bullet',
      })

      const recents = tracker.getTopRecents()
      expect(recents).toHaveLength(1)
      expect(recents[0].documentId).toBe('doc-1')
      expect(recents[0].blockId).toBe('block-1')
      expect(recents[0].accessCount).toBe(1)
    })

    it('should increment accessCount for existing item', () => {
      const item = {
        documentId: 'doc-1',
        blockId: 'block-1',
        bulletText: 'Test bullet',
        contextPath: 'Root / *Test bullet',
      }

      tracker.recordAccess(item)
      tracker.recordAccess(item)
      tracker.recordAccess(item)

      const recents = tracker.getTopRecents()
      expect(recents).toHaveLength(1)
      expect(recents[0].accessCount).toBe(3)
    })

    it('should update bulletText and contextPath on re-access', () => {
      tracker.recordAccess({
        documentId: 'doc-1',
        blockId: 'block-1',
        bulletText: 'Old text',
        contextPath: 'Old / *path',
      })

      tracker.recordAccess({
        documentId: 'doc-1',
        blockId: 'block-1',
        bulletText: 'Updated text',
        contextPath: 'Updated / *path',
      })

      const recents = tracker.getTopRecents()
      expect(recents[0].bulletText).toBe('Updated text')
      expect(recents[0].contextPath).toBe('Updated / *path')
    })
  })

  describe('frecency calculation (Mozilla Firefox algorithm)', () => {
    it('should apply decay factor 100 for items accessed less than 4 hours ago', () => {
      const now = Date.now()
      vi.setSystemTime(now)

      tracker.recordAccess({
        documentId: 'doc-1',
        blockId: 'block-1',
        bulletText: 'Recent item',
        contextPath: 'path',
      })

      const recents = tracker.getTopRecents()
      // accessCount (1) * decayFactor (100) = 100
      expect(recents[0].frecencyScore).toBe(100)
    })

    it('should apply decay factor 70 for items accessed 4-24 hours ago', () => {
      const now = Date.now()

      // Create item 6 hours ago
      vi.setSystemTime(now - 6 * 60 * 60 * 1000)
      tracker.recordAccess({
        documentId: 'doc-1',
        blockId: 'block-1',
        bulletText: 'Item from 6h ago',
        contextPath: 'path',
      })

      // Check frecency now
      vi.setSystemTime(now)
      const recents = tracker.getTopRecents()
      // accessCount (1) * decayFactor (70) = 70
      expect(recents[0].frecencyScore).toBe(70)
    })

    it('should apply decay factor 50 for items accessed 1-7 days ago', () => {
      const now = Date.now()

      // Create item 3 days ago
      vi.setSystemTime(now - 3 * 24 * 60 * 60 * 1000)
      tracker.recordAccess({
        documentId: 'doc-1',
        blockId: 'block-1',
        bulletText: 'Item from 3 days ago',
        contextPath: 'path',
      })

      // Check frecency now
      vi.setSystemTime(now)
      const recents = tracker.getTopRecents()
      // accessCount (1) * decayFactor (50) = 50
      expect(recents[0].frecencyScore).toBe(50)
    })

    it('should apply decay factor 30 for items accessed more than 7 days ago', () => {
      const now = Date.now()

      // Create item 10 days ago
      vi.setSystemTime(now - 10 * 24 * 60 * 60 * 1000)
      tracker.recordAccess({
        documentId: 'doc-1',
        blockId: 'block-1',
        bulletText: 'Old item',
        contextPath: 'path',
      })

      // Check frecency now
      vi.setSystemTime(now)
      const recents = tracker.getTopRecents()
      // accessCount (1) * decayFactor (30) = 30
      expect(recents[0].frecencyScore).toBe(30)
    })

    it('should combine access count with decay factor', () => {
      const now = Date.now()
      vi.setSystemTime(now)

      const item = {
        documentId: 'doc-1',
        blockId: 'block-1',
        bulletText: 'Frequently accessed',
        contextPath: 'path',
      }

      // Access 5 times
      for (let i = 0; i < 5; i++) {
        tracker.recordAccess(item)
      }

      const recents = tracker.getTopRecents()
      // accessCount (5) * decayFactor (100) = 500
      expect(recents[0].frecencyScore).toBe(500)
    })
  })

  describe('getTopRecents', () => {
    it('should return items sorted by frecency score (highest first)', () => {
      const now = Date.now()
      vi.setSystemTime(now)

      // Item 1: accessed once
      tracker.recordAccess({
        documentId: 'doc-1',
        blockId: 'block-1',
        bulletText: 'Once',
        contextPath: 'path1',
      })

      // Item 2: accessed 3 times
      for (let i = 0; i < 3; i++) {
        tracker.recordAccess({
          documentId: 'doc-2',
          blockId: 'block-2',
          bulletText: 'Three times',
          contextPath: 'path2',
        })
      }

      const recents = tracker.getTopRecents()
      expect(recents[0].blockId).toBe('block-2') // Higher score first
      expect(recents[1].blockId).toBe('block-1')
    })

    it('should limit results to specified amount', () => {
      const now = Date.now()
      vi.setSystemTime(now)

      // Add 15 items
      for (let i = 0; i < 15; i++) {
        tracker.recordAccess({
          documentId: `doc-${i}`,
          blockId: `block-${i}`,
          bulletText: `Item ${i}`,
          contextPath: `path-${i}`,
        })
      }

      const recents = tracker.getTopRecents(10)
      expect(recents).toHaveLength(10)
    })

    it('should default to 10 items', () => {
      const now = Date.now()
      vi.setSystemTime(now)

      // Add 15 items
      for (let i = 0; i < 15; i++) {
        tracker.recordAccess({
          documentId: `doc-${i}`,
          blockId: `block-${i}`,
          bulletText: `Item ${i}`,
          contextPath: `path-${i}`,
        })
      }

      const recents = tracker.getTopRecents()
      expect(recents).toHaveLength(10)
    })
  })

  describe('localStorage persistence', () => {
    it('should persist items across tracker instances', () => {
      tracker.recordAccess({
        documentId: 'doc-1',
        blockId: 'block-1',
        bulletText: 'Persisted item',
        contextPath: 'path',
      })

      // Create new tracker instance
      const newTracker = new FrecencyTracker()
      const recents = newTracker.getTopRecents()

      expect(recents).toHaveLength(1)
      expect(recents[0].bulletText).toBe('Persisted item')
    })

    it('should limit stored items to 100', () => {
      const now = Date.now()
      vi.setSystemTime(now)

      // Add 120 items
      for (let i = 0; i < 120; i++) {
        tracker.recordAccess({
          documentId: `doc-${i}`,
          blockId: `block-${i}`,
          bulletText: `Item ${i}`,
          contextPath: `path-${i}`,
        })
      }

      // Create new tracker to read from storage (validates storage is used)
      new FrecencyTracker()
      const stored = JSON.parse(localStorage.getItem('hydra-portal-recents') || '[]')

      expect(stored.length).toBeLessThanOrEqual(100)
    })
  })

  describe('removeItem', () => {
    it('should remove item by blockId', () => {
      tracker.recordAccess({
        documentId: 'doc-1',
        blockId: 'block-1',
        bulletText: 'To remove',
        contextPath: 'path',
      })
      tracker.recordAccess({
        documentId: 'doc-2',
        blockId: 'block-2',
        bulletText: 'To keep',
        contextPath: 'path',
      })

      tracker.removeItem('doc-1', 'block-1')

      const recents = tracker.getTopRecents()
      expect(recents).toHaveLength(1)
      expect(recents[0].blockId).toBe('block-2')
    })
  })

  describe('clearAll', () => {
    it('should clear all items', () => {
      tracker.recordAccess({
        documentId: 'doc-1',
        blockId: 'block-1',
        bulletText: 'Item 1',
        contextPath: 'path1',
      })
      tracker.recordAccess({
        documentId: 'doc-2',
        blockId: 'block-2',
        bulletText: 'Item 2',
        contextPath: 'path2',
      })

      tracker.clearAll()

      const recents = tracker.getTopRecents()
      expect(recents).toHaveLength(0)
    })
  })
})
