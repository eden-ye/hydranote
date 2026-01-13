import { describe, it, expect } from 'vitest'
import { parseMarkdownShortcut } from '../utils/markdown-shortcuts'

describe('parseMarkdownShortcut', () => {
  describe('checkbox shortcuts', () => {
    it('should parse [] + space as unchecked checkbox', () => {
      const result = parseMarkdownShortcut('[] ')
      expect(result).toEqual({
        blockType: 'checkbox',
        isChecked: false,
        remainingText: '',
      })
    })

    it('should parse [ ] + space as unchecked checkbox', () => {
      const result = parseMarkdownShortcut('[ ] ')
      expect(result).toEqual({
        blockType: 'checkbox',
        isChecked: false,
        remainingText: '',
      })
    })

    it('should parse [x] + space as checked checkbox', () => {
      const result = parseMarkdownShortcut('[x] ')
      expect(result).toEqual({
        blockType: 'checkbox',
        isChecked: true,
        remainingText: '',
      })
    })

    it('should parse [X] + space as checked checkbox (case insensitive)', () => {
      const result = parseMarkdownShortcut('[X] ')
      expect(result).toEqual({
        blockType: 'checkbox',
        isChecked: true,
        remainingText: '',
      })
    })

    it('should preserve remaining text after checkbox shortcut', () => {
      const result = parseMarkdownShortcut('[] Buy groceries')
      expect(result).toEqual({
        blockType: 'checkbox',
        isChecked: false,
        remainingText: 'Buy groceries',
      })
    })
  })

  describe('numbered list shortcuts', () => {
    it('should parse 1. + space as numbered list', () => {
      const result = parseMarkdownShortcut('1. ')
      expect(result).toEqual({
        blockType: 'numbered',
        isChecked: false,
        remainingText: '',
      })
    })

    it('should parse any number followed by . + space as numbered list', () => {
      expect(parseMarkdownShortcut('2. ')).toEqual({
        blockType: 'numbered',
        isChecked: false,
        remainingText: '',
      })
      expect(parseMarkdownShortcut('10. ')).toEqual({
        blockType: 'numbered',
        isChecked: false,
        remainingText: '',
      })
      expect(parseMarkdownShortcut('99. ')).toEqual({
        blockType: 'numbered',
        isChecked: false,
        remainingText: '',
      })
    })

    it('should preserve remaining text after numbered list shortcut', () => {
      const result = parseMarkdownShortcut('1. First item')
      expect(result).toEqual({
        blockType: 'numbered',
        isChecked: false,
        remainingText: 'First item',
      })
    })
  })

  describe('bullet list shortcuts', () => {
    it('should parse - + space as bullet list', () => {
      const result = parseMarkdownShortcut('- ')
      expect(result).toEqual({
        blockType: 'bullet',
        isChecked: false,
        remainingText: '',
      })
    })

    it('should parse * + space as bullet list', () => {
      const result = parseMarkdownShortcut('* ')
      expect(result).toEqual({
        blockType: 'bullet',
        isChecked: false,
        remainingText: '',
      })
    })

    it('should preserve remaining text after bullet shortcut', () => {
      const result = parseMarkdownShortcut('- List item')
      expect(result).toEqual({
        blockType: 'bullet',
        isChecked: false,
        remainingText: 'List item',
      })
    })
  })

  describe('heading shortcuts', () => {
    it('should parse # + space as heading1', () => {
      const result = parseMarkdownShortcut('# ')
      expect(result).toEqual({
        blockType: 'heading1',
        isChecked: false,
        remainingText: '',
      })
    })

    it('should parse ## + space as heading2', () => {
      const result = parseMarkdownShortcut('## ')
      expect(result).toEqual({
        blockType: 'heading2',
        isChecked: false,
        remainingText: '',
      })
    })

    it('should parse ### + space as heading3', () => {
      const result = parseMarkdownShortcut('### ')
      expect(result).toEqual({
        blockType: 'heading3',
        isChecked: false,
        remainingText: '',
      })
    })

    it('should preserve remaining text after heading shortcut', () => {
      const result = parseMarkdownShortcut('# My Heading')
      expect(result).toEqual({
        blockType: 'heading1',
        isChecked: false,
        remainingText: 'My Heading',
      })
    })
  })

  describe('divider shortcut', () => {
    it('should parse --- + space as divider', () => {
      const result = parseMarkdownShortcut('--- ')
      expect(result).toEqual({
        blockType: 'divider',
        isChecked: false,
        remainingText: '',
      })
    })

    it('should parse --- at end of text as divider', () => {
      const result = parseMarkdownShortcut('---')
      expect(result).toEqual({
        blockType: 'divider',
        isChecked: false,
        remainingText: '',
      })
    })
  })

  describe('no match cases', () => {
    it('should return null for empty string', () => {
      expect(parseMarkdownShortcut('')).toBeNull()
    })

    it('should return null for regular text', () => {
      expect(parseMarkdownShortcut('Hello world')).toBeNull()
    })

    it('should return null for incomplete shortcuts', () => {
      expect(parseMarkdownShortcut('[')).toBeNull()
      expect(parseMarkdownShortcut('1')).toBeNull()
      expect(parseMarkdownShortcut('#')).toBeNull()
      expect(parseMarkdownShortcut('-')).toBeNull()
      expect(parseMarkdownShortcut('--')).toBeNull()
    })

    it('should return null for shortcuts without space', () => {
      expect(parseMarkdownShortcut('[]text')).toBeNull()
      expect(parseMarkdownShortcut('1.text')).toBeNull()
      expect(parseMarkdownShortcut('#text')).toBeNull()
    })
  })
})
