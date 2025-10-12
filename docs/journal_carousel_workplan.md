# Journal Carousel Implementation Work Plan

This document outlines the incremental implementation plan for converting the vertical journal entries layout in PositionDetail to a carousel implementation, based on the mockup in `mockups/static-html/PositionDetails-JournalEntryCarousel.html`.

## Overview

The current PositionDetail component displays journal entries vertically, one after another. This plan transitions to a carousel implementation that:
- Shows the newest journal entry first when opened
- Uses click/tap navigation (arrows and dots) with swipe support as final enhancement  
- Adjusts height based on content
- Matches the mockup design exactly with configurable transition timing

## Requirements Summary

1. **Chronological Display**: Newest entry visible initially, navigate backwards chronologically
2. **Navigation Methods**: Both arrow buttons and dot indicators for click/tap interaction
3. **Height Management**: Content-based height that adjusts to entry length
4. **Styling**: Exact match to mockup design with elevated cards
5. **Timing**: Configurable transition duration (defaults to mockup's 0.28s)
6. **Swipe Support**: Optional enhancement to be added at the end

---

## Deliverable 1: Create JournalCarousel Component Foundation

**Acceptance Criteria**: A new `JournalCarousel` component that renders journal entries in a basic carousel structure with static navigation.

### Tasks
1. Create `/src/components/JournalCarousel.tsx`
2. Implement basic carousel structure with slide container
3. Add both arrow and dot navigation controls
4. Add configurable transition time prop (`transitionDuration`)
5. Create corresponding test file `/src/components/__tests__/JournalCarousel.test.tsx`

### Test Cases
```typescript
describe('JournalCarousel Component', () => {
  describe('Basic Rendering', () => {
    it('should render carousel container with both navigation types')
    it('should show correct number of dot indicators')
    it('should display journal entry content in each slide')
    it('should handle empty entries array gracefully')
  })

  describe('Navigation Controls', () => {
    it('should disable previous arrow on first slide (newest entry)')
    it('should disable next arrow on last slide (oldest entry)')
    it('should enable both arrows when between slides')
    it('should highlight correct dot indicator for current slide')
  })

  describe('Transition Configuration', () => {
    it('should use provided transitionDuration prop')
    it('should default to mockup timing when not provided')
  })
})
```

---

## Deliverable 2: Implement Click Navigation Logic

**Acceptance Criteria**: Fully functional carousel navigation with state management using click interactions only.

### Tasks
1. Add `useState` for `currentSlide` state
2. Implement `goToSlide()`, `nextSlide()`, `previousSlide()` functions
3. Add click handlers for arrows and dots
4. Implement CSS transform for slide transitions with configurable timing
5. Add keyboard navigation support (arrow keys)
6. Start with newest entry visible (currentSlide = entries.length - 1)

### Test Cases
```typescript
describe('Click Navigation', () => {
  describe('Arrow Navigation', () => {
    it('should advance to older entry when next arrow clicked')
    it('should go to newer entry when previous arrow clicked')
    it('should show newest entry initially (currentSlide = length - 1)')
    it('should not wrap around boundaries')
    it('should update transform style on navigation')
  })

  describe('Dot Navigation', () => {
    it('should go to specific entry when dot clicked')
    it('should update active dot state after navigation')
    it('should map dot 0 to oldest entry')
    it('should map final dot to newest entry')
  })

  describe('Keyboard Navigation', () => {
    it('should respond to left arrow key press')
    it('should respond to right arrow key press')
  })
})
```

---

## Deliverable 3: Integrate Carousel into PositionDetail

**Acceptance Criteria**: JournalCarousel replaces the vertical journal list while maintaining all existing functionality.

### Tasks
1. Import JournalCarousel into PositionDetail
2. Replace vertical list with JournalCarousel component
3. Pass journal entries with chronological ordering (newest first in display)
4. Maintain loading/error states in carousel integration
5. Preserve entry count display in accordion header
6. Configure transition timing to match mockup (0.28s)

### Test Cases
```typescript
describe('PositionDetail Integration', () => {
  describe('Carousel Replacement', () => {
    it('should render JournalCarousel instead of vertical list')
    it('should pass journal entries in chronological order')
    it('should maintain loading state display')
    it('should maintain error state display')
    it('should show "No journal entries yet" when empty')
    it('should preserve journal entry count in accordion')
  })

  describe('Initial Display', () => {
    it('should show newest entry when carousel opens')
    it('should start with previous arrow disabled')
    it('should start with next arrow enabled if multiple entries')
  })

  describe('Data Flow', () => {
    it('should handle empty journal entries array')
    it('should handle single journal entry')
    it('should pass transitionDuration prop correctly')
  })
})
```

---

## Deliverable 4: Refine Styling and Content-Based Height

**Acceptance Criteria**: Carousel matches mockup design exactly with content-based height management.

### Tasks
1. Copy exact CSS styling from mockup (shadows, borders, colors)
2. Implement content-based height (adjusts to entry content)
3. Apply elevated card design with proper shadows
4. Add hover states for navigation controls
5. Implement mobile-first responsive design
6. Add proper focus management and accessibility
7. Ensure word-wrap handling for long responses

### Test Cases
```typescript
describe('Styling and Layout', () => {
  describe('Visual Design', () => {
    it('should apply elevated card styling from mockup')
    it('should show hover effects on navigation controls')
    it('should maintain proper spacing and borders')
    it('should display entry type with correct formatting')
  })
  
  describe('Content-Based Height', () => {
    it('should adjust height to fit journal entry content')
    it('should handle short entries without excessive space')
    it('should handle long entries with proper spacing')
    it('should prevent horizontal overflow')
  })

  describe('Typography and Formatting', () => {
    it('should display field prompts with correct styling')
    it('should show responses with proper line height')
    it('should handle word wrap for long responses')
  })
})
```

---

## Deliverable 5: Handle Add Journal Entry Integration

**Acceptance Criteria**: Adding new journal entries works seamlessly with carousel display and positioning.

### Tasks
1. Update `loadJournalEntries` to show newest entry after addition
2. Ensure carousel navigates to newly added entry
3. Update dot indicators when entry count changes
4. Maintain proper slide positioning after new entries
5. Handle journal modal workflow with carousel

### Test Cases
```typescript
describe('Add Journal Integration', () => {
  describe('Entry Addition', () => {
    it('should show new entry in carousel after saving')
    it('should navigate to newest entry after creation')
    it('should update entry count in accordion header')
    it('should refresh dot indicators for new entry count')
  })

  describe('Carousel State', () => {
    it('should reset position to newest entry after addition')
    it('should maintain proper disabled states on arrows')
    it('should update currentSlide index after changes')
  })
})
```

---

## Deliverable 6: Add Touch/Swipe Support (Optional Enhancement)

**Acceptance Criteria**: Carousel responds to touch/swipe gestures on mobile devices.

### Tasks
1. Add touch event handlers (`touchstart`, `touchend`)
2. Implement swipe detection with 50px threshold
3. Add proper touch handling without interfering with existing click navigation
4. Ensure smooth transitions for touch interactions
5. Prevent default touch behaviors during swipe

### Test Cases
```typescript
describe('Touch/Swipe Support', () => {
  describe('Swipe Detection', () => {
    it('should handle swipe left for next (older) entry')
    it('should handle swipe right for previous (newer) entry')
    it('should not trigger for small finger movements')
    it('should calculate swipe distance correctly')
  })

  describe('Touch Integration', () => {
    it('should work alongside click navigation')
    it('should prevent scroll conflicts during swipe')
    it('should maintain carousel position after swipe')
  })
})
```

---

## Implementation Strategy

### TDD Approach
- Each deliverable starts with failing tests that drive the implementation
- Tests are written incrementally alongside the component
- Integration tests verify the complete user workflow

### Incremental Integration
- Each deliverable can be tested independently
- Core functionality implemented before optional enhancements
- Easy rollback at any stage using git

### Key Design Decisions
- **Component Interface**: `JournalCarousel` accepts `entries: JournalEntry[]` and optional `transitionDuration?: number`
- **State Management**: Component manages its own `currentSlide` state internally
- **Accessibility**: Proper ARIA labels and keyboard navigation from the start
- **Mobile-First**: All styling designed for mobile viewport with desktop considerations

### Risk Mitigation
- Preserving existing vertical layout code until final integration
- Each deliverable has clear acceptance criteria
- Comprehensive test coverage prevents regressions
- Incremental approach allows early feedback and course correction

---

## Success Criteria

### Functional Requirements
- [ ] Carousel displays journal entries chronologically (newest first)
- [ ] Navigation works via click/tap on arrows and dots
- [ ] New entries appear immediately and reset position newest
- [ ] Loading/error states handled gracefully
- [ ] Component integrates seamlessly with existing PositionDetail workflow

### Non-Functional Requirements  
- [ ] Visual design matches mockup exactly
- [ ] Smooth transitions with configurable timing
- [ ] Content-based height management
- [ ] Mobile-first responsive design
- [ ] Accessibility compliance (ARIA, keyboard, screen reader)
- [ ] Touch/swipe support (optional enhancement)

### Quality Requirements
- [ ] All tests pass for each deliverable
- [ ] No performance regressions
- [ ] Component handles edge cases gracefully
- [ ] Code follows existing project conventions
- [ ] Documentation is complete and accurate
