import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../utils/security.js';

/** E2E 测试用固定用户：手机号 13800138000，密码 Test1234 */
const E2E_PHONE = '13800138000';
const E2E_PASSWORD = 'Test1234';
const E2E_FULL_NAME = 'E2E测试';
const E2E_PERSONAL_ORG_NAME = '个人';
const E2E_PERSONAL_ORG_SLUG = 'e2e-personal';

export async function seedE2EUser(): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { phone: E2E_PHONE } });
  if (existing) return;

  const passwordHash = await hashPassword(E2E_PASSWORD);
  const userId = ulid().toLowerCase();
  await prisma.user.create({
    data: {
      id: userId,
      phone: E2E_PHONE,
      full_name: E2E_FULL_NAME,
      password_hash: passwordHash,
    },
  });

  const orgId = ulid().toLowerCase();
  await prisma.organization.create({
    data: {
      id: orgId,
      name: E2E_PERSONAL_ORG_NAME,
      slug: E2E_PERSONAL_ORG_SLUG,
      is_personal: true,
    },
  });
  await prisma.organizationMember.create({
    data: {
      id: ulid().toLowerCase(),
      organization_id: orgId,
      user_id: userId,
      role: 'owner',
    },
  });
  console.log('E2E seed: created test user', E2E_PHONE);
}
