# Journal Entry Carousel Implementation Plan

## Overview
Transform the vertical journal entries list into a horizontal carousel with navigation controls, matching the mockup design exactly. Implementation follows TDD principles with incremental deliverables.

---

## Deliverable 1: Carousel Component Shell (No Navigation)

### Goal
Create a standalone JournalCarousel component that renders journal entries as horizontal slides without navigation controls.

### Acceptance Criteria
- ✓ Component renders journal entries in horizontal layout
- ✓ Only one entry visible at a time
- ✓ Entries can be changed programmatically by setting slide index
- ✓ Component accepts `transitionDuration` prop (default: 0.28s)
- ✓ Works with 0, 1, or multiple entries
- ✓ Matches mockup visual styling (elevated cards, shadows, borders)

### Tasks
1. Create `src/components/JournalCarousel.tsx` component
2. Create `src/components/__tests__/JournalCarousel.test.tsx`
3. Create `src/components/__tests__/JournalCarousel.integration.test.tsx`

### Test Cases
**Unit Tests** (`JournalCarousel.test.tsx`):
```typescript
describe('JournalCarousel')
  it('renders empty state with no entries')
  it('renders single entry without navigation')
  it('renders multiple entries with first entry visible by default')
  it('applies custom transition duration from props')
  it('changes visible entry when currentIndex prop changes')
  it('matches mockup styling with elevated card design')
```

**Integration Test** (`JournalCarousel.integration.test.tsx`):
```typescript
describe('JournalCarousel - Integration')
  it('renders actual journal entry data with all fields and formatting')
  // Verifies:
  // - Real JournalEntry objects render correctly
  // - All fields (prompt/response) display properly
  // - Entry type and date formatting works
  // - Card styling applies to actual content
  // - Long text content wraps correctly within cards
```

---

## Deliverable 2: Navigation Controls (Arrows + Dots)

### Goal
Add navigation controls (arrows and dots) with proper disabled states at boundaries.

### Acceptance Criteria
- ✓ Left/right arrow buttons rendered in navigation bar
- ✓ Dot indicators show total entries and current position
- ✓ Clicking arrows changes visible slide
- ✓ Clicking dots jumps to specific slide
- ✓ Arrows disabled at boundaries (left at start, right at end)
- ✓ Arrows/dots hidden when 0-1 entries

### Tasks
1. Add navigation UI to JournalCarousel component
2. Implement click handlers for arrows and dots
3. Add boundary logic for disabled states
4. Update tests for navigation behavior
5. Add integration test for complete navigation workflow

### Test Cases
**Unit Tests** (`JournalCarousel.test.tsx`):
```typescript
describe('JournalCarousel - Navigation')
  it('hides navigation when no entries exist')
  it('hides navigation when only one entry exists')
  it('shows navigation with multiple entries')
  it('disables left arrow on first slide')
  it('disables right arrow on last slide')
  it('enables both arrows on middle slides')
  it('advances to next slide when right arrow clicked')
  it('goes to previous slide when left arrow clicked')
  it('jumps to specific slide when dot clicked')
  it('highlights active dot corresponding to current slide')
```

**Integration Test** (`JournalCarousel.integration.test.tsx`):
```typescript
describe('JournalCarousel - Navigation Integration')
  it('navigates through full carousel of real journal entries using all controls')
  // Verifies complete user journey:
  // - Start at first entry (left arrow disabled)
  // - Click right arrow through all entries
  // - Verify each entry's content displays correctly
  // - Reach last entry (right arrow disabled)
  // - Click left arrow to go back
  // - Click dots to jump to specific entries
  // - Verify dot highlighting updates correctly
  // - Ensure all entry data remains intact during navigation
```

---

## Deliverable 3: Integration with PositionDetail

### Goal
Replace the vertical journal entries list in PositionDetail with the new JournalCarousel component.

### Acceptance Criteria
- ✓ JournalCarousel integrated into Journal Entries accordion
- ✓ All journal entries displayed in carousel
- ✓ Loading/error/empty states preserved
- ✓ No visual or functional regressions in PositionDetail
- ✓ Existing PositionDetail tests still pass

### Tasks
1. Import and integrate JournalCarousel into PositionDetail
2. Pass journal entries data to carousel component
3. Update PositionDetail tests for carousel integration
4. Remove old vertical list rendering code
5. Add end-to-end integration test for complete workflow

### Test Cases
**Component Tests** (`PositionDetail.test.tsx` or new file):
```typescript
describe('PositionDetail - Journal Carousel Integration')
  it('renders JournalCarousel within accordion')
  it('passes journal entries to carousel')
  it('shows loading state while entries load')
  it('shows error message when entries fail to load')
  it('shows empty state when no entries exist')
  it('displays all journal entry fields in carousel format')
  it('preserves accordion expand/collapse behavior')
```

**End-to-End Integration Test** (`PositionDetail-carousel.integration.test.tsx`):
```typescript
describe('PositionDetail - Full Carousel Workflow')
  it('loads position with multiple journal entries and navigates carousel')
  // Verifies complete integration:
  // - Create position in IndexedDB
  // - Create multiple journal entries for position
  // - Render PositionDetail page
  // - Expand Journal Entries accordion
  // - Verify carousel appears with correct entry count
  // - Navigate through all entries using arrows
  // - Jump to specific entry using dots
  // - Verify each entry's data matches what was stored
  // - Collapse and re-expand accordion (carousel state preserved)
  // - Add new journal entry via modal
  // - Verify carousel updates with new entry
```

---

## Deliverable 4: Touch Swipe Navigation (Final Enhancement)

### Goal
Add touch swipe gesture support for mobile/tablet users.

### Acceptance Criteria
- ✓ Swiping left advances to next slide
- ✓ Swiping right goes to previous slide
- ✓ Swipe threshold prevents accidental navigation (50px minimum)
- ✓ Respects boundary conditions (no swipe past first/last)
- ✓ Doesn't interfere with vertical scrolling

### Tasks
1. Add touch event handlers to JournalCarousel
2. Implement swipe detection logic
3. Update tests for touch interaction (if feasible in test environment)
4. Test on actual mobile/tablet devices
5. Add integration test for swipe behavior

### Test Cases
**Unit Tests** (`JournalCarousel.test.tsx`):
```typescript
describe('JournalCarousel - Touch Swipe')
  it('advances to next slide on left swipe gesture')
  it('goes to previous slide on right swipe gesture')
  it('ignores swipe gestures below threshold')
  it('does not advance past last slide on left swipe')
  it('does not go before first slide on right swipe')
```

**Integration Test** (`JournalCarousel.integration.test.tsx`):
```typescript
describe('JournalCarousel - Touch Swipe Integration')
  it('swipes through multiple real journal entries with touch gestures')
  // Verifies:
  // - Simulate touchstart at position X
  // - Simulate touchmove (drag) 100px left
  // - Simulate touchend
  // - Verify slide advanced and correct entry visible
  // - Swipe right to go back
  // - Verify previous entry visible
  // - Try swiping past boundaries (should not navigate)
  // - Verify entry content remains correct throughout
  // Note: May need manual testing on real devices
```

---

## Implementation Notes

### Visual Styling Details (from mockup)
- Background: `rgba(248, 250, 252, 0.75)` with border `rgba(203, 213, 225, 0.8)`
- Border radius: `12px`
- Entry cards: white background, `10px` border radius
- Box shadow: `0 12px 24px -18px rgba(15, 23, 42, 0.8)`
- Navigation bar: white background, border-bottom separator
- Arrows: `32px × 32px`, gray background `#f3f4f6`, border `#d1d5db`
- Dots: `8px` diameter, active dot `10px`, active color `#3b82f6`

### Props Interface
```typescript
interface JournalCarouselProps {
  entries: JournalEntry[]
  transitionDuration?: number // seconds, default 0.28
  onSlideChange?: (index: number) => void // optional callback
}
```

### Component Structure
```
<div className="carousel-container">
  <div className="carousel-nav">
    <button className="carousel-arrow" disabled={atStart}>←</button>
    <div className="carousel-dots">{dots}</div>
    <button className="carousel-arrow" disabled={atEnd}>→</button>
  </div>
  <div className="carousel-wrapper" style={{transform: `translateX(-${currentSlide * 100}%)`}}>
    {entries.map(entry => <div className="carousel-slide">{entry}</div>)}
  </div>
</div>
```

---

## Testing Strategy Summary

Each deliverable includes:
1. **Unit tests**: Test component logic in isolation
2. **Integration tests**: Test with real data and complete user workflows
3. **Incremental validation**: Each deliverable builds on previous integration tests

This ensures not only that individual pieces work, but that they wire together correctly with real data flowing through the entire system.

---

## Design Reference

The mockup file is located at: `mockups/static-html/PositionDetails-JournalEntryCarousel.html`

Key visual elements to match:
- Elevated card design with pronounced shadow
- Smooth horizontal sliding transition (0.28s ease-out)
- Clean navigation controls with proper spacing
- Responsive text wrapping within cards
- Professional color scheme matching app design system
