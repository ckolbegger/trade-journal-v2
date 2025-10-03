# Slice 2: Trade Execution Flow - Comprehensive Test Plan

**Scope**: Complete trade execution UI flow with mandatory journal entry and status transitions

**Test Count**: 45 total tests
- 21 deferred tests from Slice 1 (UI integration)
- 24 new tests for trade execution flow

---

## Test Execution Approach

**TDD Methodology**: Write failing tests FIRST, then implement functionality (RED-GREEN-REFACTOR)

**Test Organization**:
1. **Component Tests**: Individual UI components in isolation
2. **Service Tests**: TradeJournalTransaction service layer
3. **Integration Tests**: Complete user journeys end-to-end

---

## Part 1: Deferred Tests from Slice 1 (21 tests)

### 1.1 Status UI Integration (11 tests)

**Test File**: `src/components/__tests__/position-status-badges.test.tsx`

**Tests**:
1. ✅ Display 'planned' badge for positions without trades
2. ✅ Display 'open' badge for positions with trades
3. ✅ Update badge after trade execution (real-time)
4. ✅ Show correct status in position detail header
5. ✅ Show Execute Opening Trade button for 'planned' positions
6. ✅ Disable Execute Opening Trade button for 'open' positions
7. ✅ Update status across all views after trade execution
8. ✅ Persist status across page refresh
9. ✅ Filter by 'planned' status on dashboard
10. ✅ Filter by 'open' status on dashboard
11. ✅ Show all positions in 'All' filter

**Acceptance**: Status badges dynamically reflect position state throughout application

---

### 1.2 Trade Execution Integration (3 tests)

**Test File**: `src/integration/__tests__/trade-execution-integration.test.tsx`

**Tests**:
1. ✅ Add trade via UI and retrieve from IndexedDB
2. ✅ Calculate cost basis after trade addition
3. ✅ Prevent second trade across full stack (Phase 1A constraint)

**Acceptance**: Trade data flows correctly from UI through services to database

---

### 1.3 Backward Compatibility UI (2 tests)

**Test File**: `src/integration/__tests__/legacy-position-compatibility.test.tsx`

**Tests**:
1. ✅ Display legacy positions correctly in dashboard
2. ✅ Allow executing trades on legacy positions (auto-migration)

**Acceptance**: Legacy positions without trades field work seamlessly

---

### 1.4 Phase 1A Constraints UI (1 test)

**Test File**: `src/pages/__tests__/PositionDetail-trade-constraints.test.tsx`

**Tests**:
1. ✅ Disable Execute Opening Trade button for 'open' positions with tooltip

**Acceptance**: UI enforces single trade per position constraint

---

### 1.5 Performance End-to-End (2 tests)

**Test File**: `src/integration/__tests__/trade-execution-performance.test.tsx`

**Tests**:
1. ✅ Trade addition including persistence completes in <500ms
2. ✅ Position detail refresh with trades loads in <300ms

**Acceptance**: Trade execution meets performance requirements

---

### 1.6 Error Handling UI (2 tests)

**Test File**: `src/integration/__tests__/trade-execution-errors.test.tsx`

**Tests**:
1. ✅ Prevent trade addition if database write fails (show error message)
2. ✅ Load dashboard with 100 positions in <2s

**Acceptance**: Graceful error handling with user-friendly messages

---

## Part 2: New Trade Execution Flow Tests (24 tests)

### 2.1 TradeJournalTransaction Service (6 tests)

**Test File**: `src/services/__tests__/TradeJournalTransaction.test.ts`

**Tests**:
1. ✅ Create TradeJournalTransaction with PositionService dependency
2. ✅ executeTradeWithJournal() creates trade + journal entry atomically
3. ✅ Rollback trade if journal creation fails
4. ✅ Rollback journal if trade addition fails
5. ✅ Return updated position with trade and journal entry ID
6. ✅ Validate trade data before executing transaction

**Acceptance**: Atomic trade + journal transactions with rollback support

---

### 2.2 Trade Execution Form Component (8 tests)

**Test File**: `src/pages/__tests__/TradeExecution.test.tsx`

**Tests**:
1. ✅ Render trade execution form with all fields
2. ✅ Display position plan context (symbol, targets, thesis)
3. ✅ Validate quantity input (positive numbers only)
4. ✅ Validate price input (positive numbers, 4 decimal precision)
5. ✅ Validate execution date (not future-dated)
6. ✅ Show plan vs actual comparison
7. ✅ Calculate trade total (quantity × price)
8. ✅ Show validation errors inline

**Acceptance**: Trade form validates input and shows plan context

---

### 2.3 Trade Execution Navigation (4 tests)

**Test File**: `src/pages/__tests__/TradeExecution-navigation.test.tsx`

**Tests**:
1. ✅ Navigate to trade execution from PositionDetail button
2. ✅ Pass position ID via route params
3. ✅ Redirect to journal entry page after successful trade submission
4. ✅ Return to position detail after journal entry completion

**Acceptance**: Complete navigation flow: PositionDetail → TradeExecution → JournalEntry → PositionDetail

---

### 2.4 Mandatory Journal Entry Flow (3 tests)

**Test File**: `src/integration/__tests__/trade-journal-flow.test.tsx`

**Tests**:
1. ✅ Redirect to journal entry page after trade submission
2. ✅ Pre-populate journal entry with trade_execution type
3. ✅ Complete atomic transaction: trade + journal → update position

**Acceptance**: Mandatory journal entry enforced in trade execution flow

---

### 2.5 Position Detail Updates (3 tests)

**Test File**: `src/pages/__tests__/PositionDetail-trade-integration.test.tsx`

**Tests**:
1. ✅ Show Execute Opening Trade button for 'planned' positions
2. ✅ Disable Execute Opening Trade button for 'open' positions
3. ✅ Display trade history in accordion after trade execution

**Acceptance**: PositionDetail UI reflects position status and trade data

---

## Test Execution Roadmap

### Phase 1: Service Layer (Days 1-2)
**Focus**: TradeJournalTransaction service with atomic operations
- Write 6 failing tests for TradeJournalTransaction
- Create stub implementation
- Implement atomic trade + journal creation
- Verify all 6 tests pass

**Expected Outcome**: Solid service foundation for trade execution

---

### Phase 2: Trade Execution UI (Days 2-4)
**Focus**: TradeExecution page component with form validation
- Write 8 failing tests for TradeExecution form
- Create component with form fields
- Implement validation and plan context display
- Verify all 8 tests pass

**Expected Outcome**: Working trade execution form

---

### Phase 3: Navigation & Flow (Days 4-5)
**Focus**: Complete user journey from PositionDetail to Journal Entry
- Write 7 failing tests for navigation and journal flow
- Implement routing and navigation
- Connect TradeExecution → JournalEntry flow
- Verify all 7 tests pass

**Expected Outcome**: Complete trade execution journey

---

### Phase 4: Status Integration (Days 5-6)
**Focus**: Status badge updates and real-time UI refresh
- Write 11 failing tests for status UI integration
- Update PositionDetail with Execute Opening Trade button
- Implement status badge real-time updates
- Verify all 11 tests pass

**Expected Outcome**: Dynamic status updates across application

---

### Phase 5: Trade History Display (Days 6-7)
**Focus**: Trade history in PositionDetail accordion
- Write 3 failing tests for trade history display
- Implement trade history UI in accordion
- Show plan vs actual comparison
- Verify all 3 tests pass

**Expected Outcome**: Visible trade history in position detail

---

### Phase 6: Error Handling & Performance (Day 7)
**Focus**: Edge cases, error states, performance validation
- Write 4 failing tests for errors and performance
- Implement error handling and loading states
- Optimize performance for trade operations
- Verify all 4 tests pass

**Expected Outcome**: Robust error handling and performance targets met

---

### Phase 7: Integration Testing (Day 8)
**Focus**: End-to-end user journeys with all 45 tests
- Run complete test suite (270 + 45 = 315 tests)
- Fix any integration issues
- Verify backward compatibility
- Confirm performance benchmarks

**Expected Outcome**: All 315 tests passing, Slice 2 complete

---

## Success Metrics

### Coverage Goals
- ✅ 100% of deferred Slice 1 UI tests implemented
- ✅ 100% of trade execution flow tested
- ✅ 100% of navigation paths covered
- ✅ Atomic transactions verified with rollback tests

### Quality Gates
- ✅ All 45 new/deferred tests must pass
- ✅ Zero regressions on existing 270 tests
- ✅ Performance targets met (<500ms trade, <300ms load)
- ✅ Test suite execution time <30 seconds

### Deliverables
- ✅ TradeJournalTransaction service with atomic operations
- ✅ TradeExecution page component with validation
- ✅ Mandatory journal entry flow
- ✅ Status badge real-time updates
- ✅ Trade history display in accordion
- ✅ Complete end-to-end trade execution journey
- ✅ 315 total tests passing (270 existing + 45 new)

---

## Risk Mitigation

### Atomic Transaction Complexity
**Risk**: Trade + journal transaction may fail partially
**Mitigation**: Comprehensive rollback tests, transaction isolation

### Navigation State Management
**Risk**: State loss during multi-page flow
**Mitigation**: URL params for position ID, session storage for form state

### Real-time Status Updates
**Risk**: Status badge not updating immediately after trade
**Mitigation**: Force re-render after navigation, React state management

### Performance Degradation
**Risk**: Trade execution may be slow with journal entry
**Mitigation**: Performance tests with timeout enforcement

---

## Test Data Requirements

### Position Test Fixtures
```typescript
// Planned position (no trades)
const plannedPosition: Position = {
  id: 'pos-1',
  symbol: 'AAPL',
  status: 'planned',
  trades: [],
  // ... other fields
}

// Open position (has trade)
const openPosition: Position = {
  id: 'pos-2',
  symbol: 'MSFT',
  status: 'open',
  trades: [{
    id: 'trade-1',
    trade_type: 'buy',
    quantity: 100,
    price: 150.00,
    timestamp: new Date()
  }],
  // ... other fields
}
```

### Trade Test Data
```typescript
const validTradeData = {
  trade_type: 'buy',
  quantity: 100,
  price: 150.00,
  timestamp: new Date(),
  notes: 'Opening trade'
}

const invalidTradeData = {
  trade_type: 'buy',
  quantity: -10, // Invalid
  price: 0, // Invalid
  timestamp: new Date('2026-01-01'), // Future date
}
```

### Journal Entry Test Data
```typescript
const tradeExecutionJournal = {
  entry_type: 'trade_execution',
  fields: [
    { name: 'execution_notes', prompt: 'How did the execution go?', value: 'Filled at target price' }
  ]
}
```

---

## Conclusion

This comprehensive test plan provides **45 tests** organized into:
- **21 deferred UI tests** from Slice 1 (completing data foundation UI integration)
- **24 new tests** for trade execution flow (complete user journey)

The tests cover:
- ✅ TradeJournalTransaction atomic service
- ✅ TradeExecution page component
- ✅ Mandatory journal entry flow
- ✅ Status badge real-time updates
- ✅ Trade history display
- ✅ Navigation and error handling
- ✅ Performance and backward compatibility

**Timeline**: 7-8 days for full implementation
**Expected Outcome**: Complete trade execution flow ready for production
