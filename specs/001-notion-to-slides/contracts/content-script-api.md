# Content Script API Contract

**Feature**: 001-notion-to-slides
**Version**: 1.0.0
**Date**: 2025-11-10
**Purpose**: Define message passing protocol between extension components

## Overview

The Notion to Slides extension uses Chrome's message passing API to communicate between:
- **Popup** (user interface trigger)
- **Content Script** (Notion page parser and slide injector)
- **Background Script** (optional coordinator, may not be needed for MVP)

All messages follow the `ExtensionMessage` interface defined in data-model.md.

---

## API Endpoints

### 1. Start Presentation

**Direction**: Popup → Content Script
**Trigger**: User clicks "Start Presentation" button in popup
**Purpose**: Initiate Notion page parsing and slide generation

**Request**:
```typescript
{
  action: "start_presentation",
  payload: {
    pageUrl: string; // Current Notion page URL (for validation)
  },
  timestamp: number;
}
```

**Response** (via internal state change):
- Content script parses DOM
- Emits `parsing_complete` message internally
- Injects SlideViewer component into page

**Error Handling**:
- If not on Notion page → Send `parsing_error` with message: "Not on a Notion page"
- If page has no content → Send `parsing_error` with message: "Page has no content to display"
- If DOM structure unrecognized → Send `parsing_error` with message: "Unable to parse page content"

**Example**:
```javascript
// Popup sends message
chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, {
    action: 'start_presentation',
    payload: { pageUrl: tabs[0].url },
    timestamp: Date.now()
  });
});

// Content script receives
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'start_presentation') {
    startParsing(message.payload.pageUrl);
    sendResponse({ success: true });
  }
});
```

**Performance Requirements** (from SC-001):
- Total time from message receipt to slide display: <5 seconds
- Parsing phase: <2 seconds
- Rendering phase: <3 seconds

---

### 2. Close Presentation

**Direction**: SlideViewer → Content Script (internal)
**Trigger**: User presses Escape key or clicks close button
**Purpose**: Remove slide overlay and return to Notion page

**Request**:
```typescript
{
  action: "close_presentation",
  payload: null,
  timestamp: number;
}
```

**Response**:
- SlideViewer component unmounts
- Slide overlay removed from DOM
- Notion page regains focus

**Example**:
```javascript
// SlideViewer component triggers close
const handleClose = () => {
  window.postMessage({
    action: 'close_presentation',
    timestamp: Date.now()
  }, '*');
};

// Content script listens
window.addEventListener('message', (event) => {
  if (event.data.action === 'close_presentation') {
    unmountSlideViewer();
  }
});
```

**Performance Requirements** (from SC-003):
- Close action completes in <100ms

---

### 3. Navigate to Slide

**Direction**: SlideViewer → SlideViewer (internal state)
**Trigger**: Keyboard shortcuts (Arrow keys, Home, End, number keys)
**Purpose**: Change displayed slide

**Request**:
```typescript
{
  action: "navigate_to_slide",
  payload: {
    slideIndex: number; // Target slide index (0-based)
  },
  timestamp: number;
}
```

**Response**:
- NavigationState.currentSlideIndex updated
- Slide component re-renders with new slide
- Slide counter updates

**Validation**:
- `slideIndex` must be within bounds [0, totalSlides - 1]
- If out of bounds, clamp to nearest valid index

**Example**:
```javascript
const handleNavigation = (direction: 'next' | 'previous' | number) => {
  let targetIndex = currentSlideIndex;

  if (direction === 'next') targetIndex++;
  else if (direction === 'previous') targetIndex--;
  else targetIndex = direction;

  // Clamp to valid range
  targetIndex = Math.max(0, Math.min(totalSlides - 1, targetIndex));

  setCurrentSlideIndex(targetIndex);
};
```

**Performance Requirements** (from SC-003):
- Navigation response time: <100ms from keypress to render

---

### 4. Parsing Complete (Internal)

**Direction**: Content Script → Content Script
**Trigger**: DOM parsing finishes successfully
**Purpose**: Signal that SlideDeck is ready for rendering

**Event**:
```typescript
{
  action: "parsing_complete",
  payload: {
    deck: SlideDeck; // Generated slide deck
  },
  timestamp: number;
}
```

**Response**:
- SlideViewer component mounts
- Initial slide (index 0) rendered
- Keyboard event listeners attached

**Example**:
```javascript
// Parser emits event
const onParsingComplete = (deck: SlideDeck) => {
  window.dispatchEvent(new CustomEvent('parsing_complete', {
    detail: { deck }
  }));
};

// SlideViewer listens
useEffect(() => {
  const handleComplete = (event: CustomEvent) => {
    setSlideDeck(event.detail.deck);
    setIsReady(true);
  };

  window.addEventListener('parsing_complete', handleComplete);
  return () => window.removeEventListener('parsing_complete', handleComplete);
}, []);
```

---

### 5. Parsing Error

**Direction**: Content Script → Popup (optional)
**Trigger**: DOM parsing fails
**Purpose**: Notify user of error

**Event**:
```typescript
{
  action: "parsing_error",
  payload: {
    message: string;         // User-friendly error message
    technicalDetails?: string; // Debug information (optional)
  },
  timestamp: number;
}
```

**Error Messages** (mapped to edge cases):
- "Not on a Notion page" → Extension activated on non-Notion domain
- "Page has no content to display as slides" → Empty Notion page (FR-014 edge case)
- "Unable to parse page content. Please report this issue." → DOM structure unrecognized

**Example**:
```javascript
const handleParsingError = (message: string) => {
  // Show error in slide viewer overlay
  renderErrorMessage(message);

  // Optionally log to console for debugging
  console.error('[Notion to Slides]', message);
};
```

---

## Keyboard Shortcut Commands

These are handled by Chrome's `commands` API in manifest.json, not message passing.

### Start Presentation Shortcut

**Manifest Configuration**:
```json
{
  "commands": {
    "start-presentation": {
      "suggested_key": {
        "default": "Ctrl+Shift+P",
        "mac": "Command+Shift+P"
      },
      "description": "Start Notion slide presentation"
    }
  }
}
```

**Handling**:
```javascript
chrome.commands.onCommand.addListener((command) => {
  if (command === 'start-presentation') {
    // Trigger same flow as popup button
    startParsing(window.location.href);
  }
});
```

---

## Security Considerations

### Message Validation

All incoming messages MUST be validated before processing:

```typescript
function isValidMessage(message: any): message is ExtensionMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    typeof message.action === 'string' &&
    Object.values(MessageAction).includes(message.action) &&
    typeof message.timestamp === 'number'
  );
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!isValidMessage(message)) {
    console.error('Invalid message format:', message);
    return;
  }

  // Process valid message...
});
```

### XSS Protection

When injecting Notion content into slides:
- Use React's JSX (automatic XSS protection)
- Sanitize HTML content if using `dangerouslySetInnerHTML`
- Validate image URLs before rendering `<img>` tags

```typescript
const sanitizeImageUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    // Only allow https:// URLs from trusted domains
    if (parsed.protocol === 'https:' &&
        (parsed.hostname.includes('notion.so') ||
         parsed.hostname.includes('notion-static.com'))) {
      return url;
    }
  } catch {
    return null;
  }
  return null;
};
```

---

## Performance Monitoring

### Timing Metrics

Track message processing times for performance validation:

```typescript
interface PerformanceMetrics {
  parseStart: number;
  parseEnd: number;
  renderStart: number;
  renderEnd: number;
  navigationTimes: number[];
}

const metrics: PerformanceMetrics = {
  parseStart: 0,
  parseEnd: 0,
  renderStart: 0,
  renderEnd: 0,
  navigationTimes: []
};

// Track parsing
metrics.parseStart = performance.now();
const deck = await parseNotionPage();
metrics.parseEnd = performance.now();

// Validate against SC-001: <5 seconds total
const totalTime = metrics.renderEnd - metrics.parseStart;
if (totalTime > 5000) {
  console.warn(`Performance violation: ${totalTime}ms (target: <5000ms)`);
}
```

---

## Testing Strategy

### Unit Tests (Vitest)

Test message validation and processing:

```typescript
describe('ExtensionMessage validation', () => {
  it('validates correct start_presentation message', () => {
    const message = {
      action: 'start_presentation',
      payload: { pageUrl: 'https://notion.so/page-123' },
      timestamp: Date.now()
    };
    expect(isValidMessage(message)).toBe(true);
  });

  it('rejects invalid action', () => {
    const message = {
      action: 'invalid_action',
      timestamp: Date.now()
    };
    expect(isValidMessage(message)).toBe(false);
  });
});
```

### Integration Tests (Vitest)

Mock Chrome APIs and test message flow:

```typescript
describe('Content script message handling', () => {
  it('starts presentation on valid message', async () => {
    const mockSendMessage = vi.fn();
    chrome.runtime.sendMessage = mockSendMessage;

    const message: StartPresentationMessage = {
      action: 'start_presentation',
      payload: { pageUrl: 'https://notion.so/test' },
      timestamp: Date.now()
    };

    await handleMessage(message);
    expect(mockSendMessage).toHaveBeenCalled();
  });
});
```

### E2E Tests (Playwright)

Test full message flow in real Chrome extension:

```typescript
test('popup triggers presentation via message', async ({ page, context }) => {
  // Load extension
  const extensionId = await loadExtension(context);

  // Navigate to Notion page
  await page.goto('https://notion.so/test-page');

  // Click extension popup
  await page.click(`#${extensionId}-popup-button`);

  // Verify slide viewer appears
  await expect(page.locator('.slide-viewer')).toBeVisible({ timeout: 5000 });
});
```

---

## Version History

- **v1.0.0** (2025-11-10): Initial API definition for MVP
  - Start presentation message
  - Close presentation message
  - Navigation messages
  - Error handling
  - Keyboard shortcuts

---

## Future API Extensions (Out of Scope)

- **Export Slide**: Message to trigger PDF/PNG export
- **Theme Toggle**: Message to switch between light/dark themes
- **Settings Sync**: Message to sync user preferences
- **Analytics**: Message to track usage metrics

*These are noted for future consideration but not included in MVP contract.*
