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
