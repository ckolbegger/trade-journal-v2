# TradeJournalV2 - Test Coverage Improvement Recommendations

**Date:** 2025-11-23
**Current Test Count:** 576+ test cases across 67 test files
**Overall Coverage:** Excellent for core business logic, gaps in UI components

---

## Executive Summary

The codebase has strong test coverage for critical business logic (FIFO calculations, P&L computation, position status). The main gaps are in UI component isolation tests, error boundary handling, and accessibility testing.

---

## Current Coverage by Category

| Category | Coverage | Notes |
|----------|----------|-------|
| **Services** | 100% | All 4 services fully tested |
| **Pages** | 100% | All 6 pages have tests |
| **Core Utils** | 100% | P&L, cost basis, status computation |
| **Components** | 83% | 10/12 have direct tests |
| **UI Base Components** | Low | Minimal tests for button, input, etc. |
| **Accessibility** | None | No a11y tests |

---

## High Priority Gaps

### 1. Layout Component - NO UNIT TESTS

**File:** `src/components/Layout.tsx`
**Current Status:** Only tested indirectly through page integration tests
**Risk:** Layout/navigation changes may not be caught

**Recommended Tests:**
```
- renders navigation links correctly
- highlights active route
- renders children content
- mobile menu toggle behavior (if applicable)
- navigation link accessibility (aria labels)
```

**Estimated Tests:** 15-20 test cases

---

### 2. App.tsx Router - NO TESTS

**File:** `src/App.tsx`
**Current Status:** Route configuration untested in isolation
**Risk:** Route changes or typos not validated

**Recommended Tests:**
```
- renders Dashboard at "/" route
- renders PositionCreate at "/positions/new" route
- renders PositionDetail at "/positions/:id" route
- handles 404/unknown routes gracefully
- route parameters passed correctly to components
```

**Estimated Tests:** 10-15 test cases

---

### 3. PlanVsExecutionCard - NO DIRECT TESTS

**File:** `src/components/PlanVsExecutionCard.tsx`
**Current Status:** Only tested in one integration scenario (position closing flow)
**Risk:** Display formatting edge cases not covered

**Recommended Tests:**
```
- renders planned vs actual quantities correctly
- handles empty trades array
- displays partial execution scenarios (25%, 50%, 75% filled)
- formats P&L values correctly (positive, negative, zero)
- handles multiple exit trades display
- shows correct execution percentage
- displays "No trades executed" state
- handles very large/small numeric values
```

**Estimated Tests:** 20-30 test cases

---

### 4. UI Base Components - MINIMAL TESTS

**Files:**
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/accordion.tsx` (has 1 test)

**Current Status:** These are foundational components used everywhere but have minimal/no direct tests
**Risk:** Custom modifications or prop handling issues not caught

**Recommended Tests per Component:**
```
Button:
- renders with different variants (default, destructive, outline, etc.)
- handles click events
- disabled state prevents clicks
- renders children correctly
- applies custom className

Input:
- renders with placeholder
- handles value changes
- disabled state
- error state styling
- type attribute handling (text, number, etc.)

Label:
- renders text content
- associates with input via htmlFor
- required indicator display

Textarea:
- renders with placeholder
- handles value changes
- row/cols attributes
- resize behavior

Accordion:
- expands/collapses on click
- renders title and content
- multiple accordion behavior
- keyboard navigation
```

**Estimated Tests:** 5-10 per component (25-50 total)

---

## Medium Priority Gaps

### 5. Error Boundary Testing

**Current Status:** Service errors tested, component error handling limited
**Risk:** Unhandled errors crash the app

**Recommended Tests:**
```
- component renders error fallback on child error
- error boundary catches render errors
- error boundary catches event handler errors
- recovery mechanism works (retry/reset)
- error information logged appropriately
```

**Estimated Tests:** 10-15 test cases

---

### 6. Loading State Edge Cases

**Current Status:** Basic loading states tested
**Risk:** Race conditions and concurrent operations not fully covered

**Recommended Tests:**
```
- rapid navigation doesn't cause state issues
- concurrent data fetches handled correctly
- loading indicator shown during async operations
- stale data not displayed after navigation
- cancel pending requests on unmount
```

**Estimated Tests:** 10-15 test cases

---

### 7. Price Validation Edge Cases

**Current Status:** >20% threshold tested
**Risk:** Boundary values and extreme inputs not covered

**Recommended Tests:**
```
- exactly 20% change (boundary)
- 19.99% change (just under threshold)
- 20.01% change (just over threshold)
- zero price handling
- negative price rejection
- very small prices (0.0001)
- very large prices (999999.99)
- NaN/Infinity handling
- non-numeric input handling
```

**Estimated Tests:** 15-20 test cases

---

### 8. IndexedDB Persistence Edge Cases

**Current Status:** Basic CRUD tested via fake-indexeddb
**Risk:** Real-world persistence issues not caught

**Recommended Tests:**
```
- database version upgrade migrations
- storage quota exceeded handling
- concurrent read/write operations
- data corruption recovery
- browser private mode behavior
- clear all data functionality
```

**Estimated Tests:** 10-15 test cases

---

## Lower Priority Gaps

### 9. Accessibility (a11y) Testing

**Current Status:** No dedicated accessibility tests
**Risk:** App may not be usable with screen readers or keyboard

**Recommended Tests (using @testing-library/jest-dom or jest-axe):**
```
- all interactive elements are keyboard accessible
- proper heading hierarchy
- form labels associated with inputs
- color contrast sufficient
- focus management on modals
- aria-live regions for dynamic content
- skip navigation link
- alt text for any images/icons
```

**Estimated Tests:** 20-30 test cases

---

### 10. Performance Testing

**Current Status:** Minimal (one O(1) performance assertion)
**Risk:** Performance regressions not detected

**Recommended Tests:**
```
- large position list renders efficiently (100+ positions)
- large trade list renders efficiently (1000+ trades)
- FIFO calculation performance with many trades
- dashboard filter performance
- memory leak detection on navigation
```

**Estimated Tests:** 10-15 test cases

---

## Recommended Action Plan

### Phase 1: Quick Wins (1-2 days effort)

| Task | Tests to Add | Priority |
|------|--------------|----------|
| Add `Layout.test.tsx` | 15-20 | High |
| Add `PlanVsExecutionCard.test.tsx` | 20-30 | High |
| Add `App.test.tsx` router tests | 10-15 | High |
| **Phase 1 Total** | **45-65** | |

### Phase 2: Strengthen Foundation (3-5 days effort)

| Task | Tests to Add | Priority |
|------|--------------|----------|
| Expand UI component tests | 25-50 | Medium |
| Add error boundary tests | 10-15 | Medium |
| Add price validation edge cases | 15-20 | Medium |
| **Phase 2 Total** | **50-85** | |

### Phase 3: Production Readiness (1-2 weeks effort)

| Task | Tests to Add | Priority |
|------|--------------|----------|
| Add accessibility tests | 20-30 | Lower |
| Add performance benchmarks | 10-15 | Lower |
| Add IndexedDB edge case tests | 10-15 | Lower |
| Consider Playwright E2E tests | N/A | Lower |
| **Phase 3 Total** | **40-60** | |

---

## Test File Locations

New test files should follow existing patterns:

```
src/
├── components/
│   ├── __tests__/
│   │   ├── Layout.test.tsx              # NEW
│   │   ├── PlanVsExecutionCard.test.tsx # NEW
│   │   └── ... (existing)
│   └── ui/
│       └── __tests__/
│           ├── button.test.tsx          # NEW
│           ├── input.test.tsx           # NEW
│           └── ... (NEW)
├── pages/
│   └── __tests__/
│       └── ... (existing - good coverage)
├── App.test.tsx                         # NEW
└── integration/
    └── ... (existing - good coverage)
```

---

## Coverage Reporting

Consider enabling Vitest coverage reporting:

```bash
# Add to package.json scripts
"test:coverage": "vitest run --coverage"

# Install coverage provider
npm install -D @vitest/coverage-v8
```

This will provide quantitative metrics to track improvement over time.

---

## Summary

| Priority | Gap Area | New Tests | Effort |
|----------|----------|-----------|--------|
| High | Layout, PlanVsExecutionCard, Router | 45-65 | 1-2 days |
| Medium | UI components, error handling, validation | 50-85 | 3-5 days |
| Lower | Accessibility, performance, E2E | 40-60 | 1-2 weeks |
| **Total** | | **135-210** | |

The codebase already has excellent coverage of business logic. These recommendations focus on UI resilience, edge cases, and accessibility to achieve comprehensive production-ready coverage.
