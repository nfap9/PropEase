import { Router, type Router as RouterType } from 'express';
import { billingOrdersRouter } from './orders.js';

export const billingRouter: RouterType = Router();

// 客户端路由（需要用户认证）
// 注意：admin 路由已在 admin/index.ts 中注册
billingRouter.use('/orders', billingOrdersRouter);
