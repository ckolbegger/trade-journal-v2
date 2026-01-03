export interface PositionRiskInput {
  strategy_type: 'Long Stock' | 'Short Put'
  target_entry_price?: number
  target_quantity?: number
  profit_target?: number
  stop_loss?: number
  strike_price?: number
  premium_per_contract?: number
}

export interface PositionRiskMetrics {
  totalInvestment: number
  maxProfit: number
  maxLoss: number
  riskRewardRatio: string
}

export class PositionRiskCalculator {
  private static readonly contractMultiplier = 100

  static calculate(input: PositionRiskInput): PositionRiskMetrics {
    if (input.strategy_type === 'Short Put') {
      return this.calculateShortPut(input)
    }
    return this.calculateLongStock(input)
  }

  private static calculateLongStock(input: PositionRiskInput): PositionRiskMetrics {
    const entryPrice = this.asNumber(input.target_entry_price)
    const quantity = this.asNumber(input.target_quantity)
    const profitTarget = this.asNumber(input.profit_target)
    const stopLoss = this.asNumber(input.stop_loss)

    const totalInvestment = entryPrice * quantity
    const maxProfit = (profitTarget - entryPrice) * quantity
    const maxLoss = (entryPrice - stopLoss) * quantity

    return {
      totalInvestment,
      maxProfit,
      maxLoss,
      riskRewardRatio: this.formatRiskReward(maxProfit, maxLoss)
    }
  }

  private static calculateShortPut(input: PositionRiskInput): PositionRiskMetrics {
    const strike = this.asNumber(input.strike_price)
    const contracts = this.asNumber(input.target_quantity)
    const premium = this.asNumber(input.premium_per_contract)

    const totalInvestment = strike * contracts * this.contractMultiplier
    const maxProfit = premium * contracts * this.contractMultiplier
    const maxLoss = (strike - premium) * contracts * this.contractMultiplier

    return {
      totalInvestment,
      maxProfit,
      maxLoss,
      riskRewardRatio: this.formatRiskReward(maxProfit, maxLoss)
    }
  }

  private static asNumber(value?: number): number {
    return Number.isFinite(value as number) ? (value as number) : 0
  }

  private static formatRiskReward(maxProfit: number, maxLoss: number): string {
    if (maxLoss <= 0 || maxProfit <= 0) {
      return '0:0'
    }
    const ratio = maxProfit / maxLoss
    if (!Number.isFinite(ratio) || ratio <= 0) {
      return '0:0'
    }
    const rounded = Math.round(ratio * 100) / 100
    const formatted = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2)
    return `1:${formatted}`
  }
}
