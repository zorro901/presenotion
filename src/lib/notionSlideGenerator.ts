/**
 * Slide generation for react-notion-x recordMap
 * Splits Notion pages into slides based on heading levels
 */

import { ExtendedRecordMap, Block } from 'notion-types';
import { v4 as uuidv4 } from 'uuid';

export interface NotionSlide {
  id: string;
  index: number;
  title: string;
  blockIds: string[]; // Block IDs to render in this slide
  headingLevel?: number;
}

export interface NotionSlideDeck {
  id: string;
  sourcePageUrl: string;
  slides: NotionSlide[];
  totalSlides: number;
  recordMap: ExtendedRecordMap;
  createdAt: Date;
}

/**
 * Get all top-level content blocks from a page (not nested child blocks)
 */
function getContentBlocks(recordMap: ExtendedRecordMap, pageId: string): Block[] {
  const blocks: Block[] = [];
  const pageBlock = recordMap.block[pageId]?.value;

  if (!pageBlock || !pageBlock.content) {
    return blocks;
  }

  // Only collect top-level blocks (direct children of the page)
  // Child blocks will be automatically rendered by NotionRenderer
  for (const blockId of pageBlock.content) {
    const block = recordMap.block[blockId]?.value;
    if (block) {
      blocks.push(block);
      console.log(`[Slide Generator] Top-level block: ${block.type} (${blockId.slice(0, 8)})`);
    }
  }

  console.log(`[Slide Generator] Total top-level blocks collected: ${blocks.length}`);
  return blocks;
}

/**
 * Detect the smallest heading level (excluding page title) to use as slide boundary
 */
function detectSlideHeadingLevel(blocks: Block[]): number | null {
  const headingLevels: number[] = [];

  for (const block of blocks) {
    if (block.type === 'header') {
      headingLevels.push(1);
    } else if (block.type === 'sub_header') {
      headingLevels.push(2);
    } else if (block.type === 'sub_sub_header') {
      headingLevels.push(3);
    }
  }

  if (headingLevels.length === 0) {
    return null; // No headings found
  }

  // Return the smallest heading level (largest heading)
  return Math.min(...headingLevels);
}

/**
 * Get heading level from block type
 */
function getHeadingLevel(block: Block): number | null {
  if (block.type === 'header') return 1;
  if (block.type === 'sub_header') return 2;
  if (block.type === 'sub_sub_header') return 3;
  return null;
}

/**
 * Get block title/text content
 */
function getBlockTitle(block: Block): string {
  if (!block.properties?.title) {
    return 'Untitled';
  }

  // Notion properties.title is an array of rich text segments
  // Each segment is [text, formatting?]
  const titleArray = block.properties.title as any[];
  return titleArray.map(segment => {
    if (Array.isArray(segment)) {
      return segment[0]; // Get the text part
    }
    return String(segment);
  }).join('');
}

/**
 * Generate slides from recordMap
 * @param recordMap - Notion page recordMap from notion-client
 * @param sourcePageUrl - URL of the source Notion page
 * @returns Slide deck with slides and metadata
 */
export function generateSlidesFromRecordMap(
  recordMap: ExtendedRecordMap,
  sourcePageUrl: string
): NotionSlideDeck {
  // Get the page ID (first key in block map)
  const pageId = Object.keys(recordMap.block)[0];
  const blocks = getContentBlocks(recordMap, pageId);

  if (blocks.length === 0) {
    // Empty page
    return {
      id: uuidv4(),
      sourcePageUrl,
      slides: [{
        id: uuidv4(),
        index: 0,
        title: 'No Content',
        blockIds: [],
      }],
      totalSlides: 1,
      recordMap,
      createdAt: new Date(),
    };
  }

  // Detect which heading level to use as slide boundary
  const slideBoundaryLevel = detectSlideHeadingLevel(blocks);

  if (slideBoundaryLevel === null) {
    // No headings found, return single slide with all content
    return {
      id: uuidv4(),
      sourcePageUrl,
      slides: [{
        id: uuidv4(),
        index: 0,
        title: 'No Content',
        blockIds: [],
      }],
      totalSlides: 1,
      recordMap,
      createdAt: new Date(),
    };
  }

  // Generate slides based on heading boundaries
  const slides: NotionSlide[] = [];
  let currentSlideBlocks: string[] = [];
  let currentTitle = 'Untitled Slide';
  let currentHeadingLevel: number | undefined;

  console.log(`[Slide Generator] Generating slides with boundary level: ${slideBoundaryLevel}`);

  for (const block of blocks) {
    const headingLevel = getHeadingLevel(block);

    // Check if this is a slide boundary
    if (headingLevel === slideBoundaryLevel) {
      // Save previous slide if it has content
      if (currentSlideBlocks.length > 0 || slides.length > 0) {
        console.log(`[Slide Generator] Creating slide ${slides.length}: "${currentTitle}" with ${currentSlideBlocks.length} blocks`);
        slides.push({
          id: uuidv4(),
          index: slides.length,
          title: currentTitle,
          blockIds: currentSlideBlocks,
          headingLevel: currentHeadingLevel,
        });
      }

      // Start new slide
      currentTitle = getBlockTitle(block);
      currentSlideBlocks = [];
      currentHeadingLevel = headingLevel;
      console.log(`[Slide Generator] Starting new slide: "${currentTitle}"`);
    } else {
      // Add block to current slide
      console.log(`[Slide Generator]   Adding block to slide: ${block.type} (${block.id.slice(0, 8)})`);
      currentSlideBlocks.push(block.id);
    }
  }

  // Add final slide
  if (currentSlideBlocks.length > 0 || slides.length === 0) {
    console.log(`[Slide Generator] Creating final slide ${slides.length}: "${currentTitle}" with ${currentSlideBlocks.length} blocks`);
    slides.push({
      id: uuidv4(),
      index: slides.length,
      title: currentTitle,
      blockIds: currentSlideBlocks,
      headingLevel: currentHeadingLevel,
    });
  }

  console.log(`[Slide Generator] Generated ${slides.length} slides total`);
  slides.forEach((slide, i) => {
    console.log(`[Slide Generator]   Slide ${i}: "${slide.title}" (${slide.blockIds.length} blocks)`);
  });

  return {
    id: uuidv4(),
    sourcePageUrl,
    slides,
    totalSlides: slides.length,
    recordMap,
    createdAt: new Date(),
  };
}
