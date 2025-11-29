/**
 * Plan vs Execution Formatter
 * Feature: 001-close-position
 *
 * Formats plan vs execution comparison metrics for UI display.
 * Separated from calculation logic for single responsibility.
 */

import type { PlanVsExecution } from '@/lib/utils/planVsExecution'

/**
 * Formatted display strings for plan vs execution comparison
 */
export interface PlanVsExecutionDisplay {
  /** Entry section */
  entry: {
    target: string // e.g., "$50.00"
    actual: string // e.g., "$49.75"
    delta: string // e.g., "-$0.25 (0.5% better)"
    quality: string // e.g., "Better than plan"
    qualityColor: 'green' | 'red' | 'gray'
  }

  /** Exit section */
  exit: {
    target: string
    actual: string
    delta: string
    quality: string
    qualityColor: 'green' | 'red' | 'gray'
  }

  /** Overall section */
  overall: {
    targetProfit: string // e.g., "+$500.00"
    actualProfit: string // e.g., "+$525.00"
    delta: string // e.g., "+$25.00 (5% better)"
    quality: string
    qualityColor: 'green' | 'red' | 'gray'
  }
}

/**
 * Format plan vs execution metrics for UI display
 *
 * @param comparison - Calculated comparison metrics
 * @returns Formatted display strings
 */
export function formatPlanVsExecution(
  comparison: PlanVsExecution
): PlanVsExecutionDisplay {
  const formatPrice = (price: number) => `$${price.toFixed(2)}`

  const formatDelta = (delta: number, pct: number, isBetter: boolean) => {
    const sign = delta > 0 ? '+' : ''
    const quality = isBetter ? 'better' : 'worse'
    return `${sign}${formatPrice(delta)} (${pct.toFixed(1)}% ${quality})`
  }

  const qualityColor = (
    quality: 'better' | 'worse' | 'onTarget'
  ): 'green' | 'red' | 'gray' => {
    switch (quality) {
      case 'better':
        return 'green'
      case 'worse':
        return 'red'
      default:
        return 'gray'
    }
  }

  const qualityText = (quality: 'better' | 'worse' | 'onTarget'): string => {
    switch (quality) {
      case 'better':
        return 'Better than plan'
      case 'worse':
        return 'Worse than plan'
      default:
        return 'On target'
    }
  }

  return {
    entry: {
      target: formatPrice(comparison.targetEntryPrice),
      actual: formatPrice(comparison.actualAvgEntryCost),
      delta: formatDelta(
        comparison.entryPriceDelta,
        comparison.entryPriceDeltaPct,
        comparison.entryExecutionQuality === 'better'
      ),
      quality: qualityText(comparison.entryExecutionQuality),
      qualityColor: qualityColor(comparison.entryExecutionQuality)
    },

    exit: {
      target: formatPrice(comparison.targetExitPrice),
      actual: formatPrice(comparison.actualAvgExitPrice),
      delta: formatDelta(
        comparison.exitPriceDelta,
        comparison.exitPriceDeltaPct,
        comparison.exitExecutionQuality === 'better'
      ),
      quality: qualityText(comparison.exitExecutionQuality),
      qualityColor: qualityColor(comparison.exitExecutionQuality)
    },

    overall: {
      targetProfit: formatPrice(comparison.targetProfit),
      actualProfit: formatPrice(comparison.actualProfit),
      delta: formatDelta(
        comparison.profitDelta,
        comparison.profitDeltaPct,
        comparison.overallExecutionQuality === 'better'
      ),
      quality: qualityText(comparison.overallExecutionQuality),
      qualityColor: qualityColor(comparison.overallExecutionQuality)
    }
  }
}
