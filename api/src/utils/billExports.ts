import ExcelJS from 'exceljs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface BillExportRow {
  id: string;
  bill_year: number;
  bill_month: number;
  apartment_name: string;
  room_number: string;
  tenant_name: string;
  rent_amount: number;
  water_amount: number;
  electricity_amount: number;
  other_amount: number;
  total_amount: number;
  paid_amount: number;
  status: string;
}

export async function generateBillsExcel(
  billsData: BillExportRow[],
  organizationName: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('账单列表');

  sheet.mergeCells('A1:L1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = `${organizationName} - 账单列表`;
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 30;

  const headers = [
    '账单ID',
    '账单周期',
    '公寓',
    '房间',
    '租客',
    '租金',
    '水费',
    '电费',
    '其他',
    '合计',
    '已付',
    '状态',
  ];
  sheet.addRow([]);
  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  for (const bill of billsData) {
    const row = sheet.addRow([
      bill.id,
      `${bill.bill_year}-${String(bill.bill_month).padStart(2, '0')}`,
      bill.apartment_name,
      bill.room_number,
      bill.tenant_name,
      bill.rent_amount,
      bill.water_amount,
      bill.electricity_amount,
      bill.other_amount,
      bill.total_amount,
      bill.paid_amount,
      bill.status,
    ]);
    row.eachCell((cell, colNumber) => {
      if (colNumber >= 6 && colNumber <= 11) {
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: 'right' };
      }
    });
  }

  const buffer = (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
  return Buffer.from(buffer);
}

export interface BillPdfData {
  id: string;
  bill_year: number;
  bill_month: number;
  due_date: Date;
  status: string;
  apartment_name: string;
  room_number: string;
  tenant_name: string;
  rent_amount: number;
  water_amount: number;
  electricity_amount: number;
  other_amount: number;
  total_amount: number;
  paid_amount: number;
  notes?: string | null;
}

export async function generateBillPdf(
  billData: BillPdfData,
  organizationName: string
): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  let y = height - 50;

  const drawText = (text: string, size: number, x: number): void => {
    page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });
    y -= size + 4;
  };

  const title = `${organizationName} - 账单`;
  const titleWidth = font.widthOfTextAtSize(title, 18);
  page.drawText(title, { x: (width - titleWidth) / 2, y, size: 18, font, color: rgb(0, 0, 0) });
  y -= 30;

  drawText(`账单编号: #${billData.id}`, 10, 50);
  drawText(`账单周期: ${billData.bill_year}年${billData.bill_month}月`, 10, 50);
  drawText(`到期日期: ${billData.due_date.toISOString().slice(0, 10)}`, 10, 50);
  drawText(`账单状态: ${billData.status}`, 10, 50);
  y -= 10;

  drawText('房间信息', 12, 50);
  drawText(`公寓: ${billData.apartment_name}`, 10, 50);
  drawText(`房间: ${billData.room_number}`, 10, 50);
  drawText(`租客: ${billData.tenant_name}`, 10, 50);
  y -= 10;

  drawText('费用明细', 12, 50);
  drawText(`租金: ${billData.rent_amount.toFixed(2)}`, 10, 50);
  drawText(`水费: ${billData.water_amount.toFixed(2)}`, 10, 50);
  drawText(`电费: ${billData.electricity_amount.toFixed(2)}`, 10, 50);
  drawText(`其他费用: ${billData.other_amount.toFixed(2)}`, 10, 50);
  drawText(`合计: ${billData.total_amount.toFixed(2)}`, 10, 50);
  y -= 10;

  drawText(`已付金额: ${billData.paid_amount.toFixed(2)} 元`, 10, 50);
  drawText(`待付金额: ${(billData.total_amount - billData.paid_amount).toFixed(2)} 元`, 10, 50);

  if (billData.notes) {
    y -= 10;
    drawText('备注', 12, 50);
    drawText(billData.notes, 10, 50);
  }

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
