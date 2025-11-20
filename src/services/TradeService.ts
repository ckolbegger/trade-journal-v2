import type { Trade } from '@/lib/position'
import { PositionService } from '@/lib/position'
import { calculateCostBasis } from '@/utils/costBasis'
import { TradeValidator } from '@/domain/validators/TradeValidator'
import { PositionStatusComputer } from '@/domain/calculators/PositionStatusComputer'

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
   * Enforces Phase 1A constraint: maximum 1 trade per position
   * Auto-populates underlying field from position.symbol if not provided
   */
  async addTrade(tradeData: Omit<Trade, 'id'>): Promise<Trade[]> {
    // Get the current position first (needed for auto-population)
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

    // Enforce Phase 1A single trade constraint
    if (position.trades.length > 0) {
      throw new Error('Phase 1A allows only one trade per position')
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
      status: PositionStatusComputer.computeStatus(updatedTrades)
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
   */
  async calculateCostBasis(positionId: string): Promise<number> {
    const trades = await this.getTradesByPositionId(positionId)
    return calculateCostBasis(trades)
  }

  /**
   * Compute position status based on trade data
   * Delegates to PositionStatusComputer for status computation
   */
  async computePositionStatus(positionId: string): Promise<'planned' | 'open' | 'closed'> {
    const position = await this.positionService.getById(positionId)
    if (!position) {
      throw new Error(`Position not found: ${positionId}`)
    }
    return PositionStatusComputer.computeStatus(position.trades)
  }

  /**
   * Close the service connection
   */
  close(): void {
    this.positionService.close()
  }
}