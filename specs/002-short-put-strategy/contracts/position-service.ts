/**
 * Position Service Contract
 *
 * Defines the interface for position CRUD operations and metrics calculation.
 * Extended for Short Put strategy support.
 */

import type { Position, Trade, PositionMetrics } from './types'
import type { PriceEntry } from './price-service'

/**
 * Input for creating a new position plan
 */
export interface CreatePositionInput {
  symbol: string
  strategy_type: 'Long Stock' | 'Short Put'
  trade_kind: 'stock' | 'option'

  // Plan fields
  target_entry_price: number
  target_quantity: number
  profit_target: number
  stop_loss: number
  profit_target_basis: 'stock_price' | 'option_price'
  stop_loss_basis: 'stock_price' | 'option_price'
  position_thesis: string

  // Option plan fields (required when trade_kind === 'option')
  option_type?: 'call' | 'put'
  strike_price?: number
  expiration_date?: Date
  premium_per_contract?: number
}

/**
 * Validation result for position operations
 */
export interface ValidationResult {
  valid: boolean
  errors: FieldError[]
}

export interface FieldError {
  field: string
  message: string
}

/**
 * Position Service Interface
 *
 * Provides CRUD operations for positions with option strategy support.
 */
export interface IPositionService {
  /**
   * Create a new position plan
   *
   * @param input - Position plan data
   * @returns Created position with generated ID and 'planned' status
   * @throws ValidationError if input is invalid
   */
  create(input: CreatePositionInput): Promise<Position>

  /**
   * Get a position by ID
   *
   * @param id - Position UUID
   * @returns Position or null if not found
   */
  getById(id: string): Promise<Position | null>

  /**
   * Get all positions
   *
   * @returns Array of all positions, sorted by created_date descending
   */
  getAll(): Promise<Position[]>

  /**
   * Get positions filtered by strategy type
   *
   * @param strategyType - Filter by strategy
   * @returns Filtered positions
   */
  getByStrategyType(strategyType: 'Long Stock' | 'Short Put'): Promise<Position[]>

  /**
   * Get positions filtered by status
   *
   * @param status - Filter by status
   * @returns Filtered positions
   */
  getByStatus(status: 'planned' | 'open' | 'closed'): Promise<Position[]>

  /**
   * Update a position (internal use - trades update through TradeService)
   *
   * @param position - Updated position data
   * @throws ValidationError if position data is invalid
   */
  update(position: Position): Promise<void>

  /**
   * Delete a position and all associated data
   *
   * @param id - Position UUID
   */
  delete(id: string): Promise<void>

  /**
   * Calculate position metrics
   *
   * @param position - Position to calculate metrics for
   * @param priceMap - Map of instrument_id to latest price
   * @returns Calculated metrics (avgCost, costBasis, openQuantity, pnl, pnlPercentage)
   */
  calculatePositionMetrics(
    position: Position,
    priceMap: Map<string, PriceEntry>
  ): PositionMetrics

  /**
   * Validate a position plan before creation
   *
   * @param input - Position plan data to validate
   * @returns Validation result with any field errors
   */
  validatePositionPlan(input: CreatePositionInput): ValidationResult
}

/**
 * Position metrics calculation result
 */
export interface PositionMetrics {
  /** Weighted average cost per share/contract */
  avgCost: number

  /** Total cost basis (avgCost × quantity) */
  costBasis: number

  /** Current open quantity (buys - sells) */
  openQuantity: number

  /** Unrealized or realized P&L, null if price data unavailable */
  pnl: number | null

  /** P&L as percentage of cost basis, undefined if pnl is null */
  pnlPercentage: number | undefined

  /** For options: intrinsic value breakdown */
  intrinsicValue?: number

  /** For options: extrinsic value breakdown */
  extrinsicValue?: number
}
