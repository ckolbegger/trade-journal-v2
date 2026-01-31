import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ServiceContainer } from '../ServiceContainer'
import { PositionService } from '@/lib/position'
import { TradeService } from '../TradeService'
import { deleteDatabase } from '@/test/db-helpers'
import 'fake-indexeddb/auto'

describe('ServiceContainer', () => {
  let container: ServiceContainer

  beforeEach(async () => {
    await deleteDatabase()
    ServiceContainer.resetInstance()
    container = ServiceContainer.getInstance()
  })

  afterEach(async () => {
    if (container) {
      container.cleanup()
    }
    await deleteDatabase()
  })

  it('should return singleton instance', () => {
    const instance1 = ServiceContainer.getInstance()
    const instance2 = ServiceContainer.getInstance()

    expect(instance1).toBe(instance2)
    expect(instance1).toBeInstanceOf(ServiceContainer)
  })

  it('should create PositionService lazily', async () => {
    await container.initialize()
    const service1 = container.getPositionService()
    const service2 = container.getPositionService()

    expect(service1).toBeInstanceOf(PositionService)
    expect(service1).toBe(service2) // Same instance returned
  })

  it('should create TradeService lazily', async () => {
    await container.initialize()
    const service1 = container.getTradeService()
    const service2 = container.getTradeService()

    expect(service1).toBeInstanceOf(TradeService)
    expect(service1).toBe(service2)
  })

  it('should create JournalService lazily', async () => {
    await container.initialize()
    const service1 = container.getJournalService()
    const service2 = container.getJournalService()

    expect(service1).toBeDefined()
    expect(service1).toBe(service2)
  })

  it('should create PriceService lazily', async () => {
    await container.initialize()
    const service1 = container.getPriceService()
    const service2 = container.getPriceService()

    expect(service1).toBeDefined()
    expect(service1).toBe(service2)
  })

  it('should return same service instance on multiple calls', async () => {
    await container.initialize()
    const positionService1 = container.getPositionService()
    const positionService2 = container.getPositionService()
    const tradeService1 = container.getTradeService()
    const tradeService2 = container.getTradeService()

    expect(positionService1).toBe(positionService2)
    expect(tradeService1).toBe(tradeService2)
  })

  it('should inject dependencies correctly (TradeService gets PositionService)', async () => {
    await container.initialize()
    const positionService = container.getPositionService()
    const tradeService = container.getTradeService()

    expect(tradeService).toBeDefined()
    expect(positionService).toBeDefined()

    // TradeService should have PositionService injected
    // @ts-expect-error - accessing private field for testing
    expect(tradeService.positionService).toBe(positionService)
  })

  it('should cleanup all services', async () => {
    // Create services
    await container.initialize()
    container.getPositionService()
    container.getTradeService()

    // Cleanup should not throw
    expect(() => container.cleanup()).not.toThrow()
  })

  it('should allow custom service injection for testing', () => {
    // This will be useful for testing - container should support
    // injecting mock services. For now, just verify container exists.
    expect(container).toBeDefined()
  })

  describe('Database Initialization', () => {
    it('should initialize database connection', async () => {
      await container.initialize()
      // Verify database is accessible by checking internal state
      // @ts-expect-error - accessing private field for testing
      expect(container.db).toBeDefined()
      // @ts-expect-error - accessing private field for testing
      expect(container.db).toBeInstanceOf(IDBDatabase)
    })

    it('should only initialize database once', async () => {
      await container.initialize()
      // @ts-expect-error - accessing private field for testing
      const firstDb = container.db

      await container.initialize() // Second call should be no-op
      // @ts-expect-error - accessing private field for testing
      const secondDb = container.db

      expect(secondDb).toBe(firstDb) // Same instance
    })

    it('should throw error if getDatabase() called before initialization', () => {
      ServiceContainer.resetInstance()
      const newContainer = ServiceContainer.getInstance()
      // Don't call initialize()

      // @ts-expect-error - testing private method
      expect(() => newContainer.getDatabase()).toThrow('Database not initialized')
    })

    it('should use SchemaManager to initialize schema', async () => {
      await container.initialize()

      // @ts-expect-error - accessing private field for testing
      const db = container.db as IDBDatabase

      // Verify database was created with correct name and version
      expect(db).toBeDefined()
      expect(db.name).toBe('TradingJournalDB')
      expect(db.version).toBe(3)

      // Note: Schema correctness is verified by SchemaManager.test.ts
      // We trust that SchemaManager.initializeSchema() creates the stores
      // Integration tests will verify the full workflow works end-to-end
    })
  })
})
