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

  describe('Option plan validation (Short Put)', () => {
    const validShortPutPlan: Position = {
      id: 'pos-456',
      symbol: 'AAPL',
      strategy_type: 'Short Put',
      trade_kind: 'option',
      target_entry_price: 150,
      target_quantity: 1,
      profit_target: 165,
      stop_loss: 135,
      position_thesis: 'Bullish on AAPL, selling put for premium',
      created_date: new Date('2024-01-15'),
      status: 'planned',
      journal_entry_ids: [],
      trades: [],
      option_type: 'put',
      strike_price: 145,
      expiration_date: new Date('2099-02-16'), // Future date
      premium_per_contract: 2.50,
      profit_target_basis: 'option',
      stop_loss_basis: 'option'
    }

    it('should accept valid Short Put plan', () => {
      expect(() => PositionValidator.validatePosition(validShortPutPlan)).not.toThrow()
    })

    describe('strike_price validation', () => {
      it('should reject strike_price <= 0', () => {
        const position = { ...validShortPutPlan, strike_price: 0 }
        expect(() => PositionValidator.validatePosition(position))
          .toThrow('strike_price must be positive')
      })

      it('should reject negative strike_price', () => {
        const position = { ...validShortPutPlan, strike_price: -10 }
        expect(() => PositionValidator.validatePosition(position))
          .toThrow('strike_price must be positive')
      })
    })

    describe('expiration_date validation', () => {
      it('should reject past expiration date', () => {
        const pastDate = new Date('2020-01-01')
        const position = { ...validShortPutPlan, expiration_date: pastDate }
        expect(() => PositionValidator.validatePosition(position))
          .toThrow('expiration_date must be in the future')
      })

      it('should accept future expiration date', () => {
        const futureDate = new Date('2099-12-31')
        const position = { ...validShortPutPlan, expiration_date: futureDate }
        expect(() => PositionValidator.validatePosition(position)).not.toThrow()
      })
    })

    describe('premium_per_contract validation', () => {
      it('should reject negative premium', () => {
        const position = { ...validShortPutPlan, premium_per_contract: -1.50 }
        expect(() => PositionValidator.validatePosition(position))
          .toThrow('premium_per_contract must be positive when provided')
      })

      it('should accept zero premium (undefined)', () => {
        const position = { ...validShortPutPlan, premium_per_contract: undefined }
        expect(() => PositionValidator.validatePosition(position)).not.toThrow()
      })

      it('should accept positive premium', () => {
        const position = { ...validShortPutPlan, premium_per_contract: 3.75 }
        expect(() => PositionValidator.validatePosition(position)).not.toThrow()
      })
    })

    describe('required fields for Short Put', () => {
      it('should require option_type for Short Put', () => {
        const position = { ...validShortPutPlan, option_type: undefined }
        expect(() => PositionValidator.validatePosition(position))
          .toThrow('option_type is required for Short Put strategy')
      })

      it('should require strike_price for Short Put', () => {
        const position = { ...validShortPutPlan, strike_price: undefined }
        expect(() => PositionValidator.validatePosition(position))
          .toThrow('strike_price is required for Short Put strategy')
      })

      it('should require expiration_date for Short Put', () => {
        const position = { ...validShortPutPlan, expiration_date: undefined }
        expect(() => PositionValidator.validatePosition(position))
          .toThrow('expiration_date is required for Short Put strategy')
      })

      it('should require profit_target_basis for Short Put', () => {
        const position = { ...validShortPutPlan, profit_target_basis: undefined }
        expect(() => PositionValidator.validatePosition(position))
          .toThrow('profit_target_basis is required for Short Put strategy')
      })

      it('should require stop_loss_basis for Short Put', () => {
        const position = { ...validShortPutPlan, stop_loss_basis: undefined }
        expect(() => PositionValidator.validatePosition(position))
          .toThrow('stop_loss_basis is required for Short Put strategy')
      })
    })

    describe('Long Stock should not require option fields', () => {
      it('should accept Long Stock without option fields', () => {
        const longStockPosition = {
          ...validPosition,
          option_type: undefined,
          strike_price: undefined,
          expiration_date: undefined,
          premium_per_contract: undefined,
          profit_target_basis: undefined,
          stop_loss_basis: undefined
        }
        expect(() => PositionValidator.validatePosition(longStockPosition)).not.toThrow()
      })
    })
  })
})
