'use client';

import { MainLayout } from '@/components/layout/main-layout';

export function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout>
      <div className="space-y-4">
        {children}
      </div>
    </MainLayout>
  );
}
