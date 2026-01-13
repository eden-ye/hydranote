import { describe, it, expect } from 'vitest'
import {
  filterMenuItems,
  SLASH_MENU_ITEMS,
  getMenuItemByBlockType,
} from '../utils/slash-menu'

describe('SLASH_MENU_ITEMS', () => {
  it('should contain all required block types', () => {
    const types = SLASH_MENU_ITEMS.map(item => item.blockType)
    expect(types).toContain('bullet')
    expect(types).toContain('numbered')
    expect(types).toContain('checkbox')
    expect(types).toContain('heading1')
    expect(types).toContain('heading2')
    expect(types).toContain('heading3')
    expect(types).toContain('divider')
  })

  it('should have proper labels for each item', () => {
    const bulletItem = SLASH_MENU_ITEMS.find(i => i.blockType === 'bullet')
    expect(bulletItem?.label).toBe('Bullet List')

    const numberedItem = SLASH_MENU_ITEMS.find(i => i.blockType === 'numbered')
    expect(numberedItem?.label).toBe('Numbered List')

    const checkboxItem = SLASH_MENU_ITEMS.find(i => i.blockType === 'checkbox')
    expect(checkboxItem?.label).toBe('Checkbox')

    const heading1Item = SLASH_MENU_ITEMS.find(i => i.blockType === 'heading1')
    expect(heading1Item?.label).toBe('Heading 1')

    const heading2Item = SLASH_MENU_ITEMS.find(i => i.blockType === 'heading2')
    expect(heading2Item?.label).toBe('Heading 2')

    const heading3Item = SLASH_MENU_ITEMS.find(i => i.blockType === 'heading3')
    expect(heading3Item?.label).toBe('Heading 3')

    const dividerItem = SLASH_MENU_ITEMS.find(i => i.blockType === 'divider')
    expect(dividerItem?.label).toBe('Divider')
  })

  it('should have icons for each item', () => {
    SLASH_MENU_ITEMS.forEach(item => {
      expect(item.icon).toBeDefined()
      expect(typeof item.icon).toBe('string')
    })
  })

  it('should have shortcuts for each item', () => {
    SLASH_MENU_ITEMS.forEach(item => {
      expect(item.shortcut).toBeDefined()
      expect(typeof item.shortcut).toBe('string')
    })
  })
})

describe('filterMenuItems', () => {
  it('should return all items for empty query', () => {
    const result = filterMenuItems('')
    expect(result).toHaveLength(SLASH_MENU_ITEMS.length)
  })

  it('should filter by label (case insensitive)', () => {
    const result = filterMenuItems('bullet')
    expect(result.some(i => i.blockType === 'bullet')).toBe(true)
  })

  it('should filter by partial match', () => {
    const result = filterMenuItems('head')
    expect(result.some(i => i.blockType === 'heading1')).toBe(true)
    expect(result.some(i => i.blockType === 'heading2')).toBe(true)
    expect(result.some(i => i.blockType === 'heading3')).toBe(true)
  })

  it('should return empty array for no matches', () => {
    const result = filterMenuItems('xyz123')
    expect(result).toHaveLength(0)
  })

  it('should match against blockType as well', () => {
    const result = filterMenuItems('numbered')
    expect(result.some(i => i.blockType === 'numbered')).toBe(true)
  })

  it('should handle single character queries', () => {
    const result = filterMenuItems('b')
    expect(result.some(i => i.blockType === 'bullet')).toBe(true)
  })

  it('should be case insensitive', () => {
    const lowerResult = filterMenuItems('bullet')
    const upperResult = filterMenuItems('BULLET')
    const mixedResult = filterMenuItems('BuLlEt')

    expect(lowerResult).toEqual(upperResult)
    expect(lowerResult).toEqual(mixedResult)
  })
})

describe('getMenuItemByBlockType', () => {
  it('should return the correct item for each block type', () => {
    expect(getMenuItemByBlockType('bullet')?.label).toBe('Bullet List')
    expect(getMenuItemByBlockType('numbered')?.label).toBe('Numbered List')
    expect(getMenuItemByBlockType('checkbox')?.label).toBe('Checkbox')
    expect(getMenuItemByBlockType('heading1')?.label).toBe('Heading 1')
    expect(getMenuItemByBlockType('heading2')?.label).toBe('Heading 2')
    expect(getMenuItemByBlockType('heading3')?.label).toBe('Heading 3')
    expect(getMenuItemByBlockType('divider')?.label).toBe('Divider')
  })

  it('should return undefined for unknown block type', () => {
    expect(getMenuItemByBlockType('unknown' as any)).toBeUndefined()
  })
})
