import type { Trade } from '@/lib/position'

/**
 * Compute position status from trades array
 * Status derived dynamically from trades array, never stored
 *
 * @param trades - Array of trades for the position
 * @returns 'planned' if no trades, 'open' if net qty > 0, 'closed' if net qty === 0
 */
export function computePositionStatus(trades: Trade[]): 'planned' | 'open' | 'closed' {
  // Handle null/undefined trades arrays
  if (!trades || trades.length === 0) {
    return 'planned'
  }

  // Calculate net quantity (buys - sells)
  const netQuantity = trades.reduce((net, trade) => {
    return trade.trade_type === 'buy'
      ? net + trade.quantity
      : net - trade.quantity
  }, 0)

  // Return 'closed' if net quantity is 0, otherwise 'open'
  return netQuantity === 0 ? 'closed' : 'open'
}
