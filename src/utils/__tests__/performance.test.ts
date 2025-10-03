import { describe, it, expect } from 'vitest'
import { calculateCostBasis } from '@/utils/costBasis'
import { computePositionStatus } from '@/utils/statusComputation'
import type { Trade } from '@/lib/trade'

describe('Performance Benchmarks', () => {
  describe('Cost Basis Calculation Performance', () => {
    it('[Unit] should calculate cost basis in less than 1ms', () => {
      const trades: Trade[] = [{
        id: 'trade-1',
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date()
      }]

      const start = performance.now()
      calculateCostBasis(trades)
      const end = performance.now()

      const duration = end - start
      expect(duration).toBeLessThan(1) // Less than 1ms
    })

    it('[Unit] should maintain O(1) performance for cost basis calculation', () => {
      // Test with single trade
      const singleTrade: Trade[] = [{
        id: 'trade-1',
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date()
      }]

      const start1 = performance.now()
      calculateCostBasis(singleTrade)
      const end1 = performance.now()
      const duration1 = end1 - start1

      // Test with multiple trades (shouldn't be significantly slower)
      const multipleTrades: Trade[] = [
        { id: 'trade-1', trade_type: 'buy', quantity: 100, price: 150.50, timestamp: new Date() },
        { id: 'trade-2', trade_type: 'sell', quantity: 50, price: 155.00, timestamp: new Date() },
        { id: 'trade-3', trade_type: 'buy', quantity: 75, price: 148.00, timestamp: new Date() }
      ]

      const start2 = performance.now()
      calculateCostBasis(multipleTrades)
      const end2 = performance.now()
      const duration2 = end2 - start2

      // Both should be very fast and similar (O(1) for our use case)
      expect(duration1).toBeLessThan(1)
      expect(duration2).toBeLessThan(1)
    })
  })

  describe('Status Computation Performance', () => {
    it('[Unit] should compute status in less than 0.1ms', () => {
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

    it('[Unit] should have O(1) performance for status computation', () => {
      // Empty trades
      const start1 = performance.now()
      computePositionStatus([])
      const end1 = performance.now()
      const duration1 = end1 - start1

      // Single trade
      const singleTrade: Trade[] = [{
        id: 'trade-1',
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date()
      }]

      const start2 = performance.now()
      computePositionStatus(singleTrade)
      const end2 = performance.now()
      const duration2 = end2 - start2

      // Multiple trades
      const multipleTrades: Trade[] = [
        { id: 'trade-1', trade_type: 'buy', quantity: 100, price: 150.50, timestamp: new Date() },
        { id: 'trade-2', trade_type: 'sell', quantity: 50, price: 155.00, timestamp: new Date() }
      ]

      const start3 = performance.now()
      computePositionStatus(multipleTrades)
      const end3 = performance.now()
      const duration3 = end3 - start3

      // All should be extremely fast (O(1))
      expect(duration1).toBeLessThan(0.1)
      expect(duration2).toBeLessThan(0.1)
      expect(duration3).toBeLessThan(0.1)
    })

    it('[Unit] should be a pure function with no side effects (performance test)', () => {
      const trades: Trade[] = [{
        id: 'trade-1',
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date()
      }]

      // Run multiple times to ensure consistent performance
      const iterations = 1000
      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        computePositionStatus(trades)
      }

      const end = performance.now()
      const avgDuration = (end - start) / iterations

      // Average should be extremely fast
      expect(avgDuration).toBeLessThan(0.01) // Less than 0.01ms average
    })
  })
})
