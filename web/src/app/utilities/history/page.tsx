'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apartmentsApi, billsApi, leasesApi, utilitiesApi } from '@/lib/api';
import { filterEmptyStrings } from '@/lib/utils/form';
import { getErrorMessage } from '@/lib/utils/error';
import { useAuth } from '@/lib/auth/context';
import { formatDate } from '@/lib/date-utils';
import { UtilityReading } from '@/types';
import { Building2, Droplets, History, Pencil, Zap } from 'lucide-react';
import { EditUtilityDialog } from '../components';

/** 生成租约起止月之间的所有月份（含起止月） */
function getMonthsInLeasePeriod(
  startDate: string,
  endDate: string | null
): { year: number; month: number }[] {
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

interface LeaseMonthRow {
  year: number;
  month: number;
  label: string;
  reading: UtilityReading | null;
  waterFee: number;
  electricityFee: number;
}

export default function UtilitiesHistoryPage() {
  const queryClient = useQueryClient();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(null);
  const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUtility, setSelectedUtility] = useState<UtilityReading | null>(null);

  const { data: apartments } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(orgId!),
    enabled: !!orgId,
  });

  const { data: activeLeases = [], isLoading: leasesLoading } = useQuery({
    queryKey: ['leases', orgId, true],
    queryFn: () => leasesApi.list(orgId!, true),
    enabled: !!orgId,
  });

  const leasesInApartment = useMemo(() => {
    if (!selectedApartmentId) return [];
    return activeLeases
      .filter((l) => l.room?.apartment_id === selectedApartmentId)
      .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  }, [activeLeases, selectedApartmentId]);

  useEffect(() => {
    if (!selectedApartmentId) {
      setSelectedLeaseId(null);
      return;
    }
    setSelectedLeaseId(leasesInApartment[0]?.id ?? null);
  }, [leasesInApartment, selectedApartmentId]);

  const selectedLease = useMemo(
    () => activeLeases.find((l) => l.id === selectedLeaseId) ?? null,
    [activeLeases, selectedLeaseId]
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
  }, [leaseBills, leaseUtilities, selectedLease]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof utilitiesApi.update>[2] }) =>
      utilitiesApi.update(orgId!, id, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview', orgId] });
      setIsEditOpen(false);
      setSelectedUtility(null);
      toast.success('水电读数更新成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const handleEdit = (utility: UtilityReading) => {
    setSelectedUtility(utility);
    setIsEditOpen(true);
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
        <div className="flex h-full flex-col items-center justify-center space-y-4">
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
            <h1 className="text-3xl font-bold">历史水电记录</h1>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/utilities">
                  <History className="mr-2 h-4 w-4" />
                  返回水电录入
                </Link>
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>生效中租约列表</CardTitle>
              <CardDescription>
                先选择公寓，再从该公寓下的生效租约中选择一个查看租期内历史水电记录
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">公寓</span>
                  <Select
                    value={selectedApartmentId ?? 'none'}
                    onValueChange={(v) => setSelectedApartmentId(v === 'none' ? null : v)}
                  >
                    <SelectTrigger className="w-[260px]">
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
              </div>

              {!selectedApartmentId ? (
                <p className="py-8 text-sm text-muted-foreground">请选择公寓后查看租约列表</p>
              ) : leasesLoading ? (
                <Skeleton className="h-40" />
              ) : leasesInApartment.length === 0 ? (
                <p className="py-8 text-sm text-muted-foreground">该公寓暂无生效中的租约</p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>房间</TableHead>
                        <TableHead>租客</TableHead>
                        <TableHead>起租</TableHead>
                        <TableHead>结束</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leasesInApartment.map((l) => {
                        const isSelected = l.id === selectedLeaseId;
                        return (
                          <TableRow
                            key={l.id}
                            className={isSelected ? 'bg-muted/50' : 'cursor-pointer'}
                            onClick={() => setSelectedLeaseId(l.id)}
                          >
                            <TableCell className="font-medium">
                              {l.room?.room_number ?? '-'}
                            </TableCell>
                            <TableCell>{l.tenant?.name ?? '-'}</TableCell>
                            <TableCell>{formatDate(l.start_date)}</TableCell>
                            <TableCell>{l.end_date ? formatDate(l.end_date) : '至今'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>租期内历史水电记录</CardTitle>
              <CardDescription>
                {selectedLease
                  ? `${selectedLease.room?.apartment?.name ?? ''} - ${selectedLease.room?.room_number ?? ''} | ${
                      selectedLease.tenant?.name ?? ''
                    }`
                  : '请选择租约后查看'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedLease ? (
                <p className="py-8 text-sm text-muted-foreground">请选择租约后查看历史水电记录</p>
              ) : utilitiesLoading || billsLoading ? (
                <Skeleton className="h-64" />
              ) : leaseMonthRows.length === 0 ? (
                <p className="py-8 text-sm text-muted-foreground">该租约暂无可展示的月份</p>
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
                            {row.reading ? formatDate(row.reading.reading_date) : '—'}
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
            </CardContent>
          </Card>
        </div>

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
      </MainLayout>
    </PermissionPageGuard>
  );
}
