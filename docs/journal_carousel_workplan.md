# Journal Entry Carousel Implementation Plan

## Overview
This plan details the incremental approach to replace the current vertical list of journal entries in the PositionDetail view with a carousel implementation, following the design shown in the mockup.

## Deliverable 1: Create JournalCarousel Component with Basic Structure

### Acceptance Criteria
- [ ] Component exists at `src/components/JournalCarousel.tsx`
- [ ] Component renders a container with proper styling
- [ ] Navigation controls (arrows) are visible but disabled initially
- [ ] Dot indicators are visible with correct count

### Tasks
- [ ] Create new `JournalCarousel.tsx` file with component structure
- [ ] Import required types (JournalEntry)
- [ ] Implement basic container with navigation controls
- [ ] Add initial state management for current slide

### Test Cases
```typescript
describe('JournalCarousel', () => {
  it('should render the carousel container with correct styling', () => {
    // Test that carousel container has appropriate CSS classes
  });
  
  it('should render navigation arrows and dots', () => {
    // Test that navigation controls are present in DOM
  });
  
  it('should initialize with correct default state', () => {
    // Test initial state values for currentSlide, totalSlides, etc.
  });
});
```

## Deliverable 2: Implement Carousel Sliding Functionality with Arrow Buttons

### Acceptance Criteria
- [ ] Left/previous arrow navigates to previous journal entry
- [ ] Right/next arrow navigates to next journal entry
- [ ] Arrows are disabled appropriately at boundaries
- [ ] Smooth transition animation when changing slides

### Tasks
- [ ] Add click handlers for navigation arrows
- [ ] Implement slide transition logic
- [ ] Add disabled state management for arrows
- [ ] Add CSS transition for sliding animation

### Test Cases
```typescript
describe('JournalCarousel Navigation', () => {
  it('should navigate to next slide when right arrow is clicked', () => {
    // Test that clicking next arrow increments current slide
  });
  
  it('should navigate to previous slide when left arrow is clicked', () => {
    // Test that clicking previous arrow decrements current slide
  });
  
  it('should disable next arrow when on last slide', () => {
    // Test arrow disabled state at boundaries
  });
  
  it('should disable previous arrow when on first slide', () => {
    // Test arrow disabled state at boundaries
  });
});
```

## Deliverable 3: Add Dot Indicators for Slide Navigation

### Acceptance Criteria
- [ ] Dot indicators show total number of journal entries
- [ ] Active dot corresponds to current slide
- [ ] Clicking dots navigates to corresponding slide
- [ ] Dots update when slide changes via arrows

### Tasks
- [ ] Implement dot rendering logic
- [ ] Add active state styling for current slide dot
- [ ] Add click handlers for dot navigation
- [ ] Update dot states when slide changes

### Test Cases
```typescript
describe('JournalCarousel Dot Navigation', () => {
  it('should render correct number of dots based on journal entries count', () => {
    // Test dot count matches journal entries
  });
  
  it('should highlight the correct dot as active based on current slide', () => {
    // Test active dot styling
  });
  
  it('should navigate to specific slide when dot is clicked', () => {
    // Test dot click handlers
  });
});
```

## Deliverable 4: Style Individual Journal Entry Slides

### Acceptance Criteria
- [ ] Each journal entry renders in its own slide
- [ ] Entry type is displayed prominently
- [ ] Date is formatted and displayed correctly
- [ ] All journal fields are shown with proper styling

### Tasks
- [ ] Create slide rendering for each journal entry
- [ ] Implement proper styling matching mockup design
- [ ] Format entry type labels appropriately
- [ ] Format dates using existing utility functions

### Test Cases
```typescript
describe('Journal Entry Slides', () => {
  it('should display journal entry type correctly for position_plan entries', () => {
    // Test "Position Plan" label display
  });
  
  it('should display journal entry type correctly for trade_execution entries', () => {
    // Test "Trade Execution" label display
  });
  
  it('should render all journal fields with appropriate prompts and responses', () => {
    // Test field rendering
  });
  
  it('should format dates using existing date formatting utilities', () => {
    // Test date formatting consistency
  });
});
```

## Deliverable 5: Update PositionDetail to Use JournalCarousel

### Acceptance Criteria
- [ ] PositionDetail uses JournalCarousel instead of vertical list
- [ ] All existing functionality remains intact
- [ ] Journal entries still load correctly
- [ ] Loading/error states still work appropriately

### Tasks
- [ ] Replace vertical journal entry list with JournalCarousel component
- [ ] Pass journal entries to carousel as props
- [ ] Handle loading and error states within carousel
- [ ] Ensure responsive design matches existing layout

### Test Cases
```typescript
describe('PositionDetail with JournalCarousel', () => {
  it('should render JournalCarousel component when journal entries exist', () => {
    // Test carousel rendering
  });
  
  it('should show loading state appropriately', () => {
    // Test loading UI
  });
  
  it('should show error state appropriately', () => {
    // Test error UI
  });
  
  it('should show empty state message when no journal entries exist', () => {
    // Test empty state UI
  });
});
```

## Deliverable 6: Carousel Initial Display Behavior

### Acceptance Criteria
- [ ] Journal entries remain sorted chronologically (oldest first)
- [ ] Carousel initially shows the last/most recent entry
- [ ] Navigation still works in chronological order
- [ ] Dot indicators reflect chronological order

### Tasks
- [ ] Modify carousel initialization to show last entry first
- [ ] Maintain existing chronological sorting logic
- [ ] Update navigation indices to match reverse display order
- [ ] Ensure dot indicators work properly

### Test Cases
```typescript
describe('JournalCarousel Initial Display', () => {
  it('should show the most recent journal entry when carousel initially loads', () => {
    // Test initial slide corresponds to last entry
  });
  
  it('should maintain chronological sorting of entries internally', () => {
    // Test sorting remains oldest first (index 0 is oldest)
  });
});
```

## Deliverable 7: Unit Tests for JournalCarousel Component

### Acceptance Criteria
- [ ] Comprehensive unit test coverage for JournalCarousel
- [ ] Tests for all user interactions (arrow clicks, dot clicks)
- [ ] Tests for edge cases (no entries, single entry, etc.)
- [ ] Tests for date formatting and entry type display

### Tasks
- [ ] Create `src/components/__tests__/JournalCarousel.test.tsx` file
- [ ] Implement comprehensive test suite
- [ ] Test edge cases around entry count
- [ ] Test UI behavior and state transitions

### Test Cases
```typescript
describe('JournalCarousel Component', () => {
  it('should render correctly with no journal entries', () => {
    // Test empty state behavior
  });
  
  it('should render correctly with a single journal entry', () => {
    // Test single entry behavior
  });
  
  it('should handle navigation correctly with multiple entries', () => {
    // Test full navigation functionality
  });
  
  it('should maintain proper state throughout user interactions', () => {
    // Test state consistency
  });
});
```

## Deliverable 8: Integration Tests for PositionDetail Carousel

### Acceptance Criteria
- [ ] Integration tests verify carousel behavior within PositionDetail
- [ ] Tests ensure accordion still works correctly with carousel
- [ ] Tests verify journal data flows correctly to carousel
- [ ] Tests for user interaction scenarios

### Tasks
- [ ] Create `src/pages/__tests__/PositionDetail-carousel.test.tsx` file
- [ ] Test integration of carousel with position data
- [ ] Test accordion behavior with carousel content
- [ ] Test navigation with real journal data

### Test Cases
```typescript
describe('PositionDetail Journal Carousel Integration', () => {
  it('should fetch and display journal entries in carousel', async () => {
    // Test data flow and carousel rendering
  });
  
  it('should maintain accordion behavior with carousel content', async () => {
    // Test accordion + carousel interaction
  });
  
  it('should handle carousel navigation with real journal data', async () => {
    // Test navigation with actual entries
  });
});
```

## Deliverable 9: Touch Swipe Functionality

### Acceptance Criteria
- [ ] Swipe left moves to next journal entry
- [ ] Swipe right moves to previous journal entry
- [ ] Swipe threshold prevents accidental navigation
- [ ] Touch events work properly on mobile devices

### Tasks
- [ ] Add touch event handlers for swipe detection
- [ ] Implement swipe navigation logic
- [ ] Add appropriate swipe thresholds
- [ ] Test with different touch devices

### Test Cases
```typescript
describe('JournalCarousel Touch Support', () => {
  it('should navigate to next slide on swipe left', () => {
    // Test swipe left detection and navigation
  });
  
  it('should navigate to previous slide on swipe right', () => {
    // Test swipe right detection and navigation
  });
  
  it('should ignore minor swipes below threshold', () => {
    // Test swipe threshold behavior
  });
});
```

## Implementation Sequence

1. Create JournalCarousel component with basic structure
2. Implement navigation arrows functionality
3. Add dot indicators for slide navigation
4. Style journal entry slides to match mockup design
5. Update PositionDetail to integrate JournalCarousel
6. Adjust carousel to show most recent entry initially
7. Add comprehensive unit tests for JournalCarousel
8. Create integration tests for PositionDetail carousel
9. Implement touch swipe functionality as final enhancement

Each deliverable will be implemented and tested independently, following the TDD approach with the described test cases.