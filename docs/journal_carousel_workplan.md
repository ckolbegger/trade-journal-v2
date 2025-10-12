# Journal Entries Carousel Workplan

This plan maps the current vertical journal entry list in `PositionDetail` to the carousel experience shown in `@mockups/static-html/PositionDetails-JournalEntryCarousel.html`. Each deliverable maintains a functional app and follows TDD.

## Deliverable 1 – Extract & Scaffold Carousel Wrapper

**Acceptance Criteria**
- `PositionDetail` renders its journal entries through a new `JournalEntriesCarousel` component.
- Visual layout stays vertically stacked; navigation controls are not yet present.
- Data ordering (chronological), empty state, loading state, and error handling match current behavior.

**Tasks**
- Review the existing journal section in `PositionDetail` to confirm inputs, ordering, and edge cases.
- Write failing tests for a new `JournalEntriesCarousel` component covering render order and empty/error states.
- Implement the minimal component: accepts `entries`, `loading`, `error` props and renders the same markup as today.
- Swap `PositionDetail` to use `JournalEntriesCarousel` in place of the inline list.
- Update any affected integration tests that reference the old DOM structure.
- Run unit, integration, and lint checks.

**Tests**
```ts
describe('JournalEntriesCarousel', () => {
  it('renders entries in chronological order', () => {})
  it('shows the empty state when no entries exist', () => {})
  it('surfaces loading and error messages', () => {})
})
```

## Deliverable 2 – Navigation Logic & Structure

**Acceptance Criteria**
- Carousel displays a single journal entry at a time within slide containers.
- Previous/next buttons and dot indicators update the visible entry.
- Navigation buttons disable appropriately on first/last slides.
- Carousel resets to the first slide when the entry collection changes.

**Tasks**
- Define component state (`activeIndex`) and update behavior when `entries` changes.
- Add failing tests for next/previous controls, dot indicators, and reset behavior.
- Implement slide wrapper markup (outer container, track, slide items) and navigation controls.
- Ensure controls are accessible (buttons, aria labels, focus states).
- Re-run test suites.

**Tests**
```ts
describe('JournalEntriesCarousel navigation', () => {
  it('shows the next entry when the next button is clicked', () => {})
  it('disables the previous button on the first slide', () => {})
  it('activates the dot for the current slide', () => {})
  it('resets to the first slide when entries change', () => {})
})
```

## Deliverable 3 – Visual Styling & Integration Polish

**Acceptance Criteria**
- Carousel styling aligns with the mockup (card appearance, navigation bar, dots) using Tailwind utilities.
- Navigation bar and slide cards present correctly within the existing `PositionDetail` layout.
- No regressions in journal-related behavior or testing.

**Tasks**
- Translate mockup styling into Tailwind class combinations and design tokens (spacing, borders, colors).
- Add DOM-structure/layout tests asserting presence of navigation bar, arrow buttons, dots, and entry card wrapper.
- Apply styling updates to `JournalEntriesCarousel`, ensuring responsive behavior at the mobile breakpoint.
- Manually compare rendered component to the mockup.
- Run lint, unit, and integration tests.

**Tests**
```ts
describe('JournalEntriesCarousel layout', () => {
  it('renders the navigation bar with arrows and dots', () => {})
  it('wraps each journal entry in the styled card container', () => {})
})
```

## Deliverable 4 – Swipe Gesture Support

**Acceptance Criteria**
- Touch swipes navigate between slides, matching arrow navigation rules (boundaries respected).
- Short/insufficient swipes do not trigger navigation.
- Buttons and dots remain functional alongside swipe support.

**Tasks**
- Choose gesture implementation approach (React pointer/touch events) and define swipe threshold.
- Add failing tests simulating left/right swipe sequences and verifying navigation behavior.
- Implement swipe handlers with cleanup and accessibility considerations.
- Validate that swipe support does not introduce console warnings or regressions.
- Run the full test suite.

**Tests**
```ts
describe('JournalEntriesCarousel touch gestures', () => {
  it('advances to the next slide on a left swipe', () => {})
  it('does not change slides on an insufficient swipe distance', () => {})
  it('moves to the previous slide on a right swipe', () => {})
})
```
