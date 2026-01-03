import type { JournalField } from '@/types/journal'
import { PositionValidator } from '@/domain/validators/PositionValidator'
import { JournalService } from '@/services/JournalService'
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

export interface PositionInput {
  symbol: string
  strategy_type: 'Long Stock' | 'Short Put'
  trade_kind: 'stock' | 'option'
  option_type?: 'call' | 'put'
  strike_price?: number
  expiration_date?: Date
  premium_per_contract?: number
  profit_target_basis?: 'stock_price' | 'option_price'
  stop_loss_basis?: 'stock_price' | 'option_price'
  target_entry_price: number
  target_quantity: number
  profit_target: number
  stop_loss: number
  position_thesis: string
  journal_fields: JournalField[]
}
export interface Position {
  id: string
  symbol: string
  strategy_type: 'Long Stock' | 'Short Put'
  trade_kind: 'stock' | 'option'
  option_type?: 'call' | 'put'
  strike_price?: number
  expiration_date?: Date
  premium_per_contract?: number
  profit_target_basis?: 'stock_price' | 'option_price'
  stop_loss_basis?: 'stock_price' | 'option_price'
  target_entry_price: number
  target_quantity: number
  profit_target: number
  stop_loss: number
  position_thesis: string
  created_date: Date
  status: 'planned' | 'open' | 'closed'
  journal_entry_ids: string[]
  trades: Trade[]
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

  async createPosition(input: PositionInput, journalService: JournalService): Promise<Position> {
    const errors: string[] = []

    if (!input.symbol || input.symbol.trim() === '') {
      errors.push('Symbol is required')
    }

    if (!input.strategy_type) {
      errors.push('Strategy type is required')
    }

    if (input.target_entry_price === undefined || input.target_entry_price <= 0) {
      errors.push('Target entry price must be a positive number')
    }

    if (input.target_quantity === undefined || input.target_quantity <= 0) {
      errors.push('Target quantity must be a positive number')
    }

    if (input.profit_target === undefined || input.profit_target <= 0) {
      errors.push('Profit target must be a positive number')
    }

    if (input.stop_loss === undefined || input.stop_loss <= 0) {
      errors.push('Stop loss must be a positive number')
    }

    if (!input.position_thesis || input.position_thesis.trim().length < 10) {
      errors.push('Position thesis must be at least 10 characters')
    }

    if (input.strategy_type === 'Short Put') {
      if (input.trade_kind !== 'option') {
        errors.push('Short Put strategy requires trade_kind to be "option"')
      }
      if (input.option_type !== 'put') {
        errors.push('Short Put strategy requires option_type to be "put"')
      }
      if (input.strike_price === undefined || input.strike_price <= 0) {
        errors.push('Strike price is required for Short Put strategy')
      }
      if (input.expiration_date === undefined) {
        errors.push('Expiration date is required for Short Put strategy')
      }
      if (input.premium_per_contract === undefined || input.premium_per_contract <= 0) {
        errors.push('Premium per contract is required for Short Put strategy')
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join('; '))
    }

    const positionId = `pos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const journalId = `journal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const position: Position = {
      id: positionId,
      symbol: input.symbol.toUpperCase(),
      strategy_type: input.strategy_type,
      trade_kind: input.trade_kind,
      option_type: input.option_type,
      strike_price: input.strike_price,
      expiration_date: input.expiration_date,
      premium_per_contract: input.premium_per_contract,
      profit_target_basis: input.profit_target_basis,
      stop_loss_basis: input.stop_loss_basis,
      target_entry_price: input.target_entry_price,
      target_quantity: input.target_quantity,
      profit_target: input.profit_target,
      stop_loss: input.stop_loss,
      position_thesis: input.position_thesis,
      created_date: new Date(),
      status: 'planned',
      journal_entry_ids: [journalId],
      trades: []
    }

    const journalEntry = {
      id: journalId,
      position_id: positionId,
      entry_type: 'position_plan' as const,
      fields: input.journal_fields,
      created_at: new Date().toISOString()
    }

    const db = this.db
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['positions', 'journal_entries'], 'readwrite')

      const positionRequest = transaction.objectStore('positions').add(position)
      positionRequest.onerror = () => reject(positionRequest.error)
      positionRequest.onsuccess = () => {
        const journalRequest = transaction.objectStore('journal_entries').add(journalEntry)
        journalRequest.onerror = () => reject(journalRequest.error)
        journalRequest.onsuccess = () => resolve(position)
      }
    })
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