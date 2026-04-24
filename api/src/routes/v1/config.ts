/**
 * 公开配置接口 - 无需认证，供前端获取品牌等配置
 */
import type { IRouter } from 'express';
import { Router, type Request, type Response, type NextFunction } from 'express';
import { getBrandConfig } from '../../services/platformConfig.js';

const router: IRouter = Router();

router.get('/public', async (_req: Request, res: Response, _next: NextFunction) => {
  
    const brand = await getBrandConfig();
    res.json({ brand });
  
});

export const configRouter = router;
