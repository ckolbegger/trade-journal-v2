import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PositionCard } from '@/components/PositionCard'
import type { Position } from '@/lib/position'

describe('PositionCard - Short Put Strategy Support', () => {
  const basePosition: Position = {
    id: 'short-put-pos-1',
    symbol: 'AAPL',
    strategy_type: 'Long Stock',
    target_entry_price: 150,
    target_quantity: 100,
    profit_target: 160,
    stop_loss: 145,
    position_thesis: 'Test thesis',
    created_date: new Date('2024-01-15'),
    status: 'planned',
    journal_entry_ids: [],
    trades: []
  }

  const mockMetrics = {
    avgCost: 0,
    pnl: null,
    pnlPercentage: undefined
  }

  describe('Short Put Strategy Badge Display', () => {
    it('should display "Short Put" strategy badge when strategy_type is Short Put', () => {
      const shortPutPosition: Position = {
        ...basePosition,
        id: 'short-put-1',
        strategy_type: 'Short Put',
        trades: []
      }

      render(
        <PositionCard
          position={shortPutPosition}
          onViewDetails={vi.fn()}
          {...mockMetrics}
        />
      )

      expect(screen.getByText('Short Put')).toBeInTheDocument()
    })

    it('should display "Long Stock" strategy badge for stock positions', () => {
      const longStockPosition: Position = {
        ...basePosition,
        id: 'long-stock-1',
        strategy_type: 'Long Stock',
        trades: []
      }

      render(
        <PositionCard
          position={longStockPosition}
          onViewDetails={vi.fn()}
          {...mockMetrics}
        />
      )

      expect(screen.getByText('Long Stock')).toBeInTheDocument()
    })
  })

  describe('Short Put Option Fields Display', () => {
    it('should display strike price when position has strike_price', () => {
      const shortPutPosition: Position = {
        ...basePosition,
        id: 'short-put-strike-1',
        strategy_type: 'Short Put',
        strike_price: 155.00,
        trades: []
      }

      render(
        <PositionCard
          position={shortPutPosition}
          onViewDetails={vi.fn()}
          {...mockMetrics}
        />
      )

      expect(screen.getByText('$155.00')).toBeInTheDocument()
    })

    it('should display expiration date when position has expiration_date', () => {
      const shortPutPosition: Position = {
        ...basePosition,
        id: 'short-put-exp-1',
        strategy_type: 'Short Put',
        expiration_date: new Date('2025-02-21'),
        trades: []
      }

      render(
        <PositionCard
          position={shortPutPosition}
          onViewDetails={vi.fn()}
          {...mockMetrics}
        />
      )

      expect(screen.getByText(/Feb 21, 2025/)).toBeInTheDocument()
    })

    it('should display premium received when position has premium_per_contract', () => {
      const shortPutPosition: Position = {
        ...basePosition,
        id: 'short-put-premium-1',
        strategy_type: 'Short Put',
        premium_per_contract: 3.50,
        trades: []
      }

      render(
        <PositionCard
          position={shortPutPosition}
          onViewDetails={vi.fn()}
          {...mockMetrics}
        />
      )

      expect(screen.getByText('$3.50')).toBeInTheDocument()
    })

    it('should display contract count × 100 multiplier', () => {
      const shortPutPosition: Position = {
        ...basePosition,
        id: 'short-put-contracts-1',
        strategy_type: 'Short Put',
        target_quantity: 5,
        trades: []
      }

      render(
        <PositionCard
          position={shortPutPosition}
          onViewDetails={vi.fn()}
          {...mockMetrics}
        />
      )

      expect(screen.getByText('500')).toBeInTheDocument()
    })
  })

  describe('Status Badge Display', () => {
    it('should display "planned" status badge for positions with no trades', () => {
      const plannedPosition: Position = {
        ...basePosition,
        id: 'planned-1',
        trades: []
      }

      render(
        <PositionCard
          position={plannedPosition}
          onViewDetails={vi.fn()}
          {...mockMetrics}
        />
      )

      expect(screen.getByText('planned')).toBeInTheDocument()
    })

    it('should display "open" status badge for positions with trades', () => {
      const openPosition: Position = {
        ...basePosition,
        id: 'open-1',
        trades: [
          {
            id: 'trade-1',
            position_id: 'open-1',
            trade_type: 'buy',
            quantity: 100,
            price: 150,
            timestamp: new Date('2024-01-15T10:00:00'),
            underlying: 'AAPL'
          }
        ]
      }

      render(
        <PositionCard
          position={openPosition}
          onViewDetails={vi.fn()}
          avgCost={150}
          pnl={500}
          pnlPercentage={3.33}
        />
      )

      expect(screen.getByText('open')).toBeInTheDocument()
    })

    it('should display "closed" status badge for closed positions', () => {
      const closedPosition: Position = {
        ...basePosition,
        id: 'closed-1',
        status: 'closed',
        trades: [
          {
            id: 'trade-1',
            position_id: 'closed-1',
            trade_type: 'buy',
            quantity: 100,
            price: 150,
            timestamp: new Date('2024-01-15T10:00:00'),
            underlying: 'AAPL'
          },
          {
            id: 'trade-2',
            position_id: 'closed-1',
            trade_type: 'sell',
            quantity: 100,
            price: 155,
            timestamp: new Date('2024-01-20T10:00:00'),
            underlying: 'AAPL'
          }
        ]
      }

      render(
        <PositionCard
          position={closedPosition}
          onViewDetails={vi.fn()}
          avgCost={150}
          pnl={500}
          pnlPercentage={3.33}
        />
      )

      expect(screen.getByText('closed')).toBeInTheDocument()
    })
  })

  describe('Card Interaction', () => {
    it('should call onViewDetails with position ID when card is clicked', () => {
      const handleViewDetails = vi.fn()
      const position: Position = {
        ...basePosition,
        id: 'click-test-1'
      }

      const { container } = render(
        <PositionCard
          position={position}
          onViewDetails={handleViewDetails}
          {...mockMetrics}
        />
      )

      const card = container.querySelector('[data-testid="position-card"]')
      fireEvent.click(card!)

      expect(handleViewDetails).toHaveBeenCalledWith('click-test-1')
    })

    it('should have cursor-pointer class for clickable card', () => {
      const { container } = render(
        <PositionCard
          position={basePosition}
          onViewDetails={vi.fn()}
          {...mockMetrics}
        />
      )

      const card = container.querySelector('[data-testid="position-card"]')
      expect(card).toHaveClass('cursor-pointer')
    })
  })

  describe('Position Basic Info Display', () => {
    it('should display symbol correctly', () => {
      const position: Position = {
        ...basePosition,
        symbol: 'TSLA'
      }

      render(
        <PositionCard
          position={position}
          onViewDetails={vi.fn()}
          {...mockMetrics}
        />
      )

      expect(screen.getByText('TSLA')).toBeInTheDocument()
    })

    it('should display P&L when provided', () => {
      const position: Position = {
        ...basePosition,
        trades: [
          {
            id: 'trade-1',
            position_id: 'pnl-test-1',
            trade_type: 'buy',
            quantity: 100,
            price: 150,
            timestamp: new Date('2024-01-15T10:00:00'),
            underlying: 'AAPL'
          }
        ]
      }

      render(
        <PositionCard
          position={position}
          onViewDetails={vi.fn()}
          avgCost={150}
          pnl={500}
          pnlPercentage={3.33}
        />
      )

      expect(screen.getByText(/\$500\.00/)).toBeInTheDocument()
    })

    it('should display average cost from props', () => {
      render(
        <PositionCard
          position={basePosition}
          onViewDetails={vi.fn()}
          avgCost={155.50}
          pnl={null}
          pnlPercentage={undefined}
        />
      )

      expect(screen.getByText('$155.50')).toBeInTheDocument()
    })
  })

  describe('ITM/OTM Indication', () => {
    it('should show ITM indication when stock price is above strike for Short Put', () => {
      const shortPutPosition: Position = {
        ...basePosition,
        id: 'itm-test-1',
        strategy_type: 'Short Put',
        strike_price: 150.00,
        trades: []
      }

      render(
        <PositionCard
          position={shortPutPosition}
          onViewDetails={vi.fn()}
          avgCost={0}
          pnl={null}
          pnlPercentage={undefined}
          currentPrice={155.00}
        />
      )

      const itmElement = screen.getByText(/ITM/)
      expect(itmElement).toBeInTheDocument()
    })

    it('should show OTM indication when stock price is below strike for Short Put', () => {
      const shortPutPosition: Position = {
        ...basePosition,
        id: 'otm-test-1',
        strategy_type: 'Short Put',
        strike_price: 150.00,
        trades: []
      }

      render(
        <PositionCard
          position={shortPutPosition}
          onViewDetails={vi.fn()}
          avgCost={0}
          pnl={null}
          pnlPercentage={undefined}
          currentPrice={145.00}
        />
      )

      const otmElement = screen.getByText(/OTM/)
      expect(otmElement).toBeInTheDocument()
    })

    it('should not show ITM/OTM for Long Stock positions', () => {
      const longStockPosition: Position = {
        ...basePosition,
        id: 'stock-test-1',
        strategy_type: 'Long Stock',
        trades: []
      }

      render(
        <PositionCard
          position={longStockPosition}
          onViewDetails={vi.fn()}
          {...mockMetrics}
        />
      )

      expect(screen.queryByText(/ITM/)).not.toBeInTheDocument()
      expect(screen.queryByText(/OTM/)).not.toBeInTheDocument()
    })
  })
})
