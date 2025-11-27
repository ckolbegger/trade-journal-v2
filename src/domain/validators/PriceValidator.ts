import type { PriceHistoryInput } from '@/types/priceHistory'
import { PRICE_CHANGE_THRESHOLD_PERCENT } from '@/config/constants'

/**
 * PriceValidator - Domain validation for price data
 *
 * Enforces business rules for price data integrity and OHLC relationships.
 */
export class PriceValidator {
  /**
   * Validate a single price value
   *
   * @param price - Price value to validate
   * @param fieldName - Name of field for error messages
   * @throws Error if validation fails
   */
  static validatePrice(price: number, fieldName: string = 'Price'): void {
    if (price < 0) {
      throw new Error(`${fieldName} cannot be negative`)
    }
    if (price === 0) {
      throw new Error(`${fieldName} must be greater than zero`)
    }
  }

  /**
   * Validate complete OHLC price record
   *
   * @param input - Price record to validate
   * @throws Error if validation fails
   */
  static validatePriceRecord(input: PriceHistoryInput): void {
    // Validate individual prices
    this.validatePrice(input.open, 'Open price')
    this.validatePrice(input.high, 'High price')
    this.validatePrice(input.low, 'Low price')
    this.validatePrice(input.close, 'Close price')

    // Validate underlying
    if (!input.underlying || input.underlying.trim() === '') {
      throw new Error('Underlying cannot be empty')
    }

    // Validate date
    if (!input.date || input.date.trim() === '') {
      throw new Error('Date cannot be empty')
    }

    // Validate date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(input.date)) {
      throw new Error('Date must be in YYYY-MM-DD format')
    }

    // Validate OHLC relationships
    if (input.high < input.low) {
      throw new Error('High price cannot be less than low price')
    }
    if (input.open > input.high || input.open < input.low) {
      throw new Error('Open price must be between low and high')
    }
    if (input.close > input.high || input.close < input.low) {
      throw new Error('Close price must be between low and high')
    }
  }

  /**
   * Check if price change requires user confirmation
   *
   * @param oldPrice - Previous price (null if first price)
   * @param newPrice - New price to validate
   * @returns true if change exceeds threshold
   */
  static requiresConfirmation(oldPrice: number | null, newPrice: number): boolean {
    // No previous price - no confirmation needed
    if (oldPrice === null) {
      return false
    }

    // Calculate percentage change
    const percentChange = Math.abs(((newPrice - oldPrice) / oldPrice) * 100)

    // Require confirmation if change exceeds threshold
    return percentChange > PRICE_CHANGE_THRESHOLD_PERCENT
  }
}
