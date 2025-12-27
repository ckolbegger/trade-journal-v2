# Quickstart: Short Put Strategy Support

**Feature**: 002-short-put-strategy
**Date**: 2025-12-27

## Overview

This guide provides a quick reference for implementing the Short Put Strategy Support feature. It includes code examples, file locations, and common patterns.

---

## Quick Reference

### Key Files to Create/Modify

| File | Purpose | Status |
|------|---------|--------|
| `src/domain/lib/optionUtils.ts` | OCC symbol derivation/parsing | New |
| `src/domain/calculators/OptionValueCalculator.ts` | Intrinsic/extrinsic value | New |
| `src/domain/calculators/CostBasisCalculator.ts` | FIFO per instrument | Extend |
| `src/domain/lib/assignmentHandler.ts` | Assignment position creation | New |
| `src/domain/calculators/ShortPutPnLCalculator.ts` | Short put P&L calculation | New |
| `src/domain/validators/PositionValidator.ts` | Option position validation | Extend |
| `src/domain/validators/TradeValidator.ts` | Option trade validation | Extend |
| `src/services/SchemaManager.ts` | Database version 4 migration | Extend |
| `src/services/PositionService.ts` | Option position queries | Extend |
| `src/services/TradeService.ts` | Assignment handling | Extend |
| `src/services/JournalService.ts` | Assignment journal prompts | Extend |
| `src/types/journal.ts` | Add option_assignment type | Extend |
| `src/components/forms/PositionPlanForm.tsx` | Strategy selector, option fields | Extend |
| `src/components/forms/AddTradeForm.tsx` | Option action selector | Extend |
| `src/components/forms/strategy/` | Option input components | New |

---

## Code Snippets

### 1. Derive OCC Symbol

```typescript
// src/domain/lib/optionUtils.ts

export function deriveOCCSymbol(
  symbol: string,
  expirationDate: Date,
  optionType: 'call' | 'put',
  strikePrice: number
): string {
  const paddedSymbol = symbol.padEnd(6, ' ')
  const yy = expirationDate.getFullYear().toString().slice(-2)
  const mm = expirationDate.getMonth().toString().padStart(2, '0')
  const dd = expirationDate.getDate().toString().padStart(2, '0')
  const yymmdd = `${yy}${mm}${dd}`
  const typeCode = optionType === 'call' ? 'C' : 'P'
  const strikeCents = Math.round(strikePrice * 1000)
  const strikeCode = strikeCents.toString().padStart(8, '0')
  return `${paddedSymbol}${yymmdd}${typeCode}${strikeCode}`
}

// Usage:
const occSymbol = deriveOCCSymbol(
  'AAPL',
  new Date('2025-01-17'),
  'put',
  105
)
// Result: "AAPL  250117P00105000"
```

---

### 2. Calculate Intrinsic/Extrinsic Value

```typescript
// src/domain/calculators/OptionValueCalculator.ts

export function calculatePutIntrinsicValue(
  strikePrice: number,
  stockPrice: number
): number {
  return Math.max(0, strikePrice - stockPrice)
}

export function calculateExtrinsicValue(
  optionPrice: number,
  intrinsicValue: number
): number {
  return optionPrice - intrinsicValue
}

// Usage:
const intrinsic = calculatePutIntrinsicValue(100, 95)  // $5.00
const extrinsic = calculateExtrinsicValue(6.00, 5.00)  // $1.00
```

---

### 3. Validate Option Position

```typescript
// src/domain/validators/PositionValidator.ts

import type { Position } from '@/lib/position'

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function validateOptionPosition(position: Position): void {
  if (position.strategy_type === 'Short Put') {
    if (!position.option_type || position.option_type !== 'put') {
      throw new ValidationError('Option type must be "put" for Short Put strategy')
    }
    if (!position.strike_price || position.strike_price <= 0) {
      throw new ValidationError('Strike price must be greater than 0')
    }
    if (!position.expiration_date) {
      throw new ValidationError('Expiration date is required')
    }
    if (position.expiration_date <= new Date()) {
      throw new ValidationError('Expiration date must be in the future')
    }
    if (!position.profit_target_basis || !position.stop_loss_basis) {
      throw new ValidationError('Profit target and stop loss basis are required')
    }
  }
}
```

---

### 4. FIFO Per Instrument

```typescript
// src/domain/calculators/CostBasisCalculator.ts

export function groupTradesByInstrument(trades: Trade[]): Map<string, Trade[]> {
  const groups = new Map<string, Trade[]>()
  for (const trade of trades) {
    const key = trade.occ_symbol || trade.underlying
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(trade)
  }
  return groups
}

export function calculateInstrumentFIFO(
  instrumentTrades: Trade[]
): { realizedPnL: number; openQuantity: number } {
  const sorted = [...instrumentTrades].sort((a, b) =>
    a.timestamp.getTime() - b.timestamp.getTime()
  )

  let openQuantity = 0
  let realizedPnL = 0
  const buyQueue: Array<{ quantity: number; price: number }> = []

  for (const trade of sorted) {
    if (trade.trade_type === 'buy') {
      buyQueue.push({ quantity: trade.quantity, price: trade.price })
      openQuantity += trade.quantity
    } else {
      let remainingToSell = trade.quantity
      while (remainingToSell > 0 && buyQueue.length > 0) {
        const oldestBuy = buyQueue[0]
        const matchQuantity = Math.min(remainingToSell, oldestBuy.quantity)

        realizedPnL += (trade.price - oldestBuy.price) * matchQuantity
        openQuantity -= matchQuantity
        oldestBuy.quantity -= matchQuantity

        if (oldestBuy.quantity <= 0) {
          buyQueue.shift()
        }
        remainingToSell -= matchQuantity
      }
    }
  }

  return { realizedPnL, openQuantity }
}
```

---

### 5. Handle Assignment

```typescript
// src/domain/lib/assignmentHandler.ts

export function createAssignmentStockPosition(
  optionPosition: Position,
  assignmentTrade: Trade,
  contractsAssigned: number
): Position {
  const sharesAssigned = contractsAssigned * 100
  const premiumReceived = calculatePremiumReceivedPerShare(optionPosition.trades)
  const strikePrice = optionPosition.strike_price!
  const costBasis = strikePrice - premiumReceived

  return {
    id: generateId(),
    symbol: optionPosition.symbol,
    strategy_type: 'Long Stock',
    target_entry_price: strikePrice,
    target_quantity: sharesAssigned,
    profit_target: 0,  // User will set this
    stop_loss: 0,      // User will set this
    position_thesis: `Acquired via assignment from ${optionPosition.strike_price} put`,
    created_date: new Date(),
    status: 'open',
    journal_entry_ids: [],
    trades: [{
      id: generateId(),
      position_id: '',  // Will be set to new position ID
      trade_type: 'buy',
      quantity: sharesAssigned,
      price: strikePrice,
      timestamp: assignmentTrade.timestamp,
      underlying: optionPosition.symbol,
      created_stock_position_id: '',  // Self-reference
      cost_basis_adjustment: -premiumReceived
    }]
  }
}

function calculatePremiumReceivedPerShare(trades: Trade[]): number {
  // Calculate average premium received per share from STO trades
  const stoTrades = trades.filter(t => t.action === 'STO')
  const totalPremium = stoTrades.reduce((sum, t) => sum + t.price * t.quantity, 0)
  const totalContracts = stoTrades.reduce((sum, t) => sum + t.quantity, 0)
  return totalContracts > 0 ? (totalPremium / totalContracts) / 100 : 0
}
```

---

### 6. Database Migration

```typescript
// src/services/SchemaManager.ts

export class SchemaManager {
  static readonly CURRENT_VERSION = 4  // Incremented from 3

  static initializeSchema(db: IDBDatabase, version: number): void {
    // Create positions store (if not exists)
    if (!db.objectStoreNames.contains('positions')) {
      const positionStore = db.createObjectStore('positions', { keyPath: 'id' })
      positionStore.createIndex('symbol', 'symbol', { unique: false })
      positionStore.createIndex('status', 'status', { unique: false })
      positionStore.createIndex('created_date', 'created_date', { unique: false })
    }

    // Create other stores...

    // Migration v3 → v4: Add strategy_type
    if (version === 4) {
      const transaction = db.transaction(['positions'], 'readwrite')
      const store = transaction.objectStore('positions')
      const request = store.openCursor()

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          const position = cursor.value
          if (!position.strategy_type) {
            position.strategy_type = 'Long Stock'
            cursor.update(position)
          }
          cursor.continue()
        }
      }
    }
  }
}
```

---

### 7. Extended Position Type

```typescript
// src/lib/position.ts (or create src/types/position.ts)

export interface Position {
  // Core identity
  id: string
  symbol: string
  strategy_type: 'Long Stock' | 'Short Put'

  // Immutable plan fields
  target_entry_price: number
  target_quantity: number
  profit_target: number
  stop_loss: number
  position_thesis: string
  created_date: Date

  // Price target basis (NEW)
  profit_target_basis?: 'stock_price' | 'option_price'
  stop_loss_basis?: 'stock_price' | 'option_price'

  // Option-specific fields (NEW)
  option_type?: 'put' | 'call'
  strike_price?: number
  expiration_date?: Date
  premium_per_contract?: number

  // Derived state
  status: 'planned' | 'open' | 'closed'
  journal_entry_ids: string[]
  trades: Trade[]
}

export interface Trade {
  // ... existing fields ...
  action?: 'STO' | 'BTC' | 'BTO' | 'STC'
  occ_symbol?: string
  option_type?: 'call' | 'put'
  strike_price?: number
  expiration_date?: Date
  underlying_price_at_trade?: number
  created_stock_position_id?: string
  cost_basis_adjustment?: number
}
```

---

### 8. Assignment Journal Prompts

```typescript
// src/types/journal.ts

export interface JournalEntry {
  // ... existing fields ...
  entry_type: 'position_plan' | 'trade_execution' | 'option_assignment'  // Extended
}

export const JOURNAL_PROMPTS = {
  // ... existing prompts ...

  option_assignment: [
    {
      name: 'assignment_cause',
      prompt: 'What happened that led to assignment?',
      required: true
    },
    {
      name: 'feelings_about_stock',
      prompt: 'How do you feel about now owning this stock?',
      required: false
    },
    {
      name: 'stock_plan',
      prompt: "What's your plan for the stock position?",
      required: false
    }
  ]
} as const
```

---

### 9. Option Input Components

```typescript
// src/components/forms/strategy/StrikePriceInput.tsx

import type { InputHTMLAttributes } from 'react'

interface StrikePriceInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
}

export function StrikePriceInput({ label = 'Strike Price', error, ...props }: StrikePriceInputProps) {
  return (
    <div className="space-y-1">
      <label htmlFor="strike-price" className="block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
        <input
          id="strike-price"
          type="number"
          step="0.01"
          min="0"
          className="w-full pl-7 pr-3 py-2 border rounded-md"
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
```

```typescript
// src/components/forms/strategy/ExpirationDatePicker.tsx

import type { InputHTMLAttributes } from 'react'

interface ExpirationDatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  minDate?: Date
}

export function ExpirationDatePicker({
  label = 'Expiration Date',
  error,
  minDate = new Date(),
  ...props
}: ExpirationDatePickerProps) {
  const min = minDate.toISOString().split('T')[0]

  return (
    <div className="space-y-1">
      <label htmlFor="expiration-date" className="block text-sm font-medium">
        {label}
      </label>
      <input
        id="expiration-date"
        type="date"
        min={min}
        className="w-full px-3 py-2 border rounded-md"
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
```

---

### 10. Position Display with Option Details

```typescript
// src/components/positions/OptionPositionCard.tsx

import type { Position } from '@/lib/position'
import { calculatePutIntrinsicValue, calculateExtrinsicValue } from '@/domain/calculators/OptionValueCalculator'

interface OptionPositionCardProps {
  position: Position
  stockPrice?: number
  optionPrice?: number
}

export function OptionPositionCard({ position, stockPrice, optionPrice }: OptionPositionCardProps) {
  const showValueBreakdown = stockPrice !== undefined && optionPrice !== undefined

  let intrinsicValue = 0
  let extrinsicValue = 0

  if (showValueBreakdown && position.strike_price) {
    intrinsicValue = calculatePutIntrinsicValue(position.strike_price, stockPrice)
    extrinsicValue = calculateExtrinsicValue(optionPrice, intrinsicValue)
  }

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{position.symbol}</span>
        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
          Short Put
        </span>
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Strike:</span>
          <span className="font-medium">${position.strike_price?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Expiration:</span>
          <span className="font-medium">
            {position.expiration_date?.toLocaleDateString()}
          </span>
        </div>

        {showValueBreakdown && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-600">Intrinsic:</span>
              <span className="font-medium">${intrinsicValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Extrinsic:</span>
              <span className={`font-medium ${extrinsicValue < 0 ? 'text-red-600' : ''}`}>
                ${extrinsicValue.toFixed(2)}
              </span>
            </div>
          </>
        )}

        {!showValueBreakdown && (
          <p className="text-xs text-amber-600 mt-2">
            Price data required for valuation
          </p>
        )}
      </div>
    </div>
  )
}
```

---

## Testing Patterns

### Test: OCC Symbol Derivation

```typescript
// src/domain/lib/__tests__/optionUtils.test.ts

import { describe, it, expect } from 'vitest'
import { deriveOCCSymbol, parseOCCSymbol } from '../optionUtils'

describe('optionUtils', () => {
  describe('deriveOCCSymbol', () => {
    it('should derive correct OCC symbol for AAPL $105 Put', () => {
      const result = deriveOCCSymbol(
        'AAPL',
        new Date('2025-01-17'),
        'put',
        105
      )
      expect(result).toBe('AAPL  250117P00105000')
    })

    it('should pad symbols shorter than 6 characters', () => {
      const result = deriveOCCSymbol(
        'T',
        new Date('2025-03-21'),
        'call',
        25
      )
      expect(result).toBe('T     250321C00025000')
    })
  })

  describe('parseOCCSymbol', () => {
    it('should parse OCC symbol back to components', () => {
      const result = parseOCCSymbol('AAPL  250117P00105000')
      expect(result).toEqual({
        symbol: 'AAPL',
        expirationDate: new Date('2025-01-17'),
        optionType: 'put',
        strikePrice: 105
      })
    })
  })
})
```

---

### Test: Option Position Validation

```typescript
// src/domain/validators/__tests__/PositionValidator.test.ts

import { describe, it, expect } from 'vitest'
import { validateOptionPosition } from '../PositionValidator'
import type { Position } from '@/lib/position'
import { ValidationError } from '../ValidationError'

describe('validateOptionPosition', () => {
  const validShortPut: Position = {
    id: '1',
    symbol: 'AAPL',
    strategy_type: 'Short Put',
    option_type: 'put',
    strike_price: 100,
    expiration_date: new Date(Date.now() + 86400000),  // Tomorrow
    profit_target_basis: 'option_price',
    stop_loss_basis: 'stock_price',
    target_entry_price: 3,
    target_quantity: 5,
    profit_target: 1.5,
    stop_loss: 105,
    position_thesis: 'Test',
    created_date: new Date(),
    status: 'planned',
    journal_entry_ids: [],
    trades: []
  }

  it('should validate a valid short put position', () => {
    expect(() => validateOptionPosition(validShortPut)).not.toThrow()
  })

  it('should reject missing option_type', () => {
    const position = { ...validShortPut, option_type: undefined }
    expect(() => validateOptionPosition(position)).toThrow(ValidationError)
  })

  it('should reject past expiration date', () => {
    const position = {
      ...validShortPut,
      expiration_date: new Date(Date.now() - 86400000)  // Yesterday
    }
    expect(() => validateOptionPosition(position)).toThrow(ValidationError)
  })
})
```

---

### Test: FIFO Per Instrument

```typescript
// src/domain/calculators/__tests__/CostBasisCalculator.test.ts

import { describe, it, expect } from 'vitest'
import { calculateInstrumentFIFO, groupTradesByInstrument } from '../CostBasisCalculator'
import type { Trade } from '@/lib/position'

describe('calculateInstrumentFIFO', () => {
  it('should calculate FIFO for stock trades', () => {
    const trades: Trade[] = [
      { id: '1', trade_type: 'buy', quantity: 100, price: 50, timestamp: new Date('2025-01-01'), underlying: 'AAPL' },
      { id: '2', trade_type: 'buy', quantity: 50, price: 55, timestamp: new Date('2025-01-02'), underlying: 'AAPL' },
      { id: '3', trade_type: 'sell', quantity: 75, price: 60, timestamp: new Date('2025-01-03'), underlying: 'AAPL' }
    ]

    const result = calculateInstrumentFIFO(trades)
    expect(result.realizedPnL).toBe(625)  // (60-50)*50 + (60-55)*25
    expect(result.openQuantity).toBe(75)  // 100+50-75
  })

  it('should group trades by OCC symbol for options', () => {
    const trades: Trade[] = [
      { id: '1', action: 'STO', occ_symbol: 'AAPL  250117P00105000', quantity: 5, price: 3, timestamp: new Date(), underlying: 'AAPL' },
      { id: '2', action: 'BTC', occ_symbol: 'AAPL  250117P00105000', quantity: 2, price: 1, timestamp: new Date(), underlying: 'AAPL' }
    ]

    const groups = groupTradesByInstrument(trades)
    expect(groups.size).toBe(1)
    expect(groups.get('AAPL  250117P00105000')).toHaveLength(2)
  })
})
```

---

## Import Best Practices

**CRITICAL**: Always use type-only imports for interfaces:

```typescript
// ✅ CORRECT
import type { Position, Trade } from '@/lib/position'
import { PositionService } from '@/services/PositionService'

// ❌ WRONG - will fail in browser
import { Position, Trade } from '@/lib/position'
```

---

## Common Gotchas

### 1. Date Comparison

```typescript
// ❌ WRONG - compares references
if (position.expiration_date > new Date()) { ... }

// ✅ CORRECT - compares timestamps
if (position.expiration_date.getTime() > Date.now()) { ... }
```

### 2. Optional Field Access

```typescript
// ❌ WRONG - may crash
const strike = position.strike_price.toFixed(2)

// ✅ CORRECT - checks for undefined
const strike = position.strike_price?.toFixed(2) ?? 'N/A'
```

### 3. OCC Symbol Case Sensitivity

```typescript
// OCC symbols are case-sensitive for option type
// 'C' = Call, 'P' = Put
const typeCode = optionType === 'call' ? 'C' : 'P'  // ✅ CORRECT
const typeCode = optionType === 'call' ? 'c' : 'p'  // ❌ WRONG
```

### 4. Contract Multiplier

```typescript
// Options use 100 shares per contract multiplier
const totalShares = contracts * 100  // ✅ CORRECT
const totalShares = contracts        // ❌ WRONG - misses multiplier
```

---

## Checklist for Implementation

- [ ] Create OCC symbol utility functions
- [ ] Extend Position interface with option fields
- [ ] Extend Trade interface with option fields
- [ ] Implement option value calculators
- [ ] Extend FIFO calculator for per-instrument tracking
- [ ] Create assignment handler
- [ ] Implement database migration (v3 → v4)
- [ ] Extend position/trade validators
- [ ] Add option_assignment journal prompts
- [ ] Extend PositionPlanForm with strategy selector
- [ ] Create option input components (strike, expiration)
- [ ] Extend AddTradeForm with option action selector
- [ ] Create OptionPositionCard for dashboard display
- [ ] Write integration tests for position lifecycle
- [ ] Write integration tests for assignment flow
- [ ] Update documentation (CLAUDE.md)

---

## Related Documentation

- [Feature Specification](./spec.md) - Complete user stories and requirements
- [Data Model](./data-model.md) - Entity definitions and relationships
- [Research](./research.md) - Technical decisions and rationale
- [Domain API Contracts](./contracts/domain-apis.ts) - Domain layer function signatures
- [Service API Contracts](./contracts/service-apis.ts) - Service layer function signatures
