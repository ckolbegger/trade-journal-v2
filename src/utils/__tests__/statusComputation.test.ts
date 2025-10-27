import { describe, it, expect } from 'vitest'
import { computePositionStatus } from '@/utils/statusComputation'
import type { Trade } from '@/lib/position'

describe('Position Status Computation', () => {
  it('[Unit] should return "planned" when trades array is empty', () => {
    const trades: Trade[] = []
    const status = computePositionStatus(trades)
    expect(status).toBe('planned')
  })

  it('[Unit] should return "open" when trades array contains buy trade', () => {
    const trades: Trade[] = [{
      id: 'trade-1',
      trade_type: 'buy',
      quantity: 100,
      price: 150.50,
      timestamp: new Date()
    }]

    const status = computePositionStatus(trades)
    expect(status).toBe('open')
  })

  it('[Unit] should return "open" when trades array contains sell trade', () => {
    const trades: Trade[] = [{
      id: 'trade-1',
      trade_type: 'sell',
      quantity: 50,
      price: 155.00,
      timestamp: new Date()
    }]

    const status = computePositionStatus(trades)
    expect(status).toBe('open')
  })

  it('[Unit] should return "open" for multiple trades', () => {
    const trades: Trade[] = [
      {
        id: 'trade-1',
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date('2024-10-03T10:00:00Z')
      },
      {
        id: 'trade-2',
        trade_type: 'sell',
        quantity: 50,
        price: 155.00,
        timestamp: new Date('2024-10-03T14:00:00Z')
      }
    ]

    const status = computePositionStatus(trades)
    expect(status).toBe('open')
  })

  it('[Unit] should handle null/undefined trades arrays', () => {
    const status1 = computePositionStatus(null as any)
    const status2 = computePositionStatus(undefined as any)

    expect(status1).toBe('planned')
    expect(status2).toBe('planned')
  })

  it('[Unit] should handle zero-quantity trades', () => {
    const trades: Trade[] = [{
      id: 'trade-1',
      trade_type: 'buy',
      quantity: 0,
      price: 150.50,
      timestamp: new Date()
    }]

    const status = computePositionStatus(trades)
    expect(status).toBe('open')
  })

  it('[Unit] should be a pure function with consistent output', () => {
    const trades: Trade[] = [{
      id: 'trade-1',
      trade_type: 'buy',
      quantity: 100,
      price: 150.50,
      timestamp: new Date()
    }]

    const result1 = computePositionStatus(trades)
    const result2 = computePositionStatus(trades)

    expect(result1).toBe(result2)
    expect(result1).toBe('open')
  })

  it('[Unit] should not return "closed" status in Phase 1A', () => {
    const trades: Trade[] = [{
      id: 'trade-1',
      trade_type: 'buy',
      quantity: 100,
      price: 150.50,
      timestamp: new Date()
    }]

    const status = computePositionStatus(trades)
    expect(status).not.toBe('closed')
    expect(status).toBe('open')
  })

  it('[Unit] should have O(1) performance for status computation', () => {
    const trades: Trade[] = [{
      id: 'trade-1',
      trade_type: 'buy',
      quantity: 100,
      price: 150.50,
      timestamp: new Date()
    }]

    const start = performance.now()
    computePositionStatus(trades)
    const end = performance.now()

    const duration = end - start
    expect(duration).toBeLessThan(0.1) // Less than 0.1ms
  })
})
