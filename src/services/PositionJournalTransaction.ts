import type { Position, StrategyType, PriceBasis } from '@/lib/position'
import type { JournalEntry, JournalField } from '@/types/journal'
import { PositionService } from '@/lib/position'
import { JournalService } from '@/services/JournalService'
import { generatePositionId, generateJournalId } from '@/lib/uuid'

export interface CreatePositionData {
  symbol: string
  strategy_type: StrategyType
  target_entry_price: number
  target_quantity: number
  profit_target: number
  stop_loss: number
  position_thesis: string
  journalFields: JournalField[]
  // Option-specific fields
  strike_price?: number
  expiration_date?: Date
  premium_per_contract?: number
  profit_target_basis?: PriceBasis
  stop_loss_basis?: PriceBasis
}

export interface TransactionResult {
  position: Position
  journal: JournalEntry
}

export class PositionJournalTransaction {
  private positionService: PositionService
  private journalService: JournalService

  constructor(
    positionService: PositionService,
    journalService: JournalService
  ) {
    this.positionService = positionService
    this.journalService = journalService
  }

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
        strategy_type: data.strategy_type,
        trade_kind: data.strategy_type === 'Short Put' ? 'option' : 'stock',
        target_entry_price: data.target_entry_price,
        target_quantity: data.target_quantity,
        profit_target: data.profit_target,
        stop_loss: data.stop_loss,
        position_thesis: data.position_thesis,
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [journalId],
        trades: [], // New position plan has no trades yet
        // Option-specific fields
        ...(data.strategy_type === 'Short Put' && {
          option_type: 'put',
          strike_price: data.strike_price,
          expiration_date: data.expiration_date,
          premium_per_contract: data.premium_per_contract,
          profit_target_basis: data.profit_target_basis,
          stop_loss_basis: data.stop_loss_basis
        })
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
}