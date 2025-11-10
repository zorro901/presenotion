# E2E Tests for Notion to Slides

This directory contains end-to-end (E2E) tests for the Notion to Slides Chrome extension using Playwright.

## Prerequisites

1. **Build the extension first**:
   ```bash
   bun run build:chrome
   ```

2. **Install Playwright browsers** (if not already installed):
   ```bash
   bunx playwright install chromium
   ```

## Running E2E Tests

```bash
# Run all E2E tests
bun run playwright test

# Run E2E tests in UI mode
bun run playwright test --ui

# Run specific test file
bun run playwright test tests/e2e/basicConversion.spec.ts

# Run in headed mode (see browser)
bun run playwright test --headed
```

## Test Coverage

### T015: Popup Activation and Slide Display
- ✅ Inject slide viewer into page and display slides
- ✅ Display slide with H1 title and content blocks
- ✅ Render multiple slides from H1 boundaries
- ✅ Close presentation when close button is clicked

### T016: Keyboard Navigation
- ✅ Navigate to next slide with ArrowRight
- ✅ Navigate to previous slide with ArrowLeft
- ✅ Navigate to next slide with ArrowDown
- ✅ Navigate to previous slide with ArrowUp
- ✅ Close slide viewer with Escape key
- ✅ Navigate to first slide with Home key
- ✅ Navigate to last slide with End key
- ✅ Prevent navigation past last slide
- ✅ Prevent navigation before first slide

## Test Architecture

### Test Fixtures
- **`tests/fixtures/notion-test-page.html`**: Mock Notion page with 7 slides for testing

### Test Approach
The E2E tests use a simplified approach:
1. Load the extension with `launchPersistentContext`
2. Navigate to a test HTML file that mimics Notion's DOM structure
3. Inject the content script manually for testing
4. Verify slide display and keyboard navigation

### Known Limitations

1. **Extension ID retrieval**: The tests currently use a manual injection approach rather than testing the full popup → content script flow via Chrome APIs.

2. **Manual popup testing required**: Full popup interaction testing requires more complex setup with dynamic extension ID retrieval.

3. **Content script injection**: The tests inject the built content script directly rather than relying on Chrome's automatic injection.

## Adding New E2E Tests

1. Create a new test file in `tests/e2e/`
2. Use the existing test pattern:
   ```typescript
   test('should do something', async () => {
     const page = await context.newPage();
     await page.goto(`file://${TEST_PAGE_PATH}`);
     await injectAndStartPresentation(page);

     // Your test assertions here

     await page.close();
   });
   ```

3. Add corresponding fixture HTML if needed

## Troubleshooting

### Tests fail with "Extension not built"
Run `bun run build:chrome` before running E2E tests.

### Tests timeout waiting for selectors
- Ensure the build is up to date
- Check that the test HTML fixture has the expected DOM structure
- Increase timeout in test configuration if needed

### Browser doesn't close after tests
This is expected behavior with `launchPersistentContext`. The browser will close when all tests complete.

## Future Improvements

- [ ] Full popup → content script integration testing
- [ ] Dynamic extension ID retrieval from chrome://extensions
- [ ] Visual regression testing with screenshots
- [ ] Accessibility testing with axe-core
- [ ] Test on real Notion pages (requires authentication)
