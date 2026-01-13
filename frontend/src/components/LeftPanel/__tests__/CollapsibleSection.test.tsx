/**
 * Tests for CollapsibleSection Component
 * FE-503: Left Panel with Favorites
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { CollapsibleSection } from '../CollapsibleSection'

describe('CollapsibleSection', () => {
  it('should render section with title', () => {
    render(
      <CollapsibleSection title="Test Section" icon={<span>*</span>}>
        <div>Content</div>
      </CollapsibleSection>
    )
    expect(screen.getByText('Test Section')).toBeInTheDocument()
  })

  it('should render icon', () => {
    render(
      <CollapsibleSection title="Test" icon={<span data-testid="test-icon">*</span>}>
        <div>Content</div>
      </CollapsibleSection>
    )
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('should show content when expanded (default)', () => {
    render(
      <CollapsibleSection title="Test" icon={<span>*</span>}>
        <div data-testid="section-content">Content</div>
      </CollapsibleSection>
    )
    expect(screen.getByTestId('section-content')).toBeVisible()
  })

  it('should hide content when collapsed', () => {
    render(
      <CollapsibleSection title="Test" icon={<span>*</span>} defaultCollapsed>
        <div data-testid="section-content">Content</div>
      </CollapsibleSection>
    )
    expect(screen.queryByTestId('section-content')).not.toBeInTheDocument()
  })

  it('should toggle collapse on header click', () => {
    render(
      <CollapsibleSection title="Test" icon={<span>*</span>}>
        <div data-testid="section-content">Content</div>
      </CollapsibleSection>
    )
    const header = screen.getByRole('button', { name: /test/i })
    expect(screen.getByTestId('section-content')).toBeVisible()

    fireEvent.click(header)
    expect(screen.queryByTestId('section-content')).not.toBeInTheDocument()

    fireEvent.click(header)
    expect(screen.getByTestId('section-content')).toBeVisible()
  })

  it('should show collapse indicator (chevron)', () => {
    render(
      <CollapsibleSection title="Test" icon={<span>*</span>}>
        <div>Content</div>
      </CollapsibleSection>
    )
    expect(screen.getByTestId('collapse-indicator')).toBeInTheDocument()
  })

  it('should rotate collapse indicator when collapsed', () => {
    render(
      <CollapsibleSection title="Test" icon={<span>*</span>}>
        <div>Content</div>
      </CollapsibleSection>
    )
    const indicator = screen.getByTestId('collapse-indicator')
    const header = screen.getByRole('button', { name: /test/i })

    // Initially expanded - indicator should be rotated down
    expect(indicator).toHaveStyle({ transform: 'rotate(90deg)' })

    // After collapse - indicator should be rotated right
    fireEvent.click(header)
    expect(indicator).toHaveStyle({ transform: 'rotate(0deg)' })
  })

  it('should call onCollapsedChange callback', () => {
    const onCollapsedChange = vi.fn()
    render(
      <CollapsibleSection title="Test" icon={<span>*</span>} onCollapsedChange={onCollapsedChange}>
        <div>Content</div>
      </CollapsibleSection>
    )
    const header = screen.getByRole('button', { name: /test/i })

    fireEvent.click(header)
    expect(onCollapsedChange).toHaveBeenCalledWith(true)

    fireEvent.click(header)
    expect(onCollapsedChange).toHaveBeenCalledWith(false)
  })

  it('should support count badge', () => {
    render(
      <CollapsibleSection title="Test" icon={<span>*</span>} count={5}>
        <div>Content</div>
      </CollapsibleSection>
    )
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})
