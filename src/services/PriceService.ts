import type { PriceHistory, PriceHistoryInput, SimplePriceInput } from '@/types/priceHistory'
import { PriceValidator } from '@/domain/validators/PriceValidator'

/**
 * Validation result for price change confirmation
 */
export interface PriceChangeValidation {
  requiresConfirmation: boolean
  percentChange: number
  oldPrice: number | null
  newPrice: number
}

/**
 * PriceService - Manages OHLC price history in IndexedDB
 *
 * Key features:
 * - One price record per underlying per date (compound unique index)
 * - Automatic OHLC auto-fill from single close price (Phase 1A simplification)
 * - >20% price change validation with confirmation requirement
 * - Support for stock symbols and OCC option symbols
 * - Batch operations for efficient dashboard rendering
 */
export class PriceService {
  private dbName = 'TradingJournalDB'
  private version = 3 // Incremented to match PositionService
  private priceHistoryStore = 'price_history'
  private dbConnection: IDBDatabase | null = null

  /**
   * Get or initialize IndexedDB connection
   */
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

        // Create price_history object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.priceHistoryStore)) {
          const store = db.createObjectStore(this.priceHistoryStore, { keyPath: 'id' })

          // Compound unique index: [underlying, date]
          // Ensures only one price record per instrument per date
          store.createIndex('underlying_date', ['underlying', 'date'], { unique: true })

          // Index for efficient lookups by underlying
          store.createIndex('underlying', 'underlying', { unique: false })

          // Index for date-based queries
          store.createIndex('date', 'date', { unique: false })

          // Index for sorting by updated_at
          store.createIndex('updated_at', 'updated_at', { unique: false })
        }
      }
    })
  }

  /**
   * Validate price record - delegates to PriceValidator
   */
  private validatePriceRecord(input: PriceHistoryInput): void {
    PriceValidator.validatePriceRecord(input)
  }

  /**
   * Generate unique ID for price record based on underlying and date
   */
  private generateId(underlying: string, date: string): string {
    return `price_${underlying}_${date}`
  }

  /**
   * Create or update price record with full OHLC data
   *
   * If a record already exists for the same underlying+date, it will be updated.
   * The compound unique index ensures one price per instrument per date.
   */
  async createOrUpdate(input: PriceHistoryInput): Promise<PriceHistory> {
    this.validatePriceRecord(input)

    const db = await this.getDB()
    const id = this.generateId(input.underlying, input.date)

    const priceRecord: PriceHistory = {
      id,
      underlying: input.underlying,
      date: input.date,
      open: input.open,
      high: input.high,
      low: input.low,
      close: input.close,
      updated_at: new Date()
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.priceHistoryStore], 'readwrite')
      const store = transaction.objectStore(this.priceHistoryStore)
      const request = store.put(priceRecord)

      request.onsuccess = () => resolve(priceRecord)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Create or update price using simplified input (Phase 1A)
   *
   * Auto-fills open, high, and low with the close price value.
   * This simplifies the UI while maintaining full OHLC data model.
   */
  async createOrUpdateSimple(input: SimplePriceInput): Promise<PriceHistory> {
    const fullInput: PriceHistoryInput = {
      underlying: input.underlying,
      date: input.date,
      open: input.close,
      high: input.close,
      low: input.close,
      close: input.close
    }

    return this.createOrUpdate(fullInput)
  }

  /**
   * Get the latest price for an underlying
   *
   * Returns the most recent price record by date.
   */
  async getLatestPrice(underlying: string): Promise<PriceHistory | null> {
    const db = await this.getDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.priceHistoryStore], 'readonly')
      const store = transaction.objectStore(this.priceHistoryStore)
      const index = store.index('underlying')
      const request = index.getAll(underlying)

      request.onsuccess = () => {
        const records = request.result as PriceHistory[]
        if (records.length === 0) {
          resolve(null)
          return
        }

        // Sort by date descending and return the latest
        records.sort((a, b) => b.date.localeCompare(a.date))
        resolve(records[0])
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get price for a specific underlying on a specific date
   */
  async getPriceByDate(underlying: string, date: string): Promise<PriceHistory | null> {
    const db = await this.getDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.priceHistoryStore], 'readonly')
      const store = transaction.objectStore(this.priceHistoryStore)
      const index = store.index('underlying_date')
      const request = index.get([underlying, date])

      request.onsuccess = () => {
        resolve(request.result || null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get price history for an underlying with pagination
   *
   * Returns records ordered by date descending (newest first)
   */
  async getPriceHistory(
    underlying: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<PriceHistory[]> {
    const db = await this.getDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.priceHistoryStore], 'readonly')
      const store = transaction.objectStore(this.priceHistoryStore)
      const index = store.index('underlying')
      const request = index.getAll(underlying)

      request.onsuccess = () => {
        let records = request.result as PriceHistory[]

        // Sort by date descending (newest first)
        records.sort((a, b) => b.date.localeCompare(a.date))

        // Apply pagination
        const offset = options.offset || 0
        const limit = options.limit || records.length
        records = records.slice(offset, offset + limit)

        resolve(records)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Validate price change and determine if confirmation is required
   * Delegates confirmation logic to PriceValidator
   *
   * Returns confirmation requirement when:
   * - Price change exceeds 20% (positive or negative)
   */
  async validatePriceChange(underlying: string, newPrice: number): Promise<PriceChangeValidation> {
    const latestPrice = await this.getLatestPrice(underlying)

    // No previous price - delegate to PriceValidator
    const oldPrice = latestPrice?.close ?? null
    const requiresConfirmation = PriceValidator.requiresConfirmation(oldPrice, newPrice)

    // Calculate percent change for display purposes
    const percentChange = oldPrice !== null
      ? parseFloat((((newPrice - oldPrice) / oldPrice) * 100).toFixed(2))
      : 0

    return {
      requiresConfirmation,
      percentChange,
      oldPrice,
      newPrice
    }
  }

  /**
   * Batch fetch latest prices for multiple underlyings
   *
   * Returns a Map of underlying -> PriceHistory for efficient lookups.
   * Used for dashboard rendering to minimize IndexedDB queries.
   */
  async getLatestPrices(underlyings: string[]): Promise<Map<string, PriceHistory>> {
    const priceMap = new Map<string, PriceHistory>()

    // Fetch all prices in parallel
    const promises = underlyings.map(async (underlying) => {
      const price = await this.getLatestPrice(underlying)
      if (price) {
        priceMap.set(underlying, price)
      }
    })

    await Promise.all(promises)
    return priceMap
  }

  /**
   * Clear all price history (used in tests)
   */
  async clearAll(): Promise<void> {
    const db = await this.getDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.priceHistoryStore], 'readwrite')
      const store = transaction.objectStore(this.priceHistoryStore)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}
