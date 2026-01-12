/**
 * Settings Store
 * FE-501: Semantic Linking Settings
 *
 * Manages user settings including:
 * - Semantic linking enabled/disabled toggle
 * - Similarity threshold (0.5-1.0)
 * - Max suggestions per concept (1-10)
 * - Settings persistence (localStorage)
 */
import { create } from 'zustand'

/**
 * Storage key for settings persistence
 */
export const SETTINGS_STORAGE_KEY = 'hydra-settings-v1'

/**
 * Default values for semantic linking settings
 */
export const SEMANTIC_LINKING_DEFAULTS = {
  enabled: true,
  threshold: 0.8,
  maxSuggestionsPerConcept: 3,
} as const

/**
 * Settings store state interface
 */
interface SettingsState {
  /** Whether semantic linking is enabled */
  semanticLinkingEnabled: boolean
  /** Similarity threshold for semantic linking (0.5-1.0) */
  semanticLinkingThreshold: number
  /** Max suggestions per concept (1-10) */
  semanticLinkingMaxSuggestions: number
}

/**
 * Settings store actions interface
 */
interface SettingsActions {
  /** Enable or disable semantic linking */
  setSemanticLinkingEnabled: (enabled: boolean) => void
  /** Set similarity threshold (clamped to 0.5-1.0) */
  setSemanticLinkingThreshold: (threshold: number) => void
  /** Set max suggestions per concept (clamped to 1-10) */
  setSemanticLinkingMaxSuggestions: (count: number) => void
  /** Load settings from localStorage */
  loadSettingsFromStorage: () => void
  /** Reset all settings to defaults */
  resetToDefaults: () => void
}

/**
 * Helper to clamp a number within a range
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Helper to persist settings to localStorage
 */
function persistSettings(state: SettingsState): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/**
 * Helper to load settings from localStorage
 */
function loadSettings(): Partial<SettingsState> {
  try {
    const json = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (json) {
      return JSON.parse(json)
    }
  } catch {
    // Return empty object on parse error
  }
  return {}
}

/**
 * Settings store combining state and actions
 */
export const useSettingsStore = create<SettingsState & SettingsActions>((set, get) => ({
  // Initial state with defaults
  semanticLinkingEnabled: SEMANTIC_LINKING_DEFAULTS.enabled,
  semanticLinkingThreshold: SEMANTIC_LINKING_DEFAULTS.threshold,
  semanticLinkingMaxSuggestions: SEMANTIC_LINKING_DEFAULTS.maxSuggestionsPerConcept,

  // Actions
  setSemanticLinkingEnabled: (enabled) => {
    set({ semanticLinkingEnabled: enabled })
    persistSettings({
      semanticLinkingEnabled: enabled,
      semanticLinkingThreshold: get().semanticLinkingThreshold,
      semanticLinkingMaxSuggestions: get().semanticLinkingMaxSuggestions,
    })
  },

  setSemanticLinkingThreshold: (threshold) => {
    const clampedThreshold = clamp(threshold, 0.5, 1.0)
    set({ semanticLinkingThreshold: clampedThreshold })
    persistSettings({
      semanticLinkingEnabled: get().semanticLinkingEnabled,
      semanticLinkingThreshold: clampedThreshold,
      semanticLinkingMaxSuggestions: get().semanticLinkingMaxSuggestions,
    })
  },

  setSemanticLinkingMaxSuggestions: (count) => {
    const clampedCount = clamp(count, 1, 10)
    set({ semanticLinkingMaxSuggestions: clampedCount })
    persistSettings({
      semanticLinkingEnabled: get().semanticLinkingEnabled,
      semanticLinkingThreshold: get().semanticLinkingThreshold,
      semanticLinkingMaxSuggestions: clampedCount,
    })
  },

  loadSettingsFromStorage: () => {
    const saved = loadSettings()
    set({
      semanticLinkingEnabled: saved.semanticLinkingEnabled ?? SEMANTIC_LINKING_DEFAULTS.enabled,
      semanticLinkingThreshold: saved.semanticLinkingThreshold ?? SEMANTIC_LINKING_DEFAULTS.threshold,
      semanticLinkingMaxSuggestions: saved.semanticLinkingMaxSuggestions ?? SEMANTIC_LINKING_DEFAULTS.maxSuggestionsPerConcept,
    })
  },

  resetToDefaults: () => {
    const defaults = {
      semanticLinkingEnabled: SEMANTIC_LINKING_DEFAULTS.enabled,
      semanticLinkingThreshold: SEMANTIC_LINKING_DEFAULTS.threshold,
      semanticLinkingMaxSuggestions: SEMANTIC_LINKING_DEFAULTS.maxSuggestionsPerConcept,
    }
    set(defaults)
    persistSettings(defaults)
  },
}))

/**
 * Selector for checking if semantic linking is enabled
 */
export const selectSemanticLinkingEnabled = (state: SettingsState): boolean =>
  state.semanticLinkingEnabled

/**
 * Selector for getting semantic linking threshold
 */
export const selectSemanticLinkingThreshold = (state: SettingsState): number =>
  state.semanticLinkingThreshold

/**
 * Selector for getting max suggestions per concept
 */
export const selectSemanticLinkingMaxSuggestions = (state: SettingsState): number =>
  state.semanticLinkingMaxSuggestions
