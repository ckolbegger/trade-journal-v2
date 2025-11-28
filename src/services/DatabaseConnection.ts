import { SchemaManager } from './SchemaManager'

/**
 * DatabaseConnection - Singleton database connection manager
 *
 * Manages a single shared IndexedDB connection across the application.
 * Uses SchemaManager for schema initialization.
 */
export class DatabaseConnection {
  private static instance: DatabaseConnection | null = null
  private dbConnection: IDBDatabase | null = null
  private connectionPromise: Promise<IDBDatabase> | null = null
  private readonly dbName = 'TradingJournalDB'
  private readonly version = 3

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance of DatabaseConnection
   */
  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection()
    }
    return DatabaseConnection.instance
  }

  /**
   * Get database connection (creates if doesn't exist)
   * Handles concurrent requests by returning same promise
   */
  async getConnection(): Promise<IDBDatabase> {
    // Return existing connection if available
    if (this.dbConnection) {
      return this.dbConnection
    }

    // Return in-progress connection promise if exists
    if (this.connectionPromise) {
      return this.connectionPromise
    }

    // Create new connection
    this.connectionPromise = this.openDatabase()

    try {
      this.dbConnection = await this.connectionPromise
      return this.dbConnection
    } finally {
      this.connectionPromise = null
    }
  }

  /**
   * Open IndexedDB connection with schema initialization
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        SchemaManager.initializeSchema(db, this.version)
      }
    })
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.dbConnection) {
      this.dbConnection.close()
      this.dbConnection = null
    }
    this.connectionPromise = null
  }
}
