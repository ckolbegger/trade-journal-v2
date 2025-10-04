import type { Trade } from '@/lib/position'

/**
 * Calculate cost basis from trades array
 * Phase 1A: Simple cost basis = first buy trade price only (no FIFO complexity)
 *
 * @param trades - Array of trades for the position
 * @returns Cost basis price per share/contract, or 0 if no buy trades exist
 */
export function calculateCostBasis(trades: Trade[]): number {
  // Return 0 for empty trades array
  if (!trades || trades.length === 0) {
    return 0
  }

  // Find first buy trade
  const firstBuyTrade = trades.find(trade => trade.trade_type === 'buy')

  // Return the price of the first buy trade, or 0 if no buy trades exist
  return firstBuyTrade ? firstBuyTrade.price : 0
}
