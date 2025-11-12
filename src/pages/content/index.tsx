/**
 * Content script for Notion to Slides extension
 * Uses react-notion-x for rendering Notion content
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import './style.css';
import { isNotionPage } from './parser';
import { fetchCurrentNotionPage } from '@/lib/notionClient';
import { generateSlidesFromRecordMap } from '@/lib/notionSlideGenerator';
import { NotionSlideViewer } from '@/components/SlideViewer/NotionSlideViewer';
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
 * Fetches Notion page via API and injects SlideViewer
 */
async function startPresentation(pageUrl: string) {
  console.log('[Notion to Slides] Starting presentation for:', pageUrl);

  // Check if on Notion page
  if (!isNotionPage()) {
    console.error('[Notion to Slides] Not on a Notion page');
    alert('This extension only works on Notion pages.');
    return;
  }

  try {
    // Show loading message
    showLoadingMessage();

    // Fetch Notion page data via API
    console.log('[Notion to Slides] Fetching page data...');
    const recordMap = await fetchCurrentNotionPage();

    if (!recordMap) {
      hideLoadingMessage();
      alert('Could not fetch Notion page data. Please make sure you are on a valid Notion page.');
      return;
    }

    console.log('[Notion to Slides] Page data fetched successfully');

    // Generate slide deck from recordMap
    const slideDeck = generateSlidesFromRecordMap(recordMap, pageUrl);
    console.log('[Notion to Slides] Generated slides:', slideDeck.totalSlides);

    hideLoadingMessage();

    if (slideDeck.totalSlides === 0) {
      alert('This Notion page has no content to display as slides.');
      return;
    }

    // Create container for SlideViewer
    slideViewerContainer = document.createElement('div');
    slideViewerContainer.id = 'notion-to-slides-viewer';
    document.body.appendChild(slideViewerContainer);

    // Create React root and render SlideViewer
    slideViewerRoot = createRoot(slideViewerContainer);
    slideViewerRoot.render(
      <NotionSlideViewer slideDeck={slideDeck} onClose={closePresentation} />
    );
  } catch (error) {
    hideLoadingMessage();
    console.error('[Notion to Slides] Error starting presentation:', error);
    alert('Error loading Notion page. Please try again or report this issue.');
  }
}

/**
 * Show loading message
 */
function showLoadingMessage() {
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'notion-to-slides-loading';
  loadingDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 2rem;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 999998;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;
  loadingDiv.innerHTML = `
    <div style="text-align: center;">
      <div style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">
        Loading Notion page...
      </div>
      <div style="color: #6b7280; font-size: 0.875rem;">
        This may take a few seconds
      </div>
    </div>
  `;
  document.body.appendChild(loadingDiv);
}

/**
 * Hide loading message
 */
function hideLoadingMessage() {
  const loadingDiv = document.getElementById('notion-to-slides-loading');
  if (loadingDiv && loadingDiv.parentNode) {
    loadingDiv.parentNode.removeChild(loadingDiv);
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
