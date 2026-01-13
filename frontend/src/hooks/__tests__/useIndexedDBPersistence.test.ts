/**
 * BUG-EDITOR-3064: Tests for version-based IndexedDB cleanup utilities
 *
 * Tests the persistence version checking and cleanup functions that prevent
 * orphaned blocks from causing render errors.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  PERSISTENCE_VERSION,
  PERSISTENCE_VERSION_KEY,
  getStoredPersistenceVersion,
  savePersistenceVersion,
  shouldClearPersistence,
} from '../useIndexedDBPersistence'

describe('useIndexedDBPersistence version utilities', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key]
      }),
      clear: vi.fn(() => {
        store = {}
      }),
    }
  })()

  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock.clear()
    vi.clearAllMocks()

    // Replace global localStorage
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getStoredPersistenceVersion', () => {
    it('returns 0 when no version is stored', () => {
      const version = getStoredPersistenceVersion()
      expect(version).toBe(0)
    })

    it('returns the stored version number', () => {
      localStorageMock.setItem(PERSISTENCE_VERSION_KEY, '5')
      const version = getStoredPersistenceVersion()
      expect(version).toBe(5)
    })

    it('returns 0 when localStorage throws', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage access denied')
      })
      const version = getStoredPersistenceVersion()
      expect(version).toBe(0)
    })
  })

  describe('savePersistenceVersion', () => {
    it('saves the current persistence version to localStorage', () => {
      savePersistenceVersion()
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        PERSISTENCE_VERSION_KEY,
        String(PERSISTENCE_VERSION)
      )
    })

    it('handles localStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceeded')
      })

      // Should not throw
      expect(() => savePersistenceVersion()).not.toThrow()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save persistence version')
      )

      consoleSpy.mockRestore()
    })
  })

  describe('shouldClearPersistence', () => {
    it('returns true when no version is stored (first run)', () => {
      const shouldClear = shouldClearPersistence()
      expect(shouldClear).toBe(true)
    })

    it('returns true when stored version differs from current', () => {
      localStorageMock.setItem(PERSISTENCE_VERSION_KEY, '1')
      const shouldClear = shouldClearPersistence()
      expect(shouldClear).toBe(true)
    })

    it('returns false when stored version matches current', () => {
      localStorageMock.setItem(PERSISTENCE_VERSION_KEY, String(PERSISTENCE_VERSION))
      const shouldClear = shouldClearPersistence()
      expect(shouldClear).toBe(false)
    })
  })

  describe('PERSISTENCE_VERSION', () => {
    it('is a positive integer', () => {
      expect(PERSISTENCE_VERSION).toBeGreaterThan(0)
      expect(Number.isInteger(PERSISTENCE_VERSION)).toBe(true)
    })

    it('is at least version 2 (after BUG-EDITOR-3064 fix)', () => {
      // Version 2 was introduced to clear orphaned blocks
      expect(PERSISTENCE_VERSION).toBeGreaterThanOrEqual(2)
    })
  })
})
