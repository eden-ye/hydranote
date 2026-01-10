/**
 * AI Generation Store
 * FE-405: AI Generation Store
 *
 * Manages AI generation state including prompts, loading states, and rate limits.
 */
import { create } from 'zustand'

/**
 * Default generation limit per user
 */
const DEFAULT_GENERATION_LIMIT = 50

/**
 * AI Store state interface
 */
interface AIState {
  /** Current generation prompt */
  currentPrompt: string | null
  /** Whether a generation is in progress */
  isGenerating: boolean
  /** Whether streaming response is in progress */
  isStreaming: boolean
  /** Number of generations used */
  generationsUsed: number
  /** Maximum number of generations allowed */
  generationsLimit: number
  /** Last error message */
  error: string | null
  /** ID of the last generation request */
  lastGenerationId: string | null
}

/**
 * AI Store actions interface
 */
interface AIActions {
  /** Set the current prompt */
  setCurrentPrompt: (prompt: string | null) => void
  /** Set generating state */
  setIsGenerating: (isGenerating: boolean) => void
  /** Set streaming state */
  setIsStreaming: (isStreaming: boolean) => void
  /** Set generations used count */
  setGenerationsUsed: (count: number) => void
  /** Set generations limit */
  setGenerationsLimit: (limit: number) => void
  /** Increment generations used by 1 */
  incrementGenerationsUsed: () => void
  /** Set error message */
  setError: (error: string | null) => void
  /** Set last generation ID */
  setLastGenerationId: (id: string | null) => void
  /** Reset generation state (clear prompt, stop generating/streaming, clear error) */
  resetGeneration: () => void
}

/**
 * AI generation store combining state and actions
 * Note: canGenerate and generationsRemaining are computed via selectors
 */
export const useAIStore = create<AIState & AIActions>((set) => ({
  // Initial state
  currentPrompt: null,
  isGenerating: false,
  isStreaming: false,
  generationsUsed: 0,
  generationsLimit: DEFAULT_GENERATION_LIMIT,
  error: null,
  lastGenerationId: null,

  // Actions
  setCurrentPrompt: (prompt) => set({ currentPrompt: prompt }),

  setIsGenerating: (isGenerating) => set({ isGenerating }),

  setIsStreaming: (isStreaming) => set({ isStreaming }),

  setGenerationsUsed: (count) => set({ generationsUsed: count }),

  setGenerationsLimit: (limit) => set({ generationsLimit: limit }),

  incrementGenerationsUsed: () =>
    set((state) => ({ generationsUsed: state.generationsUsed + 1 })),

  setError: (error) => set({ error }),

  setLastGenerationId: (id) => set({ lastGenerationId: id }),

  resetGeneration: () =>
    set({
      currentPrompt: null,
      isGenerating: false,
      isStreaming: false,
      error: null,
    }),
}))

/**
 * Selector for canGenerate computed value
 * Returns true when user is under limit and not currently generating
 */
export const selectCanGenerate = (state: AIState): boolean =>
  state.generationsUsed < state.generationsLimit && !state.isGenerating

/**
 * Selector for generationsRemaining computed value
 * Returns number of generations remaining (minimum 0)
 */
export const selectGenerationsRemaining = (state: AIState): number =>
  Math.max(0, state.generationsLimit - state.generationsUsed)
