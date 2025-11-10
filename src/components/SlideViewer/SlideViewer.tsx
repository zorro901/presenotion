/**
 * Main slide viewer component
 * Manages slide presentation state and orchestrates child components
 */

import React, { useState, useEffect, useRef } from 'react';
import type { SlideDeck } from '@/types/notion';
import { Slide } from './Slide';
import { Navigation } from './Navigation';
import { SlideCounter } from './SlideCounter';
import { useSlideNavigation } from '@/lib/keyboardHandler';
import { calculateFontSize } from '@/lib/fontScaler';

interface SlideViewerProps {
  deck: SlideDeck;
  onClose: () => void;
}

export const SlideViewer: React.FC<SlideViewerProps> = ({ deck, onClose }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slideFontSizes, setSlideFontSizes] = useState<number[]>(
    deck.slides.map(() => 24) // Default font size
  );
  const slideRef = useRef<HTMLDivElement>(null);

  const currentSlide = deck.slides[currentSlideIndex];

  // Set up keyboard navigation
  const navigation = useSlideNavigation({
    slides: deck.slides,
    currentSlide: currentSlideIndex,
    onNavigate: setCurrentSlideIndex,
    onClose,
  });

  // Calculate font size for current slide
  useEffect(() => {
    if (!slideRef.current) return;

    const measureAndScale = () => {
      const slideElement = slideRef.current;
      if (!slideElement) return;

      // Get viewport height (slide container)
      const viewportHeight = slideElement.clientHeight;

      // Temporarily set to base font size to measure content
      const contentElement = slideElement.querySelector('.slide-content') as HTMLElement;
      if (!contentElement) return;

      contentElement.style.fontSize = '24px';

      // Measure content height
      const contentHeight = contentElement.scrollHeight;

      // Calculate optimal font size
      const optimalFontSize = calculateFontSize(contentHeight, viewportHeight);

      // Update font size for this slide
      setSlideFontSizes(prev => {
        const newSizes = [...prev];
        newSizes[currentSlideIndex] = optimalFontSize;
        return newSizes;
      });
    };

    // Measure after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(measureAndScale, 100);

    // Re-measure on window resize
    window.addEventListener('resize', measureAndScale);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', measureAndScale);
    };
  }, [currentSlideIndex]);

  return (
    <div
      className="slide-viewer-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Slide presentation"
    >
      {/* Slide container */}
      <div
        ref={slideRef}
        className="slide-container"
        style={{
          width: '90%',
          maxWidth: '1200px',
          height: '80%',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Slide
          slide={currentSlide}
          fontSize={slideFontSizes[currentSlideIndex]}
        />
      </div>

      {/* Slide counter */}
      <SlideCounter
        currentSlide={currentSlideIndex}
        totalSlides={deck.totalSlides}
      />

      {/* Navigation controls */}
      <Navigation
        currentSlide={currentSlideIndex}
        totalSlides={deck.totalSlides}
        onPrevious={navigation.goToPrevious}
        onNext={navigation.goToNext}
        onClose={onClose}
      />

      {/* Show parsing errors if any */}
      {deck.parsingErrors.length > 0 && (
        <div
          className="parsing-errors"
          style={{
            position: 'absolute',
            bottom: '5rem',
            left: '2rem',
            padding: '0.5rem 1rem',
            background: '#FEF3C7',
            borderLeft: '4px solid #F59E0B',
            borderRadius: '0.25rem',
            fontSize: '0.875rem',
          }}
          role="alert"
        >
          <strong>Warning:</strong> {deck.parsingErrors.length} parsing error(s) occurred
        </div>
      )}
    </div>
  );
};
