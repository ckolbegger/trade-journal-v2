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
