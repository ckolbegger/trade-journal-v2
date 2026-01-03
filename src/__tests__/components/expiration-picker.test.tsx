import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import userEvent from '@testing-library/user-event'
import { ExpirationDatePicker } from '@/components/ui/ExpirationDatePicker'

describe('ExpirationDatePicker', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    error: '',
    disabled: false,
    minDate: new Date('2024-01-01'),
    maxDate: undefined as Date | undefined
  }

  const today = new Date('2025-06-15')
  const tomorrow = new Date('2025-06-16')
  const yesterday = new Date('2025-06-14')
  const farFuture = new Date('2030-01-01')

  beforeEach(() => {
    vi.clearAllMocks()
    vi.setSystemTime(today)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Rendering', () => {
    it('renders date input field with correct label', () => {
      render(<ExpirationDatePicker {...defaultProps} />)

      expect(screen.getByLabelText(/Expiration Date/i)).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('renders input with date placeholder', () => {
      render(<ExpirationDatePicker {...defaultProps} />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('placeholder', 'MM/DD/YYYY')
    })

    it('displays error message when error prop is provided', () => {
      render(<ExpirationDatePicker {...defaultProps} error="Expiration date is required" />)

      expect(screen.getByText(/Expiration date is required/i)).toBeInTheDocument()
    })

    it('is disabled when disabled prop is true', () => {
      render(<ExpirationDatePicker {...defaultProps} disabled={true} />)

      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
    })

    it('applies error styling when error is present', () => {
      render(<ExpirationDatePicker {...defaultProps} error="Invalid date" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('border-red-500')
    })
  })

  describe('Date Input Behavior', () => {
    it('accepts valid date input via fireEvent', () => {
      const onChange = vi.fn()
      render(<ExpirationDatePicker {...defaultProps} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '06/20/2025' } })

      expect(onChange).toHaveBeenCalledWith('2025-06-20')
    })

    it('accepts date with slashes', () => {
      const onChange = vi.fn()
      render(<ExpirationDatePicker {...defaultProps} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '12/31/2025' } })

      expect(onChange).toHaveBeenCalledWith('2025-12-31')
    })

    it('rejects invalid date format', () => {
      const onChange = vi.fn()
      render(<ExpirationDatePicker {...defaultProps} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'invalid-date' } })

      expect(onChange).not.toHaveBeenCalled()
    })

    it('rejects partially typed dates before completion', () => {
      const onChange = vi.fn()
      render(<ExpirationDatePicker {...defaultProps} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '06/15' } })

      expect(onChange).not.toHaveBeenCalled()
    })

    it('handles empty input', () => {
      const onChange = vi.fn()
      render(<ExpirationDatePicker {...defaultProps} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '06/20/2025' } })
      expect(onChange).toHaveBeenCalledWith('2025-06-20')

      fireEvent.change(input, { target: { value: '' } })
      expect(onChange).toHaveBeenCalledWith('')
    })
  })

  describe('Date Validation - Past Date', () => {
    it('shows error when past date is selected', () => {
      const onChange = vi.fn()
      render(<ExpirationDatePicker {...defaultProps} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '06/14/2025' } })
      fireEvent.blur(input)

      expect(screen.getByText(/Expiration date cannot be in the past/i)).toBeInTheDocument()
    })

    it('does not show error when date is after today but before minDate', () => {
      const onChange = vi.fn()
      const minDateInFuture = new Date('2025-06-20')
      render(<ExpirationDatePicker {...defaultProps} onChange={onChange} minDate={minDateInFuture} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '06/16/2025' } })
      fireEvent.blur(input)

      expect(screen.queryByText(/cannot be in the past/i)).not.toBeInTheDocument()
      expect(screen.getByText(/Date must be on or after/i)).toBeInTheDocument()
    })

    it('shows error for significantly past dates', () => {
      const onChange = vi.fn()
      render(<ExpirationDatePicker {...defaultProps} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '01/01/2020' } })
      fireEvent.blur(input)

      expect(screen.getByText(/Expiration date cannot be in the past/i)).toBeInTheDocument()
    })
  })

  describe('Date Validation - Future Date', () => {
    it('does not show error when future date is selected', () => {
      const onChange = vi.fn()
      render(<ExpirationDatePicker {...defaultProps} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '06/20/2025' } })
      fireEvent.blur(input)

      expect(screen.queryByText(/cannot be in the past/i)).not.toBeInTheDocument()
    })

    it('accepts far future dates', () => {
      const onChange = vi.fn()
      render(<ExpirationDatePicker {...defaultProps} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '12/31/2030' } })
      fireEvent.blur(input)

      expect(onChange).toHaveBeenCalledWith('2030-12-31')
      expect(screen.queryByText(/cannot be in the past/i)).not.toBeInTheDocument()
    })
  })

  describe('Date Validation - Today', () => {
    it('does not show error when today is selected', () => {
      const onChange = vi.fn()
      render(<ExpirationDatePicker {...defaultProps} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '06/15/2025' } })
      fireEvent.blur(input)

      expect(screen.queryByText(/cannot be in the past/i)).not.toBeInTheDocument()
    })

    it('accepts today as valid expiration date', () => {
      const onChange = vi.fn()
      render(<ExpirationDatePicker {...defaultProps} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '06/15/2025' } })

      expect(onChange).toHaveBeenCalledWith('2025-06-15')
    })
  })

  describe('Date Formatting', () => {
    it('formats date as MM/DD/YYYY', () => {
      render(<ExpirationDatePicker {...defaultProps} value="2025-06-20" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('06/20/2025')
    })

    it('formats single digit month with leading zero', () => {
      render(<ExpirationDatePicker {...defaultProps} value="2025-01-05" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('01/05/2025')
    })

    it('formats single digit day with leading zero', () => {
      render(<ExpirationDatePicker {...defaultProps} value="2025-06-05" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('06/05/2025')
    })

    it('handles end of year dates correctly', () => {
      render(<ExpirationDatePicker {...defaultProps} value="2025-12-31" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('12/31/2025')
    })

    it('handles leap year dates correctly', () => {
      render(<ExpirationDatePicker {...defaultProps} value="2024-02-29" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('02/29/2024')
    })

    it('displays empty when value is empty string', () => {
      render(<ExpirationDatePicker {...defaultProps} value="" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('')
    })
  })

  describe('minDate Constraint', () => {
    it('rejects date before minDate', () => {
      const onChange = vi.fn()
      const minDate = new Date('2025-06-20')
      render(<ExpirationDatePicker {...defaultProps} onChange={onChange} minDate={minDate} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '06/16/2025' } })
      fireEvent.blur(input)

      expect(screen.getByText(/Date must be on or after/i)).toBeInTheDocument()
    })

    it('accepts date equal to minDate', () => {
      const onChange = vi.fn()
      const minDate = new Date('2025-06-10')
      render(<ExpirationDatePicker {...defaultProps} onChange={onChange} minDate={minDate} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '06/10/2025' } })
      fireEvent.blur(input)

      expect(screen.queryByText(/must be on or after/i)).not.toBeInTheDocument()
    })

    it('accepts date after minDate', () => {
      const onChange = vi.fn()
      const minDate = new Date('2025-06-10')
      render(<ExpirationDatePicker {...defaultProps} onChange={onChange} minDate={minDate} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '06/15/2025' } })
      fireEvent.blur(input)

      expect(screen.queryByText(/must be on or after/i)).not.toBeInTheDocument()
    })

    it('shows minDate in aria-label or helper text', () => {
      const minDate = new Date('2025-06-10')
      render(<ExpirationDatePicker {...defaultProps} minDate={minDate} />)

      expect(screen.getByText(/06\/10\/2025/i)).toBeInTheDocument()
    })
  })

  describe('maxDate Constraint', () => {
    it('rejects date after maxDate', () => {
      const onChange = vi.fn()
      const maxDate = new Date('2025-06-20')
      render(<ExpirationDatePicker {...defaultProps} onChange={onChange} maxDate={maxDate} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '06/25/2025' } })
      fireEvent.blur(input)

      expect(screen.getByText(/Date must be on or before/i)).toBeInTheDocument()
    })

    it('accepts date equal to maxDate', () => {
      const onChange = vi.fn()
      const maxDate = new Date('2025-06-20')
      render(<ExpirationDatePicker {...defaultProps} onChange={onChange} maxDate={maxDate} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '06/20/2025' } })
      fireEvent.blur(input)

      expect(screen.queryByText(/must be on or before/i)).not.toBeInTheDocument()
    })

    it('accepts date before maxDate', () => {
      const onChange = vi.fn()
      const maxDate = new Date('2025-06-20')
      render(<ExpirationDatePicker {...defaultProps} onChange={onChange} maxDate={maxDate} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '06/15/2025' } })
      fireEvent.blur(input)

      expect(screen.queryByText(/must be on or before/i)).not.toBeInTheDocument()
    })

    it('shows maxDate in aria-label or helper text', () => {
      const maxDate = new Date('2025-06-20')
      render(<ExpirationDatePicker {...defaultProps} maxDate={maxDate} />)

      expect(screen.getByText(/06\/20\/2025/i)).toBeInTheDocument()
    })
  })

  describe('Timezone Handling', () => {
    it('handles dates in local timezone', () => {
      const onChange = vi.fn()
      render(<ExpirationDatePicker {...defaultProps} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '06/15/2025' } })

      expect(onChange).toHaveBeenCalledWith('2025-06-15')
    })

    it('parses date string without timezone conversion', () => {
      const onChange = vi.fn()
      render(<ExpirationDatePicker {...defaultProps} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '12/31/2025' } })

      const calledWith = onChange.mock.calls[0][0]
      expect(calledWith).toBe('2025-12-31')
    })

    it('preserves date value across timezone changes', () => {
      const onChange = vi.fn()
      const { rerender } = render(<ExpirationDatePicker {...defaultProps} onChange={onChange} value="2025-06-15" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('06/15/2025')

      rerender(<ExpirationDatePicker {...defaultProps} value="2025-06-15" />)
      expect(input).toHaveValue('06/15/2025')
    })
  })

  describe('Error Display', () => {
    it('clears error when valid date is entered', () => {
      const onChange = vi.fn()
      render(<ExpirationDatePicker {...defaultProps} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'invalid-date' } })
      fireEvent.blur(input)
      expect(screen.getByText(/Invalid date format/i)).toBeInTheDocument()

      fireEvent.change(input, { target: { value: '06/20/2025' } })
      fireEvent.blur(input)

      expect(screen.queryByText(/Invalid date/i)).not.toBeInTheDocument()
    })

    it('prioritizes prop error over local error', () => {
      const onChange = vi.fn()
      render(<ExpirationDatePicker {...defaultProps} error="Prop error" onChange={onChange} />)

      expect(screen.getByText(/Prop error/i)).toBeInTheDocument()
    })
  })

  describe('Disabled State', () => {
    it('does not call onChange when disabled', () => {
      const onChange = vi.fn()
      render(<ExpirationDatePicker {...defaultProps} disabled={true} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '06/20/2025' } })

      expect(onChange).not.toHaveBeenCalled()
    })

    it('does not show error when disabled', () => {
      render(<ExpirationDatePicker {...defaultProps} disabled={true} />)

      const input = screen.getByRole('textbox')
      expect(input).not.toHaveClass('border-red-500')
    })
  })

  describe('Reset Functionality', () => {
    it('clears value when reset button is clicked', async () => {
      const onChange = vi.fn()
      render(<ExpirationDatePicker {...defaultProps} value="2025-06-20" onChange={onChange} />)

      const resetButton = screen.getByRole('button', { name: /clear/i })
      await userEvent.click(resetButton)

      expect(onChange).toHaveBeenCalledWith('')
    })

    it('displays empty when value is empty string', () => {
      render(<ExpirationDatePicker {...defaultProps} value="" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('')
    })
  })
})
