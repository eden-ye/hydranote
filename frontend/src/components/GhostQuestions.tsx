/**
 * GhostQuestions Component
 * FE-409: Ghost Question Rendering
 *
 * Renders AI-generated ghost questions in focus mode to guide deeper exploration.
 * - Visually distinct (grayed, italic)
 * - Clickable to expand with AI
 * - Dismissible
 */
import './GhostQuestions.css'

/**
 * Ghost question interface
 */
export interface GhostQuestion {
  /** Unique identifier */
  id: string
  /** Question text */
  text: string
}

/**
 * GhostQuestions component props
 */
interface GhostQuestionsProps {
  /** Array of ghost questions to display */
  questions: GhostQuestion[]
  /** Whether questions are being generated */
  isLoading: boolean
  /** Callback when clicking a question to expand */
  onQuestionClick: (question: GhostQuestion) => void
  /** Callback when dismissing a question */
  onDismiss: (questionId: string) => void
}

/**
 * Loading skeleton for ghost questions
 */
function LoadingSkeleton() {
  return (
    <div className="ghost-questions-loading" data-testid="ghost-questions-loading">
      <div className="ghost-questions-loading-text">Generating questions...</div>
      <div className="ghost-questions-skeleton">
        <div className="ghost-questions-skeleton-line" />
        <div className="ghost-questions-skeleton-line" />
        <div className="ghost-questions-skeleton-line" />
      </div>
    </div>
  )
}

/**
 * Ghost questions component for focus mode
 */
export function GhostQuestions({
  questions,
  isLoading,
  onQuestionClick,
  onDismiss,
}: GhostQuestionsProps) {
  const handleKeyDown = (
    event: React.KeyboardEvent,
    question: GhostQuestion
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onQuestionClick(question)
    }
  }

  return (
    <div
      className="ghost-questions"
      data-testid="ghost-questions"
      role="region"
      aria-label="Suggested questions"
    >
      <div className="ghost-questions-header">
        <span className="ghost-questions-title">Explore further</span>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="ghost-questions-list">
          {questions.map((question) => (
            <div
              key={question.id}
              className="ghost-question"
              data-testid="ghost-question"
              tabIndex={0}
              role="button"
              onClick={() => onQuestionClick(question)}
              onKeyDown={(e) => handleKeyDown(e, question)}
            >
              <span className="ghost-question-text">{question.text}</span>
              <button
                className="ghost-question-dismiss"
                onClick={(e) => {
                  e.stopPropagation()
                  onDismiss(question.id)
                }}
                aria-label={`Dismiss question: ${question.text}`}
                title="Dismiss"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
