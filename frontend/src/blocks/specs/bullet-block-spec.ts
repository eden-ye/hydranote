import {
  BlockViewExtension,
  FlavourExtension,
  type ExtensionType,
} from '@blocksuite/block-std'
import { literal } from 'lit/static-html.js'

// Import the component to ensure it's registered
import '../components/bullet-block'

/**
 * Block spec for the Hydra bullet block.
 *
 * Registers the block with BlockSuite editor by combining:
 * - FlavourExtension: Declares the block flavour
 * - BlockViewExtension: Associates the component view
 */
export const BulletBlockSpec: ExtensionType[] = [
  FlavourExtension('hydra:bullet'),
  BlockViewExtension('hydra:bullet', literal`hydra-bullet-block`),
]
