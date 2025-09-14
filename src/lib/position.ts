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
  status: 'planned'
}

// Position Service - IndexedDB CRUD operations
export class PositionService {
  private dbName = 'TradingJournalDB'
  private version = 1
  private positionStore = 'positions'

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create positions object store
        if (!db.objectStoreNames.contains(this.positionStore)) {
          const store = db.createObjectStore(this.positionStore, { keyPath: 'id' })
          store.createIndex('symbol', 'symbol', { unique: false })
          store.createIndex('status', 'status', { unique: false })
          store.createIndex('created_date', 'created_date', { unique: false })
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
  }

  async create(position: Position): Promise<void> {
    this.validatePosition(position)

    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.positionStore], 'readwrite')
      const store = transaction.objectStore(this.positionStore)
      const request = store.add(position)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
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
        // Convert stored date strings back to Date objects
        positions.forEach(position => {
          position.created_date = new Date(position.created_date)
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
}