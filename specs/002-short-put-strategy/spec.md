# Feature Specification: Short Put Strategy Support

**Feature Branch**: `002-short-put-strategy`
**Created**: 2025-12-27
**Status**: Draft
**Input**: User description: "We need to update the application to support adding option strategies to our positions. The first strategy we implement will be the short put. We will need to support opening a position with targets and stops based on stock price and then adding a trade to sell a put to that position. We will record the price paid for the put. Once a position contains an option leg, we will report intrinsic vs extrinsic value for the position based on the latest close of the stock and the option. Obviously, our pricing system will need to support entering a price for the option as well as the stock. We will be able to close the short put position by buying to close the contract. The system will move the position to closed status and report realized rather than unrealized profit. Please ask me any questions you have until you are ready to write the specification. As you're thinking through the problem, recognize that we will next be supporting covered calls, and ultimately support scaling in and out of multileg option positions."

## Clarifications

### Session 2025-12-27

- Q: Should the system support a single-user mode only, or multi-user accounts? → A: Single-user mode only - all features available to the one user of the device
- Q: How should option trades be uniquely identified within a position? → A: Option trades store OCC symbol derived from (symbol + strike + expiration + type), with generated UUID for scaling in/out. FIFO P&L matching uses OCC symbol. UI collects option type, strike, expiration and derives OCC.
- Q: How should the system handle loading, empty, and error states for options? → A: Use existing loading/empty/error patterns from stock positions for consistency
- Q: If a short put is assigned on only part of the position, how should the system handle remaining contracts? → A: Support partial assignments. Assignment BTC assigned contracts in current position and creates new stock position for assigned shares with cost basis (strike price - premium received). Remaining contracts stay open with adjusted quantity.
- Q: What are acceptable performance targets for option operations and data retention policies? → A: Use existing system performance patterns, retain all data indefinitely
- Q: How should trades that deviate from the position plan be handled? → A: Deviation tracking is planned for a future phase. For now, all trades are allowed without deviation warnings.
- Q: Where should cost basis adjustment for assignment be stored? → A: Cost basis adjustment stored on stock trade created at assignment (provides audit trail)
- Q: How should validation errors be displayed? → A: Validation errors displayed inline below each invalid field, appearing/clearing in real-time as user corrects input

## User Scenarios & Testing

### User Story 1 - Create Short Put Position Plan (Priority: P1)

A trader wants to plan a potential short put position by first creating a position plan. The trader defines the underlying stock, strike price, expiration date, target premium, profit/stop levels (based on either stock price or option premium), and documents their thesis in a mandatory journal entry. The position is created with zero quantity (planning state) and contains no actual trades yet.

**Why this priority**: This is the foundation for all option strategies. The position plan represents the trader's strategic intent and provides the context for any option trades that follow. Without the immutable plan, the educational value of plan vs. execution analysis is lost.

**Independent Test**: Can be fully tested by creating a position plan with all required fields and verifying it appears in the position list with "planned" status.

**Acceptance Scenarios**:

1. **Given** a trader is on the position dashboard, **When** they initiate position creation and select "Short Put" strategy type, **Then** they see option-specific fields (symbol, strike price, expiration date, contract quantity, target premium, profit target, stop loss, max loss, thesis)
2. **Given** a trader is creating a position plan, **When** they enter price targets and stops, **Then** they can choose whether each is based on stock price or option premium
3. **Given** a trader sets a stop loss based on option premium (e.g., "close if premium doubles to $6.00"), **When** the plan is saved, **Then** the stop is stored with `stop_loss_basis: 'option_price'`
4. **Given** a trader sets a profit target based on stock price (e.g., "close if stock drops to support at $95"), **When** the plan is saved, **Then** the target is stored with `profit_target_basis: 'stock_price'`
5. **Given** a trader is creating a Short Put plan, **When** they need to enter strike price, **Then** they can use a picker or manual entry
6. **Given** a trader is creating a Short Put plan, **When** they need to enter expiration date, **Then** they can use a date picker
7. **Given** a trader is entering premium and loss values, **When** they type in the fields, **Then** values are displayed with $ formatting
8. **Given** a trader is creating a Short Put plan, **When** they enter an expiration date in the past, **Then** they see an inline validation error and cannot submit
9. **Given** a trader enters an optional field (premium_profit_target, stock_stop_loss, or max_loss), **When** they enter a value <= 0, **Then** they see an inline validation error
10. **Given** a trader has entered all required Short Put plan fields, **When** they submit the plan, **Then** a new position is created with "planned" status and they are prompted to write a journal entry
11. **Given** a position plan has been created, **When** the trader views the position, **Then** the plan shows zero quantity and zero trades (planning state only)

---

### User Story 2 - Execute Sell-to-Open Trade (Priority: P1)

A trader has a position plan and wants to execute a short put strategy. The trader adds a trade to sell a put, specifying the contract quantity and premium received per contract. The system auto-populates option details from the plan, generates the OCC symbol, and records the trade. The position now shows an open short put position with the premium received as credit.

**Why this priority**: This is the core action of the short put strategy. Selling the put is what creates the actual obligation and potential profit/loss scenario.

**Independent Test**: Can be tested by adding a sell-to-open trade to a planned Short Put position and verifying position status changes to "open".

**Acceptance Scenarios**:

1. **Given** a trader has a planned Short Put position, **When** they open the trade execution form, **Then** option fields (strike, expiration, option type) are auto-populated from the position plan
2. **Given** a trader is adding a sell-to-open trade, **When** they view the price field, **Then** it is labeled "Premium per contract"
3. **Given** a trader has a planned Short Put position, **When** they add a sell-to-open trade with quantity and premium, **Then** the position status becomes "open" and they are prompted to write a journal entry
4. **Given** a trader is adding a sell-to-open trade, **When** they submit the trade, **Then** the system generates the OCC symbol automatically from the position's strike, expiration, and underlying
5. **Given** a trader sold 3 contracts at $1.50 premium, **When** they view the position, **Then** they see unrealized P&L calculated as (premium received - current option price) x contracts x 100
6. **Given** a trader has an open Short Put position, **When** they try to add another sell-to-open trade after expiration date, **Then** they see a validation error (sell-to-open only allowed before expiration)

---

### User Story 3 - Close Position via Buy-to-Close (Priority: P1)

A trader wants to close their short put position to realize profit or limit loss. The trader adds a trade to buy to close (BTC) the same option contract, specifying the buyback price per contract and trade date. The system validates the trade closes the existing short position, calculates the realized profit/loss (premium received minus premium paid), updates the position status to closed, and changes P&L reporting from unrealized to realized.

**Why this priority**: Closing the position is the culmination of the trade and completes the learning cycle. The transition from unrealized to realized P&L is critical for accurate performance tracking.

**Independent Test**: Can be tested by adding a BTC trade for a short put, verifying it closes the position, calculating realized P&L correctly.

**Acceptance Scenarios**:

1. **Given** a trader has an open short put position (sold for $3.00), **When** they buy to close at $1.00, **Then** the position status changes to closed and realized P&L shows $2.00 profit per contract
2. **Given** a trader has an open short put position (sold for $3.00), **When** they buy to close at $5.00, **Then** the position status changes to closed and realized P&L shows $2.00 loss per contract
3. **Given** a position contains a short put, **When** the trader adds a BTC trade, **Then** the system validates the contract details (strike, expiration, type) match the existing short position
4. **Given** a position is closed via BTC, **When** the trader views the position, **Then** P&L is displayed as "Realized" rather than "Unrealized"
5. **Given** a trader has 5 open contracts, **When** they buy to close only 2 contracts, **Then** the position remains "open" with 3 contracts and shows partial realized P&L

---

### User Story 4 - Record Expiration Worthless (Priority: P2)

A trader has an open short put that expires out-of-the-money and wants to record this outcome. The trader records "expired" which creates a closing trade at $0.00, captures the full premium as realized profit, and closes the position.

**Why this priority**: Second most common exit for successful short puts. Simpler than buy-to-close since price is always $0.

**Independent Test**: Can be tested by recording expiration on an open Short Put after expiration date and verifying full premium captured as realized P&L.

**Acceptance Scenarios**:

1. **Given** a trader has an open Short Put and today is on/after expiration date, **When** they record "expired", **Then** a closing trade is created at $0.00 and position becomes "closed"
2. **Given** a trader's position has not reached expiration date, **When** they try to record "expired", **Then** they see a validation error (must use buy-to-close for early exits)
3. **Given** a trader sold at $1.50 and the option expires worthless, **When** they view realized P&L, **Then** it shows full $150 profit per contract

---

### User Story 5 - Handle Short Put Assignment (Priority: P2)

A trader has an open short put position that goes in-the-money at expiration. The option is assigned, meaning the trader is obligated to buy the stock at the strike price. The system records assignment, closes the option position, and guides the trader through creating a new stock position with a cost basis derived from strike price minus net premium received.

**Why this priority**: Assignment is a real-world outcome that traders must understand. Handling it correctly ensures accurate P&L tracking and proper cost basis for the resulting stock position.

**Independent Test**: Can be tested by recording assignment, completing stock position plan in modal, and verifying linked stock position is created with correct cost basis.

**Acceptance Scenarios**:

1. **Given** a trader has a short put position (strike $100, sold for $3.00), **When** the option is assigned, **Then** the system adds a BTC trade at $0.00, closes the option position, and guides creation of a new stock position
2. **Given** assignment is recorded, **When** the trader views the assignment modal, **Then** they see displayed for reference (not editable): premium received from put and effective cost basis per share ($97.00 = $100 - $3)
3. **Given** assignment is recorded, **When** the new stock position is created, **Then** the quantity reflects the contract multiplier (100 shares per contract) and cost basis = strike price, with premium received stored as cost basis adjustment
4. **Given** partial assignment (2 of 5 contracts), **When** assignment completes, **Then** the Short Put position remains "open" with 3 contracts, and stock position is created for 200 shares only
5. **Given** a trader completes the assignment flow, **When** they are prompted for a journal entry, **Then** they see assignment-specific prompts: "What happened that led to assignment?", "How do you feel about now owning this stock?", "What's your plan for the stock position?"
6. **Given** assignment occurs, **When** the trader views their positions, **Then** they see the original short put position marked closed (or reduced) and a new stock position open with the acquired shares

---

### User Story 6 - Update Prices for Stock and Option (Priority: P2)

A trader has an open short put position and wants to update current market prices. The trader enters the latest closing price for both the underlying stock and the option contract. Prices are stored by instrument and date, shared across all positions using that instrument. The system calculates and displays the current intrinsic value and extrinsic value of the position. The unrealized P&L is updated to reflect the change in option value since opening.

**Why this priority**: Price updates are essential for tracking position performance and making informed decisions. The intrinsic/extrinsic breakdown provides educational value by showing how time decay and underlying price movement affect option value. Shared pricing eliminates redundant data entry.

**Independent Test**: Can be tested by entering both stock and option prices for an open Short Put and verifying intrinsic/extrinsic values are calculated and displayed.

**Acceptance Scenarios**:

1. **Given** a position contains a short put, **When** the trader updates the stock price to $95 and option price to $2.50 for a $100 strike put, **Then** the system displays intrinsic value of $5.00 ($100 - $95) and extrinsic value of -$2.50 (or $0 if floored)
2. **Given** a position contains a short put with $100 strike, **When** the trader updates the stock price to $105 (OTM) and option price to $2.00, **Then** the system displays intrinsic value of $0.00 and extrinsic value of $2.00
3. **Given** a trader has multiple trades in a position (stock and option), **When** they update prices, **Then** the price update flow updates all trades in the position with their respective instrument prices
4. **Given** a trader enters a price that differs by more than 20% from the previous close, **When** they submit, **Then** they are asked to confirm the large price change
5. **Given** two positions share the same underlying (e.g., AAPL), **When** the trader updates the AAPL price in one position, **Then** the other position automatically reflects the updated price without requiring duplicate entry
6. **Given** a price already exists for an instrument and date, **When** the trader initiates a price update, **Then** the system pre-fills the existing price and only prompts for missing instruments
7. **Given** a position requires both stock and option prices for valuation, **When** only one price is available, **Then** the system displays a staleness warning indicating incomplete valuation data
8. **Given** a trader has entered both stock and option prices, **When** they view the Trade Detail, **Then** they see intrinsic and extrinsic values per contract AND total values (x contracts x 100)
9. **Given** a trader has entered both stock and option prices, **When** they view the Position Detail, **Then** they see rolled up total extrinsic value across all option legs

---

### User Story 7 - View Positions on Dashboard (Priority: P3)

A trader wants to see their Short Put positions on the dashboard with relevant option information for quick portfolio assessment.

**Why this priority**: Dashboard visibility is important for daily workflow but not blocking for core trading functionality.

**Independent Test**: Can be tested by creating Short Put positions and verifying they display correctly on the dashboard with strategy badge and option details.

**Acceptance Scenarios**:

1. **Given** a trader has Short Put positions, **When** they view the dashboard, **Then** each position card shows a strategy type badge indicating "Short Put"
2. **Given** a trader has an open Short Put position, **When** they view its dashboard card, **Then** they see Strike price, Expiration date, and Premium received
3. **Given** a trader has entered both stock and option prices for a Short Put, **When** they view its dashboard card, **Then** they see an Intrinsic/Extrinsic summary
4. **Given** a trader has not entered prices for a Short Put, **When** they view its dashboard card, **Then** the Intrinsic/Extrinsic area shows "Price data required"

---

### Edge Cases

- What happens when a trader adds a short put trade with a different underlying symbol than the position plan?
- What happens when a trader attempts to close a short put with incorrect contract details (wrong strike or expiration)?
- What happens when a short put position has partial fills (some contracts closed, others remain open)?
- What happens when assignment is recorded but the trader doesn't want the resulting stock position?
- What happens when a trader updates prices for a position containing both stock and option trades?
- What happens when a short put expires worthless (no assignment)? How is this recorded?
- What happens when a trader adds multiple short puts at different strikes or expirations to the same position?
- What happens when the cost basis calculation results in a negative value for the assigned stock position?
- What happens when a trader attempts to add a trade that would create an invalid position state (e.g., more BTC contracts than were sold)?
- What happens when stock price is updated but option price is not (or vice versa)? How does the system indicate staleness?
- What happens when two positions share the same underlying and one position's price update should apply to both?
- What happens when user tries to close more contracts than are open? System validates quantity <= remaining open contracts
- What happens when option price goes negative in extrinsic calculation (deep ITM)? Extrinsic can be negative; display as-is
- What happens on partial assignment followed by expiration of remaining contracts? Each is recorded as separate trade; position closes when net quantity reaches zero
- What happens if user enters stock price but not option price? Unrealized P&L and intrinsic/extrinsic cannot be calculated; show appropriate message

## Requirements

### Functional Requirements - Core

- **FR-001**: System MUST allow creating a position plan with price targets and stops based on **either** underlying stock price **or** option premium price
- **FR-002**: System MUST require a journal entry before saving a position plan
- **FR-003**: System MUST make position plans immutable once saved
- **FR-004**: System MUST allow adding trades to a position that can represent either stock or option legs
- **FR-005**: System MUST support option trade types: SELL_TO_OPEN (STO), BUY_TO_CLOSE (BTC), BUY_TO_OPEN (BTO), SELL_TO_CLOSE (STC)
- **FR-006**: System MUST capture option contract details: option_type (PUT/CALL), strike_price, expiration_date, quantity
- **FR-007**: System MUST auto-derive OCC symbol from option details using format: `SYMBOL YYMMDDTPPPPPPPP` (6-char symbol padded with spaces + 6-char date YYMMDD + 1-char type P/C + 8-char strike with leading zeros, no decimal). Example: `AAPL  250117P00105000` for AAPL $105 Put expiring Jan 17, 2025
- **FR-008**: System MUST validate that closing trades match the contract details of the open position
- **FR-009**: System MUST support manual price entry for both stock and option instruments
- **FR-010**: System MUST calculate intrinsic value as max(0, strike_price - stock_price) for put options
- **FR-011**: System MUST calculate extrinsic value as option_price - intrinsic_value for options
- **FR-012**: System MUST display intrinsic and extrinsic value breakdown for positions containing options
- **FR-013**: System MUST close a position when net quantity reaches zero after adding a closing trade
- **FR-014**: System MUST change P&L reporting from unrealized to realized when a position closes
- **FR-015**: System MUST record option assignment as a BTC trade at $0.00 price
- **FR-016**: System MUST automatically create a new stock position when an option is assigned
- **FR-017**: System MUST calculate assigned stock cost basis as (strike_price - premium_received_per_share)
- **FR-018**: System MUST multiply option contract quantities by 100 for stock position quantities upon assignment
- **FR-019**: System MUST support positions containing only stock trades, only option trades, or both stock and option trades
- **FR-020**: System MUST maintain FIFO cost basis tracking per instrument type within a position
- **FR-021**: System MUST prevent adding closing trades that exceed the open contract quantity
- **FR-022**: System MUST calculate unrealized P&L as (premium received - current option price) x contracts x 100
- **FR-023**: System MUST calculate realized P&L as (sell price - buy price) x contracts x 100
- **FR-024**: System MUST enforce expiration date constraint: "expired" and "assigned" trades only allowed on/after expiration date
- **FR-025**: System MUST enforce sell-to-open constraint: only allowed before expiration date
- **FR-026**: System MUST support partial closes and partial assignments
- **FR-027**: System MUST capture the underlying stock price at the time of each option trade execution for historical reference
- **FR-028**: System MUST preserve existing Long Stock functionality unchanged

### Functional Requirements - Price Storage

- **FR-029**: System MUST store price entries by instrument identifier (stock symbol or OCC symbol) and date, enabling sharing across all positions using that instrument
- **FR-030**: System MUST reuse an existing price entry when one already exists for the same instrument and date, rather than requesting duplicate entry
- **FR-031**: System MUST indicate when valuation data is incomplete due to missing stock or option prices (staleness warning)
- **FR-032**: System MUST require confirmation when a price entry differs by more than 20% from the previous close

### Functional Requirements - Journal Entries

- **FR-033**: System MUST prompt for journal entry on position plan creation and trade execution
- **FR-034**: System MUST support a new journal entry type 'option_assignment' for documenting assignment events
- **FR-035**: System MUST display assignment-specific journal prompts:
  - "What happened that led to assignment?"
  - "How do you feel about now owning this stock?"
  - "What's your plan for the stock position?"

### Functional Requirements - Display

- **FR-036**: Trade Detail View MUST display intrinsic value per contract and total (x contracts x 100)
- **FR-037**: Trade Detail View MUST display extrinsic value per contract and total (x contracts x 100)
- **FR-038**: Position Detail View MUST display rolled up total extrinsic value across all option legs
- **FR-039**: Assignment modal MUST display premium received from put (for reference, not editable)
- **FR-040**: Assignment modal MUST display effective cost basis per share (for reference, not editable)

### Functional Requirements - UI

- **FR-041**: Position cards on dashboard MUST display a strategy type badge (e.g., "Short Put")
- **FR-042**: Option position cards MUST display Strike price, Expiration date, and Premium received
- **FR-043**: Option position cards MUST display Intrinsic/Extrinsic summary when prices are available
- **FR-044**: Trade execution form price field MUST be labeled "Premium per contract" for option trades
- **FR-045**: Trade execution form MUST auto-populate option fields (strike, expiration, option type) from position plan
- **FR-046**: Position creation form MUST provide a picker or manual entry for strike price
- **FR-047**: Position creation form MUST provide a date picker for expiration date
- **FR-048**: Position creation form MUST display premium and loss values with $ formatting

### Functional Requirements - Validation

- **FR-049**: System MUST display inline validation errors for invalid fields, blocking form submission until resolved
- **FR-050**: Validation errors MUST appear/clear in real-time as user corrects input
- **FR-051**: On form submit with validation errors, focus MUST move to the first invalid field
- **FR-052**: System MUST validate that trade strike_price matches position strike_price
- **FR-053**: System MUST validate that trade expiration_date matches position expiration_date
- **FR-054**: System MUST validate optional fields (premium_profit_target, stock_stop_loss, max_loss) are > 0 when provided
- **FR-055**: System MUST allow option prices >= 0 (can be worthless)
- **FR-056**: System MUST require stock prices > 0

### Functional Requirements - Data Migration

- **FR-057**: System MUST increment storage version to trigger upgrade on existing installations
- **FR-058**: Existing positions without strategy_type MUST default to 'Long Stock' during migration
- **FR-059**: New optional fields MUST not cause data loss for existing positions

### Key Entities

#### Position

An immutable trading plan representing strategic intent. Contains planned price levels (targets, stops) based on either underlying stock price or option premium, required journal entry documenting thesis, and a list of executed trades. Status is derived from net trade quantity (open/closed). Can contain stock trades, option trades, or both.

```typescript
interface Position {
  id: string
  symbol: string                              // Underlying stock symbol
  strategy_type: 'Long Stock' | 'Short Put'   // Extensible for future strategies
  trade_kind: 'stock' | 'option'              // Discriminator for position type

  // Plan fields (immutable after creation)
  target_entry_price: number                  // Target price (stock or option based on basis)
  target_quantity: number                     // Planned quantity
  profit_target: number                       // Profit target price
  stop_loss: number                           // Stop loss price
  profit_target_basis: 'stock_price' | 'option_price'  // What price type determines profit target
  stop_loss_basis: 'stock_price' | 'option_price'      // What price type determines stop loss
  position_thesis: string                     // Required journal entry
  created_date: Date

  // Option plan fields (when trade_kind === 'option')
  option_type?: 'call' | 'put'
  strike_price?: number
  expiration_date?: Date
  premium_per_contract?: number               // Expected premium

  // Derived state
  status: 'planned' | 'open' | 'closed'       // Derived from trade activity
  trades: Trade[]
  journal_entry_ids: string[]
}
```

#### Trade

An individual execution record within a position. Can represent either a stock transaction or an option contract transaction. Each trade maintains its own cost basis for FIFO P&L calculation.

```typescript
interface Trade {
  id: string
  position_id: string
  trade_kind: 'stock' | 'option'              // Discriminator field
  trade_type: 'buy' | 'sell'                  // Direction
  action?: 'STO' | 'BTC' | 'BTO' | 'STC'      // Option-specific action codes
  quantity: number
  price: number                               // Per share for stock, per contract for options
  timestamp: Date
  notes?: string
  underlying: string                          // Ticker symbol (e.g., "AAPL")

  // Option-specific fields (present when trade_kind === 'option')
  occ_symbol?: string                         // Auto-derived: AAPL  250117P00105000
  option_type?: 'call' | 'put'
  strike_price?: number
  expiration_date?: Date
  contract_quantity?: number                  // Defaults to 1 contract (100 shares)
  underlying_price_at_trade?: number          // Stock price at time of option trade (FR-027)

  // Assignment linkage (when trade represents assignment)
  created_stock_position_id?: string          // Links to stock position created by assignment
  cost_basis_adjustment?: number              // Premium received, stored for audit trail

  // Type inference: presence of occ_symbol indicates option trade
}
```

#### Price Entry

Market pricing data stored by instrument and date, shared across all positions using that instrument. Eliminates duplicate price entry when the same underlying or option contract appears in multiple positions. For options, records closing price which will be expanded to OHLC in future. Used to calculate unrealized P&L and intrinsic/extrinsic value breakdown.

```typescript
interface PriceEntry {
  id: string
  instrument_id: string                       // Stock symbol (e.g., "AAPL") or OCC symbol
  date: Date                                  // Price date (not timestamp - one entry per day)
  close_price: number                         // Closing price for the day
  // Future OHLC expansion:
  // open_price?: number
  // high_price?: number
  // low_price?: number
}
```

**Instrument Identification:**
- For stocks: `instrument_id` = ticker symbol (e.g., `"AAPL"`)
- For options: `instrument_id` = OCC symbol (e.g., `"AAPL  250117P00105000"`)

**Sharing Behavior:**
- When a trader enters a price for AAPL on 2025-01-15, that price is available to ALL positions with AAPL exposure
- The system checks for existing prices before prompting for entry (FR-030)
- Positions display staleness warnings when required prices are missing (FR-031)

#### Strategy Deviation (Future Phase)

A record of a trade that does not conform to the position plan. Contains the trade details, deviation type, timestamp, and trader confirmation. Used for behavioral tracking and plan vs. execution analysis. **Note: This entity will be implemented in a future phase.**

```typescript
interface StrategyDeviation {
  id: string
  trade_id: string
  position_id: string
  deviation_type: 'symbol_mismatch' | 'strategy_change' | 'unplanned_trade'
  description: string
  confirmed_at: Date
  trader_notes?: string
}
```

#### Assignment Event

The exercise of an option contract at expiration or early exercise. Creates a BTC trade at $0.00 for the option position and triggers creation of a new stock position with cost basis derived from strike price minus net premium received.

```typescript
interface AssignmentEvent {
  id: string
  option_position_id: string                  // Original short put position
  stock_position_id: string                   // Newly created stock position
  assignment_date: Date
  contracts_assigned: number
  strike_price: number
  premium_received_per_share: number
  resulting_cost_basis: number                // strike - premium
}
```

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can create a Short Put position plan and execute a sell-to-open trade in under 3 minutes
- **SC-002**: Users can complete any position closing flow (buy-to-close, expired, assigned) in under 2 minutes
- **SC-003**: Assignment flow guides user through stock position creation with 100% of required fields auto-populated (symbol, quantity, entry price)
- **SC-004**: Assignment modal displays premium received and effective cost basis for user reference
- **SC-005**: P&L calculations match expected values within $0.01 for all test scenarios
- **SC-006**: Intrinsic/extrinsic values display correctly at both trade level (per-contract and total) and position level (rolled up)
- **SC-007**: 100% of Short Put positions show correct status (planned/open/closed) based on trade activity
- **SC-008**: Existing Long Stock functionality passes all current tests (zero regression)
- **SC-009**: All validation errors appear inline below the relevant field within 200ms of user input
- **SC-010**: Validation errors clear immediately when user corrects the input
- **SC-011**: Dashboard displays strategy type badge for all positions
- **SC-012**: 20% price change confirmation appears for both stock and option price entries
- **SC-013**: Existing positions migrate successfully with strategy_type defaulting to 'Long Stock'
- **SC-014**: Price entries are shared across positions - entering AAPL price once updates all AAPL positions
- **SC-015**: Staleness warnings appear when required price data is missing for valuation
- **SC-016**: Option contract validation prevents 100% of invalid closing trades
- **SC-017**: Position status accurately reflects open/closed state based on net quantity

## Assumptions

1. **Single Hybrid Position Model**: Positions will contain a mix of stock and option trades rather than separating them into different position entities. This simplifies the UI while maintaining flexibility for future strategies.

2. **Manual Price Entry**: The application will continue using manual price entry for both stock and option instruments, maintaining the privacy-first approach. No external pricing APIs will be integrated.

3. **Contract Multiplier**: Standard US options contract multiplier of 100 shares per contract is assumed. This affects quantity calculations for assigned positions.

4. **Assignment User-Initiated**: Option assignment will be manually recorded by the trader rather than automatically detected. The trader initiates assignment when notified by their broker.

5. **Immutability of Plan**: The position plan (targets, stops, thesis) remains immutable after creation. Only trades can be added, not plan modifications.

6. **Journal Entry Required**: All position plans and all trades require mandatory journal entries, reinforcing behavioral training.

7. **Future Strategies**: The design must support covered calls (stock + short call) and future multi-leg strategies (spreads, straddles, etc.) through the same position structure.

8. **FIFO Per Instrument**: Cost basis tracking uses FIFO methodology separately for each instrument type (stock vs. each unique option contract) within a position.

9. **Shared Price Storage**: Price entries are stored by instrument identifier (stock symbol or OCC symbol) and date, shared across all positions. This eliminates duplicate data entry when the same underlying appears in multiple positions.

10. **Deviation Tracking (Future Phase)**: Trades that deviate from the plan will be allowed without warnings in this phase. Future phases will add deviation detection, confirmation workflows, and separate tracking for learning purposes.

11. **No Auto-Close**: Positions do not auto-close at expiration. Traders must manually record expiration outcomes (assignment or worthless expiration).

12. **OCC Symbol Format**: Option symbols follow OCC format (SYMBOL + space padding + YYMMDD + C/P + strike x 1000)

13. **Single User Per Instance**: No concurrent editing concerns

14. **Browser-Based with Local Storage**: All data stored locally in browser

## Open Questions

None - all clarifications have been resolved.

## Dependencies

- **Existing Position Entity**: The current position structure must be extended to support option trade types while maintaining backward compatibility with stock-only positions.
- **Existing Trade Entity**: The trade structure must be extended to include option-specific fields (option_type, strike_price, expiration_date) without breaking existing stock trades.
- **Existing Pricing System**: The price update flow must be extended to handle multiple instrument types per position.
- **Existing P&L Calculation**: The P&L calculation system must be extended to support intrinsic/extrinsic breakdown and per-instrument FIFO tracking.
- **Future Work**: This feature must support covered calls as the next option strategy, followed by multi-leg spreads.

## Out of Scope

- **Options Greeks (Delta, Gamma, Theta, Vega)**: Not included in initial implementation. Future consideration for advanced analytics.
- **Implied Volatility Calculation**: Not included in initial implementation. Manual price entry only.
- **Options Spread Strategies**: Vertical spreads, iron condors, butterflies, etc. are deferred to future phases.
- **Auto-Assignment Detection**: No integration with brokers for automatic assignment notification. Manual recording only.
- **Options Chain Display**: No options chain viewer or strategy builder UI. Trades are entered manually.
- **Margin Requirements**: No margin calculation or buying power validation.
- **Tax Reporting**: No tax form generation (1099-B, Schedule D). P&L tracking only.
- **OHLC Prices for Options**: Only closing price is stored initially. OHLC expansion planned for future.
- **Strategy Deviation Tracking**: Deviation detection, warnings, and reporting deferred to future phase.
- **Covered Calls**: Next phase after short puts.
- **Wheel Strategy**: Future phase.
- **Multi-Leg Positions**: Future phase.
- **Real-Time Option Quotes**: Manual entry only.
- **Option Chain Display**: No options chain viewer.
- **Automatic Expiration/Assignment Detection**: Manual recording only.

## Future Enhancements

### Strategy Deviation Tracking

A planned enhancement to reinforce behavioral discipline by detecting and tracking when trades deviate from the position plan.

**Concept:**
When a trader adds a trade that doesn't match the position plan strategy (e.g., buying stock when the plan was for a short put, or selling a different strike), the system will:
1. Detect the deviation and display a clear warning
2. Require explicit confirmation before proceeding
3. Flag the trade as a deviation in the position detail view
4. Track deviations separately in performance reports

**Rationale:**
This supports the app's core mission of developing systematic decision-making by making traders consciously acknowledge when they depart from their original plan. The pattern of confirmation-before-deviation creates learning opportunities and builds awareness of impulsive trading behavior.

**Design Note:**
The current entity model (Strategy Deviation as a separate entity) supports adding this without changes to the Trade or Position entities. When implemented, this will add:
- FR: System MUST warn when a trade deviates from the position plan strategy
- FR: System MUST require explicit confirmation before adding deviation trades
- FR: System MUST track deviations from the original plan separately in reporting
- User Story: Track Strategy Deviations workflow
- Success Criteria: Deviation visibility in UI and reports

---

## Multi-Leg Strategy Support Analysis

This section confirms that the Trade entity design provides sufficient flexibility to support complex option strategies without requiring a separate Leg abstraction.

### Design Rationale

The Trade entity uses `occ_symbol` as the unique instrument identifier for options. This provides the same grouping semantics as an explicit Leg entity would, but with a flatter, simpler data model. Each unique OCC symbol effectively represents a "leg" of the strategy.

### Supported Strategies

#### Covered Call (Stock + Short Call)
A position containing:
1. **Stock Trade**: `trade_kind: 'stock'`, `trade_type: 'buy'`, `underlying: 'AAPL'`
2. **Option Trade**: `trade_kind: 'option'`, `action: 'STO'`, `option_type: 'call'`, `occ_symbol: 'AAPL  250321C00150000'`

FIFO tracking works because stock trades group by `underlying` and option trades group by `occ_symbol`.

#### Iron Condor (4 Option Legs)
A position containing 4 option trades with different OCC symbols:
1. **Sell Put (lower strike)**: `occ_symbol: 'AAPL  250321P00140000'`, `action: 'STO'`
2. **Buy Put (lowest strike)**: `occ_symbol: 'AAPL  250321P00135000'`, `action: 'BTO'`
3. **Sell Call (upper strike)**: `occ_symbol: 'AAPL  250321C00160000'`, `action: 'STO'`
4. **Buy Call (highest strike)**: `occ_symbol: 'AAPL  250321C00165000'`, `action: 'BTO'`

Each leg is uniquely identified by its OCC symbol. FIFO matching happens per-symbol, so closing the short put at $140 matches against trades with `occ_symbol: 'AAPL  250321P00140000'`.

#### Butterfly Spread (3 Strikes, 4 Contracts)
A position containing trades at 3 different strikes:
1. **Buy 1 Call at lower strike**: `occ_symbol: 'AAPL  250321C00145000'`, `action: 'BTO'`, `quantity: 1`
2. **Sell 2 Calls at middle strike**: `occ_symbol: 'AAPL  250321C00150000'`, `action: 'STO'`, `quantity: 2`
3. **Buy 1 Call at upper strike**: `occ_symbol: 'AAPL  250321C00155000'`, `action: 'BTO'`, `quantity: 1`

Each strike has its own OCC symbol, enabling independent tracking and closing.

#### Calendar Spread (Same Strike, Different Expirations)
A position containing trades at the same strike but different expirations:
1. **Sell near-term**: `occ_symbol: 'AAPL  250221C00150000'`, `action: 'STO'` (Feb expiry)
2. **Buy far-term**: `occ_symbol: 'AAPL  250321C00150000'`, `action: 'BTO'` (Mar expiry)

Different expiration dates produce different OCC symbols, enabling independent tracking.

### FIFO Matching by OCC Symbol

The key insight is that **OCC symbol uniquely identifies an option contract**, including:
- Underlying symbol
- Expiration date
- Option type (put/call)
- Strike price

Therefore, FIFO cost basis tracking by `occ_symbol` (FR-020) automatically provides per-leg tracking without needing an explicit Leg entity. When a trader closes part of an iron condor (e.g., buys back the short put at $140), the system matches against all trades with that specific OCC symbol.

### Scaling In/Out Support

Multiple trades can have the same `occ_symbol` with different timestamps, enabling:
- **Scaling in**: Multiple STO trades at the same strike/expiration
- **Scaling out**: Multiple BTC trades closing partial positions
- **Rolling**: Close one expiration, open another (different OCC symbols)

### Conclusion

The Trade entity with `occ_symbol` as the instrument identifier provides full flexibility for:
- Single-leg strategies (short put, long call)
- Stock + option combinations (covered call, cash-secured put)
- Multi-leg spreads (verticals, iron condors, butterflies)
- Calendar/diagonal spreads (different expirations)
- Scaling in/out of any leg independently
- FIFO cost basis per instrument

No separate Leg abstraction is required. The OCC symbol serves as the natural grouping key for option contract identification and FIFO matching.
