import { describe, it, expect } from 'vitest'
import { CostBasisCalculator } from '../calculators/CostBasisCalculator'
import type { Trade } from '@/lib/position'

describe('CostBasisCalculator', () => {
  const createTrade = (type: 'buy' | 'sell', quantity: number, price: number): Trade => ({
    id: `trade-${Math.random()}`,
    position_id: 'pos-123',
    trade_type: type,
    quantity,
    price,
    timestamp: new Date(),
    underlying: 'AAPL'
  })

  describe('calculateAverageCost', () => {
    it('should calculate average from multiple trades', () => {
      const trades = [
        createTrade('buy', 100, 150),
        createTrade('buy', 50, 155),
        createTrade('sell', 25, 160)
      ]
      // Average: (150 + 155 + 160) / 3 = 155
      expect(CostBasisCalculator.calculateAverageCost(trades, 145)).toBe(155)
    })

    it('should return target price if no trades', () => {
      expect(CostBasisCalculator.calculateAverageCost([], 150)).toBe(150)
    })

    it('should handle single trade', () => {
      const trades = [createTrade('buy', 100, 150)]
      expect(CostBasisCalculator.calculateAverageCost(trades, 145)).toBe(150)
    })

    it('should include both buy and sell trades in average', () => {
      const trades = [
        createTrade('buy', 100, 150),
        createTrade('sell', 50, 160)
      ]
      // Average: (150 + 160) / 2 = 155
      expect(CostBasisCalculator.calculateAverageCost(trades, 145)).toBe(155)
    })
  })

  describe('calculateTotalCostBasis', () => {
    it('should sum buy trades only', () => {
      const trades = [
        createTrade('buy', 100, 150), // 100 * 150 = 15,000
        createTrade('buy', 50, 155)   // 50 * 155 = 7,750
      ]
      // Total: 22,750
      expect(CostBasisCalculator.calculateTotalCostBasis(trades)).toBe(22750)
    })

    it('should ignore sell trades', () => {
      const trades = [
        createTrade('buy', 100, 150),  // 100 * 150 = 15,000
        createTrade('sell', 25, 160),  // Should be ignored
        createTrade('buy', 50, 155)    // 50 * 155 = 7,750
      ]
      // Total: 22,750 (sell ignored)
      expect(CostBasisCalculator.calculateTotalCostBasis(trades)).toBe(22750)
    })

    it('should return 0 for no buys', () => {
      const trades = [
        createTrade('sell', 50, 160)
      ]
      expect(CostBasisCalculator.calculateTotalCostBasis(trades)).toBe(0)
    })

    it('should return 0 for empty trades', () => {
      expect(CostBasisCalculator.calculateTotalCostBasis([])).toBe(0)
    })

    it('should handle mixed buy/sell trades', () => {
      const trades = [
        createTrade('buy', 100, 150),  // 15,000
        createTrade('sell', 50, 160),  // Ignored
        createTrade('buy', 25, 145),   // 3,625
        createTrade('sell', 25, 155)   // Ignored
      ]
      // Total: 18,625
      expect(CostBasisCalculator.calculateTotalCostBasis(trades)).toBe(18625)
    })
  })

  describe('calculateOpenQuantity', () => {
    it('should calculate net quantity (buys - sells)', () => {
      const trades = [
        createTrade('buy', 100, 150),
        createTrade('sell', 25, 160),
        createTrade('buy', 50, 155)
      ]
      // Net: 100 - 25 + 50 = 125
      expect(CostBasisCalculator.calculateOpenQuantity(trades)).toBe(125)
    })

    it('should return 0 for equal buys and sells', () => {
      const trades = [
        createTrade('buy', 100, 150),
        createTrade('sell', 100, 160)
      ]
      expect(CostBasisCalculator.calculateOpenQuantity(trades)).toBe(0)
    })

    it('should handle only buys', () => {
      const trades = [
        createTrade('buy', 100, 150),
        createTrade('buy', 50, 155)
      ]
      expect(CostBasisCalculator.calculateOpenQuantity(trades)).toBe(150)
    })

    it('should handle partial exits', () => {
      const trades = [
        createTrade('buy', 100, 150),
        createTrade('sell', 25, 160),
        createTrade('sell', 25, 155)
      ]
      // Net: 100 - 25 - 25 = 50
      expect(CostBasisCalculator.calculateOpenQuantity(trades)).toBe(50)
    })

    it('should return 0 for empty trades', () => {
      expect(CostBasisCalculator.calculateOpenQuantity([])).toBe(0)
    })

    it('should handle only sells (edge case - oversold)', () => {
      const trades = [
        createTrade('sell', 50, 160)
      ]
      // Net: -50 (oversold)
      expect(CostBasisCalculator.calculateOpenQuantity(trades)).toBe(-50)
    })
  })

  describe('calculateFirstBuyPrice', () => {
    it('should return first buy trade price', () => {
      const trades = [
        createTrade('buy', 100, 150),
        createTrade('buy', 50, 155),
        createTrade('sell', 25, 160)
      ]
      // First buy price is 150
      expect(CostBasisCalculator.calculateFirstBuyPrice(trades)).toBe(150)
    })

    it('should return 0 for empty trades', () => {
      expect(CostBasisCalculator.calculateFirstBuyPrice([])).toBe(0)
    })

    it('should return 0 for only sell trades', () => {
      const trades = [
        createTrade('sell', 50, 160)
      ]
      expect(CostBasisCalculator.calculateFirstBuyPrice(trades)).toBe(0)
    })

    it('should ignore sell trades when finding first buy', () => {
      const trades = [
        createTrade('sell', 25, 160), // First trade is a sell
        createTrade('buy', 100, 150)  // First buy is at 150
      ]
      expect(CostBasisCalculator.calculateFirstBuyPrice(trades)).toBe(150)
    })

    it('should handle single buy trade', () => {
      const trades = [
        createTrade('buy', 100, 145.50)
      ]
      expect(CostBasisCalculator.calculateFirstBuyPrice(trades)).toBe(145.50)
    })

    it('should handle null/undefined trades array', () => {
      // @ts-expect-error Testing runtime behavior
      expect(CostBasisCalculator.calculateFirstBuyPrice(null)).toBe(0)
      // @ts-expect-error Testing runtime behavior
      expect(CostBasisCalculator.calculateFirstBuyPrice(undefined)).toBe(0)
    })
  })
})
