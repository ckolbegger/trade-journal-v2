import { describe, it, expect } from 'vitest'
import type { Trade, Position } from '@/lib/position'
import type { PriceHistory } from '@/types/priceHistory'

// Import the functions that will be implemented
// These should throw "Not implemented" errors initially
import {
  calculateTradePnL,
  calculatePositionPnL,
  calculatePnLPercentage,
  calculateProgressToTarget,
  createPriceMap
} from '@/utils/performance'

// Test data factories
const createTestTrade = (overrides?: Partial<Trade>): Trade => ({
  id: 'trade-123',
  position_id: 'pos-123',
  trade_type: 'buy',
  quantity: 100,
  price: 150.25,
  timestamp: new Date('2024-01-15T10:30:00.000Z'),
  notes: 'Test trade execution',
  underlying: 'AAPL',
  ...overrides
})

const createTestPriceHistory = (overrides?: Partial<PriceHistory>): PriceHistory => ({
  id: 'price-123',
  underlying: 'AAPL',
  date: '2024-10-25',
  open: 150.00,
  high: 155.00,
  low: 148.00,
  close: 152.50,
  updated_at: new Date('2024-10-25T16:00:00.000Z'),
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
  status: 'open',
  journal_entry_ids: [],
  trades: [],
  ...overrides
})

describe('Slice 3.3: P&L Calculation Engine', () => {
  describe('Price Map Creation', () => {
    it('Test: Create price map from price history array', () => {
      const priceHistories = [
        createTestPriceHistory({ underlying: 'AAPL', date: '2024-10-25', close: 152.50 }),
        createTestPriceHistory({ underlying: 'TSLA', date: '2024-10-25', close: 265.00 }),
        createTestPriceHistory({ underlying: 'NVDA', date: '2024-10-25', close: 445.00 })
      ]

      const priceMap = createPriceMap(priceHistories)

      expect(priceMap.size).toBe(3)
      expect(priceMap.get('AAPL')).toBe(152.50)
      expect(priceMap.get('TSLA')).toBe(265.00)
      expect(priceMap.get('NVDA')).toBe(445.00)
    })

    it('Test: Handle empty price history array', () => {
      const priceMap = createPriceMap([])

      expect(priceMap.size).toBe(0)
      expect(priceMap.get('AAPL')).toBeUndefined()
    })

    it('Test: Use most recent price when multiple entries for same underlying', () => {
      const priceHistories = [
        createTestPriceHistory({ underlying: 'AAPL', date: '2024-10-24', close: 150.00 }),
        createTestPriceHistory({ underlying: 'AAPL', date: '2024-10-25', close: 152.50 }),
        createTestPriceHistory({ underlying: 'AAPL', date: '2024-10-23', close: 148.00 })
      ]

      const priceMap = createPriceMap(priceHistories)

      expect(priceMap.size).toBe(1)
      expect(priceMap.get('AAPL')).toBe(152.50) // Most recent
    })
  })

  describe('Trade P&L Calculation', () => {
    it('Test: Calculate P&L for profitable long stock trade', () => {
      const trade = createTestTrade({ trade_type: 'buy', quantity: 100, price: 150.00 })
      const currentPrice = 155.00

      const pnl = calculateTradePnL(trade, currentPrice)

      expect(pnl).toBe(500.00) // (155 - 150) * 100
    })

    it('Test: Calculate P&L for losing long stock trade', () => {
      const trade = createTestTrade({ trade_type: 'buy', quantity: 100, price: 150.00 })
      const currentPrice = 145.00

      const pnl = calculateTradePnL(trade, currentPrice)

      expect(pnl).toBe(-500.00) // (145 - 150) * 100
    })

    it('Test: Calculate P&L for profitable short stock trade (Phase 2+)', () => {
      const trade = createTestTrade({ trade_type: 'sell', quantity: 100, price: 150.00 })
      const currentPrice = 145.00

      const pnl = calculateTradePnL(trade, currentPrice)

      expect(pnl).toBe(500.00) // (150 - 145) * 100
    })

    it('Test: Calculate P&L for break-even trade', () => {
      const trade = createTestTrade({ trade_type: 'buy', quantity: 100, price: 150.00 })
      const currentPrice = 150.00

      const pnl = calculateTradePnL(trade, currentPrice)

      expect(pnl).toBe(0.00)
    })

    it('Test: Handle fractional shares', () => {
      const trade = createTestTrade({ trade_type: 'buy', quantity: 0.5, price: 250.00 })
      const currentPrice = 275.00

      const pnl = calculateTradePnL(trade, currentPrice)

      expect(pnl).toBe(12.50) // (275 - 250) * 0.5
    })
  })

  describe('Position P&L Calculation', () => {
    it('Test: Calculate position P&L with single long trade', () => {
      const position = createTestPosition({
        trades: [createTestTrade({ trade_type: 'buy', quantity: 100, price: 150.00 })]
      })
      const priceMap = new Map([['AAPL', 155.00]])

      const pnl = calculatePositionPnL(position, priceMap)

      expect(pnl).toBe(500.00) // Same as single trade
    })

    it('Test: Calculate position P&L with multiple trades (Phase 2+)', () => {
      const position = createTestPosition({
        trades: [
          createTestTrade({ id: 'trade-1', trade_type: 'buy', quantity: 50, price: 150.00 }),
          createTestTrade({ id: 'trade-2', trade_type: 'buy', quantity: 50, price: 155.00 })
        ]
      })
      const priceMap = new Map([['AAPL', 160.00]])

      const pnl = calculatePositionPnL(position, priceMap)

      expect(pnl).toBe(750.00) // (160-150)*50 + (160-155)*50 = 500 + 250
    })

    it('Test: Handle position with no trades', () => {
      const position = createTestPosition({ trades: [] })
      const priceMap = new Map([['AAPL', 155.00]])

      const pnl = calculatePositionPnL(position, priceMap)

      expect(pnl).toBe(0.00)
    })

    it('Test: Handle missing price for underlying', () => {
      const position = createTestPosition({
        trades: [createTestTrade({ trade_type: 'buy', quantity: 100, price: 150.00 })]
      })
      const priceMap = new Map([['TSLA', 250.00]]) // No AAPL price

      const pnl = calculatePositionPnL(position, priceMap)

      expect(pnl).toBe(0.00) // Should return 0 when price not available
    })
  })

  describe('P&L Percentage Calculation', () => {
    it('Test: Calculate percentage gain', () => {
      const position = createTestPosition({
        trades: [createTestTrade({ trade_type: 'buy', quantity: 100, price: 150.00 })]
      })
      const priceMap = new Map([['AAPL', 165.00]])

      const percentage = calculatePnLPercentage(position, priceMap)

      expect(percentage).toBe(10.0) // (165-150)/150 * 100 = 10%
    })

    it('Test: Calculate percentage loss', () => {
      const position = createTestPosition({
        trades: [createTestTrade({ trade_type: 'buy', quantity: 100, price: 150.00 })]
      })
      const priceMap = new Map([['AAPL', 135.00]])

      const percentage = calculatePnLPercentage(position, priceMap)

      expect(percentage).toBe(-10.0) // (135-150)/150 * 100 = -10%
    })

    it('Test: Handle zero cost basis (should return 0)', () => {
      const position = createTestPosition({
        trades: [createTestTrade({ trade_type: 'buy', quantity: 100, price: 0.00 })]
      })
      const priceMap = new Map([['AAPL', 150.00]])

      const percentage = calculatePnLPercentage(position, priceMap)

      expect(percentage).toBe(0.00) // Division by zero protection
    })

    it('Test: Handle position with no trades', () => {
      const position = createTestPosition({ trades: [] })
      const priceMap = new Map([['AAPL', 150.00]])

      const percentage = calculatePnLPercentage(position, priceMap)

      expect(percentage).toBe(0.00)
    })
  })

  describe('Progress to Target Calculation', () => {
    it('Test: Calculate progress when at profit target', () => {
      const position = createTestPosition({ profit_target: 165.00 })
      const priceMap = new Map([['AAPL', 165.00]])

      const progress = calculateProgressToTarget(position, priceMap)

      expect(progress).toBe(100.0) // Exactly at target
    })

    it('Test: Calculate progress when halfway to target', () => {
      const position = createTestPosition({
        target_entry_price: 150.00,
        profit_target: 165.00
      })
      const priceMap = new Map([['AAPL', 157.50]])

      const progress = calculateProgressToTarget(position, priceMap)

      expect(progress).toBe(50.0) // (157.5-150)/(165-150) * 100 = 50%
    })

    it('Test: Calculate progress when above target', () => {
      const position = createTestPosition({
        target_entry_price: 150.00,
        profit_target: 165.00
      })
      const priceMap = new Map([['AAPL', 170.00]])

      const progress = calculateProgressToTarget(position, priceMap)

      expect(progress).toBe(100.0) // Capped at 100%
    })

    it('Test: Calculate progress when below entry (negative progress)', () => {
      const position = createTestPosition({
        target_entry_price: 150.00,
        profit_target: 165.00
      })
      const priceMap = new Map([['AAPL', 145.00]])

      const progress = calculateProgressToTarget(position, priceMap)

      expect(progress).toBe(-33.33) // (145-150)/(165-150) * 100 = -33.33%
    })

    it('Test: Handle zero target range', () => {
      const position = createTestPosition({
        target_entry_price: 150.00,
        profit_target: 150.00 // Same as entry
      })
      const priceMap = new Map([['AAPL', 155.00]])

      const progress = calculateProgressToTarget(position, priceMap)

      expect(progress).toBe(0.00) // Division by zero protection
    })

    it('Test: Handle missing price', () => {
      const position = createTestPosition({ profit_target: 165.00 })
      const priceMap = new Map([['TSLA', 250.00]]) // No AAPL price

      const progress = calculateProgressToTarget(position, priceMap)

      expect(progress).toBe(0.00)
    })
  })

  describe('Error Handling', () => {
    it('Test: Handle null/undefined inputs gracefully', () => {
      expect(() => calculateTradePnL(null as any, 150.00)).not.toThrow()
      expect(() => calculatePositionPnL(null as any, new Map())).not.toThrow()
      expect(() => calculatePnLPercentage(null as any, new Map())).not.toThrow()
      expect(() => calculateProgressToTarget(null as any, new Map())).not.toThrow()
    })

    it('Test: Return 0 for invalid calculations', () => {
      const result1 = calculateTradePnL(null as any, 150.00)
      const result2 = calculatePositionPnL(null as any, new Map())
      const result3 = calculatePnLPercentage(null as any, new Map())
      const result4 = calculateProgressToTarget(null as any, new Map())

      expect(result1).toBe(0.00)
      expect(result2).toBe(0.00)
      expect(result3).toBe(0.00)
      expect(result4).toBe(0.00)
    })
  })
})