/**
 * Position Interface Contract
 * Feature: 001-close-position
 * Date: 2025-11-09
 *
 * EXTENDED: Added 'closed' status to support position closure via exit trades
 */

import type { Trade } from './Trade.interface'

export interface Position {
  /** Unique identifier */
  id: string

  /** Stock ticker symbol (e.g., "AAPL", "TSLA") */
  symbol: string

  /** Strategy type - Phase 1A supports only Long Stock */
  strategy_type: 'Long Stock'

  /** Planned entry price per share (immutable after confirmation) */
  target_entry_price: number

  /** Planned quantity of shares (immutable after confirmation) */
  target_quantity: number

  /** Planned exit price for profit taking (immutable after confirmation) */
  profit_target: number

  /** Planned exit price for loss limitation (immutable after confirmation) */
  stop_loss: number

  /** Trading thesis / rationale for this position (immutable after confirmation) */
  position_thesis: string

  /** Position creation timestamp */
  created_date: Date

  /**
   * Position status (DERIVED from trade activity)
   * - planned: No trades yet
   * - open: Has trades with net quantity > 0
   * - closed: Net quantity === 0 (exit trades match entry trades)
   *
   * EXTENDED: Added 'closed' status
   * Status is computed from trades, never set directly by user
   */
  status: 'planned' | 'open' | 'closed'

  /** Array of journal entry IDs linked to this position */
  journal_entry_ids: string[]

  /**
   * Embedded array of trade executions
   * Supports both entry (buy) and exit (sell) trades
   * Sorted by timestamp for FIFO cost basis calculation
   */
  trades: Trade[]
}

/**
 * Position status computation rules
 *
 * @param position - The position to compute status for
 * @returns Computed status based on trades
 *
 * Logic:
 * - If no trades: 'planned'
 * - If net quantity > 0: 'open'
 * - If net quantity === 0: 'closed'
 * - Net quantity = sum(buy quantities) - sum(sell quantities)
 */
export function computePositionStatus(position: Position): Position['status'] {
  if (position.trades.length === 0) {
    return 'planned'
  }

  const netQuantity = position.trades.reduce((net, trade) => {
    return trade.trade_type === 'buy'
      ? net + trade.quantity
      : net - trade.quantity
  }, 0)

  return netQuantity === 0 ? 'closed' : 'open'
}

/**
 * Validation rules for Position entity
 *
 * All validations apply to both new positions and updates
 * Position plan fields are immutable after confirmation
 */
export const PositionValidation = {
  /** Target entry price must be positive */
  target_entry_price: (value: number) => value > 0,

  /** Target quantity must be positive integer */
  target_quantity: (value: number) => value > 0 && Number.isInteger(value),

  /** Profit target must be greater than target entry price (for long positions) */
  profit_target: (value: number, target_entry: number) => value > target_entry,

  /** Stop loss must be less than target entry price (for long positions) */
  stop_loss: (value: number, target_entry: number) => value < target_entry,

  /** Position thesis must not be empty */
  position_thesis: (value: string) => value.trim().length > 0,

  /** Symbol must be valid ticker format (uppercase letters, 1-5 characters) */
  symbol: (value: string) => /^[A-Z]{1,5}$/.test(value)
} as const
