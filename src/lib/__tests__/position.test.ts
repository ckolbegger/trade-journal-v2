/**
 * Unit Tests: Position Utility Functions
 *
 * Tests utility functions for position calculations.
 */

import { describe, it, expect } from 'vitest'
import type { Trade, StrategyType, TradeKind, OptionAction, PriceBasis } from '@/lib/position'
import { calculateOpenQuantity } from '@/lib/position'

describe('calculateOpenQuantity', () => {
  it('returns 0 for empty trades array', () => {
    expect(calculateOpenQuantity([])).toBe(0)
  })

  it('calculates net quantity for single buy trade', () => {
    const trades: Trade[] = [
      {
        id: 'trade-1',
        position_id: 'pos-1',
        trade_type: 'buy',
        quantity: 100,
        price: 50,
        timestamp: new Date(),
        underlying: 'AAPL'
      }
    ]

    expect(calculateOpenQuantity(trades)).toBe(100)
  })

  it('calculates net quantity for buy and sell trades', () => {
    const trades: Trade[] = [
      {
        id: 'trade-1',
        position_id: 'pos-1',
        trade_type: 'buy',
        quantity: 100,
        price: 50,
        timestamp: new Date('2024-01-01'),
        underlying: 'AAPL'
      },
      {
        id: 'trade-2',
        position_id: 'pos-1',
        trade_type: 'sell',
        quantity: 30,
        price: 55,
        timestamp: new Date('2024-01-02'),
        underlying: 'AAPL'
      }
    ]

    expect(calculateOpenQuantity(trades)).toBe(70)
  })

  it('returns 0 for fully closed position', () => {
    const trades: Trade[] = [
      {
        id: 'trade-1',
        position_id: 'pos-1',
        trade_type: 'buy',
        quantity: 100,
        price: 50,
        timestamp: new Date('2024-01-01'),
        underlying: 'AAPL'
      },
      {
        id: 'trade-2',
        position_id: 'pos-1',
        trade_type: 'sell',
        quantity: 100,
        price: 55,
        timestamp: new Date('2024-01-02'),
        underlying: 'AAPL'
      }
    ]

    expect(calculateOpenQuantity(trades)).toBe(0)
  })
})

describe('Type Definitions', () => {
  describe('StrategyType', () => {
    it('includes "Long Stock"', () => {
      const strategy: StrategyType = 'Long Stock'
      expect(strategy).toBe('Long Stock')
    })

    it('includes "Short Put"', () => {
      const strategy: StrategyType = 'Short Put'
      expect(strategy).toBe('Short Put')
    })
  })

  describe('TradeKind', () => {
    it('includes "stock"', () => {
      const kind: TradeKind = 'stock'
      expect(kind).toBe('stock')
    })

    it('includes "option"', () => {
      const kind: TradeKind = 'option'
      expect(kind).toBe('option')
    })
  })

  describe('OptionAction', () => {
    it('includes "STO"', () => {
      const action: OptionAction = 'STO'
      expect(action).toBe('STO')
    })

    it('includes "BTC"', () => {
      const action: OptionAction = 'BTC'
      expect(action).toBe('BTC')
    })
  })

  describe('PriceBasis', () => {
    it('includes "stock"', () => {
      const basis: PriceBasis = 'stock'
      expect(basis).toBe('stock')
    })

    it('includes "option"', () => {
      const basis: PriceBasis = 'option'
      expect(basis).toBe('option')
    })
  })
})
