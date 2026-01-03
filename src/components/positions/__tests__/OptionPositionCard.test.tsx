import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PositionCard } from '@/components/PositionCard'
import type { Position } from '@/lib/position'

/**
 * Comprehensive test suite for PositionCard option position display
 *
 * This test suite verifies that PositionCard correctly displays option-specific fields
 * when strategy_type='Short Put':
 * - Card displays underlying symbol
 * - Card displays strategy type badge "Short Put"
 * - Card displays strike price with $ formatting
 * - Card displays expiration date in readable format (e.g., "Jan 17, 2025")
 * - Card displays premium received per contract
 * - Card displays number of contracts
 * - Card shows current status (planned/open/closed)
 */

// Helper function to create a test position
function createTestPosition(overrides: Partial<Position> = {}): Position {
  const defaults: Position = {
    id: 'test-position-id',
    symbol: 'AAPL',
    strategy_type: 'Long Stock',
    target_entry_price: 150,
    target_quantity: 100,
    profit_target: 160,
    stop_loss: 140,
    position_thesis: 'Test thesis',
    status: 'planned',
    trades: [],
    created_at: '2025-01-01T00:00:00.000Z'
  }

  return { ...defaults, ...overrides }
}

describe('PositionCard - Option Position Display (Short Put)', () => {
  describe('Basic Position Info', () => {
    it('should display underlying symbol for Short Put position', () => {
      const position = createTestPosition({
        symbol: 'SPY',
        strategy_type: 'Short Put'
      })

      render(
        <PositionCard
          position={position}
          onViewDetails={vi.fn()}
          avgCost={0}
          pnl={null}
          pnlPercentage={undefined}
        />
      )

      expect(screen.getByTestId('position-symbol-test-position-id')).toHaveTextContent('SPY')
    })

    it('should display strategy type badge "Short Put"', () => {
      const position = createTestPosition({
        strategy_type: 'Short Put'
      })

      render(
        <PositionCard
          position={position}
          onViewDetails={vi.fn()}
          avgCost={0}
          pnl={null}
          pnlPercentage={undefined}
        />
      )

      expect(screen.getByText('Short Put')).toBeInTheDocument()
    })
  })

  describe('Option-Specific Fields Display', () => {
    it('should display strike price with $ formatting for Short Put', () => {
      const position = createTestPosition({
        strategy_type: 'Short Put',
        strike_price: 100,
        option_type: 'put'
      })

      render(
        <PositionCard
          position={position}
          onViewDetails={vi.fn()}
          avgCost={0}
          pnl={null}
          pnlPercentage={undefined}
        />
      )

      expect(screen.getByText(/strike/i)).toBeInTheDocument()
      expect(screen.getByText(/\$100\.00/)).toBeInTheDocument()
    })

    it('should display expiration date in readable format for Short Put', () => {
      const position = createTestPosition({
        strategy_type: 'Short Put',
        expiration_date: '2025-01-17'
      })

      render(
        <PositionCard
          position={position}
          onViewDetails={vi.fn()}
          avgCost={0}
          pnl={null}
          pnlPercentage={undefined}
        />
      )

      // Should show formatted date - check for label and year
      expect(screen.getByText(/expires/i)).toBeInTheDocument()
      // Check that 2025 appears somewhere in the card (year from expiration)
      expect(screen.getByText(/2025/i)).toBeInTheDocument()
    })

    it('should display premium received per contract for Short Put', () => {
      const position = createTestPosition({
        strategy_type: 'Short Put',
        premium_per_contract: 3.50
      })

      render(
        <PositionCard
          position={position}
          onViewDetails={vi.fn()}
          avgCost={0}
          pnl={null}
          pnlPercentage={undefined}
        />
      )

      expect(screen.getByText(/premium/i)).toBeInTheDocument()
      expect(screen.getByText(/\$3\.50/)).toBeInTheDocument()
    })

    it('should display number of contracts for Short Put', () => {
      const position = createTestPosition({
        strategy_type: 'Short Put',
        target_quantity: 5 // For options, this represents number of contracts
      })

      render(
        <PositionCard
          position={position}
          onViewDetails={vi.fn()}
          avgCost={0}
          pnl={null}
          pnlPercentage={undefined}
        />
      )

      expect(screen.getByText(/contracts/i)).toBeInTheDocument()
      expect(screen.getByText(/5/i)).toBeInTheDocument()
    })
  })

  describe('Status Display', () => {
    it('should show planned status for Short Put position with no trades', () => {
      const position = createTestPosition({
        strategy_type: 'Short Put',
        status: 'planned',
        trades: []
      })

      render(
        <PositionCard
          position={position}
          onViewDetails={vi.fn()}
          avgCost={0}
          pnl={null}
          pnlPercentage={undefined}
        />
      )

      expect(screen.getByText(/planned/i)).toBeInTheDocument()
    })

    it('should show open status for Short Put position with trades', () => {
      const position = createTestPosition({
        strategy_type: 'Short Put',
        status: 'open',
        trades: [{
          id: 'trade-1',
          position_id: 'test-position-id',
          action: 'sell_to_open',
          quantity: 5,
          price: 3.50,
          trade_date: '2025-01-01T00:00:00.000Z',
          created_at: '2025-01-01T00:00:00.000Z'
        }]
      })

      render(
        <PositionCard
          position={position}
          onViewDetails={vi.fn()}
          avgCost={0}
          pnl={null}
          pnlPercentage={undefined}
        />
      )

      expect(screen.getByText(/open/i)).toBeInTheDocument()
    })
  })

  describe('Option Fields Not Displayed for Long Stock', () => {
    it('should not display strike price for Long Stock position', () => {
      const position = createTestPosition({
        strategy_type: 'Long Stock'
      })

      render(
        <PositionCard
          position={position}
          onViewDetails={vi.fn()}
          avgCost={150}
          pnl={null}
          pnlPercentage={undefined}
        />
      )

      expect(screen.queryByText(/strike/i)).not.toBeInTheDocument()
    })

    it('should not display expiration date for Long Stock position', () => {
      const position = createTestPosition({
        strategy_type: 'Long Stock'
      })

      render(
        <PositionCard
          position={position}
          onViewDetails={vi.fn()}
          avgCost={150}
          pnl={null}
          pnlPercentage={undefined}
        />
      )

      // Should not have "Expires" label for Long Stock
      expect(screen.queryByText(/expires/i)).not.toBeInTheDocument()
    })

    it('should not display premium for Long Stock position', () => {
      const position = createTestPosition({
        strategy_type: 'Long Stock'
      })

      render(
        <PositionCard
          position={position}
          onViewDetails={vi.fn()}
          avgCost={150}
          pnl={null}
          pnlPercentage={undefined}
        />
      )

      expect(screen.queryByText(/premium/i)).not.toBeInTheDocument()
    })

    it('should not display contracts for Long Stock position', () => {
      const position = createTestPosition({
        strategy_type: 'Long Stock',
        target_quantity: 100
      })

      render(
        <PositionCard
          position={position}
          onViewDetails={vi.fn()}
          avgCost={150}
          pnl={null}
          pnlPercentage={undefined}
        />
      )

      // Long Stock shows "Target Qty: 100" not "contracts"
      expect(screen.queryByText(/contracts/i)).not.toBeInTheDocument()
      expect(screen.getByText(/target qty/i)).toBeInTheDocument()
    })
  })

  describe('Card Styling for Option Positions', () => {
    it('should apply correct styling for planned Short Put position', () => {
      const position = createTestPosition({
        strategy_type: 'Short Put',
        trades: []
      })

      const { container } = render(
        <PositionCard
          position={position}
          onViewDetails={vi.fn()}
          avgCost={0}
          pnl={null}
          pnlPercentage={undefined}
        />
      )

      const card = container.querySelector('[data-testid="position-card"]')
      expect(card).toHaveClass('bg-gray-50')
      expect(card).toHaveClass('border-l-4')
    })

    it('should apply correct styling for open Short Put position', () => {
      const position = createTestPosition({
        strategy_type: 'Short Put',
        trades: [{
          id: 'trade-1',
          position_id: 'test-position-id',
          action: 'sell_to_open',
          quantity: 5,
          price: 3.50,
          trade_date: '2025-01-01T00:00:00.000Z',
          created_at: '2025-01-01T00:00:00.000Z'
        }]
      })

      const { container } = render(
        <PositionCard
          position={position}
          onViewDetails={vi.fn()}
          avgCost={0}
          pnl={null}
          pnlPercentage={undefined}
        />
      )

      const card = container.querySelector('[data-testid="position-card"]')
      expect(card).toHaveClass('bg-white')
    })
  })

  describe('P&L Display for Option Positions', () => {
    it('should display P&L for Short Put position when available', () => {
      const position = createTestPosition({
        strategy_type: 'Short Put'
      })

      render(
        <PositionCard
          position={position}
          onViewDetails={vi.fn()}
          avgCost={0}
          pnl={150.50}
          pnlPercentage={25.5}
        />
      )

      expect(screen.getByText(/\$150\.50/)).toBeInTheDocument()
      expect(screen.getByText(/25\.5%/)).toBeInTheDocument()
    })

    it('should show null P&L for planned Short Put position', () => {
      const position = createTestPosition({
        strategy_type: 'Short Put',
        trades: []
      })

      render(
        <PositionCard
          position={position}
          onViewDetails={vi.fn()}
          avgCost={0}
          pnl={null}
          pnlPercentage={undefined}
        />
      )

      // P&L section should still exist but show dashes or null indicator
      expect(screen.getByText(/P&L/i)).toBeInTheDocument()
    })
  })

  describe('Click Interaction', () => {
    it('should call onViewDetails when Short Put card is clicked', () => {
      const position = createTestPosition({
        strategy_type: 'Short Put'
      })
      const onViewDetails = vi.fn()

      render(
        <PositionCard
          position={position}
          onViewDetails={onViewDetails}
          avgCost={0}
          pnl={null}
          pnlPercentage={undefined}
        />
      )

      const card = screen.getByTestId('position-card')
      card.click()

      expect(onViewDetails).toHaveBeenCalledWith('test-position-id')
    })
  })
})
