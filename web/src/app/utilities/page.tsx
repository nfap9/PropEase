'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { DataTable } from '@/components/common/data-table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { apartmentsApi, roomsApi, utilitiesApi } from '@/lib/api';
import { filterEmptyStrings } from '@/lib/utils/form';
import { getErrorMessage } from '@/lib/utils/error';
import { useAuth } from '@/lib/auth/context';
import { UtilityReading } from '@/types';
import { Plus, Upload, Download, Building2, Filter, AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useColumns,
  CreateUtilityDialog,
  EditUtilityDialog,
  ExportTemplateDialog,
  BatchImportDialog,
} from './components';

export default function UtilitiesPage() {
  const queryClient = useQueryClient();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isExportTemplateOpen, setIsExportTemplateOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [selectedUtility, setSelectedUtility] = useState<UtilityReading | null>(null);

  // 筛选状态
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const [filterApartmentId, setFilterApartmentId] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState<number | undefined>(currentYear);
  const [filterMonth, setFilterMonth] = useState<number | undefined>(currentMonth);

  const { data: apartments } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(orgId!),
    enabled: !!orgId,
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms', orgId, selectedApartmentId],
    queryFn: () => roomsApi.list(orgId!, selectedApartmentId!),
    enabled: !!orgId && selectedApartmentId !== null,
  });

  const { data: allRooms } = useQuery({
    queryKey: ['allRooms', orgId],
    queryFn: () => roomsApi.listAll(orgId!, apartments?.map((a) => a.id) || []),
    enabled: !!orgId && !!apartments && apartments.length > 0,
  });

  const { data: utilities, isLoading: utilitiesLoading } = useQuery({
    queryKey: ['utilities', orgId, filterApartmentId, filterYear, filterMonth],
    queryFn: () => utilitiesApi.list(orgId!, filterYear, filterMonth, filterApartmentId),
    enabled: !!orgId,
  });

  const { data: roomsMissingInitial = [] } = useQuery({
    queryKey: ['utilities', 'rooms-missing-initial', orgId],
    queryFn: () => utilitiesApi.getRoomsMissingInitial(orgId!),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof utilitiesApi.create>[1]) =>
      utilitiesApi.create(orgId!, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities', orgId] });
      queryClient.invalidateQueries({ queryKey: ['utilities', 'rooms-missing-initial', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview', orgId] });
      setIsCreateOpen(false);
      toast.success('水电读数录入成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '录入失败，请重试')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof utilitiesApi.update>[2] }) =>
      utilitiesApi.update(orgId!, id, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities', orgId] });
      queryClient.invalidateQueries({ queryKey: ['utilities', 'rooms-missing-initial', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview', orgId] });
      setIsEditOpen(false);
      setSelectedUtility(null);
      toast.success('水电读数更新成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const batchImportMutation = useMutation({
    mutationFn: (data: Parameters<typeof utilitiesApi.batchCreate>[1]) =>
      utilitiesApi.batchCreate(orgId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities', orgId] });
      queryClient.invalidateQueries({ queryKey: ['utilities', 'rooms-missing-initial', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview', orgId] });
      setIsBatchImportOpen(false);
      toast.success('批量导入成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '批量导入失败，请重试')),
  });

  const handleEdit = (utility: UtilityReading) => {
    setSelectedUtility(utility);
    setIsEditOpen(true);
  };

  const handleBatchImport = (
    payload: Parameters<typeof utilitiesApi.batchCreate>[1]
  ) => {
    batchImportMutation.mutate(payload);
  };

  const columns = useColumns({ onEdit: handleEdit });

  if (authLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  if (!orgId) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <Building2 className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">请先创建或加入组织</h2>
          <p className="text-muted-foreground">在顶部导航栏选择或创建一个组织开始使用</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <PermissionPageGuard>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">水电录入</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsExportTemplateOpen(true)}>
                <Download className="mr-2 h-4 w-4" />
                导出模版
              </Button>
              <Button variant="outline" onClick={() => setIsBatchImportOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                批量导入
              </Button>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                录入读数
              </Button>
            </div>
          </div>

        {/* 未录入初始读数的房间 */}
        {roomsMissingInitial.length > 0 && (
          <Card className="border-amber-500/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                未录入签约月初始读数的房间
              </CardTitle>
              <CardDescription>
                以下房间已签约但尚未录入签约月的初始水电读数，请及时补录
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2 text-left font-medium">公寓</th>
                      <th className="px-4 py-2 text-left font-medium">房间号</th>
                      <th className="px-4 py-2 text-left font-medium">租客</th>
                      <th className="px-4 py-2 text-left font-medium">签约日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomsMissingInitial.map((r) => (
                      <tr key={r.room_id} className="border-b last:border-0">
                        <td className="px-4 py-2">{r.apartment_name}</td>
                        <td className="px-4 py-2">{r.room_number}</td>
                        <td className="px-4 py-2">{r.tenant_name}</td>
                        <td className="px-4 py-2">{r.lease_start_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                点击「录入读数」可选择上述房间录入签约月的水电读数
              </p>
            </CardContent>
          </Card>
        )}

        {/* 筛选区域 */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">筛选：</span>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={filterApartmentId ?? 'all'}
              onValueChange={(v) => setFilterApartmentId(v === 'all' ? null : v)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="全部公寓" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部公寓</SelectItem>
                {apartments?.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterYear?.toString() ?? 'all'}
              onValueChange={(v) => setFilterYear(v === 'all' ? undefined : Number(v))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="全部年份" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部年份</SelectItem>
                {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}年
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterMonth?.toString() ?? 'all'}
              onValueChange={(v) => setFilterMonth(v === 'all' ? undefined : Number(v))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="全部月份" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部月份</SelectItem>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <SelectItem key={month} value={month.toString()}>
                    {month}月
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(filterApartmentId || filterYear || filterMonth) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterApartmentId(null);
                  setFilterYear(currentYear);
                  setFilterMonth(currentMonth);
                }}
              >
                重置
              </Button>
            )}
          </div>
        </div>

        {utilitiesLoading ? (
          <Skeleton className="h-96" />
        ) : (
          <DataTable columns={columns} data={utilities || []} />
        )}
      </div>

      <CreateUtilityDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
        apartments={apartments}
        rooms={rooms}
        selectedApartmentId={selectedApartmentId}
        onApartmentChange={setSelectedApartmentId}
      />

      <EditUtilityDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSubmit={(data) => {
          if (selectedUtility) {
            updateMutation.mutate({ id: selectedUtility.id, data });
          }
        }}
        isPending={updateMutation.isPending}
        utility={selectedUtility}
      />

      <ExportTemplateDialog
        open={isExportTemplateOpen}
        onOpenChange={setIsExportTemplateOpen}
      />

      <BatchImportDialog
        open={isBatchImportOpen}
        onOpenChange={setIsBatchImportOpen}
        onImport={handleBatchImport}
        isPending={batchImportMutation.isPending}
        allRooms={allRooms}
        apartments={apartments}
      />
    </MainLayout>
    </PermissionPageGuard>
  );
}
