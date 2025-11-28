import type { Trade } from '@/lib/position'

/**
 * CostBasisCalculator - Domain calculations for cost basis
 *
 * Provides pure functions for calculating cost-related metrics from trades.
 */
export class CostBasisCalculator {
  /**
   * Calculate average cost per share/contract from trades
   *
   * @param trades - Array of trades
   * @param targetPrice - Fallback price when no trades exist
   * @returns Average cost, or target price if no trades
   */
  static calculateAverageCost(trades: Trade[], targetPrice: number): number {
    if (!trades || trades.length === 0) {
      return targetPrice
    }

    const sum = trades.reduce((total, trade) => total + trade.price, 0)
    return sum / trades.length
  }

  /**
   * Calculate total cost basis (buy trades only)
   *
   * @param trades - Array of trades
   * @returns Total cost basis (sum of price × quantity for buys)
   */
  static calculateTotalCostBasis(trades: Trade[]): number {
    if (!trades || trades.length === 0) {
      return 0
    }

    return trades.reduce((sum, trade) => {
      if (trade.trade_type === 'buy') {
        return sum + (trade.price * trade.quantity)
      }
      return sum
    }, 0)
  }

  /**
   * Calculate open quantity (net position)
   *
   * @param trades - Array of trades
   * @returns Net quantity (buys - sells)
   */
  static calculateOpenQuantity(trades: Trade[]): number {
    if (!trades || trades.length === 0) {
      return 0
    }

    return trades.reduce((total, trade) => {
      return total + (trade.trade_type === 'buy' ? trade.quantity : -trade.quantity)
    }, 0)
  }

  /**
   * Calculate first buy price (Phase 1A simplified cost basis)
   *
   * @param trades - Array of trades
   * @returns Price of first buy trade, or 0 if no buy trades exist
   */
  static calculateFirstBuyPrice(trades: Trade[]): number {
    if (!trades || trades.length === 0) {
      return 0
    }

    const firstBuyTrade = trades.find(trade => trade.trade_type === 'buy')
    return firstBuyTrade ? firstBuyTrade.price : 0
  }
}
