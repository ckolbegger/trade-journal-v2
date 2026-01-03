import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import userEvent from '@testing-library/user-event'
import { StrikePricePicker } from '@/components/ui/StrikePricePicker'

describe('StrikePricePicker', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    error: '',
    disabled: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders input field with correct label', () => {
      render(<StrikePricePicker {...defaultProps} />)
      
      expect(screen.getByLabelText(/Strike Price/i)).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('renders input with dollar prefix placeholder', () => {
      render(<StrikePricePicker {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('placeholder', '$0.00')
    })

    it('displays error message when error prop is provided', () => {
      render(<StrikePricePicker {...defaultProps} error="Strike price must be positive" />)
      
      expect(screen.getByText(/Strike price must be positive/i)).toBeInTheDocument()
    })

    it('is disabled when disabled prop is true', () => {
      render(<StrikePricePicker {...defaultProps} disabled={true} />)
      
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
    })

    it('applies error styling when error is present', () => {
      render(<StrikePricePicker {...defaultProps} error="Invalid value" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('border-red-500')
    })
  })

  describe('Input Behavior', () => {
    it('accepts numeric input via fireEvent', () => {
      const onChange = vi.fn()
      render(<StrikePricePicker {...defaultProps} onChange={onChange} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '105' } })
      
      expect(onChange).toHaveBeenCalledWith('105')
    })

    it('accepts decimal values via fireEvent', () => {
      const onChange = vi.fn()
      render(<StrikePricePicker {...defaultProps} onChange={onChange} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '105.50' } })
      
      expect(onChange).toHaveBeenCalledWith('105.50')
    })

    it('rejects non-numeric input', () => {
      const onChange = vi.fn()
      render(<StrikePricePicker {...defaultProps} onChange={onChange} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'abc' } })
      
      expect(onChange).not.toHaveBeenCalled()
    })

    it('filters out negative sign', () => {
      const onChange = vi.fn()
      render(<StrikePricePicker {...defaultProps} onChange={onChange} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '-100' } })
      
      expect(onChange).toHaveBeenCalledWith('100')
    })

    it('accepts zero as valid value', () => {
      const onChange = vi.fn()
      render(<StrikePricePicker {...defaultProps} onChange={onChange} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '0' } })
      
      expect(onChange).toHaveBeenCalledWith('0')
    })
  })

  describe('Value Formatting', () => {
    it('displays formatted value with dollar sign', () => {
      render(<StrikePricePicker {...defaultProps} value="105" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('$105.00')
    })

    it('displays formatted decimal value correctly', () => {
      render(<StrikePricePicker {...defaultProps} value="105.50" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('$105.50')
    })

    it('displays zero formatted correctly', () => {
      render(<StrikePricePicker {...defaultProps} value="0" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('$0.00')
    })

    it('displays whole number with 2 decimals', () => {
      render(<StrikePricePicker {...defaultProps} value="100" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('$100.00')
    })
  })

  describe('Decimal Precision', () => {
    it('limits input to 4 decimal places', () => {
      const onChange = vi.fn()
      render(<StrikePricePicker {...defaultProps} onChange={onChange} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '105.12345' } })
      
      expect(onChange).toHaveBeenCalledWith('105.1234')
    })

    it('accepts 4 decimal places', () => {
      const onChange = vi.fn()
      render(<StrikePricePicker {...defaultProps} onChange={onChange} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '0.1234' } })
      
      expect(onChange).toHaveBeenCalledWith('0.1234')
    })
  })

  describe('Error Display', () => {
    it('does not show error for positive values', () => {
      render(<StrikePricePicker {...defaultProps} value="105" />)
      
      const input = screen.getByRole('textbox')
      fireEvent.blur(input)
      
      expect(screen.queryByText(/must be greater than or equal to 0/i)).not.toBeInTheDocument()
    })

    it('shows error from error prop', () => {
      render(<StrikePricePicker {...defaultProps} error="Custom error message" />)
      
      expect(screen.getByText(/Custom error message/i)).toBeInTheDocument()
    })
  })

  describe('Reset Functionality', () => {
    it('clears value when reset button is clicked', async () => {
      const onChange = vi.fn()
      render(<StrikePricePicker {...defaultProps} value="105" onChange={onChange} />)
      
      const resetButton = screen.getByRole('button', { name: /clear/i })
      await userEvent.click(resetButton)
      
      expect(onChange).toHaveBeenCalledWith('')
    })

    it('displays empty when value is empty string', () => {
      render(<StrikePricePicker {...defaultProps} value="" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('')
    })

    it('shows placeholder after reset', async () => {
      const onChange = vi.fn()
      render(<StrikePricePicker {...defaultProps} value="105" onChange={onChange} />)
      
      const resetButton = screen.getByRole('button', { name: /clear/i })
      await userEvent.click(resetButton)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('placeholder', '$0.00')
    })
  })

  describe('Boundary Cases', () => {
    it('handles very large numbers', () => {
      const onChange = vi.fn()
      render(<StrikePricePicker {...defaultProps} onChange={onChange} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '999999' } })
      
      expect(onChange).toHaveBeenCalledWith('999999')
    })

    it('handles single digit numbers', () => {
      const onChange = vi.fn()
      render(<StrikePricePicker {...defaultProps} onChange={onChange} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '5' } })
      
      expect(onChange).toHaveBeenCalledWith('5')
    })

    it('handles small decimal values', () => {
      const onChange = vi.fn()
      render(<StrikePricePicker {...defaultProps} onChange={onChange} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '0.0001' } })
      
      expect(onChange).toHaveBeenCalledWith('0.0001')
    })
  })
})
