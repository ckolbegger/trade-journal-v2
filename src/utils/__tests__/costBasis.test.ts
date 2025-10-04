import { describe, it, expect } from 'vitest'
import { calculateCostBasis } from '@/utils/costBasis'
import type { Trade } from '@/lib/trade'

describe('Cost Basis Calculation', () => {
  it('[Unit] should return cost basis equal to first buy trade price', () => {
    const trades: Trade[] = [{
      id: 'trade-1',
      trade_type: 'buy',
      quantity: 100,
      price: 150.50,
      timestamp: new Date('2024-10-03T10:00:00Z')
    }]

    const costBasis = calculateCostBasis(trades)
    expect(costBasis).toBe(150.50)
  })

  it('[Unit] should return zero cost basis for empty trades array', () => {
    const trades: Trade[] = []

    const costBasis = calculateCostBasis(trades)
    expect(costBasis).toBe(0)
  })

  it('[Unit] should ignore sell trades in cost basis calculation', () => {
    const trades: Trade[] = [{
      id: 'trade-1',
      trade_type: 'sell',
      quantity: 50,
      price: 155.00,
      timestamp: new Date('2024-10-03T10:00:00Z')
    }]

    const costBasis = calculateCostBasis(trades)
    expect(costBasis).toBe(0)
  })

  it('[Unit] should calculate from first buy trade only when multiple trades exist', () => {
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

    const costBasis = calculateCostBasis(trades)
    expect(costBasis).toBe(150.50)
  })

  it('[Unit] should handle fractional quantities', () => {
    const trades: Trade[] = [{
      id: 'trade-1',
      trade_type: 'buy',
      quantity: 100.5,
      price: 150.50,
      timestamp: new Date('2024-10-03T10:00:00Z')
    }]

    const costBasis = calculateCostBasis(trades)
    expect(costBasis).toBe(150.50)
  })

  it('[Unit] should handle very large prices', () => {
    const trades: Trade[] = [{
      id: 'trade-1',
      trade_type: 'buy',
      quantity: 10,
      price: 999999.99,
      timestamp: new Date('2024-10-03T10:00:00Z')
    }]

    const costBasis = calculateCostBasis(trades)
    expect(costBasis).toBe(999999.99)
  })

  it('[Unit] should handle very small prices', () => {
    const trades: Trade[] = [{
      id: 'trade-1',
      trade_type: 'buy',
      quantity: 1000,
      price: 0.0001,
      timestamp: new Date('2024-10-03T10:00:00Z')
    }]

    const costBasis = calculateCostBasis(trades)
    expect(costBasis).toBe(0.0001)
  })

  it('[Unit] should be a pure function with consistent calculation', () => {
    const trades: Trade[] = [{
      id: 'trade-1',
      trade_type: 'buy',
      quantity: 100,
      price: 150.50,
      timestamp: new Date('2024-10-03T10:00:00Z')
    }]

    const result1 = calculateCostBasis(trades)
    const result2 = calculateCostBasis(trades)

    expect(result1).toBe(result2)
    expect(result1).toBe(150.50)
  })
})
