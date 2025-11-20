import { describe, it, expect } from 'vitest'
import { PositionValidator } from '../validators/PositionValidator'
import type { Position } from '@/lib/position'

describe('PositionValidator', () => {
  const validPosition: Position = {
    id: 'pos-123',
    symbol: 'AAPL',
    strategy_type: 'Long Stock',
    target_entry_price: 150,
    target_quantity: 100,
    profit_target: 165,
    stop_loss: 135,
    position_thesis: 'Strong earnings expected',
    created_date: new Date('2024-01-15'),
    status: 'planned',
    journal_entry_ids: [],
    trades: []
  }

  it('should pass for valid position', () => {
    expect(() => PositionValidator.validatePosition(validPosition)).not.toThrow()
  })

  describe('target_entry_price validation', () => {
    it('should reject zero target_entry_price', () => {
      const position = { ...validPosition, target_entry_price: 0 }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('target_entry_price must be positive')
    })

    it('should reject negative target_entry_price', () => {
      const position = { ...validPosition, target_entry_price: -10 }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('target_entry_price must be positive')
    })
  })

  describe('target_quantity validation', () => {
    it('should reject zero target_quantity', () => {
      const position = { ...validPosition, target_quantity: 0 }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('target_quantity must be positive')
    })

    it('should reject negative target_quantity', () => {
      const position = { ...validPosition, target_quantity: -5 }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('target_quantity must be positive')
    })
  })

  describe('position_thesis validation', () => {
    it('should reject empty position_thesis', () => {
      const position = { ...validPosition, position_thesis: '   ' }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('position_thesis cannot be empty')
    })

    it('should reject empty string position_thesis', () => {
      const position = { ...validPosition, position_thesis: '' }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('position_thesis cannot be empty')
    })
  })

  describe('required fields validation', () => {
    it('should reject missing id', () => {
      const position = { ...validPosition, id: '' }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('Invalid position data')
    })

    it('should reject missing symbol', () => {
      const position = { ...validPosition, symbol: '' }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('Invalid position data')
    })

    it('should reject missing strategy_type', () => {
      const position = { ...validPosition, strategy_type: '' as any }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('Invalid position data')
    })

    it('should reject undefined target_entry_price', () => {
      const position = { ...validPosition, target_entry_price: undefined as any }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('Invalid position data')
    })

    it('should reject undefined target_quantity', () => {
      const position = { ...validPosition, target_quantity: undefined as any }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('Invalid position data')
    })
  })

  describe('journal_entry_ids type validation', () => {
    it('should reject non-array journal_entry_ids', () => {
      const position = { ...validPosition, journal_entry_ids: 'not-an-array' as any }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('journal_entry_ids must be an array')
    })

    it('should accept undefined journal_entry_ids (backward compatibility)', () => {
      const position = { ...validPosition, journal_entry_ids: undefined as any }
      expect(() => PositionValidator.validatePosition(position)).not.toThrow()
    })
  })

  describe('trades type validation', () => {
    it('should reject non-array trades', () => {
      const position = { ...validPosition, trades: 'not-an-array' as any }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('trades must be an array')
    })

    it('should accept undefined trades (backward compatibility)', () => {
      const position = { ...validPosition, trades: undefined as any }
      expect(() => PositionValidator.validatePosition(position)).not.toThrow()
    })
  })
})
