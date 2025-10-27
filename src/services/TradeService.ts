import type { Trade } from '@/lib/position'
import { PositionService } from '@/lib/position'
import { calculateCostBasis } from '@/utils/costBasis'
import { computePositionStatus } from '@/utils/statusComputation'

export class TradeService {
  private positionService: PositionService

  constructor(positionService?: PositionService) {
    // Allow dependency injection for testing
    this.positionService = positionService || new PositionService()
  }

  /**
   * Validate trade data before processing
   */
  private validateTrade(trade: Omit<Trade, 'id'>): void {
    // Validate required fields
    if (!trade.position_id || !trade.trade_type ||
        trade.quantity === undefined || trade.price === undefined ||
        !trade.timestamp) {
      throw new Error('Trade validation failed: Missing required fields')
    }

    // Validate trade_type
    if (trade.trade_type !== 'buy' && trade.trade_type !== 'sell') {
      throw new Error('Trade validation failed: Invalid trade type')
    }

    // Validate quantity
    if (trade.quantity <= 0) {
      throw new Error('Trade validation failed: Quantity must be positive')
    }

    // Validate price
    if (trade.price <= 0) {
      throw new Error('Trade validation failed: Price must be positive')
    }

    // Validate timestamp
    if (trade.timestamp instanceof Date && isNaN(trade.timestamp.getTime())) {
      throw new Error('Trade validation failed: Invalid timestamp')
    }

    // Validate underlying (if provided, must not be empty)
    if (trade.underlying !== undefined && trade.underlying.trim() === '') {
      throw new Error('Trade validation failed: underlying cannot be empty')
    }
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

    // Validate trade data (after auto-population)
    this.validateTrade(tradeWithUnderlying)

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
      status: computePositionStatus(updatedTrades)
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
   * Phase 1A: 'planned' (no trades) | 'open' (has trades)
   */
  async computePositionStatus(positionId: string): Promise<'planned' | 'open'> {
    const position = await this.positionService.getById(positionId)
    if (!position) {
      throw new Error(`Position not found: ${positionId}`)
    }
    return computePositionStatus(position.trades)
  }

  /**
   * Close the service connection
   */
  close(): void {
    this.positionService.close()
  }
}