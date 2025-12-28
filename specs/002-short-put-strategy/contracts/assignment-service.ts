/**
 * Assignment Service Contract
 *
 * Defines the interface for option assignment workflow.
 * Handles the multi-step process of recording assignment and creating
 * the resulting stock position.
 */

import type { Position, Trade, AssignmentEvent } from './types'

/**
 * Input for initiating assignment workflow
 */
export interface InitiateAssignmentInput {
  option_position_id: string
  contracts_assigned?: number  // Default: all open contracts
}

/**
 * Assignment preview - shows what will happen before confirmation
 */
export interface AssignmentPreview {
  /** Original option position */
  optionPosition: Position

  /** Number of contracts being assigned */
  contractsAssigned: number

  /** Number of contracts remaining (if partial) */
  contractsRemaining: number

  /** Strike price from position */
  strikePrice: number

  /** Premium received per share (total premium / 100) */
  premiumReceivedPerShare: number

  /** Resulting cost basis per share (strike - premium) */
  resultingCostBasis: number

  /** Total shares that will be assigned (contracts × 100) */
  totalShares: number

  /** Total cost of stock position (shares × strike) */
  totalCost: number
}

/**
 * Input for completing assignment with stock position details
 */
export interface CompleteAssignmentInput {
  option_position_id: string
  contracts_assigned: number

  // Stock position thesis (required)
  stock_position_thesis: string

  // Optional: different targets for stock position
  stock_profit_target?: number
  stock_stop_loss?: number

  // Assignment notes for journal
  assignment_notes: string
}

/**
 * Result of completed assignment
 */
export interface AssignmentResult {
  /** Updated option position (closed or reduced) */
  optionPosition: Position

  /** Newly created stock position */
  stockPosition: Position

  /** Assignment event record */
  assignmentEvent: AssignmentEvent

  /** BTC trade created on option position */
  btcTrade: Trade

  /** Buy trade created on stock position */
  stockBuyTrade: Trade
}

/**
 * Assignment Service Interface
 *
 * Orchestrates the multi-step assignment workflow.
 */
export interface IAssignmentService {
  /**
   * Initiate assignment workflow and get preview
   *
   * @param input - Assignment initiation data
   * @returns Preview of what assignment will create
   * @throws ValidationError if position is not assignable
   */
  initiateAssignment(input: InitiateAssignmentInput): Promise<AssignmentPreview>

  /**
   * Complete assignment workflow
   *
   * Atomically:
   * 1. Creates BTC trade at $0.00 on option position
   * 2. Creates new stock position in 'open' status
   * 3. Creates buy trade on stock position at strike price
   * 4. Creates assignment event linking both positions
   * 5. Creates journal entry with assignment prompts
   *
   * @param input - Assignment completion data
   * @returns Assignment result with all created entities
   * @throws ValidationError if input is invalid
   * @throws TransactionError if atomic operation fails
   */
  completeAssignment(input: CompleteAssignmentInput): Promise<AssignmentResult>

  /**
   * Validate assignment is possible
   *
   * Checks:
   * - Position is an option position
   * - Position has open contracts
   * - Current date is on/after expiration date
   * - Requested contracts <= open contracts
   *
   * @param positionId - Option position to validate
   * @param contractsToAssign - Number of contracts
   * @returns Validation result
   */
  validateAssignment(
    positionId: string,
    contractsToAssign: number
  ): Promise<{
    valid: boolean
    errors: string[]
  }>

  /**
   * Get assignment event by option position ID
   *
   * @param optionPositionId - Original option position
   * @returns Assignment event or null
   */
  getAssignmentByOptionPosition(
    optionPositionId: string
  ): Promise<AssignmentEvent | null>

  /**
   * Get assignment event by stock position ID
   *
   * @param stockPositionId - Resulting stock position
   * @returns Assignment event or null
   */
  getAssignmentByStockPosition(
    stockPositionId: string
  ): Promise<AssignmentEvent | null>

  /**
   * Calculate premium received per share from option trades
   *
   * @param trades - Option trades to analyze
   * @returns Premium per share (total premium received / 100)
   */
  calculatePremiumPerShare(trades: Trade[]): number

  /**
   * Calculate effective cost basis for assigned stock
   *
   * @param strikePrice - Option strike price
   * @param premiumPerShare - Premium received per share
   * @returns Effective cost basis (strike - premium)
   */
  calculateEffectiveCostBasis(
    strikePrice: number,
    premiumPerShare: number
  ): number
}
