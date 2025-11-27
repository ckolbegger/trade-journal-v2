import { PositionService } from '@/lib/position'
import { TradeService } from './TradeService'
import { JournalService } from './JournalService'
import { PriceService } from './PriceService'

/**
 * ServiceContainer - Dependency injection container
 *
 * Manages service lifecycle and dependencies across the application.
 * Implements singleton pattern with lazy initialization.
 */
export class ServiceContainer {
  private static instance: ServiceContainer | null = null

  private positionService?: PositionService
  private tradeService?: TradeService
  private journalService?: JournalService
  private priceService?: PriceService

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance of ServiceContainer
   */
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer()
    }
    return ServiceContainer.instance
  }

  /**
   * Get PositionService instance (lazy initialization)
   */
  getPositionService(): PositionService {
    if (!this.positionService) {
      this.positionService = new PositionService()
    }
    return this.positionService
  }

  /**
   * Get TradeService instance (lazy initialization)
   * Injects PositionService dependency
   */
  getTradeService(): TradeService {
    if (!this.tradeService) {
      const positionService = this.getPositionService()
      this.tradeService = new TradeService(positionService)
    }
    return this.tradeService
  }

  /**
   * Get JournalService instance (lazy initialization)
   */
  async getJournalService(): Promise<JournalService> {
    if (!this.journalService) {
      // JournalService requires database connection
      const db = await this.openDatabase()
      this.journalService = new JournalService(db)
    }
    return this.journalService
  }

  /**
   * Get PriceService instance (lazy initialization)
   */
  getPriceService(): PriceService {
    if (!this.priceService) {
      this.priceService = new PriceService()
    }
    return this.priceService
  }

  /**
   * Open database connection for services that need it
   * TODO: Use DatabaseConnection after services are refactored (Step 1.3)
   */
  private async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('TradingJournalDB', 3)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      request.onupgradeneeded = () => {
        // Schema initialization handled elsewhere
      }
    })
  }

  /**
   * Cleanup all services and close connections
   */
  cleanup(): void {
    if (this.positionService) {
      // Only call close if the method exists (for compatibility with mocks)
      if (typeof this.positionService.close === 'function') {
        this.positionService.close()
      }
      this.positionService = undefined
    }

    if (this.tradeService) {
      // Only call close if the method exists (for compatibility with mocks)
      if (typeof this.tradeService.close === 'function') {
        this.tradeService.close()
      }
      this.tradeService = undefined
    }

    this.journalService = undefined
    this.priceService = undefined
  }

  /**
   * Testing API: Inject mock services
   * Only use in tests to provide custom service implementations
   */
  setPositionService(service: PositionService): void {
    this.positionService = service
  }

  setTradeService(service: TradeService): void {
    this.tradeService = service
  }

  setJournalService(service: JournalService): void {
    this.journalService = service
  }

  setPriceService(service: PriceService): void {
    this.priceService = service
  }

  /**
   * Testing API: Reset singleton instance
   * Use in test cleanup to ensure tests start with fresh state
   */
  static resetInstance(): void {
    if (ServiceContainer.instance) {
      ServiceContainer.instance.cleanup()
      ServiceContainer.instance = null
    }
  }
}
