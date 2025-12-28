/**
 * Service Contracts Index
 *
 * Re-exports all service contract interfaces and types.
 */

// Types
export * from './types'

// Service Contracts
export type {
  IPositionService,
  CreatePositionInput,
  ValidationResult,
  FieldError,
  PositionMetrics
} from './position-service'

export type {
  ITradeService,
  AddStockTradeInput,
  AddOptionTradeInput,
  RecordExpirationInput,
  OptionAction
} from './trade-service'

export type {
  IAssignmentService,
  InitiateAssignmentInput,
  AssignmentPreview,
  CompleteAssignmentInput,
  AssignmentResult
} from './assignment-service'

export type {
  IPriceService,
  PriceEntry,
  PriceInput,
  StalenessResult,
  PriceChangeConfirmation
} from './price-service'

export type {
  IIntrinsicExtrinsicCalculator,
  ICostBasisCalculator,
  IPnLCalculator,
  IPositionStatusCalculator,
  FifoLot
} from './calculators'
