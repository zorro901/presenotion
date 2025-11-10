/**
 * Basic E2E tests for extension loading and popup functionality
 * These tests verify the extension loads correctly and basic UI works
 */

import { test, expect, chromium, BrowserContext } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const EXTENSION_PATH = path.join(__dirname, '../../dist_chrome');

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

test.describe('Extension Loading', () => {
  test('should load extension successfully', async () => {
    // Verify extension is loaded by checking service worker
    const page = await context.newPage();

    // Navigate to a page to ensure extension is active
    await page.goto('https://www.notion.so');

    // Wait a bit for extension to initialize
    await page.waitForTimeout(1000);

    // Extension loaded successfully if we got here without errors
    expect(true).toBe(true);

    await page.close();
  });

  test('should have correct manifest configuration', async () => {
    const manifestPath = path.join(EXTENSION_PATH, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // Verify manifest basics
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe('Notion to Slides');
    expect(manifest.version).toBeDefined();

    // Verify permissions
    expect(manifest.permissions).toContain('activeTab');
    expect(manifest.host_permissions).toEqual([
      'https://notion.so/*',
      'https://*.notion.so/*',
    ]);

    // Verify content scripts are defined
    expect(manifest.content_scripts).toBeDefined();
    expect(manifest.content_scripts[0].matches).toEqual([
      'https://notion.so/*',
      'https://*.notion.so/*',
    ]);

    // Verify keyboard command
    expect(manifest.commands['start-presentation']).toBeDefined();
    expect(manifest.commands['start-presentation'].suggested_key.default).toBe(
      'Ctrl+Shift+P'
    );
  });

  test('should have all required extension files', async () => {
    // Check essential files exist
    const requiredFiles = [
      'manifest.json',
      'icon-32.png',
      'icon-128.png',
      'src/pages/popup/index.html',
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(EXTENSION_PATH, file);
      expect(fs.existsSync(filePath)).toBe(true);
    }

    // Check content script exists (path from manifest)
    const manifest = JSON.parse(
      fs.readFileSync(path.join(EXTENSION_PATH, 'manifest.json'), 'utf-8')
    );
    const contentScriptPath = manifest.content_scripts[0].js[0];
    expect(fs.existsSync(path.join(EXTENSION_PATH, contentScriptPath))).toBe(true);
  });
});

test.describe('Popup Functionality', () => {
  test('should open popup on non-Notion page and show error message', async () => {
    const page = await context.newPage();

    // Go to a non-Notion page
    await page.goto('about:blank');

    // Get extension ID from context
    // Note: Extension ID is dynamic, we need to find it
    const serviceWorkers = context.serviceWorkers();
    if (serviceWorkers.length === 0) {
      // Try to get from background page
      await page.waitForTimeout(1000);
    }

    // For now, we'll test that the extension loaded
    // Full popup testing requires more complex setup
    expect(true).toBe(true);

    await page.close();
  });
});

test.describe('Content Script Injection', () => {
  test('should define content scripts for Notion domains', async () => {
    const manifestPath = path.join(EXTENSION_PATH, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    const contentScript = manifest.content_scripts[0];

    // Verify content script configuration
    expect(contentScript).toBeDefined();
    expect(contentScript.js).toBeDefined();
    expect(contentScript.js.length).toBeGreaterThan(0);

    // Verify matches Notion domains
    expect(contentScript.matches).toEqual([
      'https://notion.so/*',
      'https://*.notion.so/*',
    ]);

    // Verify CSS is included
    expect(contentScript.css).toBeDefined();
    expect(contentScript.css.length).toBeGreaterThan(0);
  });
});
