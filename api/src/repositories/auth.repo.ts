import type { User, Prisma } from '../generated/client/index.js';
import type { DbClient } from '../types/repository.types.js';
import { prisma } from '../lib/prisma.js';

/**
 * Auth Repository 接口
 */
export interface AuthRepository {
  findUserByPhone(phone: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(data: Prisma.UserCreateInput): Promise<User>;
}

/**
 * 创建 Auth Repository 实例
 */
export function createAuthRepository(db: DbClient): AuthRepository {
  return {
    findUserByPhone: async (phone: string) => {
      return db.user.findUnique({ where: { phone } });
    },

    findUserById: async (id: string) => {
      return db.user.findUnique({ where: { id } });
    },

    createUser: async (data: Prisma.UserCreateInput) => {
      return db.user.create({ data });
    },
  };
}

/**
 * 默认实例
 */
export const defaultAuthRepo = createAuthRepository(prisma);
