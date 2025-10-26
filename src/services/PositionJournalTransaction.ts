import type { Position } from '@/lib/position'
import type { JournalEntry, JournalField } from '@/types/journal'
import { PositionService } from '@/lib/position'
import { JournalService } from '@/services/JournalService'
import { generatePositionId, generateJournalId } from '@/lib/uuid'

export interface CreatePositionData {
  symbol: string
  target_entry_price: number
  target_quantity: number
  profit_target: number
  stop_loss: number
  position_thesis: string
  journalFields: JournalField[]
}

export interface TransactionResult {
  position: Position
  journal: JournalEntry
}

export class PositionJournalTransaction {
  constructor(
    private positionService: PositionService,
    private journalService: JournalService
  ) {}

  /**
   * Create a position with associated journal entry in a transactional manner.
   *
   * Flow:
   * 1. Generate stable UUIDs for both entities
   * 2. Create journal entry first (with position ID reference)
   * 3. Create position with journal ID reference
   * 4. On error: rollback journal entry and throw error
   */
  async createPositionWithJournal(data: CreatePositionData): Promise<TransactionResult> {
    // Generate stable UUIDs for the transaction
    const positionId = generatePositionId()
    const journalId = generateJournalId()

    let journalCreated = false

    try {
      // 1. Create journal entry first (with known position ID)
      const journal = await this.journalService.create({
        id: journalId,
        position_id: positionId,
        entry_type: 'position_plan',
        fields: data.journalFields,
        created_at: new Date().toISOString()
      })
      journalCreated = true

      // 2. Create position with journal reference
      const position: Position = {
        id: positionId,
        symbol: data.symbol.toUpperCase(),
        strategy_type: 'Long Stock',
        target_entry_price: data.target_entry_price,
        target_quantity: data.target_quantity,
        profit_target: data.profit_target,
        stop_loss: data.stop_loss,
        position_thesis: data.position_thesis,
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [journalId]
      }

      const createdPosition = await this.positionService.create(position)

      return {
        position: createdPosition,
        journal
      }
    } catch (error) {
      // Rollback: delete journal entry if it was created
      if (journalCreated) {
        try {
          await this.journalService.delete(journalId)
        } catch (rollbackError) {
          console.error('Failed to rollback journal entry:', rollbackError)
        }
      }
      throw error
    }
  }

  /**
   * Get all journal entries for testing and debugging
   */
  async getAllJournalEntries(): Promise<JournalEntry[]> {
    // This is a helper method for testing - in practice we'd query by position/trade ID
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['journal_entries'], 'readonly')
      const store = transaction.objectStore('journal_entries')
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  private async getDB(): Promise<IDBDatabase> {
    // Access the same database as the services
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('TradingJournalDB', 3)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }
}