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

    if (position.profit_target !== undefined && position.profit_target <= 0) {
      throw new Error('profit_target must be positive')
    }

    if (position.stop_loss !== undefined && position.stop_loss <= 0) {
      throw new Error('stop_loss must be positive')
    }

    if (position.position_thesis !== undefined && position.position_thesis.trim() === '') {
      throw new Error('position_thesis cannot be empty')
    }

    // Check required fields last
    if (!position.id || !position.symbol || !position.strategy_type ||
        position.target_entry_price === undefined || position.target_quantity === undefined ||
        position.profit_target === undefined || position.stop_loss === undefined ||
        !position.position_thesis || !position.created_date || !position.status) {
      throw new Error('Invalid position data')
    }

    if (position.strategy_type === 'Short Put' && position.trade_kind !== 'option') {
      throw new Error('trade_kind must be option for Short Put strategy')
    }

    if (position.strategy_type === 'Long Stock' &&
        position.trade_kind !== undefined &&
        position.trade_kind !== 'stock') {
      throw new Error('trade_kind must be stock for Long Stock strategy')
    }

    const isValidBasis = (basis?: string): boolean =>
      basis === 'stock_price' || basis === 'option_price'

    if (position.profit_target_basis !== undefined && !isValidBasis(position.profit_target_basis)) {
      throw new Error('profit_target_basis must be stock_price or option_price')
    }

    if (position.stop_loss_basis !== undefined && !isValidBasis(position.stop_loss_basis)) {
      throw new Error('stop_loss_basis must be stock_price or option_price')
    }

    if (position.trade_kind === 'option') {
      if (!position.profit_target_basis) {
        throw new Error('profit_target_basis is required for option positions')
      }

      if (!position.stop_loss_basis) {
        throw new Error('stop_loss_basis is required for option positions')
      }

      if (!position.option_type) {
        throw new Error('option_type is required for option positions')
      }

      if (position.strike_price === undefined) {
        throw new Error('strike_price is required for option positions')
      }

      if (position.strike_price <= 0) {
        throw new Error('strike_price must be positive')
      }

      if (!position.expiration_date) {
        throw new Error('expiration_date is required for option positions')
      }

      const expirationDate = new Date(position.expiration_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      expirationDate.setHours(0, 0, 0, 0)

      if (expirationDate < today) {
        throw new Error('expiration_date cannot be in the past')
      }

      if (position.premium_per_contract === undefined) {
        throw new Error('premium_per_contract is required for option positions')
      }

      if (position.premium_per_contract <= 0) {
        throw new Error('premium_per_contract must be positive')
      }
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
