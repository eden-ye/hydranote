/**
 * Tests for useSpotlight Hook
 * FE-404: Spotlight Modal (Ctrl+P)
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSpotlight } from '../useSpotlight'

describe('useSpotlight', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should start with modal closed', () => {
      const { result } = renderHook(() => useSpotlight())
      expect(result.current.isOpen).toBe(false)
    })

    it('should start not loading', () => {
      const { result } = renderHook(() => useSpotlight())
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('open/close/toggle', () => {
    it('should open modal', () => {
      const { result } = renderHook(() => useSpotlight())
      act(() => {
        result.current.open()
      })
      expect(result.current.isOpen).toBe(true)
    })

    it('should close modal', () => {
      const { result } = renderHook(() => useSpotlight())
      act(() => {
        result.current.open()
      })
      expect(result.current.isOpen).toBe(true)
      act(() => {
        result.current.close()
      })
      expect(result.current.isOpen).toBe(false)
    })

    it('should toggle modal', () => {
      const { result } = renderHook(() => useSpotlight())
      expect(result.current.isOpen).toBe(false)
      act(() => {
        result.current.toggle()
      })
      expect(result.current.isOpen).toBe(true)
      act(() => {
        result.current.toggle()
      })
      expect(result.current.isOpen).toBe(false)
    })
  })

  describe('setIsLoading', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useSpotlight())
      act(() => {
        result.current.setIsLoading(true)
      })
      expect(result.current.isLoading).toBe(true)
      act(() => {
        result.current.setIsLoading(false)
      })
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Keyboard Shortcut', () => {
    it('should toggle on Ctrl+P', () => {
      const { result } = renderHook(() => useSpotlight())
      expect(result.current.isOpen).toBe(false)

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'p',
          ctrlKey: true,
        })
        document.dispatchEvent(event)
      })

      expect(result.current.isOpen).toBe(true)
    })

    it('should toggle on Cmd+P (Mac)', () => {
      const { result } = renderHook(() => useSpotlight())
      expect(result.current.isOpen).toBe(false)

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'p',
          metaKey: true,
        })
        document.dispatchEvent(event)
      })

      expect(result.current.isOpen).toBe(true)
    })

    it('should not toggle on just P key', () => {
      const { result } = renderHook(() => useSpotlight())
      expect(result.current.isOpen).toBe(false)

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'p',
        })
        document.dispatchEvent(event)
      })

      expect(result.current.isOpen).toBe(false)
    })
  })
})
