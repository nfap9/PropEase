import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../utils/security.js';
import { config } from '../config.js';

const SUPER_ROLE_NAME = '超级管理员';

export async function seedAdminSuper(): Promise<void> {
  let role = await prisma.adminRole.findFirst({ where: { name: SUPER_ROLE_NAME } });
  if (!role) {
    role = await prisma.adminRole.create({
      data: {
        id: ulid().toLowerCase(),
        name: SUPER_ROLE_NAME,
        permissions: ['*'],
        is_system: true,
      },
    });
    console.log('Created admin role:', SUPER_ROLE_NAME);
  }

  const existing = await prisma.adminUser.findUnique({
    where: { username: config.adminInitUsername },
  });
  if (!existing) {
    const passwordHash = await hashPassword(config.adminInitPassword);
    await prisma.adminUser.create({
      data: {
        id: ulid().toLowerCase(),
        username: config.adminInitUsername,
        password_hash: passwordHash,
        name: '超级管理员',
        role_id: role.id,
        is_active: true,
        is_system: true,
      },
    });
    console.log('Created admin user:', config.adminInitUsername);
  }
}
