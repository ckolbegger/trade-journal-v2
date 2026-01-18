# Test Simplification Implementation Plan

## Overview
Refactor unit and integration tests to eliminate duplication and improve maintainability by:
- Consolidating data factories
- Creating shared database utilities
- Standardizing mock patterns
- Simplifying assertions
- Using parameterized tests

All changes must preserve existing test functionality and coverage.

---

## Phase 1: Shared Data Factories (Tasks 1-5)

### Task 1: Create `createTrade` Factory
**File:** `src/test/data-factories.ts`

Add new factory function at the end of the file:
```typescript
export function createTrade(overrides: Partial<Trade> = {}): Trade {
  return {
    id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    position_id: 'pos-123',
    trade_type: 'buy',
    quantity: 100,
    price: 150.25,
    timestamp: new Date('2024-01-15T10:30:00.000Z'),
    underlying: 'AAPL',
    ...overrides
  }
}
```

Ensure proper imports for `Trade` type.

### Task 2-5: Remove Duplicate Factories
For each file, remove local factory functions and replace with imports:

**Files to update:**
1. `src/services/__tests__/TradeService.test.ts` (lines 8-33)
2. `src/integration/__tests__/position-lifecycle.test.ts` (lines 20-34)
3. `src/components/__tests__/TradeExecutionForm.test.tsx` (lines 6-20)
4. `src/components/__tests__/PositionCard.test.tsx` (lines 8-20)

**Pattern:**
```typescript
// Remove local functions, add import
import { createPosition, createTrade } from '@/test/data-factories'

// Update all references from createTestPosition/createTestTrade to createPosition/createTrade
```

---

## Phase 2: Database Helpers (Tasks 6-9)

### Task 6: Create Database Utility
**File:** `src/test/db-helpers.ts` (new file)

```typescript
import { ServiceContainer } from '@/services/ServiceContainer'
import type { PositionService } from '@/services/PositionService'
import type { TradeService } from '@/services/TradeService'
import type { JournalService } from '@/services/JournalService'

export async function deleteDatabase(dbName: string = 'TradingJournalDB'): Promise<void> {
  const deleteRequest = indexedDB.deleteDatabase(dbName)
  await new Promise<void>((resolve) => {
    deleteRequest.onsuccess = () => resolve()
    deleteRequest.onerror = () => resolve()
    deleteRequest.onblocked = () => resolve()
  })
}

export async function setupTestServices(): Promise<{
  positionService: PositionService
  tradeService: TradeService
  journalService: JournalService
}> {
  await deleteDatabase()
  ServiceContainer.resetInstance()
  const services = ServiceContainer.getInstance()
  await services.initialize()
  return {
    positionService: services.getPositionService(),
    tradeService: services.getTradeService(),
    journalService: services.getJournalService()
  }
}

export async function teardownTestServices(): Promise<void> {
  ServiceContainer.resetInstance()
  await deleteDatabase()
}
```

### Task 7-9: Replace Database Setup in Integration Tests
**Files:**
1. `src/integration/__tests__/position-lifecycle.test.ts`
2. `src/integration/position-creation-flow.test.tsx`
3. `src/services/__tests__/PositionService-trades.test.ts`

**Pattern to replace:**
```typescript
// OLD:
beforeEach(async () => {
  const deleteRequest = indexedDB.deleteDatabase('TradingJournalDB')
  await new Promise<void>((resolve) => {
    deleteRequest.onsuccess = () => resolve()
    deleteRequest.onerror = () => resolve()
    deleteRequest.onblocked = () => resolve()
  })
  ServiceContainer.resetInstance()
  const services = ServiceContainer.getInstance()
  await services.initialize()
  positionService = services.getPositionService()
})

// NEW:
import { setupTestServices, teardownTestServices } from '@/test/db-helpers'

beforeEach(async () => {
  const services = await setupTestServices()
  positionService = services.positionService
  tradeService = services.tradeService
  journalService = services.journalService
})

afterEach(async () => {
  await teardownTestServices()
})
```

---

## Phase 3: Mock Factories (Tasks 10-11)

### Task 10: Create Mock Service Factories
**File:** `src/test/mocks/service-mocks.ts` (new file, create directory if needed)

```typescript
import { vi } from 'vitest'
import type { PositionService } from '@/services/PositionService'
import type { TradeService } from '@/services/TradeService'
import type { JournalService } from '@/services/JournalService'

export function createMockPositionService() {
  return {
    getById: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    getAll: vi.fn(),
    delete: vi.fn(),
    clearAll: vi.fn(),
    close: vi.fn(),
  } as any as PositionService
}

export function createMockTradeService() {
  return {
    create: vi.fn(),
    getByPositionId: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  } as any as TradeService
}

export function createMockJournalService() {
  return {
    create: vi.fn(),
    getAll: vi.fn(),
    getByPositionId: vi.fn(),
  } as any as JournalService
}
```

### Task 11: Update TradeService.test.ts
**File:** `src/services/__tests__/TradeService.test.ts`

Replace lines 40-54 with:
```typescript
import { createMockPositionService } from '@/test/mocks/service-mocks'

// In beforeEach:
mockPositionService = createMockPositionService()
```

---

## Phase 4: Parameterized Tests (Task 12)

### Task 12: Convert TradeValidator Tests
**File:** `src/services/__tests__/TradeValidator.test.ts`

Replace lines 21-48 with:
```typescript
describe('required field validation', () => {
  it.each([
    ['position_id', '', 'Missing required fields'],
    ['trade_type', '', 'Missing required fields'],
    ['underlying', '', 'Missing required fields'],
  ])('should reject missing %s', (field, value, expectedError) => {
    const trade = { ...validTrade, [field]: value }
    expect(() => TradeValidator.validateTrade(trade)).toThrow(expectedError)
  })

  it.each([
    ['quantity', 0, 'Quantity must be positive'],
    ['quantity', -10, 'Quantity must be positive'],
  ])('should reject invalid quantity: %s', (field, value, expectedError) => {
    const trade = { ...validTrade, [field]: value }
    expect(() => TradeValidator.validateTrade(trade)).toThrow(expectedError)
  })

  it.each([
    ['price', -5, 'Price must be >= 0'],
  ])('should reject negative price', (field, value, expectedError) => {
    const trade = { ...validTrade, [field]: value }
    expect(() => TradeValidator.validateTrade(trade)).toThrow(expectedError)
  })
})
```

---

## Phase 5: Simplified Assertions (Task 13)

### Task 13: Update TradeService Assertions
**File:** `src/services/__tests__/TradeService.test.ts`

Find all occurrences of multiple field-by-field assertions (example at lines 136-146) and replace with:
```typescript
// Replace field-by-field checks with:
expect(result).toHaveLength(1)
expect(result[0]).toMatchObject({
  trade_type: buyTrade.trade_type,
  position_id: buyTrade.position_id,
  quantity: buyTrade.quantity,
  price: buyTrade.price,
  notes: buyTrade.notes
})
expect(result[0].id).toBeDefined()
expect(result[0].timestamp).toBeInstanceOf(Date)
```

Apply this pattern to all similar assertion blocks in the file.

---

## Phase 6: Component Render Helpers (Task 14)

### Task 14: Create PositionCard Render Helper
**File:** `src/components/__tests__/PositionCard.test.tsx`

Add at the top of the file after imports:
```typescript
function renderPositionCard(
  positionOverrides: Partial<Position> = {},
  metricsOverrides: Partial<{
    unrealizedPnL: number
    totalRisk: number
    currentPrice: number | null
  }> = {},
  onViewDetails = vi.fn()
) {
  const position = createPosition(positionOverrides)
  const metrics = { ...mockMetrics, ...metricsOverrides }
  const result = render(
    <PositionCard position={position} onViewDetails={onViewDetails} {...metrics} />
  )
  return { ...result, onViewDetails, position, metrics }
}
```

Replace all `render(<PositionCard ... />)` calls with `renderPositionCard(...)` and adjust to use the simpler API.

---

## Phase 7: Verification (Task 15)

### Task 15: Run Full Test Suite
```bash
npm test
```

**Expected outcome:** All tests pass with no failures. Test output should be cleaner and more maintainable.

**Verification checklist:**
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] No new TypeScript errors
- [ ] Test coverage remains the same or improves
- [ ] No console warnings or errors

---

## Implementation Notes

1. **Import paths:** Always use `@/` alias for imports (e.g., `@/test/data-factories`)
2. **Type imports:** Use `import type` for TypeScript interfaces/types
3. **Preserve behavior:** Each change must maintain exact same test behavior
4. **Test after each phase:** Run tests after completing each phase to catch issues early
5. **Line numbers are approximate:** Code may have shifted; search for patterns if exact lines don't match
6. **Create directories:** Create `src/test/mocks/` if it doesn't exist

---

## Task Checklist

**Status: NOT STARTED** - All tasks pending implementation.

- [ ] Task 1: Create createTrade factory in data-factories.ts
- [ ] Task 2: Remove duplicate from TradeService.test.ts
- [ ] Task 3: Remove duplicate from position-lifecycle.test.ts
- [ ] Task 4: Remove duplicate from TradeExecutionForm.test.tsx
- [ ] Task 5: Remove duplicate from PositionCard.test.tsx
- [ ] Task 6: Create db-helpers.ts utility
- [ ] Task 7: Update position-lifecycle.test.ts database setup
- [ ] Task 8: Update position-creation-flow.test.tsx database setup
- [ ] Task 9: Update PositionService-trades.test.ts database setup
- [ ] Task 10: Create service-mocks.ts with mock factories
- [ ] Task 11: Update TradeService.test.ts with mock factory
- [ ] Task 12: Convert TradeValidator.test.ts to parameterized tests
- [ ] Task 13: Simplify TradeService.test.ts assertions
- [ ] Task 14: Create renderPositionCard test helper
- [ ] Task 15: Run full test suite verification
