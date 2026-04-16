'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
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
import { Droplets, Pencil, Zap } from 'lucide-react';

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
    <div className="space-y-4">
      {/* 筛选器 */}
      <div className="flex items-center gap-4">
        <Select
          value={selectedApartmentId ?? 'none'}
          onValueChange={(value) => setSelectedApartmentId(value === 'none' ? null : value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="选择公寓" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">选择公寓</SelectItem>
            {apartments?.map((apartment) => (
              <SelectItem key={apartment.id} value={apartment.id}>
                {apartment.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedApartmentId && (
          <Select
            value={selectedLeaseId ?? 'none'}
            onValueChange={(value) => setSelectedLeaseId(value === 'none' ? null : value)}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="选择租约" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">选择租约</SelectItem>
              {leasesLoading ? (
                <SelectItem value="loading" disabled>
                  加载中...
                </SelectItem>
              ) : leasesInApartment.length === 0 ? (
                <SelectItem value="empty" disabled>
                  暂无生效租约
                </SelectItem>
              ) : (
                leasesInApartment.map((lease) => (
                  <SelectItem key={lease.id} value={lease.id}>
                    {lease.room?.room_number} - {lease.tenant?.name ?? '无租客'}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* 历史记录表格 */}
      {selectedLease && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>月份</TableHead>
                <TableHead>记录日期</TableHead>
                <TableHead>
                  <span className="flex items-center gap-1">
                    <Droplets className="h-4 w-4 text-info" />
                    水表 (m³)
                  </span>
                </TableHead>
                <TableHead>
                  <span className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-warning" />
                    电表 (kWh)
                  </span>
                </TableHead>
                <TableHead>水费</TableHead>
                <TableHead>电费</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {utilitiesLoading || billsLoading ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ) : leaseMonthRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    暂无可展示的月份
                  </TableCell>
                </TableRow>
              ) : (
                leaseMonthRows.map((row) => (
                  <TableRow key={`${row.year}-${row.month}`}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell>{row.reading ? formatDate(row.reading.reading_date) : '—'}</TableCell>
                    <TableCell>
                      {row.reading?.water_reading != null ? row.reading.water_reading : '—'}
                    </TableCell>
                    <TableCell>
                      {row.reading?.electricity_reading != null ? row.reading.electricity_reading : '—'}
                    </TableCell>
                    <TableCell>{row.waterFee > 0 ? row.waterFee.toFixed(2) : '—'}</TableCell>
                    <TableCell>{row.electricityFee > 0 ? row.electricityFee.toFixed(2) : '—'}</TableCell>
                    <TableCell>
                      {row.reading && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setSelectedUtility(row.reading);
                            setIsEditOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

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
    </div>
  );
}
