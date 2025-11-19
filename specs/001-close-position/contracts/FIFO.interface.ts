/**
 * FIFO Cost Basis Calculation Contracts
 * Feature: 001-close-position
 * Date: 2025-11-09
 *
 * Defines interfaces and algorithms for First-In-First-Out cost basis tracking
 * Matches industry-standard brokerage P&L calculations and IRS tax reporting
 */

import type { Trade } from './Trade.interface'

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

/**
 * Calculate P&L for multi-leg positions (options future-proofing)
 * Groups trades by underlying and processes FIFO separately for each
 *
 * @param trades - All trades for the position
 * @param currentPrices - Map of underlying → current price
 * @returns Map of underlying → FIFO result
 */
export function processFIFOByUnderlying(
  trades: Trade[],
  currentPrices: Map<string, number>
): Map<string, FIFOResult> {
  // Group trades by underlying
  const tradesByUnderlying = new Map<string, Trade[]>()
  for (const trade of trades) {
    if (!tradesByUnderlying.has(trade.underlying)) {
      tradesByUnderlying.set(trade.underlying, [])
    }
    tradesByUnderlying.get(trade.underlying)!.push(trade)
  }

  // Process FIFO for each underlying separately
  const results = new Map<string, FIFOResult>()
  tradesByUnderlying.forEach((trades, underlying) => {
    const currentPrice = currentPrices.get(underlying) ?? 0
    results.set(underlying, processFIFO(trades, currentPrice))
  })

  return results
}

/**
 * Aggregate P&L across all underlyings (for multi-leg positions)
 *
 * @param fifoResults - FIFO results per underlying
 * @returns Aggregated totals
 */
export function aggregateFIFOResults(
  fifoResults: Map<string, FIFOResult>
): Pick<FIFOResult, 'realizedPnL' | 'unrealizedPnL' | 'totalPnL'> {
  let realizedPnL = 0
  let unrealizedPnL = 0

  fifoResults.forEach((result) => {
    realizedPnL += result.realizedPnL
    unrealizedPnL += result.unrealizedPnL
  })

  return {
    realizedPnL,
    unrealizedPnL,
    totalPnL: realizedPnL + unrealizedPnL
  }
}
