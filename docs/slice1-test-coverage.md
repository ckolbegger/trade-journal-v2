# Slice 1: Trade Data Foundation - Test to Requirements Mapping

This document maps the test cases to the acceptance criteria and technical requirements for Slice 1.

**Slice 1 Scope**: 101 tests (data foundation and service layer only)
**Deferred to Slice 2**: 21 tests (UI integration requiring trade execution flow)

---

## Acceptance Criteria Coverage Matrix

### AC1: Position interface updated to include `trades: Trade[]` array

**Requirement**: Position interface gains embedded trades array for future-proof data structure

**Test Coverage** (9 tests):
- ✅ [Unit] Trade interface with all required fields
- ✅ [Unit] Position.trades array field added to interface
- ✅ [Unit] Initialize trades as empty array for new positions
- ✅ [Unit] Allow multiple Trade objects in array
- ✅ [Unit] Maintain type safety for array elements
- ✅ [Service] Save Position with empty trades array
- ✅ [Service] Retrieve Position with trades array
- ✅ [Integration] Create Position with empty trades and display in dashboard
- ✅ [Integration] Load Position with trades and render in detail view

**Coverage Level**: Complete ✅ (9 tests cover type safety, persistence, UI integration)

---

### AC2: TradeService created for single trade operations within positions

**Requirement**: Service layer to manage trade operations with PositionService coordination

**Test Coverage** (15 tests for Slice 1):
- ✅ [Unit] addTrade() for buy trades
- ✅ [Unit] addTrade() for sell trades
- ✅ [Unit] Generate unique ID for each trade
- ✅ [Unit] Set/preserve timestamps correctly
- ✅ [Unit] Return updated Position after trade addition
- ✅ [Unit] Enforce Phase 1A single trade constraint
- ✅ [Unit] Validate quantity, price, timestamp, trade_type
- ✅ [Service] Create TradeService with PositionService dependency
- ✅ [Service] Add trade and persist via PositionService
- ✅ [Service] Retrieve position with trades
- ✅ [Service] Calculate cost basis through service
- ✅ [Service] Atomic updates to Position.trades
- ✅ [Service] Rollback on failure
- ✅ [Service] Validate before persisting
- ✅ [Service] Enforce single trade limit at service layer

**Coverage Level**: Complete ✅ (15 tests cover CRUD, validation, transactions, error handling)

**Deferred to Slice 2** (3 tests requiring UI):
- 🔄 [Integration] Add trade and retrieve from database
- 🔄 [Integration] Calculate cost basis after addition
- 🔄 [Integration] Prevent second trade across full stack

---

### AC3: Simple cost basis = first trade price (no FIFO complexity)

**Requirement**: Cost basis calculation using first buy trade price only in Phase 1A

**Test Coverage** (9 tests):
- ✅ [Unit] Cost basis equals first trade price for one buy trade
- ✅ [Unit] Return zero cost basis for empty trades array
- ✅ [Unit] Ignore sell trades in cost basis calculation
- ✅ [Unit] Calculate from first buy trade only (multiple trades)
- ✅ [Unit] Handle fractional quantities
- ✅ [Unit] Handle very large prices
- ✅ [Unit] Handle very small prices
- ✅ [Unit] Consistent calculation (pure function)
- ✅ [Service] Calculate cost basis using PositionService data

**Coverage Level**: Complete ✅ (9 tests cover basic logic, edge cases, service integration)

---

### AC4: Position status computed from trade data ('planned' | 'open' only)

**Requirement**: Status derived dynamically from trades array, not stored

**Test Coverage** (21 tests for Slice 1):
- ✅ [Unit] Return 'planned' when trades array is empty
- ✅ [Unit] Return 'open' when trades array contains buy trade
- ✅ [Unit] Return 'open' when trades array contains sell trade
- ✅ [Unit] Return 'open' for multiple trades
- ✅ [Unit] Handle null/undefined trades arrays
- ✅ [Unit] Handle zero-quantity trades
- ✅ [Unit] Pure function with consistent output
- ✅ [Unit] No 'closed' status in Phase 1A
- ✅ [Unit] O(1) performance for status computation
- ✅ [Service] Compute status dynamically on load
- ✅ [Service] Update status after trade addition
- ✅ [Service] Compute status for new positions
- ✅ [Service] Compute status for existing positions
- ✅ [Service] Don't store status in IndexedDB
- ✅ [Service] Compute fresh on every retrieval
- ✅ [Service] Handle modified trades array
- ✅ [Service] Default to 'planned' if corrupted

**Coverage Level**: Complete ✅ (21 tests cover computation logic and service layer)

**Deferred to Slice 2** (11 tests requiring UI):
- 🔄 [Integration] Display 'planned' badge for no trades
- 🔄 [Integration] Display 'open' badge for positions with trades
- 🔄 [Integration] Update badge after trade execution
- 🔄 [Integration] Show correct status in detail header
- 🔄 [Integration] Show/hide trade execution button based on status
- 🔄 [Integration] Update status across all views
- 🔄 [Integration] Persist status across refresh
- 🔄 [Integration] Filter by 'planned' status
- 🔄 [Integration] Filter by 'open' status
- 🔄 [Integration] Show all in 'All' filter
- 🔄 [Integration] Apply correct CSS classes by status
- 🔄 [Integration] Show appropriate action buttons by status

---

### AC5: All existing position creation flow continues to work

**Requirement**: Backward compatibility with existing 4-step position creation workflow

**Test Coverage** (10 tests for Slice 1):
- ✅ [Unit] Support existing Positions without trades field
- ✅ [Unit] Migrate legacy Positions to include empty trades array
- ✅ [Unit] Preserve all existing Position fields
- ✅ [Service] Load legacy Position and initialize empty array
- ✅ [Service] Save legacy Position with trades array added
- ✅ [Service] Handle mixed database with legacy/new positions
- ✅ [Integration] Create Position with empty trades via 4-step flow
- ✅ [Integration] Successfully open app with pre-existing positions
- ✅ [Integration] Preserve all legacy data during migration
- ✅ [Integration] Handle mixed database seamlessly

**Coverage Level**: Complete ✅ (10 tests ensure zero regression on existing functionality)

**Deferred to Slice 2** (2 tests requiring UI):
- 🔄 [Integration] Display legacy positions correctly in dashboard
- 🔄 [Integration] Allow executing trades on legacy positions

---

### AC6: Database schema maintains backward compatibility

**Requirement**: IndexedDB schema gracefully handles legacy data without migrations

**Test Coverage** (8 tests):
- ✅ [Service] Load legacy Position without trades field
- ✅ [Service] Save legacy Position with trades added
- ✅ [Service] Handle mixed database
- ✅ [Service] Recover from corrupted trades array
- ✅ [Integration] Open app with pre-existing positions
- ✅ [Integration] Display legacy positions correctly
- ✅ [Integration] Preserve legacy data during migration
- ✅ [Integration] Handle mixed database seamlessly

**Coverage Level**: Complete ✅ (8 tests validate migration-free schema evolution)

---

## Technical Requirements Coverage

### TypeScript Type Safety

**Requirement**: Strong typing for Trade and Position interfaces

**Test Coverage** (6 tests):
- ✅ [Unit] Trade interface structure validation
- ✅ [Unit] Enforce trade_type literal union 'buy' | 'sell'
- ✅ [Unit] Optional notes field
- ✅ [Unit] Type enforcement for quantity, price, timestamp
- ✅ [Unit] Position.trades array type safety
- ✅ [Unit] Array element type safety

**Coverage Level**: Complete ✅ (TypeScript compiler enforces, tests verify)

---

### Data Validation

**Requirement**: Comprehensive validation before persistence

**Test Coverage** (15 tests):
- ✅ [Unit] Reject negative quantity
- ✅ [Unit] Reject zero quantity
- ✅ [Unit] Reject negative price
- ✅ [Unit] Reject zero price
- ✅ [Unit] Reject future timestamps
- ✅ [Unit] Accept current timestamps
- ✅ [Unit] Enforce reasonable quantity limits
- ✅ [Unit] Enforce reasonable price limits
- ✅ [Unit] Allow fractional quantities
- ✅ [Unit] Enforce price precision (4 decimals)
- ✅ [Unit] Validate trade_type
- ✅ [Unit] Trim whitespace from notes
- ✅ [Unit] Handle empty notes
- ✅ [Service] Validate before persisting
- ✅ [Service] Provide detailed error messages

**Coverage Level**: Comprehensive ✅ (15 tests cover all validation scenarios)

---

### Phase 1A Constraints

**Requirement**: Enforce single trade per position limit

**Test Coverage** (4 tests for Slice 1):
- ✅ [Unit] Reject second trade with clear error message
- ✅ [Unit] Allow first trade on empty position
- ✅ [Service] Enforce limit at service layer before persistence
- ✅ [Integration] Prevent second trade across full stack

**Coverage Level**: Complete ✅ (4 tests enforce business rule at service layer)

**Deferred to Slice 2** (1 test requiring UI):
- 🔄 [Integration] Hide trade execution button for 'open' positions

---

### Performance Requirements

**Requirement**: Fast operations (<500ms for writes, <300ms for reads)

**Test Coverage** (2 tests for Slice 1):
- ✅ [Unit] Cost basis calculation <1ms
- ✅ [Unit] Status computation O(1) <0.1ms

**Coverage Level**: Baseline established ✅ (2 tests measure computational performance)

**Deferred to Slice 2** (2 tests requiring UI):
- 🔄 [Integration] Trade addition including persistence <500ms
- 🔄 [Integration] Position detail refresh with trades <300ms

---

### Error Handling & Recovery

**Requirement**: Graceful degradation and clear error messages

**Test Coverage** (10 tests for Slice 1):
- ✅ [Service] Handle IndexedDB transaction failure
- ✅ [Service] Rollback on invalid trade data
- ✅ [Service] Recover from corrupted trades array
- ✅ [Service] Rollback trade addition on failure
- ✅ [Service] Handle PositionService connection failure
- ✅ [Service] Handle transaction timeout
- ✅ [Service] Log errors for debugging
- ✅ [Service] Default to 'planned' if status corrupted
- ✅ [Integration] Show error if IndexedDB unavailable
- ✅ [Integration] Recover from corrupted position data

**Coverage Level**: Comprehensive ✅ (10 tests cover service-layer failure scenarios)

**Deferred to Slice 2** (2 tests requiring UI):
- 🔄 [Integration] Prevent trade addition if write fails
- 🔄 [Integration] Load dashboard with 100 positions <2s

---

## Test Priority Analysis (Slice 1 Scope)

### Critical Path Tests (High Priority) - 64 tests

**Must pass before merge:**
- Trade interface structure and validation (10 tests)
- Position.trades integration (6 tests)
- Backward compatibility (7 tests)
- TradeService CRUD operations (14 tests)
- Cost basis calculation (4 tests)
- Status computation logic (8 tests)
- End-to-end data flow (6 tests)
- Cross-service coordination (4 tests)
- Error handling (5 tests)

**Coverage**: All acceptance criteria and core service functionality ✅

---

### Important Tests (Medium Priority) - 28 tests

**Should pass for production readiness:**
- Edge case validation (8 tests)
- Trade data sanitization (4 tests)
- Cost basis edge cases (4 tests)
- Status edge cases (4 tests)
- Service error handling (3 tests)
- Performance (2 tests)
- Backward compatibility verification (3 tests)

**Coverage**: Edge cases, error scenarios, performance baselines ✅

---

### Nice-to-Have Tests (Low Priority) - 9 tests

**Can be added incrementally:**
- Performance optimization tests (3 tests)
- Advanced data validation (4 tests)
- Operation speed benchmarks (2 tests)

**Coverage**: Performance tuning, optimization ⚠️

---

## Test Execution Roadmap (Slice 1)

### Phase 1: Foundation Tests (Days 1-2)
**Focus**: Data models and basic service operations
- ✅ Trade interface validation (15 tests)
- ✅ Position.trades integration (10 tests)
- ✅ Backward compatibility (7 tests)
- **Expected**: 32 passing tests, solid foundation

---

### Phase 2: Service Layer Tests (Days 2-3)
**Focus**: TradeService implementation and coordination
- ✅ Trade operations (15 tests)
- ✅ Cost basis calculation (9 tests)
- ✅ TradeService CRUD (14 tests)
- **Expected**: 38 additional passing tests (70 total)

---

### Phase 3: Status Computation Tests (Days 3-4)
**Focus**: Status logic and service integration
- ✅ computePositionStatus() function (12 tests)
- ✅ Status computation in PositionService (9 tests)
- **Expected**: 21 additional passing tests (91 total)

---

### Phase 4: Cross-Cutting Tests (Day 4-5)
**Focus**: Performance, error recovery, edge cases
- ✅ Backward compatibility verification (3 tests)
- ✅ Performance testing (2 tests)
- ✅ Error recovery (5 tests)
- **Expected**: 10 additional passing tests (101 total) ✅

---

## Test Data Factories Required

### PositionTestFactory
```typescript
// Create test positions with various states
createPlannedPosition(): Position
createPositionWithTrade(): Position
createLegacyPosition(): Position // no trades field
createPositionWithMultipleTrades(): Position // future-proof
```

### TradeTestFactory
```typescript
// Create test trades with various attributes
createBuyTrade(overrides?: Partial<Trade>): Trade
createSellTrade(overrides?: Partial<Trade>): Trade
createInvalidTrade(): Trade // for error testing
```

### DatabaseTestHelpers
```typescript
// Setup and teardown for integration tests
seedDatabase(positions: Position[]): Promise<void>
clearDatabase(): Promise<void>
loadLegacyPosition(position: LegacyPosition): Promise<void>
```

---

## Success Metrics

### Coverage Goals
- ✅ Unit test coverage: 100% of business logic
- ✅ Service test coverage: 100% of TradeService methods
- ✅ Integration test coverage: All critical user workflows
- ✅ Backward compatibility: 100% of migration scenarios

### Quality Gates (Slice 1)
- ✅ All 64 high-priority tests must pass
- ✅ 95% of medium-priority tests should pass (27 of 28)
- ✅ Zero regressions on existing 153 tests
- ✅ Test suite execution time <20 seconds

### Deliverables (Slice 1)
- ✅ 101 comprehensive test cases for data foundation
- ✅ Test execution time under 20 seconds
- ✅ 100% backward compatibility verified
- ✅ Performance baselines established for computations
- ✅ Service-layer error scenarios covered
- 🔄 21 UI integration tests deferred to Slice 2

---

## Risk Mitigation

### Test Isolation Risks
**Mitigation**: Proper IndexedDB cleanup between tests using fake-indexeddb

### Performance Test Flakiness
**Mitigation**: Use percentile measurements, allow tolerance for CI environments

### Backward Compatibility Gaps
**Mitigation**: Test with actual legacy data snapshots from production-like scenarios

### Integration Test Complexity
**Mitigation**: Use test data factories and helper functions to reduce duplication

---

## Conclusion

This test plan provides **comprehensive coverage** for **Slice 1: Trade Data Foundation** with **101 test cases** organized into:
- **50 unit tests** (fast, isolated business logic)
- **37 service tests** (service layer integration)
- **14 integration tests** (data persistence and service coordination)

The tests map directly to **6 acceptance criteria** and cover:
- ✅ Trade data model integration
- ✅ TradeService implementation
- ✅ Position status computation
- ✅ Backward compatibility
- ✅ Performance requirements (computational)
- ✅ Error handling (service layer)

**All acceptance criteria have complete service-layer test coverage** ensuring solid foundation for Slice 2 UI implementation.

---

## Deferred Tests for Slice 2: Trade Execution Flow (21 tests)

The following tests require the trade execution UI flow and will be implemented in Slice 2:

### Status UI Integration (11 tests)
- 🔄 [Integration] Display 'planned' badge for no trades
- 🔄 [Integration] Display 'open' badge for positions with trades
- 🔄 [Integration] Update badge after trade execution
- 🔄 [Integration] Show correct status in detail header
- 🔄 [Integration] Show/hide trade execution button based on status
- 🔄 [Integration] Update status across all views
- 🔄 [Integration] Persist status across refresh
- 🔄 [Integration] Filter by 'planned' status
- 🔄 [Integration] Filter by 'open' status
- 🔄 [Integration] Show all in 'All' filter
- 🔄 [Integration] Apply correct CSS classes by status
- 🔄 [Integration] Show appropriate action buttons by status

### Trade Execution Integration (3 tests)
- 🔄 [Integration] Add trade and retrieve from database
- 🔄 [Integration] Calculate cost basis after addition
- 🔄 [Integration] Prevent second trade across full stack

### Backward Compatibility UI (2 tests)
- 🔄 [Integration] Display legacy positions correctly in dashboard
- 🔄 [Integration] Allow executing trades on legacy positions

### Phase 1A Constraints UI (1 test)
- 🔄 [Integration] Hide trade execution button for 'open' positions

### Performance End-to-End (2 tests)
- 🔄 [Integration] Trade addition including persistence <500ms
- 🔄 [Integration] Position detail refresh with trades <300ms

### Error Handling UI (2 tests)
- 🔄 [Integration] Prevent trade addition if write fails
- 🔄 [Integration] Load dashboard with 100 positions <2s

**These 21 tests will serve as acceptance criteria for Slice 2: Trade Execution Flow**, ensuring complete end-to-end functionality when the UI is implemented.