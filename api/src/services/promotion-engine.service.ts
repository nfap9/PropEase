import type { Promotion, SubscriptionOrder } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { ulid } from 'ulid';
import { createAppError } from '../utils/appError.js';

/**
 * 阶梯优惠规则
 */
export interface TieredRule {
  months: number;
  discount_value?: number;
  gift_months?: number;
}

/**
 * 优惠券配置
 */
export interface CouponConfig {
  max_uses?: number;
  max_uses_per_user?: number;
  min_amount?: number;
}

/**
 * 推荐奖励配置
 */
export interface ReferralRewardConfig {
  discount_value?: number;
  gift_months?: number;
  gift_balance?: number;
}

/**
 * 推荐配置
 */
export interface ReferralConfig {
  referrer_reward?: ReferralRewardConfig;
  referee_reward?: ReferralRewardConfig;
}

/**
 * 应用的优惠信息
 */
export interface AppliedPromotion {
  id: string;
  code: string;
  name: string;
  type: string;
  discount_amount: number;
  gift_months: number;
  balance_deduction: number;
}

/**
 * 优惠计算输入参数
 */
export interface PromotionCalculationInput {
  plan_id: string;
  billing_months: number;
  original_price: number;
  organization_id: string;
  user_id: string;
  coupon_code?: string;
  use_balance?: boolean;
  referral_code?: string;
  is_first_purchase?: boolean;
}

/**
 * 优惠计算结果
 */
export interface PromotionCalculationResult {
  original_price: number;
  final_price: number;
  total_discount: number;
  total_gift_months: number;
  balance_deduction: number;
  applied_promotions: AppliedPromotion[];
  available_promotions: Promotion[];
  balance_available: number;
  coupon_valid: boolean;
  coupon_message?: string;
  referral_valid: boolean;
  referral_message?: string;
}

/**
 * Promotion Engine Service 接口
 */
export interface PromotionEngineService {
  // 获取可用优惠
  getAvailablePromotions(params: {
    plan_id: string;
    organization_id: string;
    user_id: string;
    is_first_purchase?: boolean;
  }): Promise<Promotion[]>;

  // 验证优惠码
  validateCouponCode(params: {
    code: string;
    plan_id: string;
    organization_id: string;
    user_id: string;
    amount: number;
  }): Promise<{ valid: boolean; promotion: Promotion | null; message?: string }>;

  // 计算优惠价格
  calculatePromotions(input: PromotionCalculationInput): Promise<PromotionCalculationResult>;

  // 应用优惠到订单
  applyPromotionsToOrder(
    order: SubscriptionOrder,
    appliedPromotions: AppliedPromotion[]
  ): Promise<void>;

  // 获取用户余额
  getUserBalance(organizationId: string): Promise<number>;

  // 使用用户余额
  useUserBalance(
    organizationId: string,
    amount: number,
    orderId: string
  ): Promise<void>;
}

/**
 * 创建 Promotion Engine Service 实例
 */
export function createPromotionEngineService(): PromotionEngineService {
  const service: PromotionEngineService = {
    getAvailablePromotions: async (params) => {
      const { plan_id, is_first_purchase } = params;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 查询所有活跃的优惠活动
      const promotions = await prisma.promotion.findMany({
        where: {
          is_active: true,
          start_date: { lte: today },
          OR: [{ end_date: null }, { end_date: { gte: today } }],
          plans: { some: { plan_id } },
        },
        include: {
          plans: true,
        },
        orderBy: { created_at: 'desc' },
      });

      // 过滤符合条件的优惠
      return promotions.filter((promo) => {
        // 首购限制
        if (promo.scope_type === 'first_purchase' && !is_first_purchase) {
          return false;
        }

        // 检查优惠券使用限制
        if (promo.type === 'coupon') {
          const couponConfig = promo.coupon_config as CouponConfig | null;
          if (couponConfig?.max_uses && promo.coupon_uses_count >= couponConfig.max_uses) {
            return false;
          }
        }

        // 检查推荐活动是否已被使用
        if (promo.type === 'referral') {
          // 推荐活动需要通过 referral_code 使用，不自动应用
          return false;
        }

        // 系统赠送活动不自动应用
        if (promo.type === 'system_gift') {
          return false;
        }

        return true;
      });
    },

    validateCouponCode: async (params) => {
      const { code, plan_id, user_id, amount } = params;

      const promotion = await prisma.promotion.findUnique({
        where: { code },
        include: { plans: true },
      });

      if (!promotion) {
        return { valid: false, promotion: null, message: '优惠码不存在' };
      }

      if (!promotion.is_active) {
        return { valid: false, promotion: null, message: '该优惠活动已停用' };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (promotion.start_date > today) {
        return { valid: false, promotion: null, message: '优惠活动尚未开始' };
      }

      if (promotion.end_date && promotion.end_date < today) {
        return { valid: false, promotion: null, message: '优惠活动已结束' };
      }

      // 检查是否适用于该套餐
      if (promotion.scope_type === 'plan' && promotion.plans.length > 0) {
        const applicable = promotion.plans.some((p) => p.plan_id === plan_id);
        if (!applicable) {
          return { valid: false, promotion: null, message: '该优惠码不适用于当前套餐' };
        }
      }

      // 检查优惠券使用限制
      if (promotion.type === 'coupon') {
        const couponConfig = promotion.coupon_config as CouponConfig | null;

        // 检查最低金额
        if (couponConfig?.min_amount && amount < couponConfig.min_amount) {
          return {
            valid: false,
            promotion: null,
            message: `订单金额需满 ${couponConfig.min_amount} 元才能使用此优惠码`,
          };
        }

        // 检查总使用次数
        if (couponConfig?.max_uses && promotion.coupon_uses_count >= couponConfig.max_uses) {
          return { valid: false, promotion: null, message: '该优惠码已被领完' };
        }

        // 检查用户使用次数
        if (couponConfig?.max_uses_per_user) {
          const userUsageCount = await prisma.couponUsage.count({
            where: {
              promotion_id: promotion.id,
              user_id,
            },
          });
          if (userUsageCount >= couponConfig.max_uses_per_user) {
            return { valid: false, promotion: null, message: '您已达到该优惠码的使用上限' };
          }
        }
      }

      return { valid: true, promotion };
    },

    calculatePromotions: async (input) => {
      const {
        plan_id,
        billing_months,
        original_price,
        organization_id,
        user_id,
        coupon_code,
        use_balance = false,
        referral_code,
        is_first_purchase = false,
      } = input;

      let currentPrice = original_price;
      let totalDiscount = 0;
      let totalGiftMonths = 0;
      let balanceDeduction = 0;
      const appliedPromotions: AppliedPromotion[] = [];

      // 1. 获取可用优惠
      const availablePromotions = await service.getAvailablePromotions({
        plan_id,
        organization_id,
        user_id,
        is_first_purchase,
      });

      // 2. 获取用户余额
      const userBalance = await prisma.userBalance.findUnique({
        where: { organization_id },
      });
      const balanceAvailable = userBalance ? Number(userBalance.balance) : 0;

      // 3. 验证优惠码
      let couponValid = false;
      let couponMessage: string | undefined;
      let couponPromotion: Promotion | null = null;
      if (coupon_code) {
        const couponResult = await service.validateCouponCode({
          code: coupon_code,
          plan_id,
          organization_id,
          user_id,
          amount: currentPrice,
        });
        couponValid = couponResult.valid;
        couponMessage = couponResult.message;
        couponPromotion = couponResult.promotion;
      }

      // 4. 验证推荐码
      let referralValid = false;
      let referralMessage: string | undefined;
      let referralPromotion: Promotion | null = null;
      if (referral_code) {
        // 查找推荐活动
        const referralRecord = await prisma.referralRecord.findFirst({
          where: {
            referrer_org_id: organization_id,
            status: 'pending',
          },
          include: { promotion: true },
        });

        if (referralRecord && referralRecord.promotion) {
          referralValid = true;
          referralPromotion = referralRecord.promotion;
        } else {
          // 尝试通过推荐码查找
          const referrer = await prisma.user.findFirst({
            where: { referral_code: referral_code },
          });
          if (referrer) {
            const activeReferralPromotion = await prisma.promotion.findFirst({
              where: {
                type: 'referral',
                is_active: true,
                start_date: { lte: new Date() },
                OR: [{ end_date: null }, { end_date: { gte: new Date() } }],
              },
            });
            if (activeReferralPromotion) {
              referralValid = true;
              referralPromotion = activeReferralPromotion;
            } else {
              referralMessage = '当前没有可用的推荐活动';
            }
          } else {
            referralMessage = '推荐码无效';
          }
        }
      }

      // 5. 按优先级应用优惠
      const promotionsToApply: Promotion[] = [];

      // 添加自动应用的优惠（折扣、阶梯、混合）
      for (const promo of availablePromotions) {
        if (['discount', 'tiered', 'mixed'].includes(promo.type)) {
          promotionsToApply.push(promo);
        }
      }

      // 添加优惠码
      if (couponValid && couponPromotion) {
        promotionsToApply.push(couponPromotion);
      }

      // 添加推荐优惠
      if (referralValid && referralPromotion) {
        promotionsToApply.push(referralPromotion);
      }

      // 按 stack_priority 降序排序
      promotionsToApply.sort((a, b) => (b.stack_priority ?? 0) - (a.stack_priority ?? 0));

      // 6. 应用余额抵扣（如果启用）
      if (use_balance && balanceAvailable > 0) {
        const deduction = Math.min(balanceAvailable, currentPrice);
        balanceDeduction = deduction;
        currentPrice -= deduction;
      }

      // 7. 应用优惠
      const appliedTypes = new Set<string>();
      for (const promo of promotionsToApply) {
        // 检查是否可叠加
        if (!promo.is_stackable && appliedTypes.size > 0) {
          continue;
        }

        // 同类型只能用一个（除非允许叠加）
        if (appliedTypes.has(promo.type) && !promo.is_stackable) {
          continue;
        }

        // 检查 stackable_with 限制
        if (promo.stackable_with) {
          const stackableTypes = promo.stackable_with.split(',').map((t: string) => t.trim());
          const canStack = [...appliedTypes].some((t: string) => stackableTypes.includes(t));
          if (appliedTypes.size > 0 && !canStack) {
            continue;
          }
        }

        let discountAmount = 0;
        let giftMonths = 0;

        // 阶梯优惠
        if (promo.type === 'tiered') {
          const tieredRules = promo.tiered_rules as TieredRule[] | null;
          if (tieredRules && tieredRules.length > 0) {
            // 找到匹配的阶梯规则（大于等于当前购买月数的最小规则）
            const sortedRules = [...tieredRules].sort((a, b) => a.months - b.months);
            let matchedRule: TieredRule | null = null;
            for (const rule of sortedRules) {
              if (billing_months >= rule.months) {
                matchedRule = rule;
              } else {
                break;
              }
            }
            if (matchedRule) {
              if (matchedRule.discount_value) {
                if (matchedRule.discount_value < 1) {
                  discountAmount = currentPrice * (1 - matchedRule.discount_value);
                } else {
                  discountAmount = Math.min(matchedRule.discount_value, currentPrice);
                }
              }
              giftMonths = matchedRule.gift_months ?? 0;
            }
          }
        }
        // 折扣、混合、优惠券
        else if (['discount', 'mixed', 'coupon'].includes(promo.type)) {
          if (promo.discount_value != null) {
            const discountValue = Number(promo.discount_value);
            if (discountValue < 1) {
              discountAmount = currentPrice * (1 - discountValue);
            } else {
              discountAmount = Math.min(discountValue, currentPrice);
            }
          }
          if (['mixed', 'gift'].includes(promo.type)) {
            giftMonths = promo.gift_months ?? 0;
          }
        }
        // 推荐奖励
        else if (promo.type === 'referral') {
          const referralConfig = promo.referral_config as ReferralConfig | null;
          if (referralConfig?.referee_reward) {
            const refereeReward = referralConfig.referee_reward;
            if (refereeReward.discount_value) {
              if (refereeReward.discount_value < 1) {
                discountAmount = currentPrice * (1 - refereeReward.discount_value);
              } else {
                discountAmount = Math.min(refereeReward.discount_value, currentPrice);
              }
            }
            giftMonths = refereeReward.gift_months ?? 0;
          }
        }

        if (discountAmount > 0 || giftMonths > 0) {
          currentPrice = Math.max(0, currentPrice - discountAmount);
          totalDiscount += discountAmount;
          totalGiftMonths += giftMonths;

          appliedPromotions.push({
            id: promo.id,
            code: promo.code,
            name: promo.name,
            type: promo.type,
            discount_amount: discountAmount,
            gift_months: giftMonths,
            balance_deduction: 0,
          });

          appliedTypes.add(promo.type);
        }
      }

      return {
        original_price: original_price,
        final_price: Math.max(0, currentPrice),
        total_discount: totalDiscount,
        total_gift_months: totalGiftMonths,
        balance_deduction: balanceDeduction,
        applied_promotions: appliedPromotions,
        available_promotions: availablePromotions,
        balance_available: balanceAvailable,
        coupon_valid: couponValid,
        coupon_message: couponMessage,
        referral_valid: referralValid,
        referral_message: referralMessage,
      };
    },

    applyPromotionsToOrder: async (order, appliedPromotions) => {
      const totalDiscount = appliedPromotions.reduce((sum, p) => sum + p.discount_amount, 0);
      const totalGiftMonths = appliedPromotions.reduce((sum, p) => sum + p.gift_months, 0);
      const balanceDeduction = appliedPromotions.reduce((sum, p) => sum + p.balance_deduction, 0);

      // 更新订单
      await prisma.subscriptionOrder.update({
        where: { id: order.id },
        data: {
          applied_promotions: JSON.parse(JSON.stringify(appliedPromotions)),
          total_discount: totalDiscount,
          total_gift_months: totalGiftMonths,
          balance_deduction: balanceDeduction,
        },
      });

      // 记录优惠券使用
      for (const promo of appliedPromotions) {
        if (promo.type === 'coupon') {
          // 创建使用记录
          await prisma.couponUsage.create({
            data: {
              id: ulid().toLowerCase(),
              promotion_id: promo.id,
              user_id: order.organization_id, // 简化处理，实际需要获取用户ID
              organization_id: order.organization_id,
              order_id: order.id,
              discount_amount: promo.discount_amount,
            },
          });

          // 更新使用次数
          await prisma.promotion.update({
            where: { id: promo.id },
            data: { coupon_uses_count: { increment: 1 } },
          });
        }
      }
    },

    getUserBalance: async (organizationId) => {
      const userBalance = await prisma.userBalance.findUnique({
        where: { organization_id: organizationId },
      });
      return userBalance ? Number(userBalance.balance) : 0;
    },

    useUserBalance: async (organizationId, amount, orderId) => {
      await prisma.$transaction(async (tx) => {
        // 获取当前余额
        const userBalance = await tx.userBalance.findUnique({
          where: { organization_id: organizationId },
        });

        if (!userBalance || Number(userBalance.balance) < amount) {
          throw createAppError(400, '余额不足');
        }

        // 扣减余额
        await tx.userBalance.update({
          where: { organization_id: organizationId },
          data: {
            balance: { decrement: amount },
            total_used: { increment: amount },
          },
        });

        // 创建赠送记录（作为使用记录）
        await tx.userGift.create({
          data: {
            id: ulid().toLowerCase(),
            user_id: organizationId, // 简化处理
            organization_id: organizationId,
            gift_type: 'balance',
            gift_value: -amount,
            gift_unit: 'cny',
            reason: `订单 ${orderId} 余额抵扣`,
            status: 'used',
            used_at: new Date(),
          },
        });
      });
    },
  };

  return service;
}

/**
 * 默认实例
 */
export const defaultPromotionEngineService = createPromotionEngineService();
