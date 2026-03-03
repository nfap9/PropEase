import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';

export async function seedUsagePricing(): Promise<void> {
  const count = await prisma.usagePricing.count();
  if (count > 0) return;
  await prisma.usagePricing.create({
    data: {
      id: ulid().toLowerCase(),
      price_per_org: 0,
      price_per_apartment: 0,
      price_per_room: 0,
      price_per_member: 0,
      is_active: true,
    },
  });
  console.log('Created usage pricing');
}
