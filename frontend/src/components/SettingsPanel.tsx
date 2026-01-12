/**
 * Settings Panel Component
 * FE-501: Semantic Linking Settings
 *
 * Provides UI for configuring:
 * - Toggle: Enable/disable semantic linking
 * - Slider: Similarity threshold (0.5 - 1.0)
 * - Input: Max suggestions per concept (1-10)
 */
import { useSettingsStore } from '@/stores/settings-store'

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
    </div>
  )
}
