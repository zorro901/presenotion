/**
 * Integration tests for full Notion parsing to slide generation flow
 * Tests the complete pipeline from DOM parsing to slide deck creation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { parseNotionPage } from '@/pages/content/parser';
import { generateSlideDeck } from '@/lib/slideGenerator';
import { NotionBlockType } from '@/types/notion';

describe('Notion Parsing Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('parses Notion page and generates slide deck correctly', () => {
    // Create realistic Notion page structure
    document.body.innerHTML = `
      <div data-block-id="block-1">
        <div role="heading" aria-level="2">
          <div data-content-editable-leaf="true">Introduction</div>
        </div>
      </div>
      <div data-block-id="block-2">
        <div data-content-editable-leaf="true">Welcome to the presentation</div>
      </div>
      <div data-block-id="block-3">
        <div role="heading" aria-level="2">
          <div data-content-editable-leaf="true">Main Topics</div>
        </div>
      </div>
      <div data-block-id="block-4">
        <ul role="list" class="notion-bulleted-list">
          <li role="listitem">Topic 1</li>
          <li role="listitem">Topic 2</li>
        </ul>
      </div>
      <div data-block-id="block-5">
        <div role="heading" aria-level="2">
          <div data-content-editable-leaf="true">Conclusion</div>
        </div>
      </div>
      <div data-block-id="block-6">
        <div data-content-editable-leaf="true">Thank you</div>
      </div>
    `;

    // Parse Notion page
    const blocks = parseNotionPage();
    expect(blocks).toHaveLength(6);

    // Generate slide deck
    const deck = generateSlideDeck(blocks, 'https://notion.so/test-page');

    // Verify slide deck structure
    expect(deck.slides).toHaveLength(3);
    expect(deck.totalSlides).toBe(3);
    expect(deck.sourcePageUrl).toBe('https://notion.so/test-page');

    // Verify first slide
    expect(deck.slides[0].title).toBe('Introduction');
    expect(deck.slides[0].blocks).toHaveLength(1);
    expect(deck.slides[0].blocks[0].type).toBe(NotionBlockType.PARAGRAPH);

    // Verify second slide
    expect(deck.slides[1].title).toBe('Main Topics');
    expect(deck.slides[1].blocks).toHaveLength(1);
    expect(deck.slides[1].blocks[0].type).toBe(NotionBlockType.BULLET_LIST);

    // Verify third slide
    expect(deck.slides[2].title).toBe('Conclusion');
    expect(deck.slides[2].blocks).toHaveLength(1);
  });

  it('handles pages with mixed content types', () => {
    document.body.innerHTML = `
      <div data-block-id="block-1">
        <div role="heading" aria-level="2">
          <div data-content-editable-leaf="true">Rich Content Slide</div>
        </div>
      </div>
      <div data-block-id="block-2">
        <div data-content-editable-leaf="true">Some <strong>bold</strong> text</div>
      </div>
      <div data-block-id="block-3">
        <img src="test.jpg" alt="Test" />
      </div>
      <div data-block-id="block-4">
        <code class="language-js">const x = 5;</code>
      </div>
    `;

    const blocks = parseNotionPage();
    const deck = generateSlideDeck(blocks, 'https://notion.so/test');

    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].metadata.hasImages).toBe(true);
    expect(deck.slides[0].metadata.hasCode).toBe(true);
  });

  it('handles pages with Heading 1 (H2) creating slides correctly', () => {
    document.body.innerHTML = `
      <div data-block-id="block-1">
        <div role="heading" aria-level="2">
          <div data-content-editable-leaf="true">H2 Heading</div>
        </div>
      </div>
      <div data-block-id="block-2">
        <div data-content-editable-leaf="true">Just a paragraph</div>
      </div>
    `;

    const blocks = parseNotionPage();
    const deck = generateSlideDeck(blocks, 'https://notion.so/test');

    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].title).toBe('H2 Heading');
    expect(deck.slides[0].blocks).toHaveLength(1);
  });

  it('handles empty pages', () => {
    document.body.innerHTML = '<div>Empty page</div>';

    const blocks = parseNotionPage();
    const deck = generateSlideDeck(blocks, 'https://notion.so/test');

    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].title).toBe('No Content');
    expect(deck.slides[0].blocks[0].content).toContain('no content to display');
  });

  it('preserves slide order', () => {
    document.body.innerHTML = `
      <div data-block-id="block-1">
        <div role="heading" aria-level="2">
          <div data-content-editable-leaf="true">First</div>
        </div>
      </div>
      <div data-block-id="block-2">
        <div role="heading" aria-level="2">
          <div data-content-editable-leaf="true">Second</div>
        </div>
      </div>
      <div data-block-id="block-3">
        <div role="heading" aria-level="2">
          <div data-content-editable-leaf="true">Third</div>
        </div>
      </div>
    `;

    const blocks = parseNotionPage();
    const deck = generateSlideDeck(blocks, 'https://notion.so/test');

    expect(deck.slides).toHaveLength(3);
    expect(deck.slides[0].title).toBe('First');
    expect(deck.slides[0].index).toBe(0);
    expect(deck.slides[1].title).toBe('Second');
    expect(deck.slides[1].index).toBe(1);
    expect(deck.slides[2].title).toBe('Third');
    expect(deck.slides[2].index).toBe(2);
  });

  it('generates unique IDs for all entities', () => {
    document.body.innerHTML = `
      <div data-block-id="block-1">
        <div role="heading" aria-level="2">
          <div data-content-editable-leaf="true">Slide 1</div>
        </div>
      </div>
      <div data-block-id="block-2">
        <div role="heading" aria-level="2">
          <div data-content-editable-leaf="true">Slide 2</div>
        </div>
      </div>
    `;

    const blocks = parseNotionPage();
    const deck = generateSlideDeck(blocks, 'https://notion.so/test');

    // Deck should have unique ID
    expect(deck.id).toBeTruthy();

    // All slides should have unique IDs
    const slideIds = deck.slides.map(s => s.id);
    const uniqueSlideIds = new Set(slideIds);
    expect(uniqueSlideIds.size).toBe(slideIds.length);

    // Deck ID should be different from slide IDs
    expect(slideIds).not.toContain(deck.id);
  });

  it('sets createdAt timestamp', () => {
    document.body.innerHTML = `
      <div data-block-id="block-1">
        <div role="heading" aria-level="2">
          <div data-content-editable-leaf="true">Test</div>
        </div>
      </div>
    `;

    const beforeTime = new Date();
    const blocks = parseNotionPage();
    const deck = generateSlideDeck(blocks, 'https://notion.so/test');
    const afterTime = new Date();

    expect(deck.createdAt).toBeInstanceOf(Date);
    expect(deck.createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(deck.createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });
});
