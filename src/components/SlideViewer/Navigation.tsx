/**
 * Navigation controls component
 * Provides previous/next buttons and close button
 */

import React from 'react';

interface NavigationProps {
  currentSlide: number;
  totalSlides: number;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentSlide,
  totalSlides,
  onPrevious,
  onNext,
  onClose,
}) => {
  const canGoPrevious = currentSlide > 0;
  const canGoNext = currentSlide < totalSlides - 1;

  return (
    <div
      className="navigation-controls"
      style={{
        position: 'absolute',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
      role="navigation"
      aria-label="Slide navigation controls"
    >
      {/* Previous button */}
      <button
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className="nav-button"
        style={{
          padding: '0.5rem 1rem',
          background: canGoPrevious ? '#3B82F6' : '#D1D5DB',
          color: 'white',
          border: 'none',
          borderRadius: '0.25rem',
          cursor: canGoPrevious ? 'pointer' : 'not-allowed',
          fontSize: '1rem',
        }}
        aria-label="Previous slide"
      >
        ← Previous
      </button>

      {/* Close button */}
      <button
        onClick={onClose}
        className="close-button"
        style={{
          padding: '0.5rem 1rem',
          background: '#EF4444',
          color: 'white',
          border: 'none',
          borderRadius: '0.25rem',
          cursor: 'pointer',
          fontSize: '1rem',
        }}
        aria-label="Close presentation"
      >
        Close (Esc)
      </button>

      {/* Next button */}
      <button
        onClick={onNext}
        disabled={!canGoNext}
        className="nav-button"
        style={{
          padding: '0.5rem 1rem',
          background: canGoNext ? '#3B82F6' : '#D1D5DB',
          color: 'white',
          border: 'none',
          borderRadius: '0.25rem',
          cursor: canGoNext ? 'pointer' : 'not-allowed',
          fontSize: '1rem',
        }}
        aria-label="Next slide"
      >
        Next →
      </button>
    </div>
  );
};
