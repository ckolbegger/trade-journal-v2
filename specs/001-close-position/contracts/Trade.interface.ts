/**
 * Trade Interface Contract
 * Feature: 001-close-position
 * Date: 2025-11-09
 *
 * NO CHANGES: Interface already supports both buy and sell trade types
 * This contract documents validation rules for exit (sell) trades
 */

export interface Trade {
  /** Unique identifier */
  id: string

  /** Foreign key to Position */
  position_id: string

  /**
   * Trade type
   * - buy: Entry trade (opens or adds to position)
   * - sell: Exit trade (closes or reduces position)
   */
  trade_type: 'buy' | 'sell'

  /** Number of shares/contracts traded (must be positive) */
  quantity: number

  /**
   * Execution price per share/contract
   * - Entry trades: Must be > 0
   * - Exit trades: Must be >= 0 (allow $0 for expired/worthless)
   */
  price: number

  /** Trade execution timestamp (used for FIFO ordering) */
  timestamp: Date

  /** Optional trade notes */
  notes?: string

  /**
   * Underlying instrument identifier
   * - Stock: Ticker symbol (e.g., "AAPL", "TSLA")
   * - Option: OCC symbol format (e.g., "AAPL  250117C00150000")
   *
   * Phase 1A: Auto-populated from position.symbol
   * Phase 3+: Enables multi-leg positions with different underlyings
   */
  underlying: string
}

/**
 * Validation rules for Trade entity
 * Rules differ for entry (buy) vs exit (sell) trades
 */
export const TradeValidation = {
  /** Quantity must be positive integer */
  quantity: (value: number) => value > 0 && Number.isInteger(value),

  /**
   * Price validation (differs by trade type)
   * - Entry trades: price > 0
   * - Exit trades: price >= 0 (allow $0 for expired options/worthless stocks)
   */
  price: {
    entry: (value: number) => value > 0,
    exit: (value: number) => value >= 0 // Allow $0, prevent negative
  },

  /** Trade type must be 'buy' or 'sell' */
  trade_type: (value: string): value is 'buy' | 'sell' =>
    value === 'buy' || value === 'sell',

  /** Underlying must not be empty */
  underlying: (value: string) => value.trim().length > 0
} as const

/**
 * Exit trade specific validation
 * These rules apply only when trade_type === 'sell'
 */
export interface ExitTradeValidationContext {
  /** Current open quantity for the position */
  currentOpenQuantity: number

  /** Position status (cannot exit from 'planned' status) */
  positionStatus: 'planned' | 'open' | 'closed'
}

/**
 * Validates exit trade against position state
 *
 * @param trade - The exit trade to validate
 * @param context - Position state context
 * @throws ValidationError if exit trade is invalid
 */
export function validateExitTrade(
  trade: Trade,
  context: ExitTradeValidationContext
): void {
  // Require trade to be sell type
  if (trade.trade_type !== 'sell') {
    throw new ValidationError({
      field: 'trade_type',
      message: 'Exit trades must be type "sell"',
      currentValue: trade.trade_type,
      expectedConstraint: '=== "sell"'
    })
  }

  // Cannot exit from planned position
  if (context.positionStatus === 'planned') {
    throw new ValidationError({
      field: 'position_state',
      message: 'Cannot add exit trade to planned position',
      suggestedAction: 'Add entry trade first to open the position'
    })
  }

  // Prevent overselling
  if (trade.quantity > context.currentOpenQuantity) {
    throw new ValidationError({
      field: 'quantity',
      message: `Cannot sell ${trade.quantity} shares`,
      currentValue: trade.quantity,
      expectedConstraint: `<= ${context.currentOpenQuantity} (current open quantity)`,
      suggestedAction:
        'To reverse position, close this position first, ' +
        'then create new position in opposite direction.'
    })
  }

  // Validate non-negative price
  if (trade.price < 0) {
    throw new ValidationError({
      field: 'price',
      message: 'Price cannot be negative',
      currentValue: trade.price,
      expectedConstraint: '>= 0',
      suggestedAction: 'Enter $0 for worthless/expired positions, or positive price.'
    })
  }
}

/**
 * Structured validation error
 */
export class ValidationError extends Error {
  constructor(
    public details: {
      field: 'price' | 'quantity' | 'trade_type' | 'position_state'
      message: string
      currentValue?: any
      expectedConstraint?: string
      suggestedAction?: string
    }
  ) {
    super(details.message)
    this.name = 'ValidationError'
  }
}

/**
 * Calculate current open quantity from trades
 *
 * @param trades - All trades for the position
 * @returns Net quantity (buys - sells)
 */
export function calculateOpenQuantity(trades: Trade[]): number {
  return trades.reduce((net, trade) => {
    return trade.trade_type === 'buy'
      ? net + trade.quantity
      : net - trade.quantity
  }, 0)
}
