
import { useRef, useState } from 'react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import { AppDialog } from '@apartment-ultra/shared-ui/components/composed';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Apartment, Room } from '@/types';
import { getErrorMessage } from '@/utils/error';

const batchImportSteps = [
  {
    id: 'period',
    title: '导入周期',
    description: '先确认本次导入要写入的年月。',
  },
  {
    id: 'upload',
    title: '上传模板',
    description: '上传已填写的 Excel 模板并执行导入。',
  },
] as const;

export interface BatchImportPayload {
  period_year: number;
  period_month: number;
  reading_date: string;
  readings: {
    room_id: string;
    water_reading?: number;
    electricity_reading?: number;
    notes?: string;
  }[];
}

interface BatchImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (payload: BatchImportPayload) => void;
  isPending: boolean;
  allRooms: Room[] | undefined;
  apartments: Apartment[] | undefined;
}

export function BatchImportDialog({
  open,
  onOpenChange,
  onImport,
  isPending,
  allRooms,
  apartments,
}: BatchImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [importYear, setImportYear] = useState(currentYear);
  const [importMonth, setImportMonth] = useState(currentMonth);
  const [currentStep, setCurrentStep] = useState(0);

  const apartmentMap = new Map(apartments?.map((a) => [a.id, a.name]) ?? []);
  const roomMatchKey = (room: Room) => `${apartmentMap.get(room.apartment_id) ?? ''}|${room.room_number}`;

  const handleDialogOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setCurrentStep(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const parseExcelFile = async (
    file: File
  ): Promise<
    {
      apartment_name: string;
      room_number: string;
      water_reading: number | null;
      electricity_reading: number | null;
      notes: string | null;
    }[]
  > => {
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });

    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) throw new Error('Excel 文件解析失败');

    const jsonData: unknown[][] = [];
    worksheet.eachRow((row) => {
      const rowValues: unknown[] = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        rowValues[colNumber - 1] = cell.value ?? '';
      });
      jsonData.push(rowValues);
    });

    const toNum = (v: unknown) => (v !== undefined && v !== '' && v !== null ? Number(v) : null);
    const toStr = (v: unknown) => (v !== undefined && v !== '' && v !== null ? String(v) : null);
    const toApartment = (v: unknown) => String(v ?? '').trim();
    const toRoom = (v: unknown) => String(v ?? '').trim();

    const records = jsonData
      .slice(1)
      .filter((row) => row[1])
      .map((row) => {
        const apartmentName = toApartment(row[0]);
        const roomNumber = toRoom(row[1]);
        if (row.length >= 8) {
          return {
            apartment_name: apartmentName,
            room_number: roomNumber,
            water_reading: toNum(row[5]),
            electricity_reading: toNum(row[7]),
            notes: toStr(row[8]),
          };
        }
        if (row.length >= 7) {
          return {
            apartment_name: apartmentName,
            room_number: roomNumber,
            water_reading: toNum(row[4]),
            electricity_reading: toNum(row[5]),
            notes: toStr(row[6]),
          };
        }
        return {
          apartment_name: apartmentName,
          room_number: roomNumber,
          water_reading: toNum(row[2]),
          electricity_reading: toNum(row[3]),
          notes: toStr(row[4]),
        };
      });

    return records;
  };

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (ext === '.numbers') {
      toast.error(
        '请上传 .xlsx 格式的 Excel 文件，不支持 Apple Numbers (.numbers) 格式。请在 Numbers 中通过「文件 → 导出为 → Excel」另存为 .xlsx 后上传'
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (ext !== '.xlsx' && ext !== '.xls') {
      toast.error('请上传 .xlsx 或 .xls 格式的 Excel 文件');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const records = await parseExcelFile(file);

      if (records.length === 0) {
        toast.error('Excel 文件中没有有效数据');
        return;
      }

      const roomMap = new Map<string, Room>();
      allRooms?.forEach((room) => {
        roomMap.set(roomMatchKey(room), room);
      });

      const matchedRecords: {
        room_id: string;
        water_reading?: number;
        electricity_reading?: number;
        notes?: string;
      }[] = [];
      const unmatchedKeys: string[] = [];

      for (const record of records) {
        const key = `${record.apartment_name}|${record.room_number}`;
        const room = roomMap.get(key);
        if (room) {
          const water =
            record.water_reading != null && !Number.isNaN(record.water_reading) ? record.water_reading : undefined;
          const electricity =
            record.electricity_reading != null && !Number.isNaN(record.electricity_reading)
              ? record.electricity_reading
              : undefined;
          const notes = record.notes != null && record.notes !== '' ? record.notes : undefined;
          matchedRecords.push({
            room_id: room.id,
            ...(water !== undefined && { water_reading: water }),
            ...(electricity !== undefined && { electricity_reading: electricity }),
            ...(notes !== undefined && { notes }),
          });
        } else {
          unmatchedKeys.push(`${record.apartment_name}-${record.room_number}`);
        }
      }

      if (unmatchedKeys.length > 0) {
        toast.warning(`以下房间未找到匹配: ${unmatchedKeys.join(', ')}`);
      }

      if (matchedRecords.length === 0) {
        toast.error('没有匹配到任何房间');
        return;
      }

      onImport({
        period_year: importYear,
        period_month: importMonth,
        reading_date: today.toISOString().split('T')[0],
        readings: matchedRecords,
      });
    } catch (err) {
      const msg = String(err);
      const hint = msg.includes('解析失败') ? '请确认文件为 .xlsx 格式（若使用 Numbers，需先导出为 Excel）' : undefined;
      toast.error(hint ?? getErrorMessage(err, '导入失败，请重试'));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={handleDialogOpenChange}
      title="批量导入水电读数"
      description="按步骤选择导入月份并上传已填写的 Excel 模板。"
      size="md"
      contentTestId="utilities-batch-import-dialog"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {batchImportSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-1 text-sm ${
                  index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                >
                  {index + 1}
                </div>
                <span>{step.title}</span>
                {index < batchImportSteps.length - 1 && <span className="mx-1">/</span>}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={() => setCurrentStep(0)}>
                上一步
              </Button>
            )}
            {currentStep < batchImportSteps.length - 1 && (
              <Button onClick={() => setCurrentStep(1)}>下一步</Button>
            )}
            {currentStep === batchImportSteps.length - 1 && (
              <Button disabled>上传后自动导入</Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {currentStep === 0 ? (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">导入月份</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>年份</Label>
                <Select value={importYear.toString()} onValueChange={(v) => setImportYear(Number(v))}>
                  <SelectTrigger className="min-w-[120px]">
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
                <Label>月份</Label>
                <Select value={importMonth.toString()} onValueChange={(v) => setImportMonth(Number(v))}>
                  <SelectTrigger className="min-w-[120px]">
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
            </div>
          </div>
        ) : null}

        {currentStep === 1 ? (
          <div className="rounded-lg border border-dashed border-muted p-6 text-center">
            <FileSpreadsheet className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">支持的格式: .xlsx, .xls</p>
              <p className="text-xs text-muted-foreground">填写导出的模板后上传</p>
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
        ) : null}

        {currentStep === 1 ? (
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>• 使用「导出模版」获取待录入房间列表，填写「当前水表」和「当前电表」列后上传</p>
            <p>• 导入将写入所选的导入月份，记录日期为今天</p>
          </div>
        ) : null}
      </div>
    </AppDialog>
  );
}
