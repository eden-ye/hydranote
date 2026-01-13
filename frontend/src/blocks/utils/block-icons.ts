/**
 * EDITOR-3510: Block icons and visual markers
 *
 * Provides icons and visual markers for different block types.
 */

import type { BlockType } from './markdown-shortcuts'

/**
 * Bullet markers that rotate by nesting depth
 */
export const BULLET_MARKERS = ['•', '◦', '▪', '▫'] as const

/**
 * Get the bullet marker for a given nesting depth
 *
 * @param depth - Nesting depth (0 = root level)
 * @returns Bullet character for that depth
 */
export function getBulletMarker(depth: number): string {
  const index = depth % BULLET_MARKERS.length
  return BULLET_MARKERS[index]
}

/**
 * SVG icon for unchecked checkbox
 */
const CHECKBOX_UNCHECKED_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="1.5" y="1.5" width="13" height="13" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
</svg>`

/**
 * SVG icon for checked checkbox
 */
const CHECKBOX_CHECKED_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="1.5" y="1.5" width="13" height="13" rx="2" stroke="currentColor" stroke-width="1.5" fill="currentColor"/>
  <polyline points="4,8 7,11 12,5" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

/**
 * Get the visual icon/marker for a block type
 *
 * @param blockType - Type of block
 * @param isChecked - Whether checkbox is checked (for checkbox type)
 * @param number - List number (for numbered type)
 * @param depth - Nesting depth (for bullet type)
 * @returns Icon string (SVG, text marker, or empty string)
 */
export function getBlockTypeIcon(
  blockType: BlockType,
  isChecked: boolean,
  number?: number,
  depth?: number
): string {
  switch (blockType) {
    case 'checkbox':
      return isChecked ? CHECKBOX_CHECKED_SVG : CHECKBOX_UNCHECKED_SVG

    case 'numbered':
      return `${number ?? 1}.`

    case 'bullet':
      return getBulletMarker(depth ?? 0)

    case 'heading1':
      return 'H1'

    case 'heading2':
      return 'H2'

    case 'heading3':
      return 'H3'

    case 'divider':
      return '' // Divider renders as a line, no prefix icon

    default:
      return ''
  }
}

/**
 * Get CSS class for block type styling
 *
 * @param blockType - Type of block
 * @returns CSS class name
 */
export function getBlockTypeClass(blockType: BlockType): string {
  return `block-type-${blockType}`
}

/**
 * Check if block type uses a prefix marker
 *
 * @param blockType - Type of block
 * @returns True if block type shows a prefix marker
 */
export function hasBlockPrefix(blockType: BlockType): boolean {
  return blockType !== 'divider'
}
