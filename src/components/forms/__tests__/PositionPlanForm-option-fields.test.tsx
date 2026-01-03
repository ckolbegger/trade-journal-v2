import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { PositionCreate } from '@/pages/PositionCreate'
import { mockPositionServiceModule, resetMockService } from '@/test/mocks/position-service-mock'
import { renderWithRouterAndProps } from '@/test/test-utils'

// Mock the PositionService using centralized factory
vi.mock('@/lib/position', async () => {
  const actual = await vi.importActual('@/lib/position')
  return {
    ...actual,
    PositionService: vi.fn().mockImplementation(() => mockPositionServiceModule)
  }
})

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

/**
 * Comprehensive test suite for option fields conditional rendering in PositionCreate
 *
 * This test suite verifies that option-specific fields display correctly based on strategy type:
 * - Option fields hidden when strategy_type='Long Stock'
 * - Option fields visible when strategy_type='Short Put'
 * - StrikePriceInput renders when Short Put selected
 * - ExpirationDatePicker renders when Short Put selected
 * - PriceBasisSelector (profit and stop) renders when Short Put selected
 * - Premium per contract field renders when Short Put selected
 * - All option fields have correct labels and placeholders
 * - Fields are properly associated with form state
 */

describe('PositionCreate - Option Fields Conditional Rendering', () => {
  let mockPositionService: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockPositionService = mockPositionServiceModule
    resetMockService(mockPositionService)
  })

  describe('Option Fields Hidden for Long Stock', () => {
    it('should hide option fields when strategy_type is "Long Stock"', async () => {
      await renderWithRouterAndProps(<PositionCreate />)

      // Default strategy is Long Stock
      const strategySelect = screen.getByLabelText(/Strategy Type/i)
      expect(strategySelect).toBeInTheDocument()

      // Option fields should NOT be visible
      expect(screen.queryByLabelText(/Strike Price/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/Expiration Date/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/Premium per Contract/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/Profit Basis/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/Stop Loss Basis/i)).not.toBeInTheDocument()
    })

    it('should hide option fields after switching from Short Put to Long Stock', async () => {
      await renderWithRouterAndProps(<PositionCreate />)

      // First switch to Short Put
      const strategySelect = screen.getByLabelText(/Strategy Type/i)
      fireEvent.change(strategySelect, { target: { value: 'Short Put' } })

      // Wait for option fields to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/Strike Price/i)).toBeInTheDocument()
      })

      // Now switch back to Long Stock
      fireEvent.change(strategySelect, { target: { value: 'Long Stock' } })

      // Option fields should disappear
      await waitFor(() => {
        expect(screen.queryByLabelText(/Strike Price/i)).not.toBeInTheDocument()
        expect(screen.queryByLabelText(/Expiration Date/i)).not.toBeInTheDocument()
        expect(screen.queryByLabelText(/Premium per Contract/i)).not.toBeInTheDocument()
        expect(screen.queryByLabelText(/Profit Basis/i)).not.toBeInTheDocument()
        expect(screen.queryByLabelText(/Stop Loss Basis/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Option Fields Visible for Short Put', () => {
    beforeEach(async () => {
      await renderWithRouterAndProps(<PositionCreate />)

      // Switch to Short Put strategy
      const strategySelect = screen.getByLabelText(/Strategy Type/i)
      fireEvent.change(strategySelect, { target: { value: 'Short Put' } })

      // Wait for option fields to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/Strike Price/i)).toBeInTheDocument()
      })
    })

    it('should show option fields when strategy_type is "Short Put"', async () => {
      expect(screen.getByLabelText(/Strike Price/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Expiration Date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Premium per Contract/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Profit Basis/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Stop Loss Basis/i)).toBeInTheDocument()
    })

    it('should render StrikePriceInput component', () => {
      const strikePriceInput = screen.getByLabelText(/Strike Price/i)
      expect(strikePriceInput).toBeInTheDocument()
      expect(strikePriceInput.tagName).toBe('INPUT')
      expect(strikePriceInput).toHaveAttribute('type', 'number')
      expect(strikePriceInput).toHaveAttribute('step', '0.01')
    })

    it('should render ExpirationDatePicker component', () => {
      const expirationInput = screen.getByLabelText(/Expiration Date/i)
      expect(expirationInput).toBeInTheDocument()
      expect(expirationInput.tagName).toBe('INPUT')
      expect(expirationInput).toHaveAttribute('type', 'date')
    })

    it('should render profit target basis PriceBasisSelector', () => {
      const profitBasisLabel = screen.getByText(/Profit Basis/i)
      expect(profitBasisLabel).toBeInTheDocument()

      const profitBasisSelect = screen.getByRole('combobox', { name: /Profit Basis/i })
      expect(profitBasisSelect).toBeInTheDocument()
    })

    it('should render stop loss basis PriceBasisSelector', () => {
      const stopBasisLabel = screen.getByText(/Stop Loss Basis/i)
      expect(stopBasisLabel).toBeInTheDocument()

      const stopBasisSelect = screen.getByRole('combobox', { name: /Stop Loss Basis/i })
      expect(stopBasisSelect).toBeInTheDocument()
    })

    it('should render premium per contract input field', () => {
      const premiumInput = screen.getByLabelText(/Premium per Contract/i)
      expect(premiumInput).toBeInTheDocument()
      expect(premiumInput.tagName).toBe('INPUT')
      expect(premiumInput).toHaveAttribute('type', 'number')
      expect(premiumInput).toHaveAttribute('step', '0.01')
    })
  })

  describe('Option Field Labels and Placeholders', () => {
    beforeEach(async () => {
      await renderWithRouterAndProps(<PositionCreate />)

      // Switch to Short Put strategy
      const strategySelect = screen.getByLabelText(/Strategy Type/i)
      fireEvent.change(strategySelect, { target: { value: 'Short Put' } })

      // Wait for option fields to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/Strike Price/i)).toBeInTheDocument()
      })
    })

    it('should display "Strike Price" label', () => {
      expect(screen.getByText(/Strike Price/i)).toBeInTheDocument()
    })

    it('should display "Expiration Date" label', () => {
      expect(screen.getByText(/Expiration Date/i)).toBeInTheDocument()
    })

    it('should display "Premium per Contract" label', () => {
      expect(screen.getByText(/Premium per Contract/i)).toBeInTheDocument()
    })

    it('should display "Profit Basis *" label', () => {
      expect(screen.getByText(/Profit Basis \*/i)).toBeInTheDocument()
    })

    it('should display "Stop Loss Basis *" label', () => {
      expect(screen.getByText(/Stop Loss Basis \*/i)).toBeInTheDocument()
    })

    it('should have correct placeholder for premium per contract', () => {
      const premiumInput = screen.getByLabelText(/Premium per Contract/i)
      expect(premiumInput).toHaveAttribute('placeholder', '0.00')
    })

    it('should have $ prefix on premium per contract input', () => {
      const premiumInput = screen.getByLabelText(/Premium per Contract/i)
      const container = premiumInput.parentElement
      expect(container?.querySelector('span.absolute')).toHaveTextContent('$')
    })

    it('should have $ prefix on strike price input', () => {
      const strikeInput = screen.getByLabelText(/Strike Price/i)
      const container = strikeInput.parentElement
      expect(container?.querySelector('span.absolute')).toHaveTextContent('$')
    })
  })

  describe('Price Basis Selector Options', () => {
    beforeEach(async () => {
      await renderWithRouterAndProps(<PositionCreate />)

      // Switch to Short Put strategy
      const strategySelect = screen.getByLabelText(/Strategy Type/i)
      fireEvent.change(strategySelect, { target: { value: 'Short Put' } })

      // Wait for option fields to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/Strike Price/i)).toBeInTheDocument()
      })
    })

    it('should display "Stock Price" and "Option Price" options for profit basis', () => {
      const profitBasisSelect = screen.getByRole('combobox', { name: /Profit Basis/i })

      // Check both options exist in the DOM (use getAllByText since there are duplicates)
      expect(screen.getAllByText('Stock Price')).toHaveLength(2)
      expect(screen.getAllByText('Option Price')).toHaveLength(2)

      // Verify the select element exists and has options
      expect(profitBasisSelect).toBeInTheDocument()
      const options = profitBasisSelect.querySelectorAll('option')
      expect(options).toHaveLength(2)
      expect(options[0].textContent).toBe('Stock Price')
      expect(options[1].textContent).toBe('Option Price')
    })

    it('should display "Stock Price" and "Option Price" options for stop loss basis', () => {
      const stopBasisSelect = screen.getByRole('combobox', { name: /Stop Loss Basis/i })

      // Verify the select element exists and has options
      expect(stopBasisSelect).toBeInTheDocument()
      const options = stopBasisSelect.querySelectorAll('option')
      expect(options).toHaveLength(2)
      expect(options[0].textContent).toBe('Stock Price')
      expect(options[1].textContent).toBe('Option Price')
    })
  })

  describe('Form State Association', () => {
    beforeEach(async () => {
      await renderWithRouterAndProps(<PositionCreate />)

      // Switch to Short Put strategy
      const strategySelect = screen.getByLabelText(/Strategy Type/i)
      fireEvent.change(strategySelect, { target: { value: 'Short Put' } })

      // Wait for option fields to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/Strike Price/i)).toBeInTheDocument()
      })
    })

    it('should allow entering strike price value', async () => {
      const strikeInput = screen.getByLabelText(/Strike Price/i)
      fireEvent.change(strikeInput, { target: { value: '100' } })

      await waitFor(() => {
        expect(strikeInput).toHaveValue(100)
      })
    })

    it('should allow entering expiration date', async () => {
      const expirationInput = screen.getByLabelText(/Expiration Date/i)
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const dateStr = futureDate.toISOString().split('T')[0]

      fireEvent.change(expirationInput, { target: { value: dateStr } })

      await waitFor(() => {
        expect(expirationInput).toHaveValue(dateStr)
      })
    })

    it('should allow entering premium per contract', async () => {
      const premiumInput = screen.getByLabelText(/Premium per Contract/i)
      fireEvent.change(premiumInput, { target: { value: '3.50' } })

      await waitFor(() => {
        expect(premiumInput).toHaveValue(3.5)
      })
    })

    it('should allow changing profit basis selection', async () => {
      const profitBasisSelect = screen.getByRole('combobox', { name: /Profit Basis/i })

      fireEvent.change(profitBasisSelect, { target: { value: 'option_price' } })

      await waitFor(() => {
        expect(profitBasisSelect).toHaveValue('option_price')
      })
    })

    it('should allow changing stop loss basis selection', async () => {
      const stopBasisSelect = screen.getByRole('combobox', { name: /Stop Loss Basis/i })

      fireEvent.change(stopBasisSelect, { target: { value: 'option_price' } })

      await waitFor(() => {
        expect(stopBasisSelect).toHaveValue('option_price')
      })
    })
  })

  describe('Validation for Option Fields', () => {
    beforeEach(async () => {
      await renderWithRouterAndProps(<PositionCreate />)

      // Switch to Short Put strategy
      const strategySelect = screen.getByLabelText(/Strategy Type/i)
      fireEvent.change(strategySelect, { target: { value: 'Short Put' } })

      // Wait for option fields to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/Strike Price/i)).toBeInTheDocument()
      })
    })

    it('should validate strike price is required for Short Put', async () => {
      // Fill common fields but leave option fields empty
      fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'AAPL' } })
      fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '150' } })
      fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '100' } })
      fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '160' } })
      // Use getAllByLabelText since "Stop Loss" appears in multiple labels (input and basis selector)
      const stopLossInputs = screen.getAllByLabelText(/Stop Loss/i)
      fireEvent.change(stopLossInputs[0], { target: { value: '140' } })
      fireEvent.change(screen.getByLabelText(/Position Thesis/i), { target: { value: 'Test thesis' } })

      // Try to proceed
      const nextButton = screen.getByText('Next: Trading Journal')
      fireEvent.click(nextButton)

      // Should show strike price required error
      await waitFor(() => {
        expect(screen.getByText('Strike price is required')).toBeInTheDocument()
      })
    })

    it('should validate expiration date is required for Short Put', async () => {
      // Fill common fields but leave expiration empty
      fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'AAPL' } })
      fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '150' } })
      fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '100' } })
      fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '160' } })
      // Use getAllByLabelText since "Stop Loss" appears in multiple labels (input and basis selector)
      const stopLossInputs = screen.getAllByLabelText(/Stop Loss/i)
      fireEvent.change(stopLossInputs[0], { target: { value: '140' } })
      fireEvent.change(screen.getByLabelText(/Position Thesis/i), { target: { value: 'Test thesis' } })
      fireEvent.change(screen.getByLabelText(/Strike Price/i), { target: { value: '100' } })

      // Try to proceed
      const nextButton = screen.getByText('Next: Trading Journal')
      fireEvent.click(nextButton)

      // Should show expiration date required error
      await waitFor(() => {
        expect(screen.getByText('Expiration date is required')).toBeInTheDocument()
      })
    })

    it('should validate strike price must be positive', async () => {
      fireEvent.change(screen.getByLabelText(/Strike Price/i), { target: { value: '-50' } })

      // Trigger validation
      const nextButton = screen.getByText('Next: Trading Journal')
      fireEvent.click(nextButton)

      // Should show validation error
      await waitFor(() => {
        const errorText = screen.queryByText(/must be greater than 0/i)
        expect(errorText).toBeInTheDocument()
      })
    })

    it('should validate expiration date must be in future', async () => {
      // Use a past date
      fireEvent.change(screen.getByLabelText(/Expiration Date/i), { target: { value: '2020-01-01' } })

      // Trigger validation
      const nextButton = screen.getByText('Next: Trading Journal')
      fireEvent.click(nextButton)

      // Should show validation error
      await waitFor(() => {
        const errorText = screen.queryByText(/must be in the future/i)
        expect(errorText).toBeInTheDocument()
      })
    })
  })
})
