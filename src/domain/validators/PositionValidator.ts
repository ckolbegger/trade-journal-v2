import type { Position } from '@/lib/position'
import { ValidationError } from '@/lib/position'

/**
 * PositionValidator - Domain validation for positions
 *
 * Enforces business rules for position data integrity.
 */
export class PositionValidator {
  /**
   * Validate complete position data
   *
   * @param position - Position to validate
   * @throws Error if validation fails
   */
  static validatePosition(position: Position): void {
    // Validate specific fields first (before checking for missing fields)
    if (position.target_entry_price !== undefined && position.target_entry_price <= 0) {
      throw new Error('target_entry_price must be positive')
    }

    if (position.target_quantity !== undefined && position.target_quantity <= 0) {
      throw new Error('target_quantity must be positive')
    }

    if (position.position_thesis !== undefined && position.position_thesis.trim() === '') {
      throw new Error('position_thesis cannot be empty')
    }

    // Check required fields last (ID is optional - will be generated if empty)
    if (!position.symbol || !position.strategy_type ||
        position.target_entry_price === undefined || position.target_quantity === undefined ||
        !position.profit_target || !position.stop_loss ||
        !position.position_thesis || !position.created_date || !position.status) {
      throw new Error('Invalid position data')
    }

    // Ensure journal_entry_ids is an array (for backwards compatibility)
    if (position.journal_entry_ids !== undefined && !Array.isArray(position.journal_entry_ids)) {
      throw new Error('journal_entry_ids must be an array')
    }

    // Ensure trades is an array (for backwards compatibility)
    if (position.trades !== undefined && !Array.isArray(position.trades)) {
      throw new Error('trades must be an array')
    }
  }

  /**
   * Validate option-specific position fields
   *
   * Enforces business rules for option strategy positions:
   * - Short Put positions require specific option fields
   * - Expiration dates must be in the future
   * - Strike prices must be positive
   *
   * @param position - Position to validate
   * @throws ValidationError if validation fails
   */
  static validateOptionPosition(position: Position): void {
    if (position.strategy_type === 'Short Put') {
      // Validate strike_price first (value check before required check)
      if (position.strike_price !== undefined && position.strike_price <= 0) {
        throw new ValidationError('strike_price must be greater than 0')
      }

      // Required option fields for Short Put
      if (position.option_type === undefined) {
        throw new ValidationError('option_type is required for Short Put positions')
      }
      if (position.strike_price === undefined) {
        throw new ValidationError('strike_price is required for Short Put positions')
      }
      if (position.expiration_date === undefined) {
        throw new ValidationError('expiration_date is required for Short Put positions')
      }
      if (position.profit_target_basis === undefined) {
        throw new ValidationError('profit_target_basis is required for Short Put positions')
      }
      if (position.stop_loss_basis === undefined) {
        throw new ValidationError('stop_loss_basis is required for Short Put positions')
      }

      // Validate expiration_date is in the future
      const expiration = new Date(position.expiration_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (expiration <= today) {
        throw new ValidationError('expiration_date must be in the future')
      }
    }
    // Long Stock positions pass validation (no option fields required)
  }
}
