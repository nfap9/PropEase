import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/components/layout/providers';
import { ThemeProvider } from '@apartment-ultra/shared-ui/components/ui';
import { BrandConfigProvider } from '@/contexts/brand-config';
import { router } from '@/routes';
import { AppToaster } from '@apartment-ultra/shared-ui/components/ui';
import '@apartment-ultra/shared-ui/styles/theme.css';
import './styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrandConfigProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </BrandConfigProvider>
      </ThemeProvider>
      <AppToaster />
    </QueryClientProvider>
  </React.StrictMode>
);
