import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ServiceContainer } from '@/services/ServiceContainer'
import { ServiceProvider } from '@/contexts/ServiceContext'
import { PositionService } from '@/lib/position'
import { TradeService } from '@/services/TradeService'
import { Home } from '@/pages/Home'
import { Dashboard } from '@/pages/Dashboard'
import { MemoryRouter } from 'react-router-dom'
import type { Position } from '@/lib/position'
import 'fake-indexeddb/auto'

/**
 * Service Lifecycle Integration Tests
 *
 * Verifies that ServiceContainer properly manages service lifecycle:
 * - Services are lazily initialized
 * - Services are shared across components
 * - Services can be injected for testing
 * - Services are properly cleaned up
 */
describe('Service Lifecycle Integration', () => {
  beforeEach(() => {
    ServiceContainer.resetInstance()
    indexedDB.deleteDatabase('TradingJournalDB')
  })

  afterEach(() => {
    ServiceContainer.resetInstance()
  })

  it('should provide the same service instance to multiple components', async () => {
    // Arrange - Create a position
    const positionService = new PositionService()
    await positionService.create({
      id: 'test-pos-1',
      symbol: 'AAPL',
      strategy_type: 'Long Stock',
      target_entry_price: 150,
      target_quantity: 100,
      profit_target: 165,
      stop_loss: 135,
      position_thesis: 'Test',
      created_date: new Date('2024-01-01'),
      status: 'planned',
      journal_entry_ids: [],
      trades: []
    })

    // Inject the service
    const services = ServiceContainer.getInstance()
    services.setPositionService(positionService)

    // Act - Render Home component which internally uses Dashboard
    render(
      <ServiceProvider>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </ServiceProvider>
    )

    // Assert - Both Home and Dashboard should use the same service instance
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    })

    // Verify the service was called
    const positions = await positionService.getAll()
    expect(positions).toHaveLength(1)
    expect(positions[0].symbol).toBe('AAPL')
  })

  it('should allow mock service injection for testing', () => {
    // Arrange - Create mock service
    const mockPositionService = {
      getAll: async () => [] as Position[],
      getById: async () => null,
      create: async () => ({} as Position),
      update: async () => {},
      delete: async () => {},
      clearAll: async () => {},
      close: () => {}
    }

    // Act - Inject mock service
    const services = ServiceContainer.getInstance()
    services.setPositionService(mockPositionService as any)

    // Assert - Service should be retrievable
    const retrievedService = services.getPositionService()
    expect(retrievedService).toBe(mockPositionService)
  })

  it('should properly reset service instances', () => {
    // Arrange - Create and inject services
    const services1 = ServiceContainer.getInstance()
    const mockService1 = { test: 'service1' }
    services1.setPositionService(mockService1 as any)

    // Act - Reset and create new instance
    ServiceContainer.resetInstance()
    const services2 = ServiceContainer.getInstance()

    // Assert - New instance should not have old service
    expect(services2).not.toBe(services1)

    // Getting service should create new instance, not return old mock
    const newService = services2.getPositionService()
    expect(newService).not.toBe(mockService1)
  })

  it('should lazily initialize services', () => {
    // Arrange
    const services = ServiceContainer.getInstance()

    // Act & Assert - Services should be created on first access
    const positionService1 = services.getPositionService()
    const positionService2 = services.getPositionService()

    // Should return same instance
    expect(positionService1).toBe(positionService2)
  })

  it('should handle service cleanup', () => {
    // Arrange - Create service with close method
    let closeCalled = false
    const mockService = {
      getAll: async () => [],
      close: () => { closeCalled = true }
    } as any

    const services = ServiceContainer.getInstance()
    services.setPositionService(mockService)

    // Act - Cleanup
    services.cleanup()

    // Assert - Close should have been called
    expect(closeCalled).toBe(true)
  })

  it('should properly inject all service types', () => {
    // Arrange
    const mockPositionService = { type: 'position' } as any
    const mockTradeService = { type: 'trade' } as any

    // Act
    const services = ServiceContainer.getInstance()
    services.setPositionService(mockPositionService)
    services.setTradeService(mockTradeService)

    // Assert
    expect(services.getPositionService()).toBe(mockPositionService)
    expect(services.getTradeService()).toBe(mockTradeService)
  })

  it('should maintain service instances across multiple component renders', async () => {
    // Arrange
    const positionService = new PositionService()
    const services = ServiceContainer.getInstance()
    services.setPositionService(positionService)

    // Act - Render Dashboard twice
    const { unmount } = render(
      <ServiceProvider>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </ServiceProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Positions')).toBeInTheDocument()
    })

    unmount()

    render(
      <ServiceProvider>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </ServiceProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Positions')).toBeInTheDocument()
    })

    // Assert - Service should still be the same instance
    const retrievedService = services.getPositionService()
    expect(retrievedService).toBe(positionService)
  })
})
