import type { Trade } from '@/lib/trade'

/**
 * Compute position status from trades array
 * Phase 1A: Status derived dynamically from trades array, not stored
 *
 * @param trades - Array of trades for the position
 * @returns 'planned' if no trades exist, 'open' if any trades exist
 */
export function computePositionStatus(trades: Trade[]): 'planned' | 'open' {
  // Handle null/undefined trades arrays
  if (!trades || trades.length === 0) {
    return 'planned'
  }

  // If any trades exist, status is 'open'
  // Phase 1A: No 'closed' status yet
  return 'open'
}
