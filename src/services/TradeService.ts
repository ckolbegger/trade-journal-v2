import type { Trade } from '@/lib/position'
import { PositionService } from '@/lib/position'
import { TradeValidator } from '@/domain/validators/TradeValidator'
import { PositionStatusCalculator } from '@/domain/calculators/PositionStatusCalculator'
import { CostBasisCalculator } from '@/domain/calculators/CostBasisCalculator'

export class TradeService {
  private positionService: PositionService

  constructor(positionService?: PositionService) {
    // Allow dependency injection for testing
    this.positionService = positionService || new PositionService()
  }

  /**
   * Generate unique ID for trade
   */
  private generateTradeId(): string {
    return `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Add a trade to a position
   * Supports multiple trades per position for position lifecycle management
   * Auto-populates underlying field from position.symbol if not provided
   * Validates exit trades to prevent overselling
   */
  async addTrade(tradeData: Omit<Trade, 'id'>): Promise<Trade[]> {
    // Get the current position first (needed for auto-population and validation)
    const position = await this.positionService.getById(tradeData.position_id)
    if (!position) {
      throw new Error(`Position not found: ${tradeData.position_id}`)
    }

    // Auto-populate underlying from position.symbol if not provided
    // Phase 1A: Simple stock positions use symbol directly
    // Phase 3+: May use explicit underlying for multi-leg positions
    const tradeWithUnderlying = {
      ...tradeData,
      underlying: tradeData.underlying !== undefined ? tradeData.underlying : position.symbol
    }

    // Validate trade data (after auto-population) - delegate to TradeValidator
    TradeValidator.validateTrade(tradeWithUnderlying)

    // Additional validation for exit trades
    if (tradeWithUnderlying.trade_type === 'sell') {
      TradeValidator.validateExitTrade(position, tradeWithUnderlying.quantity, tradeWithUnderlying.price)
    }

    // Create the trade with generated ID
    const trade: Trade = {
      ...tradeWithUnderlying,
      id: this.generateTradeId(),
    }

    // Add trade to position and update status
    const updatedTrades = [...position.trades, trade]
    const updatedPosition = {
      ...position,
      trades: updatedTrades,
      status: PositionStatusCalculator.computeStatus(updatedTrades)
    }

    // Update position with new trade
    await this.positionService.update(updatedPosition)

    // Return the updated trades array
    return updatedPosition.trades
  }

  /**
   * Get trades for a specific position
   */
  async getTradesByPositionId(positionId: string): Promise<Trade[]> {
    const position = await this.positionService.getById(positionId)
    if (!position) {
      throw new Error(`Position not found: ${positionId}`)
    }
    return position.trades
  }

  /**
   * Calculate simple cost basis (Phase 1A: first trade price only)
   * Delegates to CostBasisCalculator for calculation logic
   */
  async calculateCostBasis(positionId: string): Promise<number> {
    const trades = await this.getTradesByPositionId(positionId)
    return CostBasisCalculator.calculateFirstBuyPrice(trades)
  }

  /**
   * Compute position status based on trade data
   * Delegates to PositionStatusCalculator for status computation
   */
  async computePositionStatus(positionId: string): Promise<'planned' | 'open' | 'closed'> {
    const position = await this.positionService.getById(positionId)
    if (!position) {
      throw new Error(`Position not found: ${positionId}`)
    }
    return PositionStatusCalculator.computeStatus(position.trades)
  }

  /**
   * Close the service connection
   */
  close(): void {
    this.positionService.close()
  }
}