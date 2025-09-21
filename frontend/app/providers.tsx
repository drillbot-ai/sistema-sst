"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

/**
 * Wrapper that instantiates a QueryClient on the client side and provides it to
 * its descendants. Using useState ensures a single instance per browser tab,
 * which prevents stale caches between server renders and client hydration.
 */
export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}