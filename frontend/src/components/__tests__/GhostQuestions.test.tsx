/**
 * Tests for GhostQuestions Component
 * FE-409: Ghost Question Rendering
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GhostQuestions } from '../GhostQuestions'

describe('GhostQuestions', () => {
  const mockOnQuestionClick = vi.fn()
  const mockOnDismiss = vi.fn()

  const defaultProps = {
    questions: [
      { id: 'q1', text: 'What are the implications?' },
      { id: 'q2', text: 'How does this relate to other concepts?' },
      { id: 'q3', text: 'What are the next steps?' },
    ],
    isLoading: false,
    onQuestionClick: mockOnQuestionClick,
    onDismiss: mockOnDismiss,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render all ghost questions', () => {
      render(<GhostQuestions {...defaultProps} />)

      expect(screen.getByText('What are the implications?')).toBeInTheDocument()
      expect(screen.getByText('How does this relate to other concepts?')).toBeInTheDocument()
      expect(screen.getByText('What are the next steps?')).toBeInTheDocument()
    })

    it('should render questions with ghost styling', () => {
      render(<GhostQuestions {...defaultProps} />)

      const container = screen.getByTestId('ghost-questions')
      expect(container).toHaveClass('ghost-questions')
    })

    it('should render question text in italic style', () => {
      render(<GhostQuestions {...defaultProps} />)

      const questionElement = screen.getByText('What are the implications?').closest('[data-testid="ghost-question"]')
      expect(questionElement).toHaveClass('ghost-question')
    })

    it('should render loading state', () => {
      render(<GhostQuestions {...defaultProps} isLoading={true} />)

      expect(screen.getByTestId('ghost-questions-loading')).toBeInTheDocument()
    })

    it('should not render questions when empty', () => {
      const { container } = render(
        <GhostQuestions {...defaultProps} questions={[]} />
      )

      const questions = container.querySelectorAll('[data-testid="ghost-question"]')
      expect(questions).toHaveLength(0)
    })

    it('should render header text', () => {
      render(<GhostQuestions {...defaultProps} />)

      expect(screen.getByText('Explore further')).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('should call onQuestionClick when clicking a question', () => {
      render(<GhostQuestions {...defaultProps} />)

      fireEvent.click(screen.getByText('What are the implications?'))

      expect(mockOnQuestionClick).toHaveBeenCalledWith(defaultProps.questions[0])
    })

    it('should call onDismiss when clicking dismiss button', () => {
      render(<GhostQuestions {...defaultProps} />)

      const dismissButtons = screen.getAllByRole('button', { name: /dismiss/i })
      fireEvent.click(dismissButtons[0])

      expect(mockOnDismiss).toHaveBeenCalledWith('q1')
    })

    it('should handle keyboard navigation on questions', () => {
      render(<GhostQuestions {...defaultProps} />)

      const question = screen.getByText('What are the implications?').closest('[data-testid="ghost-question"]')
      fireEvent.keyDown(question!, { key: 'Enter' })

      expect(mockOnQuestionClick).toHaveBeenCalledWith(defaultProps.questions[0])
    })

    it('should handle keyboard navigation with Space key', () => {
      render(<GhostQuestions {...defaultProps} />)

      const question = screen.getByText('What are the implications?').closest('[data-testid="ghost-question"]')
      fireEvent.keyDown(question!, { key: ' ' })

      expect(mockOnQuestionClick).toHaveBeenCalledWith(defaultProps.questions[0])
    })
  })

  describe('accessibility', () => {
    it('should have appropriate ARIA attributes', () => {
      render(<GhostQuestions {...defaultProps} />)

      const container = screen.getByTestId('ghost-questions')
      expect(container).toHaveAttribute('role', 'region')
      expect(container).toHaveAttribute('aria-label', 'Suggested questions')
    })

    it('should have focusable questions', () => {
      render(<GhostQuestions {...defaultProps} />)

      const question = screen.getByText('What are the implications?').closest('[data-testid="ghost-question"]')
      expect(question).toHaveAttribute('tabIndex', '0')
    })

    it('should have accessible dismiss buttons', () => {
      render(<GhostQuestions {...defaultProps} />)

      const dismissButtons = screen.getAllByRole('button', { name: /dismiss/i })
      expect(dismissButtons.length).toBeGreaterThan(0)
    })
  })

  describe('loading state', () => {
    it('should show loading skeleton when loading', () => {
      render(<GhostQuestions {...defaultProps} isLoading={true} questions={[]} />)

      expect(screen.getByTestId('ghost-questions-loading')).toBeInTheDocument()
    })

    it('should show loading text', () => {
      render(<GhostQuestions {...defaultProps} isLoading={true} questions={[]} />)

      expect(screen.getByText('Generating questions...')).toBeInTheDocument()
    })
  })
})
