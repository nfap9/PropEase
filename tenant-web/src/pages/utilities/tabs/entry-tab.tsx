import { Button } from 'antd';
import { Plus, Upload, Download } from 'lucide-react';
import type { RoomMissingInitialReading } from '@/types';
import type { PendingUtilityBillRow } from '@/types/utilities';
import { MonthStatsCard } from '../components/month-stats-card';
import { PendingBillTable } from '../components/pending-bill-table';
import { MissingInitialWarning } from '../components/missing-initial-warning';

interface EntryTabProps {
  recordedCount: number;
  totalCount: number;
  missingCount: number;
  readyToBillCount: number;
  overdueCount: number;
  bills: PendingUtilityBillRow[];
  missingRooms: RoomMissingInitialReading[];
  onEntry: (record: PendingUtilityBillRow) => void;
  onUpdate: (record: PendingUtilityBillRow) => void;
  onMissingEntry: (room: RoomMissingInitialReading) => void;
  onExportTemplate: () => void;
  onBatchImport: () => void;
  onAdd: () => void;
}

export function EntryTab({
  recordedCount,
  totalCount,
  missingCount,
  readyToBillCount,
  overdueCount,
  bills,
  missingRooms,
  onEntry,
  onUpdate,
  onMissingEntry,
  onExportTemplate,
  onBatchImport,
  onAdd,
}: EntryTabProps) {
  return (
    <div className="space-y-4">
      <MonthStatsCard
        recordedCount={recordedCount}
        totalCount={totalCount}
        missingCount={missingCount}
        readyToBillCount={readyToBillCount}
        overdueCount={overdueCount}
      />

      <div className="flex gap-2">
        <Button onClick={onExportTemplate} icon={<Download className="h-4 w-4" />}>
          导出模版
        </Button>
        <Button onClick={onBatchImport} icon={<Upload className="h-4 w-4" />}>
          批量导入
        </Button>
        <Button type="primary" onClick={onAdd} icon={<Plus className="h-4 w-4" />}>
          录入读数
        </Button>
      </div>

      <PendingBillTable data={bills} onEntry={onEntry} onUpdate={onUpdate} />

      <MissingInitialWarning rooms={missingRooms} onEntry={onMissingEntry} />
    </div>
  );
}
