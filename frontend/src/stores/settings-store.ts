/**
 * Settings Store
 * FE-501: Semantic Linking Settings
 * FE-502: Auto-Generation Settings
 *
 * Manages user settings including:
 * - Semantic linking enabled/disabled toggle
 * - Similarity threshold (0.5-1.0)
 * - Max suggestions per concept (1-10)
 * - Auto-generation enabled/disabled toggle
 * - Generation count (1-5 bullets per descriptor)
 * - Trigger descriptor types (What, Why, How, Pros, Cons)
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
 * Type for descriptor trigger types
 */
export type DescriptorTriggerType = 'what' | 'why' | 'how' | 'pros' | 'cons'

/**
 * Interface for auto-generation trigger settings
 */
export interface AutoGenerationTriggers {
  what: boolean
  why: boolean
  how: boolean
  pros: boolean
  cons: boolean
}

/**
 * Default values for auto-generation settings
 * FE-502: Auto-generation disabled by default, 3 bullets, What/Why/How enabled
 */
export const AUTO_GENERATION_DEFAULTS = {
  enabled: false,
  count: 3,
  triggers: { what: true, why: true, how: true, pros: false, cons: false } as AutoGenerationTriggers,
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
  /** Whether auto-generation is enabled (FE-502) */
  autoGenerationEnabled: boolean
  /** Number of bullets to generate per descriptor (1-5) (FE-502) */
  autoGenerationCount: number
  /** Which descriptor types trigger auto-generation (FE-502) */
  autoGenerationTriggers: AutoGenerationTriggers
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
  /** Enable or disable auto-generation (FE-502) */
  setAutoGenerationEnabled: (enabled: boolean) => void
  /** Set generation count (clamped to 1-5) (FE-502) */
  setAutoGenerationCount: (count: number) => void
  /** Set a specific descriptor type trigger (FE-502) */
  setAutoGenerationTrigger: (type: DescriptorTriggerType, enabled: boolean) => void
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
 * Helper to get the full current state for persistence
 */
function getFullState(get: () => SettingsState): SettingsState {
  return {
    semanticLinkingEnabled: get().semanticLinkingEnabled,
    semanticLinkingThreshold: get().semanticLinkingThreshold,
    semanticLinkingMaxSuggestions: get().semanticLinkingMaxSuggestions,
    autoGenerationEnabled: get().autoGenerationEnabled,
    autoGenerationCount: get().autoGenerationCount,
    autoGenerationTriggers: get().autoGenerationTriggers,
  }
}

/**
 * Settings store combining state and actions
 */
export const useSettingsStore = create<SettingsState & SettingsActions>((set, get) => ({
  // Initial state with defaults
  semanticLinkingEnabled: SEMANTIC_LINKING_DEFAULTS.enabled,
  semanticLinkingThreshold: SEMANTIC_LINKING_DEFAULTS.threshold,
  semanticLinkingMaxSuggestions: SEMANTIC_LINKING_DEFAULTS.maxSuggestionsPerConcept,
  // Auto-generation defaults (FE-502)
  autoGenerationEnabled: AUTO_GENERATION_DEFAULTS.enabled,
  autoGenerationCount: AUTO_GENERATION_DEFAULTS.count,
  autoGenerationTriggers: { ...AUTO_GENERATION_DEFAULTS.triggers },

  // Actions
  setSemanticLinkingEnabled: (enabled) => {
    set({ semanticLinkingEnabled: enabled })
    persistSettings({ ...getFullState(get), semanticLinkingEnabled: enabled })
  },

  setSemanticLinkingThreshold: (threshold) => {
    const clampedThreshold = clamp(threshold, 0.5, 1.0)
    set({ semanticLinkingThreshold: clampedThreshold })
    persistSettings({ ...getFullState(get), semanticLinkingThreshold: clampedThreshold })
  },

  setSemanticLinkingMaxSuggestions: (count) => {
    const clampedCount = clamp(count, 1, 10)
    set({ semanticLinkingMaxSuggestions: clampedCount })
    persistSettings({ ...getFullState(get), semanticLinkingMaxSuggestions: clampedCount })
  },

  // Auto-generation actions (FE-502)
  setAutoGenerationEnabled: (enabled) => {
    set({ autoGenerationEnabled: enabled })
    persistSettings({ ...getFullState(get), autoGenerationEnabled: enabled })
  },

  setAutoGenerationCount: (count) => {
    const clampedCount = clamp(count, 1, 5)
    set({ autoGenerationCount: clampedCount })
    persistSettings({ ...getFullState(get), autoGenerationCount: clampedCount })
  },

  setAutoGenerationTrigger: (type, enabled) => {
    const newTriggers = { ...get().autoGenerationTriggers, [type]: enabled }
    set({ autoGenerationTriggers: newTriggers })
    persistSettings({ ...getFullState(get), autoGenerationTriggers: newTriggers })
  },

  loadSettingsFromStorage: () => {
    const saved = loadSettings()
    set({
      semanticLinkingEnabled: saved.semanticLinkingEnabled ?? SEMANTIC_LINKING_DEFAULTS.enabled,
      semanticLinkingThreshold: saved.semanticLinkingThreshold ?? SEMANTIC_LINKING_DEFAULTS.threshold,
      semanticLinkingMaxSuggestions: saved.semanticLinkingMaxSuggestions ?? SEMANTIC_LINKING_DEFAULTS.maxSuggestionsPerConcept,
      autoGenerationEnabled: saved.autoGenerationEnabled ?? AUTO_GENERATION_DEFAULTS.enabled,
      autoGenerationCount: saved.autoGenerationCount ?? AUTO_GENERATION_DEFAULTS.count,
      autoGenerationTriggers: saved.autoGenerationTriggers ?? { ...AUTO_GENERATION_DEFAULTS.triggers },
    })
  },

  resetToDefaults: () => {
    const defaults: SettingsState = {
      semanticLinkingEnabled: SEMANTIC_LINKING_DEFAULTS.enabled,
      semanticLinkingThreshold: SEMANTIC_LINKING_DEFAULTS.threshold,
      semanticLinkingMaxSuggestions: SEMANTIC_LINKING_DEFAULTS.maxSuggestionsPerConcept,
      autoGenerationEnabled: AUTO_GENERATION_DEFAULTS.enabled,
      autoGenerationCount: AUTO_GENERATION_DEFAULTS.count,
      autoGenerationTriggers: { ...AUTO_GENERATION_DEFAULTS.triggers },
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

/**
 * Selector for checking if auto-generation is enabled (FE-502)
 */
export const selectAutoGenerationEnabled = (state: SettingsState): boolean =>
  state.autoGenerationEnabled

/**
 * Selector for getting auto-generation count (FE-502)
 */
export const selectAutoGenerationCount = (state: SettingsState): number =>
  state.autoGenerationCount

/**
 * Selector for getting auto-generation triggers (FE-502)
 */
export const selectAutoGenerationTriggers = (state: SettingsState): AutoGenerationTriggers =>
  state.autoGenerationTriggers
