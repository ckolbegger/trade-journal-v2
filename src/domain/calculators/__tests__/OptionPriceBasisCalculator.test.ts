import { describe, it, expect } from 'vitest'
import { calculateOptionBasisDollarValue } from '../OptionPriceBasisCalculator'

/**
 * Comprehensive test suite for option price basis conversion
 *
 * This test suite verifies that calculateOptionBasisDollarValue() correctly converts
 * option price basis values to dollar amounts for display in PositionCard.
 *
 * Conversion logic:
 * - option_price basis: Uses (strike_price - premium) × percentage = dollar value
 * - stock_price basis: Uses raw dollar values (no conversion needed)
 *
 * Examples:
 * - Strike $100, Premium $3, Basis='option_price', Target=20% → ($100 - $3) × 0.20 = $19.40
 * - Strike $95, Premium $2.50, Basis='stock_price', Target=$105 → profit_target = $105 (no conversion)
 */

describe('OptionPriceBasisCalculator', () => {
  describe('Option Price Basis Conversion', () => {
    it('should convert profit_target with option_price basis using (strike - premium) × percentage', () => {
      // Example from spec: Strike $100, Premium $3, Basis='option_price', Target=20% → $19.40
      const result = calculateOptionBasisDollarValue({
        strikePrice: 100,
        premium: 3,
        basis: 'option_price',
        targetValue: 20, // 20%
        targetType: 'percentage'
      })

      expect(result).toBeCloseTo(19.40, 2) // (100 - 3) × 0.20 = 19.40
    })

    it('should convert stop_loss with option_price basis using (strike - premium) × percentage', () => {
      const result = calculateOptionBasisDollarValue({
        strikePrice: 95,
        premium: 2.50,
        basis: 'option_price',
        targetValue: 15, // 15%
        targetType: 'percentage'
      })

      expect(result).toBeCloseTo(13.875, 3) // (95 - 2.50) × 0.15 = 13.875
    })

    it('should convert option_price basis with higher strike and premium', () => {
      const result = calculateOptionBasisDollarValue({
        strikePrice: 150,
        premium: 5.50,
        basis: 'option_price',
        targetValue: 25, // 25%
        targetType: 'percentage'
      })

      expect(result).toBeCloseTo(36.125, 3) // (150 - 5.50) × 0.25 = 36.125
    })

    it('should convert option_price basis with lower strike and premium', () => {
      const result = calculateOptionBasisDollarValue({
        strikePrice: 50,
        premium: 1.25,
        basis: 'option_price',
        targetValue: 10, // 10%
        targetType: 'percentage'
      })

      expect(result).toBeCloseTo(4.875, 3) // (50 - 1.25) × 0.10 = 4.875
    })

    it('should handle zero premium for option_price basis', () => {
      const result = calculateOptionBasisDollarValue({
        strikePrice: 100,
        premium: 0,
        basis: 'option_price',
        targetValue: 20, // 20%
        targetType: 'percentage'
      })

      expect(result).toBe(20) // (100 - 0) × 0.20 = 20
    })
  })

  describe('Stock Price Basis (No Conversion)', () => {
    it('should return raw dollar value when basis is stock_price', () => {
      // Example from spec: Strike $95, Premium $2.50, Basis='stock_price', Target=$105 → $105 (no conversion)
      const result = calculateOptionBasisDollarValue({
        strikePrice: 95,
        premium: 2.50,
        basis: 'stock_price',
        targetValue: 105, // $105
        targetType: 'dollar'
      })

      expect(result).toBe(105) // No conversion - raw dollar value
    })

    it('should return raw dollar value for profit_target with stock_price basis', () => {
      const result = calculateOptionBasisDollarValue({
        strikePrice: 100,
        premium: 3,
        basis: 'stock_price',
        targetValue: 110, // $110
        targetType: 'dollar'
      })

      expect(result).toBe(110) // No conversion
    })

    it('should return raw dollar value for stop_loss with stock_price basis', () => {
      const result = calculateOptionBasisDollarValue({
        strikePrice: 85,
        premium: 2,
        basis: 'stock_price',
        targetValue: 80, // $80
        targetType: 'dollar'
      })

      expect(result).toBe(80) // No conversion
    })

    it('should handle decimal dollar values for stock_price basis', () => {
      const result = calculateOptionBasisDollarValue({
        strikePrice: 100,
        premium: 3,
        basis: 'stock_price',
        targetValue: 102.50, // $102.50
        targetType: 'dollar'
      })

      expect(result).toBe(102.50) // No conversion
    })
  })

  describe('Edge Cases', () => {
    it('should handle small percentage values', () => {
      const result = calculateOptionBasisDollarValue({
        strikePrice: 100,
        premium: 3,
        basis: 'option_price',
        targetValue: 1, // 1%
        targetType: 'percentage'
      })

      expect(result).toBeCloseTo(0.97, 2) // (100 - 3) × 0.01 = 0.97
    })

    it('should handle large percentage values', () => {
      const result = calculateOptionBasisDollarValue({
        strikePrice: 100,
        premium: 3,
        basis: 'option_price',
        targetValue: 100, // 100%
        targetType: 'percentage'
      })

      expect(result).toBe(97) // (100 - 3) × 1.00 = 97
    })

    it('should handle high premium relative to strike', () => {
      const result = calculateOptionBasisDollarValue({
        strikePrice: 50,
        premium: 10, // High premium
        basis: 'option_price',
        targetValue: 20, // 20%
        targetType: 'percentage'
      })

      expect(result).toBeCloseTo(8, 1) // (50 - 10) × 0.20 = 8
    })

    it('should return 0 when percentage is 0', () => {
      const result = calculateOptionBasisDollarValue({
        strikePrice: 100,
        premium: 3,
        basis: 'option_price',
        targetValue: 0, // 0%
        targetType: 'percentage'
      })

      expect(result).toBe(0)
    })
  })

  describe('Input Validation', () => {
    it('should handle percentage as decimal (e.g., 0.20 for 20%)', () => {
      // Some systems might pass percentages as decimals (0.20 instead of 20)
      const result = calculateOptionBasisDollarValue({
        strikePrice: 100,
        premium: 3,
        basis: 'option_price',
        targetValue: 0.20, // 0.20 = 20%
        targetType: 'percentage_decimal'
      })

      expect(result).toBeCloseTo(19.40, 2) // (100 - 3) × 0.20 = 19.40
    })

    it('should handle negative dollar values for stock_price basis (loss targets)', () => {
      const result = calculateOptionBasisDollarValue({
        strikePrice: 100,
        premium: 3,
        basis: 'stock_price',
        targetValue: -10, // -$10 (loss)
        targetType: 'dollar'
      })

      expect(result).toBe(-10) // No conversion for stock_price basis
    })
  })

  describe('TypeScript Type Safety', () => {
    it('should only accept valid basis types ("stock_price" | "option_price")', () => {
      // This is a compile-time check - the function signature should enforce this
      const result1 = calculateOptionBasisDollarValue({
        strikePrice: 100,
        premium: 3,
        basis: 'stock_price',
        targetValue: 105,
        targetType: 'dollar'
      })

      const result2 = calculateOptionBasisDollarValue({
        strikePrice: 100,
        premium: 3,
        basis: 'option_price',
        targetValue: 20,
        targetType: 'percentage'
      })

      expect(result1).toBe(105)
      expect(result2).toBeCloseTo(19.40, 2)
    })

    it('should only accept valid targetType values ("dollar" | "percentage" | "percentage_decimal")', () => {
      const result1 = calculateOptionBasisDollarValue({
        strikePrice: 100,
        premium: 3,
        basis: 'stock_price',
        targetValue: 105,
        targetType: 'dollar'
      })

      const result2 = calculateOptionBasisDollarValue({
        strikePrice: 100,
        premium: 3,
        basis: 'option_price',
        targetValue: 20,
        targetType: 'percentage'
      })

      const result3 = calculateOptionBasisDollarValue({
        strikePrice: 100,
        premium: 3,
        basis: 'option_price',
        targetValue: 0.20,
        targetType: 'percentage_decimal'
      })

      expect(result1).toBe(105)
      expect(result2).toBeCloseTo(19.40, 2)
      expect(result3).toBeCloseTo(19.40, 2)
    })
  })
})
