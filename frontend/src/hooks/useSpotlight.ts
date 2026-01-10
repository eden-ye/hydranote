/**
 * useSpotlight Hook
 * FE-404: Spotlight Modal (Ctrl+P)
 *
 * Hook to manage Spotlight modal state and keyboard shortcut.
 */
import { useState, useEffect, useCallback } from 'react'

export function useSpotlight() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  // Listen for Cmd+P / Ctrl+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+P on Mac, Ctrl+P on Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault()
        toggle()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [toggle])

  return {
    isOpen,
    isLoading,
    setIsLoading,
    open,
    close,
    toggle,
  }
}
