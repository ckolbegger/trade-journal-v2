import { ServiceContainer } from '@/services/ServiceContainer'
import type { PositionService } from '@/lib/position'
import type { TradeService } from '@/services/TradeService'
import type { JournalService } from '@/services/JournalService'

export async function deleteDatabase(dbName: string = 'TradingJournalDB'): Promise<void> {
  const deleteRequest = indexedDB.deleteDatabase(dbName)
  await new Promise<void>((resolve) => {
    deleteRequest.onsuccess = () => resolve()
    deleteRequest.onerror = () => resolve()
    deleteRequest.onblocked = () => resolve()
  })
}

export async function setupTestServices(): Promise<{
  positionService: PositionService
  tradeService: TradeService
  journalService: JournalService
}> {
  await deleteDatabase()
  ServiceContainer.resetInstance()
  const services = ServiceContainer.getInstance()
  await services.initialize()
  return {
    positionService: services.getPositionService(),
    tradeService: services.getTradeService(),
    journalService: services.getJournalService()
  }
}

export async function teardownTestServices(): Promise<void> {
  ServiceContainer.resetInstance()
  await deleteDatabase()
}