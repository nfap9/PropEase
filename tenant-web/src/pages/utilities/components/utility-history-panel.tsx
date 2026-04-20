import { lazy } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button, Skeleton, Select, Table } from 'antd';
import { apartmentsApi, billsApi, leasesApi, utilitiesApi } from '@/api';
import { formatDate } from '@/utils/date';
import { getErrorMessage } from '@/utils/error';
import { filterEmptyStrings } from '@/utils/form';
import { UtilityReading } from '@/types';
import { Droplets, Pencil, Zap } from 'lucide-react';

const EditUtilityDialog = lazy(() => import('./EditUtilityDialog').then((mod) => ({ default: mod.EditUtilityDialog })));

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
    queryFn: () => apartmentsApi.list(),
    enabled: !!orgId,
  });

  const { data: activeLeases = [], isLoading: leasesLoading } = useQuery({
    queryKey: ['leases', orgId, true],
    queryFn: () => leasesApi.list(true),
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
    queryFn: () => utilitiesApi.list({ room_id: selectedLease!.room_id }),
    enabled: !!selectedLease?.room_id,
  });

  const { data: leaseBills = [], isLoading: billsLoading } = useQuery({
    queryKey: ['bills', orgId, selectedLeaseId],
    queryFn: () => billsApi.list({ lease_id: selectedLeaseId! }),
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
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof utilitiesApi.update>[1] }) =>
      utilitiesApi.update(id, filterEmptyStrings(data) as Parameters<typeof utilitiesApi.update>[1]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview', orgId] });
      setIsEditOpen(false);
      setSelectedUtility(null);
      toast.success('水电读数更新成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const columns = [
    { title: '月份', dataIndex: 'label', key: 'label' },
    {
      title: '记录日期',
      dataIndex: 'reading',
      key: 'reading_date',
      render: (reading: UtilityReading | null) => reading ? formatDate(reading.reading_date) : '—',
    },
    {
      title: (
        <span className="flex items-center gap-1">
          <Droplets className="h-4 w-4 text-blue-500" />
          水表 (m³)
        </span>
      ),
      dataIndex: 'reading',
      key: 'water_reading',
      render: (reading: UtilityReading | null) => reading?.water_reading != null ? reading.water_reading : '—',
    },
    {
      title: (
        <span className="flex items-center gap-1">
          <Zap className="h-4 w-4 text-yellow-500" />
          电表 (kWh)
        </span>
      ),
      dataIndex: 'reading',
      key: 'electricity_reading',
      render: (reading: UtilityReading | null) => reading?.electricity_reading != null ? reading.electricity_reading : '—',
    },
    {
      title: '水费',
      dataIndex: 'waterFee',
      key: 'waterFee',
      render: (fee: number) => fee > 0 ? fee.toFixed(2) : '—',
    },
    {
      title: '电费',
      dataIndex: 'electricityFee',
      key: 'electricityFee',
      render: (fee: number) => fee > 0 ? fee.toFixed(2) : '—',
    },
    {
      title: '',
      dataIndex: 'reading',
      key: 'actions',
      render: (reading: UtilityReading | null, record: LeaseMonthRow) =>
        reading && (
          <Button
            variant="text"
            size="small"
            className="h-8 w-8 p-0"
            onClick={() => {
              setSelectedUtility(reading);
              setIsEditOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* 筛选器 */}
      <div className="flex items-center gap-4">
        <Select
          value={selectedApartmentId ?? undefined}
          onChange={(value) => setSelectedApartmentId(value ?? null)}
          placeholder="选择公寓"
          style={{ width: 200 }}
          options={[
            { value: '', label: '选择公寓' },
            ...(apartments?.map((apartment) => ({
              value: apartment.id,
              label: apartment.name,
            })) ?? []),
          ]}
        />

        {selectedApartmentId && (
          <Select
            value={selectedLeaseId ?? undefined}
            onChange={(value) => setSelectedLeaseId(value ?? null)}
            placeholder="选择租约"
            style={{ width: 240 }}
            options={[
              { value: '', label: '选择租约' },
              ...(leasesLoading
                ? [{ value: 'loading', label: '加载中...', disabled: true }]
                : leasesInApartment.length === 0
                  ? [{ value: 'empty', label: '暂无生效租约', disabled: true }]
                  : leasesInApartment.map((lease) => ({
                    value: lease.id,
                    label: `${lease.room?.room_number} - ${lease.tenant?.name ?? '无租客'}`,
                  }))),
            ]}
          />
        )}
      </div>

      {/* 历史记录表格 */}
      {selectedLease && (
        <div className="rounded-lg border">
          <Table
            columns={columns}
            dataSource={leaseMonthRows.map((row) => ({ ...row, key: `${row.year}-${row.month}` }))}
            pagination={false}
            loading={utilitiesLoading || billsLoading}
            locale={{ emptyText: '暂无可展示的月份' }}
          />
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
