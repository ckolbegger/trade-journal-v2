/**
 * Unit Tests: Inline Validators for Position Creation
 *
 * Tests validation functions for Short Put position creation fields.
 */

import { describe, it, expect } from 'vitest'
import {
  validateSymbol,
  validateExpirationDate,
  validateStrikePrice,
  validateQuantity,
  validateOptionPosition
} from '@/lib/validators'
import type { Position } from '@/lib/position'

describe('validateSymbol', () => {
  it('returns valid for single uppercase letter', () => {
    const result = validateSymbol('A')
    expect(result.isValid).toBe(true)
  })

  it('returns valid for 5-letter ticker', () => {
    const result = validateSymbol('GOOGL')
    expect(result.isValid).toBe(true)
  })

  it('returns valid for lowercase input (normalizes to uppercase)', () => {
    const result = validateSymbol('aapl')
    expect(result.isValid).toBe(true)
  })

  it('returns error for empty string', () => {
    const result = validateSymbol('')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Symbol is required')
  })

  it('returns error for whitespace only', () => {
    const result = validateSymbol('   ')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Symbol is required')
  })

  it('returns error for symbol too long', () => {
    const result = validateSymbol('AAPLSTOCK')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Symbol must be 1-5 characters')
  })

  it('returns error for symbols with numbers', () => {
    const result = validateSymbol('AAPL123')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Symbol must contain only letters A-Z')
  })

  it('returns error for symbols with special characters', () => {
    const result = validateSymbol('AAPL!')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Symbol must contain only letters A-Z')
  })
})

describe('validateExpirationDate', () => {
  it('returns valid for future date', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    const result = validateExpirationDate(futureDate)
    expect(result.isValid).toBe(true)
  })

  it('returns valid for today', () => {
    const today = new Date()
    const result = validateExpirationDate(today)
    expect(result.isValid).toBe(true)
  })

  it('returns error for past date', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1)
    const result = validateExpirationDate(pastDate)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Expiration date must be in the future')
  })

  it('returns error for invalid date object', () => {
    const result = validateExpirationDate(new Date('invalid'))
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Invalid date format')
  })

  it('returns error for non-Date input', () => {
    const result = validateExpirationDate('2025-01-15' as unknown as Date)
    expect(result.isValid).toBe(false)
  })

  it('returns error for null', () => {
    const result = validateExpirationDate(null as unknown as Date)
    expect(result.isValid).toBe(false)
  })

  it('returns error for undefined', () => {
    const result = validateExpirationDate(undefined as unknown as Date)
    expect(result.isValid).toBe(false)
  })
})

describe('validateStrikePrice', () => {
  it('returns valid for positive integer price', () => {
    const result = validateStrikePrice(100)
    expect(result.isValid).toBe(true)
  })

  it('returns valid for price with 2 decimal places', () => {
    const result = validateStrikePrice(105.50)
    expect(result.isValid).toBe(true)
  })

  it('returns valid for price with 1 decimal place', () => {
    const result = validateStrikePrice(105.5)
    expect(result.isValid).toBe(true)
  })

  it('returns valid for very small price', () => {
    const result = validateStrikePrice(0.01)
    expect(result.isValid).toBe(true)
  })

  it('returns error for zero', () => {
    const result = validateStrikePrice(0)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Strike price must be positive')
  })

  it('returns error for negative price', () => {
    const result = validateStrikePrice(-50)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Strike price must be positive')
  })

  it('returns error for NaN', () => {
    const result = validateStrikePrice(NaN)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Strike price must be a number')
  })

  it('returns error for string input', () => {
    const result = validateStrikePrice('100' as unknown as number)
    expect(result.isValid).toBe(false)
  })

  it('returns error for more than 2 decimal places', () => {
    const result = validateStrikePrice(105.555)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Strike price cannot have more than 2 decimal places')
  })

  it('returns error for unreasonably high price', () => {
    const result = validateStrikePrice(1000001)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Strike price seems unreasonably high')
  })
})

describe('validateQuantity', () => {
  it('returns valid for positive integer', () => {
    const result = validateQuantity(1)
    expect(result.isValid).toBe(true)
  })

  it('returns valid for multiple contracts', () => {
    const result = validateQuantity(10)
    expect(result.isValid).toBe(true)
  })

  it('returns valid for large quantity', () => {
    const result = validateQuantity(100)
    expect(result.isValid).toBe(true)
  })

  it('returns error for zero', () => {
    const result = validateQuantity(0)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Quantity must be positive')
  })

  it('returns error for negative', () => {
    const result = validateQuantity(-5)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Quantity must be positive')
  })

  it('returns error for decimal', () => {
    const result = validateQuantity(5.5)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Quantity must be a whole number')
  })

  it('returns error for NaN', () => {
    const result = validateQuantity(NaN)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Quantity must be a number')
  })

  it('returns error for string', () => {
    const result = validateQuantity('10' as unknown as number)
    expect(result.isValid).toBe(false)
  })

  it('returns error for unreasonably high quantity', () => {
    const result = validateQuantity(10001)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Quantity seems unreasonably high')
  })
})

describe('validateOptionPosition', () => {
  const createTestPosition = (overrides: Partial<Position> = {}): Position => ({
    id: 'test-id',
    symbol: 'AAPL',
    strategy_type: 'Short Put',
    trade_kind: 'option',
    option_type: 'put',
    strike_price: 150,
    expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    premium_per_contract: 2.50,
    profit_target_basis: 'stock_price',
    stop_loss_basis: 'stock_price',
    target_entry_price: 147.50,
    target_quantity: 5,
    profit_target: 200,
    stop_loss: 300,
    position_thesis: 'Test thesis',
    created_date: new Date(),
    status: 'planned',
    journal_entry_ids: [],
    trades: [],
    ...overrides
  })

  it('returns valid for complete Short Put position', () => {
    const position = createTestPosition()
    const result = validateOptionPosition(position)
    expect(result.isValid).toBe(true)
  })

  it('returns valid for Long Stock position (skips option validation)', () => {
    const position = createTestPosition({
      strategy_type: 'Long Stock',
      trade_kind: 'stock'
    })
    delete position.option_type
    delete position.strike_price
    delete position.expiration_date
    delete position.premium_per_contract
    const result = validateOptionPosition(position)
    expect(result.isValid).toBe(true)
  })

  it('returns error when option_type is missing', () => {
    const position = createTestPosition()
    delete position.option_type
    const result = validateOptionPosition(position)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Option type (call/put) is required for Short Put positions')
  })

  it('returns error when option_type is invalid', () => {
    const position = createTestPosition({ option_type: 'call' as 'put' })
    position.option_type = 'invalid' as 'call' | 'put'
    const result = validateOptionPosition(position)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Option type (call/put) is required for Short Put positions')
  })

  it('returns error when strike_price is missing', () => {
    const position = createTestPosition()
    delete position.strike_price
    const result = validateOptionPosition(position)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Strike price is required for Short Put positions')
  })

  it('returns error when strike_price is invalid', () => {
    const position = createTestPosition({ strike_price: -100 })
    const result = validateOptionPosition(position)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Strike price must be positive')
  })

  it('returns error when expiration_date is missing', () => {
    const position = createTestPosition()
    delete position.expiration_date
    const result = validateOptionPosition(position)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Expiration date is required for Short Put positions')
  })

  it('returns error when expiration_date is in the past', () => {
    const position = createTestPosition({
      expiration_date: new Date(Date.now() - 24 * 60 * 60 * 1000)
    })
    const result = validateOptionPosition(position)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Expiration date must be in the future')
  })

  it('returns error when premium_per_contract is missing', () => {
    const position = createTestPosition()
    delete position.premium_per_contract
    const result = validateOptionPosition(position)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Premium per contract is required for Short Put positions')
  })

  it('returns error when premium_per_contract is negative', () => {
    const position = createTestPosition({ premium_per_contract: -1 })
    const result = validateOptionPosition(position)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Premium per contract cannot be negative')
  })

  it('returns error when premium_per_contract is not a number', () => {
    const position = createTestPosition({ premium_per_contract: NaN })
    const result = validateOptionPosition(position)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Premium per contract must be a number')
  })

  it('returns valid for Short Put with call option_type', () => {
    const position = createTestPosition({ option_type: 'call' })
    const result = validateOptionPosition(position)
    expect(result.isValid).toBe(true)
  })

  it('returns valid for premium of zero', () => {
    const position = createTestPosition({ premium_per_contract: 0 })
    const result = validateOptionPosition(position)
    expect(result.isValid).toBe(true)
  })
})
