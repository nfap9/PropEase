
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationDeliveryStatus, TenantNotificationDelivery, TenantReachabilityEventType } from '@/types';
import { appToast, KpiSection, StatCard as SharedStatCard } from '@apartment-ultra/shared-ui';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/common/data-table';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Label, Skeleton, Switch, Tabs, TabsContent, TabsList, TabsTrigger } from '@apartment-ultra/shared-ui';
import { Textarea } from '@apartment-ultra/shared-ui/components/ui';
import { tenantReachabilityApi } from '@/api';
import { useAuth } from '@/auth/context';
import { formatDateTime } from '@/utils/date';
import {
  getDeliveryStatusLabel,
  getDeliveryStatusVariant,
  getDeliverySummary,
  getTenantReachabilityEventLabel,
  tenantReachabilityEventOptions,
  tenantReachabilityStatusOptions,
} from '@/utils/tenant-reachability';
import { MessageSquare, Send, ShieldOff } from 'lucide-react';
import { tenantI18n, tenantMessages } from '@/i18n';

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
        is_enabled: templates.find((item) => item.event_type === 'bill_generated')?.is_enabled ?? true,
      },
      rent_due_reminder: {
        content: templates.find((item) => item.event_type === 'rent_due_reminder')?.content ?? '',
        is_enabled: templates.find((item) => item.event_type === 'rent_due_reminder')?.is_enabled ?? true,
      },
      bill_overdue: {
        content: templates.find((item) => item.event_type === 'bill_overdue')?.content ?? '',
        is_enabled: templates.find((item) => item.event_type === 'bill_overdue')?.is_enabled ?? true,
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
      appToast.success(
        tenantI18n.t('settings.notificationsPage.saved', {
          event: getTenantReachabilityEventLabel(variables.eventType),
        })
      );
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : tenantMessages.settings.notificationsPage.saveFailed;
      appToast.error(message);
    },
  });

  const deliveryColumns = useMemo<ColumnDef<TenantNotificationDelivery>[]>(
    () => [
      {
        accessorKey: 'tenant_name',
        header: tenantMessages.settings.notificationsPage.columns.tenant,
        size: 160,
        minSize: 120,
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.tenant_name || '-'}</div>
            <div className="text-xs text-muted-foreground">{row.original.room_number || '-'}</div>
          </div>
        ),
      },
      {
        accessorKey: 'event_type',
        header: tenantMessages.settings.notificationsPage.columns.scenario,
        size: 120,
        minSize: 100,
        cell: ({ row }) => getTenantReachabilityEventLabel(row.original.event_type),
      },
      {
        accessorKey: 'status',
        header: tenantMessages.settings.notificationsPage.columns.status,
        size: 100,
        minSize: 80,
        cell: ({ row }) => (
          <Badge variant={getDeliveryStatusVariant(row.original.status)}>
            {getDeliveryStatusLabel(row.original.status)}
          </Badge>
        ),
      },
      {
        accessorKey: 'recipient',
        header: tenantMessages.settings.notificationsPage.columns.recipient,
        size: 140,
        minSize: 100,
        cell: ({ row }) => row.original.recipient || '-',
      },
      {
        accessorKey: 'status_reason',
        header: tenantMessages.settings.notificationsPage.columns.result,
        size: 200,
        minSize: 160,
        cell: ({ row }) => (
          <div className="max-w-sm text-sm text-muted-foreground">
            {row.original.status_reason || row.original.content}
          </div>
        ),
      },
      {
        accessorKey: 'created_at',
        header: tenantMessages.settings.notificationsPage.columns.sentAt,
        size: 180,
        minSize: 150,
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
        <h1 className="text-2xl font-semibold">{tenantMessages.settings.notificationsPage.noOrganizationTitle}</h1>
        <p className="text-muted-foreground">{tenantMessages.settings.notificationsPage.noOrganizationDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{tenantMessages.settings.notificationsPage.boundaryTitle}</CardTitle>
          <CardDescription>{tenantMessages.settings.notificationsPage.boundaryDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <SummaryCard
            title={tenantMessages.settings.notificationsPage.summaries.channelTitle}
            value={tenantMessages.settings.notificationsPage.summaries.channelValue}
            icon={MessageSquare}
          />
          <SummaryCard
            title={tenantMessages.settings.notificationsPage.summaries.totalTitle}
            value={String(summary.total)}
            icon={Send}
          />
          <SummaryCard
            title={tenantMessages.settings.notificationsPage.summaries.failedSkippedTitle}
            value={`${summary.failed}/${summary.skipped}`}
            icon={ShieldOff}
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">{tenantMessages.settings.notificationsPage.tabs.templates}</TabsTrigger>
          <TabsTrigger value="deliveries">{tenantMessages.settings.notificationsPage.tabs.deliveries}</TabsTrigger>
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
                        <CardDescription>{tenantMessages.settings.notificationsPage.templateVariables}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`template-enabled-${template.event_type}`}>
                          {tenantMessages.settings.notificationsPage.enableTemplate}
                        </Label>
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
                    <Textarea
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
                        {tenantMessages.settings.notificationsPage.unsubscribeHint}
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
                        {tenantMessages.settings.notificationsPage.saveTemplate}
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
              <CardTitle>{tenantMessages.settings.notificationsPage.deliveriesTitle}</CardTitle>
              <CardDescription>{tenantMessages.settings.notificationsPage.deliveriesDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="space-y-2">
                  <Label>{tenantMessages.settings.notificationsPage.eventFilterLabel}</Label>
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
                  <Label>{tenantMessages.settings.notificationsPage.statusFilterLabel}</Label>
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

              <KpiSection columns={4}>
                <SharedStatCard title={tenantMessages.settings.notificationsPage.stats.total} value={summary.total} />
                <SharedStatCard
                  title={tenantMessages.settings.notificationsPage.stats.sent}
                  value={summary.sent}
                  tone="success"
                />
                <SharedStatCard
                  title={tenantMessages.settings.notificationsPage.stats.failed}
                  value={summary.failed}
                  tone="danger"
                />
                <SharedStatCard
                  title={tenantMessages.settings.notificationsPage.stats.skipped}
                  value={summary.skipped}
                  tone="warning"
                />
              </KpiSection>

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
