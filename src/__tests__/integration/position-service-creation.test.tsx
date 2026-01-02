/**
 * Integration Tests: PositionService with Validator + Storage
 *
 * Tests verify PositionService.createPosition() correctly integrates with
 * PositionValidator and IndexedDB storage for position creation with journal entries.
 *
 * Constitutional Principle IV: Test-First Discipline
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import type { Position, PositionInput } from '@/lib/position'
import { PositionService } from '@/lib/position'
import { JournalService } from '@/services/JournalService'
import { ServiceContainer } from '@/services/ServiceContainer'

describe('PositionService Integration Tests', () => {
  let positionService: PositionService
  let journalService: JournalService

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

    positionService = services.getPositionService()
    journalService = services.getJournalService()
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

  describe('Valid Position Creation', () => {
    it('persists valid position and returns with generated ID', async () => {
      const input: PositionInput = {
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        trade_kind: 'stock',
        target_entry_price: 150,
        target_quantity: 100,
        profit_target: 160,
        stop_loss: 145,
        position_thesis: 'Apple has strong fundamentals and growth potential',
        journal_fields: [
          { name: 'rationale', prompt: 'Rationale', response: 'Strong earnings growth expected' }
        ]
      }

      const result = await positionService.createPosition(input, journalService)

      expect(result.id).toMatch(/^pos-\d+-[a-z0-9]+$/)
      expect(result.symbol).toBe('AAPL')
      expect(result.strategy_type).toBe('Long Stock')
      expect(result.trade_kind).toBe('stock')
      expect(result.target_entry_price).toBe(150)
      expect(result.target_quantity).toBe(100)
      expect(result.profit_target).toBe(160)
      expect(result.stop_loss).toBe(145)
      expect(result.position_thesis).toBe('Apple has strong fundamentals and growth potential')
      expect(result.status).toBe('planned')
      expect(result.journal_entry_ids).toHaveLength(1)
      expect(result.trades).toHaveLength(0)
      expect(result.created_date).toBeInstanceOf(Date)

      const persisted = await positionService.getById(result.id)
      expect(persisted).not.toBeNull()
      expect(persisted).toEqual(result)
    })

    it('creates Short Put position with option fields and journal entry', async () => {
      const input: PositionInput = {
        symbol: 'MSFT',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        option_type: 'put',
        strike_price: 380,
        expiration_date: new Date('2025-06-21'),
        premium_per_contract: 5.50,
        profit_target_basis: 'stock_price',
        stop_loss_basis: 'stock_price',
        target_entry_price: 375,
        target_quantity: 5,
        profit_target: 385,
        stop_loss: 370,
        position_thesis: 'Cloud growth thesis with support level test',
        journal_fields: [
          { name: 'rationale', prompt: 'Rationale', response: 'Strong cloud growth expected' },
          { name: 'risk_management', prompt: 'Risk Management', response: 'Defined max loss at strike - premium' }
        ]
      }

      const result = await positionService.createPosition(input, journalService)

      expect(result.id).toMatch(/^pos-\d+-[a-z0-9]+$/)
      expect(result.symbol).toBe('MSFT')
      expect(result.strategy_type).toBe('Short Put')
      expect(result.trade_kind).toBe('option')
      expect(result.option_type).toBe('put')
      expect(result.strike_price).toBe(380)
      expect(result.expiration_date).toEqual(new Date('2025-06-21'))
      expect(result.premium_per_contract).toBe(5.50)
      expect(result.status).toBe('planned')
      expect(result.journal_entry_ids).toHaveLength(1)

      const journalEntry = await journalService.getById(result.journal_entry_ids[0])
      expect(journalEntry).not.toBeNull()
      expect(journalEntry?.entry_type).toBe('position_plan')
      expect(journalEntry?.position_id).toBe(result.id)
      expect(journalEntry?.fields).toHaveLength(2)
      expect(journalEntry?.fields[0].response).toBe('Strong cloud growth expected')

      const positionJournals = await journalService.findByPositionId(result.id)
      expect(positionJournals).toHaveLength(1)
    })

    it('persists position to IndexedDB and can be retrieved via getAll', async () => {
      const input: PositionInput = {
        symbol: 'TSLA',
        strategy_type: 'Long Stock',
        trade_kind: 'stock',
        target_entry_price: 200,
        target_quantity: 50,
        profit_target: 250,
        stop_loss: 180,
        position_thesis: 'EV market leader with expanding margins',
        journal_fields: [
          { name: 'rationale', prompt: 'Rationale', response: 'Market share growth' }
        ]
      }

      await positionService.createPosition(input, journalService)

      const allPositions = await positionService.getAll()
      expect(allPositions).toHaveLength(1)
      expect(allPositions[0].symbol).toBe('TSLA')
    })
  })

  describe('Invalid Position Rejection', () => {
    it('rejects position with missing symbol', async () => {
      const input: PositionInput = {
        symbol: '',
        strategy_type: 'Long Stock',
        trade_kind: 'stock',
        target_entry_price: 150,
        target_quantity: 100,
        profit_target: 160,
        stop_loss: 145,
        position_thesis: 'Test thesis for validation',
        journal_fields: []
      }

      await expect(positionService.createPosition(input, journalService))
        .rejects.toThrow('Symbol is required')
    })

    it('rejects position with zero target entry price', async () => {
      const input: PositionInput = {
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        trade_kind: 'stock',
        target_entry_price: 0,
        target_quantity: 100,
        profit_target: 160,
        stop_loss: 145,
        position_thesis: 'Test thesis for validation',
        journal_fields: []
      }

      await expect(positionService.createPosition(input, journalService))
        .rejects.toThrow('Target entry price must be a positive number')
    })

    it('rejects position with negative target entry price', async () => {
      const input: PositionInput = {
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        trade_kind: 'stock',
        target_entry_price: -100,
        target_quantity: 100,
        profit_target: 160,
        stop_loss: 145,
        position_thesis: 'Test thesis for validation',
        journal_fields: []
      }

      await expect(positionService.createPosition(input, journalService))
        .rejects.toThrow('Target entry price must be a positive number')
    })

    it('rejects position with zero target quantity', async () => {
      const input: PositionInput = {
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        trade_kind: 'stock',
        target_entry_price: 150,
        target_quantity: 0,
        profit_target: 160,
        stop_loss: 145,
        position_thesis: 'Test thesis for validation',
        journal_fields: []
      }

      await expect(positionService.createPosition(input, journalService))
        .rejects.toThrow('Target quantity must be a positive number')
    })

    it('rejects position with thesis less than 10 characters', async () => {
      const input: PositionInput = {
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        trade_kind: 'stock',
        target_entry_price: 150,
        target_quantity: 100,
        profit_target: 160,
        stop_loss: 145,
        position_thesis: 'Short',
        journal_fields: []
      }

      await expect(positionService.createPosition(input, journalService))
        .rejects.toThrow('Position thesis must be at least 10 characters')
    })

    it('rejects Short Put without strike price', async () => {
      const input: PositionInput = {
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        option_type: 'put',
        strike_price: undefined as any,
        expiration_date: new Date('2025-06-21'),
        premium_per_contract: 5.50,
        target_entry_price: 150,
        target_quantity: 5,
        profit_target: 160,
        stop_loss: 145,
        position_thesis: 'Test thesis for short put validation',
        journal_fields: []
      }

      await expect(positionService.createPosition(input, journalService))
        .rejects.toThrow('Strike price is required for Short Put strategy')
    })

    it('rejects Short Put without expiration date', async () => {
      const input: PositionInput = {
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        option_type: 'put',
        strike_price: 380,
        expiration_date: undefined as any,
        premium_per_contract: 5.50,
        target_entry_price: 375,
        target_quantity: 5,
        profit_target: 385,
        stop_loss: 370,
        position_thesis: 'Test thesis for short put validation',
        journal_fields: []
      }

      await expect(positionService.createPosition(input, journalService))
        .rejects.toThrow('Expiration date is required for Short Put strategy')
    })

    it('rejects Short Put without premium per contract', async () => {
      const input: PositionInput = {
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        option_type: 'put',
        strike_price: 380,
        expiration_date: new Date('2025-06-21'),
        premium_per_contract: undefined as any,
        target_entry_price: 375,
        target_quantity: 5,
        profit_target: 385,
        stop_loss: 370,
        position_thesis: 'Test thesis for short put validation',
        journal_fields: []
      }

      await expect(positionService.createPosition(input, journalService))
        .rejects.toThrow('Premium per contract is required for Short Put strategy')
    })

    it('rejects Short Put with wrong trade_kind', async () => {
      const input: PositionInput = {
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        trade_kind: 'stock' as any,
        option_type: 'put',
        strike_price: 380,
        expiration_date: new Date('2025-06-21'),
        premium_per_contract: 5.50,
        target_entry_price: 375,
        target_quantity: 5,
        profit_target: 385,
        stop_loss: 370,
        position_thesis: 'Test thesis for short put validation',
        journal_fields: []
      }

      await expect(positionService.createPosition(input, journalService))
        .rejects.toThrow('Short Put strategy requires trade_kind to be "option"')
    })

    it('rejects Short Put with wrong option_type', async () => {
      const input: PositionInput = {
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        option_type: 'call' as any,
        strike_price: 380,
        expiration_date: new Date('2025-06-21'),
        premium_per_contract: 5.50,
        target_entry_price: 375,
        target_quantity: 5,
        profit_target: 385,
        stop_loss: 370,
        position_thesis: 'Test thesis for short put validation',
        journal_fields: []
      }

      await expect(positionService.createPosition(input, journalService))
        .rejects.toThrow('Short Put strategy requires option_type to be "put"')
    })

    it('rejects position with missing profit target', async () => {
      const input: PositionInput = {
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        trade_kind: 'stock',
        target_entry_price: 150,
        target_quantity: 100,
        profit_target: undefined as any,
        stop_loss: 145,
        position_thesis: 'Test thesis for validation',
        journal_fields: []
      }

      await expect(positionService.createPosition(input, journalService))
        .rejects.toThrow('Profit target must be a positive number')
    })

    it('rejects position with missing stop loss', async () => {
      const input: PositionInput = {
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        trade_kind: 'stock',
        target_entry_price: 150,
        target_quantity: 100,
        profit_target: 160,
        stop_loss: undefined as any,
        position_thesis: 'Test thesis for validation',
        journal_fields: []
      }

      await expect(positionService.createPosition(input, journalService))
        .rejects.toThrow('Stop loss must be a positive number')
    })
  })

  describe('Journal Entry Creation', () => {
    it('creates journal entry with thesis when position is created', async () => {
      const input: PositionInput = {
        symbol: 'NVDA',
        strategy_type: 'Long Stock',
        trade_kind: 'stock',
        target_entry_price: 500,
        target_quantity: 50,
        profit_target: 550,
        stop_loss: 480,
        position_thesis: 'AI chip demand thesis for NVIDIA',
        journal_fields: [
          { name: 'rationale', prompt: 'Rationale', response: 'AI market growth accelerating' }
        ]
      }

      const result = await positionService.createPosition(input, journalService)

      expect(result.journal_entry_ids).toHaveLength(1)
      const journalEntry = await journalService.getById(result.journal_entry_ids[0])

      expect(journalEntry).not.toBeNull()
      expect(journalEntry?.position_id).toBe(result.id)
      expect(journalEntry?.entry_type).toBe('position_plan')
      expect(journalEntry?.fields).toHaveLength(1)
      expect(journalEntry?.fields[0].name).toBe('rationale')
      expect(journalEntry?.fields[0].response).toBe('AI market growth accelerating')
    })

    it('creates multiple journal entries for different positions', async () => {
      const input1: PositionInput = {
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        trade_kind: 'stock',
        target_entry_price: 150,
        target_quantity: 100,
        profit_target: 160,
        stop_loss: 145,
        position_thesis: 'Apple growth thesis',
        journal_fields: [
          { name: 'rationale', prompt: 'Rationale', response: 'Earnings growth' }
        ]
      }

      const input2: PositionInput = {
        symbol: 'MSFT',
        strategy_type: 'Long Stock',
        trade_kind: 'stock',
        target_entry_price: 375,
        target_quantity: 50,
        profit_target: 400,
        stop_loss: 360,
        position_thesis: 'Microsoft cloud thesis',
        journal_fields: [
          { name: 'rationale', prompt: 'Rationale', response: 'Azure growth' }
        ]
      }

      const result1 = await positionService.createPosition(input1, journalService)
      const result2 = await positionService.createPosition(input2, journalService)

      const journal1 = await journalService.getById(result1.journal_entry_ids[0])
      const journal2 = await journalService.getById(result2.journal_entry_ids[0])

      expect(journal1?.fields[0].response).toBe('Earnings growth')
      expect(journal2?.fields[0].response).toBe('Azure growth')

      const allJournals = await journalService.getAll()
      expect(allJournals).toHaveLength(2)
    })
  })
})
