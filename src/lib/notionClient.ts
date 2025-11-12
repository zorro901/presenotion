/**
 * Notion API client wrapper using notion-client
 * Provides utilities for fetching Notion page data
 */

import { NotionAPI } from 'notion-client';

/**
 * Extract Notion page ID from URL
 * Supports various Notion URL formats:
 * - https://www.notion.so/page-title-{pageId}
 * - https://www.notion.so/{workspace}/page-title-{pageId}
 * - Custom domains
 */
export function extractPageId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    console.log('[Notion Client] Extracting page ID from URL:', url);
    console.log('[Notion Client] Pathname:', pathname);

    // Page ID is typically the last segment or last 32 characters
    // Format: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (32 hex characters)
    const segments = pathname.split('/').filter(s => s.length > 0);

    if (segments.length === 0) {
      console.log('[Notion Client] No segments found in pathname');
      return null;
    }

    // Get the last segment (might be "page-title-{pageId}")
    const lastSegment = segments[segments.length - 1];
    console.log('[Notion Client] Last segment:', lastSegment);

    // Extract 32-character hex ID (with or without hyphens)
    // Notion IDs can be:
    // - 32 hex chars without hyphens: a326d05be4bc410cb674673e89ebe3fe
    // - UUID format: a326d05b-e4bc-410c-b674-673e89ebe3fe
    const idMatch = lastSegment.match(/([a-f0-9]{32})|([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);

    if (idMatch) {
      const pageId = idMatch[0];
      console.log('[Notion Client] Extracted raw page ID:', pageId);
      // Normalize to UUID format with hyphens
      if (!pageId.includes('-')) {
        const formattedId = formatPageId(pageId);
        console.log('[Notion Client] Formatted page ID:', formattedId);
        return formattedId;
      }
      console.log('[Notion Client] Using page ID with hyphens:', pageId);
      return pageId;
    }

    // Fallback: check if the last segment itself is a valid ID
    if (isValidPageId(lastSegment)) {
      console.log('[Notion Client] Last segment is valid ID:', lastSegment);
      return lastSegment;
    }

    console.log('[Notion Client] No valid page ID found');
    return null;
  } catch (error) {
    console.error('[Notion Client] Error extracting page ID:', error);
    return null;
  }
}

/**
 * Format a 32-char hex string to UUID format
 * Example: a326d05be4bc410cb674673e89ebe3fe -> a326d05b-e4bc-410c-b674-673e89ebe3fe
 */
function formatPageId(id: string): string {
  if (id.length !== 32) {
    return id;
  }

  return [
    id.slice(0, 8),
    id.slice(8, 12),
    id.slice(12, 16),
    id.slice(16, 20),
    id.slice(20, 32),
  ].join('-');
}

/**
 * Check if a string is a valid Notion page ID
 */
function isValidPageId(id: string): boolean {
  // With hyphens: 8-4-4-4-12 format
  const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  // Without hyphens: 32 hex chars
  const hexPattern = /^[a-f0-9]{32}$/i;

  return uuidPattern.test(id) || hexPattern.test(id);
}

/**
 * Notion API client singleton
 */
let notionClient: NotionAPI | null = null;

/**
 * Get or create Notion API client
 * Configured to include credentials for authenticated requests
 */
export function getNotionClient(): NotionAPI {
  if (!notionClient) {
    notionClient = new NotionAPI({
      // Enable credentials to use browser cookies for authentication
      // This allows access to private Notion pages when user is logged in
      // @ts-ignore - ofetchOptions may not be in type definitions
      ofetchOptions: {
        credentials: 'include',
        mode: 'cors'
      }
    });
    console.log('[Notion Client] Client initialized with credentials enabled');
  }
  return notionClient;
}

/**
 * Fetch a Notion page by ID
 * @param pageId - The Notion page ID
 * @returns Promise with the page record map
 */
export async function fetchNotionPage(pageId: string) {
  try {
    console.log('[Notion Client] Fetching page with ID:', pageId);
    console.log('[Notion Client] Page ID length:', pageId.length);
    console.log('[Notion Client] Page ID format valid:', isValidPageId(pageId));

    const notion = getNotionClient();
    const recordMap = await notion.getPage(pageId);

    console.log('[Notion Client] Page fetched successfully');
    console.log('[Notion Client] RecordMap blocks count:', Object.keys(recordMap.block || {}).length);
    return recordMap;
  } catch (error) {
    console.error('[Notion Client] Error fetching page:', error);
    console.error('[Notion Client] Failed page ID:', pageId);
    throw error;
  }
}

/**
 * Fetch the current Notion page based on window.location
 * @returns Promise with the page record map, or null if not a valid Notion page
 */
export async function fetchCurrentNotionPage() {
  const pageId = extractPageId(window.location.href);

  if (!pageId) {
    console.error('[Notion Client] Could not extract page ID from URL:', window.location.href);
    return null;
  }

  return fetchNotionPage(pageId);
}
