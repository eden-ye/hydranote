/**
 * Tests for Portal Slash Command (EDITOR-3405)
 *
 * Tests the /portal slash command for creating portals.
 */
import { describe, it, expect } from 'vitest'
import { isPortalSlashCommand, removePortalSlashCommand } from '../utils/portal-slash-command'

describe('Portal Slash Command', () => {
  describe('isPortalSlashCommand', () => {
    it('should detect /portal command', () => {
      expect(isPortalSlashCommand('/portal')).toBe(true)
    })

    it('should detect /portal with trailing space', () => {
      expect(isPortalSlashCommand('/portal ')).toBe(true)
    })

    it('should detect /portal at start of text', () => {
      expect(isPortalSlashCommand('/portal some other text')).toBe(true)
    })

    it('should be case-insensitive', () => {
      expect(isPortalSlashCommand('/PORTAL')).toBe(true)
      expect(isPortalSlashCommand('/Portal')).toBe(true)
      expect(isPortalSlashCommand('/PoRtAl')).toBe(true)
    })

    it('should detect partial matches', () => {
      expect(isPortalSlashCommand('/p')).toBe(true)
      expect(isPortalSlashCommand('/po')).toBe(true)
      expect(isPortalSlashCommand('/por')).toBe(true)
      expect(isPortalSlashCommand('/port')).toBe(true)
      expect(isPortalSlashCommand('/porta')).toBe(true)
    })

    it('should reject non-matching commands', () => {
      expect(isPortalSlashCommand('/desc')).toBe(false)
      expect(isPortalSlashCommand('/what')).toBe(false)
      expect(isPortalSlashCommand('/link')).toBe(false)
    })

    it('should reject slash in middle of text', () => {
      expect(isPortalSlashCommand('some /portal text')).toBe(false)
    })

    it('should reject empty string', () => {
      expect(isPortalSlashCommand('')).toBe(false)
    })

    it('should reject just slash', () => {
      expect(isPortalSlashCommand('/')).toBe(false)
    })

    it('should handle whitespace before slash', () => {
      expect(isPortalSlashCommand('  /portal')).toBe(false)
    })
  })

  describe('removePortalSlashCommand', () => {
    it('should remove /portal from start of text', () => {
      expect(removePortalSlashCommand('/portal')).toBe('')
    })

    it('should remove /portal and preserve trailing text', () => {
      expect(removePortalSlashCommand('/portal some text')).toBe(' some text')
    })

    it('should remove partial command', () => {
      expect(removePortalSlashCommand('/p')).toBe('')
      expect(removePortalSlashCommand('/po')).toBe('')
      expect(removePortalSlashCommand('/port')).toBe('')
    })

    it('should trim leading whitespace after removal', () => {
      expect(removePortalSlashCommand('/portal  remaining')).toBe('  remaining')
    })

    it('should handle case-insensitive removal', () => {
      expect(removePortalSlashCommand('/PORTAL text')).toBe(' text')
      expect(removePortalSlashCommand('/Portal text')).toBe(' text')
    })

    it('should return original text if not a portal command', () => {
      expect(removePortalSlashCommand('regular text')).toBe('regular text')
      expect(removePortalSlashCommand('/other command')).toBe('/other command')
    })

    it('should handle empty string', () => {
      expect(removePortalSlashCommand('')).toBe('')
    })
  })
})
