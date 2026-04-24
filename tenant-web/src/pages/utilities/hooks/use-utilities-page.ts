import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { RoomMissingInitialReading, UtilityReading } from '@/types';
import type { PendingUtilityBillRow } from '@/types/utilities';
import { useUtilitiesData, useMonthStats } from '@/hooks/use-utilities';

export interface UtilitiesPageState {
  // Data (from useUtilitiesData)
  pendingUtilityBills: ReturnType<typeof useUtilitiesData>['pendingUtilityBills'];
  monthRoomsNeedInputCount: ReturnType<typeof useUtilitiesData>['monthRoomsNeedInputCount'];
  monthRoomsRecordedCount: ReturnType<typeof useUtilitiesData>['monthRoomsRecordedCount'];
  roomsMissingInitial: ReturnType<typeof useUtilitiesData>['roomsMissingInitial'];
  apartmentRooms: ReturnType<typeof useUtilitiesData>['apartmentRooms'];
  allRooms: ReturnType<typeof useUtilitiesData>['allRooms'];
  apartments: ReturnType<typeof useUtilitiesData>['apartments'];
  createMutation: ReturnType<typeof useUtilitiesData>['createMutation'];
  updateMutation: ReturnType<typeof useUtilitiesData>['updateMutation'];
  batchImportMutation: ReturnType<typeof useUtilitiesData>['batchImportMutation'];

  // Computed (from useMonthStats)
  readyToBillCount: number;
  overdueCount: number;

  // UI State
  activeTab: 'entry' | 'history';
  isCreateOpen: boolean;
  isExportTemplateOpen: boolean;
  isBatchImportOpen: boolean;
  initialReadingRoom: RoomMissingInitialReading | null;
  editingUtility: UtilityReading | null;
  createPreset: {
    apartmentId: string;
    roomId: string;
    periodYear: number;
    periodMonth: number;
    readingDate: string;
    waterPrevious?: number | null;
    electricityPrevious?: number | null;
  } | null;

  // Actions
  setActiveTab: (tab: 'entry' | 'history') => void;
  setIsCreateOpen: (open: boolean) => void;
  setIsExportTemplateOpen: (open: boolean) => void;
  setIsBatchImportOpen: (open: boolean) => void;
  setInitialReadingRoom: (room: RoomMissingInitialReading | null) => void;
  setEditingUtility: (utility: UtilityReading | null) => void;
  handleQuickEntry: (record: PendingUtilityBillRow) => void;
  handleQuickUpdate: (record: PendingUtilityBillRow) => void;
  clearCreatePreset: () => void;
  invalidateInitialReadingQueries: (orgId: string) => void;
}

export function useUtilitiesPage(): UtilitiesPageState {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [activeTab, setActiveTab] = useState<'entry' | 'history'>(() => {
    return searchParams.get('tab') === 'history' ? 'history' : 'entry';
  });

  // 弹窗状态
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isExportTemplateOpen, setIsExportTemplateOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [initialReadingRoom, setInitialReadingRoom] = useState<RoomMissingInitialReading | null>(null);
  const [editingUtility, setEditingUtility] = useState<UtilityReading | null>(null);

  // 录入预设
  const [createPreset, setCreatePreset] = useState<{
    apartmentId: string;
    roomId: string;
    periodYear: number;
    periodMonth: number;
    readingDate: string;
    waterPrevious?: number | null;
    electricityPrevious?: number | null;
  } | null>(null);

  // 数据
  const utilitiesData = useUtilitiesData();
  const { readyToBillCount, overdueCount } = useMonthStats(utilitiesData.pendingUtilityBills);

  // 快捷录入
  const handleQuickEntry = useCallback((record: PendingUtilityBillRow) => {
    setCreatePreset({
      apartmentId: record.apartmentId ?? '',
      roomId: record.roomId,
      periodYear: currentYear,
      periodMonth: currentMonth,
      readingDate: today.toISOString().split('T')[0],
      waterPrevious: record.waterPrevious,
      electricityPrevious: record.electricityPrevious,
    });
    setIsCreateOpen(true);
  }, [currentYear, currentMonth, today]);

  const handleQuickUpdate = useCallback((record: PendingUtilityBillRow) => {
    if (record.currentReading) {
      setEditingUtility(record.currentReading);
    }
  }, []);

  const clearCreatePreset = useCallback(() => {
    setCreatePreset(null);
  }, []);

  const invalidateInitialReadingQueries = useCallback((orgId: string) => {
    queryClient.invalidateQueries({ queryKey: ['utilities', 'rooms-missing-initial', orgId] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-overview', orgId] });
  }, [queryClient]);

  return {
    ...utilitiesData,
    readyToBillCount,
    overdueCount,
    activeTab,
    setActiveTab,
    isCreateOpen,
    setIsCreateOpen,
    isExportTemplateOpen,
    setIsExportTemplateOpen,
    isBatchImportOpen,
    setIsBatchImportOpen,
    initialReadingRoom,
    setInitialReadingRoom,
    editingUtility,
    setEditingUtility,
    createPreset,
    handleQuickEntry,
    handleQuickUpdate,
    clearCreatePreset,
    invalidateInitialReadingQueries,
  };
}
