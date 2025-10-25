import { describe, it, expect } from 'vitest'
import {
  calculateTradePnL,
  calculatePositionPnL,
  calculatePnLPercentage,
  getPriceMapForPosition,
  calculateProgressToTarget
} from '@/utils/pnl'
import type { Trade, Position } from '@/lib/position'
import type { PriceHistory } from '@/types/priceHistory'

/**
 * Tests for P&L calculation utilities
 *
 * These tests verify trade-level and position-level P&L calculations
 * using the FIFO cost basis methodology and price data from PriceHistory.
 */

// Test data factories
const createTestTrade = (overrides?: Partial<Trade>): Trade => ({
  id: 'trade-123',
  position_id: 'pos-123',
  trade_type: 'buy',
  quantity: 100,
  price: 150.00,
  timestamp: new Date('2024-01-15T10:30:00.000Z'),
  underlying: 'AAPL',
  notes: 'Test trade',
  ...overrides
})

const createTestPosition = (overrides?: Partial<Position>): Position => ({
  id: 'pos-123',
  symbol: 'AAPL',
  strategy_type: 'Long Stock',
  target_entry_price: 150,
  target_quantity: 100,
  profit_target: 165,
  stop_loss: 135,
  position_thesis: 'Test position thesis',
  created_date: new Date('2024-01-15T00:00:00.000Z'),
  status: 'planned',
  journal_entry_ids: [],
  trades: [],
  ...overrides
})

const createTestPriceHistory = (overrides?: Partial<PriceHistory>): PriceHistory => ({
  id: 'price-AAPL-2024-01-20',
  underlying: 'AAPL',
  date: '2024-01-20',
  open: 165.00,
  high: 165.00,
  low: 165.00,
  close: 165.00,
  updated_at: new Date('2024-01-20T16:00:00.000Z'),
  ...overrides
})

describe('P&L Calculations - Trade-Level', () => {
  describe('calculateTradePnL', () => {
    it('[Unit] should calculate profit for buy trade', () => {
      // Arrange
      const buyTrade = createTestTrade({
        trade_type: 'buy',
        quantity: 100,
        price: 150.00
      })
      const currentPrice = createTestPriceHistory({ close: 165.00 })

      // Act
      const pnl = calculateTradePnL(buyTrade, currentPrice)

      // Assert
      expect(pnl).toBe(1500.00) // (165 - 150) * 100
    })

    it('[Unit] should calculate loss for buy trade', () => {
      // Arrange
      const buyTrade = createTestTrade({
        trade_type: 'buy',
        quantity: 100,
        price: 150.00
      })
      const currentPrice = createTestPriceHistory({ close: 140.00 })

      // Act
      const pnl = calculateTradePnL(buyTrade, currentPrice)

      // Assert
      expect(pnl).toBe(-1000.00) // (140 - 150) * 100
    })

    it('[Unit] should return zero for sell trade (already realized)', () => {
      // Arrange
      const sellTrade = createTestTrade({
        trade_type: 'sell',
        quantity: 50,
        price: 165.00
      })
      const currentPrice = createTestPriceHistory({ close: 170.00 })

      // Act
      const pnl = calculateTradePnL(sellTrade, currentPrice)

      // Assert
      expect(pnl).toBe(0) // Sell trades have no unrealized P&L
    })

    it('[Unit] should use close price from PriceHistory', () => {
      // Arrange
      const buyTrade = createTestTrade({ price: 100.00, quantity: 10 })
      const priceHistory = createTestPriceHistory({
        open: 105.00,
        high: 110.00,
        low: 95.00,
        close: 108.00  // This is what should be used
      })

      // Act
      const pnl = calculateTradePnL(buyTrade, priceHistory)

      // Assert
      expect(pnl).toBe(80.00) // (108 - 100) * 10
    })
  })
})

describe('P&L Calculations - Position-Level', () => {
  describe('calculatePositionPnL', () => {
    it('[Unit] should sum P&L from all trades', () => {
      // Arrange
      const position = createTestPosition({
        trades: [
          createTestTrade({ id: 'trade-1', quantity: 50, price: 150.00, underlying: 'AAPL' }),
          createTestTrade({ id: 'trade-2', quantity: 50, price: 160.00, underlying: 'AAPL' })
        ]
      })
      const priceMap = new Map<string, PriceHistory>([
        ['AAPL', createTestPriceHistory({ close: 170.00 })]
      ])

      // Act
      const pnl = calculatePositionPnL(position, priceMap)

      // Assert
      // Trade 1: (170 - 150) * 50 = 1000
      // Trade 2: (170 - 160) * 50 = 500
      // Total: 1500
      expect(pnl).toBe(1500.00)
    })

    it('[Unit] should handle mixed buy and sell trades', () => {
      // Arrange
      const position = createTestPosition({
        trades: [
          createTestTrade({ id: 'trade-1', trade_type: 'buy', quantity: 100, price: 150.00 }),
          createTestTrade({ id: 'trade-2', trade_type: 'sell', quantity: 50, price: 165.00 })
        ]
      })
      const priceMap = new Map<string, PriceHistory>([
        ['AAPL', createTestPriceHistory({ close: 170.00 })]
      ])

      // Act
      const pnl = calculatePositionPnL(position, priceMap)

      // Assert
      // Buy trade: (170 - 150) * 100 = 2000
      // Sell trade: 0 (already realized)
      // Total: 2000
      expect(pnl).toBe(2000.00)
    })

    it('[Unit] should skip trades without price data', () => {
      // Arrange
      const position = createTestPosition({
        trades: [
          createTestTrade({ id: 'trade-1', underlying: 'AAPL', quantity: 100, price: 150.00 }),
          createTestTrade({ id: 'trade-2', underlying: 'TSLA', quantity: 50, price: 200.00 })
        ]
      })
      // Only AAPL price available
      const priceMap = new Map<string, PriceHistory>([
        ['AAPL', createTestPriceHistory({ close: 165.00 })]
      ])

      // Act
      const pnl = calculatePositionPnL(position, priceMap)

      // Assert
      // AAPL trade: (165 - 150) * 100 = 1500
      // TSLA trade: skipped (no price data)
      expect(pnl).toBe(1500.00)
    })

    it('[Unit] should return null for empty trades array', () => {
      // Arrange
      const position = createTestPosition({ trades: [] })
      const priceMap = new Map<string, PriceHistory>()

      // Act
      const pnl = calculatePositionPnL(position, priceMap)

      // Assert
      expect(pnl).toBeNull()
    })

    it('[Unit] should return null when no price data available', () => {
      // Arrange
      const position = createTestPosition({
        trades: [createTestTrade({ underlying: 'AAPL' })]
      })
      const priceMap = new Map<string, PriceHistory>() // Empty price map

      // Act
      const pnl = calculatePositionPnL(position, priceMap)

      // Assert
      expect(pnl).toBeNull()
    })
  })
})

describe('P&L Calculations - Percentage', () => {
  describe('calculatePnLPercentage', () => {
    it('[Unit] should compute correct percentage gain', () => {
      // Arrange
      const pnl = 1500
      const costBasis = 15000

      // Act
      const percentage = calculatePnLPercentage(pnl, costBasis)

      // Assert
      expect(percentage).toBe(10.0)
    })

    it('[Unit] should compute correct percentage loss', () => {
      // Arrange
      const pnl = -1000
      const costBasis = 20000

      // Act
      const percentage = calculatePnLPercentage(pnl, costBasis)

      // Assert
      expect(percentage).toBe(-5.0)
    })

    it('[Unit] should handle zero cost basis without error', () => {
      // Arrange
      const pnl = 1000
      const costBasis = 0

      // Act
      const percentage = calculatePnLPercentage(pnl, costBasis)

      // Assert
      expect(percentage).toBe(0)
    })

    it('[Unit] should handle zero P&L', () => {
      // Arrange
      const pnl = 0
      const costBasis = 10000

      // Act
      const percentage = calculatePnLPercentage(pnl, costBasis)

      // Assert
      expect(percentage).toBe(0)
    })
  })
})

describe('P&L Calculations - Price Map Helper', () => {
  describe('getPriceMapForPosition', () => {
    it('[Unit] should fetch prices for all unique underlyings in position', async () => {
      // Arrange
      const position = createTestPosition({
        trades: [
          createTestTrade({ id: 'trade-1', underlying: 'AAPL' }),
          createTestTrade({ id: 'trade-2', underlying: 'AAPL' }),
          createTestTrade({ id: 'trade-3', underlying: 'TSLA' })
        ]
      })

      // Mock price service that returns prices
      const mockGetLatestPrices = async (underlyings: string[]) => {
        const map = new Map<string, PriceHistory>()
        if (underlyings.includes('AAPL')) {
          map.set('AAPL', createTestPriceHistory({ underlying: 'AAPL', close: 165.00 }))
        }
        if (underlyings.includes('TSLA')) {
          map.set('TSLA', createTestPriceHistory({ underlying: 'TSLA', close: 250.00 }))
        }
        return map
      }

      // Act
      const priceMap = await getPriceMapForPosition(position, mockGetLatestPrices)

      // Assert
      expect(priceMap.size).toBe(2)
      expect(priceMap.get('AAPL')?.close).toBe(165.00)
      expect(priceMap.get('TSLA')?.close).toBe(250.00)
    })

    it('[Unit] should return empty map for position with no trades', async () => {
      // Arrange
      const position = createTestPosition({ trades: [] })
      const mockGetLatestPrices = async () => new Map<string, PriceHistory>()

      // Act
      const priceMap = await getPriceMapForPosition(position, mockGetLatestPrices)

      // Assert
      expect(priceMap.size).toBe(0)
    })

    it('[Unit] should handle missing price for some underlyings', async () => {
      // Arrange
      const position = createTestPosition({
        trades: [
          createTestTrade({ id: 'trade-1', underlying: 'AAPL' }),
          createTestTrade({ id: 'trade-2', underlying: 'TSLA' })
        ]
      })

      // Mock returns only AAPL price
      const mockGetLatestPrices = async (underlyings: string[]) => {
        const map = new Map<string, PriceHistory>()
        if (underlyings.includes('AAPL')) {
          map.set('AAPL', createTestPriceHistory({ underlying: 'AAPL', close: 165.00 }))
        }
        return map
      }

      // Act
      const priceMap = await getPriceMapForPosition(position, mockGetLatestPrices)

      // Assert
      expect(priceMap.size).toBe(1)
      expect(priceMap.has('AAPL')).toBe(true)
      expect(priceMap.has('TSLA')).toBe(false)
    })
  })
})

describe('P&L Calculations - Progress to Target', () => {
  describe('calculateProgressToTarget', () => {
    it('[Unit] should calculate progress between stop and target', () => {
      // Arrange
      const position = createTestPosition({
        stop_loss: 240.00,
        profit_target: 280.00
      })
      const currentPrice = 265.00

      // Act
      const progress = calculateProgressToTarget(position, currentPrice)

      // Assert
      expect(progress.percentProgress).toBe(62.5) // (265 - 240) / (280 - 240) * 100
      expect(progress.distanceToStop).toBe(25.00) // 265 - 240
      expect(progress.distanceToTarget).toBe(15.00) // 280 - 265
      expect(progress.capturedProfit).toBe(62.5)
    })

    it('[Unit] should handle price below stop loss', () => {
      // Arrange
      const position = createTestPosition({
        stop_loss: 240.00,
        profit_target: 280.00
      })
      const currentPrice = 230.00

      // Act
      const progress = calculateProgressToTarget(position, currentPrice)

      // Assert
      expect(progress.percentProgress).toBeLessThan(0)
      expect(progress.distanceToStop).toBe(-10.00) // Below stop
    })

    it('[Unit] should handle price above profit target', () => {
      // Arrange
      const position = createTestPosition({
        stop_loss: 240.00,
        profit_target: 280.00
      })
      const currentPrice = 290.00

      // Act
      const progress = calculateProgressToTarget(position, currentPrice)

      // Assert
      expect(progress.percentProgress).toBeGreaterThan(100)
      expect(progress.distanceToTarget).toBe(-10.00) // Exceeded target
    })

    it('[Unit] should calculate distances correctly', () => {
      // Arrange
      const position = createTestPosition({
        stop_loss: 100.00,
        profit_target: 200.00
      })
      const currentPrice = 150.00

      // Act
      const progress = calculateProgressToTarget(position, currentPrice)

      // Assert
      expect(progress.distanceToStop).toBe(50.00)
      expect(progress.distanceToTarget).toBe(50.00)
      expect(progress.percentProgress).toBe(50.0)
    })
  })
})
