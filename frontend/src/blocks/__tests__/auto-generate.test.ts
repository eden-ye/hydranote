import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  shouldAutoGenerate,
  shouldCancelAutoGenerate,
  buildAutoGenerateContext,
  getNextAutoGenerateStatus,
  validateAutoGenerateSettings,
  createDebouncedAutoGenerate,
  DEFAULT_AUTO_GENERATE_SETTINGS,
  type AutoGenerateInput,
} from '../utils/auto-generate'

/**
 * Tests for auto-generate after descriptor insertion (EDITOR-3602)
 *
 * When a descriptor is inserted (via ~what, ~why, etc.), the system can
 * optionally auto-generate child bullets immediately after insertion.
 *
 * This feature is configurable and includes debouncing to prevent
 * rapid triggers from multiple descriptor insertions.
 */

describe('Auto-Generate After Descriptor (EDITOR-3602)', () => {
  describe('shouldAutoGenerate', () => {
    it('should return true when enabled and not generating', () => {
      const input: AutoGenerateInput = {
        autoGenerateEnabled: true,
        isGenerating: false,
        descriptorType: 'what',
      }
      expect(shouldAutoGenerate(input)).toBe(true)
    })

    it('should return false when disabled in settings', () => {
      const input: AutoGenerateInput = {
        autoGenerateEnabled: false,
        isGenerating: false,
        descriptorType: 'what',
      }
      expect(shouldAutoGenerate(input)).toBe(false)
    })

    it('should return false when already generating', () => {
      const input: AutoGenerateInput = {
        autoGenerateEnabled: true,
        isGenerating: true,
        descriptorType: 'why',
      }
      expect(shouldAutoGenerate(input)).toBe(false)
    })

    it('should work with all descriptor types', () => {
      const descriptorTypes = ['what', 'why', 'how', 'pros', 'cons', 'custom'] as const
      descriptorTypes.forEach((type) => {
        const input: AutoGenerateInput = {
          autoGenerateEnabled: true,
          isGenerating: false,
          descriptorType: type,
        }
        expect(shouldAutoGenerate(input)).toBe(true)
      })
    })
  })

  describe('debounce logic', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should delay callback execution by debounce time', () => {
      const callback = vi.fn()
      const debounced = createDebouncedAutoGenerate(callback)

      debounced.trigger()
      expect(callback).not.toHaveBeenCalled()

      vi.advanceTimersByTime(499)
      expect(callback).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1)
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should reset timer when triggered multiple times', () => {
      const callback = vi.fn()
      const debounced = createDebouncedAutoGenerate(callback)

      debounced.trigger()
      vi.advanceTimersByTime(300)
      debounced.trigger()
      vi.advanceTimersByTime(300)
      expect(callback).not.toHaveBeenCalled()

      vi.advanceTimersByTime(200)
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should allow cancellation before execution', () => {
      const callback = vi.fn()
      const debounced = createDebouncedAutoGenerate(callback)

      debounced.trigger()
      vi.advanceTimersByTime(300)
      debounced.cancel()
      vi.advanceTimersByTime(500)

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('cancellation on user typing', () => {
    it('should cancel when pending and user starts typing', () => {
      expect(
        shouldCancelAutoGenerate({ isPending: true, userIsTyping: true })
      ).toBe(true)
    })

    it('should not cancel when not pending', () => {
      expect(
        shouldCancelAutoGenerate({ isPending: false, userIsTyping: true })
      ).toBe(false)
    })

    it('should not cancel when user is not typing', () => {
      expect(
        shouldCancelAutoGenerate({ isPending: true, userIsTyping: false })
      ).toBe(false)
    })
  })

  describe('auto-generate context building', () => {
    it('should build context with all required fields', () => {
      const context = buildAutoGenerateContext({
        descriptorBlockId: 'desc-1',
        descriptorType: 'what',
        parentText: 'Topic text',
        grandparentText: 'Section context',
      })

      expect(context.descriptorBlockId).toBe('desc-1')
      expect(context.descriptorType).toBe('what')
      expect(context.parentText).toBe('Topic text')
      expect(context.grandparentText).toBe('Section context')
    })

    it('should handle custom descriptor with label', () => {
      const context = buildAutoGenerateContext({
        descriptorBlockId: 'desc-1',
        descriptorType: 'custom',
        descriptorLabel: 'Examples',
        parentText: 'Topic text',
        grandparentText: null,
      })

      expect(context.descriptorType).toBe('custom')
      expect(context.descriptorLabel).toBe('Examples')
    })
  })

  describe('generation status tracking', () => {
    it('should transition from idle to pending on trigger', () => {
      expect(getNextAutoGenerateStatus('idle', 'trigger')).toBe('pending')
    })

    it('should transition from pending to generating on start', () => {
      expect(getNextAutoGenerateStatus('pending', 'start')).toBe('generating')
    })

    it('should transition from generating to completed on complete', () => {
      expect(getNextAutoGenerateStatus('generating', 'complete')).toBe('completed')
    })

    it('should transition from pending to cancelled on cancel', () => {
      expect(getNextAutoGenerateStatus('pending', 'cancel')).toBe('cancelled')
    })

    it('should transition from generating to cancelled on cancel', () => {
      expect(getNextAutoGenerateStatus('generating', 'cancel')).toBe('cancelled')
    })

    it('should transition from completed to idle on reset', () => {
      expect(getNextAutoGenerateStatus('completed', 'reset')).toBe('idle')
    })

    it('should transition from cancelled to idle on reset', () => {
      expect(getNextAutoGenerateStatus('cancelled', 'reset')).toBe('idle')
    })

    it('should stay in idle on non-trigger events', () => {
      expect(getNextAutoGenerateStatus('idle', 'start')).toBe('idle')
      expect(getNextAutoGenerateStatus('idle', 'complete')).toBe('idle')
      expect(getNextAutoGenerateStatus('idle', 'cancel')).toBe('idle')
    })
  })
})

// ============================================================================
// Settings Store Tests
// ============================================================================

describe('Auto-Generate Settings', () => {
  describe('default settings', () => {
    it('should have auto-generate enabled by default', () => {
      expect(DEFAULT_AUTO_GENERATE_SETTINGS.enabled).toBe(true)
    })

    it('should have 500ms debounce by default', () => {
      expect(DEFAULT_AUTO_GENERATE_SETTINGS.debounceMs).toBe(500)
    })
  })

  describe('settings validation', () => {
    it('should use default for missing enabled', () => {
      const result = validateAutoGenerateSettings({})
      expect(result.enabled).toBe(true)
    })

    it('should use provided enabled value', () => {
      const result = validateAutoGenerateSettings({ enabled: false })
      expect(result.enabled).toBe(false)
    })

    it('should use default for negative debounce', () => {
      const result = validateAutoGenerateSettings({ debounceMs: -100 })
      expect(result.debounceMs).toBe(500)
    })

    it('should allow zero debounce', () => {
      const result = validateAutoGenerateSettings({ debounceMs: 0 })
      expect(result.debounceMs).toBe(0)
    })
  })
})
