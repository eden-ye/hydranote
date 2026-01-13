/**
 * Tests for BlockNode Component
 * FE-503: Left Panel with Favorites
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { BlockNode } from '../BlockNode'

describe('BlockNode', () => {
  const defaultProps = {
    id: 'block-123',
    title: 'Test Block',
    onClick: vi.fn(),
    onToggleFavorite: vi.fn(),
    isFavorite: false,
    isActive: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render block node with title', () => {
      render(<BlockNode {...defaultProps} />)
      expect(screen.getByText('Test Block')).toBeInTheDocument()
    })

    it('should render with data-testid', () => {
      render(<BlockNode {...defaultProps} />)
      expect(screen.getByTestId('block-node-block-123')).toBeInTheDocument()
    })

    it('should render bullet icon', () => {
      render(<BlockNode {...defaultProps} />)
      expect(screen.getByTestId('block-icon')).toBeInTheDocument()
    })

    it('should truncate long titles', () => {
      const longTitle = 'This is a very long title that should be truncated with ellipsis'
      render(<BlockNode {...defaultProps} title={longTitle} />)
      const titleElement = screen.getByText(longTitle)
      expect(titleElement).toHaveStyle({ textOverflow: 'ellipsis' })
    })
  })

  describe('Click Behavior', () => {
    it('should call onClick when clicked', () => {
      render(<BlockNode {...defaultProps} />)
      const node = screen.getByTestId('block-node-block-123')
      fireEvent.click(node)
      expect(defaultProps.onClick).toHaveBeenCalledWith('block-123')
    })
  })

  describe('Favorite Toggle', () => {
    it('should render star button', () => {
      render(<BlockNode {...defaultProps} showFavoriteToggle />)
      expect(screen.getByTestId('favorite-toggle-block-123')).toBeInTheDocument()
    })

    it('should show filled star when favorited', () => {
      render(<BlockNode {...defaultProps} isFavorite showFavoriteToggle />)
      const starButton = screen.getByTestId('favorite-toggle-block-123')
      expect(starButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('should show empty star when not favorited', () => {
      render(<BlockNode {...defaultProps} isFavorite={false} showFavoriteToggle />)
      const starButton = screen.getByTestId('favorite-toggle-block-123')
      expect(starButton).toHaveAttribute('aria-pressed', 'false')
    })

    it('should call onToggleFavorite when star is clicked', () => {
      render(<BlockNode {...defaultProps} showFavoriteToggle />)
      const starButton = screen.getByTestId('favorite-toggle-block-123')
      fireEvent.click(starButton)
      expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('block-123')
      expect(defaultProps.onClick).not.toHaveBeenCalled() // Should not trigger navigation
    })
  })

  describe('Active State', () => {
    it('should highlight when active', () => {
      render(<BlockNode {...defaultProps} isActive />)
      const node = screen.getByTestId('block-node-block-123')
      expect(node).toHaveStyle({ backgroundColor: 'rgba(255, 255, 255, 0.1)' })
    })

    it('should not highlight when not active', () => {
      render(<BlockNode {...defaultProps} isActive={false} />)
      const node = screen.getByTestId('block-node-block-123')
      // Check that data-active attribute is false
      expect(node).toHaveAttribute('data-active', 'false')
    })
  })

  describe('Drag-to-Reorder', () => {
    it('should render drag handle when draggable', () => {
      render(<BlockNode {...defaultProps} draggable />)
      expect(screen.getByTestId('drag-handle-block-123')).toBeInTheDocument()
    })

    it('should not render drag handle when not draggable', () => {
      render(<BlockNode {...defaultProps} draggable={false} />)
      expect(screen.queryByTestId('drag-handle-block-123')).not.toBeInTheDocument()
    })

    it('should have draggable attribute when draggable', () => {
      render(<BlockNode {...defaultProps} draggable />)
      const node = screen.getByTestId('block-node-block-123')
      expect(node).toHaveAttribute('draggable', 'true')
    })

    it('should call onDragStart with block id', () => {
      const onDragStart = vi.fn()
      render(<BlockNode {...defaultProps} draggable onDragStart={onDragStart} />)
      const node = screen.getByTestId('block-node-block-123')
      fireEvent.dragStart(node)
      expect(onDragStart).toHaveBeenCalledWith('block-123')
    })

    it('should call onDragOver when dragged over', () => {
      const onDragOver = vi.fn()
      render(<BlockNode {...defaultProps} draggable onDragOver={onDragOver} />)
      const node = screen.getByTestId('block-node-block-123')
      fireEvent.dragOver(node)
      expect(onDragOver).toHaveBeenCalled()
    })

    it('should call onDrop with target block id', () => {
      const onDrop = vi.fn()
      render(<BlockNode {...defaultProps} draggable onDrop={onDrop} />)
      const node = screen.getByTestId('block-node-block-123')
      fireEvent.drop(node)
      expect(onDrop).toHaveBeenCalledWith('block-123')
    })

    it('should show drop indicator when isDragOver', () => {
      render(<BlockNode {...defaultProps} isDragOver />)
      expect(screen.getByTestId('drop-indicator')).toBeInTheDocument()
    })

    it('should reduce opacity when being dragged', () => {
      render(<BlockNode {...defaultProps} isDragging />)
      const node = screen.getByTestId('block-node-block-123')
      expect(node).toHaveStyle({ opacity: '0.5' })
    })
  })

  describe('Hover State', () => {
    it('should show star on hover when showFavoriteToggle is true', () => {
      render(<BlockNode {...defaultProps} showFavoriteToggle />)
      const node = screen.getByTestId('block-node-block-123')
      fireEvent.mouseEnter(node)
      expect(screen.getByTestId('favorite-toggle-block-123')).toBeVisible()
    })
  })
})
