import type { Position } from '@/lib/position'

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

    // Option-specific field validations
    if (position.strike_price !== undefined && position.strike_price <= 0) {
      throw new Error('strike_price must be positive')
    }

    if (position.expiration_date !== undefined) {
      const now = new Date()
      if (position.expiration_date < now) {
        throw new Error('expiration_date must be in the future')
      }
    }

    if (position.premium_per_contract !== undefined && position.premium_per_contract < 0) {
      throw new Error('premium_per_contract must be positive when provided')
    }

    // Strategy-specific required field validations
    if (position.strategy_type === 'Short Put') {
      if (!position.option_type) {
        throw new Error('option_type is required for Short Put strategy')
      }
      if (position.strike_price === undefined) {
        throw new Error('strike_price is required for Short Put strategy')
      }
      if (!position.expiration_date) {
        throw new Error('expiration_date is required for Short Put strategy')
      }
      if (!position.profit_target_basis) {
        throw new Error('profit_target_basis is required for Short Put strategy')
      }
      if (!position.stop_loss_basis) {
        throw new Error('stop_loss_basis is required for Short Put strategy')
      }
    }

    // Check required fields last
    if (!position.id || !position.symbol || !position.strategy_type ||
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
}
