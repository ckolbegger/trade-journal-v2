# Mockup Handoff Summary: Journal Entries Carousel

## Overview
This document summarizes the HTML mockup created for the journal entries carousel view. The mockup demonstrates a horizontal scrolling carousel with dot indicators and navigation arrows to reduce scrolling when there are many journal entries.

## Mockup File
Location: `mockups/static-html/07-journal-entries-carousel.html`

## Key Features Demonstrated

### 1. Horizontal Carousel Layout
- Journal entries are displayed in a horizontal carousel instead of vertical stacking
- Each entry takes up the full width of the viewport
- Users can swipe or use navigation controls to move between entries

### 2. Navigation Controls
- **Navigation Arrows**: Left and right arrows for moving between entries
- **Dot Indicators**: Small dots that show which entry is currently visible and allow direct navigation
- **Touch Swipe Support**: Users can swipe left/right to navigate between entries on mobile devices

### 3. Entry Display
- Each journal entry maintains the field-based structure:
  - Entry type indicator (Position Plan, Trade Execution, etc.)
  - Date of entry
  - Series of prompt/response pairs displayed as distinct fields
- Proper text wrapping and overflow handling for long responses
- Consistent styling with the existing accordion-based layout

### 4. Implementation Details
The mockup implements the carousel using:
- CSS Flexbox for horizontal layout
- CSS scroll-snap for smooth scrolling behavior
- JavaScript for navigation controls and dot indicators
- Responsive design suitable for mobile-first approach

## CSS Classes Overview

### Core Carousel Structure
- `.journal-carousel-container` - Container for the entire carousel component
- `.journal-carousel` - The scrollable area containing all journal entries
- `.journal-entry` - Individual journal entry cards

### Navigation Components
- `.carousel-arrows` - Container for navigation arrows
- `.arrow` - Navigation arrow buttons
- `.carousel-nav` - Container for dot indicators
- `.nav-dot` - Individual dot indicators

### Entry Content Styling
- `.journal-header` - Header section with entry type and date
- `.journal-type` - Entry type display
- `.journal-date` - Entry date display
- `.journal-field` - Container for each prompt/response pair
- `.journal-field-prompt` - Prompt text styling
- `.journal-field-response` - Response text styling with proper wrapping

## JavaScript Functionality

### Navigation Functions
- `goToEntry(index)` - Navigate to a specific journal entry
- `prevEntry()` - Navigate to the previous entry
- `nextEntry()` - Navigate to the next entry

### State Management
- `currentIndex` - Tracks the currently visible entry
- `totalEntries` - Total number of journal entries
- `updateDots(index)` - Updates dot indicator states

### Event Handling
- Scroll listener for automatic dot indicator updates
- Touch start/end listeners for swipe functionality
- Click handlers for dot indicators

## Integration Plan
This mockup serves as the basis for implementing a carousel view in the PositionDetail component's Journal Entries accordion. The implementation will:
1. Replace the current vertical list of journal entries with a horizontal carousel
2. Maintain all existing functionality (loading, error handling, empty states)
3. Add the navigation controls demonstrated in the mockup
4. Preserve the data structure and display format of journal entries

## Next Steps
1. Review and approve the mockup design
2. Proceed with implementation in the PositionDetail component