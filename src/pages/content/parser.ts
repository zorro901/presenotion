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

  // Check for code block (multiple detection methods)
  const hasCodeBlock =
    element.querySelector('code, pre') ||
    element.classList.contains('code') ||
    element.classList.contains('notion-code-block') ||
    Array.from(element.classList).some(c => c.includes('code'));

  if (hasCodeBlock) {
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
 * Parse list block with support for nested content
 */
function parseList(
  element: HTMLElement,
  blockId: string
): NotionBlock | null {
  const listElement = element.querySelector('[role="list"]') as HTMLElement;
  if (!listElement) return null;

  const listItems: string[] = [];
  const children: NotionBlock[] = [];

  // Get all list items
  const items = listElement.querySelectorAll('[role="listitem"]');

  items.forEach((item) => {
    const itemElement = item as HTMLElement;

    // Extract only the direct text content of this list item (excluding nested blocks)
    let textContent = '';

    // Strategy 1: Find the direct content editable leaf that belongs to this list item
    // We need to avoid nested block content
    const directLeaf = Array.from(itemElement.querySelectorAll('[data-content-editable-leaf="true"]'))
      .find(leaf => {
        // Check if this leaf is a direct child (not inside a nested block)
        let parent = leaf.parentElement;
        while (parent && parent !== itemElement) {
          // If we encounter another block with data-block-id, this leaf is nested
          if (parent.hasAttribute('data-block-id') && parent !== itemElement) {
            return false;
          }
          parent = parent.parentElement;
        }
        return true;
      });

    if (directLeaf) {
      textContent = (directLeaf.textContent || '').trim();
    } else {
      // Strategy 2: Fallback for simple HTML structure (testing or simple pages)
      // Get direct text nodes only (not from nested blocks)
      const clonedItem = itemElement.cloneNode(true) as HTMLElement;

      // Remove all nested blocks from the clone
      const nestedBlockElements = clonedItem.querySelectorAll('[data-block-id]');
      nestedBlockElements.forEach(nested => {
        if (nested !== clonedItem) {
          nested.remove();
        }
      });

      textContent = (clonedItem.textContent || '').trim();
    }

    // If we found text, add it to the list
    if (textContent) {
      listItems.push(textContent);
    }

    // Check for nested blocks within this list item (e.g., quotes, nested lists)
    const nestedBlocks = parseNestedBlocks(itemElement);
    if (nestedBlocks.length > 0) {
      children.push(...nestedBlocks);
    }
  });

  // Determine list type (bullet vs numbered)
  const isBulletList = element.classList.contains('notion-bulleted_list-block') ||
    listElement.tagName === 'UL' ||
    listElement.classList.contains('notion-bulleted-list');

  return {
    id: blockId,
    type: isBulletList
      ? NotionBlockType.BULLET_LIST
      : NotionBlockType.NUMBERED_LIST,
    content: '',
    listItems,
    listType: isBulletList ? 'bullet' : 'numbered',
    children: children.length > 0 ? children : undefined,
  };
}

/**
 * Parse nested blocks within a parent block (like quotes inside list items)
 */
function parseNestedBlocks(parentElement: HTMLElement): NotionBlock[] {
  const nestedBlocks: NotionBlock[] = [];

  // Find child blocks with data-block-id
  const childElements = parentElement.querySelectorAll('[data-block-id]');

  childElements.forEach((childElement) => {
    // Skip if this is the parent element itself
    if (childElement === parentElement) return;

    // Check if this element is a direct descendant
    let isDirectChild = false;
    let parent = childElement.parentElement;
    while (parent) {
      if (parent === parentElement) {
        isDirectChild = true;
        break;
      }
      // Stop if we hit another block with data-block-id
      if (parent.hasAttribute('data-block-id') && parent !== parentElement) {
        break;
      }
      parent = parent.parentElement;
    }

    if (!isDirectChild) return;

    const block = parseBlock(childElement as HTMLElement);
    if (block) {
      nestedBlocks.push(block);
    }
  });

  return nestedBlocks;
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
  // Try multiple strategies to find code content
  let codeElement = element.querySelector('code');
  let preElement = element.querySelector('pre');

  // For Notion's code blocks, the code might be in a pre > code structure
  if (preElement && !codeElement) {
    codeElement = preElement.querySelector('code');
  }

  // If still not found, check if the element itself is a code or pre tag
  if (!codeElement && (element.tagName === 'CODE' || element.tagName === 'PRE')) {
    codeElement = element;
  }

  // Extract content using multiple methods
  let content = '';
  if (codeElement) {
    content = codeElement.textContent || '';
  } else if (preElement) {
    content = preElement.textContent || '';
  } else {
    // Fallback: try to find content in editable leaf
    const leafElement = element.querySelector('[data-content-editable-leaf="true"]');
    content = leafElement?.textContent || element.textContent || '';
  }

  // Try to detect language from multiple sources
  let language: string | undefined;

  // 1. Try class names (e.g., language-javascript, prism-javascript)
  const classNames = [
    codeElement?.className || '',
    preElement?.className || '',
    element.className
  ].join(' ');

  const languageMatch = classNames.match(/(?:language|prism)-(\w+)/);
  if (languageMatch) {
    language = languageMatch[1];
  }

  // 2. Try data attributes (Notion might use data-language)
  if (!language) {
    language =
      element.getAttribute('data-language') ||
      codeElement?.getAttribute('data-language') ||
      preElement?.getAttribute('data-language') ||
      undefined;
  }

  return {
    id: blockId,
    type: NotionBlockType.CODE,
    content: content.trim(),
    codeLanguage: language,
  };
}

/**
 * Parse quote block with nested content support
 */
function parseQuote(
  element: HTMLElement,
  blockId: string
): NotionBlock {
  // Extract only the direct text content (excluding nested blocks)
  let content = '';

  // Find the direct content editable leaf that belongs to this quote
  const directLeaf = Array.from(element.querySelectorAll('[data-content-editable-leaf="true"]'))
    .find(leaf => {
      // Check if this leaf is a direct child (not inside a nested block)
      let parent = leaf.parentElement;
      while (parent && parent !== element) {
        // If we encounter another block with data-block-id, this leaf is nested
        if (parent.hasAttribute('data-block-id') && parent !== element) {
          return false;
        }
        parent = parent.parentElement;
      }
      return true;
    });

  if (directLeaf) {
    content = (directLeaf.textContent || '').trim();
  } else {
    // Fallback for simple HTML structure (testing or simple pages)
    // Clone and remove nested blocks to get only direct content
    const clonedElement = element.cloneNode(true) as HTMLElement;

    // Remove all nested blocks from the clone
    const nestedBlockElements = clonedElement.querySelectorAll('[data-block-id]');
    nestedBlockElements.forEach(nested => {
      if (nested !== clonedElement) {
        nested.remove();
      }
    });

    content = (clonedElement.textContent || '').trim();
  }

  // Check for nested blocks within this quote
  const nestedBlocks = parseNestedBlocks(element);

  return {
    id: blockId,
    type: NotionBlockType.QUOTE,
    content,
    formatting: extractFormatting(element),
    children: nestedBlocks.length > 0 ? nestedBlocks : undefined,
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
