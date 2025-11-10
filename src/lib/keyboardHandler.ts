/**
 * Keyboard event handling for slide navigation
 * Custom hook for managing keyboard shortcuts
 */

import { useEffect, useCallback } from 'react';
import type { Slide } from '@/types/notion';

export interface SlideNavigationHook {
  currentSlide: number;
  totalSlides: number;
  goToNext: () => void;
  goToPrevious: () => void;
  goToSlide: (index: number) => void;
  goToFirst: () => void;
  goToLast: () => void;
  close: () => void;
}

interface UseSlideNavigationProps {
  slides: Slide[];
  currentSlide: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
}

/**
 * Custom hook for slide navigation with keyboard support
 * Handles arrow keys, Home, End, Escape, and number jump navigation
 */
export function useSlideNavigation({
  slides,
  currentSlide,
  onNavigate,
  onClose,
}: UseSlideNavigationProps): SlideNavigationHook {
  const totalSlides = slides.length;

  // Navigation functions
  const goToNext = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      onNavigate(currentSlide + 1);
    }
  }, [currentSlide, totalSlides, onNavigate]);

  const goToPrevious = useCallback(() => {
    if (currentSlide > 0) {
      onNavigate(currentSlide - 1);
    }
  }, [currentSlide, onNavigate]);

  const goToSlide = useCallback(
    (index: number) => {
      const clampedIndex = Math.max(0, Math.min(totalSlides - 1, index));
      onNavigate(clampedIndex);
    },
    [totalSlides, onNavigate]
  );

  const goToFirst = useCallback(() => {
    onNavigate(0);
  }, [onNavigate]);

  const goToLast = useCallback(() => {
    onNavigate(totalSlides - 1);
  }, [totalSlides, onNavigate]);

  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  // Keyboard event handler
  useEffect(() => {
    let numberBuffer = '';
    let numberTimeout: NodeJS.Timeout | null = null;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ': // Spacebar
          e.preventDefault();
          goToNext();
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          goToPrevious();
          break;

        case 'Home':
          e.preventDefault();
          goToFirst();
          break;

        case 'End':
          e.preventDefault();
          goToLast();
          break;

        case 'Escape':
          e.preventDefault();
          close();
          break;

        case 'Enter':
          // Jump to slide number if number was entered
          if (numberBuffer.length > 0) {
            e.preventDefault();
            const slideNumber = parseInt(numberBuffer, 10);
            if (!isNaN(slideNumber) && slideNumber > 0) {
              goToSlide(slideNumber - 1); // Convert to 0-based index
            }
            numberBuffer = '';
            if (numberTimeout) clearTimeout(numberTimeout);
          }
          break;

        default:
          // Capture number keys for slide jump (1-9)
          if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            numberBuffer += e.key;

            // Clear buffer after 2 seconds
            if (numberTimeout) clearTimeout(numberTimeout);
            numberTimeout = setTimeout(() => {
              numberBuffer = '';
            }, 2000);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (numberTimeout) clearTimeout(numberTimeout);
    };
  }, [currentSlide, goToNext, goToPrevious, goToFirst, goToLast, goToSlide, close]);

  return {
    currentSlide,
    totalSlides,
    goToNext,
    goToPrevious,
    goToSlide,
    goToFirst,
    goToLast,
    close,
  };
}
