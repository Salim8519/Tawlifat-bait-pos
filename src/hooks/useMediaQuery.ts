import { useState, useEffect } from 'react';

/**
 * A hook that returns true if the current viewport matches the specified media query
 * @param query - The media query to check against
 * @returns A boolean indicating whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with the current match state
  const [matches, setMatches] = useState<boolean>(() => {
    // Check if window is defined (for SSR)
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    // Return early if window is not defined
    if (typeof window === 'undefined') {
      return undefined;
    }

    // Create a media query list
    const mediaQueryList = window.matchMedia(query);
    
    // Update the state when matches change
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add the listener
    // Use the deprecated addListener for older browsers that don't support addEventListener
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', listener);
    } else {
      // @ts-ignore - For older browsers
      mediaQueryList.addListener(listener);
    }

    // Set initial value
    setMatches(mediaQueryList.matches);

    // Clean up
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', listener);
      } else {
        // @ts-ignore - For older browsers
        mediaQueryList.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Predefined media query hooks for common breakpoints
 */
export const useIsMobile = () => useMediaQuery('(max-width: 639px)');
export const useIsTablet = () => useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const useIsLargeDesktop = () => useMediaQuery('(min-width: 1280px)');
