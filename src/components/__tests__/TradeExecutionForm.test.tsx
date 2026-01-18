import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TradeExecutionForm } from '../TradeExecutionForm'
import type { Position, Trade } from '@/lib/position'
import { createPosition } from '@/test/data-factories'


describe('Batch 2: Trade Execution Integration - TradeExecutionForm Component', () => {
  let mockOnTradeAdded: ReturnType<typeof vi.fn>
  let mockOnError: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnTradeAdded = vi.fn()
    mockOnError = vi.fn()
  })

  describe('[Integration] Trade execution form functionality', () => {
    it('[Integration] should render trade execution form with position context', () => {
      // Arrange - Create a planned position
      const position = createPosition({
        id: 'trade-form-pos-123',
        symbol: 'TSLA',
        target_entry_price: 200,
        target_quantity: 50
      })

      // Act - Render TradeExecutionForm
      render(
        <TradeExecutionForm
          position={position}
          onTradeAdded={mockOnTradeAdded}
          onError={mockOnError}
        />
      )

      // Assert - Should show form with position context
      expect(screen.getByText(/Execute Trade for TSLA/)).toBeVisible()
      expect(screen.getByTestId('trade-execution-form')).toBeVisible()
      expect(screen.getByLabelText(/Trade Type/)).toBeVisible()
      expect(screen.getByLabelText(/Quantity/)).toBeVisible()
      expect(screen.getByLabelText(/Price/)).toBeVisible()
      expect(screen.getByLabelText(/Trade Date/)).toBeVisible()
      expect(screen.getByLabelText(/Notes/)).toBeVisible()
      expect(screen.getByRole('button', { name: /Execute Trade/ })).toBeVisible()
      expect(screen.getByRole('button', { name: /Cancel/ })).toBeVisible()
    })

    it('[Integration] should show position target values as reference', () => {
      // Arrange
      const position = createPosition({
        id: 'reference-pos-123',
        symbol: 'NVDA',
        target_entry_price: 450,
        target_quantity: 20
      })

      // Act
      render(
        <TradeExecutionForm
          position={position}
          onTradeAdded={mockOnTradeAdded}
          onError={mockOnError}
        />
      )

      // Assert - Should show target values as reference
      expect(screen.getByText(/Target Entry: \$450\.00/)).toBeVisible()
      expect(screen.getByText(/Target Quantity: 20/)).toBeVisible()
    })

    it('[Integration] should validate trade data before submission', async () => {
      // Arrange
      const position = createPosition({ symbol: 'MSFT' })
      render(
        <TradeExecutionForm
          position={position}
          onTradeAdded={mockOnTradeAdded}
          onError={mockOnError}
        />
      )

      // Act - Try to submit with invalid data
      const submitButton = screen.getByRole('button', { name: /Execute Trade/ })
      fireEvent.click(submitButton)

      // Assert - Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/Quantity is required/)).toBeVisible()
        expect(screen.getByText(/Price is required/)).toBeVisible()
        expect(screen.getByText(/Trade date is required/)).toBeVisible()
      })

      // Should not call onTradeAdded
      expect(mockOnTradeAdded).not.toHaveBeenCalled()
    })

    it('[Integration] should reject negative quantity', async () => {
      // Arrange
      const position = createPosition({ symbol: 'AAPL' })
      render(
        <TradeExecutionForm
          position={position}
          onTradeAdded={mockOnTradeAdded}
          onError={mockOnError}
        />
      )

      // Act - Enter negative quantity
      const quantityInput = screen.getByLabelText(/Quantity/)
      fireEvent.change(quantityInput, { target: { value: '-50' } })

      const submitButton = screen.getByRole('button', { name: /Execute Trade/ })
      fireEvent.click(submitButton)

      // Assert - Should show error
      await waitFor(() => {
        const errorElements = screen.getAllByText(/Quantity must be a positive number/)
        const errorElement = errorElements.find(el => el.className.includes('text-red-600'))
        expect(errorElement).toBeVisible()
      })

      expect(mockOnTradeAdded).not.toHaveBeenCalled()
    })

    it('[Integration] should reject zero price', async () => {
      // Arrange
      const position = createPosition({ symbol: 'GOOGL' })
      render(
        <TradeExecutionForm
          position={position}
          onTradeAdded={mockOnTradeAdded}
          onError={mockOnError}
        />
      )

      // Act - Enter zero price
      const priceInput = screen.getByLabelText(/Price/)
      fireEvent.change(priceInput, { target: { value: '0' } })

      const submitButton = screen.getByRole('button', { name: /Execute Trade/ })
      fireEvent.click(submitButton)

      // Assert - Should show error
      await waitFor(() => {
        const errorElements = screen.getAllByText(/Price must be a positive number/)
        const errorElement = errorElements.find(el => el.className.includes('text-red-600'))
        expect(errorElement).toBeVisible()
      })

      expect(mockOnTradeAdded).not.toHaveBeenCalled()
    })

    it('[Integration] should accept valid trade data and call onTradeAdded', async () => {
      // Arrange
      const position = createPosition({ symbol: 'AMZN' })
      render(
        <TradeExecutionForm
          position={position}
          onTradeAdded={mockOnTradeAdded}
          onError={mockOnError}
        />
      )

      // Act - Enter valid trade data
      fireEvent.change(screen.getByLabelText(/Trade Type/), { target: { value: 'buy' } })
      fireEvent.change(screen.getByLabelText(/Quantity/), { target: { value: '25' } })
      fireEvent.change(screen.getByLabelText(/Price/), { target: { value: '3200.50' } })
      fireEvent.change(screen.getByLabelText(/Trade Date/), { target: { value: '2024-01-15T10:30' } })
      fireEvent.change(screen.getByLabelText(/Notes/), { target: { value: 'Test trade execution' } })

      const submitButton = screen.getByRole('button', { name: /Execute Trade/ })
      fireEvent.click(submitButton)

      // Assert - Should call onTradeAdded with correct data
      await waitFor(() => {
        expect(mockOnTradeAdded).toHaveBeenCalledWith(expect.objectContaining({
          position_id: position.id,
          trade_type: 'buy',
          quantity: 25,
          price: 3200.50,
          notes: 'Test trade execution'
        }))
      })

      expect(mockOnError).not.toHaveBeenCalled()
    })

    it('[Integration] should generate unique trade ID', async () => {
      // Arrange
      const position = createPosition({ symbol: 'META' })
      render(
        <TradeExecutionForm
          position={position}
          onTradeAdded={mockOnTradeAdded}
          onError={mockOnError}
        />
      )

      // Act - Submit valid trade
      fireEvent.change(screen.getByLabelText(/Trade Type/), { target: { value: 'buy' } })
      fireEvent.change(screen.getByLabelText(/Quantity/), { target: { value: '10' } })
      fireEvent.change(screen.getByLabelText(/Price/), { target: { value: '300.25' } })
      fireEvent.change(screen.getByLabelText(/Trade Date/), { target: { value: '2024-01-15T10:30' } })

      const submitButton = screen.getByRole('button', { name: /Execute Trade/ })
      fireEvent.click(submitButton)

      // Assert - Should generate unique ID
      await waitFor(() => {
        const call = mockOnTradeAdded.mock.calls[0][0]
        expect(call.id).toMatch(/^trade-\d+-[a-z0-9]+$/)
        expect(call.id).not.toBe('trade-123') // Should be different from test ID
      })
    })

    it('[Integration] should handle form cancellation', () => {
      // Arrange
      const position = createPosition({ symbol: 'NFLX' })
      const onCancel = vi.fn()

      render(
        <TradeExecutionForm
          position={position}
          onTradeAdded={mockOnTradeAdded}
          onError={mockOnError}
          onCancel={onCancel}
        />
      )

      // Act - Click cancel button
      const cancelButton = screen.getByRole('button', { name: /Cancel/ })
      fireEvent.click(cancelButton)

      // Assert - Should call onCancel
      expect(onCancel).toHaveBeenCalled()
      expect(mockOnTradeAdded).not.toHaveBeenCalled()
    })

    it('[Integration] should show loading state during submission', async () => {
      // Arrange - Mock async operation
      mockOnTradeAdded.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      const position = createPosition({ symbol: 'PYPL' })
      render(
        <TradeExecutionForm
          position={position}
          onTradeAdded={mockOnTradeAdded}
          onError={mockOnError}
        />
      )

      // Act - Start submission
      fireEvent.change(screen.getByLabelText(/Trade Type/), { target: { value: 'buy' } })
      fireEvent.change(screen.getByLabelText(/Quantity/), { target: { value: '15' } })
      fireEvent.change(screen.getByLabelText(/Price/), { target: { value: '70.25' } })
      fireEvent.change(screen.getByLabelText(/Trade Date/), { target: { value: '2024-01-15T10:30' } })

      const submitButton = screen.getByRole('button', { name: /Execute Trade/ })
      fireEvent.click(submitButton)

      // Assert - Should show loading state
      expect(screen.getByRole('button', { name: /Executing/ })).toBeDisabled()
      expect(screen.getByTestId('loading-spinner')).toBeVisible()

      // Wait for completion
      await waitFor(() => {
        expect(mockOnTradeAdded).toHaveBeenCalled()
      })
    })

    it('[Integration] should handle trade execution errors gracefully', async () => {
      // Arrange - Mock error
      const errorMessage = 'Failed to execute trade'
      mockOnTradeAdded.mockRejectedValue(new Error(errorMessage))

      const position = createPosition({ symbol: 'INTC' })
      render(
        <TradeExecutionForm
          position={position}
          onTradeAdded={mockOnTradeAdded}
          onError={mockOnError}
        />
      )

      // Act - Submit trade that will fail
      fireEvent.change(screen.getByLabelText(/Trade Type/), { target: { value: 'buy' } })
      fireEvent.change(screen.getByLabelText(/Quantity/), { target: { value: '100' } })
      fireEvent.change(screen.getByLabelText(/Price/), { target: { value: '50.25' } })
      fireEvent.change(screen.getByLabelText(/Trade Date/), { target: { value: '2024-01-15T10:30' } })

      const submitButton = screen.getByRole('button', { name: /Execute Trade/ })
      fireEvent.click(submitButton)

      // Assert - Should handle error
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(errorMessage)
        expect(screen.getByText(/Failed to execute trade/)).toBeVisible()
      })

      // Should reset loading state
      expect(screen.getByRole('button', { name: /Execute Trade/ })).toBeEnabled()
    })
  })

  describe('[Integration] Phase 1A constraint enforcement', () => {
    it('[Integration] should prevent second trade on position with existing trade', () => {
      // Arrange - Position already has a trade
      const positionWithTrade = createPosition({
        id: 'already-traded-pos-123',
        symbol: 'CSCO',
        trades: [{
          id: 'existing-trade-123',
          position_id: 'already-traded-pos-123',
          trade_type: 'buy',
          quantity: 80,
          price: 60.25,
          timestamp: new Date('2024-01-15T10:30:00.000Z')
        }]
      })

      // Act - Should show error instead of form
      render(
        <TradeExecutionForm
          position={positionWithTrade}
          onTradeAdded={mockOnTradeAdded}
          onError={mockOnError}
        />
      )

      // Assert - Should show constraint error
      expect(screen.getByText(/Phase 1A allows only one trade per position/)).toBeVisible()
      expect(screen.queryByTestId('trade-execution-form')).not.toBeInTheDocument()
      expect(mockOnError).toHaveBeenCalledWith('Phase 1A allows only one trade per position')
    })

    it('[Integration] should show planned positions as eligible for trading', () => {
      // Arrange - Position with no trades
      const plannedPosition = createPosition({
        id: 'planned-for-trade-123',
        symbol: 'AMD',
        trades: []
      })

      // Act
      render(
        <TradeExecutionForm
          position={plannedPosition}
          onTradeAdded={mockOnTradeAdded}
          onError={mockOnError}
        />
      )

      // Assert - Should show form normally
      expect(screen.getByTestId('trade-execution-form')).toBeVisible()
      expect(screen.queryByText(/Phase 1A allows only one trade per position/)).not.toBeInTheDocument()
    })
  })

  describe('[Integration] Form accessibility and UX', () => {
    it('[Integration] should be accessible with proper labels and ARIA attributes', () => {
      // Arrange
      const position = createPosition({ symbol: 'UBER' })
      render(
        <TradeExecutionForm
          position={position}
          onTradeAdded={mockOnTradeAdded}
          onError={mockOnError}
        />
      )

      // Assert - Should have proper labels
      expect(screen.getByLabelText(/Trade Type/)).toHaveAttribute('id', 'trade-type')
      expect(screen.getByLabelText(/Quantity/)).toHaveAttribute('id', 'quantity')
      expect(screen.getByLabelText(/Price/)).toHaveAttribute('id', 'price')
      expect(screen.getByLabelText(/Trade Date/)).toHaveAttribute('id', 'trade-date')
      expect(screen.getByLabelText(/Notes/)).toHaveAttribute('id', 'notes')

      // Should have proper ARIA attributes
      const form = screen.getByTestId('trade-execution-form-element')
      expect(form).toHaveAttribute('role', 'form')
    })

    it('[Integration] should allow keyboard navigation', () => {
      // Arrange
      const position = createPosition({ symbol: 'ZOOM' })
      render(
        <TradeExecutionForm
          position={position}
          onTradeAdded={mockOnTradeAdded}
          onError={mockOnError}
        />
      )

      // Act - Tab through form fields
      const form = screen.getByTestId('trade-execution-form')
      const inputs = form.querySelectorAll('input, select, textarea, button')

      // Assert - Should have focusable elements in logical order
      expect(inputs.length).toBeGreaterThan(0)
      inputs.forEach((input, index) => {
        if (index === 0) {
          input.focus()
          expect(document.activeElement).toBe(input)
        }
      })
    })

    it('[Integration] should show help text for validation rules', () => {
      // Arrange
      const position = createPosition({ symbol: 'SHOP' })
      render(
        <TradeExecutionForm
          position={position}
          onTradeAdded={mockOnTradeAdded}
          onError={mockOnError}
        />
      )

      // Assert - Should show help text
      const helpTextElements = screen.getAllByText(/Quantity must be a positive number/)
      const helpTextElement = helpTextElements.find(el => el.className.includes('text-gray-500'))
      expect(helpTextElement).toBeVisible()

      const priceHelpElements = screen.getAllByText(/Price must be a positive number/)
      const priceHelpElement = priceHelpElements.find(el => el.className.includes('text-gray-500'))
      expect(priceHelpElement).toBeVisible()

      expect(screen.getByText(/Enter the date and time when the trade was executed/)).toBeVisible()
    })
  })
})