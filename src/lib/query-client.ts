// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

// This function returns a new QueryClient instance
export function getQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  });
}
