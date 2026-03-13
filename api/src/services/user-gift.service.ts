import type { UserBalance } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { ulid } from 'ulid';
import { createAppError } from '../utils/appError.js';

/**
 * 赠送类型
 */
type GiftType = 'balance' | 'gift_months' | 'discount_coupon';

/**
 * 赠送单位
 */
type GiftUnit = 'cny' | 'months' | 'percent';

/**
 * 系统赠送配置
 */
interface SystemGiftConfig {
  target_type: 'all' | 'specific' | 'condition';
  target_user_ids?: string[];
  target_org_ids?: string[];
  gift_type: GiftType;
  gift_value: number;
  gift_unit: GiftUnit;
}

/**
 * 批量赠送参数
 */
export interface BatchGiftParams {
  org_ids: string[];
  gift_type: GiftType;
  gift_value: number;
  gift_unit: GiftUnit;
  reason?: string;
  expires_at?: Date;
  promotion_id?: string;
}

/**
 * 赠送记录列表参数
 */
export interface ListGiftsParams {
  organization_id?: string;
  user_id?: string;
  gift_type?: GiftType;
  status?: string;
  page?: number;
  pageSize?: number;
}

/**
 * User Gift Service 接口
 */
export interface UserGiftService {
  // 赠送余额给用户
  giftBalance(params: {
    organizationId: string;
    userId: string;
    amount: number;
    reason?: string;
    promotionId?: string;
    expiresAt?: Date;
  }): Promise<{
    id: string;
    user_id: string;
    organization_id: string;
    gift_type: string;
    gift_value: number;
    gift_unit: string;
    reason: string | null;
    status: string;
    expires_at: Date | null;
  }>;

  // 赠送时长给用户
  giftMonths(params: {
    organizationId: string;
    userId: string;
    months: number;
    reason?: string;
    promotionId?: string;
    expiresAt?: Date;
  }): Promise<{
    id: string;
    user_id: string;
    organization_id: string;
    gift_type: string;
    gift_value: number;
    gift_unit: string;
    reason: string | null;
    status: string;
    expires_at: Date | null;
  }>;

  // 批量赠送
  batchGift(params: BatchGiftParams): Promise<{ success: number; failed: number; errors: string[] }>;

  // 获取用户的赠送记录
  listUserGifts(params: ListGiftsParams): Promise<{ gifts: unknown[]; total: number }>;

  // 获取用户余额
  getUserBalance(organizationId: string): Promise<UserBalance | null>;

  // 使用赠送的时长
  useGiftMonths(params: {
    organizationId: string;
    months: number;
  }): Promise<boolean>;

  // 执行系统赠送活动
  executeSystemGiftPromotion(promotionId: string): Promise<{ success: number; failed: number }>;

  // 获取用户可用的赠送余额
  getAvailableGiftBalance(organizationId: string): Promise<number>;

  // 获取用户可用的赠送时长
  getAvailableGiftMonths(organizationId: string): Promise<number>;
}

/**
 * 创建 User Gift Service 实例
 */
export function createUserGiftService(): UserGiftService {
  const service: UserGiftService = {
    giftBalance: async (params) => {
      const { organizationId, userId, amount, reason, promotionId, expiresAt } = params;

      return prisma.$transaction(async (tx) => {
        // 创建赠送记录
        const gift = await tx.userGift.create({
          data: {
            id: ulid().toLowerCase(),
            promotion_id: promotionId,
            user_id: userId,
            organization_id: organizationId,
            gift_type: 'balance',
            gift_value: amount,
            gift_unit: 'cny',
            reason: reason ?? '系统赠送',
            status: 'active',
            expires_at: expiresAt,
          },
        });

        // 更新用户余额
        await tx.userBalance.upsert({
          where: { organization_id: organizationId },
          create: {
            id: ulid().toLowerCase(),
            organization_id: organizationId,
            balance: amount,
            total_gifted: amount,
          },
          update: {
            balance: { increment: amount },
            total_gifted: { increment: amount },
          },
        });

        return {
          id: gift.id,
          user_id: gift.user_id,
          organization_id: gift.organization_id,
          gift_type: gift.gift_type,
          gift_value: Number(gift.gift_value),
          gift_unit: gift.gift_unit,
          reason: gift.reason,
          status: gift.status,
          expires_at: gift.expires_at,
        };
      });
    },

    giftMonths: async (params) => {
      const { organizationId, userId, months, reason, promotionId, expiresAt } = params;

      // 创建赠送记录
      const gift = await prisma.userGift.create({
        data: {
          id: ulid().toLowerCase(),
          promotion_id: promotionId,
          user_id: userId,
          organization_id: organizationId,
          gift_type: 'gift_months',
          gift_value: months,
          gift_unit: 'months',
          reason: reason ?? '系统赠送',
          status: 'active',
          expires_at: expiresAt,
        },
      });

      return {
        id: gift.id,
        user_id: gift.user_id,
        organization_id: gift.organization_id,
        gift_type: gift.gift_type,
        gift_value: Number(gift.gift_value),
        gift_unit: gift.gift_unit,
        reason: gift.reason,
        status: gift.status,
        expires_at: gift.expires_at,
      };
    },

    batchGift: async (params) => {
      const { org_ids, gift_type, gift_value, reason, expires_at, promotion_id } =
        params;

      const errors: string[] = [];
      let success = 0;
      let failed = 0;

      for (const orgId of org_ids) {
        try {
          // 获取组织的第一个成员作为用户ID
          const member = await prisma.organizationMember.findFirst({
            where: { organization_id: orgId },
            select: { user_id: true },
          });

          if (!member) {
            errors.push(`组织 ${orgId} 没有成员`);
            failed++;
            continue;
          }

          if (gift_type === 'balance') {
            await service.giftBalance({
              organizationId: orgId,
              userId: member.user_id,
              amount: gift_value,
              reason: reason ?? '批量赠送',
              promotionId: promotion_id,
              expiresAt: expires_at,
            });
          } else if (gift_type === 'gift_months') {
            await service.giftMonths({
              organizationId: orgId,
              userId: member.user_id,
              months: gift_value,
              reason: reason ?? '批量赠送',
              promotionId: promotion_id,
              expiresAt: expires_at,
            });
          }

          success++;
        } catch (error) {
          errors.push(`组织 ${orgId} 赠送失败: ${error}`);
          failed++;
        }
      }

      return { success, failed, errors };
    },

    listUserGifts: async (params) => {
      const { organization_id, user_id, gift_type, status, page = 1, pageSize = 20 } = params;

      const where: Record<string, unknown> = {};
      if (organization_id) where.organization_id = organization_id;
      if (user_id) where.user_id = user_id;
      if (gift_type) where.gift_type = gift_type;
      if (status) where.status = status;

      const [gifts, total] = await Promise.all([
        prisma.userGift.findMany({
          where,
          include: {
            promotion: {
              select: { id: true, name: true, code: true },
            },
          },
          orderBy: { created_at: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.userGift.count({ where }),
      ]);

      return { gifts, total };
    },

    getUserBalance: async (organizationId) => {
      return prisma.userBalance.findUnique({
        where: { organization_id: organizationId },
      });
    },

    useGiftMonths: async (params) => {
      const { organizationId, months } = params;

      // 查找可用的赠送时长记录
      const availableGifts = await prisma.userGift.findMany({
        where: {
          organization_id: organizationId,
          gift_type: 'gift_months',
          status: 'active',
          OR: [{ expires_at: null }, { expires_at: { gte: new Date() } }],
        },
        orderBy: { created_at: 'asc' },
      });

      let remaining = months;
      for (const gift of availableGifts) {
        if (remaining <= 0) break;

        const giftValue = Number(gift.gift_value);
        if (giftValue > 0) {
          // 标记为已使用
          await prisma.userGift.update({
            where: { id: gift.id },
            data: {
              status: 'used',
              used_at: new Date(),
            },
          });
          remaining--;
        }
      }

      return remaining <= 0;
    },

    executeSystemGiftPromotion: async (promotionId) => {
      const promotion = await prisma.promotion.findUnique({
        where: { id: promotionId },
      });

      if (!promotion || promotion.type !== 'system_gift') {
        throw createAppError(400, '无效的系统赠送活动');
      }

      const config = promotion.system_gift_config as unknown as SystemGiftConfig;
      if (!config) {
        throw createAppError(400, '赠送配置无效');
      }

      let targetOrgIds: string[] = [];

      if (config.target_type === 'all') {
        // 获取所有活跃组织
        const orgs = await prisma.organization.findMany({
          where: { is_active: true },
          select: { id: true },
        });
        targetOrgIds = orgs.map((o) => o.id);
      } else if (config.target_type === 'specific') {
        targetOrgIds = config.target_org_ids ?? [];
      } else if (config.target_type === 'condition') {
        // 根据条件筛选（待扩展）
        targetOrgIds = config.target_org_ids ?? [];
      }

      const result = await service.batchGift({
        org_ids: targetOrgIds,
        gift_type: config.gift_type,
        gift_value: config.gift_value,
        gift_unit: config.gift_unit,
        reason: promotion.name,
        promotion_id: promotionId,
      });

      return { success: result.success, failed: result.failed };
    },

    getAvailableGiftBalance: async (organizationId) => {
      const balance = await prisma.userBalance.findUnique({
        where: { organization_id: organizationId },
      });
      return balance ? Number(balance.balance) : 0;
    },

    getAvailableGiftMonths: async (organizationId) => {
      const gifts = await prisma.userGift.findMany({
        where: {
          organization_id: organizationId,
          gift_type: 'gift_months',
          status: 'active',
          OR: [{ expires_at: null }, { expires_at: { gte: new Date() } }],
        },
        select: { gift_value: true },
      });

      return gifts.reduce((sum, g) => sum + Number(g.gift_value), 0);
    },
  };

  return service;
}

/**
 * 默认实例
 */
export const defaultUserGiftService = createUserGiftService();
