/**
 * Descriptor Insertion Utilities (EDITOR-3204)
 *
 * Handles insertion of descriptor blocks from autocomplete selection:
 * - Duplicate detection among siblings
 * - Trigger text removal
 * - Block creation with descriptor properties
 */

import type { DescriptorType } from './descriptor'

/**
 * Result of attempting to insert a descriptor
 */
export interface DescriptorInsertionResult {
  /** Whether a new block was created or existing duplicate was focused */
  action: 'created' | 'focused_existing'
  /** The blockId to focus (new or existing) */
  blockId: string
}

/**
 * Minimal block interface for duplicate detection
 * Uses unknown for props to handle any BlockModel type
 */
interface BlockWithPossibleDescriptor {
  id: string
  isDescriptor?: boolean
  descriptorType?: DescriptorType | null
}

/**
 * Minimal parent block interface for checking children
 */
interface ParentBlock {
  children: BlockWithPossibleDescriptor[]
}

/**
 * Find an existing descriptor of the same type among the block's children.
 * Used to prevent duplicate descriptors under the same parent.
 *
 * @param parentBlock - The block whose children to search
 * @param descriptorType - The descriptor type to look for
 * @returns The blockId of the existing descriptor, or null if not found
 */
export function findDuplicateDescriptor(
  parentBlock: ParentBlock,
  descriptorType: DescriptorType
): string | null {
  for (const child of parentBlock.children) {
    // Cast to access descriptor props - BlockSuite BlockModel doesn't expose them directly
    const childBlock = child as BlockWithPossibleDescriptor
    if (childBlock.isDescriptor && childBlock.descriptorType === descriptorType) {
      return childBlock.id
    }
  }
  return null
}

/**
 * Remove the trigger text (~descriptorType) from the input string.
 * Handles partial queries like ~w, ~wh, ~wha, ~what for type 'what'.
 * Also handles triggers in the middle of text (e.g., "Before ~pros after").
 *
 * @param text - The text containing the trigger
 * @param descriptorType - The descriptor type being inserted
 * @returns The text with the trigger removed
 */
export function removeTriggerText(text: string, descriptorType: DescriptorType): string {
  // Pattern: ~ followed by optional partial match of descriptorType
  // We need to find the last occurrence of ~ followed by chars that match the start of descriptorType
  const tilde = '~'
  const lastTildeIndex = text.lastIndexOf(tilde)

  if (lastTildeIndex === -1) {
    return text
  }

  // Get the text after the tilde up to next space or end
  const afterTilde = text.slice(lastTildeIndex + 1)
  const type = descriptorType.toLowerCase()

  // Find where the trigger ends (at space or end of string)
  let triggerEnd = afterTilde.length
  for (let i = 0; i < afterTilde.length; i++) {
    if (afterTilde[i] === ' ' || afterTilde[i] === '\n' || afterTilde[i] === '\t') {
      triggerEnd = i
      break
    }
  }

  const potentialTrigger = afterTilde.slice(0, triggerEnd).toLowerCase()

  // Check if potentialTrigger is a prefix of the descriptorType (or empty, or full match)
  // This handles ~, ~w, ~wh, ~wha, ~what all matching 'what'
  if (potentialTrigger === '' || type.startsWith(potentialTrigger)) {
    // Remove from tilde to end of the matched portion
    return text.slice(0, lastTildeIndex) + text.slice(lastTildeIndex + 1 + triggerEnd)
  }

  return text
}

// Note: DESCRIPTOR_TRIGGER is exported from descriptor-autocomplete.ts
