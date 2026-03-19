import { Router } from 'express';
import { adminAuthRouter } from './auth.js';
import { adminInitRouter } from './init.js';
import { adminServiceProductsRouter } from './service-products.js';
import { adminStorefrontsRouter } from './storefronts.js';
import { requireAdmin } from '../../../middlewares/requireAdmin.js';
import { requireSystemInitialized } from '../../../middlewares/requireSystemInitialized.js';
import * as ctrl from './admin.controller.js';

const router: Router = Router();

// 初始化路由无需任何认证
router.use('/init', adminInitRouter);

// 认证路由需要系统已初始化
router.use('/auth', requireSystemInitialized, adminAuthRouter);

// 其他路由需要系统已初始化 + 管理员认证
router.use(requireSystemInitialized);
router.use(requireAdmin);

// 服务产品管理
router.use(adminServiceProductsRouter);
// 商店配置管理
router.use(adminStorefrontsRouter);

// --- users ---
router.get('/users/me', ctrl.getMe);
router.get('/users', ctrl.listUsers);
router.post('/users', ctrl.createUser);
router.get('/users/:user_id', ctrl.getUser);
router.put('/users/:user_id', ctrl.updateUser);
router.delete('/users/:user_id', ctrl.deleteUser);
router.post('/users/:user_id/reset-password', ctrl.resetPassword);

// --- roles ---
router.get('/roles', ctrl.listRoles);
router.get('/roles/:role_id', ctrl.getRole);
router.post('/roles', ctrl.createRole);
router.put('/roles/:role_id', ctrl.updateRole);
router.delete('/roles/:role_id', ctrl.deleteRole);

// --- organizations ---
router.get('/organizations', ctrl.listOrganizations);
router.get('/organizations/:org_id', ctrl.getOrganization);
router.patch('/organizations/:org_id/active', ctrl.setOrganizationActive);

// --- registered-users ---
router.get('/registered-users/count', ctrl.countRegisteredUsers);
router.get('/registered-users', ctrl.listRegisteredUsers);
router.get('/registered-users/:user_id', ctrl.getRegisteredUser);
router.patch('/registered-users/:user_id/active', ctrl.setRegisteredUserActive);
router.delete('/registered-users/:user_id', ctrl.deleteRegisteredUser);

// --- subscriptions ---
router.get('/subscriptions', ctrl.listSubscriptions);
router.get('/subscriptions/:subscription_id', ctrl.getSubscription);
router.post('/subscriptions/:subscription_id/renew', ctrl.renewSubscription);
router.post('/subscriptions/:subscription_id/cancel', ctrl.cancelSubscription);
router.post('/subscriptions/gift', ctrl.giftSubscription);

// --- stats & usage pricing ---
router.get('/stats', ctrl.getStats);
router.get('/usage-pricing', ctrl.getUsagePricing);
router.put('/usage-pricing', ctrl.updateUsagePricing);
router.get('/usage-orders', ctrl.listUsageOrders);

// --- platform config ---
router.get('/platform-config', ctrl.getPlatformConfig);
router.put('/platform-config', ctrl.updatePlatformConfig);

export const adminRouter = router;
