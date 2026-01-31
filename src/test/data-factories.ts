import type { Position, Trade } from '@/lib/position'

/**
 * Test Data Factories for Position Entities
 *
 * These factories eliminate duplication in test data creation and provide
 * consistent, realistic test data across all test files.
 */

// Default position data with sensible defaults
const DEFAULT_POSITION_DATA = {
  strategy_type: 'Long Stock' as const,
  status: 'planned' as const,
  created_date: new Date('2024-01-15')
}

/**
 * Create a position with optional overrides using destructuring
 * @param overrides - Position properties to override defaults
 * @returns A complete position object
 */
export const createPosition = (overrides: Partial<Position> = {}): Position => {
  const {
    symbol = 'AAPL',
    target_entry_price = 150,
    target_quantity = 100,
    profit_target = 170,
    stop_loss = 140,
    position_thesis = 'Strong earnings expected',
    id = `pos-${Date.now()}`,
    strategy_type,
    status,
    created_date,
    trades = [],
    journal_entry_ids = [],
    // Option-specific fields (optional)
    trade_kind,
    option_type,
    strike_price,
    expiration_date,
    premium_per_contract,
    profit_target_basis,
    stop_loss_basis
  } = overrides

  const position: Position = {
    id,
    symbol,
    strategy_type: strategy_type || DEFAULT_POSITION_DATA.strategy_type,
    target_entry_price,
    target_quantity,
    profit_target,
    stop_loss,
    position_thesis,
    status: status || DEFAULT_POSITION_DATA.status,
    created_date: created_date || DEFAULT_POSITION_DATA.created_date,
    journal_entry_ids,
    trades
  }

  // Add optional option-specific fields only if provided
  if (trade_kind !== undefined) position.trade_kind = trade_kind
  if (option_type !== undefined) position.option_type = option_type
  if (strike_price !== undefined) position.strike_price = strike_price
  if (expiration_date !== undefined) position.expiration_date = expiration_date
  if (premium_per_contract !== undefined) position.premium_per_contract = premium_per_contract
  if (profit_target_basis !== undefined) position.profit_target_basis = profit_target_basis
  if (stop_loss_basis !== undefined) position.stop_loss_basis = stop_loss_basis

  return position
}

/**
 * Create multiple positions with consistent data patterns
 * @param count - Number of positions to create
 * @param baseSymbol - Base symbol for position naming (e.g., 'STOCK' -> STOCK1, STOCK2)
 * @param overrides - Common overrides to apply to all positions
 * @returns Array of position objects
 */
export const createPositions = (
  count: number,
  baseSymbol: string = 'TEST',
  overrides: Partial<Position> = {}
): Position[] => {
  return Array.from({ length: count }, (_, index) => {
    const symbolIndex = index + 1
    return createPosition({
      ...overrides,
      id: `pos-${Date.now() + index}`,
      symbol: `${baseSymbol}${symbolIndex}`,
      position_thesis: `${baseSymbol}${symbolIndex} investment thesis`
    })
  })
}

/**
 * Create realistic stock position with common trading patterns
 * @param symbol - Stock symbol
 * @param config - Price and quantity configuration
 * @returns A realistic stock position object
 */
export const createStockPosition = (
  symbol: string,
  config: {
    entryPrice?: number
    quantity?: number
    profitTargetPercent?: number
    stopLossPercent?: number
  } = {}
): Position => {
  const {
    entryPrice = 150,
    quantity = 100,
    profitTargetPercent = 13.33, // ~10% profit target
    stopLossPercent = 6.67        // ~7% stop loss
  } = config

  const profitTarget = Math.round(entryPrice * (1 + profitTargetPercent / 100))
  const stopLoss = Math.round(entryPrice * (1 - stopLossPercent / 100))

  return createPosition({
    symbol,
    target_entry_price: entryPrice,
    target_quantity: quantity,
    profit_target: profitTarget,
    stop_loss: stopLoss,
    position_thesis: `${symbol} position with ${profitTargetPercent}% profit target and ${stopLossPercent}% stop loss`
  })
}

/**
 * Common test position sets for consistent testing
 */
export const TEST_POSITIONS = {
  /** Single position for basic tests */
  single: createPosition({
    id: 'pos-1',
    symbol: 'AAPL',
    target_entry_price: 150,
    target_quantity: 100,
    profit_target: 170,
    stop_loss: 140,
    position_thesis: 'Strong earnings expected'
  }),

  /** Multiple positions for list testing */
  multiple: [
    createPosition({
      id: 'pos-1',
      symbol: 'AAPL',
      target_entry_price: 150,
      target_quantity: 100,
      profit_target: 170,
      stop_loss: 140,
      position_thesis: 'Strong earnings expected',
      created_date: new Date('2024-01-15')
    }),
    createPosition({
      id: 'pos-2',
      symbol: 'TSLA',
      target_entry_price: 200,
      target_quantity: 50,
      profit_target: 250,
      stop_loss: 180,
      position_thesis: 'EV adoption accelerating',
      created_date: new Date('2024-01-09')
    })
  ],

  /** Tech stocks portfolio */
  techPortfolio: [
    createStockPosition('AAPL', { entryPrice: 150, quantity: 100 }),
    createStockPosition('MSFT', { entryPrice: 300, quantity: 50 }),
    createStockPosition('GOOGL', { entryPrice: 2500, quantity: 10 })
  ],

  /** High-risk growth stocks */
  growthPortfolio: [
    createStockPosition('TSLA', { entryPrice: 200, quantity: 75, profitTargetPercent: 20, stopLossPercent: 10 }),
    createStockPosition('NVDA', { entryPrice: 400, quantity: 25, profitTargetPercent: 25, stopLossPercent: 12 }),
    createStockPosition('PLTR', { entryPrice: 20, quantity: 500, profitTargetPercent: 30, stopLossPercent: 15 })
  ]
} as const

/**
 * Position creation helpers for integration tests
 * These create positions exactly as the PositionCreate component would
 */
export const createIntegrationPosition = (overrides: Partial<Position> = {}): Position => {
  return createPosition({
    ...overrides,
    // Integration tests typically use current timestamp
    created_date: new Date()
  })
}

export const createIntegrationPositions = (count: number): Position[] => {
  return createPositions(count, 'INT')
}

/** Specific test data for integration tests to match original expectations */
export const createIntegrationTestData = () => {
  const timestamp = Date.now()
  return {
    multiple: [
      createPosition({
        id: `pos-${timestamp}`,
        symbol: 'AAPL',
        target_entry_price: 150,
        target_quantity: 100,
        profit_target: 165,
        stop_loss: 135,
        position_thesis: 'First position thesis'
      }),
      createPosition({
        id: `pos-${timestamp + 1}`,
        symbol: 'MSFT',
        target_entry_price: 300,
        target_quantity: 50,
        profit_target: 330,
        stop_loss: 270,
        position_thesis: 'Second position thesis'
      })
    ],

    navigation: createPosition({
      id: `pos-${timestamp + 2}`,
      symbol: 'TSLA',
      target_entry_price: 200,
      target_quantity: 75,
      profit_target: 220,
      stop_loss: 180,
      position_thesis: 'Test navigation thesis'
    })
  }
}

export function createTrade(overrides: Partial<Trade> = {}): Trade {
  return {
    id: `trade-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    position_id: 'pos-123',
    trade_type: 'buy',
    quantity: 100,
    price: 150.25,
    timestamp: new Date('2024-01-15T10:30:00.000Z'),
    underlying: 'AAPL',
    notes: 'Test trade execution',
    ...overrides
  }
}