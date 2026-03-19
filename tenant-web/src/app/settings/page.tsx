'use client';

import Link from 'next/link';
import { Building2, Settings as SettingsIcon, ShoppingBag, MessageSquareMore, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardDescription, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';

// 注意: 实际使用时从 testids 导入 SETTINGS 常量
const SETTINGS = {
  HEADING: 'settings-heading',
  TEAM_CARD: 'settings-team-card',
  TEAM_LINK: 'settings-team-link',
  SUBSCRIPTION_CARD: 'settings-subscription-card',
  ORG_SWITCH_CARD: 'settings-org-switch-card',
  ORG_SWITCH_BUTTON: 'settings-org-switch-button',
} as const;

// Organization switch item - shown when user has an organization
const getOrganizationSwitchItem = (orgName: string | undefined) => {
  if (!orgName) return null;
  return {
    title: orgName,
    description: '切换组织',
    href: '/organizations',
    icon: Building2,
    testId: SETTINGS.ORG_SWITCH_BUTTON,
    cardTestId: SETTINGS.ORG_SWITCH_CARD,
  };
};

const BASE_SETTINGS_ITEMS = [
  {
    title: '团队与权限',
    description: '管理团队成员和角色权限',
    href: '/settings/team',
    icon: Users,
    testId: SETTINGS.TEAM_LINK,
    cardTestId: SETTINGS.TEAM_CARD,
  },
  {
    title: '消息触达',
    description: '管理租客短信模板与发送记录',
    href: '/settings/notifications',
    icon: MessageSquareMore,
    testId: 'settings-notifications-link',
    cardTestId: 'settings-notifications-card',
  },
  {
    title: '订阅管理',
    description: '管理订阅服务和账单',
    href: '/settings/subscription',
    icon: ShoppingBag,
    testId: 'settings-subscription-link',
    cardTestId: SETTINGS.SUBSCRIPTION_CARD,
  },
];

export default function SettingsPage() {
  const { organization } = useAuth();

  const allSettingsItems = [
    getOrganizationSwitchItem(organization?.name),
    ...BASE_SETTINGS_ITEMS,
  ].filter(Boolean);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <SettingsIcon className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold" data-testid={SETTINGS.HEADING}>设置</h1>
            <p className="text-muted-foreground">管理您的账户和组织设置</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allSettingsItems.map((item) =>
            item && (
              <Link
                key={item.title}
                href={item.href}
                data-testid={item.testId}
              >
                <Card
                  className="cursor-pointer transition-colors hover:border-primary"
                  data-testid={item.cardTestId}
                >
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </div>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )
          )}
        </div>
      </div>
    </MainLayout>
  );
}
