import { describe, it, expect } from 'vitest'
import { PositionStatusComputer } from '../calculators/PositionStatusComputer'
import type { Trade } from '@/lib/position'

describe('PositionStatusComputer', () => {
  const createTrade = (type: 'buy' | 'sell', quantity: number, price: number): Trade => ({
    id: `trade-${Math.random()}`,
    position_id: 'pos-123',
    trade_type: type,
    quantity,
    price,
    timestamp: new Date(),
    underlying: 'AAPL'
  })

  describe('computeStatus', () => {
    it('should return "planned" for no trades', () => {
      expect(PositionStatusComputer.computeStatus([])).toBe('planned')
    })

    it('should return "open" for net positive quantity', () => {
      const trades = [
        createTrade('buy', 100, 150)
      ]
      expect(PositionStatusComputer.computeStatus(trades)).toBe('open')
    })

    it('should return "closed" for net zero quantity', () => {
      const trades = [
        createTrade('buy', 100, 150),
        createTrade('sell', 100, 160)
      ]
      expect(PositionStatusComputer.computeStatus(trades)).toBe('closed')
    })

    it('should handle multiple buys', () => {
      const trades = [
        createTrade('buy', 100, 150),
        createTrade('buy', 50, 155),
        createTrade('buy', 25, 160)
      ]
      // Net quantity = 175 (all buys)
      expect(PositionStatusComputer.computeStatus(trades)).toBe('open')
    })

    it('should handle multiple sells', () => {
      const trades = [
        createTrade('buy', 100, 150),
        createTrade('sell', 25, 160),
        createTrade('sell', 25, 158),
        createTrade('sell', 25, 155)
      ]
      // Net quantity = 100 - 75 = 25 (still open)
      expect(PositionStatusComputer.computeStatus(trades)).toBe('open')
    })

    it('should handle mixed buy/sell trades', () => {
      const trades = [
        createTrade('buy', 100, 150),
        createTrade('sell', 50, 160),
        createTrade('buy', 50, 155),
        createTrade('sell', 100, 165)
      ]
      // Net quantity = (100 + 50) - (50 + 100) = 0 (closed)
      expect(PositionStatusComputer.computeStatus(trades)).toBe('closed')
    })

    it('should handle null/undefined trades array gracefully', () => {
      // @ts-expect-error Testing runtime behavior
      expect(PositionStatusComputer.computeStatus(null)).toBe('planned')
      // @ts-expect-error Testing runtime behavior
      expect(PositionStatusComputer.computeStatus(undefined)).toBe('planned')
    })

    it('should handle partial position closure', () => {
      const trades = [
        createTrade('buy', 100, 150),
        createTrade('sell', 60, 160)
      ]
      // Net quantity = 40 (still open)
      expect(PositionStatusComputer.computeStatus(trades)).toBe('open')
    })

    it('should handle complete position closure with multiple trades', () => {
      const trades = [
        createTrade('buy', 50, 150),
        createTrade('buy', 50, 155),
        createTrade('sell', 100, 160)
      ]
      // Net quantity = (50 + 50) - 100 = 0 (closed)
      expect(PositionStatusComputer.computeStatus(trades)).toBe('closed')
    })
  })
})
