/**
 * Tests for Auto AI Summarize feature (EDITOR-3704)
 *
 * Tests cover:
 * - Word count calculation
 * - Notation generation thresholds
 * - Notation caching
 * - Settings integration
 */
import { describe, it, expect, beforeEach } from 'vitest'

// Import functions to test (will be created)
import {
  countWords,
  shouldGenerateNotation,
  extractNotationFromText,
  buildNotationPrompt,
  type NotationConfig,
  type NotationCache,
  createNotationCache,
  getCachedNotation,
  setCachedNotation,
} from '../utils/auto-summarize'

describe('Auto Summarize - Word Count', () => {
  describe('countWords', () => {
    it('should return 0 for empty string', () => {
      expect(countWords('')).toBe(0)
    })

    it('should return 0 for whitespace only', () => {
      expect(countWords('   ')).toBe(0)
      expect(countWords('\n\t')).toBe(0)
    })

    it('should count single word', () => {
      expect(countWords('hello')).toBe(1)
    })

    it('should count multiple words', () => {
      expect(countWords('hello world')).toBe(2)
      expect(countWords('one two three four five')).toBe(5)
    })

    it('should handle extra whitespace', () => {
      expect(countWords('  hello   world  ')).toBe(2)
    })

    it('should handle punctuation as part of words', () => {
      expect(countWords('hello, world!')).toBe(2)
    })

    it('should count 30+ word texts correctly', () => {
      const text = Array(35).fill('word').join(' ')
      expect(countWords(text)).toBe(35)
    })
  })
})

describe('Auto Summarize - Threshold Logic', () => {
  describe('shouldGenerateNotation', () => {
    const defaultConfig: NotationConfig = {
      enabled: true,
      wordThreshold: 30,
    }

    it('should return false when feature is disabled', () => {
      const config = { ...defaultConfig, enabled: false }
      const text = Array(35).fill('word').join(' ')
      expect(shouldGenerateNotation(text, config)).toBe(false)
    })

    it('should return false when text is below threshold', () => {
      const text = 'short text'
      expect(shouldGenerateNotation(text, defaultConfig)).toBe(false)
    })

    it('should return false when text is exactly at threshold', () => {
      const text = Array(30).fill('word').join(' ')
      expect(shouldGenerateNotation(text, defaultConfig)).toBe(false)
    })

    it('should return true when text exceeds threshold', () => {
      const text = Array(31).fill('word').join(' ')
      expect(shouldGenerateNotation(text, defaultConfig)).toBe(true)
    })

    it('should respect custom threshold', () => {
      const config = { ...defaultConfig, wordThreshold: 20 }
      const text = Array(21).fill('word').join(' ')
      expect(shouldGenerateNotation(text, config)).toBe(true)
    })

    it('should return false for empty text', () => {
      expect(shouldGenerateNotation('', defaultConfig)).toBe(false)
    })
  })
})

describe('Auto Summarize - Notation Extraction', () => {
  describe('extractNotationFromText', () => {
    it('should return null for text without notation', () => {
      expect(extractNotationFromText('regular text')).toBeNull()
    })

    it('should extract notation before dash separator', () => {
      expect(extractNotationFromText('Key concept — longer explanation follows here'))
        .toBe('Key concept')
    })

    it('should trim whitespace from extracted notation', () => {
      expect(extractNotationFromText('  Notation  — rest of text'))
        .toBe('Notation')
    })

    it('should return null if notation is empty before dash', () => {
      expect(extractNotationFromText('— just text after dash')).toBeNull()
    })

    it('should handle em-dash (—) separator', () => {
      expect(extractNotationFromText('Summary — full content'))
        .toBe('Summary')
    })

    it('should handle en-dash (–) separator', () => {
      expect(extractNotationFromText('Summary – full content'))
        .toBe('Summary')
    })

    it('should handle double-hyphen separator', () => {
      expect(extractNotationFromText('Summary -- full content'))
        .toBe('Summary')
    })
  })
})

describe('Auto Summarize - Prompt Building', () => {
  describe('buildNotationPrompt', () => {
    it('should generate prompt with text content', () => {
      const text = 'This is a long text that needs to be summarized into key concepts'
      const prompt = buildNotationPrompt(text)
      expect(prompt).toContain(text)
    })

    it('should specify 5 word limit in prompt', () => {
      const prompt = buildNotationPrompt('some text')
      expect(prompt).toMatch(/5 words|five words|<5 words/i)
    })

    it('should request key concepts', () => {
      const prompt = buildNotationPrompt('some text')
      expect(prompt).toMatch(/key\s*(words?|concepts?)/i)
    })
  })
})

describe('Auto Summarize - Notation Cache', () => {
  let cache: NotationCache

  beforeEach(() => {
    cache = createNotationCache()
  })

  describe('createNotationCache', () => {
    it('should create empty cache', () => {
      expect(cache).toBeDefined()
      expect(getCachedNotation(cache, 'any-id')).toBeNull()
    })
  })

  describe('getCachedNotation / setCachedNotation', () => {
    it('should return null for uncached block', () => {
      expect(getCachedNotation(cache, 'block-1')).toBeNull()
    })

    it('should return cached notation for block', () => {
      setCachedNotation(cache, 'block-1', 'Key concept', 'original text hash')
      expect(getCachedNotation(cache, 'block-1')).toBe('Key concept')
    })

    it('should return null if text hash changed', () => {
      setCachedNotation(cache, 'block-1', 'Key concept', 'hash-1')
      expect(getCachedNotation(cache, 'block-1', 'hash-2')).toBeNull()
    })

    it('should return cached value if text hash matches', () => {
      setCachedNotation(cache, 'block-1', 'Key concept', 'same-hash')
      expect(getCachedNotation(cache, 'block-1', 'same-hash')).toBe('Key concept')
    })

    it('should handle multiple blocks independently', () => {
      setCachedNotation(cache, 'block-1', 'Notation 1', 'hash-1')
      setCachedNotation(cache, 'block-2', 'Notation 2', 'hash-2')
      expect(getCachedNotation(cache, 'block-1', 'hash-1')).toBe('Notation 1')
      expect(getCachedNotation(cache, 'block-2', 'hash-2')).toBe('Notation 2')
    })

    it('should overwrite existing notation', () => {
      setCachedNotation(cache, 'block-1', 'Old notation', 'hash-1')
      setCachedNotation(cache, 'block-1', 'New notation', 'hash-2')
      expect(getCachedNotation(cache, 'block-1', 'hash-2')).toBe('New notation')
    })
  })
})
