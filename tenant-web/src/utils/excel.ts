/**
 * Excel 工具函数
 */
import type { Apartment, Room } from '@/types';

export async function createWorkbook() {
  const ExcelJS = (await import('exceljs')).default;
  return new ExcelJS.Workbook();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export interface ParsedUtilityRecord {
  apartment_name: string;
  room_number: string;
  water_reading: number | null;
  electricity_reading: number | null;
  notes: string | null;
}

export async function parseUtilityExcelFile(file: File): Promise<ParsedUtilityRecord[]> {
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
}

export interface MatchedUtilityRecord {
  room_id: string;
  water_reading?: number;
  electricity_reading?: number;
  notes?: string;
}

export function matchUtilityRecords(
  records: ParsedUtilityRecord[],
  rooms: Room[],
  apartments: Apartment[]
): { matched: MatchedUtilityRecord[]; unmatched: string[] } {
  const apartmentMap = new Map(apartments.map((a) => [a.id, a.name]));
  const roomMap = new Map<string, Room>();

  rooms.forEach((room) => {
    const aptName = apartmentMap.get(room.apartment_id) ?? '';
    const key = `${aptName}|${room.room_number}`;
    roomMap.set(key, room);
  });

  const matched: MatchedUtilityRecord[] = [];
  const unmatched: string[] = [];

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
      matched.push({
        room_id: room.id,
        ...(water !== undefined && { water_reading: water }),
        ...(electricity !== undefined && { electricity_reading: electricity }),
        ...(notes !== undefined && { notes }),
      });
    } else {
      unmatched.push(`${record.apartment_name}-${record.room_number}`);
    }
  }

  return { matched, unmatched };
}
