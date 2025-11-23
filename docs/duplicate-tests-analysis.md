# TradeJournalV2 - Duplicate Tests Analysis

**Date:** 2025-11-23
**Status:** Analysis Complete

## Executive Summary

Analysis of the test suite identified **12 duplicate unit test cases** across 2 test file pairs. These duplicates test the same utility functions with essentially identical assertions, likely arising from iterative development.

---

## Duplicate Set #1: `calculateCostBasis()` Tests

### Files Involved

| File | Location | Test Count |
|------|----------|------------|
| `src/utils/__tests__/costBasis.test.ts` | Canonical location | 8 tests |
| `src/lib/__tests__/trade-calculations.test.ts` | Duplicate location | 9 tests (8 duplicate + 1 unique) |

### Duplicate Test Cases (8 total)

| Test Description | costBasis.test.ts | trade-calculations.test.ts |
|-----------------|-------------------|---------------------------|
| Empty trades returns 0 | Line 19 | Line 52 |
| First buy trade price | Line 6 | Line 39 |
| Ignore sell trades | Line 26 | Line 63 |
| First buy only with multiple trades | Line 39 | Line 79 |
| Fractional quantities | Line 61 | Line 96 |
| Very large prices | Line 74 | Line 109 |
| Very small prices | Line 87 | Line 122 |
| Pure function consistency | Line 100 | Line 135 |

### Unique Test (Keep)

`trade-calculations.test.ts` line 145: Service integration test using `TradeService.calculateCostBasis()` - this tests the service layer, not the utility function directly.

### Code Comparison

**costBasis.test.ts (Line 19):**
```typescript
it('[Unit] should return zero cost basis for empty trades array', () => {
  const trades: Trade[] = []
  const costBasis = calculateCostBasis(trades)
  expect(costBasis).toBe(0)
})
```

**trade-calculations.test.ts (Line 52):**
```typescript
it('[Unit] should return zero cost basis for empty trades array', () => {
  // Arrange
  const position = createTestPosition({ trades: [] })
  // Act
  const costBasis = calculateCostBasis(position.trades)
  // Assert
  expect(costBasis).toBe(0)
})
```

Both tests call `calculateCostBasis([])` and assert the result is `0`. The only difference is wrapping in a position object first.

### Recommendation

**Remove 8 duplicate tests from `trade-calculations.test.ts`**, keeping only:
- The service integration test (line 145)
- The test data factories (useful for other tests)

---

## Duplicate Set #2: `computePositionStatus()` Tests

### Files Involved

| File | Location | Test Count |
|------|----------|------------|
| `src/utils/__tests__/statusComputation.test.ts` | Canonical location | 10 tests |
| `src/lib/__tests__/position.test.ts` | Duplicate location | 5 tests (4 duplicate + tests for different function) |

### Duplicate Test Cases (4 total)

| Test Description | statusComputation.test.ts | position.test.ts |
|-----------------|---------------------------|------------------|
| Empty trades → "planned" | Line 6 | Line 18 |
| Null/undefined → "planned" | Line 60 | Line 23 |
| Buy trade → "open" | Line 12 | Line 30 |
| Full exit → "closed" | Line 100 | Line 49 |

### Unique Tests (Keep)

`position.test.ts` lines 77-147: Tests for `calculateOpenQuantity()` - this is a **different function** and these tests are NOT duplicates.

### Code Comparison

**statusComputation.test.ts (Line 6):**
```typescript
it('[Unit] should return "planned" when trades array is empty', () => {
  const trades: Trade[] = []
  const status = computePositionStatus(trades)
  expect(status).toBe('planned')
})
```

**position.test.ts (Line 18):**
```typescript
it('returns "planned" for empty trades array', () => {
  const trades: Trade[] = []
  expect(computePositionStatus(trades)).toBe('planned')
})
```

Identical logic and assertions.

### Recommendation

**Remove the `computePositionStatus` describe block from `position.test.ts`** (lines 16-75), keeping:
- The `calculateOpenQuantity` tests (lines 77-147)

---

## Summary

| Duplicate Set | Redundant Tests | Action |
|--------------|-----------------|--------|
| Cost Basis (`calculateCostBasis`) | 8 tests | Remove from `trade-calculations.test.ts` |
| Position Status (`computePositionStatus`) | 4 tests | Remove from `position.test.ts` |
| **Total** | **12 tests** | |

---

## Root Cause Analysis

These duplicates likely arose from:

1. **Iterative TDD Development**: Tests were written in multiple locations during feature implementation before the canonical test file locations were established.

2. **File Organization Evolution**: The codebase has both `/src/lib/` and `/src/utils/` directories. Tests were initially written in `/src/lib/__tests__/` and later the utility functions were extracted to `/src/utils/` with their own tests, but the original tests weren't removed.

3. **Different Developer Sessions**: Different development sessions may have added tests without checking for existing coverage.

---

## Recommended Actions

### Immediate (Low Risk)

1. Remove duplicate `calculateCostBasis` tests from `trade-calculations.test.ts`
2. Remove duplicate `computePositionStatus` tests from `position.test.ts`
3. Run full test suite to verify no regressions

### Post-Cleanup Verification

```bash
npm test -- --run
```

Ensure all 576+ tests still pass after removing the 12 duplicate tests.

---

## Files to Modify

### `src/lib/__tests__/trade-calculations.test.ts`

**Current:** 9 test cases
**After cleanup:** 1 test case (service integration test only)

Keep:
- Test data factories (`createTestTrade`, `createTestPosition`)
- Service integration test for `TradeService.calculateCostBasis()`

Remove:
- All 8 unit tests in "Simple Cost Basis Logic (Phase 1A)" describe block that directly test `calculateCostBasis()`

### `src/lib/__tests__/position.test.ts`

**Current:** ~9 test cases (5 for status + 4 for quantity)
**After cleanup:** ~4 test cases (only `calculateOpenQuantity` tests)

Keep:
- All `calculateOpenQuantity` tests (lines 77-147)

Remove:
- `computePositionStatus` describe block (lines 16-75)
