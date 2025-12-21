# Integration Testing Checklist

## 🎯 Purpose
This checklist ensures that all significant functionality changes are covered by comprehensive integration tests, preventing gaps in test coverage.

## 📋 When to Use This Checklist
Use this checklist **before** implementing any new feature or significant change:
- UI/UX behavior changes
- New user flows
- Data logic modifications
- Component interactions
- API integrations
- State management changes

## ✅ Integration Test Requirements

### 1. **User Journey Testing**
- [ ] **Complete End-to-End Flow**: Test the entire user journey from start to finish
- [ ] **Real Data Persistence**: Use actual IndexedDB, not mocked services
- [ ] **Navigation Integration**: Test routing and navigation between components
- [ ] **State Transitions**: Test how UI changes based on data/state changes

### 2. **Data Layer Testing**
- [ ] **Real Services**: Use actual PositionService, TradeService, JournalService
- [ ] **Database Operations**: Test actual CRUD operations with IndexedDB
- [ ] **Data Validation**: Test business rules and constraints
- [ ] **Error Handling**: Test how the app handles data errors and edge cases

### 3. **UI/UX Behavior Testing**
- [ ] **Conditional Rendering**: Test UI that changes based on state/data
- [ ] **User Interactions**: Test clicks, forms, navigation, accordion behavior
- [ ] **Visual Feedback**: Test loading states, error states, success states
- [ ] **Responsive Behavior**: Test UI adapts correctly to different conditions

### 4. **Component Integration Testing**
- [ ] **Component Communication**: Test how components pass data/events
- [ ] **Props and State**: Test component behavior with different props
- [ ] **Lifecycle Methods**: Test component mounting/unmounting
- [ ] **Side Effects**: Test async operations, data fetching

### 5. **Edge Cases and Error Scenarios**
- [ ] **Empty States**: Test with no data
- [ ] **Error States**: Test API failures, validation errors
- [ ] **Loading States**: Test async operations
- [ ] **Boundary Conditions**: Test limits, edge cases

## 🚫 Common Mistakes to Avoid

### **Missing Integration Tests For:**
- UI/UX behavior changes (like our accordion conditional logic)
- Data flow between components
- User journey flows
- State-dependent UI rendering
- Form validation and submission
- Error handling and user feedback

### **Insufficient Test Coverage:**
- Only testing unit scenarios without real data
- Using mocked services instead of real IndexedDB
- Not testing complete user journeys
- Missing edge cases and error scenarios
- Not testing navigation and routing

## 📝 Integration Test Template

```typescript
// Integration test template for new features
describe('Integration: [Feature Name]', () => {
  let positionService: PositionService
  let tradeService: TradeService
  let journalService: JournalService

  beforeEach(async () => {
    // Setup with REAL services via ServiceContainer
    const container = ServiceContainer.getInstance()
    await container.initialize()

    positionService = container.getPositionService()
    await positionService.clearAll()
    tradeService = container.getTradeService()
    journalService = container.getJournalService()
  })

  afterEach(async () => {
    // Cleanup
    await positionService.clearAll()
    positionService.close()
  })

  describe('Complete User Journey', () => {
    it('[Integration] should test the entire feature flow', async () => {
      // Arrange: Create real data using services
      const position = await positionService.create(testPosition)

      // Act: Navigate through the real UI
      render(/* Real components with routing */)

      // Assert: Verify actual user experience
      await waitFor(() => {
        // Test real UI behavior
        expect(screen.getByText('Expected UI Element')).toBeInTheDocument()
      })
    })
  })

  describe('Data Persistence', () => {
    it('[Integration] should maintain data integrity across operations', async () => {
      // Test real data operations
    })
  })

  describe('Edge Cases', () => {
    it('[Integration] should handle error scenarios gracefully', async () => {
      // Test error states
    })
  })
})
```

## 🔍 Integration Test Checklist Example

For our recent **Conditional Accordion Behavior** change, we should have checked:

- [x] **User Journey**: Planned position → View details → See Trade Plan expanded
- [x] **User Journey**: Open position → View details → See Trade History expanded
- [x] **Data Logic**: Position status calculation from trades array
- [x] **UI Behavior**: Accordion `defaultOpen` props based on position status
- [x] **Manual Interaction**: Users can still expand/collapse manually
- [x] **Edge Cases**: Position not found, multiple trades
- [x] **Data Persistence**: Behavior survives page refresh

## 📊 Test Coverage Metrics

### **Good Integration Test Coverage:**
- ✅ Complete user journeys tested
- ✅ Real data services used (not mocked)
- ✅ All UI states covered (loading, error, success, empty)
- ✅ Edge cases and error scenarios tested
- ✅ Component interactions verified
- ✅ Navigation and routing tested

### **Insufficient Integration Test Coverage:**
- ❌ Only unit tests for individual components
- ❌ Mocked services instead of real data
- ❌ Missing complete user flows
- ❌ No testing of state-dependent UI behavior
- ❌ Missing edge case testing

## 🎯 Next Steps

1. **Before implementing any feature**: Review this checklist
2. **During development**: Write integration tests alongside implementation
3. **Before merging**: Verify all checklist items are covered
4. **For existing features**: Add missing integration tests incrementally

---

**Remember**: Integration tests verify that components work together as users will actually experience them. They're more important than unit tests for catching real-world issues!