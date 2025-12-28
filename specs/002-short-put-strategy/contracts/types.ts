/**
 * Shared Type Definitions
 *
 * Core types used across all service contracts.
 */

// ============================================================================
// Enumerations
// ============================================================================

/**
 * Strategy types - extensible for future strategies
 */
export type StrategyType = 'Long Stock' | 'Short Put'
// Future: | 'Covered Call' | 'Cash Secured Put' | 'Long Call' | 'Long Put'

/**
 * Trade kind discriminator
 */
export type TradeKind = 'stock' | 'option'

/**
 * Position status (derived from trades)
 */
export type PositionStatus = 'planned' | 'open' | 'closed'

/**
 * Option type
 */
export type OptionType = 'call' | 'put'

/**
 * Option action codes
 */
export type OptionAction = 'STO' | 'BTC' | 'BTO' | 'STC'

/**
 * Price basis for targets/stops
 */
export type PriceBasis = 'stock_price' | 'option_price'

/**
 * Journal entry types
 */
export type JournalEntryType = 'position_plan' | 'trade_execution' | 'option_assignment'

// ============================================================================
// Core Entities
// ============================================================================

/**
 * Position - Immutable trade plan
 */
export interface Position {
  // Core identity
  id: string
  symbol: string
  strategy_type: StrategyType
  trade_kind: TradeKind

  // Plan fields (immutable after creation)
  target_entry_price: number
  target_quantity: number
  profit_target: number
  stop_loss: number
  profit_target_basis: PriceBasis
  stop_loss_basis: PriceBasis
  position_thesis: string
  created_date: Date

  // Option plan fields (present when trade_kind === 'option')
  option_type?: OptionType
  strike_price?: number
  expiration_date?: Date
  premium_per_contract?: number

  // Derived state
  status: PositionStatus
  trades: Trade[]
  journal_entry_ids: string[]
}

/**
 * Trade - Execution record
 */
export interface Trade {
  // Core identity
  id: string
  position_id: string
  trade_kind: TradeKind
  trade_type: 'buy' | 'sell'
  action?: OptionAction
  quantity: number
  price: number
  timestamp: Date
  notes?: string
  underlying: string

  // Option-specific fields
  occ_symbol?: string
  option_type?: OptionType
  strike_price?: number
  expiration_date?: Date
  contract_quantity?: number
  underlying_price_at_trade?: number

  // Assignment linkage
  created_stock_position_id?: string
  cost_basis_adjustment?: number
}

/**
 * Assignment Event - Links option assignment to resulting stock position
 */
export interface AssignmentEvent {
  id: string
  option_position_id: string
  stock_position_id: string
  assignment_date: Date
  contracts_assigned: number
  strike_price: number
  premium_received_per_share: number
  resulting_cost_basis: number
}

/**
 * Journal Entry - Extended with option-specific type
 */
export interface JournalEntry {
  id: string
  position_id: string
  trade_id?: string
  entry_type: JournalEntryType
  content: string
  created_date: Date
  prompts?: string[]
}

// ============================================================================
// Calculated Values
// ============================================================================

/**
 * Position metrics calculated from trades and prices
 */
export interface PositionMetrics {
  avgCost: number
  costBasis: number
  openQuantity: number
  pnl: number | null
  pnlPercentage: number | undefined
  intrinsicValue?: number
  extrinsicValue?: number
}

/**
 * Intrinsic/Extrinsic value breakdown
 */
export interface IntrinsicExtrinsicResult {
  intrinsicPerContract: number
  extrinsicPerContract: number
  intrinsicTotal: number
  extrinsicTotal: number
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Field-level validation error
 */
export interface FieldError {
  field: string
  message: string
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  errors: FieldError[]
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if position is an option position
 */
export function isOptionPosition(position: Position): boolean {
  return position.trade_kind === 'option'
}

/**
 * Check if trade is an option trade
 */
export function isOptionTrade(trade: Trade): boolean {
  return trade.trade_kind === 'option'
}

/**
 * Check if position is a short put
 */
export function isShortPut(position: Position): boolean {
  return position.strategy_type === 'Short Put'
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Standard contract multiplier (shares per contract)
 */
export const CONTRACT_MULTIPLIER = 100

/**
 * Price change threshold for confirmation (20%)
 */
export const PRICE_CHANGE_THRESHOLD = 0.20

/**
 * Assignment journal prompts
 */
export const ASSIGNMENT_PROMPTS = [
  'What happened that led to assignment?',
  'How do you feel about now owning this stock?',
  "What's your plan for the stock position?"
] as const
