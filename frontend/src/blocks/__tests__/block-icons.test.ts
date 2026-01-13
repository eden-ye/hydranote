import { describe, it, expect } from 'vitest'
import {
  getBulletMarker,
  getBlockTypeIcon,
  BULLET_MARKERS,
} from '../utils/block-icons'

describe('getBulletMarker', () => {
  it('should return bullet marker for depth 0', () => {
    expect(getBulletMarker(0)).toBe('•')
  })

  it('should return circle marker for depth 1', () => {
    expect(getBulletMarker(1)).toBe('◦')
  })

  it('should return filled square marker for depth 2', () => {
    expect(getBulletMarker(2)).toBe('▪')
  })

  it('should return empty square marker for depth 3', () => {
    expect(getBulletMarker(3)).toBe('▫')
  })

  it('should cycle back to bullet for depth 4', () => {
    expect(getBulletMarker(4)).toBe('•')
  })

  it('should cycle correctly for deep nesting', () => {
    expect(getBulletMarker(5)).toBe('◦')
    expect(getBulletMarker(6)).toBe('▪')
    expect(getBulletMarker(7)).toBe('▫')
    expect(getBulletMarker(8)).toBe('•')
  })
})

describe('BULLET_MARKERS', () => {
  it('should have 4 different markers', () => {
    expect(BULLET_MARKERS).toHaveLength(4)
  })

  it('should contain all expected markers', () => {
    expect(BULLET_MARKERS).toContain('•')
    expect(BULLET_MARKERS).toContain('◦')
    expect(BULLET_MARKERS).toContain('▪')
    expect(BULLET_MARKERS).toContain('▫')
  })
})

describe('getBlockTypeIcon', () => {
  describe('checkbox icons', () => {
    it('should return empty checkbox SVG for unchecked', () => {
      const icon = getBlockTypeIcon('checkbox', false)
      expect(icon).toContain('svg')
      expect(icon).toContain('rect')
    })

    it('should return checked checkbox SVG for checked', () => {
      const icon = getBlockTypeIcon('checkbox', true)
      expect(icon).toContain('svg')
      expect(icon).toContain('polyline') // checkmark
    })
  })

  describe('numbered list icon', () => {
    it('should return number prefix', () => {
      const icon = getBlockTypeIcon('numbered', false, 1)
      expect(icon).toBe('1.')
    })

    it('should return correct number for different positions', () => {
      expect(getBlockTypeIcon('numbered', false, 2)).toBe('2.')
      expect(getBlockTypeIcon('numbered', false, 10)).toBe('10.')
      expect(getBlockTypeIcon('numbered', false, 99)).toBe('99.')
    })

    it('should default to 1. if no number provided', () => {
      expect(getBlockTypeIcon('numbered', false)).toBe('1.')
    })
  })

  describe('bullet icon', () => {
    it('should return bullet marker for depth 0', () => {
      const icon = getBlockTypeIcon('bullet', false, undefined, 0)
      expect(icon).toBe('•')
    })

    it('should return appropriate marker for different depths', () => {
      expect(getBlockTypeIcon('bullet', false, undefined, 1)).toBe('◦')
      expect(getBlockTypeIcon('bullet', false, undefined, 2)).toBe('▪')
      expect(getBlockTypeIcon('bullet', false, undefined, 3)).toBe('▫')
    })
  })

  describe('heading icons', () => {
    it('should return H1 for heading1', () => {
      expect(getBlockTypeIcon('heading1', false)).toBe('H1')
    })

    it('should return H2 for heading2', () => {
      expect(getBlockTypeIcon('heading2', false)).toBe('H2')
    })

    it('should return H3 for heading3', () => {
      expect(getBlockTypeIcon('heading3', false)).toBe('H3')
    })
  })

  describe('divider', () => {
    it('should return empty string for divider', () => {
      expect(getBlockTypeIcon('divider', false)).toBe('')
    })
  })
})
