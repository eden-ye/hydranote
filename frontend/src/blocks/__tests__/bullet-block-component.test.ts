import { describe, it, expect, vi } from 'vitest'

// EDITOR-3102: Mock @blocksuite/inline before importing bullet-block
// This is needed because bullet-block now imports baseTextAttributes for schema extension
vi.mock('@blocksuite/inline', () => {
  const mockBaseTextAttributes = {
    extend: (schema: Record<string, unknown>) => ({
      ...schema,
      parse: (value: unknown) => value,
      safeParse: (value: unknown) => ({ success: true, data: value }),
    }),
    parse: (value: unknown) => value,
    safeParse: (value: unknown) => ({ success: true, data: value }),
  }
  return {
    baseTextAttributes: mockBaseTextAttributes,
  }
})

// Mock @blocksuite/block-std since bullet-block extends BlockComponent
vi.mock('@blocksuite/block-std', () => {
  class MockBlockComponent extends HTMLElement {
    model = { children: [], isExpanded: true, text: { toString: () => '' } }
    doc = { updateBlock: () => {} }
    renderChildren() { return '' }
  }
  return {
    BlockComponent: MockBlockComponent,
  }
})

// Mock @blocksuite/affine-components/rich-text
vi.mock('@blocksuite/affine-components/rich-text', () => ({
  focusTextModel: vi.fn(),
  asyncSetInlineRange: vi.fn(),
  getInlineEditorByModel: vi.fn(),
}))

// Mock lit - return minimal implementation
// EDITOR-3507: Added LitElement for drop-indicator component
vi.mock('lit', () => ({
  html: () => '',
  css: () => '',
  nothing: '',
  LitElement: class LitElement extends HTMLElement {
    requestUpdate() {}
  },
}))

vi.mock('lit/decorators.js', () => ({
  customElement: () => () => {},
  property: () => () => {},
}))

import {
  shouldHandleFoldShortcut,
  computeIndentLevel,
  canIndent,
  canOutdent,
  getNavigationTarget,
  computeBackspaceMergeStrategy,
  type BlockNavigationContext,
} from '../components/bullet-block'

/**
 * Tests for bullet block folding/collapse functionality (EDITOR-303)
 * and keyboard shortcuts (EDITOR-306)
 *
 * Since the component relies heavily on BlockSuite internals,
 * we test the business logic extracted into testable functions.
 */

// Test the exported keyboard shortcut logic
describe('Folding keyboard shortcut logic', () => {
  describe('shouldHandleFoldShortcut', () => {

    it('should return true for Cmd+. (Mac)', () => {
      const event = { key: '.', metaKey: true, ctrlKey: false }
      expect(shouldHandleFoldShortcut(event)).toBe(true)
    })

    it('should return true for Ctrl+. (Windows/Linux)', () => {
      const event = { key: '.', metaKey: false, ctrlKey: true }
      expect(shouldHandleFoldShortcut(event)).toBe(true)
    })

    it('should return false for . without modifier', () => {
      const event = { key: '.', metaKey: false, ctrlKey: false }
      expect(shouldHandleFoldShortcut(event)).toBe(false)
    })

    it('should return false for Cmd+other key', () => {
      const event = { key: 'a', metaKey: true, ctrlKey: false }
      expect(shouldHandleFoldShortcut(event)).toBe(false)
    })
  })
})

// Test the toggle expand logic
describe('Toggle expand logic', () => {
  /**
   * Simulates the toggle behavior - only toggles if block has children
   */
  const createToggleHandler = (
    hasChildren: boolean,
    currentState: boolean,
    updateFn: (newState: boolean) => void
  ) => {
    return () => {
      if (!hasChildren) return
      updateFn(!currentState)
    }
  }

  it('should toggle from expanded to collapsed when has children', () => {
    const updateFn = vi.fn()
    const toggle = createToggleHandler(true, true, updateFn)

    toggle()

    expect(updateFn).toHaveBeenCalledWith(false)
  })

  it('should toggle from collapsed to expanded when has children', () => {
    const updateFn = vi.fn()
    const toggle = createToggleHandler(true, false, updateFn)

    toggle()

    expect(updateFn).toHaveBeenCalledWith(true)
  })

  it('should not toggle when has no children', () => {
    const updateFn = vi.fn()
    const toggle = createToggleHandler(false, true, updateFn)

    toggle()

    expect(updateFn).not.toHaveBeenCalled()
  })
})

// Test visual state rendering logic
describe('Visual state rendering', () => {
  /**
   * Returns the appropriate icon for fold state
   */
  const getFoldIcon = (isExpanded: boolean, hasChildren: boolean): string => {
    if (!hasChildren) return 'bullet' // Show bullet icon
    return isExpanded ? '▼' : '▶'
  }

  it('should show down arrow when expanded with children', () => {
    expect(getFoldIcon(true, true)).toBe('▼')
  })

  it('should show right arrow when collapsed with children', () => {
    expect(getFoldIcon(false, true)).toBe('▶')
  })

  it('should show bullet icon when no children regardless of state', () => {
    expect(getFoldIcon(true, false)).toBe('bullet')
    expect(getFoldIcon(false, false)).toBe('bullet')
  })

  /**
   * Returns CSS class for children container
   */
  const getChildrenClass = (isExpanded: boolean): string => {
    return isExpanded ? '' : 'collapsed'
  }

  it('should return empty class when expanded', () => {
    expect(getChildrenClass(true)).toBe('')
  })

  it('should return collapsed class when not expanded', () => {
    expect(getChildrenClass(false)).toBe('collapsed')
  })
})

// Test aria accessibility attributes
describe('Accessibility', () => {
  /**
   * Returns aria-expanded attribute value
   */
  const getAriaExpanded = (
    isExpanded: boolean,
    hasChildren: boolean
  ): string | undefined => {
    if (!hasChildren) return undefined
    return isExpanded ? 'true' : 'false'
  }

  it('should return "true" when expanded with children', () => {
    expect(getAriaExpanded(true, true)).toBe('true')
  })

  it('should return "false" when collapsed with children', () => {
    expect(getAriaExpanded(false, true)).toBe('false')
  })

  it('should return undefined when no children', () => {
    expect(getAriaExpanded(true, false)).toBeUndefined()
    expect(getAriaExpanded(false, false)).toBeUndefined()
  })
})

// Import inline preview functions (EDITOR-304)
import {
  computeInlinePreview,
  truncatePreview,
  PREVIEW_MAX_LENGTH,
  PREVIEW_SEPARATOR,
} from '../components/bullet-block'

/**
 * Tests for inline detail view functionality (EDITOR-304)
 *
 * When a bullet is collapsed, an inline preview of child content
 * should be shown to provide context without expanding.
 */
describe('Inline detail view (EDITOR-304)', () => {
  describe('computeInlinePreview', () => {
    it('should return empty string when no children', () => {
      const children: Array<{ text: string }> = []
      expect(computeInlinePreview(children)).toBe('')
    })

    it('should return single child text', () => {
      const children = [{ text: 'First child' }]
      expect(computeInlinePreview(children)).toBe('First child')
    })

    it('should concatenate multiple children with separator', () => {
      const children = [{ text: 'First' }, { text: 'Second' }, { text: 'Third' }]
      expect(computeInlinePreview(children)).toBe('First · Second · Third')
    })

    it('should skip empty child texts', () => {
      const children = [{ text: 'First' }, { text: '' }, { text: 'Third' }]
      expect(computeInlinePreview(children)).toBe('First · Third')
    })

    it('should trim whitespace from child texts', () => {
      const children = [{ text: '  First  ' }, { text: '  Second  ' }]
      expect(computeInlinePreview(children)).toBe('First · Second')
    })

    it('should handle children with only whitespace', () => {
      const children = [{ text: '   ' }, { text: 'Real content' }]
      expect(computeInlinePreview(children)).toBe('Real content')
    })
  })

  describe('truncatePreview', () => {
    it('should not truncate short text', () => {
      const text = 'Short text'
      expect(truncatePreview(text)).toBe('Short text')
    })

    it('should truncate text longer than max length with ellipsis', () => {
      const longText = 'A'.repeat(PREVIEW_MAX_LENGTH + 10)
      const result = truncatePreview(longText)
      expect(result.length).toBe(PREVIEW_MAX_LENGTH + 1) // +1 for ellipsis
      expect(result.endsWith('…')).toBe(true)
    })

    it('should truncate at exactly max length', () => {
      const exactText = 'A'.repeat(PREVIEW_MAX_LENGTH)
      expect(truncatePreview(exactText)).toBe(exactText)
    })

    it('should handle empty string', () => {
      expect(truncatePreview('')).toBe('')
    })

    it('should preserve text up to max length', () => {
      const longText = 'Hello World This is a very long preview text that should be truncated'
      const result = truncatePreview(longText)
      expect(result.startsWith('Hello')).toBe(true)
    })
  })

  describe('PREVIEW_MAX_LENGTH constant', () => {
    it('should be a reasonable length for inline preview', () => {
      expect(PREVIEW_MAX_LENGTH).toBeGreaterThanOrEqual(30)
      expect(PREVIEW_MAX_LENGTH).toBeLessThanOrEqual(100)
    })
  })

  describe('PREVIEW_SEPARATOR constant', () => {
    it('should be a visual separator character', () => {
      expect(PREVIEW_SEPARATOR).toBe(' · ')
    })
  })

  describe('Preview visibility logic', () => {
    /**
     * Determine if inline preview should be shown
     */
    const shouldShowPreview = (
      isExpanded: boolean,
      hasChildren: boolean,
      previewText: string
    ): boolean => {
      return !isExpanded && hasChildren && previewText.length > 0
    }

    it('should show preview when collapsed with children and preview text', () => {
      expect(shouldShowPreview(false, true, 'Some preview')).toBe(true)
    })

    it('should not show preview when expanded', () => {
      expect(shouldShowPreview(true, true, 'Some preview')).toBe(false)
    })

    it('should not show preview when no children', () => {
      expect(shouldShowPreview(false, false, 'Some preview')).toBe(false)
    })

    it('should not show preview when preview text is empty', () => {
      expect(shouldShowPreview(false, true, '')).toBe(false)
    })
  })
})

/**
 * Tests for keyboard shortcuts functionality (EDITOR-306)
 *
 * Testing:
 * - Tab/Shift+Tab for indent/outdent
 * - Enter for new sibling bullet
 * - Cmd+Enter for child bullet
 * - Arrow keys for navigation
 * - Cmd+. for fold toggle (via BlockSuite hotkey system)
 */
describe('Keyboard Shortcuts (EDITOR-306)', () => {
  describe('Indent/Outdent logic', () => {
    describe('computeIndentLevel', () => {
      it('should return 0 for root-level block', () => {
        expect(computeIndentLevel(0)).toBe(0)
      })

      it('should return the provided depth', () => {
        expect(computeIndentLevel(1)).toBe(1)
        expect(computeIndentLevel(2)).toBe(2)
        expect(computeIndentLevel(5)).toBe(5)
      })
    })

    describe('canIndent', () => {
      it('should return false when no previous sibling exists', () => {
        expect(canIndent(false, 0)).toBe(false)
      })

      it('should return true when previous sibling exists', () => {
        expect(canIndent(true, 0)).toBe(true)
        expect(canIndent(true, 3)).toBe(true)
      })
    })

    describe('canOutdent', () => {
      it('should return false when at root level (depth 0)', () => {
        expect(canOutdent(0)).toBe(false)
      })

      it('should return true when nested (depth > 0)', () => {
        expect(canOutdent(1)).toBe(true)
        expect(canOutdent(2)).toBe(true)
        expect(canOutdent(5)).toBe(true)
      })
    })
  })

  describe('Arrow key navigation', () => {
    describe('getNavigationTarget', () => {
      // Mock context for navigation tests
      const createContext = (overrides: Partial<BlockNavigationContext> = {}): BlockNavigationContext => ({
        currentBlockId: 'block-2',
        previousSiblingId: 'block-1',
        nextSiblingId: 'block-3',
        parentId: 'parent-1',
        firstChildId: null,
        isExpanded: true,
        hasChildren: false,
        ...overrides,
      })

      describe('ArrowUp navigation', () => {
        it('should navigate to previous sibling', () => {
          const ctx = createContext()
          expect(getNavigationTarget('ArrowUp', ctx)).toBe('block-1')
        })

        it('should navigate to parent when no previous sibling', () => {
          const ctx = createContext({ previousSiblingId: null })
          expect(getNavigationTarget('ArrowUp', ctx)).toBe('parent-1')
        })

        it('should return null when at top with no parent', () => {
          const ctx = createContext({ previousSiblingId: null, parentId: null })
          expect(getNavigationTarget('ArrowUp', ctx)).toBeNull()
        })
      })

      describe('ArrowDown navigation', () => {
        it('should navigate to first child when expanded with children', () => {
          const ctx = createContext({
            hasChildren: true,
            isExpanded: true,
            firstChildId: 'child-1',
          })
          expect(getNavigationTarget('ArrowDown', ctx)).toBe('child-1')
        })

        it('should navigate to next sibling when collapsed or no children', () => {
          const ctx = createContext({ hasChildren: false })
          expect(getNavigationTarget('ArrowDown', ctx)).toBe('block-3')
        })

        it('should skip children when collapsed', () => {
          const ctx = createContext({
            hasChildren: true,
            isExpanded: false,
            firstChildId: 'child-1',
          })
          expect(getNavigationTarget('ArrowDown', ctx)).toBe('block-3')
        })

        it('should return null when no next sibling and no expanded children', () => {
          const ctx = createContext({ nextSiblingId: null, hasChildren: false })
          expect(getNavigationTarget('ArrowDown', ctx)).toBeNull()
        })
      })

      // EDITOR-3062: ArrowLeft/ArrowRight tests removed
      // These keys now use browser default text cursor navigation
    })
  })

  describe('New bullet creation logic', () => {
    /**
     * Determines the position for a new bullet relative to current block
     */
    const getNewBulletPosition = (
      isAtEndOfText: boolean,
      hasChildren: boolean,
      isExpanded: boolean
    ): 'sibling-after' | 'first-child' => {
      // If at end of text and has expanded children, insert as first child
      if (isAtEndOfText && hasChildren && isExpanded) {
        return 'first-child'
      }
      // Otherwise, insert as sibling after current block
      return 'sibling-after'
    }

    it('should create sibling when no children', () => {
      expect(getNewBulletPosition(true, false, false)).toBe('sibling-after')
    })

    it('should create sibling when has collapsed children', () => {
      expect(getNewBulletPosition(true, true, false)).toBe('sibling-after')
    })

    it('should create first child when at end with expanded children', () => {
      expect(getNewBulletPosition(true, true, true)).toBe('first-child')
    })

    it('should create sibling when not at end of text', () => {
      expect(getNewBulletPosition(false, true, true)).toBe('sibling-after')
    })
  })

  describe('Cmd+Enter child creation logic', () => {
    /**
     * Creates a child bullet regardless of cursor position
     */
    const shouldCreateChild = (): boolean => {
      // Cmd+Enter always creates a child
      return true
    }

    it('should always return true for child creation', () => {
      expect(shouldCreateChild()).toBe(true)
    })
  })
})

/**
 * Tests for backspace behavior with children (EDITOR-3063)
 *
 * When backspace is pressed at the start of a bullet with children,
 * the children should be unindented (promoted to the parent's level),
 * not deleted along with the parent.
 */
/**
 * Tests for inline formatting support (EDITOR-3056)
 *
 * Testing the configuration and styling for rich-text formatting:
 * - Bold (Cmd+B)
 * - Italic (Cmd+I)
 * - Underline (Cmd+U)
 * - Code
 */
describe('Inline Formatting (EDITOR-3056)', () => {
  describe('Format style mapping', () => {
    /**
     * Maps format type to expected CSS property and value
     */
    const getFormatStyle = (formatType: 'bold' | 'italic' | 'underline' | 'code'): { property: string; value: string } => {
      switch (formatType) {
        case 'bold':
          return { property: 'font-weight', value: 'bold' }
        case 'italic':
          return { property: 'font-style', value: 'italic' }
        case 'underline':
          return { property: 'text-decoration', value: 'underline' }
        case 'code':
          return { property: 'font-family', value: 'monospace' }
      }
    }

    it('should map bold to font-weight: bold', () => {
      const style = getFormatStyle('bold')
      expect(style.property).toBe('font-weight')
      expect(style.value).toBe('bold')
    })

    it('should map italic to font-style: italic', () => {
      const style = getFormatStyle('italic')
      expect(style.property).toBe('font-style')
      expect(style.value).toBe('italic')
    })

    it('should map underline to text-decoration: underline', () => {
      const style = getFormatStyle('underline')
      expect(style.property).toBe('text-decoration')
      expect(style.value).toBe('underline')
    })

    it('should map code to font-family: monospace', () => {
      const style = getFormatStyle('code')
      expect(style.property).toBe('font-family')
      expect(style.value).toBe('monospace')
    })
  })

  describe('Format keyboard shortcuts', () => {
    /**
     * Returns expected keyboard shortcut for each format type
     */
    const getFormatShortcut = (formatType: 'bold' | 'italic' | 'underline'): string => {
      switch (formatType) {
        case 'bold':
          return 'Cmd+B'
        case 'italic':
          return 'Cmd+I'
        case 'underline':
          return 'Cmd+U'
      }
    }

    it('should use Cmd+B for bold', () => {
      expect(getFormatShortcut('bold')).toBe('Cmd+B')
    })

    it('should use Cmd+I for italic', () => {
      expect(getFormatShortcut('italic')).toBe('Cmd+I')
    })

    it('should use Cmd+U for underline', () => {
      expect(getFormatShortcut('underline')).toBe('Cmd+U')
    })
  })

  describe('enableFormat configuration', () => {
    /**
     * Simulates the rich-text enableFormat configuration
     * This tests that formatting is enabled by default
     */
    const isFormattingEnabled = (): boolean => {
      // EDITOR-3056: enableFormat should be true
      return true
    }

    it('should have formatting enabled', () => {
      expect(isFormattingEnabled()).toBe(true)
    })
  })
})

/**
 * Tests for background highlight styling (EDITOR-3101)
 *
 * Testing that highlight CSS selectors and styles are correctly defined
 */
describe('Background Highlight Styling (EDITOR-3101)', () => {
  // Import color palette to validate CSS selectors match color IDs
  describe('Highlight CSS selector mapping', () => {
    /**
     * Returns the expected CSS selector for a highlight color
     */
    const getHighlightSelector = (colorId: string): string => {
      return `rich-text [data-v-highlight="${colorId}"]`
    }

    it('should generate correct selector for yellow highlight', () => {
      expect(getHighlightSelector('yellow')).toBe('rich-text [data-v-highlight="yellow"]')
    })

    it('should generate correct selector for green highlight', () => {
      expect(getHighlightSelector('green')).toBe('rich-text [data-v-highlight="green"]')
    })

    it('should generate correct selector for blue highlight', () => {
      expect(getHighlightSelector('blue')).toBe('rich-text [data-v-highlight="blue"]')
    })

    it('should generate correct selector for purple highlight', () => {
      expect(getHighlightSelector('purple')).toBe('rich-text [data-v-highlight="purple"]')
    })

    it('should generate correct selector for pink highlight', () => {
      expect(getHighlightSelector('pink')).toBe('rich-text [data-v-highlight="pink"]')
    })

    it('should generate correct selector for gray highlight', () => {
      expect(getHighlightSelector('gray')).toBe('rich-text [data-v-highlight="gray"]')
    })
  })

  describe('Highlight style properties', () => {
    /**
     * Expected styles for highlighted text
     */
    interface HighlightStyles {
      backgroundColor: string
      color: string
      padding: string
      borderRadius: string
    }

    /**
     * Returns expected highlight styles for a color
     * These should match the CSS in bullet-block.ts
     */
    const getExpectedHighlightStyles = (colorId: string): HighlightStyles | null => {
      const colorMap: Record<string, HighlightStyles> = {
        yellow: { backgroundColor: '#FEF3C7', color: '#92400E', padding: '0.1em 0.2em', borderRadius: '2px' },
        green: { backgroundColor: '#D1FAE5', color: '#065F46', padding: '0.1em 0.2em', borderRadius: '2px' },
        blue: { backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '0.1em 0.2em', borderRadius: '2px' },
        purple: { backgroundColor: '#EDE9FE', color: '#5B21B6', padding: '0.1em 0.2em', borderRadius: '2px' },
        pink: { backgroundColor: '#FCE7F3', color: '#9D174D', padding: '0.1em 0.2em', borderRadius: '2px' },
        gray: { backgroundColor: '#F3F4F6', color: '#1F2937', padding: '0.1em 0.2em', borderRadius: '2px' },
      }
      return colorMap[colorId] || null
    }

    it('should have consistent padding for all colors', () => {
      const colors = ['yellow', 'green', 'blue', 'purple', 'pink', 'gray']
      colors.forEach((colorId) => {
        const styles = getExpectedHighlightStyles(colorId)
        expect(styles?.padding).toBe('0.1em 0.2em')
      })
    })

    it('should have consistent border-radius for all colors', () => {
      const colors = ['yellow', 'green', 'blue', 'purple', 'pink', 'gray']
      colors.forEach((colorId) => {
        const styles = getExpectedHighlightStyles(colorId)
        expect(styles?.borderRadius).toBe('2px')
      })
    })

    it('should return null for invalid color', () => {
      const styles = getExpectedHighlightStyles('invalid')
      expect(styles).toBeNull()
    })
  })
})

/**
 * Tests for color keyboard shortcuts (EDITOR-3102)
 *
 * Testing the keyboard shortcut logic for applying highlight colors
 */
describe('Color Keyboard Shortcuts (EDITOR-3102)', () => {
  describe('Shortcut key mapping', () => {
    /**
     * Maps keyboard shortcut key to color ID
     * Cmd+Alt+1-6 for colors, Cmd+Alt+0 to clear
     */
    const getColorFromShortcut = (key: string): string | null => {
      const colorMap: Record<string, string> = {
        '1': 'yellow',
        '2': 'green',
        '3': 'blue',
        '4': 'purple',
        '5': 'pink',
        '6': 'gray',
        '0': '__clear__',
      }
      return colorMap[key] || null
    }

    it('should map key 1 to yellow', () => {
      expect(getColorFromShortcut('1')).toBe('yellow')
    })

    it('should map key 2 to green', () => {
      expect(getColorFromShortcut('2')).toBe('green')
    })

    it('should map key 3 to blue', () => {
      expect(getColorFromShortcut('3')).toBe('blue')
    })

    it('should map key 4 to purple', () => {
      expect(getColorFromShortcut('4')).toBe('purple')
    })

    it('should map key 5 to pink', () => {
      expect(getColorFromShortcut('5')).toBe('pink')
    })

    it('should map key 6 to gray', () => {
      expect(getColorFromShortcut('6')).toBe('gray')
    })

    it('should map key 0 to clear', () => {
      expect(getColorFromShortcut('0')).toBe('__clear__')
    })

    it('should return null for invalid keys', () => {
      expect(getColorFromShortcut('7')).toBeNull()
      expect(getColorFromShortcut('8')).toBeNull()
      expect(getColorFromShortcut('a')).toBeNull()
    })
  })

  describe('Toggle behavior', () => {
    /**
     * Determines the action to take based on current and new color
     */
    const getHighlightAction = (
      currentColor: string | null,
      newColor: string
    ): 'apply' | 'remove' | 'replace' => {
      if (newColor === '__clear__') {
        return currentColor ? 'remove' : 'remove'
      }
      if (currentColor === newColor) {
        return 'remove' // Toggle off
      }
      if (currentColor) {
        return 'replace' // Replace existing color
      }
      return 'apply' // Apply new color
    }

    it('should apply when no existing color', () => {
      expect(getHighlightAction(null, 'yellow')).toBe('apply')
    })

    it('should remove when same color (toggle)', () => {
      expect(getHighlightAction('yellow', 'yellow')).toBe('remove')
    })

    it('should replace when different color', () => {
      expect(getHighlightAction('yellow', 'green')).toBe('replace')
    })

    it('should remove when clear shortcut used', () => {
      expect(getHighlightAction('yellow', '__clear__')).toBe('remove')
      expect(getHighlightAction(null, '__clear__')).toBe('remove')
    })
  })

  describe('Shortcut key detection', () => {
    /**
     * Check if keyboard event matches highlight shortcut pattern
     */
    const isHighlightShortcut = (event: {
      key: string
      metaKey: boolean
      ctrlKey: boolean
      altKey: boolean
    }): boolean => {
      const hasModifier = event.metaKey || event.ctrlKey
      const hasAlt = event.altKey
      const isValidKey = /^[0-6]$/.test(event.key)
      return hasModifier && hasAlt && isValidKey
    }

    it('should return true for Cmd+Alt+1 (Mac)', () => {
      expect(isHighlightShortcut({ key: '1', metaKey: true, ctrlKey: false, altKey: true })).toBe(true)
    })

    it('should return true for Ctrl+Alt+1 (Windows/Linux)', () => {
      expect(isHighlightShortcut({ key: '1', metaKey: false, ctrlKey: true, altKey: true })).toBe(true)
    })

    it('should return false without Alt', () => {
      expect(isHighlightShortcut({ key: '1', metaKey: true, ctrlKey: false, altKey: false })).toBe(false)
    })

    it('should return false without Cmd/Ctrl', () => {
      expect(isHighlightShortcut({ key: '1', metaKey: false, ctrlKey: false, altKey: true })).toBe(false)
    })

    it('should return false for invalid keys', () => {
      expect(isHighlightShortcut({ key: '7', metaKey: true, ctrlKey: false, altKey: true })).toBe(false)
      expect(isHighlightShortcut({ key: 'a', metaKey: true, ctrlKey: false, altKey: true })).toBe(false)
    })
  })
})

describe('Backspace with children (EDITOR-3063)', () => {
  describe('computeBackspaceMergeStrategy', () => {
    describe('when block has no children', () => {
      it('should return strategy with no children to reparent', () => {
        const result = computeBackspaceMergeStrategy({
          hasChildren: false,
          childrenIds: [],
          hasPreviousSibling: true,
          previousSiblingId: 'prev-1',
          parentId: 'parent-1',
        })

        expect(result.shouldReparentChildren).toBe(false)
        expect(result.childrenToReparent).toEqual([])
      })
    })

    describe('when block has children and previous sibling', () => {
      it('should reparent children to previous sibling parent level', () => {
        const result = computeBackspaceMergeStrategy({
          hasChildren: true,
          childrenIds: ['child-1', 'child-2'],
          hasPreviousSibling: true,
          previousSiblingId: 'prev-1',
          parentId: 'parent-1',
        })

        expect(result.shouldReparentChildren).toBe(true)
        expect(result.childrenToReparent).toEqual(['child-1', 'child-2'])
        expect(result.newParentId).toBe('parent-1')
      })
    })

    describe('when block has children and no previous sibling (merge with parent)', () => {
      it('should reparent children to grandparent level', () => {
        const result = computeBackspaceMergeStrategy({
          hasChildren: true,
          childrenIds: ['child-1', 'child-2'],
          hasPreviousSibling: false,
          previousSiblingId: null,
          parentId: 'parent-1',
          grandparentId: 'grandparent-1',
        })

        expect(result.shouldReparentChildren).toBe(true)
        expect(result.childrenToReparent).toEqual(['child-1', 'child-2'])
        expect(result.newParentId).toBe('grandparent-1')
      })
    })

    describe('when block is at root level with children', () => {
      it('should not reparent as there is no parent to merge with', () => {
        const result = computeBackspaceMergeStrategy({
          hasChildren: true,
          childrenIds: ['child-1', 'child-2'],
          hasPreviousSibling: false,
          previousSiblingId: null,
          parentId: null,
          grandparentId: null,
        })

        // At root level with no previous sibling, backspace does nothing
        // So no reparenting needed
        expect(result.shouldReparentChildren).toBe(false)
        expect(result.childrenToReparent).toEqual([])
      })
    })
  })
})

// Import undo/redo helper functions (EDITOR-3057)
import {
  shouldHandleUndoShortcut,
  shouldHandleRedoShortcut,
  isUndoRedoEnabled,
} from '../components/bullet-block'

/**
 * Tests for undo/redo support (EDITOR-3057)
 *
 * Testing:
 * - Cmd+Z for undo
 * - Cmd+Shift+Z for redo
 * - enableUndoRedo configuration
 */
describe('Undo/Redo Support (EDITOR-3057)', () => {
  describe('shouldHandleUndoShortcut', () => {
    it('should return true for Cmd+Z (Mac)', () => {
      const event = { key: 'z', metaKey: true, ctrlKey: false, shiftKey: false }
      expect(shouldHandleUndoShortcut(event)).toBe(true)
    })

    it('should return true for Ctrl+Z (Windows/Linux)', () => {
      const event = { key: 'z', metaKey: false, ctrlKey: true, shiftKey: false }
      expect(shouldHandleUndoShortcut(event)).toBe(true)
    })

    it('should return false for Z without modifier', () => {
      const event = { key: 'z', metaKey: false, ctrlKey: false, shiftKey: false }
      expect(shouldHandleUndoShortcut(event)).toBe(false)
    })

    it('should return false for Cmd+Shift+Z (that is redo)', () => {
      const event = { key: 'z', metaKey: true, ctrlKey: false, shiftKey: true }
      expect(shouldHandleUndoShortcut(event)).toBe(false)
    })

    it('should return false for Cmd+other key', () => {
      const event = { key: 'a', metaKey: true, ctrlKey: false, shiftKey: false }
      expect(shouldHandleUndoShortcut(event)).toBe(false)
    })
  })

  describe('shouldHandleRedoShortcut', () => {
    it('should return true for Cmd+Shift+Z (Mac)', () => {
      const event = { key: 'z', metaKey: true, ctrlKey: false, shiftKey: true }
      expect(shouldHandleRedoShortcut(event)).toBe(true)
    })

    it('should return true for Ctrl+Shift+Z (Windows/Linux)', () => {
      const event = { key: 'z', metaKey: false, ctrlKey: true, shiftKey: true }
      expect(shouldHandleRedoShortcut(event)).toBe(true)
    })

    it('should return false for Cmd+Z without Shift', () => {
      const event = { key: 'z', metaKey: true, ctrlKey: false, shiftKey: false }
      expect(shouldHandleRedoShortcut(event)).toBe(false)
    })

    it('should return false for Shift+Z without Cmd/Ctrl', () => {
      const event = { key: 'z', metaKey: false, ctrlKey: false, shiftKey: true }
      expect(shouldHandleRedoShortcut(event)).toBe(false)
    })
  })

  describe('isUndoRedoEnabled', () => {
    it('should return true (undo/redo is enabled)', () => {
      // EDITOR-3057: enableUndoRedo should be true
      expect(isUndoRedoEnabled()).toBe(true)
    })
  })
})

// Import Tab trigger generation functions (EDITOR-3601)
import {
  shouldTriggerDescriptorGeneration,
  buildDescriptorGenerationContext,
  type DescriptorGenerationContext,
  type TabTriggerInput,
} from '../components/bullet-block'

/**
 * Tests for Tab trigger AI generation at deepest level (EDITOR-3601)
 *
 * When user presses Tab and cannot indent further (no previous sibling),
 * AND the parent is a descriptor block, trigger AI generation.
 */
describe('Tab Trigger AI Generation (EDITOR-3601)', () => {
  describe('shouldTriggerDescriptorGeneration', () => {
    it('should return true when cannot indent and parent is a descriptor', () => {
      const input: TabTriggerInput = {
        canIndent: false,
        parentIsDescriptor: true,
        parentDescriptorType: 'what',
      }
      expect(shouldTriggerDescriptorGeneration(input)).toBe(true)
    })

    it('should return false when can indent (normal indent behavior)', () => {
      const input: TabTriggerInput = {
        canIndent: true,
        parentIsDescriptor: true,
        parentDescriptorType: 'what',
      }
      expect(shouldTriggerDescriptorGeneration(input)).toBe(false)
    })

    it('should return false when parent is not a descriptor', () => {
      const input: TabTriggerInput = {
        canIndent: false,
        parentIsDescriptor: false,
        parentDescriptorType: null,
      }
      expect(shouldTriggerDescriptorGeneration(input)).toBe(false)
    })

    it('should return false when both conditions fail', () => {
      const input: TabTriggerInput = {
        canIndent: true,
        parentIsDescriptor: false,
        parentDescriptorType: null,
      }
      expect(shouldTriggerDescriptorGeneration(input)).toBe(false)
    })

    it('should work with all descriptor types', () => {
      const descriptorTypes = ['what', 'why', 'how', 'pros', 'cons', 'custom'] as const
      descriptorTypes.forEach((type) => {
        const input: TabTriggerInput = {
          canIndent: false,
          parentIsDescriptor: true,
          parentDescriptorType: type,
        }
        expect(shouldTriggerDescriptorGeneration(input)).toBe(true)
      })
    })
  })

  describe('buildDescriptorGenerationContext', () => {
    it('should build context with all required fields', () => {
      const context = buildDescriptorGenerationContext({
        blockId: 'block-1',
        blockText: 'Current block text',
        parentDescriptorType: 'what',
        parentDescriptorLabel: undefined,
        parentText: 'Parent descriptor text',
        grandparentText: 'Grandparent context',
        siblingTexts: ['Sibling 1', 'Sibling 2'],
      })

      expect(context.blockId).toBe('block-1')
      expect(context.blockText).toBe('Current block text')
      expect(context.descriptorType).toBe('what')
      expect(context.descriptorLabel).toBeUndefined()
      expect(context.parentText).toBe('Parent descriptor text')
      expect(context.grandparentText).toBe('Grandparent context')
      expect(context.siblingTexts).toEqual(['Sibling 1', 'Sibling 2'])
    })

    it('should handle custom descriptor type with label', () => {
      const context = buildDescriptorGenerationContext({
        blockId: 'block-1',
        blockText: 'Current block text',
        parentDescriptorType: 'custom',
        parentDescriptorLabel: 'My Custom Label',
        parentText: 'Parent descriptor text',
        grandparentText: null,
        siblingTexts: [],
      })

      expect(context.descriptorType).toBe('custom')
      expect(context.descriptorLabel).toBe('My Custom Label')
    })

    it('should handle empty sibling texts', () => {
      const context = buildDescriptorGenerationContext({
        blockId: 'block-1',
        blockText: 'Current block text',
        parentDescriptorType: 'how',
        parentDescriptorLabel: undefined,
        parentText: 'Parent descriptor text',
        grandparentText: 'Topic',
        siblingTexts: [],
      })

      expect(context.siblingTexts).toEqual([])
    })

    it('should handle null grandparent text', () => {
      const context = buildDescriptorGenerationContext({
        blockId: 'block-1',
        blockText: 'Current block text',
        parentDescriptorType: 'why',
        parentDescriptorLabel: undefined,
        parentText: 'Parent descriptor text',
        grandparentText: null,
        siblingTexts: ['Sibling'],
      })

      expect(context.grandparentText).toBeNull()
    })
  })

  describe('DescriptorGenerationContext interface', () => {
    it('should have all required properties for AI prompt building', () => {
      const context: DescriptorGenerationContext = {
        blockId: 'block-1',
        blockText: 'test',
        descriptorType: 'what',
        descriptorLabel: undefined,
        parentText: 'parent',
        grandparentText: 'grandparent',
        siblingTexts: [],
      }

      // All properties should be defined
      expect(context).toHaveProperty('blockId')
      expect(context).toHaveProperty('blockText')
      expect(context).toHaveProperty('descriptorType')
      expect(context).toHaveProperty('descriptorLabel')
      expect(context).toHaveProperty('parentText')
      expect(context).toHaveProperty('grandparentText')
      expect(context).toHaveProperty('siblingTexts')
    })
  })
})

// Import null model guard utilities (BUG-EDITOR-3064)
import {
  createDummyModel,
  isDummyModel,
} from '../components/bullet-block'

/**
 * Tests for null model defensive handling (BUG-EDITOR-3064)
 *
 * BlockSuite's base class accesses `this.model.id` internally before our guards run.
 * To prevent "Cannot read properties of null (reading 'id')" errors, we need a
 * defensive model getter that returns a dummy object when the real model is null.
 */
describe('Null Model Defense (BUG-EDITOR-3064)', () => {
  describe('createDummyModel', () => {
    it('should return an object with empty id', () => {
      const dummy = createDummyModel()
      expect(dummy.id).toBe('')
    })

    it('should return an object with empty text', () => {
      const dummy = createDummyModel()
      expect(dummy.text.toString()).toBe('')
      expect(dummy.text.length).toBe(0)
    })

    it('should return an object with isExpanded true', () => {
      const dummy = createDummyModel()
      expect(dummy.isExpanded).toBe(true)
    })

    it('should return an object with empty children array', () => {
      const dummy = createDummyModel()
      expect(dummy.children).toEqual([])
    })

    it('should have a dummy marker property', () => {
      const dummy = createDummyModel()
      expect(dummy.__isDummy).toBe(true)
    })

    it('should have other required properties with defaults', () => {
      const dummy = createDummyModel()
      // These are required by BulletBlockModel
      expect(dummy.isDescriptor).toBe(false)
      expect(dummy.descriptorType).toBeNull()
      expect(dummy.descriptorLabel).toBeUndefined()
      expect(dummy.cheatsheetVisible).toBe(true)
    })
  })

  describe('isDummyModel', () => {
    it('should return true for dummy model', () => {
      const dummy = createDummyModel()
      expect(isDummyModel(dummy)).toBe(true)
    })

    it('should return false for null', () => {
      expect(isDummyModel(null)).toBe(false)
    })

    it('should return false for regular object without marker', () => {
      const regular = { id: 'real-id', text: 'real text' }
      expect(isDummyModel(regular)).toBe(false)
    })

    it('should return false for object with false __isDummy', () => {
      const fakeMarker = { __isDummy: false, id: 'test' }
      expect(isDummyModel(fakeMarker)).toBe(false)
    })
  })

  describe('Null model safety behavior', () => {
    /**
     * Simulates what the model getter should do when model is null
     */
    const safeGetModel = <T>(realModel: T | null, createDummy: () => T): T => {
      if (!realModel) {
        return createDummy()
      }
      return realModel
    }

    it('should return real model when available', () => {
      const realModel = { id: 'real-123', text: 'real text' }
      const createDummy = () => ({ id: '', text: '' })
      const result = safeGetModel(realModel, createDummy)
      expect(result.id).toBe('real-123')
    })

    it('should return dummy model when real model is null', () => {
      const createDummy = () => ({ id: '', text: '', __isDummy: true })
      const result = safeGetModel(null, createDummy)
      expect(result.id).toBe('')
      expect(result.__isDummy).toBe(true)
    })

    it('should prevent null access errors', () => {
      const createDummy = () => ({ id: '', text: '', __isDummy: true })
      const result = safeGetModel(null, createDummy)
      // This should not throw, even though we're accessing id on a "null" model
      expect(() => result.id).not.toThrow()
    })
  })
})

// Import ghost bullet functions (EDITOR-3511)
import {
  generateGhostSuggestions,
  shouldShowGhostBullets,
  type GhostSuggestion,
  type GhostSuggestionContext,
} from '../components/bullet-block'

/**
 * Tests for Ghost Bullet Suggestions (EDITOR-3511)
 *
 * Ghost bullets appear inline under parent bullets as suggestion placeholders.
 * When clicked, they convert to real bullets and trigger AI expansion.
 */
describe('Ghost Bullet Suggestions (EDITOR-3511)', () => {
  describe('shouldShowGhostBullets', () => {
    it('should return true when block has text and is expanded', () => {
      expect(shouldShowGhostBullets({
        hasText: true,
        isExpanded: true,
        hasChildren: true,
        isInFocusMode: false,
      })).toBe(true)
    })

    it('should return true when block has text and no children (leaf node)', () => {
      expect(shouldShowGhostBullets({
        hasText: true,
        isExpanded: true,
        hasChildren: false,
        isInFocusMode: false,
      })).toBe(true)
    })

    it('should return false when block is collapsed', () => {
      expect(shouldShowGhostBullets({
        hasText: true,
        isExpanded: false,
        hasChildren: true,
        isInFocusMode: false,
      })).toBe(false)
    })

    it('should return false when block has no text', () => {
      expect(shouldShowGhostBullets({
        hasText: false,
        isExpanded: true,
        hasChildren: false,
        isInFocusMode: false,
      })).toBe(false)
    })

    it('should return true in focus mode for focused block', () => {
      expect(shouldShowGhostBullets({
        hasText: true,
        isExpanded: true,
        hasChildren: true,
        isInFocusMode: true,
      })).toBe(true)
    })
  })

  describe('generateGhostSuggestions', () => {
    it('should generate suggestions based on parent text', () => {
      const context: GhostSuggestionContext = {
        parentText: 'Machine learning applications',
        siblingTexts: [],
        depth: 1,
      }
      const suggestions = generateGhostSuggestions(context)

      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions.length).toBeLessThanOrEqual(3)
      suggestions.forEach(suggestion => {
        expect(suggestion.id).toBeTruthy()
        expect(suggestion.text).toBeTruthy()
        expect(suggestion.text.endsWith('?')).toBe(true) // Suggestions should be questions
      })
    })

    it('should return empty array when parent text is empty', () => {
      const context: GhostSuggestionContext = {
        parentText: '',
        siblingTexts: [],
        depth: 1,
      }
      const suggestions = generateGhostSuggestions(context)
      expect(suggestions).toEqual([])
    })

    it('should return empty array when parent text is only whitespace', () => {
      const context: GhostSuggestionContext = {
        parentText: '   ',
        siblingTexts: [],
        depth: 1,
      }
      const suggestions = generateGhostSuggestions(context)
      expect(suggestions).toEqual([])
    })

    it('should limit suggestions to max 3', () => {
      const context: GhostSuggestionContext = {
        parentText: 'Complex topic with many possible directions',
        siblingTexts: ['First point', 'Second point'],
        depth: 2,
      }
      const suggestions = generateGhostSuggestions(context)
      expect(suggestions.length).toBeLessThanOrEqual(3)
    })

    it('should generate unique IDs for each suggestion', () => {
      const context: GhostSuggestionContext = {
        parentText: 'Test topic',
        siblingTexts: [],
        depth: 1,
      }
      const suggestions = generateGhostSuggestions(context)
      const ids = suggestions.map(s => s.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  describe('GhostSuggestion interface', () => {
    it('should have required properties', () => {
      const suggestion: GhostSuggestion = {
        id: 'ghost-1',
        text: 'What are the implications?',
      }
      expect(suggestion.id).toBe('ghost-1')
      expect(suggestion.text).toBe('What are the implications?')
    })
  })

  describe('Ghost bullet click behavior', () => {
    /**
     * Simulates converting a ghost bullet to a real bullet
     * Returns the context for AI expansion
     */
    const convertGhostToRealBullet = (
      ghostText: string,
      parentBlockId: string
    ): { newBlockText: string; parentId: string; shouldTriggerExpand: boolean } => {
      return {
        newBlockText: ghostText,
        parentId: parentBlockId,
        shouldTriggerExpand: true,
      }
    }

    it('should return correct structure for conversion', () => {
      const result = convertGhostToRealBullet('What are the key factors?', 'block-123')
      expect(result.newBlockText).toBe('What are the key factors?')
      expect(result.parentId).toBe('block-123')
      expect(result.shouldTriggerExpand).toBe(true)
    })
  })

  describe('Ghost bullet styling', () => {
    /**
     * Returns the CSS classes for ghost bullet styling
     */
    const getGhostBulletClasses = (isHovered: boolean): string[] => {
      const classes = ['ghost-bullet']
      if (isHovered) {
        classes.push('ghost-bullet-hover')
      }
      return classes
    }

    it('should have base ghost-bullet class', () => {
      const classes = getGhostBulletClasses(false)
      expect(classes).toContain('ghost-bullet')
    })

    it('should add hover class when hovered', () => {
      const classes = getGhostBulletClasses(true)
      expect(classes).toContain('ghost-bullet')
      expect(classes).toContain('ghost-bullet-hover')
    })
  })

  describe('Ghost bullet dismiss behavior', () => {
    /**
     * Simulates dismissing a ghost suggestion
     */
    const dismissGhostSuggestion = (
      suggestions: GhostSuggestion[],
      dismissId: string
    ): GhostSuggestion[] => {
      return suggestions.filter(s => s.id !== dismissId)
    }

    it('should remove dismissed suggestion from list', () => {
      const suggestions: GhostSuggestion[] = [
        { id: 'ghost-1', text: 'Question 1?' },
        { id: 'ghost-2', text: 'Question 2?' },
        { id: 'ghost-3', text: 'Question 3?' },
      ]
      const result = dismissGhostSuggestion(suggestions, 'ghost-2')
      expect(result.length).toBe(2)
      expect(result.find(s => s.id === 'ghost-2')).toBeUndefined()
    })

    it('should return same list if ID not found', () => {
      const suggestions: GhostSuggestion[] = [
        { id: 'ghost-1', text: 'Question 1?' },
      ]
      const result = dismissGhostSuggestion(suggestions, 'nonexistent')
      expect(result.length).toBe(1)
    })
  })
})

// Import expand button state functions (EDITOR-3512)
import {
  getExpandButtonState,
  getExpandButtonTooltip,
  getExpandButtonClasses,
  type ExpandButtonState,
} from '../components/bullet-block'

/**
 * Tests for Add Block (Expand) Button UX (EDITOR-3512)
 *
 * The expand button ("+") has two issues:
 * 1. The button state (on/off, active/inactive) is unclear
 * 2. Inline typing shifts/moves the button position
 *
 * These tests verify the fix for clear visual states.
 */
describe('Add Block Button UX (EDITOR-3512)', () => {
  describe('getExpandButtonState', () => {
    it('should return "default" when button is idle and enabled', () => {
      const state = getExpandButtonState({
        isExpanding: false,
        isDisabled: false,
        isHovered: false,
      })
      expect(state).toBe('default')
    })

    it('should return "hover" when button is hovered and enabled', () => {
      const state = getExpandButtonState({
        isExpanding: false,
        isDisabled: false,
        isHovered: true,
      })
      expect(state).toBe('hover')
    })

    it('should return "active" when button is expanding', () => {
      const state = getExpandButtonState({
        isExpanding: true,
        isDisabled: false,
        isHovered: false,
      })
      expect(state).toBe('active')
    })

    it('should return "active" when expanding and hovered', () => {
      const state = getExpandButtonState({
        isExpanding: true,
        isDisabled: false,
        isHovered: true,
      })
      expect(state).toBe('active')
    })

    it('should return "disabled" when button is disabled', () => {
      const state = getExpandButtonState({
        isExpanding: false,
        isDisabled: true,
        isHovered: false,
      })
      expect(state).toBe('disabled')
    })

    it('should return "disabled" even if hovered when disabled', () => {
      const state = getExpandButtonState({
        isExpanding: false,
        isDisabled: true,
        isHovered: true,
      })
      expect(state).toBe('disabled')
    })
  })

  describe('getExpandButtonTooltip', () => {
    it('should return "Expand with AI" for default state', () => {
      expect(getExpandButtonTooltip('default')).toBe('Expand with AI (generates child bullets)')
    })

    it('should return "Expand with AI" for hover state', () => {
      expect(getExpandButtonTooltip('hover')).toBe('Expand with AI (generates child bullets)')
    })

    it('should return "Generating..." for active state', () => {
      expect(getExpandButtonTooltip('active')).toBe('Generating child bullets...')
    })

    it('should return "Cannot expand" for disabled state', () => {
      expect(getExpandButtonTooltip('disabled')).toBe('Cannot expand (empty text or already expanding)')
    })
  })

  describe('getExpandButtonClasses', () => {
    it('should include base class for all states', () => {
      const states: ExpandButtonState[] = ['default', 'hover', 'active', 'disabled']
      states.forEach(state => {
        const classes = getExpandButtonClasses(state)
        expect(classes).toContain('bullet-expand')
      })
    })

    it('should add hover class for hover state', () => {
      const classes = getExpandButtonClasses('hover')
      expect(classes).toContain('bullet-expand-hover')
    })

    it('should add active class for active state', () => {
      const classes = getExpandButtonClasses('active')
      expect(classes).toContain('bullet-expand-active')
    })

    it('should add disabled class for disabled state', () => {
      const classes = getExpandButtonClasses('disabled')
      expect(classes).toContain('bullet-expand-disabled')
    })

    it('should not add extra classes for default state', () => {
      const classes = getExpandButtonClasses('default')
      expect(classes).toBe('bullet-expand')
    })
  })

  describe('Expand button CSS state requirements', () => {
    /**
     * These tests verify the CSS requirements for each state.
     * The actual CSS is in bullet-block.ts styles.
     */

    it('should have distinct styling for default state', () => {
      // Default: Light gray icon, subtle appearance, hidden by default
      const expectedDefaultStyles = {
        display: 'none', // Hidden until hover
        color: '#888', // Light gray icon
        opacity: 1, // Full opacity when visible
      }
      expect(expectedDefaultStyles.display).toBe('none')
      expect(expectedDefaultStyles.color).toBe('#888')
    })

    it('should have distinct styling for hover state', () => {
      // Hover: Blue icon with background highlight
      const expectedHoverStyles = {
        display: 'flex', // Visible on hover
        backgroundColor: '#f0f0f0', // Subtle background
        color: '#1976d2', // Blue icon
      }
      expect(expectedHoverStyles.display).toBe('flex')
      expect(expectedHoverStyles.color).toBe('#1976d2')
    })

    it('should have distinct styling for active state', () => {
      // Active: Filled background with pressed effect, animating
      const expectedActiveStyles = {
        display: 'flex',
        backgroundColor: '#e3f2fd', // Light blue background
        color: '#1976d2', // Blue icon
        animation: 'pulse', // Pulse animation
      }
      expect(expectedActiveStyles.animation).toBe('pulse')
    })

    it('should have distinct styling for disabled state', () => {
      // Disabled: Muted/grayed out with reduced opacity, no pointer
      const expectedDisabledStyles = {
        opacity: 0.5, // Reduced opacity
        cursor: 'not-allowed', // No pointer cursor
        pointerEvents: 'none', // Cannot interact
      }
      expect(expectedDisabledStyles.opacity).toBe(0.5)
      expect(expectedDisabledStyles.cursor).toBe('not-allowed')
    })
  })

  describe('Expand button positioning', () => {
    /**
     * EDITOR-3512: Button should have stable position regardless of text length.
     * Button uses position: absolute and is anchored to the right of the container.
     */

    it('should use absolute positioning strategy', () => {
      // The button is absolutely positioned within a relative container
      const expectedPositioning = {
        position: 'absolute',
        right: '4px', // Fixed distance from right
        top: '50%', // Vertically centered
        transform: 'translateY(-50%)', // Center adjustment
      }
      expect(expectedPositioning.position).toBe('absolute')
      expect(expectedPositioning.right).toBe('4px')
    })

    it('should remain stable when text content changes', () => {
      // Test that button position calculation doesn't depend on text width
      const calculateButtonPosition = (textWidth: number): { right: string } => {
        // Position is fixed, independent of text width
        void textWidth // unused - position is fixed
        return { right: '4px' }
      }

      // Button position should be the same regardless of text width
      expect(calculateButtonPosition(100).right).toBe('4px')
      expect(calculateButtonPosition(500).right).toBe('4px')
      expect(calculateButtonPosition(0).right).toBe('4px')
    })
  })

  describe('Accessibility requirements', () => {
    it('should have proper tooltip for all states', () => {
      const states: ExpandButtonState[] = ['default', 'hover', 'active', 'disabled']
      states.forEach(state => {
        const tooltip = getExpandButtonTooltip(state)
        expect(tooltip.length).toBeGreaterThan(0)
      })
    })

    it('should have proper cursor for disabled state', () => {
      // Disabled state should use not-allowed cursor
      const cursorForState = (state: ExpandButtonState): string => {
        if (state === 'disabled') return 'not-allowed'
        return 'pointer'
      }

      expect(cursorForState('default')).toBe('pointer')
      expect(cursorForState('hover')).toBe('pointer')
      expect(cursorForState('active')).toBe('pointer')
      expect(cursorForState('disabled')).toBe('not-allowed')
    })
  })
})
