import { describe, it, expect } from 'vitest'
import { PositionValidator } from '../validators/PositionValidator'
import type { Position } from '@/lib/position'

describe('PositionValidator', () => {
  const validPosition: Position = {
    id: 'pos-123',
    symbol: 'AAPL',
    strategy_type: 'Long Stock',
    trade_kind: 'stock',
    target_entry_price: 150,
    target_quantity: 100,
    profit_target: 165,
    stop_loss: 135,
    profit_target_basis: 'stock_price',
    stop_loss_basis: 'stock_price',
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

  describe('profit_target validation', () => {
    it('should reject zero profit_target', () => {
      const position = { ...validPosition, profit_target: 0 }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('profit_target must be positive')
    })

    it('should reject negative profit_target', () => {
      const position = { ...validPosition, profit_target: -10 }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('profit_target must be positive')
    })
  })

  describe('stop_loss validation', () => {
    it('should reject zero stop_loss', () => {
      const position = { ...validPosition, stop_loss: 0 }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('stop_loss must be positive')
    })

    it('should reject negative stop_loss', () => {
      const position = { ...validPosition, stop_loss: -10 }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('stop_loss must be positive')
    })
  })

  describe('strategy and trade_kind validation', () => {
    it('should require option trade_kind for Short Put strategy', () => {
      const position = {
        ...validPosition,
        strategy_type: 'Short Put',
        trade_kind: 'stock'
      }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('trade_kind must be option for Short Put strategy')
    })

    it('should reject missing trade_kind for Short Put strategy', () => {
      const position = {
        ...validPosition,
        strategy_type: 'Short Put',
        trade_kind: undefined as any
      }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('trade_kind must be option for Short Put strategy')
    })

    it('should reject option trade_kind for Long Stock strategy', () => {
      const position = {
        ...validPosition,
        trade_kind: 'option'
      }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('trade_kind must be stock for Long Stock strategy')
    })
  })

  describe('basis validation', () => {
    it('should require profit_target_basis for option plans', () => {
      const position = {
        ...validPosition,
        strategy_type: 'Short Put',
        trade_kind: 'option',
        profit_target_basis: undefined as any
      }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('profit_target_basis is required for option positions')
    })

    it('should require stop_loss_basis for option plans', () => {
      const position = {
        ...validPosition,
        strategy_type: 'Short Put',
        trade_kind: 'option',
        stop_loss_basis: undefined as any
      }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('stop_loss_basis is required for option positions')
    })

    it('should reject invalid profit_target_basis values', () => {
      const position = {
        ...validPosition,
        profit_target_basis: 'invalid' as any
      }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('profit_target_basis must be stock_price or option_price')
    })

    it('should reject invalid stop_loss_basis values', () => {
      const position = {
        ...validPosition,
        stop_loss_basis: 'invalid' as any
      }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('stop_loss_basis must be stock_price or option_price')
    })
  })

  describe('option plan field validation', () => {
    const shortPutBase = {
      ...validPosition,
      strategy_type: 'Short Put' as const,
      trade_kind: 'option' as const,
      profit_target_basis: 'option_price' as const,
      stop_loss_basis: 'stock_price' as const,
      option_type: 'put' as const,
      strike_price: 100,
      expiration_date: new Date('2099-01-17'),
      premium_per_contract: 2.5
    }

    it('should require option_type for option positions', () => {
      const position = { ...shortPutBase, option_type: undefined as any }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('option_type is required for option positions')
    })

    it('should require strike_price for option positions', () => {
      const position = { ...shortPutBase, strike_price: undefined as any }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('strike_price is required for option positions')
    })

    it('should reject non-positive strike_price values', () => {
      const position = { ...shortPutBase, strike_price: 0 }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('strike_price must be positive')
    })

    it('should require expiration_date for option positions', () => {
      const position = { ...shortPutBase, expiration_date: undefined as any }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('expiration_date is required for option positions')
    })

    it('should reject expiration_date in the past', () => {
      const position = { ...shortPutBase, expiration_date: new Date('2000-01-01') }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('expiration_date cannot be in the past')
    })

    it('should require premium_per_contract for option positions', () => {
      const position = { ...shortPutBase, premium_per_contract: undefined as any }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('premium_per_contract is required for option positions')
    })

    it('should reject non-positive premium_per_contract values', () => {
      const position = { ...shortPutBase, premium_per_contract: 0 }
      expect(() => PositionValidator.validatePosition(position))
        .toThrow('premium_per_contract must be positive')
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
