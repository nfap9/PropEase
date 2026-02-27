'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { tenantsApi, leasesApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';
import { Lease } from '@/types';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  CreditCard,
  AlertCircle,
  FileText,
  Building2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { DataTable } from '@/components/common/data-table';
import { ColumnDef } from '@tanstack/react-table';

export default function TenantDetailPage({ params }: { params: { id: string } }) {
  const tenantId = Number(params.id);
  const router = useRouter();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  // 获取租客信息
  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ['tenant', orgId, tenantId],
    queryFn: () => tenantsApi.get(orgId!, tenantId),
    enabled: !!orgId,
  });

  // 获取所有租约，前端过滤该租客的租约
  const { data: allLeases, isLoading: leasesLoading } = useQuery({
    queryKey: ['leases', orgId],
    queryFn: () => leasesApi.list(orgId!),
    enabled: !!orgId,
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
      cell: ({ row }) => {
        const room = row.original.room;
        if (!room) return '-';
        const apartment = room.apartment;
        return (
          <div className="flex flex-col">
            {apartment && (
              <Link
                href={`/apartments/${apartment.id}`}
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
    },
    {
      accessorKey: 'end_date',
      header: '结束日期',
      cell: ({ row }) => row.original.end_date || '长期',
    },
    {
      accessorKey: 'monthly_rent',
      header: '月租',
      cell: ({ row }) => `¥${row.original.monthly_rent.toLocaleString()}`,
    },
    {
      accessorKey: 'is_active',
      header: '状态',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? '生效中' : '已终止'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const lease = row.original;
        return (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/leases?highlight=${lease.id}`}>查看详情</Link>
          </Button>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      </MainLayout>
    );
  }

  if (!tenant) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <User className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">租客不存在</h2>
          <Button onClick={() => router.push('/tenants')}>返回租客列表</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 返回按钮和标题 */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/tenants')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{tenant.name}</h1>
            <p className="text-muted-foreground">租客详情</p>
          </div>
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
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    电话
                  </Label>
                  <p className="font-medium">{tenant.phone || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    邮箱
                  </Label>
                  <p className="font-medium">{tenant.email || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground flex items-center gap-1">
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

          {/* 当前租约 */}
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
                      <p className="font-medium">
                        ¥{activeLease.monthly_rent.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">开始日期</Label>
                      <p className="font-medium">{activeLease.start_date}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">结束日期</Label>
                      <p className="font-medium">{activeLease.end_date || '长期'}</p>
                    </div>
                  </div>
                  {activeLease.deposit && activeLease.deposit > 0 && (
                    <div>
                      <Label className="text-muted-foreground">押金</Label>
                      <p className="font-medium">
                        ¥{activeLease.deposit.toLocaleString()}
                      </p>
                    </div>
                  )}
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/leases?highlight=${activeLease.id}`}>
                      查看租约详情
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">该租客暂无生效租约</p>
                  <Button className="mt-4" asChild>
                    <Link href={`/leases?tenant=${tenantId}`}>创建租约</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
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
                <Link href={`/leases?tenant=${tenantId}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  创建租约
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/bills?tenant=${tenantId}`}>
                  <Building2 className="mr-2 h-4 w-4" />
                  查看账单
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
