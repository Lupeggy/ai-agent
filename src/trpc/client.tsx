'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { useState } from 'react';

import { makeQueryClient } from './query-client';
import type { AppRouter } from './routers/_app';

export const trpc = createTRPCReact<AppRouter>();

function getUrl() {
    const base = (() => {
        if (typeof window !== 'undefined') return '';
        return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    })();
    return `${base}/api/trpc`;
}

export function TRPCReactProvider(props: { children: React.ReactNode }) {
    const [queryClient] = useState(() => makeQueryClient());
    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                httpBatchLink({
                    url: getUrl(),
                }),
            ],
        }),
    );
    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                {props.children}
            </QueryClientProvider>
        </trpc.Provider>
    );
}