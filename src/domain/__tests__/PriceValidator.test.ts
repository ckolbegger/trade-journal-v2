import { describe, it, expect } from 'vitest'
import { PriceValidator } from '../validators/PriceValidator'
import type { PriceHistoryInput } from '@/types/priceHistory'

describe('PriceValidator', () => {
  describe('validatePrice', () => {
    it('should pass for valid positive price', () => {
      expect(() => PriceValidator.validatePrice(150.50)).not.toThrow()
    })

    it('should reject negative price', () => {
      expect(() => PriceValidator.validatePrice(-10))
        .toThrow('Price cannot be negative')
    })

    it('should reject zero price', () => {
      expect(() => PriceValidator.validatePrice(0))
        .toThrow('Price must be greater than zero')
    })

    it('should use custom field name in error message', () => {
      expect(() => PriceValidator.validatePrice(-5, 'Close price'))
        .toThrow('Close price cannot be negative')
    })
  })

  describe('validatePriceRecord', () => {
    const validRecord: PriceHistoryInput = {
      underlying: 'AAPL',
      date: '2024-01-15',
      open: 150,
      high: 155,
      low: 148,
      close: 152
    }

    it('should pass for valid OHLC record', () => {
      expect(() => PriceValidator.validatePriceRecord(validRecord)).not.toThrow()
    })

    it('should reject if high < low', () => {
      const record = { ...validRecord, high: 145, low: 150 }
      expect(() => PriceValidator.validatePriceRecord(record))
        .toThrow('High price cannot be less than low price')
    })

    it('should reject if open outside high/low range (too high)', () => {
      const record = { ...validRecord, open: 160 }
      expect(() => PriceValidator.validatePriceRecord(record))
        .toThrow('Open price must be between low and high')
    })

    it('should reject if open outside high/low range (too low)', () => {
      const record = { ...validRecord, open: 140 }
      expect(() => PriceValidator.validatePriceRecord(record))
        .toThrow('Open price must be between low and high')
    })

    it('should reject if close outside high/low range (too high)', () => {
      const record = { ...validRecord, close: 160 }
      expect(() => PriceValidator.validatePriceRecord(record))
        .toThrow('Close price must be between low and high')
    })

    it('should reject if close outside high/low range (too low)', () => {
      const record = { ...validRecord, close: 140 }
      expect(() => PriceValidator.validatePriceRecord(record))
        .toThrow('Close price must be between low and high')
    })

    it('should reject empty underlying', () => {
      const record = { ...validRecord, underlying: '   ' }
      expect(() => PriceValidator.validatePriceRecord(record))
        .toThrow('Underlying cannot be empty')
    })

    it('should reject missing underlying', () => {
      const record = { ...validRecord, underlying: '' }
      expect(() => PriceValidator.validatePriceRecord(record))
        .toThrow('Underlying cannot be empty')
    })

    it('should reject invalid date format', () => {
      const record = { ...validRecord, date: '01/15/2024' }
      expect(() => PriceValidator.validatePriceRecord(record))
        .toThrow('Date must be in YYYY-MM-DD format')
    })

    it('should reject empty date', () => {
      const record = { ...validRecord, date: '' }
      expect(() => PriceValidator.validatePriceRecord(record))
        .toThrow('Date cannot be empty')
    })

    it('should reject negative prices in OHLC fields', () => {
      const record = { ...validRecord, open: -150 }
      expect(() => PriceValidator.validatePriceRecord(record))
        .toThrow('Open price cannot be negative')
    })

    it('should reject zero prices in OHLC fields', () => {
      const record = { ...validRecord, high: 0 }
      expect(() => PriceValidator.validatePriceRecord(record))
        .toThrow('High price must be greater than zero')
    })
  })

  describe('requiresConfirmation (price change validation)', () => {
    it('should not require confirmation for <20% change', () => {
      const oldPrice = 100
      const newPrice = 115  // 15% increase
      expect(PriceValidator.requiresConfirmation(oldPrice, newPrice)).toBe(false)
    })

    it('should require confirmation for >20% increase', () => {
      const oldPrice = 100
      const newPrice = 125  // 25% increase
      expect(PriceValidator.requiresConfirmation(oldPrice, newPrice)).toBe(true)
    })

    it('should require confirmation for >20% decrease', () => {
      const oldPrice = 100
      const newPrice = 75  // 25% decrease
      expect(PriceValidator.requiresConfirmation(oldPrice, newPrice)).toBe(true)
    })

    it('should require confirmation for exactly 20% change', () => {
      const oldPrice = 100
      const newPrice = 120  // Exactly 20% increase
      expect(PriceValidator.requiresConfirmation(oldPrice, newPrice)).toBe(false)
    })

    it('should require confirmation for 20.1% change', () => {
      const oldPrice = 100
      const newPrice = 120.1  // 20.1% increase
      expect(PriceValidator.requiresConfirmation(oldPrice, newPrice)).toBe(true)
    })

    it('should handle first price (no previous) without confirmation', () => {
      const oldPrice = null
      const newPrice = 150
      expect(PriceValidator.requiresConfirmation(oldPrice, newPrice)).toBe(false)
    })
  })
})
