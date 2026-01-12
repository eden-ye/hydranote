/**
 * Tests for SettingsPanel Component
 * FE-501: Semantic Linking Settings
 *
 * Tests for the settings panel UI that includes:
 * - Toggle: Enable/disable semantic linking
 * - Slider: Similarity threshold (0.5 - 1.0)
 * - Input: Max suggestions per concept (1-10)
 * - Threshold explanation text
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsPanel } from '../SettingsPanel'
import { useSettingsStore } from '@/stores/settings-store'

// Mock the settings store
vi.mock('@/stores/settings-store', () => ({
  useSettingsStore: vi.fn(),
  SEMANTIC_LINKING_DEFAULTS: {
    enabled: true,
    threshold: 0.8,
    maxSuggestionsPerConcept: 3,
  },
  AUTO_GENERATION_DEFAULTS: {
    enabled: false,
    count: 3,
    triggers: { what: true, why: true, how: true, pros: false, cons: false },
  },
}))

const mockSetSemanticLinkingEnabled = vi.fn()
const mockSetSemanticLinkingThreshold = vi.fn()
const mockSetSemanticLinkingMaxSuggestions = vi.fn()
const mockResetToDefaults = vi.fn()
const mockSetAutoGenerationEnabled = vi.fn()
const mockSetAutoGenerationCount = vi.fn()
const mockSetAutoGenerationTrigger = vi.fn()

const defaultMockState = {
  semanticLinkingEnabled: true,
  semanticLinkingThreshold: 0.8,
  semanticLinkingMaxSuggestions: 3,
  setSemanticLinkingEnabled: mockSetSemanticLinkingEnabled,
  setSemanticLinkingThreshold: mockSetSemanticLinkingThreshold,
  setSemanticLinkingMaxSuggestions: mockSetSemanticLinkingMaxSuggestions,
  resetToDefaults: mockResetToDefaults,
  // Auto-generation settings (FE-502)
  autoGenerationEnabled: false,
  autoGenerationCount: 3,
  autoGenerationTriggers: { what: true, why: true, how: true, pros: false, cons: false },
  setAutoGenerationEnabled: mockSetAutoGenerationEnabled,
  setAutoGenerationCount: mockSetAutoGenerationCount,
  setAutoGenerationTrigger: mockSetAutoGenerationTrigger,
}

describe('SettingsPanel (FE-501)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(defaultMockState)
  })

  describe('Rendering', () => {
    it('should render the settings panel', () => {
      render(<SettingsPanel />)
      expect(screen.getByTestId('settings-panel')).toBeInTheDocument()
    })

    it('should render Semantic Linking section header', () => {
      render(<SettingsPanel />)
      expect(screen.getByText('Semantic Linking')).toBeInTheDocument()
    })

    it('should render enable toggle with label', () => {
      render(<SettingsPanel />)
      expect(screen.getByText('Enable semantic linking')).toBeInTheDocument()
      expect(screen.getByTestId('semantic-linking-toggle')).toBeInTheDocument()
    })

    it('should render threshold slider with label', () => {
      render(<SettingsPanel />)
      expect(screen.getByText('Similarity threshold')).toBeInTheDocument()
      expect(screen.getByTestId('threshold-slider')).toBeInTheDocument()
    })

    it('should render max suggestions input with label', () => {
      render(<SettingsPanel />)
      expect(screen.getByText('Max suggestions per concept')).toBeInTheDocument()
      expect(screen.getByTestId('max-suggestions-input')).toBeInTheDocument()
    })

    it('should display threshold explanation text', () => {
      render(<SettingsPanel />)
      expect(screen.getByText(/Higher = more precise/i)).toBeInTheDocument()
    })

    it('should display current threshold value', () => {
      render(<SettingsPanel />)
      const slider = screen.getByTestId('threshold-slider') as HTMLInputElement
      expect(slider.value).toBe('0.8')
    })
  })

  describe('Enable Toggle', () => {
    it('should show toggle as checked when enabled', () => {
      render(<SettingsPanel />)
      const toggle = screen.getByTestId('semantic-linking-toggle') as HTMLInputElement
      expect(toggle.checked).toBe(true)
    })

    it('should show toggle as unchecked when disabled', () => {
      ;(useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...defaultMockState,
        semanticLinkingEnabled: false,
      })
      render(<SettingsPanel />)
      const toggle = screen.getByTestId('semantic-linking-toggle') as HTMLInputElement
      expect(toggle.checked).toBe(false)
    })

    it('should call setSemanticLinkingEnabled when toggle is clicked', async () => {
      const user = userEvent.setup()
      render(<SettingsPanel />)
      const toggle = screen.getByTestId('semantic-linking-toggle')

      await user.click(toggle)

      expect(mockSetSemanticLinkingEnabled).toHaveBeenCalledWith(false)
    })
  })

  describe('Threshold Slider', () => {
    it('should display current threshold value', () => {
      ;(useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...defaultMockState,
        semanticLinkingThreshold: 0.9,
      })
      render(<SettingsPanel />)
      const slider = screen.getByTestId('threshold-slider') as HTMLInputElement
      expect(slider.value).toBe('0.9')
    })

    it('should have min attribute of 0.5', () => {
      render(<SettingsPanel />)
      const slider = screen.getByTestId('threshold-slider') as HTMLInputElement
      expect(slider.min).toBe('0.5')
    })

    it('should have max attribute of 1', () => {
      render(<SettingsPanel />)
      const slider = screen.getByTestId('threshold-slider') as HTMLInputElement
      expect(slider.max).toBe('1')
    })

    it('should have step attribute of 0.05', () => {
      render(<SettingsPanel />)
      const slider = screen.getByTestId('threshold-slider') as HTMLInputElement
      expect(slider.step).toBe('0.05')
    })

    it('should call setSemanticLinkingThreshold when slider changes', () => {
      render(<SettingsPanel />)
      const slider = screen.getByTestId('threshold-slider')

      fireEvent.change(slider, { target: { value: '0.9' } })

      expect(mockSetSemanticLinkingThreshold).toHaveBeenCalledWith(0.9)
    })

    it('should be disabled when semantic linking is disabled', () => {
      ;(useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...defaultMockState,
        semanticLinkingEnabled: false,
      })
      render(<SettingsPanel />)
      const slider = screen.getByTestId('threshold-slider') as HTMLInputElement
      expect(slider.disabled).toBe(true)
    })
  })

  describe('Max Suggestions Input', () => {
    it('should display current max suggestions value', () => {
      render(<SettingsPanel />)
      const input = screen.getByTestId('max-suggestions-input') as HTMLInputElement
      expect(input.value).toBe('3')
    })

    it('should have min attribute of 1', () => {
      render(<SettingsPanel />)
      const input = screen.getByTestId('max-suggestions-input') as HTMLInputElement
      expect(input.min).toBe('1')
    })

    it('should have max attribute of 10', () => {
      render(<SettingsPanel />)
      const input = screen.getByTestId('max-suggestions-input') as HTMLInputElement
      expect(input.max).toBe('10')
    })

    it('should call setSemanticLinkingMaxSuggestions when input changes', () => {
      render(<SettingsPanel />)
      const input = screen.getByTestId('max-suggestions-input')

      fireEvent.change(input, { target: { value: '5' } })

      expect(mockSetSemanticLinkingMaxSuggestions).toHaveBeenCalledWith(5)
    })

    it('should be disabled when semantic linking is disabled', () => {
      ;(useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...defaultMockState,
        semanticLinkingEnabled: false,
      })
      render(<SettingsPanel />)
      const input = screen.getByTestId('max-suggestions-input') as HTMLInputElement
      expect(input.disabled).toBe(true)
    })
  })

  describe('Threshold Guide', () => {
    it('should display threshold meaning guide', () => {
      render(<SettingsPanel />)
      // Check for guide content
      expect(screen.getByText(/0.9\+/)).toBeInTheDocument()
      expect(screen.getByText(/Very similar/)).toBeInTheDocument()
      // 0.8 appears in threshold display and guide, use getAllByText
      expect(screen.getAllByText(/0.8/).length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText(/Related \(recommended\)/i)).toBeInTheDocument()
    })
  })

  describe('Disabled State', () => {
    it('should apply disabled styling to threshold section when disabled', () => {
      ;(useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...defaultMockState,
        semanticLinkingEnabled: false,
      })
      render(<SettingsPanel />)

      const thresholdRow = screen.getByTestId('threshold-row')
      expect(thresholdRow).toHaveClass('disabled')
    })

    it('should apply disabled styling to max suggestions section when disabled', () => {
      ;(useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...defaultMockState,
        semanticLinkingEnabled: false,
      })
      render(<SettingsPanel />)

      const maxSuggestionsRow = screen.getByTestId('max-suggestions-row')
      expect(maxSuggestionsRow).toHaveClass('disabled')
    })
  })

  describe('onClose callback', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<SettingsPanel onClose={onClose} />)

      const closeButton = screen.getByTestId('settings-close-button')
      await user.click(closeButton)

      expect(onClose).toHaveBeenCalled()
    })
  })
})

/**
 * Tests for Auto-Generation Settings UI
 * FE-502: Auto-Generation Settings
 *
 * Tests for the settings panel UI that includes:
 * - Toggle: Enable/disable auto-generation
 * - Input: Generation count (1-5)
 * - Checkboxes: Which descriptor types trigger generation
 */
describe('SettingsPanel - Auto-Generation (FE-502)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(defaultMockState)
  })

  describe('Rendering', () => {
    it('should render Auto-Generation section header', () => {
      render(<SettingsPanel />)
      expect(screen.getByText('Auto Generation')).toBeInTheDocument()
    })

    it('should render auto-generation toggle with label', () => {
      render(<SettingsPanel />)
      expect(screen.getByText('Auto-generate after descriptor creation')).toBeInTheDocument()
      expect(screen.getByTestId('auto-generation-toggle')).toBeInTheDocument()
    })

    it('should render generation count input with label', () => {
      render(<SettingsPanel />)
      expect(screen.getByText('Bullets per descriptor')).toBeInTheDocument()
      expect(screen.getByTestId('generation-count-input')).toBeInTheDocument()
    })

    it('should render descriptor type checkboxes', () => {
      render(<SettingsPanel />)
      expect(screen.getByText('Trigger on descriptor types')).toBeInTheDocument()
      expect(screen.getByTestId('trigger-what-checkbox')).toBeInTheDocument()
      expect(screen.getByTestId('trigger-why-checkbox')).toBeInTheDocument()
      expect(screen.getByTestId('trigger-how-checkbox')).toBeInTheDocument()
      expect(screen.getByTestId('trigger-pros-checkbox')).toBeInTheDocument()
      expect(screen.getByTestId('trigger-cons-checkbox')).toBeInTheDocument()
    })

    it('should display descriptor type labels', () => {
      render(<SettingsPanel />)
      expect(screen.getByText('What')).toBeInTheDocument()
      expect(screen.getByText('Why')).toBeInTheDocument()
      expect(screen.getByText('How')).toBeInTheDocument()
      expect(screen.getByText('Pros')).toBeInTheDocument()
      expect(screen.getByText('Cons')).toBeInTheDocument()
    })
  })

  describe('Auto-Generation Toggle', () => {
    it('should show toggle as unchecked when disabled (default)', () => {
      render(<SettingsPanel />)
      const toggle = screen.getByTestId('auto-generation-toggle') as HTMLInputElement
      expect(toggle.checked).toBe(false)
    })

    it('should show toggle as checked when enabled', () => {
      ;(useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...defaultMockState,
        autoGenerationEnabled: true,
      })
      render(<SettingsPanel />)
      const toggle = screen.getByTestId('auto-generation-toggle') as HTMLInputElement
      expect(toggle.checked).toBe(true)
    })

    it('should call setAutoGenerationEnabled when toggle is clicked', async () => {
      const user = userEvent.setup()
      render(<SettingsPanel />)
      const toggle = screen.getByTestId('auto-generation-toggle')

      await user.click(toggle)

      expect(mockSetAutoGenerationEnabled).toHaveBeenCalledWith(true)
    })
  })

  describe('Generation Count Input', () => {
    it('should display current count value (3)', () => {
      render(<SettingsPanel />)
      const input = screen.getByTestId('generation-count-input') as HTMLInputElement
      expect(input.value).toBe('3')
    })

    it('should have min attribute of 1', () => {
      render(<SettingsPanel />)
      const input = screen.getByTestId('generation-count-input') as HTMLInputElement
      expect(input.min).toBe('1')
    })

    it('should have max attribute of 5', () => {
      render(<SettingsPanel />)
      const input = screen.getByTestId('generation-count-input') as HTMLInputElement
      expect(input.max).toBe('5')
    })

    it('should call setAutoGenerationCount when input changes', () => {
      render(<SettingsPanel />)
      const input = screen.getByTestId('generation-count-input')

      fireEvent.change(input, { target: { value: '4' } })

      expect(mockSetAutoGenerationCount).toHaveBeenCalledWith(4)
    })

    it('should be disabled when auto-generation is disabled', () => {
      render(<SettingsPanel />)
      const input = screen.getByTestId('generation-count-input') as HTMLInputElement
      expect(input.disabled).toBe(true)
    })

    it('should be enabled when auto-generation is enabled', () => {
      ;(useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...defaultMockState,
        autoGenerationEnabled: true,
      })
      render(<SettingsPanel />)
      const input = screen.getByTestId('generation-count-input') as HTMLInputElement
      expect(input.disabled).toBe(false)
    })
  })

  describe('Descriptor Type Checkboxes', () => {
    it('should show What, Why, How as checked by default', () => {
      render(<SettingsPanel />)
      expect((screen.getByTestId('trigger-what-checkbox') as HTMLInputElement).checked).toBe(true)
      expect((screen.getByTestId('trigger-why-checkbox') as HTMLInputElement).checked).toBe(true)
      expect((screen.getByTestId('trigger-how-checkbox') as HTMLInputElement).checked).toBe(true)
    })

    it('should show Pros, Cons as unchecked by default', () => {
      render(<SettingsPanel />)
      expect((screen.getByTestId('trigger-pros-checkbox') as HTMLInputElement).checked).toBe(false)
      expect((screen.getByTestId('trigger-cons-checkbox') as HTMLInputElement).checked).toBe(false)
    })

    it('should call setAutoGenerationTrigger when What checkbox is clicked', async () => {
      ;(useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...defaultMockState,
        autoGenerationEnabled: true,
      })
      const user = userEvent.setup()
      render(<SettingsPanel />)
      const checkbox = screen.getByTestId('trigger-what-checkbox')

      await user.click(checkbox)

      expect(mockSetAutoGenerationTrigger).toHaveBeenCalledWith('what', false)
    })

    it('should call setAutoGenerationTrigger when Pros checkbox is clicked', async () => {
      ;(useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...defaultMockState,
        autoGenerationEnabled: true,
      })
      const user = userEvent.setup()
      render(<SettingsPanel />)
      const checkbox = screen.getByTestId('trigger-pros-checkbox')

      await user.click(checkbox)

      expect(mockSetAutoGenerationTrigger).toHaveBeenCalledWith('pros', true)
    })

    it('should be disabled when auto-generation is disabled', () => {
      render(<SettingsPanel />)
      expect((screen.getByTestId('trigger-what-checkbox') as HTMLInputElement).disabled).toBe(true)
      expect((screen.getByTestId('trigger-why-checkbox') as HTMLInputElement).disabled).toBe(true)
      expect((screen.getByTestId('trigger-how-checkbox') as HTMLInputElement).disabled).toBe(true)
      expect((screen.getByTestId('trigger-pros-checkbox') as HTMLInputElement).disabled).toBe(true)
      expect((screen.getByTestId('trigger-cons-checkbox') as HTMLInputElement).disabled).toBe(true)
    })

    it('should be enabled when auto-generation is enabled', () => {
      ;(useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...defaultMockState,
        autoGenerationEnabled: true,
      })
      render(<SettingsPanel />)
      expect((screen.getByTestId('trigger-what-checkbox') as HTMLInputElement).disabled).toBe(false)
      expect((screen.getByTestId('trigger-why-checkbox') as HTMLInputElement).disabled).toBe(false)
      expect((screen.getByTestId('trigger-how-checkbox') as HTMLInputElement).disabled).toBe(false)
      expect((screen.getByTestId('trigger-pros-checkbox') as HTMLInputElement).disabled).toBe(false)
      expect((screen.getByTestId('trigger-cons-checkbox') as HTMLInputElement).disabled).toBe(false)
    })
  })

  describe('Disabled State Styling', () => {
    it('should apply disabled styling to generation count row when disabled', () => {
      render(<SettingsPanel />)
      const countRow = screen.getByTestId('generation-count-row')
      expect(countRow).toHaveClass('disabled')
    })

    it('should apply disabled styling to trigger checkboxes row when disabled', () => {
      render(<SettingsPanel />)
      const triggersRow = screen.getByTestId('triggers-row')
      expect(triggersRow).toHaveClass('disabled')
    })

    it('should not apply disabled styling when auto-generation is enabled', () => {
      ;(useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...defaultMockState,
        autoGenerationEnabled: true,
      })
      render(<SettingsPanel />)
      const countRow = screen.getByTestId('generation-count-row')
      const triggersRow = screen.getByTestId('triggers-row')
      expect(countRow).not.toHaveClass('disabled')
      expect(triggersRow).not.toHaveClass('disabled')
    })
  })
})
