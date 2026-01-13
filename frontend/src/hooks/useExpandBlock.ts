/**
 * useExpandBlock hook
 * FE-408: Expand Button Logic
 *
 * Provides expand functionality for bullet blocks using WebSocket streaming.
 * - Connects to AI WebSocket endpoint
 * - Streams generated content in real-time
 * - Handles rate limiting and errors
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import {
  useAIStore,
  selectCanGenerate,
} from '../stores/ai-store'

/**
 * Context for block expansion
 */
export interface ExpandBlockContext {
  /** ID of the block being expanded */
  blockId: string
  /** Text content of the block */
  blockText: string
  /** Text content of sibling blocks */
  siblingTexts: string[]
  /** Text content of parent block */
  parentText: string | null
}

/**
 * WebSocket message types from server
 */
interface WSChunkMessage {
  type: 'chunk'
  text: string
}

interface WSDoneMessage {
  type: 'done'
  user_id: string
}

interface WSErrorMessage {
  type: 'error'
  message: string
}

interface WSPongMessage {
  type: 'pong'
}

type WSMessage = WSChunkMessage | WSDoneMessage | WSErrorMessage | WSPongMessage

/**
 * Build the AI prompt for expansion
 */
function buildExpandPrompt(context: ExpandBlockContext): string {
  let prompt = `Expand on the following idea with 2-4 child bullet points:\n\n"${context.blockText}"\n`

  if (context.parentText) {
    prompt += `\nParent context: "${context.parentText}"\n`
  }

  if (context.siblingTexts.length > 0) {
    prompt += `\nSibling ideas: ${context.siblingTexts.map((t) => `"${t}"`).join(', ')}\n`
  }

  prompt += '\nProvide concise, distinct sub-points that break down or elaborate on the main idea. Format each point as a single line starting with "- ".'

  return prompt
}

/**
 * Get WebSocket URL for AI streaming
 */
function getWebSocketUrl(token: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = import.meta.env.VITE_API_URL?.replace(/^https?:\/\//, '') || 'localhost:8000'
  return `${protocol}//${host}/ws/ai/stream?token=${encodeURIComponent(token)}`
}

/**
 * Hook for expanding bullet blocks with AI-generated content
 */
export function useExpandBlock() {
  const canGenerate = useAIStore(selectCanGenerate)
  const setIsGenerating = useAIStore((state) => state.setIsGenerating)
  const setIsStreaming = useAIStore((state) => state.setIsStreaming)
  const incrementGenerationsUsed = useAIStore((state) => state.incrementGenerationsUsed)
  const setError = useAIStore((state) => state.setError)

  const [isExpanding, setIsExpanding] = useState(false)
  const [streamedText, setStreamedText] = useState('')
  const [error, setLocalError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)

  /**
   * BUG-EDITOR-3708: Auto-close WebSocket on unmount to prevent memory leaks
   */
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [])

  /**
   * Start expanding a block with AI
   */
  const expandBlock = useCallback(
    (context: ExpandBlockContext, token: string) => {
      if (!canGenerate) {
        setLocalError('Cannot generate: rate limit reached or generation in progress')
        return
      }

      // Reset state
      setStreamedText('')
      setLocalError(null)
      setIsExpanding(true)
      setIsGenerating(true)
      setIsStreaming(true)

      // Connect to WebSocket
      const ws = new WebSocket(getWebSocketUrl(token))
      wsRef.current = ws

      ws.onopen = () => {
        // Send generate request
        const prompt = buildExpandPrompt(context)
        ws.send(
          JSON.stringify({
            action: 'generate',
            prompt,
            system: 'You are a helpful assistant that expands ideas into concise bullet points.',
          })
        )
      }

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data)

          switch (message.type) {
            case 'chunk':
              setStreamedText((prev) => prev + message.text)
              break
            case 'done':
              setIsExpanding(false)
              setIsGenerating(false)
              setIsStreaming(false)
              incrementGenerationsUsed()
              ws.close()
              break
            case 'error':
              setLocalError(message.message)
              setError(message.message)
              setIsExpanding(false)
              setIsGenerating(false)
              setIsStreaming(false)
              ws.close()
              break
            case 'pong':
              // Heartbeat response, ignore
              break
          }
        } catch {
          // Ignore parse errors
        }
      }

      ws.onerror = () => {
        setLocalError('WebSocket connection error')
        setIsExpanding(false)
        setIsGenerating(false)
        setIsStreaming(false)
      }

      ws.onclose = () => {
        wsRef.current = null
      }
    },
    [canGenerate, setIsGenerating, setIsStreaming, incrementGenerationsUsed, setError]
  )

  /**
   * Cancel ongoing expansion
   */
  const cancelExpansion = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsExpanding(false)
    setIsGenerating(false)
    setIsStreaming(false)
  }, [setIsGenerating, setIsStreaming])

  /**
   * Reset hook state
   */
  const resetState = useCallback(() => {
    setStreamedText('')
    setLocalError(null)
  }, [])

  return {
    isExpanding,
    streamedText,
    error,
    canExpand: canGenerate,
    expandBlock,
    cancelExpansion,
    resetState,
  }
}
