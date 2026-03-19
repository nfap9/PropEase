'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  NotificationDeliveryStatus,
  TenantNotificationDelivery,
  TenantReachabilityEventType,
} from '@/types';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/common/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { tenantReachabilityApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';
import { formatDateTime } from '@/lib/date-utils';
import {
  getDeliveryStatusLabel,
  getDeliveryStatusVariant,
  getDeliverySummary,
  getTenantReachabilityEventLabel,
  tenantReachabilityEventOptions,
  tenantReachabilityStatusOptions,
} from '@/lib/tenant-reachability';
import { BellRing, MessageSquare, Send, ShieldOff } from 'lucide-react';

type EditableTemplateState = Record<
  TenantReachabilityEventType,
  {
    content: string;
    is_enabled: boolean;
  }
>;

export default function ReachabilitySettingsPage() {
  const queryClient = useQueryClient();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const [statusFilter, setStatusFilter] = useState<NotificationDeliveryStatus | 'all'>('all');
  const [eventFilter, setEventFilter] = useState<TenantReachabilityEventType | 'all'>('all');
  const [editableTemplates, setEditableTemplates] = useState<EditableTemplateState>({
    bill_generated: { content: '', is_enabled: true },
    rent_due_reminder: { content: '', is_enabled: true },
    bill_overdue: { content: '', is_enabled: true },
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['tenant-reachability', 'templates', orgId],
    queryFn: () => tenantReachabilityApi.listTemplates(orgId!),
    enabled: !!orgId,
  });

  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery({
    queryKey: ['tenant-reachability', 'deliveries', orgId, statusFilter, eventFilter],
    queryFn: () =>
      tenantReachabilityApi.listDeliveries(orgId!, {
        status: statusFilter,
        event_type: eventFilter,
        limit: 100,
      }),
    enabled: !!orgId,
  });

  useEffect(() => {
    if (templates.length === 0) return;
    setEditableTemplates({
      bill_generated: {
        content: templates.find((item) => item.event_type === 'bill_generated')?.content ?? '',
        is_enabled:
          templates.find((item) => item.event_type === 'bill_generated')?.is_enabled ?? true,
      },
      rent_due_reminder: {
        content:
          templates.find((item) => item.event_type === 'rent_due_reminder')?.content ?? '',
        is_enabled:
          templates.find((item) => item.event_type === 'rent_due_reminder')?.is_enabled ?? true,
      },
      bill_overdue: {
        content: templates.find((item) => item.event_type === 'bill_overdue')?.content ?? '',
        is_enabled:
          templates.find((item) => item.event_type === 'bill_overdue')?.is_enabled ?? true,
      },
    });
  }, [templates]);

  const updateTemplateMutation = useMutation({
    mutationFn: ({
      eventType,
      content,
      is_enabled,
    }: {
      eventType: TenantReachabilityEventType;
      content: string;
      is_enabled: boolean;
    }) => tenantReachabilityApi.updateTemplate(orgId!, eventType, { content, is_enabled }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-reachability', 'templates', orgId] });
      toast.success(`${getTenantReachabilityEventLabel(variables.eventType)}模板已保存`);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '保存失败，请稍后重试';
      toast.error(message);
    },
  });

  const deliveryColumns = useMemo<ColumnDef<TenantNotificationDelivery>[]>(
    () => [
      {
        accessorKey: 'tenant_name',
        header: '租客',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.tenant_name || '-'}</div>
            <div className="text-xs text-muted-foreground">{row.original.room_number || '-'}</div>
          </div>
        ),
      },
      {
        accessorKey: 'event_type',
        header: '场景',
        cell: ({ row }) => getTenantReachabilityEventLabel(row.original.event_type),
      },
      {
        accessorKey: 'status',
        header: '状态',
        cell: ({ row }) => (
          <Badge variant={getDeliveryStatusVariant(row.original.status)}>
            {getDeliveryStatusLabel(row.original.status)}
          </Badge>
        ),
      },
      {
        accessorKey: 'recipient',
        header: '接收号码',
        cell: ({ row }) => row.original.recipient || '-',
      },
      {
        accessorKey: 'status_reason',
        header: '结果说明',
        cell: ({ row }) => (
          <div className="max-w-sm text-sm text-muted-foreground">
            {row.original.status_reason || row.original.content}
          </div>
        ),
      },
      {
        accessorKey: 'created_at',
        header: '发送时间',
        cell: ({ row }) => formatDateTime(row.original.created_at),
      },
    ],
    []
  );

  const summary = getDeliverySummary(deliveries);

  if (authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-40" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-3 text-center">
        <ShieldOff className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">请先选择组织</h1>
        <p className="text-muted-foreground">选择组织后才可以配置租客消息触达能力。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BellRing className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">租客消息触达</h1>
            <p className="text-muted-foreground">
              当前第一期仅接入短信通道，覆盖账单生成、到期前提醒和逾期催缴。
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">当前边界</CardTitle>
            <CardDescription>
              如果未配置 `SMS_WEBHOOK_URL`，系统会照常落发送记录，但状态会标记为“已跳过”。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <SummaryCard title="正式通道" value="短信" icon={MessageSquare} />
            <SummaryCard title="记录总数" value={String(summary.total)} icon={Send} />
            <SummaryCard title="失败/跳过" value={`${summary.failed}/${summary.skipped}`} icon={ShieldOff} />
          </CardContent>
        </Card>

        <Tabs defaultValue="templates" className="space-y-4">
          <TabsList>
            <TabsTrigger value="templates">模板管理</TabsTrigger>
            <TabsTrigger value="deliveries">发送记录</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            {templatesLoading ? (
              <Skeleton className="h-96" />
            ) : (
              templates.map((template) => {
                const editable = editableTemplates[template.event_type];
                return (
                  <Card key={template.event_type}>
                    <CardHeader>
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <CardTitle>{template.name}</CardTitle>
                          <CardDescription>
                            支持变量: {'{{organization_name}}'}、{'{{tenant_name}}'}、
                            {'{{room_number}}'}、{'{{bill_period}}'}、{'{{amount}}'}、
                            {'{{due_date}}'}、{'{{days_overdue}}'}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`template-enabled-${template.event_type}`}>启用模板</Label>
                          <Switch
                            id={`template-enabled-${template.event_type}`}
                            checked={editable?.is_enabled ?? true}
                            onCheckedChange={(checked) =>
                              setEditableTemplates((prev) => ({
                                ...prev,
                                [template.event_type]: {
                                  ...(prev[template.event_type] ?? {
                                    content: template.content,
                                    is_enabled: template.is_enabled,
                                  }),
                                  is_enabled: checked,
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <textarea
                        className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={editable?.content ?? ''}
                        onChange={(event) =>
                          setEditableTemplates((prev) => ({
                            ...prev,
                            [template.event_type]: {
                              ...(prev[template.event_type] ?? {
                                content: template.content,
                                is_enabled: template.is_enabled,
                              }),
                              content: event.target.value,
                            },
                          }))
                        }
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          默认建议保留“退订”提示，退订后系统会自动跳过后续短信发送。
                        </p>
                        <Button
                          onClick={() =>
                            updateTemplateMutation.mutate({
                              eventType: template.event_type,
                              content: editable?.content ?? template.content,
                              is_enabled: editable?.is_enabled ?? template.is_enabled,
                            })
                          }
                          disabled={updateTemplateMutation.isPending}
                        >
                          保存模板
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="deliveries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>发送记录</CardTitle>
                <CardDescription>查询租客正式触达链路的发送、失败和跳过原因。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="space-y-2">
                    <Label>场景筛选</Label>
                    <div className="flex flex-wrap gap-2">
                      {tenantReachabilityEventOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant={eventFilter === option.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setEventFilter(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>状态筛选</Label>
                    <div className="flex flex-wrap gap-2">
                      {tenantReachabilityStatusOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant={statusFilter === option.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setStatusFilter(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <StatCard title="总记录" value={String(summary.total)} />
                  <StatCard title="发送成功" value={String(summary.sent)} />
                  <StatCard title="发送失败" value={String(summary.failed)} />
                  <StatCard title="已跳过" value={String(summary.skipped)} />
                </div>

                {deliveriesLoading ? (
                  <Skeleton className="h-96" />
                ) : (
                  <DataTable columns={deliveryColumns} data={deliveries} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
