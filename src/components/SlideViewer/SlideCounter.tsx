/**
 * Slide counter component
 * Displays "slide X of Y" with accessibility support
 */

import React from 'react';

interface SlideCounterProps {
  currentSlide: number;
  totalSlides: number;
}

export const SlideCounter: React.FC<SlideCounterProps> = ({
  currentSlide,
  totalSlides,
}) => {
  const slideNumber = currentSlide + 1; // Convert from 0-based to 1-based

  return (
    <div
      className="slide-counter"
      style={{
        position: 'absolute',
        top: '2rem',
        right: '2rem',
        padding: '0.5rem 1rem',
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '0.25rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        fontSize: '1rem',
        fontWeight: 'bold',
        color: '#374151',
      }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`Slide ${slideNumber} of ${totalSlides}`}
    >
      Slide {slideNumber} of {totalSlides}
    </div>
  );
};
