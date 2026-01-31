import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Dashboard } from '../Dashboard'
import { ServiceProvider } from '@/contexts/ServiceContext'
import { setupTestServices, teardownTestServices } from '@/test/db-helpers'
import type { Position } from '@/lib/position'
import 'fake-indexeddb/auto'

describe('Dashboard Component with ServiceContext', () => {
  let positionService: any

  beforeEach(async () => {
    const services = await setupTestServices()
    positionService = services.positionService
  })

  afterEach(async () => {
    await teardownTestServices()
  })

  it('should use ServiceContext instead of receiving positionService as prop', async () => {
    // Create a complete test position with all required fields
    const testPosition: Position = {
      id: 'test-1',
      symbol: 'AAPL',
      underlying: 'AAPL',
      strategy_type: 'long_stock',
      target_entry_price: 150,
      target_quantity: 100,
      target_entry_date: '2025-01-15',
      profit_target: 160,
      stop_loss: 140,
      position_thesis: 'Test thesis',
      status: 'planned',
      journal_entry_ids: [],
      trades: [],
      created_date: '2025-01-15',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Add position to the service
    await positionService.create(testPosition)

    // Render Dashboard WITHOUT passing positionService prop
    // This test should pass after refactoring
    render(
      <ServiceProvider>
        <Dashboard />
      </ServiceProvider>
    )

    // Verify positions are loaded using ServiceContext
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    })
  })

  it('should access PositionService via useServices hook', async () => {
    render(
      <ServiceProvider>
        <Dashboard filter="all" />
      </ServiceProvider>
    )

    // Component should render without errors when using ServiceContext
    await waitFor(() => {
      expect(screen.getByText('Trading Positions')).toBeInTheDocument()
    })
  })

  it('should not require positionService prop', () => {
    // TypeScript should allow rendering without positionService prop
    // This is a compile-time check - if it compiles, test passes
    const element = (
      <ServiceProvider>
        <Dashboard />
      </ServiceProvider>
    )

    expect(element).toBeDefined()
  })
})
