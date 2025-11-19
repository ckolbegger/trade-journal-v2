import { computePositionStatus } from '@/utils/statusComputation'

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

// Phase 1A Position Interface - Core trade planning entity
export interface Position {
  id: string
  symbol: string
  strategy_type: 'Long Stock'
  target_entry_price: number
  target_quantity: number
  profit_target: number
  stop_loss: number
  position_thesis: string
  created_date: Date
  status: 'planned' | 'open' | 'closed'
  journal_entry_ids: string[]
  trades: Trade[] // New field for embedded trades (future-proof array)
}

// Position Service - IndexedDB CRUD operations
export class PositionService {
  private dbName = 'TradingJournalDB'
  private version = 3 // Incremented for price_history store
  private positionStore = 'positions'
  private dbConnection: IDBDatabase | null = null

  private async getDB(): Promise<IDBDatabase> {
    if (this.dbConnection) {
      return this.dbConnection
    }
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.dbConnection = request.result
        resolve(request.result)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create positions object store
        if (!db.objectStoreNames.contains(this.positionStore)) {
          const store = db.createObjectStore(this.positionStore, { keyPath: 'id' })
          store.createIndex('symbol', 'symbol', { unique: false })
          store.createIndex('status', 'status', { unique: false })
          store.createIndex('created_date', 'created_date', { unique: false })
        }

        // Create journal_entries object store
        if (!db.objectStoreNames.contains('journal_entries')) {
          const journalStore = db.createObjectStore('journal_entries', { keyPath: 'id' })
          journalStore.createIndex('position_id', 'position_id', { unique: false })
          journalStore.createIndex('trade_id', 'trade_id', { unique: false })
          journalStore.createIndex('entry_type', 'entry_type', { unique: false })
          journalStore.createIndex('created_at', 'created_at', { unique: false })
        }

        // Create price_history object store (Slice 3.1)
        if (!db.objectStoreNames.contains('price_history')) {
          const priceStore = db.createObjectStore('price_history', { keyPath: 'id' })
          priceStore.createIndex('underlying_date', ['underlying', 'date'], { unique: true })
          priceStore.createIndex('underlying', 'underlying', { unique: false })
          priceStore.createIndex('date', 'date', { unique: false })
          priceStore.createIndex('updated_at', 'updated_at', { unique: false })
        }
      }
    })
  }

  private validatePosition(position: Position): void {
    // Validate specific fields first (before checking for missing fields)
    if (position.target_entry_price !== undefined && position.target_entry_price <= 0) {
      throw new Error('target_entry_price must be positive')
    }

    if (position.target_quantity !== undefined && position.target_quantity <= 0) {
      throw new Error('target_quantity must be positive')
    }

    if (position.position_thesis !== undefined && position.position_thesis.trim() === '') {
      throw new Error('position_thesis cannot be empty')
    }

    // Check required fields last
    if (!position.id || !position.symbol || !position.strategy_type ||
        position.target_entry_price === undefined || position.target_quantity === undefined ||
        !position.profit_target || !position.stop_loss ||
        !position.position_thesis || !position.created_date || !position.status) {
      throw new Error('Invalid position data')
    }

    // Ensure journal_entry_ids is an array (for backwards compatibility)
    if (position.journal_entry_ids !== undefined && !Array.isArray(position.journal_entry_ids)) {
      throw new Error('journal_entry_ids must be an array')
    }

    // Ensure trades is an array (for backwards compatibility)
    if (position.trades !== undefined && !Array.isArray(position.trades)) {
      throw new Error('trades must be an array')
    }
  }

  async create(position: Position): Promise<Position> {
    this.validatePosition(position)

    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.positionStore], 'readwrite')
      const store = transaction.objectStore(this.positionStore)
      const request = store.add(position)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(position)
    })
  }

  async getById(id: string): Promise<Position | null> {
    const db = await this.getDB()
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
          result.status = computePositionStatus(result.trades)
          resolve(result)
        } else {
          resolve(null)
        }
      }
    })
  }

  async getAll(): Promise<Position[]> {
    const db = await this.getDB()
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
          position.status = computePositionStatus(position.trades)
        })
        resolve(positions)
      }
    })
  }

  async update(position: Position): Promise<void> {
    this.validatePosition(position)

    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.positionStore], 'readwrite')
      const store = transaction.objectStore(this.positionStore)
      const request = store.put(position)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.positionStore], 'readwrite')
      const store = transaction.objectStore(this.positionStore)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async clearAll(): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.positionStore], 'readwrite')
      const store = transaction.objectStore(this.positionStore)
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  close(): void {
    if (this.dbConnection) {
      this.dbConnection.close()
      this.dbConnection = null
    }
  }
}