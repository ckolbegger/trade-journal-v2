import { describe, it, expect } from 'vitest'
import { PositionRiskCalculator } from '../calculators/PositionRiskCalculator'

describe('PositionRiskCalculator', () => {
  it('should calculate risk metrics for long stock plans', () => {
    const metrics = PositionRiskCalculator.calculate({
      strategy_type: 'Long Stock',
      target_entry_price: 150,
      target_quantity: 100,
      profit_target: 165,
      stop_loss: 135
    })

    expect(metrics.totalInvestment).toBe(15000)
    expect(metrics.maxProfit).toBe(1500)
    expect(metrics.maxLoss).toBe(1500)
    expect(metrics.riskRewardRatio).toBe('1:1')
  })

  it('should calculate risk metrics for short put plans', () => {
    const metrics = PositionRiskCalculator.calculate({
      strategy_type: 'Short Put',
      target_quantity: 1,
      strike_price: 100,
      premium_per_contract: 20
    })

    expect(metrics.totalInvestment).toBe(10000)
    expect(metrics.maxProfit).toBe(2000)
    expect(metrics.maxLoss).toBe(8000)
    expect(metrics.riskRewardRatio).toBe('1:0.25')
  })

  it('should return zeros when inputs are missing', () => {
    const metrics = PositionRiskCalculator.calculate({
      strategy_type: 'Long Stock'
    })

    expect(metrics.totalInvestment).toBe(0)
    expect(metrics.maxProfit).toBe(0)
    expect(metrics.maxLoss).toBe(0)
    expect(metrics.riskRewardRatio).toBe('0:0')
  })
})
