// User types
export interface User {
  id: string;  // ULID
  phone: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

// Auth types
export interface LoginCredentials {
  phone: string;
  password?: string;
  verification_code?: string;
}

export interface RegisterData {
  phone: string;
  password: string;
  full_name: string;
  verification_code: string;
}

export interface SendSmsCodeData {
  phone: string;
  purpose: 'login' | 'register';
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Organization types
export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Organization {
  id: string;  // ULID
  name: string;
  slug: string;
  plan: string;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface OrganizationMember {
  id: string;  // ULID
  organization_id: string;  // ULID
  user_id: string;  // ULID
  role: MemberRole;
  user?: User;
  user_phone: string;
  user_full_name: string;
  joined_at: string;
  created_at: string;
}

// Apartment & Room types
export type RoomStatus = 'available' | 'occupied' | 'maintenance';

export interface Apartment {
  id: string;  // ULID
  organization_id: string;  // ULID
  name: string;
  address: string | null;
  description: string | null;
  created_at: string;
}

export interface RoomStats {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
}

export interface ApartmentWithStats extends Apartment {
  room_stats: RoomStats;
}

export interface Room {
  id: string;  // ULID
  apartment_id: string;  // ULID
  room_number: string;
  layout: string | null;  // 户型
  status: RoomStatus;
  monthly_rent: number;
  area: number | null;
  notes: string | null;
  apartment?: Apartment;
  created_at: string;
}

// 批量创建房间
export interface RoomBatchCreate {
  room_numbers: string[];
  layout?: string;  // 户型
  monthly_rent: number;
  area?: number;
  notes?: string;
}

// Tenant types
export interface Tenant {
  id: string;  // ULID
  organization_id: string;  // ULID
  name: string;
  phone: string | null;
  id_card: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  notes: string | null;
  created_at: string;
}

// Lease types
export interface Lease {
  id: string;  // ULID
  room_id: string;  // ULID
  tenant_id: string;  // ULID
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
  id: string;  // ULID
  room_id: string;  // ULID
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

// Bill types
export type BillStatus = 'pending' | 'partial' | 'paid' | 'overdue';
export type PaymentMethod = 'cash' | 'wechat' | 'alipay' | 'bank_transfer' | 'other';

export interface Bill {
  id: string;  // ULID
  lease_id: string;  // ULID
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
  id: string;  // ULID
  bill_id: string;  // ULID
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

// Permission types
export type Resource =
  | 'apartment'
  | 'room'
  | 'tenant'
  | 'lease'
  | 'bill'
  | 'utility'
  | 'member'
  | 'settings'
  | 'report';

export type Action = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'manage';

export interface Permission {
  id: string;  // ULID
  resource: Resource;
  action: Action;
  code: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface RolePermissions {
  role: MemberRole;
  permissions: Permission[];
}

export interface UpdateRolePermissionsRequest {
  permission_codes: string[];
}

export interface UserPermissionsResponse {
  permissions: string[];
  system_roles: SystemRole[];
  is_super_admin: boolean;
}

export type SystemRole =
  | 'super_admin'
  | 'support'
  | 'operations'
  | 'finance'
  | 'readonly';

export interface SystemRoleConfig {
  role: SystemRole;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}
