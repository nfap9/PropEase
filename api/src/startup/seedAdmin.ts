import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';

const SUPER_ROLE_NAME = '超级管理员';

/**
 * 仅创建超级管理员角色（不创建用户）
 * 用户需要通过初始化向导手动创建
 */
export async function seedAdminRole(): Promise<void> {
  const existing = await prisma.adminRole.findFirst({ where: { name: SUPER_ROLE_NAME } });
  if (!existing) {
    await prisma.adminRole.create({
      data: {
        id: ulid().toLowerCase(),
        name: SUPER_ROLE_NAME,
        permissions: ['*'],
        is_system: true,
      },
    });
    console.log('Created admin role:', SUPER_ROLE_NAME);
  }
}
