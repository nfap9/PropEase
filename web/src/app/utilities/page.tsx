'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { apartmentsApi, roomsApi, utilitiesApi, leasesApi, billsApi } from '@/lib/api';
import { filterEmptyStrings } from '@/lib/utils/form';
import { getErrorMessage } from '@/lib/utils/error';
import { useAuth } from '@/lib/auth/context';
import { UtilityReading } from '@/types';
import { Plus, Upload, Download, Building2, AlertCircle, Droplets, Zap, Pencil } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreateUtilityDialog,
  EditUtilityDialog,
  ExportTemplateDialog,
  BatchImportDialog,
} from './components';
import { InitialReadingDialog } from '@/components/common/initial-reading-dialog';
import type { RoomMissingInitialReading } from '@/lib/api/utilities';
import { formatDate } from '@/lib/date-utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/** 租约期内某月的水电读数与费用 */
interface LeaseMonthRow {
  year: number;
  month: number;
  label: string;
  reading: UtilityReading | null;
  waterFee: number;
  electricityFee: number;
}

/** 生成租约起止月之间的所有月份 */
function getMonthsInLeasePeriod(startDate: string, endDate: string | null): { year: number; month: number }[] {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  if (end < start) return [];
  const months: { year: number; month: number }[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cur <= endMonth) {
    months.push({ year: cur.getFullYear(), month: cur.getMonth() + 1 });
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

export default function UtilitiesPage() {
  const queryClient = useQueryClient();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isExportTemplateOpen, setIsExportTemplateOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [selectedUtility, setSelectedUtility] = useState<UtilityReading | null>(null);
  const [initialReadingRoom, setInitialReadingRoom] = useState<RoomMissingInitialReading | null>(null);

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

  const { data: leases = [] } = useQuery({
    queryKey: ['leases', orgId],
    queryFn: () => leasesApi.list(orgId!),
    enabled: !!orgId,
  });

  const leasesForRoom = useMemo(() => {
    if (!selectedRoomId) return [];
    return leases
      .filter((l) => l.room_id === selectedRoomId)
      .sort((a, b) => {
        const aActive = a.is_active ? 1 : 0;
        const bActive = b.is_active ? 1 : 0;
        if (aActive !== bActive) return bActive - aActive;
        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
      });
  }, [leases, selectedRoomId]);

  const latestLeaseForRoom = leasesForRoom[0] ?? null;

  useEffect(() => {
    if (!selectedRoomId) {
      setSelectedLeaseId(null);
      return;
    }
    setSelectedLeaseId(latestLeaseForRoom?.id ?? null);
  }, [selectedRoomId, latestLeaseForRoom?.id]);

  const selectedLease = useMemo(
    () => leases.find((l) => l.id === selectedLeaseId) ?? null,
    [leases, selectedLeaseId]
  );

  const { data: leaseUtilities = [], isLoading: utilitiesLoading } = useQuery({
    queryKey: ['utilities', orgId, selectedLease?.room_id],
    queryFn: () => utilitiesApi.list(orgId!, { room_id: selectedLease!.room_id }),
    enabled: !!orgId && !!selectedLease?.room_id,
  });

  const { data: leaseBills = [], isLoading: billsLoading } = useQuery({
    queryKey: ['bills', orgId, selectedLeaseId],
    queryFn: () => billsApi.list(orgId!, { lease_id: selectedLeaseId! }),
    enabled: !!orgId && !!selectedLeaseId,
  });

  const { data: roomsMissingInitial = [] } = useQuery({
    queryKey: ['utilities', 'rooms-missing-initial', orgId],
    queryFn: () => utilitiesApi.getRoomsMissingInitial(orgId!),
    enabled: !!orgId,
  });

  const leaseMonthRows = useMemo((): LeaseMonthRow[] => {
    if (!selectedLease) return [];
    const months = getMonthsInLeasePeriod(selectedLease.start_date, selectedLease.end_date);
    const readingByPeriod = new Map<string, UtilityReading>();
    for (const r of leaseUtilities) {
      readingByPeriod.set(`${r.period_year}-${r.period_month}`, r);
    }
    const billByPeriod = new Map<string, { water_amount: number; electricity_amount: number }>();
    for (const b of leaseBills) {
      billByPeriod.set(`${b.bill_year}-${b.bill_month}`, {
        water_amount: b.water_amount ?? 0,
        electricity_amount: b.electricity_amount ?? 0,
      });
    }
    return months.map(({ year, month }) => {
      const reading = readingByPeriod.get(`${year}-${month}`) ?? null;
      const bill = billByPeriod.get(`${year}-${month}`);
      return {
        year,
        month,
        label: `${year}年${month}月`,
        reading,
        waterFee: bill?.water_amount ?? 0,
        electricityFee: bill?.electricity_amount ?? 0,
      };
    });
  }, [selectedLease, leaseUtilities, leaseBills]);

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

  const handleBatchImport = (payload: Parameters<typeof utilitiesApi.batchCreate>[1]) => {
    batchImportMutation.mutate(payload);
  };

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

  const leaseOptions = leasesForRoom.map((l) => {
    const tenant = l.tenant?.name ?? '';
    const range = `${formatDate(l.start_date)} 至 ${l.end_date ? formatDate(l.end_date) : '至今'}`;
    const suffix = l.is_active ? ' (当前)' : '';
    return {
      id: l.id,
      label: `${tenant} | ${range}${suffix}`,
    };
  });

  const handleApartmentChange = (v: string) => {
    const id = v === 'none' ? null : v;
    setSelectedApartmentId(id);
    setSelectedRoomId(null);
    setSelectedLeaseId(null);
  };

  const handleRoomChange = (v: string) => {
    setSelectedRoomId(v === 'none' ? null : v);
  };

  return (
    <PermissionPageGuard>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">水电记录</h1>
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
                        <th className="px-4 py-2 text-right font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roomsMissingInitial.map((r) => (
                        <tr key={r.room_id} className="border-b last:border-0">
                          <td className="px-4 py-2">{r.apartment_name}</td>
                          <td className="px-4 py-2">{r.room_number}</td>
                          <td className="px-4 py-2">{r.tenant_name}</td>
                          <td className="px-4 py-2">{r.lease_start_date}</td>
                          <td className="px-4 py-2 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setInitialReadingRoom(r)}
                            >
                              录入
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  点击每行「录入」按钮可快速录入该房间签约月的初始水电读数，读数日期默认签约日期
                </p>
              </CardContent>
            </Card>
          )}

          {/* 按租约查看 */}
          <Card>
            <CardHeader>
              <CardTitle>按租约查看水电记录</CardTitle>
              <CardDescription>依次选择公寓、房间后查看租期内各月水电读数及产生的费用</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">公寓</span>
                    <Select
                      value={selectedApartmentId ?? 'none'}
                      onValueChange={handleApartmentChange}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="请选择公寓" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">请选择公寓</SelectItem>
                        {apartments?.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">房间</span>
                    <Select
                      value={selectedRoomId ?? 'none'}
                      onValueChange={handleRoomChange}
                      disabled={!selectedApartmentId}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="请选择房间" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">请选择房间</SelectItem>
                        {rooms?.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.room_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">租约</span>
                    <Select
                      value={selectedLeaseId ?? 'none'}
                      onValueChange={(v) => setSelectedLeaseId(v === 'none' ? null : v)}
                      disabled={!selectedRoomId}
                    >
                      <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="默认最新租约" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">请选择租约</SelectItem>
                        {leaseOptions.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedRoomId && leaseOptions.length === 0 && (
                  <p className="text-sm text-muted-foreground py-8">
                    该房间暂无租约
                  </p>
                )}

                {selectedLease && (
                  <>
                    {utilitiesLoading || billsLoading ? (
                      <Skeleton className="h-64" />
                    ) : leaseMonthRows.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-8">
                        该租约暂无可展示的月份
                      </p>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>月份</TableHead>
                              <TableHead>记录日期</TableHead>
                              <TableHead>
                                <span className="flex items-center gap-1">
                                  <Droplets className="h-4 w-4 text-blue-500" />
                                  水表读数 (m³)
                                </span>
                              </TableHead>
                              <TableHead>
                                <span className="flex items-center gap-1">
                                  <Zap className="h-4 w-4 text-yellow-500" />
                                  电表读数 (kWh)
                                </span>
                              </TableHead>
                              <TableHead>水费 (元)</TableHead>
                              <TableHead>电费 (元)</TableHead>
                              <TableHead className="w-[80px]">操作</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {leaseMonthRows.map((row) => (
                              <TableRow key={`${row.year}-${row.month}`}>
                                <TableCell className="font-medium">{row.label}</TableCell>
                                <TableCell>
                                  {row.reading
                                    ? formatDate(row.reading.reading_date)
                                    : '—'}
                                </TableCell>
                                <TableCell>
                                  {row.reading?.water_reading != null
                                    ? String(row.reading.water_reading)
                                    : '—'}
                                </TableCell>
                                <TableCell>
                                  {row.reading?.electricity_reading != null
                                    ? String(row.reading.electricity_reading)
                                    : '—'}
                                </TableCell>
                                <TableCell>{row.waterFee > 0 ? row.waterFee.toFixed(2) : '—'}</TableCell>
                                <TableCell>
                                  {row.electricityFee > 0 ? row.electricityFee.toFixed(2) : '—'}
                                </TableCell>
                                <TableCell>
                                  {row.reading ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleEdit(row.reading!)}
                                      aria-label={`编辑${row.label}读数`}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    '—'
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
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

        {initialReadingRoom && (
          <InitialReadingDialog
            orgId={orgId}
            roomId={initialReadingRoom.room_id}
            roomDisplay={`${initialReadingRoom.apartment_name} - ${initialReadingRoom.room_number}`}
            startDate={initialReadingRoom.lease_start_date}
            open={!!initialReadingRoom}
            onOpenChange={(open) => !open && setInitialReadingRoom(null)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['utilities', 'rooms-missing-initial', orgId] });
              queryClient.invalidateQueries({ queryKey: ['dashboard-overview', orgId] });
              setInitialReadingRoom(null);
            }}
          />
        )}
      </MainLayout>
    </PermissionPageGuard>
  );
}
