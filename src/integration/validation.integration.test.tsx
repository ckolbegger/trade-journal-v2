import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ServiceContainer } from '@/services/ServiceContainer'
import type { Position } from '@/lib/position'

describe('Integration: Position validation', () => {
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

  it('should persist a valid short put plan', async () => {
    const services = ServiceContainer.getInstance()
    const positionService = services.getPositionService()

    const validShortPut: Position = {
      id: 'pos-short-put-valid',
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

    await expect(positionService.create(validShortPut)).resolves.toBeDefined()
  })

  it('should reject Short Put plans with trade_kind mismatch', async () => {
    const services = ServiceContainer.getInstance()
    const positionService = services.getPositionService()

    const invalidPlan: Position = {
      id: 'pos-short-put-invalid',
      symbol: 'AAPL',
      strategy_type: 'Short Put',
      trade_kind: 'stock',
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

    await expect(positionService.create(invalidPlan))
      .rejects.toThrow('trade_kind must be option for Short Put strategy')
  })

  it('should reject Short Put plans with expiration date in the past', async () => {
    const services = ServiceContainer.getInstance()
    const positionService = services.getPositionService()

    const invalidPlan: Position = {
      id: 'pos-short-put-expired',
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
      expiration_date: new Date('2000-01-01T00:00:00.000Z'),
      premium_per_contract: 2.5,
      status: 'planned',
      journal_entry_ids: [],
      trades: []
    }

    await expect(positionService.create(invalidPlan))
      .rejects.toThrow('expiration_date cannot be in the past')
  })
})
