/**
 * EDITOR-3407: Portal Placement Logic
 *
 * AI-driven portal placement logic that determines where to insert portals
 * in related bullets based on their structure.
 *
 * Decision tree:
 * 1. If bullet has [What]/[Why]/[How] descriptor → Insert as child of descriptor
 * 2. Otherwise → Insert as direct child of bullet
 * 3. Always insert at index 0 (first child)
 */

import type { DescriptorType } from './descriptor'

/**
 * Search result from semantic search
 */
export interface SearchResult {
  /** Document ID containing the matching block */
  documentId: string
  /** Block ID of the matching bullet */
  blockId: string
  /** Text content of the matching bullet */
  bulletText: string
  /** Hierarchical path to the bullet (e.g., "Machine Learning > [What] Neural Networks") */
  contextPath: string
  /** Similarity score (0-1) */
  score: number
  /** Descriptor type if the match is in a descriptor, null otherwise */
  descriptorType: DescriptorType | null
  /** Summary of children under this bullet, null if none */
  childrenSummary: string | null
}

/**
 * Result of portal placement decision
 */
export interface PortalPlacementResult {
  /** ID of the block to insert the portal under */
  parentBlockId: string
  /** Index at which to insert the portal (always 0) */
  insertIndex: number
  /** Reason for the placement decision */
  placementReason: 'descriptor' | 'direct'
}

/**
 * Block interface for portal placement logic
 */
export interface PlacementBlock {
  id: string
  children: PlacementBlock[]
  model: {
    isDescriptor: boolean
    descriptorType: string | null
    flavour: string
  }
}

/**
 * Find the first descriptor child of a bullet block
 *
 * Searches through the children of a bullet to find the first
 * descriptor block (What, Why, How, Pros, Cons, etc.)
 *
 * @param bullet - The bullet block to search in
 * @returns The first descriptor child found, or null if none exists
 */
export function findDescriptorChild(bullet: PlacementBlock): PlacementBlock | null {
  if (!bullet.children || bullet.children.length === 0) {
    return null
  }

  for (const child of bullet.children) {
    if (child.model.isDescriptor) {
      return child
    }
  }

  return null
}

/**
 * Determine the optimal parent block for portal insertion
 *
 * Uses AI-driven decision tree:
 * 1. If bullet has a descriptor child → Insert as child of descriptor
 * 2. Otherwise → Insert as direct child of bullet
 * 3. Always insert at index 0 (first child)
 *
 * @param bullet - The target bullet block
 * @returns Placement result with parent ID, index, and reason
 */
export function determinePortalParent(bullet: PlacementBlock): PortalPlacementResult {
  const descriptorChild = findDescriptorChild(bullet)

  if (descriptorChild) {
    return {
      parentBlockId: descriptorChild.id,
      insertIndex: 0,
      placementReason: 'descriptor',
    }
  }

  return {
    parentBlockId: bullet.id,
    insertIndex: 0,
    placementReason: 'direct',
  }
}

/**
 * Create portal properties for insertion
 *
 * @param result - Search result to create portal from
 * @returns Portal block properties
 */
export function createPortalProperties(result: SearchResult): {
  sourceDocId: string
  sourceBlockId: string
  isCollapsed: boolean
  syncStatus: 'synced' | 'stale' | 'orphaned'
} {
  return {
    sourceDocId: result.documentId,
    sourceBlockId: result.blockId,
    isCollapsed: false,
    syncStatus: 'synced',
  }
}
