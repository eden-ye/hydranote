/**
 * EDITOR-3602: Auto-Generate After Descriptor Utilities
 *
 * Provides logic and helpers for automatically generating child bullets
 * when a descriptor is inserted.
 */

/**
 * Auto-generate status type
 */
export type AutoGenerateStatus = 'idle' | 'pending' | 'generating' | 'completed' | 'cancelled'

/**
 * Input for determining if auto-generate should be triggered
 */
export interface AutoGenerateInput {
  /** Whether auto-generate is enabled in settings */
  autoGenerateEnabled: boolean
  /** Whether a generation is already in progress */
  isGenerating: boolean
  /** The descriptor type being inserted */
  descriptorType: 'what' | 'why' | 'how' | 'pros' | 'cons' | 'custom'
}

/**
 * Context for auto-generation
 */
export interface AutoGenerateContext {
  /** ID of the descriptor block */
  descriptorBlockId: string
  /** Type of descriptor */
  descriptorType: 'what' | 'why' | 'how' | 'pros' | 'cons' | 'custom'
  /** Custom label (for custom descriptors) */
  descriptorLabel?: string
  /** Text of the parent block (topic) */
  parentText: string
  /** Grandparent text for additional context */
  grandparentText: string | null
}

/**
 * Settings interface for auto-generate feature
 */
export interface AutoGenerateSettings {
  /** Whether auto-generate is enabled */
  enabled: boolean
  /** Debounce delay in milliseconds */
  debounceMs: number
}

/**
 * Default settings for auto-generate
 */
export const DEFAULT_AUTO_GENERATE_SETTINGS: AutoGenerateSettings = {
  enabled: true,
  debounceMs: 500,
}

/**
 * Determine if auto-generate should be triggered after descriptor insertion
 */
export function shouldAutoGenerate(input: AutoGenerateInput): boolean {
  // Don't trigger if disabled in settings
  if (!input.autoGenerateEnabled) {
    return false
  }
  // Don't trigger if already generating
  if (input.isGenerating) {
    return false
  }
  // All descriptor types can trigger auto-generate
  return true
}

/**
 * Check if user input should cancel auto-generation
 */
export function shouldCancelAutoGenerate(input: {
  isPending: boolean
  userIsTyping: boolean
}): boolean {
  return input.isPending && input.userIsTyping
}

/**
 * Build context for auto-generation from descriptor insertion
 */
export function buildAutoGenerateContext(input: {
  descriptorBlockId: string
  descriptorType: 'what' | 'why' | 'how' | 'pros' | 'cons' | 'custom'
  descriptorLabel?: string
  parentText: string
  grandparentText: string | null
}): AutoGenerateContext {
  return {
    descriptorBlockId: input.descriptorBlockId,
    descriptorType: input.descriptorType,
    descriptorLabel: input.descriptorLabel,
    parentText: input.parentText,
    grandparentText: input.grandparentText,
  }
}

/**
 * State machine for auto-generate status
 */
export function getNextAutoGenerateStatus(
  currentStatus: AutoGenerateStatus,
  event: 'trigger' | 'start' | 'complete' | 'cancel' | 'reset'
): AutoGenerateStatus {
  switch (currentStatus) {
    case 'idle':
      return event === 'trigger' ? 'pending' : 'idle'
    case 'pending':
      if (event === 'start') return 'generating'
      if (event === 'cancel') return 'cancelled'
      return 'pending'
    case 'generating':
      if (event === 'complete') return 'completed'
      if (event === 'cancel') return 'cancelled'
      return 'generating'
    case 'completed':
    case 'cancelled':
      return event === 'reset' ? 'idle' : currentStatus
    default:
      return 'idle'
  }
}

/**
 * Validate auto-generate settings
 */
export function validateAutoGenerateSettings(
  settings: Partial<AutoGenerateSettings>
): AutoGenerateSettings {
  return {
    enabled:
      typeof settings.enabled === 'boolean'
        ? settings.enabled
        : DEFAULT_AUTO_GENERATE_SETTINGS.enabled,
    debounceMs:
      typeof settings.debounceMs === 'number' && settings.debounceMs >= 0
        ? settings.debounceMs
        : DEFAULT_AUTO_GENERATE_SETTINGS.debounceMs,
  }
}

/**
 * Create a debounced auto-generate trigger
 * Returns an object with trigger() and cancel() methods
 */
export function createDebouncedAutoGenerate(
  callback: () => void,
  delay: number = DEFAULT_AUTO_GENERATE_SETTINGS.debounceMs
): { trigger: () => void; cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return {
    trigger: () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(() => {
        callback()
        timeoutId = null
      }, delay)
    },
    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    },
  }
}
