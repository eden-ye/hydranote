import { defineBlockSchema, type SchemaToModel, type Text } from '@blocksuite/store'

/**
 * Props for the Hydra bullet block.
 * Each bullet supports text content, folding state, and nested children.
 */
export interface BulletBlockProps {
  /** Text content with ~20 word soft limit */
  text: Text
  /** Whether children are visible (true = expanded, false = collapsed) */
  isExpanded: boolean
}

/**
 * Block schema for hierarchical bullet points in Hydra Notes.
 *
 * Features:
 * - Text content with collaborative editing support via Yjs
 * - Folding/collapse state for hierarchical navigation
 * - Supports nested children (other bullet blocks)
 * - ~20 word soft limit enforced at UI level
 */
export const BulletBlockSchema = defineBlockSchema({
  flavour: 'hydra:bullet',
  props: (internal): BulletBlockProps => ({
    text: internal.Text(),
    isExpanded: true,
  }),
  metadata: {
    version: 1,
    role: 'content',
    // Can be nested under note blocks or other bullet blocks
    parent: ['affine:note', 'hydra:bullet'],
    // Can contain other bullet blocks (hierarchical structure)
    children: ['hydra:bullet'],
  },
})

export type BulletBlockModel = SchemaToModel<typeof BulletBlockSchema>

// Extend BlockSuite global types
declare global {
  namespace BlockSuite {
    interface BlockModels {
      'hydra:bullet': BulletBlockModel
    }
  }
}
