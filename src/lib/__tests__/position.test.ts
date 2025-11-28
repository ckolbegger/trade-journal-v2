/**
 * Unit Tests: Position Utility Functions
 *
 * Tests utility functions for position calculations.
 */

import { describe, it, expect } from 'vitest'
import type { Trade } from '@/lib/position'
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
