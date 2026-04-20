
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import { Badge } from '@apartment-ultra/shared-ui/components/shadcn';
import { LEASE_STATUS_CONFIG } from '@/utils/status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { tenantReachabilityApi, tenantsApi, leasesApi } from '@/api';
import { useAuth } from '@/contexts/auth';
import { Lease } from '@/types';
import {
  ArrowLeft,
  User,
  Phone,
  CreditCard,
  AlertCircle,
  FileText,
  Building2,
  MessageSquareMore,
} from 'lucide-react';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { Link } from 'react-router-dom';
import { DataTable } from '@apartment-ultra/shared-ui/components/ui';
import { formatDate, formatDateTime } from '@/utils/date';
import { ColumnDef } from '@tanstack/react-table';
import {
  getDeliveryStatusLabel,
  getDeliveryStatusVariant,
  getTenantReachabilityEventLabel,
  getTenantSmsReachabilityLabel,
  getTenantSmsReachabilityStatus,
  getTenantSmsReachabilityVariant,
} from '@/utils/tenant-reachability';

export default function TenantDetailPage() {
  const params = useParams();
  const tenantId = params.id as string;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  // 获取租客信息
  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ['tenant', orgId, tenantId],
    queryFn: () => tenantsApi.get(tenantId),
    enabled: !!orgId,
  });

  // 获取所有租约，前端过滤该租客的租约
  const { data: allLeases, isLoading: leasesLoading } = useQuery({
    queryKey: ['leases', orgId],
    queryFn: () => leasesApi.list(),
    enabled: !!orgId,
  });

  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery({
    queryKey: ['tenant-reachability', 'deliveries', orgId, tenantId],
    queryFn: () =>
      tenantReachabilityApi.listDeliveries({
        tenant_id: tenantId,
        limit: 5,
      }),
    enabled: !!orgId,
  });

  const toggleSmsMutation = useMutation({
    mutationFn: (nextOptOut: boolean) =>
      tenantsApi.update(tenantId, {
        sms_opt_out: nextOptOut,
        sms_opt_out_reason: nextOptOut ? '管理员手动暂停短信触达' : null,
      }),
    onSuccess: (_tenant, nextOptOut) => {
      queryClient.invalidateQueries({ queryKey: ['tenant', orgId, tenantId] });
      queryClient.invalidateQueries({ queryKey: ['tenants', orgId] });
      toast.success(nextOptOut ? '已暂停短信触达' : '已恢复短信触达');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '操作失败，请稍后重试';
      toast.error(message);
    },
  });

  // 过滤该租客的租约
  const tenantLeases = allLeases?.filter((lease) => lease.tenant_id === tenantId) || [];
  const activeLease = tenantLeases.find((lease) => lease.is_active);

  const isLoading = authLoading || tenantLoading;

  // 租约表格列定义
  const leaseColumns: ColumnDef<Lease>[] = [
    {
      accessorKey: 'room',
      header: '房间',
      size: 180,
      minSize: 150,
      cell: ({ row }) => {
        const room = row.original.room;
        if (!room) return '-';
        const apartment = room.apartment;
        return (
          <div className="flex flex-col">
            {apartment && (
              <Link
                to={`/workspace/apartments/${apartment.id}`}
                className="text-xs text-muted-foreground hover:underline"
              >
                {apartment.name}
              </Link>
            )}
            <span>{room.room_number}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'start_date',
      header: '开始日期',
      size: 120,
      minSize: 100,
      cell: ({ row }) => formatDate(row.original.start_date),
    },
    {
      accessorKey: 'end_date',
      header: '结束日期',
      size: 120,
      minSize: 100,
      cell: ({ row }) => (row.original.end_date ? formatDate(row.original.end_date) : '长期'),
    },
    {
      accessorKey: 'monthly_rent',
      header: '月租',
      size: 120,
      minSize: 100,
      cell: ({ row }) => `¥${row.original.monthly_rent.toLocaleString()}`,
    },
    {
      accessorKey: 'is_active',
      header: '状态',
      size: 100,
      minSize: 80,
      cell: ({ row }) => {
        const config = row.original.is_active
          ? LEASE_STATUS_CONFIG.active
          : LEASE_STATUS_CONFIG.inactive;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      id: 'actions',
      size: 100,
      minSize: 80,
      cell: ({ row }) => {
        const lease = row.original;
        return (
          <Button variant="outline" size="sm" asChild>
            <Link to={`/leases?highlight=${lease.id}`}>查看详情</Link>
          </Button>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <User className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">租客不存在</h2>
        <Button onClick={() => navigate('/tenants')}>返回租客列表</Button>
      </div>
    );
  }

  const smsStatus = getTenantSmsReachabilityStatus(tenant);

  return (
    <PermissionPageGuard>
      <div className="space-y-6">
          {/* 返回按钮 */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/tenants')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* 基本信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  基本信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">姓名</Label>
                    <p className="font-medium">{tenant.name}</p>
                  </div>
                  <div>
                    <Label className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      电话
                    </Label>
                    <p className="font-medium">{tenant.phone || '-'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-1 text-muted-foreground">
                      <CreditCard className="h-3 w-3" />
                      身份证号
                    </Label>
                    <p className="font-medium">{tenant.id_card || '-'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">紧急联系人</Label>
                    <p className="font-medium">{tenant.emergency_contact || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">紧急联系电话</Label>
                    <p className="font-medium">{tenant.emergency_phone || '-'}</p>
                  </div>
                </div>
                {tenant.notes && (
                  <div>
                    <Label className="text-muted-foreground">备注</Label>
                    <p className="font-medium">{tenant.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareMore className="h-5 w-5" />
                  触达状态
                </CardTitle>
                <CardDescription>
                  当前短信正式触达状态与最近的退订边界
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={getTenantSmsReachabilityVariant(smsStatus)}>
                      {getTenantSmsReachabilityLabel(smsStatus)}
                    </Badge>
                    {tenant.sms_opt_out_at && (
                      <span className="text-sm text-muted-foreground">
                        暂停于 {formatDateTime(tenant.sms_opt_out_at)}
                      </span>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">短信接收号码</Label>
                    <p className="font-medium">{tenant.phone || '暂未填写手机号'}</p>
                  </div>
                  {tenant.sms_opt_out_reason && (
                    <div>
                      <Label className="text-muted-foreground">暂停原因</Label>
                      <p className="font-medium">{tenant.sms_opt_out_reason}</p>
                    </div>
                  )}
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                    账单生成、到期前提醒和逾期催缴会优先走短信。没有手机号或已退订时，系统会保留发送记录并标记为“已跳过”。
                  </div>
                  <Button
                    variant={tenant.sms_opt_out ? 'outline' : 'destructive'}
                    onClick={() => toggleSmsMutation.mutate(!tenant.sms_opt_out)}
                    disabled={toggleSmsMutation.isPending}
                  >
                    {tenant.sms_opt_out ? '恢复短信触达' : '暂停短信触达'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                当前租约
              </CardTitle>
              <CardDescription>
                {activeLease ? '租客当前生效的租约' : '暂无生效租约'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeLease ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">房间</Label>
                      <p className="font-medium">
                        {activeLease.room?.apartment?.name && (
                          <span className="text-muted-foreground">
                            {activeLease.room.apartment.name} -
                          </span>
                        )}{' '}
                        {activeLease.room?.room_number || '-'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">月租</Label>
                      <p className="font-medium">¥{activeLease.monthly_rent.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">开始日期</Label>
                      <p className="font-medium">{formatDate(activeLease.start_date)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">结束日期</Label>
                      <p className="font-medium">
                        {activeLease.end_date ? formatDate(activeLease.end_date) : '长期'}
                      </p>
                    </div>
                  </div>
                  {activeLease.deposit && activeLease.deposit > 0 && (
                    <div>
                      <Label className="text-muted-foreground">押金</Label>
                      <p className="font-medium">¥{activeLease.deposit.toLocaleString()}</p>
                    </div>
                  )}
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/leases?highlight=${activeLease.id}`}>查看租约详情</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">该租客暂无生效租约</p>
                  <Button className="mt-4" asChild>
                    <Link to={`/leases?tenant=${tenantId}`}>创建租约</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>最近触达记录</CardTitle>
              <CardDescription>快速确认最近一次发送、失败或跳过原因</CardDescription>
            </CardHeader>
            <CardContent>
              {deliveriesLoading ? (
                <Skeleton className="h-40" />
              ) : deliveries.length > 0 ? (
                <div className="space-y-3">
                  {deliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="flex flex-col gap-2 rounded-lg border p-4 md:flex-row md:items-start md:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={getDeliveryStatusVariant(delivery.status)}>
                            {getDeliveryStatusLabel(delivery.status)}
                          </Badge>
                          <span className="font-medium">
                            {getTenantReachabilityEventLabel(delivery.event_type)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {delivery.status_reason || delivery.content}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDateTime(delivery.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">暂无触达记录</div>
              )}
            </CardContent>
          </Card>

          {/* 租约历史 */}
          <Card>
            <CardHeader>
              <CardTitle>租约历史</CardTitle>
              <CardDescription>该租客的所有租约记录</CardDescription>
            </CardHeader>
            <CardContent>
              {leasesLoading ? (
                <Skeleton className="h-64" />
              ) : tenantLeases.length > 0 ? (
                <DataTable columns={leaseColumns} data={tenantLeases} />
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">暂无租约记录</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 快捷操作 */}
          <Card>
            <CardHeader>
              <CardTitle>快捷操作</CardTitle>
              <CardDescription>快速跳转到相关功能</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" asChild>
                  <Link to={`/leases?tenant=${tenantId}`}>
                    <FileText className="mr-2 h-4 w-4" />
                    创建租约
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to={`/bills?tenant=${tenantId}`}>
                    <Building2 className="mr-2 h-4 w-4" />
                    查看账单
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
    </PermissionPageGuard>
  );
}
