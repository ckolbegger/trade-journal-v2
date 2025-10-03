import { describe, it, expect } from 'vitest'
import type { Position } from '@/lib/position'
import type { Trade } from '@/lib/trade'

describe('Position.trades Array Integration', () => {
  describe('Position interface with trades array', () => {
    it('[Unit] should include trades array field in Position interface', () => {
      const position: Position = {
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Strong technical setup',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }

      expect(position.trades).toBeDefined()
      expect(Array.isArray(position.trades)).toBe(true)
    })

    it('[Unit] should initialize trades as empty array for new positions', () => {
      const position: Position = {
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Strong technical setup',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }

      expect(position.trades).toEqual([])
      expect(position.trades.length).toBe(0)
    })

    it('[Unit] should allow single Trade object in array', () => {
      const trade: Trade = {
        id: 'trade-123',
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date()
      }

      const position: Position = {
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Strong technical setup',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: [trade]
      }

      expect(position.trades.length).toBe(1)
      expect(position.trades[0]).toEqual(trade)
    })

    it('[Unit] should allow multiple Trade objects in array (future-proof)', () => {
      const trade1: Trade = {
        id: 'trade-123',
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date('2024-10-03T10:00:00Z')
      }

      const trade2: Trade = {
        id: 'trade-456',
        trade_type: 'sell',
        quantity: 50,
        price: 155.00,
        timestamp: new Date('2024-10-03T14:00:00Z')
      }

      const position: Position = {
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Strong technical setup',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: [trade1, trade2]
      }

      expect(position.trades.length).toBe(2)
      expect(position.trades[0]).toEqual(trade1)
      expect(position.trades[1]).toEqual(trade2)
    })

    it('[Unit] should maintain type safety for array elements', () => {
      const trade: Trade = {
        id: 'trade-123',
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date()
      }

      const position: Position = {
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Strong technical setup',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: [trade]
      }

      const firstTrade = position.trades[0]
      expect(firstTrade.id).toBe('trade-123')
      expect(firstTrade.trade_type).toBe('buy')
      expect(firstTrade.quantity).toBe(100)
      expect(firstTrade.price).toBe(150.50)
      expect(firstTrade.timestamp).toBeInstanceOf(Date)
    })

    it('[Unit] should not mutate other position fields when trades array is modified', () => {
      const position: Position = {
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Strong technical setup',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }

      const originalSymbol = position.symbol
      const originalTargetPrice = position.target_entry_price

      position.trades.push({
        id: 'trade-123',
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date()
      })

      expect(position.symbol).toBe(originalSymbol)
      expect(position.target_entry_price).toBe(originalTargetPrice)
      expect(position.trades.length).toBe(1)
    })
  })

  describe('Backward compatibility', () => {
    it('[Unit] should handle Position objects without trades field', () => {
      // Simulate legacy position from database without trades field
      const legacyPosition: any = {
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Strong technical setup',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: []
        // Note: no trades field
      }

      // Should be able to read legacy position and add trades field
      const position: Position = {
        ...legacyPosition,
        trades: legacyPosition.trades || []
      }

      expect(position.trades).toEqual([])
      expect(position.id).toBe('pos-123')
    })

    it('[Unit] should migrate legacy Position to include empty trades array', () => {
      const legacyPosition: any = {
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Strong technical setup',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: []
      }

      const migratedPosition: Position = {
        ...legacyPosition,
        trades: []
      }

      expect(migratedPosition.trades).toBeDefined()
      expect(Array.isArray(migratedPosition.trades)).toBe(true)
      expect(migratedPosition.trades.length).toBe(0)
    })

    it('[Unit] should preserve all existing Position fields when adding trades', () => {
      const existingPosition: Position = {
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Strong technical setup',
        created_date: new Date('2024-10-01'),
        status: 'planned',
        journal_entry_ids: ['journal-1'],
        trades: []
      }

      expect(existingPosition.id).toBe('pos-123')
      expect(existingPosition.symbol).toBe('AAPL')
      expect(existingPosition.strategy_type).toBe('Long Stock')
      expect(existingPosition.target_entry_price).toBe(150.00)
      expect(existingPosition.target_quantity).toBe(100)
      expect(existingPosition.profit_target).toBe(165.00)
      expect(existingPosition.stop_loss).toBe(145.00)
      expect(existingPosition.position_thesis).toBe('Strong technical setup')
      expect(existingPosition.created_date).toBeInstanceOf(Date)
      expect(existingPosition.status).toBe('planned')
      expect(existingPosition.journal_entry_ids).toEqual(['journal-1'])
      expect(existingPosition.trades).toEqual([])
    })
  })
})
