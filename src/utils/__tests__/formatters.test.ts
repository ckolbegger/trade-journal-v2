import { describe, it, expect } from 'vitest'
import { formatDate, formatCurrency, formatTradeSummary } from '../formatters'
import type { Trade } from '@/lib/position'

describe('formatters', () => {
  describe('formatDate', () => {
    it('should format Date object correctly', () => {
      const date = new Date('2024-03-15T10:30:00Z')
      const result = formatDate(date)
      expect(result).toBe('Mar 15, 2024')
    })

    it('should format another date correctly', () => {
      const date = new Date('2023-12-31T23:59:59Z')
      const result = formatDate(date)
      expect(result).toBe('Dec 31, 2023')
    })

    it('should handle dates at year boundaries', () => {
      const date = new Date('2024-01-01T12:00:00Z')
      const result = formatDate(date)
      expect(result).toBe('Jan 1, 2024')
    })

    it('should format dates consistently', () => {
      const date1 = new Date('2024-06-15')
      const date2 = new Date('2024-06-15')
      expect(formatDate(date1)).toBe(formatDate(date2))
    })
  })

  describe('formatCurrency', () => {
    it('should format positive amounts correctly', () => {
      expect(formatCurrency(150.50)).toBe('$150.50')
    })

    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('should format negative amounts correctly', () => {
      expect(formatCurrency(-25.99)).toBe('-$25.99')
    })

    it('should format large amounts with commas', () => {
      expect(formatCurrency(1234567.89)).toBe('$1,234,567.89')
    })

    it('should format whole numbers with decimals', () => {
      expect(formatCurrency(100)).toBe('$100.00')
    })

    it('should round to 2 decimal places', () => {
      expect(formatCurrency(10.999)).toBe('$11.00')
    })
  })

  describe('formatTradeSummary', () => {
    it('should format buy trade correctly', () => {
      const trade: Trade = {
        id: 'trade-1',
        position_id: 'pos-1',
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date('2024-03-15T12:00:00Z'),
        underlying: 'AAPL'
      }
      expect(formatTradeSummary(trade)).toBe('Buy 100 @ $150.50 on Mar 15, 2024')
    })

    it('should format sell trade correctly', () => {
      const trade: Trade = {
        id: 'trade-2',
        position_id: 'pos-1',
        trade_type: 'sell',
        quantity: 50,
        price: 155.75,
        timestamp: new Date('2024-03-20T14:30:00Z'),
        underlying: 'AAPL'
      }
      expect(formatTradeSummary(trade)).toBe('Sell 50 @ $155.75 on Mar 20, 2024')
    })

    it('should format trade with zero price', () => {
      const trade: Trade = {
        id: 'trade-3',
        position_id: 'pos-1',
        trade_type: 'sell',
        quantity: 100,
        price: 0,
        timestamp: new Date('2024-03-25T10:00:00Z'),
        underlying: 'AAPL'
      }
      expect(formatTradeSummary(trade)).toBe('Sell 100 @ $0.00 on Mar 25, 2024')
    })
  })
})
