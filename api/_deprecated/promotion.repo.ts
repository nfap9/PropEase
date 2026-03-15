import type { Prisma, Promotion, PromotionPlan, PlanPricing } from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';
import { prisma } from '../lib/prisma.js';
import { ulid } from 'ulid';

/**
 * 优惠活动包含关联套餐
 */
export type PromotionWithPlans = Promotion & {
  plans: (PromotionPlan & { plan: { id: string; name: string; code: string } })[];
};

/**
 * Promotion Repository 接口
 */
export interface PromotionRepository {
  // 优惠活动 CRUD
  findAll(params?: { is_active?: boolean; plan_id?: string }): Promise<Promotion[]>;
  findById(id: string): Promise<PromotionWithPlans | null>;
  findByCode(code: string): Promise<Promotion | null>;
  create(data: Prisma.PromotionCreateInput): Promise<Promotion>;
  update(id: string, data: Prisma.PromotionUpdateInput): Promise<Promotion>;
  delete(id: string): Promise<void>;

  // 活动关联套餐
  addPlan(promotionId: string, planId: string): Promise<PromotionPlan>;
  removePlan(promotionId: string, planId: string): Promise<void>;

  // 查询可用活动
  findActiveForPlan(planId: string): Promise<Promotion | null>;

  // 周期定价
  findPricingByPlanId(planId: string): Promise<PlanPricing[]>;
  findPricingByPlanAndMonths(planId: string, months: number): Promise<PlanPricing | null>;
  createPricing(data: Prisma.PlanPricingCreateInput): Promise<PlanPricing>;
  updatePricing(id: string, data: Prisma.PlanPricingUpdateInput): Promise<PlanPricing>;
  deletePricing(id: string): Promise<void>;
  upsertPricing(
    planId: string,
    months: number,
    data: { price: number; is_active?: boolean; is_purchasable?: boolean; sort_order?: number }
  ): Promise<PlanPricing>;
}

/**
 * 创建 Promotion Repository 实例
 */
export function createPromotionRepository(db: DbClient): PromotionRepository {
  return {
    findAll: async (params?: { is_active?: boolean; plan_id?: string }) => {
      const where: Prisma.PromotionWhereInput = {};

      if (params?.is_active !== undefined) {
        where.is_active = params.is_active;
      }

      if (params?.plan_id) {
        where.plans = { some: { plan_id: params.plan_id } };
      }

      return db.promotion.findMany({
        where,
        orderBy: [{ is_active: 'desc' }, { created_at: 'desc' }],
      });
    },

    findById: async (id: string) => {
      return db.promotion.findUnique({
        where: { id },
        include: {
          plans: {
            include: {
              plan: {
                select: { id: true, name: true, code: true },
              },
            },
          },
        },
      }) as Promise<PromotionWithPlans | null>;
    },

    findByCode: async (code: string) => {
      return db.promotion.findUnique({ where: { code } });
    },

    create: async (data: Prisma.PromotionCreateInput) => {
      return db.promotion.create({ data });
    },

    update: async (id: string, data: Prisma.PromotionUpdateInput) => {
      return db.promotion.update({ where: { id }, data });
    },

    delete: async (id: string) => {
      await db.promotion.delete({ where: { id } });
    },

    addPlan: async (promotionId: string, planId: string) => {
      return db.promotionPlan.create({
        data: {
          id: ulid().toLowerCase(),
          promotion_id: promotionId,
          plan_id: planId,
        },
      });
    },

    removePlan: async (promotionId: string, planId: string) => {
      await db.promotionPlan.delete({
        where: {
          promotion_id_plan_id: {
            promotion_id: promotionId,
            plan_id: planId,
          },
        },
      });
    },

    findActiveForPlan: async (planId: string) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const promotions = await db.promotion.findFirst({
        where: {
          is_active: true,
          start_date: { lte: today },
          OR: [{ end_date: null }, { end_date: { gte: today } }],
          plans: { some: { plan_id: planId } },
        },
        orderBy: { created_at: 'desc' },
      });

      return promotions;
    },

    findPricingByPlanId: async (planId: string) => {
      return db.planPricing.findMany({
        where: { plan_id: planId },
        orderBy: [{ sort_order: 'asc' }, { months: 'asc' }],
      });
    },

    findPricingByPlanAndMonths: async (planId: string, months: number) => {
      return db.planPricing.findFirst({
        where: { plan_id: planId, months, is_active: true },
      });
    },

    createPricing: async (data: Prisma.PlanPricingCreateInput) => {
      return db.planPricing.create({ data });
    },

    updatePricing: async (id: string, data: Prisma.PlanPricingUpdateInput) => {
      return db.planPricing.update({ where: { id }, data });
    },

    deletePricing: async (id: string) => {
      await db.planPricing.delete({ where: { id } });
    },

    upsertPricing: async (
      planId: string,
      months: number,
      data: { price: number; is_active?: boolean; is_purchasable?: boolean; sort_order?: number }
    ) => {
      return db.planPricing.upsert({
        where: {
          plan_id_months: {
            plan_id: planId,
            months,
          },
        },
        create: {
          id: ulid().toLowerCase(),
          plan_id: planId,
          months,
          price: data.price,
          is_active: data.is_active ?? true,
          is_purchasable: data.is_purchasable ?? true,
          sort_order: data.sort_order ?? 0,
        },
        update: {
          price: data.price,
          is_active: data.is_active ?? true,
          is_purchasable: data.is_purchasable ?? true,
          sort_order: data.sort_order ?? 0,
        },
      });
    },
  };
}

/**
 * 计算优惠后的价格
 */
export function calculatePromotionPrice(
  originalPrice: number,
  promotion: Promotion | null
): { finalPrice: number; discountAmount: number; giftMonths: number } {
  if (!promotion) {
    return { finalPrice: originalPrice, discountAmount: 0, giftMonths: 0 };
  }

  let discountAmount = 0;
  let giftMonths = 0;

  if (promotion.type === 'discount' || promotion.type === 'mixed') {
    if (promotion.discount_value != null) {
      const discountValue = Number(promotion.discount_value);
      const discountType = promotion.discount_type;

      // 根据 discount_type 决定如何计算折扣
      if (discountType === 'percent') {
        // 百分比折扣：discount_value 表示折扣率（如 0.8 表示 8 折）
        discountAmount = originalPrice * (1 - discountValue);
      } else if (discountType === 'fixed') {
        // 固定金额减免：discount_value 表示减免金额
        discountAmount = Math.min(discountValue, originalPrice);
      } else {
        // 兼容旧数据：discount_value < 1 表示折扣率，>= 1 表示减免金额
        if (discountValue < 1) {
          discountAmount = originalPrice * (1 - discountValue);
        } else {
          discountAmount = Math.min(discountValue, originalPrice);
        }
      }
    }
  }

  if (promotion.type === 'gift' || promotion.type === 'mixed') {
    giftMonths = promotion.gift_months ?? 0;
  }

  const finalPrice = Math.max(0, originalPrice - discountAmount);

  return { finalPrice, discountAmount, giftMonths };
}

/**
 * 默认实例
 */
export const defaultPromotionRepo = createPromotionRepository(prisma);
