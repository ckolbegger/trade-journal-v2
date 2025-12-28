/**
 * Calculator Contracts
 *
 * Defines interfaces for domain calculation services.
 */

import type { Trade, IntrinsicExtrinsicResult, PositionMetrics } from './types'

// ============================================================================
// Intrinsic/Extrinsic Calculator
// ============================================================================

/**
 * Intrinsic/Extrinsic Calculator Interface
 *
 * Calculates option value decomposition for puts and calls.
 */
export interface IIntrinsicExtrinsicCalculator {
  /**
   * Calculate intrinsic and extrinsic values for a put option
   *
   * Formulas:
   * - Intrinsic = max(0, strike - stock_price)
   * - Extrinsic = option_price - intrinsic
   *
   * @param stockPrice - Current stock price
   * @param strikePrice - Option strike price
   * @param optionPrice - Current option price
   * @param contracts - Number of contracts
   * @returns Value breakdown per contract and total
   */
  calculatePutValues(
    stockPrice: number,
    strikePrice: number,
    optionPrice: number,
    contracts: number
  ): IntrinsicExtrinsicResult

  /**
   * Calculate intrinsic and extrinsic values for a call option
   *
   * Formulas:
   * - Intrinsic = max(0, stock_price - strike)
   * - Extrinsic = option_price - intrinsic
   *
   * @param stockPrice - Current stock price
   * @param strikePrice - Option strike price
   * @param optionPrice - Current option price
   * @param contracts - Number of contracts
   * @returns Value breakdown per contract and total
   */
  calculateCallValues(
    stockPrice: number,
    strikePrice: number,
    optionPrice: number,
    contracts: number
  ): IntrinsicExtrinsicResult

  /**
   * Check if option is in-the-money
   *
   * @param stockPrice - Current stock price
   * @param strikePrice - Option strike price
   * @param optionType - 'put' or 'call'
   * @returns true if option has intrinsic value
   */
  isInTheMoney(
    stockPrice: number,
    strikePrice: number,
    optionType: 'put' | 'call'
  ): boolean

  /**
   * Get moneyness description
   *
   * @param stockPrice - Current stock price
   * @param strikePrice - Option strike price
   * @param optionType - 'put' or 'call'
   * @returns 'ITM', 'ATM', or 'OTM'
   */
  getMoneyness(
    stockPrice: number,
    strikePrice: number,
    optionType: 'put' | 'call'
  ): 'ITM' | 'ATM' | 'OTM'
}

// ============================================================================
// Cost Basis Calculator
// ============================================================================

/**
 * Cost Basis Calculator Interface
 *
 * Calculates FIFO cost basis for trades.
 */
export interface ICostBasisCalculator {
  /**
   * Calculate average cost per share/contract using FIFO
   *
   * @param trades - All trades to analyze
   * @param fallbackPrice - Price to use if no buy trades (for display)
   * @returns Weighted average cost of remaining open lots
   */
  calculateAverageCost(trades: Trade[], fallbackPrice: number): number

  /**
   * Calculate total cost basis (avgCost × openQuantity)
   *
   * @param trades - All trades to analyze
   * @returns Total cost basis
   */
  calculateTotalCostBasis(trades: Trade[]): number

  /**
   * Calculate open quantity (buys - sells)
   *
   * @param trades - All trades to analyze
   * @returns Net open quantity
   */
  calculateOpenQuantity(trades: Trade[]): number

  /**
   * Calculate open quantity for a specific instrument
   *
   * @param trades - All trades to analyze
   * @param instrument - Instrument identifier (symbol or OCC)
   * @returns Net open quantity for instrument
   */
  calculateOpenQuantityByInstrument(
    trades: Trade[],
    instrument: string
  ): number

  /**
   * Apply FIFO matching to trades
   *
   * @param trades - All trades to analyze
   * @returns Matched lots with remaining open quantities
   */
  applyFifoMatching(trades: Trade[]): FifoLot[]
}

/**
 * FIFO lot after matching
 */
export interface FifoLot {
  trade_id: string
  original_quantity: number
  remaining_quantity: number
  price: number
  timestamp: Date
  instrument: string
}

// ============================================================================
// P&L Calculator
// ============================================================================

/**
 * P&L Calculator Interface
 *
 * Calculates unrealized and realized P&L.
 */
export interface IPnLCalculator {
  /**
   * Calculate unrealized P&L for a position
   *
   * For stocks: (current_price - avg_cost) × quantity
   * For short puts: (premium_received - current_option_price) × contracts × 100
   *
   * @param position - Position to calculate P&L for
   * @param priceMap - Current prices by instrument
   * @returns Unrealized P&L or null if prices unavailable
   */
  calculateUnrealizedPnL(
    position: { trades: Trade[]; symbol: string },
    priceMap: Map<string, { close_price: number }>
  ): number | null

  /**
   * Calculate realized P&L for closed trades
   *
   * Uses FIFO matching to pair buys with sells.
   *
   * @param trades - All trades to analyze
   * @returns Realized P&L
   */
  calculateRealizedPnL(trades: Trade[]): number

  /**
   * Calculate P&L percentage relative to cost basis
   *
   * @param pnl - P&L amount
   * @param costBasis - Total cost basis
   * @returns Percentage (0.10 = 10%)
   */
  calculatePnLPercentage(pnl: number, costBasis: number): number

  /**
   * Calculate short put unrealized P&L
   *
   * Formula: (premium_received - current_price) × contracts × 100
   *
   * @param premiumReceived - Premium per contract when sold
   * @param currentPrice - Current option price
   * @param contracts - Number of contracts
   * @returns Unrealized P&L
   */
  calculateShortPutUnrealizedPnL(
    premiumReceived: number,
    currentPrice: number,
    contracts: number
  ): number

  /**
   * Calculate short put realized P&L
   *
   * Formula: (sell_price - buy_price) × contracts × 100
   *
   * @param sellPrice - Premium received when sold
   * @param buyPrice - Premium paid to close
   * @param contracts - Number of contracts
   * @returns Realized P&L
   */
  calculateShortPutRealizedPnL(
    sellPrice: number,
    buyPrice: number,
    contracts: number
  ): number
}

// ============================================================================
// Position Status Calculator
// ============================================================================

/**
 * Position Status Calculator Interface
 *
 * Derives position status from trade activity.
 */
export interface IPositionStatusCalculator {
  /**
   * Compute position status from trades
   *
   * - No trades → 'planned'
   * - Net quantity > 0 → 'open'
   * - Net quantity = 0 → 'closed'
   *
   * @param trades - All trades in position
   * @returns Computed status
   */
  computeStatus(trades: Trade[]): 'planned' | 'open' | 'closed'

  /**
   * Check if position can be closed (has open quantity)
   *
   * @param trades - All trades in position
   * @returns true if open quantity > 0
   */
  canClose(trades: Trade[]): boolean

  /**
   * Check if position can receive new trades
   *
   * Positions can always receive trades (even closed ones can be re-opened).
   *
   * @param trades - All trades in position
   * @returns true
   */
  canTrade(trades: Trade[]): boolean
}
