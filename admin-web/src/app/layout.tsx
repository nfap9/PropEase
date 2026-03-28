import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { AdminAuthLayout } from "@/components/layout/admin-auth-layout";

export const metadata: Metadata = {
  title: "管理平台 - Apartment Ultra",
  description: "公寓管理系统管理平台",
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
