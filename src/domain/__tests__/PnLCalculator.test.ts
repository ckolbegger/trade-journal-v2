import { describe, it, expect } from 'vitest'
import { PnLCalculator } from '../calculators/PnLCalculator'
import type { Trade, Position } from '@/lib/position'
import type { PriceHistory } from '@/types/priceHistory'

describe('PnLCalculator', () => {
  const createTrade = (type: 'buy' | 'sell', quantity: number, price: number): Trade => ({
    id: `trade-${Math.random()}`,
    position_id: 'pos-123',
    trade_type: type,
    quantity,
    price,
    timestamp: new Date(),
    underlying: 'AAPL'
  })

  const createPriceHistory = (underlying: string, close: number): PriceHistory => ({
    id: `price-${underlying}`,
    underlying,
    date: '2024-01-15',
    open: close,
    high: close,
    low: close,
    close,
    updated_at: new Date()
  })

  describe('calculateTradePnL', () => {
    it('should calculate P&L for buy trade with gain', () => {
      const trade = createTrade('buy', 100, 150)
      const priceHistory = createPriceHistory('AAPL', 160)
      // P&L = (160 - 150) × 100 = 1000
      expect(PnLCalculator.calculateTradePnL(trade, priceHistory)).toBe(1000)
    })

    it('should calculate P&L for buy trade with loss', () => {
      const trade = createTrade('buy', 100, 150)
      const priceHistory = createPriceHistory('AAPL', 145)
      // P&L = (145 - 150) × 100 = -500
      expect(PnLCalculator.calculateTradePnL(trade, priceHistory)).toBe(-500)
    })

    it('should return 0 for sell trade (already realized)', () => {
      const trade = createTrade('sell', 50, 160)
      const priceHistory = createPriceHistory('AAPL', 170)
      // Sell trades have no unrealized P&L
      expect(PnLCalculator.calculateTradePnL(trade, priceHistory)).toBe(0)
    })

    it('should handle zero P&L (price unchanged)', () => {
      const trade = createTrade('buy', 100, 150)
      const priceHistory = createPriceHistory('AAPL', 150)
      expect(PnLCalculator.calculateTradePnL(trade, priceHistory)).toBe(0)
    })
  })

  describe('calculatePositionPnL', () => {
    const basePosition: Position = {
      id: 'pos-123',
      symbol: 'AAPL',
      strategy_type: 'Long Stock',
      target_entry_price: 150,
      target_quantity: 100,
      profit_target: 165,
      stop_loss: 135,
      position_thesis: 'Test',
      created_date: new Date(),
      status: 'open',
      journal_entry_ids: [],
      trades: []
    }

    it('should calculate P&L with current price', () => {
      const position = {
        ...basePosition,
        trades: [
          createTrade('buy', 100, 150)
        ]
      }
      const priceMap = new Map([
        ['AAPL', createPriceHistory('AAPL', 160)]
      ])
      // P&L = (160 - 150) × 100 = 1000
      expect(PnLCalculator.calculatePositionPnL(position, priceMap)).toBe(1000)
    })

    it('should return null if no price data', () => {
      const position = {
        ...basePosition,
        trades: [createTrade('buy', 100, 150)]
      }
      const priceMap = new Map() // Empty price map
      expect(PnLCalculator.calculatePositionPnL(position, priceMap)).toBeNull()
    })

    it('should return null if no trades', () => {
      const position = { ...basePosition, trades: [] }
      const priceMap = new Map([
        ['AAPL', createPriceHistory('AAPL', 160)]
      ])
      expect(PnLCalculator.calculatePositionPnL(position, priceMap)).toBeNull()
    })

    it('should handle multiple trades', () => {
      const position = {
        ...basePosition,
        trades: [
          createTrade('buy', 100, 150), // P&L = (160-150)×100 = 1000
          createTrade('buy', 50, 155),  // P&L = (160-155)×50 = 250
          createTrade('sell', 25, 158)  // P&L = 0 (sell)
        ]
      }
      const priceMap = new Map([
        ['AAPL', createPriceHistory('AAPL', 160)]
      ])
      // Total P&L = 1000 + 250 + 0 = 1250
      expect(PnLCalculator.calculatePositionPnL(position, priceMap)).toBe(1250)
    })

    it('should handle negative P&L', () => {
      const position = {
        ...basePosition,
        trades: [createTrade('buy', 100, 150)]
      }
      const priceMap = new Map([
        ['AAPL', createPriceHistory('AAPL', 140)]
      ])
      // P&L = (140 - 150) × 100 = -1000
      expect(PnLCalculator.calculatePositionPnL(position, priceMap)).toBe(-1000)
    })
  })

  describe('calculatePnLPercentage', () => {
    it('should calculate percentage gain', () => {
      const pnl = 1000
      const costBasis = 10000
      // Percentage = (1000 / 10000) × 100 = 10%
      expect(PnLCalculator.calculatePnLPercentage(pnl, costBasis)).toBe(10)
    })

    it('should calculate percentage loss', () => {
      const pnl = -500
      const costBasis = 10000
      // Percentage = (-500 / 10000) × 100 = -5%
      expect(PnLCalculator.calculatePnLPercentage(pnl, costBasis)).toBe(-5)
    })

    it('should handle zero cost basis', () => {
      const pnl = 100
      const costBasis = 0
      // Should return 0 instead of dividing by zero
      expect(PnLCalculator.calculatePnLPercentage(pnl, costBasis)).toBe(0)
    })

    it('should round to 2 decimal places', () => {
      const pnl = 1234.567
      const costBasis = 10000
      // Percentage = 12.34567 → 12.35
      expect(PnLCalculator.calculatePnLPercentage(pnl, costBasis)).toBe(12.35)
    })

    it('should handle 100% gain', () => {
      const pnl = 10000
      const costBasis = 10000
      expect(PnLCalculator.calculatePnLPercentage(pnl, costBasis)).toBe(100)
    })

    it('should handle 100% loss', () => {
      const pnl = -10000
      const costBasis = 10000
      expect(PnLCalculator.calculatePnLPercentage(pnl, costBasis)).toBe(-100)
    })
  })
})
