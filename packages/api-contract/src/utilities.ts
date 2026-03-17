import type { Room } from './apartments.js';

/** 水电读数 */
export interface UtilityReading {
  id: string;
  room_id: string;
  period_year: number;
  period_month: number;
  reading_date: string;
  water_reading: number | null;
  electricity_reading: number | null;
  water_previous: number | null;
  electricity_previous: number | null;
  notes: string | null;
  room?: Room;
  created_at: string;
}

export interface UtilityReadingCreate {
  room_id: string;
  period_year: number;
  period_month: number;
  reading_date: string;
  water_reading?: number;
  electricity_reading?: number;
  water_previous?: number;
  electricity_previous?: number;
  notes?: string;
  reading_context?: 'normal' | 'initial' | 'meter_reset';
  anomaly_reason?: string;
}

export interface UtilityReadingUpdate {
  room_id?: string;
  period_year?: number;
  period_month?: number;
  reading_date?: string;
  water_reading?: number;
  electricity_reading?: number;
  water_previous?: number;
  electricity_previous?: number;
  notes?: string;
  reading_context?: 'normal' | 'initial' | 'meter_reset';
  anomaly_reason?: string;
}

export interface UtilityListParams {
  apartment_id?: string;
  room_id?: string;
  period_year?: number;
  period_month?: number;
}

export interface BatchUtilityReadingItem {
  room_id: string;
  water_reading?: number | null;
  electricity_reading?: number | null;
  notes?: string | null;
}

export interface BatchUtilityReadingData {
  period_year: number;
  period_month: number;
  reading_date: string;
  readings: BatchUtilityReadingItem[];
}

export interface RoomMissingInitialReading {
  room_id: string;
  apartment_name: string;
  room_number: string;
  tenant_name: string;
  lease_start_date: string;
}

export interface UtilityExportRoom {
  room_id: string;
  apartment_id: string;
  apartment_name: string;
  room_number: string;
  tenant_name: string;
  tenant_phone: string;
  billing_day: number;
  water_previous: number | null;
  electricity_previous: number | null;
  water_unit_price: number | null;
  electricity_unit_price: number | null;
}
