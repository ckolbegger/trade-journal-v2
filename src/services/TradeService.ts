import type { Position } from '@/lib/position'
import type { PositionService } from '@/lib/position'
import type { Trade } from '@/lib/trade'

export class TradeService {
  constructor(private positionService: PositionService) {}

  async addTrade(
    positionId: string,
    tradeData: {
      trade_type: 'buy' | 'sell'
      quantity: number
      price: number
      timestamp: Date
      notes?: string
    }
  ): Promise<Position> {
    // Validate trade_type
    if (tradeData.trade_type !== 'buy' && tradeData.trade_type !== 'sell') {
      throw new Error('trade_type must be buy or sell')
    }

    // Validate quantity
    if (tradeData.quantity <= 0) {
      throw new Error('quantity must be positive')
    }

    // Validate price
    if (tradeData.price <= 0) {
      throw new Error('price must be positive')
    }

    // Validate timestamp is not in the future
    const now = new Date()
    if (tradeData.timestamp > now) {
      throw new Error('timestamp cannot be in the future')
    }

    // Get the position
    const position = await this.positionService.getById(positionId)
    if (!position) {
      throw new Error(`Position not found: ${positionId}`)
    }

    // Enforce Phase 1A single trade limitation
    if (position.trades.length > 0) {
      throw new Error('Phase 1A limitation: only one trade per position allowed')
    }

    // Generate unique ID for the trade
    const tradeId = `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create the trade object
    const trade: Trade = {
      id: tradeId,
      trade_type: tradeData.trade_type,
      quantity: tradeData.quantity,
      price: tradeData.price,
      timestamp: tradeData.timestamp,
      notes: tradeData.notes
    }

    // Add trade to position's trades array
    position.trades.push(trade)

    // Update position in database
    await this.positionService.update(position)

    return position
  }
}
