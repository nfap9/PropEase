// User types
export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Organization types
export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Organization {
  id: number;
  name: string;
  slug: string;
  plan: string;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface OrganizationMember {
  id: number;
  organization_id: number;
  user_id: number;
  role: MemberRole;
  user?: User;
  user_email: string;
  user_full_name: string;
  joined_at: string;
  created_at: string;
}

// Apartment & Room types
export type RoomStatus = 'available' | 'occupied' | 'maintenance';

export interface Apartment {
  id: number;
  organization_id: number;
  name: string;
  address: string | null;
  description: string | null;
  created_at: string;
}

export interface Room {
  id: number;
  apartment_id: number;
  room_number: string;
  status: RoomStatus;
  monthly_rent: number;
  area: number | null;
  notes: string | null;
  apartment?: Apartment;
  created_at: string;
}

// Tenant types
export interface Tenant {
  id: number;
  organization_id: number;
  name: string;
  phone: string | null;
  id_card: string | null;
  email: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  notes: string | null;
  created_at: string;
}

// Lease types
export interface Lease {
  id: number;
  room_id: number;
  tenant_id: number;
  start_date: string;
  end_date: string | null;
  monthly_rent: number;
  deposit: number;
  water_rate: number;
  electricity_rate: number;
  is_active: boolean;
  notes: string | null;
  room?: Room;
  tenant?: Tenant;
  created_at: string;
}

// Utility types
export interface UtilityReading {
  id: number;
  room_id: number;
  period_year: number;
  period_month: number;
  reading_date: string;
  water_reading: number | null;
  electricity_reading: number | null;
  water_previous: number | null;
  electricity_previous: number | null;
  notes: string | null;
  created_at: string;
}

// Bill types
export type BillStatus = 'pending' | 'partial' | 'paid' | 'overdue';
export type PaymentMethod = 'cash' | 'wechat' | 'alipay' | 'bank_transfer' | 'other';

export interface Bill {
  id: number;
  lease_id: number;
  bill_year: number;
  bill_month: number;
  due_date: string;
  rent_amount: number;
  water_amount: number;
  electricity_amount: number;
  other_amount: number;
  total_amount: number;
  paid_amount: number;
  status: BillStatus;
  notes: string | null;
  lease?: Lease;
  created_at: string;
}

export interface Payment {
  id: number;
  bill_id: number;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  created_at: string;
}

// Report types
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
}

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

export interface OccupancyReport {
  period: string;
  total_rooms: number;
  occupied_rooms: number;
  vacant_rooms: number;
  occupancy_rate: number;
}

// API Response types
export interface ApiError {
  detail: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
