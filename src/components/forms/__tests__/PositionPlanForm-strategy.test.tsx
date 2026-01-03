import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StrategySelector } from '../strategy/StrategySelector'

/**
 * Comprehensive test suite for StrategySelector component
 *
 * This test suite verifies that the strategy selector dropdown works correctly:
 * - Dropdown renders with all strategy options ('Long Stock', 'Short Put')
 * - Default selection is 'Long Stock'
 * - User can select 'Short Put' option
 * - onChange callback fires with selected strategy
 * - Selected value is controlled component
 * - Displays strategy labels correctly formatted
 */

describe('StrategySelector', () => {
  describe('Rendering', () => {
    it('should render with label "Strategy Type"', () => {
      render(<StrategySelector value="Long Stock" onChange={vi.fn()} />)

      expect(screen.getByLabelText(/Strategy Type/i)).toBeInTheDocument()
    })

    it('should render as select element', () => {
      render(<StrategySelector value="Long Stock" onChange={vi.fn()} />)

      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
    })

    it('should render all strategy options', () => {
      render(<StrategySelector value="Long Stock" onChange={vi.fn()} />)

      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()

      // Check that both options exist in the DOM
      expect(screen.getByText('Long Stock')).toBeInTheDocument()
      expect(screen.getByText('Short Put')).toBeInTheDocument()
    })

    it('should display strategy labels correctly formatted', () => {
      const { container } = render(<StrategySelector value="Long Stock" onChange={vi.fn()} />)

      // Check option text content
      const options = container.querySelectorAll('option')
      const optionTexts = Array.from(options).map(o => o.textContent)

      expect(optionTexts).toContain('Long Stock')
      expect(optionTexts).toContain('Short Put')
    })
  })

  describe('Default Selection', () => {
    it('should have default selection as "Long Stock" when value is "Long Stock"', () => {
      render(<StrategySelector value="Long Stock" onChange={vi.fn()} />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('Long Stock')
    })

    it('should show "Long Stock" as selected in dropdown', () => {
      render(<StrategySelector value="Long Stock" onChange={vi.fn()} />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('Long Stock')
    })
  })

  describe('User Selection', () => {
    it('should allow user to select "Short Put" option', () => {
      const handleChange = vi.fn()
      render(<StrategySelector value="Long Stock" onChange={handleChange} />)

      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'Short Put' } })

      expect(handleChange).toHaveBeenCalledWith('Short Put')
    })

    it('should allow user to select "Long Stock" option', () => {
      const handleChange = vi.fn()
      render(<StrategySelector value="Short Put" onChange={handleChange} />)

      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'Long Stock' } })

      expect(handleChange).toHaveBeenCalledWith('Long Stock')
    })

    it('should call onChange callback with selected strategy', () => {
      const handleChange = vi.fn()
      render(<StrategySelector value="Long Stock" onChange={handleChange} />)

      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'Short Put' } })

      expect(handleChange).toHaveBeenCalledTimes(1)
      expect(handleChange).toHaveBeenCalledWith('Short Put')
    })
  })

  describe('Controlled Component', () => {
    it('should be controlled component (value prop controls selection)', () => {
      const handleChange = vi.fn()
      const { rerender } = render(<StrategySelector value="Long Stock" onChange={handleChange} />)

      let select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('Long Stock')

      // Rerender with different value
      rerender(<StrategySelector value="Short Put" onChange={handleChange} />)

      select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('Short Put')
    })

    it('should not change value without onChange being called', () => {
      const handleChange = vi.fn()
      render(<StrategySelector value="Long Stock" onChange={handleChange} />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('Long Stock')

      // Value should remain 'Long Stock' until user changes it
      expect(select.value).toBe('Long Stock')
    })
  })

  describe('Value Changes', () => {
    it('should trigger onChange callback when value changes', () => {
      const handleChange = vi.fn()
      render(<StrategySelector value="Long Stock" onChange={handleChange} />)

      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'Short Put' } })

      expect(handleChange).toHaveBeenCalledWith('Short Put')
    })

    it('should display current value correctly when "Long Stock"', () => {
      render(<StrategySelector value="Long Stock" onChange={vi.fn()} />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('Long Stock')
    })

    it('should display current value correctly when "Short Put"', () => {
      render(<StrategySelector value="Short Put" onChange={vi.fn()} />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('Short Put')
    })
  })

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      render(<StrategySelector value="Long Stock" onChange={vi.fn()} />)

      const label = screen.getByLabelText(/Strategy Type/i)
      const select = screen.getByRole('combobox')

      expect(label).toContainElement(select)
    })

    it('should have combobox role for screen readers', () => {
      render(<StrategySelector value="Long Stock" onChange={vi.fn()} />)

      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
    })
  })

  describe('Option Values', () => {
    it('should have "Long Stock" as first option', () => {
      const { container } = render(<StrategySelector value="Long Stock" onChange={vi.fn()} />)

      const options = container.querySelectorAll('option')
      expect(options[0].value).toBe('Long Stock')
    })

    it('should have "Short Put" as second option', () => {
      const { container } = render(<StrategySelector value="Long Stock" onChange={vi.fn()} />)

      const options = container.querySelectorAll('option')
      expect(options[1].value).toBe('Short Put')
    })
  })
})
