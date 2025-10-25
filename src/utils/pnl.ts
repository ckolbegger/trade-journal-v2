import type { Trade, Position } from '@/lib/position'
import type { PriceHistory } from '@/types/priceHistory'

/**
 * P&L Calculation Result for Progress Indicators
 */
export interface ProgressCalculation {
  percentProgress: number
  distanceToStop: number
  distanceToTarget: number
  capturedProfit: number
}

/**
 * Calculate unrealized P&L for a single trade
 *
 * @param trade - The trade to calculate P&L for
 * @param priceHistory - Current price data for the underlying
 * @returns Unrealized P&L in dollars (0 for sell trades)
 *
 * Formula:
 * - Buy trade: (current_price - execution_price) × quantity
 * - Sell trade: $0 (already realized)
 */
export function calculateTradePnL(trade: Trade, priceHistory: PriceHistory): number {
  // Sell trades have no unrealized P&L (already realized at execution)
  if (trade.trade_type === 'sell') {
    return 0
  }

  // Buy trade: Calculate unrealized P&L using close price
  const currentPrice = priceHistory.close
  const pnl = (currentPrice - trade.price) * trade.quantity

  return pnl
}

/**
 * Calculate total unrealized P&L for a position
 *
 * @param position - The position containing trades
 * @param priceMap - Map of underlying -> PriceHistory for all underlyings in position
 * @returns Total unrealized P&L in dollars, or null if no price data available
 *
 * Aggregates P&L from all trades in the position.
 * Trades without price data are skipped.
 */
export function calculatePositionPnL(
  position: Position,
  priceMap: Map<string, PriceHistory>
): number | null {
  // Empty position has no P&L
  if (position.trades.length === 0) {
    return null
  }

  let totalPnL = 0
  let hasPriceData = false

  for (const trade of position.trades) {
    const priceHistory = priceMap.get(trade.underlying)

    // Skip trades without price data
    if (!priceHistory) {
      continue
    }

    hasPriceData = true
    totalPnL += calculateTradePnL(trade, priceHistory)
  }

  // If no price data was available for any trade, return null
  if (!hasPriceData) {
    return null
  }

  return totalPnL
}

/**
 * Calculate P&L percentage relative to cost basis
 *
 * @param pnl - Dollar amount of P&L
 * @param costBasis - Total cost basis of the position
 * @returns Percentage gain/loss, or 0 if cost basis is zero
 *
 * Formula: (P&L / cost_basis) × 100
 */
export function calculatePnLPercentage(pnl: number, costBasis: number): number {
  // Handle zero cost basis without division by zero
  if (costBasis === 0) {
    return 0
  }

  const percentage = (pnl / costBasis) * 100
  return parseFloat(percentage.toFixed(2))
}

/**
 * Get price map for all underlyings in a position
 *
 * @param position - The position to fetch prices for
 * @param getLatestPrices - Function to fetch latest prices (injected for testing)
 * @returns Map of underlying -> PriceHistory
 *
 * Phase 1A: One underlying per position
 * Phase 3+: Multiple underlyings (covered calls, multi-leg strategies)
 */
export async function getPriceMapForPosition(
  position: Position,
  getLatestPrices: (underlyings: string[]) => Promise<Map<string, PriceHistory>>
): Promise<Map<string, PriceHistory>> {
  // No trades = no underlyings to fetch
  if (position.trades.length === 0) {
    return new Map()
  }

  // Get unique underlyings from all trades
  const underlyings = Array.from(
    new Set(position.trades.map(trade => trade.underlying))
  )

  // Fetch latest prices for all underlyings
  const priceMap = await getLatestPrices(underlyings)

  return priceMap
}

/**
 * Calculate position progress from stop loss to profit target
 *
 * @param position - The position with stop_loss and profit_target
 * @param currentPrice - Current market price
 * @returns Progress calculation including percentage and distances
 *
 * Used for visual progress indicators showing where current price
 * sits relative to risk parameters.
 */
export function calculateProgressToTarget(
  position: Position,
  currentPrice: number
): ProgressCalculation {
  const { stop_loss, profit_target } = position

  // Calculate range from stop to target
  const range = profit_target - stop_loss

  // Calculate distance from stop loss
  const distanceFromStop = currentPrice - stop_loss

  // Calculate percentage progress
  const percentProgress = (distanceFromStop / range) * 100

  // Calculate distances
  const distanceToStop = currentPrice - stop_loss
  const distanceToTarget = profit_target - currentPrice

  return {
    percentProgress: parseFloat(percentProgress.toFixed(2)),
    distanceToStop: parseFloat(distanceToStop.toFixed(2)),
    distanceToTarget: parseFloat(distanceToTarget.toFixed(2)),
    capturedProfit: parseFloat(percentProgress.toFixed(2))
  }
}
