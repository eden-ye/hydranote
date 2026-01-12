/**
 * Tests for Settings Store
 * FE-501: Semantic Linking Settings
 *
 * Tests for the settings store that manages:
 * - Semantic linking enabled/disabled toggle
 * - Similarity threshold (0.5-1.0)
 * - Max suggestions per concept (1-10)
 * - Settings persistence (localStorage)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  useSettingsStore,
  selectSemanticLinkingEnabled,
  selectSemanticLinkingThreshold,
  selectSemanticLinkingMaxSuggestions,
  SEMANTIC_LINKING_DEFAULTS,
  SETTINGS_STORAGE_KEY,
} from '../settings-store'

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

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('Settings Store (FE-501)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    // Reset store to initial state
    useSettingsStore.setState({
      semanticLinkingEnabled: SEMANTIC_LINKING_DEFAULTS.enabled,
      semanticLinkingThreshold: SEMANTIC_LINKING_DEFAULTS.threshold,
      semanticLinkingMaxSuggestions: SEMANTIC_LINKING_DEFAULTS.maxSuggestionsPerConcept,
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Default Values', () => {
    it('should export SEMANTIC_LINKING_DEFAULTS with correct values', () => {
      expect(SEMANTIC_LINKING_DEFAULTS).toEqual({
        enabled: true,
        threshold: 0.8,
        maxSuggestionsPerConcept: 3,
      })
    })

    it('should export SETTINGS_STORAGE_KEY', () => {
      expect(SETTINGS_STORAGE_KEY).toBe('hydra-settings-v1')
    })
  })

  describe('Initial State', () => {
    it('should have semantic linking enabled by default', () => {
      const { result } = renderHook(() => useSettingsStore())
      expect(result.current.semanticLinkingEnabled).toBe(true)
    })

    it('should have threshold of 0.8 by default', () => {
      const { result } = renderHook(() => useSettingsStore())
      expect(result.current.semanticLinkingThreshold).toBe(0.8)
    })

    it('should have max suggestions of 3 by default', () => {
      const { result } = renderHook(() => useSettingsStore())
      expect(result.current.semanticLinkingMaxSuggestions).toBe(3)
    })
  })

  describe('setSemanticLinkingEnabled action', () => {
    it('should enable semantic linking', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSemanticLinkingEnabled(true)
      })

      expect(result.current.semanticLinkingEnabled).toBe(true)
    })

    it('should disable semantic linking', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSemanticLinkingEnabled(false)
      })

      expect(result.current.semanticLinkingEnabled).toBe(false)
    })

    it('should persist to localStorage when changed', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSemanticLinkingEnabled(false)
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        SETTINGS_STORAGE_KEY,
        expect.stringContaining('"semanticLinkingEnabled":false')
      )
    })
  })

  describe('setSemanticLinkingThreshold action', () => {
    it('should update threshold', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSemanticLinkingThreshold(0.9)
      })

      expect(result.current.semanticLinkingThreshold).toBe(0.9)
    })

    it('should allow setting to minimum (0.5)', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSemanticLinkingThreshold(0.5)
      })

      expect(result.current.semanticLinkingThreshold).toBe(0.5)
    })

    it('should allow setting to maximum (1.0)', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSemanticLinkingThreshold(1.0)
      })

      expect(result.current.semanticLinkingThreshold).toBe(1.0)
    })

    it('should clamp values below minimum to 0.5', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSemanticLinkingThreshold(0.3)
      })

      expect(result.current.semanticLinkingThreshold).toBe(0.5)
    })

    it('should clamp values above maximum to 1.0', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSemanticLinkingThreshold(1.5)
      })

      expect(result.current.semanticLinkingThreshold).toBe(1.0)
    })

    it('should persist to localStorage when changed', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSemanticLinkingThreshold(0.9)
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        SETTINGS_STORAGE_KEY,
        expect.stringContaining('"semanticLinkingThreshold":0.9')
      )
    })
  })

  describe('setSemanticLinkingMaxSuggestions action', () => {
    it('should update max suggestions', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSemanticLinkingMaxSuggestions(5)
      })

      expect(result.current.semanticLinkingMaxSuggestions).toBe(5)
    })

    it('should allow setting to minimum (1)', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSemanticLinkingMaxSuggestions(1)
      })

      expect(result.current.semanticLinkingMaxSuggestions).toBe(1)
    })

    it('should allow setting to maximum (10)', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSemanticLinkingMaxSuggestions(10)
      })

      expect(result.current.semanticLinkingMaxSuggestions).toBe(10)
    })

    it('should clamp values below minimum to 1', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSemanticLinkingMaxSuggestions(0)
      })

      expect(result.current.semanticLinkingMaxSuggestions).toBe(1)
    })

    it('should clamp values above maximum to 10', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSemanticLinkingMaxSuggestions(15)
      })

      expect(result.current.semanticLinkingMaxSuggestions).toBe(10)
    })

    it('should persist to localStorage when changed', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setSemanticLinkingMaxSuggestions(5)
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        SETTINGS_STORAGE_KEY,
        expect.stringContaining('"semanticLinkingMaxSuggestions":5')
      )
    })
  })

  describe('Selectors', () => {
    describe('selectSemanticLinkingEnabled', () => {
      it('should return enabled state', () => {
        const { result: storeResult } = renderHook(() => useSettingsStore())
        const { result: selectorResult } = renderHook(() =>
          useSettingsStore(selectSemanticLinkingEnabled)
        )

        expect(selectorResult.current).toBe(true)

        act(() => {
          storeResult.current.setSemanticLinkingEnabled(false)
        })

        expect(selectorResult.current).toBe(false)
      })
    })

    describe('selectSemanticLinkingThreshold', () => {
      it('should return threshold value', () => {
        const { result: storeResult } = renderHook(() => useSettingsStore())
        const { result: selectorResult } = renderHook(() =>
          useSettingsStore(selectSemanticLinkingThreshold)
        )

        expect(selectorResult.current).toBe(0.8)

        act(() => {
          storeResult.current.setSemanticLinkingThreshold(0.9)
        })

        expect(selectorResult.current).toBe(0.9)
      })
    })

    describe('selectSemanticLinkingMaxSuggestions', () => {
      it('should return max suggestions value', () => {
        const { result: storeResult } = renderHook(() => useSettingsStore())
        const { result: selectorResult } = renderHook(() =>
          useSettingsStore(selectSemanticLinkingMaxSuggestions)
        )

        expect(selectorResult.current).toBe(3)

        act(() => {
          storeResult.current.setSemanticLinkingMaxSuggestions(7)
        })

        expect(selectorResult.current).toBe(7)
      })
    })
  })

  describe('loadSettingsFromStorage action', () => {
    it('should load settings from localStorage on initialization', () => {
      const savedSettings = {
        semanticLinkingEnabled: false,
        semanticLinkingThreshold: 0.7,
        semanticLinkingMaxSuggestions: 5,
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedSettings))

      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.loadSettingsFromStorage()
      })

      expect(result.current.semanticLinkingEnabled).toBe(false)
      expect(result.current.semanticLinkingThreshold).toBe(0.7)
      expect(result.current.semanticLinkingMaxSuggestions).toBe(5)
    })

    it('should use defaults when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.loadSettingsFromStorage()
      })

      expect(result.current.semanticLinkingEnabled).toBe(true)
      expect(result.current.semanticLinkingThreshold).toBe(0.8)
      expect(result.current.semanticLinkingMaxSuggestions).toBe(3)
    })

    it('should handle corrupted localStorage gracefully', () => {
      localStorageMock.getItem.mockReturnValue('not valid json')

      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.loadSettingsFromStorage()
      })

      // Should fall back to defaults
      expect(result.current.semanticLinkingEnabled).toBe(true)
      expect(result.current.semanticLinkingThreshold).toBe(0.8)
      expect(result.current.semanticLinkingMaxSuggestions).toBe(3)
    })

    it('should handle partial settings in localStorage', () => {
      const partialSettings = {
        semanticLinkingEnabled: false,
        // Missing threshold and maxSuggestions
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(partialSettings))

      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.loadSettingsFromStorage()
      })

      expect(result.current.semanticLinkingEnabled).toBe(false)
      expect(result.current.semanticLinkingThreshold).toBe(0.8) // default
      expect(result.current.semanticLinkingMaxSuggestions).toBe(3) // default
    })
  })

  describe('resetToDefaults action', () => {
    it('should reset all settings to defaults', () => {
      const { result } = renderHook(() => useSettingsStore())

      // Change all settings
      act(() => {
        result.current.setSemanticLinkingEnabled(false)
        result.current.setSemanticLinkingThreshold(0.9)
        result.current.setSemanticLinkingMaxSuggestions(7)
      })

      expect(result.current.semanticLinkingEnabled).toBe(false)
      expect(result.current.semanticLinkingThreshold).toBe(0.9)
      expect(result.current.semanticLinkingMaxSuggestions).toBe(7)

      // Reset to defaults
      act(() => {
        result.current.resetToDefaults()
      })

      expect(result.current.semanticLinkingEnabled).toBe(true)
      expect(result.current.semanticLinkingThreshold).toBe(0.8)
      expect(result.current.semanticLinkingMaxSuggestions).toBe(3)
    })

    it('should persist defaults to localStorage', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.resetToDefaults()
      })

      expect(localStorageMock.setItem).toHaveBeenCalled()
    })
  })
})

/**
 * Tests for Auto-Generation Settings
 * FE-502: Auto-Generation Settings
 *
 * Tests for the settings store that manages:
 * - Auto-generate toggle (on/off)
 * - Generation count (1-5 bullets per descriptor)
 * - Trigger descriptor types (What, Why, How, Pros, Cons)
 */
describe('Auto-Generation Settings Store (FE-502)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    // Reset store to initial state
    useSettingsStore.setState({
      semanticLinkingEnabled: SEMANTIC_LINKING_DEFAULTS.enabled,
      semanticLinkingThreshold: SEMANTIC_LINKING_DEFAULTS.threshold,
      semanticLinkingMaxSuggestions: SEMANTIC_LINKING_DEFAULTS.maxSuggestionsPerConcept,
      // Reset auto-generation settings
      autoGenerationEnabled: false,
      autoGenerationCount: 3,
      autoGenerationTriggers: { what: true, why: true, how: true, pros: false, cons: false },
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Default Values', () => {
    it('should export AUTO_GENERATION_DEFAULTS with correct values', async () => {
      const { AUTO_GENERATION_DEFAULTS } = await import('../settings-store')
      expect(AUTO_GENERATION_DEFAULTS).toEqual({
        enabled: false,
        count: 3,
        triggers: { what: true, why: true, how: true, pros: false, cons: false },
      })
    })
  })

  describe('Initial State', () => {
    it('should have auto-generation disabled by default', () => {
      const { result } = renderHook(() => useSettingsStore())
      expect(result.current.autoGenerationEnabled).toBe(false)
    })

    it('should have generation count of 3 by default', () => {
      const { result } = renderHook(() => useSettingsStore())
      expect(result.current.autoGenerationCount).toBe(3)
    })

    it('should have What, Why, How enabled by default', () => {
      const { result } = renderHook(() => useSettingsStore())
      expect(result.current.autoGenerationTriggers).toEqual({
        what: true,
        why: true,
        how: true,
        pros: false,
        cons: false,
      })
    })
  })

  describe('setAutoGenerationEnabled action', () => {
    it('should enable auto-generation', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setAutoGenerationEnabled(true)
      })

      expect(result.current.autoGenerationEnabled).toBe(true)
    })

    it('should disable auto-generation', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setAutoGenerationEnabled(true)
        result.current.setAutoGenerationEnabled(false)
      })

      expect(result.current.autoGenerationEnabled).toBe(false)
    })

    it('should persist to localStorage when changed', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setAutoGenerationEnabled(true)
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        SETTINGS_STORAGE_KEY,
        expect.stringContaining('"autoGenerationEnabled":true')
      )
    })
  })

  describe('setAutoGenerationCount action', () => {
    it('should update generation count', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setAutoGenerationCount(4)
      })

      expect(result.current.autoGenerationCount).toBe(4)
    })

    it('should allow setting to minimum (1)', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setAutoGenerationCount(1)
      })

      expect(result.current.autoGenerationCount).toBe(1)
    })

    it('should allow setting to maximum (5)', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setAutoGenerationCount(5)
      })

      expect(result.current.autoGenerationCount).toBe(5)
    })

    it('should clamp values below minimum to 1', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setAutoGenerationCount(0)
      })

      expect(result.current.autoGenerationCount).toBe(1)
    })

    it('should clamp values above maximum to 5', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setAutoGenerationCount(10)
      })

      expect(result.current.autoGenerationCount).toBe(5)
    })

    it('should persist to localStorage when changed', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setAutoGenerationCount(4)
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        SETTINGS_STORAGE_KEY,
        expect.stringContaining('"autoGenerationCount":4')
      )
    })
  })

  describe('setAutoGenerationTrigger action', () => {
    it('should enable a descriptor type trigger', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setAutoGenerationTrigger('pros', true)
      })

      expect(result.current.autoGenerationTriggers.pros).toBe(true)
    })

    it('should disable a descriptor type trigger', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setAutoGenerationTrigger('what', false)
      })

      expect(result.current.autoGenerationTriggers.what).toBe(false)
    })

    it('should only affect the specified trigger', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setAutoGenerationTrigger('pros', true)
      })

      expect(result.current.autoGenerationTriggers).toEqual({
        what: true,
        why: true,
        how: true,
        pros: true,
        cons: false,
      })
    })

    it('should persist to localStorage when changed', () => {
      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.setAutoGenerationTrigger('pros', true)
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        SETTINGS_STORAGE_KEY,
        expect.stringContaining('"pros":true')
      )
    })
  })

  describe('Selectors', () => {
    it('should have selectAutoGenerationEnabled selector', async () => {
      const { selectAutoGenerationEnabled } = await import('../settings-store')
      const { result: storeResult } = renderHook(() => useSettingsStore())
      const { result: selectorResult } = renderHook(() =>
        useSettingsStore(selectAutoGenerationEnabled)
      )

      expect(selectorResult.current).toBe(false)

      act(() => {
        storeResult.current.setAutoGenerationEnabled(true)
      })

      expect(selectorResult.current).toBe(true)
    })

    it('should have selectAutoGenerationCount selector', async () => {
      const { selectAutoGenerationCount } = await import('../settings-store')
      const { result: storeResult } = renderHook(() => useSettingsStore())
      const { result: selectorResult } = renderHook(() =>
        useSettingsStore(selectAutoGenerationCount)
      )

      expect(selectorResult.current).toBe(3)

      act(() => {
        storeResult.current.setAutoGenerationCount(5)
      })

      expect(selectorResult.current).toBe(5)
    })

    it('should have selectAutoGenerationTriggers selector', async () => {
      const { selectAutoGenerationTriggers } = await import('../settings-store')
      const { result: storeResult } = renderHook(() => useSettingsStore())
      const { result: selectorResult } = renderHook(() =>
        useSettingsStore(selectAutoGenerationTriggers)
      )

      expect(selectorResult.current).toEqual({
        what: true,
        why: true,
        how: true,
        pros: false,
        cons: false,
      })

      act(() => {
        storeResult.current.setAutoGenerationTrigger('cons', true)
      })

      expect(selectorResult.current.cons).toBe(true)
    })
  })

  describe('loadSettingsFromStorage with auto-generation settings', () => {
    it('should load auto-generation settings from localStorage', () => {
      const savedSettings = {
        semanticLinkingEnabled: true,
        semanticLinkingThreshold: 0.8,
        semanticLinkingMaxSuggestions: 3,
        autoGenerationEnabled: true,
        autoGenerationCount: 4,
        autoGenerationTriggers: { what: true, why: false, how: true, pros: true, cons: false },
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedSettings))

      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.loadSettingsFromStorage()
      })

      expect(result.current.autoGenerationEnabled).toBe(true)
      expect(result.current.autoGenerationCount).toBe(4)
      expect(result.current.autoGenerationTriggers).toEqual({
        what: true,
        why: false,
        how: true,
        pros: true,
        cons: false,
      })
    })

    it('should use defaults for auto-generation when not in localStorage', () => {
      const savedSettings = {
        semanticLinkingEnabled: false,
        semanticLinkingThreshold: 0.7,
        semanticLinkingMaxSuggestions: 5,
        // No auto-generation settings
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedSettings))

      const { result } = renderHook(() => useSettingsStore())

      act(() => {
        result.current.loadSettingsFromStorage()
      })

      expect(result.current.autoGenerationEnabled).toBe(false)
      expect(result.current.autoGenerationCount).toBe(3)
      expect(result.current.autoGenerationTriggers).toEqual({
        what: true,
        why: true,
        how: true,
        pros: false,
        cons: false,
      })
    })
  })

  describe('resetToDefaults with auto-generation settings', () => {
    it('should reset auto-generation settings to defaults', () => {
      const { result } = renderHook(() => useSettingsStore())

      // Change all auto-generation settings
      act(() => {
        result.current.setAutoGenerationEnabled(true)
        result.current.setAutoGenerationCount(5)
        result.current.setAutoGenerationTrigger('what', false)
        result.current.setAutoGenerationTrigger('pros', true)
      })

      expect(result.current.autoGenerationEnabled).toBe(true)
      expect(result.current.autoGenerationCount).toBe(5)
      expect(result.current.autoGenerationTriggers.what).toBe(false)
      expect(result.current.autoGenerationTriggers.pros).toBe(true)

      // Reset to defaults
      act(() => {
        result.current.resetToDefaults()
      })

      expect(result.current.autoGenerationEnabled).toBe(false)
      expect(result.current.autoGenerationCount).toBe(3)
      expect(result.current.autoGenerationTriggers).toEqual({
        what: true,
        why: true,
        how: true,
        pros: false,
        cons: false,
      })
    })
  })
})
