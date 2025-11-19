/**
 * FIFO Cost Basis Calculation
 * Feature: 001-close-position
 *
 * Implements First-In-First-Out algorithm for matching exit trades
 * to entry trades and calculating realized/unrealized P&L.
 *
 * Matches industry-standard brokerage P&L calculations and IRS tax reporting.
 */

import type { Trade } from '@/lib/position'

/**
 * Result of FIFO cost basis calculation for a position
 */
export interface FIFOResult {
  /** Per-trade P&L breakdown */
  tradePnL: TradePnL[]

  /** Total realized P&L from all exit trades */
  realizedPnL: number

  /** Unrealized P&L from remaining open quantity at current price */
  unrealizedPnL: number

  /** Total P&L (realized + unrealized) */
  totalPnL: number

  /** Remaining open quantity after all exits */
  openQuantity: number

  /** Weighted average cost of open quantity */
  avgOpenCost: number

  /** True if position is fully closed (openQuantity === 0) */
  isFullyClosed: boolean
}

/**
 * P&L breakdown for a single trade
 */
export interface TradePnL {
  /** Trade ID this P&L is calculated from */
  tradeId: string

  /** Realized P&L for this trade (only for sell trades) */
  pnl: number

  /** Quantity that was matched in FIFO calculation */
  matchedQuantity: number

  /** Matched entry trades (for sell trades) */
  matchedEntries?: MatchedEntry[]
}

/**
 * Entry trade matched against an exit trade
 */
export interface MatchedEntry {
  /** Entry trade ID that was matched */
  entryTradeId: string

  /** Quantity matched from this entry */
  matchedQuantity: number

  /** Entry price for this match */
  entryPrice: number

  /** Exit price for this match */
  exitPrice: number

  /** P&L for this match: (exitPrice - entryPrice) * matchedQuantity */
  pnl: number
}

/**
 * FIFO processing state (internal to algorithm)
 */
interface FIFOProcessingState {
  /** Entry trades with remaining open quantity */
  openEntries: Array<{
    trade: Trade
    remainingQuantity: number
  }>

  /** Accumulated realized P&L */
  totalRealizedPnL: number

  /** Trade-level P&L results */
  tradePnLResults: TradePnL[]
}

/**
 * Process trades through FIFO algorithm to calculate cost basis and P&L
 *
 * @param trades - All trades for the position (both buy and sell)
 * @param currentPrice - Current market price for unrealized P&L calculation
 * @returns FIFO calculation result
 *
 * Algorithm:
 * 1. Sort trades by timestamp (oldest first)
 * 2. For each buy trade: add to open entries
 * 3. For each sell trade:
 *    - Match against oldest open entry trades
 *    - Calculate realized P&L for each match
 *    - Update remaining quantities
 * 4. Calculate unrealized P&L from remaining open entries
 */
export function processFIFO(trades: Trade[], currentPrice: number): FIFOResult {
  // Handle empty trades array
  if (!trades || trades.length === 0) {
    return {
      tradePnL: [],
      realizedPnL: 0,
      unrealizedPnL: 0,
      totalPnL: 0,
      openQuantity: 0,
      avgOpenCost: 0,
      isFullyClosed: true
    }
  }

  // Sort trades by timestamp (FIFO ordering)
  const sortedTrades = [...trades].sort((a, b) =>
    a.timestamp.getTime() - b.timestamp.getTime()
  )

  // Initialize processing state
  const state: FIFOProcessingState = {
    openEntries: [],
    totalRealizedPnL: 0,
    tradePnLResults: []
  }

  // Process each trade sequentially
  for (const trade of sortedTrades) {
    if (trade.trade_type === 'buy') {
      processBuyTrade(trade, state)
    } else {
      processSellTrade(trade, state)
    }
  }

  // Calculate final results
  const openQuantity = state.openEntries.reduce(
    (sum, entry) => sum + entry.remainingQuantity,
    0
  )

  const avgOpenCost =
    openQuantity > 0
      ? state.openEntries.reduce(
          (sum, entry) => sum + entry.trade.price * entry.remainingQuantity,
          0
        ) / openQuantity
      : 0

  const unrealizedPnL =
    openQuantity > 0 ? (currentPrice - avgOpenCost) * openQuantity : 0

  return {
    tradePnL: state.tradePnLResults,
    realizedPnL: state.totalRealizedPnL,
    unrealizedPnL,
    totalPnL: state.totalRealizedPnL + unrealizedPnL,
    openQuantity,
    avgOpenCost,
    isFullyClosed: openQuantity === 0
  }
}

/**
 * Process a buy trade (add to open entries)
 */
function processBuyTrade(trade: Trade, state: FIFOProcessingState): void {
  state.openEntries.push({
    trade,
    remainingQuantity: trade.quantity
  })

  // Buy trades don't generate P&L (entry only)
  state.tradePnLResults.push({
    tradeId: trade.id,
    pnl: 0,
    matchedQuantity: 0
  })
}

/**
 * Process a sell trade (match against oldest entries, calculate P&L)
 */
function processSellTrade(trade: Trade, state: FIFOProcessingState): void {
  let remainingSellQuantity = trade.quantity
  const matchedEntries: MatchedEntry[] = []
  let tradeTotalPnL = 0

  // Match against oldest open entries first (FIFO)
  while (remainingSellQuantity > 0 && state.openEntries.length > 0) {
    const oldestEntry = state.openEntries[0]
    const matchQuantity = Math.min(
      remainingSellQuantity,
      oldestEntry.remainingQuantity
    )

    // Calculate P&L for this match
    const matchPnL = (trade.price - oldestEntry.trade.price) * matchQuantity

    matchedEntries.push({
      entryTradeId: oldestEntry.trade.id,
      matchedQuantity: matchQuantity,
      entryPrice: oldestEntry.trade.price,
      exitPrice: trade.price,
      pnl: matchPnL
    })

    tradeTotalPnL += matchPnL
    remainingSellQuantity -= matchQuantity
    oldestEntry.remainingQuantity -= matchQuantity

    // Remove entry if fully matched
    if (oldestEntry.remainingQuantity === 0) {
      state.openEntries.shift()
    }
  }

  // Record trade P&L
  state.tradePnLResults.push({
    tradeId: trade.id,
    pnl: tradeTotalPnL,
    matchedQuantity: trade.quantity,
    matchedEntries
  })

  state.totalRealizedPnL += tradeTotalPnL
}
