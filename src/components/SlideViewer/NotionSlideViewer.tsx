/**
 * Slide viewer using react-notion-x for rendering Notion content
 */

import React, { useState, useEffect, useCallback } from 'react';
import { NotionRenderer } from 'react-notion-x';
import { ExtendedRecordMap } from 'notion-types';
import { NotionSlide, NotionSlideDeck } from '@/lib/notionSlideGenerator';
import { getBaseFontSize } from '@/lib/fontScaler';

interface NotionSlideViewerProps {
  slideDeck: NotionSlideDeck;
  onClose: () => void;
}

/**
 * Main slide viewer component with navigation
 */
export const NotionSlideViewer: React.FC<NotionSlideViewerProps> = ({
  slideDeck,
  onClose,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [fontSize, setFontSize] = useState(getBaseFontSize());

  const currentSlide = slideDeck.slides[currentSlideIndex];

  // Navigation handlers
  const goToNextSlide = useCallback(() => {
    if (currentSlideIndex < slideDeck.totalSlides - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  }, [currentSlideIndex, slideDeck.totalSlides]);

  const goToPreviousSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  }, [currentSlideIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ': // Space
          event.preventDefault();
          goToNextSlide();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          goToPreviousSlide();
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
        case 'Home':
          event.preventDefault();
          setCurrentSlideIndex(0);
          break;
        case 'End':
          event.preventDefault();
          setCurrentSlideIndex(slideDeck.totalSlides - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextSlide, goToPreviousSlide, onClose, slideDeck.totalSlides]);

  // Create a filtered recordMap for the current slide
  const getSlideRecordMap = (slide: NotionSlide): ExtendedRecordMap => {
    const filteredRecordMap: ExtendedRecordMap = {
      ...slideDeck.recordMap,
      block: {},
    };

    // Include only blocks for this slide
    for (const blockId of slide.blockIds) {
      if (slideDeck.recordMap.block[blockId]) {
        filteredRecordMap.block[blockId] = slideDeck.recordMap.block[blockId];

        // Also include child blocks recursively
        const includeChildBlocks = (parentBlockId: string) => {
          const block = slideDeck.recordMap.block[parentBlockId]?.value;
          if (block?.content) {
            for (const childId of block.content) {
              if (slideDeck.recordMap.block[childId]) {
                filteredRecordMap.block[childId] = slideDeck.recordMap.block[childId];
                includeChildBlocks(childId);
              }
            }
          }
        };

        includeChildBlocks(blockId);
      }
    }

    console.log(`[Slide Viewer] Slide has ${slide.blockIds.length} top-level blocks`);
    console.log(`[Slide Viewer] Block IDs:`, slide.blockIds.map(id => id.slice(0, 8)));

    return filteredRecordMap;
  };

  const slideRecordMap = getSlideRecordMap(currentSlide);

  return (
    <div
      className="notion-slide-viewer-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'white',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header with slide counter and close button */}
      <div
        className="slide-header"
        style={{
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div className="slide-counter" style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Slide {currentSlideIndex + 1} of {slideDeck.totalSlides}
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
          aria-label="Close presentation"
        >
          Close (Esc)
        </button>
      </div>

      {/* Slide content */}
      <div
        className="slide-content"
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '2rem',
          fontSize: `${fontSize}px`,
        }}
        role="region"
        aria-label={`Slide ${currentSlideIndex + 1}: ${currentSlide.title}`}
      >
        {/* Slide title */}
        <h1
          className="slide-title"
          style={{
            fontSize: '2em',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
          }}
        >
          {currentSlide.title}
        </h1>

        {/* Notion content */}
        {currentSlide.blockIds.length > 0 ? (
          <div className="slide-blocks">
            {currentSlide.blockIds.map((blockId) => {
              // Create a mini recordMap for each block with a virtual page
              const blockRecordMap: ExtendedRecordMap = {
                ...slideRecordMap,
                block: {},
              };

              // Include the block and all its children
              const includeBlock = (id: string) => {
                if (slideRecordMap.block[id]) {
                  blockRecordMap.block[id] = slideRecordMap.block[id];
                  const block = slideRecordMap.block[id]?.value;
                  if (block?.content) {
                    block.content.forEach(childId => includeBlock(childId));
                  }
                }
              };

              includeBlock(blockId);

              // Create a virtual page that contains this single block
              const virtualPageId = `virtual-page-${blockId}`;
              blockRecordMap.block[virtualPageId] = {
                role: 'reader',
                value: {
                  id: virtualPageId,
                  version: 1,
                  type: 'page',
                  properties: {
                    title: [['Block']]
                  },
                  content: [blockId],
                  created_time: Date.now(),
                  last_edited_time: Date.now(),
                  parent_id: '',
                  parent_table: 'block',
                  alive: true,
                  space_id: '',
                  created_by_table: 'notion_user',
                  created_by_id: '',
                  last_edited_by_table: 'notion_user',
                  last_edited_by_id: '',
                  permissions: [],
                } as any
              };

              // Render each block wrapped in a virtual page
              return (
                <NotionRenderer
                  key={blockId}
                  recordMap={blockRecordMap}
                  rootPageId={virtualPageId}
                  fullPage={false}
                  darkMode={false}
                  disableHeader={true}
                  showTableOfContents={false}
                />
              );
            })}
          </div>
        ) : (
          <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
            No content in this slide
          </p>
        )}
      </div>

      {/* Navigation controls */}
      <div
        className="slide-navigation"
        style={{
          padding: '1rem',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
        }}
      >
        <button
          onClick={goToPreviousSlide}
          disabled={currentSlideIndex === 0}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: currentSlideIndex === 0 ? '#f3f4f6' : '#3b82f6',
            color: currentSlideIndex === 0 ? '#9ca3af' : 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: currentSlideIndex === 0 ? 'not-allowed' : 'pointer',
          }}
          aria-label="Previous slide"
        >
          ← Previous
        </button>
        <button
          onClick={goToNextSlide}
          disabled={currentSlideIndex === slideDeck.totalSlides - 1}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: currentSlideIndex === slideDeck.totalSlides - 1 ? '#f3f4f6' : '#3b82f6',
            color: currentSlideIndex === slideDeck.totalSlides - 1 ? '#9ca3af' : 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: currentSlideIndex === slideDeck.totalSlides - 1 ? 'not-allowed' : 'pointer',
          }}
          aria-label="Next slide"
        >
          Next →
        </button>
      </div>
    </div>
  );
};
