import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ServiceContainer } from '@/services/ServiceContainer'
import type { Position } from '@/lib/position'

describe('Integration: Position type support', () => {
  beforeEach(async () => {
    const deleteRequest = indexedDB.deleteDatabase('TradingJournalDB')
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
      deleteRequest.onblocked = () => resolve()
    })

    ServiceContainer.resetInstance()
    const services = ServiceContainer.getInstance()
    await services.initialize()
  })

  afterEach(async () => {
    ServiceContainer.resetInstance()
    const deleteRequest = indexedDB.deleteDatabase('TradingJournalDB')
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
      deleteRequest.onblocked = () => resolve()
    })
  })

  it('should persist option plan fields with correct types', async () => {
    const services = ServiceContainer.getInstance()
    const positionService = services.getPositionService()

    const shortPutPlan: Position = {
      id: 'pos-short-put-1',
      symbol: 'AAPL',
      strategy_type: 'Short Put',
      trade_kind: 'option',
      target_entry_price: 2.5,
      target_quantity: 1,
      profit_target: 1.0,
      stop_loss: 5.0,
      profit_target_basis: 'option_price',
      stop_loss_basis: 'stock_price',
      position_thesis: 'Sell premium at support',
      created_date: new Date('2025-01-02T00:00:00.000Z'),
      option_type: 'put',
      strike_price: 100,
      expiration_date: new Date('2099-01-17T00:00:00.000Z'),
      premium_per_contract: 2.5,
      status: 'planned',
      journal_entry_ids: [],
      trades: []
    }

    await positionService.create(shortPutPlan)

    const retrieved = await positionService.getById(shortPutPlan.id)
    expect(retrieved).toBeTruthy()
    expect(retrieved?.strategy_type).toBe('Short Put')
    expect(retrieved?.trade_kind).toBe('option')
    expect(retrieved?.option_type).toBe('put')
    expect(retrieved?.strike_price).toBe(100)
    expect(retrieved?.expiration_date).toBeInstanceOf(Date)
    expect(retrieved?.premium_per_contract).toBe(2.5)
    expect(retrieved?.profit_target_basis).toBe('option_price')
    expect(retrieved?.stop_loss_basis).toBe('stock_price')
  })

  it('should default strategy metadata for legacy positions', async () => {
    const services = ServiceContainer.getInstance()
    const positionService = services.getPositionService()

    const legacyPosition = {
      id: 'pos-legacy-1',
      symbol: 'MSFT',
      strategy_type: 'Long Stock',
      target_entry_price: 300,
      target_quantity: 50,
      profit_target: 330,
      stop_loss: 270,
      position_thesis: 'Legacy position',
      created_date: new Date('2024-01-15T00:00:00.000Z'),
      status: 'planned'
    }

    await positionService.create(legacyPosition as any)

    const retrieved = await positionService.getById('pos-legacy-1')
    expect(retrieved?.trade_kind).toBe('stock')
    expect(retrieved?.profit_target_basis).toBe('stock_price')
    expect(retrieved?.stop_loss_basis).toBe('stock_price')
  })
})
