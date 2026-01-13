/**
 * Format Commands Utilities
 * EDITOR-3506: Inline Text Formatting Toolbar
 *
 * Provides utilities for text formatting operations in the editor.
 */
import React from 'react'

// SVG Icons as React components for format buttons
export const BoldIcon: React.FC<{ className?: string }> = ({ className }) =>
  React.createElement(
    'svg',
    {
      className,
      width: 16,
      height: 16,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2.5,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    React.createElement('path', { d: 'M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z' }),
    React.createElement('path', { d: 'M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z' })
  )

export const ItalicIcon: React.FC<{ className?: string }> = ({ className }) =>
  React.createElement(
    'svg',
    {
      className,
      width: 16,
      height: 16,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    React.createElement('line', { x1: 19, y1: 4, x2: 10, y2: 4 }),
    React.createElement('line', { x1: 14, y1: 20, x2: 5, y2: 20 }),
    React.createElement('line', { x1: 15, y1: 4, x2: 9, y2: 20 })
  )

export const UnderlineIcon: React.FC<{ className?: string }> = ({ className }) =>
  React.createElement(
    'svg',
    {
      className,
      width: 16,
      height: 16,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    React.createElement('path', { d: 'M6 4v6a6 6 0 0 0 12 0V4' }),
    React.createElement('line', { x1: 4, y1: 20, x2: 20, y2: 20 })
  )

export const StrikethroughIcon: React.FC<{ className?: string }> = ({ className }) =>
  React.createElement(
    'svg',
    {
      className,
      width: 16,
      height: 16,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    React.createElement('path', { d: 'M16 4H9a3 3 0 0 0-3 3v0a3 3 0 0 0 3 3h6' }),
    React.createElement('path', { d: 'M8 20h7a3 3 0 0 0 3-3v0a3 3 0 0 0-3-3H9' }),
    React.createElement('line', { x1: 4, y1: 12, x2: 20, y2: 12 })
  )

export const HighlightIcon: React.FC<{ className?: string }> = ({ className }) =>
  React.createElement(
    'svg',
    {
      className,
      width: 16,
      height: 16,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    React.createElement('path', { d: 'M12 20h9' }),
    React.createElement('path', {
      d: 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z',
    })
  )

/**
 * Text format configuration for toolbar buttons
 */
export interface TextFormatConfig {
  id: string
  name: string
  styleKey: string
  hotkey: string
  icon: React.FC<{ className?: string }>
}

export const TEXT_FORMAT_CONFIGS: TextFormatConfig[] = [
  {
    id: 'bold',
    name: 'Bold',
    styleKey: 'bold',
    hotkey: 'Mod+B',
    icon: BoldIcon,
  },
  {
    id: 'italic',
    name: 'Italic',
    styleKey: 'italic',
    hotkey: 'Mod+I',
    icon: ItalicIcon,
  },
  {
    id: 'underline',
    name: 'Underline',
    styleKey: 'underline',
    hotkey: 'Mod+U',
    icon: UnderlineIcon,
  },
  {
    id: 'strike',
    name: 'Strikethrough',
    styleKey: 'strike',
    hotkey: 'Mod+Shift+S',
    icon: StrikethroughIcon,
  },
]

/**
 * Highlight color definitions with CSS variables
 * Based on Affine's color system
 */
export interface HighlightColor {
  name: string
  color: string // Text color CSS variable
  background: string // Background color CSS variable
}

export const HIGHLIGHT_COLORS: Record<string, HighlightColor> = {
  red: {
    name: 'Red',
    color: 'var(--affine-text-highlight-foreground-red)',
    background: 'var(--affine-text-highlight-red)',
  },
  orange: {
    name: 'Orange',
    color: 'var(--affine-text-highlight-foreground-orange)',
    background: 'var(--affine-text-highlight-orange)',
  },
  yellow: {
    name: 'Yellow',
    color: 'var(--affine-text-highlight-foreground-yellow)',
    background: 'var(--affine-text-highlight-yellow)',
  },
  green: {
    name: 'Green',
    color: 'var(--affine-text-highlight-foreground-green)',
    background: 'var(--affine-text-highlight-green)',
  },
  teal: {
    name: 'Teal',
    color: 'var(--affine-text-highlight-foreground-teal)',
    background: 'var(--affine-text-highlight-teal)',
  },
  blue: {
    name: 'Blue',
    color: 'var(--affine-text-highlight-foreground-blue)',
    background: 'var(--affine-text-highlight-blue)',
  },
  purple: {
    name: 'Purple',
    color: 'var(--affine-text-highlight-foreground-purple)',
    background: 'var(--affine-text-highlight-purple)',
  },
  grey: {
    name: 'Grey',
    color: 'var(--affine-text-highlight-foreground-grey)',
    background: 'var(--affine-text-highlight-grey)',
  },
}

/**
 * Order of colors to display in the highlight dropdown
 */
export const HIGHLIGHT_COLOR_ORDER = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'grey']

/**
 * Check if a format is currently active in the selection
 */
export function isFormatActive(
  currentFormat: Record<string, unknown> | null | undefined,
  formatKey: string
): boolean {
  if (!currentFormat) return false
  const value = currentFormat[formatKey]
  // For boolean formats (bold, italic, etc.), check if truthy
  // For string formats (color, background), check if value exists and is not null
  return value !== undefined && value !== null && value !== false
}

/**
 * Get the value to apply when toggling a format
 * Returns true to enable, null to disable
 */
export function getToggleValue(isActive: boolean): boolean | null {
  return isActive ? null : true
}

/**
 * Create a style object for formatting
 */
export function getFormatStyles(
  styleKey: string,
  value: boolean | string | null
): Record<string, boolean | string | null> {
  return { [styleKey]: value }
}

/**
 * Find the active color name from a CSS variable value
 */
export function findColorNameFromValue(
  value: string | null | undefined,
  type: 'color' | 'background'
): string | null {
  if (!value) return null

  for (const [key, colorDef] of Object.entries(HIGHLIGHT_COLORS)) {
    if (type === 'color' && colorDef.color === value) {
      return key
    }
    if (type === 'background' && colorDef.background === value) {
      return key
    }
  }

  return null
}
