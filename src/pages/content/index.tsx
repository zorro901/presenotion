/**
 * Content script for Notion to Slides extension
 * Listens for messages from popup and injects SlideViewer component
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import './style.css';
import { parseNotionPage, isNotionPage, hasContent } from './parser';
import { generateSlideDeck } from '@/lib/slideGenerator';
import { SlideViewer } from '@/components/SlideViewer/SlideViewer';
import {
  ExtensionMessage,
  MessageAction,
  StartPresentationMessage,
} from '@/types/notion';

// Store React root for cleanup
let slideViewerRoot: Root | null = null;
let slideViewerContainer: HTMLDivElement | null = null;

/**
 * Start presentation mode
 * Parses Notion page and injects SlideViewer
 */
function startPresentation(pageUrl: string) {
  console.log('[Notion to Slides] Starting presentation for:', pageUrl);

  // Check if on Notion page
  if (!isNotionPage()) {
    console.error('[Notion to Slides] Not on a Notion page');
    alert('This extension only works on Notion pages.');
    return;
  }

  // Check if page has content
  if (!hasContent()) {
    console.error('[Notion to Slides] Page has no content');
    alert('This Notion page has no content to display as slides.');
    return;
  }

  try {
    // Parse Notion page
    const blocks = parseNotionPage();
    console.log('[Notion to Slides] Parsed blocks:', blocks.length);

    if (blocks.length === 0) {
      alert('Could not parse any content from this Notion page.');
      return;
    }

    // Generate slide deck
    const deck = generateSlideDeck(blocks, pageUrl);
    console.log('[Notion to Slides] Generated slides:', deck.totalSlides);

    // Create container for SlideViewer
    slideViewerContainer = document.createElement('div');
    slideViewerContainer.id = 'notion-to-slides-viewer';
    document.body.appendChild(slideViewerContainer);

    // Create React root and render SlideViewer
    slideViewerRoot = createRoot(slideViewerContainer);
    slideViewerRoot.render(
      <SlideViewer deck={deck} onClose={closePresentation} />
    );
  } catch (error) {
    console.error('[Notion to Slides] Error starting presentation:', error);
    alert('Error parsing Notion page. Please try again or report this issue.');
  }
}

/**
 * Close presentation mode
 * Removes SlideViewer from DOM
 */
function closePresentation() {
  console.log('[Notion to Slides] Closing presentation');

  if (slideViewerRoot) {
    slideViewerRoot.unmount();
    slideViewerRoot = null;
  }

  if (slideViewerContainer && slideViewerContainer.parentNode) {
    slideViewerContainer.parentNode.removeChild(slideViewerContainer);
    slideViewerContainer = null;
  }
}

/**
 * Message listener for popup communication
 */
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    console.log('[Notion to Slides] Received message:', message.action);

    if (!isValidMessage(message)) {
      console.error('[Notion to Slides] Invalid message format:', message);
      return;
    }

    switch (message.action) {
      case MessageAction.START_PRESENTATION:
        const startMsg = message as StartPresentationMessage;
        startPresentation(startMsg.payload.pageUrl);
        sendResponse({ success: true });
        break;

      case MessageAction.CLOSE_PRESENTATION:
        closePresentation();
        sendResponse({ success: true });
        break;

      default:
        console.warn('[Notion to Slides] Unknown message action:', message.action);
    }
  }
);

/**
 * Validate message format
 */
function isValidMessage(message: any): message is ExtensionMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    typeof message.action === 'string' &&
    typeof message.timestamp === 'number'
  );
}

/**
 * Keyboard shortcut handler (Ctrl+Shift+P)
 */
chrome.commands?.onCommand?.addListener?.((command) => {
  if (command === 'start-presentation') {
    console.log('[Notion to Slides] Keyboard shortcut triggered');
    startPresentation(window.location.href);
  }
});

console.log('[Notion to Slides] Content script loaded');
