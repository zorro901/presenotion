# Data Model: Notion to Slides

**Feature**: 001-notion-to-slides
**Date**: 2025-11-10
**Purpose**: Define core data structures for slide generation and presentation

## Core Entities

### 1. NotionBlock

Represents a single content block extracted from the Notion page DOM.

```typescript
interface NotionBlock {
  id: string;                    // Notion's data-block-id or generated UUID
  type: NotionBlockType;         // Block content type
  content: string;               // Text content (empty for non-text blocks)
  level?: number;                // Heading level (1-6), only for heading blocks
  formatting?: TextFormatting[]; // Inline formatting markers
  imageUrl?: string;             // Image source URL, only for image blocks
  imageAlt?: string;             // Image alt text for accessibility
  listItems?: string[];          // List item contents, only for list blocks
  listType?: 'bullet' | 'numbered'; // List type, only for list blocks
  codeLanguage?: string;         // Code block language, only for code blocks
}

enum NotionBlockType {
  HEADING = 'heading',
  PARAGRAPH = 'paragraph',
  BULLET_LIST = 'bullet_list',
  NUMBERED_LIST = 'numbered_list',
  IMAGE = 'image',
  CODE = 'code',
  QUOTE = 'quote',
  DIVIDER = 'divider',
  UNSUPPORTED = 'unsupported'
}

interface TextFormatting {
  type: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code';
  start: number; // Character index where formatting starts
  end: number;   // Character index where formatting ends
}
```

**Validation Rules**:
- `id` must be unique within a page parse session
- `type` must be a valid NotionBlockType enum value
- `level` must be 1-6 if present (per Notion heading levels)
- `content` is required for text-based blocks (heading, paragraph, quote)
- `imageUrl` must be a valid URL if present
- `listItems` must be non-empty array for list blocks

**State Transitions**:
- NotionBlock is immutable once created (no state changes)
- Blocks are created during DOM parsing phase
- Blocks are consumed during slide generation phase

---

### 2. Slide

Represents a single presentation slide derived from Notion content.

```typescript
interface Slide {
  id: string;                   // Generated UUID for slide
  index: number;                // 0-based slide position in deck
  title: string;                // Slide title (from H1 heading or "Untitled")
  blocks: NotionBlock[];        // Content blocks belonging to this slide
  estimatedHeight: number;      // Calculated content height in pixels
  fontSize: number;             // Calculated font size after scaling (12-24px)
  metadata: SlideMetadata;      // Additional slide information
}

interface SlideMetadata {
  hasImages: boolean;           // True if slide contains images
  hasCode: boolean;             // True if slide contains code blocks
  hasLists: boolean;            // True if slide contains lists
  blockCount: number;           // Total number of blocks in slide
  wordCount: number;            // Approximate word count for content density
}
```

**Validation Rules**:
- `id` must be unique within a slide deck
- `index` must be sequential (0, 1, 2, ...) within deck
- `title` defaults to "Untitled Slide" if no H1 heading found
- `blocks` must contain at least one block (or empty state handled separately)
- `fontSize` must be within range [12, 24] pixels per FR-015
- `estimatedHeight` used for font scaling calculation

**State Transitions**:
1. **Created**: Slide generated with default fontSize=24px
2. **Measured**: estimatedHeight calculated after initial render
3. **Scaled**: fontSize adjusted if content exceeds viewport
4. **Rendered**: Slide displayed to user

---

### 3. SlideDeck

Represents the complete collection of slides from a Notion page.

```typescript
interface SlideDeck {
  id: string;                   // Generated UUID for deck
  sourcePageUrl: string;        // Notion page URL
  slides: Slide[];              // Ordered array of slides
  totalSlides: number;          // Convenience count (slides.length)
  createdAt: Date;              // Timestamp when deck was generated
  parsingErrors: ParsingError[]; // Any errors during DOM parsing
}

interface ParsingError {
  blockId?: string;             // Notion block ID where error occurred
  message: string;              // Human-readable error description
  blockType?: NotionBlockType;  // Type of block that failed to parse
}
```

**Validation Rules**:
- `slides` array must be ordered by `slide.index`
- `totalSlides` must equal `slides.length`
- `sourcePageUrl` must be a valid notion.so domain URL
- `parsingErrors` collected but do not block deck creation (graceful degradation)

**State Transitions**:
1. **Parsing**: Extracting NotionBlocks from DOM
2. **Generation**: Converting blocks to Slides
3. **Ready**: Deck ready for presentation
4. **Presenting**: User navigating slides
5. **Closed**: Presentation ended, deck garbage collected

---

### 4. NavigationState

Manages current position and history in slide presentation.

```typescript
interface NavigationState {
  currentSlideIndex: number;    // 0-based index of currently displayed slide
  totalSlides: number;          // Total slide count in deck
  history: number[];            // Stack of previously visited slide indices
  isFullscreen: boolean;        // True if presentation in fullscreen mode
}
```

**Validation Rules**:
- `currentSlideIndex` must be within bounds [0, totalSlides - 1]
- `history` used for "back" navigation (not implemented in MVP)
- `isFullscreen` initially false, toggled by user action

**State Transitions**:
- `currentSlideIndex` changes on navigation (arrows, Home, End, number jump)
- `history` appends previous index on each navigation
- `isFullscreen` toggles on F11 or fullscreen API call

---

### 5. ExtensionMessage

Defines message passing protocol between extension components.

```typescript
interface ExtensionMessage {
  action: MessageAction;
  payload?: any;                // Action-specific data
  timestamp: number;            // Message creation timestamp
}

enum MessageAction {
  START_PRESENTATION = 'start_presentation',
  CLOSE_PRESENTATION = 'close_presentation',
  NAVIGATE_NEXT = 'navigate_next',
  NAVIGATE_PREVIOUS = 'navigate_previous',
  NAVIGATE_TO_SLIDE = 'navigate_to_slide',
  PARSING_ERROR = 'parsing_error',
  PARSING_COMPLETE = 'parsing_complete'
}

// Specific message types
interface StartPresentationMessage extends ExtensionMessage {
  action: MessageAction.START_PRESENTATION;
  payload: {
    pageUrl: string;            // Current Notion page URL
  };
}

interface NavigateToSlideMessage extends ExtensionMessage {
  action: MessageAction.NAVIGATE_TO_SLIDE;
  payload: {
    slideIndex: number;         // Target slide index
  };
}

interface ParsingCompleteMessage extends ExtensionMessage {
  action: MessageAction.PARSING_COMPLETE;
  payload: {
    deck: SlideDeck;            // Generated slide deck
  };
}
```

**Validation Rules**:
- `action` must be a valid MessageAction enum value
- `timestamp` used for message ordering and debugging
- `payload` structure depends on `action` type

**Message Flow**:
1. **Popup → Content Script**: `START_PRESENTATION` with pageUrl
2. **Content Script → Content Script**: `PARSING_COMPLETE` with deck
3. **SlideViewer → SlideViewer**: `NAVIGATE_*` for internal navigation
4. **SlideViewer → Content Script**: `CLOSE_PRESENTATION` to cleanup

---

## Relationships

```
SlideDeck
  ├── slides: Slide[]
  │   ├── blocks: NotionBlock[]
  │   └── metadata: SlideMetadata
  └── parsingErrors: ParsingError[]

NavigationState
  └── currentSlideIndex → Slide (via SlideDeck.slides[index])
```

**Key Relationships**:
- **SlideDeck has many Slides** (1:N): One deck contains multiple slides
- **Slide has many NotionBlocks** (1:N): One slide contains multiple content blocks
- **NavigationState references Slide** (1:1): Current state points to one active slide

---

## Data Flow

### 1. Parsing Phase

```
Notion DOM
  ↓ (DOM traversal)
NotionBlock[]
  ↓ (grouping by H1 headings)
Slide[] (with default fontSize=24px)
  ↓ (aggregation)
SlideDeck
```

### 2. Rendering Phase

```
SlideDeck.slides[currentSlideIndex]
  ↓ (render to DOM)
Measure estimatedHeight
  ↓ (if > viewport)
Calculate fontSize via font scaling algorithm
  ↓ (apply styles)
Display Slide to user
```

### 3. Navigation Phase

```
Keyboard Event
  ↓ (key handler)
Update NavigationState.currentSlideIndex
  ↓ (trigger re-render)
Render new Slide
```

---

## Performance Considerations

### Memory

- **SlideDeck**: ~10KB per typical deck (20 slides, 200 blocks)
- **NavigationState**: <1KB (primitive values only)
- **Total**: <50KB for large presentations (100 slides)

### Computation

- **Parsing**: O(n) where n = number of DOM elements
- **Slide Generation**: O(m) where m = number of blocks
- **Font Scaling**: O(1) per slide (single calculation)
- **Navigation**: O(1) (index lookup)

### Optimization Strategies

1. **Lazy Rendering**: Only render current slide + adjacent slides (not implemented in MVP)
2. **Memoization**: Cache font size calculations (implemented via React.memo)
3. **Debouncing**: Debounce window resize events for font recalculation (300ms delay)

---

## Accessibility

All entities support accessibility requirements (Constitution IV):

- **NotionBlock**: Preserves `imageAlt` for screen readers
- **Slide**: `title` used as slide heading for navigation
- **NavigationState**: Announces slide changes to screen readers
- **ARIA attributes**: Each slide has `role="region"` and `aria-label="Slide X of Y"`

---

## Testing Strategies

### Unit Tests (Vitest)

- **NotionBlock**: Validate creation, type checking, formatting extraction
- **Slide**: Test font scaling algorithm, metadata calculation
- **SlideDeck**: Validate slide ordering, error collection

### Integration Tests (Vitest)

- **DOM Parsing**: Mock Notion DOM structure, verify NotionBlock extraction
- **Slide Generation**: Test H1 boundary detection, block grouping

### E2E Tests (Playwright)

- **Full Flow**: Parse real Notion page, verify SlideDeck structure
- **Navigation**: Test NavigationState transitions via keyboard events
- **Accessibility**: Verify ARIA attributes with axe-core

---

## Future Extensions (Out of MVP Scope)

- **SlideTheme**: Support dark/light mode themes
- **SlideExport**: Add export format (PDF, PNG) entity
- **SlideCustomization**: User preferences for aspect ratio, font families
- **SlideAnimation**: Transition effects between slides

*These are noted for future consideration but not included in data model MVP.*
