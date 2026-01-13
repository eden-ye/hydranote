import { describe, it, expect } from 'vitest'
import { parseDashingSyntax } from '../utils/dashing-button-syntax'

describe('parseDashingSyntax', () => {
  describe('basic dashing button creation', () => {
    it('should parse == + space at end of text', () => {
      const result = parseDashingSyntax('My bullet text== ')
      expect(result).toEqual({
        mainText: 'My bullet text',
        previewText: '',
        hasSpace: true,
      })
    })

    it('should parse == + space with content after', () => {
      const result = parseDashingSyntax('My bullet text== preview content')
      expect(result).toEqual({
        mainText: 'My bullet text',
        previewText: 'preview content',
        hasSpace: true,
      })
    })

    it('should handle whitespace before ==', () => {
      const result = parseDashingSyntax('My bullet text == ')
      expect(result).toEqual({
        mainText: 'My bullet text',
        previewText: '',
        hasSpace: true,
      })
    })
  })

  describe('only one dashing button allowed', () => {
    it('should only parse first == occurrence', () => {
      const result = parseDashingSyntax('Text == preview == more')
      expect(result).toEqual({
        mainText: 'Text',
        previewText: 'preview == more',
        hasSpace: true,
      })
    })

    it('should parse subsequent == as part of preview text', () => {
      // The first == creates the dashing button
      // Any subsequent == in the preview is literal text
      const result = parseDashingSyntax('Text== preview text== more')
      expect(result).toEqual({
        mainText: 'Text',
        previewText: 'preview text== more',
        hasSpace: true,
      })
    })
  })

  describe('no match cases', () => {
    it('should return null for empty string', () => {
      expect(parseDashingSyntax('')).toBeNull()
    })

    it('should return null for text without ==', () => {
      expect(parseDashingSyntax('Hello world')).toBeNull()
    })

    it('should return null for == without space', () => {
      expect(parseDashingSyntax('Text==more')).toBeNull()
    })

    it('should return null for == at start', () => {
      expect(parseDashingSyntax('== text')).toBeNull()
    })

    it('should return null for standalone ==', () => {
      expect(parseDashingSyntax('==')).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('should handle multiple spaces after ==', () => {
      const result = parseDashingSyntax('Text==   preview')
      expect(result).toEqual({
        mainText: 'Text',
        previewText: '  preview',
        hasSpace: true,
      })
    })

    it('should preserve leading/trailing spaces in preview', () => {
      const result = parseDashingSyntax('Text==  preview  ')
      expect(result).toEqual({
        mainText: 'Text',
        previewText: ' preview  ',
        hasSpace: true,
      })
    })

    it('should handle == with only whitespace after', () => {
      const result = parseDashingSyntax('Text==    ')
      expect(result).toEqual({
        mainText: 'Text',
        previewText: '   ',
        hasSpace: true,
      })
    })
  })
})
