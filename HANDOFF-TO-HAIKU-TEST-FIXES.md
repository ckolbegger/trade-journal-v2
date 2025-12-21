# HANDOFF TO HAIKU: Fix Tests for Async ServiceProvider

## Context

Step 6.4 made `getJournalService()` synchronous and updated ServiceProvider to handle database initialization automatically. This means:

1. ✅ `ServiceContainer.getJournalService()` is now synchronous (no `await` needed)
2. ✅ ServiceProvider now initializes the database in a `useEffect` (async operation)
3. ✅ ServiceProvider shows "Loading..." while initializing, then renders children
4. ✅ Test utilities (`renderWithRouterAndProps`, etc.) are now async and wait for initialization
5. ❌ Test files still call render utilities synchronously (not awaiting them)

## The Problem

Test helper functions are now async:
- `renderWithRouterAndProps()` → returns `Promise`
- `renderWithRouter()` → returns `Promise`
- `renderWithProviders()` → returns `Promise`

But test files call them synchronously without `await`, causing tests to interact with the "Loading..." screen instead of the actual component.

## The Solution

Update all test files that use these helpers to:
1. Make the test function `async`
2. `await` the render call

## Files to Update

### Search Command
```bash
grep -rn "renderWithRouterAndProps\|renderWithRouter(" src --include="*.test.tsx" --include="*.test.ts" | cut -d: -f1 | sort -u
```

Expected files (verify with grep):
- `src/pages/PositionCreate.test.tsx`
- `src/components/__tests__/DashboardOptionA.test.tsx`
- `src/components/__tests__/PositionDetail.test.tsx`
- Any other files using these helpers

## Pattern to Follow

### Example 1: Simple test with renderWithRouterAndProps

**BEFORE:**
```typescript
it('should display position plan form', () => {
  renderWithRouterAndProps(<PositionCreate />)

  expect(screen.getByText('Position Plan')).toBeInTheDocument()
})
```

**AFTER:**
```typescript
it('should display position plan form', async () => {
  await renderWithRouterAndProps(<PositionCreate />)

  expect(screen.getByText('Position Plan')).toBeInTheDocument()
})
```

### Example 2: Test with user interactions

**BEFORE:**
```typescript
it('should validate required fields', () => {
  renderWithRouterAndProps(<PositionCreate />)

  const nextButton = screen.getByText('Next: Trading Journal')
  fireEvent.click(nextButton)

  expect(screen.getByText(/Symbol is required/i)).toBeInTheDocument()
})
```

**AFTER:**
```typescript
it('should validate required fields', async () => {
  await renderWithRouterAndProps(<PositionCreate />)

  const nextButton = screen.getByText('Next: Trading Journal')
  fireEvent.click(nextButton)

  await waitFor(() => {
    expect(screen.getByText(/Symbol is required/i)).toBeInTheDocument()
  })
})
```

### Example 3: Test with waitFor (already async)

**BEFORE:**
```typescript
it('should create position', async () => {
  renderWithRouterAndProps(<PositionCreate />)  // Missing await!

  // Fill form...
  fireEvent.click(createButton)

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalled()
  })
})
```

**AFTER:**
```typescript
it('should create position', async () => {
  await renderWithRouterAndProps(<PositionCreate />)  // Add await

  // Fill form...
  fireEvent.click(createButton)

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalled()
  })
})
```

## Step-by-Step Instructions

### Phase 1: Find All Usages

Run this command to find all test files using the helpers:
```bash
grep -rn "renderWithRouterAndProps\|renderWithRouter\|renderWithProviders" src --include="*.test.tsx" --include="*.test.ts"
```

### Phase 2: Update Each File

For each file found:

1. **Find each test function** that calls a render helper
2. **Check if test is already `async`**:
   - If NO → Add `async` to function signature
   - If YES → Just add `await` to render call
3. **Add `await` before the render call**:
   - `renderWithRouterAndProps(...)` → `await renderWithRouterAndProps(...)`
   - `renderWithRouter(...)` → `await renderWithRouter(...)`
   - `renderWithProviders(...)` → `await renderWithProviders(...)`

### Phase 3: Verify Pattern

After updating each file, verify:
- ✅ Test function is `async`
- ✅ Render call has `await`
- ✅ No syntax errors introduced
- ✅ Test makes sense (still testing the right thing)

## Detailed File Updates

### File: `src/pages/PositionCreate.test.tsx`

This file has ~10 usages of `renderWithRouterAndProps()`. Each test needs:
1. `async` keyword on test function
2. `await` before `renderWithRouterAndProps()`

**Example from this file:**

Line 51:
```typescript
// BEFORE
it('should display position plan form with all required fields', () => {
  renderWithRouterAndProps(<PositionCreate />)
  assertStepVisible('Position Plan')
  // ...
})

// AFTER
it('should display position plan form with all required fields', async () => {
  await renderWithRouterAndProps(<PositionCreate />)
  assertStepVisible('Position Plan')
  // ...
})
```

### File: `src/components/__tests__/DashboardOptionA.test.tsx`

Similar pattern - find all render calls, make async, add await.

### File: `src/components/__tests__/PositionDetail.test.tsx`

Similar pattern - find all render calls, make async, add await.

## Testing Your Changes

After updating files, run tests to verify:

```bash
npm test -- --run
```

**Expected outcome:**
- All tests should pass
- No more "Unable to find element" errors related to "Loading..."
- Tests should see actual component content, not loading screen

## Common Pitfalls

1. **Forgetting to make test function async**
   - Error: "await is only valid in async function"
   - Fix: Add `async` to test function signature

2. **Not awaiting other async operations**
   - If test already has `await waitFor(...)`, keep those too
   - Multiple awaits are fine in one test

3. **Nested describes**
   - Only test functions (`it()`) need `async`, not `describe()` blocks

## Verification Checklist

Before marking complete:
- [ ] All files with render helpers have been updated
- [ ] All render calls have `await`
- [ ] All test functions using render are `async`
- [ ] `npm test -- --run` passes without errors
- [ ] No tests are skipped/disabled unless intentional

## Expected Test Results

**Before fix:**
- ~27 test failures
- Errors about "Unable to find element" or "Loading..."
- Tests timing out

**After fix:**
- All tests passing (or same failures as before Step 6.4)
- No "Loading..." related errors
- Tests interact with actual components

## Notes

- Integration tests (in `src/integration/`) already call `await services.initialize()` in `beforeEach`, so they should be unaffected
- Only component tests using the test utilities need updates
- The `ServiceContext.test.tsx` file has already been updated as an example

## Questions?

If you encounter:
- Tests that can't be made async (rare) → Ask for guidance
- Tests that fail even after awaiting → Check if test logic needs adjustment
- Unclear test patterns → Document and ask

## Completion Criteria

✅ All test files using render helpers updated
✅ All render calls properly awaited
✅ All test functions properly marked async
✅ Full test suite passes (`npm test -- --run`)
✅ No regressions in test coverage
