import type { Trade, Position } from '@/lib/position'
import type { PriceHistory } from '@/types/priceHistory'

/**
 * PnLCalculator - Domain calculations for profit and loss
 *
 * Provides pure functions for calculating P&L metrics from trades and prices.
 */
export class PnLCalculator {
  /**
   * Calculate unrealized P&L for a single trade
   *
   * @param trade - The trade to calculate P&L for
   * @param priceHistory - Current price data for the underlying
   * @returns Unrealized P&L in dollars (0 for sell trades)
   */
  static calculateTradePnL(trade: Trade, priceHistory: PriceHistory): number {
    // Sell trades have no unrealized P&L (already realized at execution)
    if (trade.trade_type === 'sell') {
      return 0
    }

    // Buy trade: Calculate unrealized P&L using close price
    const currentPrice = priceHistory.close
    return (currentPrice - trade.price) * trade.quantity
  }

  /**
   * Calculate total position P&L from all trades
   *
   * @param position - The position containing trades
   * @param priceMap - Map of underlying -> PriceHistory
   * @returns Total P&L in dollars, or null if no price data
   */
  static calculatePositionPnL(
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
      totalPnL += this.calculateTradePnL(trade, priceHistory)
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
   * @param costBasis - Total cost basis
   * @returns Percentage gain/loss
   */
  static calculatePnLPercentage(pnl: number, costBasis: number): number {
    // Handle zero cost basis without division by zero
    if (costBasis === 0) {
      return 0
    }

    const percentage = (pnl / costBasis) * 100
    return parseFloat(percentage.toFixed(2))
  }
}
