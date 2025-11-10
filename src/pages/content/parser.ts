/**
 * Notion DOM parser
 * Extracts content blocks from Notion page using ARIA roles and CSS selectors
 * Based on research.md hybrid parsing approach
 */

import {
  NotionBlock,
  NotionBlockType,
  TextFormatting,
} from '@/types/notion';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parse Notion page DOM and extract content blocks
 * Uses ARIA roles for structure and CSS selectors for details
 * @returns Array of NotionBlock objects
 */
export function parseNotionPage(): NotionBlock[] {
  const blocks: NotionBlock[] = [];

  try {
    console.log('[Notion to Slides] Starting to parse Notion page...');

    // Strategy 1: Try to find blocks with data-block-id (Notion web app)
    let blockElements = document.querySelectorAll('[data-block-id]');
    console.log(`[Notion to Slides] Strategy 1: Found ${blockElements.length} blocks with [data-block-id]`);

    // Strategy 2: Try to find direct h1, h2, h3, p tags with id (Notion export HTML)
    if (blockElements.length === 0) {
      console.log('[Notion to Slides] Strategy 2: Looking for direct h1, h2, h3, p tags...');

      // Find the page body or article
      const pageBody = document.querySelector('.page-body, article, main, [role="main"]');
      const searchRoot = pageBody || document.body;

      // Get all h1, h2, h3, and p elements that are direct children or have id
      blockElements = searchRoot.querySelectorAll('h1[id], h2[id], h3[id], p[id], h1, h2, h3, p:not(:empty)');
      console.log(`[Notion to Slides] Found ${blockElements.length} heading/paragraph tags`);
    }

    // Strategy 3: Try content area search
    if (blockElements.length === 0) {
      console.warn('[Notion to Slides] Strategy 3: Searching in content areas...');

      const contentSelectors = [
        '[data-content-editable-root="true"]',
        '.notion-page-content',
        '.notion-frame',
        '[role="textbox"]',
      ];

      for (const selector of contentSelectors) {
        const contentArea = document.querySelector(selector);
        if (contentArea) {
          console.log(`[Notion to Slides] Found content area: ${selector}`);
          blockElements = contentArea.querySelectorAll('[data-block-id], .notion-selectable, h1, h2, h3, p');
          if (blockElements.length > 0) {
            console.log(`[Notion to Slides] Found ${blockElements.length} blocks in content area`);
            break;
          }
        }
      }
    }

    // Parse each block
    blockElements.forEach((element, index) => {
      const block = parseBlock(element as HTMLElement);
      if (block) {
        console.log(`[Notion to Slides] Block ${index + 1}: ${block.type}${block.level ? ` H${block.level}` : ''} - "${block.content?.substring(0, 50)}..."`);
        blocks.push(block);
      }
    });

    console.log(`[Notion to Slides] Successfully parsed ${blocks.length} blocks`);
    if (blocks.length === 0) {
      console.error('[Notion to Slides] No blocks parsed! DOM:', document.body.innerHTML.substring(0, 500));
    }

    return blocks;
  } catch (error) {
    console.error('[Notion to Slides] Parsing error:', error);
    console.error('[Notion to Slides] Stack:', (error as Error).stack);
    return [];
  }
}

/**
 * Parse a single Notion block element
 */
function parseBlock(element: HTMLElement): NotionBlock | null {
  // Get block ID from data-block-id or id attribute
  const blockId =
    element.getAttribute('data-block-id') ||
    element.getAttribute('id') ||
    uuidv4();

  // Check if element itself is a heading tag
  if (element.tagName.match(/^H[1-6]$/)) {
    return parseHeading(element, blockId);
  }

  // Check for heading (multiple methods)
  const isHeading =
    element.querySelector('[role="heading"]') ||
    element.querySelector('h1, h2, h3, h4, h5, h6') ||
    element.classList.contains('notion-header-block') ||
    Array.from(element.classList).some(c => c.includes('heading'));

  if (isHeading) {
    return parseHeading(element, blockId);
  }

  // Check for list (using ARIA role)
  if (element.querySelector('[role="list"]') || element.tagName === 'UL' || element.tagName === 'OL') {
    return parseList(element, blockId);
  }

  // Check for image
  const img = element.querySelector('img');
  if (img) {
    return parseImage(element, blockId, img);
  }

  // Check for code block
  if (element.querySelector('code, pre') || element.classList.contains('code')) {
    return parseCodeBlock(element, blockId);
  }

  // Check for quote
  if (element.classList.contains('notion-quote-block') ||
      element.querySelector('blockquote') ||
      element.tagName === 'BLOCKQUOTE') {
    return parseQuote(element, blockId);
  }

  // Default to paragraph if it has content (and is actually a paragraph tag or has text)
  const content = extractTextContent(element);
  if (content && content.trim().length > 0) {
    return {
      id: blockId,
      type: NotionBlockType.PARAGRAPH,
      content,
      formatting: extractFormatting(element),
    };
  }

  return null;
}

/**
 * Parse heading block
 */
function parseHeading(
  element: HTMLElement,
  blockId: string
): NotionBlock | null {
  let headingElement: HTMLElement | null = null;
  let level = 1;

  // Check if element itself is a heading tag (e.g., <h1>)
  if (element.tagName.match(/^H[1-6]$/)) {
    headingElement = element;
    level = parseInt(element.tagName.substring(1), 10);
  } else {
    // Try ARIA role
    headingElement = element.querySelector('[role="heading"]') as HTMLElement;
    if (headingElement) {
      const ariaLevel = headingElement.getAttribute('aria-level');
      level = ariaLevel ? parseInt(ariaLevel, 10) : 1;
    }
  }

  // If not found, try h1, h2, h3 tags within element
  if (!headingElement) {
    headingElement = element.querySelector('h1, h2, h3, h4, h5, h6') as HTMLElement;
    if (headingElement) {
      level = parseInt(headingElement.tagName.substring(1), 10);
    }
  }

  // Try data-content-editable-leaf with heading classes
  if (!headingElement) {
    const leafElement = element.querySelector('[data-content-editable-leaf="true"]') as HTMLElement;
    if (leafElement) {
      const parent = leafElement.closest('[class*="heading"], [class*="header"]');
      if (parent) {
        headingElement = leafElement;
        // Try to detect level from classes
        const className = parent.className;
        if (className.includes('heading_1') || className.includes('header-1')) level = 1;
        else if (className.includes('heading_2') || className.includes('header-2')) level = 2;
        else if (className.includes('heading_3') || className.includes('header-3')) level = 3;
      }
    }
  }

  if (!headingElement) {
    console.warn('[Notion to Slides] No heading element found:', blockId);
    return null;
  }

  const content = extractTextContent(headingElement);
  console.log(`[Notion to Slides] ✓ Heading H${level}: "${content?.substring(0, 50)}..."`);

  return {
    id: blockId,
    type: NotionBlockType.HEADING,
    content,
    level,
    formatting: extractFormatting(headingElement),
  };
}

/**
 * Parse list block
 */
function parseList(
  element: HTMLElement,
  blockId: string
): NotionBlock | null {
  const listElement = element.querySelector('[role="list"]') as HTMLElement;
  if (!listElement) return null;

  const listItems: string[] = [];
  const items = listElement.querySelectorAll('[role="listitem"]');

  items.forEach((item) => {
    const content = extractTextContent(item as HTMLElement);
    if (content) {
      listItems.push(content);
    }
  });

  // Determine list type (bullet vs numbered)
  const isBulletList = listElement.tagName === 'UL' ||
    listElement.classList.contains('notion-bulleted-list');

  return {
    id: blockId,
    type: isBulletList
      ? NotionBlockType.BULLET_LIST
      : NotionBlockType.NUMBERED_LIST,
    content: '',
    listItems,
    listType: isBulletList ? 'bullet' : 'numbered',
  };
}

/**
 * Parse image block
 */
function parseImage(
  element: HTMLElement,
  blockId: string,
  img: HTMLImageElement
): NotionBlock {
  return {
    id: blockId,
    type: NotionBlockType.IMAGE,
    content: '',
    imageUrl: img.src,
    imageAlt: img.alt || 'Image',
  };
}

/**
 * Parse code block
 */
function parseCodeBlock(
  element: HTMLElement,
  blockId: string
): NotionBlock {
  const codeElement = element.querySelector('code');
  const content = codeElement?.textContent || '';

  // Try to detect language from class names
  const className = codeElement?.className || '';
  const languageMatch = className.match(/language-(\w+)/);
  const language = languageMatch ? languageMatch[1] : undefined;

  return {
    id: blockId,
    type: NotionBlockType.CODE,
    content,
    codeLanguage: language,
  };
}

/**
 * Parse quote block
 */
function parseQuote(
  element: HTMLElement,
  blockId: string
): NotionBlock {
  const content = extractTextContent(element);

  return {
    id: blockId,
    type: NotionBlockType.QUOTE,
    content,
    formatting: extractFormatting(element),
  };
}

/**
 * Extract text content from element
 * Uses Notion's data-content-editable-leaf attribute
 */
function extractTextContent(element: HTMLElement): string {
  // Try to find content in editable leaf elements
  const leaves = element.querySelectorAll('[data-content-editable-leaf="true"]');

  if (leaves.length > 0) {
    return Array.from(leaves)
      .map((leaf) => leaf.textContent || '')
      .join('');
  }

  // Fallback to textContent
  return element.textContent?.trim() || '';
}

/**
 * Extract text formatting information
 * Detects bold, italic, underline, strikethrough, code
 */
function extractFormatting(element: HTMLElement): TextFormatting[] {
  const formatting: TextFormatting[] = [];
  const text = element.textContent || '';

  // Find all formatted spans within element
  const formattedElements = element.querySelectorAll('strong, em, u, s, code');

  formattedElements.forEach((el) => {
    const content = el.textContent || '';
    const start = text.indexOf(content);

    if (start >= 0) {
      let type: TextFormatting['type'] = 'bold';

      if (el.tagName === 'STRONG' || el.tagName === 'B') {
        type = 'bold';
      } else if (el.tagName === 'EM' || el.tagName === 'I') {
        type = 'italic';
      } else if (el.tagName === 'U') {
        type = 'underline';
      } else if (el.tagName === 'S' || el.tagName === 'DEL') {
        type = 'strikethrough';
      } else if (el.tagName === 'CODE') {
        type = 'code';
      }

      formatting.push({
        type,
        start,
        end: start + content.length,
      });
    }
  });

  return formatting;
}

/**
 * Check if current page is a Notion page
 */
export function isNotionPage(): boolean {
  return (
    window.location.hostname.includes('notion.so') ||
    window.location.hostname.includes('notion.site')
  );
}

/**
 * Validate page has content
 */
export function hasContent(): boolean {
  const blocks = document.querySelectorAll('[data-block-id]');
  return blocks.length > 0;
}
