/**
 * Trade Service Contract
 *
 * Defines the interface for trade operations within positions.
 * Extended for Short Put strategy support with option-specific actions.
 */

import type { Trade, Position } from './types'
import type { ValidationResult } from './position-service'

/**
 * Option action codes for option trades
 */
export type OptionAction = 'STO' | 'BTC' | 'BTO' | 'STC'
// STO = Sell to Open (create short position)
// BTC = Buy to Close (close short position)
// BTO = Buy to Open (create long position) - future
// STC = Sell to Close (close long position) - future

/**
 * Input for adding a stock trade
 */
export interface AddStockTradeInput {
  position_id: string
  trade_type: 'buy' | 'sell'
  quantity: number
  price: number
  timestamp?: Date  // Defaults to now
  notes?: string
}

/**
 * Input for adding an option trade
 */
export interface AddOptionTradeInput {
  position_id: string
  action: OptionAction
  quantity: number  // Number of contracts
  price: number     // Premium per contract
  timestamp?: Date  // Defaults to now
  notes?: string

  // Option contract details (auto-populated from position if not provided)
  option_type?: 'call' | 'put'
  strike_price?: number
  expiration_date?: Date

  // Optional: stock price at time of trade (for historical reference)
  underlying_price_at_trade?: number
}

/**
 * Input for recording option expiration (worthless)
 */
export interface RecordExpirationInput {
  position_id: string
  contracts_expired: number  // Default: all open contracts
  notes?: string
}

/**
 * Trade Service Interface
 *
 * Provides operations for adding trades to positions.
 */
export interface ITradeService {
  /**
   * Add a stock trade to a position
   *
   * @param input - Stock trade data
   * @returns Updated position with new trade
   * @throws ValidationError if trade is invalid
   */
  addStockTrade(input: AddStockTradeInput): Promise<Position>

  /**
   * Add an option trade to a position
   *
   * @param input - Option trade data
   * @returns Updated position with new trade
   * @throws ValidationError if trade is invalid
   */
  addOptionTrade(input: AddOptionTradeInput): Promise<Position>

  /**
   * Record option expiration (worthless)
   *
   * Creates a BTC trade at $0.00 price.
   *
   * @param input - Expiration data
   * @returns Updated position (will be 'closed' if all contracts expired)
   * @throws ValidationError if expiration is invalid (e.g., before expiration date)
   */
  recordExpiration(input: RecordExpirationInput): Promise<Position>

  /**
   * Get a trade by ID
   *
   * @param positionId - Position containing the trade
   * @param tradeId - Trade UUID
   * @returns Trade or null if not found
   */
  getTradeById(positionId: string, tradeId: string): Promise<Trade | null>

  /**
   * Validate a stock trade before adding
   *
   * @param input - Trade data to validate
   * @param position - Target position
   * @returns Validation result with any field errors
   */
  validateStockTrade(
    input: AddStockTradeInput,
    position: Position
  ): ValidationResult

  /**
   * Validate an option trade before adding
   *
   * @param input - Trade data to validate
   * @param position - Target position
   * @returns Validation result with any field errors
   */
  validateOptionTrade(
    input: AddOptionTradeInput,
    position: Position
  ): ValidationResult

  /**
   * Calculate open quantity for a specific instrument
   *
   * @param trades - All trades in position
   * @param instrument - Instrument identifier (symbol or OCC)
   * @returns Net open quantity
   */
  calculateOpenQuantity(trades: Trade[], instrument: string): number

  /**
   * Generate OCC symbol from option details
   *
   * @param symbol - Underlying symbol
   * @param expiration - Expiration date
   * @param type - 'put' or 'call'
   * @param strike - Strike price
   * @returns OCC symbol (e.g., "AAPL  250117P00105000")
   */
  generateOccSymbol(
    symbol: string,
    expiration: Date,
    type: 'put' | 'call',
    strike: number
  ): string

  /**
   * Parse OCC symbol into components
   *
   * @param occSymbol - OCC symbol to parse
   * @returns Parsed components or null if invalid
   */
  parseOccSymbol(occSymbol: string): {
    symbol: string
    expiration: Date
    type: 'put' | 'call'
    strike: number
  } | null
}
