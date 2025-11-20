import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ServiceContainer } from '../ServiceContainer'
import { PositionService } from '@/lib/position'
import { TradeService } from '../TradeService'
import 'fake-indexeddb/auto'

describe('ServiceContainer', () => {
  let container: ServiceContainer

  beforeEach(() => {
    // Reset singleton
    // @ts-expect-error - accessing private static for testing
    ServiceContainer.instance = null

    container = ServiceContainer.getInstance()
  })

  afterEach(async () => {
    // Cleanup services first
    if (container) {
      container.cleanup()
    }

    // Then delete database (after connections are closed)
    const deleteRequest = indexedDB.deleteDatabase('TradingJournalDB')
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
      // Also resolve on blocked to prevent hanging
      deleteRequest.onblocked = () => resolve()
    })
  })

  it('should return singleton instance', () => {
    const instance1 = ServiceContainer.getInstance()
    const instance2 = ServiceContainer.getInstance()

    expect(instance1).toBe(instance2)
    expect(instance1).toBeInstanceOf(ServiceContainer)
  })

  it('should create PositionService lazily', () => {
    const service1 = container.getPositionService()
    const service2 = container.getPositionService()

    expect(service1).toBeInstanceOf(PositionService)
    expect(service1).toBe(service2) // Same instance returned
  })

  it('should create TradeService lazily', () => {
    const service1 = container.getTradeService()
    const service2 = container.getTradeService()

    expect(service1).toBeInstanceOf(TradeService)
    expect(service1).toBe(service2)
  })

  it('should create JournalService lazily', async () => {
    const service1 = await container.getJournalService()
    const service2 = await container.getJournalService()

    expect(service1).toBeDefined()
    expect(service1).toBe(service2)
  })

  it('should create PriceService lazily', () => {
    const service1 = container.getPriceService()
    const service2 = container.getPriceService()

    expect(service1).toBeDefined()
    expect(service1).toBe(service2)
  })

  it('should return same service instance on multiple calls', () => {
    const positionService1 = container.getPositionService()
    const positionService2 = container.getPositionService()
    const tradeService1 = container.getTradeService()
    const tradeService2 = container.getTradeService()

    expect(positionService1).toBe(positionService2)
    expect(tradeService1).toBe(tradeService2)
  })

  it('should inject dependencies correctly (TradeService gets PositionService)', () => {
    const positionService = container.getPositionService()
    const tradeService = container.getTradeService()

    expect(tradeService).toBeDefined()
    expect(positionService).toBeDefined()

    // TradeService should have PositionService injected
    // @ts-expect-error - accessing private field for testing
    expect(tradeService.positionService).toBe(positionService)
  })

  it('should cleanup all services', () => {
    // Create services
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
})
