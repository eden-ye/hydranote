import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock BlockSuite modules since they use web components that jsdom doesn't support
// Note: vi.mock is hoisted, so we need to define everything inside the factory
vi.mock('@blocksuite/blocks', () => ({
  AffineSchemas: [],
  PageEditorBlockSpecs: [],
}))

vi.mock('@blocksuite/blocks/effects', () => ({
  effects: () => {},
}))

vi.mock('@blocksuite/presets/effects', () => ({
  effects: () => {},
}))

vi.mock('@blocksuite/presets', () => {
  return {
    AffineEditorContainer: class MockAffineEditorContainer {
      doc: unknown = null
      constructor() {
        const div = document.createElement('div')
        div.setAttribute('data-testid', 'blocksuite-editor')
        return div as unknown as MockAffineEditorContainer
      }
    },
  }
})

vi.mock('@blocksuite/store', () => {
  class MockDoc {
    load(callback?: () => void) {
      callback?.()
    }
    addBlock() {
      return 'block-id'
    }
  }

  // Mock defineBlockSchema to return a schema-like object
  const defineBlockSchema = (options: { flavour: string }) => ({
    version: 1,
    model: {
      flavour: options.flavour,
      props: () => ({}),
    },
  })

  return {
    Schema: class MockSchema {
      register() {
        return this
      }
    },
    DocCollection: class MockDocCollection {
      meta = { initialize: () => {} }
      createDoc() {
        return new MockDoc()
      }
    },
    defineBlockSchema,
  }
})

vi.mock('@blocksuite/block-std', () => {
  // Mock BlockComponent base class
  class MockBlockComponent extends HTMLElement {
    model = { children: [], isExpanded: true, text: { toString: () => '' } }
    doc = { updateBlock: () => {} }
    renderChildren() { return '' }
  }

  return {
    BlockComponent: MockBlockComponent,
    FlavourExtension: () => ({}),
    BlockViewExtension: () => ({}),
  }
})

vi.mock('lit/static-html.js', () => ({
  literal: (strings: TemplateStringsArray) => strings.join(''),
}))

vi.mock('@toeverything/theme/style.css', () => ({}))

// Import after mocking
import Editor from './Editor'

describe('Editor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders editor container element', () => {
    render(<Editor />)
    expect(screen.getByTestId('editor-container')).toBeInTheDocument()
  })

  it('mounts an editor instance in the container', () => {
    render(<Editor />)
    const container = screen.getByTestId('editor-container')
    // Container should have children after mounting
    expect(container.children.length).toBeGreaterThan(0)
  })

  it('cleans up on unmount without errors', () => {
    const { unmount } = render(<Editor />)
    expect(() => unmount()).not.toThrow()
  })
})
