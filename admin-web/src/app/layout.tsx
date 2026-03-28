import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { AdminAuthLayout } from "@/components/layout/admin-auth-layout";
import { adminMessages } from "@/lib/i18n";

export const metadata: Metadata = {
  title: adminMessages.meta.title,
  description: adminMessages.meta.description,
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
