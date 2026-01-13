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

// EDITOR-3102: Mock baseTextAttributes from @blocksuite/inline
vi.mock('@blocksuite/inline', () => {
  const baseTextAttributes = {
    extend: (schema: Record<string, unknown>) => ({
      ...schema,
      parse: (value: unknown) => value,
      safeParse: (value: unknown) => ({ success: true, data: value }),
    }),
    parse: (value: unknown) => value,
    safeParse: (value: unknown) => ({ success: true, data: value }),
  }
  return { baseTextAttributes }
})

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
    type PropsFactory = (internal: any) => {
      text: unknown
      isExpanded: boolean
      isDescriptor: boolean
      descriptorType: string | null
      descriptorLabel: string | undefined
      cheatsheetVisible: boolean
      blockType: string
      isChecked: boolean
    }

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

    // EDITOR-3201: Descriptor props tests
    it('should define descriptor props', () => {
      const propsFactory = BulletBlockSchema.model.props as PropsFactory

      if (!propsFactory) {
        throw new Error('Props factory not defined')
      }

      const mockInternal = {
        Text: vi.fn(() => ({ toString: () => '' })),
        Boxed: vi.fn((val: unknown) => val),
      }

      const props = propsFactory(mockInternal)

      expect(props).toHaveProperty('isDescriptor')
      expect(props).toHaveProperty('descriptorType')
      expect(props).toHaveProperty('descriptorLabel')
    })

    it('should default isDescriptor to false', () => {
      const propsFactory = BulletBlockSchema.model.props as PropsFactory

      if (!propsFactory) {
        throw new Error('Props factory not defined')
      }

      const mockInternal = {
        Text: vi.fn(() => ({ toString: () => '' })),
        Boxed: vi.fn((val: unknown) => val),
      }

      const props = propsFactory(mockInternal)

      expect(props.isDescriptor).toBe(false)
    })

    it('should default descriptorType to null', () => {
      const propsFactory = BulletBlockSchema.model.props as PropsFactory

      if (!propsFactory) {
        throw new Error('Props factory not defined')
      }

      const mockInternal = {
        Text: vi.fn(() => ({ toString: () => '' })),
        Boxed: vi.fn((val: unknown) => val),
      }

      const props = propsFactory(mockInternal)

      expect(props.descriptorType).toBeNull()
    })

    it('should default descriptorLabel to undefined', () => {
      const propsFactory = BulletBlockSchema.model.props as PropsFactory

      if (!propsFactory) {
        throw new Error('Props factory not defined')
      }

      const mockInternal = {
        Text: vi.fn(() => ({ toString: () => '' })),
        Boxed: vi.fn((val: unknown) => val),
      }

      const props = propsFactory(mockInternal)

      expect(props.descriptorLabel).toBeUndefined()
    })

    // EDITOR-3510: Block type system props tests
    it('should define blockType prop', () => {
      const propsFactory = BulletBlockSchema.model.props as PropsFactory

      if (!propsFactory) {
        throw new Error('Props factory not defined')
      }

      const mockInternal = {
        Text: vi.fn(() => ({ toString: () => '' })),
        Boxed: vi.fn((val: unknown) => val),
      }

      const props = propsFactory(mockInternal) as { blockType: string }

      expect(props).toHaveProperty('blockType')
    })

    it('should default blockType to bullet', () => {
      const propsFactory = BulletBlockSchema.model.props as PropsFactory

      if (!propsFactory) {
        throw new Error('Props factory not defined')
      }

      const mockInternal = {
        Text: vi.fn(() => ({ toString: () => '' })),
        Boxed: vi.fn((val: unknown) => val),
      }

      const props = propsFactory(mockInternal) as { blockType: string }

      expect(props.blockType).toBe('bullet')
    })

    it('should define isChecked prop', () => {
      const propsFactory = BulletBlockSchema.model.props as PropsFactory

      if (!propsFactory) {
        throw new Error('Props factory not defined')
      }

      const mockInternal = {
        Text: vi.fn(() => ({ toString: () => '' })),
        Boxed: vi.fn((val: unknown) => val),
      }

      const props = propsFactory(mockInternal) as { isChecked: boolean }

      expect(props).toHaveProperty('isChecked')
    })

    it('should default isChecked to false', () => {
      const propsFactory = BulletBlockSchema.model.props as PropsFactory

      if (!propsFactory) {
        throw new Error('Props factory not defined')
      }

      const mockInternal = {
        Text: vi.fn(() => ({ toString: () => '' })),
        Boxed: vi.fn((val: unknown) => val),
      }

      const props = propsFactory(mockInternal) as { isChecked: boolean }

      expect(props.isChecked).toBe(false)
    })
  })
})
