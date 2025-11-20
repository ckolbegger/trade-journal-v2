import { describe, it, expect, beforeEach } from 'vitest'
import { DatabaseConnection } from '@/services/DatabaseConnection'
import 'fake-indexeddb/auto'

describe.skip('DatabaseConnection Integration', () => {
  beforeEach(async () => {
    // Clean up database
    const deleteRequest = indexedDB.deleteDatabase('TradingJournalDB')
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
    })

    // Reset singleton
    // @ts-expect-error - accessing private static for testing
    DatabaseConnection.instance = null
  })

  it.skip('should share same connection across multiple services', async () => {
    // TODO: Enable after services refactored to use DatabaseConnection (Step 1.3)
    const dbConnection = DatabaseConnection.getInstance()
    const connection = await dbConnection.getConnection()
    expect(connection).toBeDefined()
  })

  it.skip('should handle concurrent service initialization', async () => {
    // TODO: Enable after services refactored (Step 1.3)
    expect(true).toBe(true)
  })

  it.skip('should persist data across connection reuse', async () => {
    // TODO: Enable after services refactored (Step 1.3)
    expect(true).toBe(true)
  })
})
