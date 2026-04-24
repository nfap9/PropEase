import { useRef, useState } from 'react';
import { Button, Modal, Select, Input } from 'antd';
import { Label } from '@/components/common/label';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Apartment, Room } from '@/types';
import { parseUtilityExcelFile, matchUtilityRecords } from '@/utils/excel';

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

  const handleDialogOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setCurrentStep(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
      const records = await parseUtilityExcelFile(file);

      if (records.length === 0) {
        toast.error('Excel 文件中没有有效数据');
        return;
      }

      if (!allRooms?.length) {
        toast.error('房间数据加载中，请稍后重试');
        return;
      }

      const { matched, unmatched } = matchUtilityRecords(records, allRooms, apartments ?? []);

      if (unmatched.length > 0) {
        toast.warning(`以下房间未找到匹配: ${unmatched.join(', ')}`);
      }

      if (matched.length === 0) {
        toast.error('没有匹配到任何房间');
        return;
      }

      onImport({
        period_year: importYear,
        period_month: importMonth,
        reading_date: today.toISOString().split('T')[0],
        readings: matched,
      });
    } catch (err) {
      const msg = String(err);
      const hint = msg.includes('解析失败') ? '请确认文件为 .xlsx 格式（若使用 Numbers，需先导出为 Excel）' : undefined;
      toast.error(hint ?? '导入失败，请重试');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => handleDialogOpenChange(false)}
      title="批量导入水电读数"
      footer={null}
      data-testid="utilities-batch-import-dialog"
    >
      <div className="space-y-6">
        <p className="text-gray-500">按步骤选择导入月份并上传已填写的 Excel 模板。</p>
        {currentStep === 0 ? (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">导入月份</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>年份</Label>
                <Select
                  value={importYear.toString()}
                  onChange={(v) => setImportYear(Number(v))}
                  style={{ width: 120 }}
                  options={[currentYear - 1, currentYear, currentYear + 1].map((year) => ({
                    value: year.toString(),
                    label: `${year}年`,
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>月份</Label>
                <Select
                  value={importMonth.toString()}
                  onChange={(v) => setImportMonth(Number(v))}
                  style={{ width: 120 }}
                  options={Array.from({ length: 12 }, (_, i) => i + 1).map((month) => ({
                    value: month.toString(),
                    label: `${month}月`,
                  }))}
                />
              </div>
            </div>
          </div>
        ) : null}

        {currentStep === 1 ? (
          <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center">
            <FileSpreadsheet className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <div className="space-y-2">
              <p className="text-sm text-gray-400">支持的格式: .xlsx, .xls</p>
              <p className="text-xs text-gray-400">填写导出的模板后上传</p>
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
              variant="outlined"
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
          <div className="space-y-1 text-xs text-gray-400">
            <p>• 使用「导出模版」获取待录入房间列表，填写「当前水表」和「当前电表」列后上传</p>
            <p>• 导入将写入所选的导入月份，记录日期为今天</p>
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {batchImportSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-1 text-sm ${
                  index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    index <= currentStep ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
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
              <Button onClick={() => setCurrentStep(0)}>
                上一步
              </Button>
            )}
            {currentStep < batchImportSteps.length - 1 && (
              <Button type="primary" onClick={() => setCurrentStep(1)}>下一步</Button>
            )}
            {currentStep === batchImportSteps.length - 1 && (
              <Button disabled>上传后自动导入</Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
