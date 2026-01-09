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
import { BulletBlockSchema } from '../schemas/bullet-block-schema'

describe('BulletBlockSchema', () => {
  it('should be defined', () => {
    expect(BulletBlockSchema).toBeDefined()
  })

  it('should have the correct flavour', () => {
    expect(BulletBlockSchema.model.flavour).toBe('hydra:bullet')
  })

  it('should have version 1', () => {
    expect(BulletBlockSchema.version).toBe(1)
  })

  it('should have role "content"', () => {
    expect(BulletBlockSchema.model.role).toBe('content')
  })

  it('should allow nesting under note and bullet blocks', () => {
    expect(BulletBlockSchema.model.parent).toContain('affine:note')
    expect(BulletBlockSchema.model.parent).toContain('hydra:bullet')
  })

  it('should allow bullet blocks as children for hierarchical structure', () => {
    expect(BulletBlockSchema.model.children).toContain('hydra:bullet')
  })

  describe('props factory', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type PropsFactory = (internal: any) => { text: unknown; isExpanded: boolean }

    it('should define text and isExpanded props', () => {
      const propsFactory = BulletBlockSchema.model.props as PropsFactory

      if (!propsFactory) {
        throw new Error('Props factory not defined')
      }

      const mockInternal = {
        Text: vi.fn(() => ({ toString: () => '' })),
        Boxed: vi.fn((val: unknown) => val),
      }

      const props = propsFactory(mockInternal)

      expect(props).toHaveProperty('text')
      expect(props).toHaveProperty('isExpanded')
    })

    it('should default isExpanded to true (expanded state)', () => {
      const propsFactory = BulletBlockSchema.model.props as PropsFactory

      if (!propsFactory) {
        throw new Error('Props factory not defined')
      }

      const mockInternal = {
        Text: vi.fn(() => ({ toString: () => '' })),
        Boxed: vi.fn((val: unknown) => val),
      }

      const props = propsFactory(mockInternal)

      expect(props.isExpanded).toBe(true)
    })

    it('should create text using internal.Text() for collaborative editing', () => {
      const propsFactory = BulletBlockSchema.model.props as PropsFactory

      if (!propsFactory) {
        throw new Error('Props factory not defined')
      }

      const mockText = { toString: () => 'test content' }
      const mockInternal = {
        Text: vi.fn(() => mockText),
        Boxed: vi.fn((val: unknown) => val),
      }

      const props = propsFactory(mockInternal)

      expect(mockInternal.Text).toHaveBeenCalled()
      expect(props.text).toBe(mockText)
    })
  })
})
