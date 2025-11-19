/**
 * Unit Tests: FIFO Cost Basis Calculation
 *
 * Tests the First-In-First-Out algorithm for matching exit trades
 * to entry trades and calculating realized/unrealized P&L.
 *
 * Constitutional Principle IV: Test-First Discipline
 * These tests are written FIRST and should FAIL before implementation.
 */

import { describe, it, expect } from 'vitest'
import type { Trade } from '@/lib/position'
import { processFIFO } from '@/lib/utils/fifo'

describe('FIFO Cost Basis Calculation', () => {
  describe('Full Position Exit', () => {
    it('calculates P&L for single entry and exit', () => {
      const trades: Trade[] = [
        {
          id: 'trade-1',
          position_id: 'pos-1',
          trade_type: 'buy',
          quantity: 100,
          price: 50,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          underlying: 'AAPL'
        },
        {
          id: 'trade-2',
          position_id: 'pos-1',
          trade_type: 'sell',
          quantity: 100,
          price: 55,
          timestamp: new Date('2024-01-02T10:00:00Z'),
          underlying: 'AAPL'
        }
      ]

      const result = processFIFO(trades, 55)

      expect(result.realizedPnL).toBe(500) // (55-50)*100
      expect(result.unrealizedPnL).toBe(0)
      expect(result.totalPnL).toBe(500)
      expect(result.openQuantity).toBe(0)
      expect(result.avgOpenCost).toBe(0)
      expect(result.isFullyClosed).toBe(true)
    })

  })


  describe('Multiple Entry Trades', () => {
    it('calculates P&L with multiple entries and full exit', () => {
      const trades: Trade[] = [
        {
          id: 'trade-1',
          position_id: 'pos-1',
          trade_type: 'buy',
          quantity: 50,
          price: 100,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          underlying: 'AAPL'
        },
        {
          id: 'trade-2',
          position_id: 'pos-1',
          trade_type: 'buy',
          quantity: 30,
          price: 105,
          timestamp: new Date('2024-01-02T10:00:00Z'),
          underlying: 'AAPL'
        },
        {
          id: 'trade-3',
          position_id: 'pos-1',
          trade_type: 'buy',
          quantity: 20,
          price: 110,
          timestamp: new Date('2024-01-03T10:00:00Z'),
          underlying: 'AAPL'
        },
        {
          id: 'trade-4',
          position_id: 'pos-1',
          trade_type: 'sell',
          quantity: 100,
          price: 120,
          timestamp: new Date('2024-01-04T10:00:00Z'),
          underlying: 'AAPL'
        }
      ]

      const result = processFIFO(trades, 120)

      // FIFO matching: sell matches oldest entries first
      // 50 @ $100 → profit: (120-100)*50 = $1000
      // 30 @ $105 → profit: (120-105)*30 = $450
      // 20 @ $110 → profit: (120-110)*20 = $200
      // Total: $1650
      expect(result.realizedPnL).toBe(1650)
      expect(result.openQuantity).toBe(0)
      expect(result.isFullyClosed).toBe(true)
    })

    it('calculates correct weighted average for remaining shares after partial exit', () => {
      const trades: Trade[] = [
        {
          id: 'trade-1',
          position_id: 'pos-1',
          trade_type: 'buy',
          quantity: 50,
          price: 100,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          underlying: 'AAPL'
        },
        {
          id: 'trade-2',
          position_id: 'pos-1',
          trade_type: 'buy',
          quantity: 50,
          price: 110,
          timestamp: new Date('2024-01-02T10:00:00Z'),
          underlying: 'AAPL'
        },
        {
          id: 'trade-3',
          position_id: 'pos-1',
          trade_type: 'sell',
          quantity: 50,
          price: 120,
          timestamp: new Date('2024-01-03T10:00:00Z'),
          underlying: 'AAPL'
        }
      ]

      const result = processFIFO(trades, 120)

      // Sold oldest 50@$100, remaining 50@$110
      expect(result.realizedPnL).toBe(1000) // (120-100)*50
      expect(result.openQuantity).toBe(50)
      expect(result.avgOpenCost).toBe(110)
      expect(result.unrealizedPnL).toBe(500) // (120-110)*50
      expect(result.isFullyClosed).toBe(false)
    })
  })

  describe('Multiple Exit Trades', () => {
    it('calculates P&L with single entry and multiple exits', () => {
      const trades: Trade[] = [
        {
          id: 'trade-1',
          position_id: 'pos-1',
          trade_type: 'buy',
          quantity: 100,
          price: 100,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          underlying: 'AAPL'
        },
        {
          id: 'trade-2',
          position_id: 'pos-1',
          trade_type: 'sell',
          quantity: 40,
          price: 110,
          timestamp: new Date('2024-01-02T10:00:00Z'),
          underlying: 'AAPL'
        },
        {
          id: 'trade-3',
          position_id: 'pos-1',
          trade_type: 'sell',
          quantity: 30,
          price: 115,
          timestamp: new Date('2024-01-03T10:00:00Z'),
          underlying: 'AAPL'
        },
        {
          id: 'trade-4',
          position_id: 'pos-1',
          trade_type: 'sell',
          quantity: 30,
          price: 120,
          timestamp: new Date('2024-01-04T10:00:00Z'),
          underlying: 'AAPL'
        }
      ]

      const result = processFIFO(trades, 120)

      // All exits from same entry @$100:
      // 40 @ $110 → profit: (110-100)*40 = $400
      // 30 @ $115 → profit: (115-100)*30 = $450
      // 30 @ $120 → profit: (120-100)*30 = $600
      // Total: $1450
      expect(result.realizedPnL).toBe(1450)
      expect(result.openQuantity).toBe(0)
      expect(result.isFullyClosed).toBe(true)
    })

    it('handles multiple partial exits leaving open position', () => {
      const trades: Trade[] = [
        {
          id: 'trade-1',
          position_id: 'pos-1',
          trade_type: 'buy',
          quantity: 100,
          price: 100,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          underlying: 'AAPL'
        },
        {
          id: 'trade-2',
          position_id: 'pos-1',
          trade_type: 'sell',
          quantity: 25,
          price: 110,
          timestamp: new Date('2024-01-02T10:00:00Z'),
          underlying: 'AAPL'
        },
        {
          id: 'trade-3',
          position_id: 'pos-1',
          trade_type: 'sell',
          quantity: 25,
          price: 115,
          timestamp: new Date('2024-01-03T10:00:00Z'),
          underlying: 'AAPL'
        }
      ]

      const currentPrice = 120
      const result = processFIFO(trades, currentPrice)

      // Sold 50 total, remaining 50 @ $100
      expect(result.realizedPnL).toBe(625) // (110-100)*25 + (115-100)*25
      expect(result.openQuantity).toBe(50)
      expect(result.avgOpenCost).toBe(100)
      expect(result.unrealizedPnL).toBe(1000) // (120-100)*50
      expect(result.totalPnL).toBe(1625)
      expect(result.isFullyClosed).toBe(false)
    })
  })

  describe('Mixed Entry/Exit Sequences', () => {
    it('handles alternating buy/sell trades (scaling in and out)', () => {
      const trades: Trade[] = [
        {
          id: 'trade-1',
          position_id: 'pos-1',
          trade_type: 'buy',
          quantity: 50,
          price: 100,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          underlying: 'AAPL'
        },
        {
          id: 'trade-2',
          position_id: 'pos-1',
          trade_type: 'buy',
          quantity: 50,
          price: 105,
          timestamp: new Date('2024-01-02T10:00:00Z'),
          underlying: 'AAPL'
        },
        {
          id: 'trade-3',
          position_id: 'pos-1',
          trade_type: 'sell',
          quantity: 30,
          price: 110,
          timestamp: new Date('2024-01-03T10:00:00Z'),
          underlying: 'AAPL'
        },
        {
          id: 'trade-4',
          position_id: 'pos-1',
          trade_type: 'buy',
          quantity: 20,
          price: 108,
          timestamp: new Date('2024-01-04T10:00:00Z'),
          underlying: 'AAPL'
        },
        {
          id: 'trade-5',
          position_id: 'pos-1',
          trade_type: 'sell',
          quantity: 90,
          price: 115,
          timestamp: new Date('2024-01-05T10:00:00Z'),
          underlying: 'AAPL'
        }
      ]

      const result = processFIFO(trades, 115)

      // First sell (30 shares):
      // - Matches oldest 30 @ $100 → profit: (110-100)*30 = $300
      // Second sell (90 shares):
      // - Matches remaining 20 @ $100 → profit: (115-100)*20 = $300
      // - Matches 50 @ $105 → profit: (115-105)*50 = $500
      // - Matches 20 @ $108 → profit: (115-108)*20 = $140
      // Total: $1240
      expect(result.realizedPnL).toBe(1240)
      expect(result.openQuantity).toBe(0)
      expect(result.isFullyClosed).toBe(true)
    })

    it('maintains correct cost basis through complex trade sequence', () => {
      const trades: Trade[] = [
        {
          id: 'trade-1',
          position_id: 'pos-1',
          trade_type: 'buy',
          quantity: 100,
          price: 50,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          underlying: 'TSLA'
        },
        {
          id: 'trade-2',
          position_id: 'pos-1',
          trade_type: 'sell',
          quantity: 50,
          price: 55,
          timestamp: new Date('2024-01-02T10:00:00Z'),
          underlying: 'TSLA'
        },
        {
          id: 'trade-3',
          position_id: 'pos-1',
          trade_type: 'buy',
          quantity: 100,
          price: 60,
          timestamp: new Date('2024-01-03T10:00:00Z'),
          underlying: 'TSLA'
        },
        {
          id: 'trade-4',
          position_id: 'pos-1',
          trade_type: 'sell',
          quantity: 75,
          price: 65,
          timestamp: new Date('2024-01-04T10:00:00Z'),
          underlying: 'TSLA'
        }
      ]

      const currentPrice = 65
      const result = processFIFO(trades, currentPrice)

      // First sell (50 shares):
      // - Matches 50 @ $50 → profit: (55-50)*50 = $250
      // Second sell (75 shares):
      // - Matches remaining 50 @ $50 → profit: (65-50)*50 = $750
      // - Matches 25 @ $60 → profit: (65-60)*25 = $125
      // Total realized: $1125
      expect(result.realizedPnL).toBe(1125)

      // Remaining: 75 @ $60
      expect(result.openQuantity).toBe(75)
      expect(result.avgOpenCost).toBe(60)
      expect(result.unrealizedPnL).toBe(375) // (65-60)*75
      expect(result.totalPnL).toBe(1500)
      expect(result.isFullyClosed).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('handles empty trades array', () => {
      const trades: Trade[] = []
      const result = processFIFO(trades, 100)

      expect(result.realizedPnL).toBe(0)
      expect(result.unrealizedPnL).toBe(0)
      expect(result.totalPnL).toBe(0)
      expect(result.openQuantity).toBe(0)
      expect(result.isFullyClosed).toBe(true)
    })

    it('handles zero exit price (expired worthless)', () => {
      const trades: Trade[] = [
        {
          id: 'trade-1',
          position_id: 'pos-1',
          trade_type: 'buy',
          quantity: 100,
          price: 50,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          underlying: 'OPT'
        },
        {
          id: 'trade-2',
          position_id: 'pos-1',
          trade_type: 'sell',
          quantity: 100,
          price: 0,
          timestamp: new Date('2024-01-02T10:00:00Z'),
          underlying: 'OPT'
        }
      ]

      const result = processFIFO(trades, 0)

      expect(result.realizedPnL).toBe(-5000) // (0-50)*100
      expect(result.openQuantity).toBe(0)
      expect(result.isFullyClosed).toBe(true)
    })

    it('handles weighted average cost correctly', () => {
      const trades: Trade[] = [
        {
          id: 'trade-1',
          position_id: 'pos-1',
          trade_type: 'buy',
          quantity: 50,
          price: 100,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          underlying: 'AAPL'
        },
        {
          id: 'trade-2',
          position_id: 'pos-1',
          trade_type: 'buy',
          quantity: 50,
          price: 110,
          timestamp: new Date('2024-01-02T10:00:00Z'),
          underlying: 'AAPL'
        },
        {
          id: 'trade-3',
          position_id: 'pos-1',
          trade_type: 'sell',
          quantity: 50,
          price: 120,
          timestamp: new Date('2024-01-03T10:00:00Z'),
          underlying: 'AAPL'
        }
      ]

      const currentPrice = 120
      const result = processFIFO(trades, currentPrice)

      // Sold oldest 50@$100, remaining 50@$110
      expect(result.openQuantity).toBe(50)
      expect(result.avgOpenCost).toBe(110)
      expect(result.unrealizedPnL).toBe(500) // (120-110)*50
    })
  })
})
