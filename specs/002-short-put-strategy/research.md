# Research: Short Put Strategy Support

**Feature**: 002-short-put-strategy | **Date**: 2025-12-27
**Status**: Complete - All clarifications resolved in spec.md

## Key Technical Decisions

### 1. OCC Symbol Format and Generation

**Decision**: Use standard OCC (Options Clearing Corporation) symbol format: `SYMBOL YYMMDDTPPPPPPPP`
- 6-char symbol padded with spaces + 6-char date (YYMMDD) + 1-char type (P/C) + 8-char strike with leading zeros

**Example**: `AAPL  250117P00105000` for AAPL $105 Put expiring Jan 17, 2025

**Rationale**: Industry-standard format used by all US options exchanges and brokerage statements. Enables automatic contract matching for FIFO P&L and supports scaling in/out with same OCC symbol.

**Implementation**: Auto-derived from position plan fields (symbol, strike, expiration, option_type). User enters component fields; system generates OCC symbol.

### 2. Intrinsic and Extrinsic Value Calculation

**Decision**: Calculate using these formulas:
- **Intrinsic Value** (Put): `max(0, strike_price - stock_price)`
- **Extrinsic Value**: `option_price - intrinsic_value`

**Rationale**: Standard options pricing model. Intrinsic value represents in-the-money amount (realizable if exercised). Extrinsic represents time value and volatility expectation. Breaking down P&L into these components provides educational value for traders.

**Display**:
- Per contract: intrinsic and extrinsic values shown separately
- Total position: rolled up across all option legs (x contracts x 100)
- Deep ITM puts can have negative extrinsic (option trading below intrinsic)

### 3. Price Storage: Multi-Instrument Approach

**Decision**: Store prices by instrument identifier (stock symbol or OCC symbol) and date, enabling sharing across all positions.

**Rationale**: Eliminates duplicate data entry when same underlying appears in multiple positions. Entering AAPL price once updates all AAPL positions automatically.

**Schema**:
```typescript
interface PriceEntry {
  id: string
  instrument_id: string   // Stock: "AAPL", Option: "AAPL  250117P00105000"
  date: Date              // One entry per day (not timestamp)
  close_price: number     // Closing price for the day
}
```

**Behavior**:
- System checks for existing prices before prompting (FR-030)
- Positions display staleness warnings when required prices missing (FR-031)
- 20% price change confirmation required (FR-032)

### 4. Option Assignment Workflow

**Decision**: Manual recording workflow with guided stock position creation.

**Rationale**: No broker integration for automatic assignment detection. Trader initiates assignment when notified by broker.

**Process**:
1. Record assignment on/after expiration date
2. System creates BTC trade at $0.00, closes option position
3. Display modal with reference values:
   - Premium received from put (not editable)
   - Effective cost basis per share = strike - premium received
4. Guide user through creating stock position:
   - Quantity = contracts × 100 shares
   - Cost basis = strike price (premium stored as adjustment for audit)
5. Prompt for assignment-specific journal entry

**Partial Assignment Support**:
- 2 of 5 contracts assigned → Short Put position remains open with 3 contracts
- Stock position created for 200 shares only

### 5. FIFO Cost Basis Tracking for Options

**Decision**: Track cost basis per unique OCC symbol using FIFO methodology.

**Rationale**: Each option contract is a unique instrument. FIFO matching by OCC symbol naturally handles:
- Multiple STO trades at same strike/expiration (scaling in)
- Multiple BTC trades (scaling out)
- Rolling to different expirations (different OCC symbols)

**Example - Iron Condor**:
```typescript
// Four option legs, each with unique OCC symbol
{ occ_symbol: 'AAPL  250321P00140000', action: 'STO' }  // Sell Put
{ occ_symbol: 'AAPL  250321P00135000', action: 'BTO' }  // Buy Put
{ occ_symbol: 'AAPL  250321C00160000', action: 'STO' }  // Sell Call
{ occ_symbol: 'AAPL  250321C00165000', action: 'BTO' }  // Buy Call
```

FIFO matching closes positions by matching against oldest trades with same OCC symbol.

### 6. Position Status Derivation

**Decision**: Status derived from net trade quantity.

**Rationale**: Aligns with Plan vs Execution Separation principle. Position status reflects actual execution state, not planned state.

| Status | Condition |
|--------|-----------|
| `planned` | Position created, no trades executed (quantity = 0) |
| `open` | Net quantity ≠ 0 (open option contracts or stock position) |
| `closed` | Net quantity = 0 (all contracts closed, assigned, or expired) |

## Dependencies and Integration Points

### Existing Systems Extended

| System | Extension Required |
|--------|-------------------|
| Position Entity | Add option_type, strike_price, expiration_date, premium_per_contract fields |
| Trade Entity | Add trade_kind discriminator, option action codes (STO/BTC/BTO/STC), occ_symbol, contract_quantity |
| P&L Calculator | Add intrinsic/extrinsic breakdown, per-instrument FIFO matching |
| Price Service | Support dual instrument types (stock symbol + OCC symbol), price sharing |
| UI Components | Add option fields to forms, strategy badge display, intrinsic/extrinsic breakdown |
| Journal Service | Add option_assignment journal type with specific prompts |

### Backward Compatibility

- Existing Long Stock positions continue working unchanged
- New optional fields default to undefined/null
- Storage version increment triggers migration (FR-057)
- Existing positions default strategy_type to 'Long Stock' (FR-058)

## Alternatives Considered

### Alternative 1: Separate OptionPosition Entity

**Rejected**: Would create duplication between Position and OptionPosition, complicating the data model and UI. Single hybrid Position model (stock + option trades) is simpler and supports future multi-leg strategies.

### Alternative 2: External Option Pricing API

**Rejected**: Violates Privacy-First Architecture principle. Manual entry system maintains trust and works offline.

### Alternative 3: Automatic Assignment Detection

**Rejected**: Requires broker integration, complex API dependencies. Manual recording is consistent with privacy-first approach and existing manual price entry patterns.

### Alternative 4: Separate Leg Entity for Options

**Rejected**: OCC symbol provides natural grouping without additional entity. Trade.occ_symbol serves as leg identifier, simplifying queries and FIFO matching.

## References

- Feature Specification: `specs/002-short-put-strategy/spec.md`
- Constitution: `.specify/memory/constitution.md`
- Existing Position/Trade implementations: `src/types/journal.ts`, `src/lib/position.ts`
