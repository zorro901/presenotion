/**
 * Data model for Notion to Slides extension
 * Based on data-model.md specification
 */

// Notion Block Types
export enum NotionBlockType {
  HEADING = 'heading',
  PARAGRAPH = 'paragraph',
  BULLET_LIST = 'bullet_list',
  NUMBERED_LIST = 'numbered_list',
  IMAGE = 'image',
  CODE = 'code',
  QUOTE = 'quote',
  DIVIDER = 'divider',
  UNSUPPORTED = 'unsupported'
}

// Text formatting markers
export interface TextFormatting {
  type: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code';
  start: number; // Character index where formatting starts
  end: number;   // Character index where formatting ends
}

// Notion content block extracted from DOM
export interface NotionBlock {
  id: string;                    // Notion's data-block-id or generated UUID
  type: NotionBlockType;         // Block content type
  content: string;               // Text content (empty for non-text blocks)
  level?: number;                // Heading level (1-6), only for heading blocks
  formatting?: TextFormatting[]; // Inline formatting markers
  imageUrl?: string;             // Image source URL, only for image blocks
  imageAlt?: string;             // Image alt text for accessibility
  listItems?: string[];          // List item contents, only for list blocks
  listType?: 'bullet' | 'numbered'; // List type, only for list blocks
  codeLanguage?: string;         // Code block language, only for code blocks
  children?: NotionBlock[];      // Nested blocks (for complex structures like lists with quotes)
}

// Slide metadata
export interface SlideMetadata {
  hasImages: boolean;           // True if slide contains images
  hasCode: boolean;             // True if slide contains code blocks
  hasLists: boolean;            // True if slide contains lists
  blockCount: number;           // Total number of blocks in slide
  wordCount: number;            // Approximate word count for content density
}

// Single presentation slide
export interface Slide {
  id: string;                   // Generated UUID for slide
  index: number;                // 0-based slide position in deck
  title: string;                // Slide title (from H1 heading or "Untitled")
  blocks: NotionBlock[];        // Content blocks belonging to this slide
  estimatedHeight: number;      // Calculated content height in pixels
  fontSize: number;             // Calculated font size after scaling (12-24px)
  metadata: SlideMetadata;      // Additional slide information
}

// Parsing error information
export interface ParsingError {
  blockId?: string;             // Notion block ID where error occurred
  message: string;              // Human-readable error description
  blockType?: NotionBlockType;  // Type of block that failed to parse
}

// Complete slide deck from Notion page
export interface SlideDeck {
  id: string;                   // Generated UUID for deck
  sourcePageUrl: string;        // Notion page URL
  slides: Slide[];              // Ordered array of slides
  totalSlides: number;          // Convenience count (slides.length)
  createdAt: Date;              // Timestamp when deck was generated
  parsingErrors: ParsingError[]; // Any errors during DOM parsing
}

// Navigation state
export interface NavigationState {
  currentSlideIndex: number;    // 0-based index of currently displayed slide
  totalSlides: number;          // Total slide count in deck
  history: number[];            // Stack of previously visited slide indices
  isFullscreen: boolean;        // True if presentation in fullscreen mode
}

// Message action types
export enum MessageAction {
  START_PRESENTATION = 'start_presentation',
  CLOSE_PRESENTATION = 'close_presentation',
  NAVIGATE_NEXT = 'navigate_next',
  NAVIGATE_PREVIOUS = 'navigate_previous',
  NAVIGATE_TO_SLIDE = 'navigate_to_slide',
  PARSING_ERROR = 'parsing_error',
  PARSING_COMPLETE = 'parsing_complete'
}

// Base extension message
export interface ExtensionMessage {
  action: MessageAction;
  payload?: any;                // Action-specific data
  timestamp: number;            // Message creation timestamp
}

// Specific message types
export interface StartPresentationMessage extends ExtensionMessage {
  action: MessageAction.START_PRESENTATION;
  payload: {
    pageUrl: string;            // Current Notion page URL
  };
}

export interface NavigateToSlideMessage extends ExtensionMessage {
  action: MessageAction.NAVIGATE_TO_SLIDE;
  payload: {
    slideIndex: number;         // Target slide index
  };
}

export interface ParsingCompleteMessage extends ExtensionMessage {
  action: MessageAction.PARSING_COMPLETE;
  payload: {
    deck: SlideDeck;            // Generated slide deck
  };
}

export interface ParsingErrorMessage extends ExtensionMessage {
  action: MessageAction.PARSING_ERROR;
  payload: {
    message: string;            // User-friendly error message
    technicalDetails?: string;  // Debug information (optional)
  };
}
