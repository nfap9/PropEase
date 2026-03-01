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
