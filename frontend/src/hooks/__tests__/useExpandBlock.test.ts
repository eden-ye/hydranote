/**
 * Tests for useExpandBlock hook
 * FE-408: Expand Button Logic
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useExpandBlock } from '../useExpandBlock'
import { useAIStore } from '../../stores/ai-store'

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = []
  url: string
  onopen: (() => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onclose: (() => void) | null = null
  readyState: number = 0

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = 1
      this.onopen?.()
    }, 0)
  }

  send = vi.fn()
  close = vi.fn(() => {
    this.readyState = 3
  })

  // Helper to simulate server messages
  simulateMessage(data: object) {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }))
  }

  simulateError() {
    this.onerror?.(new Event('error'))
  }

  static getLastInstance() {
    return MockWebSocket.instances[MockWebSocket.instances.length - 1]
  }

  static clearInstances() {
    MockWebSocket.instances = []
  }
}

// @ts-expect-error - Mock global WebSocket
global.WebSocket = MockWebSocket

describe('useExpandBlock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    MockWebSocket.clearInstances()
    // Reset AI store
    useAIStore.setState({
      isGenerating: false,
      isStreaming: false,
      generationsUsed: 0,
      generationsLimit: 50,
      error: null,
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('initial state', () => {
    it('should not be expanding initially', () => {
      const { result } = renderHook(() => useExpandBlock())
      expect(result.current.isExpanding).toBe(false)
    })

    it('should have no streamed text initially', () => {
      const { result } = renderHook(() => useExpandBlock())
      expect(result.current.streamedText).toBe('')
    })

    it('should have no error initially', () => {
      const { result } = renderHook(() => useExpandBlock())
      expect(result.current.error).toBeNull()
    })
  })

  describe('canExpand', () => {
    it('should return true when under rate limit and not generating', () => {
      const { result } = renderHook(() => useExpandBlock())
      expect(result.current.canExpand).toBe(true)
    })

    it('should return false when at rate limit', () => {
      useAIStore.setState({ generationsUsed: 50 })
      const { result } = renderHook(() => useExpandBlock())
      expect(result.current.canExpand).toBe(false)
    })

    it('should return false when already generating', () => {
      useAIStore.setState({ isGenerating: true })
      const { result } = renderHook(() => useExpandBlock())
      expect(result.current.canExpand).toBe(false)
    })
  })

  describe('expandBlock', () => {
    it('should connect to WebSocket with token', async () => {
      const { result } = renderHook(() => useExpandBlock())
      const context = {
        blockId: 'block-123',
        blockText: 'Main topic',
        siblingTexts: ['Related idea'],
        parentText: 'Parent context',
      }

      act(() => {
        result.current.expandBlock(context, 'test-token')
      })

      await waitFor(() => {
        const ws = MockWebSocket.getLastInstance()
        expect(ws).toBeDefined()
        expect(ws.url).toContain('ws://')
        expect(ws.url).toContain('token=test-token')
      })
    })

    it('should set isExpanding to true during expansion', async () => {
      const { result } = renderHook(() => useExpandBlock())
      const context = {
        blockId: 'block-123',
        blockText: 'Main topic',
        siblingTexts: [],
        parentText: null,
      }

      act(() => {
        result.current.expandBlock(context, 'test-token')
      })

      expect(result.current.isExpanding).toBe(true)
    })

    it('should send generate message with prompt', async () => {
      const { result } = renderHook(() => useExpandBlock())
      const context = {
        blockId: 'block-123',
        blockText: 'Main topic',
        siblingTexts: ['Related idea'],
        parentText: 'Parent context',
      }

      act(() => {
        result.current.expandBlock(context, 'test-token')
      })

      await waitFor(() => {
        const ws = MockWebSocket.getLastInstance()
        expect(ws.send).toHaveBeenCalled()
        const message = JSON.parse(ws.send.mock.calls[0][0])
        expect(message.action).toBe('generate')
        expect(message.prompt).toContain('Main topic')
      })
    })

    it('should accumulate streamed text from chunks', async () => {
      const { result } = renderHook(() => useExpandBlock())
      const context = {
        blockId: 'block-123',
        blockText: 'Main topic',
        siblingTexts: [],
        parentText: null,
      }

      act(() => {
        result.current.expandBlock(context, 'test-token')
      })

      await waitFor(() => {
        const ws = MockWebSocket.getLastInstance()
        expect(ws).toBeDefined()
      })

      const ws = MockWebSocket.getLastInstance()

      act(() => {
        ws.simulateMessage({ type: 'chunk', text: 'First ' })
      })

      expect(result.current.streamedText).toBe('First ')

      act(() => {
        ws.simulateMessage({ type: 'chunk', text: 'Second' })
      })

      expect(result.current.streamedText).toBe('First Second')
    })

    it('should set isExpanding to false when done', async () => {
      const { result } = renderHook(() => useExpandBlock())
      const context = {
        blockId: 'block-123',
        blockText: 'Main topic',
        siblingTexts: [],
        parentText: null,
      }

      act(() => {
        result.current.expandBlock(context, 'test-token')
      })

      await waitFor(() => {
        const ws = MockWebSocket.getLastInstance()
        expect(ws).toBeDefined()
      })

      const ws = MockWebSocket.getLastInstance()

      act(() => {
        ws.simulateMessage({ type: 'done', user_id: 'user-123' })
      })

      expect(result.current.isExpanding).toBe(false)
    })

    it('should handle error messages', async () => {
      const { result } = renderHook(() => useExpandBlock())
      const context = {
        blockId: 'block-123',
        blockText: 'Main topic',
        siblingTexts: [],
        parentText: null,
      }

      act(() => {
        result.current.expandBlock(context, 'test-token')
      })

      await waitFor(() => {
        const ws = MockWebSocket.getLastInstance()
        expect(ws).toBeDefined()
      })

      const ws = MockWebSocket.getLastInstance()

      act(() => {
        ws.simulateMessage({ type: 'error', message: 'Rate limit exceeded' })
      })

      expect(result.current.error).toBe('Rate limit exceeded')
      expect(result.current.isExpanding).toBe(false)
    })
  })

  describe('cancelExpansion', () => {
    it('should close WebSocket connection', async () => {
      const { result } = renderHook(() => useExpandBlock())
      const context = {
        blockId: 'block-123',
        blockText: 'Main topic',
        siblingTexts: [],
        parentText: null,
      }

      act(() => {
        result.current.expandBlock(context, 'test-token')
      })

      await waitFor(() => {
        const ws = MockWebSocket.getLastInstance()
        expect(ws).toBeDefined()
      })

      const ws = MockWebSocket.getLastInstance()

      act(() => {
        result.current.cancelExpansion()
      })

      expect(ws.close).toHaveBeenCalled()
      expect(result.current.isExpanding).toBe(false)
    })
  })

  describe('resetState', () => {
    it('should clear streamed text and error', async () => {
      const { result } = renderHook(() => useExpandBlock())

      // Set some state
      const context = {
        blockId: 'block-123',
        blockText: 'Main topic',
        siblingTexts: [],
        parentText: null,
      }

      act(() => {
        result.current.expandBlock(context, 'test-token')
      })

      await waitFor(() => {
        const ws = MockWebSocket.getLastInstance()
        expect(ws).toBeDefined()
      })

      const ws = MockWebSocket.getLastInstance()

      act(() => {
        ws.simulateMessage({ type: 'chunk', text: 'Some text' })
      })

      expect(result.current.streamedText).toBe('Some text')

      act(() => {
        result.current.resetState()
      })

      expect(result.current.streamedText).toBe('')
      expect(result.current.error).toBeNull()
    })
  })
})
