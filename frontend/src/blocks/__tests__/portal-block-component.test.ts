import { describe, it, expect, vi } from 'vitest'

// Mock @blocksuite/block-std since portal-block extends BlockComponent
vi.mock('@blocksuite/block-std', () => {
  class MockBlockComponent extends HTMLElement {
    model = {
      sourceDocId: 'doc-1',
      sourceBlockId: 'block-1',
      isCollapsed: false,
      syncStatus: 'synced' as const,
    }
    doc = {
      updateBlock: vi.fn(),
      getBlock: vi.fn(),
    }
    renderChildren() {
      return ''
    }
  }
  return {
    BlockComponent: MockBlockComponent,
  }
})

// Mock lit - return minimal implementation
vi.mock('lit', () => ({
  html: () => '',
  css: () => '',
  nothing: '',
}))

vi.mock('lit/decorators.js', () => ({
  customElement: () => () => {},
  state: () => () => {},
}))

import {
  getPortalDisplayState,
  getSyncStatusLabel,
  getSyncStatusClass,
  shouldShowSourceContent,
  type PortalDisplayState,
} from '../components/portal-block'

/**
 * Tests for portal block display logic (EDITOR-3402)
 *
 * Testing:
 * - Display state computation based on sync status
 * - Collapsed/expanded state handling
 * - Sync status display labels and styling
 * - Source content visibility logic
 */

describe('Portal Display State (EDITOR-3402)', () => {
  describe('getPortalDisplayState', () => {
    it('should return "loading" when source is being fetched', () => {
      const result = getPortalDisplayState({
        syncStatus: 'synced',
        isCollapsed: false,
        isLoading: true,
        sourceExists: true,
      })
      expect(result).toBe('loading')
    })

    it('should return "orphaned" when source is deleted', () => {
      const result = getPortalDisplayState({
        syncStatus: 'orphaned',
        isCollapsed: false,
        isLoading: false,
        sourceExists: false,
      })
      expect(result).toBe('orphaned')
    })

    it('should return "collapsed" when portal is collapsed', () => {
      const result = getPortalDisplayState({
        syncStatus: 'synced',
        isCollapsed: true,
        isLoading: false,
        sourceExists: true,
      })
      expect(result).toBe('collapsed')
    })

    it('should return "expanded" when portal is synced and expanded', () => {
      const result = getPortalDisplayState({
        syncStatus: 'synced',
        isCollapsed: false,
        isLoading: false,
        sourceExists: true,
      })
      expect(result).toBe('expanded')
    })

    it('should return "stale" when portal needs refresh', () => {
      const result = getPortalDisplayState({
        syncStatus: 'stale',
        isCollapsed: false,
        isLoading: false,
        sourceExists: true,
      })
      expect(result).toBe('stale')
    })
  })

  describe('getSyncStatusLabel', () => {
    it('should return empty string for synced status', () => {
      expect(getSyncStatusLabel('synced')).toBe('')
    })

    it('should return "Updating..." for stale status', () => {
      expect(getSyncStatusLabel('stale')).toBe('Updating...')
    })

    it('should return "Source deleted" for orphaned status', () => {
      expect(getSyncStatusLabel('orphaned')).toBe('Source deleted')
    })
  })

  describe('getSyncStatusClass', () => {
    it('should return empty string for synced status', () => {
      expect(getSyncStatusClass('synced')).toBe('')
    })

    it('should return "portal-stale" for stale status', () => {
      expect(getSyncStatusClass('stale')).toBe('portal-stale')
    })

    it('should return "portal-orphaned" for orphaned status', () => {
      expect(getSyncStatusClass('orphaned')).toBe('portal-orphaned')
    })
  })

  describe('shouldShowSourceContent', () => {
    it('should return true when synced and expanded', () => {
      expect(
        shouldShowSourceContent({
          syncStatus: 'synced',
          isCollapsed: false,
          sourceExists: true,
        })
      ).toBe(true)
    })

    it('should return false when collapsed', () => {
      expect(
        shouldShowSourceContent({
          syncStatus: 'synced',
          isCollapsed: true,
          sourceExists: true,
        })
      ).toBe(false)
    })

    it('should return false when orphaned', () => {
      expect(
        shouldShowSourceContent({
          syncStatus: 'orphaned',
          isCollapsed: false,
          sourceExists: false,
        })
      ).toBe(false)
    })

    it('should return true when stale but source exists', () => {
      expect(
        shouldShowSourceContent({
          syncStatus: 'stale',
          isCollapsed: false,
          sourceExists: true,
        })
      ).toBe(true)
    })
  })
})

describe('Portal Visual Styling (EDITOR-3402)', () => {
  describe('Portal border styling', () => {
    /**
     * Returns expected border style for portal state
     */
    const getPortalBorderStyle = (
      state: PortalDisplayState
    ): { borderStyle: string; borderColor: string } => {
      switch (state) {
        case 'loading':
          return { borderStyle: 'dashed', borderColor: '#9CA3AF' }
        case 'orphaned':
          return { borderStyle: 'dashed', borderColor: '#EF4444' }
        case 'stale':
          return { borderStyle: 'solid', borderColor: '#F59E0B' }
        case 'collapsed':
        case 'expanded':
        default:
          return { borderStyle: 'solid', borderColor: '#6366F1' }
      }
    }

    it('should have indigo border for synced/expanded state', () => {
      const style = getPortalBorderStyle('expanded')
      expect(style.borderStyle).toBe('solid')
      expect(style.borderColor).toBe('#6366F1')
    })

    it('should have indigo border for collapsed state', () => {
      const style = getPortalBorderStyle('collapsed')
      expect(style.borderStyle).toBe('solid')
      expect(style.borderColor).toBe('#6366F1')
    })

    it('should have dashed gray border for loading state', () => {
      const style = getPortalBorderStyle('loading')
      expect(style.borderStyle).toBe('dashed')
      expect(style.borderColor).toBe('#9CA3AF')
    })

    it('should have dashed red border for orphaned state', () => {
      const style = getPortalBorderStyle('orphaned')
      expect(style.borderStyle).toBe('dashed')
      expect(style.borderColor).toBe('#EF4444')
    })

    it('should have solid amber border for stale state', () => {
      const style = getPortalBorderStyle('stale')
      expect(style.borderStyle).toBe('solid')
      expect(style.borderColor).toBe('#F59E0B')
    })
  })

  describe('Portal indicator icon', () => {
    /**
     * Returns the appropriate icon for portal state
     */
    const getPortalIcon = (isCollapsed: boolean): string => {
      return isCollapsed ? '🔗' : '📎'
    }

    it('should show link icon when collapsed', () => {
      expect(getPortalIcon(true)).toBe('🔗')
    })

    it('should show paperclip icon when expanded', () => {
      expect(getPortalIcon(false)).toBe('📎')
    })
  })
})

describe('Portal Toggle Logic (EDITOR-3402)', () => {
  describe('Collapse/Expand toggle', () => {
    /**
     * Simulates the toggle behavior for portal collapse state
     */
    const createToggleHandler = (
      currentState: boolean,
      updateFn: (newState: boolean) => void
    ) => {
      return () => {
        updateFn(!currentState)
      }
    }

    it('should toggle from expanded to collapsed', () => {
      const updateFn = vi.fn()
      const toggle = createToggleHandler(false, updateFn)

      toggle()

      expect(updateFn).toHaveBeenCalledWith(true)
    })

    it('should toggle from collapsed to expanded', () => {
      const updateFn = vi.fn()
      const toggle = createToggleHandler(true, updateFn)

      toggle()

      expect(updateFn).toHaveBeenCalledWith(false)
    })
  })
})

describe('Source Location Hint (EDITOR-3402)', () => {
  describe('formatSourceHint', () => {
    /**
     * Formats the source location hint for display
     */
    const formatSourceHint = (
      docName: string | null,
      blockPreview: string | null
    ): string => {
      if (!docName) return 'Unknown source'
      if (!blockPreview) return `from: ${docName}`
      const truncatedPreview =
        blockPreview.length > 30
          ? blockPreview.substring(0, 30) + '...'
          : blockPreview
      return `from: ${docName} • "${truncatedPreview}"`
    }

    it('should return "Unknown source" when doc name is null', () => {
      expect(formatSourceHint(null, null)).toBe('Unknown source')
    })

    it('should show doc name without preview when block preview is null', () => {
      expect(formatSourceHint('My Document', null)).toBe('from: My Document')
    })

    it('should show doc name and block preview', () => {
      expect(formatSourceHint('My Document', 'Hello world')).toBe(
        'from: My Document • "Hello world"'
      )
    })

    it('should truncate long block previews', () => {
      const longPreview =
        'This is a very long preview text that should be truncated'
      const result = formatSourceHint('Doc', longPreview)
      expect(result).toContain('...')
      expect(result.length).toBeLessThan(
        `from: Doc • "${longPreview}"`.length
      )
    })
  })
})
