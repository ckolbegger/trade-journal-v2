import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EnhancedJournalEntryForm } from '@/components/EnhancedJournalEntryForm'
import type { JournalField } from '@/types/journal'

describe('EnhancedJournalEntryForm', () => {
  const mockOnSave = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Position Plan Form', () => {
    it('should render structured form fields for position planning', () => {
      // This will fail until component is implemented
      render(
        <EnhancedJournalEntryForm
          entryType="position_plan"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // Verify structured form elements are present
      expect(screen.getByLabelText(/Rationale/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Emotional State/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Market Conditions/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Execution Strategy/i)).toBeInTheDocument()

      // Verify required field indicator
      expect(screen.getByText(/Rationale \*/)).toBeInTheDocument()

      // Verify character count display (multiple fields have this, so just check it exists)
      expect(screen.getAllByText(/0\/2000 characters/i)).toHaveLength(3)
    })

    it('should show validation errors for required fields', async () => {
      // This will fail until validation is implemented
      render(
        <EnhancedJournalEntryForm
          entryType="position_plan"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // Try to submit without required content
      const submitButton = screen.getByRole('button', { name: /Save Journal Entry/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/This field is required/i)).toBeInTheDocument()
      })

      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('should validate minimum character count', async () => {
      // This will fail until validation is implemented
      render(
        <EnhancedJournalEntryForm
          entryType="position_plan"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // Enter content that's too short
      const contentField = screen.getByLabelText(/Rationale/i)
      fireEvent.change(contentField, { target: { value: 'short' } })

      const submitButton = screen.getByRole('button', { name: /Save Journal Entry/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Content must be at least 10 characters/i)).toBeInTheDocument()
      })

      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('should update character count display', () => {
      // This will fail until character counting is implemented
      render(
        <EnhancedJournalEntryForm
          entryType="position_plan"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      const contentField = screen.getByLabelText(/Rationale/i)
      fireEvent.change(contentField, { target: { value: 'This is a test entry with some content' } })

      // Check that the character count updates (looking in the rationale field's container)
      const rationaleContainer = contentField.closest('div')
      expect(rationaleContainer).toHaveTextContent('38/2000 characters')
    })

    it('should convert structured form data to field-based format on save', async () => {
      // This will fail until data conversion is implemented
      render(
        <EnhancedJournalEntryForm
          entryType="position_plan"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // Fill out form with structured data
      fireEvent.change(screen.getByLabelText(/Rationale/i), {
        target: { value: 'AAPL showing strong technical support levels' }
      })
      fireEvent.change(screen.getByLabelText(/Emotional State/i), {
        target: { value: 'Confident' }
      })
      fireEvent.change(screen.getByLabelText(/Market Conditions/i), {
        target: { value: 'Bullish trend with Fed pause expected' }
      })
      fireEvent.change(screen.getByLabelText(/Execution Strategy/i), {
        target: { value: 'Limit order at support level' }
      })

      const submitButton = screen.getByRole('button', { name: /Save Journal Entry/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith([
          {
            name: 'rationale',
            prompt: 'Why this trade? Why now?',
            response: 'AAPL showing strong technical support levels',
            required: true
          },
          {
            name: 'emotional_state',
            prompt: 'How are you feeling about this trade?',
            response: 'Confident',
            required: false
          },
          {
            name: 'market_conditions',
            prompt: 'Describe current market environment and how it affects this trade',
            response: 'Bullish trend with Fed pause expected',
            required: false
          },
          {
            name: 'execution_strategy',
            prompt: 'How will you enter and exit this position?',
            response: 'Limit order at support level',
            required: false
          }
        ])
      })
    })

    it('should populate form with initial data when provided', () => {
      // This will fail until initial data handling is implemented
      const initialFields: JournalField[] = [
        {
          name: 'thesis',
          prompt: 'Why are you planning this position?',
          response: 'Initial thesis content'
        },
        {
          name: 'emotional_state',
          prompt: 'How are you feeling?',
          response: 'Excited'
        }
      ]

      render(
        <EnhancedJournalEntryForm
          entryType="position_plan"
          initialFields={initialFields}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByDisplayValue('Initial thesis content')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Excited')).toBeInTheDocument()
    })
  })

  describe('Trade Execution Form', () => {
    it('should render structured form fields for trade execution', () => {
      // This will fail until component is implemented
      render(
        <EnhancedJournalEntryForm
          entryType="trade_execution"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // Verify trade execution specific fields
      expect(screen.getByLabelText(/Execution Notes/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Emotional State/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Market Conditions/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Execution Strategy/i)).toBeInTheDocument()
    })

    it('should convert trade execution data to field-based format', async () => {
      // This will fail until data conversion is implemented
      render(
        <EnhancedJournalEntryForm
          entryType="trade_execution"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      fireEvent.change(screen.getByLabelText(/Execution Notes/i), {
        target: { value: 'Filled at $149.48, better than expected' }
      })
      fireEvent.change(screen.getByLabelText(/Emotional State/i), {
        target: { value: 'Calm and focused' }
      })

      const submitButton = screen.getByRole('button', { name: /Save Journal Entry/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith([
          {
            name: 'execution_notes',
            prompt: 'Describe the execution',
            response: 'Filled at $149.48, better than expected',
            required: false
          },
          {
            name: 'emotional_state',
            prompt: 'How do you feel about this execution?',
            response: 'Calm and focused',
            required: false
          },
          {
            name: 'market_conditions',
            prompt: 'Describe current market environment and how it affects this trade',
            response: '',
            required: false
          },
          {
            name: 'execution_strategy',
            prompt: 'How will you enter and exit this position?',
            response: '',
            required: false
          }
        ])
      })
    })
  })

  describe('Form Actions', () => {
    it('should call onCancel when cancel button is clicked', () => {
      // This will fail until cancel functionality is implemented
      render(
        <EnhancedJournalEntryForm
          entryType="position_plan"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      fireEvent.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('should support custom submit button text', () => {
      // This will fail until custom button text is implemented
      render(
        <EnhancedJournalEntryForm
          entryType="position_plan"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          submitButtonText="Next: Confirmation"
        />
      )

      expect(screen.getByRole('button', { name: /Next: Confirmation/i })).toBeInTheDocument()
    })

    it('should disable submit button while loading', () => {
      // This will fail until loading state is implemented
      render(
        <EnhancedJournalEntryForm
          entryType="position_plan"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      )

      const submitButton = screen.getByRole('button', { name: /Saving.../i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Flexible Journal Display (Migration Support)', () => {
    it('should title-case field names for display', () => {
      const legacyFields: JournalField[] = [
        {
          name: 'thesis',
          prompt: 'Why are you planning this position?',
          response: 'Legacy thesis content'
        }
      ]

      render(
        <EnhancedJournalEntryForm
          entryType="position_plan"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          initialFields={legacyFields}
        />
      )

      // Should display title-cased field name
      expect(screen.getByText('Thesis')).toBeInTheDocument()
    })

    it('should display stored prompts exactly as-is from legacy entries', () => {
      const legacyFields: JournalField[] = [
        {
          name: 'thesis',
          prompt: 'Why are you planning this position?', // Old prompt
          response: 'Legacy response'
        }
      ]

      render(
        <EnhancedJournalEntryForm
          entryType="position_plan"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          initialFields={legacyFields}
        />
      )

      // Should display stored prompt, not current JOURNAL_PROMPTS
      expect(screen.getByText('Why are you planning this position?')).toBeInTheDocument()
    })

    it('should validate using stored required values from fields', async () => {
      const fieldsWithRequiredInfo: JournalField[] = [
        {
          name: 'rationale',
          prompt: 'Why this trade? Why now?',
          response: '',
          required: true
        },
        {
          name: 'emotional_state',
          prompt: 'How are you feeling?',
          response: '',
          required: false
        }
      ]

      render(
        <EnhancedJournalEntryForm
          entryType="position_plan"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          initialFields={fieldsWithRequiredInfo}
        />
      )

      // Try to submit with empty required field
      const submitButton = screen.getByRole('button', { name: /Save Journal Entry/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/This field is required/i)).toBeInTheDocument()
      })
    })

    it('should handle legacy entries without required field (defaults to false)', async () => {
      const legacyFieldsWithoutRequired: JournalField[] = [
        {
          name: 'thesis',
          prompt: 'Why are you planning this position?',
          response: ''
          // No required property - should default to false
        }
      ]

      render(
        <EnhancedJournalEntryForm
          entryType="position_plan"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          initialFields={legacyFieldsWithoutRequired}
        />
      )

      // Should be able to submit with empty field since it defaults to optional
      const submitButton = screen.getByRole('button', { name: /Save Journal Entry/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled()
      })
    })

    it('should display mixed old and new field types correctly', () => {
      const mixedFields: JournalField[] = [
        {
          name: 'thesis',
          prompt: 'Why are you planning this position?', // Old style
          response: 'Old thesis response'
        },
        {
          name: 'rationale',
          prompt: 'Why this trade? Why now?', // New style
          response: 'New rationale response',
          required: true
        }
      ]

      render(
        <EnhancedJournalEntryForm
          entryType="position_plan"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          initialFields={mixedFields}
        />
      )

      // Should display both field types with title-cased names
      expect(screen.getByText('Thesis')).toBeInTheDocument()
      // Use getByLabelText to find the rationale field by its label
      expect(screen.getByLabelText(/Rationale/)).toBeInTheDocument()

      // Should display their respective prompts
      expect(screen.getByText('Why are you planning this position?')).toBeInTheDocument()
      expect(screen.getByText('Why this trade? Why now?')).toBeInTheDocument()
    })

    it('should work with form when no initialFields provided (uses current JOURNAL_PROMPTS)', () => {
      render(
        <EnhancedJournalEntryForm
          entryType="position_plan"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // Should still work with current prompt definitions, showing title-cased field names
      expect(screen.getByLabelText(/Rationale/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Emotional State/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Market Conditions/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Execution Strategy/i)).toBeInTheDocument()
    })
  })
})