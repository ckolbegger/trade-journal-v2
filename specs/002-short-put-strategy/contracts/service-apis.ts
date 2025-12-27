# Service Layer API Contracts

**Feature**: 002-short-put-strategy
**Date**: 2025-12-27

## Overview

This document defines the internal API contracts for service layer functions. These services handle data access (IndexedDB operations) and coordinate business logic from the domain layer.

---

## PositionService (Extended)

**Module**: `src/services/PositionService.ts`

### Existing Methods (Unchanged)

All existing methods remain unchanged and backward compatible:

- `create(position: Position): Promise<Position>`
- `getById(id: string): Promise<Position | null>`
- `getAll(): Promise<Position[]>`
- `update(position: Position): Promise<void>`
- `delete(id: string): Promise<void>`
- `clearAll(): Promise<void>`

### Extended Methods

#### `createWithOptionStrategy`

Create a position with option strategy support.

```typescript
/**
 * Create a position with option strategy support
 *
 * Validates position data including option-specific fields,
 * then persists to IndexedDB.
 *
 * @param position - Position data (Long Stock or Short Put)
 * @returns Created position with generated ID
 * @throws ValidationError if validation fails
 * @throws IDBRequestError if database operation fails
 *
 * @example
 * const position = await positionService.createWithOptionStrategy({
 *   id: generateId(),
 *   symbol: 'AAPL',
 *   strategy_type: 'Short Put',
 *   option_type: 'put',
 *   strike_price: 100,
 *   expiration_date: new Date('2025-12-19'),
 *   premium_per_contract: 3.00,
 *   profit_target_basis: 'option_price',
 *   stop_loss_basis: 'stock_price',
 *   target_entry_price: 3.00,
 *   profit_target: 1.50,
 *   stop_loss: 105,
 *   target_quantity: 5,
 *   position_thesis: 'Bullish on AAPL, selling premium for income',
 *   created_date: new Date(),
 *   status: 'planned',
 *   journal_entry_ids: [],
 *   trades: []
 * })
 */
async createWithOptionStrategy(position: Position): Promise<Position>
```

**Implementation Notes**:
- Delegates to `PositionValidator.validatePosition()` and `validateOptionPosition()`
- Uses IndexedDB transaction with error handling
- Returns position with database-generated ID

---

#### `getPositionsRequiringPrices`

Get positions that need price updates for valuation.

```typescript
/**
 * Get positions requiring price updates
 *
 * Returns positions where valuation requires current prices.
 * For option positions, returns positions needing both stock and option prices.
 *
 * @returns Array of positions with price requirements
 *
 * @example
 * const positions = await positionService.getPositionsRequiringPrices()
 * // Returns: [
 * //   { position, needsStockPrice: true, needsOptionPrice: true, occSymbol: 'AAPL  250117P00105000' },
 * //   { position, needsStockPrice: true, needsOptionPrice: false, occSymbol: null }
 * // ]
 */
async getPositionsRequiringPrices(): Promise<Array<{
  position: Position
  needsStockPrice: boolean
  needsOptionPrice: boolean
  occSymbol?: string
}>>
```

**Implementation Notes**:
- Filters positions with `status === 'open'`
- For Short Put positions, checks both stock and option price availability
- Uses `PriceService` to check for existing price entries

---

## TradeService (Extended)

**Module**: `src/services/TradeService.ts`

### Existing Methods (Unchanged)

- `addTrade(positionId: string, trade: Trade): Promise<void>`

### Extended Methods

#### `addOptionTrade`

Add an option trade to a position.

```typescript
/**
 * Add an option trade to a position
 *
 * Validates option-specific fields, derives OCC symbol if needed,
 * and persists the trade. Handles all option action types (STO, BTC, BTO, STC).
 *
 * @param positionId - Parent position ID
 * @param trade - Trade data with option fields
 * @param underlyingPriceAtTrade - Stock price at time of option execution
 * @returns Updated position with new trade added
 * @throws ValidationError if validation fails
 * @throws ValidationError if trade details don't match position
 *
 * @example
 * const updatedPosition = await tradeService.addOptionTrade(
 *   positionId,
 *   {
 *     id: generateId(),
 *     position_id: positionId,
 *     trade_type: 'sell',
 *     action: 'STO',
 *     quantity: 5,
 *     price: 3.00,
 *     timestamp: new Date(),
 *     underlying: 'AAPL',
 *     option_type: 'put',
 *     strike_price: 100,
 *     expiration_date: new Date('2025-12-19'),
 *     underlying_price_at_trade: 148.50
 *   },
 *   148.50
 * )
 */
async addOptionTrade(
  positionId: string,
  trade: Trade,
  underlyingPriceAtTrade?: number
): Promise<Position>
```

**Implementation Notes**:
- Validates trade against position (strike, expiration, type must match)
- Derives `occ_symbol` from option details using `deriveOCCSymbol()`
- Stores `underlying_price_at_trade` for historical reference
- Updates position in transaction with journal entry

---

#### `recordAssignment`

Record option assignment and create resulting stock position.

```typescript
/**
 * Record option assignment and create stock position
 *
 * Creates a BTC trade at $0.00 to close the option position,
 * then creates a new stock position for the assigned shares.
 * Runs in a single transaction to ensure atomicity.
 *
 * @param positionId - Short put position being assigned
 * @param assignmentData - Assignment details
 * @returns Object with updated option position and new stock position
 * @throws ValidationError if validation fails
 * @throws IDBRequestError if database operation fails
 *
 * @example
 * const result = await tradeService.recordAssignment(
 *   positionId,
 *   {
 *     contractsAssigned: 5,
 *     assignmentDate: new Date('2025-12-19'),
 *     journalEntryId: journalId
 *   }
 * )
 * // Returns: {
 * //   optionPosition: { ... },  // Updated with BTC trade, status = 'closed'
 * //   stockPosition: { ... }    // New Long Stock position
 * // }
 */
async recordAssignment(
  positionId: string,
  assignmentData: {
    contractsAssigned: number
    assignmentDate: Date
    journalEntryId: string
  }
): Promise<{
  optionPosition: Position
  stockPosition: Position
}>
```

**Implementation Notes**:
1. Fetches the option position
2. Validates `contractsAssigned <= open quantity`
3. Creates BTC trade at $0.00 for the option
4. Calls `createAssignmentStockPosition()` to generate stock position
5. Saves both positions in a transaction
6. Links assignment trade to new stock position via `created_stock_position_id`

---

#### `recordExpirationWorthless`

Record that an option expired worthless.

```typescript
/**
 * Record option expiration worthless
 *
 * Creates a closing trade at $0.00, realizing the full premium
 * received as profit. Position status changes to 'closed'.
 *
 * @param positionId - Short put position expiring
 * @param expirationDate - Date of expiration
 * @returns Updated position with closing trade
 * @throws ValidationError if expiration date is in the future
 * @throws ValidationError if position has no open contracts
 *
 * @example
 * const updatedPosition = await tradeService.recordExpirationWorthless(
 *   positionId,
 *   new Date('2025-12-19')
 * )
 */
async recordExpirationWorthless(
  positionId: string,
  expirationDate: Date
): Promise<Position>
```

**Implementation Notes**:
- Validates `expirationDate >= position.expiration_date`
- Creates BTC trade with `price: 0` and `quantity: openQuantity`
- Updates position status to 'closed'
- Prompts for journal entry after recording

---

## PriceService (Extended)

**Module**: `src/services/PriceService.ts`

### Existing Methods (Unchanged)

- `upsertPrice(priceInput: SimplePriceInput): Promise<PriceHistory>`
- `getPrice(underlying: string, date: string): Promise<PriceHistory | null>`
- `getLatestPrice(underlying: string): Promise<PriceHistory | null>`
- `hasPriceFor(underlying: string, date: string): Promise<boolean>`

### Extended Methods

#### `upsertMultiplePrices`

Upsert multiple prices in a single transaction.

```typescript
/**
 * Upsert multiple price entries in a single transaction
 *
 * Used when updating both stock and option prices for a position.
 * Skips entries that already exist with same price (no unnecessary updates).
 *
 * @param priceInputs - Array of price inputs
 * @returns Array of upserted price histories
 *
 * @example
 * const prices = await priceService.upsertMultiplePrices([
 *   { underlying: 'AAPL', date: '2025-01-15', close: 150.00 },
 *   { underlying: 'AAPL  250117P00105000', date: '2025-01-15', close: 2.50 }
 * ])
 */
async upsertMultiplePrices(
  priceInputs: SimplePriceInput[]
): Promise<PriceHistory[]>
```

**Implementation Notes**:
- Uses IndexedDB transaction on `price_history` store
- For each input, checks if price exists and matches
- Only updates if price differs (avoid unnecessary writes)
- Returns array of created/updated PriceHistory objects

---

#### `getPricesForPosition`

Get all required prices for position valuation.

```typescript
/**
 * Get all prices required for position valuation
 *
 * For stock positions: returns stock price.
 * For option positions: returns both stock price and option price.
 *
 * @param position - Position to get prices for
 * @param date - Price date (defaults to latest)
 * @returns Object with available prices and staleness indicators
 *
 * @example
 * const result = await priceService.getPricesForPosition(
 *   shortPutPosition,
 *   '2025-01-15'
 * )
 * // Returns: {
 * //   stockPrice: { underlying: 'AAPL', close: 150.00, ... },
 * //   optionPrice: { underlying: 'AAPL  250117P00105000', close: 2.50, ... },
 * //   isStale: false,
 * //   missingPrices: []
 * // }
 */
async getPricesForPosition(
  position: Position,
  date?: string
): Promise<{
  stockPrice?: PriceHistory
  optionPrice?: PriceHistory
  isStale: boolean
  missingPrices: Array<'stock' | 'option'>
}>
```

**Implementation Notes**:
- For Short Put positions, looks up both stock symbol and OCC symbol
- Returns `isStale: true` if any required price is missing
- Returns `missingPrices` array indicating which prices are unavailable

---

## JournalService (Extended)

**Module**: `src/services/JournalService.ts`

### Existing Methods (Unchanged)

- `create(entry: JournalEntry): Promise<JournalEntry>`
- `getById(id: string): Promise<JournalEntry | null>`
- `getByPositionId(positionId: string): Promise<JournalEntry[]>`
- `getByTradeId(tradeId: string): Promise<JournalEntry[]>`
- `update(entry: JournalEntry): Promise<void>`

### Extended Methods

#### `createAssignmentJournalEntry`

Create a journal entry for option assignment.

```typescript
/**
 * Create journal entry for option assignment
 *
 * Uses assignment-specific prompts to guide trader reflection.
 *
 * @param positionId - Option position that was assigned
 * @param responses - Trader's responses to prompts
 * @returns Created journal entry
 *
 * @example
 * const entry = await journalService.createAssignmentJournalEntry(
 *   positionId,
 *   {
 *     assignment_cause: 'Market dropped below strike at expiration',
 *     feelings_about_stock: 'Comfortable holding at $97 basis',
 *     stock_plan: 'Will hold for recovery or sell covered calls'
 *   }
 * )
 */
async createAssignmentJournalEntry(
  positionId: string,
  responses: Record<string, string>
): Promise<JournalEntry>
```

**Implementation Notes**:
- Uses `OPTION_ASSIGNMENT_PROMPTS` from journal types
- Links entry to position via `position_id`
- Sets `entry_type: 'option_assignment'`

---

## SchemaManager (Extended)

**Module**: `src/services/SchemaManager.ts`

### Extended Methods

#### `CURRENT_VERSION`

Database version constant.

```typescript
static readonly CURRENT_VERSION = 4
```

---

#### `initializeSchema`

Initialize all database stores and handle migrations.

```typescript
/**
 * Initialize database schema and handle migrations
 *
 * Creates object stores and indexes.
 * Handles v3 → v4 migration for strategy_type field.
 *
 * @param db - IDBDatabase instance from onupgradeneeded event
 * @param version - New database version
 *
 * @implementation
 * static initializeSchema(db: IDBDatabase, version: number): void {
 *   // Create positions store
 *   if (!db.objectStoreNames.contains('positions')) {
 *     const store = db.createObjectStore('positions', { keyPath: 'id' })
 *     store.createIndex('symbol', 'symbol', { unique: false })
 *     store.createIndex('status', 'status', { unique: false })
 *     store.createIndex('created_date', 'created_date', { unique: false })
 *   }
 *
 *   // Create journal_entries store
 *   // Create price_history store
 *
 *   // Migration v3 → v4
 *   if (version === 4) {
 *     const transaction = db.transaction(['positions'], 'readwrite')
 *     const store = transaction.objectStore('positions')
 *     const request = store.openCursor()
 *
 *     request.onsuccess = (event) => {
 *       const cursor = (event.target as IDBRequest).result
 *       if (cursor) {
 *         const position = cursor.value
 *         if (!position.strategy_type) {
 *           position.strategy_type = 'Long Stock'
 *           cursor.update(position)
 *         }
 *         cursor.continue()
 *       }
 *     }
 *   }
 * }
 */
static initializeSchema(db: IDBDatabase, version: number): void
```

---

## ServiceContainer

**Module**: `src/services/ServiceContainer.ts`

No changes to ServiceContainer. It continues to provide singleton access to all services:

```typescript
export class ServiceContainer {
  private static instance: ServiceContainer | null = null
  private db: IDBDatabase | null = null

  static async getInstance(): Promise<ServiceContainer> {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer()
      await ServiceContainer.instance.initialize()
    }
    return ServiceContainer.instance
  }

  getPositionService(): PositionService { /* ... */ }
  getTradeService(): TradeService { /* ... */ }
  getJournalService(): JournalService { /* ... */ }
  getPriceService(): PriceService { /* ... */ }
}
```

---

## Error Types

### `ValidationError`

```typescript
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}
```

### `IDBRequestError`

```typescript
export class IDBRequestError extends Error {
  public readonly originalError: DOMException

  constructor(message: string, originalError: DOMException) {
    super(message)
    this.name = 'IDBRequestError'
    this.originalError = originalError
  }
}
```

---

## Transaction Patterns

### Position-Trade-Journal Transaction

When adding a trade to a position, use a transaction across all three stores:

```typescript
async addTradeWithJournal(
  positionId: string,
  trade: Trade,
  journalEntry: JournalEntry
): Promise<Position> {
  const db = this.db
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      ['positions', 'journal_entries'],
      'readwrite'
    )

    const positionStore = transaction.objectStore('positions')
    const journalStore = transaction.objectStore('journal_entries')

    // Add journal entry first
    journalStore.add(journalEntry)

    // Update position with new trade
    const getPositionRequest = positionStore.get(positionId)
    getPositionRequest.onsuccess = () => {
      const position = getPositionRequest.result
      position.trades.push(trade)
      position.status = PositionStatusCalculator.computeStatus(position.trades)
      positionStore.put(position)
    }

    transaction.oncomplete = () => resolve(position)
    transaction.onerror = () => reject(transaction.error)
  })
}
```

### Assignment Transaction

When recording assignment, use a transaction across positions stores:

```typescript
async recordAssignment(
  positionId: string,
  assignmentData: AssignmentData
): Promise<{ optionPosition: Position; stockPosition: Position }> {
  const db = this.db
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['positions'], 'readwrite')
    const store = transaction.objectStore('positions')

    // Get option position
    const getOptionRequest = store.get(positionId)

    getOptionRequest.onsuccess = () => {
      const optionPosition = getOptionRequest.result

      // Create BTC trade for option
      const btcTrade: Trade = {
        id: generateId(),
        position_id: positionId,
        trade_type: 'buy',
        action: 'BTC',
        quantity: assignmentData.contractsAssigned,
        price: 0,
        timestamp: assignmentData.assignmentDate,
        underlying: optionPosition.symbol,
        occ_symbol: deriveOCCSymbol(...)
      }

      optionPosition.trades.push(btcTrade)
      optionPosition.status = PositionStatusCalculator.computeStatus(
        optionPosition.trades
      )

      // Create stock position
      const stockPosition = createAssignmentStockPosition(
        optionPosition,
        btcTrade,
        assignmentData.contractsAssigned
      )

      // Save both
      store.put(optionPosition)
      store.add(stockPosition)
    }

    transaction.oncomplete = () => resolve({
      optionPosition: getOptionRequest.result,
      stockPosition: createAssignmentStockPosition(...)
    })
    transaction.onerror = () => reject(transaction.error)
  })
}
```
