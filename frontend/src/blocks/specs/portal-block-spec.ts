import {
  BlockViewExtension,
  FlavourExtension,
  type ExtensionType,
} from '@blocksuite/block-std'
import { literal } from 'lit/static-html.js'

// Import the component to ensure it's registered
import '../components/portal-block'

/**
 * Block spec for the Hydra portal block.
 *
 * Registers the block with BlockSuite editor by combining:
 * - FlavourExtension: Declares the block flavour
 * - BlockViewExtension: Associates the component view
 */
export const PortalBlockSpec: ExtensionType[] = [
  FlavourExtension('hydra:portal'),
  BlockViewExtension('hydra:portal', literal`hydra-portal-block`),
]
