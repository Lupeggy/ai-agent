import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import humanizeDuration from "humanize-duration"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a duration in milliseconds or seconds to a human readable string
 * @param value Duration in milliseconds or seconds (if seconds is true)
 * @param options Optional configuration options
 * @param seconds Whether the input value is in seconds (default: false)
 * @returns Formatted duration string
 */
export function formatDuration(value: number, options?: Parameters<typeof humanizeDuration>[1], seconds = false) {
  const ms = seconds ? value * 1000 : value;
  return humanizeDuration(ms, {
    largest: 1,
    round: true,
    units: ["h", "m", "s"]
  });
}