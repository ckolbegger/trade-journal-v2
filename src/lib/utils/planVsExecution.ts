/**
 * Plan vs Execution Analysis
 * Feature: 001-close-position
 *
 * Calculates comparison metrics between planned and actual execution
 * to support behavioral training and learning.
 */

import type { Position } from '@/lib/position'
import type { FIFOResult } from './fifo'

/**
 * Plan vs execution comparison metrics
 * Displayed when position status transitions to 'closed'
 */
export interface PlanVsExecution {
  // Entry Comparison
  /** Planned entry price from position plan */
  targetEntryPrice: number

  /** Actual weighted average entry cost from buy trades */
  actualAvgEntryCost: number

  /** Difference: actual - target (negative = better execution) */
  entryPriceDelta: number

  /** Delta as percentage of target */
  entryPriceDeltaPct: number

  // Exit Comparison
  /** Planned exit price from position plan */
  targetExitPrice: number

  /** Actual weighted average exit price from sell trades */
  actualAvgExitPrice: number

  /** Difference: actual - target (positive = better execution) */
  exitPriceDelta: number

  /** Delta as percentage of target */
  exitPriceDeltaPct: number

  // Overall Performance
  /** Planned profit: (target_exit - target_entry) * target_qty */
  targetProfit: number

  /** Actual realized P&L from FIFO calculation */
  actualProfit: number

  /** Difference: actual - target */
  profitDelta: number

  /** Delta as percentage of target */
  profitDeltaPct: number

  // Execution Quality Assessment
  /** Entry execution quality relative to plan */
  entryExecutionQuality: 'better' | 'worse' | 'onTarget'

  /** Exit execution quality relative to plan */
  exitExecutionQuality: 'better' | 'worse' | 'onTarget'

  /** Overall execution quality */
  overallExecutionQuality: 'better' | 'worse' | 'onTarget'
}

/**
 * Calculate plan vs execution comparison
 *
 * @param position - The closed position to analyze
 * @param fifoResult - FIFO calculation result with realized P&L
 * @returns Comparison metrics
 *
 * Precondition: position.status === 'closed' (net quantity === 0)
 */
export function calculatePlanVsExecution(
  position: Position,
  fifoResult: FIFOResult
): PlanVsExecution {
  const buyTrades = position.trades.filter((t) => t.trade_type === 'buy')
  const sellTrades = position.trades.filter((t) => t.trade_type === 'sell')

  // Calculate weighted averages
  const totalBuyQty = buyTrades.reduce((sum, t) => sum + t.quantity, 0)
  const totalBuyValue = buyTrades.reduce(
    (sum, t) => sum + t.price * t.quantity,
    0
  )
  const actualAvgEntryCost = totalBuyValue / totalBuyQty

  const totalSellQty = sellTrades.reduce((sum, t) => sum + t.quantity, 0)
  const totalSellValue = sellTrades.reduce(
    (sum, t) => sum + t.price * t.quantity,
    0
  )
  const actualAvgExitPrice = totalSellValue / totalSellQty

  // Calculate deltas
  const entryDelta = actualAvgEntryCost - position.target_entry_price
  const exitDelta = actualAvgExitPrice - position.profit_target

  const targetProfit =
    (position.profit_target - position.target_entry_price) *
    position.target_quantity

  const profitDelta = fifoResult.realizedPnL - targetProfit

  // Assess execution quality
  const TOLERANCE = 0.01 // $0.01 tolerance for "on target"

  const entryQuality: PlanVsExecution['entryExecutionQuality'] =
    Math.abs(entryDelta) < TOLERANCE
      ? 'onTarget'
      : entryDelta < 0
        ? 'better' // Paid less than planned
        : 'worse'

  const exitQuality: PlanVsExecution['exitExecutionQuality'] =
    Math.abs(exitDelta) < TOLERANCE
      ? 'onTarget'
      : exitDelta > 0
        ? 'better' // Sold for more than planned
        : 'worse'

  const overallQuality: PlanVsExecution['overallExecutionQuality'] =
    Math.abs(profitDelta) < TOLERANCE * position.target_quantity
      ? 'onTarget'
      : profitDelta > 0
        ? 'better'
        : 'worse'

  return {
    targetEntryPrice: position.target_entry_price,
    actualAvgEntryCost,
    entryPriceDelta: entryDelta,
    entryPriceDeltaPct: (entryDelta / position.target_entry_price) * 100,

    targetExitPrice: position.profit_target,
    actualAvgExitPrice,
    exitPriceDelta: exitDelta,
    exitPriceDeltaPct: (exitDelta / position.profit_target) * 100,

    targetProfit,
    actualProfit: fifoResult.realizedPnL,
    profitDelta,
    profitDeltaPct: (profitDelta / Math.abs(targetProfit)) * 100,

    entryExecutionQuality: entryQuality,
    exitExecutionQuality: exitQuality,
    overallExecutionQuality: overallQuality
  }
}

// Re-export formatter from separate module for backwards compatibility
export { formatPlanVsExecution } from '@/utils/planVsExecutionFormatter'
export type { PlanVsExecutionDisplay } from '@/utils/planVsExecutionFormatter'
