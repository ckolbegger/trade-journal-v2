# Comprehensive Test Refactoring Plan - Phase 2

## Executive Summary

Following the successful completion of Phase 1 (test-simplification-plan.md), this plan addresses **52 additional test files** with similar refactoring opportunities. Phase 1 demonstrated the value and safety of these patterns across 7 files with zero regressions.

**Scope:**
- 15 files with duplicate `createTestPosition` factories
- 7 files with duplicate `createTestTrade` factories
- 37 files with duplicate database setup code
- 17 component tests that could benefit from render helpers

**Expected outcomes:**
- ~1,500 lines of code reduction
- Improved test maintainability
- Consistent patterns across entire test suite
- Zero functional regressions

---

## Phase 2A: Factory Consolidation (22 files)

### Background
Phase 1 successfully consolidated factories in 5 files. Analysis shows 22 additional files still using duplicate factory functions.

### Task Group 1: Remove Duplicate `createTestPosition` Factories (15 files)

**Pattern to apply:**
```typescript
// REMOVE local factory:
const createTestPosition = (overrides?: Partial<Position>): Position => ({ ... })

// ADD import:
import { createPosition } from '@/test/data-factories'

// UPDATE all references:
createTestPosition() → createPosition()
```

**Files to update:**

**Lib Tests (3 files):**
1. `src/lib/__tests__/PositionService-db-injection.test.ts`
2. `src/lib/__tests__/trade-interface.test.ts`
3. `src/lib/__tests__/validateExitTrade.test.ts`

**Component Tests (3 files):**
4. `src/components/__tests__/DashboardOptionA.test.tsx`
5. `src/components/__tests__/PositionDetail.test.tsx`
6. `src/components/__tests__/StatusBadge.test.tsx`

**Integration Tests (5 files):**
7. `src/integration/__tests__/end-to-end-trade.test.ts`
8. `src/integration/__tests__/final-polish.test.ts`
9. `src/integration/__tests__/status-ui-integration.test.ts`
10. `src/integration/__tests__/backward-compatibility.test.ts`
11. `src/integration/__tests__/position-detail-trade-display.test.ts`

**Service Tests (4 files):**
12. `src/services/__tests__/PositionService-metrics.test.ts`
13. `src/services/__tests__/TradeService-underlying.test.ts`
14. `src/services/__tests__/trade-validation.test.ts`
15. `src/services/__tests__/PositionService-options.test.ts`

### Task Group 2: Remove Duplicate `createTestTrade` Factories (7 files)

**Pattern to apply:**
```typescript
// REMOVE local factory:
const createTestTrade = (overrides?: Partial<Trade>): Trade => ({ ... })

// ADD import:
import { createTrade } from '@/test/data-factories'

// UPDATE all references:
createTestTrade() → createTrade()
```

**Files to update:**
1. `src/lib/__tests__/trade-interface.test.ts`
2. `src/lib/__tests__/validateExitTrade.test.ts`
3. `src/integration/__tests__/final-polish.test.ts`
4. `src/integration/__tests__/status-ui-integration.test.ts`
5. `src/services/__tests__/PositionService-metrics.test.ts`
6. `src/services/__tests__/TradeService-underlying.test.ts`
7. `src/services/__tests__/trade-validation.test.ts`

**Verification:**
```bash
npm test -- src/lib/__tests__ src/components/__tests__ src/integration/__tests__ src/services/__tests__
```

---

## Phase 2B: Database Setup Consolidation (37 files)

### Background
Phase 1 created `src/test/db-helpers.ts` and applied it to 3 files. Analysis shows 37 additional files duplicating the same database setup pattern.

### Pattern to Apply

**REMOVE this pattern (appears in all 37 files):**
```typescript
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
  // ... potentially tradeService, journalService
})

afterEach(async () => {
  ServiceContainer.resetInstance()
  const deleteRequest = indexedDB.deleteDatabase('TradingJournalDB')
  await new Promise<void>((resolve) => {
    deleteRequest.onsuccess = () => resolve()
    deleteRequest.onerror = () => resolve()
    deleteRequest.onblocked = () => resolve()
  })
})
```

**REPLACE with:**
```typescript
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

### Task Group 3: Lib Tests (2 files)
1. `src/lib/__tests__/PositionService-db-injection.test.ts`
2. `src/lib/position.test.ts`

### Task Group 4: Component Tests (2 files)
3. `src/components/__tests__/Dashboard.test.tsx`
4. `src/components/__tests__/DashboardOptionA.test.tsx`

### Task Group 5: Page Tests (6 files)
5. `src/pages/__tests__/PositionDetail-carousel.integration.test.tsx`
6. `src/pages/__tests__/PositionDetail-pnl.test.tsx`
7. `src/pages/__tests__/PositionDetail-add-journal.test.tsx`
8. `src/pages/PositionDetail.test.tsx`
9. `src/pages/Dashboard.test.tsx`
10. `src/pages/Home.test.tsx`

### Task Group 6: Integration Tests (17 files)
11. `src/integration/__tests__/end-to-end-trade.test.ts`
12. `src/integration/__tests__/final-polish.test.ts`
13. `src/integration/__tests__/service-lifecycle.test.tsx`
14. `src/integration/__tests__/status-ui-integration.test.ts`
15. `src/integration/__tests__/trade-to-journal-workflow.test.tsx`
16. `src/integration/__tests__/4-step-position-creation.test.tsx`
17. `src/integration/__tests__/backward-compatibility.test.ts`
18. `src/integration/__tests__/position-detail-trade-display.test.ts`
19. `src/integration/add-trade-from-position-detail.test.tsx`
20. `src/integration/dashboard-display-flow.test.tsx`
21. `src/integration/position-detail-journal-integration.test.tsx`
22. `src/integration/position-detail-routing.test.tsx`
23. `src/integration/simple-trade-execution.test.tsx`
24. `src/integration/trade-execution-workflow.test.tsx`
25. `src/integration/two-step-trade-journal-flow.test.tsx`
26. `src/__tests__/integration/close-position.test.ts`

### Task Group 7: Service Tests (10 files)
27. `src/services/__tests__/PriceService-db-injection.test.ts`
28. `src/services/__tests__/PriceService.test.ts`
29. `src/services/__tests__/ServiceContainer.test.ts`
30. `src/services/__tests__/PositionService-compatibility.test.ts`
31. `src/services/__tests__/PositionService-status.test.ts`
32. `src/services/__tests__/SchemaManager.test.ts`
33. `src/services/__tests__/TradeService-costBasis.test.ts`
34. `src/services/__tests__/TradeService-transactions.test.ts`
35. `src/services/__tests__/PositionService-migration.test.ts`
36. `src/services/__tests__/PositionService-options.test.ts`
37. `src/services/__tests__/position-journal-transaction.test.ts`

**Special Case - Custom DB Names:**
Some files use custom database names (e.g., `PositionService-db-injection.test.ts` uses 'TestDB'). For these files, use the `deleteDatabase(dbName)` helper directly if they need to preserve custom DB names for isolation.

**Verification:**
```bash
npm test
```

---

## Phase 2C: Component Render Helpers (Optional - 16 files)

### Background
Phase 1 created `renderPositionCard()` helper. Other frequently-tested components could benefit from similar patterns.

### Recommended Candidates for Render Helpers

**High-value candidates (tested 5+ times):**
1. `DashboardOptionA` - used in `src/components/__tests__/DashboardOptionA.test.tsx`
2. `Dashboard` - used in `src/components/__tests__/Dashboard.test.tsx`
3. `PositionDetail` - used in multiple page tests
4. `StatusBadge` - used in `src/components/__tests__/StatusBadge.test.tsx`

**Pattern:**
```typescript
// Add to top of test file:
function renderDashboard(
  positions: Position[] = [],
  onPositionClick = vi.fn()
) {
  const result = render(
    <Dashboard positions={positions} onPositionClick={onPositionClick} />
  )
  return { ...result, positions, onPositionClick }
}

// Then use:
const { getByText, positions } = renderDashboard([mockPosition])
```

**Decision point:** Render helpers are optional and should only be created when a component is tested frequently with varying props. Unlike factories and database helpers, these have diminishing returns.

**Recommendation:** Defer Phase 2C until specific component tests become painful to maintain.

---

## Phase 2D: Additional Opportunities (Future)

### Parameterized Test Conversions (5-10 files estimated)
Files with repetitive validation tests could benefit from `it.each()` patterns:
- `src/domain/__tests__/PositionValidator.test.ts`
- `src/domain/__tests__/PriceValidator.test.ts`
- Other validator tests

**Recommendation:** Defer until validators become more complex or harder to maintain.

### Mock Service Factory Expansion
As more services are tested, expand `src/test/mocks/service-mocks.ts`:
- `createMockPriceService()`
- `createMockSchemaManager()`

**Recommendation:** Add on-demand as service unit tests are written.

---

## Implementation Strategy

### Recommended Approach: Incremental Rollout

**Week 1: High-Impact, Low-Risk**
- Phase 2A Task Group 1 (15 files - factory consolidation)
  - Est. time: 2 hours
  - Risk: Very low (proven pattern from Phase 1)
  - Impact: ~200 lines removed

**Week 2: Database Setup - Service Tests**
- Phase 2B Task Group 7 (10 service test files)
  - Est. time: 2 hours
  - Risk: Low (proven pattern)
  - Impact: ~300 lines removed

**Week 3: Database Setup - Integration Tests**
- Phase 2B Task Group 6 (17 integration test files)
  - Est. time: 3 hours
  - Risk: Low-Medium (more complex tests)
  - Impact: ~600 lines removed

**Week 4: Database Setup - Remaining**
- Phase 2B Task Groups 3, 4, 5 (10 remaining files)
  - Est. time: 2 hours
  - Risk: Low
  - Impact: ~300 lines removed

**Total estimated effort: 9-10 hours across 4 weeks**

### Alternative: Batch Approach (Faster, Higher Risk)

Complete all phases in 2-3 days:
- Day 1: All factory consolidation (Phase 2A)
- Day 2: All database setup (Phase 2B)
- Day 3: Testing and fixes

**Risk:** Higher chance of batch failures requiring rollback. Only recommended if test suite has excellent coverage and fast feedback.

---

## Success Metrics

### Quantitative
- [ ] All 52 files refactored
- [ ] ~1,500 lines of code removed
- [ ] 0 test failures introduced
- [ ] 0 change in test coverage percentage

### Qualitative
- [ ] New developers can find test utilities easily
- [ ] Consistent patterns across all test files
- [ ] Reduced cognitive load when writing new tests
- [ ] Faster test file creation using established patterns

---

## Rollback Plan

If issues arise during implementation:

1. **Per-file rollback:** Each file can be independently reverted without affecting others
2. **Per-phase rollback:** Each phase (2A, 2B, 2C) is independent
3. **Test-first validation:** Run `npm test` after each file change to catch issues immediately

**Git strategy:**
```bash
# Commit after each task group
git add src/lib/__tests__/*.test.ts
git commit -m "Refactor: consolidate factories in lib tests"

# Easy rollback if needed
git revert <commit-hash>
```

---

## Verification Checklist

After completing each phase:

- [ ] Run full test suite: `npm test`
- [ ] Verify 0 new failures
- [ ] Check test output for warnings
- [ ] Verify no TypeScript errors: `npm run type-check`
- [ ] Git diff shows only expected changes (no accidental deletions)
- [ ] Test coverage report unchanged: `npm run test:coverage`

---

## Task Checklist

### Phase 2A: Factory Consolidation
- [ ] Task Group 1: Lib tests (3 files) - createTestPosition
- [ ] Task Group 2: Component tests (3 files) - createTestPosition
- [ ] Task Group 3: Integration tests (5 files) - createTestPosition
- [ ] Task Group 4: Service tests (4 files) - createTestPosition
- [ ] Task Group 5: All files (7 files) - createTestTrade

### Phase 2B: Database Setup Consolidation
- [ ] Task Group 1: Lib tests (2 files)
- [ ] Task Group 2: Component tests (2 files)
- [ ] Task Group 3: Page tests (6 files)
- [ ] Task Group 4: Integration tests (17 files)
- [ ] Task Group 5: Service tests (10 files)

### Phase 2C: Render Helpers (Optional)
- [ ] Evaluate need for DashboardOptionA helper
- [ ] Evaluate need for Dashboard helper
- [ ] Evaluate need for PositionDetail helper
- [ ] Evaluate need for StatusBadge helper

### Phase 2D: Future Enhancements (Deferred)
- [ ] Parameterized test conversions
- [ ] Additional mock service factories

---

## Notes

1. **Import consistency:** Always use `@/test/...` path alias
2. **Type imports:** Use `import type` for TypeScript interfaces
3. **Preserve behavior:** Each refactoring must maintain identical test behavior
4. **Test incrementally:** Run tests after each file to catch issues early
5. **Document exceptions:** If a file can't be refactored, document why in code comments

---

## Appendix: Analysis Summary

**Total test files in codebase:** 87
**Phase 1 refactored:** 7 files
**Phase 2 identified:** 52 files
**Remaining after Phase 2:** ~28 files (likely specialized tests that don't fit patterns)

**Code reduction estimate:**
- Factory consolidation: ~400 lines
- Database setup: ~1,100 lines
- **Total: ~1,500 lines removed**

**Maintenance improvement:**
- Single source of truth for test factories
- Consistent database setup across all integration tests
- Easier onboarding for new contributors
- Reduced chance of copy-paste errors in tests
