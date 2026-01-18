import { vi } from 'vitest'
import type { PositionService } from '@/lib/position'
import type { TradeService } from '@/services/TradeService'
import type { JournalService } from '@/services/JournalService'

export function createMockPositionService() {
  return {
    getById: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    getAll: vi.fn(),
    delete: vi.fn(),
    clearAll: vi.fn(),
    close: vi.fn(),
  } as any as PositionService
}

export function createMockTradeService() {
  return {
    create: vi.fn(),
    getByPositionId: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  } as any as TradeService
}

export function createMockJournalService() {
  return {
    create: vi.fn(),
    getAll: vi.fn(),
    getByPositionId: vi.fn(),
  } as any as JournalService
}