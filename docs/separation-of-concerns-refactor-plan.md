# Comprehensive Refactoring Plan: Separation of Concerns
## Conservative TDD Approach with Continuous Verification

## Core Principle: RED → GREEN → VERIFY → CLEAN → COMMIT

**Every single step follows this cycle:**

1. **RED**: Write failing test → `npm test [test-file]` → ❌ MUST FAIL
2. **GREEN**: Implement feature → `npm test [test-file]` → ✅ MUST PASS
3. **VERIFY**: Run full suite → `npm test -- --run` → ✅ ALL MUST PASS
4. **CLEAN**: Remove duplicate tests → `npm test -- --run` → ✅ ALL MUST PASS
5. **COMMIT**: `git add` + `git commit` → Safe checkpoint

**If any step fails: STOP, fix, repeat from that step. Never proceed with failures.**

---

# PHASE 1: FOUNDATION LAYER

## Step 1.1: Create DatabaseConnection Service

### 1.1.1: Write SchemaManager Tests & Implementation

**RED - Write Test**:
- Create `src/services/__tests__/SchemaManager.test.ts`:
  ```typescript
  describe('SchemaManager', () => {
    it('should create positions store with correct indexes')
    it('should create journal_entries store with correct indexes')
    it('should create price_history store with correct indexes')
    it('should not recreate existing stores')
    it('should handle version upgrades correctly')
  })
  ```
- Run: `npm test SchemaManager.test.ts`
- **Expected**: ❌ FAIL (SchemaManager doesn't exist)

**GREEN - Implement**:
- Create `src/services/SchemaManager.ts`
- Run: `npm test SchemaManager.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS (SchemaManager doesn't break anything)

**CLEAN**:
- No duplicates to remove yet

**COMMIT**:
```bash
git add src/services/SchemaManager.ts src/services/__tests__/SchemaManager.test.ts
git commit -m "Add SchemaManager for centralized database schema"
```

---

### 1.1.2: Write DatabaseConnection Tests & Implementation

**RED - Write Test**:
- Create `src/services/__tests__/DatabaseConnection.test.ts`:
  ```typescript
  describe('DatabaseConnection', () => {
    it('should return singleton instance')
    it('should initialize database only once')
    it('should use SchemaManager for schema initialization')
    it('should handle concurrent initialization requests')
    it('should close connection properly')
    it('should handle connection errors')
  })
  ```
- Run: `npm test DatabaseConnection.test.ts`
- **Expected**: ❌ FAIL (DatabaseConnection doesn't exist)

**GREEN - Implement**:
- Create `src/services/DatabaseConnection.ts`
- Run: `npm test DatabaseConnection.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**CLEAN**:
- No duplicates yet

**COMMIT**:
```bash
git add src/services/DatabaseConnection.ts src/services/__tests__/DatabaseConnection.test.ts
git commit -m "Add DatabaseConnection singleton service"
```

---

### 1.1.3: Create Integration Test for DatabaseConnection

**RED - Write Test**:
- Create `src/integration/__tests__/database-connection.test.ts`:
  ```typescript
  describe('DatabaseConnection Integration', () => {
    it('should share same connection across multiple services')
    it('should handle concurrent service initialization')
    it('should persist data across connection reuse')
  })
  ```
- Run: `npm test database-connection.test.ts`
- **Expected**: ❌ FAIL (services don't use DatabaseConnection yet)

**GREEN - Implement**:
- This test will pass after Step 1.3 (services refactored)
- For now, mark as `it.skip` or `it.todo`

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS (skipped test doesn't fail)

**COMMIT**:
```bash
git add src/integration/__tests__/database-connection.test.ts
git commit -m "Add integration test for DatabaseConnection (TODO)"
```

---

## Step 1.2: Create ServiceContainer (Dependency Injection)

### 1.2.1: Write ServiceContainer Tests & Implementation

**RED - Write Test**:
- Create `src/services/__tests__/ServiceContainer.test.ts`:
  ```typescript
  describe('ServiceContainer', () => {
    it('should return singleton instance')
    it('should create PositionService lazily')
    it('should create TradeService lazily')
    it('should create JournalService lazily')
    it('should create PriceService lazily')
    it('should return same service instance on multiple calls')
    it('should inject dependencies correctly (TradeService gets PositionService)')
    it('should cleanup all services')
    it('should allow custom service injection for testing')
  })
  ```
- Run: `npm test ServiceContainer.test.ts`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Create `src/services/ServiceContainer.ts`
- Run: `npm test ServiceContainer.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**CLEAN**:
- No duplicates

**COMMIT**:
```bash
git add src/services/ServiceContainer.ts src/services/__tests__/ServiceContainer.test.ts
git commit -m "Add ServiceContainer for dependency injection"
```

---

### 1.2.2: Create ServiceContext for React

**RED - Write Test**:
- Create `src/contexts/__tests__/ServiceContext.test.tsx`:
  ```typescript
  describe('ServiceContext', () => {
    it('should provide ServiceContainer to children')
    it('should throw error when used outside provider')
    it('should return same container instance across renders')
  })
  ```
- Run: `npm test ServiceContext.test.tsx`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Create `src/contexts/ServiceContext.tsx`
- Run: `npm test ServiceContext.test.tsx`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**CLEAN**:
- No duplicates

**COMMIT**:
```bash
git add src/contexts/ServiceContext.tsx src/contexts/__tests__/ServiceContext.test.tsx
git commit -m "Add ServiceContext for React dependency injection"
```

---

## Step 1.3: Refactor Services to Use DatabaseConnection

### 1.3.1: Refactor PositionService

**RED - Write Test**:
- Create `src/services/__tests__/PositionService-with-connection.test.ts`:
  ```typescript
  describe('PositionService with DatabaseConnection', () => {
    it('should use injected DatabaseConnection')
    it('should not manage schema initialization')
    it('should propagate database errors')
    it('should share connection with other services')
  })
  ```
- Run: `npm test PositionService-with-connection.test.ts`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Update `src/lib/position.ts`:
  - Add `DatabaseConnection` to constructor
  - Remove `getDB()` method (lines 120-163)
  - Remove schema initialization
  - Use `this.dbConnection.getConnection()`
- Run: `npm test PositionService-with-connection.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS (critical checkpoint)

**CLEAN**:
- Remove schema initialization tests from `src/lib/position.test.ts` if they exist
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/lib/position.ts src/services/__tests__/PositionService-with-connection.test.ts
git commit -m "Refactor PositionService to use DatabaseConnection"
```

---

### 1.3.2: Refactor PriceService

**RED - Write Test**:
- Create `src/services/__tests__/PriceService-with-connection.test.ts`:
  ```typescript
  describe('PriceService with DatabaseConnection', () => {
    it('should use injected DatabaseConnection')
    it('should not manage schema initialization')
    it('should share connection with PositionService')
  })
  ```
- Run: `npm test PriceService-with-connection.test.ts`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Update `src/services/PriceService.ts`:
  - Add `DatabaseConnection` to constructor
  - Remove `getDB()` method (lines 32-67)
  - Remove schema initialization
- Run: `npm test PriceService-with-connection.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**CLEAN**:
- Remove schema tests from `src/services/__tests__/PriceService.test.ts`
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/services/PriceService.ts src/services/__tests__/PriceService-with-connection.test.ts
git commit -m "Refactor PriceService to use DatabaseConnection"
```

---

### 1.3.3: Refactor JournalService

**RED - Write Test**:
- Create `src/services/__tests__/JournalService-with-connection.test.ts`
- Run: `npm test JournalService-with-connection.test.ts`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Update `src/services/JournalService.ts` to use DatabaseConnection
- Run: `npm test JournalService-with-connection.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/services/JournalService.ts src/services/__tests__/JournalService-with-connection.test.ts
git commit -m "Refactor JournalService to use DatabaseConnection"
```

---

### 1.3.4: Refactor PositionJournalTransaction

**RED - Write Test**:
- Create `src/services/__tests__/PositionJournalTransaction-with-connection.test.ts`
- Run: `npm test PositionJournalTransaction-with-connection.test.ts`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Update `src/services/PositionJournalTransaction.ts`:
  - Remove duplicate `getDB()` method (lines 112-119)
  - Use injected DatabaseConnection
- Run: `npm test PositionJournalTransaction-with-connection.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**CLEAN**:
- Remove duplicate DB tests
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/services/PositionJournalTransaction.ts src/services/__tests__/PositionJournalTransaction-with-connection.test.ts
git commit -m "Refactor PositionJournalTransaction to use DatabaseConnection"
```

---

### 1.3.5: Enable DatabaseConnection Integration Test

**RED - Update Test**:
- Update `src/integration/__tests__/database-connection.test.ts`:
  - Remove `.skip` or `.todo`
  - Enable all tests
- Run: `npm test database-connection.test.ts`
- **Expected**: ✅ PASS (now that services use DatabaseConnection)

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/integration/__tests__/database-connection.test.ts
git commit -m "Enable DatabaseConnection integration tests"
```

---

## PHASE 1 CHECKPOINT

**Manual Verification**:
- [ ] Run: `npm test -- --run` → ✅ ALL PASS
- [ ] Run: `npm run build` → ✅ SUCCESS
- [ ] Run: `npm run dev` → Start app
- [ ] Manual test: Create a position → ✅ SUCCESS
- [ ] Manual test: Add a trade → ✅ SUCCESS
- [ ] Manual test: View position detail → ✅ SUCCESS

**If all pass**: Proceed to Phase 2
**If any fail**: STOP, fix, repeat checkpoint

---

# PHASE 2: DOMAIN LAYER (VALIDATORS & CALCULATORS)

## Step 2.1: Create TradeValidator

### 2.1.1: Write TradeValidator Tests

**RED - Write Test**:
- Create `src/domain/__tests__/TradeValidator.test.ts`:
  ```typescript
  describe('TradeValidator', () => {
    describe('validateTrade', () => {
      it('should pass for valid trade')
      it('should reject missing position_id')
      it('should reject missing trade_type')
      it('should reject invalid trade_type')
      it('should reject zero quantity')
      it('should reject negative quantity')
      it('should reject negative price')
      it('should allow zero price for worthless exits')
      it('should reject invalid timestamp')
      it('should reject empty underlying')
    })

    describe('validateExitTrade', () => {
      it('should reject exit from planned position')
      it('should reject exit from closed position')
      it('should reject overselling')
      it('should allow valid exit')
    })
  })
  ```
- Run: `npm test TradeValidator.test.ts`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Create `src/domain/validators/TradeValidator.ts`:
  - Move logic from `TradeService.validateTrade()` (lines 19-51)
  - Move logic from `validateExitTrade()` function
- Run: `npm test TradeValidator.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**CLEAN**:
- No duplicates yet (TradeService still has validation)

**COMMIT**:
```bash
git add src/domain/validators/TradeValidator.ts src/domain/__tests__/TradeValidator.test.ts
git commit -m "Add TradeValidator for domain validation"
```

---

## Step 2.2: Create PriceValidator

**RED - Write Test**:
- Create `src/domain/__tests__/PriceValidator.test.ts`:
  ```typescript
  describe('PriceValidator', () => {
    describe('validatePrice', () => {
      it('should pass for valid positive price')
      it('should reject negative price')
      it('should reject zero price')
      it('should use custom field name in error message')
    })

    describe('validatePriceRecord', () => {
      it('should pass for valid OHLC record')
      it('should reject if high < low')
      it('should reject if open outside high/low range')
      it('should reject if close outside high/low range')
      it('should reject empty underlying')
      it('should reject invalid date format')
    })

    describe('validatePriceChange', () => {
      it('should not require confirmation for <20% change')
      it('should require confirmation for >20% increase')
      it('should require confirmation for >20% decrease')
      it('should handle first price (no previous)')
    })
  })
  ```
- Run: `npm test PriceValidator.test.ts`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Create `src/domain/validators/PriceValidator.ts`:
  - Move validation from PriceService (lines 72-114)
  - Move price change validation logic
- Run: `npm test PriceValidator.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/domain/validators/PriceValidator.ts src/domain/__tests__/PriceValidator.test.ts
git commit -m "Add PriceValidator for price validation"
```

---

## Step 2.3: Create PositionValidator

**RED - Write Test**:
- Create `src/domain/__tests__/PositionValidator.test.ts`:
  ```typescript
  describe('PositionValidator', () => {
    it('should pass for valid position')
    it('should reject zero or negative target_entry_price')
    it('should reject zero or negative target_quantity')
    it('should reject empty position_thesis')
    it('should reject missing required fields')
    it('should reject invalid journal_entry_ids type')
    it('should reject invalid trades type')
  })
  ```
- Run: `npm test PositionValidator.test.ts`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Create `src/domain/validators/PositionValidator.ts`:
  - Move validation from PositionService (lines 165-196)
- Run: `npm test PositionValidator.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/domain/validators/PositionValidator.ts src/domain/__tests__/PositionValidator.test.ts
git commit -m "Add PositionValidator for position validation"
```

---

## Step 2.4: Create JournalValidator

**RED - Write Test**:
- Create `src/domain/__tests__/JournalValidator.test.ts`:
  ```typescript
  describe('JournalValidator', () => {
    it('should validate journal entry creation request')
    it('should reject missing required fields')
    it('should validate entry_type values')
    it('should validate content length')
  })
  ```
- Run: `npm test JournalValidator.test.ts`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Create `src/domain/validators/JournalValidator.ts`
  - Extract validation from JournalService
- Run: `npm test JournalValidator.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/domain/validators/JournalValidator.ts src/domain/__tests__/JournalValidator.test.ts
git commit -m "Add JournalValidator for journal validation"
```

---

## Step 2.5: Create CostBasisCalculator

**RED - Write Test**:
- Create `src/domain/__tests__/CostBasisCalculator.test.ts`:
  ```typescript
  describe('CostBasisCalculator', () => {
    describe('calculateAverageCost', () => {
      it('should calculate average from multiple trades')
      it('should return target price if no trades')
      it('should handle single trade')
      it('should include both buy and sell trades in average')
    })

    describe('calculateCostBasis', () => {
      it('should sum buy trades only')
      it('should ignore sell trades')
      it('should return 0 for no buys')
      it('should handle mixed buy/sell trades')
    })

    describe('calculateOpenQuantity', () => {
      it('should calculate net quantity (buys - sells)')
      it('should return 0 for equal buys and sells')
      it('should handle only buys')
      it('should handle partial exits')
    })
  })
  ```
- Run: `npm test CostBasisCalculator.test.ts`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Create `src/domain/calculators/CostBasisCalculator.ts`:
  - Extract logic from PositionCard.tsx (lines 19-21, 28-33)
  - Extract logic from PositionDetail.tsx (similar lines)
  - Extract logic from existing utils/costBasis.ts
- Run: `npm test CostBasisCalculator.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/domain/calculators/CostBasisCalculator.ts src/domain/__tests__/CostBasisCalculator.test.ts
git commit -m "Add CostBasisCalculator for cost calculations"
```

---

## Step 2.6: Create PnLCalculator

**RED - Write Test**:
- Create `src/domain/__tests__/PnLCalculator.test.ts`:
  ```typescript
  describe('PnLCalculator', () => {
    describe('calculatePositionPnL', () => {
      it('should calculate P&L with current price')
      it('should return null if no price data')
      it('should return null if no trades')
      it('should handle closed positions')
    })

    describe('calculatePnLPercentage', () => {
      it('should calculate percentage gain')
      it('should calculate percentage loss')
      it('should handle zero cost basis')
    })

    describe('calculateFIFO', () => {
      it('should match buys with sells using FIFO')
      it('should calculate realized P&L')
      it('should calculate unrealized P&L')
      it('should handle partial fills')
      it('should handle multiple exit trades')
    })

    describe('calculatePlanVsExecution', () => {
      it('should compare planned vs actual entry price')
      it('should compare planned vs actual exit price')
      it('should calculate slippage')
      it('should throw error for non-closed positions')
    })
  })
  ```
- Run: `npm test PnLCalculator.test.ts`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Create `src/domain/calculators/PnLCalculator.ts`:
  - Consolidate logic from `src/utils/pnl.ts`
  - Consolidate FIFO from `src/lib/utils/fifo.ts`
  - Consolidate plan vs execution from `src/lib/utils/planVsExecution.ts`
- Run: `npm test PnLCalculator.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/domain/calculators/PnLCalculator.ts src/domain/__tests__/PnLCalculator.test.ts
git commit -m "Add PnLCalculator for P&L calculations"
```

---

## Step 2.7: Create PositionStatusComputer

**RED - Write Test**:
- Create `src/domain/__tests__/PositionStatusComputer.test.ts`:
  ```typescript
  describe('PositionStatusComputer', () => {
    it('should return "planned" for no trades')
    it('should return "open" for net positive quantity')
    it('should return "closed" for net zero quantity')
    it('should handle multiple buys')
    it('should handle multiple sells')
    it('should handle mixed buy/sell trades')
  })
  ```
- Run: `npm test PositionStatusComputer.test.ts`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Create `src/domain/calculators/PositionStatusComputer.ts`:
  - Extract from `src/utils/statusComputation.ts`
- Run: `npm test PositionStatusComputer.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/domain/calculators/PositionStatusComputer.ts src/domain/__tests__/PositionStatusComputer.test.ts
git commit -m "Add PositionStatusComputer for status calculation"
```

---

## PHASE 2 CHECKPOINT

**Tests**:
- Run: `npm test -- --run` → ✅ ALL PASS

**Manual**:
- [ ] Create position → ✅
- [ ] Add trade → ✅
- [ ] View P&L → ✅
- [ ] Check calculations match previous behavior → ✅

---

# PHASE 3: SERVICE LAYER REFACTORING

## Step 3.1: Refactor TradeService to Use TradeValidator [COMPLETED]

**RED - Write Test**:
- Update `src/services/__tests__/TradeService.test.ts`:
  - Add test: `should delegate validation to TradeValidator`
  - Add test: `should delegate exit validation to TradeValidator`
- Run: `npm test TradeService.test.ts`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Update `src/services/TradeService.ts`:
  - Replace `validateTrade()` with `TradeValidator.validateTrade()`
  - Replace exit validation with `TradeValidator.validateExitTrade()`
- Run: `npm test TradeService.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**CLEAN**:
- Remove `validateTrade()` method from TradeService
- Remove validation tests from TradeService tests (now in TradeValidator)
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/services/TradeService.ts src/services/__tests__/TradeService.test.ts
git commit -m "Refactor TradeService to use TradeValidator"
```

---

## Step 3.2: Refactor TradeService to Use PositionStatusComputer [COMPLETED]

**RED - Write Test**:
- Update `src/services/__tests__/TradeService.test.ts`:
  - Test delegates to PositionStatusComputer
- Run: `npm test TradeService.test.ts`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Update `src/services/TradeService.ts`:
  - Replace `computePositionStatus()` with `PositionStatusComputer.computeStatus()`
- Run: `npm test TradeService.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**CLEAN**:
- Remove `computePositionStatus()` method
- Remove status computation tests
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/services/TradeService.ts src/services/__tests__/TradeService.test.ts
git commit -m "Refactor TradeService to use PositionStatusComputer"
```

---

## Step 3.3: Refactor TradeService to Use CostBasisCalculator [COMPLETED]

**RED - Write Test**:
- Update `src/services/__tests__/TradeService.test.ts`:
  - Test delegates to CostBasisCalculator
- Run: `npm test TradeService.test.ts`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Update `src/services/TradeService.ts`:
  - Replace `calculateCostBasis()` with `CostBasisCalculator.calculateCostBasis()`
- Run: `npm test TradeService.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**CLEAN**:
- Remove `calculateCostBasis()` method
- Remove cost basis tests from TradeService (moved to CostBasisCalculator)
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/services/TradeService.ts src/services/__tests__/TradeService.test.ts
git commit -m "Refactor TradeService to use CostBasisCalculator"
```

---

## Step 3.4: Refactor TradeService to Use PnLCalculator [N/A - No P&L methods in TradeService]

**RED - Write Test**:
- Update `src/services/__tests__/TradeService.test.ts`:
  - Test delegates FIFO to PnLCalculator
  - Test delegates plan vs execution to PnLCalculator
- Run: `npm test TradeService.test.ts`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Update `src/services/TradeService.ts`:
  - Replace `calculateFIFOPnL()` with `PnLCalculator.calculateFIFO()`
  - Replace `calculatePlanVsExecution()` with `PnLCalculator.calculatePlanVsExecution()`
- Run: `npm test TradeService.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**CLEAN**:
- Remove calculation methods from TradeService
- Remove duplicate tests
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/services/TradeService.ts src/services/__tests__/TradeService.test.ts
git commit -m "Refactor TradeService to use PnLCalculator"
```

---

## Step 3.5: Refactor PositionService to Use PositionValidator [COMPLETED]

**RED - Write Test**:
- Update `src/services/__tests__/PositionService.test.ts`:
  - Test delegates validation to PositionValidator
- Run: `npm test PositionService.test.ts`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Update `src/lib/position.ts`:
  - Replace `validatePosition()` with `PositionValidator.validate()`
- Run: `npm test PositionService.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**CLEAN**:
- Remove `validatePosition()` method
- Remove validation tests
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/lib/position.ts src/services/__tests__/PositionService.test.ts
git commit -m "Refactor PositionService to use PositionValidator"
```

---

## Step 3.6: Refactor PositionService to Use PositionStatusComputer [COMPLETED]

**RED - Write Test**:
- Update `src/services/__tests__/PositionService.test.ts`:
  - Test delegates status computation to PositionStatusComputer
- Run: `npm test PositionService.test.ts`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Update `src/lib/position.ts`:
  - Replace all `computePositionStatus()` calls with `PositionStatusComputer.computeStatus()`
- Run: `npm test PositionService.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**CLEAN**:
- No methods to remove (was using utility function)
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/lib/position.ts src/services/__tests__/PositionService.test.ts
git commit -m "Refactor PositionService to use PositionStatusComputer"
```

---

## Step 3.7: Add Position Metrics Calculation to PositionService [COMPLETED]

**Purpose:** Create service layer orchestration methods that delegate to domain calculators, providing a clean API for UI components.

**RED - Write Test**:
- Create/Update `src/services/__tests__/PositionService.test.ts`:
  ```typescript
  describe('calculatePositionMetrics', () => {
    it('should delegate to CostBasisCalculator for cost metrics')
    it('should delegate to PnLCalculator for P&L metrics')
    it('should return complete metrics object')
    it('should handle positions with no trades')
    it('should handle positions with no price data')
    it('should calculate correct pnlPercentage')
  })
  ```
- Run: `npm test PositionService.test.ts`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Update `src/lib/position.ts` (PositionService class):
  ```typescript
  import { CostBasisCalculator } from '@/domain/calculators/CostBasisCalculator'
  import { PnLCalculator } from '@/domain/calculators/PnLCalculator'
  import type { PriceHistory } from '@/types/priceHistory'

  // Add interface for metrics return type
  export interface PositionMetrics {
    avgCost: number
    costBasis: number
    openQuantity: number
    pnl: number | null
    pnlPercentage: number | undefined
  }

  // Add to PositionService class:
  calculatePositionMetrics(
    position: Position,
    priceMap: Map<string, PriceHistory>
  ): PositionMetrics {
    // Delegate to domain calculators
    const avgCost = CostBasisCalculator.calculateAverageCost(
      position.trades,
      position.target_entry_price
    )
    const costBasis = CostBasisCalculator.calculateTotalCostBasis(position.trades)
    const openQuantity = CostBasisCalculator.calculateOpenQuantity(position.trades)
    const pnl = PnLCalculator.calculatePositionPnL(position, priceMap)
    const pnlPercentage = pnl !== null && costBasis > 0
      ? PnLCalculator.calculatePnLPercentage(pnl, costBasis)
      : undefined

    return { avgCost, costBasis, openQuantity, pnl, pnlPercentage }
  }
  ```
- Run: `npm test PositionService.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/lib/position.ts src/services/__tests__/PositionService.test.ts
git commit -m "Add position metrics calculation to PositionService"
```

**Notes:**
- This creates proper service layer orchestration
- UI components will use this method instead of importing utils directly
- Maintains separation: Domain (calculators) ← Service (orchestration) ← UI (presentation)

---

## Step 3.8: Refactor PriceService to Use PriceValidator [COMPLETED]

**RED - Write Test**:
- Update `src/services/__tests__/PriceService.test.ts`:
  - Test delegates all validation to PriceValidator
- Run: `npm test PriceService.test.ts`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Update `src/services/PriceService.ts`:
  - Replace `validatePrice()` with `PriceValidator.validatePrice()`
  - Replace `validatePriceRecord()` with `PriceValidator.validatePriceRecord()`
  - Replace `validatePriceChange()` with `PriceValidator.validatePriceChange()`
- Run: `npm test PriceService.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**CLEAN**:
- Remove validation methods
- Remove validation tests (now in PriceValidator)
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/services/PriceService.ts src/services/__tests__/PriceService.test.ts
git commit -m "Refactor PriceService to use PriceValidator"
```

---

## Step 3.9: Create PriceUpdateOrchestrator [SKIPPED - N/A]

**Reason:** PriceService already provides proper orchestration:
- `validatePriceChange()` checks confirmation requirement
- `createOrUpdate()` validates via PriceValidator and persists
- No additional orchestration layer needed

**Original plan (not implemented):**

**RED - Write Test**:
- Create `src/services/__tests__/PriceUpdateOrchestrator.test.ts`:
  ```typescript
  describe('PriceUpdateOrchestrator', () => {
    it('should validate price before update')
    it('should check if confirmation required')
    it('should update price when confirmed')
    it('should handle validation errors')
    it('should handle update errors')
    it('should use PriceValidator for validation')
    it('should use PriceService for persistence')
  })
  ```
- Run: `npm test PriceUpdateOrchestrator.test.ts`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Create `src/services/orchestrators/PriceUpdateOrchestrator.ts`:
  - Extract workflow logic from PriceUpdateCard component
  - Coordinate PriceValidator and PriceService
- Run: `npm test PriceUpdateOrchestrator.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/services/orchestrators/PriceUpdateOrchestrator.ts src/services/__tests__/PriceUpdateOrchestrator.test.ts
git commit -m "Add PriceUpdateOrchestrator for price update workflow"
```

---

## Step 3.10: Create Price Update Integration Test [SKIPPED - N/A]

**Reason:** Depends on Step 3.9 orchestrator which was not needed.
Price update workflow is already properly tested via PriceService tests.

**Original plan (not implemented):**

**RED - Write Test**:
- Create `src/integration/__tests__/price-update-workflow.test.ts`:
  ```typescript
  describe('Price Update Workflow Integration', () => {
    it('should complete price update without confirmation')
    it('should require confirmation for >20% change')
    it('should handle user confirmation acceptance')
    it('should handle user confirmation rejection')
  })
  ```
- Run: `npm test price-update-workflow.test.ts`
- **Expected**: ❌ FAIL (UI not updated yet)

**GREEN - Implement**:
- Mark test as `it.skip` for now (will pass after Step 4.3)

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/integration/__tests__/price-update-workflow.test.ts
git commit -m "Add price update workflow integration test (TODO)"
```

---

## PHASE 3 CHECKPOINT

**Tests**:
- Run: `npm test -- --run` → ✅ ALL PASS

**Manual**:
- [ ] Create position → ✅
- [ ] Add trade → ✅
- [ ] Update price → ✅
- [ ] View P&L → ✅
- [ ] Close position → ✅

---

# PHASE 4: UI LAYER CLEANUP

## Step 4.1: Remove Calculations from PositionCard

**RED - Write Test**:
- Update `src/components/__tests__/PositionCard.test.tsx`:
  - Test component receives avgCost, costBasis as props
  - Test component displays received values
  - Test no calculation logic in component
- Run: `npm test PositionCard.test.tsx`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Update `src/components/PositionCard.tsx`:
  - Remove lines 18-37 (avgCost, costBasis, pnl calculations)
  - Add to props: `avgCost: number, costBasis: number, pnl: number | null, pnlPercentage: number | undefined`
  - Component becomes pure presentation
- Update parent components to calculate and pass values
- Run: `npm test PositionCard.test.tsx`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**CLEAN**:
- Remove calculation tests from PositionCard tests
- Keep display/rendering tests
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/components/PositionCard.tsx src/components/__tests__/PositionCard.test.tsx
git commit -m "Remove business logic from PositionCard component"
```

---

## Step 4.2: Remove Calculations from PositionDetail

**RED - Write Test**:
- Update `src/pages/__tests__/PositionDetail.test.tsx`:
  - Test page uses CostBasisCalculator
  - Test page uses PnLCalculator
  - Test no inline calculation logic
- Run: `npm test PositionDetail.test.tsx`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Update `src/pages/PositionDetail.tsx`:
  - Remove duplicate avgCost calculation
  - Remove duplicate costBasis calculation
  - Use `CostBasisCalculator.calculateAverageCost(position.trades)`
  - Use `CostBasisCalculator.calculateCostBasis(position.trades)`
  - Use `PnLCalculator.calculatePositionPnL(position, priceMap)`
- Run: `npm test PositionDetail.test.tsx`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**CLEAN**:
- Remove calculation tests from PositionDetail tests
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/pages/PositionDetail.tsx src/pages/__tests__/PositionDetail.test.tsx
git commit -m "Remove business logic from PositionDetail page"
```

---

## Step 4.3: Refactor PriceUpdateCard to Use Orchestrator

**RED - Write Test**:
- Update `src/components/__tests__/PriceUpdateCard.test.tsx`:
  - Test component delegates to PriceUpdateOrchestrator
  - Test component handles orchestrator results
  - Test no business logic in component
- Run: `npm test PriceUpdateCard.test.tsx`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Update `src/components/PriceUpdateCard.tsx`:
  - Remove `validatePrice()` function (lines 50-70)
  - Remove complex `handleSubmit()` logic (lines 88-110)
  - Inject `PriceUpdateOrchestrator` via ServiceContext
  - Component delegates all logic to orchestrator
- Run: `npm test PriceUpdateCard.test.tsx`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**CLEAN**:
- Remove validation tests from component tests
- Remove workflow tests (now in orchestrator)
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/components/PriceUpdateCard.tsx src/components/__tests__/PriceUpdateCard.test.tsx
git commit -m "Refactor PriceUpdateCard to use PriceUpdateOrchestrator"
```

---

## Step 4.4: Enable Price Update Integration Test

**RED - Update Test**:
- Update `src/integration/__tests__/price-update-workflow.test.ts`:
  - Remove `.skip`
  - Enable all tests
- Run: `npm test price-update-workflow.test.ts`
- **Expected**: ✅ PASS (now that UI uses orchestrator)

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/integration/__tests__/price-update-workflow.test.ts
git commit -m "Enable price update workflow integration tests"
```

---

## Step 4.5: Remove Validation from TradeExecutionForm

**RED - Write Test**:
- Update `src/components/__tests__/TradeExecutionForm.test.tsx`:
  - Test form delegates validation to TradeValidator
  - Test form displays validator error messages
  - Test no validation logic in component
- Run: `npm test TradeExecutionForm.test.tsx`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Update `src/components/TradeExecutionForm.tsx`:
  - Remove inline validation logic
  - Use `TradeValidator.validateTrade()` for pre-submission validation
  - Display validation errors from TradeService
- Run: `npm test TradeExecutionForm.test.tsx`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**CLEAN**:
- Remove validation logic tests
- Keep form interaction tests
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/components/TradeExecutionForm.tsx src/components/__tests__/TradeExecutionForm.test.tsx
git commit -m "Remove validation logic from TradeExecutionForm"
```

---

## Step 4.6: Refactor PositionCreate Page to Use ServiceContainer

**RED - Write Test**:
- Update `src/pages/__tests__/PositionCreate.test.tsx`:
  - Test page accesses services via ServiceContext
  - Test no direct service instantiation
  - Test no manual IndexedDB opening
- Run: `npm test PositionCreate.test.tsx`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Update `src/pages/PositionCreate.tsx`:
  - Remove direct service instantiation (line 62)
  - Remove manual IndexedDB opening (lines 65-78)
  - Use `const services = useServices()`
  - Access services via `services.getPositionService()`, etc.
- Run: `npm test PositionCreate.test.tsx`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**CLEAN**:
- Update tests to mock ServiceContainer instead of individual services
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/pages/PositionCreate.tsx src/pages/__tests__/PositionCreate.test.tsx
git commit -m "Refactor PositionCreate to use ServiceContainer"
```

---

## Step 4.7: Refactor PositionDetail Page to Use ServiceContainer

**RED - Write Test**:
- Update `src/pages/__tests__/PositionDetail.test.tsx`:
  - Test page uses ServiceContext
  - Test no service instantiation
- Run: `npm test PositionDetail.test.tsx`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Update `src/pages/PositionDetail.tsx`:
  - Remove lines 47-64 (service instantiation)
  - Use ServiceContext
- Run: `npm test PositionDetail.test.tsx`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/pages/PositionDetail.tsx src/pages/__tests__/PositionDetail.test.tsx
git commit -m "Refactor PositionDetail to use ServiceContainer"
```

---

## Step 4.8: Refactor Home Page to Use ServiceContainer

**RED → GREEN → VERIFY → CLEAN → COMMIT**

---

## Step 4.9: Refactor Dashboard Page to Use ServiceContainer

**RED → GREEN → VERIFY → CLEAN → COMMIT**

---

## Step 4.10: Create Service Lifecycle Integration Test

**RED - Write Test**:
- Create `src/integration/__tests__/service-lifecycle.test.tsx`:
  ```typescript
  describe('Service Lifecycle Integration', () => {
    it('should maintain service instances across navigation')
    it('should share data between pages via services')
    it('should cleanup services on app unmount')
  })
  ```
- Run: `npm test service-lifecycle.test.tsx`
- **Expected**: ✅ PASS (now that all pages use ServiceContainer)

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/integration/__tests__/service-lifecycle.test.tsx
git commit -m "Add service lifecycle integration test"
```

---

## PHASE 4 CHECKPOINT

**Tests**:
- Run: `npm test -- --run` → ✅ ALL PASS

**Manual**:
- [ ] Full app workflow → ✅
- [ ] Navigation between pages → ✅
- [ ] All features working → ✅

---

# PHASE 5: CLEANUP & STANDARDIZATION

## Step 5.1: Extract Date Formatter

**RED - Write Test**:
- Create `src/utils/__tests__/formatters.test.ts`:
  - Test formatDate()
- Run: `npm test formatters.test.ts`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Create `src/utils/formatters.ts`:
  - Extract `formatDate()` from PositionDetail
- Update PositionDetail to use formatter
- Run: `npm test formatters.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/utils/formatters.ts src/utils/__tests__/formatters.test.ts
git commit -m "Extract formatDate to formatters utility"
```

---

## Step 5.2: Extract Currency Formatter

**RED → GREEN → VERIFY → COMMIT**

---

## Step 5.3: Extract Trade Summary Formatter

**RED → GREEN → VERIFY → COMMIT**

---

## Step 5.4: Create Configuration Constants

**RED - Write Test**:
- Create `src/config/__tests__/constants.test.ts`:
  - Test constants are exported
  - Test constants have expected values
- Run: `npm test constants.test.ts`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Create `src/config/constants.ts`:
  ```typescript
  export const PRICE_CHANGE_THRESHOLD_PERCENT = 20
  export const PLAN_VS_EXECUTION_TOLERANCE = 0.01
  export const DECIMAL_PRECISION = 2
  ```
- Update PriceValidator to use constant
- Update planVsExecution to use constant
- Run: `npm test constants.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/config/constants.ts src/config/__tests__/constants.test.ts
git commit -m "Add configuration constants"
```

---

## Step 5.5: Standardize Service Method Naming

**RED - Write Test**:
- Update all service tests to use standardized names
- Run: `npm test -- services/`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Update JournalService to remove duplicate `findById()` (keep `getById()`)
- Update all callers
- Run: `npm test -- services/`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/services/JournalService.ts [other affected files]
git commit -m "Standardize service method naming to getById/getAll"
```

---

## Step 5.6: Separate Calculation from Formatting in Plan vs Execution

**RED - Write Test**:
- Create `src/utils/__tests__/planVsExecutionFormatter.test.ts`
- Run: `npm test planVsExecutionFormatter.test.ts`
- **Expected**: ❌ FAIL

**GREEN - Implement**:
- Create `src/utils/planVsExecutionFormatter.ts`:
  - Extract `formatPlanVsExecution()` from planVsExecution.ts
- Update components to use formatter
- Run: `npm test planVsExecutionFormatter.test.ts`
- **Expected**: ✅ PASS

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**CLEAN**:
- Remove formatting tests from planVsExecution tests
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS

**COMMIT**:
```bash
git add src/utils/planVsExecutionFormatter.ts src/utils/__tests__/planVsExecutionFormatter.test.ts
git commit -m "Separate plan vs execution formatting from calculation"
```

---

## Step 5.7: Remove Old Utility Files

**CLEAN**:
- Delete `src/utils/pnl.ts` (replaced by PnLCalculator)
- Delete `src/utils/__tests__/pnl.test.ts`
- Delete `src/utils/costBasis.ts` (replaced by CostBasisCalculator)
- Delete `src/utils/__tests__/costBasis.test.ts`
- Delete `src/utils/statusComputation.ts` (replaced by PositionStatusComputer)
- Delete `src/utils/__tests__/statusComputation.test.ts`

**VERIFY - Full Suite**:
- Run: `npm test -- --run`
- **Expected**: ✅ ALL PASS (no orphaned imports)

**COMMIT**:
```bash
git rm src/utils/pnl.ts src/utils/__tests__/pnl.test.ts [etc]
git commit -m "Remove old utility files replaced by domain calculators"
```

---

# FINAL VERIFICATION

## Build Verification

**Run Build**:
```bash
npm run build
```
- **Expected**: ✅ SUCCESS (no build errors)

---

## Full Test Suite

**Run All Tests**:
```bash
npm test -- --run
```
- **Expected**: ✅ ALL PASS

---

## Manual Testing Checklist

**Full Application Test**:
- [ ] Start app: `npm run dev` → ✅
- [ ] Create new position → ✅
- [ ] Add trade to position → ✅
- [ ] Update price (< 20% change) → ✅
- [ ] Update price (> 20% change, confirm) → ✅
- [ ] View position detail with P&L → ✅
- [ ] Add exit trade → ✅
- [ ] Close position → ✅
- [ ] View plan vs execution → ✅
- [ ] Navigate between pages → ✅

---

# SUMMARY

## Changes Made

**New Files Created**: ~50
- 4 Validators + tests
- 3 Calculators + tests
- DatabaseConnection + SchemaManager + tests
- ServiceContainer + ServiceContext + tests
- PriceUpdateOrchestrator + tests
- 3 Integration tests
- Formatters + constants

**Files Modified**: ~20
- All services refactored
- All pages refactored
- Key components refactored

**Files Deleted**: ~6
- Old utility files replaced by domain layer

**Test Changes**:
- New tests: ~45 test files
- Removed tests: ~15 duplicate test files
- Net: +30 focused, well-organized test files

**Commits**: ~50 small, safe commits
- Each with passing tests
- Clear rollback points

---

## Architecture After Refactoring

```
UI Layer (Pages + Components)
  ↓ (presentation only)
Service Layer (Orchestrators + CRUD Services)
  ↓ (orchestration + persistence)
Domain Layer (Validators + Calculators)
  ↓ (business logic)
Data Layer (DatabaseConnection + SchemaManager)
  ↓ (data access)
IndexedDB
```

---

## Benefits Achieved

1. **Single Responsibility**: Each class has one clear purpose
2. **Testability**: Pure functions, dependency injection throughout
3. **Maintainability**: Changes localized to appropriate layer
4. **No Duplication**: Centralized validation, calculation, DB access
5. **Safety**: Continuous verification, ~50 safe checkpoints
6. **Confidence**: Always know current state, easy rollback

---

**Estimated Time**: 10-14 hours following this conservative plan
**Risk**: Minimal - any failure isolated to single step
**Confidence**: Maximum - continuous verification throughout
