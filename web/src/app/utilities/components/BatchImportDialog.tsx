'use client';

import { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Room } from '@/types';

interface BatchImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (readings: { room_id: number; water_reading: number | null; electricity_reading: number | null; notes: string | null }[]) => void;
  isPending: boolean;
  allRooms: Room[] | undefined;
}

export function BatchImportDialog({
  open,
  onOpenChange,
  onImport,
  isPending,
  allRooms,
}: BatchImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

          const records = jsonData.slice(1)
            .filter((row) => row[1])
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '导入失败');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              disabled={isPending}
            />
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isPending ? '导入中...' : '选择文件'}
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
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
