'use client';

import { useAuth } from '@/lib/auth/context';
import { MainLayout } from '@/components/layout/main-layout';
import { Loader2 } from 'lucide-react';
import { DashboardContent } from './dashboard-content';

export default function DashboardPage() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <MainLayout>
      <DashboardContent />
    </MainLayout>
  );
}
