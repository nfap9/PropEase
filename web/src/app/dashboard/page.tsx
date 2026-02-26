'use client';

import { useAuth } from '@/lib/auth/context';
import { MainLayout } from '@/components/layout/main-layout';
import { DashboardContent } from './dashboard-content';

export default function DashboardPage() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <MainLayout>
      <DashboardContent />
    </MainLayout>
  );
}
