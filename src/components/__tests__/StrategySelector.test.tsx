import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StrategySelector } from '../StrategySelector'
import type { StrategyType } from '@/lib/position'

describe('StrategySelector Component', () => {
  it('renders all strategy options', () => {
    // Arrange
    const mockOnChange = () => {}

    // Act
    render(<StrategySelector value="Long Stock" onChange={mockOnChange} />)

    // Assert - Should show both Long Stock and Short Put options
    const select = screen.getByRole('combobox', { name: /strategy type/i })
    expect(select).toBeInTheDocument()

    // Get all options
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(2)

    // Verify option values
    const longStock = screen.getByRole('option', { name: /long stock/i })
    const shortPut = screen.getByRole('option', { name: /short put/i })
    expect(longStock).toBeInTheDocument()
    expect(shortPut).toBeInTheDocument()
  })

  it('selection changes value', () => {
    // Arrange
    let selectedValue: StrategyType = 'Long Stock'
    const mockOnChange = (value: StrategyType) => {
      selectedValue = value
    }

    // Act
    const { rerender } = render(
      <StrategySelector value={selectedValue} onChange={mockOnChange} />
    )

    // Change to Short Put
    const select = screen.getByRole('combobox', { name: /strategy type/i })
    fireEvent.change(select, { target: { value: 'Short Put' } })

    // Assert - onChange should have been called with new value
    expect(selectedValue).toBe('Short Put')

    // Rerender with new value
    rerender(<StrategySelector value={selectedValue} onChange={mockOnChange} />)

    // Verify UI reflects new value
    expect(select).toHaveValue('Short Put')
  })

  it('defaults to Long Stock', () => {
    // Arrange
    const mockOnChange = () => {}

    // Act
    render(<StrategySelector value="Long Stock" onChange={mockOnChange} />)

    // Assert
    const select = screen.getByRole('combobox', { name: /strategy type/i })
    expect(select).toHaveValue('Long Stock')
  })

  it('is keyboard accessible', () => {
    // Arrange
    const mockOnChange = () => {}

    // Act
    render(<StrategySelector value="Long Stock" onChange={mockOnChange} />)

    // Assert - Should have proper accessibility attributes
    const select = screen.getByRole('combobox', { name: /strategy type/i })

    // Should be focusable (part of tab order)
    expect(select).not.toHaveAttribute('tabindex', '-1')

    // Should have accessible label
    expect(select).toHaveAccessibleName()

    // Should be a native select element (inherently keyboard accessible)
    expect(select.tagName).toBe('SELECT')
  })
})
