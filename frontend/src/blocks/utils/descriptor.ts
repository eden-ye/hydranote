/**
 * Descriptor utilities for EDITOR-3201
 *
 * Descriptors are pseudo-child bullets that categorize content.
 * They render with a `|` prefix and support types like What, Why, How, Pros, Cons.
 */

/**
 * Available descriptor types
 */
export const DESCRIPTOR_TYPES = [
  'what',
  'why',
  'how',
  'pros',
  'cons',
  'custom',
] as const

/**
 * Type for descriptor categories
 */
export type DescriptorType = (typeof DESCRIPTOR_TYPES)[number]

/**
 * Props interface for descriptor functionality
 * Extended onto the BulletBlockProps
 */
export interface DescriptorProps {
  /** Whether this bullet is a descriptor */
  isDescriptor: boolean
  /** Type of descriptor (null if not a descriptor) */
  descriptorType: DescriptorType | null
  /** Custom label for 'custom' descriptor type */
  descriptorLabel?: string
}

/**
 * Default descriptor props for new bullets
 */
export const DEFAULT_DESCRIPTOR_PROPS: DescriptorProps = {
  isDescriptor: false,
  descriptorType: null,
  descriptorLabel: undefined,
}

/**
 * Check if a string is a valid descriptor type
 */
export function isValidDescriptorType(type: string): type is DescriptorType {
  return DESCRIPTOR_TYPES.includes(type as DescriptorType)
}

/**
 * Label mapping for standard descriptor types
 */
const DESCRIPTOR_LABELS: Record<Exclude<DescriptorType, 'custom'>, string> = {
  what: 'What',
  why: 'Why',
  how: 'How',
  pros: 'Pros',
  cons: 'Cons',
}

/**
 * Get the display label for a descriptor type
 *
 * @param type - The descriptor type
 * @param customLabel - Optional custom label for 'custom' type
 * @returns The formatted label string
 */
export function getDescriptorLabel(
  type: DescriptorType,
  customLabel?: string
): string {
  if (type === 'custom') {
    return customLabel?.trim() || 'Custom'
  }
  return DESCRIPTOR_LABELS[type]
}

/**
 * Get the visual prefix for descriptors
 * All descriptors use the pipe `|` character as prefix
 */
export function getDescriptorPrefix(): string {
  return '|'
}

/**
 * Format the full descriptor header text
 *
 * @param type - The descriptor type
 * @param customLabel - Optional custom label for 'custom' type
 * @returns The formatted header string with prefix (e.g., "| What")
 */
export function formatDescriptorHeader(
  type: DescriptorType,
  customLabel?: string
): string {
  const prefix = getDescriptorPrefix()
  const label = getDescriptorLabel(type, customLabel)
  return `${prefix} ${label}`
}

/**
 * CSS class for descriptor blocks
 */
export const DESCRIPTOR_CLASS = 'descriptor-block'

/**
 * Get CSS class for descriptor styling
 *
 * @param isDescriptor - Whether the block is a descriptor
 * @returns CSS class name or empty string
 */
export function getDescriptorClass(isDescriptor: boolean): string {
  return isDescriptor ? DESCRIPTOR_CLASS : ''
}
