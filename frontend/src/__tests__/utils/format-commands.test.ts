/**
 * Tests for Format Commands Utilities
 * EDITOR-3506: Inline Text Formatting Toolbar
 */
import { describe, it, expect } from 'vitest'
import {
  HIGHLIGHT_COLORS,
  TEXT_FORMAT_CONFIGS,
  isFormatActive,
  getToggleValue,
  getFormatStyles,
} from '@/utils/format-commands'

describe('Format Commands Utilities (EDITOR-3506)', () => {
  describe('HIGHLIGHT_COLORS', () => {
    it('should define all 9 colors', () => {
      const expectedColors = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'grey']
      expectedColors.forEach((color) => {
        expect(HIGHLIGHT_COLORS).toHaveProperty(color)
      })
    })

    it('should have color property for each highlight color', () => {
      expect(HIGHLIGHT_COLORS.red.color).toBeDefined()
      expect(HIGHLIGHT_COLORS.yellow.color).toBeDefined()
      expect(HIGHLIGHT_COLORS.blue.color).toBeDefined()
    })

    it('should have background property for each highlight color', () => {
      expect(HIGHLIGHT_COLORS.red.background).toBeDefined()
      expect(HIGHLIGHT_COLORS.yellow.background).toBeDefined()
      expect(HIGHLIGHT_COLORS.blue.background).toBeDefined()
    })

    it('should use CSS variables for colors', () => {
      // Colors should be CSS variables like var(--affine-text-highlight-foreground-red)
      expect(HIGHLIGHT_COLORS.red.color).toMatch(/var\(--/)
      expect(HIGHLIGHT_COLORS.red.background).toMatch(/var\(--/)
    })
  })

  describe('TEXT_FORMAT_CONFIGS', () => {
    it('should define bold config', () => {
      const boldConfig = TEXT_FORMAT_CONFIGS.find((c) => c.id === 'bold')
      expect(boldConfig).toBeDefined()
      expect(boldConfig?.name).toBe('Bold')
      expect(boldConfig?.styleKey).toBe('bold')
      expect(boldConfig?.hotkey).toMatch(/b/i)
    })

    it('should define italic config', () => {
      const italicConfig = TEXT_FORMAT_CONFIGS.find((c) => c.id === 'italic')
      expect(italicConfig).toBeDefined()
      expect(italicConfig?.name).toBe('Italic')
      expect(italicConfig?.styleKey).toBe('italic')
      expect(italicConfig?.hotkey).toMatch(/i/i)
    })

    it('should define underline config', () => {
      const underlineConfig = TEXT_FORMAT_CONFIGS.find((c) => c.id === 'underline')
      expect(underlineConfig).toBeDefined()
      expect(underlineConfig?.name).toBe('Underline')
      expect(underlineConfig?.styleKey).toBe('underline')
      expect(underlineConfig?.hotkey).toMatch(/u/i)
    })

    it('should define strike config', () => {
      const strikeConfig = TEXT_FORMAT_CONFIGS.find((c) => c.id === 'strike')
      expect(strikeConfig).toBeDefined()
      expect(strikeConfig?.name).toBe('Strikethrough')
      expect(strikeConfig?.styleKey).toBe('strike')
    })

    it('should have 4 format configs', () => {
      expect(TEXT_FORMAT_CONFIGS).toHaveLength(4)
    })

    it('should have icon component for each config', () => {
      TEXT_FORMAT_CONFIGS.forEach((config) => {
        expect(config.icon).toBeDefined()
      })
    })
  })

  describe('isFormatActive', () => {
    it('should return true when format is active in current format', () => {
      const currentFormat = { bold: true, italic: false }
      expect(isFormatActive(currentFormat, 'bold')).toBe(true)
    })

    it('should return false when format is not active', () => {
      const currentFormat = { bold: false, italic: false }
      expect(isFormatActive(currentFormat, 'bold')).toBe(false)
    })

    it('should return false when format key is not present', () => {
      const currentFormat = { italic: true }
      expect(isFormatActive(currentFormat, 'bold')).toBe(false)
    })

    it('should return false for null or undefined format', () => {
      expect(isFormatActive(null, 'bold')).toBe(false)
      expect(isFormatActive(undefined, 'bold')).toBe(false)
    })

    it('should handle color format correctly', () => {
      const currentFormat = { color: 'var(--text-red)' }
      expect(isFormatActive(currentFormat, 'color')).toBe(true)
    })

    it('should handle background format correctly', () => {
      const currentFormat = { background: 'var(--bg-yellow)' }
      expect(isFormatActive(currentFormat, 'background')).toBe(true)
    })
  })

  describe('getToggleValue', () => {
    it('should return true when format is currently inactive (toggle on)', () => {
      const isActive = false
      expect(getToggleValue(isActive)).toBe(true)
    })

    it('should return null when format is currently active (toggle off)', () => {
      const isActive = true
      expect(getToggleValue(isActive)).toBe(null)
    })
  })

  describe('getFormatStyles', () => {
    it('should return correct style object for bold', () => {
      const styles = getFormatStyles('bold', true)
      expect(styles).toEqual({ bold: true })
    })

    it('should return null value style object for toggling off', () => {
      const styles = getFormatStyles('italic', null)
      expect(styles).toEqual({ italic: null })
    })

    it('should return style object for color', () => {
      const colorValue = 'var(--text-red)'
      const styles = getFormatStyles('color', colorValue)
      expect(styles).toEqual({ color: colorValue })
    })

    it('should return style object for background', () => {
      const bgValue = 'var(--bg-yellow)'
      const styles = getFormatStyles('background', bgValue)
      expect(styles).toEqual({ background: bgValue })
    })

    it('should handle underline', () => {
      const styles = getFormatStyles('underline', true)
      expect(styles).toEqual({ underline: true })
    })

    it('should handle strike', () => {
      const styles = getFormatStyles('strike', true)
      expect(styles).toEqual({ strike: true })
    })
  })

  describe('Color Name Mappings', () => {
    it('should map color names to CSS variables correctly', () => {
      // Verify the mapping is consistent
      expect(HIGHLIGHT_COLORS.red.name).toBe('Red')
      expect(HIGHLIGHT_COLORS.yellow.name).toBe('Yellow')
      expect(HIGHLIGHT_COLORS.blue.name).toBe('Blue')
      expect(HIGHLIGHT_COLORS.green.name).toBe('Green')
      expect(HIGHLIGHT_COLORS.purple.name).toBe('Purple')
      expect(HIGHLIGHT_COLORS.orange.name).toBe('Orange')
      expect(HIGHLIGHT_COLORS.teal.name).toBe('Teal')
      expect(HIGHLIGHT_COLORS.grey.name).toBe('Grey')
    })
  })
})
