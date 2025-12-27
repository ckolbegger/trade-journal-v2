# Short Put Strategy Support - Specification

## Overview

Add support for Short Put option strategy as the first option type in the trading journal. This establishes the foundation for future option strategies (covered calls, wheel, multi-leg spreads) while maintaining the core Position/Trade separation architecture.

---

## Clarifications

### Session 2025-12-26

- Q: Where should cost basis adjustment be stored for assigned stock positions? → A: Store `cost_basis_adjustment` field on the stock buy trade created at assignment (provides audit trail and tax reporting data)
- Q: How should partial assignment be handled (e.g., 2 of 5 contracts assigned)? → A: Support partial assignment - record assigned trade for partial quantity, create stock position for assigned shares, remaining contracts keep original position open
- Q: How should validation errors be displayed to users? → A: Inline field errors - red text below each invalid field, form submit blocked until resolved
- Q: Can user record "expired" trade before actual expiration date? → A: Strict - "Expired" only allowed on/after expiration_date; early closes must use "buy_to_close" with actual price to maintain accurate trading statistics

---

## 1. Data Model Changes

### 1.1 Position Interface Extensions

```typescript
interface Position {
  // Existing fields
  id: string
  symbol: string
  created_date: Date
  status: 'planned' | 'open' | 'closed'  // Derived from trades
  journal_entry_ids: string[]
  trades: Trade[]

  // Extended strategy type
  strategy_type: 'Long Stock' | 'Short Put'  // Extensible for future

  // Stock-specific plan fields (used by Long Stock)
  target_entry_price?: number
  target_quantity?: number      // Shares for stock
  profit_target?: number        // Stock price target
  stop_loss?: number            // Stock price stop

  // Option-specific plan fields (used by Short Put)
  strike_price?: number
  expiration_date?: string      // YYYY-MM-DD
  contract_quantity?: number    // Number of contracts
  target_premium?: number       // Minimum total $ premium to accept
  premium_profit_target?: number // Total $ profit to close early
  stock_stop_loss?: number      // Stock price that triggers exit
  max_loss?: number             // Maximum total $ loss tolerance

  // Common
  position_thesis: string
}
```

### 1.2 Trade Interface Extensions

```typescript
interface Trade {
  // Existing fields
  id: string
  position_id: string
  quantity: number              // Shares for stock, contracts for options
  price: number                 // Per-share for stock, per-contract for options
  timestamp: Date
  notes?: string
  underlying: string            // Stock symbol or OCC option symbol

  // Extended trade type
  trade_type: 'buy' | 'sell' | 'sell_to_open' | 'buy_to_close' | 'expired' | 'assigned'

  // Option-specific fields (required when underlying is option)
  option_type?: 'CALL' | 'PUT'
  strike_price?: number
  expiration_date?: string      // YYYY-MM-DD

  // Assignment linkage
  assigned_position_id?: string  // Links to stock position created on assignment

  // Cost basis adjustment (for trades created via assignment)
  cost_basis_adjustment?: number  // Premium received that reduces effective basis
}
```

### 1.3 PriceHistory (No Changes)

Existing structure supports options:
- `underlying` field accepts OCC symbols
- OHLC structure works for options (only close used initially)

---

## 2. OCC Symbol Generation

### 2.1 Format

Standard OCC option symbol: `SYMBOL  YYMMDDTSSSSSSSS`
- Symbol: 1-6 characters, left-padded with spaces to 6
- YYMMDD: Expiration date
- T: Option type (C = Call, P = Put)
- SSSSSSSS: Strike price x 1000, zero-padded to 8 digits

### 2.2 Utility Function

```typescript
function generateOCCSymbol(
  symbol: string,
  expirationDate: string,  // YYYY-MM-DD
  optionType: 'CALL' | 'PUT',
  strikePrice: number
): string
```

Example: `generateOCCSymbol('AAPL', '2025-01-17', 'PUT', 150)` returns `'AAPL  250117P00150000'`

---

## 3. Position Lifecycle - Short Put

### 3.1 Position Creation Flow

1. User selects strategy type: "Short Put"
2. User enters plan fields:
   - Symbol (underlying stock)
   - Strike price
   - Expiration date
   - Contract quantity (target)
   - Target premium (minimum total $ to accept)
   - Premium profit target (total $ to close early)
   - Stock stop loss (price trigger)
   - Max loss (total $ tolerance)
   - Position thesis (required journal entry)
3. Position created with status `'planned'`

### 3.2 Trade Execution - Sell to Open

1. User adds trade to Short Put position
2. Trade type: `sell_to_open`
3. Fields:
   - Quantity (contracts sold)
   - Price (premium per contract received)
   - Timestamp
   - Notes (optional)
4. System generates OCC symbol for `underlying` field
5. Position status transitions to `'open'`
6. Journal entry required for trade execution

### 3.3 Trade Execution - Buy to Close

1. User adds closing trade
2. Trade type: `buy_to_close`
3. Fields:
   - Quantity (contracts closed)
   - Price (premium per contract paid)
   - Timestamp
   - Notes (optional)
4. P&L calculated: (sell price - buy price) x quantity x 100
5. If all contracts closed, position status becomes `'closed'`

### 3.4 Trade Execution - Expired Worthless

1. User records expiration
2. Trade type: `expired`
3. Price: `0.00` (auto-filled)
4. Quantity: remaining open contracts
5. P&L: full premium received (sell price x quantity x 100)
6. Position status becomes `'closed'`

### 3.5 Trade Execution - Assignment

1. User records assignment
2. Trade type: `assigned`
3. Price: `0.00` (auto-filled, same as expiration)
4. Quantity: contracts assigned (may be partial, e.g., 2 of 5)
5. Option P&L for assigned contracts: full premium received for those contracts
6. **Assignment Flow Triggered** (see Section 4)
7. Position status:
   - If all contracts now closed (assigned + any prior closes): status becomes `'closed'`
   - If contracts remain open: status stays `'open'`, user can add more trades later

---

## 4. Assignment Flow

When a short put is assigned:

### 4.1 Step 1: Record Assignment Trade

- Trade type: `assigned`
- Price: $0.00
- Option position P&L finalized (full premium = profit)

### 4.2 Step 2: Prompt User for Stock Position Plan

Display modal/flow: "You've been assigned {assigned_contracts x 100} shares of {symbol} at ${strike}. Set your targets for this stock position."

Note: For partial assignments, only the assigned quantity triggers stock position creation. Remaining contracts stay open.

**Auto-populated fields:**

| Field | Value |
|-------|-------|
| Symbol | Same as option underlying |
| Strategy type | `'Long Stock'` |
| Target quantity | assigned_contracts x 100 |
| Target entry price | Strike price |

**User must complete:**

| Field | Description |
|-------|-------------|
| Profit target | Stock price target |
| Stop loss | Stock price stop |
| Position thesis | Required journal entry |

**Display for reference (not editable):**

- Premium received from put: ${premium}
- Effective cost basis: ${strike - (premium/100)} per share

### 4.3 Step 3: Create Stock Position and Trade

1. Create new Long Stock position with user-provided plan
2. Automatically add opening trade:
   - Trade type: `buy`
   - Quantity: assigned_contracts x 100
   - Price: Strike price
   - Notes: Auto-generated "Acquired via assignment from position {put_position_id}"
   - `cost_basis_adjustment`: Premium received for assigned contracts (e.g., 2 contracts at $1.00 = $200)
3. P&L calculation uses: Effective basis = strike - (cost_basis_adjustment / shares)

### 4.4 Step 4: Link Positions

- Short Put trade gets `assigned_position_id` pointing to new stock position
- Enables tracing the assignment relationship

---

## 5. Pricing System Updates

### 5.1 Evening Routine Flow

For positions containing options:

1. Display position card with current legs
2. Prompt for stock price (underlying)
3. Prompt for option price (each unique option contract)
4. Calculate and display:
   - Intrinsic value
   - Extrinsic value
   - Unrealized P&L

### 5.2 Price Entry Fields

```typescript
interface PriceEntryRequest {
  underlying: string      // Stock symbol or OCC symbol
  date: string           // YYYY-MM-DD
  close: number          // Required
  open?: number          // Optional (Phase 1A: auto-fill from close)
  high?: number          // Optional
  low?: number           // Optional
}
```

### 5.3 Price Validation

- Option prices must be >= 0 (can be worthless)
- Stock prices must be > 0
- 20% change confirmation still applies

---

## 6. P&L Calculations

### 6.1 Short Put Unrealized P&L

```
unrealized_pnl = (premium_received - current_option_price) x contracts x 100
```

Where:
- `premium_received` = sell_to_open trade price
- `current_option_price` = latest close from PriceHistory

### 6.2 Short Put Realized P&L

```
realized_pnl = (sell_price - buy_price) x contracts x 100
```

Applies to:
- `buy_to_close`: buy_price = trade price
- `expired`: buy_price = 0
- `assigned`: buy_price = 0

### 6.3 Contract Multiplier

Hardcoded as `100` for MVP. Store as constant:

```typescript
const OPTION_CONTRACT_MULTIPLIER = 100
```

---

## 7. Intrinsic vs Extrinsic Value

### 7.1 Calculation (Put Option)

```typescript
function calculatePutValues(
  strikePrice: number,
  currentStockPrice: number,
  currentOptionPrice: number
): { intrinsic: number; extrinsic: number } {
  const intrinsic = Math.max(0, strikePrice - currentStockPrice)
  const extrinsic = currentOptionPrice - intrinsic
  return { intrinsic, extrinsic }
}
```

### 7.2 Display

**Trade Detail View:**
- Intrinsic value: ${X.XX} per contract
- Extrinsic value: ${X.XX} per contract
- Total intrinsic: ${X.XX} (x contracts x 100)
- Total extrinsic: ${X.XX} (x contracts x 100)

**Position Detail View:**
- Rolled up total extrinsic value across all option legs

### 7.3 Requirements

Both stock and option prices must be entered to display. If either is missing, show "Price data required" instead.

---

## 8. UI Changes

### 8.1 Position Creation

- Strategy type selector: "Long Stock" | "Short Put"
- Dynamic form fields based on strategy type
- Strike price picker or manual entry
- Expiration date picker
- Premium/loss fields with $ formatting

### 8.2 Trade Execution Form

- Trade type selector based on position strategy:
  - Long Stock: Buy | Sell
  - Short Put: Sell to Open | Buy to Close | Expired | Assigned
- Option fields auto-populated from position plan
- Price field labeled appropriately ("Premium per contract")

### 8.3 Position Dashboard

- Strategy type badge on position cards
- Option positions show: Strike, Expiration, Premium
- Intrinsic/Extrinsic summary when prices available

### 8.4 Position Detail View

- Plan section shows option-specific fields
- Trade history shows trade types with appropriate labels
- P&L section shows mark-to-market and intrinsic/extrinsic breakdown

### 8.5 Assignment Modal

- Triggered when user selects "Assigned" trade type
- Guides user through stock position plan creation
- Shows premium received and effective cost basis
- Creates linked positions upon completion

---

## 9. Validation Rules

### 9.0 Error Display Pattern

- **Inline field errors**: Red text displayed directly below each invalid field
- **Form submission blocked**: Submit button disabled or displays errors until all fields valid
- **Real-time validation**: Errors appear/clear as user corrects input
- **Focus management**: On submit attempt with errors, focus moves to first invalid field

### 9.1 Position Validation (Short Put)

| Field | Rule |
|-------|------|
| strike_price | Required, > 0 |
| expiration_date | Required, valid date, >= today |
| contract_quantity | Required, > 0, integer |
| target_premium | Required, > 0 |
| premium_profit_target | Optional, > 0 if provided |
| stock_stop_loss | Optional, > 0 if provided |
| max_loss | Optional, > 0 if provided |
| position_thesis | Required, non-empty |

### 9.2 Trade Validation (Options)

| Field | Rule |
|-------|------|
| trade_type | Must be valid option trade type |
| quantity | > 0, integer, <= remaining open contracts for closes |
| price | >= 0 (can be 0 for expired/assigned) |
| option_type | Required, 'PUT' for short put |
| strike_price | Required, must match position |
| expiration_date | Required, must match position |

### 9.3 Trade Type Constraints

| Trade Type | Date Constraint |
|------------|-----------------|
| sell_to_open | Allowed anytime before expiration |
| buy_to_close | Allowed anytime position is open |
| expired | Only allowed on or after position's expiration_date |
| assigned | Only allowed on or after position's expiration_date |

Note: Early exits before expiration must use `buy_to_close` with actual market price to maintain accurate P&L statistics.

---

## 10. Journal Entry Types

### 10.1 New Entry Types

```typescript
type JournalEntryType =
  | 'position_plan'      // Existing
  | 'trade_execution'    // Existing
  | 'option_assignment'  // New: documents assignment event
```

### 10.2 Assignment Journal Prompts

- "What happened that led to assignment?"
- "How do you feel about now owning this stock?"
- "What's your plan for the stock position?"

---

## 11. Future Considerations

### 11.1 Covered Calls (Next Phase)

- Strategy type: `'Covered Call'`
- Position contains: Long Stock leg + Short Call leg
- Assignment closes call, sells stock

### 11.2 Wheel Strategy (Future)

- Strategy type: `'Wheel'`
- Assignment behavior: Option A (stay in same position)
- Position cycles through put -> stock -> call phases

### 11.3 Multi-Leg Positions

- Current architecture supports multiple trades with different underlyings
- Each leg tracked separately for P&L
- Rolled-up position P&L sums all legs

---

## 12. Database Migration

### 12.1 Schema Version

Increment IndexedDB version to trigger upgrade.

### 12.2 Migration Steps

1. Existing positions get `strategy_type: 'Long Stock'` if undefined
2. No other migrations needed - new fields are optional

---

## 13. Test Scenarios

### 13.1 Short Put Lifecycle

1. Create Short Put position plan
2. Execute sell-to-open trade
3. Enter stock and option prices
4. Verify intrinsic/extrinsic calculation
5. Execute buy-to-close
6. Verify realized P&L

### 13.2 Expiration Worthless

1. Create and open Short Put
2. Record expiration (price = $0)
3. Verify P&L = full premium

### 13.3 Assignment Flow

1. Create and open Short Put
2. Record assignment
3. Complete stock position plan in modal
4. Verify stock position created with correct basis
5. Verify positions are linked

### 13.4 Pricing Flow

1. Open Short Put position
2. Evening routine: enter both stock and option prices
3. Verify intrinsic/extrinsic displayed
4. Verify unrealized P&L calculation

---

## 14. Acceptance Criteria

- [ ] User can create Short Put position with option-specific plan fields
- [ ] User can execute sell-to-open trade with premium
- [ ] OCC symbol auto-generated from position fields
- [ ] User can enter both stock and option prices in pricing flow
- [ ] Intrinsic and extrinsic values displayed when prices available
- [ ] User can close via buy-to-close, expired, or assigned
- [ ] Assignment triggers guided stock position creation
- [ ] New stock position has correct cost basis (strike - premium)
- [ ] Positions linked via assigned_position_id
- [ ] P&L calculations correct for all close scenarios
- [ ] Journal entries required at each decision point
- [ ] Existing Long Stock functionality unchanged
