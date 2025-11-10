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
    // Find all content blocks in Notion page
    // Notion uses div[data-block-id] for blocks
    const blockElements = document.querySelectorAll('[data-block-id]');

    blockElements.forEach((element) => {
      const block = parseBlock(element as HTMLElement);
      if (block) {
        blocks.push(block);
      }
    });

    return blocks;
  } catch (error) {
    console.error('[Notion to Slides] Parsing error:', error);
    return [];
  }
}

/**
 * Parse a single Notion block element
 */
function parseBlock(element: HTMLElement): NotionBlock | null {
  const blockId =
    element.getAttribute('data-block-id') || uuidv4();

  // Check for heading (using ARIA role)
  if (element.querySelector('[role="heading"]')) {
    return parseHeading(element, blockId);
  }

  // Check for list (using ARIA role)
  if (element.querySelector('[role="list"]')) {
    return parseList(element, blockId);
  }

  // Check for image
  const img = element.querySelector('img');
  if (img) {
    return parseImage(element, blockId, img);
  }

  // Check for code block
  if (element.querySelector('code')) {
    return parseCodeBlock(element, blockId);
  }

  // Check for quote
  if (element.classList.contains('notion-quote-block')) {
    return parseQuote(element, blockId);
  }

  // Default to paragraph
  const content = extractTextContent(element);
  if (content) {
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
  const headingElement = element.querySelector('[role="heading"]') as HTMLElement;
  if (!headingElement) return null;

  const ariaLevel = headingElement.getAttribute('aria-level');
  const level = ariaLevel ? parseInt(ariaLevel, 10) : 1;
  const content = extractTextContent(headingElement);

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
