import type { Position, PositionService } from '@/lib/position'
import { TradeService } from '@/services/TradeService'
import type { JournalField } from '@/types/journal'

interface TradeData {
  trade_type: 'buy' | 'sell'
  quantity: number
  price: number
  timestamp: Date
  notes?: string
}

interface JournalData {
  entry_type: 'trade_execution'
  fields: Array<{
    name: string
    prompt: string
    value: string
  }>
}

export class TradeJournalTransaction {
  private tradeService: TradeService

  constructor(private positionService: PositionService) {
    this.tradeService = new TradeService(positionService)
  }

  async executeTradeWithJournal(
    positionId: string,
    tradeData: TradeData,
    journalData: JournalData
  ): Promise<Position> {
    // Validate position exists first
    const position = await this.positionService.getById(positionId)
    if (!position) {
      throw new Error(`Position not found: ${positionId}`)
    }

    // Validate journal data
    if (!journalData.fields || journalData.fields.length === 0) {
      throw new Error('At least one journal field is required')
    }

    // Step 1: Add trade (this validates trade data and updates position)
    let updatedPosition: Position
    try {
      updatedPosition = await this.tradeService.addTrade(positionId, tradeData)
    } catch (error) {
      // Trade validation or addition failed, rethrow
      throw error
    }

    // Step 2: Create journal entry
    try {
      // Get database connection from position service
      const db = await (this.positionService as any).getDB()

      // Create journal entry
      const journalEntry = {
        id: `journal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        position_id: positionId,
        trade_id: updatedPosition.trades[updatedPosition.trades.length - 1].id,
        entry_type: journalData.entry_type,
        fields: journalData.fields.map(f => ({
          name: f.name,
          prompt: f.prompt,
          response: f.value,
          required: false
        })) as JournalField[],
        created_at: new Date().toISOString(),
        executed_at: new Date().toISOString()
      }

      // Save journal entry to database
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(['journal_entries'], 'readwrite')
        const store = transaction.objectStore('journal_entries')
        const request = store.add(journalEntry)

        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      // Step 3: Update position with journal entry ID
      updatedPosition.journal_entry_ids.push(journalEntry.id)
      await this.positionService.update(updatedPosition)

      return updatedPosition
    } catch (error) {
      // Journal creation failed, rollback the trade by reverting position
      // Remove the last trade that was just added
      const rollbackPosition = await this.positionService.getById(positionId)
      if (rollbackPosition) {
        rollbackPosition.trades.pop()
        rollbackPosition.status = 'planned' // Reset status
        await this.positionService.update(rollbackPosition)
      }
      throw error
    }
  }
}
