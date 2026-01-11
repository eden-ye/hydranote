import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store'

/**
 * Sync status for portal blocks.
 * - synced: Portal content matches source block
 * - stale: Portal may be out of sync (temporary state during updates)
 * - orphaned: Source block has been deleted
 */
export type SyncStatus = 'synced' | 'stale' | 'orphaned'

/**
 * Props for the Hydra portal block.
 * Portals are live-syncing embeds that reference and display content from other bullets.
 */
export interface PortalBlockProps {
  /** ID of the source document containing the referenced block */
  sourceDocId: string
  /** ID of the source block being referenced */
  sourceBlockId: string
  /** Whether the portal is collapsed (shows summary) or expanded (shows full content) */
  isCollapsed: boolean
  /** Current synchronization status with the source block */
  syncStatus: SyncStatus
}

/**
 * Block schema for portal blocks in Hydra Notes.
 *
 * Features:
 * - References another block by document ID and block ID
 * - Supports both same-document and cross-document references
 * - Live-syncs with source block content via Yjs observation
 * - Graceful handling of orphaned state when source is deleted
 * - Collapsible for compact view
 */
export const PortalBlockSchema = defineBlockSchema({
  flavour: 'hydra:portal',
  props: (): PortalBlockProps => ({
    sourceDocId: '',
    sourceBlockId: '',
    isCollapsed: false,
    syncStatus: 'synced',
  }),
  metadata: {
    version: 1,
    role: 'content',
    // Can be nested under note blocks or bullet blocks
    parent: ['affine:note', 'hydra:bullet'],
    // Portal is a leaf block - cannot contain children
    children: [],
  },
})

export type PortalBlockModel = SchemaToModel<typeof PortalBlockSchema>

// Extend BlockSuite global types (namespace required for declaration merging)
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace BlockSuite {
    interface BlockModels {
      'hydra:portal': PortalBlockModel
    }
  }
}
