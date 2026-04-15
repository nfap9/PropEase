'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@apartment-ultra/shared-ui/components/ui';
import { apartmentsApi, billsApi, leasesApi, utilitiesApi } from '@/lib/api';
import { formatDate } from '@/lib/date-utils';
import { getErrorMessage } from '@/lib/utils/error';
import { filterEmptyStrings } from '@/lib/utils/form';
import { UtilityReading } from '@/types';
import { AlertCircle, Droplets, Pencil, Zap } from 'lucide-react';

const EditUtilityDialog = dynamic(() => import('./EditUtilityDialog').then((mod) => mod.EditUtilityDialog), {
  ssr: false,
});

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

interface LeaseMonthRow {
  year: number;
  month: number;
  label: string;
  reading: UtilityReading | null;
  waterFee: number;
  electricityFee: number;
}

export function UtilityHistoryPanel({ orgId }: { orgId: string }) {
  const queryClient = useQueryClient();
  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(null);
  const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUtility, setSelectedUtility] = useState<UtilityReading | null>(null);

  const { data: apartments } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(orgId),
    enabled: !!orgId,
  });

  const { data: activeLeases = [], isLoading: leasesLoading } = useQuery({
    queryKey: ['leases', orgId, true],
    queryFn: () => leasesApi.list(orgId, true),
    enabled: !!orgId,
  });

  const leasesInApartment = useMemo(() => {
    if (!selectedApartmentId) return [];
    return activeLeases
      .filter((lease) => lease.room?.apartment_id === selectedApartmentId)
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
    () => activeLeases.find((lease) => lease.id === selectedLeaseId) ?? null,
    [activeLeases, selectedLeaseId]
  );

  const { data: leaseUtilities = [], isLoading: utilitiesLoading } = useQuery({
    queryKey: ['utilities', orgId, selectedLease?.room_id],
    queryFn: () => utilitiesApi.list(orgId, { room_id: selectedLease!.room_id }),
    enabled: !!selectedLease?.room_id,
  });

  const { data: leaseBills = [], isLoading: billsLoading } = useQuery({
    queryKey: ['bills', orgId, selectedLeaseId],
    queryFn: () => billsApi.list(orgId, { lease_id: selectedLeaseId! }),
    enabled: !!selectedLeaseId,
  });

  const leaseMonthRows = useMemo((): LeaseMonthRow[] => {
    if (!selectedLease) return [];

    const months = getMonthsInLeasePeriod(selectedLease.start_date, selectedLease.end_date);
    const readingByPeriod = new Map<string, UtilityReading>();
    const billByPeriod = new Map<string, { water_amount: number; electricity_amount: number }>();

    for (const reading of leaseUtilities) {
      readingByPeriod.set(`${reading.period_year}-${reading.period_month}`, reading);
    }

    for (const bill of leaseBills) {
      billByPeriod.set(`${bill.bill_year}-${bill.bill_month}`, {
        water_amount: bill.water_amount ?? 0,
        electricity_amount: bill.electricity_amount ?? 0,
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
      utilitiesApi.update(orgId, id, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview', orgId] });
      setIsEditOpen(false);
      setSelectedUtility(null);
      appToast.success('水电读数更新成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  return (
    <>
      {/* 历史租约查询卡片 */}
      <Card className="border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-blue-600"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9,22 9,12 15,12 15,22" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-lg">历史租约查询</CardTitle>
              <CardDescription>选择公寓和租约，查看历史水电记录</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">公寓</span>
              <Select
                value={selectedApartmentId ?? 'none'}
                onValueChange={(value) => setSelectedApartmentId(value === 'none' ? null : value)}
              >
                <SelectTrigger className="w-[260px] border-slate-200 bg-white">
                  <SelectValue placeholder="请选择公寓" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">请选择公寓</SelectItem>
                  {apartments?.map((apartment) => (
                    <SelectItem key={apartment.id} value={apartment.id}>
                      {apartment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!selectedApartmentId ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-8 w-8 text-slate-400"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9,22 9,12 15,12 15,22" />
                </svg>
              </div>
              <p className="text-sm text-slate-500">请选择公寓后查看租约列表</p>
            </div>
          ) : leasesLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : leasesInApartment.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <AlertCircle className="h-8 w-8 text-amber-500" />
              </div>
              <p className="text-sm text-slate-500">该公寓暂无生效中的租约</p>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">房间</TableHead>
                    <TableHead className="font-semibold text-slate-700">租客</TableHead>
                    <TableHead className="font-semibold text-slate-700">起租日期</TableHead>
                    <TableHead className="font-semibold text-slate-700">结束日期</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leasesInApartment.map((lease) => {
                    const isSelected = lease.id === selectedLeaseId;
                    return (
                      <TableRow
                        key={lease.id}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                        }`}
                        onClick={() => setSelectedLeaseId(lease.id)}
                      >
                        <TableCell className="font-medium text-slate-900">{lease.room?.room_number ?? '-'}</TableCell>
                        <TableCell className="text-slate-600">{lease.tenant?.name ?? '-'}</TableCell>
                        <TableCell className="text-slate-600">{formatDate(lease.start_date)}</TableCell>
                        <TableCell className="text-slate-600">
                          {lease.end_date ? formatDate(lease.end_date) : '至今'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 历史水电记录卡片 */}
      <Card className="border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-purple-600"
                >
                  <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-lg">历史水电记录</CardTitle>
                <CardDescription>
                  {selectedLease
                    ? `${selectedLease.room?.apartment?.name ?? ''} - ${selectedLease.room?.room_number ?? ''} | ${
                        selectedLease.tenant?.name ?? ''
                      }`
                    : '请选择租约后查看'}
                </CardDescription>
              </div>
            </div>
            {selectedLease && (
              <div className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                <span className="text-xs font-medium text-blue-700">
                  {selectedLease.room?.room_number ?? ''} - {selectedLease.tenant?.name ?? ''}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {!selectedLease ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-8 w-8 text-slate-400"
                >
                  <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
                </svg>
              </div>
              <p className="text-sm text-slate-500">请选择租约后查看历史水电记录</p>
            </div>
          ) : utilitiesLoading || billsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : leaseMonthRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-8 w-8 text-slate-400"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <p className="text-sm text-slate-500">该租约暂无可展示的月份</p>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">月份</TableHead>
                    <TableHead className="font-semibold text-slate-700">记录日期</TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <span className="flex items-center gap-1">
                        <Droplets className="h-4 w-4 text-blue-500" />
                        水表读数 (m³)
                      </span>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <span className="flex items-center gap-1">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        电表读数 (kWh)
                      </span>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">水费 (元)</TableHead>
                    <TableHead className="font-semibold text-slate-700">电费 (元)</TableHead>
                    <TableHead className="w-[80px] text-slate-700">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaseMonthRows.map((row, index) => (
                    <TableRow
                      key={`${row.year}-${row.month}`}
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    >
                      <TableCell className="font-medium text-slate-900">{row.label}</TableCell>
                      <TableCell className="text-slate-600">
                        {row.reading ? formatDate(row.reading.reading_date) : '—'}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {row.reading?.water_reading != null ? String(row.reading.water_reading) : '—'}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {row.reading?.electricity_reading != null ? String(row.reading.electricity_reading) : '—'}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {row.waterFee > 0 ? <span className="text-blue-600">{row.waterFee.toFixed(2)}</span> : '—'}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {row.electricityFee > 0 ? (
                          <span className="text-amber-600">{row.electricityFee.toFixed(2)}</span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        {row.reading ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => {
                              setSelectedUtility(row.reading);
                              setIsEditOpen(true);
                            }}
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

      {isEditOpen && selectedUtility ? (
        <EditUtilityDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSubmit={(data) => {
            updateMutation.mutate({ id: selectedUtility.id, data });
          }}
          isPending={updateMutation.isPending}
          utility={selectedUtility}
        />
      ) : null}
    </>
  );
}
