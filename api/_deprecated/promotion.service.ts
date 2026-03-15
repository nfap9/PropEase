import type { Promotion, PlanPricing } from '@prisma/client';
import { ulid } from 'ulid';
import {
  createPromotionRepository,
  type PromotionRepository,
  type PromotionWithPlans,
  calculatePromotionPrice,
} from '../repositories/promotion.repo.js';
import { createAppError } from '../utils/appError.js';
import { NotFoundMessages } from '../messages.js';
import { prisma } from '../lib/prisma.js';

/**
 * 折扣类型
 */
export type DiscountType = 'percent' | 'fixed';

/**
 * 创建优惠活动参数
 */
export interface CreatePromotionParams {
  name: string;
  code: string;
  description?: string | null;
  type: 'discount' | 'gift' | 'mixed';
  discount_type?: DiscountType | null;
  discount_value?: number | null;
  gift_months?: number | null;
  start_date: Date;
  end_date?: Date | null;
  is_active?: boolean;
  plan_ids?: string[];
}

/**
 * 更新优惠活动参数
 */
export interface UpdatePromotionParams {
  name?: string;
  description?: string | null;
  type?: 'discount' | 'gift' | 'mixed';
  discount_type?: DiscountType | null;
  discount_value?: number | null;
  gift_months?: number | null;
  start_date?: Date;
  end_date?: Date | null;
  is_active?: boolean;
}

/**
 * 创建周期定价参数
 */
export interface CreatePlanPricingParams {
  months: number;
  price: number;
  is_active?: boolean;
  is_purchasable?: boolean;
  sort_order?: number;
}

/**
 * 优惠计算结果
 */
export interface PromotionCalculationResult {
  original_price: number;
  discount_amount: number;
  final_price: number;
  gift_months: number;
  promotion: Promotion | null;
}

/**
 * Promotion Service 接口
 */
export interface PromotionService {
  // 优惠活动 CRUD
  listPromotions(params?: { is_active?: boolean; plan_id?: string }): Promise<Promotion[]>;
  getPromotionById(id: string): Promise<PromotionWithPlans>;
  createPromotion(params: CreatePromotionParams): Promise<Promotion>;
  updatePromotion(id: string, params: UpdatePromotionParams): Promise<Promotion>;
  deletePromotion(id: string): Promise<void>;

  // 活动关联套餐
  addPlanToPromotion(promotionId: string, planId: string): Promise<void>;
  removePlanFromPromotion(promotionId: string, planId: string): Promise<void>;

  // 周期定价
  listPlanPricing(planId: string): Promise<PlanPricing[]>;
  upsertPlanPricing(
    planId: string,
    params: CreatePlanPricingParams
  ): Promise<PlanPricing>;
  batchUpsertPlanPricing(
    planId: string,
    pricingList: CreatePlanPricingParams[]
  ): Promise<PlanPricing[]>;
  deletePlanPricing(pricingId: string): Promise<void>;

  // 优惠计算
  getActivePromotionForPlan(planId: string): Promise<Promotion | null>;
  calculatePrice(
    planId: string,
    months: number,
    promotionId?: string
  ): Promise<PromotionCalculationResult>;
}

/**
 * 创建 Promotion Service 实例
 */
export function createPromotionService(
  getRepo: () => PromotionRepository = () => createPromotionRepository(prisma)
): PromotionService {
  return {
    listPromotions: async (params?: { is_active?: boolean; plan_id?: string }) => {
      return getRepo().findAll(params);
    },

    getPromotionById: async (id: string) => {
      const promotion = await getRepo().findById(id);
      if (!promotion) {
        throw createAppError(404, NotFoundMessages.PROMOTION);
      }
      return promotion;
    },

    createPromotion: async (params: CreatePromotionParams) => {
      // 检查 code 是否已存在
      const existing = await getRepo().findByCode(params.code);
      if (existing) {
        throw createAppError(400, '优惠活动代码已存在');
      }

      const promotion = await getRepo().create({
        id: ulid().toLowerCase(),
        name: params.name,
        code: params.code,
        description: params.description,
        type: params.type,
        discount_type: params.discount_type ?? null,
        discount_value: params.discount_value,
        gift_months: params.gift_months,
        start_date: params.start_date,
        end_date: params.end_date,
        is_active: params.is_active ?? true,
      });

      // 关联套餐
      if (params.plan_ids && params.plan_ids.length > 0) {
        for (const planId of params.plan_ids) {
          await getRepo().addPlan(promotion.id, planId);
        }
      }

      return promotion;
    },

    updatePromotion: async (id: string, params: UpdatePromotionParams) => {
      // 检查活动是否存在
      const existing = await getRepo().findById(id);
      if (!existing) {
        throw createAppError(404, NotFoundMessages.PROMOTION);
      }

      const updateData: Record<string, unknown> = {};
      if (params.name !== undefined) updateData.name = params.name;
      if (params.description !== undefined) updateData.description = params.description;
      if (params.type !== undefined) updateData.type = params.type;
      if (params.discount_type !== undefined) updateData.discount_type = params.discount_type;
      if (params.discount_value !== undefined) updateData.discount_value = params.discount_value;
      if (params.gift_months !== undefined) updateData.gift_months = params.gift_months;
      if (params.start_date !== undefined) updateData.start_date = params.start_date;
      if (params.end_date !== undefined) updateData.end_date = params.end_date;
      if (params.is_active !== undefined) updateData.is_active = params.is_active;

      return getRepo().update(id, updateData);
    },

    deletePromotion: async (id: string) => {
      const existing = await getRepo().findById(id);
      if (!existing) {
        throw createAppError(404, NotFoundMessages.PROMOTION);
      }
      await getRepo().delete(id);
    },

    addPlanToPromotion: async (promotionId: string, planId: string) => {
      // 检查活动是否存在
      const promotion = await getRepo().findById(promotionId);
      if (!promotion) {
        throw createAppError(404, NotFoundMessages.PROMOTION);
      }

      // 检查是否已关联
      const alreadyLinked = promotion.plans.some((p) => p.plan_id === planId);
      if (alreadyLinked) {
        throw createAppError(400, '该套餐已关联到此活动');
      }

      await getRepo().addPlan(promotionId, planId);
    },

    removePlanFromPromotion: async (promotionId: string, planId: string) => {
      await getRepo().removePlan(promotionId, planId);
    },

    listPlanPricing: async (planId: string) => {
      return getRepo().findPricingByPlanId(planId);
    },

    upsertPlanPricing: async (planId: string, params: CreatePlanPricingParams) => {
      return getRepo().upsertPricing(planId, params.months, {
        price: params.price,
        is_active: params.is_active,
        is_purchasable: params.is_purchasable,
        sort_order: params.sort_order,
      });
    },

    batchUpsertPlanPricing: async (
      planId: string,
      pricingList: CreatePlanPricingParams[]
    ) => {
      const results: PlanPricing[] = [];
      for (const pricing of pricingList) {
        const result = await getRepo().upsertPricing(planId, pricing.months, {
          price: pricing.price,
          is_active: pricing.is_active,
          is_purchasable: pricing.is_purchasable,
          sort_order: pricing.sort_order,
        });
        results.push(result);
      }
      return results;
    },

    deletePlanPricing: async (pricingId: string) => {
      await getRepo().deletePricing(pricingId);
    },

    getActivePromotionForPlan: async (planId: string) => {
      return getRepo().findActiveForPlan(planId);
    },

    calculatePrice: async (
      planId: string,
      months: number,
      promotionId?: string
    ): Promise<PromotionCalculationResult> => {
      // 查找周期定价
      const pricing = await getRepo().findPricingByPlanAndMonths(planId, months);

      let originalPrice: number;
      if (pricing) {
        originalPrice = Number(pricing.price);
      } else {
        // 如果没有找到对应周期的定价，使用月价 * 月数
        const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
        if (!plan) {
          throw createAppError(404, NotFoundMessages.PLAN);
        }
        originalPrice = Number(plan.price_monthly) * months;
      }

      // 获取优惠活动
      let promotion: Promotion | null = null;
      if (promotionId) {
        promotion = await prisma.promotion.findUnique({ where: { id: promotionId } });
      } else {
        promotion = await getRepo().findActiveForPlan(planId);
      }

      const { finalPrice, discountAmount, giftMonths } = calculatePromotionPrice(
        originalPrice,
        promotion
      );

      return {
        original_price: originalPrice,
        discount_amount: discountAmount,
        final_price: finalPrice,
        gift_months: giftMonths,
        promotion,
      };
    },
  };
}

/**
 * 默认实例
 */
export const defaultPromotionService = createPromotionService();
