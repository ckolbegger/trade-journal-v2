import type { PriceHistory, PriceHistoryInput, PriceValidationResult } from '@/types/priceHistory'

/**
 * Price management service with OHLC structure and validation
 * Provides CRUD operations for price history data
 */
export class PriceService {
  private dbName = 'TradingJournalDB'
  private version = 2 // Keep same version as PositionService for compatibility
  private priceStore = 'price_history'
  private dbConnection: IDBDatabase | null = null

  /**
   * Get or create IndexedDB connection
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
        if (!db.objectStoreNames.contains(this.priceStore)) {
          const store = db.createObjectStore(this.priceStore, { keyPath: 'id' })

          // Create indexes for efficient querying
          store.createIndex('underlying', 'underlying', { unique: false })
          store.createIndex('date', 'date', { unique: false })

          // Create compound unique index on [underlying, date]
          store.createIndex('underlying_date', ['underlying', 'date'], { unique: true })
        }
      }
    })
  }

  /**
   * Generate unique ID for price history records
   */
  private generatePriceId(): string {
    return `price-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Validate price input data
   */
  private validatePriceInput(priceInput: PriceHistoryInput): void {
    if (!priceInput.underlying || priceInput.underlying.trim() === '') {
      throw new Error('Underlying cannot be empty')
    }

    if (!priceInput.date || priceInput.date.trim() === '') {
      throw new Error('Date cannot be empty')
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(priceInput.date)) {
      throw new Error('Date must be in YYYY-MM-DD format')
    }

    if (priceInput.close <= 0) {
      throw new Error('Price must be positive')
    }

    if (priceInput.open !== undefined && priceInput.open <= 0) {
      throw new Error('Open price must be positive')
    }

    if (priceInput.high !== undefined && priceInput.high <= 0) {
      throw new Error('High price must be positive')
    }

    if (priceInput.low !== undefined && priceInput.low <= 0) {
      throw new Error('Low price must be positive')
    }
  }

  /**
   * Clear all price history data (for testing)
   */
  async clearAll(): Promise<void> {
    const db = await this.getDB()
    const transaction = db.transaction([this.priceStore], 'readwrite')
    const store = transaction.objectStore(this.priceStore)

    await new Promise<void>((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Create or update a price history record
   * Overwrites existing record for same underlying+date combination
   */
  async createOrUpdatePrice(priceInput: PriceHistoryInput): Promise<PriceHistory> {
    this.validatePriceInput(priceInput)

    const db = await this.getDB()
    const transaction = db.transaction([this.priceStore], 'readwrite')
    const store = transaction.objectStore(this.priceStore)

    // Check if record already exists for this underlying+date
    const index = store.index('underlying_date')
    const existingRecord = await new Promise<IDBRequest>((resolve) => {
      const request = index.get([priceInput.underlying, priceInput.date])
      request.onsuccess = () => resolve(request)
      request.onerror = () => resolve(request)
    })

    const now = new Date()
    let priceRecord: PriceHistory

    if (existingRecord.result) {
      // Update existing record
      const existing: PriceHistory = existingRecord.result
      priceRecord = {
        ...existing,
        open: priceInput.open ?? priceInput.close,
        high: priceInput.high ?? priceInput.close,
        low: priceInput.low ?? priceInput.close,
        close: priceInput.close,
        updated_at: now
      }
    } else {
      // Create new record
      priceRecord = {
        id: this.generatePriceId(),
        underlying: priceInput.underlying,
        date: priceInput.date,
        open: priceInput.open ?? priceInput.close,
        high: priceInput.high ?? priceInput.close,
        low: priceInput.low ?? priceInput.close,
        close: priceInput.close,
        updated_at: now
      }
    }

    // Store the record
    await new Promise<void>((resolve, reject) => {
      const request = store.put(priceRecord)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    return priceRecord
  }

  /**
   * Validate price change against previous price
   * Returns validation result with confirmation requirement if needed
   */
  async validatePriceChange(priceInput: PriceHistoryInput): Promise<PriceValidationResult> {
    this.validatePriceInput(priceInput)

    // Get the most recent price for this underlying
    const latestPrice = await this.getLatestPrice(priceInput.underlying)

    // If no previous price exists, no validation needed
    if (!latestPrice) {
      return {
        isValid: true,
        requiresConfirmation: false
      }
    }

    const percentChange = ((priceInput.close - latestPrice.close) / latestPrice.close) * 100
    const requiresConfirmation = Math.abs(percentChange) > 20

    return {
      isValid: true,
      requiresConfirmation,
      percentChange: Math.round(percentChange * 100) / 100, // Round to 2 decimal places
      previousPrice: latestPrice.close
    }
  }

  /**
   * Get the most recent price for a given underlying
   */
  async getLatestPrice(underlying: string): Promise<PriceHistory | null> {
    const db = await this.getDB()
    const transaction = db.transaction([this.priceStore], 'readonly')
    const store = transaction.objectStore(this.priceStore)

    // Get all records for this underlying and find the one with latest date
    return new Promise((resolve, reject) => {
      const index = store.index('underlying')
      const request = index.openCursor(IDBKeyRange.only(underlying))
      let latest: PriceHistory | null = null

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          const current = cursor.value as PriceHistory
          if (!latest || current.date > latest.date) {
            latest = current
          }
          cursor.continue()
        } else {
          resolve(latest)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get price history for an underlying with pagination
   */
  async getPriceHistory(
    underlying: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<PriceHistory[]> {
    const { limit = 50, offset = 0 } = options
    const db = await this.getDB()
    const transaction = db.transaction([this.priceStore], 'readonly')
    const store = transaction.objectStore(this.priceStore)

    return new Promise((resolve, reject) => {
      const index = store.index('underlying')
      const request = index.openCursor(IDBKeyRange.only(underlying))
      const allResults: PriceHistory[] = []

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          allResults.push(cursor.value as PriceHistory)
          cursor.continue()
        } else {
          // Sort by date descending and apply pagination
          allResults.sort((a, b) => b.date.localeCompare(a.date))
          const startIndex = offset
          const endIndex = startIndex + limit
          resolve(allResults.slice(startIndex, endIndex))
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get price for a specific underlying and date
   */
  async getPriceByDate(underlying: string, date: string): Promise<PriceHistory | null> {
    const db = await this.getDB()
    const transaction = db.transaction([this.priceStore], 'readonly')
    const store = transaction.objectStore(this.priceStore)
    const index = store.index('underlying_date')

    return new Promise((resolve, reject) => {
      const request = index.get([underlying, date])
      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result as PriceHistory : null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get all latest prices for multiple underlyings (batch operation)
   * Efficient for dashboard loading
   */
  async getAllLatestPrices(underlyings: string[]): Promise<Map<string, PriceHistory>> {
    const priceMap = new Map<string, PriceHistory>()

    // Create a single transaction for efficiency
    const db = await this.getDB()
    const transaction = db.transaction([this.priceStore], 'readonly')
    const store = transaction.objectStore(this.priceStore)
    const index = store.index('underlying')

    // Create promises for each underlying
    const promises = underlyings.map(underlying =>
      new Promise<void>((resolve, reject) => {
        const request = index.openCursor(IDBKeyRange.only(underlying), 'prev')
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result
          if (cursor) {
            priceMap.set(underlying, cursor.value as PriceHistory)
          }
          resolve()
        }
        request.onerror = () => reject(request.error)
      })
    )

    // Wait for all promises to complete
    await Promise.all(promises)

    return priceMap
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.dbConnection) {
      this.dbConnection.close()
      this.dbConnection = null
    }
  }
}