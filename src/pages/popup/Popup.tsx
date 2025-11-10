/**
 * Popup component for Notion to Slides extension
 * Displays a button to start presentation mode
 */

import React, { useState, useEffect } from 'react';
import { MessageAction, StartPresentationMessage } from '@/types/notion';

export default function Popup() {
  const [isNotionPage, setIsNotionPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    // Check if current tab is a Notion page
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        const url = tabs[0].url;
        setCurrentUrl(url);
        const isNotion = url.includes('notion.so') || url.includes('notion.site');
        setIsNotionPage(isNotion);
      }
      setIsLoading(false);
    });
  }, []);

  const handleStartPresentation = async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];

      if (!activeTab?.id) {
        console.error('No active tab found');
        return;
      }

      const message: StartPresentationMessage = {
        action: MessageAction.START_PRESENTATION,
        payload: {
          pageUrl: activeTab.url || '',
        },
        timestamp: Date.now(),
      };

      chrome.tabs.sendMessage(activeTab.id, message);

      // Close popup after sending message
      window.close();
    } catch (error) {
      console.error('Error starting presentation:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="w-64 p-4 bg-white">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isNotionPage) {
    return (
      <div className="w-64 p-4 bg-white">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Notion to Slides</h2>
        <p className="text-gray-600 text-sm">
          This extension only works on Notion pages.
        </p>
        <p className="text-gray-500 text-xs mt-2">
          Navigate to a Notion page to use this extension.
        </p>
      </div>
    );
  }

  return (
    <div className="w-64 p-4 bg-white">
      <h2 className="text-lg font-bold text-gray-800 mb-3">Notion to Slides</h2>
      <p className="text-gray-600 text-sm mb-4">
        Convert this Notion page into a presentation.
      </p>

      <button
        onClick={handleStartPresentation}
        className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors"
      >
        Start Presentation
      </button>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Keyboard shortcut: <kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+Shift+P</kbd>
        </p>
      </div>
    </div>
  );
}
