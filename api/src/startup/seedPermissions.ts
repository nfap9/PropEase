import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';
import {
  RESOURCES,
  ACTIONS,
  getPermissionName,
  SYSTEM_ROLE_CONFIGS,
  DEFAULT_SYSTEM_ROLE_PERMISSIONS,
  type SystemRole,
} from '../constants/permissionDefaults.js';

export async function seedPermissions(): Promise<void> {
  // 删除已废弃的 manage 权限（Permission 删除会级联删除 SystemRolePermission）
  const deleted = await prisma.permission.deleteMany({ where: { action: 'manage' } });
  if (deleted.count > 0) {
    console.log('Removed deprecated manage permissions:', deleted.count);
  }

  // 从组织 settings.role_permissions 中移除 :manage 权限码
  const orgs = await prisma.organization.findMany({
    select: { id: true, settings: true },
  });
  for (const org of orgs) {
    if (org.settings == null) continue;
    const settings = org.settings as Record<string, unknown>;
    const rp = settings?.role_permissions as Record<string, string[] | undefined> | undefined;
    if (!rp || typeof rp !== 'object') continue;
    let changed = false;
    const cleaned: Record<string, string[]> = {};
    for (const [role, codes] of Object.entries(rp)) {
      if (Array.isArray(codes)) {
        const filtered = codes.filter((c) => typeof c === 'string' && !c.endsWith(':manage'));
        if (filtered.length !== codes.length) changed = true;
        cleaned[role] = filtered;
      } else {
        cleaned[role] = [];
      }
    }
    if (changed) {
      const newSettings = { ...settings, role_permissions: cleaned } as object;
      await prisma.organization.update({
        where: { id: org.id },
        data: { settings: newSettings },
      });
      console.log('Cleaned role_permissions of manage codes for org:', org.id);
    }
  }

  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      const code = `${resource}:${action}`;
      const existing = await prisma.permission.findUnique({ where: { code } });
      if (!existing) {
        const name = getPermissionName(resource, action);
        await prisma.permission.create({
          data: {
            id: ulid().toLowerCase(),
            resource,
            action,
            code,
            name,
          },
        });
        console.log('Created permission:', code);
      }
    }
  }

  for (const config of SYSTEM_ROLE_CONFIGS) {
    const existing = await prisma.systemRoleConfig.findUnique({
      where: { role: config.role },
    });
    if (!existing) {
      await prisma.systemRoleConfig.create({
        data: {
          id: ulid().toLowerCase(),
          role: config.role,
          name: config.name,
          description: config.description ?? null,
          is_active: true,
        },
      });
      console.log('Created system role config:', config.role);
    }
  }

  for (const [role, perms] of Object.entries(DEFAULT_SYSTEM_ROLE_PERMISSIONS) as Array<[
    SystemRole,
    Array<{ resource: (typeof RESOURCES)[number]; action: (typeof ACTIONS)[number] }>,
  ]>) {
    for (const { resource, action } of perms) {
      const code = `${resource}:${action}`;
      const permission = await prisma.permission.findUnique({ where: { code } });
      if (!permission) continue;
      const existing = await prisma.systemRolePermission.findFirst({
        where: { role, permission_id: permission.id },
      });
      if (!existing) {
        await prisma.systemRolePermission.create({
          data: {
            id: ulid().toLowerCase(),
            role,
            permission_id: permission.id,
            is_enabled: true,
          },
        });
      }
    }
  }
}
