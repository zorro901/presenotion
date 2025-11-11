/**
 * Slide generation logic
 * Converts NotionBlocks into Slides using H1 boundary detection
 * Based on spec.md and data-model.md
 */

import {
  NotionBlock,
  NotionBlockType,
  Slide,
  SlideMetadata,
  SlideDeck,
} from '@/types/notion';
import { v4 as uuidv4 } from 'uuid';
import { getBaseFontSize } from './fontScaler';

/**
 * Generate slides from Notion blocks
 * H1 headings create new slides, other blocks belong to current slide
 * @param blocks - Array of NotionBlock objects from parser
 * @returns Array of Slide objects
 */
export function generateSlides(blocks: NotionBlock[]): Slide[] {
  if (blocks.length === 0) {
    return [createEmptySlide()];
  }

  const slides: Slide[] = [];
  let currentSlideBlocks: NotionBlock[] = [];
  let currentTitle = 'Untitled Slide';
  let hasSeenHeading = false;

  blocks.forEach((block) => {
    // Check if this is a Heading 1 (H2 in Notion, level 2) - slide boundary
    if (block.type === NotionBlockType.HEADING && block.level === 2) {
      // Save previous slide if we've seen a heading before
      if (hasSeenHeading) {
        slides.push(createSlide(slides.length, currentTitle, currentSlideBlocks));
      }

      // Start new slide
      currentTitle = block.content || 'Untitled Slide';
      currentSlideBlocks = [];
      hasSeenHeading = true;
    } else {
      // Add block to current slide
      currentSlideBlocks.push(block);
    }
  });

  // Add final slide if we've seen at least one heading or have content
  if (hasSeenHeading || currentSlideBlocks.length > 0) {
    slides.push(createSlide(slides.length, currentTitle, currentSlideBlocks));
  }

  // Handle edge case: no slides created (should not happen with above logic)
  if (slides.length === 0) {
    slides.push(createEmptySlide());
  }

  return slides;
}

/**
 * Create a single slide from blocks
 */
function createSlide(
  index: number,
  title: string,
  blocks: NotionBlock[]
): Slide {
  const metadata = calculateMetadata(blocks);

  return {
    id: uuidv4(),
    index,
    title,
    blocks,
    estimatedHeight: 0, // Will be calculated during rendering
    fontSize: getBaseFontSize(),
    metadata,
  };
}

/**
 * Create an empty slide for pages with no content
 */
function createEmptySlide(): Slide {
  return {
    id: uuidv4(),
    index: 0,
    title: 'No Content',
    blocks: [
      {
        id: uuidv4(),
        type: NotionBlockType.PARAGRAPH,
        content: 'This page has no content to display as slides.',
      },
    ],
    estimatedHeight: 0,
    fontSize: getBaseFontSize(),
    metadata: {
      hasImages: false,
      hasCode: false,
      hasLists: false,
      blockCount: 1,
      wordCount: 8,
    },
  };
}

/**
 * Calculate metadata for a slide
 */
function calculateMetadata(blocks: NotionBlock[]): SlideMetadata {
  const hasImages = blocks.some(b => b.type === NotionBlockType.IMAGE);
  const hasCode = blocks.some(b => b.type === NotionBlockType.CODE);
  const hasLists = blocks.some(
    b =>
      b.type === NotionBlockType.BULLET_LIST ||
      b.type === NotionBlockType.NUMBERED_LIST
  );

  const wordCount = blocks.reduce((count, block) => {
    const text = block.content || '';
    const words = text.split(/\s+/).filter(w => w.length > 0);
    return count + words.length;
  }, 0);

  return {
    hasImages,
    hasCode,
    hasLists,
    blockCount: blocks.length,
    wordCount,
  };
}

/**
 * Generate a complete slide deck from blocks
 * @param blocks - Array of NotionBlock objects
 * @param sourcePageUrl - URL of the Notion page
 * @returns Complete SlideDeck object
 */
export function generateSlideDeck(
  blocks: NotionBlock[],
  sourcePageUrl: string
): SlideDeck {
  const slides = generateSlides(blocks);

  return {
    id: uuidv4(),
    sourcePageUrl,
    slides,
    totalSlides: slides.length,
    createdAt: new Date(),
    parsingErrors: [],
  };
}
