import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PriceBasisSelector } from '../PriceBasisSelector'

/**
 * Comprehensive test suite for PriceBasisSelector component
 *
 * This test suite verifies that the price basis selector works correctly:
 * - Component renders with label "Price Target Basis" / "Stop Loss Basis"
 * - Dropdown shows options: 'stock_price', 'option_price'
 * - Default selection exists
 * - User can select either option
 * - onChange callback fires with selected basis
 * - Displays labels: "Stock Price" and "Option Premium"
 * - Selected value is controlled component
 */

describe('PriceBasisSelector', () => {
  describe('Rendering with Default Label', () => {
    it('should render with default label "Price Basis"', () => {
      render(<PriceBasisSelector value="stock_price" onChange={vi.fn()} />)

      expect(screen.getByLabelText(/Price Basis/i)).toBeInTheDocument()
    })

    it('should render as select element', () => {
      render(<PriceBasisSelector value="stock_price" onChange={vi.fn()} />)

      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
    })

    it('should display both option labels', () => {
      render(<PriceBasisSelector value="stock_price" onChange={vi.fn()} />)

      expect(screen.getByText('Stock Price')).toBeInTheDocument()
      expect(screen.getByText('Option Premium')).toBeInTheDocument()
    })
  })

  describe('Custom Labels', () => {
    it('should render with custom label "Profit Target Basis"', () => {
      render(
        <PriceBasisSelector
          value="stock_price"
          onChange={vi.fn()}
          label="Profit Target Basis"
        />
      )

      expect(screen.getByLabelText(/Profit Target Basis/i)).toBeInTheDocument()
    })

    it('should render with custom label "Stop Loss Basis"', () => {
      render(
        <PriceBasisSelector
          value="stock_price"
          onChange={vi.fn()}
          label="Stop Loss Basis"
        />
      )

      expect(screen.getByLabelText(/Stop Loss Basis/i)).toBeInTheDocument()
    })
  })

  describe('Default Selection', () => {
    it('should have default selection when value is provided', () => {
      render(<PriceBasisSelector value="stock_price" onChange={vi.fn()} />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('stock_price')
    })

    it('should display selected option correctly', () => {
      render(<PriceBasisSelector value="option_price" onChange={vi.fn()} />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('option_price')
    })
  })

  describe('User Selection', () => {
    it('should allow user to select "stock_price" option', () => {
      const handleChange = vi.fn()
      render(<PriceBasisSelector value="option_price" onChange={handleChange} />)

      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'stock_price' } })

      expect(handleChange).toHaveBeenCalledWith('stock_price')
    })

    it('should allow user to select "option_price" option', () => {
      const handleChange = vi.fn()
      render(<PriceBasisSelector value="stock_price" onChange={handleChange} />)

      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'option_price' } })

      expect(handleChange).toHaveBeenCalledWith('option_price')
    })

    it('should call onChange callback with selected basis', () => {
      const handleChange = vi.fn()
      render(<PriceBasisSelector value="stock_price" onChange={handleChange} />)

      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'option_price' } })

      expect(handleChange).toHaveBeenCalledTimes(1)
      expect(handleChange).toHaveBeenCalledWith('option_price')
    })
  })

  describe('Option Values', () => {
    it('should have "stock_price" as first option with label "Stock Price"', () => {
      const { container } = render(<PriceBasisSelector value="stock_price" onChange={vi.fn()} />)

      const options = container.querySelectorAll('option')
      expect(options[0].value).toBe('stock_price')
      expect(options[0].textContent).toBe('Stock Price')
    })

    it('should have "option_price" as second option with label "Option Premium"', () => {
      const { container } = render(<PriceBasisSelector value="stock_price" onChange={vi.fn()} />)

      const options = container.querySelectorAll('option')
      expect(options[1].value).toBe('option_price')
      expect(options[1].textContent).toBe('Option Premium')
    })
  })

  describe('Controlled Component', () => {
    it('should be controlled component (value prop controls selection)', () => {
      const handleChange = vi.fn()
      const { rerender } = render(<PriceBasisSelector value="stock_price" onChange={handleChange} />)

      let select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('stock_price')

      rerender(<PriceBasisSelector value="option_price" onChange={handleChange} />)

      select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('option_price')
    })

    it('should display current value correctly', () => {
      render(<PriceBasisSelector value="stock_price" onChange={vi.fn()} />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('stock_price')
    })
  })

  describe('Component Props', () => {
    it('should accept custom id prop', () => {
      render(<PriceBasisSelector value="stock_price" onChange={vi.fn()} id="custom-basis" />)

      const select = screen.getByRole('combobox')
      expect(select.id).toBe('custom-basis')
    })

    it('should accept className prop for custom styling', () => {
      render(<PriceBasisSelector value="stock_price" onChange={vi.fn()} className="custom-class" />)

      const wrapper = screen.getByRole('combobox').parentElement
      expect(wrapper?.className).toContain('custom-class')
    })

    it('should accept disabled prop', () => {
      render(<PriceBasisSelector value="stock_price" onChange={vi.fn()} disabled />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.disabled).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      render(<PriceBasisSelector value="stock_price" onChange={vi.fn()} />)

      const label = screen.getByLabelText(/Price Basis/i)
      const select = screen.getByRole('combobox')

      expect(label).toBeInTheDocument()
      expect(select).toBeInTheDocument()
    })

    it('should have combobox role for screen readers', () => {
      render(<PriceBasisSelector value="stock_price" onChange={vi.fn()} />)

      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
    })
  })
})
