import { defineBlockSchema, type SchemaToModel, type Text } from '@blocksuite/store'
import type { DescriptorType } from '../utils/descriptor'
import type { BlockType } from '../utils/markdown-shortcuts'

/**
 * Props for the Hydra bullet block.
 * Each bullet supports text content, folding state, nested children,
 * and optional descriptor functionality (EDITOR-3201).
 * EDITOR-3510: Added blockType and isChecked for type system.
 */
export interface BulletBlockProps {
  /** Text content with ~20 word soft limit */
  text: Text
  /** Whether children are visible (true = expanded, false = collapsed) */
  isExpanded: boolean
  /** EDITOR-3201: Whether this bullet is a descriptor (pseudo-category bullet) */
  isDescriptor: boolean
  /** EDITOR-3201: Type of descriptor (what, why, how, pros, cons, custom) */
  descriptorType: DescriptorType | null
  /** EDITOR-3201: Custom label for 'custom' descriptor type */
  descriptorLabel: string | undefined
  /** EDITOR-3303: Whether this descriptor appears in cheatsheet (default: true) */
  cheatsheetVisible: boolean
  /** EDITOR-3510: Block type (bullet, numbered, checkbox, heading1-3, divider) */
  blockType: BlockType
  /** EDITOR-3510: Whether checkbox is checked (only relevant for checkbox type) */
  isChecked: boolean
  /** EDITOR-3509: Whether inline preview is visible (default: true) */
  inlinePreviewVisible: boolean
  /** EDITOR-3703: Manual inline preview text (created via == syntax) */
  manualPreviewText: string | undefined
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
    // EDITOR-3201: Descriptor props with defaults
    isDescriptor: false,
    descriptorType: null,
    descriptorLabel: undefined,
    // EDITOR-3303: Default to visible in cheatsheet
    cheatsheetVisible: true,
    // EDITOR-3510: Block type system props with defaults
    blockType: 'bullet',
    isChecked: false,
    // EDITOR-3509: Inline preview visibility (default: true)
    inlinePreviewVisible: true,
    // EDITOR-3703: Manual inline preview text (default: undefined)
    manualPreviewText: undefined,
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

// Extend BlockSuite global types (namespace required for declaration merging)
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace BlockSuite {
    interface BlockModels {
      'hydra:bullet': BulletBlockModel
    }
  }
}
