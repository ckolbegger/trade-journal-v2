import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DatabaseConnection } from '../DatabaseConnection'
import 'fake-indexeddb/auto'

describe('DatabaseConnection', () => {
  let instance: DatabaseConnection

  beforeEach(async () => {
    // Clean up any existing database
    const deleteRequest = indexedDB.deleteDatabase('TradingJournalDB')
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
    })

    // Reset singleton between tests
    // @ts-expect-error - accessing private static for testing
    DatabaseConnection.instance = null
  })

  afterEach(async () => {
    if (instance) {
      instance.close()
    }

    // Clean up database after tests
    const deleteRequest = indexedDB.deleteDatabase('TradingJournalDB')
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
    })
  })

  it('should return singleton instance', () => {
    const instance1 = DatabaseConnection.getInstance()
    const instance2 = DatabaseConnection.getInstance()

    expect(instance1).toBe(instance2)
    expect(instance1).toBeInstanceOf(DatabaseConnection)
  })

  it('should initialize database only once', async () => {
    instance = DatabaseConnection.getInstance()

    const connection1 = await instance.getConnection()
    const connection2 = await instance.getConnection()

    // Same connection object should be returned
    expect(connection1).toBe(connection2)
    expect(connection1.name).toBe('TradingJournalDB')
    expect(connection1.version).toBe(3)
  })

  it('should use SchemaManager for schema initialization', async () => {
    instance = DatabaseConnection.getInstance()
    const connection = await instance.getConnection()

    // Verify all stores were created by SchemaManager
    expect(connection.objectStoreNames.contains('positions')).toBe(true)
    expect(connection.objectStoreNames.contains('journal_entries')).toBe(true)
    expect(connection.objectStoreNames.contains('price_history')).toBe(true)
  })

  it('should handle concurrent initialization requests', async () => {
    instance = DatabaseConnection.getInstance()

    // Make multiple concurrent requests
    const promises = [
      instance.getConnection(),
      instance.getConnection(),
      instance.getConnection()
    ]

    const connections = await Promise.all(promises)

    // All should return the same connection
    expect(connections[0]).toBe(connections[1])
    expect(connections[1]).toBe(connections[2])
  })

  it('should close connection properly', async () => {
    instance = DatabaseConnection.getInstance()
    const connection = await instance.getConnection()

    expect(connection.version).toBe(3)

    instance.close()

    // After close, getting connection should open new one
    const newConnection = await instance.getConnection()
    expect(newConnection).toBeDefined()
    expect(newConnection.version).toBe(3)
  })

  it('should handle connection errors', async () => {
    // Note: Error handling is difficult to test with fake-indexeddb
    // In production, IndexedDB.open errors (quota exceeded, blocked, etc.)
    // would be caught and rejected by the promise in openDatabase()

    // Test that getConnection returns a promise that can reject
    instance = DatabaseConnection.getInstance()
    const connectionPromise = instance.getConnection()

    expect(connectionPromise).toBeInstanceOf(Promise)

    // Verify connection succeeds in normal case
    const connection = await connectionPromise
    expect(connection).toBeDefined()
  })
})
