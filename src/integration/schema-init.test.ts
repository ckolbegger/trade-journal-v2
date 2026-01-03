import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ServiceContainer } from '@/services/ServiceContainer'

describe('Integration: Schema initialization', () => {
  beforeEach(async () => {
    const deleteRequest = indexedDB.deleteDatabase('TradingJournalDB')
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
      deleteRequest.onblocked = () => resolve()
    })
    ServiceContainer.resetInstance()
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

  it('should initialize required object stores', async () => {
    const services = ServiceContainer.getInstance()
    await services.initialize()

    const db = await openDatabase('TradingJournalDB')

    expect(db.objectStoreNames.contains('positions')).toBe(true)
    expect(db.objectStoreNames.contains('journal_entries')).toBe(true)
    expect(db.objectStoreNames.contains('price_history')).toBe(true)

    db.close()
  })
})

function openDatabase(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}
