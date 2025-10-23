# Journal Carousel - Architectural Plan

## Overview
This document describes the architecture and implementation approach for the Journal Entry Carousel component in the PositionDetail view.

## Component Architecture

### JournalCarousel Component
The JournalCarousel is a React functional component that displays journal entries in a horizontal sliding carousel format rather than the previous vertical list approach.

#### Props
- `journalEntries: JournalEntry[]` - Array of journal entries to display
- `loading?: boolean` - Loading state indicator
- `error?: string | null` - Error message if any

#### State
- `currentSlide: number` - Index of currently visible slide (0-based)
- Uses hooks: useState, useEffect, useRef

#### Dependencies
- React (useState, useEffect, useRef)
- TypeScript interfaces (JournalEntry, JournalField)
- Tailwind CSS for styling

### Design Pattern
The carousel follows a pure component design pattern:
1. Receives data via props
2. Manages internal navigation state
3. Only handles presentation logic
4. No side effects or data fetching

## Implementation Details

### Entry Sorting
Journal entries remain sorted chronologically (oldest first) to preserve the logical flow of the trading process:
- Position Plan → Trade Execution(s) → Daily Review(s)
- Sorting is performed in PositionDetail before passing to JournalCarousel

### Initial Display Behavior
Despite maintaining chronological sorting internally:
- Carousel **initially shows** the last/most recent entry (latest chronological)
- Navigation follows conventional indexing (left = previous, right = next)
- This allows traders to quickly see the most recent journal when opening the accordion

### Mathematical Navigation Logic
Navigation between entries works through simple index arithmetic:
- Moving to "previous" entry = `currentSlide - 1` (older entry)
- Moving to "next" entry = `currentSlide + 1` (newer entry)
- Boundary checks = `currentSlide === 0` (first entry) and `currentSlide === totalSlides - 1` (last entry)

### DOM Structure
The carousel implements a classic sliding container pattern:
1. Outer container handles overflow hidden
2. Inner slide wrapper handles transform transitions
3. Individual slide containers ensure full-width display
4. Navigation controls positioned above or alongside content

### Styling Principles
1. **Mobile-first** - Designed for narrow viewports first
2. **Minimal DOM** - Simple structure to facilitate CSS transitions
3. **Touch-aware** - Includes touch event handlers for swipe navigation
4. **Accessible** - Proper aria-labels for navigation controls
5. **Reusable** - Generic component, accepts any array of journal entries

### Touch Navigation Enhancement
Added touch/swipe support for mobile users:
- Uses `touchstart` and `touchend` events
- Calculates swipe distance to determine intent
- Applies minimum threshold to prevent accidental navigation
- Updates navigation state synchronously with swipe detection

## Data Flow Architecture

### PositionDetail Integration Flow
1. PositionDetail fetches journal entries from IndexedDB
2. Entries are sorted chronologically by creation date
3. Sorted entries are passed to JournalCarousel as props
4. JournalCarousel manages slide navigation state internally

### Consistency with Existing Architecture
The carousel integrates seamlessly with the existing component architecture:
- Uses same JournalEntry data types
- Respects global loading/error states
- Follows mobile-first responsive design principles
- Maintains clear separation of concerns

## Future Enhancements

### Potential Scalability Features
- Animation timing control via props
- Slide indicators with numerical labels
- Keyboard navigation support
- Auto-play behavior (for educational walkthroughs)

### Technical Debt Considerations
- No external dependencies beyond React
- Clear mathematical boundaries prevent navigation errors
- Type-safe implementation reduces runtime errors
- Pure component design allows easy testing

## Testing Strategy

### Unit Tests (`JournalCarousel.test.tsx`)
Focus on UI behavior and state transitions:
- Loading and error state rendering
- Navigation control functionality
- Dot indicator interaction
- Slide change verification

### Integration Tests (`journal-carousel-integration.test.tsx`)
Focus on data flow and real-world use cases:
- Carousel with actual journal data
- Accordion interaction behavior
- Navigation with multiple entries
- Default display of most recent entry

## Mockup Compliance Alignment

### Deviation from Conventional Carousel
The initial display behavior deviates from conventional carousels for UX purposes:
- Conventional: First item (index 0) shows first
- JournalCarousel: Last item (index n-1) shows first while preserving original sorting

This supports the behavioral training aspect of the application:
- Traders usually want to see most recent journal immediately
- Chronological structure still maintained for educational purposes
