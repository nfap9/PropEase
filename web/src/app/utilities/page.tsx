'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { MainLayout } from '@/components/layout/main-layout';
import { DataTable } from '@/components/common/data-table';
import { TableActions, TableAction } from '@/components/common/table-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColumnDef } from '@tanstack/react-table';
import { apartmentsApi, roomsApi, utilitiesApi } from '@/lib/api';
import { filterEmptyStrings } from '@/lib/utils/form';
import { useAuth } from '@/lib/auth/context';
import { UtilityReading, Room } from '@/types';
import { Plus, Pencil, Zap, Droplets, Building2, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const utilitySchema = z.object({
  room_id: z.number().min(1, '请选择房间'),
  period_year: z.number().min(2020).max(2100),
  period_month: z.number().min(1).max(12),
  reading_date: z.string().min(1, '请选择读数日期'),
  water_reading: z.number().min(0).optional(),
  electricity_reading: z.number().min(0).optional(),
  notes: z.string().optional(),
});

type UtilityFormData = z.infer<typeof utilitySchema>;

export default function UtilitiesPage() {
  const queryClient = useQueryClient();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const [selectedApartmentId, setSelectedApartmentId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [selectedUtility, setSelectedUtility] = useState<UtilityReading | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

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

  // 获取所有房间用于批量导入匹配
  const { data: allRooms } = useQuery({
    queryKey: ['allRooms', orgId],
    queryFn: () => roomsApi.listAll(orgId!, apartments?.map((a) => a.id) || []),
    enabled: !!orgId && !!apartments && apartments.length > 0,
  });

  const { data: utilities, isLoading: utilitiesLoading } = useQuery({
    queryKey: ['utilities', orgId],
    queryFn: () => utilitiesApi.list(orgId!),
    enabled: !!orgId,
  });

  const createForm = useForm<UtilityFormData>({
    resolver: zodResolver(utilitySchema),
    defaultValues: {
      room_id: 0,
      period_year: currentYear,
      period_month: currentMonth,
      reading_date: today.toISOString().split('T')[0],
      water_reading: 0,
      electricity_reading: 0,
      notes: '',
    },
  });

  const editForm = useForm<UtilityFormData>({
    resolver: zodResolver(utilitySchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: UtilityFormData) => utilitiesApi.create(orgId!, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities', orgId] });
      setIsCreateOpen(false);
      createForm.reset();
      toast.success('水电读数录入成功');
    },
    onError: () => {
      toast.error('录入失败，请重试');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UtilityFormData }) =>
      utilitiesApi.update(orgId!, id, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities', orgId] });
      setIsEditOpen(false);
      setSelectedUtility(null);
      toast.success('水电读数更新成功');
    },
    onError: () => {
      toast.error('更新失败，请重试');
    },
  });

  const batchImportMutation = useMutation({
    mutationFn: (data: Parameters<typeof utilitiesApi.batchCreate>[1]) =>
      utilitiesApi.batchCreate(orgId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities', orgId] });
      setIsBatchImportOpen(false);
      toast.success('批量导入成功');
    },
    onError: () => {
      toast.error('批量导入失败，请重试');
    },
  });

  const occupiedRooms = rooms?.filter((r) => r.status === 'occupied');

  // 下载 Excel 模板
  const downloadTemplate = () => {
    const templateData = [
      ['公寓名称', '房间号', '水表读数(m³)', '电表读数(kWh)', '备注'],
      ['示例公寓', '101', '123.45', '567.89', '示例备注'],
      ['示例公寓', '102', '', '', ''],
    ];
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '水电读数导入');
    XLSX.writeFile(wb, '水电读数导入模板.xlsx');
  };

  // 解析 Excel 文件
  const parseExcelFile = async (file: File) => {
    return new Promise<{ room_number: string; water_reading: number | null; electricity_reading: number | null; notes: string | null }[]>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

          // 跳过标题行，解析数据
          const records = jsonData.slice(1)
            .filter((row) => row[1]) // 房间号必填
            .map((row) => ({
              room_number: String(row[1] || '').trim(),
              water_reading: row[2] !== undefined && row[2] !== '' && row[2] !== null ? Number(row[2]) : null,
              electricity_reading: row[3] !== undefined && row[3] !== '' && row[3] !== null ? Number(row[3]) : null,
              notes: row[4] !== undefined && row[4] !== '' && row[4] !== null ? String(row[4]) : null,
            }));

          resolve(records);
        } catch {
          reject(new Error('Excel 文件解析失败'));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  };

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const records = await parseExcelFile(file);

      if (records.length === 0) {
        toast.error('Excel 文件中没有有效数据');
        return;
      }

      // 匹配房间号到 room_id
      const roomMap = new Map<string, Room>();
      allRooms?.forEach((room) => {
        roomMap.set(room.room_number, room);
      });

      const matchedRecords: { room_id: number; water_reading: number | null; electricity_reading: number | null; notes: string | null }[] = [];
      const unmatchedRooms: string[] = [];

      for (const record of records) {
        const room = roomMap.get(record.room_number);
        if (room) {
          matchedRecords.push({
            room_id: room.id,
            water_reading: record.water_reading,
            electricity_reading: record.electricity_reading,
            notes: record.notes,
          });
        } else {
          unmatchedRooms.push(record.room_number);
        }
      }

      if (unmatchedRooms.length > 0) {
        toast.warning(`以下房间号未找到匹配: ${unmatchedRooms.join(', ')}`);
      }

      if (matchedRecords.length === 0) {
        toast.error('没有匹配到任何房间');
        return;
      }

      // 调用批量导入 API
      batchImportMutation.mutate({
        period_year: currentYear,
        period_month: currentMonth,
        reading_date: today.toISOString().split('T')[0],
        readings: matchedRecords,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '导入失败');
    }

    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEdit = (utility: UtilityReading) => {
    setSelectedUtility(utility);
    editForm.reset({
      room_id: utility.room_id,
      period_year: utility.period_year,
      period_month: utility.period_month,
      reading_date: utility.reading_date,
      water_reading: utility.water_reading || 0,
      electricity_reading: utility.electricity_reading || 0,
      notes: utility.notes || '',
    });
    setIsEditOpen(true);
  };

  const columns: ColumnDef<UtilityReading>[] = [
    {
      accessorKey: 'period_month',
      header: '月份',
      cell: ({ row }) => `${row.original.period_year}年${row.original.period_month}月`,
    },
    {
      accessorKey: 'room',
      header: '房间',
      cell: ({ row }) => {
        const room = row.original.room;
        return room ? `${room.apartment?.name || ''} - ${room.room_number}` : '-';
      },
    },
    {
      accessorKey: 'reading_date',
      header: '记录日期',
      cell: ({ row }) => row.original.reading_date,
    },
    {
      accessorKey: 'water_reading',
      header: '水表读数',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-blue-500" />
          {row.original.water_reading !== null && row.original.water_reading !== undefined
            ? row.original.water_reading
            : '-'}
        </div>
      ),
    },
    {
      accessorKey: 'electricity_reading',
      header: '电表读数',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          {row.original.electricity_reading !== null &&
          row.original.electricity_reading !== undefined
            ? row.original.electricity_reading
            : '-'}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const utility = row.original;
        const actions: TableAction[] = [
          {
            label: '编辑',
            icon: Pencil,
            onClick: () => handleEdit(utility),
          },
        ];
        return <TableActions actions={actions} />;
      },
    },
  ];

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

  // 无组织时的提示
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
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">水电录入</h1>
          <div className="flex gap-2">
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

        {utilitiesLoading ? (
          <Skeleton className="h-96" />
        ) : (
          <DataTable columns={columns} data={utilities || []} />
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>录入水电读数</DialogTitle>
            <DialogDescription>录入房间的水电表读数</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>选择公寓</Label>
                <Select
                  value={selectedApartmentId?.toString() || ''}
                  onValueChange={(value) => setSelectedApartmentId(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择公寓" />
                  </SelectTrigger>
                  <SelectContent>
                    {apartments?.map((apt) => (
                      <SelectItem key={apt.id} value={apt.id.toString()}>
                        {apt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="room_id">选择房间 *</Label>
                <Select
                  value={createForm.watch('room_id')?.toString() || ''}
                  onValueChange={(value) =>
                    createForm.setValue('room_id', Number(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择房间" />
                  </SelectTrigger>
                  <SelectContent>
                    {occupiedRooms?.map((room) => (
                      <SelectItem key={room.id} value={room.id.toString()}>
                        {room.room_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="period_year">年份</Label>
                <Select
                  value={createForm.watch('period_year')?.toString() || currentYear.toString()}
                  onValueChange={(value) =>
                    createForm.setValue('period_year', Number(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}年
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="period_month">月份</Label>
                <Select
                  value={createForm.watch('period_month')?.toString() || currentMonth.toString()}
                  onValueChange={(value) =>
                    createForm.setValue('period_month', Number(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        {month}月
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reading_date">读数日期 *</Label>
                <Input
                  id="reading_date"
                  type="date"
                  {...createForm.register('reading_date')}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="water_reading">
                  <span className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    水表读数 (m³)
                  </span>
                </Label>
                <Input
                  id="water_reading"
                  type="number"
                  step="0.01"
                  {...createForm.register('water_reading', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="electricity_reading">
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    电表读数 (kWh)
                  </span>
                </Label>
                <Input
                  id="electricity_reading"
                  type="number"
                  step="0.01"
                  {...createForm.register('electricity_reading', { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <Input id="notes" {...createForm.register('notes')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑水电读数</DialogTitle>
            <DialogDescription>修改水电表读数</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit((data) =>
              updateMutation.mutate({ id: selectedUtility!.id, data })
            )}
            className="space-y-4"
          >
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>年份</Label>
                <Input value={selectedUtility?.period_year} disabled />
              </div>
              <div className="space-y-2">
                <Label>月份</Label>
                <Input value={`${selectedUtility?.period_month}月`} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-reading_date">读数日期</Label>
                <Input
                  id="edit-reading_date"
                  type="date"
                  {...editForm.register('reading_date')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>房间</Label>
              <Input
                value={
                  selectedUtility
                    ? selectedUtility.room
                      ? `${selectedUtility.room.apartment?.name || ''} - ${selectedUtility.room.room_number}`
                      : ''
                    : ''
                }
                disabled
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-water_reading">
                  <span className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    水表读数 (m³)
                  </span>
                </Label>
                <Input
                  id="edit-water_reading"
                  type="number"
                  step="0.01"
                  {...editForm.register('water_reading', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-electricity_reading">
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    电表读数 (kWh)
                  </span>
                </Label>
                <Input
                  id="edit-electricity_reading"
                  type="number"
                  step="0.01"
                  {...editForm.register('electricity_reading', { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">备注</Label>
              <Input id="edit-notes" {...editForm.register('notes')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Batch Import Dialog */}
      <Dialog open={isBatchImportOpen} onOpenChange={setIsBatchImportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>批量导入水电读数</DialogTitle>
            <DialogDescription>
              上传 Excel 文件批量导入水电读数，记录时间默认为当前时间
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  支持的格式: .xlsx, .xls
                </p>
                <p className="text-xs text-muted-foreground">
                  Excel 模板列: 公寓名称 | 房间号 | 水表读数(m³) | 电表读数(kWh) | 备注
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                disabled={batchImportMutation.isPending}
              />
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => fileInputRef.current?.click()}
                disabled={batchImportMutation.isPending}
              >
                <Upload className="mr-2 h-4 w-4" />
                {batchImportMutation.isPending ? '导入中...' : '选择文件'}
              </Button>
            </div>
            <div className="flex justify-center">
              <Button variant="link" onClick={downloadTemplate} className="text-sm">
                <Download className="mr-2 h-4 w-4" />
                下载 Excel 模板
              </Button>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• 房间号为必填项，需与系统中的房间号完全匹配</p>
              <p>• 水表读数、电表读数和备注为选填</p>
              <p>• 导入时间默认为当前年月和今天日期</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsBatchImportOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
