import { describe, it, expect } from 'vitest'
import type { Trade } from '@/lib/trade'

describe('Trade Interface', () => {
  describe('Trade interface validation', () => {
    it('[Unit] should accept a valid trade object with all required fields', () => {
      const trade: Trade = {
        id: 'trade-123',
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date('2024-10-03T10:00:00Z')
      }

      expect(trade.id).toBe('trade-123')
      expect(trade.trade_type).toBe('buy')
      expect(trade.quantity).toBe(100)
      expect(trade.price).toBe(150.50)
      expect(trade.timestamp).toBeInstanceOf(Date)
    })

    it('[Unit] should accept trade_type as "buy"', () => {
      const trade: Trade = {
        id: 'trade-123',
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date()
      }

      expect(trade.trade_type).toBe('buy')
    })

    it('[Unit] should accept trade_type as "sell"', () => {
      const trade: Trade = {
        id: 'trade-123',
        trade_type: 'sell',
        quantity: 100,
        price: 150.50,
        timestamp: new Date()
      }

      expect(trade.trade_type).toBe('sell')
    })

    it('[Unit] should accept optional notes field', () => {
      const trade: Trade = {
        id: 'trade-123',
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date(),
        notes: 'Executed at market open'
      }

      expect(trade.notes).toBe('Executed at market open')
    })

    it('[Unit] should allow trade without notes field', () => {
      const trade: Trade = {
        id: 'trade-123',
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date()
      }

      expect(trade.notes).toBeUndefined()
    })

    it('[Unit] should enforce quantity as number type', () => {
      const trade: Trade = {
        id: 'trade-123',
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date()
      }

      expect(typeof trade.quantity).toBe('number')
    })

    it('[Unit] should enforce price as number type', () => {
      const trade: Trade = {
        id: 'trade-123',
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date()
      }

      expect(typeof trade.price).toBe('number')
    })

    it('[Unit] should enforce timestamp as Date type', () => {
      const trade: Trade = {
        id: 'trade-123',
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date()
      }

      expect(trade.timestamp).toBeInstanceOf(Date)
    })

    it('[Unit] should handle fractional quantities', () => {
      const trade: Trade = {
        id: 'trade-123',
        trade_type: 'buy',
        quantity: 100.5,
        price: 150.50,
        timestamp: new Date()
      }

      expect(trade.quantity).toBe(100.5)
    })

    it('[Unit] should handle fractional prices with 4 decimal precision', () => {
      const trade: Trade = {
        id: 'trade-123',
        trade_type: 'buy',
        quantity: 100,
        price: 150.5678,
        timestamp: new Date()
      }

      expect(trade.price).toBe(150.5678)
    })
  })
})
