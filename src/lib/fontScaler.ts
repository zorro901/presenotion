/**
 * Font scaling algorithm for slide content
 * Automatically reduces font size to fit long content within viewport
 * Based on research.md specification
 */

const BASE_FONT_SIZE = 24; // Base slide font size in px
const MIN_FONT_SIZE = 12;  // Minimum readable size

/**
 * Calculate optimal font size for slide content
 * @param contentHeight - Height of content in pixels at base font size
 * @param viewportHeight - Available viewport height in pixels
 * @returns Calculated font size (12-24px)
 */
export function calculateFontSize(
  contentHeight: number,
  viewportHeight: number
): number {
  if (contentHeight <= 0 || viewportHeight <= 0) {
    return BASE_FONT_SIZE;
  }

  // Calculate scale factor based on viewport ratio
  const scaleFactor = Math.min(1.0, viewportHeight / contentHeight);
  const calculatedSize = BASE_FONT_SIZE * scaleFactor;

  // Clamp to minimum readable size
  return Math.max(MIN_FONT_SIZE, Math.round(calculatedSize));
}

/**
 * Get base font size for slides
 */
export function getBaseFontSize(): number {
  return BASE_FONT_SIZE;
}

/**
 * Get minimum font size threshold
 */
export function getMinFontSize(): number {
  return MIN_FONT_SIZE;
}

/**
 * Check if content will require font scaling
 * @param contentHeight - Height of content in pixels
 * @param viewportHeight - Available viewport height in pixels
 * @returns true if font scaling will be applied
 */
export function requiresFontScaling(
  contentHeight: number,
  viewportHeight: number
): boolean {
  return contentHeight > viewportHeight;
}
