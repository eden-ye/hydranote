/**
 * Reorganization Modal Component (EDITOR-3502)
 *
 * Modal UI for manual reorganization trigger (Cmd+Shift+L)
 * Shows semantic search suggestions for extracted concepts.
 *
 * Features:
 * - Shows "Analyzing..." state while extracting concepts
 * - Displays extracted concepts with checkboxes
 * - For each concept, shows matching existing bullets with similarity scores
 * - Full context path for disambiguation
 * - User can check/uncheck which connections to create
 * - "Connect Selected" and "Skip" buttons
 */
import { useEffect, useCallback, useState } from 'react'
import { useEditorStore, type ConceptMatch } from '@/stores/editor-store'
import './ReorganizationModal.css'

/**
 * Portal connection to be created
 */
export interface PortalConnection {
  /** Source document ID */
  sourceDocId: string
  /** Source block ID */
  sourceBlockId: string
  /** Context path for display */
  contextPath: string
}

// Re-export ConceptMatch for test imports
export type { ConceptMatch }

export interface ReorganizationModalProps {
  /** Callback when connections are confirmed */
  onConnect: (connections: PortalConnection[]) => void
  /** Callback when modal is closed/skipped */
  onClose: () => void
}

export function ReorganizationModal({ onConnect, onClose }: ReorganizationModalProps) {
  const {
    reorgModalOpen,
    reorgModalStatus,
    reorgModalConceptMatches,
    reorgModalError,
    closeReorgModal,
    setReorgModalStatus,
    toggleReorgMatch,
  } = useEditorStore()

  // Track which concepts are expanded
  const [expandedConcepts, setExpandedConcepts] = useState<Set<string>>(new Set())

  // Initialize all concepts as expanded when matches load
  useEffect(() => {
    if (reorgModalStatus === 'loaded' && reorgModalConceptMatches.length > 0) {
      setExpandedConcepts(new Set(reorgModalConceptMatches.map((cm) => cm.concept)))
    }
  }, [reorgModalStatus, reorgModalConceptMatches])

  // Calculate total selected count
  const selectedCount = reorgModalConceptMatches.reduce(
    (total, cm) => total + cm.selectedMatches.size,
    0
  )

  // Handle concept header click to toggle expansion
  const handleConceptToggle = useCallback((concept: string) => {
    setExpandedConcepts((prev) => {
      const next = new Set(prev)
      if (next.has(concept)) {
        next.delete(concept)
      } else {
        next.add(concept)
      }
      return next
    })
  }, [])

  // Handle checkbox click
  const handleMatchToggle = useCallback(
    (concept: string, blockId: string) => {
      toggleReorgMatch(concept, blockId)
    },
    [toggleReorgMatch]
  )

  // Handle connect button click
  const handleConnect = useCallback(() => {
    const connections: PortalConnection[] = []

    for (const conceptMatch of reorgModalConceptMatches) {
      for (const match of conceptMatch.matches) {
        if (conceptMatch.selectedMatches.has(match.blockId)) {
          connections.push({
            sourceDocId: match.documentId,
            sourceBlockId: match.blockId,
            contextPath: match.contextPath,
          })
        }
      }
    }

    onConnect(connections)
    closeReorgModal()
  }, [reorgModalConceptMatches, onConnect, closeReorgModal])

  // Handle skip/close
  const handleClose = useCallback(() => {
    onClose()
    closeReorgModal()
  }, [onClose, closeReorgModal])

  // Handle backdrop click
  const handleBackdropClick = useCallback(() => {
    handleClose()
  }, [handleClose])

  // Prevent clicks inside modal from closing
  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!reorgModalOpen) return

      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    },
    [reorgModalOpen, handleClose]
  )

  // Attach keyboard listener
  useEffect(() => {
    if (!reorgModalOpen) return

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [reorgModalOpen, handleKeyDown])

  // Handle retry
  const handleRetry = useCallback(() => {
    setReorgModalStatus('idle')
    // Trigger re-extraction - this would be handled by the parent
  }, [setReorgModalStatus])

  if (!reorgModalOpen) return null

  return (
    <div
      data-testid="reorg-modal-backdrop"
      className="reorg-modal-backdrop"
      onClick={handleBackdropClick}
    >
      <div
        data-testid="reorg-modal"
        className="reorg-modal"
        onClick={handleModalClick}
      >
        <div className="reorg-modal-header">
          <span className="reorg-modal-icon">🔗</span>
          <span className="reorg-modal-title">Connect to Existing Knowledge</span>
        </div>

        {/* Loading states */}
        {(reorgModalStatus === 'extracting' || reorgModalStatus === 'searching') && (
          <div data-testid="reorg-modal-loading" className="reorg-modal-loading">
            <div className="reorg-modal-spinner" />
            <span>
              {reorgModalStatus === 'extracting'
                ? 'Analyzing your note...'
                : 'Searching for matches...'}
            </span>
          </div>
        )}

        {/* Error state */}
        {reorgModalStatus === 'error' && (
          <div className="reorg-modal-error">
            <span className="reorg-modal-error-icon">⚠️</span>
            <span className="reorg-modal-error-text">{reorgModalError}</span>
            <button
              className="reorg-modal-retry-btn"
              onClick={handleRetry}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loaded state with concepts */}
        {reorgModalStatus === 'loaded' && (
          <>
            <div className="reorg-modal-summary">
              Found {reorgModalConceptMatches.length} concepts in your note:
            </div>

            <div className="reorg-modal-concepts">
              {reorgModalConceptMatches.map((conceptMatch) => (
                <div key={conceptMatch.concept} className="reorg-concept">
                  <div
                    data-testid={`concept-header-${conceptMatch.concept}`}
                    className="reorg-concept-header"
                    onClick={() => handleConceptToggle(conceptMatch.concept)}
                  >
                    <span className="reorg-concept-arrow">
                      {expandedConcepts.has(conceptMatch.concept) ? '▼' : '▶'}
                    </span>
                    <span className="reorg-concept-name">{conceptMatch.concept}</span>
                    <span className="reorg-concept-category">({conceptMatch.category})</span>
                  </div>

                  {expandedConcepts.has(conceptMatch.concept) && (
                    <div className="reorg-concept-matches">
                      {conceptMatch.matches.length === 0 ? (
                        <div className="reorg-no-matches">
                          <span className="reorg-no-matches-icon">⚠️</span>
                          <span>No matches found above threshold</span>
                        </div>
                      ) : (
                        conceptMatch.matches.map((match) => (
                          <label
                            key={match.blockId}
                            className="reorg-match"
                          >
                            <input
                              type="checkbox"
                              checked={conceptMatch.selectedMatches.has(match.blockId)}
                              onChange={() =>
                                handleMatchToggle(conceptMatch.concept, match.blockId)
                              }
                            />
                            <span className="reorg-match-path">{match.contextPath}</span>
                            <span className="reorg-match-score">
                              ({match.score.toFixed(2)})
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="reorg-modal-actions">
              <button
                className="reorg-modal-skip-btn"
                onClick={handleClose}
              >
                Skip
              </button>
              <button
                className="reorg-modal-connect-btn"
                disabled={selectedCount === 0}
                onClick={handleConnect}
              >
                Connect Selected ({selectedCount})
              </button>
            </div>
          </>
        )}

        {/* Idle state - waiting for extraction to start */}
        {reorgModalStatus === 'idle' && (
          <div className="reorg-modal-loading">
            <div className="reorg-modal-spinner" />
            <span>Preparing...</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReorganizationModal
