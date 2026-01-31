import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PositionService } from '@/lib/position'
import type { Position, Trade } from '@/lib/position'
import { ServiceContainer } from '@/services/ServiceContainer'
import { createPosition } from '@/test/data-factories'

describe('Batch 6: Backward Compatibility & Migration v2', () => {
  let positionService: PositionService

  beforeEach(async () => {
    // Delete database for clean state
    const deleteRequest = indexedDB.deleteDatabase('TradingJournalDB')
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
      deleteRequest.onblocked = () => resolve()
    })

    // Reset ServiceContainer
    ServiceContainer.resetInstance()

    // Initialize ServiceContainer with database
    const services = ServiceContainer.getInstance()
    await services.initialize()

    positionService = services.getPositionService()
  })

  afterEach(async () => {
    ServiceContainer.resetInstance()

    // Clean up database
    const deleteRequest = indexedDB.deleteDatabase('TradingJournalDB')
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
      deleteRequest.onblocked = () => resolve()
    })
  })

  it('[Integration] should handle Position without trades field (legacy)', async () => {
    // Arrange - Create legacy position without trades field
    const legacyPosition = {
      id: 'legacy-pos-123',
      symbol: 'AAPL',
      strategy_type: 'Long Stock' as const,
      target_entry_price: 150,
      target_quantity: 100,
      profit_target: 165,
      stop_loss: 135,
      position_thesis: 'Legacy position',
      created_date: new Date('2024-01-15T00:00:00.000Z'),
      status: 'planned' as const,
      journal_entry_ids: [],
      // Note: no trades field - this is legacy data
    }

    // Store legacy position directly in IndexedDB
    await positionService.create(legacyPosition as any)

    // Act - Retrieve the position
    const retrievedPosition = await positionService.getById('legacy-pos-123')

    // Assert
    expect(retrievedPosition).toBeTruthy()
    expect(retrievedPosition!.trades).toBeDefined()
    expect(Array.isArray(retrievedPosition!.trades)).toBe(true)
    expect(retrievedPosition!.trades).toHaveLength(0)
  })

  it('[Integration] should handle Position without journal_entry_ids field (legacy)', async () => {
    // Arrange - Create legacy position without journal_entry_ids field
    const legacyPosition = {
      id: 'legacy-no-journal-123',
      symbol: 'MSFT',
      strategy_type: 'Long Stock' as const,
      target_entry_price: 300,
      target_quantity: 50,
      profit_target: 330,
      stop_loss: 270,
      position_thesis: 'Legacy without journal',
      created_date: new Date('2024-01-15T00:00:00.000Z'),
      status: 'planned' as const,
      trades: [],
      // Note: no journal_entry_ids field - this is legacy data
    }

    // Store legacy position directly in IndexedDB
    await positionService.create(legacyPosition as any)

    // Act - Retrieve the position
    const retrievedPosition = await positionService.getById('legacy-no-journal-123')

    // Assert
    expect(retrievedPosition).toBeTruthy()
    expect(retrievedPosition!.journal_entry_ids).toBeDefined()
    expect(Array.isArray(retrievedPosition!.journal_entry_ids)).toBe(true)
    expect(retrievedPosition!.journal_entry_ids).toHaveLength(0)
  })

  it('[Integration] should handle completely legacy Position (missing both fields)', async () => {
    // Arrange - Create legacy position missing both trades and journal_entry_ids
    const legacyPosition = {
      id: 'legacy-complete-123',
      symbol: 'TSLA',
      strategy_type: 'Long Stock' as const,
      target_entry_price: 200,
      target_quantity: 75,
      profit_target: 220,
      stop_loss: 180,
      position_thesis: 'Complete legacy position',
      created_date: new Date('2024-01-15T00:00:00.000Z'),
      status: 'planned' as const,
      // Note: missing both trades and journal_entry_ids fields
    }

    // Store legacy position directly in IndexedDB
    await positionService.create(legacyPosition as any)

    // Act - Retrieve the position
    const retrievedPosition = await positionService.getById('legacy-complete-123')

    // Assert
    expect(retrievedPosition).toBeTruthy()
    expect(retrievedPosition!.trades).toBeDefined()
    expect(Array.isArray(retrievedPosition!.trades)).toBe(true)
    expect(retrievedPosition!.trades).toHaveLength(0)
    expect(retrievedPosition!.journal_entry_ids).toBeDefined()
    expect(Array.isArray(retrievedPosition!.journal_entry_ids)).toBe(true)
    expect(retrievedPosition!.journal_entry_ids).toHaveLength(0)
  })

  it('[Integration] should migrate existing positions correctly when getAll is called', async () => {
    // Arrange - Create mix of legacy and modern positions
    const legacyPosition = {
      id: 'legacy-mixed-123',
      symbol: 'GOOGL',
      strategy_type: 'Long Stock' as const,
      target_entry_price: 2500,
      target_quantity: 10,
      profit_target: 2750,
      stop_loss: 2250,
      position_thesis: 'Mixed legacy test',
      created_date: new Date('2024-01-15T00:00:00.000Z'),
      status: 'planned' as const,
    }

    const modernPosition = createPosition({
      id: 'modern-mixed-123',
      symbol: 'AMZN',
    })

    await positionService.create(legacyPosition as any)
    await positionService.create(modernPosition)

    // Act - Retrieve all positions
    const allPositions = await positionService.getAll()

    // Assert - Should only have our 2 test positions
    const testPositions = allPositions.filter(p =>
      p.id === 'legacy-mixed-123' || p.id === 'modern-mixed-123'
    )
    expect(testPositions).toHaveLength(2)

    const legacy = testPositions.find(p => p.id === 'legacy-mixed-123')
    const modern = testPositions.find(p => p.id === 'modern-mixed-123')

    expect(legacy).toBeTruthy()
    expect(legacy!.trades).toEqual([])
    expect(legacy!.journal_entry_ids).toEqual([])

    expect(modern).toBeTruthy()
    expect(modern!.trades).toEqual([])
    expect(modern!.journal_entry_ids).toEqual([])
  })

  it('[Integration] should handle schema version compatibility', async () => {
    // Arrange - Create positions with different schema versions
    const v1Position = {
      id: 'v1-schema-123',
      symbol: 'NVDA',
      strategy_type: 'Long Stock' as const,
      target_entry_price: 450,
      target_quantity: 15,
      profit_target: 495,
      stop_loss: 405,
      position_thesis: 'V1 schema position',
      created_date: new Date('2024-01-15T00:00:00.000Z'),
      status: 'planned' as const,
    }

    const v2Position = createPosition({
      id: 'v2-schema-123',
      symbol: 'AMD',
    })

    await positionService.create(v1Position as any)
    await positionService.create(v2Position)

    // Act - Ensure both can be retrieved and processed
    const allPositions = await positionService.getAll()

    // Assert - Should only have our 2 test positions
    const testPositions = allPositions.filter(p =>
      p.id === 'v1-schema-123' || p.id === 'v2-schema-123'
    )
    expect(testPositions).toHaveLength(2)

    const v1 = testPositions.find(p => p.id === 'v1-schema-123')
    const v2 = testPositions.find(p => p.id === 'v2-schema-123')

    // Both should have the required fields
    expect(v1).toBeTruthy()
    expect(v1!.trades).toBeDefined()
    expect(v1!.journal_entry_ids).toBeDefined()

    expect(v2).toBeTruthy()
    expect(v2!.trades).toBeDefined()
    expect(v2!.journal_entry_ids).toBeDefined()
  })

  it('[Integration] should preserve existing data during migration', async () => {
    // Arrange - Create legacy position with existing data
    const legacyPosition = {
      id: 'legacy-preserve-123',
      symbol: 'NFLX',
      strategy_type: 'Long Stock' as const,
      target_entry_price: 400,
      target_quantity: 20,
      profit_target: 440,
      stop_loss: 360,
      position_thesis: 'Preserve legacy data',
      created_date: new Date('2024-01-15T00:00:00.000Z'),
      status: 'planned' as const,
      // Some legacy positions might have other custom fields
      custom_field: 'should be preserved' as any,
    }

    await positionService.create(legacyPosition as any)

    // Act - Retrieve and verify
    const retrieved = await positionService.getById('legacy-preserve-123')

    // Assert
    expect(retrieved).toBeTruthy()
    expect(retrieved!.id).toBe('legacy-preserve-123')
    expect(retrieved!.symbol).toBe('NFLX')
    expect(retrieved!.position_thesis).toBe('Preserve legacy data')
    expect(retrieved!.trades).toEqual([])
    expect(retrieved!.journal_entry_ids).toEqual([])
    // Custom field should still be preserved
    expect((retrieved as any).custom_field).toBe('should be preserved')
  })

  it('[Integration] should handle multiple migration scenarios', async () => {
    // Arrange - Create multiple legacy positions
    const legacyPositions = [
      {
        id: 'legacy-batch-1',
        symbol: 'INTC',
        strategy_type: 'Long Stock' as const,
        target_entry_price: 50,
        target_quantity: 100,
        profit_target: 55,
        stop_loss: 45,
        position_thesis: 'Batch legacy 1',
        created_date: new Date('2024-01-15T00:00:00.000Z'),
        status: 'planned' as const,
      },
      {
        id: 'legacy-batch-2',
        symbol: 'CSCO',
        strategy_type: 'Long Stock' as const,
        target_entry_price: 60,
        target_quantity: 80,
        profit_target: 66,
        stop_loss: 54,
        position_thesis: 'Batch legacy 2',
        created_date: new Date('2024-01-15T00:00:00.000Z'),
        status: 'planned' as const,
        journal_entry_ids: ['some-journal-id'], // Partial legacy
      }
    ]

    // Create all legacy positions
    for (const pos of legacyPositions) {
      await positionService.create(pos as any)
    }

    // Act - Retrieve all positions
    const allPositions = await positionService.getAll()

    // Assert - Should only have our 2 test positions
    const testPositions = allPositions.filter(p =>
      p.id === 'legacy-batch-1' || p.id === 'legacy-batch-2'
    )
    expect(testPositions).toHaveLength(2)

    // Both should be properly migrated
    testPositions.forEach(position => {
      expect(position.trades).toBeDefined()
      expect(Array.isArray(position.trades)).toBe(true)
      expect(position.journal_entry_ids).toBeDefined()
      expect(Array.isArray(position.journal_entry_ids)).toBe(true)
    })
  })

  it('[Integration] should maintain data integrity after multiple read/write cycles', async () => {
    // Arrange - Create legacy position
    const legacyPosition = {
      id: 'legacy-cycles-123',
      symbol: 'PYPL',
      strategy_type: 'Long Stock' as const,
      target_entry_price: 70,
      target_quantity: 50,
      profit_target: 77,
      stop_loss: 63,
      position_thesis: 'Cycles test',
      created_date: new Date('2024-01-15T00:00:00.000Z'),
      status: 'planned' as const,
    }

    await positionService.create(legacyPosition as any)

    // Act - Perform multiple read/write cycles
    for (let i = 0; i < 3; i++) {
      const position = await positionService.getById('legacy-cycles-123')
      expect(position).toBeTruthy()
      expect(position!.trades).toEqual([])
      expect(position!.journal_entry_ids).toEqual([])

      // Update position (this should preserve migrated fields)
      const updatedPosition = {
        ...position!,
        position_thesis: `Updated cycle ${i}`
      }
      await positionService.update(updatedPosition)
    }

    // Assert - Final verification
    const finalPosition = await positionService.getById('legacy-cycles-123')
    expect(finalPosition).toBeTruthy()
    expect(finalPosition!.trades).toEqual([])
    expect(finalPosition!.journal_entry_ids).toEqual([])
    expect(finalPosition!.position_thesis).toBe('Updated cycle 2')
  })

  it('[Integration] should handle database schema evolution gracefully', async () => {
    // Arrange - Create positions with different schema assumptions
    const minimalPosition = {
      id: 'minimal-123',
      symbol: 'UBER',
      strategy_type: 'Long Stock' as const,
      target_entry_price: 80,
      target_quantity: 40,
      profit_target: 88,
      stop_loss: 72,
      position_thesis: 'Minimal schema',
      created_date: new Date('2024-01-15T00:00:00.000Z'),
      status: 'planned' as const,
    }

    await positionService.create(minimalPosition as any)

    // Act - Perform various operations
    const retrieved = await positionService.getById('minimal-123')

    // Assert
    expect(retrieved).toBeTruthy()
    expect(retrieved!.trades).toBeDefined()
    expect(retrieved!.journal_entry_ids).toBeDefined()
  })

  it('[Integration] should ensure migration consistency across retrieval methods', async () => {
    // Arrange - Create a legacy position
    const legacyPosition = {
      id: 'legacy-consistency-123',
      symbol: 'SHOP',
      strategy_type: 'Long Stock' as const,
      target_entry_price: 90,
      target_quantity: 30,
      profit_target: 99,
      stop_loss: 81,
      position_thesis: 'Migration consistency test',
      created_date: new Date('2024-01-15T00:00:00.000Z'),
      status: 'planned' as const,
    }

    await positionService.create(legacyPosition as any)

    // Act - Retrieve using different methods
    const byId = await positionService.getById('legacy-consistency-123')
    const allPositions = await positionService.getAll()
    const byFilter = allPositions.filter(p => p.id === 'legacy-consistency-123')

    // Assert
    expect(byId).toBeTruthy()
    expect(byFilter).toHaveLength(1)

    const filtered = byFilter[0]

    // All should have consistent migrated data
    expect(byId!.trades).toEqual(filtered.trades)
    expect(byId!.journal_entry_ids).toEqual(filtered.journal_entry_ids)

    expect(byId!.trades).toEqual([])
    expect(byId!.journal_entry_ids).toEqual([])
    expect(filtered.trades).toEqual([])
    expect(filtered.journal_entry_ids).toEqual([])
  })

  it('[Integration] should handle edge cases in migration', async () => {
    // Arrange - Create position with null/undefined values that should be handled gracefully
    const edgeCasePosition = {
      id: 'edge-case-123',
      symbol: 'ZOOM',
      strategy_type: 'Long Stock' as const,
      target_entry_price: 100,
      target_quantity: 25,
      profit_target: 110,
      stop_loss: 90,
      position_thesis: 'Edge case migration',
      created_date: new Date('2024-01-15T00:00:00.000Z'),
      status: 'planned' as const,
      trades: null as any,
      journal_entry_ids: undefined as any,
    }

    // This should be handled gracefully during migration
    await expect(positionService.create(edgeCasePosition as any))
      .rejects.toThrow() // Should throw error for invalid data

    // Verify database is still in consistent state
    const allPositions = await positionService.getAll()
    const testPosition = allPositions.find(p => p.id === 'edge-case-123')
    expect(testPosition).toBeUndefined() // Should not have been created
  })

})