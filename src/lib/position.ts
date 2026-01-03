import { PositionValidator } from '@/domain/validators/PositionValidator'
import { PositionStatusCalculator } from '@/domain/calculators/PositionStatusCalculator'
import { CostBasisCalculator } from '@/domain/calculators/CostBasisCalculator'
import { PnLCalculator } from '@/domain/calculators/PnLCalculator'
import type { PriceHistory } from '@/types/priceHistory'

/**
 * Position metrics calculated from trades and current prices
 */
export interface PositionMetrics {
  avgCost: number
  costBasis: number
  openQuantity: number
  pnl: number | null
  pnlPercentage: number | undefined
}

/**
 * Calculate current open quantity from trades
 *
 * @param trades - All trades for the position
 * @returns Net quantity (buys - sells)
 */
export function calculateOpenQuantity(trades: Trade[]): number {
  return trades.reduce((net, trade) => {
    return trade.trade_type === 'buy'
      ? net + trade.quantity
      : net - trade.quantity
  }, 0)
}

// Trade Interface - Individual trade execution within a position
export interface Trade {
  id: string
  position_id: string
  trade_type: 'buy' | 'sell'
  quantity: number
  price: number
  timestamp: Date
  notes?: string
  /**
   * The underlying instrument identifier for this trade
   * - Stock: Ticker symbol (e.g., "AAPL", "TSLA")
   * - Option: OCC symbol format (e.g., "AAPL  250117C00150000")
   *
   * Phase 1A: Auto-populated from position.symbol
   * Phase 3+: Enables multi-leg positions with different underlyings
   *
   * Links to PriceHistory.underlying for price lookups and P&L calculations.
   */
  underlying: string

  // Option-specific fields (optional, only for option trades)
  /**
   * Option action: STO (Sell to Open), BTC (Buy to Close)
   * Only populated for option trades
   */
  action?: OptionAction

  /**
   * OCC symbol for the option contract
   * Format: SYMBOL YYMMDDX00000000 (e.g., "AAPL  250117P00145000")
   * Only populated for option trades
   */
  occ_symbol?: string

  /**
   * Type of option: call or put
   * Only populated for option trades
   */
  option_type?: OptionType

  /**
   * Strike price of the option contract
   * Only populated for option trades
   */
  strike_price?: number

  /**
   * Expiration date of the option contract
   * Only populated for option trades
   */
  expiration_date?: Date

  /**
   * Number of option contracts (1 contract = 100 shares)
   * Only populated for option trades
   */
  contract_quantity?: number

  /**
   * Price of the underlying stock at the time of the option trade
   * Used for intrinsic/extrinsic value calculations
   * Only populated for option trades
   */
  underlying_price_at_trade?: number

  /**
   * ID of stock position created by option assignment
   * Only populated for assignment-related trades
   */
  created_stock_position_id?: string

  /**
   * Adjustment to cost basis for assignment scenarios
   * Premium received/paid affects the cost basis of assigned stock
   * Only populated for assignment-related trades
   */
  cost_basis_adjustment?: number
}

// Validation Error - Domain-specific errors for position/trade operations
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Validate an exit trade against position state
 *
 * @param position - The position being exited
 * @param exitQuantity - Quantity being sold
 * @param exitPrice - Exit price per share/contract
 * @throws ValidationError if validation fails
 *
 * Validation rules:
 * - Position must have status 'open' (not 'planned' or 'closed')
 * - Exit quantity must not exceed current open quantity
 * - Exit price must be >= 0 (allows worthless exits)
 */
export function validateExitTrade(
  position: Position,
  exitQuantity: number,
  exitPrice: number
): void {
  // Prevent exits from planned positions (no trades yet)
  if (position.status === 'planned') {
    throw new ValidationError(
      'Cannot exit a planned position. Add an entry trade first.'
    )
  }

  // Prevent exits from already closed positions
  if (position.status === 'closed') {
    throw new ValidationError(
      'Cannot exit a closed position (net quantity is already 0).'
    )
  }

  // Calculate current open quantity
  const openQuantity = calculateOpenQuantity(position.trades)

  // Prevent overselling
  if (exitQuantity > openQuantity) {
    throw new ValidationError(
      `Exit quantity (${exitQuantity}) exceeds open quantity (${openQuantity}).`
    )
  }

  // Validate exit price (allow >= 0 for worthless exits)
  if (exitPrice < 0) {
    throw new ValidationError(
      'Exit price must be >= 0.'
    )
  }
}

// Type Definitions for Strategy and Trade Classification
export type StrategyType = 'Long Stock' | 'Short Put'
export type TradeKind = 'stock' | 'option'
export type OptionType = 'call' | 'put'
export type OptionAction = 'STO' | 'BTC'
export type PriceBasis = 'stock' | 'option'

// Phase 1A Position Interface - Core trade planning entity
export interface Position {
  id: string
  symbol: string
  strategy_type: StrategyType
  trade_kind?: TradeKind
  target_entry_price: number
  target_quantity: number
  profit_target: number
  stop_loss: number
  position_thesis: string
  created_date: Date
  status: 'planned' | 'open' | 'closed'
  journal_entry_ids: string[]
  trades: Trade[] // New field for embedded trades (future-proof array)

  // Option-specific fields (optional, only for option strategies)
  option_type?: OptionType
  strike_price?: number
  expiration_date?: Date
  premium_per_contract?: number
  profit_target_basis?: PriceBasis
  stop_loss_basis?: PriceBasis
}

// Position Service - IndexedDB CRUD operations
export class PositionService {
  private readonly positionStore = 'positions'
  private db: IDBDatabase

  constructor(db: IDBDatabase) {
    this.db = db
  }

  /**
   * Validate position data - delegates to PositionValidator
   */
  private validatePosition(position: Position): void {
    PositionValidator.validatePosition(position)
  }

  async create(position: Position): Promise<Position> {
    this.validatePosition(position)

    const db = this.db
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.positionStore], 'readwrite')
      const store = transaction.objectStore(this.positionStore)
      const request = store.add(position)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(position)
    })
  }

  async getById(id: string): Promise<Position | null> {
    const db = this.db
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.positionStore], 'readonly')
      const store = transaction.objectStore(this.positionStore)
      const request = store.get(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result
        if (result) {
          // Convert stored date strings back to Date objects
          result.created_date = new Date(result.created_date)
          // Migrate existing positions to include journal_entry_ids
          if (!result.journal_entry_ids) {
            result.journal_entry_ids = []
          }
          // Migrate existing positions to include trades array
          if (!result.trades) {
            result.trades = []
          }
          // Lazy migration: default strategy_type to 'Long Stock' for legacy positions
          if (!result.strategy_type) {
            result.strategy_type = 'Long Stock'
          }
          // Lazy migration: default trade_kind to 'stock' for legacy positions
          if (!result.trade_kind) {
            result.trade_kind = 'stock'
          }
          // Compute status dynamically from trades
          result.status = PositionStatusCalculator.computeStatus(result.trades)
          resolve(result)
        } else {
          resolve(null)
        }
      }
    })
  }

  async getAll(): Promise<Position[]> {
    const db = this.db
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.positionStore], 'readonly')
      const store = transaction.objectStore(this.positionStore)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const positions = request.result || []
        // Convert stored date strings back to Date objects and migrate schema
        positions.forEach(position => {
          position.created_date = new Date(position.created_date)
          // Migrate existing positions to include journal_entry_ids
          if (!position.journal_entry_ids) {
            position.journal_entry_ids = []
          }
          // Migrate existing positions to include trades array
          if (!position.trades) {
            position.trades = []
          }
          // Lazy migration: default strategy_type to 'Long Stock' for legacy positions
          if (!position.strategy_type) {
            position.strategy_type = 'Long Stock'
          }
          // Lazy migration: default trade_kind to 'stock' for legacy positions
          if (!position.trade_kind) {
            position.trade_kind = 'stock'
          }
          // Compute status dynamically from trades
          position.status = PositionStatusCalculator.computeStatus(position.trades)
        })
        resolve(positions)
      }
    })
  }

  async update(position: Position): Promise<void> {
    this.validatePosition(position)

    const db = this.db
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.positionStore], 'readwrite')
      const store = transaction.objectStore(this.positionStore)
      const request = store.put(position)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async delete(id: string): Promise<void> {
    const db = this.db
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.positionStore], 'readwrite')
      const store = transaction.objectStore(this.positionStore)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async clearAll(): Promise<void> {
    const db = this.db
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.positionStore], 'readwrite')
      const store = transaction.objectStore(this.positionStore)
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Calculate position metrics by delegating to domain calculators
   * Provides a clean service layer API for UI components
   */
  calculatePositionMetrics(
    position: Position,
    priceMap: Map<string, PriceHistory>
  ): PositionMetrics {
    // Delegate to domain calculators
    const avgCost = CostBasisCalculator.calculateAverageCost(
      position.trades,
      position.target_entry_price
    )
    const costBasis = CostBasisCalculator.calculateTotalCostBasis(position.trades)
    const openQuantity = CostBasisCalculator.calculateOpenQuantity(position.trades)
    const pnl = PnLCalculator.calculatePositionPnL(position, priceMap)
    const pnlPercentage = pnl !== null && costBasis > 0
      ? PnLCalculator.calculatePnLPercentage(pnl, costBasis)
      : undefined

    return { avgCost, costBasis, openQuantity, pnl, pnlPercentage }
  }

  close(): void {
    // Database connection is managed by ServiceContainer
    // Do not close database here
  }
}