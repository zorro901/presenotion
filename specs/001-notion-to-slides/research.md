# Research: Notion to Slides Extension

**Feature**: 001-notion-to-slides
**Date**: 2025-11-10
**Purpose**: Resolve technical unknowns and establish technology choices for implementation

## Research Items

### 1. Testing Framework Selection

**Question**: Which testing frameworks should be used for unit, integration, and E2E testing?

**Options Evaluated**:

| Framework | Type | Pros | Cons |
|-----------|------|------|------|
| Vitest | Unit/Integration | Fast, Vite-native, Jest-compatible API, TypeScript support | Newer, smaller ecosystem than Jest |
| Jest | Unit/Integration | Industry standard, large ecosystem, extensive documentation | Slower than Vitest, ESM support issues |
| Playwright | E2E | Official Microsoft support, cross-browser, Chrome extension testing support | Heavier setup, learning curve |
| Puppeteer | E2E | Chrome-focused, simpler API for extension testing | Chrome-only, less cross-browser support |

**Decision**: **Vitest** for unit/integration, **Playwright** for E2E

**Rationale**:
- **Vitest chosen** because project already uses Vite 6.3+, making Vitest the natural choice for fast, integrated testing
- Vitest has Jest-compatible API, reducing learning curve
- Vitest's native ESM and TypeScript support aligns with project's tech stack
- **Playwright chosen** for E2E because it has better Chrome extension testing capabilities
- Playwright can load unpacked extensions and interact with extension pages
- Playwright's multi-browser support future-proofs testing for Firefox compatibility

**Alternatives Considered**:
- Jest rejected due to ESM/Vite configuration complexity
- Puppeteer rejected due to lack of Firefox support (extension targets Firefox via webextension-polyfill)

**Implementation Notes**:
- Install: `npm install -D vitest @vitest/ui`
- Install: `npm install -D playwright @playwright/test`
- Configure: `vitest.config.ts` for unit/integration tests
- Configure: `playwright.config.ts` for E2E extension tests with `--load-extension` flag

---

### 2. Notion DOM Parsing Strategy

**Question**: How should the extension reliably parse Notion's dynamic DOM structure?

**Research Findings**:

Notion uses a Shadow DOM architecture with:
- Content blocks as `div[data-block-id]` elements
- Headings identified by `role="heading"` and `aria-level` attributes
- Text content in `div[data-content-editable-leaf="true"]` elements
- Images in `img` tags within specific block types
- Lists as nested `div` structures with specific class patterns

**Parsing Approach Options**:

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| CSS Selectors | Query specific Notion class names/attributes | Simple, direct | Fragile, breaks with Notion updates |
| ARIA roles | Use semantic ARIA attributes | More stable, accessibility-aligned | Less granular |
| MutationObserver | Watch DOM changes dynamically | Robust to updates | Complex, performance overhead |
| Hybrid | ARIA for structure + CSS for details | Balanced stability/precision | Moderate complexity |

**Decision**: **Hybrid approach** - ARIA roles for primary structure, CSS selectors as fallback

**Rationale**:
- ARIA attributes (`role="heading"`, `aria-level`) are semantically meaningful and less likely to change
- CSS selectors (`data-block-id`, content-editable markers) provide detail when ARIA insufficient
- Graceful degradation: If CSS classes change, ARIA roles still provide basic structure
- Aligns with Constitution principle IV (Accessibility) by leveraging semantic HTML

**Implementation Strategy**:
1. Use `querySelectorAll('[role="heading"][aria-level="1"]')` for H1 detection
2. Traverse DOM tree from each H1 to collect associated content blocks
3. Fall back to `data-block-id` attributes for block boundaries
4. Extract text from `[data-content-editable-leaf]` elements
5. Detect lists via `role="list"` and `role="listitem"`
6. Handle images via standard `img` tag queries

**Error Handling**:
- If parsing fails, show user message: "Unable to parse page content. Please report this issue."
- Log DOM structure to console for debugging Notion updates

---

### 3. Font Scaling Algorithm

**Question**: How should the extension automatically reduce font size to fit long content (FR-015)?

**Research Findings**:

Slide content overflow strategies:
- **Fixed font reduction**: Reduce by percentage steps (e.g., 20%, 40%, 60%)
- **Dynamic calculation**: Measure content height vs viewport, calculate scale factor
- **Binary search**: Iteratively test font sizes until content fits
- **CSS-based**: Use `transform: scale()` or `font-size: clamp()`

**Decision**: **Dynamic calculation with viewport ratio**

**Rationale**:
- Measure content height after initial render at base font size
- Calculate scale factor: `min(1.0, viewportHeight / contentHeight)`
- Apply scale factor to base font size
- Minimum font size: 12px (readability threshold)
- Maximum reduction: 70% of base size (beyond that, content is too dense)

**Algorithm**:
```typescript
function calculateFontSize(contentHeight: number, viewportHeight: number): number {
  const BASE_FONT_SIZE = 24; // Base slide font size in px
  const MIN_FONT_SIZE = 12;  // Minimum readable size

  const scaleFactor = Math.min(1.0, viewportHeight / contentHeight);
  const calculatedSize = BASE_FONT_SIZE * scaleFactor;

  return Math.max(MIN_FONT_SIZE, calculatedSize);
}
```

**Performance Consideration**:
- Calculation runs once per slide on initial render
- Re-run only on window resize events (debounced)
- Avoid layout thrashing by batching DOM measurements

**User Experience**:
- If font size reaches minimum (12px) and content still overflows, show warning icon
- Future enhancement: Allow users to manually scroll within slide as escape hatch

---

### 4. Slide Navigation State Management

**Question**: How should the extension manage slide state and keyboard event handling?

**Options**:

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| React useState | Simple state in component | Easy, React-native | Re-renders, prop drilling |
| React Context | Global state via Context API | Avoids prop drilling | Overkill for simple state |
| useReducer | Reducer pattern for complex state | Predictable state transitions | More boilerplate |
| External library | Zustand/Redux | Professional state management | Unnecessary dependency |

**Decision**: **React useState with custom hook**

**Rationale**:
- State is simple: `currentSlideIndex`, `totalSlides`, `slides` array
- Single component (SlideViewer) manages state
- Custom hook `useSlideNavigation()` encapsulates keyboard logic
- No need for global state or complex state transitions
- Keeps bundle size minimal (no external dependencies)

**Implementation**:
```typescript
interface SlideNavigationHook {
  currentSlide: number;
  totalSlides: number;
  goToNext: () => void;
  goToPrevious: () => void;
  goToSlide: (index: number) => void;
  close: () => void;
}

function useSlideNavigation(slides: Slide[]): SlideNavigationHook {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'ArrowRight': goToNext(); break;
        case 'ArrowLeft': goToPrevious(); break;
        case 'Escape': close(); break;
        // ... other shortcuts
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSlide]);

  // ... implementation
}
```

---

### 5. Content Script vs Popup Activation

**Question**: Should slide activation be triggered from content script or popup?

**Research Findings**:

| Approach | How it works | Pros | Cons |
|----------|--------------|------|------|
| Popup | User clicks extension icon, popup sends message to content script | Explicit user action, clear UX | Extra click, popup UI needed |
| Content Script Button | Inject floating button on Notion pages | Always visible, faster activation | Visual pollution, conflicts with Notion UI |
| Keyboard Shortcut | Register command in manifest | Fastest, power-user friendly | Discoverability issue, potential conflicts |

**Decision**: **Popup trigger** (primary) + **Keyboard shortcut** (secondary)

**Rationale**:
- Popup provides clear, discoverable activation method for new users
- Extension icon shows availability (only on Notion pages)
- Keyboard shortcut (e.g., `Ctrl+Shift+P`) for power users
- Avoids injecting UI elements into Notion page (respects Notion's design)

**Activation Flow**:
1. User on Notion page → Extension icon enabled
2. User clicks icon → Popup opens with "Start Presentation" button
3. Popup sends message to content script: `{action: "startPresentation"}`
4. Content script parses page, injects SlideViewer overlay
5. Alternative: User presses `Ctrl+Shift+P` → directly triggers content script

**Manifest Configuration**:
```json
{
  "action": {
    "default_popup": "src/pages/popup/index.html"
  },
  "commands": {
    "start-presentation": {
      "suggested_key": {
        "default": "Ctrl+Shift+P"
      },
      "description": "Start Notion slide presentation"
    }
  }
}
```

---

## Summary of Technical Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Unit Testing** | Vitest | Vite-native, fast, Jest-compatible |
| **E2E Testing** | Playwright | Chrome extension support, cross-browser |
| **DOM Parsing** | Hybrid (ARIA + CSS selectors) | Stability + precision balance |
| **Font Scaling** | Dynamic viewport ratio calculation | Adaptive, performance-conscious |
| **State Management** | React useState + custom hook | Simple, minimal dependencies |
| **Activation** | Popup + keyboard shortcut | Discoverability + power-user efficiency |

## Dependencies to Add

```json
{
  "devDependencies": {
    "vitest": "^2.1.8",
    "@vitest/ui": "^2.1.8",
    "playwright": "^1.51.0",
    "@playwright/test": "^1.51.0",
    "@axe-core/playwright": "^4.10.2"
  }
}
```

## Next Steps

- **Phase 1**: Define data model (Slide, NotionBlock interfaces)
- **Phase 1**: Create contracts (content script message API)
- **Phase 1**: Write quickstart guide for development setup
- **Phase 2**: Generate tasks.md from plan and spec

## Open Questions (for future consideration)

- **Theme support**: Should slides support dark/light themes matching Notion?
- **Export**: Should users be able to export slides as PDF/images?
- **Customization**: Should users customize slide layout (aspect ratio, font sizes)?

*These are out of scope for MVP but noted for future enhancements.*
