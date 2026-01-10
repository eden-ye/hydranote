/**
 * Tests for AI Generation Store
 * FE-405: AI Generation Store
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  useAIStore,
  selectCanGenerate,
  selectGenerationsRemaining,
} from '../ai-store'

describe('AI Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store to initial state
    useAIStore.setState({
      currentPrompt: null,
      isGenerating: false,
      isStreaming: false,
      generationsUsed: 0,
      generationsLimit: 50,
      error: null,
      lastGenerationId: null,
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Initial State', () => {
    it('should have null currentPrompt initially', () => {
      const { result } = renderHook(() => useAIStore())
      expect(result.current.currentPrompt).toBeNull()
    })

    it('should not be generating initially', () => {
      const { result } = renderHook(() => useAIStore())
      expect(result.current.isGenerating).toBe(false)
    })

    it('should not be streaming initially', () => {
      const { result } = renderHook(() => useAIStore())
      expect(result.current.isStreaming).toBe(false)
    })

    it('should have generationsUsed at 0', () => {
      const { result } = renderHook(() => useAIStore())
      expect(result.current.generationsUsed).toBe(0)
    })

    it('should have generationsLimit at 50', () => {
      const { result } = renderHook(() => useAIStore())
      expect(result.current.generationsLimit).toBe(50)
    })

    it('should have no error initially', () => {
      const { result } = renderHook(() => useAIStore())
      expect(result.current.error).toBeNull()
    })
  })

  describe('setCurrentPrompt action', () => {
    it('should set the current prompt', () => {
      const { result } = renderHook(() => useAIStore())

      act(() => {
        result.current.setCurrentPrompt('test prompt')
      })

      expect(result.current.currentPrompt).toBe('test prompt')
    })

    it('should be able to clear the prompt', () => {
      const { result } = renderHook(() => useAIStore())

      act(() => {
        result.current.setCurrentPrompt('test prompt')
      })

      expect(result.current.currentPrompt).toBe('test prompt')

      act(() => {
        result.current.setCurrentPrompt(null)
      })

      expect(result.current.currentPrompt).toBeNull()
    })
  })

  describe('setIsGenerating action', () => {
    it('should set generating state', () => {
      const { result } = renderHook(() => useAIStore())

      act(() => {
        result.current.setIsGenerating(true)
      })

      expect(result.current.isGenerating).toBe(true)

      act(() => {
        result.current.setIsGenerating(false)
      })

      expect(result.current.isGenerating).toBe(false)
    })
  })

  describe('setIsStreaming action', () => {
    it('should set streaming state', () => {
      const { result } = renderHook(() => useAIStore())

      act(() => {
        result.current.setIsStreaming(true)
      })

      expect(result.current.isStreaming).toBe(true)

      act(() => {
        result.current.setIsStreaming(false)
      })

      expect(result.current.isStreaming).toBe(false)
    })
  })

  describe('setGenerationsUsed action', () => {
    it('should set generations used count', () => {
      const { result } = renderHook(() => useAIStore())

      act(() => {
        result.current.setGenerationsUsed(10)
      })

      expect(result.current.generationsUsed).toBe(10)
    })
  })

  describe('setGenerationsLimit action', () => {
    it('should set generations limit', () => {
      const { result } = renderHook(() => useAIStore())

      act(() => {
        result.current.setGenerationsLimit(100)
      })

      expect(result.current.generationsLimit).toBe(100)
    })
  })

  describe('incrementGenerationsUsed action', () => {
    it('should increment generations used by 1', () => {
      const { result } = renderHook(() => useAIStore())

      act(() => {
        result.current.incrementGenerationsUsed()
      })

      expect(result.current.generationsUsed).toBe(1)

      act(() => {
        result.current.incrementGenerationsUsed()
      })

      expect(result.current.generationsUsed).toBe(2)
    })
  })

  describe('setError action', () => {
    it('should set error message', () => {
      const { result } = renderHook(() => useAIStore())

      act(() => {
        result.current.setError('API error occurred')
      })

      expect(result.current.error).toBe('API error occurred')
    })

    it('should clear error', () => {
      const { result } = renderHook(() => useAIStore())

      act(() => {
        result.current.setError('Error')
        result.current.setError(null)
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('resetGeneration action', () => {
    it('should reset generation state', () => {
      const { result } = renderHook(() => useAIStore())

      // Set some state first
      act(() => {
        result.current.setCurrentPrompt('test')
        result.current.setIsGenerating(true)
        result.current.setIsStreaming(true)
        result.current.setError('error')
      })

      expect(result.current.currentPrompt).toBe('test')
      expect(result.current.isGenerating).toBe(true)

      act(() => {
        result.current.resetGeneration()
      })

      expect(result.current.currentPrompt).toBeNull()
      expect(result.current.isGenerating).toBe(false)
      expect(result.current.isStreaming).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('selectCanGenerate selector', () => {
    it('should return true when under limit and not generating', () => {
      const { result } = renderHook(() => useAIStore(selectCanGenerate))
      expect(result.current).toBe(true)
    })

    it('should return false when at limit', () => {
      const { result: storeResult } = renderHook(() => useAIStore())
      const { result: selectorResult } = renderHook(() =>
        useAIStore(selectCanGenerate)
      )

      act(() => {
        storeResult.current.setGenerationsUsed(50)
      })

      expect(selectorResult.current).toBe(false)
    })

    it('should return false when generating', () => {
      const { result: storeResult } = renderHook(() => useAIStore())
      const { result: selectorResult } = renderHook(() =>
        useAIStore(selectCanGenerate)
      )

      act(() => {
        storeResult.current.setIsGenerating(true)
      })

      expect(selectorResult.current).toBe(false)
    })
  })

  describe('selectGenerationsRemaining selector', () => {
    it('should calculate remaining generations', () => {
      const { result: storeResult } = renderHook(() => useAIStore())
      const { result: selectorResult } = renderHook(() =>
        useAIStore(selectGenerationsRemaining)
      )

      expect(selectorResult.current).toBe(50)

      act(() => {
        storeResult.current.setGenerationsUsed(10)
      })

      expect(selectorResult.current).toBe(40)
    })

    it('should not go negative', () => {
      const { result: storeResult } = renderHook(() => useAIStore())
      const { result: selectorResult } = renderHook(() =>
        useAIStore(selectGenerationsRemaining)
      )

      act(() => {
        storeResult.current.setGenerationsUsed(60)
      })

      expect(selectorResult.current).toBe(0)
    })
  })
})
