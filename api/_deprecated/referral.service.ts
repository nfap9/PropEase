import type { User } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { ulid } from 'ulid';
import { createAppError } from '../utils/appError.js';

/**
 * 推荐奖励配置
 */
interface ReferralRewardConfig {
  discount_value?: number;
  gift_months?: number;
  gift_balance?: number;
}

/**
 * 推荐配置
 */
interface ReferralConfig {
  referrer_reward?: ReferralRewardConfig;
  referee_reward?: ReferralRewardConfig;
}

/**
 * 推荐统计
 */
export interface ReferralStats {
  total_referrals: number;
  completed_referrals: number;
  pending_referrals: number;
  total_rewards_earned: number;
  total_rewards_pending: number;
}

/**
 * Referral Service 接口
 */
export interface ReferralService {
  // 生成推荐码
  generateReferralCode(userId: string): Promise<string>;

  // 获取用户的推荐码
  getMyReferralCode(userId: string): Promise<string>;

  // 创建推荐记录
  createReferralRecord(params: {
    promotionId: string;
    referrerUserId: string;
    referrerOrgId: string;
    refereeUserId: string;
    refereeOrgId: string;
  }): Promise<{
    id: string;
    promotion_id: string;
    referrer_user_id: string;
    referrer_org_id: string;
    referee_user_id: string;
    referee_org_id: string;
    status: string;
    referrer_rewarded: boolean;
    referee_rewarded: boolean;
    referrer_reward_type: string | null;
    referee_reward_type: string | null;
    created_at: Date;
    updated_at: Date;
  }>;

  // 获取推荐记录
  getReferralRecords(params: {
    userId: string;
    type: 'referrer' | 'referee';
    page?: number;
    pageSize?: number;
  }): Promise<{ records: unknown[]; total: number }>;

  // 获取推荐统计
  getReferralStats(userId: string): Promise<ReferralStats>;

  // 处理推荐奖励（订单支付成功后调用）
  processReferralReward(orderId: string): Promise<void>;

  // 验证推荐码
  validateReferralCode(code: string): Promise<{ valid: boolean; referrer: User | null }>;

  // 绑定推荐关系
  bindReferral(params: {
    referralCode: string;
    refereeUserId: string;
    refereeOrgId: string;
  }): Promise<{
    id: string;
    promotion_id: string;
    referrer_user_id: string;
    referrer_org_id: string;
    referee_user_id: string;
    referee_org_id: string;
    status: string;
  } | null>;
}

/**
 * 生成随机推荐码
 */
function generateRandomReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 创建 Referral Service 实例
 */
export function createReferralService(): ReferralService {
  const service: ReferralService = {
    generateReferralCode: async (userId: string) => {
      // 检查用户是否已有推荐码
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { referral_code: true },
      });

      if (user?.referral_code) {
        return user.referral_code;
      }

      // 生成唯一的推荐码
      let code = generateRandomReferralCode();
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const existing = await prisma.user.findFirst({
          where: { referral_code: code },
        });

        if (!existing) {
          break;
        }

        code = generateRandomReferralCode();
        attempts++;
      }

      if (attempts >= maxAttempts) {
        // 使用用户ID后缀确保唯一
        code = `R${userId.slice(-6).toUpperCase()}`;
      }

      // 更新用户的推荐码
      await prisma.user.update({
        where: { id: userId },
        data: { referral_code: code },
      });

      return code;
    },

    getMyReferralCode: async (userId: string) => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { referral_code: true },
      });

      if (user?.referral_code) {
        return user.referral_code;
      }

      // 自动生成
      return service.generateReferralCode(userId);
    },

    createReferralRecord: async (params) => {
      const { promotionId, referrerUserId, referrerOrgId, refereeUserId, refereeOrgId } = params;

      // 检查是否已存在推荐记录
      const existing = await prisma.referralRecord.findUnique({
        where: {
          promotion_id_referee_org_id: {
            promotion_id: promotionId,
            referee_org_id: refereeOrgId,
          },
        },
      });

      if (existing) {
        return existing;
      }

      // 获取推荐活动配置
      const promotion = await prisma.promotion.findUnique({
        where: { id: promotionId },
      });

      if (!promotion || promotion.type !== 'referral') {
        throw createAppError(400, '无效的推荐活动');
      }

      const referralConfig = promotion.referral_config as ReferralConfig | null;

      return prisma.referralRecord.create({
        data: {
          id: ulid().toLowerCase(),
          promotion_id: promotionId,
          referrer_user_id: referrerUserId,
          referrer_org_id: referrerOrgId,
          referee_user_id: refereeUserId,
          referee_org_id: refereeOrgId,
          status: 'pending',
          referrer_reward_type: referralConfig?.referrer_reward?.gift_balance
            ? 'balance'
            : referralConfig?.referrer_reward?.gift_months
              ? 'gift_months'
              : null,
          referrer_reward_value: referralConfig?.referrer_reward?.gift_balance
            ? referralConfig.referrer_reward.gift_balance
            : referralConfig?.referrer_reward?.gift_months
              ? referralConfig.referrer_reward.gift_months
              : null,
          referee_reward_type: referralConfig?.referee_reward?.gift_balance
            ? 'balance'
            : referralConfig?.referee_reward?.gift_months
              ? 'gift_months'
              : null,
          referee_reward_value: referralConfig?.referee_reward?.gift_balance
            ? referralConfig.referee_reward.gift_balance
            : referralConfig?.referee_reward?.gift_months
              ? referralConfig.referee_reward.gift_months
              : null,
        },
      });
    },

    getReferralRecords: async (params) => {
      const { userId, type, page = 1, pageSize = 20 } = params;

      const where =
        type === 'referrer'
          ? { referrer_user_id: userId }
          : { referee_user_id: userId };

      const [records, total] = await Promise.all([
        prisma.referralRecord.findMany({
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
        prisma.referralRecord.count({ where }),
      ]);

      return { records, total };
    },

    getReferralStats: async (userId: string) => {
      const [total, completed, pending, rewards] = await Promise.all([
        prisma.referralRecord.count({
          where: { referrer_user_id: userId },
        }),
        prisma.referralRecord.count({
          where: { referrer_user_id: userId, status: 'completed' },
        }),
        prisma.referralRecord.count({
          where: { referrer_user_id: userId, status: 'pending' },
        }),
        prisma.referralRecord.aggregate({
          where: {
            referrer_user_id: userId,
            referrer_rewarded: true,
            referrer_reward_type: 'balance',
          },
          _sum: {
            referrer_reward_value: true,
          },
        }),
      ]);

      const pendingRewards = await prisma.referralRecord.aggregate({
        where: {
          referrer_user_id: userId,
          referrer_rewarded: false,
          status: 'completed',
          referrer_reward_type: 'balance',
        },
        _sum: {
          referrer_reward_value: true,
        },
      });

      return {
        total_referrals: total,
        completed_referrals: completed,
        pending_referrals: pending,
        total_rewards_earned: Number(rewards._sum.referrer_reward_value ?? 0),
        total_rewards_pending: Number(pendingRewards._sum.referrer_reward_value ?? 0),
      };
    },

    processReferralReward: async (orderId: string) => {
      // 查找关联的推荐记录
      const order = await prisma.subscriptionOrder.findUnique({
        where: { id: orderId },
      });

      if (!order || !order.referral_record_id) {
        return;
      }

      const referralRecord = await prisma.referralRecord.findUnique({
        where: { id: order.referral_record_id },
      });

      if (!referralRecord) {
        return;
      }

      // 更新推荐记录状态
      await prisma.referralRecord.update({
        where: { id: referralRecord.id },
        data: { status: 'completed' },
      });

      // 发放被推荐人奖励
      if (!referralRecord.referee_rewarded && referralRecord.referee_reward_value) {
        await prisma.$transaction(async (tx) => {
          // 创建或更新用户余额
          await tx.userBalance.upsert({
            where: { organization_id: referralRecord.referee_org_id },
            create: {
              id: ulid().toLowerCase(),
              organization_id: referralRecord.referee_org_id,
              balance: referralRecord.referee_reward_value!,
              total_gifted: referralRecord.referee_reward_value!,
            },
            update: {
              balance: { increment: referralRecord.referee_reward_value! },
              total_gifted: { increment: referralRecord.referee_reward_value! },
            },
          });

          // 创建赠送记录
          await tx.userGift.create({
            data: {
              id: ulid().toLowerCase(),
              promotion_id: referralRecord.promotion_id,
              user_id: referralRecord.referee_user_id,
              organization_id: referralRecord.referee_org_id,
              gift_type: referralRecord.referee_reward_type ?? 'balance',
              gift_value: referralRecord.referee_reward_value!,
              gift_unit: 'cny',
              reason: '新用户推荐奖励',
              status: 'active',
            },
          });

          // 标记已发放
          await tx.referralRecord.update({
            where: { id: referralRecord.id },
            data: { referee_rewarded: true },
          });
        });
      }

      // 发放推荐人奖励
      if (!referralRecord.referrer_rewarded && referralRecord.referrer_reward_value) {
        await prisma.$transaction(async (tx) => {
          // 创建或更新用户余额
          await tx.userBalance.upsert({
            where: { organization_id: referralRecord.referrer_org_id },
            create: {
              id: ulid().toLowerCase(),
              organization_id: referralRecord.referrer_org_id,
              balance: referralRecord.referrer_reward_value!,
              total_gifted: referralRecord.referrer_reward_value!,
            },
            update: {
              balance: { increment: referralRecord.referrer_reward_value! },
              total_gifted: { increment: referralRecord.referrer_reward_value! },
            },
          });

          // 创建赠送记录
          await tx.userGift.create({
            data: {
              id: ulid().toLowerCase(),
              promotion_id: referralRecord.promotion_id,
              user_id: referralRecord.referrer_user_id,
              organization_id: referralRecord.referrer_org_id,
              gift_type: referralRecord.referrer_reward_type ?? 'balance',
              gift_value: referralRecord.referrer_reward_value!,
              gift_unit: 'cny',
              reason: '推荐好友奖励',
              status: 'active',
            },
          });

          // 标记已发放
          await tx.referralRecord.update({
            where: { id: referralRecord.id },
            data: { referrer_rewarded: true },
          });
        });
      }
    },

    validateReferralCode: async (code: string) => {
      const referrer = await prisma.user.findFirst({
        where: { referral_code: code },
      });

      if (!referrer) {
        return { valid: false, referrer: null };
      }

      return { valid: true, referrer };
    },

    bindReferral: async (params) => {
      const { referralCode, refereeUserId, refereeOrgId } = params;

      // 验证推荐码
      const { valid, referrer } = await service.validateReferralCode(referralCode);
      if (!valid || !referrer) {
        return null;
      }

      // 不能推荐自己
      if (referrer.id === refereeUserId) {
        return null;
      }

      // 查找活跃的推荐活动
      const promotion = await prisma.promotion.findFirst({
        where: {
          type: 'referral',
          is_active: true,
          start_date: { lte: new Date() },
          OR: [{ end_date: null }, { end_date: { gte: new Date() } }],
        },
      });

      if (!promotion) {
        return null;
      }

      // 获取推荐人的组织
      const referrerMembership = await prisma.organizationMember.findFirst({
        where: { user_id: referrer.id },
        include: { organization: true },
      });

      if (!referrerMembership) {
        return null;
      }

      // 创建推荐记录
      const record = await service.createReferralRecord({
        promotionId: promotion.id,
        referrerUserId: referrer.id,
        referrerOrgId: referrerMembership.organization_id,
        refereeUserId,
        refereeOrgId,
      });

      return {
        id: record.id,
        promotion_id: record.promotion_id,
        referrer_user_id: record.referrer_user_id,
        referrer_org_id: record.referrer_org_id,
        referee_user_id: record.referee_user_id,
        referee_org_id: record.referee_org_id,
        status: record.status,
      };
    },
  };

  return service;
}

/**
 * 默认实例
 */
export const defaultReferralService = createReferralService();
