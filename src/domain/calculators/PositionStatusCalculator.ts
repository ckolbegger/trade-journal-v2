import type { Trade } from '@/lib/position'
import { CostBasisCalculator } from './CostBasisCalculator'

/**
 * PositionStatusCalculator - Domain calculator for position status
 *
 * Provides pure function to calculate position status from trades array.
 */
export class PositionStatusCalculator {
  /**
   * Compute position status from trades array
   *
   * @param trades - Array of trades for the position
   * @returns 'planned' if no trades, 'closed' if net zero, 'open' otherwise
   */
  static computeStatus(trades: Trade[]): 'planned' | 'open' | 'closed' {
    // Handle null/undefined trades arrays
    if (!trades || trades.length === 0) {
      return 'planned'
    }

    // Calculate net open quantity (buys - sells)
    const openQuantity = CostBasisCalculator.calculateOpenQuantity(trades)

    // Position is closed if net quantity is zero
    if (openQuantity === 0) {
      return 'closed'
    }

    // Otherwise position is open
    return 'open'
  }
}
