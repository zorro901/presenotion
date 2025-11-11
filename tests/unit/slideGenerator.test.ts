/**
 * Unit tests for slide generation logic
 * Tests H1 boundary detection and slide creation
 */

import { describe, it, expect } from 'vitest';
import { generateSlides, generateSlideDeck } from '@/lib/slideGenerator';
import { NotionBlock, NotionBlockType } from '@/types/notion';

describe('slideGenerator', () => {
  describe('generateSlides', () => {
    it('creates slides from Heading 1 (H2 in Notion)', () => {
      const blocks: NotionBlock[] = [
        {
          id: '1',
          type: NotionBlockType.HEADING,
          level: 2,
          content: 'Slide 1',
        },
        {
          id: '2',
          type: NotionBlockType.PARAGRAPH,
          content: 'Content for slide 1',
        },
        {
          id: '3',
          type: NotionBlockType.HEADING,
          level: 2,
          content: 'Slide 2',
        },
        {
          id: '4',
          type: NotionBlockType.PARAGRAPH,
          content: 'Content for slide 2',
        },
      ];

      const slides = generateSlides(blocks);

      expect(slides).toHaveLength(2);
      expect(slides[0].title).toBe('Slide 1');
      expect(slides[0].blocks).toHaveLength(1);
      expect(slides[0].blocks[0].content).toBe('Content for slide 1');

      expect(slides[1].title).toBe('Slide 2');
      expect(slides[1].blocks).toHaveLength(1);
      expect(slides[1].blocks[0].content).toBe('Content for slide 2');
    });

    it('treats H1 and H3-H6 headings as content, not slide boundaries', () => {
      const blocks: NotionBlock[] = [
        {
          id: '1',
          type: NotionBlockType.HEADING,
          level: 2,
          content: 'Main Slide',
        },
        {
          id: '2',
          type: NotionBlockType.HEADING,
          level: 1,
          content: 'Title (H1)',
        },
        {
          id: '3',
          type: NotionBlockType.PARAGRAPH,
          content: 'Content',
        },
      ];

      const slides = generateSlides(blocks);

      expect(slides).toHaveLength(1);
      expect(slides[0].title).toBe('Main Slide');
      expect(slides[0].blocks).toHaveLength(2); // H1 and paragraph
    });

    it('handles pages with no Heading 1 (no H2 tags)', () => {
      const blocks: NotionBlock[] = [
        {
          id: '1',
          type: NotionBlockType.PARAGRAPH,
          content: 'Just a paragraph',
        },
        {
          id: '2',
          type: NotionBlockType.PARAGRAPH,
          content: 'Another paragraph',
        },
      ];

      const slides = generateSlides(blocks);

      expect(slides).toHaveLength(1);
      expect(slides[0].title).toBe('Untitled Slide');
      expect(slides[0].blocks).toHaveLength(2);
    });

    it('handles empty block arrays', () => {
      const blocks: NotionBlock[] = [];
      const slides = generateSlides(blocks);

      expect(slides).toHaveLength(1);
      expect(slides[0].title).toBe('No Content');
      expect(slides[0].blocks[0].content).toContain('no content to display');
    });

    it('sets correct slide indices', () => {
      const blocks: NotionBlock[] = [
        { id: '1', type: NotionBlockType.HEADING, level: 2, content: 'Slide 1' },
        { id: '2', type: NotionBlockType.HEADING, level: 2, content: 'Slide 2' },
        { id: '3', type: NotionBlockType.HEADING, level: 2, content: 'Slide 3' },
      ];

      const slides = generateSlides(blocks);

      expect(slides).toHaveLength(3);
      expect(slides[0].index).toBe(0);
      expect(slides[1].index).toBe(1);
      expect(slides[2].index).toBe(2);
    });

    it('calculates metadata correctly', () => {
      const blocks: NotionBlock[] = [
        { id: '1', type: NotionBlockType.HEADING, level: 2, content: 'Test Slide' },
        { id: '2', type: NotionBlockType.IMAGE, content: '', imageUrl: 'test.jpg' },
        { id: '3', type: NotionBlockType.CODE, content: 'console.log("test")', codeLanguage: 'javascript' },
        { id: '4', type: NotionBlockType.BULLET_LIST, content: '', listItems: ['Item 1', 'Item 2'], listType: 'bullet' },
      ];

      const slides = generateSlides(blocks);

      expect(slides).toHaveLength(1);
      expect(slides[0].metadata.hasImages).toBe(true);
      expect(slides[0].metadata.hasCode).toBe(true);
      expect(slides[0].metadata.hasLists).toBe(true);
      expect(slides[0].metadata.blockCount).toBe(3);
    });
  });

  describe('generateSlideDeck', () => {
    it('creates a valid slide deck', () => {
      const blocks: NotionBlock[] = [
        { id: '1', type: NotionBlockType.HEADING, level: 2, content: 'Slide 1' },
        { id: '2', type: NotionBlockType.PARAGRAPH, content: 'Content' },
      ];
      const pageUrl = 'https://notion.so/test-page';

      const deck = generateSlideDeck(blocks, pageUrl);

      expect(deck.sourcePageUrl).toBe(pageUrl);
      expect(deck.slides).toHaveLength(1);
      expect(deck.totalSlides).toBe(1);
      expect(deck.createdAt).toBeInstanceOf(Date);
      expect(deck.parsingErrors).toEqual([]);
      expect(deck.id).toBeTruthy();
    });

    it('sets totalSlides equal to slides.length', () => {
      const blocks: NotionBlock[] = [
        { id: '1', type: NotionBlockType.HEADING, level: 2, content: 'Slide 1' },
        { id: '2', type: NotionBlockType.HEADING, level: 2, content: 'Slide 2' },
        { id: '3', type: NotionBlockType.HEADING, level: 2, content: 'Slide 3' },
      ];

      const deck = generateSlideDeck(blocks, 'https://notion.so/test');

      expect(deck.totalSlides).toBe(3);
      expect(deck.slides).toHaveLength(3);
    });
  });
});
