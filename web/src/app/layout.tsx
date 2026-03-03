import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/layout/providers';

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'] });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function getBrandConfig(): Promise<{ app_name: string; app_description: string }> {
  try {
    const res = await fetch(`${API_URL}/config/public`, { next: { revalidate: 60 } });
    const json = (await res.json()) as {
      code?: number;
      data?: { brand: { app_name: string; app_description: string } };
      brand?: { app_name: string; app_description: string };
    };
    const brand = json?.data?.brand ?? json?.brand;
    if (brand?.app_name) return { app_name: brand.app_name, app_description: brand.app_description ?? '' };
  } catch {
    // ignore
  }
  return { app_name: '公寓管理系统', app_description: '多租户 SaaS 公寓/物业管理系统' };
}

export async function generateMetadata(): Promise<Metadata> {
  const { app_name, app_description } = await getBrandConfig();
  return { title: app_name, description: app_description };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
