/**
 * Unit tests for Notion DOM parser
 * Tests DOM extraction with H1 headings
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { parseNotionPage, isNotionPage, hasContent } from '@/pages/content/parser';
import { NotionBlockType } from '@/types/notion';

describe('parser', () => {
  beforeEach(() => {
    // Clear the DOM before each test
    document.body.innerHTML = '';
  });

  describe('parseNotionPage', () => {
    it('parses H1 headings correctly', () => {
      // Create mock Notion DOM structure
      document.body.innerHTML = `
        <div data-block-id="block-1">
          <div role="heading" aria-level="1">
            <div data-content-editable-leaf="true">First Heading</div>
          </div>
        </div>
        <div data-block-id="block-2">
          <div role="heading" aria-level="1">
            <div data-content-editable-leaf="true">Second Heading</div>
          </div>
        </div>
      `;

      const blocks = parseNotionPage();

      expect(blocks).toHaveLength(2);
      expect(blocks[0].type).toBe(NotionBlockType.HEADING);
      expect(blocks[0].level).toBe(1);
      expect(blocks[0].content).toBe('First Heading');
      expect(blocks[1].type).toBe(NotionBlockType.HEADING);
      expect(blocks[1].level).toBe(1);
      expect(blocks[1].content).toBe('Second Heading');
    });

    it('parses paragraphs correctly', () => {
      document.body.innerHTML = `
        <div data-block-id="block-1">
          <div data-content-editable-leaf="true">This is a paragraph</div>
        </div>
      `;

      const blocks = parseNotionPage();

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe(NotionBlockType.PARAGRAPH);
      expect(blocks[0].content).toBe('This is a paragraph');
    });

    it('parses bullet lists correctly', () => {
      document.body.innerHTML = `
        <div data-block-id="block-1">
          <ul role="list" class="notion-bulleted-list">
            <li role="listitem">Item 1</li>
            <li role="listitem">Item 2</li>
            <li role="listitem">Item 3</li>
          </ul>
        </div>
      `;

      const blocks = parseNotionPage();

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe(NotionBlockType.BULLET_LIST);
      expect(blocks[0].listType).toBe('bullet');
      expect(blocks[0].listItems).toHaveLength(3);
      expect(blocks[0].listItems).toEqual(['Item 1', 'Item 2', 'Item 3']);
    });

    it('parses numbered lists correctly', () => {
      document.body.innerHTML = `
        <div data-block-id="block-1">
          <ol role="list">
            <li role="listitem">First</li>
            <li role="listitem">Second</li>
          </ol>
        </div>
      `;

      const blocks = parseNotionPage();

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe(NotionBlockType.NUMBERED_LIST);
      expect(blocks[0].listType).toBe('numbered');
      expect(blocks[0].listItems).toEqual(['First', 'Second']);
    });

    it('parses images correctly', () => {
      document.body.innerHTML = `
        <div data-block-id="block-1">
          <img src="https://example.com/image.jpg" alt="Test Image" />
        </div>
      `;

      const blocks = parseNotionPage();

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe(NotionBlockType.IMAGE);
      expect(blocks[0].imageUrl).toBe('https://example.com/image.jpg');
      expect(blocks[0].imageAlt).toBe('Test Image');
    });

    it('parses code blocks correctly', () => {
      document.body.innerHTML = `
        <div data-block-id="block-1">
          <code class="language-javascript">console.log("test");</code>
        </div>
      `;

      const blocks = parseNotionPage();

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe(NotionBlockType.CODE);
      expect(blocks[0].content).toBe('console.log("test");');
      expect(blocks[0].codeLanguage).toBe('javascript');
    });

    it('extracts text formatting', () => {
      document.body.innerHTML = `
        <div data-block-id="block-1">
          <div data-content-editable-leaf="true">
            Some <strong>bold</strong> and <em>italic</em> text
          </div>
        </div>
      `;

      const blocks = parseNotionPage();

      expect(blocks).toHaveLength(1);
      expect(blocks[0].formatting).toBeDefined();
      expect(blocks[0].formatting!.length).toBeGreaterThan(0);

      const boldFormat = blocks[0].formatting!.find(f => f.type === 'bold');
      expect(boldFormat).toBeDefined();

      const italicFormat = blocks[0].formatting!.find(f => f.type === 'italic');
      expect(italicFormat).toBeDefined();
    });

    it('returns empty array for pages with no blocks', () => {
      document.body.innerHTML = '<div>No blocks here</div>';

      const blocks = parseNotionPage();

      expect(blocks).toEqual([]);
    });

    it('handles parsing errors gracefully', () => {
      // Create malformed DOM
      document.body.innerHTML = '<div data-block-id="block-1"></div>';

      const blocks = parseNotionPage();

      // Should not crash, may return empty or skip malformed blocks
      expect(Array.isArray(blocks)).toBe(true);
    });
  });

  describe('isNotionPage', () => {
    it('returns true for notion.so domains', () => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: { hostname: 'www.notion.so' },
        writable: true,
      });

      expect(isNotionPage()).toBe(true);
    });

    it('returns true for custom notion domains', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'my-workspace.notion.so' },
        writable: true,
      });

      expect(isNotionPage()).toBe(true);
    });

    it('returns false for non-Notion domains', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'www.google.com' },
        writable: true,
      });

      expect(isNotionPage()).toBe(false);
    });
  });

  describe('hasContent', () => {
    it('returns true when page has blocks', () => {
      document.body.innerHTML = '<div data-block-id="block-1">Content</div>';

      expect(hasContent()).toBe(true);
    });

    it('returns false when page has no blocks', () => {
      document.body.innerHTML = '<div>No blocks</div>';

      expect(hasContent()).toBe(false);
    });
  });
});
