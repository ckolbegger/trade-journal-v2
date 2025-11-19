import type { Trade } from '@/lib/position'
import { PositionService, validateExitTrade } from '@/lib/position'
import { calculateCostBasis } from '@/utils/costBasis'
import { computePositionStatus } from '@/utils/statusComputation'
import { processFIFO, type FIFOResult } from '@/lib/utils/fifo'
import { calculatePlanVsExecution, type PlanVsExecution } from '@/lib/utils/planVsExecution'

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

    // Validate price (allow >= 0 for worthless exits)
    if (trade.price < 0) {
      throw new Error('Trade validation failed: Price must be >= 0')
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

    // Validate trade data (after auto-population)
    this.validateTrade(tradeWithUnderlying)

    // Additional validation for exit trades
    if (tradeWithUnderlying.trade_type === 'sell') {
      validateExitTrade(position, tradeWithUnderlying.quantity, tradeWithUnderlying.price)
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
   * Returns: 'planned' (no trades) | 'open' (net qty > 0) | 'closed' (net qty === 0)
   */
  async computePositionStatus(positionId: string): Promise<'planned' | 'open' | 'closed'> {
    const position = await this.positionService.getById(positionId)
    if (!position) {
      throw new Error(`Position not found: ${positionId}`)
    }
    return computePositionStatus(position.trades)
  }

  /**
   * Calculate FIFO cost basis and P&L for a position
   * Returns detailed breakdown of realized/unrealized P&L
   *
   * @param positionId - Position ID to calculate P&L for
   * @param currentPrice - Current market price for unrealized P&L calculation
   * @returns FIFO calculation result with realized/unrealized P&L breakdown
   */
  async calculateFIFOPnL(positionId: string, currentPrice: number): Promise<FIFOResult> {
    const position = await this.positionService.getById(positionId)
    if (!position) {
      throw new Error(`Position not found: ${positionId}`)
    }
    return processFIFO(position.trades, currentPrice)
  }

  /**
   * Calculate plan vs execution comparison for a closed position
   * Compares planned entry/exit prices against actual execution
   *
   * @param positionId - Closed position ID to analyze
   * @returns Plan vs execution comparison metrics
   * @throws Error if position is not closed or not found
   */
  async calculatePlanVsExecution(positionId: string): Promise<PlanVsExecution> {
    const position = await this.positionService.getById(positionId)
    if (!position) {
      throw new Error(`Position not found: ${positionId}`)
    }

    if (position.status !== 'closed') {
      throw new Error('Cannot calculate plan vs execution for non-closed position')
    }

    // Get current FIFO result for realized P&L
    const fifoResult = processFIFO(position.trades, 0) // currentPrice doesn't matter for closed positions

    return calculatePlanVsExecution(position, fifoResult)
  }

  /**
   * Close the service connection
   */
  close(): void {
    this.positionService.close()
  }
}