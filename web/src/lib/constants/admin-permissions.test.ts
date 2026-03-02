import { describe, it, expect } from 'vitest'
import {
  adminPermissionCodesToLabels,
  formatAdminPermissionsForDisplay,
  getAdminPermissionGroups,
  ADMIN_PERMISSION_OPTIONS,
} from './admin-permissions'

describe('admin-permissions', () => {
  describe('adminPermissionCodesToLabels', () => {
    it('returns empty array for empty or missing codes', () => {
      expect(adminPermissionCodesToLabels([])).toEqual([])
      expect(adminPermissionCodesToLabels(undefined as unknown as string[])).toEqual([])
    })

    it('returns ["全部权限"] when codes includes *', () => {
      expect(adminPermissionCodesToLabels(['*'])).toEqual(['全部权限'])
      expect(adminPermissionCodesToLabels(['admin:user:read', '*'])).toEqual(['全部权限'])
    })

    it('returns group · label for known codes', () => {
      expect(adminPermissionCodesToLabels(['admin:user:read'])).toContain('用户管理 · 查看')
      expect(adminPermissionCodesToLabels(['admin:org:write'])).toContain('组织管理 · 编辑')
    })

    it('appends "其他" when unknown code is present', () => {
      const result = adminPermissionCodesToLabels(['admin:user:read', 'unknown:code'])
      expect(result).toContain('用户管理 · 查看')
      expect(result).toContain('其他')
      expect(result).toHaveLength(2)
    })
  })

  describe('formatAdminPermissionsForDisplay', () => {
    it('returns "—" when no labels', () => {
      expect(formatAdminPermissionsForDisplay([])).toBe('—')
    })

    it('joins with "、" when 5 or fewer labels', () => {
      expect(formatAdminPermissionsForDisplay(['admin:user:read', 'admin:user:write'])).toBe(
        '用户管理 · 查看、用户管理 · 编辑'
      )
    })

    it('returns "前3项 等 N 项" when more than 5', () => {
      const codes = [
        'admin:user:read',
        'admin:user:write',
        'admin:org:read',
        'admin:org:write',
        'admin:plan:read',
        'admin:plan:write',
      ]
      const result = formatAdminPermissionsForDisplay(codes)
      expect(result).toMatch(/ 等 6 项$/)
      const parts = result.split(' 等 ')
      expect(parts[0].split('、')).toHaveLength(3)
    })
  })

  describe('getAdminPermissionGroups', () => {
    it('returns Map with group as key and options array as value', () => {
      const map = getAdminPermissionGroups()
      expect(map.get('全部')).toEqual([ADMIN_PERMISSION_OPTIONS[0]])
      expect(map.get('用户管理')).toHaveLength(2)
      expect(map.get('组织管理')).toHaveLength(2)
    })

    it('has all ADMIN_PERMISSION_OPTIONS distributed in groups', () => {
      const map = getAdminPermissionGroups()
      const total = Array.from(map.values()).reduce((sum, list) => sum + list.length, 0)
      expect(total).toBe(ADMIN_PERMISSION_OPTIONS.length)
    })
  })
})
