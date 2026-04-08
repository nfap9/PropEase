import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/layout/providers';

// 使用系统字体栈，避免构建时网络请求 Google Fonts
const fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// 服务端使用内部网络地址（Docker 服务名），客户端使用 localhost
const getServerApiUrl = () =>
  process.env.API_URL_SERVER || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const API_URL = getServerApiUrl();

async function getBrandConfig(): Promise<{ app_name: string; app_description: string }> {
  try {
    const res = await fetch(`${API_URL}/config/public`, { next: { revalidate: 60 } });
    const json = (await res.json()) as {
      code?: number;
      data?: { brand: { app_name: string; app_description: string } };
      brand?: { app_name: string; app_description: string };
    };
    const brand = json?.data?.brand ?? json?.brand;
    if (brand?.app_name)
      return { app_name: brand.app_name, app_description: brand.app_description ?? '' };
  } catch {
    // ignore
  }
  return { app_name: '公寓管理系统', app_description: '公寓、租客与账单的一体化管理系统' };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const { app_name, app_description } = await getBrandConfig();
  return {
    title: app_name,
    description: app_description,
    icons: {
      icon: '/favicon.svg',
    },
    manifest: '/manifest.json',
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body style={{ fontFamily }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
