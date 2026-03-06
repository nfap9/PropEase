import type { User } from './auth.js';

/** 成员角色 */
export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';

/** 组织 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, unknown>;
  is_personal: boolean;
  created_at: string;
  /** 列表接口返回：当前用户在该组织中的角色 */
  role?: MemberRole;
}

/** 迁移统计 */
export interface MigrationStats {
  apartments: number;
  rooms: number;
  tenants: number;
  leases: number;
  bills: number;
  utility_readings: number;
  message: string;
}

/** 删除预览 */
export interface DeletionPreview {
  can_delete: boolean;
  blockers: string[];
  stats: {
    apartments: number;
    rooms: number;
    tenants: number;
    active_leases: number;
    pending_bills: number;
    members: number;
  };
  org_name: string;
  is_personal: boolean;
}

/** 组织成员 */
export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: MemberRole;
  user?: User;
  user_phone: string;
  user_full_name: string;
  joined_at: string;
  created_at: string;
}

/** 组织用量 */
export interface OrganizationUsage {
  plan: string;
  apartments_used: number;
  rooms_used: number;
  members_used: number;
  max_apartments: number;
  max_rooms: number;
  max_members: number;
  apartments_remaining: number;
  rooms_remaining: number;
  members_remaining: number;
  can_invite_members: boolean;
  can_create_team: boolean;
}
