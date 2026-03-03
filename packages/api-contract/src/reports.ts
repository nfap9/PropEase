/** 仪表盘概览 */
export interface DashboardOverview {
  total_apartments: number;
  total_rooms: number;
  occupied_rooms: number;
  available_rooms: number;
  total_tenants: number;
  active_leases: number;
  occupancy_rate: number;
  monthly_revenue: number;
  pending_bills: number;
  overdue_bills: number;
  /** 未录入签约月初始水电读数的房间数 */
  rooms_missing_initial_readings?: number;
}

/** 收入报表 */
export interface IncomeReport {
  period: string;
  total_rent: number;
  total_water: number;
  total_electricity: number;
  total_other: number;
  total_amount: number;
  collected_amount: number;
  collection_rate: number;
}

/** 入住率报表 */
export interface OccupancyReport {
  period: string;
  total_rooms: number;
  occupied_rooms: number;
  vacant_rooms: number;
  occupancy_rate: number;
}
