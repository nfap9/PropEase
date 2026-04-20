
import { useState } from 'react';
import { Modal, Button, Input, Select } from 'antd';
import { Label } from '@/components/common/label';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { utilitiesApi, UtilityExportRoom } from '@/api/utilities';
import { getErrorMessage } from '@/utils/error';
import { useAuth } from '@/contexts/auth';

interface ExportTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportTemplateDialog({ open, onOpenChange }: ExportTemplateDialogProps) {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [exportYear, setExportYear] = useState(currentYear);
  const [exportMonth, setExportMonth] = useState(currentMonth);
  const [daysRange, setDaysRange] = useState<number>(0);
  const [isExporting, setIsExporting] = useState(false);

  const createWorkbook = async () => {
    const ExcelJS = (await import('exceljs')).default;
    return new ExcelJS.Workbook();
  };

  const getDateRangeDescription = () => {
    if (daysRange <= 0) return '';
    const currentDay = today.getDate();
    const daysInMonth = new Date(exportYear, exportMonth, 0).getDate();
    const endDay = currentDay + daysRange - 1;
    if (endDay <= daysInMonth) {
      return `(${currentDay}日 - ${endDay}日)`;
    }
    return `(${currentDay}日 - ${endDay - daysInMonth}日)`;
  };

  const handleExport = async () => {
    if (!orgId) return;

    setIsExporting(true);
    try {
      const range = daysRange > 0 ? daysRange : undefined;
      const rooms = await utilitiesApi.exportRooms(exportYear, exportMonth, range);

      if (rooms.length === 0) {
        toast.warning('没有待录入的房间');
        return;
      }

      const header = ['公寓名称', '房间号', '租客姓名', '账单日', '当前水表(m³)', '当前电表(kWh)', '备注'];
      const data = rooms.map((room: UtilityExportRoom) => [
        room.apartment_name,
        room.room_number,
        room.tenant_name,
        room.billing_day,
        '',
        '',
        '',
      ]);

      const wb = await createWorkbook();
      const ws = wb.addWorksheet('水电读数导入', {
        views: [{ state: 'frozen', ySplit: 1 }],
      });
      ws.columns = [
        { width: 12 },
        { width: 10 },
        { width: 10 },
        { width: 8 },
        { width: 14 },
        { width: 14 },
        { width: 20 },
      ];
      ws.addRows([header, ...data]);

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `水电读数模板_${exportYear}年${exportMonth}月.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(`已导出 ${rooms.length} 个待录入房间`);
      onOpenChange(false);
    } catch (err) {
      toast.error(getErrorMessage(err, '导出失败，请重试'));
    } finally {
      setIsExporting(false);
    }
  };

  const downloadBlankTemplate = async () => {
    const templateData = [
      ['公寓名称', '房间号', '租客姓名', '账单日', '当前水表(m³)', '当前电表(kWh)', '备注'],
      ['示例公寓', '101', '张三', '15', '', '', ''],
      ['示例公寓', '102', '李四', '20', '', '', ''],
    ];
    const wb = await createWorkbook();
    const ws = wb.addWorksheet('水电读数导入');
    ws.addRows(templateData);
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '水电读数空白模板.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('已下载空白模板');
  };

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="导出待录入模板"
      footer={[
        <Button key="cancel" onClick={() => onOpenChange(false)}>
          取消
        </Button>,
        <Button key="export" type="primary" onClick={handleExport} loading={isExporting} icon={<Download className="h-4 w-4" />}>
          {isExporting ? '导出中...' : '导出模板'}
        </Button>,
      ]}
    >
      <div className="mb-4 text-sm text-gray-600">
        导出近期需要录入水电读数的房间列表，填写「当前水表」「当前电表」后使用批量导入
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>年份</Label>
            <Select value={exportYear.toString()} onChange={(v) => setExportYear(Number(v))} className="w-full">
              {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                <Select.Option key={year} value={year.toString()}>
                  {year}年
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>月份</Label>
            <Select value={exportMonth.toString()} onChange={(v) => setExportMonth(Number(v))} className="w-full">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <Select.Option key={month} value={month.toString()}>
                  {month}月
                </Select.Option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>导出范围（天）</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={60}
              value={daysRange === 0 ? '' : daysRange}
              placeholder="0=全部"
              onChange={(e) => {
                const v = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                setDaysRange(Number.isNaN(v) ? 0 : Math.min(60, Math.max(0, v)));
              }}
              className="w-24"
            />
            <span className="text-sm text-gray-500">
              {daysRange <= 0 ? '全部待录入房间' : `近期 ${daysRange} 天内应出账${getDateRangeDescription()}`}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button type="link" onClick={downloadBlankTemplate} className="text-sm p-0">
            下载空白模板
          </Button>
        </div>
      </div>
    </Modal>
  );
}
