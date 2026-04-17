import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from '@/components/layout/providers';
import { router } from '@/routes';
import '@apartment-ultra/shared-ui/styles/theme.css';
import './styles/index.css';

const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="text-muted-foreground">加载中...</div>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <Suspense fallback={<LoadingFallback />}>
        <RouterProvider router={router} />
      </Suspense>
    </AppProviders>
  </React.StrictMode>
);
