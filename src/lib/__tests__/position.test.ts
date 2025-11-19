/**
 * Unit Tests: Position Status Computation
 *
 * Tests the derived position status logic that automatically
 * transitions positions between 'planned', 'open', and 'closed' states.
 *
 * Constitutional Principle IV: Test-First Discipline
 * These tests are written FIRST and should FAIL before implementation.
 */

import { describe, it, expect } from 'vitest'
import type { Trade } from '@/lib/position'
import { computePositionStatus } from '@/utils/statusComputation'
import { calculateOpenQuantity } from '@/lib/position'

describe('computePositionStatus', () => {
  describe('planned status', () => {
    it('returns "planned" for empty trades array', () => {
      const trades: Trade[] = []
      expect(computePositionStatus(trades)).toBe('planned')
    })

    it('returns "planned" for null/undefined trades', () => {
      expect(computePositionStatus(null as any)).toBe('planned')
      expect(computePositionStatus(undefined as any)).toBe('planned')
    })
  })

  describe('open status', () => {
    it('returns "open" for position with single buy trade', () => {
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

      expect(computePositionStatus(trades)).toBe('open')
    })

  })

  describe('closed status', () => {
    it('returns "closed" for position with full exit', () => {
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

      expect(computePositionStatus(trades)).toBe('closed')
    })

  })
})

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
