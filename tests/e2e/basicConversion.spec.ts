/**
 * E2E test specifications for basic Notion to Slides conversion
 * Tests popup activation, slide display, and keyboard navigation
 *
 * NOTE: These tests are currently SKIPPED and serve as test specifications.
 * Chrome extension E2E testing is complex due to isolated contexts and Chrome API dependencies.
 * Please use the manual testing checklist in tests/e2e/README.md instead.
 *
 * Future: These tests can be enabled when proper Chrome extension testing infrastructure is set up.
 */

import { test, expect, chromium, BrowserContext, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const EXTENSION_PATH = path.join(__dirname, '../../dist_chrome');
const TEST_PAGE_PATH = path.join(__dirname, '../fixtures/notion-test-page.html');

let context: BrowserContext;

test.beforeAll(async () => {
  // Check if extension is built
  if (!fs.existsSync(EXTENSION_PATH)) {
    throw new Error(
      `Extension not built. Please run 'bun run build:chrome' before running E2E tests.`
    );
  }

  // Launch browser with extension loaded
  context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });
});

test.afterAll(async () => {
  await context.close();
});

/**
 * T015: E2E test for popup activation and slide display
 * SKIPPED: Use manual testing checklist in README.md
 */
test.describe.skip('Popup Activation and Slide Display', () => {
  test('should inject slide viewer into page and display slides', async () => {
    const page = await context.newPage();

    // Navigate to test Notion page
    await page.goto(`file://${TEST_PAGE_PATH}`);
    await page.waitForLoadState('domcontentloaded');

    // Manually trigger presentation by injecting and calling the content script
    await injectAndStartPresentation(page);

    // Wait for slide viewer to appear
    await page.waitForSelector('#notion-to-slides-viewer', { timeout: 5000 });

    // Verify slide viewer is visible
    const slideViewer = page.locator('#notion-to-slides-viewer');
    await expect(slideViewer).toBeVisible();

    // Verify slide content is displayed
    const slideContent = page.locator('.slide-viewer-overlay');
    await expect(slideContent).toBeVisible();

    // Verify navigation controls exist
    const prevButton = page.locator('button:has-text("Previous")');
    const nextButton = page.locator('button:has-text("Next")');
    const closeButton = page.locator('button:has-text("Close")');

    await expect(prevButton).toBeVisible();
    await expect(nextButton).toBeVisible();
    await expect(closeButton).toBeVisible();

    // Verify slide counter exists
    const slideCounter = page.locator('.slide-counter');
    await expect(slideCounter).toBeVisible();
    await expect(slideCounter).toContainText('Slide 1 of');

    await page.close();
  });

  test('should display slide with H1 title and content blocks', async () => {
    const page = await context.newPage();
    await page.goto(`file://${TEST_PAGE_PATH}`);
    await page.waitForLoadState('domcontentloaded');

    // Start presentation
    await injectAndStartPresentation(page);

    // Wait for slide viewer
    await page.waitForSelector('#notion-to-slides-viewer', { timeout: 5000 });

    // Check slide content exists
    const slideContent = page.locator('.slide-content');
    await expect(slideContent).toBeVisible();

    // Verify at least one content block is rendered
    const contentBlocks = page.locator('.slide-content > *');
    const blockCount = await contentBlocks.count();
    expect(blockCount).toBeGreaterThan(0);

    await page.close();
  });

  test('should render multiple slides from H1 boundaries', async () => {
    const page = await context.newPage();
    await page.goto(`file://${TEST_PAGE_PATH}`);
    await page.waitForLoadState('domcontentloaded');

    await injectAndStartPresentation(page);
    await page.waitForSelector('#notion-to-slides-viewer', { timeout: 5000 });

    // Check slide counter shows multiple slides
    const slideCounter = page.locator('.slide-counter');
    const counterText = await slideCounter.textContent();

    // Test page has 7 H1 headings = 7 slides
    expect(counterText).toContain('of 7');

    await page.close();
  });

  test('should close presentation when close button is clicked', async () => {
    const page = await context.newPage();
    await page.goto(`file://${TEST_PAGE_PATH}`);
    await page.waitForLoadState('domcontentloaded');

    await injectAndStartPresentation(page);
    await page.waitForSelector('#notion-to-slides-viewer', { timeout: 5000 });

    // Click close button
    const closeButton = page.locator('button:has-text("Close")');
    await closeButton.click();
    await page.waitForTimeout(300);

    // Verify slide viewer is removed
    const slideViewer = page.locator('#notion-to-slides-viewer');
    await expect(slideViewer).not.toBeVisible();

    await page.close();
  });
});

/**
 * T016: E2E test for keyboard navigation (arrows, Escape)
 * SKIPPED: Use manual testing checklist in README.md
 */
test.describe.skip('Keyboard Navigation', () => {
  test('should navigate to next slide with ArrowRight', async () => {
    const page = await context.newPage();
    await page.goto(`file://${TEST_PAGE_PATH}`);
    await page.waitForLoadState('domcontentloaded');

    await injectAndStartPresentation(page);
    await page.waitForSelector('#notion-to-slides-viewer', { timeout: 5000 });

    // Check initial slide counter
    let slideCounter = await page.locator('.slide-counter').textContent();
    expect(slideCounter).toContain('Slide 1 of');

    // Press ArrowRight
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    // Check slide counter updated
    slideCounter = await page.locator('.slide-counter').textContent();
    expect(slideCounter).toContain('Slide 2 of');

    await page.close();
  });

  test('should navigate to previous slide with ArrowLeft', async () => {
    const page = await context.newPage();
    await page.goto(`file://${TEST_PAGE_PATH}`);
    await page.waitForLoadState('domcontentloaded');

    await injectAndStartPresentation(page);
    await page.waitForSelector('#notion-to-slides-viewer', { timeout: 5000 });

    // Go to second slide first
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    let slideCounter = await page.locator('.slide-counter').textContent();
    expect(slideCounter).toContain('Slide 2 of');

    // Press ArrowLeft to go back
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);

    slideCounter = await page.locator('.slide-counter').textContent();
    expect(slideCounter).toContain('Slide 1 of');

    await page.close();
  });

  test('should navigate to next slide with ArrowDown', async () => {
    const page = await context.newPage();
    await page.goto(`file://${TEST_PAGE_PATH}`);
    await page.waitForLoadState('domcontentloaded');

    await injectAndStartPresentation(page);
    await page.waitForSelector('#notion-to-slides-viewer', { timeout: 5000 });

    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);

    const slideCounter = await page.locator('.slide-counter').textContent();
    expect(slideCounter).toContain('Slide 2 of');

    await page.close();
  });

  test('should navigate to previous slide with ArrowUp', async () => {
    const page = await context.newPage();
    await page.goto(`file://${TEST_PAGE_PATH}`);
    await page.waitForLoadState('domcontentloaded');

    await injectAndStartPresentation(page);
    await page.waitForSelector('#notion-to-slides-viewer', { timeout: 5000 });

    // Go to second slide
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    // Press ArrowUp to go back
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(300);

    const slideCounter = await page.locator('.slide-counter').textContent();
    expect(slideCounter).toContain('Slide 1 of');

    await page.close();
  });

  test('should close slide viewer with Escape key', async () => {
    const page = await context.newPage();
    await page.goto(`file://${TEST_PAGE_PATH}`);
    await page.waitForLoadState('domcontentloaded');

    await injectAndStartPresentation(page);
    await page.waitForSelector('#notion-to-slides-viewer', { timeout: 5000 });

    // Verify slide viewer is visible
    let slideViewer = page.locator('#notion-to-slides-viewer');
    await expect(slideViewer).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Verify slide viewer is removed
    slideViewer = page.locator('#notion-to-slides-viewer');
    await expect(slideViewer).not.toBeVisible();

    await page.close();
  });

  test('should navigate to first slide with Home key', async () => {
    const page = await context.newPage();
    await page.goto(`file://${TEST_PAGE_PATH}`);
    await page.waitForLoadState('domcontentloaded');

    await injectAndStartPresentation(page);
    await page.waitForSelector('#notion-to-slides-viewer', { timeout: 5000 });

    // Go to third slide
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    let slideCounter = await page.locator('.slide-counter').textContent();
    expect(slideCounter).toContain('Slide 3 of');

    // Press Home to go to first slide
    await page.keyboard.press('Home');
    await page.waitForTimeout(300);

    slideCounter = await page.locator('.slide-counter').textContent();
    expect(slideCounter).toContain('Slide 1 of');

    await page.close();
  });

  test('should navigate to last slide with End key', async () => {
    const page = await context.newPage();
    await page.goto(`file://${TEST_PAGE_PATH}`);
    await page.waitForLoadState('domcontentloaded');

    await injectAndStartPresentation(page);
    await page.waitForSelector('#notion-to-slides-viewer', { timeout: 5000 });

    // Press End to go to last slide
    await page.keyboard.press('End');
    await page.waitForTimeout(300);

    const slideCounter = await page.locator('.slide-counter').textContent();
    // Test page has 7 slides
    expect(slideCounter).toContain('Slide 7 of 7');

    await page.close();
  });

  test('should not navigate past last slide', async () => {
    const page = await context.newPage();
    await page.goto(`file://${TEST_PAGE_PATH}`);
    await page.waitForLoadState('domcontentloaded');

    await injectAndStartPresentation(page);
    await page.waitForSelector('#notion-to-slides-viewer', { timeout: 5000 });

    // Go to last slide
    await page.keyboard.press('End');
    await page.waitForTimeout(300);

    const slideCounterBefore = await page.locator('.slide-counter').textContent();

    // Try to go past last slide
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    const slideCounterAfter = await page.locator('.slide-counter').textContent();

    // Should remain on same slide
    expect(slideCounterBefore).toBe(slideCounterAfter);
    expect(slideCounterAfter).toContain('Slide 7 of 7');

    await page.close();
  });

  test('should not navigate before first slide', async () => {
    const page = await context.newPage();
    await page.goto(`file://${TEST_PAGE_PATH}`);
    await page.waitForLoadState('domcontentloaded');

    await injectAndStartPresentation(page);
    await page.waitForSelector('#notion-to-slides-viewer', { timeout: 5000 });

    const slideCounterBefore = await page.locator('.slide-counter').textContent();
    expect(slideCounterBefore).toContain('Slide 1 of');

    // Try to go before first slide
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);

    const slideCounterAfter = await page.locator('.slide-counter').textContent();

    // Should remain on slide 1
    expect(slideCounterAfter).toContain('Slide 1 of');

    await page.close();
  });
});

/**
 * Helper: Inject content script and start presentation
 * This simulates the extension content script injection and activation
 */
async function injectAndStartPresentation(page: Page) {
  // Read manifest to get actual content script path
  const manifestPath = path.join(EXTENSION_PATH, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  // Get content script JS files
  const contentScripts = manifest.content_scripts[0]?.js || [];
  if (contentScripts.length === 0) {
    throw new Error('No content scripts found in manifest.json');
  }

  // Read all content script files
  for (const scriptPath of contentScripts) {
    const fullPath = path.join(EXTENSION_PATH, scriptPath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Content script not found at ${fullPath}`);
    }

    const scriptContent = fs.readFileSync(fullPath, 'utf-8');

    // Inject script into page
    await page.addScriptTag({ content: scriptContent });
  }

  // Wait for content script to initialize
  await page.waitForTimeout(500);

  // Manually trigger presentation start
  await page.evaluate(() => {
    // Simulate message from popup
    const event = new MessageEvent('message', {
      data: {
        action: 'START_PRESENTATION',
        payload: { pageUrl: window.location.href },
        timestamp: Date.now(),
      },
    });
    window.dispatchEvent(event);
  });

  // Wait for presentation to start
  await page.waitForTimeout(500);
}
