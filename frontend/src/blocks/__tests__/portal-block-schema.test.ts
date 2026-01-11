import { describe, it, expect, vi } from 'vitest'

// Use vi.hoisted to define mock before it's used by vi.mock
const { mockDefineBlockSchema } = vi.hoisted(() => {
  const mockDefineBlockSchema = vi.fn((options: {
    flavour: string
    metadata?: { version?: number; role?: string; parent?: string[]; children?: string[] }
    props?: (internal: unknown) => unknown
  }) => {
    return {
      version: options.metadata?.version ?? 1,
      model: {
        flavour: options.flavour,
        role: options.metadata?.role,
        parent: options.metadata?.parent,
        children: options.metadata?.children,
        props: options.props,
      },
    }
  })
  return { mockDefineBlockSchema }
})

vi.mock('@blocksuite/store', () => ({
  defineBlockSchema: mockDefineBlockSchema,
}))

// Import after mocking - this triggers the schema definition
import { PortalBlockSchema, type SyncStatus } from '../schemas/portal-block-schema'

describe('PortalBlockSchema', () => {
  it('should be defined', () => {
    expect(PortalBlockSchema).toBeDefined()
  })

  it('should have the correct flavour', () => {
    expect(PortalBlockSchema.model.flavour).toBe('hydra:portal')
  })

  it('should have version 1', () => {
    expect(PortalBlockSchema.version).toBe(1)
  })

  it('should have role "content"', () => {
    expect(PortalBlockSchema.model.role).toBe('content')
  })

  it('should allow nesting under note and bullet blocks', () => {
    expect(PortalBlockSchema.model.parent).toContain('affine:note')
    expect(PortalBlockSchema.model.parent).toContain('hydra:bullet')
  })

  it('should not allow children (portal is a leaf block)', () => {
    expect(PortalBlockSchema.model.children).toEqual([])
  })

  describe('props factory', () => {
    type PropsFactory = (internal: unknown) => {
      sourceDocId: string
      sourceBlockId: string
      isCollapsed: boolean
      syncStatus: SyncStatus
    }

    it('should define source reference props', () => {
      const propsFactory = PortalBlockSchema.model.props as PropsFactory

      if (!propsFactory) {
        throw new Error('Props factory not defined')
      }

      const mockInternal = {}
      const props = propsFactory(mockInternal)

      expect(props).toHaveProperty('sourceDocId')
      expect(props).toHaveProperty('sourceBlockId')
    })

    it('should define portal state props', () => {
      const propsFactory = PortalBlockSchema.model.props as PropsFactory

      if (!propsFactory) {
        throw new Error('Props factory not defined')
      }

      const mockInternal = {}
      const props = propsFactory(mockInternal)

      expect(props).toHaveProperty('isCollapsed')
      expect(props).toHaveProperty('syncStatus')
    })

    it('should default sourceDocId to empty string', () => {
      const propsFactory = PortalBlockSchema.model.props as PropsFactory

      if (!propsFactory) {
        throw new Error('Props factory not defined')
      }

      const mockInternal = {}
      const props = propsFactory(mockInternal)

      expect(props.sourceDocId).toBe('')
    })

    it('should default sourceBlockId to empty string', () => {
      const propsFactory = PortalBlockSchema.model.props as PropsFactory

      if (!propsFactory) {
        throw new Error('Props factory not defined')
      }

      const mockInternal = {}
      const props = propsFactory(mockInternal)

      expect(props.sourceBlockId).toBe('')
    })

    it('should default isCollapsed to false (expanded state)', () => {
      const propsFactory = PortalBlockSchema.model.props as PropsFactory

      if (!propsFactory) {
        throw new Error('Props factory not defined')
      }

      const mockInternal = {}
      const props = propsFactory(mockInternal)

      expect(props.isCollapsed).toBe(false)
    })

    it('should default syncStatus to "synced"', () => {
      const propsFactory = PortalBlockSchema.model.props as PropsFactory

      if (!propsFactory) {
        throw new Error('Props factory not defined')
      }

      const mockInternal = {}
      const props = propsFactory(mockInternal)

      expect(props.syncStatus).toBe('synced')
    })
  })

  describe('SyncStatus type', () => {
    it('should support "synced" status', () => {
      const status: SyncStatus = 'synced'
      expect(['synced', 'stale', 'orphaned']).toContain(status)
    })

    it('should support "stale" status', () => {
      const status: SyncStatus = 'stale'
      expect(['synced', 'stale', 'orphaned']).toContain(status)
    })

    it('should support "orphaned" status', () => {
      const status: SyncStatus = 'orphaned'
      expect(['synced', 'stale', 'orphaned']).toContain(status)
    })
  })
})
