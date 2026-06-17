"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe hook that returns true when viewport is < 768px (Tailwind md breakpoint).
 * Initializes to false on server/SSR, then sets real value on mount via useEffect.
 * Subscribes to matchMedia change events to update when window resizes across breakpoint.
 */
export default function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    // Set initial value on mount
    setIsMobile(mediaQuery.matches);

    // Create listener for breakpoint changes
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    // Subscribe to changes
    mediaQuery.addEventListener("change", handleChange);

    // Cleanup listener on unmount
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return isMobile;
}
