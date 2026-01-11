import { describe, it, expect } from 'vitest'
import {
  COLOR_PALETTE,
  getColorById,
  getColorByShortcut,
  isValidColorId,
  getColorCssVar,
  getHighlightStyle,
  HIGHLIGHT_ATTRIBUTE,
} from '../utils/color-palette'

/**
 * Tests for Color Palette System (EDITOR-3101)
 *
 * Testing:
 * - Color palette has exactly 6 colors
 * - Each color has required properties
 * - Lookup functions work correctly
 * - CSS variable generation
 * - Style generation for highlighted text
 */

describe('Color Palette System (EDITOR-3101)', () => {
  describe('COLOR_PALETTE', () => {
    it('should have exactly 6 colors', () => {
      expect(COLOR_PALETTE).toHaveLength(6)
    })

    it('should have unique color IDs', () => {
      const ids = COLOR_PALETTE.map((c) => c.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(6)
    })

    it('should have unique shortcut keys', () => {
      const keys = COLOR_PALETTE.map((c) => c.shortcutKey)
      const uniqueKeys = new Set(keys)
      expect(uniqueKeys.size).toBe(6)
    })

    it('should have shortcut keys 1-6', () => {
      const keys = COLOR_PALETTE.map((c) => c.shortcutKey).sort()
      expect(keys).toEqual(['1', '2', '3', '4', '5', '6'])
    })

    describe('each color should have required properties', () => {
      COLOR_PALETTE.forEach((color) => {
        describe(`${color.name} color`, () => {
          it('should have a non-empty id', () => {
            expect(color.id).toBeTruthy()
            expect(typeof color.id).toBe('string')
          })

          it('should have a non-empty name', () => {
            expect(color.name).toBeTruthy()
            expect(typeof color.name).toBe('string')
          })

          it('should have a valid hex backgroundColor', () => {
            expect(color.backgroundColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
          })

          it('should have a valid hex textColor', () => {
            expect(color.textColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
          })

          it('should have a single character shortcut key', () => {
            expect(color.shortcutKey).toHaveLength(1)
            expect(color.shortcutKey).toMatch(/^[1-6]$/)
          })
        })
      })
    })

    it('should include expected colors', () => {
      const colorIds = COLOR_PALETTE.map((c) => c.id)
      expect(colorIds).toContain('yellow')
      expect(colorIds).toContain('green')
      expect(colorIds).toContain('blue')
      expect(colorIds).toContain('purple')
      expect(colorIds).toContain('pink')
      expect(colorIds).toContain('gray')
    })
  })

  describe('getColorById', () => {
    it('should return color for valid ID', () => {
      const yellow = getColorById('yellow')
      expect(yellow).toBeDefined()
      expect(yellow?.name).toBe('Yellow')
    })

    it('should return undefined for invalid ID', () => {
      const invalid = getColorById('nonexistent')
      expect(invalid).toBeUndefined()
    })

    it('should return correct color properties', () => {
      const blue = getColorById('blue')
      expect(blue?.backgroundColor).toBe('#DBEAFE')
      expect(blue?.textColor).toBe('#1E40AF')
    })
  })

  describe('getColorByShortcut', () => {
    it('should return color for valid shortcut key', () => {
      const color1 = getColorByShortcut('1')
      expect(color1).toBeDefined()
      expect(color1?.id).toBe('yellow')
    })

    it('should return undefined for invalid shortcut key', () => {
      const invalid = getColorByShortcut('9')
      expect(invalid).toBeUndefined()
    })

    it('should map all shortcuts 1-6 to colors', () => {
      for (let i = 1; i <= 6; i++) {
        const color = getColorByShortcut(String(i))
        expect(color).toBeDefined()
      }
    })
  })

  describe('isValidColorId', () => {
    it('should return true for valid color IDs', () => {
      expect(isValidColorId('yellow')).toBe(true)
      expect(isValidColorId('green')).toBe(true)
      expect(isValidColorId('blue')).toBe(true)
      expect(isValidColorId('purple')).toBe(true)
      expect(isValidColorId('pink')).toBe(true)
      expect(isValidColorId('gray')).toBe(true)
    })

    it('should return false for invalid color IDs', () => {
      expect(isValidColorId('red')).toBe(false)
      expect(isValidColorId('orange')).toBe(false)
      expect(isValidColorId('')).toBe(false)
      expect(isValidColorId('YELLOW')).toBe(false)
    })
  })

  describe('getColorCssVar', () => {
    it('should generate correct CSS variable name for background', () => {
      expect(getColorCssVar('yellow', 'bg')).toBe('--hydra-highlight-yellow-bg')
      expect(getColorCssVar('blue', 'bg')).toBe('--hydra-highlight-blue-bg')
    })

    it('should generate correct CSS variable name for text', () => {
      expect(getColorCssVar('yellow', 'text')).toBe('--hydra-highlight-yellow-text')
      expect(getColorCssVar('green', 'text')).toBe('--hydra-highlight-green-text')
    })
  })

  describe('getHighlightStyle', () => {
    it('should return styles for valid color ID', () => {
      const style = getHighlightStyle('yellow')
      expect(style).not.toBeNull()
      expect(style?.backgroundColor).toBe('#FEF3C7')
      expect(style?.color).toBe('#92400E')
    })

    it('should return null for invalid color ID', () => {
      const style = getHighlightStyle('nonexistent')
      expect(style).toBeNull()
    })

    it('should return correct styles for all colors', () => {
      COLOR_PALETTE.forEach((color) => {
        const style = getHighlightStyle(color.id)
        expect(style).not.toBeNull()
        expect(style?.backgroundColor).toBe(color.backgroundColor)
        expect(style?.color).toBe(color.textColor)
      })
    })
  })

  describe('HIGHLIGHT_ATTRIBUTE', () => {
    it('should be a valid data attribute name', () => {
      expect(HIGHLIGHT_ATTRIBUTE).toBe('data-v-highlight')
      expect(HIGHLIGHT_ATTRIBUTE).toMatch(/^data-/)
    })
  })

  describe('Color contrast', () => {
    it('should have sufficient contrast between background and text', () => {
      // Simple check: background should be light (high hex values), text should be dark (low hex values)
      COLOR_PALETTE.forEach((color) => {
        const bgValue = parseInt(color.backgroundColor.slice(1, 3), 16)
        const textValue = parseInt(color.textColor.slice(1, 3), 16)
        // Background should have higher red channel value than text (lighter)
        expect(bgValue).toBeGreaterThan(textValue)
      })
    })
  })
})
