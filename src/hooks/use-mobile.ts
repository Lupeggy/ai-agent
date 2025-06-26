import { useEffect, useState } from "react";

/**
 * useIsmobile - Detects if the current device is mobile based on window width.
 * Returns true if the device width is less than or equal to 768px.
 */
export function useIsmobile() {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Function to update the state based on window width
    function handleResize() {
      setIsMobile(window.innerWidth <= 768);
    }

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}
