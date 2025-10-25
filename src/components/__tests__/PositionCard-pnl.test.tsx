import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { PositionCard } from '@/components/PositionCard'
import type { Position } from '@/lib/position'
import type { PriceHistory } from '@/types/priceHistory'

/**
 * Tests for PositionCard P&L Integration
 *
 * Verifies real-time P&L display based on price data
 */

describe('PositionCard - P&L Integration', () => {
  const basePriceHistory: PriceHistory = {
    id: 'price-1',
    underlying: 'AAPL',
    date: '2024-01-20',
    open: 155.00,
    high: 155.00,
    low: 155.00,
    close: 155.00,
    updated_at: new Date()
  }

  const basePosition: Position = {
    id: 'test-pos-1',
    symbol: 'AAPL',
    strategy_type: 'Long Stock',
    target_entry_price: 150.00,
    target_quantity: 100,
    profit_target: 160.00,
    stop_loss: 145.00,
    position_thesis: 'Test thesis',
    created_date: new Date('2024-01-15'),
    status: 'open',
    journal_entry_ids: [],
    trades: [
      {
        id: 'trade-1',
        position_id: 'test-pos-1',
        trade_type: 'buy',
        quantity: 100,
        price: 150.00,
        timestamp: new Date('2024-01-15T10:00:00'),
        underlying: 'AAPL'
      }
    ]
  }

  describe('P&L Display with Price Data', () => {
    it('[Unit] should display positive P&L in green when price is up', async () => {
      // Arrange
      // Cost basis: $150, Current: $155, P&L: +$500 (+3.3%)
      const position = { ...basePosition }
      const priceHistory = { ...basePriceHistory, close: 155.00 }

      // Act
      const { container } = render(
        <PositionCard
          position={position}
          priceHistory={priceHistory}
          onViewDetails={vi.fn()}
        />
      )

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/\$500\.00/)).toBeInTheDocument()
        expect(container.querySelector('.text-green-600')).toBeTruthy()
      })
    })

    it('[Unit] should display negative P&L in red when price is down', async () => {
      // Arrange
      // Cost basis: $150, Current: $145, P&L: -$500 (-3.3%)
      const position = { ...basePosition }
      const priceHistory = { ...basePriceHistory, close: 145.00 }

      // Act
      const { container } = render(
        <PositionCard
          position={position}
          priceHistory={priceHistory}
          onViewDetails={vi.fn()}
        />
      )

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/-\$500\.00/)).toBeInTheDocument()
        expect(container.querySelector('.text-red-600')).toBeTruthy()
      })
    })

    it('[Unit] should display zero P&L in gray when price is flat', async () => {
      // Arrange
      // Cost basis: $150, Current: $150, P&L: $0 (0%)
      const position = { ...basePosition }
      const priceHistory = { ...basePriceHistory, close: 150.00 }

      // Act
      const { container } = render(
        <PositionCard
          position={position}
          priceHistory={priceHistory}
          onViewDetails={vi.fn()}
        />
      )

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/\$0\.00/)).toBeInTheDocument()
        expect(container.querySelector('.text-gray-500')).toBeTruthy()
      })
    })

    it('[Unit] should include percentage change in P&L display', async () => {
      // Arrange
      // Cost basis: $150, Current: $157.50, P&L: +$750 (+5%)
      const position = { ...basePosition }
      const priceHistory = { ...basePriceHistory, close: 157.50 }

      // Act
      render(
        <PositionCard
          position={position}
          priceHistory={priceHistory}
          onViewDetails={vi.fn()}
        />
      )

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/\$750\.00/)).toBeInTheDocument()
        expect(screen.getByText(/5\.0%/)).toBeInTheDocument()
      })
    })
  })

  describe('No Price Data Handling', () => {
    it('[Unit] should display "—" when no price data exists', async () => {
      // Arrange
      const position = { ...basePosition }

      // Act
      render(
        <PositionCard
          position={position}
          priceHistory={null}
          onViewDetails={vi.fn()}
        />
      )

      // Assert
      await waitFor(() => {
        expect(screen.getByText('—')).toBeInTheDocument()
      })
    })

    it('[Unit] should not display P&L for planned positions (no trades)', async () => {
      // Arrange
      const plannedPosition: Position = {
        ...basePosition,
        trades: [],
        status: 'planned'
      }
      const priceHistory = { ...basePriceHistory }

      // Act
      render(
        <PositionCard
          position={plannedPosition}
          priceHistory={priceHistory}
          onViewDetails={vi.fn()}
        />
      )

      // Assert
      // Planned positions should show "—" even with price data
      await waitFor(() => {
        expect(screen.getByText('—')).toBeInTheDocument()
      })
    })
  })

  describe('Multiple Trades', () => {
    it('[Unit] should calculate P&L for position with multiple trades', async () => {
      // Arrange
      const multiTradePosition: Position = {
        ...basePosition,
        trades: [
          {
            id: 'trade-1',
            position_id: 'test-pos-1',
            trade_type: 'buy',
            quantity: 50,
            price: 150.00,
            timestamp: new Date('2024-01-15T10:00:00'),
            underlying: 'AAPL'
          },
          {
            id: 'trade-2',
            position_id: 'test-pos-1',
            trade_type: 'buy',
            quantity: 50,
            price: 152.00,
            timestamp: new Date('2024-01-16T10:00:00'),
            underlying: 'AAPL'
          }
        ]
      }
      // Avg cost: (50*150 + 50*152) / 100 = 151
      // Current: 155
      // P&L: (155-151) * 100 = +$400
      const priceHistory = { ...basePriceHistory, close: 155.00 }

      // Act
      render(
        <PositionCard
          position={multiTradePosition}
          priceHistory={priceHistory}
          onViewDetails={vi.fn()}
        />
      )

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/\$400\.00/)).toBeInTheDocument()
      })
    })
  })
})
