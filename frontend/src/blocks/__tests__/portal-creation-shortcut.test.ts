/**
 * Tests for Portal Creation Keyboard Shortcut (EDITOR-3405)
 *
 * Tests the Cmd+Shift+P (Mac) / Ctrl+Shift+P (Windows/Linux) shortcut for creating portals.
 */
import { describe, it, expect } from 'vitest'
import { isPortalCreationShortcut } from '../utils/portal-creation-shortcut'

describe('Portal Creation Shortcut', () => {
  describe('isPortalCreationShortcut', () => {
    it('should detect Cmd+Shift+P on Mac', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'p',
        metaKey: true,
        shiftKey: true,
        ctrlKey: false,
        altKey: false,
      })
      expect(isPortalCreationShortcut(event)).toBe(true)
    })

    it('should detect Ctrl+Shift+P on Windows/Linux', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'p',
        metaKey: false,
        shiftKey: true,
        ctrlKey: true,
        altKey: false,
      })
      expect(isPortalCreationShortcut(event)).toBe(true)
    })

    it('should be case-insensitive for P key', () => {
      const upperCase = new KeyboardEvent('keydown', {
        key: 'P',
        metaKey: true,
        shiftKey: true,
      })
      const lowerCase = new KeyboardEvent('keydown', {
        key: 'p',
        metaKey: true,
        shiftKey: true,
      })
      expect(isPortalCreationShortcut(upperCase)).toBe(true)
      expect(isPortalCreationShortcut(lowerCase)).toBe(true)
    })

    it('should reject Cmd+P without Shift', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'p',
        metaKey: true,
        shiftKey: false,
      })
      expect(isPortalCreationShortcut(event)).toBe(false)
    })

    it('should reject Shift+P without Cmd/Ctrl', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'p',
        metaKey: false,
        shiftKey: true,
        ctrlKey: false,
      })
      expect(isPortalCreationShortcut(event)).toBe(false)
    })

    it('should reject other keys with Cmd+Shift', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        metaKey: true,
        shiftKey: true,
      })
      expect(isPortalCreationShortcut(event)).toBe(false)
    })

    it('should reject when Alt key is pressed', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'p',
        metaKey: true,
        shiftKey: true,
        altKey: true,
      })
      expect(isPortalCreationShortcut(event)).toBe(false)
    })

    it('should work with both Cmd and Ctrl pressed simultaneously', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'p',
        metaKey: true,
        ctrlKey: true,
        shiftKey: true,
      })
      expect(isPortalCreationShortcut(event)).toBe(true)
    })
  })
})
