# Feature Specification: Cash-Secured Puts

**Feature Branch**: `002-cash-covered-put`
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

## User Scenarios & Testing

### User Story 1 - Open Position Plan (Priority: P1)

A trader wants to plan a potential short put position by first creating a position plan. The trader defines the underlying stock, target entry/exit prices, stop loss levels (based on either stock price or option premium), and documents their thesis in a mandatory journal entry. The position is created with zero quantity (planning state) and contains no actual trades yet.

**Why this priority**: This is the foundation for all option strategies. The position plan represents the trader's strategic intent and provides the context for any option trades that follow. Without the immutable plan, the educational value of plan vs. execution analysis is lost.

**Independent Test**: Can be fully tested by creating a position plan with targets and stops, verifying the plan is immutable and contains no trades, and confirming a journal entry was required.

**Acceptance Scenarios**:

1. **Given** a trader is on the position dashboard, **When** they initiate position creation, **Then** they must complete a journal entry before the position plan can be saved
2. **Given** a trader is creating a position plan, **When** they enter price targets and stops, **Then** they can choose whether each is based on stock price or option premium
3. **Given** a trader sets a stop loss based on option premium (e.g., "close if premium doubles to $6.00"), **When** the plan is saved, **Then** the stop is stored with `stop_loss_basis: 'option_price'`
4. **Given** a trader sets a profit target based on stock price (e.g., "close if stock drops to support at $95"), **When** the plan is saved, **Then** the target is stored with `profit_target_basis: 'stock_price'`
5. **Given** a position plan has been created, **When** the trader views the position, **Then** the plan shows zero quantity and zero trades (planning state only)

---

### User Story 2 - Add Short Put Trade to Position (Priority: P1)

A trader has a stock position plan and wants to execute a short put strategy. The trader adds a trade to sell a put, specifying the option contract details (strike price, expiration date, quantity), the premium received per contract, and the trade date. The system validates the trade matches the planned strategy, warns if it deviates from the plan, requires confirmation, and records the trade. The position now shows an open short put position with the premium received as credit.

**Why this priority**: This is the core action of the short put strategy. Selling the put is what creates the actual obligation and potential profit/loss scenario. The validation and warning system reinforces behavioral training by making traders consciously acknowledge deviations from their plan.

**Independent Test**: Can be fully tested by adding a short put trade to a stock position plan, verifying option details are captured, premium is recorded as credit, and deviation warnings work correctly.

**Acceptance Scenarios**:

1. **Given** a trader has an open stock position plan, **When** they add a short put trade matching the strategy (same underlying), **Then** the trade is recorded with option type "PUT", action "SELL_TO_OPEN", and premium received is added to position cash
2. **Given** a trader is adding a short put trade, **When** the underlying symbol differs from the position plan, **Then** the system warns this deviates from the plan and requires explicit confirmation before proceeding
3. **Given** a trader has added a short put trade, **When** they view the position, **Then** the position shows net quantity reflecting the short option contracts and updated cash balance from premium received
4. **Given** a position contains a short put trade, **When** the trader adds an unrelated trade (e.g., buy stock for different company), **Then** the system warns this is a strategy deviation and tracks it as a deviation from the original plan

---

### User Story 3 - Update Prices for Stock and Option (Priority: P2)

A trader has an open short put position and wants to update current market prices. The trader enters the latest closing price for both the underlying stock and the option contract. Prices are stored by instrument and date, shared across all positions using that instrument. The system calculates and displays the current intrinsic value (how much the option is in-the-money) and extrinsic value (time value remaining) of the position. The unrealized P&L is updated to reflect the change in option value since opening.

**Why this priority**: Price updates are essential for tracking position performance and making informed decisions. The intrinsic/extrinsic breakdown provides educational value by showing how time decay and underlying price movement affect option value. Shared pricing eliminates redundant data entry when the same instrument appears in multiple positions.

**Independent Test**: Can be fully tested by updating stock and option prices for a position with a short put, verifying intrinsic/extrinsic values are calculated correctly, confirming P&L reflects the change in option value, and verifying price sharing works across positions.

**Acceptance Scenarios**:

1. **Given** a position contains a short put, **When** the trader updates the stock price to $95 and option price to $2.50 for a $100 strike put, **Then** the system displays intrinsic value of $0 (out-of-the-money) and extrinsic value of $2.50 (time value)
2. **Given** a position contains a short put with $100 strike, **When** the trader updates the stock price to $95 and option price to $7.00, **Then** the system displays intrinsic value of $5.00 ($100 - $95) and extrinsic value of $2.00 ($7 - $5)
3. **Given** a trader has multiple trades in a position (stock and option), **When** they update prices, **Then** the price update flow updates all trades in the position with their respective instrument prices
4. **Given** a position contains only option trades, **When** the trader updates prices, **Then** only option prices are required (stock price optional but needed for intrinsic/extrinsic calculation)
5. **Given** two positions share the same underlying (e.g., AAPL), **When** the trader updates the AAPL price in one position, **Then** the other position automatically reflects the updated price without requiring duplicate entry
6. **Given** a price already exists for an instrument and date, **When** the trader initiates a price update, **Then** the system pre-fills the existing price and only prompts for missing instruments
7. **Given** a position requires both stock and option prices for valuation, **When** only one price is available, **Then** the system displays a staleness warning indicating incomplete valuation data

---

### User Story 4 - Close Short Put by Buying to Close (Priority: P1)

A trader wants to close their short put position to realize profit or limit loss. The trader adds a trade to buy to close (BTC) the same option contract, specifying the buyback price per contract and trade date. The system validates the trade closes the existing short position, calculates the realized profit/loss (premium received minus premium paid), updates the position status to closed, and changes P&L reporting from unrealized to realized.

**Why this priority**: Closing the position is the culmination of the trade and completes the learning cycle. The transition from unrealized to realized P&L is critical for accurate performance tracking and tax reporting.

**Independent Test**: Can be fully tested by adding a BTC trade for a short put, verifying it closes the position, calculating realized P&L correctly, and confirming the position status changes to closed with realized P&L displayed.

**Acceptance Scenarios**:

1. **Given** a trader has an open short put position (sold for $3.00), **When** they buy to close at $1.00, **Then** the position status changes to closed and realized P&L shows $2.00 profit per contract
2. **Given** a trader has an open short put position (sold for $3.00), **When** they buy to close at $5.00, **Then** the position status changes to closed and realized P&L shows $2.00 loss per contract
3. **Given** a position contains a short put, **When** the trader adds a BTC trade, **Then** the system validates the contract details (strike, expiration, type) match the existing short position
4. **Given** a position is closed via BTC, **When** the trader views the position, **Then** P&L is displayed as "Realized" rather than "Unrealized"

---

### User Story 5 - Handle Short Put Assignment (Priority: P2)

A trader has an open short put position that goes in-the-money at expiration. The option is assigned, meaning the trader is obligated to buy the stock at the strike price. The system records a buy-to-close trade at $0.00 for the option (representing assignment), closes the option position, and automatically creates a new stock position with a cost basis of (strike price - premium received per share). The trader is notified of the assignment and can review the new long stock position.

**Why this priority**: Assignment is a real-world outcome that traders must understand. Handling it correctly ensures accurate P&L tracking and proper cost basis for the resulting stock position, which is critical for future decisions.

**Independent Test**: Can be fully tested by triggering assignment on a short put, verifying the $0 BTC trade is recorded, the option position closes, and a new stock position is created with the correct cost basis.

**Acceptance Scenarios**:

1. **Given** a trader has a short put position (strike $100, sold for $3.00), **When** the option is assigned, **Then** the system adds a BTC trade at $0.00, closes the option position, and creates a new stock position with cost basis of $97.00 ($100 - $3)
2. **Given** an option is assigned, **When** the new stock position is created, **Then** the quantity reflects the contract multiplier (100 shares per contract) and the position is marked as open
3. **Given** an assignment occurs, **When** the trader views their positions, **Then** they see the original short put position marked closed and a new stock position open with the acquired shares
4. **Given** a short put is assigned, **When** the trader views the closed position, **Then** the realized P&L reflects only the option premium received/stock cost basis relationship (not yet realized on the stock position)

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

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow creating a position plan with price targets and stops based on **either** underlying stock price **or** option premium price
- **FR-002**: System MUST require a journal entry before saving a position plan
- **FR-003**: System MUST make position plans immutable once saved
- **FR-004**: System MUST allow adding trades to a position that can represent either stock or option legs
- **FR-005**: System MUST support option trade types: SELL_TO_OPEN (STO), BUY_TO_CLOSE (BTC), BUY_TO_OPEN (BTO), SELL_TO_CLOSE (STC)
- **FR-006**: System MUST capture option contract details: option_type (PUT/CALL), strike_price, expiration_date, quantity
- **FR-007**: System MUST auto-derive OCC symbol from option details using format: `SYMBOL YYMMDDTPPPPPPPP` (6-char symbol padded with spaces + 6-char date YYMMDD + 1-char type P/C + 8-char strike with leading zeros, no decimal). Example: `AAPL  250117P00105000` for AAPL $105 Put expiring Jan 17, 2025
- **FR-008**: System MUST validate that closing trades match the contract details of the open position
- **FR-009**: System MUST support manual price entry for both stock and option instruments
- **FR-010**: System MUST update all trades in a position when prices are updated
- **FR-011**: System MUST calculate intrinsic value as max(0, strike_price - stock_price) for put options
- **FR-012**: System MUST calculate extrinsic value as option_price - intrinsic_value for options
- **FR-013**: System MUST display intrinsic and extrinsic value breakdown for positions containing options
- **FR-014**: System MUST close a position when net quantity reaches zero after adding a closing trade
- **FR-015**: System MUST change P&L reporting from unrealized to realized when a position closes
- **FR-016**: System MUST record option assignment as a BTC trade at $0.00 price
- **FR-017**: System MUST automatically create a new stock position when an option is assigned
- **FR-018**: System MUST calculate assigned stock cost basis as (strike_price - premium_received_per_share)
- **FR-019**: System MUST multiply option contract quantities by 100 for stock position quantities upon assignment
- **FR-020**: System MUST support positions containing only stock trades, only option trades, or both stock and option trades
- **FR-021**: System MUST maintain FIFO cost basis tracking per instrument type within a position
- **FR-022**: System MUST prevent adding closing trades that exceed the open contract quantity
- **FR-023**: System MUST store price entries by instrument identifier (stock symbol or OCC symbol) and date, enabling sharing across all positions using that instrument
- **FR-024**: System MUST reuse an existing price entry when one already exists for the same instrument and date, rather than requesting duplicate entry
- **FR-025**: System MUST indicate when valuation data is incomplete due to missing stock or option prices (staleness warning)
- **FR-026**: System MUST capture the underlying stock price at the time of each option trade execution for historical reference

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
  underlying_price_at_trade?: number          // Stock price at time of option trade (FR-026)

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
- The system checks for existing prices before prompting for entry (FR-024)
- Positions display staleness warnings when required prices are missing (FR-025)

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

- **SC-001**: Traders can create a stock-based position plan and add a short put trade in under 2 minutes
- **SC-002**: Traders can update prices for both stock and option instruments in a single workflow
- **SC-003**: Intrinsic and extrinsic value calculations are 100% accurate for all option positions
- **SC-004**: Assignment handling creates new stock positions with correct cost basis 100% of the time
- **SC-005**: P&L transitions from unrealized to realized immediately upon position close
- **SC-006**: Traders can close short put positions (BTC) and view realized profit in under 30 seconds
- **SC-007**: Position status accurately reflects open/closed state based on net quantity
- **SC-008**: Option contract validation prevents 100% of invalid closing trades
- **SC-009**: Price entries are shared across positions - entering AAPL price once updates all AAPL positions
- **SC-010**: Staleness warnings appear when required price data is missing for valuation

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

Therefore, FIFO cost basis tracking by `occ_symbol` (FR-021) automatically provides per-leg tracking without needing an explicit Leg entity. When a trader closes part of an iron condor (e.g., buys back the short put at $140), the system matches against all trades with that specific OCC symbol.

### Scaling In/Out Support

Multiple trades can have the same `occ_symbol` with different timestamps, enabling:
- **Scaling in**: Multiple STO trades at the same strike/expiration
- **Scaling out**: Multiple BTC trades closing partial positions
- **Rolling**: Close one expiration, open another (different OCC symbols)

### Conclusion

The Trade entity with `occ_symbol` as the instrument identifier provides full flexibility for:
- ✅ Single-leg strategies (short put, long call)
- ✅ Stock + option combinations (covered call, cash-secured put)
- ✅ Multi-leg spreads (verticals, iron condors, butterflies)
- ✅ Calendar/diagonal spreads (different expirations)
- ✅ Scaling in/out of any leg independently
- ✅ FIFO cost basis per instrument

No separate Leg abstraction is required. The OCC symbol serves as the natural grouping key for option contract identification and FIFO matching.
