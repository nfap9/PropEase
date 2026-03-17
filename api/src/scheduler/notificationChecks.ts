import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';
import { defaultTenantReachabilityService } from '../services/tenantReachability.service.js';

/** 检查即将到期的租约并创建通知（每日 08:00） */
export async function checkExpiringLeases(): Promise<Record<string, number>> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const stats: Record<string, number> = {
    lease_expiring_7: 0,
    lease_expiring_3: 0,
    lease_expiring_1: 0,
  };

  for (const days of [7, 3, 1]) {
    const target = new Date(today);
    target.setDate(target.getDate() + days);
    const targetStr = target.toISOString().slice(0, 10);

    const leases = await prisma.lease.findMany({
      where: { is_active: true, end_date: { not: null } },
      include: { room: { include: { apartment: true } } },
    });
    const expiring = leases.filter(
      (l) => l.end_date && l.end_date.toISOString().slice(0, 10) === targetStr
    );
    const tenantIds = [...new Set(expiring.map((l) => l.tenant_id))];
    const tenants = await prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: { id: true, name: true },
    });
    const tenantByName = Object.fromEntries(tenants.map((t) => [t.id, t.name]));

    for (const lease of expiring) {
      if (!lease.end_date) continue;
      const orgId = lease.room.apartment.organization_id;
      const tenantName = tenantByName[lease.tenant_id] ?? '-';
      const members = await prisma.organizationMember.findMany({
        where: { organization_id: orgId, role: { in: ['owner', 'admin'] } },
      });
      const title = `租约即将到期 - ${tenantName}`;
      const content = `租客 ${tenantName}（房间 ${lease.room.room_number}）的租约将在 ${days} 天后到期（${lease.end_date.toISOString().slice(0, 10)}）。请及时处理续约或退房事宜。`;
      for (const m of members) {
        await prisma.notification.create({
          data: {
            id: ulid().toLowerCase(),
            user_id: m.user_id,
            organization_id: orgId,
            type: 'lease_expiring',
            title,
            content,
            extra_data: {
              category: 'lease',
              target_path: '/leases',
              action_label: '查看租约',
              lease_id: lease.id,
              tenant_name: tenantName,
              room_number: lease.room.room_number,
              end_date: lease.end_date.toISOString().slice(0, 10),
              days_remaining: days,
            },
          },
        });
      }
      stats[`lease_expiring_${days}`] = (stats[`lease_expiring_${days}`] ?? 0) + 1;
    }
  }
  return stats;
}

/** 检查逾期账单并创建通知（每日 08:05） */
export async function checkOverdueBills(): Promise<Record<string, number>> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const stats = { bills_overdue: 0 };

  const bills = await prisma.bill.findMany({
    where: { status: { not: 'paid' }, due_date: { lt: today } },
    include: { lease: { include: { room: { include: { apartment: true } } } } },
  });
  const tenantIds = [...new Set(bills.map((b) => b.lease.tenant_id))];
  const tenants = await prisma.tenant.findMany({
    where: { id: { in: tenantIds } },
    select: { id: true, name: true },
  });
  const tenantByName = Object.fromEntries(tenants.map((t) => [t.id, t.name]));

  for (const bill of bills) {
    const orgId = bill.lease.room.apartment.organization_id;
    const tenantName = tenantByName[bill.lease.tenant_id] ?? '-';
    const dueDate = new Date(bill.due_date);
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
    const members = await prisma.organizationMember.findMany({
      where: { organization_id: orgId, role: { in: ['owner', 'admin'] } },
    });
    const title = `账单逾期提醒 - ${tenantName}`;
    const content = `租客 ${tenantName}（房间 ${bill.lease.room.room_number}）的账单已逾期 ${daysOverdue} 天。金额: ¥${Number(bill.total_amount).toFixed(2)}，截止日期: ${dueDate.toISOString().slice(0, 10)}。`;

    try {
      await defaultTenantReachabilityService.sendBillOverdue(bill.id);
    } catch (error) {
      console.error('[notificationChecks] failed to send tenant bill_overdue sms:', error);
    }

    for (const m of members) {
      await prisma.notification.create({
        data: {
          id: ulid().toLowerCase(),
          user_id: m.user_id,
          organization_id: orgId,
          type: 'bill_overdue',
          title,
          content,
          extra_data: {
            category: 'billing',
            target_path: '/bills',
            action_label: '查看账单',
            bill_id: bill.id,
            tenant_name: tenantName,
            room_number: bill.lease.room.room_number,
            amount: Number(bill.total_amount),
            due_date: dueDate.toISOString().slice(0, 10),
            days_overdue: daysOverdue,
          },
        },
      });
    }
    stats.bills_overdue += 1;
  }
  return stats;
}

/** 检查交租日前 1-3 天账单并创建通知（每日 08:03） */
export async function checkUpcomingDueBills(): Promise<Record<string, number>> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const stats: Record<string, number> = {
    rent_due_3: 0,
    rent_due_2: 0,
    rent_due_1: 0,
  };

  for (const days of [3, 2, 1]) {
    const target = new Date(today);
    target.setDate(target.getDate() + days);
    const targetStr = target.toISOString().slice(0, 10);

    const bills = await prisma.bill.findMany({
      where: { status: { not: 'paid' } },
      include: { lease: { include: { room: { include: { apartment: true } } } } },
    });
    const upcoming = bills.filter((b) => b.due_date.toISOString().slice(0, 10) === targetStr);
    const tenantIds = [...new Set(upcoming.map((b) => b.lease.tenant_id))];
    const tenants = await prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: { id: true, name: true },
    });
    const tenantByName = Object.fromEntries(tenants.map((t) => [t.id, t.name]));

    for (const bill of upcoming) {
      const orgId = bill.lease.room.apartment.organization_id;
      const tenantName = tenantByName[bill.lease.tenant_id] ?? '-';
      const members = await prisma.organizationMember.findMany({
        where: { organization_id: orgId, role: { in: ['owner', 'admin'] } },
      });
      const title = `交租日提醒 - ${tenantName}`;
      const content = `租客 ${tenantName}（房间 ${bill.lease.room.room_number}）账单将在 ${days} 天后到期，金额: ¥${Number(bill.total_amount).toFixed(2)}，截止日期: ${targetStr}。`;

      try {
        await defaultTenantReachabilityService.sendRentDueReminder(bill.id);
      } catch (error) {
        console.error('[notificationChecks] failed to send tenant rent_due_reminder sms:', error);
      }

      for (const m of members) {
        await prisma.notification.create({
          data: {
            id: ulid().toLowerCase(),
            user_id: m.user_id,
            organization_id: orgId,
            type: 'rent_due_reminder',
            title,
            content,
            extra_data: {
              category: 'billing',
              target_path: '/bills',
              action_label: '查看账单',
              bill_id: bill.id,
              tenant_name: tenantName,
              room_number: bill.lease.room.room_number,
              amount: Number(bill.total_amount),
              due_date: targetStr,
              days_until_due: days,
            },
          },
        });
      }
      stats[`rent_due_${days}`] = (stats[`rent_due_${days}`] ?? 0) + 1;
    }
  }

  return stats;
}
