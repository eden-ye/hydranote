import { render, screen, waitFor } from '@testing-library/react'
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
    isEmpty = true
    spaceDoc = {}
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

// EDITOR-3102: Mock @blocksuite/inline for baseTextAttributes
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

// Mock supabase service to avoid initialization errors
vi.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}))

// Track mock instances for y-indexeddb
const mockInstances: Array<{
  synced: boolean
  on: ReturnType<typeof vi.fn>
  off: ReturnType<typeof vi.fn>
  destroy: ReturnType<typeof vi.fn>
}> = []

// Mock y-indexeddb with a proper class
vi.mock('y-indexeddb', () => {
  return {
    IndexeddbPersistence: class MockIndexeddbPersistence {
      synced = false
      on = vi.fn()
      off = vi.fn()
      destroy = vi.fn()

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      constructor(_dbName: string, _doc: unknown) {
        // Register sync callback and auto-fire it
        this.on.mockImplementation((event: string, callback: () => void) => {
          if (event === 'synced') {
            // Simulate immediate sync
            setTimeout(() => {
              this.synced = true
              callback()
            }, 0)
          }
        })
        mockInstances.push(this)
      }
    },
    clearDocument: vi.fn().mockResolvedValue(undefined),
  }
})

// Import after mocking
import Editor from './Editor'

describe('Editor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInstances.length = 0
  })

  it('renders editor container element', async () => {
    render(<Editor />)
    // Wait for persistence to sync
    await waitFor(() => {
      expect(screen.getByTestId('editor-container')).toBeInTheDocument()
    })
  })

  it('shows loading indicator initially', () => {
    render(<Editor />)
    // Initially shows loading state
    expect(screen.getByTestId('editor-loading')).toBeInTheDocument()
    expect(screen.getByText('Loading document...')).toBeInTheDocument()
  })

  it('transitions from loading to synced state', async () => {
    render(<Editor />)

    // Initially loading
    expect(screen.getByTestId('editor-loading')).toBeInTheDocument()

    // Wait for persistence to sync
    await waitFor(() => {
      const container = screen.getByTestId('editor-container')
      expect(container.getAttribute('data-persistence-status')).toBe('synced')
    })

    // Loading should be gone
    expect(screen.queryByTestId('editor-loading')).not.toBeInTheDocument()
  })

  it('cleans up on unmount without errors', async () => {
    const { unmount } = render(<Editor />)

    // Wait for initial sync
    await waitFor(() => {
      expect(screen.queryByTestId('editor-loading')).not.toBeInTheDocument()
    })

    expect(() => unmount()).not.toThrow()
  })
})

describe('Editor persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInstances.length = 0
  })

  it('creates IndexedDB persistence instance', async () => {
    render(<Editor />)

    // Wait for sync
    await waitFor(() => {
      expect(mockInstances.length).toBeGreaterThan(0)
    })
  })

  it('registers synced event handler', async () => {
    render(<Editor />)

    await waitFor(() => {
      expect(mockInstances.length).toBeGreaterThan(0)
    })

    const instance = mockInstances[0]
    expect(instance.on).toHaveBeenCalledWith('synced', expect.any(Function))
  })

  it('destroys persistence on unmount', async () => {
    const { unmount } = render(<Editor />)

    // Wait for sync
    await waitFor(() => {
      expect(screen.queryByTestId('editor-loading')).not.toBeInTheDocument()
    })

    const instance = mockInstances[0]
    unmount()

    expect(instance.destroy).toHaveBeenCalled()
  })
})
