import { describe, it, expect } from 'vitest'
import { formatPlanVsExecution } from '../planVsExecutionFormatter'
import type { PlanVsExecution } from '@/lib/utils/planVsExecution'

describe('formatPlanVsExecution', () => {
  it('should format better entry execution', () => {
    const comparison: PlanVsExecution = {
      targetEntryPrice: 150,
      actualAvgEntryCost: 149.50,
      entryPriceDelta: -0.50,
      entryPriceDeltaPct: -0.33,
      targetExitPrice: 165,
      actualAvgExitPrice: 165,
      exitPriceDelta: 0,
      exitPriceDeltaPct: 0,
      targetProfit: 1500,
      actualProfit: 1550,
      profitDelta: 50,
      profitDeltaPct: 3.33,
      entryExecutionQuality: 'better',
      exitExecutionQuality: 'onTarget',
      overallExecutionQuality: 'better'
    }

    const formatted = formatPlanVsExecution(comparison)

    expect(formatted.entry.target).toBe('$150.00')
    expect(formatted.entry.actual).toBe('$149.50')
    expect(formatted.entry.delta).toContain('$-0.50')
    expect(formatted.entry.delta).toContain('better')
    expect(formatted.entry.quality).toBe('Better than plan')
    expect(formatted.entry.qualityColor).toBe('green')
  })

  it('should format worse exit execution', () => {
    const comparison: PlanVsExecution = {
      targetEntryPrice: 150,
      actualAvgEntryCost: 150,
      entryPriceDelta: 0,
      entryPriceDeltaPct: 0,
      targetExitPrice: 165,
      actualAvgExitPrice: 163,
      exitPriceDelta: -2,
      exitPriceDeltaPct: -1.21,
      targetProfit: 1500,
      actualProfit: 1300,
      profitDelta: -200,
      profitDeltaPct: -13.33,
      entryExecutionQuality: 'onTarget',
      exitExecutionQuality: 'worse',
      overallExecutionQuality: 'worse'
    }

    const formatted = formatPlanVsExecution(comparison)

    expect(formatted.exit.target).toBe('$165.00')
    expect(formatted.exit.actual).toBe('$163.00')
    expect(formatted.exit.delta).toContain('$-2.00')
    expect(formatted.exit.delta).toContain('worse')
    expect(formatted.exit.quality).toBe('Worse than plan')
    expect(formatted.exit.qualityColor).toBe('red')
  })

  it('should format on-target execution', () => {
    const comparison: PlanVsExecution = {
      targetEntryPrice: 100,
      actualAvgEntryCost: 100,
      entryPriceDelta: 0,
      entryPriceDeltaPct: 0,
      targetExitPrice: 110,
      actualAvgExitPrice: 110,
      exitPriceDelta: 0,
      exitPriceDeltaPct: 0,
      targetProfit: 1000,
      actualProfit: 1000,
      profitDelta: 0,
      profitDeltaPct: 0,
      entryExecutionQuality: 'onTarget',
      exitExecutionQuality: 'onTarget',
      overallExecutionQuality: 'onTarget'
    }

    const formatted = formatPlanVsExecution(comparison)

    expect(formatted.entry.quality).toBe('On target')
    expect(formatted.entry.qualityColor).toBe('gray')
    expect(formatted.exit.quality).toBe('On target')
    expect(formatted.exit.qualityColor).toBe('gray')
    expect(formatted.overall.quality).toBe('On target')
    expect(formatted.overall.qualityColor).toBe('gray')
  })

  it('should format overall profit comparison', () => {
    const comparison: PlanVsExecution = {
      targetEntryPrice: 50,
      actualAvgEntryCost: 49.75,
      entryPriceDelta: -0.25,
      entryPriceDeltaPct: -0.5,
      targetExitPrice: 55,
      actualAvgExitPrice: 55.50,
      exitPriceDelta: 0.50,
      exitPriceDeltaPct: 0.91,
      targetProfit: 500,
      actualProfit: 575,
      profitDelta: 75,
      profitDeltaPct: 15,
      entryExecutionQuality: 'better',
      exitExecutionQuality: 'better',
      overallExecutionQuality: 'better'
    }

    const formatted = formatPlanVsExecution(comparison)

    expect(formatted.overall.targetProfit).toBe('$500.00')
    expect(formatted.overall.actualProfit).toBe('$575.00')
    expect(formatted.overall.delta).toContain('+$75.00')
    expect(formatted.overall.delta).toContain('15.0%')
    expect(formatted.overall.quality).toBe('Better than plan')
    expect(formatted.overall.qualityColor).toBe('green')
  })

  it('should handle negative profits correctly', () => {
    const comparison: PlanVsExecution = {
      targetEntryPrice: 150,
      actualAvgEntryCost: 150,
      entryPriceDelta: 0,
      entryPriceDeltaPct: 0,
      targetExitPrice: 145,
      actualAvgExitPrice: 143,
      exitPriceDelta: -2,
      exitPriceDeltaPct: -1.38,
      targetProfit: -500,
      actualProfit: -700,
      profitDelta: -200,
      profitDeltaPct: 40,
      entryExecutionQuality: 'onTarget',
      exitExecutionQuality: 'worse',
      overallExecutionQuality: 'worse'
    }

    const formatted = formatPlanVsExecution(comparison)

    expect(formatted.overall.targetProfit).toBe('$-500.00')
    expect(formatted.overall.actualProfit).toBe('$-700.00')
    expect(formatted.overall.delta).toContain('$-200.00')
  })
})
