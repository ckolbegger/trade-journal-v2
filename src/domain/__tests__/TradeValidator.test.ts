import { describe, it, expect } from 'vitest'
import { TradeValidator } from '../validators/TradeValidator'
import type { Trade, Position } from '@/lib/position'

describe('TradeValidator', () => {
  describe('validateTrade', () => {
    const validTrade: Omit<Trade, 'id'> = {
      position_id: 'pos-123',
      trade_type: 'buy',
      quantity: 100,
      price: 150.50,
      timestamp: new Date('2024-01-15T10:30:00'),
      underlying: 'AAPL',
      notes: 'Test trade'
    }

    it('should pass for valid trade', () => {
      expect(() => TradeValidator.validateTrade(validTrade)).not.toThrow()
    })

    it('should reject missing position_id', () => {
      const trade = { ...validTrade, position_id: '' }
      expect(() => TradeValidator.validateTrade(trade))
        .toThrow('Missing required fields')
    })

    it('should reject missing trade_type', () => {
      const trade = { ...validTrade, trade_type: '' as any }
      expect(() => TradeValidator.validateTrade(trade))
        .toThrow('Missing required fields')
    })

    it('should reject invalid trade_type', () => {
      const trade = { ...validTrade, trade_type: 'invalid' as any }
      expect(() => TradeValidator.validateTrade(trade))
        .toThrow('Invalid trade type')
    })

    it('should reject zero quantity', () => {
      const trade = { ...validTrade, quantity: 0 }
      expect(() => TradeValidator.validateTrade(trade))
        .toThrow('Quantity must be positive')
    })

    it('should reject negative quantity', () => {
      const trade = { ...validTrade, quantity: -10 }
      expect(() => TradeValidator.validateTrade(trade))
        .toThrow('Quantity must be positive')
    })

    it('should reject negative price', () => {
      const trade = { ...validTrade, price: -5 }
      expect(() => TradeValidator.validateTrade(trade))
        .toThrow('Price must be >= 0')
    })

    it('should allow zero price for worthless exits', () => {
      const trade = { ...validTrade, price: 0, trade_type: 'sell' as const }
      // Zero price is allowed for sell trades (worthless exits)
      expect(() => TradeValidator.validateTrade(trade)).not.toThrow()
    })

    it('should reject invalid timestamp', () => {
      const trade = { ...validTrade, timestamp: new Date('invalid') }
      expect(() => TradeValidator.validateTrade(trade))
        .toThrow('Invalid timestamp')
    })

    it('should reject empty underlying', () => {
      const trade = { ...validTrade, underlying: '   ' }
      expect(() => TradeValidator.validateTrade(trade))
        .toThrow('underlying cannot be empty')
    })
  })

  describe('validateExitTrade', () => {
    const basePosition: Position = {
      id: 'pos-123',
      symbol: 'AAPL',
      strategy_type: 'long_stock',
      status: 'open',
      target_entry_price: 150,
      target_quantity: 100,
      stop_loss: 145,
      take_profit: 160,
      thesis: 'Test thesis',
      plan_date: new Date('2024-01-15'),
      trades: [
        {
          id: 'trade-1',
          position_id: 'pos-123',
          trade_type: 'buy',
          quantity: 100,
          price: 150.50,
          timestamp: new Date('2024-01-15T10:30:00'),
          underlying: 'AAPL'
        }
      ]
    }

    it('should reject exit from planned position', () => {
      const plannedPosition: Position = {
        ...basePosition,
        status: 'planned',
        trades: []
      }
      expect(() => TradeValidator.validateExitTrade(plannedPosition, 50, 155))
        .toThrow('Cannot exit from planned position')
    })

    it('should reject exit from closed position', () => {
      const closedPosition: Position = {
        ...basePosition,
        status: 'closed'
      }
      expect(() => TradeValidator.validateExitTrade(closedPosition, 50, 155))
        .toThrow('Cannot exit from closed position')
    })

    it('should reject overselling', () => {
      // Position has 100 shares, trying to sell 150
      expect(() => TradeValidator.validateExitTrade(basePosition, 150, 155))
        .toThrow('Cannot sell more than current position')
    })

    it('should allow valid exit', () => {
      // Position has 100 shares, selling 50 is valid
      expect(() => TradeValidator.validateExitTrade(basePosition, 50, 155))
        .not.toThrow()
    })
  })
})
