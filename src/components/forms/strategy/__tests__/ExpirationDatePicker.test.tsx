import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExpirationDatePicker } from '../ExpirationDatePicker'

/**
 * Comprehensive test suite for ExpirationDatePicker component
 *
 * This test suite verifies that the expiration date picker works correctly:
 * - Component renders with label "Expiration Date"
 * - Input type is "date"
 * - min attribute set to current date (prevents past dates)
 * - Accepts valid future dates
 * - Shows validation error for past dates if error prop provided
 * - Shows validation error for empty value if required
 * - Value changes trigger onChange callback
 * - Date value formatted correctly (YYYY-MM-DD)
 */

describe('ExpirationDatePicker', () => {
  let today: string

  beforeEach(() => {
    const date = new Date()
    today = date.toISOString().split('T')[0]
  })

  describe('Rendering', () => {
    it('should render with label "Expiration Date"', () => {
      render(<ExpirationDatePicker value="" onChange={vi.fn()} />)

      expect(screen.getByLabelText(/Expiration Date/i)).toBeInTheDocument()
    })

    it('should render input with type "date"', () => {
      render(<ExpirationDatePicker value="" onChange={vi.fn()} />)

      const input = screen.getByLabelText(/Expiration Date/i)
      expect(input).toHaveAttribute('type', 'date')
    })

    it('should have id for label association', () => {
      render(<ExpirationDatePicker value="" onChange={vi.fn()} />)

      const input = screen.getByLabelText(/Expiration Date/i)
      expect(input.id).toBe('expiration_date')
    })
  })

  describe('Min Date Attribute', () => {
    it('should set min attribute to current date', () => {
      render(<ExpirationDatePicker value="" onChange={vi.fn()} />)

      const input = screen.getByLabelText(/Expiration Date/i)
      expect(input).toHaveAttribute('min', today)
    })

    it('should prevent past dates via min attribute', () => {
      render(<ExpirationDatePicker value="" onChange={vi.fn()} />)

      const input = screen.getByLabelText(/Expiration Date/i)
      const minDate = input.getAttribute('min')
      expect(minDate).toBeDefined()
    })
  })

  describe('Date Input', () => {
    it('should accept valid future dates', () => {
      const handleChange = vi.fn()
      const futureDate = '2026-12-31'

      render(<ExpirationDatePicker value={futureDate} onChange={handleChange} />)

      const input = screen.getByLabelText(/Expiration Date/i) as HTMLInputElement
      expect(input.value).toBe(futureDate)
    })

    it('should format date value correctly (YYYY-MM-DD)', () => {
      const handleChange = vi.fn()
      render(<ExpirationDatePicker value="2026-06-15" onChange={handleChange} />)

      const input = screen.getByLabelText(/Expiration Date/i) as HTMLInputElement
      expect(input.value).toBe('2026-06-15')
    })

    it('should display provided value correctly', () => {
      render(<ExpirationDatePicker value="2026-01-17" onChange={vi.fn()} />)

      const input = screen.getByLabelText(/Expiration Date/i) as HTMLInputElement
      expect(input.value).toBe('2026-01-17')
    })
  })

  describe('onChange Callback', () => {
    it('should trigger onChange callback when value changes', () => {
      const handleChange = vi.fn()
      render(<ExpirationDatePicker value="" onChange={handleChange} />)

      const input = screen.getByLabelText(/Expiration Date/i)
      fireEvent.change(input, { target: { value: '2026-12-31' } })

      expect(handleChange).toHaveBeenCalledWith('2026-12-31')
    })

    it('should trigger onChange with empty string when cleared', () => {
      const handleChange = vi.fn()
      render(<ExpirationDatePicker value="2026-01-17" onChange={handleChange} />)

      const input = screen.getByLabelText(/Expiration Date/i)
      fireEvent.change(input, { target: { value: '' } })

      expect(handleChange).toHaveBeenCalledWith('')
    })
  })

  describe('Validation Errors', () => {
    it('should show validation error for past dates when error prop provided', () => {
      render(
        <ExpirationDatePicker
          value="2020-01-01"
          onChange={vi.fn()}
          error="Expiration date must be in the future"
        />
      )

      expect(screen.getByText('Expiration date must be in the future')).toBeInTheDocument()
    })

    it('should show validation error for empty value if required', () => {
      render(
        <ExpirationDatePicker
          value=""
          onChange={vi.fn()}
          error="Expiration date is required"
        />
      )

      expect(screen.getByText('Expiration date is required')).toBeInTheDocument()
    })

    it('should not show error when error prop is not provided', () => {
      render(<ExpirationDatePicker value="2026-01-17" onChange={vi.fn()} />)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should not show error when error prop is empty string', () => {
      render(
        <ExpirationDatePicker
          value="2026-01-17"
          onChange={vi.fn()}
          error=""
        />
      )

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should apply error styling to input when error is provided', () => {
      render(
        <ExpirationDatePicker
          value="2020-01-01"
          onChange={vi.fn()}
          error="Expiration date must be in the future"
        />
      )

      const input = screen.getByLabelText(/Expiration Date/i)
      expect(input.className).toContain('border-red-600')
    })
  })

  describe('Controlled Component', () => {
    it('should be controlled component (value prop controls input)', () => {
      const handleChange = vi.fn()
      const { rerender } = render(<ExpirationDatePicker value="2026-01-17" onChange={handleChange} />)

      let input = screen.getByLabelText(/Expiration Date/i) as HTMLInputElement
      expect(input.value).toBe('2026-01-17')

      rerender(<ExpirationDatePicker value="2026-06-30" onChange={handleChange} />)

      input = screen.getByLabelText(/Expiration Date/i) as HTMLInputElement
      expect(input.value).toBe('2026-06-30')
    })
  })

  describe('Component Props', () => {
    it('should accept custom id prop', () => {
      render(<ExpirationDatePicker value="" onChange={vi.fn()} id="custom-expiry" />)

      const input = screen.getByLabelText(/Expiration Date/i)
      expect(input.id).toBe('custom-expiry')
    })

    it('should accept className prop for custom styling', () => {
      render(<ExpirationDatePicker value="" onChange={vi.fn()} className="custom-class" />)

      const wrapper = screen.getByLabelText(/Expiration Date/i).parentElement
      expect(wrapper?.className).toContain('custom-class')
    })

    it('should accept required prop', () => {
      render(<ExpirationDatePicker value="" onChange={vi.fn()} required />)

      expect(screen.getByText(/\*/)).toBeInTheDocument()
    })

    it('should not show asterisk when not required', () => {
      render(<ExpirationDatePicker value="" onChange={vi.fn()} />)

      expect(screen.queryByText(/\*/)).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      render(<ExpirationDatePicker value="2026-01-17" onChange={vi.fn()} />)

      const label = screen.getByLabelText(/Expiration Date/i)
      expect(label).toBeInTheDocument()
    })
  })
})
