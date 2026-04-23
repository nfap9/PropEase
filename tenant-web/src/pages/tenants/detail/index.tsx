
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, Button, Tag, Skeleton, Table, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Label } from '@/components/common/label';
import { LEASE_STATUS_CONFIG } from '@/constants/status';
import { tenantReachabilityApi } from '@/api/tenant-reachability';
import { tenantsApi } from '@/api/tenants';
import { leasesApi } from '@/api/leases';
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
  MoreHorizontal,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate, formatDateTime } from '@/utils/date';
import {
  getDeliveryStatusLabel,
  getDeliveryStatusVariant,
  getTenantReachabilityEventLabel,
  getTenantSmsReachabilityLabel,
  getTenantSmsReachabilityStatus,
  getTenantSmsReachabilityVariant,
} from '@/utils/tenant-reachability';

const STATUS_VARIANT_MAP: Record<string, string> = {
  default: 'default',
  success: 'green',
  warning: 'orange',
  destructive: 'red',
  outline: 'default',
};

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
  const leaseColumns: Array<{
    key: string;
    title: string;
    width?: number;
    render: (_: any, record: Lease) => React.ReactNode;
  }> = [
    {
      key: 'room',
      title: '房间',
      width: 180,
      render: (_, record) => {
        const room = record.room;
        if (!room) return '-';
        const apartment = room.apartment;
        return (
          <div className="flex flex-col">
            {apartment && (
              <Link
                to={`/workspace/apartments/${apartment.id}`}
                className="text-xs text-gray-500 hover:underline"
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
      key: 'start_date',
      title: '开始日期',
      width: 120,
      render: (_, record) => formatDate(record.start_date),
    },
    {
      key: 'end_date',
      title: '结束日期',
      width: 120,
      render: (_, record) => (record.end_date ? formatDate(record.end_date) : '长期'),
    },
    {
      key: 'monthly_rent',
      title: '月租',
      width: 120,
      render: (_, record) => `¥${record.monthly_rent.toLocaleString()}`,
    },
    {
      key: 'is_active',
      title: '状态',
      width: 100,
      render: (_, record) => {
        const config = record.is_active
          ? LEASE_STATUS_CONFIG.active
          : LEASE_STATUS_CONFIG.inactive;
        return <Tag color={STATUS_VARIANT_MAP[config.variant] || 'green'}>{config.label}</Tag>;
      },
    },
    {
      key: 'actions',
      title: '操作',
      width: 100,
      render: (_, record) => (
        <Link to={`/leases?highlight=${record.id}`}>
          <Button size="small">查看详情</Button>
        </Link>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton.Input active size="large" style={{ width: 200, height: 32 }} />
        <Skeleton active paragraph={{ rows: 4 }} />
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <User className="h-16 w-16 text-gray-400" />
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
            <Button variant="text" size="small" onClick={() => navigate('/tenants')} icon={<ArrowLeft className="h-4 w-4" />} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* 基本信息 */}
            <Card size="small" title={<><User className="h-5 w-5 inline mr-2" />基本信息</>}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">姓名</Label>
                    <p className="font-medium">{tenant.name}</p>
                  </div>
                  <div>
                    <Label className="flex items-center gap-1 text-gray-500">
                      <Phone className="h-3 w-3" />
                      电话
                    </Label>
                    <p className="font-medium">{tenant.phone || '-'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-1 text-gray-500">
                      <CreditCard className="h-3 w-3" />
                      身份证号
                    </Label>
                    <p className="font-medium">{tenant.id_card || '-'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">紧急联系人</Label>
                    <p className="font-medium">{tenant.emergency_contact || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">紧急联系电话</Label>
                    <p className="font-medium">{tenant.emergency_phone || '-'}</p>
                  </div>
                </div>
                {tenant.notes && (
                  <div>
                    <Label className="text-gray-500">备注</Label>
                    <p className="font-medium">{tenant.notes}</p>
                  </div>
                )}
              </div>
            </Card>

            <Card size="small" title={<><MessageSquareMore className="h-5 w-5 inline mr-2" />触达状态</>} extra={<span className="text-sm text-gray-500">当前短信正式触达状态与最近的退订边界</span>}>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag color={getTenantSmsReachabilityVariant(smsStatus)}>
                    {getTenantSmsReachabilityLabel(smsStatus)}
                  </Tag>
                  {tenant.sms_opt_out_at && (
                    <span className="text-sm text-gray-500">
                      暂停于 {formatDateTime(tenant.sms_opt_out_at)}
                    </span>
                  )}
                </div>
                <div>
                  <Label className="text-gray-500">短信接收号码</Label>
                  <p className="font-medium">{tenant.phone || '暂未填写手机号'}</p>
                </div>
                {tenant.sms_opt_out_reason && (
                  <div>
                    <Label className="text-gray-500">暂停原因</Label>
                    <p className="font-medium">{tenant.sms_opt_out_reason}</p>
                  </div>
                )}
                <div className="rounded-lg border bg-gray-50 p-3 text-sm text-gray-500">
                  账单生成、到期前提醒和逾期催缴会优先走短信。没有手机号或已退订时，系统会保留发送记录并标记为"已跳过"。
                </div>
                <Button
                  type={tenant.sms_opt_out ? 'default' : 'primary'}
                  danger={!tenant.sms_opt_out}
                  onClick={() => toggleSmsMutation.mutate(!tenant.sms_opt_out)}
                  loading={toggleSmsMutation.isPending}
                >
                  {tenant.sms_opt_out ? '恢复短信触达' : '暂停短信触达'}
                </Button>
              </div>
            </Card>
          </div>

          <Card size="small" title={<><FileText className="h-5 w-5 inline mr-2" />当前租约</>} extra={<span className="text-sm text-gray-500">{activeLease ? '租客当前生效的租约' : '暂无生效租约'}</span>}>
            {activeLease ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">房间</Label>
                    <p className="font-medium">
                      {activeLease.room?.apartment?.name && (
                        <span className="text-gray-500">
                          {activeLease.room.apartment.name} -
                        </span>
                      )}{' '}
                      {activeLease.room?.room_number || '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">月租</Label>
                    <p className="font-medium">¥{activeLease.monthly_rent.toLocaleString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">开始日期</Label>
                    <p className="font-medium">{formatDate(activeLease.start_date)}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">结束日期</Label>
                    <p className="font-medium">
                      {activeLease.end_date ? formatDate(activeLease.end_date) : '长期'}
                    </p>
                  </div>
                </div>
                {activeLease.deposit && activeLease.deposit > 0 && (
                  <div>
                    <Label className="text-gray-500">押金</Label>
                    <p className="font-medium">¥{activeLease.deposit.toLocaleString()}</p>
                  </div>
                )}
                <Link to={`/leases?highlight=${activeLease.id}`}>
                  <Button block>查看租约详情</Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="mb-4 h-12 w-12 text-gray-400" />
                <p className="text-gray-500">该租客暂无生效租约</p>
                <Link to={`/leases?tenant=${tenantId}`}>
                  <Button className="mt-4" type="primary">创建租约</Button>
                </Link>
              </div>
            )}
          </Card>

          <Card size="small" title="最近触达记录" extra={<span className="text-sm text-gray-500">快速确认最近一次发送、失败或跳过原因</span>}>
            {deliveriesLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : deliveries.length > 0 ? (
              <div className="space-y-3">
                {deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex flex-col gap-2 rounded-lg border p-4 md:flex-row md:items-start md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Tag color={getDeliveryStatusVariant(delivery.status)}>
                          {getDeliveryStatusLabel(delivery.status)}
                        </Tag>
                        <span className="font-medium">
                          {getTenantReachabilityEventLabel(delivery.event_type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {delivery.status_reason || delivery.content}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDateTime(delivery.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">暂无触达记录</div>
            )}
          </Card>

          {/* 租约历史 */}
          <Card size="small" title="租约历史" extra={<span className="text-sm text-gray-500">该租客的所有租约记录</span>}>
            {leasesLoading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : tenantLeases.length > 0 ? (
              <Table
                columns={leaseColumns}
                dataSource={tenantLeases}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="mb-4 h-12 w-12 text-gray-400" />
                <p className="text-gray-500">暂无租约记录</p>
              </div>
            )}
          </Card>

          {/* 快捷操作 */}
          <Card size="small" title="快捷操作" extra={<span className="text-sm text-gray-500">快速跳转到相关功能</span>}>
            <div className="flex flex-wrap gap-3">
              <Link to={`/leases?tenant=${tenantId}`}>
                <Button>
                  <FileText className="mr-2 h-4 w-4" />
                  创建租约
                </Button>
              </Link>
              <Link to={`/bills?tenant=${tenantId}`}>
                <Button>
                  <Building2 className="mr-2 h-4 w-4" />
                  查看账单
                </Button>
              </Link>
            </div>
          </Card>
        </div>
    </PermissionPageGuard>
  );
}
