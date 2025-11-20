import type { Trade, Position } from '@/lib/position'

/**
 * TradeValidator - Domain validation for trades
 *
 * Enforces business rules for trade data integrity.
 */
export class TradeValidator {
  /**
   * Validate basic trade data
   *
   * @param trade - Trade data to validate (without ID)
   * @throws Error if validation fails
   */
  static validateTrade(trade: Omit<Trade, 'id'>): void {
    // Validate required fields
    if (!trade.position_id || !trade.trade_type ||
        trade.quantity === undefined || trade.price === undefined ||
        !trade.timestamp) {
      throw new Error('Trade validation failed: Missing required fields')
    }

    // Validate trade_type
    if (trade.trade_type !== 'buy' && trade.trade_type !== 'sell') {
      throw new Error('Trade validation failed: Invalid trade type')
    }

    // Validate quantity
    if (trade.quantity <= 0) {
      throw new Error('Trade validation failed: Quantity must be positive')
    }

    // Validate price (allow zero price only for sell trades - worthless exits)
    if (trade.price < 0) {
      throw new Error('Trade validation failed: Price must be positive')
    }
    if (trade.price === 0 && trade.trade_type === 'buy') {
      throw new Error('Trade validation failed: Price must be positive')
    }

    // Validate timestamp
    if (trade.timestamp instanceof Date && isNaN(trade.timestamp.getTime())) {
      throw new Error('Trade validation failed: Invalid timestamp')
    }

    // Validate underlying (if provided, must not be empty)
    if (trade.underlying !== undefined && trade.underlying.trim() === '') {
      throw new Error('Trade validation failed: underlying cannot be empty')
    }
  }

  /**
   * Validate exit trade against position state
   *
   * @param position - Position being exited
   * @param quantity - Exit quantity
   * @param price - Exit price
   * @throws Error if validation fails
   */
  static validateExitTrade(position: Position, quantity: number, price: number): void {
    // Cannot exit from planned position (no trades yet)
    if (position.status === 'planned') {
      throw new Error('Trade validation failed: Cannot exit from planned position')
    }

    // Cannot exit from already closed position
    if (position.status === 'closed') {
      throw new Error('Trade validation failed: Cannot exit from closed position')
    }

    // Calculate current position quantity (buys - sells)
    const currentQuantity = position.trades.reduce((total, trade) => {
      return total + (trade.trade_type === 'buy' ? trade.quantity : -trade.quantity)
    }, 0)

    // Cannot sell more than current position (prevent overselling)
    if (quantity > currentQuantity) {
      throw new Error('Trade validation failed: Cannot sell more than current position')
    }
  }
}
