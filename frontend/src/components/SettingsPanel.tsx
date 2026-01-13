/**
 * Settings Panel Component
 * FE-501: Semantic Linking Settings
 * FE-502: Auto-Generation Settings
 * EDITOR-3704: Auto-Summarize Settings
 *
 * Provides UI for configuring:
 * - Toggle: Enable/disable semantic linking
 * - Slider: Similarity threshold (0.5 - 1.0)
 * - Input: Max suggestions per concept (1-10)
 * - Toggle: Enable/disable auto-generation
 * - Input: Generation count (1-5)
 * - Checkboxes: Descriptor type triggers
 * - Toggle: Enable/disable auto-summarize
 * - Input: Word threshold (10-100)
 */
import { useSettingsStore, type DescriptorTriggerType } from '@/stores/settings-store'

interface SettingsPanelProps {
  onClose?: () => void
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const {
    semanticLinkingEnabled,
    semanticLinkingThreshold,
    semanticLinkingMaxSuggestions,
    setSemanticLinkingEnabled,
    setSemanticLinkingThreshold,
    setSemanticLinkingMaxSuggestions,
    // Auto-generation settings (FE-502)
    autoGenerationEnabled,
    autoGenerationCount,
    autoGenerationTriggers,
    setAutoGenerationEnabled,
    setAutoGenerationCount,
    setAutoGenerationTrigger,
    // Auto-summarize settings (EDITOR-3704)
    autoSummarizeEnabled,
    autoSummarizeThreshold,
    setAutoSummarizeEnabled,
    setAutoSummarizeThreshold,
  } = useSettingsStore()

  const handleToggle = () => {
    setSemanticLinkingEnabled(!semanticLinkingEnabled)
  }

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSemanticLinkingThreshold(parseFloat(e.target.value))
  }

  const handleMaxSuggestionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSemanticLinkingMaxSuggestions(parseInt(e.target.value, 10))
  }

  // Auto-generation handlers (FE-502)
  const handleAutoGenerationToggle = () => {
    setAutoGenerationEnabled(!autoGenerationEnabled)
  }

  const handleGenerationCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoGenerationCount(parseInt(e.target.value, 10))
  }

  const handleTriggerChange = (type: DescriptorTriggerType) => {
    setAutoGenerationTrigger(type, !autoGenerationTriggers[type])
  }

  // Auto-summarize handlers (EDITOR-3704)
  const handleAutoSummarizeToggle = () => {
    setAutoSummarizeEnabled(!autoSummarizeEnabled)
  }

  const handleAutoSummarizeThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoSummarizeThreshold(parseInt(e.target.value, 10))
  }

  return (
    <div
      data-testid="settings-panel"
      style={{
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
          Semantic Linking
        </h2>
        {onClose && (
          <button
            data-testid="settings-close-button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              color: '#666',
              padding: '4px',
            }}
            aria-label="Close settings"
          >
            ×
          </button>
        )}
      </div>

      {/* Enable/Disable Toggle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          padding: '8px 0',
        }}
      >
        <label
          htmlFor="semantic-linking-toggle"
          style={{ fontSize: '14px', color: '#333' }}
        >
          Enable semantic linking
        </label>
        <input
          id="semantic-linking-toggle"
          data-testid="semantic-linking-toggle"
          type="checkbox"
          checked={semanticLinkingEnabled}
          onChange={handleToggle}
          style={{
            width: '20px',
            height: '20px',
            cursor: 'pointer',
          }}
        />
      </div>

      {/* Threshold Slider */}
      <div
        data-testid="threshold-row"
        className={!semanticLinkingEnabled ? 'disabled' : ''}
        style={{
          marginBottom: '16px',
          padding: '8px 0',
          opacity: semanticLinkingEnabled ? 1 : 0.5,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <label style={{ fontSize: '14px', color: '#333' }}>
            Similarity threshold
            <span
              style={{
                display: 'block',
                fontSize: '12px',
                color: '#666',
                marginTop: '2px',
              }}
            >
              Higher = more precise, Lower = more results
            </span>
          </label>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#333',
              minWidth: '32px',
              textAlign: 'right',
            }}
          >
            {semanticLinkingThreshold}
          </span>
        </div>
        <input
          data-testid="threshold-slider"
          type="range"
          min="0.5"
          max="1"
          step="0.05"
          value={semanticLinkingThreshold}
          onChange={handleThresholdChange}
          disabled={!semanticLinkingEnabled}
          style={{
            width: '100%',
            cursor: semanticLinkingEnabled ? 'pointer' : 'not-allowed',
          }}
        />
      </div>

      {/* Max Suggestions Input */}
      <div
        data-testid="max-suggestions-row"
        className={!semanticLinkingEnabled ? 'disabled' : ''}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          padding: '8px 0',
          opacity: semanticLinkingEnabled ? 1 : 0.5,
        }}
      >
        <label
          htmlFor="max-suggestions-input"
          style={{ fontSize: '14px', color: '#333' }}
        >
          Max suggestions per concept
        </label>
        <input
          id="max-suggestions-input"
          data-testid="max-suggestions-input"
          type="number"
          min="1"
          max="10"
          value={semanticLinkingMaxSuggestions}
          onChange={handleMaxSuggestionsChange}
          disabled={!semanticLinkingEnabled}
          style={{
            width: '60px',
            padding: '6px 8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            textAlign: 'center',
            cursor: semanticLinkingEnabled ? 'text' : 'not-allowed',
          }}
        />
      </div>

      {/* Threshold Guide */}
      <div
        style={{
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          padding: '12px',
          fontSize: '12px',
          color: '#666',
        }}
      >
        <div style={{ fontWeight: 500, marginBottom: '8px' }}>
          Threshold Guide
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px 8px 4px 0' }}>0.9+</td>
              <td style={{ padding: '4px 0' }}>Very similar (same concept)</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 8px 4px 0' }}>0.8</td>
              <td style={{ padding: '4px 0' }}>Related (recommended)</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 8px 4px 0' }}>0.7</td>
              <td style={{ padding: '4px 0' }}>Loosely related</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 8px 4px 0' }}>0.5-0.6</td>
              <td style={{ padding: '4px 0' }}>Distant connections</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Auto Generation Section (FE-502) */}
      <div
        style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid #eee',
        }}
      >
        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>
          Auto Generation
        </h2>

        {/* Enable/Disable Toggle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            padding: '8px 0',
          }}
        >
          <label
            htmlFor="auto-generation-toggle"
            style={{ fontSize: '14px', color: '#333' }}
          >
            Auto-generate after descriptor creation
          </label>
          <input
            id="auto-generation-toggle"
            data-testid="auto-generation-toggle"
            type="checkbox"
            checked={autoGenerationEnabled}
            onChange={handleAutoGenerationToggle}
            style={{
              width: '20px',
              height: '20px',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Generation Count Input */}
        <div
          data-testid="generation-count-row"
          className={!autoGenerationEnabled ? 'disabled' : ''}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            padding: '8px 0',
            opacity: autoGenerationEnabled ? 1 : 0.5,
          }}
        >
          <label
            htmlFor="generation-count-input"
            style={{ fontSize: '14px', color: '#333' }}
          >
            Bullets per descriptor
          </label>
          <input
            id="generation-count-input"
            data-testid="generation-count-input"
            type="number"
            min="1"
            max="5"
            value={autoGenerationCount}
            onChange={handleGenerationCountChange}
            disabled={!autoGenerationEnabled}
            style={{
              width: '60px',
              padding: '6px 8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              textAlign: 'center',
              cursor: autoGenerationEnabled ? 'text' : 'not-allowed',
            }}
          />
        </div>

        {/* Trigger Descriptor Types */}
        <div
          data-testid="triggers-row"
          className={!autoGenerationEnabled ? 'disabled' : ''}
          style={{
            marginBottom: '16px',
            padding: '8px 0',
            opacity: autoGenerationEnabled ? 1 : 0.5,
          }}
        >
          <label style={{ fontSize: '14px', color: '#333', display: 'block', marginBottom: '12px' }}>
            Trigger on descriptor types
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {(['what', 'why', 'how', 'pros', 'cons'] as const).map((type) => (
              <label
                key={type}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  color: '#333',
                  cursor: autoGenerationEnabled ? 'pointer' : 'not-allowed',
                }}
              >
                <input
                  type="checkbox"
                  data-testid={`trigger-${type}-checkbox`}
                  checked={autoGenerationTriggers[type]}
                  onChange={() => handleTriggerChange(type)}
                  disabled={!autoGenerationEnabled}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: autoGenerationEnabled ? 'pointer' : 'not-allowed',
                  }}
                />
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Auto Summarize Section (EDITOR-3704) */}
      <div
        style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid #eee',
        }}
      >
        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>
          Auto Summarize
        </h2>

        {/* Enable/Disable Toggle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            padding: '8px 0',
          }}
        >
          <label
            htmlFor="auto-summarize-toggle"
            style={{ fontSize: '14px', color: '#333' }}
          >
            Auto-generate notation for long bullets
            <span
              style={{
                display: 'block',
                fontSize: '12px',
                color: '#666',
                marginTop: '2px',
              }}
            >
              Creates a brief key concept summary
            </span>
          </label>
          <input
            id="auto-summarize-toggle"
            data-testid="auto-summarize-toggle"
            type="checkbox"
            checked={autoSummarizeEnabled}
            onChange={handleAutoSummarizeToggle}
            style={{
              width: '20px',
              height: '20px',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Word Threshold Input */}
        <div
          data-testid="auto-summarize-threshold-row"
          className={!autoSummarizeEnabled ? 'disabled' : ''}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            padding: '8px 0',
            opacity: autoSummarizeEnabled ? 1 : 0.5,
          }}
        >
          <label
            htmlFor="auto-summarize-threshold-input"
            style={{ fontSize: '14px', color: '#333' }}
          >
            Word threshold
            <span
              style={{
                display: 'block',
                fontSize: '12px',
                color: '#666',
                marginTop: '2px',
              }}
            >
              Generate notation when text exceeds this word count
            </span>
          </label>
          <input
            id="auto-summarize-threshold-input"
            data-testid="auto-summarize-threshold-input"
            type="number"
            min="10"
            max="100"
            value={autoSummarizeThreshold}
            onChange={handleAutoSummarizeThresholdChange}
            disabled={!autoSummarizeEnabled}
            style={{
              width: '60px',
              padding: '6px 8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              textAlign: 'center',
              cursor: autoSummarizeEnabled ? 'text' : 'not-allowed',
            }}
          />
        </div>

        {/* Info Box */}
        <div
          style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            padding: '12px',
            fontSize: '12px',
            color: '#666',
          }}
        >
          <div style={{ fontWeight: 500, marginBottom: '8px' }}>
            How it works
          </div>
          <p style={{ margin: 0, lineHeight: '1.5' }}>
            When enabled, bullets with more than {autoSummarizeThreshold} words will
            automatically get a brief notation (up to 5 words) displayed before the
            full text. This helps quickly scan long content without losing detail.
          </p>
        </div>
      </div>
    </div>
  )
}
