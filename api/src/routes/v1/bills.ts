import { Router, type Router as RouterType } from 'express';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import * as ctrl from './bills.controller.js';

const router: RouterType = Router();
router.use(requireConsoleAuth);

/**
 * @openapi
 * /bills/query:
 *   post:
 *     summary: 查询账单列表
 *     tags: [账单管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BillQuery'
 *     responses:
 *       200:
 *         description: 账单列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Bill'
 */
router.post('/query', ctrl.query);

/**
 * @openapi
 * /bills/generate:
 *   post:
 *     summary: 生成账单
 *     tags: [账单管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bill_year, bill_month, due_date]
 *             properties:
 *               bill_year:
 *                 type: integer
 *                 description: 账单年份
 *               bill_month:
 *                 type: integer
 *                 description: 账单月份
 *               due_date:
 *                 type: string
 *                 format: date
 *                 description: 到期日
 *               lease_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 指定租约ID列表（可选）
 *     responses:
 *       200:
 *         description: 生成结果
 */
router.post('/generate', ctrl.generate);

/**
 * @openapi
 * /bills:
 *   post:
 *     summary: 创建账单
 *     tags: [账单管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BillCreate'
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bill'
 */
router.post('/', ctrl.create);

/**
 * @openapi
 * /bills/export:
 *   post:
 *     summary: 导出账单Excel
 *     tags: [账单管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, paid, overdue, partial, cancelled, reversed]
 *               year:
 *                 type: integer
 *               month:
 *                 type: integer
 *               exportType:
 *                 type: string
 *                 enum: [all, unfinished]
 *     responses:
 *       200:
 *         description: Excel文件
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post('/export', ctrl.exportExcel);

/**
 * @openapi
 * /bills/{id}:
 *   get:
 *     summary: 获取账单详情
 *     tags: [账单管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 账单详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bill'
 */
router.get('/:id', ctrl.get);

/**
 * @openapi
 * /bills/{id}:
 *   put:
 *     summary: 更新账单
 *     tags: [账单管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BillUpdate'
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/:id', ctrl.update);

/**
 * @openapi
 * /bills/{id}:
 *   delete:
 *     summary: 删除账单
 *     tags: [账单管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: 删除成功
 */
router.delete('/:id', ctrl.del);

/**
 * @openapi
 * /bills/{id}/payments:
 *   get:
 *     summary: 获取账单付款记录
 *     tags: [账单管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 付款记录列表
 */
router.get('/:id/payments', ctrl.listPayments);

/**
 * @openapi
 * /bills/{id}/payments:
 *   post:
 *     summary: 添加付款记录
 *     tags: [账单管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BillPayment'
 *     responses:
 *       201:
 *         description: 添加成功
 */
router.post('/:id/payments', ctrl.addPayment);

/**
 * @openapi
 * /bills/{id}/fee-items:
 *   get:
 *     summary: 获取账单费用项
 *     tags: [账单管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 费用项列表
 */
router.get('/:id/fee-items', ctrl.listFeeItems);

/**
 * @openapi
 * /bills/{id}/pdf:
 *   get:
 *     summary: 导出账单PDF
 *     tags: [账单管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF文件
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id/pdf', ctrl.exportPdf);

export const billsRouter = router;
