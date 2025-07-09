// Client-safe utility functions for Stream Video

// Generate an avatar URL based on user name
export function generateAvatar(name: string, size: number = 200): string {
  // Create a consistent seed from the name
  const normalizedName = name.toLowerCase().trim();
  
  // Use UI Avatars service for consistent avatar generation
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(normalizedName)}&background=random&size=${size}&length=2&bold=true&format=svg`;
}
