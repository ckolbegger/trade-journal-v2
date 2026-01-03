import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PriceService } from '../PriceService'
import type { SimplePriceInput } from '@/types/priceHistory'
import { SchemaManager } from '@/services/SchemaManager'
import 'fake-indexeddb/auto'

const createTestPrice = (overrides?: Partial<SimplePriceInput>): SimplePriceInput => ({
  underlying: 'AAPL',
  date: '2024-01-15',
  close: 150.00,
  ...overrides
})

describe('PriceService with IDBDatabase injection', () => {
  let db: IDBDatabase
  let priceService: PriceService

  beforeEach(async () => {
    // Delete database to ensure clean state
    const deleteRequest = indexedDB.deleteDatabase('TestDB')
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
      deleteRequest.onblocked = () => resolve()
    })

    // Create test database with schema
    db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('TestDB', 1)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result
        SchemaManager.initializeSchema(event, database)
      }
    })

    // Create service with injected database
    priceService = new PriceService(db)
  })

  afterEach(() => {
    db?.close()
    indexedDB.deleteDatabase('TestDB')
  })

  it('should accept IDBDatabase in constructor', () => {
    expect(priceService).toBeDefined()
    expect(priceService).toBeInstanceOf(PriceService)
  })

  it('should use injected database for createOrUpdateSimple operations', async () => {
    const price = await priceService.createOrUpdateSimple({
      underlying: 'AAPL',
      date: '2024-01-15',
      close: 150.00
    })

    expect(price).toBeDefined()
    expect(price.underlying).toBe('AAPL')
    expect(price.close).toBe(150.00)
  })

  it('should use injected database for getPriceByDate operations', async () => {
    await priceService.createOrUpdateSimple({
      underlying: 'AAPL',
      date: '2024-01-15',
      close: 150.00
    })

    const retrieved = await priceService.getPriceByDate('AAPL', '2024-01-15')

    expect(retrieved).toBeDefined()
    expect(retrieved!.close).toBe(150.00)
    expect(retrieved!.underlying).toBe('AAPL')
  })

  it('should use injected database for getLatestPrice operations', async () => {
    await priceService.createOrUpdateSimple({
      underlying: 'AAPL',
      date: '2024-01-15',
      close: 150.00
    })

    const latest = await priceService.getLatestPrice('AAPL')

    expect(latest).toBeDefined()
    expect(latest!.underlying).toBe('AAPL')
    expect(latest!.close).toBe(150.00)
  })

  it('should use injected database for getPriceHistory operations', async () => {
    await priceService.createOrUpdateSimple({
      underlying: 'AAPL',
      date: '2024-01-15',
      close: 150.00
    })

    await priceService.createOrUpdateSimple({
      underlying: 'AAPL',
      date: '2024-01-16',
      close: 151.00
    })

    const history = await priceService.getPriceHistory('AAPL')

    expect(history).toBeDefined()
    expect(history.length).toBe(2)
  })

  it('should use injected database for getLatestPrices operations', async () => {
    await priceService.createOrUpdateSimple({
      underlying: 'AAPL',
      date: '2024-01-15',
      close: 150.00
    })

    await priceService.createOrUpdateSimple({
      underlying: 'AAPL',
      date: '2024-01-16',
      close: 151.00
    })

    await priceService.createOrUpdateSimple({
      underlying: 'MSFT',
      date: '2024-01-15',
      close: 350.00
    })

    const priceMap = await priceService.getLatestPrices(['AAPL', 'MSFT'])

    expect(priceMap.size).toBe(2)
    // getLatestPrices returns the latest price by date (151.00 is the latest for AAPL)
    expect(priceMap.get('AAPL')?.close).toBe(151.00)
    expect(priceMap.get('MSFT')?.close).toBe(350.00)
  })

  it('should not have getDB() method', () => {
    // Service should not manage database connection lifecycle
    expect((priceService as any).getDB).toBeUndefined()
  })
})
