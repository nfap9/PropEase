import React, { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from '@/components/layout/providers';
import { router } from '@/routes';

const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="text-muted-foreground">加载中...</div>
  </div>
);

export default function App() {
  return (
    <AppProviders>
      <Suspense fallback={<LoadingFallback />}>
        <RouterProvider router={router} />
      </Suspense>
    </AppProviders>
  );
}
