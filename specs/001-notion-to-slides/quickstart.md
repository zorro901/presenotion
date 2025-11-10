# Quickstart: Notion to Slides Development

**Feature**: 001-notion-to-slides
**Date**: 2025-11-10
**Purpose**: Get developers up and running with Notion to Slides extension development

## Prerequisites

Before starting development, ensure you have:

- **Node.js**: Version 18+ ([Download](https://nodejs.org/))
- **npm**: Version 9+ (comes with Node.js)
- **Chrome Browser**: Latest stable version
- **Git**: For version control
- **Code Editor**: VS Code recommended (with TypeScript and ESLint extensions)

Verify installations:
```bash
node --version  # Should show v18.0.0 or higher
npm --version   # Should show 9.0.0 or higher
git --version   # Any recent version
```

---

## Initial Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/zorro901/presenotion.git
cd presenotion

# Checkout the feature branch
git checkout 001-notion-to-slides

# Install dependencies
npm install

# Install dev dependencies for testing
npm install -D vitest @vitest/ui playwright @playwright/test @axe-core/playwright
```

### 2. Configure Development Environment

The project uses existing Vite + React + TypeScript setup from Presenotion template.

**Verify configuration files exist**:
- `vite.config.chrome.ts` ✓ (Chrome build config)
- `vite.config.firefox.ts` ✓ (Firefox build config)
- `tsconfig.json` ✓ (TypeScript config)
- `manifest.json` ✓ (Extension manifest)

**Create test configuration**:

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

Create `playwright.config.ts`:
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'https://notion.so',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Load extension (set path after build)
        contextOptions: {
          // This will be configured per test to load unpacked extension
        }
      },
    },
  ],
});
```

### 3. Update Extension Manifest

Edit `manifest.json` to configure for Notion:

```json
{
  "manifest_version": 3,
  "name": "Notion to Slides",
  "description": "Convert Notion pages into presentation slides",
  "version": "0.1.0",
  "permissions": [
    "activeTab"
  ],
  "host_permissions": [
    "https://notion.so/*",
    "https://*.notion.so/*"
  ],
  "action": {
    "default_popup": "src/pages/popup/index.html",
    "default_icon": {
      "32": "icon-32.png",
      "128": "icon-128.png"
    }
  },
  "content_scripts": [
    {
      "matches": [
        "https://notion.so/*",
        "https://*.notion.so/*"
      ],
      "js": ["src/pages/content/index.tsx"],
      "css": ["src/pages/content/style.css"]
    }
  ],
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

---

## Development Workflow

### Build for Development

```bash
# Build for Chrome with watch mode
npm run dev:chrome

# Or build for Firefox
npm run dev:firefox

# For production build
npm run build:chrome
```

**Output**: Builds to `dist/` directory

### Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist/` directory from your project
5. Extension icon should appear in toolbar

**Verify installation**:
- Navigate to any Notion page
- Extension icon should be **enabled** (not grayed out)
- Click icon → Popup should display

### Hot Reload During Development

The `npm run dev:chrome` command uses nodemon to watch for file changes:

1. Make changes to TypeScript/React files in `src/`
2. Save files
3. Vite automatically rebuilds
4. **Important**: Click the reload icon in `chrome://extensions/` for extension
5. Refresh Notion page to see changes in content script

**Tip**: Use Chrome DevTools for content script debugging:
- Right-click Notion page → "Inspect"
- Console tab shows content script logs
- Sources tab for breakpoints

---

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

**Test structure**:
```
tests/
├── unit/
│   ├── slideGenerator.test.ts
│   ├── fontScaler.test.ts
│   └── parser.test.ts
└── setup.ts  # Test setup file
```

**Example unit test**:
```typescript
import { describe, it, expect } from 'vitest';
import { generateSlides } from '@/lib/slideGenerator';

describe('slideGenerator', () => {
  it('creates slides from H1 headings', () => {
    const blocks = [
      { type: 'heading', level: 1, content: 'Slide 1' },
      { type: 'paragraph', content: 'Content' },
      { type: 'heading', level: 1, content: 'Slide 2' },
    ];

    const slides = generateSlides(blocks);

    expect(slides).toHaveLength(2);
    expect(slides[0].title).toBe('Slide 1');
    expect(slides[1].title).toBe('Slide 2');
  });
});
```

### Integration Tests

Integration tests use Vitest with mocked DOM:

```bash
# Run integration tests (subset of unit tests)
npm run test -- tests/integration
```

### E2E Tests (Playwright)

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI mode
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug
```

**Example E2E test**:
```typescript
import { test, expect } from '@playwright/test';

test('converts Notion page to slides', async ({ page, context }) => {
  // Load extension (requires building first)
  const pathToExtension = './dist';
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`
    ]
  });

  const page = await context.newPage();

  // Navigate to test Notion page
  await page.goto('https://notion.so/test-page-with-headings');

  // Trigger extension
  await page.click('[data-testid="extension-icon"]');

  // Verify slide viewer appears
  await expect(page.locator('.slide-viewer')).toBeVisible({ timeout: 5000 });

  // Verify first slide content
  await expect(page.locator('.slide-title')).toHaveText('Test Heading 1');
});
```

---

## Debugging

### Content Script Debugging

1. Navigate to Notion page
2. Open DevTools (`F12` or Right-click → Inspect)
3. Content script code appears in "Sources" tab under extension's folder
4. Set breakpoints in `src/pages/content/index.tsx`
5. Trigger extension to hit breakpoints

**Console logging**:
```typescript
console.log('[Notion to Slides]', 'Parsing started');
```

### Popup Debugging

1. Click extension icon to open popup
2. Right-click inside popup → "Inspect"
3. Separate DevTools window opens for popup
4. Set breakpoints in `src/pages/popup/Popup.tsx`

### React DevTools

Install React DevTools extension:
1. Install "React Developer Tools" from Chrome Web Store
2. Open DevTools → "Components" and "Profiler" tabs appear
3. Inspect SlideViewer component tree

---

## Common Development Tasks

### Add a New Component

```bash
# Create component file
mkdir -p src/components/SlideViewer
touch src/components/SlideViewer/SlideViewer.tsx

# Create test file
touch tests/unit/SlideViewer.test.tsx
```

**Component template**:
```typescript
import React from 'react';

interface SlideViewerProps {
  slides: Slide[];
  onClose: () => void;
}

export const SlideViewer: React.FC<SlideViewerProps> = ({ slides, onClose }) => {
  return (
    <div className="slide-viewer">
      {/* Component content */}
    </div>
  );
};
```

### Add a New Test

```typescript
// tests/unit/myFeature.test.ts
import { describe, it, expect } from 'vitest';

describe('MyFeature', () => {
  it('does something', () => {
    expect(true).toBe(true);
  });
});
```

### Update Manifest Permissions

If you need additional permissions, edit `manifest.json`:

```json
{
  "permissions": [
    "activeTab",
    "storage"  // Example: Add storage permission
  ]
}
```

After manifest changes:
1. Rebuild: `npm run build:chrome`
2. Go to `chrome://extensions/`
3. Click reload icon on extension
4. Extension will show permission update prompt

---

## Troubleshooting

### Extension Not Loading

**Problem**: Extension doesn't appear in `chrome://extensions/`

**Solutions**:
1. Verify `dist/` folder exists: `ls dist/`
2. Rebuild: `npm run build:chrome`
3. Check for build errors in terminal
4. Ensure `manifest.json` is valid (use [JSON validator](https://jsonlint.com/))

### Content Script Not Injecting

**Problem**: Content script doesn't run on Notion pages

**Solutions**:
1. Check `manifest.json` has correct `host_permissions` for Notion domains
2. Verify `content_scripts.matches` patterns include `https://notion.so/*`
3. Check Console in DevTools for errors
4. Reload extension in `chrome://extensions/`
5. Refresh Notion page

### Tests Failing

**Problem**: Vitest or Playwright tests fail

**Solutions**:
1. Verify test setup file exists: `tests/setup.ts`
2. Check test file paths match config
3. For Playwright: Ensure browsers installed (`npx playwright install`)
4. For E2E: Build extension first (`npm run build:chrome`)
5. Check for missing mock data or fixtures

### TypeScript Errors

**Problem**: TypeScript compilation errors

**Solutions**:
1. Run type check: `npx tsc --noEmit`
2. Verify `tsconfig.json` includes all source files
3. Install missing type definitions: `npm install -D @types/package-name`
4. Restart VS Code TypeScript server: `Cmd+Shift+P` → "Restart TS Server"

---

## Performance Testing

### Measure Parsing Performance

Add timing logs to content script:

```typescript
const parseStart = performance.now();
const deck = await parseNotionPage();
const parseEnd = performance.now();

console.log(`Parsing time: ${parseEnd - parseStart}ms`);
// Target: <2000ms per SC-001
```

### Measure Navigation Performance

Test keyboard responsiveness:

```typescript
document.addEventListener('keydown', (e) => {
  const navStart = performance.now();

  if (e.key === 'ArrowRight') {
    navigateNext();
    const navEnd = performance.now();
    console.log(`Navigation time: ${navEnd - navStart}ms`);
    // Target: <100ms per SC-003
  }
});
```

### Browser DevTools Performance Profiler

1. Open DevTools → Performance tab
2. Click "Record"
3. Trigger extension (click icon)
4. Stop recording after slide displays
5. Analyze flame graph for bottlenecks

**Look for**:
- DOM parsing time (should be <2s)
- React rendering time (should be <1s)
- Font scaling calculations (should be <100ms per slide)

---

## Accessibility Testing

### Automated Testing with axe-core

```typescript
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test('slide viewer is accessible', async ({ page }) => {
  await page.goto('https://notion.so/test-page');
  await page.click('[data-testid="start-presentation"]');

  await injectAxe(page);
  await checkA11y(page, '.slide-viewer', {
    detailedReport: true,
    detailedReportOptions: {
      html: true
    }
  });
});
```

### Manual Screen Reader Testing

**macOS (VoiceOver)**:
1. Enable VoiceOver: `Cmd+F5`
2. Navigate to Notion page with slides
3. Trigger presentation
4. Test keyboard navigation (arrows, Tab)
5. Verify announcements: "Slide 1 of 10", "Heading: Title", etc.

**Windows (NVDA)**:
1. Install NVDA ([Download](https://www.nvaccess.org/))
2. Run NVDA
3. Navigate to Notion page
4. Test with keyboard navigation
5. Verify ARIA labels and announcements

---

## Useful Resources

### Documentation

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/mv3/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [Message Passing](https://developer.chrome.com/docs/extensions/mv3/messaging/)

### Testing

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library (React)](https://testing-library.com/docs/react-testing-library/intro/)
- [axe-core Accessibility Testing](https://www.deque.com/axe/)

### Notion API

- [Notion API Reference](https://developers.notion.com/) (Note: Not used in this extension, for reference only)

### Project-Specific

- [Presenotion README](../../README.md)
- [Feature Spec](./spec.md)
- [Implementation Plan](./plan.md)
- [Data Model](./data-model.md)
- [API Contracts](./contracts/content-script-api.md)

---

## Next Steps

After completing quickstart:

1. **Read Feature Spec**: Understand user stories and requirements
2. **Review Data Model**: Familiarize with core entities (Slide, NotionBlock, etc.)
3. **Explore Codebase**: Navigate existing Presenotion template structure
4. **Run Tests**: Verify test setup works (`npm run test`)
5. **Load Extension**: Get extension running in Chrome
6. **Create First Test**: Write failing E2E test for User Story 1
7. **Implement Parser**: Build Notion DOM parsing logic
8. **Iterate**: Follow TDD cycle (Red → Green → Refactor)

**Ready to code?** Start with tasks defined in `tasks.md` (generated by `/speckit.tasks`).

---

## Getting Help

- **Project Issues**: [GitHub Issues](https://github.com/zorro901/presenotion/issues)
- **Constitution Questions**: See `.specify/memory/constitution.md`
- **Spec Clarifications**: See `specs/001-notion-to-slides/checklists/requirements.md`

Happy coding! 🚀
