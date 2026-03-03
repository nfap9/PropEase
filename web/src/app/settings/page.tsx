'use client';

import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Settings as SettingsIcon, CreditCard } from 'lucide-react';

const SETTINGS_ITEMS = [
  {
    title: '团队设置',
    description: '管理组织成员和权限',
    href: '/settings/team',
    icon: Users,
  },
  {
    title: '订阅管理',
    description: '管理订阅套餐和账单',
    href: '/settings/subscription',
    icon: CreditCard,
  },
  {
    title: '组织管理',
    description: '创建和编辑组织信息',
    href: '/settings/team',
    icon: Building2,
  },
];

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <SettingsIcon className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">设置</h1>
            <p className="text-muted-foreground">管理您的账户和组织设置</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SETTINGS_ITEMS.map((item) => (
            <Link key={item.title} href={item.href}>
              <Card className="cursor-pointer transition-colors hover:border-primary">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
