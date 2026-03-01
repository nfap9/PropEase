import cron from 'node-cron';
import { runMonthlyBillGeneration } from './monthlyBills.js';
import { checkExpiringLeases, checkOverdueBills } from './notificationChecks.js';

/**
 * 注册定时任务：
 * - 每月 1 日 00:05 生成月度账单
 * - 每日 08:00 检查即将到期租约
 * - 每日 08:05 检查逾期账单
 * 使用 Asia/Shanghai 时区。
 */
export function startScheduler(): void {
  cron.schedule(
    '5 0 1 * *',
    async () => {
      try {
        const stats = await runMonthlyBillGeneration();
        console.log('Monthly bill generation completed:', stats);
      } catch (e) {
        console.error('Monthly bill generation failed:', e);
      }
    },
    { timezone: 'Asia/Shanghai' }
  );

  cron.schedule(
    '0 8 * * *',
    async () => {
      try {
        const stats = await checkExpiringLeases();
        console.log('Expiring leases check completed:', stats);
      } catch (e) {
        console.error('Expiring leases check failed:', e);
      }
    },
    { timezone: 'Asia/Shanghai' }
  );

  cron.schedule(
    '5 8 * * *',
    async () => {
      try {
        const stats = await checkOverdueBills();
        console.log('Overdue bills check completed:', stats);
      } catch (e) {
        console.error('Overdue bills check failed:', e);
      }
    },
    { timezone: 'Asia/Shanghai' }
  );

  console.log('Scheduler started (monthly bills, expiring leases, overdue bills)');
}
