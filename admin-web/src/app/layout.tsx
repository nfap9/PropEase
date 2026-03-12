import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { AdminAuthLayout } from "@/components/layout/admin-auth-layout";

export const metadata: Metadata = {
  title: "运营后台 - Apartment Ultra",
  description: "公寓管理系统运营后台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <Providers>
          <AdminAuthLayout>{children}</AdminAuthLayout>
        </Providers>
      </body>
    </html>
  );
}
