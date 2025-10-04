# Integration Testing Best Practices

## 🎯 Why Integration Testing Matters

Integration tests catch real-world issues that unit tests miss:
- Components not working together as expected
- Data flow problems between services
- UI/UX behavior that depends on multiple components
- State management issues across the application
- Navigation and routing problems

## 📋 Core Principles

### 1. **Test Real User Experiences**
```typescript
// ✅ GOOD: Test complete user journeys
it('[Integration] should create position and view details', async () => {
  // User creates position → navigates to details → sees expected UI
})

// ❌ BAD: Only test individual components in isolation
it('should render position details component', async () => {
  // Only tests component rendering, not real user flow
})
```

### 2. **Use Real Data Services**
```typescript
// ✅ GOOD: Use actual services with IndexedDB
beforeEach(async () => {
  positionService = new PositionService()
  await positionService.clearAll()
  tradeService = new TradeService(positionService)
})

// ❌ BAD: Mock services
const mockPositionService = {
  create: vi.fn(),
  getById: vi.fn()
}
```

### 3. **Test State-Dependent Behavior**
```typescript
// ✅ GOOD: Test UI changes based on data/state
it('[Integration] should show Trade History for open positions', async () => {
  const position = await positionService.create(plannedPosition)
  await tradeService.addTrade(trade) // Changes position status

  render(<PositionDetail positionId={position.id} />)

  await waitFor(() => {
    expect(screen.getByText('Trade History')).toHaveClass('active')
  })
})

// ❌ BAD: Only test static UI states
it('should render Trade History section', async () => {
  render(<PositionDetail positionId="test-id" />)
  expect(screen.getByText('Trade History')).toBeInTheDocument()
})
```

## 🏗️ Integration Test Structure

### **Test File Organization**
```
src/integration/__tests__/
├── feature-name.test.ts          # Feature-specific integration tests
├── user-journey-flows.test.ts    # Complete user workflows
├── data-integration.test.ts      # Data persistence tests
└── error-scenarios.test.ts       # Error handling tests
```

### **Test Naming Convention**
```typescript
// Use descriptive names that explain the user journey
describe('Integration: Position Management', () => {
  it('[Integration] should create position and show in dashboard', async () => {})
  it('[Integration] should add trade and update position status', async () => {})
  it('[Integration] should handle position validation errors', async () => {})
})
```

## 🔧 Technical Best Practices

### **1. Proper Test Setup**
```typescript
describe('Integration: Feature Name', () => {
  let positionService: PositionService
  let tradeService: TradeService

  beforeEach(async () => {
    // Real services with actual IndexedDB
    positionService = new PositionService()
    await positionService.clearAll()
    tradeService = new TradeService(positionService)
  })

  afterEach(async () => {
    // Proper cleanup
    await positionService.clearAll()
    positionService.close()
  })
})
```

### **2. Real Component Rendering**
```typescript
// ✅ GOOD: Use React.createElement for complex components
render(
  React.createElement('div', null,
    React.createElement(MemoryRouter, { initialEntries: ['/position/123'] },
      React.createElement(Routes, {},
        React.createElement(Route, {
          path: '/position/:id',
          element: React.createElement(PositionDetail, { positionService })
        })
      )
    )
  )
)

// ❌ BAD: Simple render without routing
render(<PositionDetail positionId="123" />)
```

### **3. Proper Async Handling**
```typescript
// ✅ GOOD: Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Expected Content')).toBeInTheDocument()
})

// ❌ BAD: Direct assertions without waiting
expect(screen.getByText('Expected Content')).toBeInTheDocument() // May fail
```

### **4. Element Visibility Testing**
```typescript
// ✅ GOOD: Test element visibility before interaction
const button = screen.getByText('Submit')
expect(button).toBeVisible()
fireEvent.click(button)

// ❌ BAD: Interact without checking visibility
fireEvent.click(screen.getByText('Submit')) // May be hidden
```

## 🎯 Integration Test Categories

### **1. Complete User Journeys**
- Account creation → Position planning → Trade execution → Review
- Dashboard navigation → Position selection → Detail view → Actions
- Error scenarios → User feedback → Recovery flows

### **2. Data Integration**
- Create → Read → Update → Delete operations
- Data validation and business rules
- Cross-service data consistency
- Performance with large datasets

### **3. UI/UX Behavior**
- Conditional rendering based on state
- Form validation and submission
- Loading states and error handling
- Responsive design and accessibility

### **4. Component Integration**
- Parent-child component communication
- State management across components
- Event handling and propagation
- Lifecycle coordination

## 🚫 Common Anti-Patterns

### **1. Over-Mocking**
```typescript
// ❌ BAD: Too much mocking hides real issues
vi.mock('@/services/PositionService')
vi.mock('@/services/TradeService')
vi.mock('@/lib/position')

// ✅ GOOD: Use real services to catch integration issues
positionService = new PositionService()
tradeService = new TradeService(positionService)
```

### **2. Testing Implementation Details**
```typescript
// ❌ BAD: Testing internal implementation
expect(component.state().isOpen).toBe(true)

// ✅ GOOD: Testing user-visible behavior
expect(screen.getByText('Content')).toBeVisible()
```

### **3. Incomplete User Journeys**
```typescript
// ❌ BAD: Testing only part of the flow
it('should show position form', async () => {
  render(<PositionForm />)
  expect(screen.getByText('Create Position')).toBeInTheDocument()
})

// ✅ GOOD: Testing complete user journey
it('[Integration] should create position and show in dashboard', async () => {
  // Complete flow from creation to dashboard display
})
```

## 📊 Integration Test Metrics

### **Coverage Goals**
- **Critical User Journeys**: 100% coverage
- **Data Integration**: 95% coverage
- **UI/UX Behavior**: 90% coverage
- **Error Scenarios**: 85% coverage

### **Quality Indicators**
- **High**: Tests use real services, complete user journeys, edge cases
- **Medium**: Tests use some mocks, partial user journeys
- **Low**: Tests use heavy mocking, unit-level scenarios only

## 🎯 When to Write Integration Tests

### **Always Write Integration Tests For:**
- New features or functionality
- UI/UX behavior changes
- Data flow modifications
- User journey changes
- Bug fixes that affect user experience

### **Consider Integration Tests For:**
- Refactoring existing functionality
- Performance optimizations
- Accessibility improvements
- Security enhancements

### **Unit Tests May Suffice For:**
- Pure utility functions
- Simple data transformations
- Individual component rendering (static)
- Configuration changes

## 🔄 Integration Test Maintenance

### **Keeping Tests Reliable**
- Use unique test data to avoid conflicts
- Proper cleanup after each test
- Avoid hardcoded waits, use `waitFor`
- Test both happy path and edge cases

### **Performance Considerations**
- Group related tests to share setup
- Use `describe` blocks for organization
- Avoid unnecessary test data creation
- Consider test parallelization

---

**Remember**: Integration tests are your safety net. They catch issues that users will actually encounter in production. Invest in comprehensive integration testing to build robust, reliable applications.