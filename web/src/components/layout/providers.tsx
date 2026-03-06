'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth/context';
import { BrandConfigProvider } from '@/lib/brand-config-context';
import { ThemeProvider } from '@/components/theme/theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrandConfigProvider>
          <AuthProvider>{children}</AuthProvider>
        </BrandConfigProvider>
      </ThemeProvider>
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
