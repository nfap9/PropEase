/**
 * 共享 Zod schemas — 前后端统一校验
 *
 * @example
 * // 前端
 * import { TenantCreateSchema } from '@apartment-ultra/api-contract/schemas';
 * const form = useForm({ resolver: zodResolver(TenantCreateSchema) });
 *
 * // 后端
 * import { TenantCreateSchema } from '@apartment-ultra/api-contract/schemas';
 * const validated = TenantCreateSchema.parse(req.body);
 */

// Re-export all shared schemas
export * from './common.js';
export * from './tenants.js';
export * from './apartments.js';
export * from './rooms.js';
export * from './organizations.js';
