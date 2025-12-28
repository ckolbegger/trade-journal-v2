# Quickstart: Short Put Strategy Support

**Feature**: 002-short-put-strategy | **Date**: 2025-12-27

This guide provides essential patterns and examples for implementing short put option strategies.

---

## Prerequisites

Ensure you have read:
- [spec.md](./spec.md) - Feature specification
- [research.md](./research.md) - Technical decisions
- [data-model.md](./data-model.md) - Entity definitions
- [contracts/](./contracts/) - Service interfaces

---

## Key Concepts

### 1. OCC Symbol Generation

```typescript
// src/lib/utils/occSymbol.ts

/**
 * Generate OCC symbol from option details
 * Format: SYMBOL YYMMDDTPPPPPPPP (21 chars)
 */
export function generateOccSymbol(
  symbol: string,
  expiration: Date,
  type: 'put' | 'call',
  strike: number
): string {
  const paddedSymbol = symbol.toUpperCase().padEnd(6, ' ')
  const year = expiration.getFullYear().toString().slice(-2)
  const month = (expiration.getMonth() + 1).toString().padStart(2, '0')
  const day = expiration.getDate().toString().padStart(2, '0')
  const typeChar = type === 'put' ? 'P' : 'C'
  const strikeInt = Math.round(strike * 1000)
  const strikeStr = strikeInt.toString().padStart(8, '0')

  return `${paddedSymbol}${year}${month}${day}${typeChar}${strikeStr}`
}

// Example: generateOccSymbol('AAPL', new Date('2025-01-17'), 'put', 105)
// Returns: 'AAPL  250117P00105000'
```

### 2. Intrinsic/Extrinsic Calculation

```typescript
// src/domain/calculators/IntrinsicExtrinsicCalculator.ts

const CONTRACT_MULTIPLIER = 100

export function calculatePutIntrinsicExtrinsic(
  stockPrice: number,
  strikePrice: number,
  optionPrice: number,
  contracts: number
): IntrinsicExtrinsicResult {
  const intrinsicPerContract = Math.max(0, strikePrice - stockPrice)
  const extrinsicPerContract = optionPrice - intrinsicPerContract

  return {
    intrinsicPerContract,
    extrinsicPerContract,
    intrinsicTotal: intrinsicPerContract * contracts * CONTRACT_MULTIPLIER,
    extrinsicTotal: extrinsicPerContract * contracts * CONTRACT_MULTIPLIER
  }
}

// Example: ITM put
// calculatePutIntrinsicExtrinsic(95, 100, 7, 2)
// → { intrinsicPerContract: 5, extrinsicPerContract: 2, intrinsicTotal: 1000, extrinsicTotal: 400 }

// Example: OTM put
// calculatePutIntrinsicExtrinsic(105, 100, 1.5, 2)
// → { intrinsicPerContract: 0, extrinsicPerContract: 1.5, intrinsicTotal: 0, extrinsicTotal: 300 }
```

### 3. Short Put P&L

```typescript
// src/domain/calculators/PnLCalculator.ts

/**
 * Short put: profit when option price decreases
 */
export function calculateShortPutUnrealizedPnL(
  premiumReceived: number,
  currentPrice: number,
  contracts: number
): number {
  return (premiumReceived - currentPrice) * contracts * CONTRACT_MULTIPLIER
}

// Example: Sold at $3.00, current price $2.00, 2 contracts
// calculateShortPutUnrealizedPnL(3.00, 2.00, 2)
// → +$200 (profit: option lost value)

// Example: Sold at $3.00, current price $5.00, 2 contracts
// calculateShortPutUnrealizedPnL(3.00, 5.00, 2)
// → -$400 (loss: option gained value)
```

---

## Implementation Patterns

### Pattern 1: Position Creation Flow

```tsx
// Position creation with strategy selection

function CreatePositionForm() {
  const [strategyType, setStrategyType] = useState<StrategyType>('Long Stock')
  const [tradeKind, setTradeKind] = useState<TradeKind>('stock')

  // When strategy changes, update trade kind
  useEffect(() => {
    setTradeKind(strategyType === 'Long Stock' ? 'stock' : 'option')
  }, [strategyType])

  return (
    <form>
      <StrategySelector value={strategyType} onChange={setStrategyType} />

      {/* Common fields */}
      <SymbolInput />
      <TargetEntryPriceInput />
      <TargetQuantityInput />
      <ProfitTargetInput basis={tradeKind === 'option' ? 'option_price' : 'stock_price'} />
      <StopLossInput basis={tradeKind === 'option' ? 'option_price' : 'stock_price'} />

      {/* Option-specific fields */}
      {tradeKind === 'option' && (
        <>
          <StrikePriceInput />
          <ExpirationDatePicker />
          <PremiumPerContractInput />
        </>
      )}

      <ThesisTextarea required />
    </form>
  )
}
```

### Pattern 2: Trade Form with Action Selection

```tsx
// Option trade form with action codes

function AddOptionTradeForm({ position }: { position: Position }) {
  const [action, setAction] = useState<OptionAction>('STO')

  // Auto-populate from position plan
  const optionDetails = {
    strike_price: position.strike_price,
    expiration_date: position.expiration_date,
    option_type: position.option_type
  }

  // Validate action based on position state
  const validateAction = (action: OptionAction): string | null => {
    const openQty = calculateOpenQuantity(position.trades, position.symbol)
    const today = new Date()
    const expiration = new Date(position.expiration_date!)

    if (action === 'STO' && today >= expiration) {
      return 'Sell-to-open only allowed before expiration'
    }
    if (action === 'BTC' && openQty <= 0) {
      return 'No open contracts to close'
    }
    return null
  }

  return (
    <form>
      <ActionSelector
        value={action}
        onChange={setAction}
        options={['STO', 'BTC']}
        validate={validateAction}
      />

      {/* Auto-populated, read-only */}
      <ReadOnlyField label="Strike" value={`$${optionDetails.strike_price}`} />
      <ReadOnlyField label="Expiration" value={formatDate(optionDetails.expiration_date)} />
      <ReadOnlyField label="Type" value={optionDetails.option_type?.toUpperCase()} />

      {/* User inputs */}
      <QuantityInput label="Contracts" />
      <PriceInput label="Premium per contract" />
      <NotesTextarea />
    </form>
  )
}
```

### Pattern 3: Price Update with Staleness

```tsx
// Price update form with staleness detection

function PriceUpdateForm({ position }: { position: Position }) {
  const priceService = usePriceService()
  const [prices, setPrices] = useState<Map<string, number>>(new Map())
  const [staleInstruments, setStaleInstruments] = useState<string[]>([])

  // Get required instruments
  const instruments = useMemo(() => {
    const set = new Set<string>([position.symbol])
    position.trades.forEach(t => {
      if (t.occ_symbol) set.add(t.occ_symbol)
    })
    return Array.from(set)
  }, [position])

  // Check staleness on mount
  useEffect(() => {
    const today = formatDate(new Date())
    priceService.checkStaleness(instruments, today).then(result => {
      setStaleInstruments(result.staleInstruments)
    })
  }, [instruments])

  return (
    <form>
      {/* Stock price (always required) */}
      <PriceInput
        label={`${position.symbol} Price`}
        isStale={staleInstruments.includes(position.symbol)}
        onChange={(price) => setPrices(p => new Map(p).set(position.symbol, price))}
      />

      {/* Option prices (for each unique OCC) */}
      {instruments
        .filter(i => i !== position.symbol)
        .map(occ => (
          <PriceInput
            key={occ}
            label={`Option Price (${formatOccSymbol(occ)})`}
            isStale={staleInstruments.includes(occ)}
            onChange={(price) => setPrices(p => new Map(p).set(occ, price))}
          />
        ))}

      {staleInstruments.length > 0 && (
        <Warning>Some prices are missing. P&L calculation may be incomplete.</Warning>
      )}
    </form>
  )
}
```

### Pattern 4: Assignment Modal Workflow

```tsx
// Multi-step assignment modal

function AssignmentModal({ position, onClose }: Props) {
  const [step, setStep] = useState<'preview' | 'thesis' | 'journal'>('preview')
  const [preview, setPreview] = useState<AssignmentPreview | null>(null)
  const [contractsAssigned, setContractsAssigned] = useState(0)

  const assignmentService = useAssignmentService()

  // Load preview on mount
  useEffect(() => {
    assignmentService.initiateAssignment({
      option_position_id: position.id
    }).then(setPreview)
  }, [position.id])

  if (!preview) return <Loading />

  return (
    <Modal onClose={onClose}>
      {step === 'preview' && (
        <AssignmentPreviewStep
          preview={preview}
          contractsAssigned={contractsAssigned}
          onContractsChange={setContractsAssigned}
          onNext={() => setStep('thesis')}
        />
      )}

      {step === 'thesis' && (
        <StockThesisStep
          preview={preview}
          onBack={() => setStep('preview')}
          onNext={() => setStep('journal')}
        />
      )}

      {step === 'journal' && (
        <AssignmentJournalStep
          prompts={ASSIGNMENT_PROMPTS}
          onBack={() => setStep('thesis')}
          onComplete={handleComplete}
        />
      )}
    </Modal>
  )
}
```

---

## Test Patterns

### TDD: Write Tests First

```typescript
// src/domain/__tests__/IntrinsicExtrinsicCalculator.test.ts

import { describe, it, expect } from 'vitest'
import { calculatePutIntrinsicExtrinsic } from '@/domain/calculators/IntrinsicExtrinsicCalculator'

describe('calculatePutIntrinsicExtrinsic', () => {
  it('calculates ITM put correctly', () => {
    // Stock at $95, Strike at $100, Option at $7.00, 2 contracts
    const result = calculatePutIntrinsicExtrinsic(95, 100, 7, 2)

    expect(result.intrinsicPerContract).toBe(5)    // 100 - 95
    expect(result.extrinsicPerContract).toBe(2)    // 7 - 5
    expect(result.intrinsicTotal).toBe(1000)       // 5 × 2 × 100
    expect(result.extrinsicTotal).toBe(400)        // 2 × 2 × 100
  })

  it('calculates OTM put correctly', () => {
    // Stock at $105, Strike at $100, Option at $1.50, 2 contracts
    const result = calculatePutIntrinsicExtrinsic(105, 100, 1.5, 2)

    expect(result.intrinsicPerContract).toBe(0)    // max(0, 100-105)
    expect(result.extrinsicPerContract).toBe(1.5)  // All extrinsic
    expect(result.intrinsicTotal).toBe(0)
    expect(result.extrinsicTotal).toBe(300)        // 1.5 × 2 × 100
  })

  it('allows negative extrinsic for deep ITM', () => {
    // Stock at $85, Strike at $100, Option at $14, 1 contract
    const result = calculatePutIntrinsicExtrinsic(85, 100, 14, 1)

    expect(result.intrinsicPerContract).toBe(15)   // 100 - 85
    expect(result.extrinsicPerContract).toBe(-1)   // 14 - 15 (trading below parity)
  })
})
```

### Integration Test: Full Lifecycle

```typescript
// src/integration/__tests__/short-put-lifecycle.test.ts

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import 'fake-indexeddb/auto'

describe('Short Put Lifecycle', () => {
  beforeEach(async () => {
    await clearDatabase()
  })

  it('completes full short put workflow: plan → STO → BTC → closed', async () => {
    // 1. Create position plan
    render(<App />)
    fireEvent.click(screen.getByText('New Position'))
    fireEvent.click(screen.getByText('Short Put'))

    fireEvent.change(screen.getByLabelText('Symbol'), { target: { value: 'AAPL' } })
    fireEvent.change(screen.getByLabelText('Strike Price'), { target: { value: '150' } })
    // ... fill other fields

    fireEvent.click(screen.getByText('Create Position'))

    await waitFor(() => {
      expect(screen.getByText('Position Created')).toBeVisible()
    })

    // 2. Add STO trade
    fireEvent.click(screen.getByText('Add Trade'))
    expect(screen.getByLabelText('Action')).toHaveValue('STO')

    fireEvent.change(screen.getByLabelText('Contracts'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Premium per contract'), { target: { value: '3.00' } })
    fireEvent.click(screen.getByText('Add Trade'))

    await waitFor(() => {
      expect(screen.getByText('Status: Open')).toBeVisible()
    })

    // 3. Add BTC trade to close
    fireEvent.click(screen.getByText('Add Trade'))
    fireEvent.change(screen.getByLabelText('Action'), { target: { value: 'BTC' } })
    fireEvent.change(screen.getByLabelText('Contracts'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Premium per contract'), { target: { value: '1.00' } })
    fireEvent.click(screen.getByText('Add Trade'))

    // 4. Verify closed status and P&L
    await waitFor(() => {
      expect(screen.getByText('Status: Closed')).toBeVisible()
      expect(screen.getByText('Realized P&L: $400.00')).toBeVisible()  // (3 - 1) × 2 × 100
    })
  })
})
```

---

## Common Gotchas

### 1. Type-Only Imports

```typescript
// WRONG - will fail in browser
import { Position, Trade } from '@/types'

// CORRECT - compile-time only
import type { Position, Trade } from '@/types'
```

### 2. Contract Multiplier

Always multiply by 100 for total values:

```typescript
// Per contract values
const intrinsicPerContract = strikePrice - stockPrice

// Total values (contracts × 100 shares each)
const intrinsicTotal = intrinsicPerContract * contracts * 100
```

### 3. Date Handling

Store dates as ISO strings in IndexedDB, convert on read:

```typescript
// Storing
position.expiration_date = new Date().toISOString()

// Reading
position.expiration_date = new Date(storedPosition.expiration_date)
```

### 4. Price Sign Convention

Short positions profit when price **decreases**:

```typescript
// Stock (long): profit = current - cost (positive = gain)
// Option (short): profit = sold - current (positive = gain when option cheaper)
```

---

## File Checklist

New files to create:

- [ ] `src/lib/utils/occSymbol.ts`
- [ ] `src/domain/calculators/IntrinsicExtrinsicCalculator.ts`
- [ ] `src/domain/validators/OptionContractValidator.ts`
- [ ] `src/services/AssignmentService.ts`
- [ ] `src/components/option/IntrinsicExtrinsicDisplay.tsx`
- [ ] `src/components/option/AssignmentModal.tsx`
- [ ] `src/components/option/StrategyBadge.tsx`

Files to extend:

- [ ] `src/lib/position.ts` - Add option fields to Position/Trade interfaces (strategy_type, trade_kind, option_type, strike_price, expiration_date, occ_symbol, action, etc.)
- [ ] `src/domain/calculators/PnLCalculator.ts` - Add short put calculations
- [ ] `src/domain/validators/PositionValidator.ts` - Add option validation
- [ ] `src/domain/validators/TradeValidator.ts` - Add option trade validation
- [ ] `src/services/TradeService.ts` - Add option trade operations
- [ ] `src/services/PriceService.ts` - Add OCC symbol support
- [ ] `src/types/journal.ts` - Add 'option_assignment' entry type
- [ ] `src/types/priceHistory.ts` - Support OCC symbols as instrument identifiers

---

## Next Steps

1. Run `/speckit.tasks` to generate implementation tasks
2. Write failing tests first (TDD)
3. Implement in priority order (P1 → P2 → P3)
4. Run `/soc-review` before committing
