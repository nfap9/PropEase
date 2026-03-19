import cron from 'node-cron';
import { logger } from '../utils/logger.js';
import { runMonthlyBillGeneration } from './monthlyBills.js';
import { checkExpiringLeases, checkOverdueBills, checkUpcomingDueBills } from './notificationChecks.js';

/**
 * 注册定时任务：
 * - 每月 1 日 00:05 生成月度账单
 * - 每日 08:00 检查即将到期租约
 * - 每日 08:03 检查交租日前提醒
 * - 每日 08:05 检查逾期账单
 * 使用 Asia/Shanghai 时区。
 */
export function startScheduler(): void {
  cron.schedule(
    '5 0 1 * *',
    async () => {
      try {
        const stats = await runMonthlyBillGeneration();
        logger.info({ stats }, 'Monthly bill generation completed');
      } catch (e) {
        logger.error({ err: e }, 'Monthly bill generation failed');
      }
    },
    { timezone: 'Asia/Shanghai' }
  );

  cron.schedule(
    '0 8 * * *',
    async () => {
      try {
        const stats = await checkExpiringLeases();
        logger.info({ stats }, 'Expiring leases check completed');
      } catch (e) {
        logger.error({ err: e }, 'Expiring leases check failed');
      }
    },
    { timezone: 'Asia/Shanghai' }
  );

  cron.schedule(
    '3 8 * * *',
    async () => {
      try {
        const stats = await checkUpcomingDueBills();
        logger.info({ stats }, 'Upcoming due bills check completed');
      } catch (e) {
        logger.error({ err: e }, 'Upcoming due bills check failed');
      }
    },
    { timezone: 'Asia/Shanghai' }
  );

  cron.schedule(
    '5 8 * * *',
    async () => {
      try {
        const stats = await checkOverdueBills();
        logger.info({ stats }, 'Overdue bills check completed');
      } catch (e) {
        logger.error({ err: e }, 'Overdue bills check failed');
      }
    },
    { timezone: 'Asia/Shanghai' }
  );

  logger.info('Scheduler started (monthly bills, expiring leases, upcoming due bills, overdue bills)');
}
