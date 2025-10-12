### **Project: Journal Entry Carousel Implementation**

**Goal:** Refactor the journal entry display in the `PositionDetail` view from a vertical list to a fully functional and styled carousel, as specified in the `PositionDetails-JournalEntryCarousel.html` mockup.

---

### **Deliverable 1: Foundational Carousel Component and Initial Integration**

**Acceptance Criteria:**
*   A new `JournalCarousel` component is created and integrated into the `PositionDetail` page.
*   The carousel will only display the *most recent* journal entry.
*   The old vertical list of journal entries is no longer visible.
*   No interactive carousel functionality (like next/previous buttons) will be present yet.

**Tasks:**

1.  **Create Component Files:**
    *   Create `src/components/JournalCarousel.tsx`.
    *   Create `src/components/__tests__/JournalCarousel.test.tsx`.

2.  **Write Failing Test for Basic Rendering:**
    *   **describe:** `<JournalCarousel />`
    *   **it:** `should render the content of a single journal entry`
    *   This test will initially render the component with mock data and assert that the entry's type, date, and field prompts/responses are visible.

3.  **Implement Minimal Component:**
    *   Build the `JournalCarousel` component to accept a single `entry` object as a prop.
    *   Use the basic HTML structure from the mockup for a single slide (`carousel-slide` and `entry-card`).
    *   Write just enough code to make the test pass.

4.  **Write Failing Integration Test:**
    *   **describe:** `<PositionDetail />`
    *   **it:** `should render the JournalCarousel component with the latest journal entry`
    *   This test will render the `PositionDetail` component for a position with multiple journal entries and assert that the `JournalCarousel` is present and the old list format is not.

5.  **Integrate the Component:**
    *   Modify `src/pages/PositionDetail.tsx`.
    *   Import the new `JournalCarousel` component.
    *   Replace the existing `.map()` loop that renders journal entries with the `<JournalCarousel />`, passing only the most recent entry to it.

---

### **Deliverable 2: Implement Core Carousel Logic**

**Acceptance Criteria:**
*   The `JournalCarousel` component can now accept an array of all journal entries.
*   State is managed internally to track the currently active slide.
*   The component can programmatically change the visible slide, but UI controls are not yet added.

**Tasks:**

1.  **Write Failing Tests for Carousel Logic:**
    *   **describe:** `<JournalCarousel /> with multiple entries`
    *   **it:** `should only display the first entry by default`
    *   **it:** `should display the second entry after a 'next' navigation event`
    *   **it:** `should display the previous entry after a 'previous' navigation event`

2.  **Implement Carousel State and Slide Transitions:**
    *   Refactor `JournalCarousel.tsx` to accept an `entries` array.
    *   Introduce a `currentIndex` state variable, initialized to `0`.
    *   Map over the `entries` array to render all slides inside a `carousel-wrapper` div.
    *   Use CSS `transform: translateX(-${currentIndex * 100}%)` on the wrapper to control the visible slide.
    *   Implement internal `handleNext` and `handlePrevious` functions that update the `currentIndex`. We will trigger these directly in the tests to confirm the logic works before adding UI buttons.

---

### **Deliverable 3: Add UI Navigation Controls (Arrows & Dots)**

**Acceptance Criteria:**
*   "Previous" and "Next" arrow buttons are visible and functional.
*   The "Previous" button is disabled on the first entry, and the "Next" button is disabled on the last.
*   A set of dot indicators is displayed, one for each entry.
*   The dot corresponding to the currently visible entry is visually marked as "active".
*   Clicking a dot navigates directly to that entry's slide.

**Tasks:**

1.  **Write Failing Tests for Navigation UI:**
    *   **describe:** `<JournalCarousel /> navigation controls`
    *   **it:** `should call the next handler when the 'next' button is clicked`
    *   **it:** `should call the previous handler when the 'previous' button is clicked`
    *   **it:** `should disable the 'previous' button when on the first slide`
    *   **it:** `should disable the 'next' button when on the last slide`
    *   **it:** `should render a dot for each journal entry`
    *   **it:** `should apply an 'active' style to the dot for the current slide`
    *   **it:** `should navigate to the correct slide when a dot is clicked`

2.  **Implement the Navigation UI:**
    *   Add the HTML for the `carousel-nav` container, including the arrow buttons and the `carousel-dots` container, based on the mockup.
    *   Connect the `onClick` handlers of the buttons to the `handleNext` and `handlePrevious` functions.
    *   Implement the disabled logic based on the `currentIndex` and the total number of entries.
    *   Render the dots based on the `entries` array length and apply the active style.
    *   Add a `handleGoToSlide(index)` function and attach it to the `onClick` handler for each dot.

---

### **Deliverable 4: Final Styling and Polish**

**Acceptance Criteria:**
*   The `JournalCarousel` component and its contents perfectly match the visual appearance of the mockup.
*   The component is correctly nested and functions within the "Journal Entries" accordion.

**Tasks:**

1.  **Apply CSS Styles:**
    *   Add all relevant CSS classes from the mockup to the JSX in `JournalCarousel.tsx`.
    *   This includes styles for the container, wrapper, slides, cards, headers, fields, navigation arrows (including disabled state), and dots (including active state).

2.  **Write Failing Test for Accordion Integration:**
    *   **describe:** `<PositionDetail /> journal section`
    *   **it:** `should display the journal carousel within an accordion`
    *   This test will ensure the final structure matches the mockup's layout, where the carousel is a child of the accordion content panel.

3.  **Final Integration and Verification:**
    *   Review `PositionDetail.tsx` to ensure the accordion and carousel are structured correctly.
    *   Manually inspect the component in the browser to confirm it is pixel-perfect against the mockup and that all interactions (clicking, disabling, etc.) are smooth.
