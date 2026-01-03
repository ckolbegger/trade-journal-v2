import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StrikePriceInput } from '../StrikePriceInput'

/**
 * Comprehensive test suite for StrikePriceInput component
 *
 * This test suite verifies that the strike price input works correctly:
 * - Component renders with label "Strike Price"
 * - Input type is "number" with step="0.01"
 * - Displays $ prefix before input field
 * - Accepts positive strike prices (e.g., 100, 105.50, 250)
 * - Shows validation error for strike <= 0 if error prop provided
 * - Shows validation error for missing value if required and empty
 * - Value changes trigger onChange callback
 * - Displays current value correctly formatted
 */

describe('StrikePriceInput', () => {
  describe('Rendering', () => {
    it('should render with label "Strike Price"', () => {
      render(<StrikePriceInput value="100" onChange={vi.fn()} />)

      expect(screen.getByLabelText(/Strike Price/i)).toBeInTheDocument()
    })

    it('should render input with type "number"', () => {
      render(<StrikePriceInput value="100" onChange={vi.fn()} />)

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('type', 'number')
    })

    it('should have step attribute set to "0.01"', () => {
      render(<StrikePriceInput value="100" onChange={vi.fn()} />)

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('step', '0.01')
    })

    it('should display $ prefix before input field', () => {
      render(<StrikePriceInput value="100" onChange={vi.fn()} />)

      expect(screen.getByText('$')).toBeInTheDocument()
    })

    it('should have proper id for label association', () => {
      render(<StrikePriceInput value="100" onChange={vi.fn()} />)

      const input = screen.getByRole('spinbutton')
      expect(input.id).toBe('strike_price')
    })
  })

  describe('Value Input', () => {
    it('should accept positive integer strike prices (100)', () => {
      const handleChange = vi.fn()
      render(<StrikePriceInput value="100" onChange={handleChange} />)

      const input = screen.getByRole('spinbutton')
      expect(input.value).toBe('100')
    })

    it('should accept positive decimal strike prices (105.50)', () => {
      const handleChange = vi.fn()
      render(<StrikePriceInput value="105.50" onChange={handleChange} />)

      const input = screen.getByRole('spinbutton')
      expect(input.value).toBe('105.50')
    })

    it('should accept high strike prices (250)', () => {
      const handleChange = vi.fn()
      render(<StrikePriceInput value="250" onChange={handleChange} />)

      const input = screen.getByRole('spinbutton')
      expect(input.value).toBe('250')
    })

    it('should display current value correctly formatted', () => {
      render(<StrikePriceInput value="150.75" onChange={vi.fn()} />)

      const input = screen.getByRole('spinbutton')
      expect(input.value).toBe('150.75')
    })
  })

  describe('onChange Callback', () => {
    it('should trigger onChange callback when value changes', () => {
      const handleChange = vi.fn()
      render(<StrikePriceInput value="" onChange={handleChange} />)

      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '150' } })

      expect(handleChange).toHaveBeenCalledWith('150')
    })

    it('should trigger onChange callback with decimal value', () => {
      const handleChange = vi.fn()
      render(<StrikePriceInput value="" onChange={handleChange} />)

      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '105.50' } })

      expect(handleChange).toHaveBeenCalledWith('105.50')
    })

    it('should trigger onChange with empty string when cleared', () => {
      const handleChange = vi.fn()
      render(<StrikePriceInput value="100" onChange={handleChange} />)

      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '' } })

      expect(handleChange).toHaveBeenCalledWith('')
    })
  })

  describe('Validation Errors', () => {
    it('should show validation error for strike <= 0 when error prop provided', () => {
      render(
        <StrikePriceInput
          value="0"
          onChange={vi.fn()}
          error="Strike price must be greater than 0"
        />
      )

      expect(screen.getByText('Strike price must be greater than 0')).toBeInTheDocument()
    })

    it('should show validation error for negative strike price when error prop provided', () => {
      render(
        <StrikePriceInput
          value="-10"
          onChange={vi.fn()}
          error="Strike price must be greater than 0"
        />
      )

      expect(screen.getByText('Strike price must be greater than 0')).toBeInTheDocument()
    })

    it('should show validation error for missing value if required and empty', () => {
      render(
        <StrikePriceInput
          value=""
          onChange={vi.fn()}
          error="Strike price is required"
        />
      )

      expect(screen.getByText('Strike price is required')).toBeInTheDocument()
    })

    it('should not show error when error prop is not provided', () => {
      render(<StrikePriceInput value="100" onChange={vi.fn()} />)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should not show error when error prop is empty string', () => {
      render(
        <StrikePriceInput
          value="100"
          onChange={vi.fn()}
          error=""
        />
      )

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should apply error styling to input when error is provided', () => {
      render(
        <StrikePriceInput
          value="0"
          onChange={vi.fn()}
          error="Strike price must be greater than 0"
        />
      )

      const input = screen.getByRole('spinbutton')
      expect(input.className).toContain('border-red-600')
    })
  })

  describe('Controlled Component', () => {
    it('should be controlled component (value prop controls input)', () => {
      const handleChange = vi.fn()
      const { rerender } = render(<StrikePriceInput value="100" onChange={handleChange} />)

      let input = screen.getByRole('spinbutton')
      expect(input.value).toBe('100')

      rerender(<StrikePriceInput value="150" onChange={handleChange} />)

      input = screen.getByRole('spinbutton')
      expect(input.value).toBe('150')
    })

    it('should display provided value', () => {
      render(<StrikePriceInput value="200" onChange={vi.fn()} />)

      const input = screen.getByRole('spinbutton')
      expect(input.value).toBe('200')
    })
  })

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      render(<StrikePriceInput value="100" onChange={vi.fn()} />)

      const label = screen.getByLabelText(/Strike Price/i)
      const input = screen.getByRole('spinbutton')

      expect(label).toBeInTheDocument()
      expect(input).toBeInTheDocument()
    })

    it('should have spinbutton role for screen readers', () => {
      render(<StrikePriceInput value="100" onChange={vi.fn()} />)

      const input = screen.getByRole('spinbutton')
      expect(input).toBeInTheDocument()
    })
  })

  describe('Component Props', () => {
    it('should accept custom id prop', () => {
      render(<StrikePriceInput value="100" onChange={vi.fn()} id="custom-strike" />)

      const input = screen.getByRole('spinbutton')
      expect(input.id).toBe('custom-strike')
    })

    it('should accept className prop for custom styling', () => {
      render(<StrikePriceInput value="100" onChange={vi.fn()} className="custom-class" />)

      const wrapper = screen.getByRole('spinbutton').parentElement
      expect(wrapper?.className).toContain('custom-class')
    })

    it('should accept placeholder prop', () => {
      render(<StrikePriceInput value="" onChange={vi.fn()} placeholder="e.g. 150" />)

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('placeholder', 'e.g. 150')
    })
  })
})
