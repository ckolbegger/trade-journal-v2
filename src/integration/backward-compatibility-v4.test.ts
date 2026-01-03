import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SchemaManager } from '@/services/SchemaManager'
import { ServiceContainer } from '@/services/ServiceContainer'
import type { Position } from '@/lib/position'

const dbName = 'TradingJournalDB'

describe('Integration: Backward compatibility v4', () => {
  beforeEach(async () => {
    await deleteDatabase()
    ServiceContainer.resetInstance()
  })

  afterEach(async () => {
    ServiceContainer.resetInstance()
    await deleteDatabase()
  })

  it('should upgrade v3 database to v4 and preserve positions', async () => {
    const legacyDb = await openDatabaseWithSchema(3)
    await seedLegacyPosition(legacyDb)
    legacyDb.close()

    const services = ServiceContainer.getInstance()
    await services.initialize()

    const positionService = services.getPositionService()
    const position = await positionService.getById('legacy-pos-v3')

    expect(position).toBeTruthy()
    expect(position?.symbol).toBe('AAPL')

    const upgradedDb = await openDatabase()
    expect(upgradedDb.version).toBe(4)

    const positionStore = upgradedDb.transaction(['positions'], 'readonly').objectStore('positions')
    expect(positionStore.indexNames.contains('strategy_type')).toBe(true)
    expect(positionStore.indexNames.contains('trade_kind')).toBe(true)

    upgradedDb.close()
  })
})

async function openDatabaseWithSchema(version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = () => {
      const db = request.result
      SchemaManager.initializeSchema(db, version, request.transaction || undefined)
    }
  })
}

async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

async function seedLegacyPosition(db: IDBDatabase): Promise<void> {
  const legacyPosition: Position = {
    id: 'legacy-pos-v3',
    symbol: 'AAPL',
    strategy_type: 'Long Stock',
    target_entry_price: 150,
    target_quantity: 100,
    profit_target: 165,
    stop_loss: 135,
    position_thesis: 'Legacy position',
    created_date: new Date('2024-01-15T00:00:00.000Z'),
    status: 'planned',
    journal_entry_ids: [],
    trades: []
  }

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(['positions'], 'readwrite')
    const store = transaction.objectStore('positions')
    store.add(legacyPosition)

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

async function deleteDatabase(): Promise<void> {
  const deleteRequest = indexedDB.deleteDatabase(dbName)
  await new Promise<void>((resolve) => {
    deleteRequest.onsuccess = () => resolve()
    deleteRequest.onerror = () => resolve()
    deleteRequest.onblocked = () => resolve()
  })
}
