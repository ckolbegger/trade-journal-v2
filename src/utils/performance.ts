import type { Trade, Position } from '@/lib/position'
import type { PriceHistory } from '@/types/priceHistory'

/**
 * Creates a price map from price history for efficient lookups
 * @param priceHistories Array of price history records
 * @returns Map of underlying -> most recent close price
 */
export function createPriceMap(priceHistories: PriceHistory[]): Map<string, number> {
  const priceMap = new Map<string, number>()

  // Sort by date descending to get most recent first
  const sortedHistories = [...priceHistories].sort((a, b) => b.date.localeCompare(a.date))

  // For each underlying, keep only the most recent price
  for (const history of sortedHistories) {
    if (!priceMap.has(history.underlying)) {
      priceMap.set(history.underlying, history.close)
    }
  }

  return priceMap
}

/**
 * Calculates P&L for a single trade
 * @param trade The trade to calculate P&L for
 * @param currentPrice Current price of the underlying
 * @returns P&L amount
 */
export function calculateTradePnL(trade: Trade, currentPrice: number): number {
  if (!trade || currentPrice === undefined || currentPrice === null) {
    return 0.00
  }

  const { trade_type, quantity, price } = trade

  if (trade_type === 'buy') {
    // Long position: P&L = (currentPrice - entryPrice) * quantity
    return (currentPrice - price) * quantity
  } else if (trade_type === 'sell') {
    // Short position: P&L = (entryPrice - currentPrice) * quantity
    return (price - currentPrice) * quantity
  }

  return 0.00
}

/**
 * Calculates total P&L for a position (sum of all trade P&L)
 * @param position The position to calculate P&L for
 * @param priceMap Map of current prices for all underlyings
 * @returns Total P&L amount
 */
export function calculatePositionPnL(position: Position, priceMap: Map<string, number>): number {
  if (!position || !priceMap) {
    return 0.00
  }

  if (!position.trades || position.trades.length === 0) {
    return 0.00
  }

  let totalPnL = 0.00

  for (const trade of position.trades) {
    const currentPrice = priceMap.get(trade.underlying)
    if (currentPrice !== undefined) {
      totalPnL += calculateTradePnL(trade, currentPrice)
    }
  }

  return totalPnL
}

/**
 * Calculates P&L as percentage of cost basis
 * @param position The position to calculate percentage for
 * @param priceMap Map of current prices for all underlyings
 * @returns P&L percentage
 */
export function calculatePnLPercentage(position: Position, priceMap: Map<string, number>): number {
  if (!position || !priceMap) {
    return 0.00
  }

  if (!position.trades || position.trades.length === 0) {
    return 0.00
  }

  // Calculate total cost basis (total spent on trades)
  let totalCostBasis = 0.00
  for (const trade of position.trades) {
    if (trade.trade_type === 'buy') {
      totalCostBasis += trade.price * trade.quantity
    } else if (trade.trade_type === 'sell') {
      totalCostBasis -= trade.price * trade.quantity
    }
  }

  // Calculate current market value
  let currentMarketValue = 0.00
  for (const trade of position.trades) {
    const currentPrice = priceMap.get(trade.underlying)
    if (currentPrice !== undefined) {
      if (trade.trade_type === 'buy') {
        currentMarketValue += currentPrice * trade.quantity
      } else if (trade.trade_type === 'sell') {
        currentMarketValue -= currentPrice * trade.quantity
      }
    }
  }

  // Calculate percentage P&L
  if (totalCostBasis === 0) {
    return 0.00 // Division by zero protection
  }

  const pnl = currentMarketValue - totalCostBasis
  const percentage = (pnl / Math.abs(totalCostBasis)) * 100

  return percentage
}

/**
 * Calculates progress towards profit target (0-100%)
 * @param position The position to calculate progress for
 * @param priceMap Map of current prices for all underlyings
 * @returns Progress percentage (can be negative if below entry)
 */
export function calculateProgressToTarget(position: Position, priceMap: Map<string, number>): number {
  if (!position || !priceMap) {
    return 0.00
  }

  const { target_entry_price, profit_target } = position

  // Handle edge cases
  if (target_entry_price === undefined || profit_target === undefined) {
    return 0.00
  }

  const priceRange = profit_target - target_entry_price
  if (priceRange === 0) {
    return 0.00 // Division by zero protection
  }

  // Get current price for position's underlying
  const currentPrice = priceMap.get(position.symbol)
  if (currentPrice === undefined) {
    return 0.00
  }

  // Calculate progress
  const priceProgress = currentPrice - target_entry_price
  const progress = (priceProgress / priceRange) * 100

  // Round to 2 decimal places
  const roundedProgress = Math.round(progress * 100) / 100

  // Cap at 100% maximum progress (don't exceed target)
  return Math.min(100.00, Math.max(roundedProgress, -100.00))
}