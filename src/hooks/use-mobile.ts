import { useEffect, useState } from "react";

/**
 * useIsmobile - Detects if the current device is mobile based on window width.
 * Returns true if the device width is less than or equal to 768px.
 */
export function useIsmobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // A check to ensure window is defined, preventing SSR errors
    if (typeof window === "undefined") {
      return;
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Set the initial state
    handleResize();

    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return isMobile;
}
