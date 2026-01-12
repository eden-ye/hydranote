/**
 * Unit Tests for Context Path Generation (EDITOR-3409)
 *
 * Tests the context path display for search results:
 * - Shows up to 3 ancestor levels
 * - Truncates with "..." for long paths
 * - Marks current bullet with *
 */
import { describe, it, expect } from 'vitest'
import {
  generateContextPath,
  truncateMiddle,
  getBlockText,
  type BlockNode,
} from '@/utils/context-path'

describe('generateContextPath', () => {
  it('should return just the current bullet text with * marker when no ancestors', () => {
    const block: BlockNode = {
      id: 'block-1',
      flavour: 'hydra:bullet',
      text: 'Current bullet',
      parent: null,
    }

    const path = generateContextPath(block)
    expect(path).toBe('*Current bullet')
  })

  it('should include parent in path', () => {
    const parent: BlockNode = {
      id: 'parent-1',
      flavour: 'hydra:bullet',
      text: 'Parent',
      parent: null,
    }

    const block: BlockNode = {
      id: 'block-1',
      flavour: 'hydra:bullet',
      text: 'Child',
      parent,
    }

    const path = generateContextPath(block)
    expect(path).toBe('Parent / *Child')
  })

  it('should include up to 3 ancestors', () => {
    const grandparent: BlockNode = {
      id: 'gp-1',
      flavour: 'hydra:bullet',
      text: 'Grandparent',
      parent: null,
    }

    const parent: BlockNode = {
      id: 'p-1',
      flavour: 'hydra:bullet',
      text: 'Parent',
      parent: grandparent,
    }

    const block: BlockNode = {
      id: 'b-1',
      flavour: 'hydra:bullet',
      text: 'Child',
      parent,
    }

    const path = generateContextPath(block)
    expect(path).toBe('Grandparent / Parent / *Child')
  })

  it('should truncate with "..." for more than 3 ancestors', () => {
    const greatGrandparent: BlockNode = {
      id: 'ggp-1',
      flavour: 'hydra:bullet',
      text: 'GreatGrandparent',
      parent: null,
    }

    const grandparent: BlockNode = {
      id: 'gp-1',
      flavour: 'hydra:bullet',
      text: 'Grandparent',
      parent: greatGrandparent,
    }

    const parent: BlockNode = {
      id: 'p-1',
      flavour: 'hydra:bullet',
      text: 'Parent',
      parent: grandparent,
    }

    const block: BlockNode = {
      id: 'b-1',
      flavour: 'hydra:bullet',
      text: 'Child',
      parent,
    }

    const path = generateContextPath(block)
    expect(path).toContain('...')
    expect(path).toContain('*Child')
  })

  it('should skip non-bullet ancestors (like page blocks)', () => {
    const page: BlockNode = {
      id: 'page-1',
      flavour: 'affine:page',
      text: 'Page Title',
      parent: null,
    }

    const block: BlockNode = {
      id: 'b-1',
      flavour: 'hydra:bullet',
      text: 'Bullet',
      parent: page,
    }

    const path = generateContextPath(block)
    expect(path).toBe('*Bullet')
    expect(path).not.toContain('Page Title')
  })

  it('should handle empty bullet text', () => {
    const block: BlockNode = {
      id: 'block-1',
      flavour: 'hydra:bullet',
      text: '',
      parent: null,
    }

    const path = generateContextPath(block)
    expect(path).toBe('*')
  })
})

describe('truncateMiddle', () => {
  it('should return original if within maxLength', () => {
    const parts = ['Part1', 'Part2']
    const result = truncateMiddle(parts, 60)
    expect(result).toBe('Part1 / Part2')
  })

  it('should truncate middle parts for long paths', () => {
    const parts = ['Grandparent', 'Parent', 'Child', '*Current']
    const result = truncateMiddle(parts, 30)
    expect(result).toContain('...')
    expect(result).toContain('Grandparent')
    expect(result).toContain('*Current')
  })

  it('should show first and last parts when truncating', () => {
    const parts = ['A', 'B', 'C', 'D', 'E', 'F']
    const result = truncateMiddle(parts, 20)
    expect(result.startsWith('A')).toBe(true)
    expect(result.endsWith('F')).toBe(true)
    expect(result).toContain('...')
  })

  it('should handle single part', () => {
    const result = truncateMiddle(['OnlyPart'], 60)
    expect(result).toBe('OnlyPart')
  })

  it('should handle empty array', () => {
    const result = truncateMiddle([], 60)
    expect(result).toBe('')
  })
})

describe('getBlockText', () => {
  it('should extract text from bullet block', () => {
    const block: BlockNode = {
      id: 'b-1',
      flavour: 'hydra:bullet',
      text: 'Bullet text',
      parent: null,
    }

    expect(getBlockText(block)).toBe('Bullet text')
  })

  it('should return empty string for non-bullet blocks', () => {
    const block: BlockNode = {
      id: 'p-1',
      flavour: 'affine:page',
      text: 'Page text',
      parent: null,
    }

    expect(getBlockText(block)).toBe('')
  })

  it('should handle undefined text', () => {
    const block: BlockNode = {
      id: 'b-1',
      flavour: 'hydra:bullet',
      text: undefined as unknown as string,
      parent: null,
    }

    expect(getBlockText(block)).toBe('')
  })
})
