import { prisma } from '../lib/prisma.js';
import { generateBillsForOrg } from '../services/billGeneration.js';

/**
 * 月度账单生成任务（每月 1 日 00:05 执行）：为所有组织的在租租约生成上一月账单。
 */
export async function runMonthlyBillGeneration(): Promise<{
  organizations_processed: number;
  bills_created: number;
  bills_skipped: number;
  errors: number;
}> {
  const today = new Date();
  const billYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
  const billMonth = today.getMonth() === 0 ? 12 : today.getMonth();
  const dueDate = new Date(today.getFullYear(), today.getMonth(), 15);

  const orgs = await prisma.organization.findMany({ select: { id: true } });
  let organizations_processed = 0;
  let bills_created = 0;
  let bills_skipped = 0;
  let errors = 0;

  for (const org of orgs) {
    try {
      organizations_processed += 1;
      const result = await generateBillsForOrg(org.id, billYear, billMonth, dueDate);
      bills_created += result.created;
      bills_skipped += result.skipped;
    } catch (e) {
      console.error('Monthly bill generation error for org', org.id, e);
      errors += 1;
    }
  }

  return { organizations_processed, bills_created, bills_skipped, errors };
}
