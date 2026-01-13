import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createAutoReorgObserver,
  DEFAULT_AUTO_REORG_CONFIG,
  validateAutoReorgConfig,
  type AutoReorgConfig,
  type AutoReorgContext,
} from '../utils/auto-reorg'

/**
 * Tests for Auto-Reorg Foundation (EDITOR-3407)
 *
 * Auto-reorg automatically:
 * 1. Observes document changes via Yjs
 * 2. Debounces 2s after last change
 * 3. Triggers callback with document context
 */

describe('Auto-Reorg Foundation (EDITOR-3407)', () => {
  describe('AutoReorgConfig', () => {
    describe('DEFAULT_AUTO_REORG_CONFIG', () => {
      it('should have auto-reorg enabled by default', () => {
        expect(DEFAULT_AUTO_REORG_CONFIG.enabled).toBe(true)
      })

      it('should have 2000ms debounce by default', () => {
        expect(DEFAULT_AUTO_REORG_CONFIG.debounceMs).toBe(2000)
      })

      it('should have 0.8 threshold score by default', () => {
        expect(DEFAULT_AUTO_REORG_CONFIG.thresholdScore).toBe(0.8)
      })

      it('should have 5 max results by default', () => {
        expect(DEFAULT_AUTO_REORG_CONFIG.maxResults).toBe(5)
      })
    })

    describe('validateAutoReorgConfig', () => {
      it('should use defaults for empty config', () => {
        const result = validateAutoReorgConfig({})
        expect(result.enabled).toBe(true)
        expect(result.debounceMs).toBe(2000)
        expect(result.thresholdScore).toBe(0.8)
        expect(result.maxResults).toBe(5)
      })

      it('should use provided enabled value', () => {
        const result = validateAutoReorgConfig({ enabled: false })
        expect(result.enabled).toBe(false)
      })

      it('should use provided debounceMs value', () => {
        const result = validateAutoReorgConfig({ debounceMs: 3000 })
        expect(result.debounceMs).toBe(3000)
      })

      it('should use default for negative debounceMs', () => {
        const result = validateAutoReorgConfig({ debounceMs: -100 })
        expect(result.debounceMs).toBe(2000)
      })

      it('should use provided thresholdScore value', () => {
        const result = validateAutoReorgConfig({ thresholdScore: 0.9 })
        expect(result.thresholdScore).toBe(0.9)
      })

      it('should clamp thresholdScore to valid range (0-1)', () => {
        expect(validateAutoReorgConfig({ thresholdScore: 1.5 }).thresholdScore).toBe(1)
        expect(validateAutoReorgConfig({ thresholdScore: -0.1 }).thresholdScore).toBe(0)
      })

      it('should use provided maxResults value', () => {
        const result = validateAutoReorgConfig({ maxResults: 10 })
        expect(result.maxResults).toBe(10)
      })

      it('should use default for invalid maxResults', () => {
        expect(validateAutoReorgConfig({ maxResults: 0 }).maxResults).toBe(5)
        expect(validateAutoReorgConfig({ maxResults: -1 }).maxResults).toBe(5)
      })
    })
  })

  describe('createAutoReorgObserver', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should debounce changes by 2000ms', () => {
      const onTrigger = vi.fn()
      const mockDoc = createMockDoc()
      const config: AutoReorgConfig = { ...DEFAULT_AUTO_REORG_CONFIG }

      const observer = createAutoReorgObserver(mockDoc, config, onTrigger)

      // Simulate document update
      mockDoc.simulateUpdate()
      expect(onTrigger).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1999)
      expect(onTrigger).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1)
      expect(onTrigger).toHaveBeenCalledTimes(1)

      observer.dispose()
    })

    it('should reset debounce timer on new changes', () => {
      const onTrigger = vi.fn()
      const mockDoc = createMockDoc()
      const config: AutoReorgConfig = { ...DEFAULT_AUTO_REORG_CONFIG }

      const observer = createAutoReorgObserver(mockDoc, config, onTrigger)

      // First update
      mockDoc.simulateUpdate()
      vi.advanceTimersByTime(1500)
      expect(onTrigger).not.toHaveBeenCalled()

      // Second update resets timer
      mockDoc.simulateUpdate()
      vi.advanceTimersByTime(1500)
      expect(onTrigger).not.toHaveBeenCalled()

      vi.advanceTimersByTime(500)
      expect(onTrigger).toHaveBeenCalledTimes(1)

      observer.dispose()
    })

    it('should not trigger when disabled', () => {
      const onTrigger = vi.fn()
      const mockDoc = createMockDoc()
      const config: AutoReorgConfig = { ...DEFAULT_AUTO_REORG_CONFIG, enabled: false }

      const observer = createAutoReorgObserver(mockDoc, config, onTrigger)

      mockDoc.simulateUpdate()
      vi.advanceTimersByTime(3000)
      expect(onTrigger).not.toHaveBeenCalled()

      observer.dispose()
    })

    it('should provide context with document ID and text', () => {
      const onTrigger = vi.fn()
      const mockDoc = createMockDoc('doc-123', 'Sample document text')
      const config: AutoReorgConfig = { ...DEFAULT_AUTO_REORG_CONFIG }

      const observer = createAutoReorgObserver(mockDoc, config, onTrigger)

      mockDoc.simulateUpdate()
      vi.advanceTimersByTime(2000)

      expect(onTrigger).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: 'doc-123',
          documentText: 'Sample document text',
        })
      )

      observer.dispose()
    })

    it('should provide all bullet IDs in context', () => {
      const onTrigger = vi.fn()
      const mockDoc = createMockDoc('doc-123', 'text', ['block-1', 'block-2', 'block-3'])
      const config: AutoReorgConfig = { ...DEFAULT_AUTO_REORG_CONFIG }

      const observer = createAutoReorgObserver(mockDoc, config, onTrigger)

      mockDoc.simulateUpdate()
      vi.advanceTimersByTime(2000)

      const context = onTrigger.mock.calls[0][0] as AutoReorgContext
      expect(context.allBulletIds).toEqual(['block-1', 'block-2', 'block-3'])

      observer.dispose()
    })

    it('should stop observing after dispose', () => {
      const onTrigger = vi.fn()
      const mockDoc = createMockDoc()
      const config: AutoReorgConfig = { ...DEFAULT_AUTO_REORG_CONFIG }

      const observer = createAutoReorgObserver(mockDoc, config, onTrigger)

      mockDoc.simulateUpdate()
      vi.advanceTimersByTime(1000)

      observer.dispose()

      mockDoc.simulateUpdate()
      vi.advanceTimersByTime(3000)

      expect(onTrigger).not.toHaveBeenCalled()
    })

    it('should use custom debounce time', () => {
      const onTrigger = vi.fn()
      const mockDoc = createMockDoc()
      const config: AutoReorgConfig = { ...DEFAULT_AUTO_REORG_CONFIG, debounceMs: 500 }

      const observer = createAutoReorgObserver(mockDoc, config, onTrigger)

      mockDoc.simulateUpdate()
      vi.advanceTimersByTime(499)
      expect(onTrigger).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1)
      expect(onTrigger).toHaveBeenCalledTimes(1)

      observer.dispose()
    })
  })

  describe('extractDocumentText', () => {
    it('should extract text from all bullets', () => {
      // This will be tested via the context passed to onTrigger
      const onTrigger = vi.fn()
      const mockDoc = createMockDoc('doc-1', 'Root bullet\nChild bullet\nSibling bullet')
      const config: AutoReorgConfig = { ...DEFAULT_AUTO_REORG_CONFIG }

      vi.useFakeTimers()
      const observer = createAutoReorgObserver(mockDoc, config, onTrigger)

      mockDoc.simulateUpdate()
      vi.advanceTimersByTime(2000)

      const context = onTrigger.mock.calls[0][0] as AutoReorgContext
      expect(context.documentText).toContain('Root bullet')
      expect(context.documentText).toContain('Child bullet')

      observer.dispose()
      vi.useRealTimers()
    })
  })
})

// Mock Doc helper for testing
interface MockDoc {
  id: string
  spaceDoc: {
    on: (event: string, callback: () => void) => void
    off: (event: string, callback: () => void) => void
  }
  simulateUpdate: () => void
  getText: () => string
  getAllBulletIds: () => string[]
}

function createMockDoc(
  id: string = 'mock-doc',
  text: string = 'Mock document text',
  bulletIds: string[] = ['mock-block-1', 'mock-block-2']
): MockDoc {
  const listeners: Map<string, Set<() => void>> = new Map()

  return {
    id,
    spaceDoc: {
      on: (event: string, callback: () => void) => {
        if (!listeners.has(event)) {
          listeners.set(event, new Set())
        }
        listeners.get(event)!.add(callback)
      },
      off: (event: string, callback: () => void) => {
        listeners.get(event)?.delete(callback)
      },
    },
    simulateUpdate: () => {
      listeners.get('update')?.forEach((cb) => cb())
    },
    getText: () => text,
    getAllBulletIds: () => bulletIds,
  }
}
