'use client';

import { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Room } from '@/types';
import { utilitiesApi, UtilityExportRoom } from '@/lib/api/utilities';
import { useAuth } from '@/lib/auth/context';

interface BatchImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (readings: { room_id: number; water_reading: number | null; electricity_reading: number | null; notes: string | null }[]) => void;
  isPending: boolean;
  allRooms: Room[] | undefined;
}

const DAYS_RANGE_OPTIONS = [
  { value: '0', label: '全部待录入房间' },
  { value: '5', label: '5天内应出账' },
  { value: '10', label: '10天内应出账' },
  { value: '15', label: '15天内应出账' },
  { value: '30', label: '30天内应出账' },
];

export function BatchImportDialog({
  open,
  onOpenChange,
  onImport,
  isPending,
  allRooms,
}: BatchImportDialogProps) {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [daysRange, setDaysRange] = useState('0');
  const [isExporting, setIsExporting] = useState(false);

  const today = new Date();
  const currentYear = today.getFullYear();

  // 计算日期范围描述
  const getDateRangeDescription = () => {
    if (daysRange === '0') return '';
    const range = parseInt(daysRange);
    const currentDay = today.getDate();
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const endDay = currentDay + range - 1;

    if (endDay <= daysInMonth) {
      return `(${currentDay}日 - ${endDay}日)`;
    } else {
      return `(${currentDay}日 - ${(endDay - daysInMonth)}日)`;
    }
  };

  // 导出待录入房间的 Excel
  const handleExport = async () => {
    if (!orgId) return;

    setIsExporting(true);
    try {
      const range = daysRange === '0' ? undefined : parseInt(daysRange);
      const rooms = await utilitiesApi.exportRooms(orgId, selectedYear, selectedMonth, range);

      if (rooms.length === 0) {
        toast.warning('没有待录入的房间');
        return;
      }

      // 构建 Excel 数据
      const header = ['公寓名称', '房间号', '租客姓名', '账单日', '上期水表(m³)', '当前水表(m³)', '上期电表(kWh)', '当前电表(kWh)', '备注'];
      const data = rooms.map((room: UtilityExportRoom) => [
        room.apartment_name,
        room.room_number,
        room.tenant_name,
        room.billing_day,
        room.water_previous ?? '',
        '', // 当前水表 - 待填
        room.electricity_previous ?? '',
        '', // 当前电表 - 待填
        '', // 备注 - 待填
      ]);

      const ws = XLSX.utils.aoa_to_sheet([header, ...data]);

      // 设置列宽
      ws['!cols'] = [
        { wch: 12 }, // 公寓名称
        { wch: 10 }, // 房间号
        { wch: 10 }, // 租客姓名
        { wch: 8 },  // 账单日
        { wch: 14 }, // 上期水表
        { wch: 14 }, // 当前水表
        { wch: 14 }, // 上期电表
        { wch: 14 }, // 当前电表
        { wch: 20 }, // 备注
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '水电读数导入');
      const fileName = `水电读数模板_${selectedYear}年${selectedMonth}月.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success(`已导出 ${rooms.length} 个待录入房间`);
    } catch {
      toast.error('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  // 下载空白模板
  const downloadBlankTemplate = () => {
    const templateData = [
      ['公寓名称', '房间号', '租客姓名', '账单日', '上期水表(m³)', '当前水表(m³)', '上期电表(kWh)', '当前电表(kWh)', '备注'],
      ['示例公寓', '101', '张三', '15', '100.00', '', '500.00', '', ''],
      ['示例公寓', '102', '李四', '20', '200.00', '', '600.00', '', ''],
    ];
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '水电读数导入');
    XLSX.writeFile(wb, '水电读数空白模板.xlsx');
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

          // 新格式: 公寓名称, 房间号, 租客姓名, 账单日, 上期水表, 当前水表, 上期电表, 当前电表, 备注
          // 旧格式: 公寓名称, 房间号, 水表读数, 电表读数, 备注
          const records = jsonData.slice(1)
            .filter((row) => row[1]) // 房间号必填
            .map((row) => {
              // 检测是新格式还是旧格式
              // 新格式: 当前水表在第5列(索引5)，当前电表在第7列(索引7)，备注在第8列(索引8)
              // 旧格式: 水表读数在第2列(索引2)，电表读数在第3列(索引3)，备注在第4列(索引4)
              const isNewFormat = row.length >= 8;

              if (isNewFormat) {
                return {
                  room_number: String(row[1] || '').trim(),
                  water_reading: row[5] !== undefined && row[5] !== '' && row[5] !== null ? Number(row[5]) : null,
                  electricity_reading: row[7] !== undefined && row[7] !== '' && row[7] !== null ? Number(row[7]) : null,
                  notes: row[8] !== undefined && row[8] !== '' && row[8] !== null ? String(row[8]) : null,
                };
              } else {
                return {
                  room_number: String(row[1] || '').trim(),
                  water_reading: row[2] !== undefined && row[2] !== '' && row[2] !== null ? Number(row[2]) : null,
                  electricity_reading: row[3] !== undefined && row[3] !== '' && row[3] !== null ? Number(row[3]) : null,
                  notes: row[4] !== undefined && row[4] !== '' && row[4] !== null ? String(row[4]) : null,
                };
              }
            });

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

      onImport(matchedRecords);
    } catch {
      toast.error('导入失败');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>批量导入水电读数</DialogTitle>
          <DialogDescription>
            导出待录入房间模板，填写后上传完成批量录入
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 导出区域 */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm">导出待录入模板</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>年份</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                    <option key={year} value={year}>{year}年</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>月份</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>{month}月</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>导出范围</Label>
              <RadioGroup value={daysRange} onValueChange={setDaysRange} className="grid grid-cols-2 gap-2">
                {DAYS_RANGE_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`range-${option.value}`} />
                    <Label htmlFor={`range-${option.value}`} className="text-sm font-normal cursor-pointer">
                      {option.label} {option.value !== '0' && daysRange === option.value && getDateRangeDescription()}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Button
              className="w-full"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isExporting ? '导出中...' : '导出 Excel 模板'}
            </Button>
          </div>

          {/* 分隔线 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">上传已填写的文件</span>
            </div>
          </div>

          {/* 上传区域 */}
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                支持的格式: .xlsx, .xls
              </p>
              <p className="text-xs text-muted-foreground">
                填写导出的模板后上传
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isPending}
            />
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isPending ? '导入中...' : '选择文件上传'}
            </Button>
          </div>

          {/* 提示信息 */}
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• 填写「当前水表」和「当前电表」列</p>
              <p>• 导入时间默认为当前年月和今天日期</p>
            </div>
            <Button variant="link" onClick={downloadBlankTemplate} className="text-xs shrink-0">
              下载空白模板
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
