# Quickstart: Short Put Strategy Support

**Feature**: 002-short-put-strategy | **Date**: 2025-12-27

## Overview

This guide provides the essential information needed to implement Short Put option strategy support in the trading journal application.

## Key Concepts

### What is a Short Put?

A short put strategy involves selling (writing) a put option contract, obligating the seller to buy the underlying stock at the strike price if the option is exercised. The seller receives premium income upfront.

**Example**: Sell 1 AAPL $105 put for $2.50 premium
- Receive $250 immediately ($2.50 × 100 shares)
- Obligation: Buy AAPL at $105 if it falls below strike at expiration
- Maximum profit: $250 (if AAPL stays above $105)
- Maximum loss: $10,250 - $250 = $10,000 (if AAPL goes to $0)

### OCC Symbol Format

Options use a standardized symbol format for identification:

```
AAPL  250117P00105000
^^^^  ^^^^^^ ^ ^^^^^^^
|     |      | |
|     |      | +-- Strike: 0105000 = $105.00
|     |      +---- Type: P = Put
|     +----------- Date: 250117 = Jan 17, 2025
+-------------- Symbol: AAPL (padded to 6 chars)
```

### Intrinsic vs Extrinsic Value

For a put option:
- **Intrinsic Value**: `max(0, strike_price - stock_price)` — the in-the-money amount
- **Extrinsic Value**: `option_price - intrinsic_value` — time value and volatility

**Example**: $105 strike put, stock at $100, option price $6.50
- Intrinsic: $105 - $100 = $5.00
- Extrinsic: $6.50 - $5.00 = $1.50

## Implementation Checklist

### Phase 1: Data Model Extensions

- [ ] Extend Position type with option fields
- [ ] Extend Trade type with option-specific fields
- [ ] Add PriceEntry type for instrument-based pricing
- [ ] Implement OCC symbol generation utility
- [ ] Create IndexedDB migration for storage version 2

### Phase 2: Services

- [ ] Extend TradeService for option trade handling
- [ ] Extend PriceService for multi-instrument pricing
- [ ] Implement FIFO P&L calculator with intrinsic/extrinsic breakdown
- [ ] Add assignment workflow service

### Phase 3: UI Components

- [ ] Add Short Put option to position creation form
- [ ] Create option trade entry form (STO/BTC actions)
- [ ] Add intrinsic/extrinsic display to position detail
- [ ] Add strategy badge to position cards
- [ ] Create assignment recording modal
- [ ] Implement price entry component for both stock and options

### Phase 4: Integration Tests

- [ ] User Story 1: Create Short Put Position Plan
- [ ] User Story 2: Execute Sell-to-Open Trade
- [ ] User Story 3: Close Position via Buy-to-Close
- [ ] User Story 4: Record Expiration Worthless
- [ ] User Story 5: Handle Short Put Assignment
- [ ] User Story 6: Update Prices for Stock and Option
- [ ] User Story 7: View Positions on Dashboard

## File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `src/types/option.ts` | Option-specific type definitions |
| `src/lib/occ-utils.ts` | OCC symbol generation utilities |
| `src/lib/option-pnl.ts` | Option P&L calculation functions |

### Modified Files

| File | Changes |
|------|---------|
| `src/types/journal.ts` | Add option fields to Position and Trade |
| `src/lib/position.ts` | Extend P&L calculations |
| `src/services/TradeService.ts` | Add option trade handling |
| `src/services/PriceService.ts` | Add multi-instrument pricing |
| `src/components/PositionCard.tsx` | Add strategy badge, option fields |
| `src/components/TradeForm.tsx` | Add option trade fields |
| `src/pages/PositionCreate.tsx` | Add Short Put strategy option |
| `src/pages/PositionDetail.tsx` | Add intrinsic/extrinsic display |

## Testing Commands

```bash
# Run all tests
npm test

# Run integration tests for option workflows
npm test -- --grep "Short Put"

# Run specific user story test
npm test -- --grep "Create Short Put Position"

# Run with coverage
npm run test:coverage
```

## Common Issues

### Issue: OCC Symbol Not Generating Correctly

**Symptom**: OCC symbol has incorrect format
**Cause**: Date formatting or strike price padding incorrect
**Fix**: Verify date uses YYMMDD format, strike uses 8 digits with leading zeros

### Issue: Intrinsic Value Negative

**Symptom**: Intrinsic value shows negative for deep ITM puts
**Cause**: Calculation `strike - stock` not wrapped in `max(0, ...)`
**Fix**: Apply `Math.max(0, strike - stock)` for puts

### Issue: Price Not Shared Across Positions

**Symptom**: Entering AAPL price in one position doesn't update another
**Cause**: PriceEntry not using instrument_id as key
**Fix**: Check PriceEntry uses `instrument_id: "AAPL"` not position-specific storage

### Issue: Assignment Creates Wrong Quantity

**Symptom**: Stock position has wrong share quantity
**Cause**: Not multiplying contract quantity by 100
**Fix**: `stock_quantity = contract_quantity * 100`

## Debugging Tips

### Enable Verbose Logging

```typescript
// In development, set debug flag
localStorage.setItem('debug', 'true')
```

### Check IndexedDB Contents

```javascript
// Browser console - list all positions
const db = await openDB();
const positions = await db.getAll('positions');
console.table(positions);
```

### Verify OCC Symbol Generation

```typescript
// Test OCC symbol generation
const symbol = generateOCCSymbol('AAPL', new Date('2025-01-17'), 'put', 105.00);
console.log(symbol); // "AAPL  250117P00105000"
```

## Related Documentation

- Feature Specification: `specs/002-short-put-strategy/spec.md`
- Data Model: `specs/002-short-put-strategy/data-model.md`
- API Contracts: `specs/002-short-put-strategy/contracts/api.yaml`
- Constitution: `.specify/memory/constitution.md`
