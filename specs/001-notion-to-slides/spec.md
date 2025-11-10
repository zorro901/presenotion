# Feature Specification: Notion to Slides Chrome Extension

**Feature Branch**: `001-notion-to-slides`
**Created**: 2025-11-10
**Status**: Draft
**Input**: User description: "notionページをスライドにするchrome拡張機能を作りたい ローカル通信のみで実行可能"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Basic Notion Page to Slide Conversion (Priority: P1)

As a Notion user, I want to convert my Notion page into a presentation slide format with a single click, so I can quickly present my documentation without manual reformatting.

**Why this priority**: This is the core value proposition of the extension. Without this basic conversion capability, no other features matter. Users need to see immediate value from installing the extension.

**Independent Test**: Can be fully tested by opening any Notion page, clicking the extension icon, and verifying that the page content is displayed in a slide presentation format. Delivers immediate value of presenting Notion content without leaving the browser.

**Acceptance Scenarios**:

1. **Given** a user is viewing a Notion page with headings and text content, **When** they click the extension icon in the Chrome toolbar, **Then** the extension opens a slide view showing the first slide derived from the page content
2. **Given** a Notion page with multiple H1 headings, **When** the extension converts it to slides, **Then** each H1 heading becomes a separate slide with its associated content
3. **Given** a slide presentation is open, **When** the user presses the right arrow key or clicks a next button, **Then** the presentation advances to the next slide
4. **Given** a slide presentation is open, **When** the user presses the left arrow key or clicks a previous button, **Then** the presentation goes back to the previous slide
5. **Given** a slide presentation is open, **When** the user presses the Escape key or clicks a close button, **Then** the presentation view closes and the user returns to the original Notion page

---

### User Story 2 - Content Structure Preservation (Priority: P2)

As a presenter, I want my Notion page's formatting (bold, italic, lists, images) to be preserved in the slides, so the presentation looks professional and maintains the intended emphasis.

**Why this priority**: While basic conversion is essential, preserving formatting significantly improves presentation quality. This transforms the tool from "functional" to "professional quality." It's not blocking for MVP but greatly enhances user satisfaction.

**Independent Test**: Create a Notion page with various formatting (bold text, bullet lists, numbered lists, images, code blocks), convert to slides, and verify all formatting appears correctly in the slide view.

**Acceptance Scenarios**:

1. **Given** a Notion page with bold and italic text, **When** converted to slides, **Then** the text formatting is preserved in the slide display
2. **Given** a Notion page with bullet lists, **When** converted to slides, **Then** lists appear as formatted lists in the slides
3. **Given** a Notion page with embedded images, **When** converted to slides, **Then** images are displayed in the slides at appropriate sizes
4. **Given** a Notion page with code blocks, **When** converted to slides, **Then** code appears in a monospace font with syntax preservation

---

### User Story 3 - Slide Navigation and Controls (Priority: P3)

As a presenter, I want keyboard shortcuts and visual controls for navigating slides, so I can efficiently move through my presentation during a live session.

**Why this priority**: Enhanced navigation improves presentation experience but the basic arrow key navigation from P1 is sufficient for MVP. Additional controls (slide numbers, progress indicator, jump to slide) are quality-of-life improvements.

**Independent Test**: Open a slide presentation and verify that all navigation methods (keyboard shortcuts, on-screen buttons, slide counter) work correctly and provide clear feedback about current position.

**Acceptance Scenarios**:

1. **Given** a slide presentation is open, **When** the user views the screen, **Then** a slide counter shows "slide X of Y" where X is current slide and Y is total slides
2. **Given** a slide presentation is open, **When** the user presses the Home key, **Then** the presentation jumps to the first slide
3. **Given** a slide presentation is open, **When** the user presses the End key, **Then** the presentation jumps to the last slide
4. **Given** a slide presentation is open, **When** the user presses a number key (1-9) followed by Enter, **Then** the presentation jumps to that slide number if it exists

---

### Edge Cases

- What happens when a Notion page has no headings? *System should treat the entire page as a single slide*
- What happens when a Notion page is empty? *Extension should show a message: "This page has no content to display as slides"*
- What happens when a Notion page contains very long paragraphs that don't fit on one slide? *System should automatically reduce font size to fit content within the slide viewport*
- What happens when a Notion page has nested headings (H1 > H2 > H3)? *Only H1 headings create new slides; H2 and H3 headings are displayed as subsections within the same slide*
- What happens when a Notion page contains unsupported content types (databases, embeds, formulas)? *Extension should display a placeholder text like "[Unsupported content type: database]"*
- What happens when the user tries to use the extension on a non-Notion page? *Extension icon should be disabled/grayed out on non-Notion domains*
- What happens when Notion's DOM structure changes? *Extension may fail gracefully with an error message: "Unable to parse page content. Please report this issue."*
- What happens when the user is offline? *Since all processing is local, the extension should still work if the Notion page is already loaded*

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Extension MUST only activate when the user is viewing a Notion page (notion.so domain)
- **FR-002**: Extension MUST parse Notion page content entirely within the browser without sending data to external servers
- **FR-003**: Extension MUST extract text content, headings, and formatting from the current Notion page
- **FR-004**: Extension MUST generate slides by treating H1 headings as slide boundaries (H2 and H3 headings remain within the same slide as subsections)
- **FR-005**: Extension MUST display slides in a full-screen or overlay view mode
- **FR-006**: Extension MUST provide navigation controls (previous, next, close) accessible via keyboard and mouse
- **FR-007**: Extension MUST support keyboard shortcuts: arrow keys for navigation, Escape to close
- **FR-008**: Extension MUST preserve basic text formatting (bold, italic, underline) from Notion content
- **FR-009**: Extension MUST handle bullet lists and numbered lists
- **FR-010**: Extension MUST display images embedded in Notion pages
- **FR-011**: Extension MUST show current slide number and total slide count
- **FR-012**: Extension MUST process all content locally without requiring internet connectivity after page load
- **FR-013**: Extension MUST not store or persist any Notion page data outside the current browser session
- **FR-014**: Extension MUST gracefully handle pages with no headings by displaying content as a single slide
- **FR-015**: Extension MUST automatically adjust font size to fit long content within the slide viewport without requiring scrolling

### Key Entities

- **Notion Page**: The source document being converted, containing headings, paragraphs, lists, images, and other content blocks
- **Slide**: A derived unit of presentation, typically corresponding to a heading and its associated content
- **Slide Deck**: The complete collection of slides generated from a single Notion page
- **Navigation State**: Current slide index, total slide count, and navigation history

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can convert a Notion page to slides and start presenting in under 5 seconds from clicking the extension icon
- **SC-002**: Extension successfully parses and displays at least 90% of common Notion content types (text, headings, lists, images)
- **SC-003**: Slide navigation responds to user input (keyboard/mouse) in under 100 milliseconds
- **SC-004**: Extension works without internet connectivity after the Notion page has loaded
- **SC-005**: Users can navigate through a 20-slide presentation without encountering rendering errors or performance degradation
- **SC-006**: Extension activates only on Notion pages and remains inactive on all other websites
- **SC-007**: No user data is transmitted outside the local browser environment (verifiable via network monitoring)

## Assumptions

- Users have basic familiarity with Notion and understand its content structure
- Notion pages are already loaded and accessible in the browser before extension activation
- Users access Notion through the standard web interface (notion.so domain)
- Only H1 headings create new slides; H2 and H3 are subsections within slides
- Long content that doesn't fit will trigger automatic font size reduction for readability
- Presentation aspect ratio will be 16:9 (standard presentation format)
- Browser supports modern JavaScript APIs for DOM manipulation and keyboard event handling
- Extension will target Chrome manifest V3 as specified in the project's existing structure
