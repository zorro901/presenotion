# E2E Tests for Notion to Slides

This directory contains end-to-end (E2E) tests for the Notion to Slides Chrome extension.

## Test Structure

### ✅ Automated Tests (5 tests - `extensionLoad.spec.ts`)

**Running**: `bun run test:e2e extensionLoad.spec.ts`

Basic extension functionality that can be automated:
- Extension loads successfully
- Manifest configuration is correct
- Required files exist (icons, popup, content scripts)
- Content script configuration for Notion domains
- Extension initialization

### 📋 Manual Tests (13 test cases - see checklist below)

**Reference**: `basicConversion.spec.ts` (test specifications)

Complex user interactions requiring manual verification:
- Popup activation and slide display
- Keyboard navigation
- Slide rendering with real Notion content
- User interaction flows

## Manual Testing Guide

### Prerequisites

1. **Build the extension**:
   ```bash
   bun run build:chrome
   ```

2. **Load extension in Chrome**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist_chrome` directory

3. **Create a test Notion page**:
   - Create a Notion page with multiple H1 headings
   - Add various content (paragraphs, lists, images, code blocks)

### Manual Test Checklist

Follow these steps to manually verify the extension functionality:

#### **T015: Popup Activation and Slide Display** ✅

1. **Test popup activation**:
   - [ ] Navigate to a Notion page
   - [ ] Click the extension icon
   - [ ] Verify popup displays "Start Presentation" button
   - [ ] Click "Start Presentation"
   - [ ] Verify slide viewer overlay appears

2. **Test slide display**:
   - [ ] Verify first slide shows with H1 title
   - [ ] Verify content blocks are rendered correctly
   - [ ] Verify slide counter shows "Slide 1 of X"

3. **Test multiple slides**:
   - [ ] Create Notion page with 3+ H1 headings
   - [ ] Start presentation
   - [ ] Verify slide counter shows correct total (e.g., "Slide 1 of 3")

4. **Test close functionality**:
   - [ ] Click "Close" button
   - [ ] Verify slide viewer disappears
   - [ ] Verify can re-open presentation

#### **T016: Keyboard Navigation** ✅

5. **Test arrow key navigation**:
   - [ ] Press `→` (ArrowRight) → advances to next slide
   - [ ] Press `↓` (ArrowDown) → advances to next slide
   - [ ] Press `←` (ArrowLeft) → goes to previous slide
   - [ ] Press `↑` (ArrowUp) → goes to previous slide

6. **Test jump navigation**:
   - [ ] Press `Home` → jumps to first slide
   - [ ] Press `End` → jumps to last slide

7. **Test Escape key**:
   - [ ] Press `Esc` → closes presentation

8. **Test boundary conditions**:
   - [ ] On first slide, press `←` → stays on first slide
   - [ ] On last slide, press `→` → stays on last slide

9. **Test keyboard shortcut**:
   - [ ] Press `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`) → starts presentation

### Content Preservation Tests (Future: Phase 4)

- [ ] Bold, italic, underline text preserved
- [ ] Bullet and numbered lists rendered correctly
- [ ] Images display with alt text
- [ ] Code blocks show with monospace font

### Results Tracking

**Date**: ___________
**Tester**: ___________
**Extension Version**: ___________
**Browser**: Chrome ___________

**Overall Status**: ⬜ Pass / ⬜ Fail

**Issues Found**:
1. _______________________________
2. _______________________________
3. _______________________________

## Automated E2E Testing (Future)

### Current Limitations

Automated E2E tests for Chrome extensions face challenges:
- **Isolated contexts**: Content scripts run in isolated execution contexts
- **Chrome API dependencies**: Extensions rely on `chrome.*` APIs not available in regular pages
- **Manifest V3 restrictions**: Security policies limit testing approaches
- **Dynamic bundling**: Vite generates different file names per build

### Future Implementation

Potential approaches for automated E2E testing:
1. **Puppeteer Extra** with chrome-extension plugin
2. **Selenium WebDriver** with extension loading
3. **Playwright** with advanced configuration
4. **Custom test harness** using Chrome DevTools Protocol

### Test Specifications

The test files in this directory (`basicConversion.spec.ts`) serve as:
- **Specifications**: Detailed test scenarios and assertions
- **Documentation**: What needs to be tested and how
- **Future automation**: Ready-to-implement when tooling improves

## Reference

- [Chrome Extension Testing Guide](https://developer.chrome.com/docs/extensions/mv3/testing/)
- [Playwright Chrome Extensions](https://playwright.dev/docs/chrome-extensions)
- [Puppeteer Extension Testing](https://pptr.dev/guides/chrome-extensions)
